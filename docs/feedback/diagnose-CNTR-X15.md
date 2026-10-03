ИСХОД: 3 — Подчистка знания

# Разбор L0-xcx15 (CX-L0-15): шов перехвата заряда Орбитальной пушки

Проверено на HEAD `ae1c2d0` (ветка `task/CNTR-X15-AA`), 2026-10-03.

Итог. Утверждение было верным для кода `a1ac63f` (ORBC-FLIGHT-01-AA, 2026-09-30). Устарело оно
в `27a2f01` (SAUC-SHOOT-01-AA, 2026-10-03 08:10): этот коммит добавил аддитивный шов по
`L0-adr-ufoi`. После него `src/orbital/flight.ts` не менялся. Шов останавливает заряд до любого
исхода, подключён в продукте, и сценарий GameTest это доказывает. В KV остались узел в статусе
open, ADR в статусе proposed и семь копий описания «до шва».

## Перепроверка утверждения, по частям

| # | Часть утверждения | Как проверено | Результат |
|---|---|---|---|
| a | «Исходы: detonate, Void, loss, timeout» | `git show a1ac63f:src/orbital/flight.ts \| grep -c intercept` → 0; `grep -n "^export type Outcome" src/orbital/flight.ts` | было верно в `a1ac63f:…:37`. На HEAD `flight.ts:40`: `"detonated" \| "voided" \| "lost" \| "timeout" \| "intercepted"` |
| b | «Единственный внешний хук — `observeChargeEnds`, после конца» | `grep -n registerInterceptor src/orbital/flight.ts` | неверно на HEAD: `flight.ts:117` `export function registerInterceptor(interceptor): () => void`; тип `Interceptor` на `:58` — `(attack, charge, from, to, tick) => boolean`, ровно сигнатура ADR §1 |
| c | «Остановить заряд в воздухе нечем; при детонации эффект всё равно отрабатывает» | чтение `flight.ts:226-244` | неверно на HEAD. `intercepted()` вызывается до `teleport` (`:230`), до `detonate` (`:237`, участок до верха блока контакта) и до `"voided"` (`:242`). При `true` возвращается `{outcome:"intercepted"}`, `detonate()` не вызывается, `finish()` (`:166-175`) удаляет сущность и уведомляет `observeChargeEnds` |
| d | «Тарелка без коллизии, sweep её не видит» | `src/ufo/saucer.ts:236-250`, `src/ufo/shootdown.ts:12-13,35` | верно и не мешает: попадание считает `hullHit` — отрезок против цилиндра `HULL_RADIUS = 6`, `HULL_HEIGHT = 3` |
| e | «Пока шов не смержен, UFO AC-15 непроверяем» | `git merge-base --is-ancestor 27a2f01 HEAD` → да; карточка SAUC-SHOOT-01-AA в статусе done, 5/5 критериев | снято. Проводка в продукт: `src/main.ts:22,47` → `src/ufo/index.ts:76,86` → `src/ufo/saucer.ts:313` |
| f | «v1.4.4» как метка кода | `git log -S'"version": "1.4.4"' -- package.json` → `1065233` (2026-10-02), предок `27a2f01` | метка не различает состояния: `package.json` равен `1.4.4` и до шва, и после. Утверждение верно только для `a1ac63f..27a2f01^` |

## Измерения на HEAD (свой прогон)

Артефакт `.ai/verify/CNTR-X15-AA/2.json`: code_sha `ae1c2d0`, exit 0. Одна команда, четыре шага:
1. `a1ac63f` — 0 строк `intercept`.
2. grep строк шва на HEAD (`:40`, `:117`, `:230`, `:237`, `:242`).
3. `node --test --test-name-pattern="^seam" tests/ufo-hull.test.mjs` — 6/6 зелёных (none / each step / contact stretch / throws / void / salvo).
4. `ANDREW_BDS_DIR=bds-cx15 node scripts/bds-gametest.mjs --only andrew:ufo_shootdown_seam` — свой экземпляр BDS 1.26.51.1, порты 19300 / 19310-19319 / 7710, после прогона снят. Результат: `onTestPassed: andrew:ufo_shootdown_seam`.

Строки RESULT из лога BDS:
- `stub: gt-39-1 ended intercepted, 0 block(s) changed in its column`. Тест также проверяет: перехват на отрезке через плоскость y+30; `attack.ownerId` и `ownerName` у стрелка; 0 вызовов `onDetonate`.
- `control: gt-100-2 ended detonated …, 100 block(s) changed`. Тот же выстрел без перехватчика: отрицательный контроль.
- `throw: gt-191-3 ended detonated …, 100 block(s) changed`. В логе одна строка `an interceptor threw … its charges fly on`.
- `no saucer` / `saucer far away` / `after the stop`: все три detonated. Число перехватчиков без тарелки, с тарелкой и после stop — 0, 1 и 0 (утверждения теста).

Ранее, на `27a2f01`: `.ai/verify/SAUC-SHOOT-01-AA/2.json` и `3.json`, полный набор 219/219, exit 0. В него входят `orbital_*`, `pntr_*`, `ring_*` и пять `ufo_shootdown_*`. С тех пор `src/orbital/` и `src/ufo/` не менялись (`git log 27a2f01..HEAD -- src/orbital/ src/ufo/` → пусто).

