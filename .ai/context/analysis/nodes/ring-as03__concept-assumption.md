---
type: "concept-assumption"
node_id: "L0-ring-as03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as03"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 586
tags: ["is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-ring-r004", "relates_to:L0-ring-ac13"]
level: 2
---
**ASM-ring-03 · `source: owner` does not exempt the owner from damage**

**Assumption.** `ExplosionOptions.source` only attributes the explosion, for kill messages and credit. The source entity still takes damage and knockback, as a player who lit vanilla TNT does.

**Probe.** Run AC-13 twice, with and without `source`, on a SimulatedPlayer owner at 3 blocks. Compare the health loss.

**Impact if wrong.** If `source` exempts the owner, omit `source` on every blast. The only loss is kill attribution in the death message ("blown up" instead of "blown up by X"). Document it (C-16).
