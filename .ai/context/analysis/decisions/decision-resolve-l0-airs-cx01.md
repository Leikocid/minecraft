---
type: "decision"
node_id: "decision-resolve-l0-airs-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-airs-cx01: > Resolved by `decision-l0-airs-cx01-za…"
aliases: ["decision-resolve-l0-airs-cx01"]
is_a: ["decision"]
relates_to: ["L0-airs-cx01"]
refs: ["L0-airs-cx01"]
priority: 500
statement: "> Resolved by `decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno` (2026-09-26, b45fdcd) and implemented in b619e55 (AIRS-BODY-01-AA). \"Once\" means one attempt per Windmill instance: the Placer writes `la=true` before the hook (place.ts:207-210). Ring chunks are loaded through temporary ticking areas (pool 4, 2 at once, search-ring.ts:184-235). So no validity read touches an unloaded chunk, and the outcome does not depend on player movement. If a candidate's chunks cannot be loaded (area refused, or not loaded within 300 ticks), the attempt stays `ls=pending` and is never set to `none`."
resolves_contradiction: "L0-airs-cx01"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-AIRS-CX01-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 600
---

> Resolved by `decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno` (2026-09-26, b45fdcd) and implemented in b619e55 (AIRS-BODY-01-AA). "Once" means one attempt per Windmill instance: the Placer writes `la=true` before the hook (place.ts:207-210). Ring chunks are loaded through temporary ticking areas (pool 4, 2 at once, search-ring.ts:184-235). So no validity read touches an unloaded chunk, and the outcome does not depend on player movement. If a candidate's chunks cannot be loaded (area refused, or not loaded within 300 ticks), the attempt stays `ls=pending` and is never set to `none`.
