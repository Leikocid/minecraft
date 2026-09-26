// The Mini Warden City's body (L0-wrdn): its template, its 10 chests on the
// vanilla Ancient City table and its surface marker. Generation, persistence
// and loot rules are strf's and loot's (L0-strf-r002, r006..r008, L0-loot);
// the 5 % roll and the `depth` profile are theirs too. No guard step (§13.5):
// a Warden comes only through the template's shriekers.
//
// The city has two spots: the box underground and the marker on the surface
// over its centre. The marker is an ExtraSpot of the site gate, so it is
// loaded, judged and collision-checked with the box before the first write,
// and a bad marker cancels the whole candidate.

import type { TypeBody } from "../bodies";
import type { Box } from "../collision";
import { ANCIENT_CITY } from "../loot";
import type { BlockEdit, TemplateCtx } from "../place";
import type { Vec3 } from "../registry";
import type { Candidate } from "../roll";
import { type BlockView, type ExtraSpot, isFoliage, surfaceSample } from "../site";
import { CHESTS, WARDEN_CITY_ID, WARDEN_CITY_SIZE, markerColumns } from "../templates/warden-city";

const AIR = "minecraft:air";
const SCULK = "minecraft:sculk";
const VEIN = "minecraft:sculk_vein";
/** Bit 0 is the down face: the vein lies on the block under it. */
const VEIN_STATES = { multi_face_direction_bits: 1 };
/** Plants a vein may replace; a trunk, a stem or a leaf block is never cut to make room. */
const REPLACEABLE = /(short_grass|tall_grass|fern|^minecraft:grass$|snow_layer|leaf_litter|flower|tulip|poppy|dandelion|orchid|allium|bluet|daisy|cornflower|lily_of|wildflowers|pink_petals|bush)/;

/**
 * Ground of a marker column: the topmost block that is neither air, foliage,
 * nor a vein this marker laid before. Skipping veins makes a repeat find the
 * same ground. Undefined on an unloaded read.
 */
export function markerGround(read: Pick<BlockView, "typeAt" | "minY"> & { topmost: BlockEdit["topmost"] }, x: number, z: number): number | undefined {
  const top = read.topmost(x, z);
  if (top === undefined) return undefined;
  let y = top.y;
  let t = top.typeId;
  while ((t === AIR || t === VEIN || isFoliage(t)) && y > read.minY) {
    y--;
    const next = read.typeAt(x, y, z);
    if (next === undefined) return undefined;
    t = next;
  }
  return y;
}

export const markerCells = (c: Pick<Candidate, "x" | "z" | "rot">) => markerColumns([c.x, 0, c.z], c.rot);

/**
 * §13.3: every marker column on dry ground, and that ground above the city's
 * top so that digging down from the marker passes rock before the roof. The
 * returned box covers the ground layer and the vein layer over it.
 */
export const MARKER_SPOT: ExtraSpot = {
  label: "marker",
  columns: (c) => markerCells(c).map((m): [number, number] => [m.x, m.z]),
  check(view, c, y) {
    const top = y + c.size[1] - 1;
    const min: Vec3 = [Infinity, Infinity, Infinity];
    const max: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const m of markerCells(c)) {
      const s = surfaceSample(view, m.x, m.z);
      if (s === undefined) return undefined;
      if (s.liquid) return { ok: false, reason: "liquid" };
      const ground = markerGround(view, m.x, m.z);
      if (ground === undefined) return undefined;
      if (ground <= top) return { ok: false, reason: "no-cover" };
      const p: Vec3 = [m.x, ground, m.z];
      for (let i = 0; i < 3; i++) [min[i], max[i]] = [Math.min(min[i], p[i]), Math.max(max[i], p[i])];
    }
    max[1] += 1;
    const box: Box = { min, max };
    return { ok: true, box };
  },
};

/**
 * Lays the marker over the placed city: a sculk cell replaces its column's
 * ground, a vein lies on the ground where only air or a plant stands. A
 * repeat after a crash writes the same cells. Throws on an unloaded column:
 * the place step is then not marked done and runs again.
 */
export function layMarker(ctx: TemplateCtx, edit: BlockEdit, minY: number): { at: Vec3; kind: "sculk" | "vein"; laid: boolean }[] {
  const read = { ...edit, minY };
  return markerCells({ x: ctx.instance.origin[0], z: ctx.instance.origin[2], rot: ctx.instance.rot }).map((m) => {
    const ground = markerGround(read, m.x, m.z);
    if (ground === undefined) throw new Error(`warden marker: column ${m.x},${m.z} unloaded`);
    if (m.kind === "sculk") {
      edit.set([m.x, ground, m.z], SCULK);
      return { at: [m.x, ground, m.z], kind: m.kind, laid: true };
    }
    const above = edit.typeAt(m.x, ground + 1, m.z);
    if (above === undefined) throw new Error(`warden marker: column ${m.x},${m.z} unloaded`);
    const laid = above === AIR || above === VEIN || REPLACEABLE.test(above);
    if (laid) edit.set([m.x, ground + 1, m.z], VEIN, VEIN_STATES);
    return { at: [m.x, ground + 1, m.z], kind: m.kind, laid };
  });
}

/** Below every Overworld column; the ground walk never needs to go lower. */
const OVERWORLD_MIN_Y = -64;

export const WARDEN_CITY_BODY: TypeBody = {
  templateId: WARDEN_CITY_ID,
  standIn: false,
  size: [...WARDEN_CITY_SIZE],
  chests: CHESTS.map((c) => ({ local: [...c.at] as Vec3, table: ANCIENT_CITY })),
  spot: MARKER_SPOT,
  decorate: (ctx, edit) => void layMarker(ctx, edit, OVERWORLD_MIN_Y),
};
