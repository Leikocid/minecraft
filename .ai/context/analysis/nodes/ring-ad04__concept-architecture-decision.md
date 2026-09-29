---
type: "concept-architecture-decision"
node_id: "L0-ring-ad04"
source_channel: "rollout"
analysis_version: 3
title: "AD-ring-04 · One legendary-protection call per queue step, not per charge"
aliases: ["L0-ring-ad04"]
is_a: ["architecture-decision"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1273
tags: ["is_a:architecture-decision", "legendary", "performance", "status:proposed", "relates_to:L0-lgnd-p008", "relates_to:L0-ring-r008", "relates_to:L0-ring-cx02"]
level: 2
---
# AD-ring-04 · One legendary-protection call per queue step, not per charge

**Status:** proposed. It refines the cost note in `L0-lgnd-p008` ("RMB calls it once per detonation").

**Context.**
- ~145 detonations per attack × (one engine-filtered `getBlocks` + one `getEntities`) gives ~290 queries per attack, and ~870 for three attacks.
- The blast AABBs of neighbouring ring cells overlap almost entirely.

**Decision.**
- Per queue step and per dimension, call `protectLegendariesIn(dim, union(centres) ± 8, {avoid: footprint ± 8, reason: "ring"})` once, before the first `createExplosion` of that step (`p002` step 3).
- The union AABB is at most the ring footprint ± 8, which is 37 × 37 horizontally and 17+ vertically.
- The helper is idempotent, so a legendary already moved is simply absent the next time.

**Rejected.**
- **Per detonation** (the literal `lgnd-p008` cost note): 30–50× more queries for the same protection.
- **Once per attack, at activation:** items or containers can enter the area during the fall (up to ~1.5 s), and the tier-1 guarantee needs "before the first block change of that tick" (`L0-lgnd-r013` §1).

**Consequence.** The safe-spot search must escape a 37 × 37 `avoid` box. The current 16-block search radius cannot (`L0-ring-cx02`).
