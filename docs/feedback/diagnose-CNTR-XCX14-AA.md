ИСХОД: 4 — Подготовлено, ждёт решения

# Разбор L0-xcx14: 10 блоков и «маркер — ванильная подсветка» на сенсоре iPad

Проверено 2026-09-29 на `@minecraft/server` 2.10.0 и BDS 1.26.51.1: Docker, собственный экземпляр
`bds-xcx14`, мир FLAT, Survival и Creative. Прибор — `src/gametest/probe-input.ts`
(коммиты d357975, 9745511, df8872f). Артефакт — `.ai/verify/CNTR-XCX14-AA/2.json` (run-check,
`code_sha` = df8872f, exit 0, 3/3 тестов). Сырые строки — `diagnose-CNTR-XCX14-AA.probe.txt`
рядом с этим файлом.

Предшественник — разбор `orbc-cx02` (`docs/feedback/diagnose-CNTR-ORBC-CX02-AA.md`, коммит b8636ff
в ветке `task/CNTR-ORBC-CX02-AA`, не влит). Его выводы здесь не повторяются. Этот разбор
добавляет то, что измеряется на BDS без человека, — так велит примечание надзирающего.

## Итог

- **Утверждение A верно, с одной оговоркой.** Спека part-1:109 говорит «дополнительный маркер
  цели **не нужен**». Это не «запрещён». KV пересказывает строку как «the only marker».
- **Число «about 5–6 blocks» — не свойство сервера и не свойство API.** На BDS события приходят
  на любой проверенной дистанции до 11.5 блока до грани. Если предел есть, его ставит клиент: он
  просто не шлёт пакет. Единственная «6» в инструментах — радиус `SimulatedPlayer.interact()`
  из GameTest: попадает при грани ≤ 4.5, промахивается при ≥ 5.5.
- **Стабильное событие «взмах мимо» в 2.10.0 есть:** `world.afterEvents.playerSwingStart`,
  `swingSource: Attack`. Удар в открытое небо его вызывает (Survival и Creative). Утверждения
  «no stable swing event» в `xcx8`, `adr-orbc` и `orbc-r013`, а вслед за ними «LMB beyond reach
  cannot be detected in either layout» в `xq5`, ложны на уровне API. ЛКМ дальше reach ловится
  связкой «взмах + луч взгляда» — **если клиент сообщает взмах**. Сообщает ли его iPad — вопрос
  к устройству.
- **Луч взгляда до 10 работает из любого обработчика.** `getBlockFromViewDirection({maxDistance: 10})`,
  вызванный внутри `itemUse`, `playerSwingStart`, `entityHitBlock` и `itemStartUseOn`, находит
  блок, если грань входа ≤ 9.5 (грань на 10.5 уже не находит). Без `maxDistance` находит на 31.5.
  Значит, ПКМ 6–10 через `itemUse` + луч сервер обслуживает при любом прицеле, который пришлёт
  клиент.
- **Новое, против `adr-orbc` §2 и `orbc-ad01`.** Кастомный предмет без своего действия, применённый
  к камню, **не вызывает ни `itemUse`, ни `afterEvents.playerInteractWithBlock`** (22 из 22).
  Приходят только `beforeEvents.playerInteractWithBlock` (с `isFirstEvent=false`) и
  `afterEvents.itemStartUseOn`. Набор подписок §2 на этом пути не услышит ничего. Источник блока
  события в `ad01` должен быть before-событием или `itemStartUseOn`.
- **Creative ЛКМ:** в одном тике идут `playerStartBreakingBlock` → `playerBreakBlock` →
  `entityHitBlock` → `playerSwingStart`. Луч из обработчика `entityHitBlock` блока уже не видит
  (11 из 11). Отмена в `beforeEvents.playerBreakBlock` из `adr-orbc` §2 несущая, а не косметическая.
- **Утверждение «pntr/ring's iPad ACs all start from "tap a block 8 away"» ложно.** 8 блоков
  названы только в `orbc-ac08`:25. В `pntr-ac08` жест ЛКМ без дистанции. В `ring-ai11`,
  `ring-ai12` и `ring-ai15` игрок с iPad — наблюдатель в 25, 20 и 12 блоках, стреляет второй
  игрок.
- **Попутно, вне рамки задачи.** У `BlockRaycastHit.faceLocation` на гранях South и East
  нормальная компонента 0 вместо 1 (8 из 8 сырых чтений). `src/websword/trap.ts:175` на этом
  строит правило «не сквозь стены» — сообщаю оператору, не правлю.
