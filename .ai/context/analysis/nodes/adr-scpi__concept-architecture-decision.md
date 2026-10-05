---
type: "concept-architecture-decision"
node_id: "L0-adr-scpi"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-scpi · Piercing on the Sculk Crossbow (status: accepted, probe-gated; resolves `L0-sclk-cx01`)"
aliases: ["L0-adr-scpi"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1522
tags: ["v7", "sculk-crossbow", "status:accepted", "probe-gated", "resolves:L0-sclk-cx01", "C-16", "reduce"]
---
---
title: "ADR-L0-scpi · T15 reads as \"Piercing is stripped on entry and never acts\" (C-16 deviation)"
aliases: ["L0-adr-scpi", "Crossbow Piercing reading"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-sclk-cx01", "L0-sclk-ad01", "L0-sclk-r005", "L0-sclk-ac15", "L0-adr-scbs", "L0-sclk-p001"]
see_also: ["constraints"]
governs_files: ["src/sculk/"]
---
# ADR-L0-scpi · Piercing on the Sculk Crossbow (status: accepted, probe-gated; resolves `L0-sclk-cx01`)

**Context.** T15: "Piercing cannot be applied or used." `minecraft:enchantable.slot = "crossbow"` is needed for Quick Charge and Multishot (T14, T16), and it admits Piercing. Stable 2.10.0 has no hook to refuse an anvil or enchanting-table result (C-16). The v7 plan already allowed "strip it on sight if the slot cannot exclude it".

**Decision.**
- T15 passes when the following hold. (a) Every sculk-crossbow stack that gains Piercing loses it in the same tick the inventory-change event reports it (`sclk-r005`). (b) No bolt behaves differently with Piercing, because each bolt resolves once (`sclk-r001`).
- The README C-16 list states the cost: Piercing from a table roll or an anvil book is removed with no refund. `enchant_with_levels 30` gives Piercing in 65 % of rolls and Piercing alone in 19 % (levels 1–30: 70 % / 42 %), and such a roll leaves the crossbow bare.
- Probe **Q2** is answered: the engine does admit Piercing for the custom item, so the deviation is kept and T15 is tested as "removed at once".

**Scope.** This applies only to `sclk`. No `lgnd` hook is involved: the strip is crossbow code on `playerInventoryItemChange`, so the plan's single framework change still holds.
