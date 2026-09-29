ИСХОД: 3 — Подчистка знания

# Разбор CNTR-COOL-CTR2-AA · CTR-2 (узел `cool-ctr2`)

Какой слот `minecraft:enchantable` у Косы: `hoe` или `sword`. Уже решено
(`decision-scythe-enchantments-slot-sword`, 2026-09-24), выпущено в коде
(`8a8d500`, 2026-09-24) и перемерено в движке 2026-09-29. Работы над кодом по
CTR-2 нет. Описание разошлось с кодом и с замерами в семи файлах KV (13 правок) — список ниже.
Попутно найден и исправлен дефект инструмента: проверка слота в selftest
проходила при любом слоте (раздел «Попутный дефект»).

Все замеры: BDS 1.26.51.1 в Docker (`andrew-bds-ci`, порт 19136),
`@minecraft/server` 2.10.0, код на `32f4aca`, 2026-09-29 19:23–19:4x UTC.

## Intake

```text
OBSERVED: .ai/context/analysis/nodes/cool-ctr2__concept-contradiction.md: спека §1 не называет слот чар Косы (hoe | sword).
          Frontmatter того же узла: closed_at 2026-09-24, closed_reason resolved_by_decision,
          closed_by_ref decision-resolve-cool-ctr2, но в tags одновременно "status:open" и "resolved" (строка 13).
          kv_contradictions(status=open) на 2026-09-29 отдаёт 23 узла; cool-ctr2 среди них нет.
VERDICT: не баг и не смена решения. Развилка закрыта решением на файле и выпущена в коде; остаток — дрейф описаний.
CHECKS: contradiction: decision-scythe-enchantments-slot-sword · duplicate: L0-sitm-adr1 («Q-021 / CTR-012») ·
        criteria writable: yes
UNFOLD: nothing — работы над кодом по CTR-2 нет; подчистка знания списком файл:строка
HUMAN: none
```

## Перепроверка чисел и утверждений узла

| # | Утверждение узла | Чем перемерено | Результат |
|---|---|---|---|
| 1 | база — Diamond Hoe | `grep -n` по спеке | верно: `scytheofcalamityspecv1ruen-part-1.md:23` |
| 2 | урон как Netherite Sword **(8 dmg)** | GameTest `andrew:scythe_melee_matches_netherite`, лог `[gametest] scythe melee: ours=9 netherite=9` | **неверно как урон.** Удар снимает у коровы **9 HP**, ванильный незеритовый меч тоже **9**. 8 — это значение компонента `minecraft:damage` (`scythe_of_calamity.json:22–24`). В спеке числа нет (`part-1.md:25`). Паритет есть: 9 = 9 |
| 3 | «Совместимые ванильные зачарования базового предмета разрешены» | `grep -n` по спеке | цитата обрезана. Полная строка `part-1.md:29`: «…разрешены, **если они не конфликтуют с механикой**» |
| 4 | чары мотыги: Efficiency, Fortune, Silk Touch, Unbreaking, Mending | зонд `canAddEnchantment(<id> 1)` на `minecraft:diamond_hoe` | верно, плюс `vanishing=yes`. Все 6 мечевых чар мотыга отвергает |
| 5 | Unbreaking/Mending бессмысленны при бесконечной прочности | selftest `scythe-no-durability` PASS; зонд `durability=false` | верно: у Косы нет `minecraft:durability`. Движок при этом **принимает** на неё Unbreaking и Mending — они просто ни на что не влияют |
| 6 | мечевые чары: Sharpness/Smite/Fire Aspect/Knockback/Looting | зонд на `andrew:scythe_of_calamity` и `minecraft:netherite_sword` | набор Косы совпадает с набором незеритового меча по всем 12 проверенным id (таблица ниже) |
| 7 | спека не называет слот | `grep -n "slot\|enchant\|чар"` по `scytheofcalamityspecv1ruen-part-*.md` | верно: только `part-1.md:29` и строки про true damage (`part-1.md:73`, `part-2.md:31`) |
| 8 | «выбор слота влияет и на то, копает ли Коса как мотыга» | JSON + вторая половина того же GameTest | **неверно.** Копание задаёт `minecraft:digger` (`scythe_of_calamity.json:25–35`), он от слота не зависит. При `slot=sword` Коса ломает `oak_leaves` за **2 тика**, ванильная алмазная мотыга тоже за **2 тика** |

Зонд `canAddEnchantment(level 1)` в движке (временная проверка selftest, в коммит не вошла; одинаково во всех трёх загрузках bds:check):

