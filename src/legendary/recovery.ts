// Loss return for every legendary item (Scythe spec §1, applied to all
// legendaries by decision-legendary-rules-obschie-dlya-vseh-legendarnyh).
//
// Orbital §5 wants a legendary to never be destroyed. Fire and lava are met
// literally: both item JSONs carry minecraft:fire_resistant (format >=
// 1.21.90), which keeps the item entity alive in both (measured,
// CNTR-XCX10-AA F1) — this module never sees that entity vanish, so no return
// fires. The stable API still has no component for cactus, an explosion or
// despawn, so for those three the fallback stays "destroyed means returned"
// (deviation, C-16): a marked instance lying on the ground is watched, and
// when it vanishes without having reached an inventory, its owner (the mark's
// `owner`) gets it back, at once when online and alive, otherwise from the
// owed list on their next spawn.
// The Void is not a deviation — §5 itself prescribes returning a legendary
// that falls in, and that path also runs through this module. The craft right
// is never reopened (Q-014).
//
// The returned copy keeps the instance id and carries the next generation
// (L0-lgnd-ad02). A pickup misread as a loss therefore leaves a stale copy,
// never a second live one: a stale stack cannot cast, is not retained on death,
// is removed on sight as an item entity, and is deleted from any player
// inventory it enters (R-lgnd-005). The stable API reports no reason for an
// entity's removal (C-16), so the classification below stays a heuristic and
// the generation is what keeps its mistakes harmless.
//
// Watching is event-driven, never a world scan: entitySpawn/entityLoad add an
// entity, and a 2 s interval, alive only while something is watched, checks
// just those entities. [src: webswordspecv1ruen §11]
//
// Telling a loss from a pickup: a pickup also invalidates the entity. It is a
// pickup when the instance id surfaced in a player inventory
// (playerInventoryItemChange) since the entity was watched, is in an online
// player's inventory now, lies on the ground as another watched entity, or sits
// in a container right at the spot (a hopper). Only then is nothing owed.
//
// Deviations of the destruction policy (C-16) added by L0-adr-oprt / L0-adr-oded:
// - Item frames have no script inventory. protectLegendariesIn breaks every
//   frame in its volume with `setblock … air destroy`, whatever the frame
//   holds; the engine spills the frame and its item as item entities in the
//   same tick with the mark intact (probe L0-xasm11 P1, BDS 1.26.51.1), and the
//   ground sweep then moves a spilled legendary like any other.
// - A weapon's own HUD wording is `LegendaryDef.hudKeys`, not a lookup of
//   "the weapon's key, else the shared one" (L0-adr-oded §1): `translate`
//   resolves on the client, so the script cannot tell whether a key exists.

import {
  BlockTypes,
  BlockVolume,
  EntitySwingSource,
  type Container,
  type Dimension,
  type Entity,
  type ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LEGENDARIES, type LegendaryDef, defForStack } from "./registry";
import { grant } from "./retention";
import { bumpGen, carriesInstance, getMark, isItemOf, isLive, offhandOf, readOwed, writeOwed } from "./state";
import { type Mark, withOwed, withoutOwed } from "./rules";

const CHECK_INTERVAL_TICKS = 40;

const RECOVERED_KEY = "andrew.legendary.recovered";

const VOIDED_KEY = "andrew.legendary.voided";

interface Watched {
  entity: Entity;
  def: LegendaryDef;
  mark: Mark;
  dimension: Dimension;
  location: Vector3;
}

const watched = new Map<string, Watched>();

/** Instance ids that entered a player inventory since they were last watched. */
const seenInInventory = new Set<string>();

/**
 * Item entities protectLegendariesIn removed before their entitySpawn arrived
 * (a frame spilled them this tick); the late event must not start watching one.
 */
const removedByProtect = new Set<string>();

/**
 * An instance that left a player's slot and has not been accounted for yet. An
 * item entity destroyed in the same tick it appears is never watched at all —
 * entitySpawn arrives after the removal and watch() cannot read an invalid
 * entity (measured: legendary_pickup_sighting_not_consumed) — so the departure
 * is what this module tracks, not only the entity.
 */
interface InFlight {
  def: LegendaryDef;
  mark: Mark;
  dimension: Dimension;
  /** Where the player stood: the drop point, and where a container that took it stands. */
  location: Vector3;
  playerId: string;
  tick: number;
}

