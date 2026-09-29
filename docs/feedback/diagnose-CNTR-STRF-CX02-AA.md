ИСХОД: 4 — Подготовлено, ждёт решения

# CNTR-STRF-CX02-AA · радиус поиска Мельницы у спавна (§4.7) против загрузки «только от игроков» (C-5b, C-12)

Узел `L0-strf-cx02` из этого разбора **не закрывается**. Само противоречие A против B снято: решение `L0-adr-spwn` (accepted, C-5c) и код его сняли, и это измерено. Остаётся одно: принятое ADR требует потолок 60 с с запасным путём, в коде его нет, а живой замер худшего случая дал 125,6 с. Какая сторона права, из наблюдения не выводится, поэтому это решение человека (раздел «Решение оператора»).

Артефакты (корень проекта, `.ai/verify/CNTR-STRF-CX02-AA/`):
- `2.json` — `bds:check` на отдельном экземпляре BDS с временным замером полного прохода в 500 блоков. Код замера не закоммичен, он в приложении. Прогон: 2026-09-29T19:49:22Z, код 32f4aca, exit 0, 221 875 мс.
- `2.red.json` — регрессионный тест на Peaceful против кода без правки 16251e6: красный (`actual: 'failed'`, `expected: 'done'`).
- `1.json` — `node --test tests/windmill-spawn.test.mjs` на HEAD: 25/25.

## OBSERVED / VERDICT

- OBSERVED: `L0-strf-cx02` открыт (`tags: status:open`, `strf-cx02__concept-contradiction.md:13`). При этом `adr-spwn__concept-architecture-decision.md:13` помечен `status:accepted` и `resolves:L0-strf-cx02`, а в строке :46 написано «Closes: L0-xcx4 and L0-strf-cx02». `L0-xcx4` закрыт, `L0-strf-cx02` — нет.
- OBSERVED (прод): `docker logs andrew-bds`, 2026-09-27 17:47:55: `spawn windmill: search already ran once in this world (status=failed searches=1 reason=error: strf place: minecraft:zombie_villager_v2 for windmill:spawn#0 waits: the world is Peaceful), not repeated`.
- VERDICT: жалоба составная. Часть A против B — противоречие знаний, уже решённое ADR; в коде оно тоже снято. Случай с продом — отдельный дефект, он уже исправлен, и эта развилка его не вызывала (ниже). Остаток — расхождение между принятым ADR и кодом по потолку 60 с.

## Перепроверка чисел утверждения

| Утверждение | Чем проверено | Измерено |
|---|---|---|
| сначала 5×5 чанков | `src/structures/spawn-search.ts:26` `STAGE1_CHUNKS = 2` | ±2 чанка = 5×5 ✓ |
| до 500 блоков, ближайшее место | `:24` `SEARCH_RADIUS = 500`; `:418` сортировка по расстоянию; `:444-449` кандидат оценивается, только когда его кольцо прочитано | ✓ |
| «при первом старте загружено ~4–10 чанков вокруг игрока» | Q9 в `bds:check`, мир без игрока. Граница загрузки по +x от спавна: `-1` (BAST-BODY-01-AA/5), `1` (CNTR-COOL-CTR2-AA/4), `2` (WIND-SPAWN-01-AA/1), `5` (DEMO-S4-01-AA/1), `3` (этот прогон, 3 запуска). `docs/structures/probe-results.md` Q9: «в мире без игрока не загружено ничего, спавн тоже»; вокруг SimulatedPlayer — 4 чанка по +x | **ложно как сформулировано.** При первом старте BDS игрока нет, и загружено от −1 до 5 чанков по оси |
| «~3 000 чанков» | геометрия: π·500²/256; реальный `SpawnSearch` на фейковом мире (всё вода / всё неровно); живой проход | круг — 3 068. Код грузит **161 окно = 4 025 чанков** (фейк) и **165 окон = 4 125 чанков** (живой проход) |
| «предел — 10 областей» | Q11: 10 добавлено, 11-я `successCount=0` (все артефакты и этот прогон) | ✓. Код держит **не больше 4 одновременно** (`:40` `PARALLEL = 4`, на фейке max-areas-held=4) из пула в 8 имён (`:713`) |
| одна область ≤ 100 чанков (`L0-wind-as11`) | коммит 32f4aca: область 11×11 = 121 чанк отвергнута «for its size» | предел подтверждён отказом. Окно поиска — 5×5 = 25 чанков, площадка — ≤ 4×4, зона подготовки 65 блоков — ≤ 6×6 = 36 |
| вариант (b): «загружено ≈ 9×9 чанков вокруг спавна» | Q9 (выше) | при первом старте без игрока вокруг спавна загружено нечего искать; вариант (b) на BDS невыполним |
| «цена — секунды генерации» | метки времени лога BDS | этап 1: **6,9 с** (19:45:47.500 → 19:45:54.385, этот прогон), **10 с** (CNTR-COOL-CTR2-AA, 19:35:25 → 19:35:35), 3 с в GameTest. **Полный проход 500 блоков: 125,6 с**, 2 417 тиков (≈19,2 TPS в среднем, сервер не встал) |
| потолок 60 с с запасным путём (рекомендация, `adr-spwn:34-35`, тест `:42`) | `grep` по `src/`: потолка на всё время нет. Есть только `LOAD_TIMEOUT_TICKS = 400` на окно (`:715`) и `ADD_RETRIES = 30` (`:716`) | **не реализовано**; selftest ждёт до 5 400 тиков (`src/selftest/spawn-windmill.ts`), `wind-ac01` — «≤ 5 min» |
| «Мельница появится в 100 % случаев» | решение `L0-xq4` (2026-09-26); `spawn-search.ts:581-583` | нет сухой земли в 500 блоках → Мельницы нет, в логе `no-dry-land`. Это принятое отступление |

