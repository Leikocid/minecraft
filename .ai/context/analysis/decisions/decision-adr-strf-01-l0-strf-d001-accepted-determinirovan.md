---
type: "decision"
node_id: "decision-adr-strf-01-l0-strf-d001-accepted-determinirovan"
source_channel: "cli"
analysis_version: null
title: "ADR-strf-01 (L0-strf-d001) = accepted: детерминированные броски + битсет (зонд strf-p006, Q8)"
aliases: ["decision-adr-strf-01-l0-strf-d001-accepted-determinirovan"]
is_a: ["decision"]
part_of: ["L0-strf-d001"]
relates_to: ["L0-strf-d001"]
priority: 500
statement: "Узел L0-strf-d001. Статус ADR-strf-01 меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункт Q8 PASS (GameTest andrew:probe_dynamic_property_budget): одна строка динамического свойства — до 32 767 байт UTF-8 (32 767 ASCII / 16 383 кириллических символов, 32 768 → ArgumentOutOfBoundsError). Всего 1024 ключа × 32 767 = 33 574 826 байт записались без ошибки и без предупреждения движка. Битсет региона 32×32 чанка (128 байт) и компактные записи экземпляров укладываются с большим запасом."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 517
---

Узел L0-strf-d001. Статус ADR-strf-01 меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункт Q8 PASS (GameTest andrew:probe_dynamic_property_budget): одна строка динамического свойства — до 32 767 байт UTF-8 (32 767 ASCII / 16 383 кириллических символов, 32 768 → ArgumentOutOfBoundsError). Всего 1024 ключа × 32 767 = 33 574 826 байт записались без ошибки и без предупреждения движка. Битсет региона 32×32 чанка (128 байт) и компактные записи экземпляров укладываются с большим запасом.
