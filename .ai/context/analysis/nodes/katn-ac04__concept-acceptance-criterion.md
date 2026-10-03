---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac04"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1267
tags: ["acceptance-criterion", "katana", "channel:bds", "T07", "T08", "T09", "T10", "is_a:acceptance-criterion"]
level: 2
---
---
title: "AC-katn-04 (T07–T10, bds): walls, liquids, safe cell, no block edits"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r003", "L0-katn-r004", "L0-katn-r002"]
---
- **T07.** GIVEN a 3-thick stone wall 10 blocks ahead (5 wide, 5 high), WHEN the player aims at a point 15 blocks out through it, THEN the feet x is < the wall's near face, within 1.5 of it, and the player is on the near side.
- **T08.** GIVEN a water column and, separately, a lava pool lying across the path with an open floor beyond, WHEN the player aims past them, THEN they land beyond the liquid. The lava case uses a fire-resistance effect so the test is not about the landing.
- **T09.** GIVEN aim at a 2-high gap that is 1 block high, or a ceiling 1 block above the floor hit, WHEN the player uses, THEN the feet and head cells after the teleport are free, `entityHurt` with cause `suffocation` is absent for 40 ticks, and the player is in a different cell than at the start.
- **Refusal.** GIVEN the player boxed in with no fit within the search, WHEN they use, THEN there is no move and the cooldown is unset.
- **T10.** GIVEN the full test area (`getBlocks` volume) snapshotted before the use, THEN every block typeId and permutation is unchanged after it.
