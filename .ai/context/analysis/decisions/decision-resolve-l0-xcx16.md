---
type: "decision"
node_id: "decision-resolve-l0-xcx16"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx16: Подтверждено целиком и переведено в адр…"
aliases: ["decision-resolve-l0-xcx16"]
is_a: ["decision"]
relates_to: ["L0-xcx16"]
refs: ["L0-xcx16"]
priority: 500
statement: "Подтверждено целиком и переведено в адресный список правок. Измерено на v1.4.4: прицел 25 (target.ts:13), минимум ПКМ 7 (ring-layout.ts:39), спавн 60/60/10 (spawn.ts:15-31), диаметры 1/7/14/21/28 и силы 4/4/2/1/1 (ring-layout.ts:98,112), 201 колонна, потолок зарядов 256. Узлы v3 несут старые числа: 223 правки в 147 файлах orbc/ring/pntr, каждая проверена по своей строке (226/226). Причина: v5 протащил эти файлы, поменяв в них только номер версии (git diff 0a8f2c1^..0a8f2c1). Работа передана в KV-CLEANUP-CNTR2-AA с измерителем diagnose-CNTR-X16.measure.mjs."
resolves_contradiction: "L0-xcx16"
outcome: "changed"
evidence: ".ai/verify/CNTR-X16-AA/2.red.json (exit 1, 226/226 устаревших строк на месте); docs/feedback/diagnose-CNTR-X16.md; tests/ring-layout.test.mjs:68"
decided_at: "2026-10-03"
tags: ["refine","resolution"]
size_chars: 562
---

Подтверждено целиком и переведено в адресный список правок. Измерено на v1.4.4: прицел 25 (target.ts:13), минимум ПКМ 7 (ring-layout.ts:39), спавн 60/60/10 (spawn.ts:15-31), диаметры 1/7/14/21/28 и силы 4/4/2/1/1 (ring-layout.ts:98,112), 201 колонна, потолок зарядов 256. Узлы v3 несут старые числа: 223 правки в 147 файлах orbc/ring/pntr, каждая проверена по своей строке (226/226). Причина: v5 протащил эти файлы, поменяв в них только номер версии (git diff 0a8f2c1^..0a8f2c1). Работа передана в KV-CLEANUP-CNTR2-AA с измерителем diagnose-CNTR-X16.measure.mjs.
