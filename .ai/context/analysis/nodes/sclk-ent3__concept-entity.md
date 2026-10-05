---
type: "concept-entity"
node_id: "L0-sclk-ent3"
source_channel: "rollout"
analysis_version: 7
title: "E-sclk-3 · `BoltRecord` (in memory, never persisted)"
aliases: ["L0-sclk-ent3"]
is_a: ["entity"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1067
tags: ["entity", "state", "in-memory", "C-23", "C-26"]
level: 2
---
# E-sclk-3 · `BoltRecord` (in memory, never persisted)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-sclk-r001", "L0-sclk-ad03", "L0-sclk-p003"]`

The store is `Map<string, BoltRecord>` in `src/sculk/bolts.ts`, keyed by `bolt.id`.

| Field | Type | Meaning |
|---|---|---|
| `bolt` | Entity | the `andrew:sculk_bolt` |
| `ownerId` | string | the shooter's entity id; the Entity is re-resolved at hit time for `damagingEntity` |
| `ownerName` | string | for logs and the death message fallback |
| `dimensionId` | string | |
| `seed` | uint32 | a per-bolt RNG seed for the crater and the patch, logged so a GameTest can replay it |
| `bornTick` | number | `system.currentTick` at the spawn |
| `lastPos` | Vector3 | the start of the next trail segment |
| `volleyId` | string | the same for the 3 Multishot bolts (logs only; it never merges outcomes) |

**Lifecycle.** Created in p002. Deleted exactly once: by p004 or p005 (claimed before acting) or by p003 (expired, invalid or unloaded). On a world reload the map starts empty (C-23).
