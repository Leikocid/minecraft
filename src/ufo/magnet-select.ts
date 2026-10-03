// Magnet-on (L0-magn-pscn): one synchronous pass in the tick of
// onPhase("magnet") that picks at most ELEMENT_LIMIT non-player elements by
// priority class and nearness (L0-magn-rlim), then turns the chosen container
// stacks, blocks and ore into item entities (L0-magn-pext). Engine objects come
// in as arguments, so node tests run the whole pass over fakes.

import type { BlockVolumeBase, Container, Dimension, Entity, ItemStack, Vector3 } from "@minecraft/server";
import { LEGENDARIES, isLegendaryStack } from "../legendary/registry";
import { IRON_TAG } from "./event";
import { IRON_ARMOUR, IRON_DOOR, PAIRED_CHESTS, SCAN_TYPES, blockRole, isIronEntityType, isIronItem, itemForBlock } from "./iron";

/** UFO §3. */
export const ZONE_RADIUS = 50;
export const ZONE_DEPTH = 20;
/** UFO §5: non-player elements per event. */
export const ELEMENT_LIMIT = 10;

export const GROUND = 1;
export const STACK = 2;
export const HOLDER = 3;
export const BLOCK = 4;
export const ORE = 5;
export type ElementClass = typeof GROUND | typeof STACK | typeof HOLDER | typeof BLOCK | typeof ORE;

const AIR = "minecraft:air";
const ITEM = "minecraft:item";
const PLAYER = "minecraft:player";
const DOUBLE_CHEST_SLOTS = 54;

// ------------------------------------------------------------------ the zone

export interface Zone {
  /** The block under the target at arrival. */
  readonly centre: Readonly<Vector3>;
  readonly radius: number;
  /** Block rows, both inclusive. */
  readonly yMin: number;
  readonly yMax: number;
}

/** UFO §3 clamped to the dimension; `heightRange.max` is the first row above the world. */
export function zoneOf(centre: Vector3, hoverY: number, heightRange: { min: number; max: number }, radius = ZONE_RADIUS, depth = ZONE_DEPTH): Zone {
  return {
    centre: { x: centre.x, y: centre.y, z: centre.z },
    radius,
    yMin: Math.max(heightRange.min, centre.y - depth),
    yMax: Math.min(heightRange.max - 1, Math.floor(hoverY)),
  };
}

export const blockMiddle = (b: Vector3): Vector3 => ({ x: b.x + 0.5, y: b.y + 0.5, z: b.z + 0.5 });

/** Where distances are measured from. */
export const zoneMiddle = (zone: Zone): Vector3 => blockMiddle(zone.centre);

/** A point — an entity's location or a block's middle — inside the cylinder. */
export function inZone(zone: Zone, p: Vector3): boolean {
  const row = Math.floor(p.y);
  if (row < zone.yMin || row > zone.yMax) return false;
  return Math.hypot(p.x - (zone.centre.x + 0.5), p.z - (zone.centre.z + 0.5)) <= zone.radius;
}

export function distanceFrom(zone: Zone, p: Vector3): number {
  const m = zoneMiddle(zone);
  return Math.hypot(p.x - m.x, p.y - m.y, p.z - m.z);
}

/** A sphere around the centre's middle that holds the whole cylinder. */
export function reach(zone: Zone): number {
  const m = zoneMiddle(zone);
  return Math.ceil(Math.hypot(zone.radius + 1, Math.max(m.y - zone.yMin, zone.yMax + 1 - m.y))) + 1;
}

export function zoneBox(zone: Zone): { from: Vector3; to: Vector3 } {
  const { centre: c, radius: r } = zone;
  return { from: { x: c.x - r, y: zone.yMin, z: c.z - r }, to: { x: c.x + r, y: zone.yMax, z: c.z + r } };
}

// ---------------------------------------------------------------- the choice

export interface Ranked {
  readonly cls: ElementClass;
  readonly distance: number;
  /** Entity id or block position: settles equal distances the same way every run. */
  readonly key: string;
  /** Container slot; 0 for everything else. */
  readonly sub: number;
}

export function compareRanked(a: Ranked, b: Ranked): number {
  return a.cls - b.cls || a.distance - b.distance || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) || a.sub - b.sub;
}

export function rank<T extends Ranked>(candidates: readonly T[]): T[] {
  return [...candidates].sort(compareRanked);
}