- **Остаток требует устройства и решения.** Что шлёт касание на дистанции, какой блок
  сообщается, будет ли взмах на промахе, как ведут себя две раскладки — BDS этого не видит.
  Узел не закрывается.

## Замеры на BDS

Цель — камень на уровне глаз, прямо на север, `d` = 2…12 блоков (центр блока). Столбец «грань» —
расстояние от глаза до ближней грани по геометрии. Предмет — `andrew:test_item`, кастомный,
без действий. Строки Survival и Creative совпали во всём, кроме столбца `break`.

| Действие SimulatedPlayer | грань 1.5 … 9.5 (d 2–10) | грань 10.5 … 11.5 (d 11–12) | в небо |
|---|---|---|---|
| `useItemInSlot` (ПКМ в воздух) | `before.itemUse`, `itemUse`; ray10 = цель | те же события; ray10 = none, ray без max = цель | `itemUse`, ray = none |
| `useItemInSlotOnBlock` (ПКМ по блоку) | `before.playerInteractWithBlock` (first=false), `itemStartUseOn`; **нет** `itemUse` и after-interact | то же | — |
| `attack()` (ЛКМ-взмах) | `playerSwingStart{Attack}`; ray10 = цель; **нет** `entityHitBlock` | `playerSwingStart{Attack}`; ray10 = none | `playerSwingStart{Attack}` |
| `breakBlock` Survival (удержание) | `playerStartBreakingBlock`, `entityHitBlock`, `playerSwingStart{Mine}`; ray10 = цель | те же; ray10 = none | — |
| `breakBlock` Creative | + `playerBreakBlock` раньше `entityHitBlock`; блок = air; ray10 = none | то же | — |
| `interact()` (нотный блок) | true при грани ≤ 4.5; false при ≥ 5.5; **ни одного** скриптового события | false | false |

Дальний луч: `getBlockFromViewDirection()` без опций вернул камень на гранях 15.5, 23.5 и 31.5.
`player.inputInfo` у SimulatedPlayer: `KeyboardAndMouse`, `touchOnlyAffectsHotbar=false`. Сенсор
этим прибором не имитируется.

### `BlockRaycastHit.faceLocation`: нормальная компонента всегда 0

Тест `probe_input_face_location`: камень в 4 блоках на N, S, W, E, луч с `maxDistance: 10` и без
него. Нормальная компонента прочиталась как `0.000` на всех четырёх гранях (8 из 8). Для граней
North и West это верно; для South и East грань лежит на 1.0.

| Цель | Грань | Прочитано | Ожидалось |
|---|---|---|---|
| north | South | `0.500,0.415,0.000` | z = 1 |
| south | North | `0.500,0.415,0.000` | z = 0 |
| west | East | `0.000,0.415,0.500` | x = 1 |
| east | West | `0.000,0.415,0.500` | x = 0 |

В прогоне на дистанции то же видно на грани South: 58 из 64 чтений на 1 блок дальше геометрии,
6 совпали. Сумма `block.location + faceLocation` ставит точку попадания на дальнюю сторону блока,
когда луч входит через грань South или East. Грань Up не мерялась. Для Пушки отсюда поправка 3
ниже.

**Отгруженный код, вне рамки задачи.** `src/websword/trap.ts:175` сравнивает дистанцию до
сущности с `distance(head, hitPoint(block, faceLocation))`. Это сравнение и держит правило «не
атаковать сквозь стены» (спека меча §12). Когда игрок смотрит на север или запад, дистанция до
блока завышена на 1. Сущность вплотную за стеной толщиной в 1 блок выигрывает ничью, и куб
вырастает вокруг неё. Механизм измерен; сценарий с сущностью не прогонялся. Правку не делаю —
сообщаю оператору.

### Болезни прибора (проверены, учтены)

1. **SimulatedPlayer проглатывает каждый второй** `useItemInSlot` / `attack` / `useItemInSlotOnBlock`.
   Такой вызов возвращает false и не вызывает ни одного события. Первый прогон это показал
   чередованием по чётности вызова. В прогоне артефакта молчаливый вызов повторяется один раз;
   строка несёт `attempt=2`.
2. **`interact()` не вызывает скриптовых событий** даже при `true`. Поэтому он использован только
   для радиуса самого SimulatedPlayer, не для выводов о событиях.
