# Пробы под Скалковый арбалет — SCLK-PROBE-01-AA (L0-sclk-p001, L0-sclk-ac21)

Замеры движка, на которых стоят `L0-adr-scbs`, `L0-adr-scdm` и `L0-adr-sctr`. Кода арбалета нет.

- **Стенд.** BDS 1.26.51.1, `@minecraft/server` 2.10.0, Docker под Rosetta. Приватный инстанс `dist/bds-sclkp`
  (`andrew-bds-sclkp`, порты 19446 / 19470–19479 / 7871), к нему никто не подключался. В те же минуты на машине
  шли полные прогоны двух соседних агентов, поэтому миллисекунды в п. 4 взяты под нагрузкой.
- **Сценарии.** Семь сценариев `probe_sculk_*` в `src/gametest/sculk-probe.ts`.
- **Пробные предметы.** В dev-пак `packs/gametest/` положены `items/probe_sculk_shooter.json` (форма
  `L0-sclk-ent1`: `charge_on_draw`, draw 1.25 с, слот `crossbow`) и две сущности на рантайме снежка:
  - `bolt` — `L0-sclk-ent2` буквально: `power` 0, gravity 0.05, inertia 0.99, **без `on_hit`**;
  - `bolt_roh` — болт из разбора X23: `impact_damage` 0 + `remove_on_hit`.
  
  Этих путей нет в touches задачи. Без них нечем мерить пп. 1–2. В релизный архив dev-пак не попадает
  (`tests/gametest-pack.test.mjs`).
- **Откуда числа.** Прогоны `--only` 2026-10-05:
  - 20:39 UTC — P2–P5;
  - 20:41 UTC — P1;
  - 20:47 UTC — все семь, тот же код, что в коммите;
  - 20:35 UTC — ранняя редакция, из неё взяты только миллисекунды P4: код замера тот же.
  
  Где прогоны расходятся, дан диапазон. Строки RESULT в приложении — из прогонов 20:39 и 20:41.
- **Гейт.** Артефакты `.ai/verify/SCLK-PROBE-01-AA/`: `1.json` — пробы (критерии 1, 2), `5.json` — типы, тесты,
  сборка и полный набор (критерий 5).

## 1. Подмена выпущенного снаряда — `entitySpawn`; `projectileShoot` в 2.10.0 нет

| Замер | Число | Контроль |
|---|---|---|
| `world.afterEvents.projectileShoot` | **нет** во время выполнения и в типах 2.10.0. Про снаряды есть только `projectileHitEntity` и `projectileHitBlock` | `entitySpawn` на месте |
| Тик `entitySpawn` стрелы | **+0** от нажатия, в тик `itemUse`: 16 стрел из 16 за прогон (10 выстрелов), 2 прогона. Так у ванильного арбалета и у кастомного shooter | — |
| Что читается в обработчике | `owner` = стрелок (16/16); `getVelocity()` = 3.12–3.17 (арбалет), 2.97–3.03 (shooter) | — |
| Урон стрелы при подмене в упор (2 блока) | **0** событий урона в 2 прогонах. Болт попал в цель на +1 | без подмены та же стрела попадает на +1: **10.28–11.60** projectile |
| Видна ли удалённая стрела серверу | 0 замеров позиции после тика спавна (7 подменённых стрел за прогон) | неподменённая стрела — 14 замеров |
| «Скачок» болта | Болт рождается в точке и со скоростью стрелы (Δ **0.00** по построению). Против неподменённой стрелы *другого* выстрела v0 Δ 0.02–0.06, а на +1/+2/+3 Δ **0.05–0.14 / 0.05–0.18 / 0.08–0.23** (bolt_roh) и **0.09–0.16 / 0.09–0.21 / 0.11–0.27** (bolt). Это разброс прицела между двумя выстрелами, 2 прогона | в скриптовом коридоре P2b болт и стрела с одним стартом дают Δ 0.00 на каждом тике |
| Multishot, ванильный арбалет | **3 стрелы в одном тике**, yaw ≈ −10 / 0 / +10° (−9.48 / +0.76 / +10.33 и −10.39 / +0.22 / +9.31), на заряд списана 1 стрела. Подмена дала 3 болта, 3 разных id и 3 отдельных попадания в стену (x = 1/3/5) | без Multishot 1 стрела |
| Multishot, кастомный shooter (форма ent1) | **3 стрелы в одном тике**, 1 стрела списана, но **веера нет**: yaw в пределах ±0.4° (−0.37 / −0.21 / +0.39 и +0.15 / +0.28 / −0.38). Все три легли в одну клетку | тот же shooter без чар — 1 стрела |

