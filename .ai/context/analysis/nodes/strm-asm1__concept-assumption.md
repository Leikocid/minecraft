---
type: "concept-assumption"
node_id: "L0-strm-asm1"
source_channel: "rollout"
analysis_version: 8
title: "ASM-strm-1 · Defaults filled in by strm"
aliases: ["L0-strm-asm1"]
is_a: ["assumption"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1583
tags: ["v8", "storm-blade", "CAN_ASSUME", "testing"]
level: 2
---
---
title: "ASM-strm-1 · Sample sizes, melee damage value and the live passive band"
is_a: ["assumption"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-acd", "L0-xasm30", "L0-strm-pprb"]
---
# ASM-strm-1 · Defaults filled in by strm

1. **Seeded passive rate.**
   - N = 10 000 rolls of the real `rollPassive(rng)` with a fixed-seed PRNG. The observed rate must be in [0.29, 0.31].
   - Both branches are also forced with stub RNGs (`() => 0`, `() => 0.99`).
   - **If wrong:** none; it is deterministic.
2. **Live ±5 % band.**
   - The live sample is **N ≥ 600** real melee hits. Each is spaced past the 10-tick hurt window, so the run takes ≈ 6 000 ticks, about 5 min.
   - At p = 0.3, σ ≈ 1.9 %, so ±5 % ≈ 2.7σ and the false-red rate is ≈ 0.8 %. N = 300 would be ≈ 6 %, which is too flaky for a suite that is already flaky.
   - The live test runs as its own scenario, outside the default blast-radius gate.
   - **If wrong** (too slow): drop to N = 400 (≈ 2 % flake) and accept a re-run as a deviation.
3. **Melee damage.** `minecraft:damage` = the probe-P6 value, expected **7** (Bedrock diamond sword). Note that the Scythe's 8 matched netherite. **If wrong:** one JSON value.
4. **Strike stagger.** Three strikes over ≤ 6 ticks (0/3/6). The column is ~6 blocks high. **If wrong:** cosmetic.
5. **Entity hit point** = the ray-entity distance along the trace. If the API gives no distance, use the entity's location + 1 (body centre). **If wrong:** visual offset only.
6. **The probe uses diamond armour + Protection IV** as "armoured". **If wrong:** none; the mob is the control.