const inFlight = new Map<string, InFlight>();

/**
 * Last tick each player swung to throw something away. A slot losing an
 * instance is not enough to call it dropped: moving it into a shulker item or an
 * ender chest looks the same from the inventory, and neither is readable from a
 * script, so a return invented for one of those would quietly unstore it. Only a
 * departure the player swung for is a drop.
 */
const lastDropSwing = new Map<string, number>();

/** How far a drop swing may sit from the departure it belongs to. */
const DROP_SWING_WINDOW_TICKS = 2;

/** Ticks before a departure is resolved: entitySpawn and an instant re-pickup both land well inside it. */
const IN_FLIGHT_GRACE_TICKS = 10;

/** How far around the drop point a container could have taken the instance. */
const IN_FLIGHT_SEARCH_HALF = 6;

let intervalId: number | undefined;

/** Stops watching an entity this module must not treat as lost (retention path B). */
export function forgetWatched(entityId: string): void {
  watched.delete(entityId);
  stopIfIdle();
}

export function registerRecovery(): void {
  world.afterEvents.entitySpawn.subscribe((event) => {
    watch(event.entity, "entitySpawn");
  });
  // Items in a chunk that unloaded are dropped from the watch set, and a
  // restart empties it; either way they come back through entityLoad.
  world.afterEvents.entityLoad.subscribe((event) => {
    watch(event.entity, "entityLoad");
  });

  world.afterEvents.playerSwingStart.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player !== undefined && event.swingSource === EntitySwingSource.DropItem) {
      lastDropSwing.set(player.id, system.currentTick);
    }
  });

  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const player: Player | undefined = event.player;
    // Delivered after a removal in the same tick, the player is invalid and every call on it throws.
    if (player === undefined || !player.isValid) {
      return;
    }
    const container = player.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      return;
    }
    const now = container.getItem(event.slot);
    noteDeparture(player, container, event.beforeItemStack, now);
    noteArrival(player, container, event.slot, event.itemStack, now);
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player === undefined) {
      return;
    }
    system.run(() => {
      for (const def of LEGENDARIES) {
        redeemOwed(def, player);
      }
    });
  });

  console.warn("[andrew] legendary loss recovery armed");
}

/** An instance the slot no longer holds: tracked until check() finds where it went. */
function noteDeparture(player: Player, container: Container, before: ItemStack | undefined, now: ItemStack | undefined): void {
  const def = defForStack(before);
  if (def === undefined || before === undefined) {
    return;
  }
  const mark = getMark(def, before);
  if (mark === undefined || !isLive(def, mark)) {
    return;
  }
  const still = isItemOf(def, now) ? getMark(def, now) : undefined;
  if (still?.id === mark.id || carriesInstance(def, player, container, mark)) {
    // The slot still holds it, or it only moved to another slot or the off hand.
    return;
  }
  const at = player.location;
  inFlight.set(mark.id, {
    def,
    mark,
    dimension: player.dimension,
    location: { x: Math.floor(at.x), y: Math.floor(at.y), z: Math.floor(at.z) },
    playerId: player.id,
    tick: system.currentTick,
  });
  startChecking();
}

/** An instance the slot holds now: the sighting that tells a pickup from a loss. */
function noteArrival(player: Player, container: Container, slot: number, stack: ItemStack | undefined, now: ItemStack | undefined): void {
  const def = defForStack(stack);
  if (def === undefined || stack === undefined) {
    return;
  }
  const mark = getMark(def, stack);
  if (mark === undefined) {
    return;
  }
  // The event also fires for the drop that created the entity, still naming the
  // stack; only a slot that holds the instance now counts.
  const there = isItemOf(def, now) ? getMark(def, now) : undefined;
  if (there === undefined || there.id !== mark.id) {
    return;
  }
  if (!isLive(def, there)) {
    voidStaleSlot(def, player, container, slot, there);
    return;
  }
  inFlight.delete(mark.id);
  if ([...watched.values()].some((w) => w.mark.id === mark.id)) {
    seenInInventory.add(mark.id);
  }
}

function startChecking(): void {
  if (intervalId === undefined) {
    intervalId = system.runInterval(check, CHECK_INTERVAL_TICKS);
  }
}