**Отрицательные контроли:** неподменённая стрела (урон 10.28–11.60, 14 замеров позиции), без Multishot — 1 снаряд.

**Не измерено, только iPad:** мигнёт ли у клиента стрела, удалённая в тик своего спавна. Сервер её не видит ни
одного тика.

## 2. Болт на рантайме снежка

| Замер | Число | Контроль |
|---|---|---|
| Компоненты снаряда во время выполнения | у стрелы, bolt и bolt_roh одинаково: gravity **0.05**, airInertia **0.99**, liquidInertia **0.60**, stopOnHit false. Различие одно: bounce у стрелы true, у болтов false | — |
| Полёт против стрелы с той же скоростью (2.0 и 3.1 бл/тик горизонтально, навес 0.5/1.0) | Δ позиции **0.00** на +1/+3/+5/+8/+10. Приземление в тот же тик (+15/+15/+28) и в ту же клетку | стрела и есть контроль |
| `power: 0` (ent2) | не мешает: `shoot(v)` задаёт скорость как есть (3.10 на +1) | — |
| `projectileHitEntity` | bolt и bolt_roh поднимают его на +2 (выстрел в 2 бл/тик) и на +1 (в упор), урона 0 | стрела: событие + **4.00** урона; промах в 1.2 блока: **0** событий |
| `projectileHitBlock` | у обоих: при 3 бл/тик на +5, при 0.5 на +10 (колонна 12.5 / 6.5 над полом) | — |
| **Болт ent2 без `on_hit`** | **не останавливается ни о что.** Проходит сквозь цель, каменную стену, грунт и **бедрок**: событие на каждый блок (`stone`, `dirt`, `bedrock`), до удаления под миром на +11…+45. После цели в P2c пролетел ещё 23 блока | `bolt_roh` удаляется в тик первого попадания (+2 / +4 / +5) |
| `e.projectile.id` в обработчике попадания `bolt_roh` (уже удалён) | читается: все 17 попаданий bolt_roh (P1, P2, P2b, P2c) сопоставлены с записью по id | — |
| Вода, 6 блоков | замедляет **всех трёх одинаково** (×0.6 за тик). На 3 бл/тик: vy −3.06 → **−1.89** в первый тик в воде, но пол достигнут на **+5**, как в воздухе. На 0.5 бл/тик: тонет со скоростью ≈ **0.15** бл/тик, за 30 тиков не дошёл до пола (0.92 над ним) | воздух: пол на +5 / +10 |
| Лава, 6 блоков | **никакого действия**: путь, vy и тик удара как в воздухе (+5 / +10). Болты не уничтожаются. Стрела загорается (`onFire` 159) | воздух |
| Паутина, 1 блок | **никакого действия** на обеих скоростях: путь тот же до сотых | воздух |

**Отрицательные контроли:** столб воздуха для каждой среды; стрела для полёта и для попадания (4.00 урона);
промах на 1.2 блока (0 событий `projectileHitEntity`).

## 3. Частица `minecraft:sonic_explosion` — признака видимости на сервере нет, закрывает только глаз на iPad

| Замер | Число |
|---|---|
| `spawnParticle(sonic_explosion)` по трём падающим дугам, 3 точки на болт за тик, 20 тиков | 180 вызовов, **0** исключений, ≤ **1 мс** за тик |
| Залп 300 вызовов в одном тике | 0 исключений, **1 мс** |
| Контроль: несуществующий id `andrew:no_such_particle` | **не бросает** (как на катане) |
| Контроль: незагруженная точка | бросает `LocationInUnloadedChunkError`, то есть вызов доходит до движка |
| `/particle minecraft:sonic_explosion …` против `/particle andrew:no_such_particle …` | **successCount=1 у обоих**: команда id тоже не проверяет |
| Строка `sonic_explosion` в бинарнике `bedrock_server-1.26.51.1` | **0** вхождений (`grep -a`). Сервер не знает id частиц и проверить их не может |

Признака видимости, который можно получить на сервере, **нет**. «Не упало» ничего не доказывает, и
`/particle` тоже. Видна ли частица, вызванная скриптом, и как она выглядит вдоль траектории, проверяется
**только глазами на iPad** (`L0-sclk-ac23`).

