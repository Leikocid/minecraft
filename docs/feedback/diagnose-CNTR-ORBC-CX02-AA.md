ИСХОД: 4 — Подготовлено, ждёт решения

# Разбор orbc-cx02: на сенсоре цель по взгляду — не подсвеченный блок

Проверено на HEAD `32f4aca` (ветка `task/CNTR-ORBC-CX02-AA`), 2026-09-29 21:36. Типы —
`@minecraft/server` 2.10.0 из `npm install` в этом worktree.

Итог.
- **Проектная половина утверждения верна дословно** — спека §6 и `L0-adr-orbc` §2 процитированы точно.
- **Движковая половина не наблюдалась нигде**: ни в репо, ни в хронике, ни в KV; сам узел это
  признаёт. Речь о трёх вещах: тап сообщает блок под пальцем; взгляд смотрит в центр экрана; за
  пределами reach тапа нет. Проверить их может только человек с iPad. Мой прибор — SimulatedPlayer
  на BDS — болен той же болезнью: `useItemInSlotOnBlock` получает блок аргументом, так что
  расхождение он покажет по построению, а не потому, что так делает сенсорный клиент.
- **Кода Орбитальной пушки нет**, вред для неё сейчас недостижим. Но то же свойство уже отгружено:
  Паутинный меч целит только по лучу взгляда и выбрасывает блок события. Поэтому прибор для
  наблюдения на iPad уже стоит на LAN-сервере — протокол ниже, ~10 минут.
- **Спека сама двусмысленна.** §6 есть только по-русски и говорит «навести **прицел** на блок».
  Прочтение «прицел = центр экрана» оправдывает §2, прочтение «цель = то, что подсвечено» — `ad01`.
  Обе стороны защитимы. Выбор — за человеком.
- **Узел не закрывается.** Его остаток совпадает с пунктом 1 «What closes it» у `L0-xcx14`
  (`CNTR-XCX14-AA`, backlog). Закрывать оба вместе, по одному наблюдению.

Нашлось четыре вещи, которых в утверждении нет:
1. `itemUseOn` в стабильном 2.10.0 не существует. KV ссылается на него в 8 узлах (9 строк;
   вместе с роллапами — 18 строк, список ниже).
2. `ad01` вместе с `r006` и шагом 3 `p001` («первое событие в тике побеждает, дедуп до выбора цели»)
   зависит от порядка событий. Если `itemUse` приходит раньше `playerInteractWithBlock`, `ad01`
   вырождается в §2 и снова целит в центр. Порядок нигде не записан.
3. `ad01` молчит о случае, когда блок события не проходит `isTargetable`: трава, цветок, факел, слой
   снега (`r003`). Откат на луч взгляда на сенсоре снова целит в центр экрана.
4. Стабильный 2.10.0 умеет отличать сенсор: `player.inputInfo.lastInputModeUsed` (`InputMode.Touch`)
   и `touchOnlyAffectsHotbar`. В KV это не упомянуто, а набор допустимых ответов расширяется.

## Перепроверка утверждения, по частям

