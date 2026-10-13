// Pure rules of the plate generation (spec v3 §7–§8; L0-xcx34, L0-pear-ru03, L0-pear-ent2): when a bound plate is
// still the plate the rod saw, which cells an observed event replaces, and the store of generations with its pruning.
// No engine call: tests/pearl-generation.test.mjs bundles this file with esbuild and drives the store through a Map.

import { type Binding, type Vec3, counterOf, dimensionName, generationKey, isPlateType } from "./bind-rules";

/**
 * A generation is a stamp, never a count from 0: a cell's entry is created by the first binding to it with a number
 * no cell has ever had, and an observed replacement deletes the entry. A deleted entry reads 0 and matches no
 * binding, so deleting one can void bindings but never revive one — which is what makes pruning safe.
 */
export const GEN_PREFIX = "andrew:pg:";
/** World dynamic property per watched cell: the rods bound to its current generation (JSON of WatchRecord). */
export const WATCH_PREFIX = "andrew:pgw:";
/** World dynamic property: the last number handed out; stamps and bind order both come from it. */
export const SEQ_KEY = "andrew:pg_seq";

/** Watched cells at most; a binding to a new cell beyond it evicts the cell bound longest ago. */
export const MAX_CELLS = 512;
/** Rods tracked per cell at most; past it the cell is pinned (kept until replaced or evicted) instead of tracked. */
export const MAX_RODS_PER_CELL = 64;

export type PlateVerdict = "same" | "missing" | "other-type" | "replaced" | "unloaded";

/**
 * Whether the plate at a binding's cell is the plate it was bound to (L0-pear-ru03). `typeNow` is undefined when the
 * cell is not loaded. The permutation is never read: `redstone_signal` changes on every press.
 */
export function plateVerdict(b: Pick<Binding, "type" | "gen">, typeNow: string | undefined, genNow: number): PlateVerdict {
  if (typeNow === undefined) return "unloaded";
  if (!isPlateType(typeNow)) return "missing";
  if (typeNow !== b.type) return "other-type";
  if (genNow !== b.gen) return "replaced";
  return "same";
}

/** Only the same plate is travelled to; every other verdict refuses the trip. */
export const honours = (v: PlateVerdict): boolean => v === "same";

export const above = (c: Vec3): Vec3 => ({ x: c.x, y: c.y + 1, z: c.z });
export const sameCell = (a: Vec3, b: Vec3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;

/** A broken or exploded block takes a plate in its cell, and the plate it was holding up. */
export function cellsBroken(at: Vec3): Vec3[] {
  return [at, above(at)];
}

/**
 * Cells a piston move can take a plate from, for a check once the move has settled: one around the piston and
 * everything it moves (the arm cell, each destination), and one more layer up (a plate on a moved block). A
 * plate cannot be moved, only destroyed, so the check bumps a watched cell only when its plate is gone.
 */
export function pistonCells(piston: Vec3, attached: readonly Vec3[], reach = 1): Vec3[] {
  const all = [piston, ...attached];
  const lo = { x: Math.min(...all.map((c) => c.x)) - reach, y: Math.min(...all.map((c) => c.y)) - reach, z: Math.min(...all.map((c) => c.z)) - reach };
  const hi = { x: Math.max(...all.map((c) => c.x)) + reach, y: Math.max(...all.map((c) => c.y)) + reach + 1, z: Math.max(...all.map((c) => c.z)) + reach };
  const out: Vec3[] = [];
  for (let x = lo.x; x <= hi.x; x++) for (let y = lo.y; y <= hi.y; y++) for (let z = lo.z; z <= hi.z; z++) out.push({ x, y, z });
  return out;
}

/**
 * Reach of the box when the piston's moved-block list cannot be read: two cells takes in a sticky piston's pulled
 * block and the plate on it. A push of more blocks than that is not covered.
 */
export const PISTON_FALLBACK_REACH = 2;

/** A dynamic-property store: world properties on the engine, a Map in tests. `set(key, undefined)` deletes. */
export interface Store {
  get(key: string): unknown;
  set(key: string, value: string | number | undefined): void;
  ids(): string[];
}

export interface WatchRecord {
  /** Rod id → [binder's Player.id, bind order]. */
  rods: Record<string, [string, number]>;
  /** Bind order of the latest binding to this generation; the smallest is evicted first. */
  last: number;
  /** Tracking was given up (too many rods, or no record): only a replacement or eviction removes the cell. */
  pinned: boolean;
}

export interface Cell {
  dim: string;
  pos: Vec3;
}

export function watchKey(dim: string, cell: Vec3): string {
  return `${WATCH_PREFIX}${dimensionName(dim)}:${cell.x}:${cell.y}:${cell.z}`;
}

/** The cell a generation key names; undefined for any other key. */
export function parseGenerationKey(key: string): Cell | undefined {
  if (!key.startsWith(GEN_PREFIX)) return undefined;
  const parts = key.slice(GEN_PREFIX.length).split(":");
  if (parts.length !== 4) return undefined;
  const [name, ...xyz] = parts;
  const [x, y, z] = xyz.map(Number);
  if (name.length === 0 || ![x, y, z].every(Number.isInteger)) return undefined;
  return { dim: `minecraft:${name}`, pos: { x, y, z } };
}

const isRodEntry = (v: unknown): v is [string, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "number";

/** A stored record, or undefined when the value is missing or not one. */
export function readRecord(raw: unknown): WatchRecord | undefined {
  if (typeof raw !== "string") return undefined;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof v !== "object" || v === null) return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.rods !== "object" || o.rods === null || typeof o.last !== "number" || typeof o.pinned !== "boolean") return undefined;
  const rods: Record<string, [string, number]> = {};
  for (const [id, entry] of Object.entries(o.rods as Record<string, unknown>)) if (isRodEntry(entry)) rods[id] = [entry[0], entry[1]];
  return { rods, last: o.last, pinned: o.pinned };
}

