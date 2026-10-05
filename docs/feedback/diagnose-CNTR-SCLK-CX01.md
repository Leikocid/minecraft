ИСХОД: 3 — Подчистка знания

# CNTR-SCLK-CX01-AA · CX-sclk-01 · Piercing на Скалковом арбалете

Замер на BDS 1.26.51.1, `@minecraft/server` 2.10.0, приватный инстанс `andrew-bds-sclk1` (порты 19736 и 19760–19769, к нему никто не подключался).
Прогонов два, оба с выходом 0:
- прогон 1 — `dist/sclk-cx01-run1.out`;
- прогон 2 — через `ai-kit run-check`, артефакт `.ai/verify/CNTR-SCLK-CX01-AA/2.json` (code_sha `5f05fe0`, 2026-10-05T17:30:57Z).

Проба и как её повторить:
- проба — `docs/feedback/diagnose-CNTR-SCLK-CX01.probe.ts`;
- пробные предметы и loot-таблицы — `docs/feedback/diagnose-CNTR-SCLK-CX01.pack/`;
- запуск — `ANDREW_BDS_DIR=<инстанс> bash docs/feedback/diagnose-CNTR-SCLK-CX01.repro.sh`.

Строки KV взяты из корневого `.ai/context/analysis` (только чтение). Карточек не заведено, в KV ничего не записано.

**Вердикт.** Утверждение узла (Source B) подтвердилось замером. Слот `crossbow` пускает Piercing на кастомный предмет ровно так же, как на ванильный арбалет. У стабильного 2.10.0 нет хука, который отменил бы результат наковальни или стола. Снятие по `playerInventoryItemChange` работает так, как написано в плане. Поэтому `L0-adr-scpi` остаётся в силе, а Q2 закрыт ответом «предлагает» — значит, отклонение по C-16 остаётся.

Однако в узлах арбалета есть три неверных места (§5):
- фикстуру AC-sclk-15 собрать нельзя;
- цена отклонения для игрока описана как «мгновенная подсказка», а на деле это потерянное зачарование примерно в каждом втором–третьем броске стола;
- Q2 нигде не помечен как отвеченный.

Код ещё не написан, править в нём нечего.

## 1 · Что ответил движок (Q2 из `L0-sclk-p001:25`)

Три предмета:
- `andrew:probe_sclk_xbow` — `enchantable {slot: "crossbow", value: 1}` плюс `minecraft:shooter`, то есть форма варианта A из `L0-adr-scbs`;
- `andrew:probe_sclk_plain` — тот же слот, без shooter;
- `minecraft:crossbow` — вариант B и эталон.

Контроли: `minecraft:bow` и `andrew:web_sword` (слот sword).

| Путь | xbow | plain | vanilla | контроль |
|---|---|---|---|---|
| `canAddEnchantment` piercing 1 / 4 | true / true | true / true | true / true | bow и web_sword: false |
| то же quick_charge 3, multishot 1, unbreaking 3, mending 1 | все true | все true | все true | — |
| то же power 1, sharpness 1 | false | false | false | bow: power true; sword: sharpness true |
| `/enchant <игрок> piercing 4` на предмете в руке | success=1 → `[piercing4]` | success=1 | success=1 | web_sword: success=0 |
| `enchant_with_levels 30`: доля бросков с piercing (прогоны 1 / 2) | 259 / 261 из 400 | 257 / 255 | 271 / 277 | web_sword: 0 / 0 |
| то же, piercing — единственное зачарование | 70 / 84 | 76 / 81 | 65 / 73 | — |
| `enchant_with_levels 1–30`: с piercing / только piercing | 272, 289 / 165, 170 | — | 284, 259 / 165, 149 | — |
| `enchant_randomly`: с piercing / только piercing | 280, 270 / 174, 171 | — | 272, 291 / 172, 173 | — |

Распределение зачарований на `xbow` в каждом прогоне совпадает с ванильным в пределах шума. Пример на уровне 30: multishot 55 и 65, quick_charge 226 и 195 (у ванильного 55 и 50, 209 и 211). Значит, Quick Charge и Multishot, нужные для T14 и T16, этот слот тоже даёт, как и ожидалось.

