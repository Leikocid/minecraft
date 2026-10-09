// Damage the pack deals by script as an entityAttack. beforeEvents.entityHurt runs inside applyDamage, and there a
// scripted entityAttack with a damaging entity reads exactly like that entity's melee: a melee handler (the Storm
// Blade passive) asks isScriptedDamage() instead. Every product applyDamage with cause entityAttack goes through here
// (tests/storm-passive.test.mjs checks it).

import type { Entity, EntityApplyDamageOptions } from "@minecraft/server";

let depth = 0;

export function applyScriptedDamage(target: Entity, amount: number, options?: EntityApplyDamageOptions): boolean {
  depth++;
  try {
    return target.applyDamage(amount, options);
  } finally {
    depth--;
  }
}

/** True while one of the pack's own applyDamage calls is in flight: the hurt being handled is not a swing. */
export function isScriptedDamage(): boolean {
  return depth > 0;
}
