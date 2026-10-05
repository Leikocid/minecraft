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

- (c) it holds a raised shield and its health is ≤ D;
- (d) it holds a raised shield and a totem of undying in the other hand.

THEN in (a) and (b) it loses exactly D; the case (b) bolt resolves once, as an entity hit, through `projectileHitEntity` — a raised shield neither deflects the bolt nor suppresses the event (measured 5/5). In (c) it dies from the one bolt, with the kill credited to the shooter. In (d) the totem is used. The log names the path used.
