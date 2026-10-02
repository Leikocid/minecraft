---
type: "concept-acceptance-criterion"
node_id: "L0-sauc-ac04"
source_channel: "rollout"
analysis_version: 5
title: "AC-sauc-4 (bds · gate) · The `orbc` interceptor seam is additive: the Orbital suite stays unchanged"
aliases: ["L0-sauc-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1025
tags: ["is_a:acceptance-criterion", "channel:bds", "regression-gate", "relates_to:L0-sauc-p003", "relates_to:L0-adr-ufoi", "relates_to:L0-orbc"]
level: 2
---
# AC-sauc-4 (bds · gate) · The `orbc` interceptor seam is additive: the Orbital suite stays unchanged

**GIVEN** the task branch with the `registerInterceptor` change in `src/orbital/flight.ts`.

**WHEN** the full GameTest suite runs (every Orbital flight, penetrator and ring scenario, plus every other scenario), along with the node tests.

**THEN**
- Every pre-existing scenario passes with unchanged assertions.
- A node test shows that `advance()` returns identical results with an empty interceptor set.
- A new scenario with a stub interceptor at target + 30 shows:
  - the charge ends `intercepted`;
  - zero blocks changed;
  - no `onDetonate` call;
  - the cooldown was started;
  - `observeChargeEnds` saw the outcome `intercepted`.
- The same scenario with the stub unregistered detonates normally. This is the in-test negative control.
- An interceptor that throws is logged, and the charge detonates normally.

The merge happens only after the whole suite is green on the task branch, not after an `--only` run.
