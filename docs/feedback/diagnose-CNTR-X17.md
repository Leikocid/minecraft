# CNTR-X17-AA · L0-xcx17 — разбор через /diagnose

ИСХОД: 2 — Работа над кодом

Проверено на HEAD ae1c2d0 (task/CNTR-X17-AA). Замеры повторяет `docs/feedback/diagnose-CNTR-X17.sh` (30 PASS, 1 FAIL — красный гейт и есть разрыв). Живой прогон перезапускной проверки: `.ai/verify/CNTR-X17-AA/2.json`.

## Итог

- **Половина про время закрыта GameTest'ом — решение не нужно.** Шов часов отгружен. AC-1 (окно 10–20 мин, +15 мин) идёт на тестовых часах, AC-2 (20/60/15 с) — на реальных длительностях. Оба сценария стоят в списке раннера.
- **Половина про перезапуск (AC-1 «таймер переживает перезапуск», AC-17 «disable переживает», AC-18) доказана только `bds-check`.** Сегодня это зелёно, но этой проверки нет в наборе GameTest, а по нему гейтится каждая задача.
- **Предпосылка узла ложна для этого репозитория.** «A GameTest cannot restart the server» (`xcx17:34`) не так: с a1ac63f (2026-09-30) раннер перезапускает BDS между парными GameTest'ами (`scripts/bds-gametest.mjs:360-363,740`). На этом закрыты перезапускные критерии Пушки и Пробоя, и они проходят в полном наборе. Значит, DoD §14 «автоматизированы в GameTest» выполним буквально.
- **Оператору решать нечего.** Спека говорит «GameTest», и путь к этому есть. Переосмысление из `L0-xasm13` не нужно. Его «Impact if wrong» («restart ACs become manual ipad/operator checks», `xasm13:37`) ложно. Нужна работа: перенести перезапускные случаи в пару GameTest с перезапуском.
- **Вред текущего разделения измерен, а не предположен.** После 00d38cf — последнего кода, на котором шёл `bds-check` до этой задачи, — легли 4 коммита НЛО. Ни один не запускал `bds-check`. 9f41015 при этом правил саму перезапускную проверку (заглушка → тарелка).

## Что проверено агентом и что остаётся оператору

| Проверено агентом (адрес) | Итог |
|---|---|
| Шов часов: `src/ufo/env.ts:44-59` (`now()`, `durations`, `pauseMs`, `firstMinMs/MaxMs`); продукт `:93-106` (`Date.now`, `PHASE_TICKS` 400/1200/300 `:20`); ядро читает время только через `env.now()` (`schedule.ts:35,47,57,74`, `event.ts:278`; `Date.now()` вне комментариев — 0), фазы — через `env.durations` (`event.ts:191`) | отгружен |
| AC-1 время: `ufo_schedule_scaled_clock` (`src/gametest/ufo-core.ts:313`), `TestClock` `:74`, утверждения `:324` (join + 1 200 000), `:346` (+15 мин после улёта), `:356` (+15 мин после сбития); в раннере `scripts/bds-gametest.mjs:321` | GameTest |
| AC-2 время: `ufo_phases_real_durations` (`ufo-core.ts:385`), `PHASE_TICKS` `:386`, 400/1200/300 ± 1 `:413,415,416`; раннер `:322` | GameTest |
| AC-1 перезапуск, AC-17 «disable переживает», AC-18: `src/selftest/ufo-restart.ts:202,209,221,226,234`; `scripts/bds-check.mjs:310` (фазы `ufo-restart-run1/2` обязательны), `:322-342` (строка `enabled=` релизного пака в прогонах 1–3) | только `bds-check` |
| `npm test` до BDS не доходит (`package.json:11`); `bds:check` — отдельный скрипт (`:16`) | вне гейта |
| Раннер GameTest умеет перезапуск: `RESTART_AFTER` `bds-gametest.mjs:360-363`, вызов `:740`; пары `orbital_flight_restart_fire/check`, `pntr_legendary_two_columns/restart_check`; введён в a1ac63f 2026-09-30 | есть |
| Тестов `andrew:ufo_*` в раннере 28, перезапускных среди них 0 | разрыв |
| Карточка UFOC-CORE-01-AA 9/9: AC#5 (перезапуск) закрыт `5.json` = `bds-check` на 00d38cf, остальные — GameTest/юнит. С «без владельца» из узла сходится так: AC-1/AC-2 по времени теперь в GameTest; AC-1 перезапуск, AC-17 персистентность и AC-18 закрыты, но не GameTest'ом | см. выше |

**Оператору — ничего.** Вопрос узла «признать ли `bds-check` автоматизацией на BDS» снят: буквальное прочтение DoD достижимо имеющимся механизмом. Если оператор всё же захочет принять `bds-check` вместо переноса, это будет изменение DoD §14 (`ufomagnetspecv1ruen-part-4.md:65`), и цену его видно в разделе «Вред».