| # | Часть утверждения | Как проверено | Результат |
|---|---|---|---|
| a | §6: блок не дальше 10 | `grep -n "не дальше 10"` по `orbitalcannonspecv1ruen-part-*.md` | верно: part-1:103 / part-2:23 |
| b | §6: единственный маркер — ванильная подсветка | `grep -n "ванильное выделение"` | верно: part-1:109 / part-2:29 |
| c | §6: «Mobile uses the closest stable equivalent» | `grep -n "ближайшее стабильное соответствие"` | верно по тексту (part-1:95 / part-2:15), но фраза про **действия** ЛКМ/ПКМ, не про прицел и не про маркер. §6 только на RU: «навести прицел»; EN-версии нет (`grep -nE "10 blocks\|highlight\|aim\|touch"` → только тест 3, part-3:85) |
| d | `adr-orbc` §2: одна `getBlockFromViewDirection({maxDistance: 10})`, блок события не используется | `nodes/adr-orbc__…:24` | верно дословно |
| e | `itemUseOn`, `playerInteractWithBlock`, `entityHitBlock` сообщают блок | `grep -c itemUseOn node_modules/@minecraft/server/index.d.ts` → **0**. afterEvents: `entityHitBlock` :22982, `itemStartUseOn` :23124, `itemUse` :23151, `playerInteractWithBlock` :23244 | `itemUseOn` нет. Блок несут `PlayerInteractWithBlockAfterEvent.block` (+`blockFace`, `faceLocation`, `isFirstEvent`) и `EntityHitBlockAfterEvent.hitBlock`. `ItemUseAfterEvent` блока не несёт |
| f | на сенсоре по умолчанию блок события — под пальцем | chronicle_search ×3 (touch/tap/crosshair/split/highlight; web sword aim iPad; probe itemUse) → 0 наблюдений. `grep -rniE "touch\|tap\|crosshair\|split\|сенсор\|тач\|палец"` по docs/, src/, README → 0 записей. DEMO-S2-AA AC#5 закрыт «без прогона на iPad» (2026-09-24) | **не наблюдалось**; нужен iPad |
| g | `getViewDirection` смотрит в центр экрана | index.d.ts:9552 «Returns the current view direction of the entity» — о сенсоре ни слова | **не наблюдалось**; нужен iPad |
| h | за пределами reach тапа нет → ПКМ 6–10 недостижим на сенсоре | не наблюдалось. Конкурент: дальний тап даёт `itemUse` без блока, и откат `ad01` стреляет в блок под центром экрана | обе версии живы; их разделяет шаг 3 протокола |
| i | reach «about 5–6 blocks» (xq5:20, xcx14:27) | `grep -rniE reach docs/dev docs/structures README.md` → 0. Единственная константа в коде, `BLOCK_REACH = 5` (trap.ts:34), взята из Web Sword §5, это не замер | **число не измерено** |
| j | реализация по §2 выстрелит мимо подсветки | `ls src/orbital` → No such file or directory; `grep -rni orbital src \| wc -l` → 0; `grep -rl orbital packs \| wc -l` → 0 | кода нет; для Пушки вред сейчас недостижим |
| k | (не в утверждении) то же свойство в отгруженном коде | `src/websword/trap.ts:167` — `getBlockFromViewDirection({maxDistance: BLOCK_REACH})`; обработчики :86 и :100 передают в `activate` только `(player, stack, via)`, `event.block` выброшен. Коса: `targeting.ts:118` берёт взгляд только для развязки ничьей в пределах `TIE_EPSILON = 0.5` (targeting-rules.ts:36) | Web Sword несёт то же свойство; Коса — нет |
| l | (не в утверждении) что BDS реально испускает при use | trap.ts:45–47 отсылает к `docs/dev/gametest-on-bds.md`; `grep -ciE "itemUse\|playerInteractWithBlock"` по нему → 0 (188 строк) | порядок и совместное срабатывание нигде не записаны |
| m | (не в утверждении) стабильный признак сенсора | `Player.inputInfo` :17159, `InputInfo.lastInputModeUsed` :14078, `touchOnlyAffectsHotbar` :14088, `InputMode.Touch` :2124; в src/ и tests/ — 0 использований. Там же: `Dimension.getBlockFromRay` :7842, `isSneaking` :8884 | есть в 2.10.0, в KV не упомянуто |

## /diagnose