function watch(entity: Entity, via: string): void {
  // Checked before isValid, which can still read true a tick after remove().
  if (removedByProtect.delete(entity.id)) {
    return;
  }
  if (entity.typeId !== "minecraft:item" || !entity.isValid) {
    return;
  }
  const stack = entity.getComponent("minecraft:item")?.itemStack;
  const def = defForStack(stack);
  if (def === undefined || stack === undefined) {
    return;
  }
  const mark = getMark(def, stack);
  if (mark === undefined) {
    // Unmarked Creative copies keep vanilla destruction.
    return;
  }
  if (!isLive(def, mark)) {
    entity.remove();
    console.warn(`[andrew] legendary recovery: removed a stale ${def.itemId} id ${mark.id} gen ${mark.gen} (via ${via})`);
    return;
  }
  watched.set(entity.id, { entity, def, mark, dimension: entity.dimension, location: entity.location });
  seenInInventory.delete(mark.id);
  inFlight.delete(mark.id);
  console.warn(`[andrew] legendary recovery: watching ${def.itemId} id ${mark.id} on the ground (via ${via})`);
  startChecking();
}

function stopIfIdle(): void {
  if (watched.size === 0 && inFlight.size === 0 && intervalId !== undefined) {
    system.clearRun(intervalId);
    intervalId = undefined;
  }
}

function check(): void {
  for (const [entityId, w] of [...watched]) {
    const location = liveLocation(w.entity);
    if (location !== undefined) {
      if (location.y >= w.dimension.heightRange.min) {
        w.location = location;
        continue;
      }
      // Below the floor the engine kills it on its own schedule; taking it
      // now makes the Void a loss we control rather than one we infer.
      watched.delete(entityId);
      w.entity.remove();
      lost(w, "fell into the Void");
      continue;
    }

    watched.delete(entityId);
    if (!w.dimension.isChunkLoaded(w.location)) {
      // Unloaded with its chunk, not destroyed: entityLoad re-watches it.
      console.warn(`[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} unloaded with its chunk`);
      continue;
    }
    const holder = whereIs(w);
    if (holder !== undefined) {
      console.warn(`[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} picked up — ${holder}`);
      continue;
    }
    lost(w, "vanished from the ground");
  }
  for (const [id, f] of [...inFlight]) {
    if (system.currentTick - f.tick < IN_FLIGHT_GRACE_TICKS) {
      continue;
    }
    inFlight.delete(id);
    if (!isLive(f.def, f.mark)) {
      continue;
    }
    const swung = lastDropSwing.get(f.playerId);
    if (swung === undefined || Math.abs(swung - f.tick) > DROP_SWING_WINDOW_TICKS) {
      // Not thrown away: moved into storage this script cannot read, or wiped by
      // a command. Either way, not a loss to invent a return for.
      continue;
    }
    const where = whereIs(f, IN_FLIGHT_SEARCH_HALF);
    if (where !== undefined) {
      console.warn(`[andrew] legendary recovery: ${f.def.itemId} id ${id} left an inventory and is ${where}`);
      continue;
    }
    lost(f, "left an inventory and was nowhere to be found");
  }
  stopIfIdle();
}

/** The entity's location, or undefined once the engine has removed it. */
function liveLocation(entity: Entity): Vector3 | undefined {
  if (!entity.isValid) {
    return undefined;
  }
  try {
    return entity.location;
  } catch {
    // isValid can lag the removal by a tick; reading a removed entity throws.
    return undefined;
  }
}

/**
 * Where the instance went if it was not destroyed, or undefined. `half` is how
 * far around `w.location` a container could have taken it: 0 for an entity that
 * vanished off the ground (only the spot and a hopper under it can take one
 * without a player), wider for an instance that left a player's slot, which any
 * container within reach could have taken.
 */
function whereIs(w: { def: LegendaryDef; mark: Mark; dimension: Dimension; location: Vector3 }, half = 0): string | undefined {
  const id = w.mark.id;
  // A sighting is only evidence for the entity it was recorded against: a
  // departure is resolved by where the instance is now, never by where it was.
  if (half === 0 && seenInInventory.delete(id)) {
    return "seen entering an inventory (playerInventoryItemChange)";
  }
  for (const other of watched.values()) {
    if (other.mark.id === id) {
      return "lying on the ground as another entity";
    }
  }
  for (const player of world.getAllPlayers()) {
    const container = player?.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      continue;
    }
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (isItemOf(w.def, stack) && getMark(w.def, stack)?.id === id) {
        return `in ${player.name}'s inventory`;
      }
    }
    const offhand = offhandOf(player);
    if (isItemOf(w.def, offhand) && getMark(w.def, offhand)?.id === id) {
      return `in ${player.name}'s off hand`;
    }
  }
  for (const at of holderCells(w, half)) {
    const container = w.dimension.getBlock(at)?.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      continue;
    }
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (isItemOf(w.def, stack) && getMark(w.def, stack)?.id === id) {
        return `in a container at ${fmt(at)}`;
      }
    }
  }
  return undefined;
}

