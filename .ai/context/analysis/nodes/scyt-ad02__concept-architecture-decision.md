---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad02"
source_channel: "rollout"
analysis_version: 5
title: "ADR-scyt-02 — \"Visible\" = every block cell on the eye-to-eye segment is air or liquid"
aliases: ["L0-scyt-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1391
tags: ["is_a:architecture-decision", "targeting", "visibility", "delta:2026-09-26"]
level: 2
---
# ADR-scyt-02 — "Visible" = every block cell on the eye-to-eye segment is air or liquid

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-r001", "L0-scyt-gl03", "ASM-023"]`

Status: **implemented** (`hasLineOfSight`, `rayCells`). It replaces the proposed `getBlockFromRay` with a head-or-centre fallback.

**Context.** Spec §3 says «видимый» and does not define it. Stable 2.10.0 has no `isSolid`.

**Decision.** The segment runs from `owner.getHeadLocation()` to `candidate.getHeadLocation()`. It is sampled every 0.5 blocks and collapsed into unique integer cells. The two endpoint cells are excluded, so a head inside a slab or cobweb is not a wall. A cell blocks the view unless `block.isAir || block.isLiquid`. An unreadable cell (unloaded chunk, outside the world) also blocks.

**Consequences.** Glass, leaves, cobweb, tall grass, flowers, slabs and fences all block the view. A player standing in tall grass, or a mob hidden behind a flower, is invisible. There is one probe (eyes), so a target whose head is behind cover but whose feet are exposed is not visible. That is the reverse of the earlier proposal.

**Rejected.**
- `getBlockFromRay` with `includePassableBlocks: false`. It was the earlier proposal. The shipped sampling was chosen instead, and no reason is recorded in the code.
- Entity occlusion. Mobs do not hide players.
