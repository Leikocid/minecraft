---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac06"
source_channel: "rollout"
analysis_version: 2
title: "AC — altitude clearance and rejection over water / near the world ceiling"
aliases: ["L0-airs-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 669
tags: ["is_a:acceptance-criterion", "altitude", "validity"]
level: 2
---
# AC — altitude clearance and rejection over water / near the world ceiling

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a rolled Airship candidate, **WHEN** its footprint is validated, **THEN**:
- Its bottom sits at least 40 blocks above the highest terrain point (including trees) under its whole rotated footprint, with a target clearance of 40–70 blocks where the build height allows it.
- A candidate whose footprint is significantly over open water is rejected.
- A candidate that cannot fit below the world ceiling even at the minimum 40-block clearance is rejected, with no downgrade below 40.

(Spec §5.4; raw tests 30, 31.)
