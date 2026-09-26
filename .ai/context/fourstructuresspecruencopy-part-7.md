---
type: "raw-fragment"
node_id: "fourstructuresspecruencopy-part-7"
source_channel: "raw-import"
level: null
aliases: ["fourstructuresspecruencopy-part-7", "fourstructuresspecruencopy"]
is_a: ["raw-fragment"]
priority: 530
size_chars: 5018
tags: ["performance", "security", "architecture"]
source: "docs/Four_Structures_Spec_RU_EN_copy.docx"
embed_lines: "401-463"
embed_slice: "7-69"
---
22. Разграбить/сломать сундук и спавнер, перезапустить сервер; убедиться, что состояние не восстановилось.

23. Сгенерировать достаточное число новых чанков и статистически подтвердить работу обычного 1% кандидата только на подходящей суше (без требования точного совпадения на малой выборке).

## 10.2. Дирижабль / Airship

24. Проверить фиксированный современный внешний вид: серый/светло-серый бетон, целые окна, без паутины/лиан, декоративный верхний овал.

25. Проверить габарит \~15×7×10--12 и случайные повороты 0/90/180/270.

26. Проверить две двери на противоположных сторонах и отсутствие подъёма с земли.

27. Проверить интерьер: центральный коридор + 4 комнаты; по одной лампе в каждой комнате.

28. Проверить 10 сундуков: 2×4 комнаты + 2 в коридоре.

29. Проверить единственный Vindicator-spawner с железным топором в центре коридора.

30. Проверить высоту: нижняя часть минимум 40 блоков выше максимальной поверхности под footprint; выбранный зазор в диапазоне 40--70 при наличии места.

31. Проверить отклонение кандидата над открытой водой и при невозможности вписаться ниже world ceiling.

32. Проверить независимый 2% worldgen на подходящих чанках.

33. Проверить, что у Мельницы выполняется отдельная попытка связанного Дирижабля в 40--100 блоках и существующий независимый Дирижабль не заменяет эту попытку.

## 10.3. Лут / Loot

34. Проверить, что каждый сундук получает 5--12 попыток и одна попытка выдаёт максимум одну категорию.

35. Проверить диапазоны количества слитков, алмазов, палок и древесины.

36. Проверить 80/20 железо/алмаз для брони, мечей и топоров.

37. Проверить повторяемость предметов брони: несколько одинаковых шлемов допустимы.

38. Проверить отсутствие проклятий на зачарованном снаряжении.

39. Проверить максимум одну успешную категорию Golden Apple на сундук, количество 1--3, и полное отсутствие Enchanted Golden Apple.

40. Проверить, что алмазы могут успешно выпадать более одного раза в одном сундуке.

# 11. Definition of Done / Критерий готовности

- Все четыре структуры стабильно генерируются на новом сервере без Experiments либо с явно задокументированным стабильным приближением там, где точность API ограничена.

- Стартовая Мельница фактически гарантирована в согласованной области/резервном поиске и не дублируется после рестартов.

- Обычная генерация 1%/2%, связанный Дирижабль, ограничения по воде/рельефу/пересечениям работают без заметных дубликатов.

- Все сундуки, лут, спавнеры и одноразовые мобы соответствуют этой спецификации и сохраняют состояние.

- Структуры можно полностью исследовать и разрушать обычным игровым способом; изменения игрока постоянны.

- Многократные рестарты сервера и выгрузка/загрузка чанков не создают повторный лут, спавнеры, охрану или копии структур.

- Агент предоставляет краткий технический отчёт со всеми отклонениями от точной спецификации, если стабильный Bedrock API потребовал приближения.

# 12. English Implementation Summary

This section is a concise English handoff. The Russian sections above are equally normative; when wording differs, preserve the agreed numeric rules and gameplay behavior.

- Windmill: Overworld only; normal 1% per suitable dry land chunk; fixed \~15×15×30 building on \~35×35 fixed field layout; 25 fixed chests (5/8/12); 3 vanilla-like spawners by floor (Zombie Villager, Zombie, iron-axe Vindicator); 10 one-time persistent sun-immune field Zombie Villagers; abandoned stone/wood aesthetic with vines and cobwebs.

- Spawn-area Windmill: exactly one guaranteed per new world. Search 5×5 chunks around world spawn first, then nearest valid location up to 500 blocks. If no naturally flat site exists, prepare/level a dry site while preserving detected structures and existing spawners. Smooth terrain edges; do not fill deep caves wholesale.

- Airship: Overworld only; independent 2% per suitable land chunk plus a separate linked attempt for every Windmill at 40--100 blocks. Fixed \~15×7×10--12 modern gray concrete design; no decay; decorative upper oval; lower hull has 4 rooms + central corridor, 10 chests, one iron-axe Vindicator spawner.

- Airship altitude: entire footprint over land; bottom at least 40 blocks above the highest terrain point beneath the footprint, with target clearance 40--70 where possible; reject if world ceiling prevents fit.

- Loot: 5--12 fill attempts per chest; each attempt selects at most one category using the relative weights in section 3. Same table for both structures. Golden Apple category max once per chest; diamonds may repeat. Equipment is iron 80% / diamond 20%; enchanted gear uses compatible vanilla enchants, no curses.

- Persistence: generated loot never refreshes; destroyed chests/spawners/blocks never regenerate; one-time Windmill guards never respawn. Structures rotate randomly by 0/90/180/270 degrees.

- Implementation: prefer stable Bedrock APIs, no Experiments. If an exact rule is impossible with stable APIs, use the closest stable approximation without changing the core gameplay and document the deviation.