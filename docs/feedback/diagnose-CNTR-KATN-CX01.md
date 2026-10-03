ИСХОД: 4 — Подготовлено, ждёт решения оператора

# Разбор CX-katn-01: «влезает» против «безопасно» — Катана и лава

Проверено 2026-10-03, 17:10–17:25 (+0200). Узлы KV читались из корневого `.ai/context/analysis/`, только
чтение. Копия в worktree для Катаны пуста: `ls .ai/context | grep -c dragonkatana` → 0. Узлы Катаны не
лежат в git ни на одной ветке: `git log --all -- …adr-ktob…` → 0 коммитов. mtime 16:53–16:56 сегодня:
сначала роллаут, потом reduce. Движок: BDS 1.26.51.1, `@minecraft/server` 2.10.0, приватный инстанс
`bds-katn`, он уже удалён.

Итог.
- **Правка reduce на месте, слово в слово.** `adr-ktob`:40–43:
  - *fits* — колонный луч `katn-ad01` (:41);
  - *safe* — fits, и ни одна клетка не `lava`/`flowing_lava`/`fire`/`soul_fire` (:42);
  - вода разрешена (:42);
  - правило §1 о жидкостях не тронуто (:35–37, :43).
  Старой фразы «air, liquid or passable» в узле нет (`grep -c` → 0).
- **Вред, ради которого завели узел, не устранён.** Фильтр смотрит только на клетки ног и головы. Ближайшая
  клетка, которую поиск `r004`/`xasm19` принимает после отказа от лавы, — воздух прямо над лавой. Измерено:
  игрок, поставленный туда, через 3 тика уже в лаве, первый урон лавой на 5-м тике, 4 удара лавой за
  40 тиков. Это ровно столько же, сколько у игрока, поставленного *в* лаву по старому §3. Контроль над
  камнем — 0. Результат одинаков в 3 прогонах из 3.
- Кода Катаны нет (`src/katana` отсутствует, `grep -rli katana src` → 0). Сегодня вред достижим только в
  проекте: по нему будут планировать.
- Человеку остаётся одно решение: считается ли клетка-воздух над лавой безопасной. Всё остальное проверено
  ниже. **Узел не закрывается** до этого решения.

## Перепроверка утверждения, по частям

| # | Часть | Как проверено | Результат |
|---|---|---|---|
| A1 | §6 называется «Safe destination position» | `grep -n '^# 6'` по part-2 | верно: part-2:29 «Безопасная позиция назначения» |
| A2 | §6: «nearest safe place where the player model fits» | part-2:31 | верно, но фраза кончается на «без застревания в твёрдых блоках». Запреты §6 — только стена и удушье (part-2:37). Лава как «небезопасно» — прочтение проекта (`as03`, CAN_ASSUME) |
| A3 | §5: вода и лава не твёрдые **для трассировки** | part-2:19 | верно. Там же part-2:15: точка назначения может быть «в воздухе» |
| B1 | старый `adr-ktob` §3: «air, liquid or passable» | `grep` по узлу → 0; в git истории нет | **не проверяемо как история.** Цитата живёт только в cx01:27 и в роллапах |
| B2 | старое правило переносит жидкостное правило трассы на посадку | проба FIT: колонный луч с флагами трассы на `air`, `water`, `lava`, `flowing_lava`, `fire`, `soul_fire`, `short_grass` → `none`; на `stone` → `stone` | верно: любой «влезает» через луч пропускает лаву и огонь. Фильтр нужен |
| C | по B игрока можно поставить в лаву | проба, случай `in-lava` | верно: урон лавой с 1-го тика, 4 удара за 40 тиков |
| D | «Resolved at reduce v6»: §3 исправлен на месте | `adr-ktob`:40–43, чтение файла | верно как текст |
| E | список опасностей — `lava, flowing_lava, fire, soul_fire` | `BlockTypes.getAll()` по `/lava\|fire\|magma/` → 16 типов | полный. Лава — только `lava` и `flowing_lava`, огонь — только `fire` и `soul_fire`. Остальное: `campfire`, `soul_campfire`, `magma` (as03 их разрешает как пол), кораллы, `firefly_bush` |
| E2 | `flowing_lava` как отдельный тип | `setBlockType("minecraft:flowing_lava")`, 3/3 прогона | читается обратно как `minecraft:lava`, `liquid_depth=0`. Естественный поток не получен: за 200 тиков лава в зоне GameTest не потекла ни после `setBlockType`, ни после `/setblock`. **Id текущей клетки не измерен.** На вывод это не влияет: оба id лавы в списке |
| F | severity: «player-death path on a legal use», правка локальна в katn | проба, случай `above-lava` | путь смерти **остаётся** (см. ниже). Локальность верна: правится только `katn` и §3 |
| G | вред достижим | `ls src/katana`, `grep -rli katana src` | кода нет: вред пока только в проекте |

