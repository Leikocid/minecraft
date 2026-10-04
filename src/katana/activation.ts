// Dragon Katana activation (L0-katn-p001 steps 1–3, 8–9): press → hand →
// snapshot → plan → teleport → cooldown. Where the jump lands is plan.ts; this
// file is the part that needs the engine. Every refusal before the teleport
// leaves nothing behind: no move, no timer, no chat line (L0-katn-r005).

import { type Dimension, type ItemStack, type Player, type Vector2, type Vector3, system, world } from "@minecraft/server";
import { startCooldown } from "../legendary/cooldown";
import { type HandSlot, resolveActivation } from "../legendary/hands";
import { DRAGON_KATANA, defForStack } from "../legendary/registry";
import { type TeleportPlan, planTeleport } from "./plan";

/** Everything read at the moment of use; nothing later follows the player (spec §5). */
interface Snapshot {
  player: Player;
  slot: HandSlot;
  dimension: Dimension;
  rotation: Vector2;
  plan: TeleportPlan;
  tick: number;
}

/** One activation that reached the plan. `jumped` false is a refusal: no safe cell, or the teleport threw. */
export interface Activation {
  readonly player: Player;
  readonly slot: HandSlot;
  readonly plan: TeleportPlan;
  readonly rotation: Vector2;
  readonly dimensionId: string;
  readonly tick: number;
  readonly jumped: boolean;
}

export type ActivationObserver = (activation: Activation) => void;

const observers = new Set<ActivationObserver>();

const log = (msg: string): void => console.warn(`[andrew] katana: ${msg}`);
const f2 = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;

/**
 * Calls `observer` with every activation that reached the plan, in its tick,
 * after the teleport and the cooldown of a jump. A press on cooldown never
 * reaches it. Returns the unsubscribe.
 */
export function observeActivations(observer: ActivationObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

/** Steps 2–7: hand, snapshot, plan. Reads only. */
function prepare(player: Player): Snapshot | undefined {
  const resolved = resolveActivation(player);
  if (resolved?.def !== DRAGON_KATANA) return undefined;
  const dimension = player.dimension;
  const origin = player.location;
  const head = player.getHeadLocation();
  const view = player.getViewDirection();
  const rotation = player.getRotation();
  const plan = planTeleport(dimension, origin, head, view);
  return { player, slot: resolved.slot, dimension, rotation, plan, tick: system.currentTick };
}

/** Steps 8–9. The cooldown is charged only for a teleport that returned. */
function commit(s: Snapshot): Activation {
  const { player, plan } = s;
  let jumped = false;
  if (plan.feet === undefined) {
    log(`${player.name} refused: no safe cell (trace stopped by ${plan.stoppedBy} at ${f2(plan.endpoint)})`);
  } else {
    try {
      // No `dimension` option: passing one breaks the legendary return path (L0-lgnd-r017 §3).
      player.teleport(plan.feet, { rotation: s.rotation });
      jumped = true;
    } catch (err) {
      log(`${player.name} refused: teleport to ${f2(plan.feet)} threw ${String(err)}`);
    }
  }
  if (jumped) {
    startCooldown(player, DRAGON_KATANA.abilityKey);
    log(`${player.name} jumped ${f2(plan.origin)} -> ${f2(plan.feet as Vector3)} (${s.slot}, trace stopped by ${plan.stoppedBy})`);
  }
  const activation: Activation = {
    player,
    slot: s.slot,
    plan,
    rotation: s.rotation,
    dimensionId: s.dimension.id,
    tick: s.tick,
    jumped,
  };
  for (const observer of observers) {
    try {
      observer(activation);
    } catch (err) {
      log(`activation observer threw ${String(err)}`);
    }
  }
  return activation;
}

/**
 * One activation attempt for `player`, whatever raised it. Undefined when the
 * press is not the Katana's: another legendary wins the hands, or the Katana
 * is on cooldown — a no-op the HUD already explains (L0-katn-r005).
 */
export function activate(player: Player): Activation | undefined {
  const snapshot = prepare(player);
  return snapshot === undefined ? undefined : commit(snapshot);
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

/**
 * A press with `stack` in the main hand. A non-legendary main hand never casts
 * the off hand (L0-lgnd-r004), and an empty one raises no press at all.
 */
function press(player: Player, stack: ItemStack | undefined): void {
  if (defForStack(stack) === undefined || !claimTick(player)) return;
  activate(player);
}

export function registerKatanaInput(): void {
  // A SimulatedPlayer reaches a pack without @minecraft/server-gametest as
  // undefined, so the handlers type the player as possibly undefined.
  world.afterEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined) press(player, event.itemStack);
  });

  // A use on a block raises neither itemUse nor after.playerInteractWithBlock
  // for a custom item — only itemStartUseOn (CNTR-XCX14). The block is the
  // trigger, never the aim: the jump follows the view (L0-katn-as02).
  world.afterEvents.itemStartUseOn.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined) press(player, event.itemStack);
  });
}