Попутно в живом проходе: 3 окна из 165 (1,8 %) не загрузились за 400 тиков. `max-load=19931ms` ≈ 400 тиков при 19,4 TPS: это путь таймаута загрузки, а не 300-тиковый путь повторов `add`. Их 2 128 кандидатов (4,3 %) отброшены как `unloaded`. Так задумано (`wind-ad01` §2: «timeout → skip window, log, count»), и сводная строка лога это число показывает. Но «ближайшее» в таком прогоне не точное. Первопричина в движке не установлена.

## REPRO / CAUSE / PROOF / RULED OUT

- REPRO (A против B): живой полный проход в 500 блоков на BDS 1.26.51.1, центр в 20 000 блоках от спавна, свежая генерация. Использованы продовый `engineSpawnHost` и `SpawnSearch.operator`; профиль Мельницы подменён так, чтобы ни одна площадка не проходила. Итог: `loads=165 chunks=4125 failed-loads=3 wall=125649ms ticks=2417`.
- CAUSE: A выполняется без нарушения B.
  - C-12 держится: `engineSpawnHost.load` отдаёт окно, только когда по каждому чанку `isChunkLoaded && getBlock !== undefined` (`spawn-search.ts:769`). Незагруженное окно — `undefined`, а кандидат — `unloaded` (`:531`, `:546`, `:550`). В незагруженные чанки ни чтения, ни записи нет.
  - C-5b разрешающим текстом снят. `L0-adr-spwn` §1 делит C-5 на C-5a/b/c, и C-5c — одноразовый ограниченный проход через ticking area.
- PROOF: `L0-adr-spwn` accepted. Решение `decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-` (2026-09-26, Q9 и Q11 PASS). Реальный поиск на BDS находил место в 12, 19, 37, 62 и 169 блоках от спавна (артефакты WIND-SPAWN-01-AA/1, CNTR-COOL-CTR2-AA/4, этот прогон, DEMO-S4-01-AA/1, BAST-BODY-01-AA/5).
- CAUSE (прод, отдельный дефект): старый `placeAt()` выпускал наружу исключение шага стражей. `SpawnSearch.run()` превращал его в постоянный `status:"failed"`.
  - Текст причины добавлен в 0ca0652 (2026-09-27 00:11 +0200). Исправление 16251e6 вышло в 01:23 того же дня. Прод работает на v1.2.0 (af024e4), а `git merge-base --is-ancestor 16251e6 af024e4` → да. Значит, запись на проде оставила сборка из этого окна.
  - Здание на проде **стоит**. Лог 2026-09-28 06:27–13:42 содержит 112 строк `windmill:spawn step loot skipped, state looted` и `placement threw … Peaceful`: экземпляр `windmill:spawn` в состоянии `looted` (шаблон поставлен, сундуки заполнены), шаг стражей ждёт. Врёт только запись поиска.
- PROOF (прод): копия HEAD с откатом только правки 16251e6 в `runtime.ts`, тот же сценарий. Результат: `record status=failed reason=error: strf place: minecraft:zombie_villager_v2 for windmill:spawn#0 waits: the world is Peaceful origin=undefined; templates placed=1; registry=windmill:spawn:looted; state.record=null nearSpawn=1` — один в один с продом. Красный прогон — `2.red.json`, зелёный на HEAD — `1.json` (25/25).
- RULED OUT:
  - (1) «прод сгорел из-за радиуса или загрузки». Нет: поиск нашёл место и поставил здание, упал шаг стражей.
  - (2) «вариант (b) — рабочий запасной путь». Нет: Q9 без игрока загружено нечего.
  - (3) «окна превышают предел 100 чанков». Нет: 25/16/36 чанков против 121, отвергнутых в 32f4aca.
  - (4) «поиск роняет тик-рейт». Нет: 2 417 тиков за 125,6 с.