Сопутствующая ошибка в том же §3 (`adr-ktob`:54): «liquids are skipped **only** with `includeLiquidBlocks:
false`». Это неверно. Луч с одним `includeLiquidBlocks: true` тоже проходит лаву и упирается в камень под
ней (`liquidOnly=minecraft:stone@y-60`). Остановиться на лаве луч может только вместе с
`includePassableBlocks: true` (`passable+liquid=minecraft:lava@y-59`). Это повторяет замер WSWD-FACE-01.

## Почему поиск сажает над лавой

Геометрия cx01: игрок целится через лавовое озеро.
1. Трасса (`p001`:31, `adr-ktob`:35) проходит лаву и упирается в дно (грань Up) или в борт под поверхностью.
2. Желаемая клетка ног (`p001`:34) лежит внутри лавы, и `r004` п.2 её отвергает.
3. Дальше, ближние первыми (`xasm19`:29–32, `r004`:29), идут +1/+2 вверх и шаги по 0,5 назад вдоль луча.
   Для озера глубиной 1 первая же клетка +1 — воздух над лавой. Для глубокого озера шаги назад вдоль луча,
   который вошёл в лаву сверху, первыми выходят в воздух над поверхностью. В обоих случаях это клетка над
   лавой.
4. Эта клетка проходит все пять проверок `r004`. Четыре движковые измерены (`CANDIDATE`):
   - `airShortcut=true`;
   - `columnRay=none`;
   - `hazard=false`;
   - `reach=clear`.
   Пятая — сторона владельца: та же колонка над плоскостью грани. Дальность ≤ 20 соблюдена везде, кроме
   самого края.
5. «A cell in the air is a valid B» (`r004`:33) и «the cell below is not counted» (`adr-ktob`:41) это
   разрешают прямо. Флаг падения урон от лавы не гасит (`r006`:26).
6. Лава без коллизии: `+3:y=1.92,feet=lava,onFire=true`.

Клетку на дальнем берегу поиск взять не может: правило стороны владельца (`r004`:25) запрещает переходить
плоскость грани, а боковые ±1 перпендикулярны лучу.

## /diagnose

