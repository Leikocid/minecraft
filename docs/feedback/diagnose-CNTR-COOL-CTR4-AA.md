ИСХОД: 3 — Подчистка знания

# /diagnose CNTR-COOL-CTR4-AA — CTR-4 · целевые версии расходятся между источниками

Замеры сняты 2026-09-29 на HEAD `32f4aca`. Все пути KV даны относительно `.ai/context/` (живой KV). Артефакты `ai-kit run-check` лежат в `.ai/verify/CNTR-COOL-CTR4-AA/`:

- `2.json` — все числа из утверждения, `npm run validate`, тест-страж;
- `2.red.json` — ожидаемо красный прогон, когда `targets.mjs` откатывают на 2.9.0;
- `3.json` — поиск дубликатов.

## Intake

**OBSERVED.** Узел `cool-ctr4` утверждает три вещи:

1. Сырые спеки называют `@minecraft/server` 2.9.0 и `min_engine_version` 1.26.0.
2. Код закреплён на 2.10.0 / [1,26,50] / BDS 1.26.51.1.
3. Узел надо «держать открытым, пока сырые спеки не аннотированы».

При этом узел уже закрыт: `closed_at: 2026-09-24`, `closed_reason: resolved_by_decision`, `closed_by_ref: decision-resolve-cool-ctr4` (frontmatter, строки 14–16). В строке 13 рядом с тегом `resolved` остался тег `"status:open"`.

**VERDICT.** Это не дефект кода. Утверждение распадается на две части:
- расхождение текстов (подтверждено, безвредно);
- гипотеза вреда без наблюдения («откатят назад на 2.9.0»).

Разобраны обе части.

## Investigation

**REPRO.** Каждое число перепроверено той же операцией, какой оно получено (`grep -n`, `git log`), артефакт `2.json`.

| Источник | Место | Значение |
|---|---|---|
| `minerspickaxetestspec.md` | :67 | `@minecraft/server 2.9.0`, `min_engine_version 1.26.0`; то же в `docs/Miners_Pickaxe_Test_Spec.docx` (`word/document.xml`) |
| `stage-0-infrastructure.md` | :22 | `2.9.0, при необходимости 2.10.0 — текущий stable на npm` |
| `stage-0-infrastructure.md` | :55 | engine и версия BDS зависят от версии игры на iPad |
| `scripts/targets.mjs` | :7 / :8 / :9 | `[1, 26, 50]` / `'2.10.0'` / `'1.26.51.1'` |
| `package.json` | :27 | `"@minecraft/server": "2.10.0"`; значений engine и BDS в файле **нет** |
| `package-lock.json` | :472 | `2.10.0` |
| `packs/{behavior,gametest,resource,selftest}/manifest.json` | :8 | `[1, 26, 50]`, 4 из 4 |
| манифесты behavior, gametest, selftest | :27 | `@minecraft/server` `2.10.0`, 3 из 3 |
| `docker/bds/compose.yaml` | :20 | `VERSION: "1.26.51.1"` |
| `README.md` | :8–10 | 1.26.51 / 2.10.0 / 1.26.51.1 |

Результаты проверок:
- `npm run validate` → `validate: ok`;
- `npm run build` → exit 0;
- `tsc --noEmit` → exit 0.

**CAUSE.** Расхождение текстов возникло так:
- Спека кирки писалась как зонд до того, как стала известна версия на iPad.
- 2026-09-20 оператор прочитал 1.26.51 с устройства. Решение `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` перенацелило проект на эту версию; `stage-0-infrastructure.md:55` прямо это предусматривает.

Задача на CTR-4 возникла повторно по другой причине. Решение `decision-resolve-cool-ctr4` закрыло узел, но в строке 13 остался тег `"status:open"`.

**PROOF.** Вызов `kv_contradictions(status=open)` возвращает 23 узла, `cool-ctr4` среди них нет: канонический фильтр KV считает узел закрытым. Тот же набор тегов (`status:open` вместе с `resolved` и `closed_at`) стоит ещё на четырёх закрытых узлах: `cool-ctr1`, `cool-ctr2`, `cool-ctr3`, `lgnd-cx01`.

**RULED OUT.**
- **Дрейф кода.** `validate` — ok, `tsc` — exit 0, таблица выше сходится целиком.
- **Откат на 2.9.0 когда-либо происходил:**
  - `git log -S2.9.0 -- scripts packs package.json package-lock.json docker src README.md` — 0 коммитов;
  - у `scripts/targets.mjs` 1 коммит (`005b205`, 2026-09-20), перенацеливаний не было;
  - `chronicle_search("2.9.0")` — 3 события, ни одно не про версии.
