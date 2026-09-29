ИСХОД: 4 — Подготовлено, ждёт решения

# Разбор CX-L0-08: ЛКМ на 10 блоков, ванильная подсветка и досягаемость атаки

Проверено 2026-09-29 22:14. Типы `@minecraft/server` 2.10.0 взяты из `npm install` в этом worktree. Узлы
KV читались через MCP, номера строк — из корневого `.ai/context/analysis/` (только чтение): копия
worktree устарела (`git log -1 -- .ai/context` → 1a07f34, 2026-09-27, Орбиталки в ней нет).

Итог.
- **Движковая посылка ложна.** Утверждение «There is no stable event for an attack/swing that hits
  nothing» опровергнуто.
  - В стабильном 2.10.0 есть `world.afterEvents.playerSwingStart`. У него есть `EntitySwingSource.Attack`
    и фильтр подписки.
  - На BDS 1.26.51.1 подписка `{swingSource: Attack}` сработала ровно по 1 разу на атаку в небо и на
    атаку в камень за 12 блоков, где луч на 10 ничего не нашёл.
  - На камень в 8 блоках луч на 10, прочитанный изнутри обработчика, вернул `stone@8.0`.
  - На ПКМ Attack-свинг не пришёл ни разу (0), `itemUse` — 1.
  - Значит, на сервере ЛКМ дальше ванильной досягаемости срабатывает, и AC-3 для ЛКМ реализуется тем же
    правилом, что для ПКМ.
- **Числа не измерены нигде в проекте.** «well under 10» и «about 5–6» нигде не замерены. «On touch
  shorter still» противоречит единственному найденному источнику (minecraft.wiki: на сенсоре 6 блоков вне
  Creative и 12 в Creative, мышь и контроллер — 5).
- **Остаток не про ЛКМ и не решается здесь.** Проверить, рисует ли клиент контур на 6–10 и шлёт ли
  сенсорный клиент Attack-свинг при тапе дальше досягаемости, можно только на iPad. Выбрать, нужен ли
  маркер там, где ванильного контура нет, — дело клиента (xq5). **Узел не закрывается.**
- Кода Орбитальной пушки нет, и никакой код сейчас не слушает ЛКМ. Вред пока только в знании: ADR,
  процессы и вопрос клиенту построены на ложной посылке. Список правок — ниже.

## Перепроверка утверждения, по частям

