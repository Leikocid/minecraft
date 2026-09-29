---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac01"
source_channel: "rollout"
analysis_version: 2
title: "AC — fixed modern appearance, size and randomized rotation"
aliases: ["L0-airs-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 669
tags: ["is_a:acceptance-criterion", "appearance", "rotation", "verify:unit", "verify:bds", "verify:ipad"]
level: 2
---
# AC — fixed modern appearance, size and randomized rotation

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship instance, **WHEN** it is inspected, **THEN**:
- Its palette is grey/light-grey concrete with intact glass windows and working lights; there is no vine, cobweb, crack, or other decay decoration anywhere on it.
- Its upper hull is a single decorative oval volume containing no chest and no spawner.
- Its overall footprint is 75×13×18 (L×W×H), template `[75, 18, 13]`.
- Across a sample of generated instances, the placed rotation is drawn from {0°, 90°, 180°, 270°} and is not fixed to a single value.

(Spec §5.1; raw tests 24, 25.)
