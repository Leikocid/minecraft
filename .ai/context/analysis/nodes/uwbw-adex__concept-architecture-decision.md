---
type: "concept-architecture-decision"
node_id: "L0-uwbw-adex"
source_channel: "rollout"
analysis_version: 10
title: "ADR-uwbw-ex · Exact 14: a replace-mode `setHit` beside `raiseHit`"
aliases: ["L0-uwbw-adex"]
is_a: ["architecture-decision"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1458
tags: ["v10", "underwater-bow", "status:proposed", "damage"]
level: 2
---
# ADR-uwbw-ex · Exact 14: a replace-mode `setHit` beside `raiseHit`

**Links.** relates_to: L0-uwbw-cx01, L0-strm, L0-uwbw-r003, C-29.

**Context.**
- `raiseHit` adds a bonus to `entityAttack` hits only (`cx01`).
- `applyDamage` with `cause projectile` + `damagingEntity` throws.
- A second hit inside the hurt window is swallowed.
- A lethal before-event rewrite eats the totem *and* kills.

**Decision.**
- `src/storm/damage.ts` gains `setHit(event, preArmour, opts: {causes: EntityDamageCause[]})`.
- It shares `raiseHit`'s internals: defence read, `afterArmour`, absorption and the lethal plan.
- It writes `event.damage = afterArmour(preArmour, defence)`.
- If that is lethal (≥ the health left, absorption included), it writes 0 and follows through on the next tick with `applyScriptedDamage(target, hp + OVERKILL, {cause: entityAttack, damagingEntity: shooter})`. That keeps credit and the totem; the cause differs from `projectile`, which is reported as a deviation in the README.
- `raiseHit` is unchanged, and the Storm Blade scenarios gate the merge.

**Rejected.**
- **A `causes` option on `raiseHit`.** It is still additive (vanilla + 14).
- **Cancel the hit, then `applyDamage(14)`.** The cancelled event can still open the hurt window, the projectile cause throws, and Punch knockback is lost.
- **Compute the vanilla damage and add `14 − vanilla`.** The same result with more coupling, and it fails when the vanilla damage is greater than 14.
