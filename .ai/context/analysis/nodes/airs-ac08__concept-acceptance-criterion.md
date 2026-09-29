---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac08"
source_channel: "rollout"
analysis_version: 2
title: "AC — the Windmill-linked attempt runs regardless of a nearby independent Airship"
aliases: ["L0-airs-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 592
tags: ["is_a:acceptance-criterion", "linked-search", "no-dedup", "verify:bds"]
level: 2
---
# AC — the Windmill-linked attempt runs regardless of a nearby independent Airship

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a Windmill instance that already has an independent Airship within 100 blocks of it, **WHEN** that Windmill's `afterPlace` hook runs, **THEN** `airs` still performs its own linked-attempt search in the 40–100-block ring — the existing independent Airship does not substitute for, skip, or block the linked attempt — and the two Airships, if the linked attempt also succeeds, do not physically overlap.

(Spec §5.6; raw test 33.)
