---
type: "concept-rule"
node_id: "L0-orbc-r007"
source_channel: "rollout"
analysis_version: 5
title: "Rule · Charge spawn height per dimension, clamped to the ceiling"
aliases: ["L0-orbc-r007"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1097
tags: ["is_a:rule", "relates_to:L0-orbc-cx03", "relates_to:L0-orbc-as01", "spawn-height"]
level: 2
---
# Rule · Charge spawn height per dimension, clamped to the ceiling

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-cx03", "L0-orbc-as01", "L0-orbc-ac04"]`

`spawnY = min(target.y + OFFSET[dim], dim.heightRange.max − 1)`

| Dimension | `OFFSET` |
|---|---|
| `minecraft:overworld` | 30 |
| `minecraft:the_end` | 30 |
| `minecraft:nether` | 10 |
| any other dimension (future-proof) | 30 |

- `heightRange.max` is the first Y *above* the build limit (`src/structures/site.ts`). So `max − 1` is the highest placeable cell: 319 in the Overworld, 127 in the Nether and 255 in the End.
- There is no lower clamp. `target.y` is always ≥ `heightRange.min`.
- **All charges of one attack share `spawnY`**, which is derived from the target block. They do not use their own column's terrain. RMB "fall at the same time" therefore holds (§10), and the actual blast time varies with the terrain.
- The clamp is only an upper bound. If the clamped cell is solid (for example the Nether's bedrock roof), `r008`'s inside-solid rule applies. See `cx03`.

Source: Orbital §8 and AC-4.