3. **Действия SimulatedPlayer идут на сервере и получают блок аргументом.** «Сервер не режет по
   дистанции» доказано для слоя событий и серверных действий. Проверяет ли BDS дистанцию сетевого
   пакета от настоящего клиента, не измерено: сетевого клиента нет. `bedrock-protocol` был бы новой
   зависимостью. Для решения это не ключ: клиент в Survival сам не шлёт касание дальше своего
   радиуса выбора.

## Перепроверка утверждения, по частям

| # | Часть | Как проверено | Результат |
|---|---|---|---|
| a | §6: оба режима, блок ≤ 10 | `grep -n` по orbitalcannonspecv1ruen-part-1.md | верно: :95 (два режима), :103 («не дальше 10») |
| b | §6: ванильная подсветка — единственный маркер | там же, :109 | «Дополнительный маркер цели **не нужен**». Это не запрет; «only marker» — прочтение |
| c | Mobile — «ближайшее стабильное соответствие» | :95 | верно, но фраза про **действия** ЛКМ/ПКМ (так же у CX02) |
| d | канал `ipad` — единственное доказательство отрисовки | constraints.md, Verification split (C-6) | верно |
| e | xcx8: LMB по блоку только в vanilla reach, «about 5–6 blocks» | прибор, строки `break` и `attack` | **не так на сервере.** `entityHitBlock` пришёл на гранях 1.5–11.5 (22/22). «5–6» не измерено нигде. Единственная «6» — `interact()` GameTest (index.d.ts:656): факт 4.5 < r < 5.5 |
| f | xcx8:23 «нет стабильного события взмаха мимо» | `grep` index.d.ts: `playerSwingStart` :23311, класс :19173, `EntitySwingSource.Attack` :1541; прибор, `attack sky` | **ложно**: событие стабильно и пришло на удар в небо (2/2 режима) |
| g | cx02: подсвечен блок под пальцем, дальше reach касания нет, ПКМ 6–10 недостижим | chronicle_search 2026-09-29 → 0 наблюдений с устройства; прибор не имитирует сенсор (`inputInfo` = KeyboardAndMouse) | **не наблюдалось**; нужен iPad |
| h | cx02: луч взгляда — центр экрана | то же | не наблюдалось; нужен iPad |
| i | ad01 (proposed): блок события, потом луч | тег `status:proposed` | верно; но after-`playerInteractWithBlock` на пути кастомного предмета не приходит (строка `use-on-block`) |
| j | «pntr/ring's iPad ACs all start from "tap a block 8 away"» | `grep -nEi 'tap\|ipad\|away\|distance'` по pntr-ac0*, ring-ac1*, ring-ai1* | **ложно**: 8 блоков только в orbc-ac08:25; pntr-ac08:16 — ЛКМ без дистанции; ring-ai11:17 / ai12:17 / ai15:17 — iPad-наблюдатель в 25 / 20 / 12, стреляет второй игрок |
| k | xq5 «переписан с этой находкой» | nodes/xq5:13 тег `v3-reduce-rewrite`, :20 | переписан, но подаёт ненаблюдавшееся как факт и несёт ложное «LMB beyond reach cannot be detected in either layout» |
| l | lgnd-ad09: режим активации, attack = только главная рука | nodes/lgnd-ad09:29–33 | верно; §5 опирается на жест, дающий `entityHitBlock` + `itemUse` (xasm10). На сервере удержание даёт `entityHitBlock` + swing{Mine}, без `itemUse` |
| m | Код Пушки | `ls src/orbital` → нет; `grep -rni orbital src \| wc -l` → 0 | вред для Пушки сейчас недостижим; вопрос — проектный |

## /diagnose