| # | Часть | Как проверено | Результат |
|---|---|---|---|
| A1 | §6: блок не дальше 10 | `grep -n "не дальше 10"` по спеке | верно: part-1:103, part-2:23 |
| A2 | §6: работают и ЛКМ, и ПКМ | part-1:95 «ровно два режима атаки: ЛКМ (Attack/Hit Block) и ПКМ (Use)» | верно. §12 (part-3:55) прямо разрешает «максимально близкое стабильное соответствие» с документированием компромисса |
| A3 | §6: «No extra marker» | part-1:109 «Дополнительный маркер цели не нужен: используется обычное ванильное выделение блока» | по тексту — «не нужен», а не «запрещён». Запрет есть только в роллапе boundaries (Out of scope) |
| A4 | AC-3 | part-3:85 «No valid block within 10 blocks -> no shot and no cooldown.» | верно |
| B1 | контур рисуется только в пределах досягаемости | 0 наблюдений в репо и хронике; wiki о контуре молчит | **не наблюдалось**, это клиентская сторона |
| B2 | `entityHitBlock`/`playerBreakBlock` — только в пределах досягаемости | лог соседа CNTR-XCX14-AA (ниже): `SimulatedPlayer.breakBlock` поднимает `entityHitBlock` и `playerStartBreakingBlock` на всех дистанциях 2…12 в Survival; в Creative блок ломается и на 11–12 | **сервер по дистанции не отсекает.** Предел, если он есть, клиентский; для настоящего клиента не измерен |
| B3 | «In Survival well under 10» | `grep -rniE reach src docs README` → единственная константа `BLOCK_REACH = 5` (src/websword/trap.ts:34), взята из спеки меча | **не измерено.** Внешне: 5 блоков мышь/контроллер (minecraft.wiki/w/Interaction_range) |
| B4 | «on touch devices shorter still» | 0 замеров; тот же источник | **противоречит источнику:** сенсор 6 вне Creative, 12 в Creative |
| B5 | нет стабильного события для свинга мимо | index.d.ts:23311 `readonly playerSwingStart`, :19173 `PlayerSwingStartAfterEvent`, :1535/:1541 `EntitySwingSource.Attack`, :25677 `PlayerSwingEventOptions`; `tsc` компилирует пробу; BDS: небо → 1, d12 → 1 | **ложно.** Внешне: стабилен с v2.5.0 (Bedrock 26.0, 2026-02-10), у нас 2.10.0 |
| C1 | «LMB only within vanilla reach» | та же проба, d8 | ложно на сервере: 1 свинг, луч `stone@8.0` |
| C2 | ПКМ 6–10 через `itemUse` + луч | моя проба: use на 8 → `itemUse`=1; лог соседа: `itemUse` на 2…12, луч на 10 попадает до d=10 и даёт `none` с d=11 | верно на сервере; «6» выведено из неизмеренной досягаемости |
| C3 | «no highlight on 6–10» | 0 наблюдений | **не наблюдалось**, клиент |
| C4 | «LMB beyond reach cannot fire at all» | проба: d12 и небо | ложно на сервере; сенсор не наблюдался |
| D | AC-3 и «подсветка = маркер» несовместимы для обоих режимов | из C1/C2 | AC-3 выполним одним правилом для обоих режимов: свинг или `itemUse` → луч 10 → `none` → без выстрела и кулдауна. Остаток одинаков для обоих режимов: дальше клиентской дальности контура нет (C3). Это вопрос UX и формулировки §6, не ограничение движка для ЛКМ |
| E | эскалирован в xq5 и блокирует задачи orbc | xq5: теги `status:open`, `blocks:L0-orbc`; `task_board_status` → 83 задачи, ни одной `ORBC-*` на реализацию (только CNTR-ORBC-CX02-AA); `ls src/orbital` → нет | верно |
| F | варианты (a)/(b)/(c) | index.d.ts | (a) движком не вынужден. (b) `isSneaking` стабилен (:8884), но `InputButton.Sneak` на сенсоре «pressed for 1 tick or less» (:2084–2094); держится ли `isSneaking` при тач-приседе — не наблюдалось. (c) без изменений. **Нового (d)** в узле нет: ЛКМ = `playerSwingStart{Attack}` + луч 10, как ПКМ |

Строки соседа (CNTR-XCX14-AA, `.ai/temp/CNTR-XCX14-AA/dist/bds-gametest.log`, прогон 2026-09-29
20:04 UTC, артефакт `.ai/verify/CNTR-XCX14-AA/2.json`, df8872f). Это его замер, не мой. Цитирую, потому
что лог перезаписывается следующим прогоном:

```text
probe_in_surv break d=11 … events=[startBreaking{…; ray10=none} entityHitBlock{block=3,-57,-3; ray10=none} swingStart{source=Mine …}]
probe_in_surv break d=12 … events=[startBreaking{…; ray10=none} entityHitBlock{block=3,-57,-4; ray10=none} swingStart{source=Mine …}]
probe_in_surv interact d=5 face=4.50 … returned=true      probe_in_surv interact d=6 face=5.50 … returned=false
probe_in_crea attack sky … events=[swingStart{source=Attack …; ray10=none}]
```

Чего в утверждении нет:
1. `adr-orbc`:30 называет `playerButtonInput` бета-API. Это не так: он стабилен (index.d.ts:23184). Но
   `InputButton` — только Jump и Sneak (:2075), так что ЛКМ он всё равно не несёт; вывод ADR верен,
   посылка нет.
