---
type: "decision"
node_id: "decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut"
source_channel: "cli"
analysis_version: null
title: "Q-008 blocked-craft-refund = (a) обнаружить и вернуть ингредиенты"
aliases: ["decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut"]
is_a: ["decision"]
priority: 500
statement: "Решение (автопилот): повторный survival-крафт распознаётся по появлению непомеченного Web Sword в инвентаре non-creative игрока при уже потраченном праве; меч изымается, игроку возвращаются 4 minecraft:web и 1 новый minecraft:diamond_sword, показывается локализованное сообщение (RU/EN, ключ в каталоге L0-item). Известное ограничение: чары/прочность меча-ингредиента не восстанавливаются; /give в survival неотличим от крафта (для тестов — креатив или /andrew:websword give). Добавляется приёмочный тест на возврат. Закрывает CTR-003."
decided_at: "2026-09-21"
tags: ["refine","decision"]
size_chars: 535
---

Решение (автопилот): повторный survival-крафт распознаётся по появлению непомеченного Web Sword в инвентаре non-creative игрока при уже потраченном праве; меч изымается, игроку возвращаются 4 minecraft:web и 1 новый minecraft:diamond_sword, показывается локализованное сообщение (RU/EN, ключ в каталоге L0-item). Известное ограничение: чары/прочность меча-ингредиента не восстанавливаются; /give в survival неотличим от крафта (для тестов — креатив или /andrew:websword give). Добавляется приёмочный тест на возврат. Закрывает CTR-003.
