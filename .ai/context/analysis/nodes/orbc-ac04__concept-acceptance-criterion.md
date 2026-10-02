---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac04"
source_channel: "rollout"
analysis_version: 5
title: "AC-4 · Spawn height is +30 in the Overworld and End and +10 in the Nether, with the ceiling clamped `[bds]`"
aliases: ["L0-orbc-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 734
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-4", "relates_to:L0-orbc-r007"]
level: 2
---
# AC-4 · Spawn height is +30 in the Overworld and End and +10 in the Nether, with the ceiling clamped `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r007", "L0-orbc-cx03"]`

**GIVEN** the stub effect, which records `spawnY` and does not break blocks, and a target block T.

**THEN**
| Case | Expected spawn Y |
|---|---|
| Overworld, T.y = 64 | 94 |
| End, T.y = 60 | 90 |
| Nether, T.y = 40 | 50 |
| Overworld, T.y = 300 | 319 (clamped) |
| Nether, T.y = 120 | 127 (clamped) |

- The charge's (x, z) equals T's column centre.
- Every case is a pure unit test of `spawnY(dimId, T.y, heightRange)`, plus one BDS run per dimension that reads the entity position in the spawn tick.
