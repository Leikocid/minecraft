---
type: "concept-rule"
node_id: "L0-item-r003"
source_channel: "rollout"
aliases: ["L0-item-r003"]
part_of: ["L0-item"]
is_a: ["rule"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 979
tags: ["rule","recipe","crafting"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent2"]`

**Rule — Recipe shape.** The crafting recipe is a fixed 3×3 **shaped** recipe — a plus-pattern of 4× Cobweb (top/bottom/left/right cells) around 1× Diamond Sword (center cell) — yielding exactly 1× Web Sword.

**Must be `minecraft:recipe_shaped`, not shapeless.** Despite every non-empty cell holding one of only two ingredient types, position is meaningful: a Diamond Sword off-center, or Cobweb in a corner instead of an edge, must **not** match. Symmetric-looking ingredient sets are the most common source of shaped-vs-shapeless recipe bugs.

**Rationale.** §2's row-by-row layout (`Empty|Cobweb|Empty` / `Cobweb|DiamondSword|Cobweb` / `Empty|Cobweb|Empty`) is explicit and geometric.

**Precedent.** `packs/behavior/recipes/miners_pickaxe.json` uses `minecraft:recipe_shaped` with `tags: ["crafting_table"]` and an `unlock` clause — same shape expected here.

**Source:** §2, §13 AC-2.