## RADIUS

Код в этом разборе не менялся. Правки ниже касаются только знания. Потолок затронет `src/structures/spawn-search.ts` (`search`, `forcedPrep`), `tests/windmill-spawn.test.mjs` и `src/selftest/spawn-windmill.ts`. Искал так: `grep -rn "andrew_ws_\|SEARCH_RADIUS\|SpawnSearch" src tests` — других потребителей нет, кроме `find` оператора (`SpawnSearch.operator`, `src/main.ts:62`). Потолок изменил бы и его, если не ограничить режимом спавна.

## GREEN / LIVE

- GREEN: `1.json`, HEAD 32f4aca, `tests/windmill-spawn.test.mjs` 25/25, включая «a guard step that throws (a Peaceful world) … done, not failed».
- LIVE: `2.json` — три запуска `bds:check`, 23/22/18 PASS, 0 FAIL (запуск 1 включает временный замер). В этом же прогоне релизный пакет нашёл Мельницу у спавна за 6,9 с (этап 1, 37 блоков), и в запусках 2 и 3 поиск не повторялся. Полный проход — 125,6 с. Правки нет, поэтому GREEN/LIVE здесь — проверка утверждений, а не исправления.

## Решение оператора (только это требует человека)

Принятое `L0-adr-spwn` §1 и §5 требует потолок 60 с, а по таймауту — лучшее место из уже прочитанного. В коде потолка нет. Измеренный худший случай — 125,6 с, так что потолок сработал бы как раз в океанских и холмистых мирах. Обе стороны защитимы:

- **(A) Снять потолок из ADR** (рекомендую). §4.7.8 требует *ближайшее* место в 500 блоках, и оно нормативно; потолок нарушит его именно там, где искать труднее всего. Сервер во время прохода держит ≈19,2 TPS. `wind-ac01` даёт ≤ 5 мин, запас 2,4×. `docs/structures/deviations.md:78` уже описывает поведение кода («первая загрузка мира дольше обычного на время этого поиска»). Цена: первый старт «плохого» мира длится около 2 минут, а обнаружение в 548 блоках вокруг спавна всё это время стоит (`L0-wind-r013`). → Тогда применяется весь список правок ниже, включая строки с пометкой (A), и узел закрывается резолюцией из этого файла.
- **(B) Оставить потолок.** Тогда это работа над кодом по готовой постановке ниже, а узел закрывается после неё.

### Постановка для (B), если выбран потолок

- Наблюдение: полный проход `SpawnSearch` в 500 блоков идёт 125,6 с (`2.json`), а `L0-adr-spwn` §1 и §5 требует завершения за 60 с плюс одно размещение.
- Механизм: в `SpawnSearch.search()` (`spawn-search.ts:421`) нет ограничения по стенным часам, есть только 400 тиков на окно.
- Доказательство достижимости: проход по миру без подходящей площадки. Замер в приложении воспроизводит его на BDS.
- Критерии приёмки:
  1. [unit] поиск с фейковым хостом, где каждое окно грузится N тиков, прекращает чтение колец после 1 200 тиков. Дальше из уже прочитанных кандидатов берётся ближайшее допустимое место, иначе — лучшее сухое место для подготовки. `stage` в записи и строка лога показывают, что сработал потолок.
  2. [unit] `find` оператора не меняется, потолок только для поиска у спавна.
  3. [e2e] `bds:check`: при обычном сиде поиск у спавна по-прежнему `done` за < 60 с; в строке итога есть признак потолка (сработал или нет).

## Резолюция для refine resolve (текст готов)

> L0-strf-cx02 закрыт решением L0-adr-spwn (C-5c) и кодом `src/structures/spawn-search.ts`. Поиск Мельницы у спавна загружает местность временными ticking area окнами 5×5 чанков, не больше 4 одновременно (пул `andrew_ws_0..7`). Каждое окно читается только после `isChunkLoaded && getBlock` по всем его чанкам, так что C-12 держится. Измерено на BDS 1.26.51.1 (2026-09-29): при первом старте без игрока загружено от −1 до 5 чанков по оси (Q9), и вариант (b) невыполним. Предел — 10 областей, 11-я отвергается (Q11). Полный проход в 500 блоков — 165 окон, 4 125 чанков, 125,6 с при ≈19,2 TPS; 3 окна из 165 не загрузились за 400 тиков, их кандидаты отброшены как `unloaded`. Обычный старт — 3–10 с (этап 1). [A: потолок 60 с из L0-adr-spwn снят — §4.7.8 «ближайшее» нормативно, бюджет wind-ac01 ≤ 5 мин.] Сгоревшая запись поиска на проде — дефект `placeAt` до 16251e6, к этому противоречию не относится; здание `windmill:spawn` на проде стоит в состоянии `looted`.