```text
OBSERVED: The KV claim L0-xcx14 (v3) says the §6 10-block range and "vanilla highlight is the
          only marker" cannot both hold on iPad touch. It cites an unmeasured "about 5–6 blocks"
          LMB limit (xcx8), an unobserved touch model (cx02) and "no stable swing event". No
          device observation exists (chronicle 2026-09-29: 0; CX02 report: 0).
VERDICT: hypothesis (device half) over a design question that is real (spec :103 vs :109 on a
         touch client). Investigated as a bug by default; the BDS-measurable half is measured.

CHECKS: contradiction: none accepted (adr-orbc, orbc-ad01, lgnd-ad09 all status:proposed) ·
        duplicate: L0-orbc-cx02 (escalated here; CNTR-ORBC-CX02-AA done, report b8636ff);
        L0-xcx8 (CNTR-XCX8-AA, backlog) is extended by this node, and its "no swing event" line
        is refuted here · criteria writable: yes for the iPad observation; no for code until
        xq5 is answered
UNFOLD: spec — the touch range and the LMB gesture are the open question
HUMAN: outward-answer — xq5 to the client; the observation needs the operator's iPad

REPRO: env ANDREW_BDS_DIR=bds-xcx14 node scripts/bds-gametest.mjs --only andrew:probe_input_survival
       --only andrew:probe_input_creative --only andrew:probe_input_face_location  (3/3; runs at
       9745511 and df8872f gave identical event sets and ray hits on all 122 steps)
CAUSE: Design level. (1) The "5–6" limit is not a server or API property: entityHitBlock,
       itemStartUseOn and before.playerInteractWithBlock arrive at faces 1.5–11.5. Any limit is
       the client's pick range, which only the device shows. (2) The "no swing event" premise
       behind xcx8 option (b) and adr-orbc's rejection is false: playerSwingStart{Attack} is
       stable and fires on a miss. (3) adr-orbc §2 listens to itemUse + after.playerInteractWithBlock,
       and a no-op custom item used on a block raises neither.
PROOF: .ai/verify/CNTR-XCX14-AA/2.json (code_sha df8872f, exit 0); rows e, f, i, j above;
       the lines in diagnose-CNTR-XCX14-AA.probe.txt.
RULED OUT: (1) "BDS drops far interactions, so the limit is the server's": break and
       use-on-block events at face 11.5, 22/22 per action. (2) "SimulatedPlayer.attack()
       swings only when it hits something": swingStart{Attack} at open sky, 2/2 modes.
       (3) "The ray with maxDistance 10 stops at vanilla reach": it returns blocks at face 9.5
       from all four handler types. (4) "The missing half of run 1 is an engine distance
       cut": the gaps alternated by call parity (d=3,5,7…) and vanished with one retry.
       NOT separated here: what the iPad client sends (event, block, swing) for a tap at 6–10
       in either layout. BDS cannot see the client's decision not to send.

RADIUS: grep src/ and tests/ for getBlockFromViewDirection | itemUse | playerInteractWithBlock |
        itemStartUseOn | entityHitBlock | playerSwingStart | inputInfo: the only live consumer of
        these events is src/websword/trap.ts (:76 itemUse, :89 after.playerInteractWithBlock with
        isFirstEvent); playerSwingStart and itemStartUseOn have 0 users; the Orbital module does
        not exist. KV: kv_search + grep -rn over .ai/context/analysis for "swing", "5–6",
        "6–10", "8 blocks", "only marker", "cannot be detected", "RMB = …itemUse". The claim
        feeds xcx8, xq5, adr-orbc, orbc-ad01, orbc-p001, orbc-r006, orbc-r013, orbc-ac08,
        lgnd-ad09, lgnd-p009 and pntr-ac08.
GREEN: n/a — no fix is written (outcome 4). The probe is an instrument, not a fix.
LIVE: the BDS path was run live on a real 1.26.51.1 server (artifact above). The iPad path was
      not run: it needs the device.
```

## Что остаётся человеку

### 1. Оператор, iPad, около 15 минут

Сервер — QA (19134) с текущей сборкой, мир Survival. Прибор для прицела — Паутинный меч.
Он целит только лучом взгляда (trap.ts:167) и пишет строку
`[andrew] web sword trap via <event>: centre …` (trap.ts:138). Сделать обе раскладки:
**A** — сенсор по умолчанию, **B** — Settings → Touch → Split controls.

- **R1 — радиус Use.** Держать стопку камня. Ряд целей на уровне глаз в 3, 4, 5, 6, 7, 8, 10
  блоках. Коснуться каждой. Записать самую дальнюю цель, у которой подсветилась грань и встал
  блок.
- **R2 — радиус Attack.** Пустая рука. Удерживать каждую цель. Записать самую дальнюю, на которой
  пошли трещины.
- **R3 — точка прицела.** Шаг A1 протокола CX02: G в центре экрана, D в 2 блоках правее; коснуться
  D мечом. Кроме строк таблицы CX02, есть новый исход: **ни куба, ни строки лога** — касание по
  блоку не дало ни `itemUse`, ни after-interact, как на BDS. Тогда отгруженный Паутинный меч не
  срабатывает по касанию блока на iPad. Это дефект, и решение по нему — за оператором.
- **R4 — дальнее касание.** Шаг A3 протокола CX02.