```text
OBSERVED: A KV claim (L0-orbc-cx02, analysis v3) says that on the iPad's default touch layout the
          event block is the one under the finger while getViewDirection is the screen centre, so
          L0-adr-orbc §2 (view ray only) fires at a block other than the highlighted one; and that
          touch reports no tap beyond reach. The node states it was not seen on a device. No run,
          log or screenshot exists (checks f, g).
VERDICT: hypothesis (engine half) on a verified design fork (a–d). The expectation "the vanilla
         highlight is the marker" is recorded (spec part-1:109). Investigated as a bug by default.

CHECKS: contradiction: none accepted (adr-orbc and ad01 are both status:proposed) ·
        duplicate: L0-xcx14 escalates cx02 and contains it (CNTR-XCX14-AA, backlog) ·
        criteria writable: yes for the device observation; no for code until it and xq5 are in
UNFOLD: spec — the targeting rule on touch is itself the open question (§6 "навести прицел")
HUMAN: outward-answer — xq5 to the client; the observation needs the operator's iPad

REPRO: Not reproducible without a touch client. BDS SimulatedPlayer is not a substitute:
       useItemInSlotOnBlock takes the block as an argument, so an event-block ≠ view-ray
       divergence would appear by construction and prove nothing about the touch client.
CAUSE: Design level only. adr-orbc §2 (nodes/adr-orbc…:24) discards the event block. The same
       property ships in src/websword/trap.ts:167 (view ray), and :86/:100 drop event.block.
       Whether it misfires on touch is unproven.
PROOF: No executable check (needs the device). Measurements: rows e, i, j, k, l, m above.
RULED OUT: (1) "itemUseOn.block carries the finger block": no such event in 2.10.0 (grep -c = 0).
       (2) "The property is hypothetical, nothing implements it": trap.ts:167 ships it.
       NOT separated: "a far tap raises no event" vs "a far tap raises itemUse with no block".
       Protocol step 3 separates them.

RADIUS: Code: grep in src/ and tests/ for getBlockFromViewDirection | getViewDirection |
        getEntitiesFromViewDirection | itemUse | playerInteractWithBlock | entityHitBlock |
        inputInfo. The only block aim point is websword/trap.ts; the Scythe uses the view only as
        a 0.5-block tie-break; the Orbital module does not exist. KV: kv_get_subtree L0-orbc,
        kv_search "touch … finger … screen centre" and "itemUseOn", then grep -n for line numbers.
        The claim feeds adr-orbc §2, orbc-ad01, p001, r003, r006, ac08, ac09, xasm10, xcx8, xcx14,
        xq5 and lgnd-ad09.
GREEN: n/a. No fix is written (outcome 4).
LIVE: No live run possible. The path exists only on the iPad client; the LAN server was not touched.
```

## Протокол наблюдения на iPad (для оператора, ~10 минут)

Прибор — Паутинный меч на LAN-сервере: он целит только по лучу взгляда (trap.ts:167) и пишет в лог
BDS строку `[andrew] web sword trap via <event>: centre x,y,z placed n/27` (trap.ts:138). Доказательство —
эта строка из `docker logs` LAN-контейнера плюс скриншот, а не пересказ.

Подготовка:
- Меч: `/andrew:websword give` (op).
- Стена из камня в 3 блоках перед игроком.
- На уровне глаз прямо по центру — золотой блок **G**; в 2 блоках правее — алмазный **D**.
  Оба в пределах 4 блоков.
- Между шагами ждать 30 с (cooldown).

Раскладка A — сенсор по умолчанию (Split controls выкл.):
1. Центр экрана на **G**. Коротко тапнуть **D**. Записать:
   - какой блок подсвечен под пальцем;
   - вокруг какого блока встал куб;
   - строку лога (`via`, `centre`).
2. То же с долгим нажатием на **D**. Меч не подписан на `entityHitBlock`, поэтому просто записать,
   что произошло.
3. Центр на **G**. Тапнуть блок в ~8 блоках в стороне от центра.
   - Куб у **G** и `via=itemUse` → дальний тап даёт `itemUse` без блока.
   - Ни куба, ни строки лога → события за пределами reach нет.
   Луч от центра находит G в пределах 5, поэтому «ничего» однозначно значит «события не было».

Раскладка B — Settings → Touch → Split controls вкл. (прицел): повторить шаги 1 и 3.