/**
 * L0-magn-rlim with the lazy cut of L0-magn-pscn step 3: one producer per
 * class, in class order. A producer runs only while a place is free and is told
 * how many are; a lower class fills only what the higher ones left.
 */
export function selectByPriority<T extends Ranked>(producers: ReadonlyArray<(free: number) => readonly T[]>, limit = ELEMENT_LIMIT): T[] {
  const chosen: T[] = [];
  for (const produce of producers) {
    const free = limit - chosen.length;
    if (free <= 0) break;
    chosen.push(...rank(produce(free)).slice(0, free));
  }
  return chosen;
}

// ---------------------------------------------------------- the engine pass

type Source =
  | { readonly kind: "entity"; readonly entity: Entity; readonly from: string }
  | { readonly kind: "slot"; readonly container: Container; readonly slot: number; readonly at: Vector3; readonly typeId: string; readonly amount: number }
  | { readonly kind: "block"; readonly at: Vector3; readonly typeId: string };

interface Candidate extends Ranked {
  readonly source: Source;
}

interface Site {
  readonly at: Vector3;
  readonly typeId: string;
  readonly distance: number;
  readonly key: string;
}

interface Scan {
  readonly containers: Site[];
  readonly built: Site[];
  readonly ore: Site[];
}

export interface MagnetElement {
  readonly entity: Entity;
  readonly cls: ElementClass;
  /** Where it was taken from: the entity itself, the container or the block. */
  readonly origin: Vector3;
  readonly distance: number;
  /** The item, entity or block type it came from. */
  readonly from: string;
  /** Its ring place, 0..n−1 in selection order. */
  readonly slot: number;
}

export interface MagnetSelection {
  readonly zone: Zone;
  readonly elements: readonly MagnetElement[];
  /** The item entities this pass spawned; the drop exemption ignores them (L0-magn-rexm). */
  readonly spawned: ReadonlySet<string>;
  /** Candidates each evaluated class offered; a class the cut never reached is absent. */
  readonly found: Partial<Record<ElementClass, number>>;
  readonly failures: readonly string[];
  readonly ms: number;
}

export interface MagnetHost {
  /** `new ItemStack(typeId, amount)`. */
  itemStack(typeId: string, amount: number): ItemStack;
  /** `new BlockVolume(from, to)`, both corners inclusive. */
  volume(from: Vector3, to: Vector3): BlockVolumeBase;
  now(): number;
  log(msg: string): void;
}

export type MagnetDimension = Pick<Dimension, "getEntities" | "getBlocks" | "getBlock" | "spawnItem" | "runCommand" | "heightRange">;

