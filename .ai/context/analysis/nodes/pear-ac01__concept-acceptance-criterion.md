---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac01"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-01 · Unlimited craft, correct grid, no durability loss (§8 bullet 1)"
aliases: ["L0-pear-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1413
tags: ["v11", "pearl-rod", "acceptance", "bds", "ipad", "spec-8.1"]
level: 2
---
# AC-pear-01 · Unlimited craft, correct grid, no durability loss (§8 bullet 1)

**Relates to:** L0-pear-pr01, L0-pear-ru04, L0-xasm43, C-40.

**`bds` (GameTest; crafter-loaded via `/replaceitem`, which performs a real recipe craft):**
- GIVEN a crafter with an Ender Pearl at top-middle and a Fishing Rod at centre, WHEN it crafts 3 times in a row, THEN 3 tokens come out. A token picked up by a sim player becomes a `minecraft:fishing_rod` with `andrew:pearl_rod`, nameTag «Перовый сокровятель», lore "Pearl Rod"/"unbound", and damage 0.
- **Negative controls:** the same two items shifted (pearl top-left over rod middle-left), and the pearl below the rod → nothing crafts. If the probe shows Bedrock trims blank rows and columns, this becomes a recorded deviation.
- **C-40:** the recipe set has no other shape that matches pearl + rod, and carrot-on-a-stick and warped-fungus-on-a-stick still craft (unit test over `packs/behavior/recipes/*` plus vanilla shapes).
- GIVEN a marked rod reeled 30 times from a block hook, THEN damage reads 0 after each reel. **Negative control:** a plain rod's damage rises over the same sequence.
- A token and a marked rod return undefined from `defForToken`, `defForStack` and `isLegendaryStack` (the plan's "`defForItem`"; names as read in `src/legendary/registry.ts` during reduce v11) (unit test).

**`ipad`:**
- the recipe book shows the Pearl Rod icon;
- the 2×2 inventory grid does not offer it;
- the crafted rod shows the name and lore;
- the durability bar never visibly drops.
