---
type: "decision"
node_id: "decision-resolve-l0-strf-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-strf-cx01: > Resolved as built; the proposed `star…"
aliases: ["decision-resolve-l0-strf-cx01"]
is_a: ["decision"]
relates_to: ["L0-strf-cx01"]
refs: ["L0-strf-cx01"]
priority: 500
statement: "> Resolved as built; the proposed `startStrf`/`andrew:strf_owner` handshake was never implemented > (0 matches in `src/`, `scripts/`, `tests/` at `32f4aca`) and is not needed. In the gametest world > the release pack keeps its `strf` runtime but cannot generate: (1) `EnabledTypes` has no stored set > on a fresh world, and the world is deleted before every `bds:gametest` run > (`scripts/bds-gametest.mjs:500`); `runtime.discover` returns before rolling > (`src/structures/runtime.ts:132`); the harness asserts `[andrew] structures enabled: none` and the > spawn search standing down on every run (`"
resolves_contradiction: "L0-strf-cx01"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-STRF-CX01-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 600
---

> Resolved as built; the proposed `startStrf`/`andrew:strf_owner` handshake was never implemented > (0 matches in `src/`, `scripts/`, `tests/` at `32f4aca`) and is not needed. In the gametest world > the release pack keeps its `strf` runtime but cannot generate: (1) `EnabledTypes` has no stored set > on a fresh world, and the world is deleted before every `bds:gametest` run > (`scripts/bds-gametest.mjs:500`); `runtime.discover` returns before rolling > (`src/structures/runtime.ts:132`); the harness asserts `[andrew] structures enabled: none` and the > spawn search standing down on every run (`
