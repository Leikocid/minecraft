---
type: "decision"
node_id: "decision-pushka-predmet-i-zaryad-pravki-po-zameram-otgruz"
source_channel: "cli"
analysis_version: null
title: "Пушка, предмет и заряд: правки по замерам отгрузки (orbc-r002, r012, ent3, adr-oded)"
aliases: ["decision-pushka-predmet-i-zaryad-pravki-po-zameram-otgruz"]
is_a: ["decision"]
priority: 500
statement: "Отгрузка Пушки (ORBC-ITEM-01-AA, 1.4.0) опровергла четыре записи KV замерами на BDS 1.26.51.1.

1. orbc-r002:27 — «рецепт без unlock, как у остальных легендарок»: посылка ложна, packs/behavior/recipes/web_sword.json содержит unlock. Рецепт Пушки несёт unlock: [{item: minecraft:tnt}], как все отгруженные (меч — web, коса — diamond_hoe).
2. orbc-r002:39 и orbc-r012:28 — строки готовности и кулдауна берутся не из общих ключей: у Пушки свои andrew.orbital.hud_ready и andrew.orbital.hud_cooldown.
3. adr-oded:28 — выбор ключей идёт полем LegendaryDef.hudKeys, а НЕ поиском ключа с запасным вариантом: translate разрешается на клиенте, скрипт не может узнать, существует ли ключ. Имена ключей hud_ready/hud_cooldown, а не ready/cooldown: последние уже заняты старыми строками меча.
4. orbc-ent3:25 — сущность заряда действительна только до format_version 1.26.0: на 1.26.50 схема выбрасывает minecraft:pushable и BDS отказывает сущности целиком.
5. orbc-ent3:30 — у ванильного TNT нет ни клиентской сущности, ни геометрии (движок рисует его сам), переиспользовать нечего: свой куб 16 пикселей и три render controller на ванильных текстурах tnt_side|top|bottom.
6. orbc-ent3:31 — масштаб задаётся в BP свойством andrew:scale и группами andrew:scale_rmb/lmb, вход через событие спавна; одним setProperty масштаб не меняется."
decided_at: "2026-09-30"
tags: ["refine","decision"]
size_chars: 1321
---

Отгрузка Пушки (ORBC-ITEM-01-AA, 1.4.0) опровергла четыре записи KV замерами на BDS 1.26.51.1.

1. orbc-r002:27 — «рецепт без unlock, как у остальных легендарок»: посылка ложна, packs/behavior/recipes/web_sword.json содержит unlock. Рецепт Пушки несёт unlock: [{item: minecraft:tnt}], как все отгруженные (меч — web, коса — diamond_hoe).
2. orbc-r002:39 и orbc-r012:28 — строки готовности и кулдауна берутся не из общих ключей: у Пушки свои andrew.orbital.hud_ready и andrew.orbital.hud_cooldown.
3. adr-oded:28 — выбор ключей идёт полем LegendaryDef.hudKeys, а НЕ поиском ключа с запасным вариантом: translate разрешается на клиенте, скрипт не может узнать, существует ли ключ. Имена ключей hud_ready/hud_cooldown, а не ready/cooldown: последние уже заняты старыми строками меча.
4. orbc-ent3:25 — сущность заряда действительна только до format_version 1.26.0: на 1.26.50 схема выбрасывает minecraft:pushable и BDS отказывает сущности целиком.
5. orbc-ent3:30 — у ванильного TNT нет ни клиентской сущности, ни геометрии (движок рисует его сам), переиспользовать нечего: свой куб 16 пикселей и три render controller на ванильных текстурах tnt_side|top|bottom.
6. orbc-ent3:31 — масштаб задаётся в BP свойством andrew:scale и группами andrew:scale_rmb/lmb, вход через событие спавна; одним setProperty масштаб не меняется.
