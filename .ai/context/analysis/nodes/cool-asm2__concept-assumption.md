---
type: "concept-assumption"
node_id: "L0-cool-asm2"
source_channel: "rollout"
aliases: ["L0-cool-asm2"]
part_of: ["L0-cool"]
is_a: ["assumption"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 604
tags: ["assumption","actionbar","tuning","L0-cool"]
level: 2
---

## ASM-cool-2 — 20-tick (≈1 s) actionbar update cadence `CAN_ASSUME`

**Assumed.** The render loop (`L0-cool-proc2`) fires once per second (every 20 ticks), not every tick.

**Basis.** §8 specifies no granularity, only that remaining time must be visible while holding. A 1 s cadence is finer than a human reads a 30 s countdown, and keeps the one permitted recurring tick (C-4) as cheap as the requirement allows.

**Impact if wrong.** Purely a tuning value — a smoother or coarser countdown is a one-line change to `L0-cool-adr1`'s cadence parameter with no structural consequence. Low risk either way.
