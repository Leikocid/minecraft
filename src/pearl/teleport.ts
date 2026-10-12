// The bound use (spec v3 §7, bound state; L0-pear-pr03, L0-xasm42): the binder's next use of a bound Pearl Rod is
// cancelled and becomes a trip — preload the plate's columns through the world area budget, check the rod, the plate
// and a safe spot, teleport, read the arrival back. The decisions are in teleport-rules.ts; this module is the engine
// half — the use in, a teleport or a stated refusal out, and never a ticking area left behind.

import { type Container, type Dimension, type ItemStack, type Player, system, world } from "@minecraft/server";
import { type AreaBudget, type AreaLease, WORLD_AREA_CAP, worldAreas } from "./area-pool";
import { bindingOf, lifeEpochOf, plateGeneration } from "./bind";
import { BINDING_KEYS, type Binding, type Vec3, dimensionName } from "./bind-rules";
import { isPearlRodStack } from "./item";
import { MARK_KEY, ROD_ID, unboundLore } from "./item-rules";
import {
  ARRIVAL_SOUND,
  type CellRead,
  OUTCOMES,
  type Outcome,
  PRELOAD_TIMEOUT_TICKS,
  arrivalPoint,
  arrivalVerdict,
  destinationVerdict,
  dimensionVerdict,
  findSafeSpot,
  preloadBox,
  preloadCells,
  useVerdict,
  waitVerdict,
} from "./teleport-rules";

/** Counters a GameTest reads; `outcomes` counts every ended trip and every "already travelling" refusal. */
export const teleportStats = { uses: 0, starts: 0, outcomes: {} as Partial<Record<Outcome, number>>, areaAdds: 0, areaRemoves: 0, areaRemoveRefused: 0, errors: 0 };

/** The last outcome per player id, with the tick it was decided in: what a GameTest waits on. */
export const lastOutcome = new Map<string, { outcome: Outcome; tick: number; detail: string }>();

interface Area {
  dim: Dimension;
  name: string;
  lease: AreaLease;
}

interface Trip {
  player: Player;
  playerId: string;
  rodId: string;
  binding: Binding;
  /** The life epoch at the use; a different one later means the player died in between. */
  epoch: number;
  died: boolean;
  phase: "starting" | "loading";
  dest: Dimension | undefined;
  area: Area | undefined;
  usedAt: number;
  deadline: number;
}

/** One trip per player, by player id. Runtime only: a restart drops it, and the startup sweep drops its area. */
const trips = new Map<string, Trip>();

let areas: AreaBudget = worldAreas;
let areaPrefix = "andrew_pearl_";
/** Enough names for every slot of the world to be a trip at once. */
const NAME_COUNT = WORLD_AREA_CAP;
const namesInUse = new Set<string>();
/**
 * The tick each name was last removed in. A loaded area's name is refused when added again in the tick of its
 * removal, and accepted the next tick (probe Q5).
 */
const releasedAt = new Map<string, number>();

export function pendingTrips(): number {
  return trips.size;
}

/** Area names this module holds right now. */
export function heldAreaNames(): string[] {
  return [...namesInUse];
}

const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

function run(dim: Dimension, command: string): number {
  try {
    return dim.runCommand(command).successCount;
  } catch {
    return 0;
  }
}

const inventoryOf = (player: Player): Container | undefined => player.getComponent("minecraft:inventory")?.container;

interface RodSlot {
  container: Container;
  slot: number;
  stack: ItemStack;
}

/** The rod `rodId` anywhere in `player`'s inventory, the selected slot first. */
function findRod(player: Player, rodId: string): RodSlot | undefined {
  const container = inventoryOf(player);
  if (container === undefined) return undefined;
  const selected = player.selectedSlotIndex;
  const slots = [selected, ...Array.from({ length: container.size }, (_, i) => i).filter((i) => i !== selected)];
  for (const slot of slots) {
    const stack = container.getItem(slot);
    if (isPearlRodStack(stack) && stack?.getDynamicProperty(MARK_KEY) === rodId) return { container, slot, stack };
  }
  return undefined;
}

