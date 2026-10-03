ИСХОД: 3 — Подчистка знания

# CNTR-X20-AA · L0-xcx20 «L0-ufoc отсутствовал в прогоне v4»

Измерения: `docs/feedback/diagnose-CNTR-X20.sh` → `.ai/verify/CNTR-X20-AA/2.json`: 63 PASS, 0 FAIL, exit 0. Код идентичен ae1c2d0. KV, состояние и индекс читались из корневого `.ai` только на чтение.

## Итог

Утверждение было верным для прогона v4 и снято прогоном v5 и карточкой UFOC-CORE-01-AA.
- **Версия узла.** `analyst-state.md:19`: `L0-ufoc: 5`. В `:277` записан пробел v4 («never analysed: L0-ufoc»), в `:275` — перевод «promoted L0-ufoc (v3 → v5)» 2026-10-02 19:11.
- **Артефакты.** 37 файлов `ufoc*`, все с `analysis_version: 5`, из них критерии ac01–ac08. v5 взял на вход то, что требовал xcx20: `ufoc__:14,18,20` ссылаются на adr-ufpc, adr-ufht, adr-ufom, xasm13, xasm17.
- **Доска.** UFOC-CORE-01-AA закрыта 9/9: aef4d54 (`Acceptance: passed=9 failed=0`, `Verified-By: 00d38cf`), влита в 4f479af, предок HEAD.
- **Почему узел жив.** Его так и не закрыли. Сводка v6 оставила его в списке «Carried, not touched in v6» (summary.md:110).

## Владелец каждого названного критерия (код · проверка)

| Критерий | Код | Проверка |
|---|---|---|
| AC-1 первый прилёт 10–20 мин | env.ts:25-26; index.ts:58 (initialSpawn) | GameTest ufo_schedule_scaled_clock (ufo-core.ts:324); unit 42/42 |
| AC-1 ровно +15 мин после улёта/сбития | env.ts:23 PAUSE_MS; event.ts:318, :331 | ufo-core.ts:346 (улёт), :356 (сбитие) |
| AC-1 таймер переживает перезапуск | schedule.ts:11 (маркер 0), :62-67 | bds-check: ufo-restart.ts:202 timer, :209 in-flight |
| AC-2 тайминг 20/60/15 с | env.ts:20 400/1200/300 | ufo_phases_real_durations (ufo-core.ts:413,415,416 ±1 тик) |
| hoverY = min(c+40, потолок−15) | event.ts:19, :104 | там же; замер hoverY 305 при площадке 290 (UFOC-CORE) |
| AC-3 только Overworld, ждёт игрока, одна тарелка | env.ts:66 | ufo_overworld_only (ufo-core.ts:511 End, :520, :536) |
| AC-3 оповещение 150 блоков, RU/EN | event.ts:21, :304; ru_RU.lang:92, en_US.lang:92 | ufo_arrival_notice (ufo-core.ts:673: 151 — нет) |
| AC-17 только оператор | commands.ts:60 GameDirectors + :64 своя проверка | ufo_commands_operator (ufo-core.ts:572, :600) |
| AC-17 disable переживает перезапуск | флаг `andrew:ufo_enabled` | bds-check.mjs:334 (релизный пак, прогоны 1–3); ufo-restart.ts:234 |
| AC-18 нет тарелки после перезапуска | event.ts:349 worldLoad, :388 entityLoad | ufo-restart.ts:213, :221; bds-check.mjs:310 валит прогон без фазы |
| Шов часов (L0-xasm13) | env.ts:44-59, продукт :93 | все GameTest НЛО идут через него |

Свежесть: UFO-код, self-check и bds-check не менялись с 27a2f01. С тех пор в раннере только три добавленные строки не про НЛО (0013011, 2c1a383). На 27a2f01 полный набор прошёл все шесть ufo_* ядра (SAUC-SHOOT-01-AA/2.json). bds-check с ufo-restart зелёный на коде, идентичном HEAD (CNTR-X17-AA/2.json, ae1c2d0).

