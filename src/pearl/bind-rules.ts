// Pure rules of the binding (spec v3 §7, unbound state; L0-xasm41, L0-pear-ent1, L0-pear-pr02): when a hook counts
// as having struck a pressure plate, and the record it leaves on the rod. Values in, values out: no engine call, so
// tests/pearl-bind.test.mjs bundles this file with esbuild.

import { LORE_TITLE } from "./item-rules";

export const HOOK_ID = "minecraft:fishing_hook";

/**
 * Height above the plate cell's floor under which a hook in that cell has struck the plate (xasm41). A resting hook
 * reads 0.000000 on all 17 plate types and a hook in flight over plates 0.44 or more (probe Q2).
 */
export const BIND_DY = 0.25;
/** A hook slower than this (blocks per tick) has stopped; a resting hook reads 0 (probe Q2). */
export const STOPPED_SPEED = 0.05;
/**
 * A resting hook sits at exactly the support's top, an integer y, so floor(y) is the plate cell. A y a hair below
 * that integer would floor to the support instead; the cell is taken at y + this, which no flight height reaches.
 */
export const FLOOR_EPSILON = 1e-3;
/**
 * Consecutive checks the verdict has to hold in the same cell. A hook that hooks a mob can read stopped in the tick
 * of the hit, before projectileHitEntity arrives; the second check sees the flag.
 */
export const HIT_CONFIRM_TICKS = 2;

/** Rod dynamic properties of the binding record (L0-pear-ent1). All six present = bound; anything less = unbound. */
export const DIM_KEY = "andrew:pr_dim";
export const POS_KEY = "andrew:pr_pos";
export const TYPE_KEY = "andrew:pr_type";
export const OWNER_KEY = "andrew:pr_owner";
export const EPOCH_KEY = "andrew:pr_epoch";
export const GEN_KEY = "andrew:pr_gen";
export const BINDING_KEYS = [DIM_KEY, POS_KEY, TYPE_KEY, OWNER_KEY, EPOCH_KEY, GEN_KEY] as const;

/** Player dynamic property: the life epoch (L0-pear-ent2, C-45). Missing = 0; PEAR-OWNER-01 bumps it on death. */
export const LIFE_EPOCH_KEY = "andrew:life_epoch";

/** The actionbar line sent on a binding; both languages are in packs/resource/texts. */
export const BOUND_MESSAGE_KEY = "andrew.pearl_rod.bound";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Binding {
  /** Dimension id, as `Dimension.id` gives it: `minecraft:overworld`, `minecraft:nether`, `minecraft:the_end`. */
  dim: string;
  /** The plate's own block cell, not the support block under it. */
  pos: Vec3;
  /** The plate's typeId at bind time. */
  type: string;
  /** `Player.id` of the binder. */
  owner: string;
  /** The binder's life epoch at bind time. */
  epoch: number;
  /** The plate generation at that cell at bind time (L0-pear-ent2). */
  gen: number;
}

/** Any vanilla pressure plate: 17 types on 1.26.51, `poplar_pressure_plate` among them (probe Q2). */
export function isPlateType(typeId: string | undefined): boolean {
  return typeId !== undefined && typeId.startsWith("minecraft:") && typeId.endsWith("pressure_plate");
}

/** The block cell a hook is in, read so that a hook resting on the support names the plate above it. */
export function hookCell(at: Vec3): Vec3 {
  return { x: Math.floor(at.x), y: Math.floor(at.y + FLOOR_EPSILON), z: Math.floor(at.z) };
}

export interface HookState {
  location: Vec3;
  velocity: Vec3;
  onGround: boolean;
  /** The hook has hit an entity: it is stuck in a mob or a player, not lying in a cell. */
  inEntity: boolean;
}

export type HookVerdict = "bind" | "in-entity" | "no-plate" | "in-flight";

/**
 * One check of a tracked hook. `cellType` is the typeId at `hookCell(hook.location)`, undefined when that cell is not
 * loaded.
 */
export function hookVerdict(hook: HookState, cellType: string | undefined): HookVerdict {
  if (hook.inEntity) return "in-entity";
  if (!isPlateType(cellType)) return "no-plate";
  const dy = hook.location.y - hookCell(hook.location).y;
  const { x, y, z } = hook.velocity;
  if (dy <= BIND_DY || hook.onGround || Math.hypot(x, y, z) < STOPPED_SPEED) return "bind";
  return "in-flight";
}

export interface HitWatch {
  /** `cellKey` of the cell the last checks said "bind" in; undefined after any other verdict. */
  cell: string | undefined;
  ticks: number;
}

export const NO_HIT: HitWatch = { cell: undefined, ticks: 0 };

export function cellKey(c: Vec3): string {
  return `${c.x},${c.y},${c.z}`;
}

/** The watch after one more check; the hook binds once `isConfirmed` says so. */
export function nextHitWatch(prev: HitWatch, verdict: HookVerdict, cell: Vec3): HitWatch {
  if (verdict !== "bind") return NO_HIT;
  const key = cellKey(cell);
  return { cell: key, ticks: prev.cell === key ? prev.ticks + 1 : 1 };
}

export function isConfirmed(watch: HitWatch): boolean {
  return watch.ticks >= HIT_CONFIRM_TICKS;
}

/** `overworld`, `nether`, `the_end`: the dimension as the lore and the generation key spell it. */
export function dimensionName(dim: string): string {
  return dim.startsWith("minecraft:") ? dim.slice("minecraft:".length) : dim;
}

/**
 * World dynamic property holding the plate generation of a cell (L0-pear-ent2). Missing = 0. PEAR-GEN-01 owns the
 * bumps and the watch set; a binding only reads it.
 */
export function generationKey(dim: string, cell: Vec3): string {
  return `andrew:pg:${dimensionName(dim)}:${cell.x}:${cell.y}:${cell.z}`;
}

/** A dynamic-property number, or 0 when it is missing or not a finite number. */
export function counterOf(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** The record as rod dynamic properties, in BINDING_KEYS order. */
export function bindingEntries(b: Binding): Array<[string, string | number | Vec3]> {
  return [
    [DIM_KEY, b.dim],
    [POS_KEY, { x: b.pos.x, y: b.pos.y, z: b.pos.z }],
    [TYPE_KEY, b.type],
    [OWNER_KEY, b.owner],
    [EPOCH_KEY, b.epoch],
    [GEN_KEY, b.gen],
  ];
}

const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isWhole = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

function isCell(v: unknown): v is Vec3 {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return isWhole(c.x) && isWhole(c.y) && isWhole(c.z);
}

/** The record a rod carries, read through `get` (the stack's getDynamicProperty); undefined when it is not whole. */
export function readBinding(get: (key: string) => unknown): Binding | undefined {
  const dim = get(DIM_KEY);
  const pos = get(POS_KEY);
  const type = get(TYPE_KEY);
  const owner = get(OWNER_KEY);
  const epoch = get(EPOCH_KEY);
  const gen = get(GEN_KEY);
  if (!isText(dim) || !isCell(pos) || !isPlateType(typeof type === "string" ? type : undefined) || !isText(owner)) return undefined;
  if (!isWhole(epoch) || !isWhole(gen)) return undefined;
  return { dim, pos: { x: pos.x, y: pos.y, z: pos.z }, type: type as string, owner, epoch, gen };
}

/** The lore of a bound rod: the title, then where it leads. The binder's name is never shown (xasm42). */
export function boundLore(b: Pick<Binding, "dim" | "pos">): string[] {
  return [LORE_TITLE, `bound: ${dimensionName(b.dim)} ${b.pos.x} ${b.pos.y} ${b.pos.z}`];
}
