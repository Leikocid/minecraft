---
type: "decision"
node_id: "decision-resolve-l0-ufoc-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-ufoc-cx01: Снято вариантом (a). Код пишет ровно дв…"
aliases: ["decision-resolve-l0-ufoc-cx01"]
is_a: ["decision"]
relates_to: ["L0-ufoc-cx01"]
refs: ["L0-ufoc-cx01"]
priority: 500
statement: "Снято вариантом (a). Код пишет ровно два стойких свойства — andrew:ufo_next_ms и andrew:ufo_enabled (зонд по worldStore, src/ufo/env.ts:86-91); событие, шедшее в момент перезапуска, кодируется маркером next_ms = 0 (schedule.ts:11,51-53), при загрузке он становится now+900000 (schedule.ts:62-67). Свойства andrew:ufo_active не существовало никогда: git log --all -S'ufo_active' по src, tests и scripts пуст. C-23 и adr-ufom §2 выполняются буквально. Остаётся подчистка знания в 5 местах (KV-CLEANUP-CNTR2-AA), главное — adr-ufom:46."
resolves_contradiction: "L0-ufoc-cx01"
outcome: "changed"
evidence: ".ai/verify/CNTR-UFOC-CX01-AA/*; node --test ufo-schedule 42/42; docs/feedback/diagnose-CNTR-UFOC-CX01.md; код идентичен доказанному 00d38cf"
decided_at: "2026-10-03"
tags: ["refine","resolution"]
size_chars: 532
---

Снято вариантом (a). Код пишет ровно два стойких свойства — andrew:ufo_next_ms и andrew:ufo_enabled (зонд по worldStore, src/ufo/env.ts:86-91); событие, шедшее в момент перезапуска, кодируется маркером next_ms = 0 (schedule.ts:11,51-53), при загрузке он становится now+900000 (schedule.ts:62-67). Свойства andrew:ufo_active не существовало никогда: git log --all -S'ufo_active' по src, tests и scripts пуст. C-23 и adr-ufom §2 выполняются буквально. Остаётся подчистка знания в 5 местах (KV-CLEANUP-CNTR2-AA), главное — adr-ufom:46.
