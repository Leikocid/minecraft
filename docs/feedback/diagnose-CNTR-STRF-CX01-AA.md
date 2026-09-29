ИСХОД: 3 — Подчистка знания

# CNTR-STRF-CX01-AA · L0-strf-cx01: разбор

Узел: `L0-strf-cx01` (analysis v2, `status:open`). Код: `32f4aca`. Проверки:
`diagnose-CNTR-STRF-CX01-AA.two-packs.mjs` (модель двух паков на настоящем `src/structures`) и
`diagnose-CNTR-STRF-CX01-AA.live.sh` (BDS 1.26.51.1, частный инстанс). Артефакт run-check:
`.ai/verify/CNTR-STRF-CX01-AA/2.json`.

Предсказанный вред воспроизводится, но только если убрать барьер. В коде как он построен вред
недостижим. Механизм `startStrf`/`strf_owner`/`strf_claim`, описанный в KV, не построен ни разу.
Задачу закрыл другой механизм, а KV его не описывает.

## Перепроверка чисел утверждения

| Утверждение | Операция | Результат |
|---|---|---|
| BDS 1.26.51.1 | `grep BDS_VERSION scripts/targets.mjs` | `:9 BDS_VERSION = '1.26.51.1'` ✓ |
| commit `1bbcea5`, эпик Web Sword | `git show 1bbcea5` | 2026-09-22 02:24 +0200, `feat(WS-ONCE-01-AA)`. В теле: «Measured on BDS 1.26.51.1, world.getAllPlayers() … right count with zero readable entries» ✓ |
| gametest-пак вооружает прод-модули | `grep -n` | `src/gametest/main.ts:108` registerCraftGate, `:114` registerRetention, `:118` registerRecovery ✓ |
| DP одного пака невидимы другому | код, не перемерено | `src/main.ts:113`, `src/selftest/spawn-windmill.ts:6`: состояние релизного пака доходит до selftest только через `scriptevent`. В этом прогоне не перемерялось |
| C-7 | `nodes/concept-constraint.md:27` (v2) | «No duplication … Structures: re-load never creates a second set … \| structures §6/§11» ✓ |
| §6 / §11 | текст из `docs/Four_Structures_Spec_RU_EN_copy.docx` | стр. 229–230 §6: «устойчивый признак инициализации, чтобы повторная загрузка не создавала второй набор»; стр. 295 §11 DoD ✓ |
| `L0-strf-r008` | `doc_get` | п.2 «never produce a second set» ✓; п.6 ссылается на cx01 |
| release discovery читает `getAllPlayers()`, SimulatedPlayer нечитаем | `grep -n` | `src/main.ts:69-71` пропускает `isValid !== true` ✓ |
| `startStrf` / `andrew:strf_owner` / `strf_claim` / `strf: owner=` / `queueFromPositions` / `crashAfter` / `testHooks` | `git grep` по `src scripts tests` | **0 совпадений.** Встречаются только в `.ai/context` |

## Блоки /diagnose

```text
OBSERVED: ни прогона, ни лога, ни мира с двойной генерацией нет. cx01 — прогноз анализа v2,
          написанный до кода: discovery в src/main.ts появился в 9c85d78 (2026-09-26).
          Утверждение A — измеренный факт (1bbcea5).
VERDICT:  hypothesis (вред) + fact (A). По умолчанию → расследовать достижимость.
CHECKS:   contradiction: L0-adr-own (accepted) предписывает startStrf/strf_claim, их нет в коде ·
          duplicate: adr-own:35 «Closes: L0-strf-cx01», а cx01:13 всё ещё status:open ·
          criteria writable: yes
UNFOLD:   nothing для кода; правки знания — в этот отчёт (issue_triage не вызван: запрет писать)
HUMAN:    none
```

```text
REPRO: two-packs.mjs — два StrfRuntime над настоящим src/structures: свой store на пак, общий
       мир блоков, chance=1 для всех типов, R_DISCOVER=4 (81 чанк).
       CONTROL (world set релиза = all, читаемый игрок): chunksWithTwoRegistries=81/81,
       release 243 записи + gametest 243 записи. Предсказание cx01 воспроизводится, если барьера нет.
CAUSE: чтобы вред случился, релизный runtime должен катать броски в gametest-мире. Как построено,
       этого нет — три независимых барьера:
       (1) EnabledTypes без сохранённого набора = [] (src/structures/config.ts:71,77;
           src/main.ts:82); gametest-мир удаляется перед каждым прогоном
           (scripts/bds-gametest.mjs:500); runtime.discover() выходит до бросков
           (src/structures/runtime.ts:132);
       (2) src/main.ts:69-71: SimulatedPlayer нечитаемы → 0 позиций;
       (3) у gametest-пака нет мирового цикла discovery: 9 мест new StrfRuntime/Discovery, все
           внутри тестов над MemoryStore/ScopedStore; 2 вызова .discover() с одной синтетической
           позицией (structures.ts:75, windmill-spawn.ts:209); 1 runInterval — самоочищающийся
           опрос теста (structures.ts:117). На worldLoad пак шлёт только
           `scriptevent andrew:spawn skip` (src/gametest/main.ts:93-95).
PROOF: та же модель, как построено: release records=0, blocks=0, shared chunks=0 — в трёх
       сценариях (свежий мир + читаемый игрок; свежий мир + только SimulatedPlayer;
       enabled=all + только SimulatedPlayer). Unit: tests/structures-subset.test.mjs AC1
       (chance=1, ни одного броска), structures-registry AC5 (хук вырезан из релиза) — 61/61 pass.
RULED OUT: «барьер (1) появился позже, между ними двойная генерация была». Discovery введён в
       9c85d78 (2026-09-26), гейт — в 7c332ef (2026-09-27). В этом окне держал барьер (2):
       релизный пак не читает SimulatedPlayer — позиций нет, бросать не из чего.
       Модель, сценарий «enabled=all, SimulatedPlayers only»: release records=0.
```

