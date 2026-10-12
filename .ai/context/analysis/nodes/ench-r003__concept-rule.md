---
type: "concept-rule"
node_id: "L0-ench-r003"
source_channel: "rollout"
analysis_version: 10
title: "R-ench-003 · Per-def forbidden lists beat the table, and the C-37 scrubs keep running"
aliases: ["L0-ench-r003"]
is_a: ["rule"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1508
tags: ["v10", "enchanting", "C-37", "forbidden", "seam:trdt", "seam:sclk"]
level: 2
---
# R-ench-003 · Per-def forbidden lists beat the table, and the C-37 scrubs keep running

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-xcx32, L0-trdt, L0-sclk, L0-ench-ac04

**Rule.**
1. **The roller never emits an enchantment that a def forbids.** There are two sources today:
   - `FORBIDDEN_ENCHANTMENTS` (`src/legendary/enchant.ts:10`): the Above-Water Trident never gets `loyalty` or `riptide` (R-trdt-003);
   - `PIERCING` for `SCULK_CROSSBOW` (`src/sculk/enchant.ts:7`, L0-sclk-r005).

   `roll.ts` reads both through a single `forbiddenFor(itemId)` accessor and copies neither list. A new def that forbids something joins automatically.
2. **The C-37 scrubs are never removed or bypassed by this component.** Any approved adapter applies its result and then lets the existing scrub run on the same stack in the same tick (or the hand-change path). So a forbidden enchantment that still arrives some other way (an anvil, a command, a vanilla table offer under option (c)) is stripped as before.
3. **Purity.** The accessor lives in a pure module that both the scrubs and the roller import. It must not drag `@minecraft/server` into `roll.ts`.

**Why.** This is the second facet of `xcx32`: "offers ALL compatible" would otherwise re-offer exactly what C-37 removes. The default, accepted in `L0-adr-enrl`, is that the per-def list wins.

**Source:** C-37; `L0-xcx32` second facet; the plan's reduce seam ("the roller's pool excludes `FORBIDDEN_ENCHANTMENTS` and the crossbow's Piercing").
