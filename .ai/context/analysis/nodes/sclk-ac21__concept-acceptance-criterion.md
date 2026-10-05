---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac21"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac21"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 422
tags: ["acceptance-criterion", "probe", "bds-checks", "gate"]
level: 2
---
**AC-sclk-21 · The probe is recorded before any build task** · channel `bds` (checks, 19136)

GIVEN the probe pack (p001), THEN:
- Q1–Q9 each have a logged yes/no and a measured value in the probe artifact;
- `L0-adr-scbs` and `L0-adr-scdm` are marked `accepted` or `superseded`, citing those values;
- `cx01` and `cx02` are updated with the Q2 and Q5 results.

No `sclk` item, pipeline or crater task starts before this.
