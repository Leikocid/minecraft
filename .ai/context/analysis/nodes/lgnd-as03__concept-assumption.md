---
type: "concept-assumption"
node_id: "L0-lgnd-as03"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-as03"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 684
tags: ["assumption", "CAN_ASSUME", "engine"]
level: 2
---
**ASM-lgnd-03: The stable 2.10.0 API raises `world.beforeEvents.entityRemove` and `entitySpawn` for `minecraft:item` entities, without a removal reason.**

The removals assumed to raise the event: falling below the world floor, lava/fire, cactus, explosions and despawn. Because the event gives no reason, pickup vs. loss is inferred (`L0-lgnd-p003` step 3).

**Impact if wrong:**
- If the Void kill raises no `entityRemove`, the watcher's `y < heightRange.min` check becomes the only Void path. It still works.
- If some destruction cause raises nothing, that cause is not covered, and ac09 narrows.

This must be measured on BDS 1.26.51.x first, as was done for retention path A/B.
