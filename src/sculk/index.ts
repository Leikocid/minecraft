// The Sculk Crossbow module. Deviations from the spec: README.md (C-16).

import { registerBolts } from "./bolt";
export { CARVE_BUDGET_PER_TICK, type CarveReport, SCULK, carveBlockHit, kindOf, observeCarves, pendingCarves, probeOf } from "./carve";
export { CRATER_DEPTH, CRATER_HALF, type CarvePlan, type CellKind, type Face, cellAt, craterColumns, planCrater, sculkColumns } from "./crater-plan";
import { registerCarve } from "./carve";

export {
  BOLT_ID,
  BOLT_LIFETIME_TICKS,
  type BoltEvent,
  type BoltObserver,
  type BoltRecord,
  type ExpiryReason,
  type HitBlock,
  MULTISHOT_YAW_DEGREES,
  TRAIL_PARTICLE,
  TRAIL_PER_TICK,
  boltLoopRunning,
  boltLoopStarts,
  launchBolt,
  liveBoltCount,
  observeBolts,
} from "./bolt";

export function registerSculkCrossbow(): void {
  registerBolts();
  registerCarve();
  console.warn("[andrew] sculk crossbow armed (entitySpawn + projectile hits, block-hit crater)");
}