## Дубликаты и расхождения со знанием (файл:строка — что заменить на что)

Пути от корня проекта, `.ai/context/analysis/nodes/`. Правки не вносились. Агрегаты `analysis/*.md` и `project-knowledge/*.md` пересоберутся сами.

1. `strf-cx02__concept-contradiction.md:13` — `status:open` → `status:resolved`, `resolved_by:L0-adr-spwn` (после решения оператора).
2. `strf-cx02__concept-contradiction.md:22` — «At first start only ~4–10 chunks around the player are loaded» → «At first start on BDS no player is online; −1…5 chunks are loaded along an axis from spawn (Q9)»; «up to ~3 000 chunks» → «≈3 070 chunks for the 500-block disc; the implementation loads 161–165 windows = 4 025–4 125 chunks».
3. `strf-cx02__concept-contradiction.md:25` — «Cost: seconds of generation at world start» → «Cost: 3–10 s when stage 1 succeeds; 125.6 s for the full 500-block sweep (measured)».
4. `strf-cx02__concept-contradiction.md:26` — «Search only the loaded area around spawn (≈ 9×9 chunks)» → «not available on BDS: nothing is loaded around spawn without a player (Q9)».
5. `adr-spwn__concept-architecture-decision.md:18` — «accepted, pending probe item 11» → «accepted; probe item 11 PASS (decision-adr-l0-wind-ad01-accepted-…)».
6. `adr-spwn__concept-architecture-decision.md:33` — «At most 10 areas are active at once (the engine cap)… prefixed `andrew_ws_*`» → «at most 4 windows at once (PARALLEL), names from a pool of 8 `andrew_ws_0..7`, all removed at host start».
7. `adr-spwn__concept-architecture-decision.md:34-35` — (A) удалить «Wall-clock cap: 60 s» и «On timeout, it falls back…» / (B) оставить.
8. `adr-spwn__concept-architecture-decision.md:37` — `andrew:st:spawnWindmill` → `andrew:st:spawn` (`SPAWN_KEY`, `spawn-search.ts:21`).
9. `adr-spwn__concept-architecture-decision.md:38` — `reason:"noDryLand"` → `reason:"no-dry-land"` (`spawn-search.ts:583`).
10. `adr-spwn__concept-architecture-decision.md:39` — «linked-Airship attempt runs while the sweep's areas still cover its ring» → «each window is removed right after it is read (`spawn-search.ts:396`); the linked attempt loads its own ring through the runtime ring loader (`andrew_ring_o_*`, pool 4, `runtime.ts:290,326`)».
11. `adr-spwn__concept-architecture-decision.md:42` — (A) «the sweep finishes within 60 s plus one place» → «the search is terminal within 5 min (wind-ac01); measured worst case 125.6 s».
12. `adr-spwn__concept-architecture-decision.md:44` — удалить абзац «If probe item 11 fails…» (Q11 PASS).
13. `wind-ad01__concept-architecture-decision.md:19` — «Status: proposed» → «Status: accepted (decision-adr-l0-wind-ad01-…, 2026-09-26)».
14. `wind-ad01__concept-architecture-decision.md:27` — «at most **2** ticking areas at a time … each a ≤ 10×10-chunk window» → «at most 4 at a time (`PARALLEL`), each a 5×5-chunk window (`WINDOW`)».
15. `wind-ad01__concept-architecture-decision.md:30` — «plot + band + airship ring (100 + 15 blocks) are held by one area until … the linked Airship attempt» → «the site area (plot + 2-block margin) is held until `placeAt` returns; the linked attempt uses the ring loader»; «removed if the record is terminal» → «every pool name is removed when the host is created (`spawn-search.ts:738`)».
16. `wind-ad01__concept-architecture-decision.md:38` — «seconds to minutes» → «3–10 s typical, 125.6 s full sweep (measured 2026-09-29)».
17. `wind-p002__concept-process.md:22` — `andrew:st:spawnWindmill`, `{searching, preparing, placing}` (resume) → `andrew:st:spawn`; `preparing` replays the plan, `searching` becomes `failed` «interrupted» and never reruns (`spawn-search.ts:290-296`).
18. `wind-p002__concept-process.md:35` — «The cursor (stage, ring, window) is persisted every window, so a restart resumes» → «no cursor is persisted; an interrupted search is recorded `failed` and not repeated».
19. `wind-p002__concept-process.md:31`, `wind-r011__concept-rule.md:23`, `wind-e002__concept-entity.md:41`, `wind-g002__concept-glossary-term.md:17`, `wind__concept-component.md:39`, `wind-p004__concept-process.md:33`, `wind-ac01__concept-acceptance-criterion.md:22`, `wind-ac02__concept-acceptance-criterion.md:22` — `windmill:S` → `windmill:spawn` (`SPAWN_ID`, `spawn-search.ts:23`).
20. `wind-r011__concept-rule.md:23` — «A non-terminal status resumes from its cursor» → «only `preparing` resumes; `searching` after a restart is `failed`».
21. `wind-r011__concept-rule.md:22`, `wind-r013__concept-rule.md:22`, `wind-ac01__concept-acceptance-criterion.md:21`, `wind-g002__concept-glossary-term.md:17`, `wind__concept-component.md:35`, `wind-e002__concept-entity.md:6,16`, `strf-e002__concept-entity.md:20`, `strf__concept-component.md:41`, `adr-strs__concept-architecture-decision.md:27` — `andrew:st:spawnWindmill` → `andrew:st:spawn`.
22. `wind-e002__concept-entity.md:34`, `wind-cx01__concept-contradiction.md:26` — `"noDryLand"` → `"no-dry-land"`.
23. `wind-p004__concept-process.md:33` — «Its linked Airship is part of the same first-start job, while the ticking area is still active» → «its linked attempt runs through the ring loader like any Windmill's».
24. `wind__concept-component.md:30` — «Exactly one per world, 100 %» → «exactly one per world where dry land exists within 500 blocks (L0-xq4)».
25. `concept-constraint.md:20` — «tick budgets C-5a/C-5b» → «tick budgets C-5a/C-5b/C-5c (C-5c: the one-time bounded tickingarea sweep for the spawn Windmill, L0-adr-spwn)».

