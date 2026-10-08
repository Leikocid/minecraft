---
type: "concept-architecture-decision"
node_id: "L0-adr-sbdm"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ADR-L0-sbdm · Storm Blade damage (status: proposed, probe-gated)"
aliases: ["L0-adr-sbdm"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 3343
tags: ["v8", "storm-blade", "status:proposed", "probe-gated"]
---
---
title: "ADR-L0-sbdm · Storm Blade damage: armour-respecting and safe from the hurt window"
aliases: ["L0-adr-sbdm", "Storm Blade damage pipeline"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-xcx26", "L0-xcx27", "L0-xasm29", "L0-adr-scdm"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/sculk/hit.ts", "src/scythe/volley.ts"]
---
# ADR-L0-sbdm · Storm Blade damage (status: proposed, probe-gated)

## Context
Spec §02/§05 asks for **10 HP (active)** and **+6 HP (passive)** *before* armour, as separate events that never double.

The engine has a hurt window (memory, CNTR-X22; `src/sculk/hit.ts:25`). For 10 ticks after a landed hit, a weaker or equal `applyDamage` takes 0 and a stronger one takes only the difference. `applyDamage` still returns true either way.

The passive fires from `entityHitEntity`, which is **the same tick as the melee hit**. Melee is about 7–8 HP and the bonus is 6, so a plain `applyDamage(6)` is swallowed every time (`xcx26`). An active hit on a target meleed within the last 10 ticks loses part of its damage the same way.

The crossbow's answer (`hit.ts` window mode: `applyDamage`, then a health write) gives *true* damage. It skips armour, which this spec forbids.

## Options
- **A: Difference-stacking (proposed).** Inside a known window whose last hit was L, call `applyDamage(L + D)` with `entityAttack` and the wielder as `damagingEntity`. The engine takes the difference D and applies armour to it, so armour and credit stay native. Outside a window, call `applyDamage(D)` alone. L comes from the blade's own melee (`entityHitEntity` → `entityHurt.damage` in the same tick), or from a per-target record of the last landed hit and its tick.
  - Probe P1: is armour applied to the difference (D) or to L + D?
  - Probe P2: does the difference hold for players *and* mobs?
- **B: Deferred bonus.** Schedule the passive/active damage for the tick the window closes (+10). Simple and native, but the bonus lands half a second late, and a second melee hit in between re-opens the window.
- **C: Manual armour.** Compute the vanilla armour/toughness/Protection/Resistance reduction in script and write health directly (the `hit.ts` window pattern with D′ = reduced D). Exact timing, but it re-implements the engine's armour formula. That is drift-prone across versions and breaks totems/absorption unless the lethal path goes through `applyDamage`.

## Decision
**A**, gated on probes P1 and P2 on checks (19136).
- If P1 shows armour is applied to L + D, use **C** for the in-window case only, keeping `applyDamage` for the lethal and out-of-window paths (the same split as `hit.ts`).
- **B** is rejected unless both A and C fail. A visible half-second lag breaks "the strike comes with the hit".

## Consequences
- `strm` owns a small `src/storm/damage.ts` that mirrors `hit.ts` modes (`lethal | native | window`). It must not import the crossbow's true-damage write.
- A GameTest proves each mode against an armoured SimulatedPlayer, comparing health before and after to a vanilla-sword control. It includes an in-test negative control for plain `applyDamage(6)` inside the window (red proof).
- The shield question (`xcx27`) is separate: any `entityAttack` `applyDamage` is cancelled by a raised shield.
