---
type: "concept-assumption"
node_id: "L0-pntr-as01"
source_channel: "rollout"
analysis_version: 5
title: "AS-pntr-01 · Irregularity model and top edge"
aliases: ["L0-pntr-as01"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 587
tags: ["title:AS-pntr-01 · Irregularity model and top edge", "is_a:assumption", "CAN_ASSUME", "relates_to:L0-pntr-r001", "relates_to:L0-pntr-ad02"]
level: 2
---
# AS-pntr-01 · Irregularity model and top edge

**Gap.** §9 gives only "approximately 5×5", "small natural irregularity" and "from the actual trigger point".

**Assumption (CAN_ASSUME).**
- Horizontally the column fits in 7×7, with a 3×3 core that is always present and about 25 cells per layer.
- It starts exactly at the detonation cell's y. There is no crater or bowl above it and no widening at the surface.

**Impact if wrong.** If the client expects a TNT-like crater at the top, add a small hemispherical cut (r≈2.5) around `top`. That is a local change to `planColumn` and cheap.
