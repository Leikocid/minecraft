---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac08"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 533
tags: ["is_a:acceptance-criterion", "verify:bds", "mobs"]
level: 2
---
**AC-strf-08 · Guards persist until death and never respawn** (`L0-strf-r009`; spec tests 19, 57, 58)

GIVEN an instance whose def spawns N guards, WHEN init completes, THEN exactly N entities of the declared vanilla types carry the tag `andrew:guard:<id>`. AFTER a walk-away of ≥ 256 blocks for 5 in-game minutes and a restart, all N still exist, unless they were killed. Windmill guards at noon in full sun take 0 damage over 60 s. Killing all N and restarting yields 0 guards. The state is still `done`/`guarded`.
**Verify:** bds.
