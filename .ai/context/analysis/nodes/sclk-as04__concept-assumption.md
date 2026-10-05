---
type: "concept-assumption"
node_id: "L0-sclk-as04"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-as04"]
is_a: ["assumption"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 755
tags: ["assumption", "CAN_ASSUME", "budget", "performance"]
level: 2
---
**AS-sclk-04 · Performance constants (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-ad04", "L0-sclk-r007", "L0-sclk-cons"]`

| Constant | Value | Basis |
|---|---|---|
| `TRAIL_PER_TICK` | 3 | about 1 ring per 1–1.3 blocks at full arrow speed (~3 blocks/tick) |
| `CARVE_BUDGET_PER_TICK` | 300 | one full volley in one tick; the Orbital ring carve has run at similar per-tick counts on the iPad |
| `BOLT_LIFETIME_TICKS` | 100 | `xasm27` |
| `MIN_BOLT_SPEED` | 90 % of the full-draw speed | `cx02`; the probe's Q5 measures it |

**Impact if wrong.** These are TPS-only effects. `ufo_hold_tps_measured`-style measurement on the iPad (a 3-player Multishot burst) retunes the constants. No logic changes.
