---
type: "concept-assumption"
node_id: "L0-wrdn-as01"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-wrdn-as01"]
is_a: ["assumption"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 1334
tags: ["CAN_ASSUME", "is_a:assumption", "worldgen", "relates_to:L0-xcx4"]
level: 2
---
**ASM-wrdn-01 · "Naturally generated" describes required behavior, not the placement mechanism**

§13.1/§13.5 call the city and its 8 Shriekers "naturally generated" and require them to behave exactly like vanilla worldgen output. Stable Bedrock Script API has no hook to inject custom content into actual chunk generation (same gap already flagged for the shared framework in `L0-xcx4`). The Windmill/Airship sections of the same doc use an explicit chunk-candidate-roll-then-fill pattern, and Mini Warden City's own §13.2 wording ("5% на подходящий чанк... генерация отменяется") is worded identically to theirs.

**Assumption:** Mini Warden City is placed post-hoc via script (a fill/place pass after the chunk has generated), exactly like its three siblings. "Naturally generated" in the spec means the Shriekers must be functionally indistinguishable from vanilla ones at runtime (full `can_summon` warning/Warden-summon participation) — it is not a demand for true vanilla structure/jigsaw injection.

**Impact if wrong:** if literal worldgen-time injection were required, it is very likely infeasible with stable Bedrock APIs at all; the project's own "closest stable approximation, document the deviation" directive would then apply anyway, so the practical implementation converges on the same approach regardless. Low risk.
