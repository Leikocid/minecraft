// Forced site preparation for the spawn Windmill only (§4.7.9–12,
// L0-wind-p003, -r008..-r010): the one place the add-on reshapes terrain.
// Plan first, pre-check the whole write volume, write only after every check
// passed. Engine objects come in through PrepWorld, so node tests run the same
// planner over a fake world.

import type { BlockTypes, BlockVolume, Dimension } from "@minecraft/server";
import { type Box, FILL_CELL_LIMIT, cells, sliceBox } from "./clear";
import { type CollisionKind, collisionBox, instanceCollision, scanCollision } from "./collision";
import { type DimShort, type Registry, type Vec3, COLLISION_MARGIN } from "./registry";
import { type BlockView, dimensionView, isLiquid, surfaceSample } from "./site";

/** Blend band width and its ceiling (L0-wind-as03). */
export const BAND = 6;
export const BAND_MAX = 12;
/** Shallow-void depth under the new surface (L0-wind-as04): deeper cave volume stays open. */
export const VOID_DEPTH = 4;
/** Largest step between neighbouring columns the band leaves behind. */
export const MAX_STEP = 1;
/** Liquid share of the plot a forced site may have (§4.7.9 "сухую"). */
export const MAX_LIQUID_SHARE = 0.05;

const AIR = "minecraft:air";
const FALLBACK_SURFACE = "minecraft:grass_block";
const SUBSOIL = "minecraft:dirt";

/**
 * Natural terrain and vegetation (L0-wind-r008). A block outside this list
 * anywhere in the write volume stops the preparation before its first write;
 * crafted look-alikes (`cut_`, `chiseled_`, `polished_`, `smooth_`, bricks,
 * `_slab`, `_stairs`, `_wall`) never match.
 */
const NATURAL =
  /^minecraft:(air|water|flowing_water|lava|flowing_lava|dirt|coarse_dirt|grass_block|grass_path|podzol|mycelium|rooted_dirt|dirt_with_roots|mud|clay|sand|red_sand|gravel|sandstone|red_sandstone|stone|granite|diorite|andesite|deepslate|tuff|calcite|dripstone_block|pointed_dripstone|moss_block|moss_carpet|snow|snow_layer|powder_snow|ice|packed_ice|blue_ice|obsidian|magma|hardened_clay|(white|orange|yellow|brown|red|light_gray)_terracotta|[a-z_]+_ore|[a-z_]+_log|[a-z_]+_leaves|azalea_leaves_flowered|mangrove_roots|muddy_mangrove_roots|vine|glow_lichen|seagrass|kelp|kelp_plant|waterlily|sugar_cane|cactus|bamboo|sweet_berry_bush|short_grass|tall_grass|fern|large_fern|deadbush|bush|firefly_bush|leaf_litter|wildflowers|pink_petals|[a-z_]*sapling|dandelion|poppy|blue_orchid|allium|azure_bluet|[a-z_]+_tulip|oxeye_daisy|cornflower|lily_of_the_valley|sunflower|lilac|rose_bush|peony|red_flower|yellow_flower|double_plant|tallgrass|brown_mushroom|red_mushroom|brown_mushroom_block|red_mushroom_block|mushroom_stem|azalea|flowering_azalea|big_dripleaf|small_dripleaf_block|hanging_roots|spore_blossom|cave_vines|cave_vines_body_with_berries|cave_vines_head_with_berries|pumpkin|melon_block|cocoa|bee_nest|torchflower|pitcher_plant)$/;

/** Air, liquids and plants: what a shallow-void fill may replace. */
const REPLACEABLE =
  /^minecraft:(air|water|flowing_water|lava|flowing_lava|seagrass|kelp|kelp_plant|short_grass|tall_grass|fern|large_fern|deadbush|bush|firefly_bush|leaf_litter|wildflowers|pink_petals|[a-z_]*sapling|dandelion|poppy|blue_orchid|allium|azure_bluet|[a-z_]+_tulip|oxeye_daisy|cornflower|lily_of_the_valley|sunflower|lilac|rose_bush|peony|red_flower|yellow_flower|double_plant|tallgrass|brown_mushroom|red_mushroom|snow_layer|vine|glow_lichen|sweet_berry_bush|hanging_roots|torchflower)$/;

/** Sand and gravel fall; a column raised over air never gets them as its top. */
const GRAVITY = /^minecraft:(sand|red_sand|gravel|suspicious_sand|suspicious_gravel)$/;

