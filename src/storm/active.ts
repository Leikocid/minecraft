// Storm Blade active (spec §02; L0-strm-pact, L0-strm-rcd, L0-xasm31): press → hand → validity → line → one target →
// 10 HP before armour through the damage helper → cooldown → the line and three strikes. Steps up to the cooldown run
// in the press tick; only the drawing is deferred, onto visuals.ts's interval. Deviations: README.md (C-16).

import { type Entity, EntityComponentTypes, GameMode, type ItemStack, Player, type Vector3, system, world } from "@minecraft/server";
import { startCooldown } from "../legendary/cooldown";
import { type HandSlot, resolveActivation } from "../legendary/hands";
import { type ActiveLegendaryDef, STORM_BLADE, defForStack } from "../legendary/registry";
import { ACTIVE_DAMAGE, type StrikeReport, registerStormDamage, stormDamage } from "./damage";
import { type StormLine, pick, planLine } from "./trace";
import { ACTIVE_STRIKE_DELAYS, drawLine, playStrikes } from "./visuals";

/** Why a press the blade owned released nothing. Nothing is written for any of them: no cooldown, no damage, no line. */
export type Refusal = "dead" | "spectator" | "unloaded" | "no-line";

/** One press the blade owned: a release, or a refusal. A press on cooldown is not the blade's and makes none. */
export interface StormActivation {
  readonly player: Player;
  readonly slot: HandSlot;
  readonly tick: number;
  readonly dimensionId: string;
  readonly released: boolean;
  readonly refused: Refusal | undefined;
  readonly line: StormLine | undefined;
  readonly target: Entity | undefined;
  readonly targetId: string | undefined;
  readonly targetType: string | undefined;
  /** From the eye to the target's box. */
  readonly hitDistance: number | undefined;
  /** Where the drawn line ends: the target's hit point, otherwise the stop. */
  readonly end: Vector3 | undefined;
  /** The helper's own report of the 10 HP. */
  readonly strike: StrikeReport | undefined;
}

export type ActivationObserver = (activation: StormActivation) => void;

const observers = new Set<ActivationObserver>();

