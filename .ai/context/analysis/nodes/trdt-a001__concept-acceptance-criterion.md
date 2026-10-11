---
type: "concept-acceptance-criterion"
node_id: "L0-trdt-a001"
source_channel: "rollout"
analysis_version: 9
title: "AC-trdt-001 (bds) · Recipe, buckets, one craft per world, Creative copy"
aliases: ["L0-trdt-a001"]
is_a: ["acceptance-criterion"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 918
tags: ["above-water-trident", "bds", "recipe", "C-34"]
level: 2
---
# AC-trdt-001 (bds) · Recipe, buckets, one craft per world, Creative copy

**Links.** relates_to: L0-trdt-adrf, L0-xasm33, L0-lgnd.

- **Craft.** GIVEN a crafter loaded with ` G / BTB / G `, WHEN it crafts, THEN:
  - one marked `andrew:above_water_trident` exists;
  - exactly 2 empty buckets come back (P1 branch);
  - the craft flag is set.
- **Full inventory.** GIVEN the same craft with every slot full, THEN inventory buckets plus nearby bucket item entities = 2, and no trident or token is lost.
- **Blocked craft.** GIVEN the flag is set and the server restarts, WHEN the recipe is crafted again, THEN:
  - no trident results;
  - the inventory gains 2 golden apples, 1 trident and 2 water buckets;
  - it holds 0 extra empty buckets (the exchange); total buckets of either kind = 2.
- **Creative copy.** GIVEN a Creative copy is given (no mark), THEN the craft flag is unchanged and that copy is never voided.