export const isNatural = (id: string): boolean => NATURAL.test(id);
export const isReplaceable = (id: string): boolean => REPLACEABLE.test(id);

export interface PrepWorld {
  view: BlockView;
  /** Whether any block in the inclusive box is neither natural nor air; undefined if part of it is unloaded. */
  foreign(min: Vec3, max: Vec3): boolean | undefined;
  /** One engine fill; `replace` limits it to those block types. The box never exceeds FILL_CELL_LIMIT. */
  fill(box: Box, block: string, replace?: "voids"): void;
}

export interface PrepColumn {
  x: number;
  z: number;
  /** Chebyshev distance from the plot; 0 inside it. */
  ring: number;
  /** Natural ground Y (first block under trees and plants). */
  ground: number;
  /** Topmost non-air Y, trees included. */
  top: number;
  surface: string;
  /** The ground Y after preparation. */
  target: number;
}

export interface PrepWrite {
  kind: "clear" | "void" | "surface";
  box: Box;
  block: string;
}

export interface PrepPlan {
  /** Min corner of the plot, x/z. */
  plot: { x: number; z: number; side: number };
  targetY: number;
  band: number;
  /** True when BAND_MAX could not absorb the height difference at the band's outer edge. */
  steep: boolean;
  columns: PrepColumn[];
  writes: PrepWrite[];
  /** Every block the plan may change lies in this box; the collision scan covers it plus the margin. */
  volume: Box;
  cut: number;
  fill: number;
}

export type PrepVerdict =
  | { ok: true; plan: PrepPlan }
  | { ok: false; reason: "unloaded" | "liquid" | "foreign" | `collision:${CollisionKind}`; plan?: PrepPlan };

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
}

const ringOf = (x: number, z: number, px: number, pz: number, side: number): number =>
  Math.max(px - x, x - (px + side - 1), 0, pz - z, z - (pz + side - 1));

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Top block for a column: its own surface family, never a falling block over a void. */
function surfaceFor(natural: string, raised: boolean): string {
  if (natural === AIR || isLiquid(natural) || !isNatural(natural) || natural === SUBSOIL) return FALLBACK_SURFACE;
  if (raised && GRAVITY.test(natural)) return natural === "minecraft:gravel" ? SUBSOIL : "minecraft:sandstone";
  if (/_log$|_leaves$|mushroom_block|mushroom_stem/.test(natural)) return FALLBACK_SURFACE;
  return natural;
}

/**
 * Band columns follow `clamp(ground, Yt - k, Yt + k)` at ring k, so a step
 * between neighbours is never larger than the natural step there, or 1. The
 * band is wide enough when the first untouched ring is inside that envelope.
 */
function chooseBand(ground: (x: number, z: number) => number | undefined, px: number, pz: number, side: number, yt: number): { band: number; steep: boolean } | undefined {
  for (let b = BAND; b <= BAND_MAX; b++) {
    const k = b + 1;
    let fits = true;
    for (let x = px - k; x <= px + side - 1 + k && fits; x++) {
      for (let z = pz - k; z <= pz + side - 1 + k; z++) {
        if (ringOf(x, z, px, pz, side) !== k) continue;
        const g = ground(x, z);
        if (g === undefined) return undefined;
        if (Math.abs(g - yt) > k) {
          fits = false;
          break;
        }
      }
    }
    if (fits) return { band: b, steep: false };
  }
  return { band: BAND_MAX, steep: true };
}

/**
 * Read the plot and its surroundings and plan the writes; nothing is written.
 * `px`/`pz` is the plot's min corner. `fixed` replays a plan whose writes may
 * have partly run before a restart: with the same target and band every write
 * lands on the same Y again.
 */
