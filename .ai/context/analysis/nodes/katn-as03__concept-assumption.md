---
type: "concept-assumption"
node_id: "L0-katn-as03"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-as03"]
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 978
tags: ["assumption", "CAN_ASSUME", "katana", "safe-position", "is_a:assumption", "relates_to:L0-katn-cx01"]
level: 2
---
---
title: "AS-katn-03 · A landing cell must not be lava or fire; water is fine"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-cx01", "L0-katn-ad01", "L0-katn-r004", "L0-adr-ktob"]
---
**Gap.** §5 says lava does not block the **trace**. §6 says the destination is a **safe** position. `L0-adr-ktob` §3 lets liquids count as "fits", which would land a player inside a lava pool they aimed across.

**Assumption (CAN_ASSUME).**
- Lava, flowing lava, fire and soul fire in the feet or head cell make the candidate unsafe. The search steps back past them.
- Water is allowed: drowning is not immediate, and water breaks a fall.
- Hazardous floors (magma, campfire, powder snow) are allowed: §6 forbids only walls and suffocation.

**Impact if wrong.**
- If the client wants "land in lava if you aimed there", drop the filter.
- If the client wants hazard floors excluded too, extend the set.

One constant in `plan.ts`; T08 is unaffected (it aims *past* the lava).