| id | scythe_of_calamity | diamond_hoe | netherite_sword |
|---|---|---|---|
| sharpness, smite, bane_of_arthropods, knockback, fire_aspect, looting | yes ×6 | no ×6 | yes ×6 |
| efficiency, fortune, silk_touch | no ×3 | yes ×3 | no ×3 |
| unbreaking, mending, vanishing | yes ×3 | yes ×3 | yes ×3 |
| `durability` component | false | true | true |

## Investigation

```text
REPRO: вопроса «какой слот» в коде нет: packs/behavior/items/scythe_of_calamity.json:18–21 = { "slot": "sword", "value": 10 },
       ввёл 8a8d500 (2026-09-24, SC-ITEM-01-AA) — единственный коммит этого файла (git log -S'"slot": "sword"').
CAUSE: противоречие закрыто решением decision-scythe-enchantments-slot-sword → decision-resolve-cool-ctr2 (оба 2026-09-24);
       узел закрыт, но тег "status:open" не снят (cool-ctr2__concept-contradiction.md:13; тот же дефект у cool-ctr1/3/4 — все
       закрыты 2026-09-24 и все попали в эту волну). Как их выбрала очередь, не измерено: сегодня kv_contradictions(status=open)
       их не отдаёт.
PROOF: в движке Коса принимает ровно набор незеритового меча и отвергает efficiency/fortune/silk_touch (таблица выше);
       selftest scythe-enchantable PASS ×3; GameTest scythe_melee_matches_netherite PASS, ours=9 netherite=9,
       копание 2 = 2 тика. Артефакт: .ai/verify/CNTR-COOL-CTR2-AA/2.json (run_kind against_workspace, sha 32f4aca).
RULED OUT: «код всё же на слоте hoe, решение не выпущено» — убито замером: diamond_hoe sharpness=no, Коса sharpness=yes,
           efficiency=no. Собственная проверка слота в selftest в этом не свидетель (см. «Попутный дефект»): она проходит при
           любом слоте, поэтому вывод опирается на canAddEnchantment, а не на enchantable.slots.
```

## Попутный дефект — проверка слота в selftest проходила при любом слоте

Найден, пока проверял свой же инструмент доказательства. Исправлен в этом прогоне (коммит `01dadd9`, один файл `src/selftest/main.ts`).

```text
OBSERVED: зонд печатал enchantable.slots как [null] у всех трёх предметов, включая ванильные.
VERDICT: баг (само собой разумеющееся ожидание: проверка, которая не может упасть, — не проверка).
REPRO: scratchpad-скрипт slot-mutation-check.sh (текст ниже) ставит pickaxe→sword, web_sword→axe, scythe→axe и запускает bds:check;
       на 32f4aca: exit=0, PASS pickaxe-enchantable / web-sword-enchantable / scythe-enchantable — неверный слот пойман 0/3.
CAUSE: src/selftest/main.ts (до правки :314-318, :351-355, :386-390) — slots.includes(EnchantmentSlot.X). В рантайме
       EnchantmentSlot — пустой объект (keys=0, .Sword === .Hoe === undefined), ItemEnchantableComponent.slots === [undefined]
       у любого предмета → includes(undefined) === true. Вторая половина не различала слоты: unbreaking принимают кирка,
       меч и топор; sharpness — меч и топор.
PROOF: .ai/verify/CNTR-COOL-CTR2-AA/1.red.json (--expect-red, sha 32f4aca); лог зонда:
       probe-ctr2-enum typeof=object Sword=undefined Hoe=undefined keys=0;
       probe-ctr2-slots <все 3 предмета> len=1 raw=undefined incSword=true incHoe=true incPickaxe=true incBow=true.
RULED OUT: «не читаются только кастомные слоты» — у minecraft:diamond_hoe и minecraft:netherite_sword тоже [undefined],
           у меча incHoe=true. Дело в поверхности API, а не в наших JSON.
RADIUS: читатель — scripts/bds-check.mjs по строкам «[selftest] PASS/FAIL <name>»; имена и контракт вывода не менялись.
        В KV пустая половина цитируется как факт: nodes/pick-r002__concept-rule.md:19, nodes/pick-ac06__concept-acceptance-criterion.md:15
        (в списке подчистки, пп. 12–13). decision-q-007 опирается на canAddEnchantment=true — эта половина осталась.
        Искал: grep по именам проверок, EnchantmentSlot и .slots в src, scripts, tests, docs, README, .ai/context.
        Guard, не restriction: отвергает только предмет на слоте, отличном от объявленного; все три выпущенных предмета на
        своих слотах (чистый зелёный прогон ниже).
```

Правка: `assertEnchantSet(itemId, accepts, refuses)` — пара, которую объявленный слот принимает, а соседи отвергают.
Кирка: принимает `unbreaking` + `efficiency`, отвергает `sharpness`. Паутинный меч и Коса: принимают `sharpness`, отвергают `efficiency`.
Пустая проверка `slots.includes` удалена, причуда платформы записана комментарием у хелпера.