const sameBinding = (a: Binding | undefined, b: Binding): boolean =>
  a !== undefined && a.dim === b.dim && a.pos.x === b.pos.x && a.pos.y === b.pos.y && a.pos.z === b.pos.z && a.type === b.type && a.owner === b.owner && a.epoch === b.epoch && a.gen === b.gen;

function clearBinding(found: RodSlot): void {
  const { container, slot, stack } = found;
  for (const key of BINDING_KEYS) stack.setDynamicProperty(key, undefined);
  stack.setLore(unboundLore());
  container.setItem(slot, stack);
}

function readCell(dim: Dimension, at: Vec3): CellRead | undefined {
  // getBlock returns undefined for an unloaded cell and throws outside the dimension's height range.
  try {
    const block = dim.getBlock(at);
    if (block === undefined) return undefined;
    const snow = block.typeId === "minecraft:snow_layer" ? block.permutation.getState("height") : undefined;
    return { typeId: block.typeId, isAir: block.isAir, isLiquid: block.isLiquid, isWaterlogged: block.isWaterlogged, snowHeight: typeof snow === "number" ? snow : undefined };
  } catch {
    return undefined;
  }
}

function isLoaded(dim: Dimension, plate: Vec3): boolean {
  try {
    return preloadCells(plate).every((c) => dim.isChunkLoaded(c)) && dim.getBlock(plate) !== undefined;
  } catch {
    return false;
  }
}

function pickName(): string | undefined {
  for (let i = 0; i < NAME_COUNT; i++) {
    const name = `${areaPrefix}${i}`;
    if (!namesInUse.has(name) && releasedAt.get(name) !== system.currentTick) return name;
  }
  return undefined;
}

function releaseArea(trip: Trip): void {
  const area = trip.area;
  if (area === undefined) return;
  trip.area = undefined;
  teleportStats.areaRemoves++;
  if (run(area.dim, `tickingarea remove ${area.name}`) === 0) {
    teleportStats.areaRemoveRefused++;
    console.warn(`[andrew] pearl rod: tickingarea remove ${area.name} in ${dimensionName(area.dim.id)} was refused`);
  }
  area.lease.release();
  namesInUse.delete(area.name);
  releasedAt.set(area.name, system.currentTick);
}

function tell(player: Player, outcome: Outcome): void {
  const message = OUTCOMES[outcome].message;
  if (message !== undefined && player.isValid) player.onScreenDisplay.setActionBar({ translate: message });
}

function count(playerId: string, outcome: Outcome, detail: string): void {
  teleportStats.outcomes[outcome] = (teleportStats.outcomes[outcome] ?? 0) + 1;
  lastOutcome.set(playerId, { outcome, tick: system.currentTick, detail });
}

/** Every trip ends here, whatever the outcome: the area is removed before anything else can fail. */
function end(trip: Trip, outcome: Outcome, detail = ""): void {
  trips.delete(trip.playerId);
  releaseArea(trip);
  const online = trip.player.isValid;
  if (OUTCOMES[outcome].binding === "clear" && online) {
    const found = findRod(trip.player, trip.rodId);
    if (found !== undefined && sameBinding(bindingOf(found.stack), trip.binding)) clearBinding(found);
  }
  if (online) tell(trip.player, outcome);
  count(trip.playerId, outcome, detail);
  const b = trip.binding;
  console.warn(
    `[andrew] pearl rod trip: ${online ? trip.player.name : trip.playerId} ${outcome} -> ${dimensionName(b.dim)} ${b.pos.x} ${b.pos.y} ${b.pos.z} ` +
      `after ${system.currentTick - trip.usedAt} ticks${detail === "" ? "" : ` (${detail})`}`
  );
}

/**
 * No death since the use. In the tick of a death the interval already reads health 0 while entityDie, and the epoch bump
 * it carries, arrive only after it; a missing health component counts as alive.
 */
function isAlive(trip: Trip): boolean {
  return deathOf(trip) === undefined;
}

