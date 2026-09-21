---
type: "concept-rule"
node_id: "L0-item-r002"
source_channel: "rollout"
aliases: ["L0-item-r002"]
part_of: ["L0-item"]
is_a: ["rule"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 841
tags: ["rule","discoverability","creative"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent1"]`

**Rule — Discoverability.** The item must be reachable through all four vanilla discovery paths simultaneously: the Creative Equipment tab ("Снаряжение"), the unfiltered "Все"/All catalogue, Creative Search, and `/give`.

**Rationale.** §1 lists all four explicitly, and §13's first acceptance test checks them together as **one** criterion — none may be satisfied by accident. A wrong `menu_category.group` can hide an item from its equipment tab while `/give` still works, silently failing the combined test.

**Implementation note.** `menu_category.category: "equipment"` with a sword-appropriate `group` (the sword-equivalent of the pickaxe's `itemGroup.name.pickaxe`), matching the pickaxe's precedent for tab placement.

**Source:** §1, §13 AC-1.
