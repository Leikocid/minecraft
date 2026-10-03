---
type: "concept-assumption"
node_id: "L0-xasm18"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ASM-L0-18 · Range clamp"
aliases: ["L0-xasm18"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1360
tags: ["v6", "katana", "CAN_ASSUME", "alias:L0-xasm18", "is_a:assumption", "relates_to:L0-katn", "relates_to:L0-adr-ktob", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:dragonkatanaspecv1ruen-part-2"]
---
---
title: "ASM-L0-18 · Aim beyond 20 blocks is clamped along the ray, measured from the head"
aliases: ["L0-xasm18", "Katana range clamp"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-adr-ktob"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2"]
---
# ASM-L0-18 · Range clamp

**Gap.** §5 says "the player aims at a point within at most 20 blocks". T06 says "a point further than 20 does not allow exceeding the max range". Neither says whether aiming further *refuses* the use or *shortens* it. Neither says where the 20 is measured from.

**Assumption (CAN_ASSUME).**
- The trace runs from the player's **head location** along the view, for at most 20 blocks.
- If nothing solid is hit within 20, the endpoint is the point 20 blocks out, in the air. This counts as a valid use, consistent with "a point in the air is allowed", and it consumes the cooldown.
- The resulting feet position may differ from the endpoint by the safe-cell correction (`L0-xasm19`), but never lies further than 20 blocks from the head.

**Impact if wrong.** If the client wants a refusal for over-range aim:
- the trace stays the same;
- `katn` adds a "no target" branch: no teleport, no cooldown, and a HUD hint;
- T06's GameTest flips from "lands at ≤ 20" to "does not move".

The cost is small, and the decision is local to `katn`.