export function planPrep(view: BlockView, px: number, pz: number, side: number, fixed?: { targetY: number; band: number }): PrepVerdict {
  const reach = BAND_MAX + 1;
  const samples = new Map<string, { ground: number; top: number; liquid: boolean }>();
  const read = (x: number, z: number) => {
    const k = `${x},${z}`;
    let s = samples.get(k);
    if (s === undefined) {
      const r = surfaceSample(view, x, z);
      if (r === undefined) return undefined;
      s = { ground: r.ground, top: r.top, liquid: r.liquid };
      samples.set(k, s);
    }
    return s;
  };

  const plotGround: number[] = [];
  let wet = 0;
  for (let x = px; x < px + side; x++) {
    for (let z = pz; z < pz + side; z++) {
      const s = read(x, z);
      if (s === undefined) return { ok: false, reason: "unloaded" };
      plotGround.push(s.ground);
      if (s.liquid) wet++;
    }
  }
  if (fixed === undefined && wet / plotGround.length > MAX_LIQUID_SHARE) return { ok: false, reason: "liquid" };
  const yt = fixed?.targetY ?? median(plotGround);

  for (let x = px - reach; x < px + side + reach; x++) {
    for (let z = pz - reach; z < pz + side + reach; z++) if (read(x, z) === undefined) return { ok: false, reason: "unloaded" };
  }
  const chosen = fixed !== undefined ? { band: fixed.band, steep: false } : chooseBand((x, z) => read(x, z)?.ground, px, pz, side, yt);
  if (chosen === undefined) return { ok: false, reason: "unloaded" };
  const { band, steep } = chosen;

  const columns: PrepColumn[] = [];
  const writes: PrepWrite[] = [];
  let cut = 0;
  let fill = 0;
  let maxTop = yt;
  let minTarget = yt;
  let plotTop = yt;
  const plotSurface = new Map<string, number>();

  for (let x = px - band; x < px + side + band; x++) {
    for (let z = pz - band; z < pz + side + band; z++) {
      const s = read(x, z);
      if (s === undefined) return { ok: false, reason: "unloaded" };
      const ring = ringOf(x, z, px, pz, side);
      const target = ring === 0 ? yt : clamp(s.ground, yt - ring, yt + ring);
      const natural = view.typeAt(x, s.ground, z);
      if (natural === undefined) return { ok: false, reason: "unloaded" };
      const surface = surfaceFor(natural, target > s.ground);
      columns.push({ x, z, ring, ground: s.ground, top: s.top, surface, target });
      cut += Math.max(0, s.ground - target);
      fill += Math.min(VOID_DEPTH + 1, Math.max(0, target - s.ground));
      maxTop = Math.max(maxTop, s.top);
      minTarget = Math.min(minTarget, target);
      if (ring === 0) {
        plotTop = Math.max(plotTop, s.top);
        plotSurface.set(surface, (plotSurface.get(surface) ?? 0) + 1);
      }
    }
  }

  // Order is the contract: clear top-down first, so nothing above is left
  // floating; then the voids under the new surface; then the surface itself.
  if (plotTop > yt) writes.push({ kind: "clear", box: { min: [px, yt + 1, pz], max: [px + side - 1, plotTop, pz + side - 1] }, block: AIR });
  for (const c of columns) {
    if (c.ring === 0 || c.top <= c.target) continue;
    writes.push({ kind: "clear", box: { min: [c.x, c.target + 1, c.z], max: [c.x, c.top, c.z] }, block: AIR });
  }
  writes.push({ kind: "void", box: { min: [px, yt - VOID_DEPTH, pz], max: [px + side - 1, yt - 1, pz + side - 1] }, block: SUBSOIL });
  for (const c of columns) {
    if (c.ring === 0) continue;
    writes.push({ kind: "void", box: { min: [c.x, c.target - VOID_DEPTH, c.z], max: [c.x, c.target - 1, c.z] }, block: SUBSOIL });
  }
  const topSurface = [...plotSurface.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? FALLBACK_SURFACE;
  writes.push({ kind: "surface", box: { min: [px, yt, pz], max: [px + side - 1, yt, pz + side - 1] }, block: topSurface });
  for (const c of columns) {
    if (c.ring === 0) continue;
    writes.push({ kind: "surface", box: { min: [c.x, c.target, c.z], max: [c.x, c.target, c.z] }, block: c.surface });
  }

  const volume: Box = {
    min: [px - band, minTarget - VOID_DEPTH, pz - band],
    max: [px + side - 1 + band, Math.max(maxTop, yt), pz + side - 1 + band],
  };
  return { ok: true, plan: { plot: { x: px, z: pz, side }, targetY: yt, band, steep, columns, writes, volume, cut, fill } };
}

/**
 * The pre-check (L0-wind-r008): the write volume plus the collision margin
 * holds no spawner, structure signature or player block, no registry record,
 * and every block the writes can touch is natural. Runs before the first write.
 */
export function precheck(world: PrepWorld, plan: PrepPlan, dim: DimShort, registry?: Registry, selfId?: string): PrepVerdict {
  const { min, max } = plan.volume;
  const size: Vec3 = [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1];
  if (registry !== undefined && instanceCollision(registry, dim, min, size, selfId) !== undefined) {
    return { ok: false, reason: "collision:instance", plan };
  }
  const scan = scanCollision(world.view, dim, collisionBox(min, size, COLLISION_MARGIN));
  if (scan.kind === "unloaded") return { ok: false, reason: "unloaded", plan };
  if (scan.kind === "hit") return { ok: false, reason: `collision:${scan.collision}`, plan };
  for (const w of plan.writes) {
    for (const s of sliceBox(w.box)) {
      const f = world.foreign(s.min, s.max);
      if (f === undefined) return { ok: false, reason: "unloaded", plan };
      if (f) return { ok: false, reason: "foreign", plan };
    }
  }
  return { ok: true, plan };
}

export interface PrepStats {
  calls: number;
  /** Cells of the largest single fill call. */
  maxCells: number;
  /** Cells of the plot's clear box, which is the one volume that can exceed the engine cap. */
  plotClearCells: number;
  plotClearCalls: number;
}

/**
 * Apply a pre-checked plan, one fill call per slice, yielding every `perYield`
 * calls so a caller can spread the work over ticks. Returns the call stats.
 */
export function* applyPrep(world: PrepWorld, plan: PrepPlan, perYield = 256): Generator<void, PrepStats, void> {
  const stats: PrepStats = { calls: 0, maxCells: 0, plotClearCells: 0, plotClearCalls: 0 };
  const side = plan.plot.side;
  for (const w of plan.writes) {
    const plotClear = w.kind === "clear" && w.box.max[0] - w.box.min[0] + 1 === side && w.box.max[2] - w.box.min[2] + 1 === side;
    if (plotClear) stats.plotClearCells += cells(w.box);
    for (const s of sliceBox(w.box, FILL_CELL_LIMIT)) {
      world.fill(s, w.block, w.kind === "void" ? "voids" : undefined);
      stats.calls++;
      stats.maxCells = Math.max(stats.maxCells, cells(s));
      if (plotClear) stats.plotClearCalls++;
      if (stats.calls % perYield === 0) yield;
    }
  }
  return stats;
}

/** Ground heights after preparation, as read back from the world (for checks and logs). */
export function largestStep(heights: ReadonlyMap<string, number>): { step: number; at: string } {
  let best = { step: 0, at: "" };
  for (const [k, h] of heights) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [0, 1]]) {
      const n = heights.get(`${x + dx},${z + dz}`);
      if (n === undefined) continue;
      const step = Math.abs(n - h);
      if (step > best.step) best = { step, at: `${x},${z}->${x + dx},${z + dz}` };
    }
  }
  return best;
}