**Что не измерено.** Экраны наковальни и стола зачарований. У SimulatedPlayer нет API экранов контейнеров, так что результат наковальни и подсказку стола не может запросить ни один сценарий. Вместо них проверены собственные ответы движка: проверка совместимости, команда и генератор случайных чар. На всех трёх путях кастомный предмет неотличим от ванильного арбалета.

Хука в 2.10.0 нет:
- `WorldBeforeEvents` — это effectAdd, entityHeal, entityHurt, entityItemPickup, entityRemove, entityTamed, explosion, itemUse, playerBreakBlock, playerGameModeChange, playerInteractWithBlock, playerInteractWithEntity, playerLeave и weatherChange;
- событий наковальни, стола или крафта среди них нет;
- `playerInteractWithBlock` умеет только не дать открыть блок, но не отклоняет результат.

## 2 · Piercing и Multishot исключают друг друга (новое, в KV этого нет)

| Попытка (xbow и vanilla, одинаково) | Результат |
|---|---|
| сначала multishot 1, потом `canAddEnchantment(piercing 1)` | **бросает** `EnchantmentLevelOutOfBoundsError` («range for type piercing is [0 - 4]»), а не возвращает false |
| сначала multishot 1, потом `addEnchantment(piercing 1)` | бросает ту же ошибку; на стопке остаётся `[multishot1]` |
| сначала piercing 4, потом multishot 1 | зеркально: бросает, остаётся `[piercing4]` |
| `addEnchantments([piercing 4, multishot 1])` | **возвращает без ошибки**, на стопке `[piercing4]`: multishot молча отброшен |
| loot `specific_enchants` [piercing 4, multishot 1] | 400 из 400 бросков дают `[piercing4]` |
| `/enchant piercing 1` на стопке с multishot | success=0, стопка не изменилась |
| генераторы стола: piercing и multishot вместе | 0 из 2 800 бросков в каждом прогоне (7 арбалетных таблиц × 400) |

Что из этого следует:
- арбалет с Multishot получить Piercing не может, по крайней мере по проверке движка;
- под снятие попадают только стопки без Multishot;
- фикстура AC-sclk-15 «piercing 4 + multishot 1» не собирается, а её проверка «it still has multishot» недостижима.

## 3 · Снятие, как его предписывает `L0-adr-scpi` / `L0-sclk-r005`

Обработчик на `playerInventoryItemChange` проходит по контейнеру игрока. Найдя `xbow` или ванильный арбалет с piercing, он делает `removeEnchantment(piercing)` и `setItem`. Входная стопка во всех случаях — piercing 4 + quick_charge 3 + unbreaking 3. Оба прогона дали одинаковый результат.

| Путь входа | Событие (тик от вкладывания) | Снято | Осталось | Всего событий |
|---|---|---|---|---|
| `addItem` | +0, Hotbar#0 | в обработчике, тик +0 | quick_charge3+unbreaking3 | 2 |
| `setItem(20)` | +0, Inventory#20 | +0 | то же | 2 |
| подбор с земли (`spawnItem` у ног) | +1 (подобран на +1) | +1 | то же | 2 |
| сундук → игрок (`transferItem`) | +0 | +0 | то же | 2 |
| `/enchant piercing 4` на предмете в руке (появление чар на месте) | +0 | +0 | `[none]` | 2 |
| ванильный `minecraft:crossbow`, `addItem` | +0 | +0 | quick_charge3+unbreaking3 | 2 |

- Синхронное чтение сразу после вкладывания показывает piercing. На следующем тике его нет ни в одном пути, и замеры на +2, +5, +20 и +40 тоже чистые.
- Второе событие порождает собственный `setItem` снятия (piercing=false). Цикла нет.
- Как именно взятие результата из наковальни или стола попадает в инвентарь, не измерено (§1).
- В release-паке `event.player` для SimulatedPlayer приходит undefined (`src/gametest/main.ts:122-130`). Поэтому GameTest на T15 должен включать боевое снятие внутри gametest-пака, так же как это уже сделано для гейта крафта.

