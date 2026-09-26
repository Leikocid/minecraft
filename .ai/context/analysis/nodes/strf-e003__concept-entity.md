---
type: "concept-entity"
node_id: "L0-strf-e003"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `Candidate` (transient, never persisted)"
aliases: ["L0-strf-e003"]
is_a: ["entity"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 774
tags: ["is_a:entity", "worldgen"]
level: 2
---
# Entity — `Candidate` (transient, never persisted)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

| Attribute | Meaning |
|---|---|
| `def` | `StructureDef` |
| `dim` | dimension id |
| `chunk` | `(cx, cz)` that rolled. `null` for relocating searches |
| `origin` | x/z min corner of the rotated AABB. y is filled in by the vertical solver |
| `rot` | 0–3, seeded |
| `aabb` | rotated AABB plus margin, used for loaded/collision checks |
| `source` | `roll` / `spawnSearch` / `linked` |
| `status` | `new` → `valid` / `rejected(reason)` / `pending` |

- A candidate becomes an `InstanceRecord` only after validation succeeds, at reservation.
- `pending` candidates are held in a per-chunk in-memory map and rebuilt from the roll after a restart (`L0-strf-r007`).