const log = (msg: string): void => console.warn(`[andrew] storm: ${msg}`);
const f2 = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Calls `observer` with every press the blade owned, in its tick, after the cooldown. Returns the unsubscribe. */
export function observeReleases(observer: ActivationObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

function emit(activation: StormActivation): StormActivation {
  for (const observer of observers) {
    try {
      observer(activation);
    } catch (err) {
      log(`release observer threw ${errText(err)}`);
    }
  }
  return activation;
}

/** A target: alive, not the wielder, not a Creative or Spectator player, not `inanimate` (an armour stand has health, probe-storm P5 F). */
function living(entity: Entity, wielderId: string): boolean {
  try {
    if (!entity.isValid || entity.id === wielderId) return false;
    if (entity instanceof Player) {
      const mode = entity.getGameMode();
      if (mode === GameMode.Creative || mode === GameMode.Spectator) return false;
    }
    const health = entity.getComponent(EntityComponentTypes.Health);
    if (health === undefined || health.currentValue <= 0) return false;
    return entity.getComponent(EntityComponentTypes.TypeFamily)?.hasTypeFamily("inanimate") !== true;
  } catch {
    return false;
  }
}

function aliveWielder(player: Player): boolean {
  const health = player.getComponent(EntityComponentTypes.Health);
  return health !== undefined && health.currentValue > 0;
}

function loaded(player: Player, at: Vector3): boolean {
  try {
    return player.dimension.isChunkLoaded(at);
  } catch {
    return false;
  }
}

/** Where the strikes land: the target's feet, read before the hit can kill or move it. */
function footOf(entity: Entity, fallback: Vector3): Vector3 {
  try {
    return { ...entity.location };
  } catch {
    return fallback;
  }
}

/** Which legendary each player's press resolved to, read in the before-event: before any after-handler starts a cooldown. */
interface Pressed {
  tick: number;
  def: ActiveLegendaryDef | undefined;
}

const pressed = new Map<string, Pressed>();
/** A press's after-event arrives in its tick or the next; an older reading belongs to another press. */
const PRESS_FRESH_TICKS = 1;

function notePress(player: Player | undefined, stack: ItemStack | undefined): void {
  if (player === undefined || defForStack(stack) === undefined) return;
  const tick = system.currentTick;
  try {
    const id = player.id;
    if (pressed.get(id)?.tick === tick) return;
    pressed.set(id, { tick, def: resolveActivation(player)?.def });
  } catch (err) {
    log(`press reading refused: ${errText(err)}`);
  }
}

function takePress(player: Player): Pressed | undefined {
  const seen = pressed.get(player.id);
  pressed.delete(player.id);
  return seen !== undefined && system.currentTick - seen.tick <= PRESS_FRESH_TICKS ? seen : undefined;
}

function refuse(base: Omit<StormActivation, "released" | "refused">, why: Refusal): StormActivation {
  log(`${base.player.name} refused: ${why}`);
  return emit({ ...base, released: false, refused: why });
}

/**
 * One press for `player`, whatever raised it. Undefined when the press is not the blade's: another legendary wins the
 * hands — at the press, not after another module already spent its cooldown — or the blade is on cooldown, a no-op
 * the HUD already explains (L0-strm-rcd §2).
 */
export function activate(player: Player): StormActivation | undefined {
  const atPress = takePress(player);
  const resolved = resolveActivation(player);
  if (resolved?.def !== STORM_BLADE) return undefined;
  if (atPress !== undefined && atPress.def !== STORM_BLADE) {
    log(`${player.name}: the press belonged to ${atPress.def?.itemId ?? "no ready legendary"}, not the off-hand blade`);
    return undefined;
  }
  const dimension = player.dimension;
  const base = {
    player,
    slot: resolved.slot,
    tick: system.currentTick,
    dimensionId: dimension.id,
    line: undefined,
    target: undefined,
    targetId: undefined,
    targetType: undefined,
    hitDistance: undefined,
    end: undefined,
    strike: undefined,
  };
  if (!aliveWielder(player)) return refuse(base, "dead");
  if (player.getGameMode() === GameMode.Spectator) return refuse(base, "spectator");
  const head = player.getHeadLocation();
  if (!loaded(player, head)) return refuse(base, "unloaded");
  const line = planLine(dimension, head, player.getViewDirection());
  if (line === undefined) return refuse(base, "no-line");

  const hit = pick(dimension, line, (entity: Entity) => living(entity, player.id));
  let strike: StrikeReport | undefined;
  let foot: Vector3 | undefined;
  let targetId: string | undefined;
  let targetType: string | undefined;
  if (hit !== undefined) {
    foot = footOf(hit.entity, hit.point);
    targetId = hit.entity.id;
    targetType = hit.entity.typeId;
    strike = stormDamage(hit.entity, ACTIVE_DAMAGE, player);
  }
  // A miss, a wall at half a block and an empty 10 blocks are all valid releases (L0-strm-rcd §1).
  startCooldown(player, STORM_BLADE.abilityKey);

  const end = hit?.point ?? line.stop;
  drawLine(dimension, head, end);
  if (hit !== undefined && foot !== undefined) playStrikes(dimension, foot, hit.point, ACTIVE_STRIKE_DELAYS);
  log(
    `${player.name} released (${resolved.slot}) line ${line.length.toFixed(2)} stopped by ${line.stoppedBy} at ${f2(line.stop)}` +
      (hit === undefined ? ", no target" : `, hit ${targetType} ${targetId} at ${hit.distance.toFixed(2)}`)
  );
  return emit({
    ...base,
    released: true,
    refused: undefined,
    line,
    target: hit?.entity,
    targetId,
    targetType,
    hitDistance: hit?.distance,
    end,
    strike,
  });
}

const handledTick = new Map<string, number>();
let handledAt = -1;

/** One press can raise two events in a tick; the second finds the tick claimed (src/websword/trap.ts). */
function claimTick(player: Player): boolean {
  const tick = system.currentTick;
  if (tick !== handledAt) {
    handledTick.clear();
    handledAt = tick;
  }
  if (handledTick.has(player.id)) return false;
  handledTick.set(player.id, tick);
  return true;
}

/** A press with `stack` in the main hand. A non-legendary main hand never casts the off hand (L0-lgnd-r004). */
function press(player: Player, stack: ItemStack | undefined): void {
  if (defForStack(stack) === undefined || !claimTick(player)) return;
  activate(player);
}

let registered = false;

/**
 * Arms the blade's input and the damage helper's landed-hit record. Must be registered after every other legendary's
 * input: their after-handlers read the hands live, so one that runs after a blade release would see the blade on
 * cooldown and fire its off hand on the same press.
 */
export function registerStormActive(): void {
  if (registered) return;
  registered = true;
  registerStormDamage();
  // A SimulatedPlayer reaches a pack without @minecraft/server-gametest as undefined.
  world.beforeEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    notePress(player, event.itemStack);
  });
  // A use on a block raises only this before-event and itemStartUseOn for a custom item (CNTR-XCX14).
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const player: Player | undefined = event.player;
    notePress(player, event.itemStack);
  });
  world.afterEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined) press(player, event.itemStack);
  });
  world.afterEvents.itemStartUseOn.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined) press(player, event.itemStack);
  });
  console.warn("[andrew] storm blade armed (itemUse + itemStartUseOn)");
}