**Без владельца в коде нет ни одного.** Три хвоста, все с владельцем или вне спеки:
1. Перезапускная половина (AC-1 «переживает», AC-17 «disable переживает», AC-18) доказана только bds-check, вне гейта каждой задачи. Это исход 2 у CNTR-X17-AA, постановка уже написана. Здесь не дублирую.
2. AC-17: отказ не-оператору реальным клиентом вживую не запускался. Проверено на симигроке для gt-команды (ufo-core.ts:572-574). Об этом уже сказали UFOC-CORE-01-AA и CNTR-X17-AA.
3. iPad-половина `ufoc-ac07` («В небе НЛО!» в чате на русском iPad) — нет ни в `docs/demo/ufo-ipad.md` (там только sauc-ac06 и magn-aipd), ни на доске. В спеке §14 этого пункта в списке iPad нет: его добавил узел. Строки побайтно сверены статикой. Решение — в п. 7 ниже.

## Блоки /diagnose

OBSERVED: L0-xcx20 (v4, status:open) — L0-ufoc «ran and failed», AC-1/2т/3/17/18 без владельца. Сегодня L0-ufoc v5, 37 артефактов v5, UFOC-CORE-01-AA 9/9 в HEAD.
VERDICT: по умолчанию разбиралось как баг. Ожидание выполнено и в KV-файлах, и в коде; расходится только знание.
CHECKS: contradiction none · duplicate: перезапускная часть = CNTR-X17-AA · criteria writable yes. UNFOLD: подчистка знания. HUMAN: none.
REPRO: `bash docs/feedback/diagnose-CNTR-X20.sh` → 63/0, дважды подряд после правки самой проверки. Дефект узла не воспроизводится.
CAUSE: пробел v4 (analyst-state.md:277) закрыт прогоном v5 (:275) и кодом aef4d54; сам узел не закрыт (summary.md:110).
PROOF: `.ai/verify/CNTR-X20-AA/2.json` (крит. 2,3). Первая запись этого файла упала с exit 1: проверка «sha артефакта X17 == HEAD» сломалась на моём же коммите. Заменил на «код не менялся» (без изменений в src, scripts, packs, package.json), перезаписал.
RULED OUT: (1) «v5 не покрывает названные AC» — у ufoc-ac01…ac06 теги ufo-ac-1/2/3/17/18 и строка кода на каждый пункт. (2) «отгрузили и сломали» — с 27a2f01 UFO-путь не менялся, bds-check на идентичном коде зелёный, unit 42/42 сейчас.
(3) «KV и сегодня не отдаёт ufoc» — ВЫЖИЛО, но причина другая (см. ниже), не та, что в xcx20.
RADIUS: кода не трогаю. Копии найдены `grep -rn` по корневому `.ai/context`: xcx20, CX-L0-20, «ufoc failed», «not implemented», «ceiling − 4».
GREEN/LIVE: исправления нет, в KV ничего не писал. Живой прогон: unit сейчас. Своего BDS не поднимал: UFO-код не менялся после двух зелёных BDS-прогонов, перечисленных выше.

## Подчистка знания — что заменить на что (пути от `.ai/context/analysis/`; не правлено)