```text
RADIUS: кода не меняю. Правка знания задевает узлы из списка ниже. Как смотрел: git grep по
        src/scripts/tests на символы предложенного механизма (0); grep -n (только чтение) по живому
        .ai/context на strf-cx01|adr-own|strf_owner|strf_claim|startStrf|"strf: owner"|
        queueFromPositions|"Only one pack"; kv_list L0-strf-cx*/L0-strf-d00*/L0-adr-own/L0-infr-p00*.
        Родственный случай, не вред: selftest-пак в мире bds:check включает windmill релизу
        (src/selftest/spawn-windmill.ts:71) и держит свои runtime над ScopedStore в spawn+2000
        (windmill-restart.ts:100) — за радиусом spawn-поиска 500. Записи
        src/selftest/main.ts:226 только в реестре (runStep с пустыми колбэками), блоков нет.
        Кейс Scythe из adr-own (охранник рядом с тестовой коровой): в gametest-мире релиз
        ничего не включает, структурные тесты строят в farChunk/своих ticking area.
GREEN: фикса кода нет; «зелёное» = as-built проверки: unit 61/61, модель OK (контроль красный,
       as-built пусто), live ниже. Не ложнозелёное: контроль той же модели даёт 81 общий чанк;
       live-тест реально катал discovery (chunks=625/625) и спланировал запись.
LIVE:  scripts/bds-gametest.mjs --only andrew:strf_discovery_tick_budget на частном
       andrew-bds-cx01 (оба пака в одном мире gametest), затем docker restart того же мира:
       19:43:49 [andrew] strf registry: shards=0 records=0 evaluated=0 … store-bytes=0
       19:43:49 [andrew] structures enabled: none (nothing generates until /andrew:structure enable)
       19:43:50 [andrew] strf-test-hook armed: salt=world outcomes=3   ← gametest-пак
       19:43:50 [gametest] strf discovery budget: chunks=625/625 … records=windmill:o:0:0
       onTestPassed: andrew:strf_discovery_tick_budget
       19:44:22 (после рестарта) [andrew] strf registry: shards=0 records=0 evaluated=0 … store-bytes=0
       Реестр релиза пуст до теста и после рестарта, хотя в том же мире gametest-пак спланировал
       запись. Решает один реестр.
```

## Резолюция для `refine resolve L0-strf-cx01`

> Resolved as built; the proposed `startStrf`/`andrew:strf_owner` handshake was never implemented
> (0 matches in `src/`, `scripts/`, `tests/` at `32f4aca`) and is not needed. In the gametest world
> the release pack keeps its `strf` runtime but cannot generate: (1) `EnabledTypes` has no stored set
> on a fresh world, and the world is deleted before every `bds:gametest` run
> (`scripts/bds-gametest.mjs:500`); `runtime.discover` returns before rolling
> (`src/structures/runtime.ts:132`); the harness asserts `[andrew] structures enabled: none` and the
> spawn search standing down on every run (`scripts/bds-gametest.mjs:449-455`); (2) SimulatedPlayers
> are unreadable to the release pack (`src/main.ts:69-71`, measured in `1bbcea5`), so it has no
> positions; (3) the gametest pack runs no world-wide discovery: every `strf` use is a per-test
> `StrfRuntime` over `MemoryStore`/`ScopedStore` at a test-chosen site. Test hooks are compiled out of
> the release bundle by `--drop-labels=STRF_TEST_HOOK` (`scripts/build.mjs:75`; `structures-registry`
> AC5). Measured 2026-09-29 on BDS 1.26.51.1: with both packs in one world, the gametest pack's
> discovery evaluated 625 chunks and planned `windmill:o:0:0`; the release registry read
> `shards=0 records=0 evaluated=0 store-bytes=0` before the test and after a restart of the same world.
> Model control: removing barrier (1) with a readable player gives 81/81 chunks in two registries.

## Копии знания — что заменить на что

Строки проверены в живом `.ai/context` (только чтение) и совпадают с деревом на `32f4aca`.