/**
 * Cells whose container could be holding the instance. A hopper pulls items from
 * the block above it, so for an entity that vanished off the ground the spot and
 * the cell below are the only two; an instance that left a slot can be in any
 * container the player could reach, which is a box.
 */
function holderCells(w: { dimension: Dimension; location: Vector3 }, half: number): Vector3[] {
  if (half === 0) {
    return [0, -1].map((dy) => ({ x: w.location.x, y: w.location.y + dy, z: w.location.z }));
  }
  const { min: floor, max: ceiling } = w.dimension.heightRange;
  const min = { x: w.location.x - half, y: Math.max(w.location.y - half, floor), z: w.location.z - half };
  const max = { x: w.location.x + half, y: Math.min(w.location.y + half, ceiling - 1), z: w.location.z + half };
  try {
    return [...w.dimension.getBlocks(new BlockVolume(min, max), { includeTypes: holderIds() }, true).getBlockLocationIterator()].map((at) => ({
      x: at.x,
      y: at.y,
      z: at.z,
    }));
  } catch (err) {
    console.warn(`[andrew] legendary recovery: holder scan around ${fmt(w.location)} threw ${String(err)}`);
    return [];
  }
}

function voidStaleSlot(def: LegendaryDef, player: Player, container: Container, slot: number, mark: Mark): void {
  container.setItem(slot, undefined);
  player.sendMessage({ translate: VOIDED_KEY });
  console.warn(
    `[andrew] legendary recovery: voided a stale ${def.itemId} id ${mark.id} gen ${mark.gen} in ${player.name}'s inventory`
  );
}

/** An online, living player who can take a stack right now. */
function reachable(playerId: string): { player: Player; container: Container } | undefined {
  const player = world.getAllPlayers().find((p) => p?.isValid && p.id === playerId);
  const health = player?.getComponent("minecraft:health");
  const container = player?.getComponent("minecraft:inventory")?.container;
  if (player === undefined || container === undefined || (health !== undefined && health.currentValue <= 0)) {
    return undefined;
  }
  return { player, container };
}

function lost(w: { def: LegendaryDef; mark: Mark }, how: string): void {
  if (!isLive(w.def, w.mark)) {
    console.warn(`[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} ${how}, but it was already stale`);
    return;
  }
  // Order: one synchronous turn — the generation moves before the new stack
  // exists, so the vanished copy is stale before a second one can be live.
  const mark: Mark = { ...w.mark, gen: bumpGen(w.def, w.mark.id) };
  const target = w.mark.owner;
  const online = reachable(target);
  console.warn(
    `[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} ${how}; now gen ${mark.gen}, ` +
      (online === undefined ? `owner ${target} offline or dead, owed on next spawn` : `returning to ${online.player.name}`)
  );
  if (online === undefined) {
    writeOwed(w.def, withOwed(readOwed(w.def), target, { mark, reason: how }));
    return;
  }
  grant(w.def, online.player, online.container, mark, RECOVERED_KEY);
}

/** Hands `player` every instance owed to them, each once. */
function redeemOwed(def: LegendaryDef, player: Player): void {
  if (!player.isValid) {
    return;
  }
  const entries = readOwed(def)[player.id];
  const online = reachable(player.id);
  if (entries === undefined || online === undefined) {
    return;
  }
  for (const { mark } of entries) {
    if (!isLive(def, mark)) {
      console.warn(`[andrew] legendary recovery: owed ${def.itemId} id ${mark.id} gen ${mark.gen} is stale, dropped`);
    } else if (carriesInstance(def, player, online.container, mark)) {
      console.warn(`[andrew] legendary recovery: ${player.name} already carries owed ${def.itemId} id ${mark.id}, dropped`);
    } else {
      grant(def, player, online.container, mark, RECOVERED_KEY);
    }
    // Order: the entry goes after its grant, so a throw in between leaves a
    // token the next spawn drops as already carried, never a lost debt.
    writeOwed(def, withoutOwed(readOwed(def), player.id, mark));
  }
}