Взмах на промахе (ЛКМ 6–10) глазом не виден. Нужна строка `playerSwingStart` в логе сервера, а
её не пишет ни один отгруженный код. Два пути:
- решить xq5 вслепую и доказать ЛКМ-взмах iPad-критерием задачи реализации;
- разрешить dev-пакет-логгер на стабильном API для QA. Это правка конфигурации деплоя, и здесь
  она не сделана.

### 2. Клиент (xq5)

Набор допустимых ответов проверен по API 2.10.0. Варианты (i)–(v) — из разбора CX02. Новый
вариант:
- **(vi)** ЛКМ = `playerSwingStart{Attack}` + луч взгляда ≤ 10, без смены жеста. Работает там,
  где клиент сообщает взмах: мышь, и Split controls — это подтвердить. На сенсоре по умолчанию —
  тоже подтвердить. Вариант (iii) «sneak + use» и частица-маркер (iv) нужны только если (vi) не
  подтвердится.

Вопрос xq5 надо исправить до отправки: «Left-click beyond arm's reach cannot be detected in
either layout» ложно (строка f).

## Поправки к `ad01` и `adr-orbc` §2 (когда их примут; род критерия в скобках)

1. RMB по блоку слушать через `beforeEvents.playerInteractWithBlock` (только чтение, мир не
   менять) или `afterEvents.itemStartUseOn`, а не через after-interact. **Unit** — не проверяется
   без мира; **e2e (bds):** GameTest «use-on-block кастомным предметом по камню активирует
   Пушку» — сейчас красный для набора подписок §2.
2. ЛКМ: `entityHitBlock` (блок в reach) **или** `playerSwingStart{swingSource: Attack}` + луч ≤ 10
   (промах, дальше reach). Дедуп в тике — по `r006`. **e2e (bds):** удар в блок в 8 блоках даёт
   одну активацию; удар в небо — ни одной, кулдаун не тратится.
3. Проверки дальности считать по геометрии блока, а не по `faceLocation` (раздел выше). **Unit:**
   функция дистанции на фиксированных векторах.
4. На iPad — R1–R4 с Пушкой вместо меча (**manual, ipad**).

## Текст резолюции для `refine resolve` (L0-xcx14)

```text
Prepared, awaits a decision (not closed). Measured 2026-09-29 on BDS 1.26.51.1 /
@minecraft/server 2.10.0 with src/gametest/probe-input.ts (artifact
.ai/verify/CNTR-XCX14-AA/2.json, code_sha df8872f).
Spec: §6 part-1:95, :103 and :109 are verified; :109 says an extra marker is "not needed", not
forbidden.
Engine, server side (SimulatedPlayer, Survival and Creative, target at faces 1.5–11.5):
- entityHitBlock, itemStartUseOn and before.playerInteractWithBlock arrive at every distance.
  "About 5–6 blocks" is not a server or API limit; any limit is the client's pick range
  (unmeasured).
- playerSwingStart{Attack} is stable in 2.10.0 and fires for a swing at open sky. The
  "no stable swing event" premise in xcx8, adr-orbc and orbc-r013 is false.
- getBlockFromViewDirection({maxDistance: 10}) inside itemUse, swingStart, entityHitBlock and
  itemStartUseOn returns blocks with entry face ≤ 9.5, none at 10.5; unbounded without
  maxDistance (31.5 seen).
- A no-op custom item used on a block raises neither itemUse nor after.playerInteractWithBlock
  (22/22), only before.playerInteractWithBlock and itemStartUseOn.
- In Creative the block is already air when entityHitBlock runs.
Not measurable on BDS: what the iPad client sends for a tap at 6–10 blocks, which block the
event names, and whether a miss produces a swing, in the default and Split-controls layouts.
Closes when the operator runs R1–R4 (docs/feedback/diagnose-CNTR-XCX14-AA.md) and the client
answers the corrected xq5, which gains option (vi): LMB = swing + view ray.
```

## Дубликаты и расхождения (файл:строка — что на что)

Пути от `.ai/context/analysis/`. Роллапы генерируются из узлов — руками не править, после
регенерации проверить. Правки про `itemUseOn` и «не наблюдалось как факт» уже перечислены в отчёте
CX02 (b8636ff) и здесь не повторяются.

