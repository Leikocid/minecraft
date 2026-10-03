---
type: "concept-assumption"
node_id: "L0-xasm20"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ASM-L0-20 · Fall-flag expiry"
aliases: ["L0-xasm20"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1380
tags: ["v6", "katana", "CAN_ASSUME", "alias:L0-xasm20", "is_a:assumption", "relates_to:L0-katn", "relates_to:L0-adr-ktfl", "see_also:dragonkatanaspecv1ruen-part-2"]
---
---
title: "ASM-L0-20 · The fall flag ends at the first landing, a liquid, a climb, death, a dimension change, logout or 10 s"
aliases: ["L0-xasm20", "Katana fall-flag expiry"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-adr-ktfl"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
# ASM-L0-20 · Fall-flag expiry

**Gap.** §7 says "the nearest landing related to this teleport" and "one-shot", but it does not define the cases where there is no landing:
- falling into water;
- grabbing a ladder or vine;
- an elytra glide;
- dying;
- a second teleport after the cooldown.

It also gives no time bound.

**Assumption (CAN_ASSUME).** The flag is consumed by whichever comes first:
- the first on-ground tick;
- entering a liquid;
- climbing;
- gliding;
- death;
- a dimension change;
- leaving the game;
- **10 s** of wall-clock time after the teleport (epoch ms, C-21, C-25).

A new Katana teleport replaces the flag rather than stacking it. The longest fall from the 20-block cap down to bedrock-level void takes well under 10 s at terminal velocity, so the bound never cuts off a legitimate landing in the Overworld.

**Impact if wrong.** If the client wants protection to survive a water bounce or a glide, the end conditions change in one function inside `katn`. The T12 test ("the next ordinary fall hurts") is unaffected.
