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

The engine has a hurt window (memory, CNTR-X22; `src/sculk/hit.ts:25`). For 10 ticks after a landed hit, a weaker or equal `applyDamage` takes 0 and a stronger one takes only the difference of the post-armour amounts, f(X) − f(L). `applyDamage` still returns true either way.

The passive fires from `entityHitEntity`, which is **the same tick as the melee hit**. A diamond-sword melee is 8.00 HP (14.00 with Sharpness V) and the bonus is 6, so a plain `applyDamage(6)` is swallowed every time (`xcx26`). An active hit on a target meleed within the last 10 ticks loses part of its damage the same way.

The crossbow's answer (`hit.ts` window mode: `applyDamage`, then a health write) gives *true* damage. It skips armour, which this spec forbids.

## Options
- **A: Difference-stacking (proposed).** Inside a known window whose last hit was L, call `applyDamage(L + D)` with `entityAttack` and the wielder as `damagingEntity`. Measured: the engine takes f(L+D) − f(L), so the total is one L+D hit (diamond 4.76, not 3.80). Exact only without armour (bare, iron golem +6.00). Raw L is not observable: entityHurt and beforeEvents.entityHurt both report post-armour damage. A constant L takes 0.00 under Sharpness V. Outside a window, call `applyDamage(D)` alone. L comes from the blade's own melee (`entityHitEntity` → `entityHurt.damage` in the same tick), or from a per-target record of the last landed hit and its tick.
  - Probe P1: is armour applied to the difference (D) or to L + D? **Answered: L + D.**
  - Probe P2: does the difference hold for players *and* mobs? **Unarmoured mob holds; armoured mob not run.**
- **B: Deferred bonus.** Schedule the passive/active damage for the tick the window closes (+10). Simple and native, but the bonus lands half a second late, and a second melee hit in between re-opens the window.
- **C: Manual armour.** Compute the vanilla armour/toughness/Protection/Resistance reduction in script and write health directly (the `hit.ts` window pattern with D′ = reduced D). Exact timing, but it re-implements the engine's armour formula. That is drift-prone across versions and breaks totems/absorption unless the lethal path goes through `applyDamage`.
- **R: raise the melee hit.** `beforeEvents.entityHurt`, `event.damage += f(D)`; the value read is post-armour. Exact f(L)+f(6) in one native event, absorption first. A flat +D adds true damage.

## Decision
P1 failed. Passive: **R**. Active inside a known window: **C** with D′ = f(10) from `totalArmor`/`totalToughness`/Protection. A before-event rewrite of the active is exact only while f(10) > the window's last hit. B stays rejected.

## Consequences
- `strm` owns a small `src/storm/damage.ts` that mirrors `hit.ts` modes (`lethal | native | window`). It must not import the crossbow's true-damage write.
- A GameTest proves each mode against an armoured SimulatedPlayer, comparing health before and after to a vanilla-sword control. It includes an in-test negative control for plain `applyDamage(6)` inside the window (red proof), plus a flat +6 raise as a second negative control (true damage, 8.24 on diamond).
- The shield question (`xcx27`) is separate: a raised shield cancels `entityAttack` + wielder only from the front half (< 90°), like a sword hit, and `applyDamage` then returns `false`. Mode C's health write must be skipped on `false`: the write passes the shield (X23 P2).