export const generationOf = (store: Store, dim: string, cell: Vec3): number => counterOf(store.get(generationKey(dim, cell)));

/** The record of a watched cell. A generation with no readable record is kept, pinned and oldest. */
function recordOf(store: Store, dim: string, cell: Vec3): WatchRecord | undefined {
  if (generationOf(store, dim, cell) === 0) return undefined;
  return readRecord(store.get(watchKey(dim, cell))) ?? { rods: {}, last: 0, pinned: true };
}

function write(store: Store, dim: string, cell: Vec3, rec: WatchRecord): void {
  store.set(watchKey(dim, cell), JSON.stringify(rec));
}

function drop(store: Store, dim: string, cell: Vec3): void {
  store.set(generationKey(dim, cell), undefined);
  store.set(watchKey(dim, cell), undefined);
}

function nextSeq(store: Store): number {
  const n = counterOf(store.get(SEQ_KEY)) + 1;
  store.set(SEQ_KEY, n);
  return n;
}

/** Every watched cell with its record. */
export function watchedCells(store: Store): Array<Cell & { gen: number; record: WatchRecord }> {
  const out: Array<Cell & { gen: number; record: WatchRecord }> = [];
  for (const key of store.ids()) {
    const cell = parseGenerationKey(key);
    if (cell === undefined) continue;
    const record = recordOf(store, cell.dim, cell.pos);
    if (record !== undefined) out.push({ ...cell, gen: generationOf(store, cell.dim, cell.pos), record });
  }
  return out;
}

/** Records with no generation left behind (none in normal running); dropped when found. */
function dropOrphans(store: Store): void {
  for (const key of store.ids()) {
    if (!key.startsWith(WATCH_PREFIX)) continue;
    const gen = `${GEN_PREFIX}${key.slice(WATCH_PREFIX.length)}`;
    if (counterOf(store.get(gen)) === 0) store.set(key, undefined);
  }
}

export interface ClaimResult {
  /** The generation the binding records. */
  gen: number;
  created: boolean;
  /** Cells evicted to stay under MAX_CELLS: their bindings no longer match. */
  evicted: Cell[];
}

/**
 * A rod is being bound to `cell`: the generation it must record. The cell's current generation when it has one, a
 * fresh stamp when it has none. The rod leaves the cell it was bound to before (`previous`), and is tracked here.
 */
export function claim(store: Store, dim: string, cell: Vec3, rodId: string, owner: string, previous?: Pick<Binding, "dim" | "pos" | "gen">): ClaimResult {
  const again = previous !== undefined && previous.dim === dim && sameCell(previous.pos, cell) && previous.gen === generationOf(store, dim, cell);
  if (previous !== undefined && !again) release(store, previous.dim, previous.pos, previous.gen, rodId);
  const evicted: Cell[] = [];
  let rec = recordOf(store, dim, cell);
  const created = rec === undefined;
  if (rec === undefined) {
    dropOrphans(store);
    const cells = watchedCells(store).sort((a, b) => a.record.last - b.record.last);
    while (cells.length >= MAX_CELLS) {
      const old = cells.shift();
      if (old === undefined) break;
      drop(store, old.dim, old.pos);
      evicted.push({ dim: old.dim, pos: old.pos });
    }
    store.set(generationKey(dim, cell), nextSeq(store));
    rec = { rods: {}, last: 0, pinned: false };
  }
  const seq = nextSeq(store);
  rec.last = seq;
  if (!rec.pinned) {
    if (rec.rods[rodId] === undefined && Object.keys(rec.rods).length >= MAX_RODS_PER_CELL) {
      rec.pinned = true;
      rec.rods = {};
    } else rec.rods[rodId] = [owner, seq];
  }
  write(store, dim, cell, rec);
  return { gen: generationOf(store, dim, cell), created, evicted };
}

export type ReleaseResult = "released" | "pruned" | "none";

/**
 * The binding of `rodId` to generation `gen` of `cell` has ended (cleared, overwritten). The last rod out takes the
 * cell with it. A different current generation means the rod's one is already gone.
 */
export function release(store: Store, dim: string, cell: Vec3, gen: number, rodId: string): ReleaseResult {
  const rec = recordOf(store, dim, cell);
  if (rec === undefined || generationOf(store, dim, cell) !== gen || rec.rods[rodId] === undefined) return "none";
  delete rec.rods[rodId];
  if (!rec.pinned && Object.keys(rec.rods).length === 0) {
    drop(store, dim, cell);
    return "pruned";
  }
  write(store, dim, cell, rec);
  return "released";
}

/** An observed path replaced whatever stood in `cell`: its generation ends, and every binding to it with it. */
export function bump(store: Store, dim: string, cell: Vec3): boolean {
  if (generationOf(store, dim, cell) === 0) return false;
  drop(store, dim, cell);
  return true;
}

/** The binder died: every binding they made is void (C-45), so their rods leave every cell. */
export function forgetOwner(store: Store, owner: string): { released: number; pruned: number } {
  let released = 0;
  let pruned = 0;
  for (const w of watchedCells(store)) {
    const mine = Object.entries(w.record.rods).filter(([, [who]]) => who === owner);
    if (mine.length === 0) continue;
    for (const [id] of mine) delete w.record.rods[id];
    released += mine.length;
    if (!w.record.pinned && Object.keys(w.record.rods).length === 0) {
      drop(store, w.dim, w.pos);
      pruned++;
    } else write(store, w.dim, w.pos, w.record);
  }
  return { released, pruned };
}
