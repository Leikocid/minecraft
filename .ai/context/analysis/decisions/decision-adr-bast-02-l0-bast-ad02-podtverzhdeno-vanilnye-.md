---
type: "decision"
node_id: "decision-adr-bast-02-l0-bast-ad02-podtverzhdeno-vanilnye-"
source_channel: "cli"
analysis_version: null
title: "ADR-bast-02 (L0-bast-ad02) подтверждено: ванильные bastion_treasure / bastion_other работают (зонд strf-p006, Q4)"
aliases: ["decision-adr-bast-02-l0-bast-ad02-podtverzhdeno-vanilnye-"]
is_a: ["decision"]
priority: 500
statement: "Узел L0-bast-ad02. Решение (сундуки Мини-Бастиона — ванильные таблицы Bastion Remnant: treasure для 3 центральных, other для 7 внешних) подтверждено измерением. Основание — docs/structures/probe-results.md, пункт Q4, новое измерение: loot insert … loot \"chests/bastion_treasure\" и \"chests/bastion_other\" через dimension.runCommand дважды дали разное ванильное содержимое (netherite_ingot и netherite_upgrade_smithing_template в treasure). Переход на нашу взвешенную таблицу, предложенный по ложному FAIL первого прогона, отменён."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 529
---

Узел L0-bast-ad02. Решение (сундуки Мини-Бастиона — ванильные таблицы Bastion Remnant: treasure для 3 центральных, other для 7 внешних) подтверждено измерением. Основание — docs/structures/probe-results.md, пункт Q4, новое измерение: loot insert … loot "chests/bastion_treasure" и "chests/bastion_other" через dimension.runCommand дважды дали разное ванильное содержимое (netherite_ingot и netherite_upgrade_smithing_template в treasure). Переход на нашу взвешенную таблицу, предложенный по ложному FAIL первого прогона, отменён.
