---
type: "concept-entity"
node_id: "L0-webs-ent2"
source_channel: "rollout"
analysis_version: 1
level: 2
title: "TargetResolution"
aliases: ["L0-webs-ent2"]
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 790
tags: ["entity", "targeting"]
---
---
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r002", "L0-webs-p001"]
---
# TargetResolution

The transient result of resolving a cast's aim into a single center cell. Not persisted — computed fresh per cast.

**Attributes.**
- `hitType`: `block` | `entity` | `none`
- `hitReachBlocks` (≤5) / `hitReachEntities` (≤3): the reach limits actually applied
- `hitFace` (when `hitType = block`): the struck block face, used to derive the adjacent air cell
- `hitEntityId` (when `hitType = entity`): the struck entity; wins ties over a simultaneously-hittable block
- `centerCell`: the resolved `{x,y,z}` used as the 3×3×3 cube's center (only present when `hitType ≠ none`)

**Invariant.** When `hitType = none`, no `centerCell` exists and no cube is ever built (`L0-webs-r002`).
