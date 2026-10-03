ИСХОД: 3 — Подчистка знания

# Разбор ufoc-cx01 (CX-ufoc-1): «третье стойкое свойство НЛО» против C-23

Проверено на HEAD `ae1c2d0` (ветка `task/CNTR-UFOC-CX01-AA`), 2026-10-03. KV читалось из корневого
`.ai/context` (только чтение), а не из копии в worktree.

Итог. Код реализует вариант (a) буквально. В мир пишутся ровно два свойства: `andrew:ufo_next_ms` и
`andrew:ufo_enabled`. «Событие шло в момент перезапуска» кодируется значением `next_ms = 0`. Свойства
`andrew:ufo_active` нет ни в коде, ни во всей его истории. Расхождение живо только в знании: принятый
`L0-adr-ufrs` объявляет «`L0-adr-ufom` §4 is amended», но правку так и не внесли. Узел `adr-ufom` до сих пор
версии 4, и в строке 46 стоит прежний «transient `andrew:ufo_active` flag».

## Перепроверка утверждения, по частям

| # | Часть утверждения | Как проверено | Результат |
|---|---|---|---|
| a | `adr-ufom` §2: стойкие только `andrew:ufo_next_ms` и `andrew:ufo_enabled` | чтение `adr-ufom__concept-architecture-decision.md` | верно, строки 37–39 |
| b | C-23: «Only the schedule and the enable flag are durable» | `git log --all -S"\| C-23 \|" -- .ai/context` → `0a8f2c1`, файл `analysis/nodes/concept-constraint.md` | верно дословно. В v6 C-23 перенесена без изменений: `concept-constraint.md:30` («C-21 … C-23 (v4)») |
| c | `adr-ufom` §4: «…if an event had been running, recorded by a transient `andrew:ufo_active` flag» | `grep -rn ufo_active` по корневому KV | верно, и **до сих пор**: `adr-ufom…:46`, `analysis_version: 4` (строка 5) |
| d | UFO §10: «+15 мин после перезапуска» | `grep` по сырой спеке | верно: `ufomagnetspecv1ruen-part-3.md:75` («через 15 минут после перезапуска») |
| e | 15 мин = 900 000 мс | `grep PAUSE_MS` | `src/ufo/env.ts:23` `PAUSE_MS = 900_000` |
| f | Резолюция: (a), маркер `next_ms = 0` | чтение `src/ufo/schedule.ts` | `:11` `IN_FLIGHT = 0`; `:51-53` `markInFlight`; `:62-67` `loaded()`: 0 → now + `PAUSE_MS`; `:21-24` отсутствие читается как `undefined`, а не 0 |
| g | «Каждый путь завершения перезаписывает маркер» | чтение `src/ufo/event.ts` | `:291` маркер при прилёте; `:313-319` `endEvent` → `pauseFromNow` (departed `:221`, stop/abort `:201`); сбитие: `:335` в `reportShotDown`, затем `:318` оставляет значение |
| h | Чтение маркера при загрузке | чтение `src/ufo/index.ts`, `event.ts` | `index.ts:109` worldLoad → `startUfo` → `:56` `core.worldLoaded()` → `event.ts:349-350` `schedule.loaded()` |
| i | Проверка ac03, случай 2: окно [load + 900 000, load + 905 000] на checks-инстансе 19136 | `grep` | `src/selftest/ufo-restart.ts:32` `LOAD_SLACK_MS = 5_000`, `:207` окно; `docker/bds-ci/compose.yaml:38` `SERVER_PORT: "19136"` |
| j | Третьего стойкого свойства нет | (1) `grep setDynamicProperty src/ufo` → 3 места, мир только через `worldStore` (`env.ts:86-91`); (2) одноразовый зонд записей в store поверх `tests/ufo-schedule.test.mjs` | зонд, 42/42 pass: `{"andrew:ufo_next_ms": [epoch, "0"], "andrew:ufo_enabled": ["false", "true"]}`. Других ключей нет |
| k | `ufo_active` в коде когда-либо | `git log --all -S"ufo_active" -- src tests scripts` | пусто: никогда не существовал. Маркер `0` пришёл в `1ba7272` (2026-10-02, UFOC-CORE-01-AA) |

Единственное свойство на сущности, `andrew:ufo_event` (`src/ufo/saucer.ts:307`), висит на тарелке, а не на
мире. Тарелку убирает уборка при загрузке (`event.ts:387`, `L0-xasm17`), так что это не состояние
расписания. Описано в `sauc-ent1:29`.

## /diagnose

