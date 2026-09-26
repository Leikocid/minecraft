---
type: "decision"
node_id: "decision-adr-strf-02-l0-strf-d002-accepted-spavnery-vanil"
source_channel: "cli"
analysis_version: null
title: "ADR-strf-02 (L0-strf-d002) = accepted: спавнеры — ванильные блок-сущности из шаблона (зонд strf-p006, Q1)"
aliases: ["decision-adr-strf-02-l0-strf-d002-accepted-spavnery-vanil"]
is_a: ["decision"]
priority: 500
statement: "Узел L0-strf-d002. Статус ADR-strf-02 меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункт Q1 PASS (GameTest andrew:probe_place_block_entities): mob_spawner с EntityIdentifier=minecraft:zombie из .mcstructure после place остаётся mob_spawner и выдаёт зомби за 40 тиков (2 с), а в контрольной коробке мобов нет. Запасной путь (скриптовый псевдо-спавнер) не нужен и не реализуется."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 411
---

Узел L0-strf-d002. Статус ADR-strf-02 меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункт Q1 PASS (GameTest andrew:probe_place_block_entities): mob_spawner с EntityIdentifier=minecraft:zombie из .mcstructure после place остаётся mob_spawner и выдаёт зомби за 40 тиков (2 с), а в контрольной коробке мобов нет. Запасной путь (скриптовый псевдо-спавнер) не нужен и не реализуется.
