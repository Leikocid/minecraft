// Target choice for the Scythe's volley over plain values (spec §3). Pure:
// nothing from @minecraft/server is imported at runtime, so node tests bundle
// this file without a stub. Line of sight needs the world and arrives as a
// callback; everything else is decided here.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TargetCandidate {
  id: string;
  location: Vec3;
  dimensionId: string;
  hidden: boolean;
}

export interface TargetOwner {
  id: string;
  location: Vec3;
  dimensionId: string;
  viewDirection: Vec3;
}

export const TARGET_RADIUS = 20;

/** Two distances closer than this are a tie, settled by the owner's gaze (spec §3). */
export const TIE_EPSILON = 0.5;

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Cosine between the owner's view and the direction owner → `to`; 1 is dead ahead. */
export function gazeAlignment(owner: TargetOwner, to: Vec3): number {
  const d = { x: to.x - owner.location.x, y: to.y - owner.location.y, z: to.z - owner.location.z };
  const len = Math.hypot(d.x, d.y, d.z);
  const view = owner.viewDirection;
  const viewLen = Math.hypot(view.x, view.y, view.z);
  if (len === 0 || viewLen === 0) {
    return -Infinity;
  }
  return (d.x * view.x + d.y * view.y + d.z * view.z) / (len * viewLen);
}

/** Everyone the rules allow before line of sight, nearest first. */
export function eligibleCandidates(owner: TargetOwner, candidates: ReadonlyArray<TargetCandidate>): TargetCandidate[] {
  return candidates
    .filter(
      (c) =>
        c.id !== owner.id &&
        c.dimensionId === owner.dimensionId &&
        !c.hidden &&
        distance(owner.location, c.location) <= TARGET_RADIUS
    )
    .sort((a, b) => distance(owner.location, a.location) - distance(owner.location, b.location));
}

/**
 * The target, or undefined when nobody qualifies.
 *
 * The tie window is anchored on the nearest *visible* candidate, not on the
 * nearest one overall: a player behind a wall neither wins nor widens the
 * window. `isVisible` is called lazily, nearest first, and stops once a
 * candidate lies beyond the window — raycasts are the only costly step.
 */
export function pickTarget(
  owner: TargetOwner,
  candidates: ReadonlyArray<TargetCandidate>,
  isVisible: (candidate: TargetCandidate) => boolean = () => true
): TargetCandidate | undefined {
  let nearest: number | undefined;
  let best: TargetCandidate | undefined;
  let bestAlignment = -Infinity;

  for (const c of eligibleCandidates(owner, candidates)) {
    const d = distance(owner.location, c.location);
    if (nearest !== undefined && d > nearest + TIE_EPSILON) {
      break;
    }
    if (!isVisible(c)) {
      continue;
    }
    nearest ??= d;
    const alignment = gazeAlignment(owner, c.location);
    if (best === undefined || alignment > bestAlignment) {
      best = c;
      bestAlignment = alignment;
    }
  }
  return best;
}

/** Sample points strictly between `from` and `to`, at most `step` apart. */
export function rayPoints(from: Vec3, to: Vec3, step = 0.5): Vec3[] {
  const len = distance(from, to);
  const n = Math.max(1, Math.ceil(len / step));
  const points: Vec3[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    points.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t });
  }
  return points;
}

/**
 * Integer block cells the ray passes through, in order, without repeats, and
 * without the two cells the eyes themselves sit in: a head inside a slab or a
 * cobweb is not a wall between the two players.
 */
export function rayCells(from: Vec3, to: Vec3, step = 0.5): Vec3[] {
  const key = (c: Vec3): string => `${Math.floor(c.x)},${Math.floor(c.y)},${Math.floor(c.z)}`;
  const seen = new Set<string>([key(from), key(to)]);
  const cells: Vec3[] = [];
  for (const p of rayPoints(from, to, step)) {
    const cell = { x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) };
    const k = key(cell);
    if (!seen.has(k)) {
      seen.add(k);
      cells.push(cell);
    }
  }
  return cells;
}

/** A deadline in epoch ms still in the future; anything but a number is "not hidden". */
export function isHiddenAt(nowMs: number, hiddenUntil: unknown): boolean {
  return typeof hiddenUntil === "number" && hiddenUntil > nowMs;
}
