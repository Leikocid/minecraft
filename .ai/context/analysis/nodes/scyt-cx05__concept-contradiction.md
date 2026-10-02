---
type: "concept-contradiction"
node_id: "L0-scyt-cx05"
source_channel: "rollout"
analysis_version: 5
title: "CX-scyt-05 · `L0-adr-scyt` tuning (0.5 b/t, 5-tick stagger, `SCYTHE_TUNING`) is not what shipped (0.8 b/t, 10-tick stagger)"
aliases: ["L0-scyt-cx05"]
is_a: ["contradiction"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1193
tags: ["is_a:contradiction","category:adr-vs-impl","severity:low","target:L0","tuning","delta:2026-09-26","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-scyt-cx05
---

# CX-scyt-05 · `L0-adr-scyt` tuning (0.5 b/t, 5-tick stagger, `SCYTHE_TUNING`) is not what shipped (0.8 b/t, 10-tick stagger)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-adr-scyt", "L0-scyt-cx02", "L0-scyt-p002"]`

**Target:** `L0` (`L0-adr-scyt` §1) · **Category:** accepted ADR vs implementation · **Severity:** low · **Status:** open.

- **`L0-adr-scyt` (accepted):** 0.5 block/tick with pure pursuit, hit radius 1.0, **5-tick** stagger, 200-tick lifetime, all in one exported `SCYTHE_TUNING` constant. This ADR closed `L0-scyt-cx02`.
- **Shipped `volley-rules.ts`:** `PROJECTILE_SPEED = 0.8` ("a sprinting player covers ~0.28"), `LAUNCH_INTERVAL_TICKS = 10` (from `decision-scythe-projectiles`, "~0.5 s"), `HIT_RADIUS = 1.0`, `VOLLEY_TIMEOUT_TICKS = 200`. These are separate named exports; there is no `SCYTHE_TUNING` object.

Pure pursuit, the hit radius and the lifetime agree. Speed and stagger do not. The later autopilot decision (`decision-scythe-projectiles`) and the code win in practice.

**Needed:** amend `L0-adr-scyt` §1 to the shipped numbers, or say explicitly that they are deliberate. The GameTests already use the shipped constants.