## Блоки /diagnose

- OBSERVED: L0-xcx15 (KV v4) утверждает, что заряд нельзя остановить в полёте. На HEAD `flight.ts:40,117,230,237,242` шов есть; в `a1ac63f` его нет.
- VERDICT: сейчас расхождения нет, оно устранено в `27a2f01`. Устарело знание, это не дефект кода.
- CHECKS: contradiction none · duplicate none на доске · criteria writable yes. UNFOLD: подчистка знания. HUMAN: none.
- REPRO: заявленный дефект на HEAD не воспроизводится (BDS: stub → intercepted, 0 блоков; control → detonated, 100 блоков).
- CAUSE: узел записан по состоянию `a1ac63f`; после `27a2f01` его не обновили (analysis_version 4, `status: open`, summary v6 «carried, not touched»).
- PROOF: `.ai/verify/CNTR-X15-AA/2.json` (ae1c2d0, exit 0).
- RULED OUT: (1) «шов есть, но в продукт не подключён» — опровергнуто проводкой `main.ts:47` → `saucer.ts:313` и interceptorCount 0/1/0 на BDS. (2) «перехват есть, но эффект всё равно срабатывает» — опровергнуто: у stub 0 вызовов `onDetonate` и 0 блоков, у control 100 блоков.
- RADIUS: код не меняется. Копии найдены grep'ом по `xcx15`, `adr-ufoi`, `observeChargeEnds`, `detonated | voided`, `orbc-r014`, `status:proposed` в `.ai/context/analysis/`.
- GREEN/LIVE: исправления нет. Живой прогон на BDS прошёл по `flight.ts:230`.

Не дефекты, просто для точности:
- ADR §2 говорит «before the block-contact sweep». Код сначала читает клетки (`fallStep`, `:228`) и только потом спрашивает перехватчик, но до любого действия. Для UFO §8 итог тот же.
- Шаг «следующая клетка не загружена» (`charge.ts:212` → `flight.ts:243`, `lost`) перехватчику не предлагается. Заряд и так снимается без эффекта. Воспроизвести такой случай с тарелкой я не пытался — не измерено.

## Резолюция (текст для узла)

L0-xcx15 закрыт кодом. В `27a2f01` (SAUC-SHOOT-01-AA) появились `registerInterceptor` и исход `"intercepted"` (`src/orbital/flight.ts:40,58,117,208-242`). Заряд снимается до перемещения, детонации и Void, без эффекта. Это доказывают `ufo_shootdown_seam` на BDS (HEAD `ae1c2d0`, `.ai/verify/CNTR-X15-AA/2.json`) и полный набор 219/219 на `27a2f01`. `L0-adr-ufoi` реализован.

## Копии для подчистки (пути от `.ai/context/analysis/`)

1. `nodes/xcx15__concept-contradiction.md:14` `"status:open"` → `"status:resolved"`; `:23` `status: open` → `status: resolved`, `closed_reason: resolved_by_code` (27a2f01); `:29-37` настоящее время «Shipped … Nothing can stop a charge» → «до 27a2f01 (a1ac63f)».
2. `nodes/adr-ufoi__concept-architecture-decision.md:14` `"status:proposed"` → `"status:accepted"`; `:24` `status: proposed` → `status: accepted` (реализовано в 27a2f01); `:35` «before the block-contact sweep» → «after the step's cell read, before the move, the detonation or the Void end».
3. `nodes/sauc__concept-component.md:57` «Today `Outcome` is `detonated | voided | lost | timeout`; the change adds `"intercepted"`» → «`Outcome` includes `"intercepted"` (`src/orbital/flight.ts:40`)»; `:47` «(the seam added by this task)» → «(`src/orbital/flight.ts:117`)».
4. `nodes/sauc-as03__concept-assumption.md:19` «The shipped `Attack` (`src/orbital/flight.ts:24-34`) carries `ownerId` only» → «`Attack` (`src/orbital/flight.ts:26-38`) carries `ownerId` and the optional `ownerName` (`:37`), filled at `src/orbital/activation.ts:79`».
5. `nodes/orbc-ent3__concept-entity.md:43` «one of: detonated | voided | lost | timed-out» → «… | timed-out | intercepted».
6. `nodes/orbc-r014__concept-rule.md:36` «never called for a voided or lost charge, or an orphan» → «… for a voided, lost or intercepted charge, or an orphan».
7. `nodes/orbc-p002__concept-process.md:26-35` (шаги 1-7): шага перехватчика нет → между sweep (3) и contact/void/move (4, 5, 7) добавить «each registered interceptor sees the step's segment; `true` ends the charge `intercepted`, no effect (`L0-adr-ufoi`)».
8. `nodes/sauc-p003__concept-process.md:19-25` шов описан как будущее изменение («owned by this task») и без шага Void → «shipped in 27a2f01»; добавить «a Void step offers the stretch down to `minY` (`flight.ts:242`)».
9. `summary.md:110` и `nodes/concept-overview.md:104` «Carried, not touched in v6: `xcx15`, …» → убрать `xcx15`.

Ничего из этого здесь не правилось: ни карточек, ни записей в KV.
