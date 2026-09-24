---
type: "concept-architecture-decision"
node_id: "L0-infr-d004"
source_channel: "rollout"
analysis_version: 1
title: "ADR: verification verdicts are derived automatically from logs, not read by a human"
aliases: ["L0-infr-d004"]
is_a: ["architecture-decision"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1410
tags: ["is_a:architecture-decision"]
level: 2
---
# ADR: verification verdicts are derived automatically from logs, not read by a human

**Links:** `part_of: ["L0-infr"]` · `is_a: ["architecture-decision"]`

**Context**: operator decision 2026-09-20, full autopilot — tasks execute, merge and verify without pause for human review, except where the engine genuinely cannot prove something.

**Decision**: `build` and `bds` channels are fully automatic — `/verify` closes their acceptance criteria straight from run-check artifacts (`bds:check`'s and `bds:gametest`'s log-derived PASS/FAIL, `validate`'s error list, `tsc`'s exit code), no operator step when everything is green. Only the `ipad` channel (rendering, icons, Creative placement, RU/EN names — things the log genuinely cannot show) stays `manual` and non-blocking: those tasks merge on their `build`/`bds` evidence, and the `ipad` criteria remain open until an operator confirms via `task_accept` or the board.

**Rejected alternative**: have a human watch `docker logs`/the BDS console for every check run instead of parsing it programmatically — rejected in favor of the automatic `analyzeLog()` heuristics (Pack Stack lines, "was not found and was ignored" absence, selftest DONE counters), which is what makes zero-touch autopilot possible for the `bds` channel at all.

**Status**: accepted (`decision-verification-approach-automatic`), drives how `/plan` types every criterion in this project.