// ------------------------------------------------ protection before a script write (L0-lgnd-p008)

const COLORS = [
  "white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray",
  "light_gray", "cyan", "purple", "blue", "brown", "green", "red", "black",
];
const COPPER = ["", "exposed_", "weathered_", "oxidized_"];
const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "pale_oak", "bamboo", "crimson", "warped"];

/**
 * Blocks that can hold a legendary as a stack. Ids the running engine does not
 * know are dropped before the query, so an entry from another game version is
 * harmless. The ender chest is absent: its contents live with the player.
 */
export const HOLDER_TYPES: readonly string[] = [
  "chest", "trapped_chest", "barrel", "hopper", "dropper", "dispenser", "crafter", "brewing_stand",
  "furnace", "lit_furnace", "blast_furnace", "lit_blast_furnace", "smoker", "lit_smoker",
  "shulker_box", "undyed_shulker_box", ...COLORS.map((c) => `${c}_shulker_box`),
  ...COPPER.flatMap((a) => [`${a}copper_chest`, `waxed_${a}copper_chest`]),
  ...WOODS.map((w) => `${w}_shelf`),
  "decorated_pot", "frame", "glow_frame",
].map((id) => `minecraft:${id}`);

/** Holders with no script inventory that protection breaks open instead (P-lgnd-008 step 2b). */
const FRAME_TYPES: ReadonlySet<string> = new Set(["minecraft:frame", "minecraft:glow_frame"]);

/** Per-call cap of an engine volume query, the fillBlocks cap (structures probe Q10). */
const QUERY_CELLS = 32768;

/** The fewest rings the drop-spot search walks outside the protected box. */
const MIN_SPOT_RINGS = 16;

/** Items on these burn or break; a spot above them is not safe. */
const UNSAFE_FLOOR = new Set(["minecraft:cactus", "minecraft:magma_block", "minecraft:fire", "minecraft:soul_fire", "minecraft:campfire", "minecraft:soul_campfire"]);

export interface BlockBox {
  /** Inclusive corners. */
  min: Vector3;
  max: Vector3;
}

export interface ProtectResult {
  moved: number;
  handedBack: number;
}

let knownHolders: string[] | undefined;

function holderIds(): string[] {
  knownHolders ??= HOLDER_TYPES.filter((id) => BlockTypes.get(id) !== undefined);
  return knownHolders;
}

const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

/**
 * Takes every live marked legendary out of the holders in `volume` and off the
 * ground there, and drops it outside `volume` and `avoid`, same id and
 * generation; recovery then watches it through entitySpawn. fillBlocks and
 * structureManager.place erase a holder's contents with no spill
 * (CNTR-XCX10-AA F2), so script writers call this in the same synchronous step
 * as, and before, their first block change.
 *
 * Item frames in `volume` are broken open with `setblock … air destroy`, which
 * spills with drops only while doTileDrops is on: a caller that toggles it
 * calls this outside that window (L0-adr-oprt §3).
 *
 * Throws before moving anything when the volume is not loaded, holds a holder
 * with no script inventory (crafter: C-16), or holds a frame the command could
 * not break, so the caller writes nothing rather than erase blind. With no safe
 * spot within spotSearchLimit the stack goes to its owner, owed if offline
 * (P-lgnd-008 step 6).
 */
