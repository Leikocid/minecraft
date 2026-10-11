---
type: "concept-acceptance-criterion"
node_id: "L0-trdt-a005"
source_channel: "rollout"
analysis_version: 9
title: "AC-trdt-005 (bds) · Enchantment scrub; magnet and lgnd touch points"
aliases: ["L0-trdt-a005"]
is_a: ["acceptance-criterion"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 723
tags: ["above-water-trident", "bds", "enchant", "magnet", "C-37"]
level: 2
---
# AC-trdt-005 (bds) · Enchantment scrub; magnet and lgnd touch points

**Links.** relates_to: L0-trdt-r003, L0-trdt-adcl, L0-magn.

- **Scrub.** GIVEN a trident with Loyalty III, Riptide III and Unbreaking III put in the inventory (via `/replaceitem`, an anvil-equivalent write), WHEN it is observed, THEN Loyalty and Riptide are gone and Unbreaking III stays. This also holds after a throw and return, and after an lgnd death restore.
- **Magnet.** The magnet's legendary scenarios include def #7 (on the ground, in a chest, held by a mob). A custody entity inside the magnet zone is never selected or moved.
- **Departure watch (T3).** A throw logs no `left an inventory` recovery line and mints no copy within 40 ticks.
