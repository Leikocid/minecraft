---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac04"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 566
tags: ["acceptance-criterion", "T04", "bds", "trail"]
level: 2
---
**AC-sclk-04 (T04) · A shot spawns a bolt with a trail along its real path** · channel `bds` (visual on the iPad: ac23)

GIVEN a shooter SimulatedPlayer with the crossbow and arrows, aimed level at a wall 20 blocks away, WHEN it fires one charged shot,
THEN:
- exactly one `andrew:sculk_bolt` exists and no `minecraft:arrow` survives the spawn tick;
- the bolt's owner is the shooter, and its initial speed is within 5 % of the arrow's;
- the log shows trail emissions on ≥ 5 ticks, at points whose y drops over the flight (they follow gravity, not a straight ray).