2. `SimulatedPlayer.attack()` ни разу не поднял `entityHitBlock`, даже на 3 блоках (0 из 4).
   `breakBlock` поднимает его вместе со свингом `source=Mine`. Настоящий клиент, начинающий копать
   блок в пределах досягаемости, вероятно, даст Mine, а не Attack — не наблюдалось. Обработчику ЛКМ в
   orbc нужны оба входа (Attack-свинг и `entityHitBlock`) под дедупом по тику из p001 шаг 3.
3. Attack-свинг, скорее всего, приходит и при ударе по мобу — не измерено. ЛКМ по мобу тогда выстрелит в
   блок за ним. §2 (удар = урон пустой руки) и §6 не говорят, что главнее. Это вопрос дизайна orbc, не
   этого узла.

## /diagnose

```text
OBSERVED: KV node L0-xcx8 (analysis v3) says that stable @minecraft/server 2.10.0 has no event for an
          attack or swing that hits nothing, and that the outline, entityHitBlock and playerBreakBlock
          exist only within vanilla reach ("well under 10" in Survival, "shorter still" on touch).
          From this it concludes that LMB beyond reach cannot fire, so AC-3 and "the vanilla highlight
          is the marker" cannot both hold. Nothing in the repo, chronicle (2 searches → 0) or KV
          records a run, log or device observation behind it. The only reach constant in the code is
          BLOCK_REACH = 5 (src/websword/trap.ts:34), and it comes from the Web Sword spec, not from a
          measurement. src/orbital is absent (ls → no such directory), and no shipped handler listens
          for LMB (grep entityHitBlock|playerSwingStart in src → 0).
VERDICT: hypothesis (the engine half) set against a recorded expectation (spec part-1:95,103,105,109;
         part-3:85). Investigated as a bug by default.
CHECKS: contradiction: none accepted (adr-orbc is status:proposed) · duplicate: L0-xcx14 extends it
        for touch, L0-orbc-cx02 covers touch aim (CNTR-ORBC-CX02-AA, done) · criteria writable: yes
        for the engine half; the highlight and touch halves need the device
UNFOLD: spec — the LMB input model and the marker rule are the open question; there is no code yet
HUMAN: outward-answer — the rewritten xq5 goes to the client

REPRO: docs/feedback/diagnose-CNTR-XCX8-AA.repro.sh on a private BDS 1.26.51.1 (bds-xcx8). A Survival
       SimulatedPlayer holding andrew:test_item, with playerSwingStart subscribed through the
       {swingSource: Attack} filter. Results for sky / 3 / 8 / 12 blocks: 1 Attack swing each; the
       10-block ray, read inside the handler, gives none / stone@3.0 / stone@8.0 / none. Use at 8:
       0 Attack swings, 1 itemUse. entityHitBlock on attack: 0 of 4. Three runs gave identical
       results.
CAUSE: Premise B ("no stable event for a swing that hits nothing") is false.
       node_modules/@minecraft/server 2.10.0 declares world.afterEvents.playerSwingStart
       (index.d.ts:23311), EntitySwingSource.Attack (:1535–1541) and a subscribe filter
       (:25677–25693). The analysis modelled LMB only as entityHitBlock (adr-orbc:24) and rejected the
       swing path as "no stable swing event" (adr-orbc:29). "LMB ≤ reach" is derived from that alone.
PROOF: .ai/verify/CNTR-XCX8-AA/2.json — exit 0, code_sha ccd3f71. The same run prints the 2.10.0
       declarations, compiles the probe with tsc against them, then runs it on BDS.
RULED OUT: (1) "The event fires only because the gametest world has Beta APIs on": tsc compiles the
       probe against the stable 2.10.0 typings (exit 0). (2) "A swing fires only when something is
       hit, or only within reach": the sky and 12-block cases have ray10=none, and each still gave 1
       swing. (3) "The Attack filter cannot tell LMB from RMB": use gave 0 Attack swings.
       NOT separated: whether the iPad touch client sends an Attack swing for a tap or hold beyond
       reach. A SimulatedPlayer acts on the server and cannot stand in for the client.

RADIUS: Nothing to fix in code. src/orbital does not exist, and no shipped handler listens for LMB
        (grep entityHitBlock|playerSwingStart in src → 0 outside gametest probes). Who depends on the
        claim, found by grep -rnE over the live KV (.ai/context/analysis) for "no stable swing",
        "vanilla reach", "cannot fire", "entityHitBlock", "5–6", "6–10" and "sneak":
        adr-orbc §2 and its rejected alternatives, orbc-p001, orbc-r003, orbc-r013 item 7, orbc-ac03,
        orbc-gloss-mode, lgnd-p009, concept-boundary, xcx14 and xq5 (outward, to the client), plus
        the rollups generated from them. No restriction is proposed, so there is no CASES/BYPASS block.
GREEN: n/a — outcome 4, no fix is written. The evidence check itself is green for the right reason:
       the probe filters by its own player name on a private instance nobody joins; every attack gave
       exactly 1 swing (no double count across the retry); the 12-block and sky cases have ray10=none.
LIVE: No live client run is possible here. The open part lives only in the iPad client.
```

