---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac01"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 576
tags: ["acceptance-criterion", "T01", "bds", "lgnd-callsite"]
level: 2
---
**AC-sclk-01 (T01) · First Survival craft** · channel `bds` · the rule is in `lgnd`, this is the crossbow call site

GIVEN a fresh world and a Survival SimulatedPlayer, WHEN a Crafter (a real recipe craft, loaded via `/replaceitem`) is loaded with the pattern ` E / DCD / E ` (E echo shard, D deepslate, C crossbow) and crafts,
THEN:
- the output token becomes one marked `andrew:sculk_crossbow` in the player's inventory;
- the world's `sk` craft flag is set (`L0-adr-sckp`);
- the localized first-craft broadcast names the player.

The same pattern with cobbled deepslate produces nothing.
