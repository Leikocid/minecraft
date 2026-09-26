---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac03"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 629
tags: ["is_a:acceptance-criterion", "verify:bds", "validity"]
level: 2
---
**AC-strf-03 · Footprint validity rejects water, lava ocean, unevenness and the ceiling** (`L0-strf-r005`, `-r013`, `-r003`; spec tests 31, 42, 52)

GIVEN prepared test sites (flat grass; grass with a 30 % water pond; a 6-block step; a mountain top whose max Y + 40 + H > 319; a Nether lava sea at Y 31; a Nether netherrack shelf), WHEN `validate()` runs for each relevant profile, THEN the results are, in order: valid, `liquid`, `uneven`, `ceiling`, `lavaOcean`, valid. For the Airship on flat ground at Y 64, the chosen `bottomY` is in [104, 134]. With a 20-block tree at one corner, `bottomY ≥ treeTop + 40`.
**Verify:** bds.