## Наблюдение на iPad (для оператора, ~10 минут; дополняет протокол cx02 и пункт 1 xcx14)

Нужна dev-сборка на QA-сервере (`bds-qa`, 19134) с подпиской из пробы
(`diagnose-CNTR-XCX8-AA.probe.ts`, обработчик с фильтром Attack), которая пишет в лог
`[andrew] swing <source> ray10=<блок@дистанция|none>`. Отгружаемый код ЛКМ не слушает, поэтому
Паутинный меч здесь не годится как прибор. Доказательство — строки `docker logs` и скриншот, не пересказ.

| Шаг | Раскладка | Действие | Записать |
|---|---|---|---|
| L1 | Split controls (прицел) | прицел на камень в 8 блоках, жест атаки | пришёл ли свинг, `source`, `ray10` |
| L2 | Split controls | прицел в небо, жест атаки | свинг есть/нет (путь AC-3) |
| L3 | тап по умолчанию | удержание на блоке в ~8 блоках | свинг и `source`, `entityHitBlock` |
| L4 | тап по умолчанию | удержание на блоке в 3 блоках | `source` (Mine/Attack) и какой блок нашёл луч |
| L5 | Split controls, Survival | отходить от блока, пока не исчезнет контур | дистанция в блоках |

| Результат | Что следует |
|---|---|
| L1 = Attack, `stone@8` | на iPad с прицелом ЛКМ достаёт 10, как на сервере. (a) не нужен, (b) не нужен |
| L3: свинга нет | на тапе по умолчанию ЛКМ дальше досягаемости не приходит — это часть xcx14, не движок |
| L5 < 10 | «подсветка = маркер» не покрывает хвост до 10 ни в одном режиме → решение (ii) ниже |
| L5 ≥ 10 | вопрос маркера снимается целиком |

## Что остаётся человеку

1. **Оператор.** Прогнать L1–L5 или принять результат вслепую.
2. **Клиент (xq5, outward).** Вопрос нужно переписать: фраза «Left-click beyond arm's reach cannot be
   detected in either layout» ложна для сервера. Допустимые ответы, проверенные по API 2.10.0:
   - (i) ЛКМ = свинг Attack + луч 10, как ПКМ. Маркера нет, контур — там, где его рисует ванилла
     (буква §6). Кандидат в новый дефолт вместо «1».
   - (ii) (i) + частица-маркер дальше клиентской дальности. Это отход от «маркер не нужен» (part-1:109)
     и от Out of scope в boundaries.
   - (iii) ЛКМ только в пределах досягаемости. Движком больше не вынуждено; это чисто продуктовый выбор
     («видишь контур — можешь стрелять»).
   - (iv) присед + ПКМ. Нужен, только если L3 покажет, что тап по умолчанию свинга не шлёт.
   - Сенсорные пункты (блок под пальцем, `inputInfo.lastInputModeUsed`) — в отчёте CNTR-ORBC-CX02-AA.

