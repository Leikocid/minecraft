---
type: "concept-entity"
node_id: "L0-orbc-ent2"
source_channel: "rollout"
analysis_version: 3
title: "Entity · Attack (with its Target Lock)"
aliases: ["L0-orbc-ent2"]
is_a: ["entity"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1475
tags: ["is_a:entity", "relates_to:L0-orbc-ent3", "relates_to:L0-orbc-p001", "relates_to:L0-orbc-ad03"]
level: 2
---
# Entity · Attack (with its Target Lock)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["entity"]` · `relates_to: ["L0-orbc-ent3", "L0-orbc-p001", "L0-orbc-ad03"]`

The attack is an in-memory record made by one successful activation (`p001`). It is **never persisted** (`ad03`, §11).

| Attribute | Type | Notes |
|---|---|---|
| `attackId` | string | Unique per server session, e.g. `oc-<tick>-<seq>`. It is also the tag on every charge. |
| `mode` | `"lmb" \| "rmb"` | Which effect `onDetonate` routes to |
| `ownerId` | string | `Player.id` at activation. It is kept even when the owner dies, leaves or changes dimension (`r010`). |
| `dimensionId` | string | Fixed at activation. Charges never leave it. |
| `target` | `{x,y,z}` int | **Target lock**: the hit block's location and the face it was hit on. It is frozen at activation and never re-read from the player. |
| `face` | `Direction` | Recorded for diagnostics only. The column/ring centre is the block's (x, z), whichever face was hit. |
| `spawnY` | int | From `r007` |
| `charges` | `Charge[]` | LMB: 1. RMB: ~160 from `ring`'s layout (`xasm8`). |
| `createdTick` | int | For the safety timeout (`p002`) |

**Invariants**
- The attack is created in the same tick as the cooldown write and the charge spawn.
- It is removed when `charges` is empty, whether each charge detonated, fell into the Void, was lost or timed out.
- There is no path from the attack back to the cooldown. Removing an attack never refunds.