| Результат | Что следует |
|---|---|
| A1: куб у **G**, подсвечен **D** | cx02 подтверждён. Принять `ad01` с поправками ниже. Паутинный меч на сенсоре тоже промахивается — решение оператора, отдельная работа |
| A1: куб у **D** | cx02 опровергнут: событие и взгляд совпадают. `ad01` — лишняя сложность; §2 остаётся, cx02 закрыть как «не дефект» |
| A3: куб у **G**, `via=itemUse` | формулировка «6–10 unreachable» неверна: дальний тап стреляет в центр экрана. Нужен ответ (v) ниже или явное согласие на это |
| A3: ничего | «на сенсоре за пределами reach события нет» подтверждено |
| B1/B3: куб у **G** | прицел = центр; 10 блоков для ПКМ достижимы только в этой раскладке |

## Что остаётся человеку

1. **Оператор.** Одно из двух:
   - прогнать протокол;
   - принять `ad01` с поправками вслепую. Оно никогда не хуже §2: когда событие и взгляд совпадают,
     оно эквивалентно §2, а в пограничном случае его закрывает поправка 3.
   Решение о Паутинном мече — тоже его.
2. **Клиент (xq5).** Какая дальность на сенсоре и что значит «навести прицел» без прицела. Допустимые
   ответы проверены по API 2.10.0:
   - (i) reach на сенсоре, 10 — только с прицелом (вариант 1 xq5);
   - (ii) то же, плюс подсказка включить Split controls (вариант 2);
   - (iii) ЛКМ как sneak+use: `isSneaking` стабилен, :8884 (вариант 3);
   - (iv) частица-маркер на 6–10 — отходит от §6 (вариант 4);
   - (v) **новое:** при `inputInfo.lastInputModeUsed === Touch` активация без блока не стреляет и
     кулдаун не тратит — Пушка никогда не бьёт в блок, которого игрок не касался.

Поправки к `ad01`, если A1 подтвердит cx02 (тип критерия в скобках):
1. `itemUseOn` → `playerInteractWithBlock` (build: `tsc` против 2.10.0).
2. Выбор цели не зависит от порядка событий. События игрока за тик собираются, цель выбирается
   один раз в `system.run` в конце тика, и событие с блоком побеждает (unit: порядок
   `itemUse`→`interact` и `interact`→`itemUse` дают одну и ту же цель).
3. Если блок события не проходит `isTargetable`, продолжать **луч пальца**, а не луч взгляда:
   `dimension.getBlockFromRay(eye, normalize(block + faceLocation − eye), {maxDistance: 10, includeLiquidBlocks: false, includePassableBlocks: false})`
   (unit: тап по цветку перед камнем выбирает камень за цветком).
4. На iPad — сценарии A1–A3 и B1 протокола с Пушкой вместо меча (manual, ipad).

## Текст резолюции для `refine resolve` (L0-orbc-cx02)

```text
Prepared, awaits a decision (not closed). Checked 2026-09-29 at 32f4aca against
@minecraft/server 2.10.0.
Verified: spec §6 (orbitalcannonspecv1ruen part-1:95,103,109) and adr-orbc §2 are quoted
exactly; §6 exists only in RU and says "навести прицел". The "closest stable equivalent" clause
is about the LMB/RMB actions.
Unverified: the engine half (event block under the finger, view = screen centre, no tap beyond
reach). There is no device observation in repo, chronicle or KV, and DEMO-S2-AA closed without
an iPad run.
Measured: itemUseOn does not exist in 2.10.0 (grep -c = 0). src/orbital is absent (0 refs).
"5–6 blocks" is not measured anywhere (0). The same view-ray-only aim ships in
src/websword/trap.ts:167, with event.block dropped at :86 and :100. Stable
Player.inputInfo.lastInputModeUsed / touchOnlyAffectsHotbar exist and are unused.
ad01 gaps: it is order-dependent with r006/p001 step 3, and it says nothing about an event
block failing isTargetable.
Closes together with L0-xcx14 item 1 when the Web Sword protocol in
docs/feedback/diagnose-CNTR-ORBC-CX02-AA.md is run on the iPad, and after the client answers xq5.
```

## Дубликаты и расхождения (файл:строка — что заменить на что)