```text
OBSERVED: KV node L0-katn-cx01 (analysis v6, written 2026-10-03 16:56) says L0-adr-ktob §3 counted a
          lava cell as "fits", so a Katana user aiming across a lava lake could be placed in lava. It
          claims "Resolved at reduce v6": §3 now separates fits (column ray) from safe (no lava,
          flowing lava, fire or soul fire in the feet or head cell). No Katana code exists.
VERDICT: bug, at design level, before any code. The recorded expectations are Katana §6 (a safe
         position), cx01's own severity ("player-death path on a legal use") and xq6 #7's default
         ("refused, step back to safe ground"). The amended rule meets them in its text but not in
         effect: the named scenario still ends in lava.
CHECKS: contradiction: none (kv_search and chronicle_search: no decision on landing above lava) ·
        duplicate: none on the board · criteria writable: yes, once (A) or (B) below is chosen
UNFOLD: spec — the meaning of "safe" for a mid-air landing is the open question; there is no code yet
HUMAN: decision-change xq6 #7 (if (B) is chosen) / choice of (A) or (B) — to the operator

REPRO: env ANDREW_BDS_DIR=<private copy> bash docs/feedback/diagnose-CNTR-KATN-CX01.repro.sh, on BDS
       1.26.51.1. Three Survival SimulatedPlayers are teleported in the same tick: above stone, inside a
       lava source, and into the air cell above a lava source. Lava hurt is counted via entityHurt
       (cause lava) over 40 ticks: 0 / 4 / 4. The first lava hurt comes at +1 tick inside the lava and
       at +5 above it. 3 runs, 3 identical results (docs/feedback/diagnose-CNTR-KATN-CX01.probe.txt).
CAUSE: The amended safety test reads only the feet and head cells (adr-ktob:42, katn-ad01:34,
       katn-r004:24). The cell below is explicitly not counted (adr-ktob:41), and an air cell is a valid
       landing (katn-r004:33). For a trace endpoint inside lava, the nearest-first search
       (xasm19:29–36, katn-r004:29) therefore accepts the air cell directly above the lava. Lava has no
       collision, so the player sinks into it within 3 ticks.
PROOF: /Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-KATN-CX01-AA/2.red.json — run-check
       --expect-red, exit 1, code_sha 81b6be6, verdict=safe-cell-above-lava-ends-in-lava (runs 1 and 2
       at ebe995a and dccdd26 gave the same verdict; that artifact slot is overwritten per run).
RULED OUT: (1) "A player above lava is only next to it, not in it, so the cell filter suffices": the
       above-lava player has feet=lava at +3 and takes as many lava hits as the in-lava player (4 = 4),
       while the above-stone control takes 0. (2) "The column ray already rejects lava, so fits never
       meant lava": columnRay=none on lava, flowing_lava, fire and soul_fire, and stone → hit; the
       instrument tells solid from non-solid. (3) "The hazard ids are wrong on 1.26.51" (ids were renamed
       there, e.g. chain → iron_chain): all four ids exist, and the only lava and fire ids among 16
       matches are exactly these four.

RADIUS: No code depends on it (src/katana is absent). Dependents in KV were found by grep over the root
        .ai/context/analysis for "air, liquid", "one-cell segment", "fits", "fit (per", "lava",
        "A cell in the air", "cell below", "step back to safe ground" and "skipped only with", plus
        kv_search ("landing above lava") and chronicle_search (0 decisions). The list is below. The
        shipped analogue of option (A) is restingY() in src/legendary/recovery.ts:770–781: a legendary
        drop spot is the cell above the first non-air block, rejected when that block is liquid or in
        UNSAFE_FLOOR (:546–547).
CASES: option (A) restricts a spec-allowed action (an air point above lava, part-2:15). 0 existing
       cases: no Katana code and no players.
BYPASS: none; the restriction comes in before the feature exists.
GREEN: n/a — outcome 4, no fix is written here. The probe is green for the right reason as an
       instrument: it filters hurt events by its own players' ids; the in-lava positive control fires
       at +1; the above-stone control stays at y=2.00 with 0 hurt; the private instance has no joiners.
LIVE: no live run is possible, because there is no Katana. The probe is the ready red check for the
      future katn task.
```

## Что остаётся человеку

**Вопрос.** Безопасна ли для посадки Катаны клетка-воздух прямо над лавой (или огнём)?

- **(A) Нет — расширить *safe*. Рекомендую как дефолт автопилота.**
  - Правило. Если клетка под кандидатом не твёрдая, нужен ещё один луч вниз из центра ног, с
    `includePassableBlocks: true` и `includeLiquidBlocks: true`. С одним liquid-флагом луч лаву проходит
    (измерено). Если первый встреченный блок — `lava`, `flowing_lava`, `fire` или `soul_fire`, кандидат
    небезопасен, и поиск идёт дальше. Ничего безопасного не нашлось — отказ без кулдауна (`xasm19`:37).
  - Цена: не больше одного луча на кандидата в воздухе, только при активации (бюджет `ad01`:36).
  - Что даёт:
    - то, что уже обещано в `xq6` #7 («step back to safe ground»);
    - то, ради чего заведён cx01;
    - согласие с отгруженным `restingY`.
  - Что отнимает: прыжок в точку воздуха над лавой. §5 такую точку разрешает (part-2:15), например для
    игрока с элитрами над лавовым морем Незера.
- **(B) Да — принять.** Фильтр `as03` только не даёт поставить игрока *внутрь* лавы, а падение сверху —
  его собственный прицел.
  - Тогда меняется дефолт `xq6` #7: «отказ только для клетки в лаве, над лавой — падаешь».
  - Фильтр `as03` почти косметический: по замеру те же 4 удара лавой, на 4 тика позже.
  - cx01 закрывается как «путь смерти принят».

## Текст резолюции для `refine resolve` (L0-katn-cx01)

