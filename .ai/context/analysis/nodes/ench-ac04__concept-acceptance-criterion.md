---
type: "concept-acceptance-criterion"
node_id: "L0-ench-ac04"
source_channel: "rollout"
analysis_version: 10
title: "AC-ench-04 · Conflict, curse and forbidden fuzz; treasure is reachable; the module is pure"
aliases: ["L0-ench-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 989
tags: ["v10", "enchanting", "fuzz", "conflicts", "C-37", "channel:unit", "spec-5-bullet-6"]
level: 2
---
# AC-ench-04 · Conflict, curse and forbidden fuzz; treasure is reachable; the module is pure

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r002, L0-ench-r003, L0-ench-r001

**GIVEN** ≥ 10 000 requests with random item (every `ELIGIBILITY` key), random tier and random seed,
**WHEN** each result is checked,
**THEN** there are 0 conflicting pairs (`r002`), 0 curses, 0 levels above the vanilla max, and 0 guard throws.

**AND** `andrew:above_water_trident` (the `TRIDENT.itemId`) never carries `loyalty` or `riptide`, and the Sculk Crossbow never carries `piercing`.
**AND** across the run, every treasure member of each item's eligible set appears at least once. Examples: Mending on a pickaxe, Swift Sneak on leggings, Wind Burst on the Mace. This is the roller half of "Mending and other eligible treasure can be offered".
**AND** a source check shows that `src/enchanting/roll.ts` and its imports never reach `@minecraft/server`.

**Channel:** `unit`.
