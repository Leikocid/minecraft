---
type: "concept-assumption"
node_id: "L0-xasm45"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ASM-L0-45 · A marked Pearl Rod is a plain fishing rod to every recipe"
aliases: ["L0-xasm45"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 2308
tags: ["v11", "pearl-rod", "legendary", "crafting", "CAN_ASSUME", "cross-component"]
---
---
title: "ASM-L0-45 · A marked Pearl Rod is a plain fishing rod to every recipe, the Orbital Cannon's included"
aliases: ["L0-xasm45"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-lgnd", "L0-orbc", "L0-ench", "L0-pear-pr01", "L0-pear-ru04", "L0-pear-ent1"]
see_also: ["L0-adr-prbd", "L0-xasm43"]
---
# ASM-L0-45 · A marked Pearl Rod is a plain fishing rod to every recipe

**Is a:** assumption (CAN_ASSUME). This interaction spans components and is visible only at L0.

**Observation (reduce, 2026-10-12).**
- The Pearl Rod is a marked vanilla `minecraft:fishing_rod` (`L0-adr-prbd`).
- Recipes match by item type, and the craftgate's refunds return plain stacks.
- As read during reduce:
  - `packs/behavior/recipes/orbital_cannon.json` takes `minecraft:fishing_rod` in its centre (TNT on the four sides);
  - `ORBITAL_CANNON.refund` in `src/legendary/registry.ts` returns `["minecraft:fishing_rod", 1]`.
- Vanilla carrot-on-a-stick and warped-fungus-on-a-stick also take any fishing rod. So does the Pearl Rod's own recipe (`L0-pear-pr01`).

**Assumption.** This is accepted, not prevented:
- A Pearl Rod used as an ingredient is consumed, along with its id, its binding and its enchantments.
- If the craftgate refunds a duplicate Orbital Cannon, the player gets a **plain** fishing rod back, not the Pearl Rod.
- A Pearl Rod used in its own recipe yields a fresh unbound Pearl Rod.
- The Pearl Rod's crafting is unlimited (C-46), so the loss is one Ender Pearl at most. Nothing is duplicated.
- `ench` treats the rod as `minecraft:fishing_rod` with no adapter.

**Why not prevent it.** Stable recipes cannot exclude an item stack by its dynamic properties. Preventing it would need a craftgate-style rejection on *vanilla* outputs, which C-46 rules out for this item.

**Obligations.**
- `pear` lists "using the rod as a crafting ingredient consumes it as a plain rod" among its reported limitations (C-16).
- The C-40 collision test in `L0-pear-ac01` keeps the Orbital Cannon recipe in its shape set (it already covers every `packs/behavior/recipes/*` file).

**Impact if wrong:** if Andrey wants the rod protected from recipes, it becomes a craft-time rejection plus refund for `orbital_cannon`, carrot-on-a-stick and warped-fungus-on-a-stick. That means a new `lgnd` touchpoint.
