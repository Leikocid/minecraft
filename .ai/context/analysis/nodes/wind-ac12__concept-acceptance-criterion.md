---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac12"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-12 · Normal generation hits ~1 % of chunks and only on suitable dry land"
aliases: ["L0-wind-ac12"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 529
tags: ["is_a:acceptance-criterion", "spec-test:23", "verify:bds", "verify:unit", "normal-generation"]
level: 2
---
# AC-wind-12 · Normal generation hits ~1 % of chunks and only on suitable dry land

**Spec:** test 23, §4.6.

GIVEN the seeded roll function
THEN (unit) over 100 000 synthetic chunk keys the Windmill roll rate is 1 % ± 0.1 %
AND (BDS) after exploring ≥ 2 000 Overworld chunks, every placed normal Windmill has liquid share ≤ 5 % and surface Δ ≤ 3 under its plot at placement time (from the debug log), and no Windmill was placed in an ocean chunk
AND the log's roll-success count is consistent with 1 % (no exact match required).
