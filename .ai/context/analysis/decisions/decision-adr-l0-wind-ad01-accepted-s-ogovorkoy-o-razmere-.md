---
type: "decision"
node_id: "decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-"
source_channel: "cli"
analysis_version: null
title: "ADR L0-wind-ad01 = accepted с оговоркой о размере области (зонд strf-p006, Q9/Q11)"
aliases: ["decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-"]
is_a: ["decision"]
priority: 500
statement: "Узел L0-wind-ad01. Статус (поиск места для Мельницы у спавна через временные ticking area) меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункты Q11 и Q9. Q11 PASS: runCommand('tickingarea add circle … 2') в 500 блоках в мире без игрока загружает чанк за 17–19 тиков (759–853 мс), remove разгружает за 1 тик, предел — 10 областей (11-я: successCount=0). Q9: в мире без игрока не загружено ничего, спавн тоже, так что без ticking area поиск невозможен. Оговорка: предел одной области в 100 чанков (L0-wind-as11) зонд не мерил — проверен только круг радиуса 2 (5×5 чанков). Окно поиска не должно превышать проверенного размера, пока тело Мельницы не измерит его само."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 697
---

Узел L0-wind-ad01. Статус (поиск места для Мельницы у спавна через временные ticking area) меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункты Q11 и Q9. Q11 PASS: runCommand('tickingarea add circle … 2') в 500 блоках в мире без игрока загружает чанк за 17–19 тиков (759–853 мс), remove разгружает за 1 тик, предел — 10 областей (11-я: successCount=0). Q9: в мире без игрока не загружено ничего, спавн тоже, так что без ticking area поиск невозможен. Оговорка: предел одной области в 100 чанков (L0-wind-as11) зонд не мерил — проверен только круг радиуса 2 (5×5 чанков). Окно поиска не должно превышать проверенного размера, пока тело Мельницы не измерит его само.