```text
Partially resolved; stays open until (A) or (B) is chosen. Checked 2026-10-03 on BDS 1.26.51.1,
artifact .ai/verify/CNTR-KATN-CX01-AA/2.red.json (exit 1, 81b6be6).
In place: L0-adr-ktob §3 (lines 40–43) splits fits (the L0-katn-ad01 column ray) from safe (neither
cell is lava, flowing_lava, fire or soul_fire); water is allowed; the §1 trace liquid rule is unchanged.
Measured: the column ray with the trace flags passes air, water, lava, flowing_lava, fire, soul_fire
and short_grass, and hits stone, so the filter is needed. All four hazard ids exist, and they are the
only lava and fire block ids. setBlockType("minecraft:flowing_lava") reads back as minecraft:lava
(liquid_depth 0).
Not resolved in effect: the safe-cell search (L0-xasm19, L0-katn-r004) accepts the air cell directly
above lava (air shortcut, no hazard, reach clear). A Survival player teleported there was in the lava
by +3 ticks and took 4 lava hits in 40 ticks, the same as a player placed inside lava; the
above-stone control took 0.
Decision: (A) an air candidate is unsafe when the first block a downward ray (includePassableBlocks
and includeLiquidBlocks both true) meets is lava, flowing_lava, fire or soul_fire; or (B) accept the
fall and change the default of L0-xq6 #7. Autopilot default: (A).
Also wrong in §3 Consequences (L0-adr-ktob:54): liquids are skipped with includeLiquidBlocks:true as
well, unless includePassableBlocks is true.
```

## Постановка для katn при (A)

Критерии добавляются в `katn-ac04`, тип — `e2e` (BDS GameTest) и `unit`:
1. **[e2e] T08b.**
   - GIVEN: лавовый бассейн 5×5 глубиной 1, и отдельно глубиной 3, с каменным полом вокруг; игрок в
     Survival без огнестойкости.
   - WHEN: игрок целится в дно бассейна в 8 блоках и применяет Катану.
   - THEN: 40 тиков нет `entityHurt` с cause `lava`. Игрок либо стоит вне площади бассейна со своей
     стороны, либо не сдвинулся, и кулдаун не взведён.
   - Красная сторона уже есть: `diagnose-CNTR-KATN-CX01.probe.ts`, случай `above-lava`.
2. **[unit] Фильтр в `plan.ts`.** Кандидат-воздух, под которым первым блоком лежит `lava`, `flowing_lava`,
   `fire` или `soul_fire`, небезопасен. Вода под ним или камень — безопасен. Клетка с лавой — небезопасна
   (как сейчас).
3. **T08 без изменений** (`katn-ac04`:22). Огнестойкость там остаётся: тест про трассу, не про посадку.

## Дубликаты и расхождения (файл:строка — что заменить на что)

Пути от `.ai/context/analysis/`. Роллапы (`assumptions.md`, `contradictions.md`, `risks.md`, `scope.md`,
`summary.md`, `client-questions.md`, `project-knowledge/*`) генерируются из узлов: их не править руками,
а после регенерации проверить.

**Устарело после правки reduce — независимо от решения:**
- `nodes/katn-as03__concept-assumption.md:21` (копия `assumptions.md:71`)
  - было: «`L0-adr-ktob` §3 lets liquids count as "fits", which would land a player inside a lava pool
    they aimed across.»
  - станет: «The `L0-adr-ktob` §3 fit ray passes lava and fire (measured), so "fits" alone would land a
    player inside a lava pool; §3 *safe* applies this filter.»
- `nodes/katn-ad01__concept-architecture-decision.md:27`
  - было: «`L0-adr-ktob` §3 says the passable test "reuses the same ray primitive on a one-cell segment"
    but does not say which segment.»
  - станет: «`L0-adr-ktob` §3 defines *fits* by this column ray.» Цитаты в узле нет, `grep -c` → 0.
- `nodes/xasm19__concept-assumption.md:34` (копия `assumptions.md:492`)
  - было: «fit (per `L0-adr-ktob`);»
  - станет: «be safe (per `L0-adr-ktob` §3: it fits, and neither cell is lava, flowing lava, fire or
    soul fire);»
- `nodes/xasm19__concept-assumption.md:37` (копия `assumptions.md:495`): «If nothing fits» → «If nothing
  is safe».
- `nodes/katn-p001__concept-process.md:35`: «the first that fits wins. None fits →» → «the first safe one
  wins. None is safe →».