function deathOf(trip: Trip): string | undefined {
  if (trip.died) return "entityDie";
  if (lifeEpochOf(trip.player) !== trip.epoch) return "life epoch moved";
  return (trip.player.getComponent("minecraft:health")?.currentValue ?? 1) > 0 ? undefined : "health 0";
}

/** The tick after the use: the dimension, a slot from the world budget, and the preload area. */
function start(trip: Trip): void {
  if (!trip.player.isValid) return end(trip, "offline");
  if (!isAlive(trip)) return end(trip, "died", deathOf(trip));
  teleportStats.starts++;
  const { binding } = trip;
  let dest: Dimension | undefined;
  try {
    dest = world.getDimension(binding.dim);
  } catch {
    dest = undefined;
  }
  if (dest === undefined || dimensionVerdict(trip.player.dimension.id, binding.dim, true) !== "go") {
    return end(trip, "dimension-refused", dest === undefined ? `no dimension ${binding.dim}` : "cross-dimension travel is off");
  }
  const lease = areas.tryAcquire("pearl");
  if (lease === undefined) return end(trip, "busy", `the world budget is full: ${areas.held("structure")} structure + ${areas.held("pearl")} pearl of ${areas.capacity}`);
  const name = pickName();
  if (name === undefined) {
    lease.release();
    return end(trip, "busy", "no area name is free this tick");
  }
  const { min, max } = preloadBox(binding.pos);
  teleportStats.areaAdds++;
  if (run(dest, `tickingarea add ${min[0]} 0 ${min[1]} ${max[0]} 0 ${max[1]} ${name}`) === 0) {
    lease.release();
    return end(trip, "busy", `the engine refused tickingarea ${name}`);
  }
  namesInUse.add(name);
  trip.area = { dim: dest, name, lease };
  trip.dest = dest;
  trip.phase = "loading";
  trip.deadline = system.currentTick + PRELOAD_TIMEOUT_TICKS;
}

function dismount(player: Player): void {
  const mount = player.getComponent("minecraft:riding")?.entityRidingOn;
  if (mount?.isValid === true) mount.getComponent("minecraft:rideable")?.ejectRider(player);
}

/** The destination is loaded: check it, then move the player and read the arrival back in the same tick. */
function arrive(trip: Trip, dest: Dimension): void {
  const { player, binding } = trip;
  const found = findRod(player, trip.rodId);
  const read = (at: Vec3): CellRead | undefined => readCell(dest, at);
  const cellType = read(binding.pos)?.typeId;
  const spot = findSafeSpot(binding.pos, read, dest.heightRange);
  const verdict = destinationVerdict(binding, {
    rodFound: found !== undefined && sameBinding(bindingOf(found.stack), binding),
    cellType,
    gen: plateGeneration(binding.dim, binding.pos),
    spot,
  });
  if (verdict !== "teleport" || spot === undefined) return end(trip, verdict === "teleport" ? "unsafe" : verdict, verdict === "plate-gone" ? `the cell reads ${cellType ?? "nothing"}` : "");
  dismount(player);
  const want = arrivalPoint(spot);
  try {
    player.teleport(want, { dimension: dest });
  } catch (err) {
    return end(trip, "failed", `teleport threw ${err instanceof Error ? err.message : String(err)}`);
  }
  // A read-back alone is no proof of a safe arrival (probe Q6: it reads "arrived" over an unloaded chunk too); the
  // preload and the spot check above are, and this only catches the engine not moving the player at all.
  const result = arrivalVerdict(want, dest.id, player.dimension.id, player.location);
  if (result === "arrived") dest.playSound(ARRIVAL_SOUND, want);
  const off = Math.hypot(player.location.x - want.x, player.location.y - want.y, player.location.z - want.z);
  end(trip, result, `spot ${spot.x} ${spot.y} ${spot.z}, read back ${dimensionName(player.dimension.id)} off ${off.toFixed(3)}`);
}