## Текст резолюции для `refine resolve` (L0-xcx8)

```text
Prepared, awaits a decision (not closed). Checked 2026-09-29 at ccd3f71 against
@minecraft/server 2.10.0 and BDS 1.26.51.1.
Refuted: "no stable event for an attack/swing that hits nothing". 2.10.0 declares
world.afterEvents.playerSwingStart (index.d.ts:23311) with EntitySwingSource.Attack (:1541) and a
swingSource filter (:25677); a probe compiled against those typings. On BDS, a Survival
SimulatedPlayer's attack raised exactly 1 Attack-filtered swing at the sky, 3, 8 and 12 blocks; the
10-block view ray read inside the handler returned none / stone@3.0 / stone@8.0 / none; a use raised
0 Attack swings and 1 itemUse (artifact .ai/verify/CNTR-XCX8-AA/2.json). So on the server LMB is not
limited to vanilla reach, and AC-3 holds for both modes with one rule.
Also measured (CNTR-XCX14-AA): the server raises entityHitBlock for SimulatedPlayer.breakBlock at
2..12 blocks, so any reach limit is client-side.
Not measured anywhere: "well under 10", "5–6", and the outline distance. "Shorter on touch"
contradicts minecraft.wiki (touch 6 outside Creative, 12 in Creative; mouse/controller 5).
Open: whether the iPad client sends an Attack swing beyond reach on each layout, and how far the
outline is drawn (protocol L1–L5 in docs/feedback/diagnose-CNTR-XCX8-AA.md); the client's answer to
the rewritten xq5 about a marker beyond the outline. Closes together with L0-xcx14 item 1.
```

## Дубликаты и расхождения (файл:строка — что заменить на что)

Пути от `.ai/context/analysis/`. Роллапы генерируются из узлов: руками их не править, после
регенерации проверить. Где строка уже есть в списке CNTR-ORBC-CX02-AA (`itemUseOn`, «5–6»), правки
нужно слить.