## Попутно (не для этого узла; сказано здесь, карточек нет)

- Прод (`andrew-bds`, difficulty=peaceful): стражи `windmill:spawn` не появятся, пока сервер в Peaceful. Каждый проход очереди у загруженного спавна пишет 2 предупреждения: за 2026-09-28 их 112 пар. Поднять сложность до easy — решение оператора; тогда шаг стражей пройдёт, и экземпляр дойдёт до `done`. Запись поиска `failed` останется. Её читают только строка лога при старте и событие `andrew:spawn_windmill_state`; на игру она не влияет. Правку кода не предлагаю: на HEAD 0 случаев, мир с такой записью один.

## Приложение: замер полного прохода (временный selftest, не закоммичен)

Подключался в `src/selftest/main.ts` после `runChunkProbes` в запуске 1. Запускался на отдельном экземпляре `docker/bds-cx02` (свои контейнер и порты) командой `ANDREW_BDS_DIR=bds-cx02 node scripts/bds-check.mjs --timeout 900` под `ai-kit run-check`. После прогона экземпляр удалён.

```ts
const centre = { x: Math.floor(spawn.x) + 20000, z: Math.floor(spawn.z) };
profiles.windmill = { ...saved, flat: { maxSpread: -1 } }; // no candidate passes: every ring is read
const inner = engineSpawnHost(dim, system, { BlockVolume, BlockTypes }, () => centre, undefined, { prefix: "andrew_sw_", pool: 8 });
// host.load wrapped: counts loads, chunks, failures (undefined), max single-load ms
const res = await SpawnSearch.operator(rt, host, { type: "windmill", radius: 500, centre, log }).find();
```

Строки лога (`dist/bds-check.log` этого прогона):

```
19:46:01.246 structure find: windmill search started around 19987,-38 (radius 500)
19:46:49.651 SWEEP progress loads=80 chunks=2000 failed=0 elapsed=48405ms ticks=945 max-load=3373ms
19:47:20.715 SWEEP progress loads=100 chunks=2500 failed=2 elapsed=79469ms ticks=1549 max-load=19931ms
19:48:06.895 SWEEP RESULT radius 500 around 19987,-38: placement=none error=none checked=49098 loads=165 chunks=4125 failed-loads=3 wall=125649ms ticks=2417 max-load=19931ms rejects: liquid=36093 uneven=10877 unloaded=2128
```
