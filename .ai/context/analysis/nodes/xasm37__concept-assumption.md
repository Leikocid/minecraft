---
type: "concept-assumption"
node_id: "L0-xasm37"
source_channel: "rollout"
analysis_version: 9
title: "ASM-L0-37 · Speed targets"
aliases: ["L0-xasm37"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1300
tags: ["v9", "above-water-trident", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-37 · Speed targets: swim ≈ land sprint (5.6 b/s); dash = vanilla Riptide III launch"
aliases: ["L0-xasm37", "Trident speed targets"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twrp"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-37 · Speed targets

**Assumption (CAN_ASSUME).**
- **Swim speed.** "Approximately land running speed" means horizontal speed while swimming of **5.6 b/s ± 15 %**, the vanilla sprint speed. It is measured with a SimulatedPlayer swimming forward with and without the trident. The baseline is vanilla swim speed (≈ 2–3 b/s with sprint-swimming). The target applies with no Depth Strider or effects. Existing boosts stack naturally and are not capped further.
- **Dash strength.** "Riptide III-like" means the launch distance of a vanilla Riptide III trident used in water, flat, from a standing player. It is measured on BDS, and the scripted impulse is calibrated to ± 20 %. The direction is the full view vector, including upward.
- **Dash rate.** No cooldown. The rate is limited only by the vanilla charge minimum (10 ticks), which the use-duration component keeps.

**Impact if wrong.** Only the calibration constants change. The iPad sheet can ask Andrey to tune them.