- `nodes/katn-ac04__concept-acceptance-criterion.md:24` (копии `scope.md:77`,
  `project-knowledge/glossary.md:75`): «with no fit within the search» → «with no safe cell within the
  search».
- `nodes/katn-r004__concept-rule.md:24` (копия `project-knowledge/business-rules.md:150`): «neither cell
  is lava, fire or soul fire» → «neither cell is lava, flowing lava, fire or soul fire». Так список
  совпадёт с `adr-ktob:42`, `ad01:34`, `as03:24`.
- `nodes/adr-ktob__concept-architecture-decision.md:54` (копия `project-knowledge/architecture.md:299`)
  - было: «The probe confirms that liquids are skipped only with `includeLiquidBlocks: false`»
  - станет: «Liquids are skipped with `includeLiquidBlocks: false`, and with `true` too unless
    `includePassableBlocks` is also true (measured on 1.26.51.1)»
- `nodes/katn-cx01__concept-contradiction.md:27` (копии `contradictions.md:32`, `risks.md:32`): перед
  цитатой «Source B» вставить «Before reduce v6, `L0-adr-ktob` §3 read:». Этого текста в узле больше нет.

**Утверждение «resolved» — по решению:**
- `nodes/katn-cx01__concept-contradiction.md:13` — теги `status:resolved`, `resolved_by:L0-adr-ktob`; и
  `:37` «Resolved at reduce v6.» (копии `contradictions.md:42`, `risks.md:42`) → текст резолюции выше.
- `summary.md:88`, `nodes/concept-overview.md:82`: «**Resolved:** `adr-ktob` §3 amended…» → «§3 filters
  the cell; a landing above lava waits for (A)/(B)».
- `nodes/katn__concept-component.md:68` (копии `project-knowledge/architecture.md:73`,
  `project-knowledge/domain-model.md:303`): «resolved at reduce v6 by amending `L0-adr-ktob` §3
  (fits ≠ safe)» → «… (fits ≠ safe); the landing above lava waits for (A)/(B)».
- `nodes/xq6__concept-client-question.md:36` (копия `client-questions.md:43`), вопрос #7:
  - при (A) — добавить «(also a landing above lava or fire)»;
  - при (B) — дефолт «No: only a cell inside lava is refused; a landing above lava falls in».

**Только при (A):**
- `nodes/adr-ktob__concept-architecture-decision.md:42` (копия `project-knowledge/architecture.md:287`):
  после «…`soul_fire` (`L0-katn-as03`)» вставить «, and, when the cell below is not solid, the first
  block a downward ray (passable + liquid flags) meets is none of these». Строку `:41` «The cell below is
  not counted against the player» оставить: она про *fits*.
- `nodes/katn-ad01__concept-architecture-decision.md:34`: в п.3 добавить нижний луч; `:36`: «+1 ray per
  air candidate».
- `nodes/katn-as03__concept-assumption.md:16`: заголовок «…must not be lava or fire» → «…must not be,
  or hang over, lava or fire»; к `:24` добавить пункт про нижний луч (копия `assumptions.md:74`).
- `nodes/katn-r004__concept-rule.md:33` (копия `project-knowledge/business-rules.md:159`): «A cell in the
  air is a valid B (fall protection covers it).» → «… unless the first block below it is lava, flowing
  lava, fire or soul fire (`L0-katn-as03`)».
- `nodes/katn-gl03__concept-glossary-term.md:19` и `:24` (копии `project-knowledge/glossary.md:214`,
  `:219`): «contain no lava or fire;» → «contain no lava or fire, and not hang over lava or fire;»; «A
  cell in mid-air qualifies.» → «A cell in mid-air qualifies unless it hangs over lava or fire.»
- `nodes/katn-ac04__concept-acceptance-criterion.md`: добавить T08b из постановки выше.

## Файлы

- `docs/feedback/diagnose-CNTR-KATN-CX01.probe.ts` — проба. В отгружаемый gametest-пак не входит.
- `docs/feedback/diagnose-CNTR-KATN-CX01.repro.sh` — копирует пробу на один прогон, потом восстанавливает
  `main.ts` и `bds-gametest.mjs`. Выход 1 — клетка над лавой ведёт в лаву, 0 — нет, 2 — вердикта нет.
- `docs/feedback/diagnose-CNTR-KATN-CX01.probe.txt` — строки `[probe] KATN` всех трёх прогонов.
  `dist/bds-gametest.log` перезаписывается следующим прогоном.
