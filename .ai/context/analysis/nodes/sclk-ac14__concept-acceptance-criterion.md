---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac14"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac14"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 429
tags: ["acceptance-criterion", "T14", "bds", "quick-charge", "cx02"]
level: 2
---
**AC-sclk-14 (T14) · Quick Charge works, and the reload still limits** · channel `bds`

GIVEN two shooter SimulatedPlayers, one with Quick Charge III and one without, WHEN each repeatedly holds use until the shot fires,
THEN the Quick Charge III shooter's measured charge-to-shot time is ≤ 50 % of the plain one's (vanilla: 0.5 s vs 1.25 s, ±2 ticks).

AND a release after 2 ticks spawns **no** bolt for either shooter (`cx02`).
