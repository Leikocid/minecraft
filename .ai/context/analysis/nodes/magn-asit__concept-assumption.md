---
type: "concept-assumption"
node_id: "L0-magn-asit"
source_channel: "rollout"
analysis_version: 5
title: "magn-asit · `Block.getItemStack(1)` gives the right single item for every IRON_BLOCKS entry"
aliases: ["L0-magn-asit"]
is_a: ["assumption"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 820
tags: ["is_a:assumption", "CAN_ASSUME", "status:to-probe", "channel:bds", "relates_to:L0-xasm15", "relates_to:L0-magn-pext"]
level: 2
---
# magn-asit · `Block.getItemStack(1)` gives the right single item for every IRON_BLOCKS entry

**Assumption.**
- `getItemStack(1, false)` returns the plain item for each block:
  - rail → rail;
  - a hanging lantern → lantern;
  - a water or lava cauldron → cauldron;
  - a chipped anvil → chipped_anvil.
- The door is special-cased to `iron_door`, and ore to `raw_iron`.
- An explicit fallback map keyed by block id covers any block where the call returns undefined or a variant item.
- A GameTest checks each IRON_BLOCKS id once.

**Impact if wrong.**
- A wrong item id gives the wrong drop, which breaks AC-10.
- A data-bearing item, such as a filled cauldron item, gives a non-vanilla item.
- Both are caught by the per-id test before merge.
- The cauldron's liquid is lost by design: the item is an empty cauldron.
