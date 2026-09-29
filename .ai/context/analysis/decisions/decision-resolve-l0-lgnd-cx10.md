---
type: "decision"
node_id: "decision-resolve-l0-lgnd-cx10"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-lgnd-cx10: Починено задачей LGND-RETAIN-01-AA (4 к…"
aliases: ["decision-resolve-l0-lgnd-cx10"]
is_a: ["decision"]
relates_to: ["L0-lgnd-cx10"]
refs: ["L0-lgnd-cx10"]
priority: 500
statement: "Починено задачей LGND-RETAIN-01-AA (4 критерия из 4). Сохранение при смерти теперь удерживает каждую помеченную копию, а не первую: pending стал списком, добавлено чтение второй руки (она допускается в игру задачей LGND-OFFHAND-01-AA). Старое значение с одной меткой читается как список из одного элемента, поэтому уже лежащее в мирах не теряется. Это закрывает лишнюю живую копию: раньше вторая помеченная копия выпадала предметом, и система возврата потом выдавала владельцу ещё одну. Доказано красными артефактами до правки (1.red.json и 3.red.json, оба с кодом 1) и зелёными после (1.json, 3.json — юнит-тесты и полный bds:gametest на отдельном экземпляре bds-retain)."
resolves_contradiction: "L0-lgnd-cx10"
outcome: "changed"
evidence: "Артефакты .ai/verify/LGND-RETAIN-01-AA/1.red.json и 3.red.json (exit 1 до правки), 1.json и 3.json (exit 0 после); зонд src/gametest/probe-retention.ts, написанный при разборе; отчёт docs/feedback/diagnose-CNTR-LGND-CX10-AA.md"
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 672
---

Починено задачей LGND-RETAIN-01-AA (4 критерия из 4). Сохранение при смерти теперь удерживает каждую помеченную копию, а не первую: pending стал списком, добавлено чтение второй руки (она допускается в игру задачей LGND-OFFHAND-01-AA). Старое значение с одной меткой читается как список из одного элемента, поэтому уже лежащее в мирах не теряется. Это закрывает лишнюю живую копию: раньше вторая помеченная копия выпадала предметом, и система возврата потом выдавала владельцу ещё одну. Доказано красными артефактами до правки (1.red.json и 3.red.json, оба с кодом 1) и зелёными после (1.json, 3.json — юнит-тесты и полный bds:gametest на отдельном экземпляре bds-retain).