## Блоки /diagnose

```text
OBSERVED: узел L0-xcx17 (v4) называет конфликт DoD §14 «в GameTest» (ufomagnetspecv1ruen-part-4.md:65)
          с AC-1/AC-2 (реальное время) и AC-1-перезапуск/AC-17/AC-18 (перезапуск). В коде: время —
          GameTest; перезапуск — self-check bds-check (src/selftest/ufo-restart.ts). Последний запуск
          bds-check до этой задачи — 2026-10-02 20:57 на 00d38cf; после него 4 коммита НЛО без него.
VERDICT: половина про время снята кодом. Половина про перезапуск расходится с буквой DoD, и
         принятого решения об этом нет (adr-ufrs:51 «still-open reading», ufoc-ac03:20 «pending»).
CHECKS: contradiction: none (переосмысление xasm13 не принято) · duplicate: none на доске ·
        criteria writable: yes
UNFOLD: task — одна пара GameTest с перезапуском + проверка строки релизного пака в раннере
HUMAN: none — буква спеки выполнима, решение не меняется
REPRO: bash docs/feedback/diagnose-CNTR-X17.sh → exit 1 (30 PASS / 1 FAIL: в RESTART_AFTER нет
       пары НЛО); детерминированно. Живьём: bds-check на ae1c2d0 → 2.json exit 0.
CAUSE: перезапускные критерии направлены в bds-check (ufoc-ac03:6,20; ufoc-ac05:25), потому что
       xasm13 исходил из «GameTest не может перезапустить сервер» (xcx17:34). Для раннера репозитория
       это неверно с a1ac63f (bds-gametest.mjs:360-363,740). Итог: доказательство перезапуска
       вне набора, которым гейтится каждая задача.
PROOF: .ai/verify/CNTR-X17-AA/2.red.json — скрипт через run-check --expect-red на коммите отчёта.
       Прецедент: SAUC-SHOOT-01-AA/3.json (27a2f01) — orbital_flight_restart_fire/check и
       pntr_legendary_restart_check прошли внутри полного набора.
RULED OUT: (1) «перезапускная проверка сломана на HEAD» — 2.json зелёный: timer stored = at load
           = 1791044097877; маркер 0 → load + 900001 мс; 0 тарелок при загрузке; тарелку снял
           entityLoad-sweep ядра st2; тег andrew:ufo_iron снят; выключенное ядро без сессии
           220 тиков; релизный пак enabled=true/false/true в прогонах 1–3.
           (2) «в GameTest нельзя: симигроки не переживают перезапуск» — ufo-restart.ts:44 берёт
           поддельного UfoPlayer, SimulatedPlayer там нет; пара Пушки проходит в мире gametest.
           (3) «bds-check и так в гейте» — npm test его не зовёт (package.json:11); в .ai/verify
           между UFOC-CORE-01-AA/5.json (00d38cf) и 2.json этой задачи запусков нет.
RADIUS: смотрел RESTART_AFTER и семантику --only («both or neither», bds-gametest.mjs:356-359);
        ядра пака gametest со scope "gt" (ufo-core.ts:9,51) — паре нужен свой scope, как st1–st3
        (ufo-restart.ts:88-92): уборку тарелки надо приписать её ядру, а не gt-ядру другого сценария;
        релизный /andrew:ufo disable в мире gametest переживает перезапуск — проверка обязана
        вернуть enable (как ufo-restart.ts:239); остальные ufo_* GameTest'ы берут свой
        CountingStore, флаг релизного пака их не касается. Правка добавочная — ничего, что проходит
        сегодня, не отвергается (страж, не ограничение). Фазы bds-check остаются: они идут в
        обычном мире без экспериментов, это лишний реализм, а не дубль, который надо убрать.
GREEN/LIVE: исправления в этом прогоне нет (исход 2 — постановка). Живой прогон текущего пути —
            2.json выше, он входит в ufo-restart.ts и event.ts:349-390 на ae1c2d0.
```

## Готовая постановка

**Название:** Перезапускные критерии НЛО — в набор GameTest: пара с перезапуском BDS вместо одного `bds-check`.

**parent_work_goal:** UFO §14 DoD «все приёмочные тесты, проверяемые на BDS, автоматизированы в GameTest» (`ufomagnetspecv1ruen-part-4.md:65`); L0-xcx17, CNTR-X17-AA.

**Touches:** `src/gametest/ufo-restart.ts` (новый), `src/gametest/main.ts`, `scripts/bds-gametest.mjs`.

