---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a10"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 526
tags: ["is_a:acceptance-criterion", "ufo-ac-10", "channel:bds", "relates_to:L0-magn-rblk", "relates_to:L0-magn-cxdp"]
level: 2
---
**UFO AC-10 (bds).**
- **GIVEN** isolated iron_block, iron_bars, rail, anvil, cauldron, chain and lantern, an iron door (2 high), and one iron_ore, with nothing else in the zone,
- **WHEN** the magnet turns on,
- **THEN**:
  - every source position (both door cells included) is air;
  - exactly one new item entity exists per source: the block's item, one `iron_door`, and one `raw_iron` for the ore;
  - the total count of new item entities in the zone equals the number of sources (9);
  - this holds again 10 ticks later.
