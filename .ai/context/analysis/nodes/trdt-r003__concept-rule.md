---
type: "concept-rule"
node_id: "L0-trdt-r003"
source_channel: "rollout"
analysis_version: 9
title: "R-trdt-003 · Loyalty and Riptide never stay on the trident"
aliases: ["L0-trdt-r003"]
is_a: ["rule"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 909
tags: ["above-water-trident", "enchant", "C-37"]
level: 2
---
# R-trdt-003 · Loyalty and Riptide never stay on the trident

**Links.** is_a: rule. relates_to: L0-xasm35, L0-adr-twth, L0-trdt-pthr.

**Rule.**
- The item has `minecraft:enchantable` slot `trident`.
- On `playerInventoryItemChange` naming an `andrew:above_water_trident` stack, on re-insert after a return, and on `grant` through lgnd (that goes through `playerInventoryItemChange` too):
  - remove `loyalty` and `riptide`;
  - keep all others (Unbreaking, Mending, Impaling, Channeling).
- The scrub writes the stack back into the same slot only when something was removed, so it cannot loop.
- **Marked copies:** after a scrub, the lgnd mark's `look` is refreshed (`withLook`), so a later lgnd return does not restore Loyalty or Riptide.
- **Channeling** is inert: there is no second strike.
- **Reported limitations:** the anvil and table previews show the enchantments, and the anvil consumes the book.