Единственный косвенный признак — внешний, в игре не проверен. В ванильном RP Mojang (`Mojang/bedrock-samples`, тег
`v1.26.50.4`, `resource_pack/particles/sonic_explosion.json`) id `minecraft:sonic_explosion` определён:
- 1 частица на вызов, живёт **0.8 с**;
- billboard **1.5×1.5**, `lookat_xyz`, flipbook из 16 кадров;
- ускорение вверх 2 при сопротивлении 2.5;
- переменных Molang не требует, то есть `MolangVariableMap` не нужен.

Это значит, что у клиента такой id есть. Что он рисуется, это не значит.

Две детали из того же файла, без проверки:
- альфа в `particle_appearance_tinting` записана как `0`;
- клиентский файл Варден на частицу не ссылается: её, по-видимому, порождает код движка.

## 4. Резка рельефа: сколько клеток за тик и `fillBlocks` на 5×5×3

Клетки камня в воздухе рядом с тестом, по 2 прогона на размер. «Тик» — время между продолжениями GameTest
в соседних тиках, норма 50 мс.

| Клеток за тик (`getBlock` + `setType(air)`) | 20:35, мс: пачка / тик | 20:39 | 20:47 |
|---|---|---|---|
| 0 (контроль) | 0 / 50, 50 | 0 / 51, 50 | 0 / 47, 50 |
| 75 | 3–6 / 45–50 | 2–4 / 50–51 | 2–3 / 51 |
| **300** (`CARVE_BUDGET_PER_TICK`) | 9–16 / 54–55 | 6–7 / **51** | 7–8 / 50 |
| 600 | 17–24 / 48 | 12–13 / 49 | 12–13 / 50–51 |
| 1200 | 27–34 / 49–50 | 35–38 / 48–49 | 27 / 49–50 |
| **2400** | 53–60 / **55–62** | 47–61 / **55–63** | 48 / 49 |

- **До 1200 клеток за тик тик не растягивается ни в одном из трёх прогонов.** Следующий приходит через 48–51 мс.
- **2400 — на краю.** Пачка 47–61 мс; тик растянулся до 55–63 мс в двух прогонах из трёх, а в третьем уложился
  (48 мс, тик 49). Граница — примерно 50 мс скриптовой работы за тик.
- Бюджет 300 занимает 6–16 мс, запас примерно ×4.
- Варианты: `setType(sculk)` на 300 клеток — 6–8 мс; `dimension.setBlockType(air)` без чтения блока на 1200 —
  8–17 мс. Это в 2–4 раза дешевле, чем `getBlock` + `setType`.

`fillBlocks`:

| Случай | Число |
|---|---|
| 5×5×3 камня → воздух | вернул **75**, за 0 мс, прочитано 75/75 воздуха |
| Тот же объём повторно, он уже воздух | вернул **0**: считаются только изменённые клетки |
| `blockFilter.excludeTypes` [chest, bedrock, obsidian] | вернул **72**, эти три клетки остались на месте, предметов 0 |
| Без фильтра, сундук с алмазом в объёме | вернул 75. **Сундук исчез вместе с алмазом, выпало 0 предметов** |
| Тот же сундук через `Block.setType(air)` | **алмаз выпал** (1 предмет) |
| `ListBlockVolume` из 51 клетки (эллипсоид) | вернул **51** за 1 мс. 51/51 клеток воздух, остальные клетки 5×5×3 остались камнем |
| Через границу чанка (x = 0, x −2…2) | вернул 75, воздух 75/75 |
| Контроль: объём в незагруженных чанках | бросает `UnloadedChunksError: … (1) unloaded chunk(s) out of (1)`; с `ignoreChunkBoundErrors` возвращает **0** |

Предел одной заливки в 32 768 клеток (`FILL_CELL_LIMIT`) здесь не задет: самая большая заливка — 2 560 клеток
за 4–8 мс.

**Отрицательные контроли:** пустая пачка (тик 50 мс), повторная заливка уже пустого объёма (0), заливка
незагруженного чанка (бросает).

## 5. Скалк: все поверхности и перезагрузка чанка

Площадка в 512 блоках от теста держится `tickingarea`. Под каждым блоком камень, над ним воздух.

| Замер | Число |
|---|---|
| `setType("minecraft:sculk")` по голым поверхностям | **40 из 40** читаются как `minecraft:sculk`, отказов нет |
| Перезагрузка чанка | после снятия tickingarea чанки выгружены через **1** тик (`isChunkLoaded` false, `getBlock` undefined). После загрузки снова **45 из 45** клеток скалка на месте |
| Что лежало сверху | `short_grass` исчезла без предмета, **`poppy` слетел и выпал предметом**; `snow_layer`, `white_carpet`, `torch` остались на скалке и пережили перезагрузку |

