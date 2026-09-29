---
type: "decision"
node_id: "decision-resolve-l0-xcx9"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx9: Починено задачей LGND-CRAFTGATE-01-AA (…"
aliases: ["decision-resolve-l0-xcx9"]
is_a: ["decision"]
relates_to: ["L0-xcx9"]
refs: ["L0-xcx9"]
priority: 500
statement: "Починено задачей LGND-CRAFTGATE-01-AA (5 критериев из 5). Выдача легендарного командой игроку в выживании больше не объявляется крафтом и не тратит единственный крафт мира; настоящий крафт по-прежнему тратит его ровно один раз. Доказано красной проверкой до правки (артефакт 1.red.json, код 1) и зелёной после (1.json, код 0), плюс сквозной прогон на отдельном сервере (3.json, npm test и bds:gametest, код 0)."
resolves_contradiction: "L0-xcx9"
outcome: "changed"
evidence: "Артефакты .ai/verify/LGND-CRAFTGATE-01-AA/1.red.json (exit 1, до правки), 1.json (exit 0), 3.json (exit 0, npm test + bds:gametest на экземпляре bds-lgcg); отчёт docs/feedback/diagnose-CNTR-XCX9-AA.md"
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 410
---

Починено задачей LGND-CRAFTGATE-01-AA (5 критериев из 5). Выдача легендарного командой игроку в выживании больше не объявляется крафтом и не тратит единственный крафт мира; настоящий крафт по-прежнему тратит его ровно один раз. Доказано красной проверкой до правки (артефакт 1.red.json, код 1) и зелёной после (1.json, код 0), плюс сквозной прогон на отдельном сервере (3.json, npm test и bds:gametest, код 0).
