---
type: "concept-assumption"
node_id: "L0-infr-as03"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — statistical chunk-roll check sample size and tolerance are infra's to pick"
aliases: ["L0-infr-as03"]
is_a: ["assumption"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 1236
tags: ["is_a:assumption", "kind:CAN_ASSUME", "relates_to:L0-infr-p006", "relates_to:L0-infr-r006", "relates_to:L0-xq2", "v2-delta"]
level: 2
---
# Assumption (CAN_ASSUME) — statistical chunk-roll check sample size and tolerance are infra's to pick

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-p006", "L0-infr-r006", "L0-xq2"]`

**Gap**: no raw source specifies how many synthetic chunk samples the statistical check should draw, or what deviation from the configured rate (1 %/2 %/5 %) counts as a pass. `L0-xq2` even leaves the rate constants themselves open to a pending client answer.

**Assumed**: infra picks a sample size and tolerance band per structure at implementation time (e.g. large enough that a binomial confidence interval around the configured rate is narrow relative to the gap between adjacent structures' rates — 1 % vs 2 % vs 5 %), driven directly through `strf`'s own roll function rather than a reimplementation (`L0-infr-r006`).

**Impact if wrong**: too small a sample/tight a tolerance → the check flakes on a correct implementation and blocks autopilot merges on noise; too loose → it never catches a broken roll (wrong constant, biased hash). If `L0-xq2`'s answer changes the rate constants, this check's expected values move with them — it must read the constants from `strf`'s config table, never hardcode them.