«Нет стабильного события взмаха» — ложно:
- `nodes/xcx8__concept-contradiction.md:23` — «There is no stable event for an attack/swing that hits nothing.» → «`world.afterEvents.playerSwingStart` (stable 2.10.0, `swingSource: Attack`) fires for a swing that hits nothing; whether the iPad client reports it is unobserved.»
- `nodes/xcx8__concept-contradiction.md:28` — «LMB beyond reach cannot fire at all.» → «LMB beyond reach can fire as `playerSwingStart{Attack}` + view ray, where the client reports the swing.»
- `nodes/adr-orbc__concept-architecture-decision.md:29` — «…or the swing animation: there is no stable "swing" event.» → «…: `entityHitEntity` does not fire on blocks. (`playerSwingStart` is stable — see xcx14.)»
- `nodes/adr-orbc__concept-architecture-decision.md:32` — «only a stable workaround such as sneak+Use can deliver it» → «`playerSwingStart{Attack}` + the view ray, or sneak+Use, can deliver it»
- `nodes/orbc-r013__concept-rule.md:27` — «There is no stable "swing at nothing" event.» → «The swing-at-nothing event is `playerSwingStart{Attack}` (stable); its arrival from a touch client is unobserved.»
- `nodes/xq5__concept-client-question.md:20` — «Left-click beyond arm's reach cannot be detected in either layout.» → «Left-click beyond arm's reach can be detected where the device reports the swing (to be confirmed on the iPad).»
- `nodes/lgnd-p009__concept-process.md:38` — «`entityHitBlock` fires only within vanilla reach, so LMB beyond about 6 blocks cannot trigger.» → «`entityHitBlock` needs a block the client picked; LMB beyond that can still arrive as `playerSwingStart{Attack}`.»
- роллапы: `risks.md:448`, `:453`; `contradictions.md:433`, `:438`; `client-questions.md:27`; `project-knowledge/architecture.md:337`, `:340`; `project-knowledge/business-rules.md:682`

«about 5–6 blocks» — не свойство сервера, не измерено на клиенте:
- `nodes/xcx14__concept-contradiction.md:27` — «stable 2.10.0 reports LMB on a block only within vanilla reach, about 5–6 blocks» → «the client picks blocks only within its reach (distance unmeasured; BDS itself delivers entityHitBlock at 11.5)»
- `nodes/xq5__concept-client-question.md:20`, `client-questions.md:27` — «about 5–6 blocks» → «(a few blocks; to be measured on the iPad)»
- `nodes/xcx8__concept-contradiction.md:22` — «fires `entityHitBlock`/`playerBreakBlock`, only within the player's interaction reach» → «…only for blocks the client picked, i.e. within the client's reach (BDS adds no limit of its own)»
- роллапы: `risks.md:419`, `contradictions.md:405`

«pntr/ring iPad ACs all start from "tap a block 8 away"» — ложно:
- `nodes/xcx14__concept-contradiction.md:34`, `risks.md:426`, `contradictions.md:412` — «and `pntr`/`ring`'s iPad ACs, which all start from "tap a block 8 away"» → «`orbc-ac08` case 3 (8 blocks) and the LMB gesture of `pntr-ac08`; `ring-ai11/12/15` put the iPad player as an observer and are not affected»

Подписки RMB — на пути кастомного предмета after-interact и `itemUse` не приходят:
- `nodes/adr-orbc__concept-architecture-decision.md:24` — «RMB = `world.afterEvents.itemUse` (plus … `playerInteractWithBlock` deduped per tick)» → «RMB = `itemUse` (air) plus `beforeEvents.playerInteractWithBlock` or `itemStartUseOn` (block), deduped per tick»
- `nodes/orbc-ad01__concept-architecture-decision.md:28` — источник блока события → «`beforeEvents.playerInteractWithBlock.block` / `itemStartUseOn.block`, `entityHitBlock.hitBlock`»
- `nodes/orbc-p001__concept-process.md:21`, `nodes/orbc-r006__concept-rule.md:21` — список RMB-событий → то же
- роллап: `project-knowledge/architecture.md:332`

«Единственный маркер» — в спеке «не нужен»:
- `nodes/xcx14__concept-contradiction.md:22`, `nodes/orbc-cx02__concept-contradiction.md:22`, `risks.md:299`, `:414`, `contradictions.md:290`, `:400` — «the ordinary vanilla highlight is the only marker» → «an extra marker is not needed (§6 :109); the vanilla highlight is the intended one»

Не KV — код, по рамке задачи не правлю, передаю оператору:
- `src/websword/trap.ts:43–44` — «`itemUse` always fires, and `playerInteractWithBlock` fires as well when the press landed on a block». На BDS для кастомного предмета по блоку не пришло ни то, ни другое (22/22). Тесты меча ходят только через `useItemInSlot`, так что путь «по блоку» не покрыт. Что делает iPad, покажет R3.

Карточек не заведено, в KV ничего не записано.
