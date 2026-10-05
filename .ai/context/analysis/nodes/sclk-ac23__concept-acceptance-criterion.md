---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac23"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac23"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 462
tags: ["acceptance-criterion", "ipad", "manual", "trail"]
level: 2
---
**AC-sclk-23 · iPad: the trail looks like a Sonic Boom and follows the bolt** · channel `ipad` (manual, by the operator)

GIVEN the production world on the iPad, WHEN the operator fires a bolt at a target 25 blocks away, THEN they see:
- a row of teal Sonic Boom rings that follows the bolt's arc, not a straight beam;
- the rings fade within about 1 s after the bolt ends;
- no visible frame drop with a Multishot volley.

Reopen after every `sclk` epic merge.