`slot-mutation-check.sh` (scratchpad, воспроизводится из корня worktree):

```bash
ITEMS=(packs/behavior/items/miners_pickaxe.json packs/behavior/items/web_sword.json packs/behavior/items/scythe_of_calamity.json)
trap 'git checkout -- "${ITEMS[@]}"' EXIT
# node: miners_pickaxe slot -> "sword", web_sword -> "axe", scythe_of_calamity -> "axe"
npm run bds:check >/dev/null 2>&1; rc=$?
# exit 0 только если rc != 0 и в dist/bds-check.log все три «[selftest] FAIL *-enchantable»
```

## Подчистка знания: дубликаты и разошедшиеся копии (файл:строка — что на что)

Путь от `.ai/context/analysis/`.

1. `nodes/cool-ctr2__concept-contradiction.md:13` — в tags `"status:open"` → `"status:resolved"`: узел закрыт 2026-09-24, а тег открытый.
2. `nodes/cool-ctr2__concept-contradiction.md:21` — «melee damage = Netherite Sword (8 dmg)» → «melee damage = Netherite Sword (`minecraft:damage: 8`; удар снимает 9 HP, как ванильный незеритовый меч, замер GameTest на BDS 1.26.51.1)».
3. `nodes/cool-ctr2__concept-contradiction.md:22` — дописать обрезанную цитату: «…разрешены**, если они не конфликтуют с механикой**».
4. `nodes/cool-ctr2__concept-contradiction.md:26` — «This also affects whether the Scythe can mine like a hoe.» → удалить: копание задаёт `minecraft:digger`, не слот (замер: 2 тика = 2 тика при `slot=sword`).
5. `nodes/sitm-adr1__concept-architecture-decision.md:6` и `:18` — «resolving Q-021 / CTR-012» → «resolving Q-021 / CTR-2 (`cool-ctr2`)». Метка CTR-012 занята: в `nodes/scyt-ac16__concept-acceptance-criterion.md:27`, `scope.md:475` и `project-knowledge/glossary.md:727` CTR-012 означает вопрос о выполнимости off-hand.
6. `nodes/sitm-adr1__concept-architecture-decision.md:20` — «the tension this open contradiction (CTR-012) flags» → «…this contradiction (CTR-2, resolved 2026-09-24) flagged»; «since the item never mines» → «its hoe digger (speed 8, `is_hoe_item_destructible`) is independent of the enchant slot».
7. `nodes/sitm-adr1__concept-architecture-decision.md:24` — «(sword-damage, no-mining) design» → «(sword-damage) design»: выпущенный предмет копает (`L0-scyt-cx03`, замер 2 = 2 тика).
8. `nodes/sitm-adr1__concept-architecture-decision.md:26` — «Informs the resolution of CTR-012 …; the reducer should mark it accordingly.» → «Resolved by `decision-scythe-enchantments-slot-sword` (`cool-ctr2` closed 2026-09-24).»
9. `nodes/scyt-ac15__concept-acceptance-criterion.md:23` — «the enchanting table and anvil accept sword enchantments (Sharpness, Fire Aspect)» → «selftest `scythe-enchantable`: engine accepts `sharpness` and refuses `efficiency` (`canAddEnchantment`); the enchanting-table and anvil UI are not exercised on BDS». Fire Aspect в коммитнутых проверках не участвует; принят движком только в зонде этого разбора.
10. `nodes/scyt-ac15__concept-acceptance-criterion.md:24` — «whether hoe enchantments such as Efficiency apply, is **not verified**» → «hoe-only enchantments (efficiency, fortune, silk_touch) are refused by the engine (measured 2026-09-29); tilling is still not verified (`cx03`)».
11. `decisions/decision-scythe-enchantments-slot-sword.md:10`, `:16` и `decisions.md:431` — обоснование «мечевые чары (Sharpness, Unbreaking)» → «(Sharpness, Smite, Fire Aspect, Knockback, Looting)»: Unbreaking на предмете без прочности ни на что не влияет — тот же довод, которым решение отвергает чары мотыги. Само решение (slot=sword) не меняется.
12. `nodes/pick-r002__concept-rule.md:19` — «and that `EnchantmentSlot.Pickaxe` is among the enchantable slots» → «and that the engine accepts unbreaking + efficiency and refuses sharpness (`enchantable.slots` reads `[undefined]` on 2.10.0, so slot membership is not observable)».
13. `nodes/pick-ac06__concept-acceptance-criterion.md:15` — «`EnchantmentSlot.Pickaxe` is among its enchantable slots» → «`canAddEnchantment` accepts unbreaking and efficiency and refuses sharpness»; ссылку «L127-150» → на `pickaxe-enchantable` без номеров строк (файл сдвинулся).

