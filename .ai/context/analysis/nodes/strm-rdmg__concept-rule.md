---
type: "concept-rule"
node_id: "L0-strm-rdmg"
source_channel: "rollout"
analysis_version: 8
title: "Rule: `stormDamage(target, D, wielder, opts?)`"
aliases: ["L0-strm-rdmg"]
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1922
tags: ["v8", "storm-blade", "damage", "C-29"]
level: 2
---
---
title: "Storm damage helper: exact pre-armour D, never swallowed, never doubled"
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sbdm", "L0-xasm29", "L0-xcx26", "L0-xcx27", "L0-sclk"]
governs_files: ["src/storm/damage.ts"]
---
# Rule: `stormDamage(target, D, wielder, opts?)`

**Rule.** Every Storm Blade damage event (active D = 10, passive D = 6) goes through one helper. Armour, toughness, Protection and Resistance then reduce D **exactly as for a vanilla `entityAttack` of D** (xasm29, C-29).

It has three modes, mirroring `src/sculk/hit.ts` modes but **not importing them**:
- **native**: the target is in no window. `applyDamage(D, { cause: entityAttack, damagingEntity: wielder })`.
- **window**: the target was hit L ticks-ago < `HURT_WINDOW_TICKS` (10) by a hit of strength L.
  - Passive: raise the melee in beforeEvents.entityHurt by f(6) (P1 failed, diagnose-CNTR-X26).
  - Active in a known window: D′ = f(10) from `equippable.totalArmor`/`totalToughness` + Protection EPF; `applyDamage(10)`, then write hp − D′, *unless* `health − D′ ≤ 0`, in which case take the lethal path.
- **lethal**: `applyDamage` with a value that guarantees death after armour, so totems, the death message and kill credit fire natively.

**Invariants**
- Exactly one target per call. No area effect, so a bystander's Δhealth = 0.
- No true-damage write in the native path. The `sonicBoom` cause is never used, because it bypasses armour, which C-28 does not grant this weapon.
- The helper records `(targetId → lastHitStrength, tick)` for every landed Storm hit, so a passive on an active (or the reverse) within 10 ticks still nets D.
- Active and passive are **separate calls** (§05). They are never merged into one 16-HP call.
- The return value of `applyDamage` is **not** evidence of damage, because it returns true when swallowed (`hit.ts:25`). Tests read health.
- A raised shield facing the wielder (< 90°) cancels the call, `applyDamage` returns `false` and the shield wears D + 1, as for a vanilla hit; at ≥ 90° the call lands with armour. No deviation. On `false`, write nothing (window mode's write would pass the shield).