**Приёма снятия зачарований у других легендарок нет.** Поиск `removeEnchantment`, `removeAllEnchantments` и `piercing` по `src/` пуст. Ненужные чары там отсекает выбор слота:
- `packs/behavior/items/miners_pickaxe.json:19` — pickaxe;
- `web_sword.json:25`, `scythe_of_calamity.json:25`, `dragon_katana.json:25` — sword;
- у Пушки компонента enchantable нет вовсе (`src/orbital/README.md:5`).

Единственный код рядом с чарами — их чтение и наложение (`src/structures/loot.ts:121`, `src/selftest/main.ts:114-131`). Арбалет станет первым предметом со снятием.

## 4 · Цена отклонения для игрока (в KV её нет)

Узел и ADR описывают отклонение так: «the player sees it in the tooltip for that moment» и «the momentary tooltip». Замер показывает другую картину:
- Piercing есть в 65 % бросков генератора уровня 30 (520 из 800 за оба прогона) и в 70 % бросков уровней 1–30 (561 из 800);
- единственным зачарованием он оказывается в 19 % (154 из 800) и 42 % (335 из 800) соответственно.

По r005 опыт не возвращается (`sclk-r005:22`). Значит, с этой долей бросков стол съедает опыт и лазурит и отдаёт голый арбалет, а книга Piercing на наковальне тратится впустую.

Это не меняет принятое решение: по ADR отклонение остаётся, если Q2 ответил «предлагает». Но список отклонений в README должен называть эту цену, а не подсказку.

Рассмотренные альтернативы, ни одна не нужна:
- Врождённый Multishot сделал бы Piercing невозможным по §2. Но он навязывает три болта на каждый выстрел и закрывает стол, потому что зачарованный предмет туда не кладут.
- Запрет открывать наковальню или стол, пока у игрока есть арбалет, отнимает Quick Charge и Multishot, разрешённые §8.

## 5 · Подчистка знания — что заменить (выполняет тот, кому положено писать в KV)

1. `nodes/sclk-ac15__concept-acceptance-criterion.md:17-19`, копии `scope.md:822-824` и `project-knowledge/glossary.md:1113-1115`. Заменить «a crossbow stack with `piercing 4` + `multishot 1`» на «`piercing 4` + `quick_charge 3` + `unbreaking 3`», а «it still has `multishot`» — на «it still has `quick_charge 3` and `unbreaking 3`». Добавить: «the production strip is armed in the gametest pack (the release pack reads `event.player` undefined for a SimulatedPlayer)». Обоснование: §2 и §3.
2. `nodes/sclk-cx01__concept-contradiction.md:21`, копии `contradictions.md:203` и `risks.md:210`. Заменить «It sits on the stack until the next inventory-change event strips it, and the player sees it in the tooltip for that moment» на: «The inventory-change event fires in the tick the stack enters the inventory (+1 for a pickup) and the strip lands in that tick (measured 2026-10-05, six server-side paths). The anvil result slot and the table hint are client UI and were not measured on BDS.»
3. `nodes/sclk-cx01__concept-contradiction.md:25`, копии `contradictions.md:207` и `risks.md:214`. Заменить «The probe's Q2 confirms whether … If it does not, this contradiction closes» на: «Q2 measured: the engine admits Piercing on a slot-crossbow custom item (canAddEnchantment, /enchant, enchant_with_levels in 65 % of rolls), so the deviation stays.»
4. `nodes/adr-scpi__concept-architecture-decision.md:31-32`, копия `project-knowledge/architecture.md:313-314`. Строку «The momentary tooltip is listed…» заменить на: «The README C-16 list states the cost: Piercing from a table roll or an anvil book is removed with no refund; enchant_with_levels 30 gives Piercing in 65 % of rolls and Piercing alone in 19 % (levels 1–30: 70 % / 42 %), and such a roll leaves the crossbow bare.» Строку про Q2 пометить как отвеченную (deviation kept), убрать тег `probe-gated`.
5. `nodes/sclk-p001__concept-process.md:25`, копии `adr-scbs__concept-architecture-decision.md:40` и `project-knowledge/architecture.md:186`. Пометить Q2 как отвеченный, с числами из §1. Пометить, что UI наковальни и стола не прогонялся.
6. `nodes/sclk-ad01__concept-architecture-decision.md:29`. К «Consequence» добавить: «Piercing and Multishot exclude each other in the engine, so only a crossbow without Multishot ever reaches the strip.»
7. `nodes/sclk-cons__concept-constraint.md:29`, копия `project-knowledge/business-rules.md:501` (чистый планировщик снятия). Добавить причуду платформы: `addEnchantments` молча отбрасывает конфликтующий элемент и не бросает, а `canAddEnchantment` на конфликте бросает `EnchantmentLevelOutOfBoundsError` вместо false.