Посылка «нет стабильного свинг-события» и выводы из неё:
- `nodes/xcx8__concept-contradiction.md:23` — «There is no stable event for an attack/swing that hits nothing.» → «Stable 2.10.0 has `playerSwingStart` (`EntitySwingSource.Attack`); on BDS it fires once per attack at the sky and at 12 blocks.»
- `nodes/xcx8__concept-contradiction.md:22` — «In Survival that is well under 10 blocks, and on touch devices it is shorter still.» → «(distance not measured; the server does not gate entityHitBlock by distance)»
- `nodes/xcx8__concept-contradiction.md:26` и `:28` — «LMB can only be detected on blocks within vanilla reach.» / «LMB beyond reach cannot fire at all.» → «On the server LMB arrives as an Attack swing at any distance; the touch client is unobserved.»
- `nodes/xcx8__concept-contradiction.md:33` — «(a) Accept LMB ≤ vanilla reach…» → «(a) … (a product choice; the engine does not force it)»; добавить «(d) LMB = `playerSwingStart` {Attack} + the 10-block view ray, as RMB.»
- `nodes/adr-orbc__concept-architecture-decision.md:24` — «LMB = `world.afterEvents.entityHitBlock` where the damager is a player holding the Cannon» → «LMB = `world.afterEvents.playerSwingStart` {swingSource: Attack} and `entityHitBlock` (a mining start), deduped per tick»
- `nodes/adr-orbc__concept-architecture-decision.md:29` — «Detecting LMB through `entityHitEntity` or the swing animation: there is no stable "swing" event.» → убрать из отвергнутых: `playerSwingStart` стабилен (index.d.ts:23311)
- `nodes/adr-orbc__concept-architecture-decision.md:30` — «A beta `playerButtonInput` or input API: this violates C-2.» → «`playerButtonInput` is stable but reports only Jump and Sneak, so it cannot carry LMB.»
- `nodes/adr-orbc__concept-architecture-decision.md:32` — «LMB inherits the vanilla reach limit … only a stable workaround such as sneak+Use can deliver it.» → «On the server LMB reaches 10 through the Attack swing; the touch client is pending xcx14.»
- `nodes/orbc-r013__concept-rule.md:27` — «7. There is no stable "swing at nothing" event.» → «7. Beyond the vanilla outline LMB and RMB have no aim cue (xcx8, xq5).»
- `nodes/orbc-r003__concept-rule.md:27` — «until `L0-xq5` is answered, LMB is physically limited to the vanilla reach.» → «the engine does not limit LMB on the server; touch is pending `L0-xcx14`.»
- `nodes/lgnd-p009__concept-process.md:25` — «`world.afterEvents.entityHitBlock`, where `damagingEntity` is a `Player`.» → «`world.afterEvents.playerSwingStart` {Attack} or `entityHitBlock` with a `Player` damager, one per tick.»
- `nodes/lgnd-p009__concept-process.md:38` — «`entityHitBlock` fires only within vanilla reach, so LMB beyond about 6 blocks cannot trigger.» → «Beyond the outline LMB arrives as an Attack swing with no block; the view ray resolves the target. Touch is pending `L0-xcx14`.»
- `nodes/orbc-p001__concept-process.md:22` — «LMB: `entityHitBlock` where the damager is a `Player`.» → «LMB: `playerSwingStart` {Attack} or `entityHitBlock` (dedup in step 3).»
- `nodes/orbc__concept-component.md:43` — «`world.afterEvents.entityHitBlock` with a player damager … (LMB)» → добавить «`world.afterEvents.playerSwingStart` {Attack}»
- `nodes/orbc-gloss-mode__concept-glossary-term.md:18` — «(Attack / Hit Block, via `entityHitBlock`)» → «(Attack / Hit Block, via the Attack swing or `entityHitBlock`)»
- `nodes/orbc-ac03__concept-acceptance-criterion.md:24` — «(LMB, a forced `entityHitBlock` path)» → «(LMB, through the Attack swing and through `entityHitBlock`)»
- `nodes/concept-boundary.md:43` — «LMB activation beyond vanilla reach (`L0-xcx8`, `L0-xq5`).» → «LMB beyond reach on the iPad touch layout, and an aim cue beyond the vanilla outline (`L0-xcx14`, `L0-xq5`).»
- `nodes/xcx14__concept-contradiction.md:27` — «`L0-xcx8`: stable 2.10.0 reports LMB on a block only within vanilla reach, about 5–6 blocks.» → «`L0-xcx8`: on the server the Attack swing reports LMB at any distance; the touch client and the distance are unmeasured.»
- `nodes/xq5__concept-client-question.md:20` — «Left-click beyond arm's reach cannot be detected in either layout.» → «With the crosshair layout left-click can reach 10 blocks too; on the default touch layout this is to be confirmed on the iPad.»
- `nodes/xq5__concept-client-question.md:25` — вариант 3 «With the crosshair layout, both attacks then reach 10 blocks.» → «(only needed if the default touch layout sends no attack beyond reach)»

Неизмеренное «6» в «6–10»:
- `nodes/xcx8__concept-contradiction.md:27`, `:35` и `nodes/xq5__concept-client-question.md:26` — «6–10» → «beyond the vanilla outline, up to 10»

Роллапы (после регенерации проверить):
- `risks.md:419, 447, 448, 451, 453, 458`
- `contradictions.md:405, 432, 433, 436, 438, 443`
- `client-questions.md:27, 32, 33`
- `project-knowledge/architecture.md:332, 337, 338, 340`
- `project-knowledge/business-rules.md:464, 682`
- `project-knowledge/boundaries.md:46`
- `project-knowledge/glossary.md:693, 987`
- `scope.md:518`

Карточек не заведено, в KV ничего не записано.
