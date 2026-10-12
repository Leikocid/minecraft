---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a002"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-002 (bds) · Bow recipe, 2 buckets, once per world, Creative copy"
aliases: ["L0-uwbw-a002"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1002
tags: ["v10", "underwater-bow", "bds", "legendary", "recipe"]
level: 2
---
# AC-uwbw-002 (bds) · Bow recipe, 2 buckets, once per world, Creative copy

**Links.** relates_to: L0-lgnd, L0-trdt-adrf, C-34, L0-uwbw-r004.

- **Craft.** GIVEN a Crafter with ` R / BWB / S `, WHEN it crafts and a sim player picks up the token, THEN:
  - one marked `andrew:underwater_bow` exists;
  - exactly 2 empty buckets come back (inventory plus nearby item entities = 2);
  - the `ub` craft flag is set.
- **Blocked craft.** GIVEN the flag is set and the server restarts, WHEN the recipe is crafted again, THEN no bow results, and the refund is 1 lightning rod, 1 bow, 2 water buckets and 1 sand, with 0 empty buckets.
- **Creative copy.** GIVEN a Creative copy (no mark), THEN the flag is unchanged.
- **Durability and enchanting.** The item has no durability component, and its enchantable slot is `bow`: Power V + Infinity apply, and Mending + Infinity are refused, as for a vanilla bow.
- **Negative control.** The same craft with one water bucket swapped for an empty bucket gives nothing.
