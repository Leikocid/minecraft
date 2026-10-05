---
type: "concept-contradiction"
node_id: "L0-xcx22"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "CX-L0-22 · T17 vs invulnerability frames"
aliases: ["L0-xcx22"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1514
tags: ["v7","sculk-crossbow","category:source-vs-engine","severity:medium","status:open","target:L0-sclk","resolved"]
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx22
---

---
title: "CX-L0-22 · Crossbow T17 (three Multishot bolts, three full hits on one player) vs the engine's hurt-invulnerability window"
aliases: ["L0-xcx22", "Crossbow T17 vs invulnerability frames"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-scdm"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3"]
---
# CX-L0-22 · T17 vs invulnerability frames

**Source.** §8 and T17: three Multishot bolts that each physically hit the same player each deal the **full** fixed damage. §5 and T06: the arrow's damage is replaced by a fixed value.

**Engine.** Multishot bolts leave in the same tick at ±10°, so at close range they land on the same or adjacent ticks. Bedrock's hurt window — exactly 10 ticks from the last landed hit — takes 0 from an equal or lower `applyDamage` and only the difference from a stronger one; `applyDamage` still returns true (measured, diagnose-CNTR-X22). A plain damage pipeline therefore gives 1× damage, not 3×. The Scythe met the same problem; its comment at `src/scythe/volley.ts:124-130` names it.

**Disagreement.** The literal T17 fails if hit damage goes only through `applyDamage`.

**Proposed resolution (autopilot default).** Apply `applyDamage` with cause `sonicBoom` for feedback and credit — it passes armour, Protection and a raised shield natively — and write `setCurrentValue(hp − D)` only inside a known window, so each bolt subtracts D once and absorption is not charged twice. `L0-adr-scdm` §3 adopts it, and C-28 states it. The probe proves T17 with three bolts landing within 2 ticks on an armoured SimulatedPlayer. Severity is medium: the spec's headline number depends on it.
