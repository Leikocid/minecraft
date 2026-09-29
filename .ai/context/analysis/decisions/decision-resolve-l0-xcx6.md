---
type: "decision"
node_id: "decision-resolve-l0-xcx6"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx6: > L0-xcx6 was re-measured on 2026-09-29…"
aliases: ["decision-resolve-l0-xcx6"]
is_a: ["decision"]
relates_to: ["L0-xcx6"]
refs: ["L0-xcx6"]
priority: 500
statement: "> L0-xcx6 was re-measured on 2026-09-29 against the live KV. Every point is confirmed, and the defect is wider than the claim says: > - the chunk-load-event wording is also at `bast__:21` and `bast-p001:18`; > - the own init marker has spread to `bast-p002:20,24` and `bast-ent1/2/3`; > - `wrdn-ent1`/`ent2` keep their own instance record and a `filled` flag, against `strf-r008` §4; > - \"xcx4 is open\" also appears at `wrdn__:61,68`. > > Zero `strf-*`/`loot-*` ids in wrdn (30 nodes) and bast (31 nodes), against 76 and 52 lines in wind and airs. > > Cause: the analyze --incremental announced by de"
resolves_contradiction: "L0-xcx6"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-XCX6-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 600
---

> L0-xcx6 was re-measured on 2026-09-29 against the live KV. Every point is confirmed, and the defect is wider than the claim says: > - the chunk-load-event wording is also at `bast__:21` and `bast-p001:18`; > - the own init marker has spread to `bast-p002:20,24` and `bast-ent1/2/3`; > - `wrdn-ent1`/`ent2` keep their own instance record and a `filled` flag, against `strf-r008` §4; > - "xcx4 is open" also appears at `wrdn__:61,68`. > > Zero `strf-*`/`loot-*` ids in wrdn (30 nodes) and bast (31 nodes), against 76 and 52 lines in wind and airs. > > Cause: the analyze --incremental announced by de