Смежные узлы, не дубликаты: `L0-scyt-cx03` (hoe-теги, digger, группа меню, вспашка — остаётся открытым, к CTR-2 относится только п. 8 таблицы выше); `ASM-scyt-03` / `decision-scythe-melee-damage-8-…` называют 8 значением компонента, это верно.

## Текст резолюции для refine resolve

> CTR-2 (`cool-ctr2`) уже решено 2026-09-24 (`decision-scythe-enchantments-slot-sword`, `decision-resolve-cool-ctr2`): `minecraft:enchantable` slot=`sword`, value 10 (`packs/behavior/items/scythe_of_calamity.json:18–21`, коммит `8a8d500`). Перемерено 2026-09-29 на BDS 1.26.51.1 / @minecraft/server 2.10.0: движок принимает на Косу sharpness, smite, bane_of_arthropods, knockback, fire_aspect, looting, unbreaking, mending, vanishing и отвергает efficiency, fortune, silk_touch — совпадение с `minecraft:netherite_sword` 12/12; `minecraft:diamond_hoe` — обратный набор по боевым и мотыжным чарам. Удар Косой снимает 9 HP, ванильным незеритовым мечом — 9 HP (GameTest `scythe_melee_matches_netherite`); «8» в узле — значение `minecraft:damage`, не урон. Слот не влияет на копание: `minecraft:digger` отдельный компонент, `oak_leaves` — 2 тика у Косы и 2 тика у алмазной мотыги. Узел закрыт; снять тег `status:open` и поправить копии по списку разбора.

## Proof

По CTR-2 код не менялся — доказательство тут в замерах (Investigation). Ниже — только попутная правка selftest.

```text
GREEN: тот же slot-mutation-check.sh на 01dadd9 — bds:check exit=1, неверный слот пойман 3/3, каждая проверка падает на своей паре:
         FAIL pickaxe-enchantable: the engine refuses efficiency 1 on andrew:miners_pickaxe
         FAIL web-sword-enchantable: the engine accepts efficiency 1 on andrew:web_sword — …not on the enchant slot it declares
         FAIL scythe-enchantable: the engine accepts efficiency 1 on andrew:scythe_of_calamity — …not on the enchant slot it declares
       Артефакт .ai/verify/CNTR-COOL-CTR2-AA/1.json (exit 0, sha 01dadd9). Против ложного зелёного: красный и зелёный —
       один скрипт, одни мутации, один стенд (andrew-bds-ci, свежий мир на каждый прогон); тексты FAIL называют ту
       чару, которая различает слоты, — то есть проверка дошла до движка, а не упала на опечатке id.
LIVE: npm run bds:check на 01dadd9 с настоящими JSON — PASS; pickaxe-enchantable / web-sword-enchantable / scythe-enchantable
      PASS во всех трёх загрузках; DONE passed=22/22/18 failed=0. Артефакт .ai/verify/CNTR-COOL-CTR2-AA/4.json (exit 0, sha 01dadd9).
ATTEMPT: 1
```

Артефакты (все в корневом `.ai/verify/CNTR-COOL-CTR2-AA/`; номера файлов — слоты run-check, к критериям задачи смыслом не привязаны):

| файл | что | exit | sha |
|---|---|---|---|
| `2.json` | GameTest `scythe_melee_matches_netherite` (урон 9 = 9, копание 2 = 2 тика) | 0 | 32f4aca |
| `1.red.json` | мутация слотов против старого selftest — не поймана 0/3 | 1 (ожидаемо) | 32f4aca |
| `1.json` | та же мутация против нового selftest — поймана 3/3 | 0 | 01dadd9 |
| `4.json` | чистый bds:check с новым selftest | 0 | 01dadd9 |

Зонд чар (таблица выше) шёл во временной правке selftest поверх 32f4aca, в коммит не вошёл, отдельного артефакта нет —
строки `[probe-ctr2]` и `[andrew] probe-ctr2*` в `dist/bds-check.log` тех прогонов (19:24–19:30 UTC). Первый прогон зонда
bds:check пометил FAIL только из-за строк зонда без префикса `[andrew]`; selftest в нём — passed=23 failed=0.

## Сказано оператору словами (не карточкой)

Все четыре узла кластера `cool-ctr1…4` закрыты 2026-09-24 (`closed_at`, `closed_reason: resolved_by_decision`), но несут
тег `status:open` рядом с `resolved`, и все четыре попали в эту волну. `kv_contradictions(status=open)` сегодня их не отдаёт,
так что путь, которым они вошли в очередь, этим разбором не измерен.
