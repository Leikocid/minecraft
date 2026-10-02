---
type: "concept-assumption"
node_id: "L0-orbc-as02"
source_channel: "rollout"
analysis_version: 5
title: "ASM-orbc-02 · Fall speed is a constant 1 block per tick"
aliases: ["L0-orbc-as02"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 787
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-ad02", "tuning"]
level: 2
---
# ASM-orbc-02 · Fall speed is a constant 1 block per tick

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ad02", "L0-orbc-p002"]`

**Gap.** §8 says only "falls vertically down". No speed or acceleration is given.

**Assumption.**
- `FALL_SPEED = 1.0` block/tick, which is 20 blocks/s, constant with no acceleration.
- A +30 drop onto flat ground takes 1.5 s, and +10 in the Nether takes 0.5 s.
- It is exported as one named constant in `src/orbital/charge.ts`.

**Impact if wrong.**
- Faster (for example vanilla terminal, about 2–4 b/t) doubles the per-tick sweep reads and makes the TNT hard to see on the iPad.
- Slower makes aimed PvP shots easy to dodge.

The value is purely a tuning change. The sweep (`ad02`) keeps contact exact at any speed.
