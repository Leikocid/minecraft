---
type: "concept-entity"
node_id: "L0-webs-ent3"
source_channel: "rollout"
analysis_version: 1
level: 2
title: "TrapCube"
aliases: ["L0-webs-ent3"]
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 802
tags: ["entity", "trap"]
---
---
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r003", "L0-webs-r004", "L0-webs-p001"]
---
# TrapCube

The 27-candidate-cell volume evaluated for one cast. Transient — exists only for the duration of the placement step.

**Attributes.**
- `center`: from `TargetResolution.centerCell`
- `cells[27]`: each cell's `{position, status}`, where `status` ∈ `filled` (newly placed Cobweb) | `already-satisfied` (was already Cobweb) | `skipped-protected` (inventory/block-entity/indestructible-special, `L0-webs-r004`) | `skipped-entity` (living entity present) | `skipped-unloaded` (cell outside the loaded/accessible area)
- `successCount`: count of cells with status `filled` or `already-satisfied`
- `outcome`: `success` (`successCount ≥ 1`) | `no-room` (`successCount = 0`, `L0-webs-r005`)