- **Тихий откат достижим.** Откат только манифеста ловит `validate.mjs`: тесты `tests/validate.test.mjs:35,44` на фикстурах `bad-min-engine` и `bad-server-version` зелёные. Откат самого `targets.mjs` на 2.9.0 / [1,26,0] (копия в scratchpad) даёт 10 красных тестов из 25 в `validate`/`gametest-pack`/`selftest-pack`, артефакт `2.red.json`.
- **stage-0 противоречит коду.** Строка :22 явно допускает 2.10.0, строка :55 отдаёт engine и BDS версии iPad. С кодом расходится только `minerspickaxetestspec.md:67`.

Неточности в самом утверждении:
- «`package.json`: … engine [1,26,50], BDS 1.26.51.1» — в `package.json` есть только пин API 2.10.0.
- «matches the pickaxe spec's rule to retarget from the actual game version» — правило спеки (:67) говорит «перенацелить по тексту ошибки». Фактически перенацеливание шло от версии, прочитанной с устройства: это решение 2026-09-20 и `stage-0:55`. Текста ошибки не было.

## Fix design

**RADIUS.** Код не меняется, правки только в знании: 6 строк живого KV, 5 строк тегов и 4 строки выхода rollout (см. список ниже). Как искал:
- `grep -rn 'CTR-4|cool-ctr4'`, `grep -rn '2\.9\.0|1\.26\.0'`, `grep 'bds-gametest.mjs … directly'` по живому `.ai/context` и по worktree;
- `kv_search` по той же формулировке.

Зависят от этих строк:
- читатели `kv_search`;
- очередь `refine-contradictions`: она выбрала закрытый узел, по всей видимости, по тегу `status:open`.

**CASES.** Страж `package.json:27 == SERVER_API_VERSION` и страж README ловят 0 существующих расхождений, поэтому код не пишется. Разрыв отмечен только в тексте правила (пункт 5 списка).

**BYPASS.** Не применимо: ограничение не вводится.

## Proof

**GREEN** (артефакт `2.json`):
- `node --test` для `validate`, `manifests`, `gametest-pack`, `selftest-pack` — 46 pass, 0 fail, 2 skip (до сборки нет `dist/`);
- `npm run build` — exit 0;
- `npm run validate` — ok.

**LIVE.** Код не менялся. Реальный путь сборки `build` → `validate` → `dist/andrew.mcaddon` на HEAD `32f4aca` зелёный. BDS в этом прогоне не запускался: не измерено. Пин BDS охраняет `assertComposePinsVersion()`: `bds-check.mjs:242`, `bds-up.mjs:62`, `bds-gametest.mjs:481`.

## Резолюция для refine resolve

> CTR-4 закрыт по существу ещё 2026-09-24 (`decision-resolve-cool-ctr4`); остаток — подчистка знания. Замеры на HEAD 32f4aca (2026-09-29): `minerspickaxetestspec.md:67` — 2.9.0 / 1.26.0; `stage-0-infrastructure.md:22` — 2.9.0 «при необходимости 2.10.0», `:55` — engine и BDS от версии iPad; `scripts/targets.mjs:7-9` — [1,26,50] / 2.10.0 / 1.26.51.1; `package.json:27` и `package-lock.json:472` — 2.10.0; `packs/*/manifest.json:8` — [1,26,50] (4 из 4), `:27` — 2.10.0 (3 из 3); `docker/bds/compose.yaml:20` — 1.26.51.1. `npm run validate` — ok, `tsc --noEmit` — exit 0. `git log -S2.9.0` по коду — 0 коммитов; `targets.mjs` — 1 коммит (005b205, 2026-09-20). Откат `targets.mjs` на 2.9.0/[1,26,0] даёт 10 красных тестов из 25, тихий откат недостижим. Аннотировать сырые спеки не нужно: переопределение хранится в `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001`, и `kv_search` выдаёт его в секции Decisions выше raw-фрагмента.

## Копии для подчистки — «файл:строка — что заменить на что»

1. `analysis/nodes/cool-ctr4__concept-contradiction.md:13` — удалить тег `"status:open"` (узел закрыт, строки 14–16).
2. `analysis/nodes/cool-ctr4__concept-contradiction.md:25`:
   - было: «Keep it open until the raw specs are annotated, so later readers don't retarget back to 2.9.0.»
   - стало: «Closed by `decision-resolve-cool-ctr4`; a retarget back to 2.9.0 turns `validate`/`gametest-pack`/`selftest-pack` tests red.»
