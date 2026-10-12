---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a004"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-004 (bds) · Normal fire and Super Fire differ"
aliases: ["L0-uwbw-a004"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 767
tags: ["v10", "underwater-bow", "bds", "fire", "§5-2", "C-43"]
level: 2
---
# AC-uwbw-004 (bds) · Normal fire and Super Fire differ

**Links.** relates_to: L0-uwbw-r002, L0-uwbw-esfr. Spec §5 bullet 2.

- **Normal hit, dry.** GIVEN a normal hit on a zombie on dry ground, THEN it reads on fire, and the fire lasts 2 s ± 2 ticks (Flame: max(2, Flame)).
- **Normal hit, wet.** GIVEN a normal hit on a target standing in water, THEN it takes no fire damage after 1 s.
- **Armed hit, wet.** GIVEN an armed hit on a target standing in water, THEN it takes exactly 5 `fireTick` hurts of 1 HP at 20-tick spacing (entityHurt witness), and none after 5 s + 2 ticks.
- **Blocks and immunity.** No fire block appears within 3 blocks. A blaze target takes 0 burn.
- **Negative control.** A normal hit in water yields 0 `fireTick` hurts in the same window.
