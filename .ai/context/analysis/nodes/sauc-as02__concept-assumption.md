---
type: "concept-assumption"
node_id: "L0-sauc-as02"
source_channel: "rollout"
analysis_version: 5
title: "AS-sauc-2 · Filled-in tunables: fall acceleration, path easing, departure height, sound volume"
aliases: ["L0-sauc-as02"]
is_a: ["assumption"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1352
tags: ["is_a:assumption", "CAN_ASSUME", "tunables", "relates_to:L0-sauc-p002", "relates_to:L0-sauc-r006", "relates_to:L0-sauc-r002"]
level: 2
---
# AS-sauc-2 · Filled-in tunables: fall acceleration, path easing, departure height, sound volume

**Assumption** (the spec leaves these open):
- **Fall.** `vy` starts at 0 and gains `a = 0.025` blocks per tick².
  - From the hover height (≈ 40 above the centre) the saucer touches ground at ≈ 57 ticks, just inside 3 s.
  - From arrival or departure height (+50) the 60-tick cap fires first, at ≈ 45 blocks of drop. The blast then happens a few blocks above the ground, which §8 allows ("or after 3 seconds").
  - Ground = the first non-air cell (solid **or liquid**) under the hull centre.
- **Easing.** Arrival uses smoothstep. Departure uses ease-in (it accelerates away).
- **Departure height.** Departure climbs back to `hoverY + 10`, mirroring the arrival. §2 states only "the opposite way beyond the horizon (90 blocks)".
- **Sound volume.** `volume: 4`, about a 64-block range, for every UFO sound.

**Impact if wrong.**
- These are all constants in `src/ufo/saucer.ts`, so changing one is a one-line edit.
- `ac01`, `ac03` and `ac05` assert the constants through exported values, not literals.
- Only the iPad look and listen check (`ac06`) can reject them.
- One residual risk: a reward dropped over lava burns, as vanilla items do. If the operator wants the reward to be loss-proof, the blast point must move to the nearest non-lava surface.
