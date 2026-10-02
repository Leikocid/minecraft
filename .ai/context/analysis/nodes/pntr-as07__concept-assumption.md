---
type: "concept-assumption"
node_id: "L0-pntr-as07"
source_channel: "rollout"
analysis_version: 5
title: "AS-pntr-07 · Liquids and gravity blocks react to script `setType`"
aliases: ["L0-pntr-as07"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 794
tags: ["title:AS-pntr-07 · Liquids and gravity blocks react to script setType", "is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-pntr-p002", "relates_to:L0-pntr-r002"]
level: 2
---
# AS-pntr-07 · Liquids and gravity blocks react to script `setType`

**Gap.** §9 says liquids "flow naturally into the shaft" after removal. The stable docs do not guarantee that `Block.setType` fires the neighbour updates that make water, lava or sand move.

**Assumption (CAN_ASSUME).** `setType` triggers ordinary neighbour updates:
- adjacent water and lava start flowing into the new air;
- sand and gravel above removed cells fall.

**Probe.** Fire LMB next to a water pool and under a sand overhang. Water must enter the shaft within 2 s and the sand must fall.

**Impact if wrong.** The shaft walls stay as frozen liquid faces, which violates §9 and AC-7. The fix: after the job, touch each edge liquid cell (`setType` to the same liquid) to force an update. That is O(perimeter) cheap.