export function protectLegendariesIn(dimension: Dimension, volume: BlockBox, opts: { avoid?: BlockBox; reason?: string } = {}): ProtectResult {
  const { min: floor, max: ceiling } = dimension.heightRange;
  const y0 = Math.max(volume.min.y, floor);
  const y1 = Math.min(volume.max.y, ceiling - 1);
  if (y0 > y1) {
    return { moved: 0, handedBack: 0 };
  }
  const reason = opts.reason ?? "no reason given";

  const ids = holderIds();
  const holders: Array<{ at: Vector3; typeId: string; container: Container }> = [];
  const frames: Vector3[] = [];
  const area = (volume.max.x - volume.min.x + 1) * (volume.max.z - volume.min.z + 1);
  const slab = Math.max(1, Math.floor(QUERY_CELLS / area));
  for (let y = y0; ids.length > 0 && y <= y1; y += slab) {
    const query = new BlockVolume({ x: volume.min.x, y, z: volume.min.z }, { x: volume.max.x, y: Math.min(y1, y + slab - 1), z: volume.max.z });
    for (const at of dimension.getBlocks(query, { includeTypes: ids }, false).getBlockLocationIterator()) {
      const block = dimension.getBlock(at);
      if (block !== undefined && FRAME_TYPES.has(block.typeId)) {
        frames.push({ x: at.x, y: at.y, z: at.z });
        continue;
      }
      const container = block?.getComponent("minecraft:inventory")?.container;
      if (block === undefined || container === undefined) {
        throw new Error(`legendary protect: ${block?.typeId ?? "an unloaded block"} at ${fmt(at)} has no script-readable inventory; not writing over it (${reason})`);
      }
      holders.push({ at: { x: at.x, y: at.y, z: at.z }, typeId: block.typeId, container });
    }
  }

  // Order: frames break before any holder is emptied, so a frame that will
  // not break throws with nothing taken out yet.
  for (const at of frames) {
    breakFrame(dimension, at, reason);
  }

  const found: Array<{ def: LegendaryDef; mark: Mark; stack: ItemStack; from: string }> = [];
  for (const h of holders) {
    for (let slot = 0; slot < h.container.size; slot++) {
      const stack = h.container.getItem(slot);
      const def = defForStack(stack);
      const mark = def === undefined || stack === undefined ? undefined : getMark(def, stack);
      // Unmarked and stale copies share the holder's fate, as in vanilla.
      if (def === undefined || stack === undefined || mark === undefined || !isLive(def, mark)) {
        continue;
      }
      found.push({ def, mark, stack, from: `${h.typeId} at ${fmt(h.at)}` });
      h.container.setItem(slot, undefined);
    }
  }

  // Order: after the frames broke — what they spilled is on the ground now.
  const ground = dimension.getEntities({
    type: "minecraft:item",
    location: { x: volume.min.x, y: y0, z: volume.min.z },
    volume: { x: volume.max.x - volume.min.x, y: y1 - y0, z: volume.max.z - volume.min.z },
  });
  for (const entity of ground) {
    const legendary = liveLegendaryOn(entity);
    if (legendary === undefined) {
      continue;
    }
    const cell = { x: Math.floor(entity.location.x), y: Math.floor(entity.location.y), z: Math.floor(entity.location.z) };
    takeOffGround(entity);
    found.push({ ...legendary, from: `the ground at ${fmt(cell)}` });
  }
  if (found.length === 0) {
    return { moved: 0, handedBack: 0 };
  }

  const spot = safeSpot(dimension, union(volume, opts.avoid));
  const result: ProtectResult = { moved: 0, handedBack: 0 };
  for (const f of found) {
    if (spot !== undefined && drop(dimension, f.stack, spot)) {
      result.moved++;
      console.warn(`[andrew] legendary protect: moved ${f.def.itemId} id ${f.mark.id} gen ${f.mark.gen} out of ${f.from} to ${fmt(spot)}`);
    } else {
      result.handedBack++;
      handBack(f.def, f.mark, f.stack, `protect: ${f.from}`);
    }
  }
  console.warn(`[andrew] legendary protect: moved=${result.moved} handedBack=${result.handedBack} reason=${opts.reason ?? "unspecified"}`);
  return result;
}

/** An item entity carrying a live marked legendary: what protectLegendariesIn moves (P-lgnd-008 step 3). */
export function isLegendaryItemEntity(entity: Entity): boolean {
  return liveLegendaryOn(entity) !== undefined;
}

function liveLegendaryOn(entity: Entity): { def: LegendaryDef; mark: Mark; stack: ItemStack } | undefined {
  if (!entity.isValid || entity.typeId !== "minecraft:item") {
    return undefined;
  }
  const stack = entity.getComponent("minecraft:item")?.itemStack;
  const def = defForStack(stack);
  const mark = def === undefined || stack === undefined ? undefined : getMark(def, stack);
  if (def === undefined || stack === undefined || mark === undefined || !isLive(def, mark)) {
    return undefined;
  }
  return { def, mark, stack };
}

