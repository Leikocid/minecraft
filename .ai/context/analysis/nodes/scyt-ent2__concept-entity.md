---
type: "concept-entity"
node_id: "L0-scyt-ent2"
source_channel: "rollout"
analysis_version: 5
title: "Volley (in-memory flight record) — replaces the proposed TargetLock"
aliases: ["L0-scyt-ent2"]
is_a: ["entity"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1445
tags: ["is_a:entity", "volley", "delta:2026-09-26"]
level: 2
---
# Volley (in-memory flight record) — replaces the proposed TargetLock

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p002", "L0-sprj"]`

There is no separate TargetLock record. `selectTarget` returns an `Entity` (a player **or** a mob), and `launchVolley(owner, target)` builds this record. It is stored in `active: Map<ownerId, Volley>` (`src/scythe/volley.ts`) and never persisted.

| Attribute | Type | Notes |
|---|---|---|
| owner / ownerId | Player / string | The owner handle is kept, and `isValid` is checked before use |
| target | Entity | Player or mob. `label()` logs the nameTag or typeId |
| dimensionId | string | The owner's dimension at launch. The target must stay in it |
| launchPoint | Vector3 | A copy of `owner.location`, frozen. It is the leash centre |
| age | ticks | Since launch. Past 200 → `timeout` |
| fired / flying | number / `{position}`[] | Projectile *i* spawns at tick `10·i` from `launchOrigin` (the owner's current feet + 1.2, or launchPoint + 1.2 if the owner is gone) |
| hits | number | Drives the cooldown verdict |
| runId | number | Its own `system.runInterval(…, 1)`, one per volley |
| observer | `{onHit, onEnd}` | The wrapper arms the cooldown on hit 1. GameTests hook in here |

**Invariants:**
- at most one volley per owner (`launchVolley` returns false otherwise);
- `projectiles ≤ 3`;
- the aim point is `target.location + (0, 1.0, 0)`, re-read every tick.
