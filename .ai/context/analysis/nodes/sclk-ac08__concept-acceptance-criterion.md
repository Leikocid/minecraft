---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac08"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 493
tags: ["acceptance-criterion", "T08", "bds", "armour", "shield", "xcx23"]
level: 2
---
**AC-sclk-08 (T08) · Armour, Protection and a shield do not reduce D** · channel `bds`

GIVEN a target SimulatedPlayer in full netherite with Protection IV,
WHEN:
- (a) it is hit by one bolt;
- (b) it holds a shield in the off hand, raised by sneaking, faces the shooter, and is hit by one bolt;

THEN in each case it loses exactly D. The case (b) bolt resolves once, as an entity hit, either through `projectileHitEntity` or through the shield fallback (`as02`). The log names the path used.