Необязательно: `nodes/sclk-r005__concept-rule.md:21` (копия `business-rules.md:594`) перечисляет три триггера. Событие инвентаря сработало на каждом измеренном пути, включая появление чар на месте и `setItem`, через который приходит выдача токена. Смена слота в руке стопку не меняет. Два других триггера лишние, но ничего не ломают.

## 6 · Дубликаты (поиск: `grep -rn -i piercing` по `.ai/context/analysis`, `kv_search`, `chronicle_search`, `task_list`)

Само утверждение, с копиями:
- `nodes/sclk-cx01__concept-contradiction.md:15-25`;
- `contradictions.md:197-207`;
- `risks.md:204-214`.

Решение и его пересказы:
- `nodes/adr-scpi__concept-architecture-decision.md:25-34`;
- `project-knowledge/architecture.md:296-316`;
- `summary.md:63`;
- `nodes/concept-overview.md:57`.

Тот же вывод в соседних узлах:
- `nodes/sclk-ad01__concept-architecture-decision.md:20-29`;
- `nodes/sclk-r005__concept-rule.md:19-24` и копия `project-knowledge/business-rules.md:588-597`;
- `nodes/sclk-ac15__concept-acceptance-criterion.md:15-23` и копии `scope.md:820-828`, `project-knowledge/glossary.md:1111-1119`;
- Q2: `nodes/sclk-p001__concept-process.md:25`, `nodes/adr-scbs__concept-architecture-decision.md:40`, `project-knowledge/architecture.md:186`;
- `nodes/concept-decomposition-plan.md:51` («strip it on sight if the slot cannot exclude it»);
- владение и входы снятия: `nodes/sclk__concept-component.md:35,43`, `project-knowledge/architecture.md:88,96`, `project-knowledge/domain-model.md:348,356`;
- `nodes/sclk-cons__concept-constraint.md:29` и `project-knowledge/business-rules.md:501`;
- `nodes/lgnd__concept-component.md:49`, `project-knowledge/architecture.md:54`, `project-knowledge/domain-model.md:316`.

На доске дубликатов нет: задач по Piercing нет, CNTR-SCLK-CX02 и CNTR-X22 про другое. В хронике по Piercing ничего не нашлось.

## 7 · Блоки разбора

```text
OBSERVED: There is no observation behind L0-sclk-cx01: Source B is the analyzer's text, and probe Q2 never ran (no crossbow code, no probe).
VERDICT: hypothesis. Measured here.
REPRO: docs/feedback/diagnose-CNTR-SCLK-CX01.repro.sh on BDS 1.26.51.1, 2 of 2 runs exit 0.
CAUSE: slot "crossbow" admits piercing on a custom item exactly as on minecraft:crossbow (§1); 2.10.0 has no anvil/table
       before-event; the strip on playerInventoryItemChange lands in the tick of the event, keeping the rest (§3).
       Piercing ⊥ Multishot, so AC15's fixture cannot be built (§2).
PROOF: .ai/verify/CNTR-SCLK-CX01-AA/2.json (exit 0, code_sha 5f05fe0) + dist/sclk-cx01-run1.out.
RULED OUT: "only because of minecraft:shooter" — the no-shooter item answers the same; "the paths ignore the slot" —
           bow/web_sword refuse piercing, ewl30_sword 0/800, /enchant on the sword success=0; "the strip only appears to
           land" — its own setItem raised a second event with piercing=false, still clean at +40.
RADIUS: no code yet; the KV lines in §5–§6 and the future /plan of the crossbow; not a restriction.
GREEN: not applicable. No fix was written; the outcome is a list of KV corrections that this task does not apply.
LIVE: the probe ran on the real BDS (private instance) twice; the anvil and table screens were not driven (no API) and are an iPad check.
```