```text
OBSERVED: KV node L0-ufoc-cx01 (v5) says L0-adr-ufom §4 reads a "transient andrew:ufo_active flag"
          at world load, while §2 and C-23 allow only two durable properties. No run or log comes
          with it; it is a reading of text. Measured today: the §4 wording is still verbatim at
          adr-ufom__concept-architecture-decision.md:46 (analysis_version 4), while the accepted
          L0-adr-ufrs (:37) says "§4 is amended".
VERDICT: bug in knowledge, not in code. A recorded expectation (L0-adr-ufrs Decision 3: amend §4)
         diverges from the node it amends. The code side was checked as a bug by default.
CHECKS: contradiction: L0-adr-ufrs (accepted) · duplicate: none on the board (32 tasks; CNTR-X17 and
        CNTR-X20 are adjacent, not the same) · criteria writable: yes
UNFOLD: quick fix (one KV line plus three precision lines) → outcome 3
HUMAN: none
REPRO: grep -rn ufo_active <root>/.ai/context → adr-ufom:46 is the only live statement (the others are
       quotes in cx01, ad03 and ufrs). A throwaway probe over tests/ufo-schedule.test.mjs (42/42 pass)
       recorded every key written to the world store: next_ms ∈ {epoch, 0}, enabled ∈ {false, true}.
CAUSE: reduce v5 accepted L0-adr-ufrs ("§4 is amended") but never rewrote the L0-adr-ufom node: v4,
       line 46 unchanged, no link back to ufrs (grep ufrs → only cx01, ad03, ufrs). The code is (a):
       schedule.ts:11/:51-53/:62-67, event.ts:291/:318/:335/:349, index.ts:56.
PROOF: the probe above; node --test --test-name-pattern="marker|worldLoaded|due time at load"
       tests/ufo-schedule.test.mjs → 4/4 ok; git log --all -S"ufo_active" -- src tests scripts → empty.
RULED OUT: (1) "the code writes a third durable property": 3 setDynamicProperty sites in src/ufo, the
       world goes only through worldStore, and the probe saw 2 keys. (2) "the flag lives in memory, so
       §10 never applies": the load branch is schedule.ts:62-67, unit-tested, and checked on BDS by
       ufo-restart.ts:205-209 (aef4d54 at 00d38cf, again after 9f41015). (3) "C-23 was amended to
       three": v6 concept-constraint.md:30 carries it unchanged.
RADIUS: a one-line edit to adr-ufom §4. Readers of "adr-ufom` §4" (grep): sauc-ent1:26, sauc-ad01:18,
        xasm17:29/:37. They cite the entity sweep half, which stays. No code change.
GREEN/LIVE: no code fix; no KV write (forbidden by the task). No live BDS run: schedule.ts and event.ts
        are byte-identical since the BDS-proven 00d38cf (git diff --stat 00d38cf HEAD).
```

## Резолюция

Противоречие снято вариантом (a). Это подтверждает и KV (`L0-adr-ufrs` accepted, `ufoc-ad03` accepted,
`ufoc-cx01` `status:resolved`), и отгруженный код. Код пишет в мир два свойства. Маркер «событие
прервано» — зарезервированное значение `andrew:ufo_next_ms = 0`. При `worldLoad` оно переписывается в
now + 900 000. C-23 и `adr-ufom` §2 выполняются буквально. Живого расхождения в коде нет. Остался
один хвост в знании: обещанная правка `adr-ufom` §4 не внесена.

## Дубликаты и что заменить (только перечень, ничего не правлено)

Поиск: `grep -rn "ufo_active"`, `"adr-ufom\` §4"`, `"seed \`next_ms = 0\`"`, `"DynamicPropertyStore"` по корневому `.ai/context`.
Все пути относительно `.ai/context/analysis/nodes/`.

1. `adr-ufom__concept-architecture-decision.md:46` — **главное.** «Then `next_ms` is set to now + 15 min if
   an event had been running, recorded by a transient `andrew:ufo_active` flag.» → «Then `next_ms` is set to
   now + 15 min if it holds the in-flight marker `0` (`L0-adr-ufrs`).» В `relates_to` (строка 21) добавить `L0-adr-ufrs`.
2. `ufoc-ad03__concept-architecture-decision.md:25` — «`adr-ufom` §4 still names a "transient
   `andrew:ufo_active` flag"…» станет ложью после п. 1 → «`adr-ufom` §4 read a transient
   `andrew:ufo_active` flag, which could only work if it were durable; `L0-adr-ufrs` amends it.»
3. `adr-ufrs__concept-architecture-decision.md:30` — «`L0-adr-ufom` §4 says…» → «`L0-adr-ufom` §4 said…»:
   цитата контекста остаётся, меняется время.
4. `adr-ufrs__concept-architecture-decision.md:51` и `ufoc-ac03__concept-acceptance-criterion.md:28` — «seed
   `next_ms = 0`» расходится с проверкой: `src/selftest/ufo-restart.ts:167-175` маркер не подкладывает, а
   получает настоящим прилётом через `come` и проверяет `next_ms === 0` до остановки → «start an event with
   `come`; assert `next_ms = 0` before the restart».
5. `ufoc-ent1__concept-entity.md:34` — «Writes go through the `DynamicPropertyStore` already used by `strf`»
   неверно → «Writes go through `worldStore` (`src/ufo/env.ts:86`)». `DynamicPropertyStore` используется
   только в `src/main.ts:85` для structures.

Не трогать: `ufoc-cx01:6/16/22/28` — это само утверждение, оно `status:resolved`. `kv_contradictions(L0-adr-ufom)`
возвращает `[]`. Почему узел снова в очереди при `status:resolved`, не выяснено. Вероятный повод — устаревший
текст п. 1, который проверка находит.
