---
type: "decision"
node_id: "decision-ad-wrdn-01-l0-wrdn-ad01-podtverzhdeno-vanilnaya-"
source_channel: "cli"
analysis_version: null
title: "AD-wrdn-01 (L0-wrdn-ad01) подтверждено: ванильная таблица chests/ancient_city работает (зонд strf-p006, Q4)"
aliases: ["decision-ad-wrdn-01-l0-wrdn-ad01-podtverzhdeno-vanilnaya-"]
is_a: ["decision"]
priority: 500
statement: "Узел L0-wrdn-ad01. Решение (все 10 сундуков Мини-Города Стража — ванильная таблица Ancient City) подтверждено измерением. Основание — docs/structures/probe-results.md, пункт Q4, новое измерение после исправления ошибки координат в зонде: dimension.runCommand('loot insert x y z loot \"chests/ancient_city\"') дважды заполнил сундук разным ванильным содержимым. Движок принимает голый id в кавычках, без loot_tables/ и без .json. В полный сундук команда возвращает successCount=1, но ничего не кладёт, поэтому заполнение проверяется по содержимому контейнера. Первый вывод FAIL из PRB-LOOT-01-AA ложный и отозван."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 610
---

Узел L0-wrdn-ad01. Решение (все 10 сундуков Мини-Города Стража — ванильная таблица Ancient City) подтверждено измерением. Основание — docs/structures/probe-results.md, пункт Q4, новое измерение после исправления ошибки координат в зонде: dimension.runCommand('loot insert x y z loot "chests/ancient_city"') дважды заполнил сундук разным ванильным содержимым. Движок принимает голый id в кавычках, без loot_tables/ и без .json. В полный сундук команда возвращает successCount=1, но ничего не кладёт, поэтому заполнение проверяется по содержимому контейнера. Первый вывод FAIL из PRB-LOOT-01-AA ложный и отозван.