**Описание.** Перенести случаи `src/selftest/ufo-restart.ts` в пару GameTest `andrew:ufo_restart_seed` → перезапуск раннером → `andrew:ufo_restart_check`, по образцу `orbital_flight_restart_fire/check` (`src/gametest/orbital-flight.ts:691,728`). Ядра пары строятся при загрузке модуля / worldLoad, у каждого случая свой scope (не "gt"), стор — динамические свойства пака gametest. Цель — поддельный `UfoPlayer`, как в `ufo-restart.ts:44`. Релизный `/andrew:ufo disable` уходит из seed, `enable` — из check. Раннер проверяет строку `[andrew] ufo ufo: loaded, enabled=false` после перезапуска, как `bds-check.mjs:322-342`. Фазы `bds-check` не удалять.

**Критерии:**
1. `[e2e]` Пара `andrew:ufo_restart_seed` / `andrew:ufo_restart_check` стоит в `RESTART_AFTER` и в списке раннера. Случаи:
   - timer — `next_ms` = T до и после;
   - in-flight — 0 при загрузке → [load + 900 000, load + 905 000];
   - 0 сущностей `andrew:ufo` при загрузке и после того, как ticking area загрузила чанк тарелки; тарелку снял entityLoad-sweep своего ядра;
   - сущность с `andrew:ufo_iron` без тега;
   - выключенное ядро: `enabled === false`, нет сессии 220 тиков при просроченном `next_ms` и с целью.

   [src: L0-ufoc-ac03, L0-ufoc-ac05 AC-18]
2. `[e2e]` Релизный `/andrew:ufo disable` до перезапуска → строка загрузки релизного пака после него `enabled=false`. Раннер валит набор, если строки нет или значение другое. Check возвращает `enable`. [src: UFO AC-17, L0-ufoc-ac03 случай 3]
3. `[e2e]` Красное доказательство: сборка без ветки маркера при загрузке (`src/ufo/schedule.ts:62-66`, `event.ts:349-350`) валит случай in-flight. Артефакт `--expect-red` получен до возврата правки. [src: L0-ufoc-ac03 «Red proof»]
4. `[build]` `npm test`, `npm run typecheck`, `npm run build`, `npm run validate` зелёные. Полный набор GameTest на ветке задачи с `--timeout 5400` зелёный, обе половины пары в нём. `npm run bds:check` (на своём экземпляре) зелёный. Ни один тест не удалён и не ослаблен.

## После того как задача ляжет — подчистка знания (пути от `.ai/context/analysis/`)

1. `nodes/xcx17__concept-contradiction.md:14,23` status open → resolved (resolved_by_code). `:34` «A GameTest cannot restart the server» → «a GameTest cannot; the runner restarts BDS between paired GameTests (RESTART_AFTER, a1ac63f)».
2. `nodes/xasm13__concept-assumption.md:7,17,24` «restart ACs are bds-check restart scenarios» → «… are a GameTest restart pair». `:35` — то же. `:37` «become manual ipad/operator checks» — убрать.
3. `nodes/ufoc-ac03__concept-acceptance-criterion.md:6,16` «`bds-check` restart scenario» → «GameTest restart pair». `:13` тег `bds-check-restart` → `gametest-restart`. `:20` «pending `L0-xcx17`» — убрать.
4. `nodes/ufoc-ac05__concept-acceptance-criterion.md:13` тег `bds-check-restart` → `gametest-restart`. `:25` «AC-18, `bds-check` restart on 19136» → «AC-18, GameTest restart pair».
5. `nodes/ufoc-p003__concept-process.md:36`, `nodes/adr-ufrs__concept-architecture-decision.md:51`, `nodes/ufoc__concept-component.md:51` — «bds-check restart scenario / still-open reading» → «GameTest restart pair».
6. `nodes/ufoc__concept-component.md:14` тег `not-implemented` устарел уже сейчас: UFOC-CORE-01-AA закрыта 9/9, код в `src/ufo/`.
7. `nodes/xcx20__concept-contradiction.md:41`, `summary.md:110`, `nodes/concept-overview.md:104` — убрать xcx17 из «unresolved / carried».

## Замечено рядом, не входит в xcx17

AC-17, отказ не-оператору у **релизной** команды: `ufoc-ac06:27` требует `bds-check` с реальным клиентом или deop'нутым игроком. Это не запускалось. Карточка UFOC-CORE записала это отклонением: в GameTest отказ доказан для gt-команды (`ufo-core.ts:572-574`), а для релизной гостевой вызов только пишется в лог (`:576-577`). Того же вопроса — GameTest или нет — это не касается: обычным GameTest'ом это недоказуемо, симигроки невидимы для релизного пака. Говорю об этом словами, карточку не завожу.

## Чего не делал

Карточек не заводил (ни `task_create`, ни `issue_triage`). В KV не писал ничего: ни `refine`, ни правок в `.ai/context`, KV только читал. В репозитории — только этот отчёт и скрипт замеров. Свой экземпляр BDS `docker/bds-x17` (не в git) после прогона снят.