/** Removed to be re-dropped, not lost: recovery must not watch it or return it. */
function takeOffGround(entity: Entity): void {
  if (watched.has(entity.id)) {
    forgetWatched(entity.id);
  } else {
    removedByProtect.add(entity.id);
  }
  entity.remove();
}

function breakFrame(dimension: Dimension, at: Vector3, reason: string): void {
  let why = "successCount 0";
  try {
    if (dimension.runCommand(`setblock ${at.x} ${at.y} ${at.z} air destroy`).successCount > 0) {
      return;
    }
  } catch (e) {
    why = String(e);
  }
  throw new Error(`legendary protect: could not break the frame at ${fmt(at)} (${why}); not writing over it (${reason})`);
}

function drop(dimension: Dimension, stack: ItemStack, at: Vector3): boolean {
  try {
    dimension.spawnItem(stack, at).clearVelocity();
    return true;
  } catch (e) {
    console.warn(`[andrew] legendary protect: dropping at ${fmt(at)} threw ${String(e)}`);
    return false;
  }
}

function union(a: BlockBox, b: BlockBox | undefined): BlockBox {
  if (b === undefined) {
    return a;
  }
  return {
    min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y), z: Math.min(a.min.z, b.min.z) },
    max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y), z: Math.max(a.max.z, b.max.z) },
  };
}

/**
 * How many rings outside `box`'s XZ footprint the drop-spot search walks:
 * max(16, halfExtent + 4) (L0-adr-oprt §2). The walk starts at the edge of the
 * box, so the rings are counted from there.
 */
export function spotSearchLimit(box: BlockBox): number {
  const halfExtent = Math.max(box.max.x - box.min.x + 1, box.max.z - box.min.z + 1) / 2;
  return Math.max(MIN_SPOT_RINGS, halfExtent + 4);
}

/**
 * The first cell an item can rest on in rings 2..spotSearchLimit blocks
 * outside `box`'s XZ footprint, leaving a free block between the drop and the box.
 */
function safeSpot(dimension: Dimension, box: BlockBox): Vector3 | undefined {
  const { min: floor, max: ceiling } = dimension.heightRange;
  const top = Math.min(box.max.y + 1, ceiling - 1);
  const limit = spotSearchLimit(box);
  for (let r = 2; r <= limit; r++) {
    const [x0, x1, z0, z1] = [box.min.x - r, box.max.x + r, box.min.z - r, box.max.z + r];
    const ring: Array<[number, number]> = [];
    for (let x = x0; x <= x1; x++) ring.push([x, z0], [x, z1]);
    for (let z = z0 + 1; z < z1; z++) ring.push([x0, z], [x1, z]);
    for (const [x, z] of ring) {
      const y = restingY(dimension, x, z, top, floor);
      if (y !== undefined) {
        return { x: x + 0.5, y, z: z + 0.5 };
      }
    }
  }
  return undefined;
}

/**
 * Going down from `top` in a column open at `top`: the cell above the first
 * non-air block, unless that block is liquid or burns items. Undefined for a
 * column that is closed at `top` or not loaded (getBlock answers undefined).
 */
function restingY(dimension: Dimension, x: number, z: number, top: number, floor: number): number | undefined {
  for (let y = top; y >= floor; y--) {
    const here = dimension.getBlock({ x, y, z });
    if (here === undefined || (y === top && !here.isAir)) {
      return undefined;
    }
    if (!here.isAir) {
      return here.isLiquid || UNSAFE_FLOOR.has(here.typeId) ? undefined : y + 1;
    }
  }
  return undefined;
}

/** P-lgnd-008 step 6: the stack was removed, not lost, so its generation stays. */
function handBack(def: LegendaryDef, mark: Mark, stack: ItemStack, reason: string): void {
  const online = reachable(mark.owner);
  if (online === undefined) {
    writeOwed(def, withOwed(readOwed(def), mark.owner, { mark, reason }));
    console.warn(`[andrew] legendary protect: no safe spot for ${def.itemId} id ${mark.id}; owner ${mark.owner} offline or dead, owed on next spawn`);
    return;
  }
  const leftover = online.container.addItem(stack);
  if (leftover !== undefined) {
    online.player.dimension.spawnItem(leftover, online.player.location);
  }
  online.player.sendMessage({ translate: RECOVERED_KEY });
  console.warn(`[andrew] legendary protect: no safe spot for ${def.itemId} id ${mark.id}; handed to ${online.player.name}`);
}