const keyOf = (b: Vector3): string => `${b.x},${b.y},${b.z}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;

/**
 * hasitem rejects an item hidden from commands (menu_category none) as a syntax
 * error, which every craft token is; only the weapons can be asked for on a mob.
 */
const HELD_LEGENDARY_IDS: readonly string[] = LEGENDARIES.map((def) => def.itemId);
/** U4b: hasitem with no location misses the hands, so they are asked for by name. */
const HELD_LOCATIONS: readonly string[] = ["", ",location=slot.weapon.mainhand", ",location=slot.weapon.offhand"];

function containerOf(dim: MagnetDimension, at: Vector3): Container | undefined {
  return dim.getBlock(at)?.getComponent("minecraft:inventory")?.container;
}

function isEmpty(container: Container | undefined): boolean {
  if (container === undefined) return false;
  for (let k = 0; k < container.size; k++) if (container.getItem(k) !== undefined) return false;
  return true;
}

const signature = (c: Container, from: number, to: number): string => {
  const parts: string[] = [];
  for (let k = from; k < to; k++) {
    const s = c.getItem(k);
    parts.push(s === undefined ? "" : `${s.typeId}*${s.amount}`);
  }
  return parts.join("|");
};

/**
 * The other half of a double chest: a horizontal neighbour of the same type
 * that shows the same 54 slots, in either half order. The engine exposes no
 * pairing, and a row of double chests puts two 54-slot chests next to each one.
 */
function chestPartners(dim: MagnetDimension, at: Vector3, typeId: string, mine: Container): Vector3[] {
  const half = DOUBLE_CHEST_SLOTS / 2;
  const a = signature(mine, 0, half);
  const b = signature(mine, half, DOUBLE_CHEST_SLOTS);
  const out: Vector3[] = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const p = { x: at.x + dx, y: at.y, z: at.z + dz };
    const block = dim.getBlock(p);
    if (block?.typeId !== typeId) continue;
    const other = block.getComponent("minecraft:inventory")?.container;
    if (other?.size !== DOUBLE_CHEST_SLOTS) continue;
    const oa = signature(other, 0, half);
    const ob = signature(other, half, DOUBLE_CHEST_SLOTS);
    if ((oa === a && ob === b) || (oa === b && ob === a)) out.push(p);
  }
  return out;
}

function scanBlocks(dim: MagnetDimension, zone: Zone, host: MagnetHost): Scan {
  const { from, to } = zoneBox(zone);
  // allowUnloadedChunks: the loaded part is scanned and the rest skipped, not
  // thrown for (C-12′) — which makes L0-magn-adsc's per-column fallback moot.
  const list = dim.getBlocks(host.volume(from, to), { includeTypes: [...SCAN_TYPES] }, true);
  const scan: Scan = { containers: [], built: [], ore: [] };
  const doors = new Set<string>();
  for (const loc of list.getBlockLocationIterator()) {
    if (!inZone(zone, blockMiddle(loc))) continue;
    const block = dim.getBlock(loc);
    if (block === undefined) continue;
    const typeId = block.typeId;
    const role = blockRole(typeId, () => isEmpty(block.getComponent("minecraft:inventory")?.container));
    if (role === undefined) continue;
    let at: Vector3 = { x: loc.x, y: loc.y, z: loc.z };
    if (typeId === IRON_DOOR && block.permutation.getState("upper_block_bit") === true) {
      // A door is one element, addressed by its lower half (L0-magn-pext).
      const lower = { x: loc.x, y: loc.y - 1, z: loc.z };
      if (dim.getBlock(lower)?.typeId === IRON_DOOR) at = lower;
    }
    const key = keyOf(at);
    if (typeId === IRON_DOOR) {
      if (doors.has(key)) continue;
      doors.add(key);
    }
    const site: Site = { at, typeId, distance: distanceFrom(zone, blockMiddle(at)), key };
    if (role === "container") scan.containers.push(site);
    else if (role === "built") scan.built.push(site);
    else scan.ore.push(site);
  }
  return scan;
}

function groundItems(dim: MagnetDimension, zone: Zone, isLegendary: (s: ItemStack) => boolean): Candidate[] {
  const out: Candidate[] = [];
  for (const e of dim.getEntities({ type: ITEM, location: zoneMiddle(zone), maxDistance: reach(zone) })) {
    // A product pack reads some entities as undefined (C-22).
    if (e === undefined || !e.isValid || !inZone(zone, e.location)) continue;
    const stack = e.getComponent("minecraft:item")?.itemStack;
    if (stack === undefined || !isIronItem(stack.typeId) || isLegendary(stack)) continue;
    out.push({ cls: GROUND, distance: distanceFrom(zone, e.location), key: e.id, sub: 0, source: { kind: "entity", entity: e, from: stack.typeId } });
  }
  return out;
}

function containerStacks(dim: MagnetDimension, sites: readonly Site[], free: number, isLegendary: (s: ItemStack) => boolean): Candidate[] {
  const out: Candidate[] = [];
  const visited = new Set<string>();
  for (const site of rank(sites.map((s) => ({ ...s, cls: STACK, sub: 0 })))) {
    if (out.length >= free) break;
    if (visited.has(site.key)) continue;
    visited.add(site.key);
    const container = containerOf(dim, site.at);
    if (container === undefined) continue;
    if (container.size === DOUBLE_CHEST_SLOTS && PAIRED_CHESTS.has(site.typeId)) {
      for (const p of chestPartners(dim, site.at, site.typeId, container)) visited.add(keyOf(p));
    }
    for (let k = 0; k < container.size && out.length < free; k++) {
      const stack = container.getItem(k);
      if (stack === undefined || !isIronItem(stack.typeId) || isLegendary(stack)) continue;
      out.push({
        cls: STACK,
        distance: site.distance,
        key: site.key,
        sub: k,
        source: { kind: "slot", container, slot: k, at: site.at, typeId: stack.typeId, amount: stack.amount },
      });
    }
  }
  return out;
}

/** successCount, or 0 when the selector matched nobody; `failed` collects any other error. */
function command(dim: MagnetDimension, text: string, failed: string[]): number {
  try {
    return dim.runCommand(text).successCount;
  } catch (err) {
    const msg = errText(err);
    if (!/no targets matched/i.test(msg)) failed.push(`${text.slice(0, 40)}…: ${msg}`);
    return 0;
  }
}

function holderCarriesLegendary(e: Entity, isLegendary: (s: ItemStack) => boolean): boolean {
  const container = e.getComponent("minecraft:inventory")?.container;
  if (container === undefined) return false;
  for (let k = 0; k < container.size; k++) {
    const stack = container.getItem(k);
    if (stack !== undefined && isLegendary(stack)) return true;
  }
  return false;
}

/**
 * Class 3: iron golems and minecarts by type, mobs and armour stands by the
 * L0-magn-adar tag. Holders of a legendary are skipped (L0-magn-aslh): a
 * minecart by its container, a tagged mob by hasitem on every legendary id.
 */
function holders(dim: MagnetDimension, zone: Zone, isLegendary: (s: ItemStack) => boolean, tagged: Entity[], failures: string[]): Candidate[] {
  const m = zoneMiddle(zone);
  const sphere = `x=${m.x},y=${m.y},z=${m.z},r=${reach(zone)}`;
  const failed: string[] = [];
  // The tag means "wears iron now": a leftover from an earlier event is cleared first.
  command(dim, `tag @e[${sphere},tag=${IRON_TAG}] remove ${IRON_TAG}`, failed);
  let wearers = 0;
  for (const { item, location } of IRON_ARMOUR) {
    wearers += command(dim, `tag @e[${sphere},type=!${PLAYER},type=!${ITEM},hasitem={item=${item},location=${location}}] add ${IRON_TAG}`, failed);
  }
  if (wearers > 0) {
    const before = failed.length;
    for (const id of HELD_LEGENDARY_IDS) {
      for (const where of HELD_LOCATIONS) command(dim, `tag @e[${sphere},tag=${IRON_TAG},hasitem={item=${id}${where}}] remove ${IRON_TAG}`, failed);
    }
    // A legendary that could not be ruled out keeps its holder on the ground.
    if (failed.length > before) command(dim, `tag @e[${sphere},tag=${IRON_TAG}] remove ${IRON_TAG}`, failed);
  }
  if (failed.length > 0) failures.push(`class 3 commands: ${failed.join("; ")}`);

  const out: Candidate[] = [];
  for (const e of dim.getEntities({ location: m, maxDistance: reach(zone), excludeTypes: [ITEM, PLAYER] })) {
    if (e === undefined || !e.isValid) continue;
    const wears = e.hasTag(IRON_TAG);
    if (wears) tagged.push(e);
    if (!wears && !isIronEntityType(e.typeId)) continue;
    if (!inZone(zone, e.location) || holderCarriesLegendary(e, isLegendary)) continue;
    out.push({ cls: HOLDER, distance: distanceFrom(zone, e.location), key: e.id, sub: 0, source: { kind: "entity", entity: e, from: e.typeId } });
  }
  return out;
}

const blockCandidates = (cls: typeof BLOCK | typeof ORE, sites: readonly Site[]): Candidate[] =>
  sites.map((s) => ({ cls, distance: s.distance, key: s.key, sub: 0, source: { kind: "block", at: s.at, typeId: s.typeId } }));

/** L0-magn-rdup: remove first, spawn second, roll back if the spawn throws. */
function materialise(dim: MagnetDimension, c: Candidate, host: MagnetHost): { entity: Entity; origin: Vector3; from: string } | string {
  const src = c.source;
  if (src.kind === "entity") {
    return src.entity.isValid ? { entity: src.entity, origin: src.entity.location, from: src.from } : `${src.from} ${c.key} is gone`;
  }
  if (src.kind === "slot") {
    const stack = src.container.getItem(src.slot);
    if (stack === undefined || stack.typeId !== src.typeId || stack.amount !== src.amount) return `slot ${src.slot} at ${keyOf(src.at)} changed`;
    src.container.setItem(src.slot, undefined);
    try {
      const entity = dim.spawnItem(stack, { x: src.at.x + 0.5, y: src.at.y + 1.5, z: src.at.z + 0.5 });
      return { entity, origin: src.at, from: stack.typeId };
    } catch (err) {
      src.container.setItem(src.slot, stack);
      return `spawning ${stack.typeId} from ${keyOf(src.at)} threw ${errText(err)}; put back`;
    }
  }
  const block = dim.getBlock(src.at);
  if (block?.typeId !== src.typeId) return `${src.typeId} at ${keyOf(src.at)} changed`;
  const itemId = itemForBlock(src.typeId);
  if (itemId === undefined) return `${src.typeId} has no item`;
  const stack = host.itemStack(itemId, 1);
  const saved = block.permutation;
  const upper = src.typeId === IRON_DOOR ? dim.getBlock({ x: src.at.x, y: src.at.y + 1, z: src.at.z }) : undefined;
  const savedUpper = upper?.typeId === IRON_DOOR ? upper.permutation : undefined;
  block.setType(AIR);
  // U6: the engine takes the upper half with the lower; this covers a tick where it has not yet.
  if (savedUpper !== undefined && upper?.typeId === IRON_DOOR) upper.setType(AIR);
  try {
    const entity = dim.spawnItem(stack, blockMiddle(src.at));
    return { entity, origin: src.at, from: src.typeId };
  } catch (err) {
    block.setPermutation(saved);
    if (savedUpper !== undefined) upper?.setPermutation(savedUpper);
    return `spawning ${itemId} for ${src.typeId} at ${keyOf(src.at)} threw ${errText(err)}; block restored`;
  }
}

/**
 * Magnet-on in one call. If a class's part of the scan throws, that class is
 * empty and the others still run; the error is logged once. Nothing is mutated
 * before the choice is final, and every mutation is undone if its spawn fails.
 */
export function magnetOn(
  dim: MagnetDimension,
  centre: Vector3,
  hoverY: number,
  host: MagnetHost,
  opts: { limit?: number; isLegendary?: (s: ItemStack) => boolean } = {}
): MagnetSelection {
  const start = host.now();
  const limit = opts.limit ?? ELEMENT_LIMIT;
  const isLegendary = opts.isLegendary ?? isLegendaryStack;
  const zone = zoneOf(centre, hoverY, dim.heightRange);
  const failures: string[] = [];
  const found: Partial<Record<ElementClass, number>> = {};
  const tagged: Entity[] = [];

  let scan: Scan | undefined;
  const blocks = (): Scan => {
    if (scan !== undefined) return scan;
    try {
      scan = scanBlocks(dim, zone, host);
    } catch (err) {
      failures.push(`block scan: ${errText(err)}`);
      scan = { containers: [], built: [], ore: [] };
    }
    return scan;
  };
  const guarded =
    (cls: ElementClass, produce: (free: number) => Candidate[]) =>
    (free: number): Candidate[] => {
      try {
        const out = produce(free);
        found[cls] = out.length;
        return out;
      } catch (err) {
        failures.push(`class ${cls}: ${errText(err)}`);
        found[cls] = 0;
        return [];
      }
    };

  const chosen = selectByPriority<Candidate>(
    [
      guarded(GROUND, () => groundItems(dim, zone, isLegendary)),
      guarded(STACK, (free) => containerStacks(dim, blocks().containers, free, isLegendary)),
      guarded(HOLDER, () => holders(dim, zone, isLegendary, tagged, failures)),
      guarded(BLOCK, () => blockCandidates(BLOCK, blocks().built)),
      guarded(ORE, () => blockCandidates(ORE, blocks().ore)),
    ],
    limit
  );

  const elements: MagnetElement[] = [];
  const spawned = new Set<string>();
  for (const c of chosen) {
    let made: ReturnType<typeof materialise>;
    try {
      made = materialise(dim, c, host);
    } catch (err) {
      made = `class ${c.cls} ${c.key}: ${errText(err)}`;
    }
    if (typeof made === "string") {
      failures.push(made);
      continue;
    }
    if (c.source.kind !== "entity") spawned.add(made.entity.id);
    else if (c.cls === HOLDER) made.entity.addTag(IRON_TAG);
    elements.push({ entity: made.entity, cls: c.cls, origin: made.origin, distance: c.distance, from: made.from, slot: elements.length });
  }
  const held = new Set(elements.map((e) => e.entity.id));
  for (const e of tagged) if (!held.has(e.id) && e.isValid) e.removeTag(IRON_TAG);

  const ms = host.now() - start;
  const per = ([GROUND, STACK, HOLDER, BLOCK, ORE] as const).map((cls) => elements.filter((e) => e.cls === cls).length).join("/");
  host.log(
    `ufo magnet-on at ${fmt(zone.centre)}: ${elements.length} element(s) by class ${per}, ` +
      `candidates ${JSON.stringify(found)}, ${ms} ms${failures.length > 0 ? `; failures: ${failures.join(" | ")}` : ""}`
  );
  return { zone, elements, spawned, found, failures, ms };
}
