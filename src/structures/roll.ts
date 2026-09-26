// Per-chunk roll (L0-strf-r001, ADR L0-strf-d001): every outcome is a pure
// function of (salt, dim, cx, cz, def, purpose), recomputed on every visit.
// Nothing random at runtime may enter here — a lost write must re-roll the same.

import type { RollDef } from "./config";
import { type DimShort, type Rotation, type Vec3, forcedOutcome } from "./registry";

const CHUNK = 16;

/**
 * FNV-1a over UTF-16 code units, then the murmur3 finaliser. Golden values are
 * pinned by tests: changing this function moves every structure in every world.
 */
export function hash32(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export const rollKey = (salt: string, dim: DimShort, cx: number, cz: number, def: string, purpose: string): string =>
  `${salt}|${dim}|${cx}|${cz}|${def}|${purpose}`;

/** Uniform in [0, 1). */
export const rollUnit = (salt: string, dim: DimShort, cx: number, cz: number, def: string, purpose: string): number =>
  hash32(rollKey(salt, dim, cx, cz, def, purpose)) / 0x100000000;

/** The test hook's forced outcome wins over the hash (L0-strf-d001). */
export function rollHit(salt: string, dim: DimShort, cx: number, cz: number, def: RollDef): boolean {
  const forced = forcedOutcome(def.id, dim, cx, cz);
  if (forced !== undefined) return forced;
  return rollUnit(salt, dim, cx, cz, def.id, "roll") < def.chance;
}

export const rollRotation = (salt: string, dim: DimShort, cx: number, cz: number, def: string): Rotation =>
  (hash32(rollKey(salt, dim, cx, cz, def, "rot")) % 4) as Rotation;

export const rotatedSize = (size: Vec3, rot: Rotation): Vec3 =>
  rot % 2 === 0 ? [size[0], size[1], size[2]] : [size[2], size[1], size[0]];

/** Registry id of the roll candidate; one per (def, dim, chunk), so a re-roll finds its own record. */
export const candidateId = (def: string, dim: DimShort, cx: number, cz: number): string => `${def}:${dim}:${cx}:${cz}`;

export interface Candidate {
  id: string;
  def: RollDef;
  dim: DimShort;
  cx: number;
  cz: number;
  rot: Rotation;
  /** Rotated size. */
  size: Vec3;
  /** Min corner x and z; y belongs to the site's vertical solver. */
  x: number;
  z: number;
}

/** The footprint is centred on the rolled chunk's centre, no jitter (L0-strf-as01). */
export function buildCandidate(salt: string, dim: DimShort, cx: number, cz: number, def: RollDef): Candidate {
  const rot = rollRotation(salt, dim, cx, cz, def.id);
  const size = rotatedSize(def.size, rot);
  return {
    id: candidateId(def.id, dim, cx, cz),
    def,
    dim,
    cx,
    cz,
    rot,
    size,
    x: cx * CHUNK + CHUNK / 2 - Math.floor(size[0] / 2),
    z: cz * CHUNK + CHUNK / 2 - Math.floor(size[2] / 2),
  };
}
