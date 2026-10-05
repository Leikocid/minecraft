---
type: "concept-assumption"
node_id: "L0-xasm23"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ASM-L0-23 · Sonic Boom damage = 10"
aliases: ["L0-xasm23"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 965
tags: ["v7", "sculk-crossbow", "CAN_ASSUME"]
---
---
title: "ASM-L0-23 · The Sonic Boom (Normal) damage is 10 HP, one constant"
aliases: ["L0-xasm23", "Sonic Boom damage = 10"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-scdm", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-3"]
---
# ASM-L0-23 · Sonic Boom damage = 10

**Gap.** §5 and T06 say "equal to vanilla Warden Sonic Boom on Normal difficulty", but give no number.

**Assumption (CAN_ASSUME).** `SONIC_BOOM_DAMAGE = 10` HP (5 hearts): the Warden's ranged attack on Normal. It is exported as one constant that the GameTests read. It ignores difficulty (T07), armour and the shield (T08, C-28).

**Verification.** The probe measures a real Warden's Sonic Boom on an unarmoured SimulatedPlayer at Normal on BDS 1.26.51. If the value differs, the constant takes the measured value.

**Impact if wrong.** One number changes. The T06–T08 and T17 expectations follow the constant. No design change.