Список поверхностей: grass_block, dirt, coarse_dirt, podzol, mycelium, dirt_with_roots, mud, clay, sand, red_sand,
gravel, stone, cobblestone, mossy_cobblestone, deepslate, cobbled_deepslate, tuff, calcite, andesite, diorite,
granite, sandstone, red_sandstone, hardened_clay, snow, ice, packed_ice, moss_block, netherrack, soul_sand,
soul_soil, basalt, blackstone, end_stone, oak_planks, oak_log, brick_block, dripstone_block. Плюс камень,
открытый только сбоку (стена кратера), и камень, открытый только снизу (потолок).

Спека (§7) поверхности не перечисляет. Список взят из `L0-sclk-r004`: твёрдый полный блок с воздухом или
проходимым блоком над открытой гранью.

**Отрицательный контроль — где возможен.**
- Выгрузку доказывают `isChunkLoaded` = false и `getBlock` = undefined. Без них перезагрузка ничего бы не
  доказала.
- До замены каждая клетка читалась своим блоком: «not placed as asked []».
- Контроля «блок, который не переживает перезагрузку» **нет и быть не может**: движок сохраняет любую запись
  блока. Поэтому сравнивать не с чем.

## Решения KV: что подтверждено и что опровергнуто

В KV ничего не записано. Статусы меняет ведущий агент.

| Решение | Вердикт | Чем |
|---|---|---|
| **L0-adr-scbs** — вариант A, кастомный shooter | **подтверждено** | Гейт 1: стреляет и списывает 1 стрелу на заряд (10 зарядов: 64 → 54). Гейт 4 закрыт ранее (CX02). Гейт 2 закрыт ранее (CX01) |
| L0-adr-scbs, гейт 3 — Multishot / Quick Charge нативно | **Multishot — частично**: 3 стрелы за 1 боеприпас нативно, но веера нет (±0.4° против ±10° у ванилы). **QC — нет** (CX02) | P1. Риск-текст ADR «Multishot = два лишних болта на ±10°» ошибается в количестве: третий и второй снаряды уже есть, нужен только поворот боковых на ±10° при подмене |
| **L0-adr-scdm** §1 — подмена в тике спавна | **подтверждено** | P1: `entitySpawn` на +0 с владельцем и скоростью; урона от стрелы 0 против 10.28–11.60; болт стартует с состоянием стрелы, P2b — тот же путь; Multishot → 3 болта, 3 записи. `projectileShoot` в 2.10.0 нет, `L0-sclk-p002`, шаг «trigger», остаётся на `entitySpawn` |
| L0-adr-scdm §1 — гравитация и сопротивление как у стрелы (`L0-sclk-as01`) | **подтверждено точно** | P2b: 0.05 / 0.99 / 0.60 у всех, Δ 0.00 на 10+ тиках, приземление тот же тик и клетка |
| L0-adr-scdm §2 — попадания через `projectileHitEntity` / `projectileHitBlock` | **подтверждено** для болта с `remove_on_hit` | P2c, P2: одно событие, болт удалён в тот же тик, id читается |
| **L0-sclk-ent2** — «`remove_on_hit` отсутствует, болт удаляет скрипт» | **опровергнуто как безопасное** | P2/P2c: без `on_hit` болт летит сквозь сущность, стену и бедрок, поднимая событие на каждый блок. Скрипт должен удалить его в первом же обработчике, иначе второе событие придёт на следующем тике. `remove_on_hit` закрывает это на стороне движка |
| L0-adr-scdm §3 — урон | **не мерилось здесь** | закрыто разборами X22/X23 (`sonicBoom` / `setCurrentValue`) |
| L0-adr-scdm §4 / `L0-sclk-ad02` — `sonic_explosion` из скрипта | **не решается на сервере** | P3: признака видимости нет, решает только iPad |
| **L0-adr-sctr** §2 — бюджет 300 `setType` за тик | **подтверждено** | P4: 300 клеток — 6–16 мс, тик 50–55 мс. До 1200 тик не растягивается ни разу; 2400 растянул тик до 55–63 мс в 2 прогонах из 3 |
| L0-adr-sctr §2 / `L0-sclk-ad04`, отвергнутое «`/fill` по слою: прямоугольник не выразит форму, fill игнорирует deny list» | **опровергнуто для `Dimension.fillBlocks`** | P4: `ListBlockVolume` берёт ровно 51 перечисленную клетку; `blockFilter.excludeTypes` сохраняет блоки из списка. Это вариант, не обязанность. Для `/fill`-команды не проверялось |
| `L0-xasm25` — «контейнеры высыпаются, это факт движка» | **верно только для `setType`** | P4: `setType(air)` высыпал алмаз. `fillBlocks` удалил сундук вместе с содержимым, 0 предметов |
| L0-adr-sctr — скалк постоянный (`L0-sclk-r004`, `ac13`) | **подтверждено** | P5: 40/40 поверхностей, 45/45 клеток после перезагрузки чанка. Рестарт сервера не мерился |
| `L0-sclk-r004` / «никаких выпадений» | **с оговоркой** | P5: цветок на поверхности, ставшей скалком, слетает предметом (`poppy`) |
| L0-adr-sctr §3 — общий deny list (`xcx25`) | **не мерилось** | вне пяти пунктов |