// ------------------------------------------------------------ engine adapter

export interface PrepEngineApi {
  BlockVolume: typeof BlockVolume;
  BlockTypes: typeof BlockTypes;
}

/** Engine query volume cap, as for fillBlocks (probe Q10). */
const QUERY_CELLS = 32768;

export function enginePrepWorld(dim: Dimension, api: PrepEngineApi): PrepWorld {
  const all = api.BlockTypes.getAll().map((t) => t.id);
  const natural = all.filter(isNatural);
  const replaceable = all.filter(isReplaceable);
  const view = dimensionView(dim, api);
  const vol = (b: Box): BlockVolume => new api.BlockVolume({ x: b.min[0], y: b.min[1], z: b.min[2] }, { x: b.max[0], y: b.max[1], z: b.max[2] });
  return {
    view,
    foreign(min, max) {
      const y0 = Math.max(min[1], dim.heightRange.min);
      const y1 = Math.min(max[1], dim.heightRange.max - 1);
      if (y0 > y1) return false;
      for (const s of sliceBox({ min: [min[0], y0, min[2]], max: [max[0], y1, max[2]] }, QUERY_CELLS)) {
        try {
          if (dim.containsBlock(vol(s), { excludeTypes: natural }, false)) return true;
        } catch (e) {
          if (e instanceof Error && /unloaded/i.test(`${e.name} ${e.message}`)) return undefined;
          throw e;
        }
      }
      return false;
    },
    fill(box, block, replace) {
      dim.fillBlocks(vol(box), block, replace === "voids" ? { blockFilter: { includeTypes: replaceable } } : undefined);
    },
  };
}
