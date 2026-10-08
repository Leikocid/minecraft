---
type: "concept-contradiction"
node_id: "L0-xcx26"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "CX-L0-26 · The passive bonus vs the hurt window"
aliases: ["L0-xcx26"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1354
tags: ["v8","storm-blade","category:spec-vs-platform","severity:high","status:open","target:L0-strm","resolved"]
closed_at: 2026-10-08
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx26
---

---
title: "CX-L0-26 · The passive +6 HP lands inside the melee hit's hurt window"
aliases: ["L0-xcx26", "Storm Blade passive vs hurt window"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-adr-sbdm", "L0-xcx22"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/sculk/hit.ts"]
---
# CX-L0-26 · The passive bonus vs the hurt window

**Spec says:**
- §02: on a proc, add "+6 HP before armour".
- §05: "active and passive damage are processed separately".
- §06: "the passive hit deals only +6 HP before armour".

**The platform does:** the bonus is triggered by the melee hit (`entityHitEntity`), so it is applied in the same tick that the hit opened a 10-tick hurt window. In that window, `applyDamage(6)` is weaker than the ~7–8 HP melee and takes **0**. It still returns true (CNTR-X22, `src/sculk/hit.ts:25`). A naive build passes a "did it fire" test and deals nothing.

The same applies to the **active** 10 HP when the target was meleed in the last 10 ticks. It then takes only 10 − L, about 2–3 HP.

**Severity: high.** The passive is half of the weapon. The failure is silent.

**Resolution path:** `L0-adr-sbdm` (difference-stacking, probe-gated; manual-armour fallback). `strm` must prove it on BDS with an in-test negative control. Until then this stays open.