## Чего эта проба не доказала

- **iPad.** Частица, мигание удалённой стрелы, вид веера — не смотрели.
- **Продуктовый пак и SimulatedPlayer.** Владелец и скорость стрелы прочитаны в gametest-паке. Релизный пак
  читает SimulatedPlayer как `undefined` (`src/gametest/main.ts:124-130`, `src/gametest/ufo-core.ts:5`). Значит,
  `projectile.owner` стрелы, выпущенной SimulatedPlayer, в продуктовом обработчике почти наверняка будет
  `undefined`. GameTest на подмену придётся строить так же, как гейт крафта и T15, — это вывод, не замер.
- **Нагрузка.** Миллисекунды п. 4 сняты в мире без игроков, на машине с двумя чужими прогонами. На сервере с
  игроками запас меньше.
- **Урон Вардена по Normal (Q8)** и рестарт сервера для скалка (`ac13`) в пять пунктов задачи не входят.

## Приложение — строки RESULT (сокращены)

```text
P1 RESULT projectileShoot: world.afterEvents.projectileShoot absent; members matching /projectile|shoot/: [projectileHitEntity, projectileHitBlock]; control entitySpawn present
P1 RESULT near control (vanilla crossbow, target 2 blocks): arrows 1: arrow[owner=self |v0|=3.16 spawn@press+0 hitEntity target@+1 removed@+1 samples=0]; no swap; target hurt [projectile:11.60 by player proj arrow @press+1]; item events [use@+0]
P1 RESULT near swap->bolt_roh: arrows 1: arrow[owner=self |v0|=3.17 spawn@press+0 removed@+0 samples=0]; swapped to bolt_roh: bolt_roh[owner=self hitEntity target@+1 removed@+1]; target hurt []
P1 RESULT near swap->bolt (ent2): … bolt[owner=self hitEntity target@+1 hitBlock stone+2 hitBlock stone+3 hitBlock grass_block+4 … hitBlock bedrock+8 samples=14]; target hurt []
P1 RESULT far control single: arrow[owner=self |v0|=3.14 v0=-0.03,0.00,3.14 spawn@press+0 hitBlock stone@…,15.00+4 samples=14]
P1 RESULT far control multishot: arrows 3 (v0.x -0.52 / 0.04 / 0.56), all spawn@press+0, hitBlock stone x=1/3/5 @+4
P1 RESULT far swap->bolt_roh multishot: 3 arrows removed@+0 samples=0; 3 bolts, hitBlock stone x=1/3/5 @+4 removed@+4
P1 RESULT custom shooter (ent1 shape) single: arrows 1 |v0|=2.98 spawn@press+0; item events [use@+0 start@+0 release@+1]
P1 RESULT custom shooter (ent1 shape) multishot: arrows 3 |v0|=3.01/3.03/3.02 spawn@press+0, all hitBlock stone x=3 @+4; ammo per load 1
P1 RESULT jump: far single control arrow vs swapped bolt_roh: spawn Δ 0.00, v0 Δ 0.05; |Δpos| +1:0.06 +2:0.05 +3:0.08 | vs swapped bolt (ent2): spawn Δ 0.00, v0 Δ 0.03; |Δpos| +1:0.09 +2:0.09 +3:0.11 +4:0.96 | swapped arrows sampled after their spawn tick: 0
P1 RESULT multishot: vanilla crossbow 3 arrows in 1 tick(s), yaw -9.48/0.76/10.33°; swapped 3 bolts with 3 distinct ids; custom shooter single 1 arrows in 1 tick(s), yaw -0.59°, multishot 3 arrows in 1 tick(s), yaw -0.37/-0.21/0.39°
P2 RESULT air (control) 3.0 b/t: arrow hitBlock stone+5; bolt hitBlock stone+5 dirt+6 bedrock+7 removed@+12; bolt_roh hitBlock stone+5 removed@+5
P2 RESULT water 3.0 b/t: all three vy -3.06 -> -1.89 on entering; arrow/bolt_roh hitBlock stone+5; bolt passes the floor
P2 RESULT water 0.5 b/t: all three y 6.50 6.00 5.46 4.87 4.46 4.17 3.94 … vy -0.40 -0.29 -0.23 -0.19 -0.16 -0.15; no hit in 30 ticks, 0.92 over the floor
P2 RESULT lava 3.0 / 0.5 b/t: paths identical to air, hits +5 / +10; arrow onFire 159
P2 RESULT cobweb 3.0 / 0.5 b/t: paths identical to air, hits +5 / +10
P2b RESULT projectile components: arrow gravity=0.05 airInertia=0.99 liquidInertia=0.60 stopOnHit=false bounce=true | bolt … bounce=false | bolt_roh … bounce=false
P2b RESULT level at 3.1 b/t (crossbow): step +1/+2/+3 3.10/3.07/3.04 for all three; |Δ vs arrow| +1/+3/+5/+8/+10 0.00/0.00/0.00/0.00/0.00; landed grass_block z=44 +15 (all three)
P2b RESULT lob 0.5 up, 1.0 forward: |Δ vs arrow| 0.00 at every sampled tick; landed grass_block z=27 +28 (all three)
P2c RESULT arrow at the target (control): fate [hitEntity target@+2 removed@+2]; target hurt [projectile:4.00 proj arrow]
P2c RESULT bolt (ent2) at the target: fate [hitEntity target@+2 hitBlock stone (wall)+3 hitBlock grass_block+12 …]; target hurt []; after 15 ticks still flying 23 blocks past the wall
P2c RESULT bolt_roh at the target: fate [hitEntity target@+2 removed@+2]; target hurt []
P2c RESULT bolt_roh 1.2 to the side (miss): fate [hitBlock stone+3 removed@+3]
P3 RESULT minecraft:sonic_explosion: 180 calls over 20 ticks, 0 threw, max 1 ms per tick; burst of 300 in one tick: 0 threw, 1 ms; control unknown id andrew:no_such_particle: no throw; control unloaded location: threw LocationInUnloadedChunkError; /particle minecraft:sonic_explosion: successCount=1; /particle andrew:no_such_particle: successCount=1
P4 RESULT getBlock+setType(air) per cell: n=0 batch 0/0 ms, tick gap 51/50 | n=300 batch 6/7, gap 51/51 | n=600 13/12, 49/49 | n=1200 38/35, 48/49 | n=2400 61/47, 63/55; tick gap over 60 ms: first at n=2400
P4 RESULT variants: getBlock+setType(sculk) n=300 batch 6 ms gap 52 ms; dimension.setBlockType(air) n=1200 batch 8 ms gap 51 ms
P4 RESULT fillBlocks 5x5x3=75: returned 75 in 0 ms, air 75/75; again 0; excludeTypes returned 72, cells chest/bedrock/obsidian, items []; no filter returned 75, cells air/air/air, items []; the chest held minecraft:diamond; Block.setType dropped [minecraft:diamond]
P4 RESULT fillBlocks ListBlockVolume (ellipsoid, 51 cells) returned 51 in 1 ms; listed cells air 51/51; unlisted cells left stone: yes
P4 RESULT fillBlocks across the chunk border x=0: returned 75, air 75/75; control in unloaded chunks: threw UnloadedChunksError; with ignoreChunkBoundErrors: returned 0
P5 RESULT sculk via setType: 40/40 bare surfaces read back minecraft:sculk (none refused); not placed as asked []; ids this engine lacks []
P5 RESULT covers after the surface turned to sculk: short_grass -> air | snow_layer kept | poppy -> air | white_carpet kept | torch kept; items dropped by the swap [poppy]
P5 RESULT chunk reload: chunks unloaded after 1 ticks, getBlock while unloaded unloaded; after reload 45/45 sculk cells still sculk (none changed)
```

Полные строки — в `dist/bds-gametest.log` любого прогона и в stdout артефакта `1.json`.
