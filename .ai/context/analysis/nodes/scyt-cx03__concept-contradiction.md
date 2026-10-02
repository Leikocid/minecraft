---
type: "concept-contradiction"
node_id: "L0-scyt-cx03"
source_channel: "rollout"
analysis_version: 5
title: "CX-scyt-03 · The shipped item JSON is a hoe and has no `allow_off_hand`, against `L0-sitm-adr2`, `L0-sitm-asm3`, `L0-adr-scyt` and AC-16"
aliases: ["L0-scyt-cx03"]
is_a: ["contradiction"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1327
tags: ["is_a:contradiction","category:design-vs-impl","severity:medium","target:L0-sitm","delta:2026-09-26","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-scyt-cx03
---

# CX-scyt-03 · The shipped item JSON is a hoe and has no `allow_off_hand`, against `L0-sitm-adr2`, `L0-sitm-asm3`, `L0-adr-scyt` and AC-16

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-sitm-adr2", "L0-sitm-asm3", "L0-adr-scyt", "L0-scyt-ac15", "L0-scyt-ac16", "L0-scyt-r009"]`

**Target:** `L0-sitm` · **Category:** design vs implementation · **Severity:** medium · **Status:** open.

**Checked** in `packs/behavior/items/scythe_of_calamity.json` @ `302fba4`:
- `tags: ["minecraft:is_tool", "minecraft:is_hoe"]` and a `minecraft:digger` (speed 8, `is_hoe_item_destructible`). `L0-sitm-adr2` said "no digger, no tool tags", partly so that Use cannot till.
- `menu_category.group: itemGroup.name.hoe`. `L0-sitm-asm3` and prior AC-15 said Swords.
- There is **no** `minecraft:allow_off_hand`. `L0-adr-scyt` step 2 and prior `r009` require it. Without it Bedrock does not let a custom item into the off hand, so the off-hand half of AC-16 (hand priority) is probably untestable. This is not verified on the device.

**Not checked:** whether Use on grass tills with these tags. That question goes to the iPad or BDS.

**Needed:** decide whether the hoe identity is intended. If it is, amend `sitm-adr2`/`asm3` and AC-15. If not, fix the JSON. Add `allow_off_hand` or drop AC-16's off-hand half.