Пути от `.ai/context/analysis/`. Роллапы (`risks.md`, `contradictions.md`, `scope.md`, `summary.md`,
`project-knowledge/*`) генерируются из узлов — руками их не править, после регенерации проверить.

`itemUseOn` — события нет в 2.10.0:
- `nodes/adr-orbc__concept-architecture-decision.md:24` — «(plus `itemUseOn` / `playerInteractWithBlock` deduped per tick)» → «(plus `playerInteractWithBlock`, deduped per tick)»
- `nodes/orbc-ad01__concept-architecture-decision.md:24` — «`itemUseOn`, `playerInteractWithBlock` and `entityHitBlock` report that block» → «`playerInteractWithBlock` and `entityHitBlock` report that block (unobserved on the device; cx02)»
- `nodes/orbc-ad01__concept-architecture-decision.md:28` — «(`itemUseOn.block`, `playerInteractWithBlock.block`, …)» → «(`playerInteractWithBlock.block`, `entityHitBlock.hitBlock`)»
- `nodes/orbc-cx02__concept-contradiction.md:25` — «`itemUseOn`, `playerInteractWithBlock` and `entityHitBlock`» → «`playerInteractWithBlock` and `entityHitBlock`»
- `nodes/orbc-p001__concept-process.md:21` — «`itemUse`, `itemUseOn` or `playerInteractWithBlock`» → «`itemUse` or `playerInteractWithBlock`»
- `nodes/orbc-r006__concept-rule.md:21` — «`itemUse` together with `itemUseOn` or `playerInteractWithBlock`» → «`itemUse` together with `playerInteractWithBlock`»
- `nodes/orbc-ac09__concept-acceptance-criterion.md:20` — «`itemUse`, `itemUseOn` and `entityHitBlock`» → «`itemUse`, `playerInteractWithBlock` and `entityHitBlock`»
- `nodes/orbc__concept-component.md:42` — «`itemUseOn`/`playerInteractWithBlock`» → «`playerInteractWithBlock`»
- `nodes/orbc-gloss-mode__concept-glossary-term.md:19` — «`itemUse`/`itemUseOn`» → «`itemUse`/`playerInteractWithBlock`»
- роллапы: `risks.md:302`, `contradictions.md:293`, `scope.md:644`, `project-knowledge/business-rules.md:521`, `project-knowledge/domain-model.md:508`, `project-knowledge/architecture.md:119`, `:332`, `project-knowledge/glossary.md:819`, `:988`

«about 5–6 blocks» — число не измерено:
- `nodes/xq5__concept-client-question.md:20` — «within arm's reach, about 5–6 blocks» → «within arm's reach (a few blocks; the exact distance is not measured yet)»
- `nodes/xcx14__concept-contradiction.md:27` — «about 5–6 blocks» → «(distance not measured)»
- роллапы: `risks.md:419`, `contradictions.md:405`

Не наблюдавшееся на устройстве подано как факт:
- `nodes/orbc-ad01__concept-architecture-decision.md:36` — «because touch only reports taps within reach» → «if touch raises no event beyond reach (unobserved; cx02 protocol step A3)»
- `nodes/xq5__concept-client-question.md:20` — «Minecraft only lets you tap blocks within arm's reach … With it you aim at the screen centre» → добавить «(to be confirmed on the iPad)»
- `nodes/concept-overview.md:98` — «On default touch, reach is limited to arm's length (`xq5`)» → «… (pending the cx02/xcx14 iPad observation)»; роллап `summary.md:101`
- `nodes/orbc-ac08__concept-acceptance-criterion.md:25` — «(by the gesture that `cx02` settles)» → «(by the gesture that `xq5` settles; cx02 settles only which block an event reports)»

Не KV — комментарий в коде, по рамке задачи не правлю:
- `src/websword/trap.ts:45–47` — «see docs/dev/gametest-on-bds.md for what BDS 1.26.51.1 actually emits» → в документе 0 упоминаний. Либо записать туда замер, либо убрать ссылку.

Карточек не заведено, в KV ничего не записано.
