---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac11"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 525
tags: ["is_a:acceptance-criterion", "verify:bds", "dimension", "statistics"]
level: 2
---
**AC-strf-11 · Dimension lock and statistical rates** (`L0-strf-r002`, `-r003`; spec tests 23, 32, 41, 51)

GIVEN a test hook that evaluates K ≥ 4 000 fresh chunks per dimension (Overworld, Nether, End), WHEN discovery runs, THEN End: 0 candidates. Overworld: no Bastion rolls. Nether: no Windmill/Airship/Warden rolls. For each def, the **roll** success share is within ±3σ of its chance. The **placed** share is reported together with the reject-reason counters. Placed ≤ rolled is the only hard assertion.
**Verify:** bds.
