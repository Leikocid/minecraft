---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac20"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac20"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 464
tags: ["acceptance-criterion", "T20", "bds", "lgnd-callsite", "hazards", "orbital"]
level: 2
---
**AC-sclk-20 (T20) · The item entity survives hazards, crossbow instance** · channel `bds` · the rule is in `lgnd` (C-16 reading of `xcx21`)

GIVEN a dropped marked crossbow, WHEN it is put through fire, lava, cactus, TNT, an Orbital LMB blast and the Void,
THEN after each, **exactly one** marked crossbow exists, held or owed to `mark.owner` (`xasm26`).

AND a crossbow lying inside a crossbow crater box is protected by `protectLegendariesIn` before the carve.
