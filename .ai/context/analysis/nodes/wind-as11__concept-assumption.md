---
type: "concept-assumption"
node_id: "L0-wind-as11"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — `/tickingarea` works from `runCommand` on BDS 1.26.51.1 with a 10-area / 100-chunk limit"
aliases: ["L0-wind-as11"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 722
tags: ["is_a:assumption", "CAN_ASSUME", "ticking-area", "needs-probe", "relates_to:L0-wind-ad01"]
level: 2
---
# Assumption — `/tickingarea` works from `runCommand` on BDS 1.26.51.1 with a 10-area / 100-chunk limit

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-ad01, L0-strf-p006]`

- `dimension.runCommand("tickingarea add <from> <to> andrew_ws_n")` succeeds without an operator player, loads the chunks within a few seconds, and `tickingarea remove` releases them.
- **Verify** in the `strf` probe: add a 10×10 window 400 blocks from spawn, poll `getBlock` until defined, time it, remove.
- **Impact if wrong:** high for §4.7 "at start". Fallback in `L0-wind-ad01`: search as the first player explores, deviation recorded; test 14 then passes only after the player has been online near spawn.
