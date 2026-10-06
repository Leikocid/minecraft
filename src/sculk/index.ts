// The Sculk Crossbow module. Deviations from the spec: README.md (C-16).

import { registerBolts } from "./bolt";
export { CARVE_BUDGET_PER_TICK, type CarveKind, type CarveReport, SCULK, carveBlockHit, kindOf, observeCarves, pendingCarves, probeOf, queueCarve } from "./carve";
export { CRATER_DEPTH, CRATER_HALF, type CarvePlan, type CellKind, type Face, cellAt, craterColumns, planCrater, sculkColumns } from "./crater-plan";
import { registerCarve } from "./carve";
export { PIERCING, type StripObserver, type StripReport, type StripTrigger, enchantmentsOf, observeStrips, stripPiercing } from "./enchant";
import { registerEnchant } from "./enchant";
export { HURT_WINDOW_TICKS, type HitObserver, type HitPath, type HitReport, SONIC_BOOM_DAMAGE, observeHits, setWindowWrite } from "./hit";
import { registerHit } from "./hit";
export { PATCH_REACH_DOWN, PATCH_REACH_UP, feetCell, planPatch } from "./patch";

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
  registerHit();
  registerEnchant();
  console.warn("[andrew] sculk crossbow armed (entitySpawn + projectile hits, block-hit crater, entity-hit damage and patch, piercing strip)");
}
