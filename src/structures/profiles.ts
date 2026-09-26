// Footprint-validity profiles (L0-strf-r005, L0-strf-r013). Pure: each profile
// judges samples already read from the world, so node tests drive them with
// numbers. A profile decides whether the spot fits, not which structure it is.

import type { StructureId } from "./config";

export type ProfileResult = { ok: true; y: number } | { ok: false; reason: string };
export type Gate = { ok: true } | { ok: false; reason: string };

/** One Overworld column of the footprint. */
export interface SurfaceSample {
  x: number;
  z: number;
  /** Topmost non-air block, trees and leaves included. */
  top: number;
  topType: string;
  liquid: boolean;
  /** First block under `top` that is neither foliage nor a plant (L0-xasm4 §4). */
  ground: number;
}

/** One Nether column, scanned downward (L0-strf-r013). */
export interface NetherColumn {
  x: number;
  z: number;
  /** Y of the solid block of the first air→solid transition, undefined if none in the scan range. */
  floor: number | undefined;
  /** First non-air block below the scan start is lava at or under the lava-sea level. */
  lavaSea: boolean;
  /** Inside the inner 60 % of the footprint, where one lava-sea column rejects. */
  inner: boolean;
}

export interface DryLandSpec {
  maxLiquidShare: number;
  /** Sample only the centre and the 8-point ring instead of the full grid. */
  centreRing?: boolean;
}

export interface FlatSpec {
  maxSpread: number;
}

export interface AltitudeSpec {
  minClearance: number;
  maxClearance: number;
}

export interface DepthSpec {
  topMin: number;
  topMax: number;
}

export interface NetherFloorSpec {
  scanTop: number;
  scanBottom: number;
  lavaSeaY: number;
  innerShare: number;
  supportedShare: number;
  tolerance: number;
  /** The AABB must stay below this Y (L0-strf-r003). */
  ceilingY: number;
}

export type Vertical = "surface" | "altitude" | "depth" | "netherFloor";

export interface SiteProfile {
  vertical: Vertical;
  dryLand?: DryLandSpec;
  flat?: FlatSpec;
  altitude?: AltitudeSpec;
  depth?: DepthSpec;
  netherFloor?: NetherFloorSpec;
}

/** §4.6, §5.4, §13, §14.2; the Airship's 10 % is L0-strf-as02. */
export const PROFILES: Readonly<Record<StructureId, SiteProfile>> = {
  windmill: { vertical: "surface", dryLand: { maxLiquidShare: 0.05 }, flat: { maxSpread: 3 } },
  airship: { vertical: "altitude", dryLand: { maxLiquidShare: 0.1 }, altitude: { minClearance: 40, maxClearance: 70 } },
  warden_city: { vertical: "depth", dryLand: { maxLiquidShare: 0, centreRing: true }, depth: { topMin: -45, topMax: -35 } },
  bastion: {
    vertical: "netherFloor",
    netherFloor: { scanTop: 110, scanBottom: 32, lavaSeaY: 32, innerShare: 0.6, supportedShare: 0.8, tolerance: 3, ceilingY: 122 },
  },
};

const seeded = (unit: number, lo: number, hi: number): number => lo + Math.min(hi - lo, Math.floor(unit * (hi - lo + 1)));

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
}

export function dryLand(samples: readonly SurfaceSample[], spec: DryLandSpec): Gate {
  if (samples.length === 0) return { ok: false, reason: "liquid" };
  const wet = samples.filter((s) => s.liquid).length;
  return wet / samples.length <= spec.maxLiquidShare ? { ok: true } : { ok: false, reason: "liquid" };
}

export function flat(samples: readonly SurfaceSample[], spec: FlatSpec): Gate {
  const ys = samples.map((s) => s.ground);
  return Math.max(...ys) - Math.min(...ys) <= spec.maxSpread ? { ok: true } : { ok: false, reason: "uneven" };
}

/**
 * The structure's bottom layer sits one above the median ground, so on a
 * spread of up to 3 it is buried at most that much and floats at most that much.
 */
export const surfaceY = (samples: readonly SurfaceSample[]): number => median(samples.map((s) => s.ground)) + 1;

/**
 * `maxTop` includes trees (§5.4). The seeded clearance is lowered to the
 * minimum before giving up on the ceiling; `worldTop` is the first Y above the
 * build limit (`heightRange.max`).
 */
export function altitude(maxTop: number, height: number, unit: number, worldTop: number, spec: AltitudeSpec): ProfileResult {
  const fits = (bottom: number): boolean => bottom + height - 1 <= worldTop - 1;
  const bottom = maxTop + seeded(unit, spec.minClearance, spec.maxClearance);
  if (fits(bottom)) return { ok: true, y: bottom };
  const lowest = maxTop + spec.minClearance;
  return fits(lowest) ? { ok: true, y: lowest } : { ok: false, reason: "ceiling" };
}

/** Seeded top Y in [topMin, topMax]; the bottom must stay above the bedrock band. */
export function depth(height: number, unit: number, worldBottom: number, spec: DepthSpec): ProfileResult {
  const bottom = seeded(unit, spec.topMin, spec.topMax) - height + 1;
  return bottom >= worldBottom + 1 ? { ok: true, y: bottom } : { ok: false, reason: "floor" };
}

export function netherFloor(columns: readonly NetherColumn[], height: number, spec: NetherFloorSpec): ProfileResult {
  if (columns.some((c) => c.inner && c.lavaSea)) return { ok: false, reason: "lavaOcean" };
  const floors = columns.map((c) => c.floor).filter((f): f is number => f !== undefined);
  if (floors.length === 0) return { ok: false, reason: "floor" };
  const mid = median(floors);
  const supported = floors.filter((f) => Math.abs(f - mid) <= spec.tolerance).length;
  if (supported / columns.length < spec.supportedShare) return { ok: false, reason: "uneven" };
  const y = mid + 1;
  return y + height - 1 < spec.ceilingY ? { ok: true, y } : { ok: false, reason: "ceiling" };
}
