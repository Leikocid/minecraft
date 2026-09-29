---
type: "decision"
node_id: "decision-resolve-l0-wind-cx02"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-wind-cx02: > Resolved by `decision-l0-airs-cx01` (…"
aliases: ["decision-resolve-l0-wind-cx02"]
is_a: ["decision"]
relates_to: ["L0-wind-cx02"]
refs: ["L0-wind-cx02"]
priority: 500
statement: "> Resolved by `decision-l0-airs-cx01` (2026-09-26), implemented in `b619e55`, and re-measured on 2026-09-29 against `src/` at `32f4aca` (unchanged through `250a720`). > > \"Once\" = one attempt per Windmill. `la=true` is written before the attempt (`place.ts:207-210`). The outcome is `ls` ∈ searching/pending/none/placed/skipped, where `none` and `placed` are terminal. > > The ring is read only after each candidate's chunks are loaded by a temporary ticking area: > - the pool has 4 names per dimension, with 2 loaded at once; > - each area covers 10–12 chunks; > - the engine's cap is 10 areas (pro"
resolves_contradiction: "L0-wind-cx02"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-WIND-CX02-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 600
---

> Resolved by `decision-l0-airs-cx01` (2026-09-26), implemented in `b619e55`, and re-measured on 2026-09-29 against `src/` at `32f4aca` (unchanged through `250a720`). > > "Once" = one attempt per Windmill. `la=true` is written before the attempt (`place.ts:207-210`). The outcome is `ls` ∈ searching/pending/none/placed/skipped, where `none` and `placed` are terminal. > > The ring is read only after each candidate's chunks are loaded by a temporary ticking area: > - the pool has 4 names per dimension, with 2 loaded at once; > - each area covers 10–12 chunks; > - the engine's cap is 10 areas (pro
