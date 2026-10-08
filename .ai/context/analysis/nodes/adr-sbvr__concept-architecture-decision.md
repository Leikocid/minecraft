---
type: "concept-architecture-decision"
node_id: "L0-adr-sbvr"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ADR-L0-sbvr · Vanilla item recipes (status: accepted)"
aliases: ["L0-adr-sbvr"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1774
tags: ["v8", "vanilla-recipes", "status:accepted"]
---
---
title: "ADR-L0-sbvr · Elytra and Totem as plain native shaped recipes"
aliases: ["L0-adr-sbvr", "Vanilla item recipes"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-lgnd"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["packs/behavior/recipes/"]
---
# ADR-L0-sbvr · Vanilla item recipes (status: accepted)

## Context
Spec §03–§05 asks for two **unlimited** recipes that output real `minecraft:elytra` and `minecraft:totem_of_undying`, with no new mechanics, using "native shaped recipes". Every legendary recipe in the pack outputs a **craft token** (`andrew:*_crafted`), which a script swaps under the craft gate.

## Options
- **A: Plain `minecraft:recipe_shaped` with the vanilla result (accepted).** Two JSON files in `packs/behavior/recipes/`, each with `tags: ["crafting_table"]` and an `unlock` on the feather or gold ingot. No token and no script.
- **B: A token plus a script swap.** Rejected: it adds a gate to an ungated item and risks C-31 (stray marks or properties).

## Decision
**A.** The recipes live in `strm`'s scope as one small task. `lgnd` is not touched: neither item is a def. The magnet and protection treat them as ordinary items (C-31).

## Consequences
- GameTest: real-recipe crafting is possible through a Crafter (memory). Craft each recipe twice. The output type id is exactly the vanilla id, it has no dynamic properties, and the input slots are empty afterwards.
- Collision check: neither pattern collides with any existing pack recipe. The Storm Blade's ` L / WSW / L ` shape shares its outline with the crossbow's but uses different keys, which is safe.
- iPad: both recipes appear in the recipe book once a feather or a gold ingot is held.
