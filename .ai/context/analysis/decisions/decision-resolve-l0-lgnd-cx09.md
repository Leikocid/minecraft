---
type: "decision"
node_id: "decision-resolve-l0-lgnd-cx09"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-lgnd-cx09: Починено задачей LGND-GEN-01-AA (5 крит…"
aliases: ["decision-resolve-l0-lgnd-cx09"]
is_a: ["decision"]
relates_to: ["L0-lgnd-cx09"]
refs: ["L0-lgnd-cx09"]
priority: 500
statement: "Починено задачей LGND-GEN-01-AA (5 критериев из 5), пункты 2-3 утверждения. В метку добавлено поколение: при выдаче возвратной копии оно растёт, и уцелевшая копия становится устаревшей, поэтому незамеченный подбор больше не оставляет двух живых экземпляров. Долги хранятся списком, две потери одного офлайн-владельца больше не затирают друг друга; старое значение с одной меткой читается как список из одного. Пункт 1 (кому возвращать) решён отдельно: последнему державшему, см. decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavshemu и узел L0-xcx11. Пункт 4 закрыт решением L0-adr-wpn2."
resolves_contradiction: "L0-lgnd-cx09"
outcome: "changed"
evidence: "Артефакты .ai/verify/LGND-GEN-01-AA/4.red.json (exit 1, до правки), 1.json и 4.json (exit 0, npm test + bds:gametest на экземпляре bds-gen01); отчёт docs/feedback/diagnose-CNTR-LGND-CX09-AA.md"
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 593
---

Починено задачей LGND-GEN-01-AA (5 критериев из 5), пункты 2-3 утверждения. В метку добавлено поколение: при выдаче возвратной копии оно растёт, и уцелевшая копия становится устаревшей, поэтому незамеченный подбор больше не оставляет двух живых экземпляров. Долги хранятся списком, две потери одного офлайн-владельца больше не затирают друг друга; старое значение с одной меткой читается как список из одного. Пункт 1 (кому возвращать) решён отдельно: последнему державшему, см. decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavshemu и узел L0-xcx11. Пункт 4 закрыт решением L0-adr-wpn2.
