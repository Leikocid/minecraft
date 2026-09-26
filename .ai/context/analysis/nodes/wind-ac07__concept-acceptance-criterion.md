---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac07"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-07 · 10 field guards: once, sun-immune, persistent, never restored"
aliases: ["L0-wind-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 558
tags: ["is_a:acceptance-criterion", "spec-test:19", "verify:bds", "guards"]
level: 2
---
# AC-wind-07 · 10 field guards: once, sun-immune, persistent, never restored

**Spec:** test 19, §4.5, §9.8.

GIVEN a freshly initialised Windmill on Normal difficulty
THEN exactly 10 `zombie_villager_v2` with tag `andrew:guard:<id>` exist around the fields
WHEN the time is set to noon for 60 s → none is on fire and all 10 have full health
WHEN all players leave for 5 min (chunk unloaded) and the server restarts → all 10 still exist
WHEN 4 are killed and the server restarts twice → exactly 6 remain; the record stays `done`; no new tagged guard appears.
