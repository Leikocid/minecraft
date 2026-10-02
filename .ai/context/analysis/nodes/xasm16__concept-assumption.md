---
type: "concept-assumption"
node_id: "L0-xasm16"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "ASM-L0-16 · UFO tick budget: ≤ 2 ms mean per active tick, one ≤ 12 ms scan at magnet-on, held-player fall distance does not accumulate"
aliases: ["L0-xasm16"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1574
tags: ["CAN_ASSUME", "status:assumed", "relates_to:L0-ufoc", "relates_to:L0-magn", "relates_to:L0-xasm12", "v4"]
---
---
title: "ASM-L0-16 · UFO tick budget: ≤ 2 ms mean per active tick, one ≤ 12 ms scan at magnet-on, held-player fall distance does not accumulate"
aliases: ["L0-xasm16"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-magn", "L0-xasm12"]
see_also: ["ufomagnetspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4"]
---
# ASM-L0-16 · UFO tick budget: ≤ 2 ms mean per active tick, one ≤ 12 ms scan at magnet-on, held-player fall distance does not accumulate

**Assumption.**
- UFO §14 asks only that the active-tick cost be "measured and recorded", and gives no limit.
- The working budget is set as follows:
  - the active step (saucer move + ≤ 10 element teleports + per-player hand checks and knockback) is ≤ 2 ms mean and ≤ 5 ms p99;
  - the one-off scan at magnet-on, ≈ 9 ms measured (U7), is accepted up to 12 ms;
  - the idle clock check is negligible.
- With `L0-xasm12`, the UFO and a simultaneous RMB salvo are summed without a shared scheduler.
- **Physics:** U2 measured a lethal fall from the release point. The spec states that hovering does not accumulate fall height. The project's engine notes confirm this for *teleport*-held players. The UFO holds players with `applyKnockback`, so `magn` re-probes this: a 60 s hold ending 2 blocks above ground must deal no damage (AC-7).

**Impact if wrong.** A heavier step forces work to be spread across ticks. If knockback holding accumulates fall distance, players released near the ground take damage, so AC-7 fails and `magn` must reset fall distance (for example, a one-tick teleport before release).
