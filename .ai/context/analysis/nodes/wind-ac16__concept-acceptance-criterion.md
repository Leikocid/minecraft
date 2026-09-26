---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac16"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-16 · Every Windmill makes exactly one linked-Airship attempt, not replaced by an independent Airship"
aliases: ["L0-wind-ac16"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 565
tags: ["is_a:acceptance-criterion", "spec-test:33", "verify:bds", "linked-airship"]
level: 2
---
# AC-wind-16 · Every Windmill makes exactly one linked-Airship attempt, not replaced by an independent Airship

**Spec:** test 33, §5.6.

GIVEN the spawn Windmill and a forced normal Windmill that already has an independent Airship within 100 blocks
THEN each Windmill's record has `x.linkedTried` set once with an outcome
AND where the outcome is `placed`, an `airship:L:<windmillId>` exists 40–100 blocks from the Windmill centre and not over its plot
AND the independent Airship did not stop the linked attempt
AND restarts do not create a second linked Airship.
