---
type: "concept-contradiction"
node_id: "L0-xcx32"
source_channel: "rollout"
analysis_version: 11
title: "CX-L0-32 · The enchanting goal vs what the stable API can do"
aliases: ["L0-xcx32"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 2794
tags: ["v10", "enchanting", "status:open", "feasibility", "blocking:ench-build"]
level: 1
---
---
title: "CX-L0-32 · An enchanting table that offers treasure enchantments vs a stable API with no table hook"
aliases: ["L0-xcx32", "Enchanting table feasibility"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-ench", "L0-xq11", "L0-adr-enrl", "L0-xasm39", "L0-trdt", "L0-sclk"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
governs_files: ["src/legendary/enchant.ts", "src/sculk/enchant.ts"]
---
# CX-L0-32 · The enchanting goal vs what the stable API can do

**Side A: spec v2 §4 Goal.** "The standard enchanting table offers ALL vanilla enchantments valid for the item, including treasure ones … per offer/generation, a 20 % chance of a rare one." The verbs are *offer* and *generation*: the table's own three offers and its preview.

**Side B: the engine as built and recorded.**
- C-2 requires stable `@minecraft/server` 2.10.0 with no Experiments, and the spec repeats this: "без экспериментов, если возможно".
- Stable 2.10.0 has **no before-event for an anvil or an enchanting table**. This is recorded in `src/legendary/enchant.ts:1-3`, and the Sculk Crossbow's Piercing strip and the trident's Loyalty/Riptide strip both work around it after the fact.
- No component or JSON exposes the table's offer algorithm or its preview UI to an add-on.

The most a script can see is the **result**, through `playerInventoryItemChange`: a stack that gained enchantments, plus the player's XP level drop. It cannot change what the table *shows*.

**The spec anticipates this.** It says not to claim full implementation if the vanilla table cannot be intercepted, and that a custom block, UI or exchange is allowed only after approval. So this is a recorded feasibility conflict, not a defect in the spec. It still blocks the build, because any hook we can build is itself an alternative.

**Second facet: scope overlap.** §4 applies "to all eligible vanilla and supported custom items". Two existing rules forbid specific enchantments:
- C-37 / R-trdt-003: the trident's Loyalty and Riptide;
- the Sculk Crossbow's Piercing strip.

A table that "offers all compatible" enchantments would offer exactly what these rules remove. The default is that the per-def forbidden lists win: the roller excludes them and the existing scrubs keep running.

**Effect.** `L0-ench` may analyse, probe and build the pure roller. It **must not build an engine hook** until `L0-xq11` is answered.

**Resolution path.** The `ench` probe produces a verdict. Andrey then picks an option in `xq11`:
- (a) a post-hoc re-roll of the table result, with a preview mismatch;
- (b) a custom station;
- (c) a reported limitation only.

This contradiction closes on that answer. The second facet closes when `L0-adr-enrl` is accepted.
