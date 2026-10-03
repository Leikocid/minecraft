---
type: "concept-assumption"
node_id: "L0-katn-as04"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-as04"]
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1045
tags: ["assumption", "CAN_ASSUME", "katana", "fall-damage", "is_a:assumption", "relates_to:L0-adr-ktfl"]
level: 2
---
---
title: "AS-katn-04 · Fall look-ahead scales with speed; riding and other cases are not special"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktfl", "L0-xasm20", "L0-katn-p002"]
---
**Gap.**
- `L0-adr-ktfl` fixes a 2-block look-ahead and notes it may need to scale.
- The spec says nothing about using the Katana while riding, sleeping or in a minecart.

**Assumption (CAN_ASSUME).**
1. The look-ahead is `max(2, ceil(|velocity.y|) + 1)` blocks. At ~3.9 blocks per tick that is 5, so the self-teleport can never be skipped over between two ticks.
2. Using it while riding is allowed. The engine's teleport dismounts the player, and the vehicle stays.
3. A self-teleport that lands within 0.3 of a ledge is accepted. The re-teleport uses the current exact location, so it cannot move the player.

**Impact if wrong.**
- If probe (1) shows the self-teleport snags or fails, the `slow_falling` fallback in `L0-katn-p002` §4 applies.
- If riding must be blocked, add one guard (`player.getComponent("riding")`) in `p001` step 2.
