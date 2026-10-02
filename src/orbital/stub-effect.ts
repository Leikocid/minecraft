// Placeholder effects for both modes, so the core and the charge's flight can
// be proven on BDS before any block is removed. The real effects replace them
// through registerEffect(). Type-only engine imports.

import type { Vector3 } from "@minecraft/server";
import { type Column, type Effect, type Mode, registerEffect } from "./charge";
import { RING_MIN_RANGE } from "./ring-layout";

/** About the charge count of the real five rings (L0-xasm8). */
export const STUB_RMB_COLUMNS = 160;

export const STUB_SOUND = "random.explode";

const GRID_RADIUS = 7;

/** The STUB_RMB_COLUMNS grid columns nearest the target's, the target's own first. */
export function stubGrid(target: Vector3): Column[] {
  const offsets: Column[] = [];
  for (let x = -GRID_RADIUS; x <= GRID_RADIUS; x++) {
    for (let z = -GRID_RADIUS; z <= GRID_RADIUS; z++) offsets.push({ x, z });
  }
  offsets.sort((a, b) => a.x * a.x + a.z * a.z - (b.x * b.x + b.z * b.z) || a.x - b.x || a.z - b.z);
  return offsets.slice(0, STUB_RMB_COLUMNS).map((o) => ({ x: target.x + o.x, z: target.z + o.z }));
}

function stub(scale: 0 | 1, layout: (target: Vector3) => Column[], minRange?: number): Effect {
  return {
    layout,
    scale,
    minRange,
    onDetonate(dim, point, ownerId, mode: Mode, attackId) {
      console.warn(
        `[andrew] orbital stub ${mode}: detonation at ${point.x},${point.y},${point.z} in ${dim.id}, attack ${attackId}, owner ${ownerId}`
      );
      dim.playSound(STUB_SOUND, point);
    },
  };
}

export const STUB_EFFECTS: Readonly<Record<Mode, Effect>> = {
  lmb: stub(1, (target) => [{ x: target.x, z: target.z }]),
  // The stub stands in for the rings, so it refuses the same near targets: a
  // stand-in that accepts a shot the real effect would refuse makes every
  // scenario built on it measure the wrong rule.
  rmb: stub(0, stubGrid, RING_MIN_RANGE),
};

export function registerStubEffect(): void {
  registerEffect("lmb", STUB_EFFECTS.lmb);
  registerEffect("rmb", STUB_EFFECTS.rmb);
}