3. `analysis/nodes/infr__concept-component.md:50` — строку «CTR-4 (open, target `L0-infr`) — version-target wording drift in old raw specs; unchanged, not re-filed.» убрать из «Known open issues». Если нужна ссылка, то: «CTR-4 — closed 2026-09-24 by `decision-resolve-cool-ctr4`.»
4. `analysis/nodes/pick__concept-component.md:36`:
   - было: «CTR-4 targets `L0-infr` and stays open only so nobody retargets back to 2.9.0 from the stale raw doc; no new filing needed from this component.»
   - стало: «CTR-4 is closed by `decision-resolve-cool-ctr4`; the pin is enforced by `scripts/validate.mjs` against `scripts/targets.mjs`.»
   - Заголовок «Known open issue inherited…» → «Resolved issue inherited…».
5. `analysis/nodes/infr-r001__concept-rule.md:20`, три замены:
   - «`validate.mjs` and `bds-gametest.mjs` both import from `targets.mjs` directly» → «`validate.mjs`, `bds-lib.mjs` (BDS_VERSION), `lib/mcstructure.mjs` (MIN_ENGINE_VERSION) and tests `gametest-pack`/`selftest-pack` import from `targets.mjs`; `bds-gametest.mjs` reaches them through `bds-lib.mjs`». В `scripts/bds-gametest.mjs` импорта `targets.mjs` нет.
   - «(run at the top of both `bds:check` and `bds:up`)» → «(run at the top of `bds:check`, `bds:up` and `bds:gametest`)».
   - «nothing else may hardcode these as literals» → «literal copies that exist: `package.json:27` (npm types, unguarded), `README.md:8-10` (unguarded), `docker/bds/compose.yaml:20` (guarded), `tests/validate.test.mjs:35,41,44,54` (test expectations)».
6. `analysis/nodes/infr-r001__concept-rule.md:22`:
   - было: «update the one matching constant in `targets.mjs`, then `npm ci && npm run build`»
   - стало: «update the matching constant in `targets.mjs`; for `SERVER_API_VERSION` also `npm install @minecraft/server@<x> --save-exact` (`package.json:27` + lock: `npm ci` alone keeps compiling against the old types), the manifests (`validate` forces them), `README.md:8-10` and `tests/validate.test.mjs:35,41,44,54`; then `npm run build`».
7. `analysis/nodes/infr-d003__concept-architecture-decision.md:22` — «imported by `validate.mjs` and `bds-gametest.mjs` directly» → «imported by `validate.mjs`, `bds-lib.mjs` and `lib/mcstructure.mjs` (`bds-gametest.mjs` reaches them through the last two)».
8. По желанию: `analysis/nodes/cool-adr1__concept-architecture-decision.md:21` — «(see CTR-4)» → «(see `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001`)». Текст верен, но ссылается на закрытое противоречие, а не на решение.

Та же болезнь тегов в соседних узлах. Это кластеры соседей, здесь только перечислены:

9. `analysis/nodes/cool-ctr1__concept-contradiction.md:13`, `cool-ctr2__…:13`, `cool-ctr3__…:13`, `lgnd-cx01__…:13` — удалить `"status:open"`: все закрыты 2026-09-24, у каждого есть `closed_by_ref`.

Копии только в git-снимке `32f4aca` (выход rollout). В живом KV их уже нет, руками не правятся, уйдут со следующим коммитом KV:

10. `analysis/summary.md:36` и `analysis/nodes/concept-overview.md:30` — «Nothing new. CTR-4 is carried.»
11. `analysis/project-knowledge/architecture.md:135` и `analysis/project-knowledge/domain-model.md:730` — «CTR-4 (open, target `L0-infr`) …».

Не трогать, текст верен:
- `analysis/decisions.md:57` и `decisions/decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001.md:10,16` — решение само называет 2.9.0 / 1.26.0 устаревшими.
- Сырые импорты `minerspickaxetestspec.md:67` (из `docs/Miners_Pickaxe_Test_Spec.docx`) и `stage-0-infrastructure.md:22` — документы клиента; правка перетрётся при повторном импорте.

## Что не сделано

- Карточек не заведено, в KV ничего не записано (`task_create`, `refine resolve` и `doc_write` не вызывались).
- Код не менялся.
- Остатка, который ждёт решения человека, нет.
