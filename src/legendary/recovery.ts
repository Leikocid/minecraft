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
// owed list on their next spawn — the same pending mark death retention uses.
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

import {
  BlockTypes,
  BlockVolume,
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
import { bumpGen, carriesInstance, getMark, isItemOf, isLive, readOwed, writeOwed } from "./state";
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

  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const stack = event.itemStack;
    const def = defForStack(stack);
    if (def === undefined || stack === undefined) {
      return;
    }
    const mark = getMark(def, stack);
    if (mark === undefined) {
      return;
    }
    const player: Player | undefined = event.player;
    const container = player?.getComponent("minecraft:inventory")?.container;
    if (player === undefined || container === undefined) {
      return;
    }
    // The event also fires for the drop that created the entity, still
    // naming the stack; only a slot that holds the instance now counts.
    const now = container.getItem(event.slot);
    const there = isItemOf(def, now) ? getMark(def, now) : undefined;
    if (there === undefined || there.id !== mark.id) {
      return;
    }
    if (!isLive(def, there)) {
      voidStaleSlot(def, player, container, event.slot, there);
      return;
    }
    if ([...watched.values()].some((w) => w.mark.id === mark.id)) {
      seenInInventory.add(mark.id);
    }
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

function watch(entity: Entity, via: string): void {
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
  console.warn(`[andrew] legendary recovery: watching ${def.itemId} id ${mark.id} on the ground (via ${via})`);
  if (intervalId === undefined) {
    intervalId = system.runInterval(check, CHECK_INTERVAL_TICKS);
  }
}

function stopIfIdle(): void {
  if (watched.size === 0 && intervalId !== undefined) {
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

/** Where the instance went if it was not destroyed, or undefined. */
function whereIs(w: Watched): string | undefined {
  const id = w.mark.id;
  if (seenInInventory.delete(id)) {
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
  }
  // A hopper pulls items from the block above it, so the spot and the cell
  // below are the only containers that can take an item without a player.
  for (const dy of [0, -1]) {
    const at = { x: w.location.x, y: w.location.y + dy, z: w.location.z };
    const container = w.dimension.getBlock(at)?.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      continue;
    }
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (isItemOf(w.def, stack) && getMark(w.def, stack)?.id === id) {
        return "in a container at the spot";
      }
    }
  }
  return undefined;
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

function lost(w: Watched, how: string): void {
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
    } else if (carriesInstance(def, online.container, mark)) {
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

/** Per-call cap of an engine volume query, the fillBlocks cap (structures probe Q10). */
const QUERY_CELLS = 32768;

/** How far outside the protected box the drop spot is searched, in blocks. */
const SPOT_RINGS = 16;

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
 * Takes every live marked legendary out of the holders in `volume` and drops
 * it outside `volume` and `avoid`, same id and generation; recovery then
 * watches it through entitySpawn. fillBlocks and structureManager.place erase
 * a holder's contents with no spill (CNTR-XCX10-AA F2), so script writers call
 * this in the same synchronous step as, and before, their first block change.
 *
 * Throws before moving anything when the volume is not loaded or holds a
 * holder with no script inventory (crafter, item frames: C-16), so the caller
 * writes nothing rather than erase blind. With no safe spot within SPOT_RINGS
 * the stack goes to its owner, owed if offline (P-lgnd-008 step 6).
 */
export function protectLegendariesIn(dimension: Dimension, volume: BlockBox, opts: { avoid?: BlockBox; reason?: string } = {}): ProtectResult {
  const { min: floor, max: ceiling } = dimension.heightRange;
  const y0 = Math.max(volume.min.y, floor);
  const y1 = Math.min(volume.max.y, ceiling - 1);
  const ids = holderIds();
  if (y0 > y1 || ids.length === 0) {
    return { moved: 0, handedBack: 0 };
  }

  const holders: Array<{ at: Vector3; typeId: string; container: Container }> = [];
  const area = (volume.max.x - volume.min.x + 1) * (volume.max.z - volume.min.z + 1);
  const slab = Math.max(1, Math.floor(QUERY_CELLS / area));
  for (let y = y0; y <= y1; y += slab) {
    const query = new BlockVolume({ x: volume.min.x, y, z: volume.min.z }, { x: volume.max.x, y: Math.min(y1, y + slab - 1), z: volume.max.z });
    for (const at of dimension.getBlocks(query, { includeTypes: ids }, false).getBlockLocationIterator()) {
      const block = dimension.getBlock(at);
      const container = block?.getComponent("minecraft:inventory")?.container;
      if (block === undefined || container === undefined) {
        throw new Error(`legendary protect: ${block?.typeId ?? "an unloaded block"} at ${fmt(at)} has no script-readable inventory; not writing over it (${opts.reason ?? "no reason given"})`);
      }
      holders.push({ at: { x: at.x, y: at.y, z: at.z }, typeId: block.typeId, container });
    }
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
 * The first cell an item can rest on in rings 2..SPOT_RINGS blocks outside
 * `box`'s XZ footprint, leaving a free block between the drop and the box.
 */
function safeSpot(dimension: Dimension, box: BlockBox): Vector3 | undefined {
  const { min: floor, max: ceiling } = dimension.heightRange;
  const top = Math.min(box.max.y + 1, ceiling - 1);
  for (let r = 2; r <= SPOT_RINGS; r++) {
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
