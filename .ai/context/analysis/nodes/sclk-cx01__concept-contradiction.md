---
type: "concept-contradiction"
node_id: "L0-sclk-cx01"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-cx01"]
is_a: ["contradiction"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1227
tags: ["contradiction","status:resolved","resolved_by:L0-adr-scpi","piercing","T15","C-16","resolved"]
level: 2
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-sclk-cx01
---

**CX-sclk-01 · T15 "Piercing cannot be applied" vs the engine: slot `crossbow` lets the anvil apply it (status: resolved at reduce by `L0-adr-scpi`, severity: low)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-sclk-ad01", "L0-sclk-r005", "L0-adr-scbs", "L0-sclk-ac15"]`

**Source A.** Spec §8 and T15 say Piercing is forbidden and "cannot be applied or used". The plan reads this as "strip it on sight if the slot cannot exclude it".

**Source B (engine).** `minecraft:enchantable.slot` admits a whole vanilla slot. `crossbow` includes Piercing, and stable 2.10.0 cannot veto an anvil or enchanting-table result. So Piercing **can** be applied. It sits on the stack until the next inventory-change event strips it, and the player sees it in the tooltip for that moment.

**Tension.** "Cannot be **used**" is met: a bolt resolves once (r001). "Cannot be **applied**" is met only as "removed at once", not "refused".

**Proposed default (not self-resolved).** Accept "stripped within the same tick it enters the inventory" as T15's reading under C-16, and record it in the README deviation list. The probe's Q2 confirms whether the table even offers Piercing for a custom item. If it does not, this contradiction closes.
