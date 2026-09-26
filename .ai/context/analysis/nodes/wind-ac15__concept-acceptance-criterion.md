---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac15"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-15 · Forced preparation never damages a structure, a spawner or a player build"
aliases: ["L0-wind-ac15"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 424
tags: ["is_a:acceptance-criterion", "verify:bds", "site-prep", "safety"]
level: 2
---
# AC-wind-15 · Forced preparation never damages a structure, a spawner or a player build

**Spec:** §4.7.10, §6, §9.4.

GIVEN a fixture where the best forced-prep site overlaps (a) a vanilla spawner, (b) a village signature, (c) a player-placed planks hut
WHEN the spawn search runs
THEN none of those blocks changed; the chosen site is a different position
AND no block outside the chosen plot + band + fill volume changed.
