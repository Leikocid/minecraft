---
type: "concept-rule"
node_id: "L0-scyt-r006"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-006 — Each hit launches the target about 10 blocks; fall damage is kept"
aliases: ["L0-scyt-r006"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1007
tags: ["is_a:rule", "launch", "knockback"]
level: 2
---
# R-scyt-006 — Each hit launches the target about 10 blocks; fall damage is kept

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-as04", "L0-scyt-as02"]` · source: Scythe §4, §8 test 6.

**Rule:**
- After the damage is applied, every successful hit gives the target a vertical impulse that peaks about **10 blocks** above the takeoff Y. The tolerance for the AC is 8 to 12 blocks on flat ground with no effects.
- There is no horizontal push, and horizontal momentum is kept.
- Fall damage on landing is vanilla and is **not** suppressed. Script never sets `fall_distance` and never grants Slow Falling.
- A hit on an airborne target applies the impulse again from its current height, so the heights stack. That is allowed by §4 («оставшиеся снаряды могут попасть… в воздухе»).

**Mechanism:** `player.applyKnockback({ x: 0, z: 0 }, verticalStrength)` (stable 2.x signature). The vertical strength is calibrated on BDS to reach an apex of about 10 (`L0-scyt-as02`).
