---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac19"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac19"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 425
tags: ["acceptance-criterion", "T19", "bds", "lgnd-callsite", "retention"]
level: 2
---
**AC-sclk-19 (T19) · Death retention, crossbow instance** · channel `bds` · the rule is in `lgnd`

GIVEN a SimulatedPlayer holding a marked crossbow, WHEN it dies, THEN:
- no `andrew:sculk_crossbow` item entity spawns where it died;
- after respawn, the player's inventory holds exactly one marked crossbow, with its enchantments kept.

The framework's per-def retention scenario covers it with def #5 added to its def list.