1. `nodes/strf-cx01__concept-contradiction.md:13` — `"status:open"` → `"status:resolved"`, добавить `"resolved_by:L0-adr-own"`.
2. `nodes/strf-cx01__concept-contradiction.md:24` — абзац **Proposed resolution** (`startStrf({ owner })`, `scriptevent andrew:strf_owner`) → «As built: see resolution — release gated by `EnabledTypes`, test packs use per-test runtimes; no handshake».
3. `nodes/strf-cx01__concept-contradiction.md:26` — **Needs** (подтверждение handshake для `infr`) → удалить: harness проверяет `structures enabled: none` (`bds-gametest.mjs:449-455`).
4. `nodes/strf-d003__concept-architecture-decision.md:13` — `"status:proposed"` → `"status:superseded"` (by as-built, `L0-adr-own` as amended).
5. `nodes/strf-d003__concept-architecture-decision.md:21-23` — `startStrf({ owner, testHooks? })`, 1-tick handshake `andrew:strf_claim`, хуки `forceRoll`/`setSalt`/`crashAfter`/`queueFromPositions` → «`StrfRuntime(store, engine, {enabled})`; the release passes the world's `EnabledTypes`; tests build their own runtime over `MemoryStore`/`ScopedStore` and drive `Discovery.evaluateChunk`/`discover`/`enqueue` plus `installTestHook({salt, outcomes})`».
6. `nodes/strf-d003__concept-architecture-decision.md:28` — «`infr` adds the handshake… size check asserts `testHooks` absent» → «the release bundle drops the `STRF_TEST_HOOK` label (`scripts/build.mjs:75`); `tests/structures-registry.test.mjs` AC5 asserts it».
7. `nodes/adr-own__concept-architecture-decision.md:22` — «`strf-d003` proposes `startStrf…` and a `scriptevent andrew:strf_claim` handshake» → «resolved without a handshake (see items 1–3 as amended)».
8. `nodes/adr-own__concept-architecture-decision.md:26` — «The gametest pack claims ownership, and the release pack yields» → «The release pack keeps its runtime and generates nothing in a world with no stored enabled set; the gametest world is recreated each run».
9. `nodes/adr-own__concept-architecture-decision.md:29` — «exactly one `strf: owner=` log line» → «`[andrew] structures enabled: none` and a spawn-search stand-down line (`bds-gametest.mjs:449-455`)».
10. `nodes/adr-own__concept-architecture-decision.md:30` — «The restart lane checks the owner again after the restart» → «The restart lanes run in `bds:check` (selftest `windmill-restart`/`bastion-restart` over `ScopedStore`), not in the gametest world».
11. `nodes/adr-own__concept-architecture-decision.md:31` — `startStrf({owner:"gametest", discovery:false})` / `evaluateChunk` / `queueFromPositions` → «the gametest pack has no world-wide discovery loop; tests call `Discovery.evaluateChunk`/`discover` on their own runtime at a test-chosen site».
12. `nodes/adr-own__concept-architecture-decision.md:32` — **Backup** (отдельный профиль мира) → «not needed: no handshake, nothing can race».
13. `nodes/strf-r008__concept-rule.md:25` — «Across packs, see `L0-strf-cx01`» → «Across packs: stores are per pack; only the release pack's store is the world registry, test packs use private runtimes (`L0-adr-own`)».
14. `nodes/strf__concept-component.md:56` — «A second pack running `strf` has its own registry and would double-generate structures (`L0-strf-cx01`)» → «…would; so no test pack runs world-wide discovery, and the release pack enables nothing in a fresh world (`L0-adr-own`)».
15. `nodes/xasm5__concept-assumption.md:31` — «**Only one pack** writes `andrew:st:*` in any world» — **неверно буквально**: gametest-пак (`src/gametest/strf-registry.ts:23`, без префикса) и selftest-пак (`src/selftest/main.ts:226,279`) пишут `andrew:st:*` в своё per-pack хранилище → «Only the release pack's store is the world's structure registry; test packs write `andrew:st:*` only into their own per-pack store, for runtimes they drive at chosen sites».
16. `nodes/strf-p001__concept-process.md:23` — ссылка «see the SimulatedPlayer note in `L0-strf-cx01`» остаётся верной (утверждение A подтверждено) — **без изменений**.

Роллапы в git-дереве `32f4aca` (`analysis/summary.md:57,61,84`, `contradictions.md:86-98`,
`risks.md:89-101`, `assumptions.md:544`, `project-knowledge/business-rules.md:557`,
`nodes/concept-overview.md:51,55,78`) несут те же тексты. В живом KV (v3 rollout) их уже нет;
руками не правятся, догонят узлы на следующей раскатке.

Попутно, вне этого узла: номер C-7 занят дважды. `analysis/constraints.md:29` (v1): «`npm run build`
from a clean clone [C-7]», а L0 v2/v3 C-7 — «no duplication». Читатель по номеру попадёт не туда.

## Что не закрыто

Ничего по существу. Одна часть утверждения A — «DP одного пака невидимы другому» — в этом прогоне
не перемерялась. Её держит устройство selftest (состояние через `scriptevent`), а вывод от неё не
зависит: реестр релиза пуст независимо от того, видит ли он чужие ключи.
