---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac06"
source_channel: "rollout"
analysis_version: 5
title: "AC-wind-06 · The decorative lighting does not disable any spawner"
aliases: ["L0-wind-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 398
tags: ["is_a:acceptance-criterion", "spec-test:18", "verify:bds", "lighting"]
level: 2
---
# AC-wind-06 · The decorative lighting does not disable any spawner

**Spec:** test 18, §4.3 last bullet.

GIVEN a placed Windmill at night and at noon, lanterns intact
WHEN a player stands within activation range of each spawner for 2 in-game minutes
THEN each of the 3 spawners produces ≥ 1 mob
AND (unit) every spawnable cell near each spawner has computed block light ≤ `Lmax` (`L0-wind-as07`).