1. `nodes/xcx20__concept-contradiction.md:13` `"status:open"` → `"status:resolved"`; `:22` `status: open` → `resolved`. Резолюция: `refine resolve L0-xcx20 --outcome changed --evidence "analyst-state L0-ufoc v5 (2026-10-02 19:11); UFOC-CORE-01-AA aef4d54/4f479af 9/9; .ai/verify/CNTR-X20-AA/2.json"`.
2. `nodes/ufoc__concept-component.md:14` убрать тег `"not-implemented"`. `:20` «State (2026-10-02): not implemented. There is no `src/ufo/`. This run replaces the failed v4 node…» → «Shipped: UFOC-CORE-01-AA (aef4d54, merge 4f479af), `src/ufo/`.» Вторую фразу оставить.
3. `summary.md:110` и `nodes/concept-overview.md:104` — убрать `xcx20` из «Carried, not touched in v6».
4. `nodes/adr-ufpc__concept-architecture-decision.md:29` «`ufoc` failed in this run, so no artifact publishes the contract» → «`ufoc` v5 publishes it (ufoc-p002, ufoc-ent2); shipped in src/ufo/event.ts».
5. Потолок висения — решение `decisions/decision-resolve-l0-sauc-cx01.md` (2026-10-02) и код (event.ts:19 `CEILING_MARGIN = 15`) говорят −15, узлы — −4:
   `nodes/ufoc-r003__concept-rule.md:22` `ceiling − 4` → `ceiling − 15`, «hoverY ≤ 316» → «≤ 305»; `nodes/ufoc-g003__concept-glossary-term.md:17` `− 4` → `− 15`; `nodes/ufoc__concept-component.md:27` `ceiling − 4` → `ceiling − 15`; `nodes/adr-ufht__concept-architecture-decision.md:28,36` cap hoverY `ceiling − 4` → `ceiling − 15` (`:17,35` — потолок ног, в коде он `− 4`: saucer.ts:29, :62 — остаётся); `nodes/sauc-r002__concept-rule.md:34` `capped at ceiling − 4` → `− 15`; `nodes/sauc-cx01…:40` оставить как историю.
   Вне `context/`: описание узла в `.ai/state/analyst-state.md:224` («capped at ceiling − 4») перегенерирует analyze — руками не править.
6. `nodes/xcx20__concept-contradiction.md:41` «`L0-xcx17` … stays unresolved» (его называл и отчёт CNTR-X17-AA). После п. 1 строка становится историей; судьбу xcx17 решает CNTR-X17-AA.
7. `nodes/ufoc-ac07__concept-acceptance-criterion.md` (iPad-половина): мой выбор — снять её. Спека §14 её не требует, строки сверены статикой, а без строки в листе iPad она так и будет висеть без владельца. Если оператор хочет её оставить — вместо снятия нужна одна строка в `docs/demo/ufo-ipad.md`.

## Отдельно, словами оператору: индекс KV не отдаёт ни одного узла ниже v6

Это не причина xcx20, и исправить её в этом прогоне я не могу: это поведение ai-kit, а переиндексация — запись в KV, которую карточка запрещает. Не завожу ничего, говорю здесь.
- `.ai/index/vectors.db`, kv_documents: текущих L0-ufoc — 0, все 37 закрыты `replaced_by_pipeline` в `2026-10-03T15:11:04.299Z`. Одной пачкой закрыто 670 rollout-документов (v3–v5) у 16 компонентов: wind 61, strf 53, orbc 52, infr 50, scyt 47, ring 46, magn 45, pntr 42, ufoc 37, loot 34, sauc 32, bast 31, wrdn 30, webs 29, airs 24, pick 24, плюс L0-adr/xasm/xcx. Текущих rollout-документов ниже v6 — 0, на v6 — 157.
- При этом `analyst-state.md` держит `L0-ufoc: 5`, `L0-wind: 2`, `L0-orbc: 3` и т. д. Индекс и состояние анализа расходятся.
- Момент: перезапуск демона chronicle 3.10.0 → 3.14.0 (ai-kit.log:2636 стоп 15:10:46, :2652 переиндексация 1073 файлов 15:11:01, :2701 старт v3.14.0 15:11:04.781). Были и переиндексации 3.10.0 в 14:58:08 и 14:58:26, но closed_at из 14:5x нет ни у одного документа.
- Как видно снаружи: `kv_list({node_prefix:"L0-ufoc"})` → `[]`; `kv_search` по расписанию НЛО возвращает только сырые фрагменты спеки, без единого правила ufoc. `kv_contradictions(open)` при этом всё ещё показывает xcx15/16/17/19/20 — он читает тег статуса, а не `closed_reason`.
- Чем грозит: любой агент после 15:11 получает из KV только v6 (L0, lgnd, katn). Для работ по Катане (опора на lgnd) это почти безвредно. Для правок НЛО, Пушки и структур знание недоступно, хотя файлы на месте.

Карточек не заводил, в KV ничего не писал. Индекс открывал только `sqlite3 -readonly mode=ro`. В репозитории — только этот отчёт и скрипт замеров.