function check(trip: Trip): void {
  const online = trip.player.isValid;
  const alive = online && isAlive(trip);
  const dest = trip.dest;
  if (dest === undefined) return end(trip, "failed", "loading without a destination");
  const verdict = waitVerdict({ online, alive, loaded: alive && isLoaded(dest, trip.binding.pos), tick: system.currentTick, deadline: trip.deadline });
  if (verdict === "wait") return;
  if (verdict === "validate") return arrive(trip, dest);
  const detail = verdict === "not-loaded" ? `not loaded after ${PRELOAD_TIMEOUT_TICKS} ticks` : verdict === "died" ? deathOf(trip) : "";
  end(trip, verdict, detail);
}

function guarded(trip: Trip, step: (t: Trip) => void): void {
  try {
    step(trip);
  } catch (err) {
    teleportStats.errors++;
    const why = err instanceof Error ? err.message : String(err);
    if (trips.get(trip.playerId) === trip) end(trip, "failed", `threw ${why}`);
    else console.warn(`[andrew] pearl rod: the trip threw after it ended: ${why}`);
  }
}

function checkAll(): void {
  if (trips.size === 0) return;
  for (const trip of [...trips.values()]) if (trip.phase === "loading") guarded(trip, check);
}

/** A crash or a restart mid-trip leaves its area behind; every name of this pack is removed once at startup. */
function sweep(): void {
  for (const id of DIMENSIONS) {
    let dim: Dimension;
    try {
      dim = world.getDimension(id);
    } catch {
      continue;
    }
    for (let i = 0; i < NAME_COUNT; i++) run(dim, `tickingarea remove ${areaPrefix}${i}`);
  }
}

export interface TeleportOptions {
  /** The budget every area comes from; the release pack's one is `worldAreas`. */
  areas?: AreaBudget;
  /** Area names are `${areaPrefix}<n>`: two script packs need two prefixes, or each removes the other's areas. */
  areaPrefix?: string;
}

let armed = false;

/** Arms the module once per script pack; a second call changes nothing, so two trips can never start for one use. */
export function registerPearlTeleport(options: TeleportOptions = {}): void {
  if (armed) return;
  armed = true;
  areas = options.areas ?? worldAreas;
  areaPrefix = options.areaPrefix ?? areaPrefix;

  world.beforeEvents.itemUse.subscribe((event) => {
    // Typed non-nullable; undefined for a SimulatedPlayer in a pack without @minecraft/server-gametest.
    const player: Player | undefined = event.source;
    const stack = event.itemStack;
    if (player === undefined || stack.typeId !== ROD_ID || !isPearlRodStack(stack)) return;
    const binding = bindingOf(stack);
    const epoch = lifeEpochOf(player);
    const verdict = useVerdict(binding, { id: player.id, epoch }, trips.has(player.id));
    if (verdict === "vanilla" || binding === undefined) return;
    // A cancelled use throws no hook and raises no after-event (probe Q4).
    event.cancel = true;
    teleportStats.uses++;
    // Before-events run in read-only mode: everything that writes waits for the next tick.
    if (verdict === "travelling") {
      system.run(() => {
        tell(player, "travelling");
        count(player.id, "travelling", "");
      });
      return;
    }
    const trip: Trip = {
      player,
      playerId: player.id,
      rodId: String(stack.getDynamicProperty(MARK_KEY)),
      binding,
      epoch,
      died: false,
      phase: "starting",
      dest: undefined,
      area: undefined,
      usedAt: system.currentTick,
      deadline: Number.POSITIVE_INFINITY,
    };
    // Held from this tick, so a second use in the same tick is "already travelling", not a second trip.
    trips.set(player.id, trip);
    system.run(() => guarded(trip, start));
  });

  world.afterEvents.entityDie.subscribe(
    (event) => {
      let id: string | undefined;
      try {
        id = event.deadEntity?.id;
      } catch {
        id = undefined;
      }
      const trip = id === undefined ? undefined : trips.get(id);
      if (trip === undefined) return;
      trip.died = true;
      if (trip.phase === "loading") guarded(trip, (t) => end(t, "died", "entityDie"));
    },
    { entityTypes: ["minecraft:player"] }
  );

  system.run(sweep);
  system.runInterval(checkAll, 1);
  console.warn("[andrew] pearl rod teleport armed");
}
