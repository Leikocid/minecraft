---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac11"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-11 · Looted chests, broken spawners and broken walls stay that way after restart"
aliases: ["L0-wind-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 450
tags: ["is_a:acceptance-criterion", "spec-test:22", "verify:bds", "persistence"]
level: 2
---
# AC-wind-11 · Looted chests, broken spawners and broken walls stay that way after restart

**Spec:** test 22, §2, §6.

GIVEN a Windmill
WHEN a player empties 3 chests, breaks 1 chest, breaks the floor-2 spawner and a wall section, then the server restarts twice and the chunk is unloaded/reloaded
THEN the 3 chests are still empty, the broken chest and spawner are absent, the wall hole remains
AND the broken chest dropped its contents when broken.
