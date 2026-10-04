# Пробы под Катану — KATA-PROBE-01-AA (L0-katn-ac08)

Замеры движка, на которых стоят L0-adr-ktfl, L0-adr-ktob, L0-katn-ad01 и decision-katana-landing-above-lava-unsafe.
Кода Катаны пока нет. Стенд: BDS 1.26.51.1, `@minecraft/server` 2.10.0, сценарии GameTest из `src/gametest/katana-probe.ts`
(7 штук: `probe_katana_*`), приватный инстанс `dist/bds-kata`, никто не подключён.

Числа ниже взяты из прогона 2026-10-04 00:26 UTC (`--only`, все 7 сценариев зелёные), код тот же, что в коммите задачи.
Строки RESULT этого прогона целиком лежат в приложении. P1–P4 и P6 дали те же числа в двух более ранних прогонах.
У P5 один луч в разных прогонах вёл себя по-разному (см. P5). Гейт — полный набор GameTest, артефакт
`.ai/verify/KATA-PROBE-01-AA/1.json`.

## Шесть результатов (по строке и числу на пробу)

1. **Сброс падения самотелепортом — ДА.** Все трое падают с 25 блоков.
   - Контроль без самотелепорта: 1 событие `entityHurt` с причиной fall, 21.0 урона, смерть от падения.
   - Самотелепорт на 1.56 над полом: 0 событий, урона нет.
   - Самотелепорт на 11.75: 8.0 урона. Это падение с 11.75, а не с 25: накопленное обнуляется.
2. **Флаги луча `{includePassableBlocks:false, includeLiquidBlocks:false}` — 11 из 11 блоков как в L0-adr-ktob.**
   - Проходит (7 из 7, цветов два): water, lava, short_grass, poppy, dandelion, web, white_carpet.
   - Останавливает (4 из 4): stone, нижняя oak_slab, oak_fence, glass_pane.
   - Контроль: air проходит. С обоими флагами `true` каждый «проходящий» блок останавливает тот же луч, то есть геометрия луча
     блок пересекает.
   - **2b.** `maxDistance` считает **шаги по клеткам, а не блоки**. Камень по диагонали x/z в 16.40 блока (24 шага) находится
     только при maxDistance ≥ 24.00. Камень по диагонали x/y/z в 13.16 блока (24 шага) — тоже только с 24.00. С
     maxDistance 20 оба — «нет попадания». По оси (15.50 блока, 16 шагов) хватает 16.00.
3. **Вертикальный луч через центр клетки попадает в обе плиты — ДА, но только если он доходит до клетки ниже.**
   - Луч `L0-katn-ad01` §1 дословно (maxDistance 2−2ε, конец на ε над полом) **нижнюю плиту в клетке ног не видит**: нет
     попадания. Верхнюю видит.
   - Тот же луч с maxDistance 2 (конец на ε ниже клетки ног) попадает и в нижнюю, и в верхнюю плиту (`oak_slab@3,2,3`).
     Попадание в клетку ниже — пол, оно не считается.
   - Механизм: нижняя плита из F.y+1.99 при длине 1.60 и 1.98 — нет попадания, при 2.00 и 2.20 — попадание. Из F.y+0.99 при
     0.98 — нет, при 1.20 — да. Камень при длине 1.00 — попадание.
4. **Луч вниз с обоими флагами `true` первым встречает лаву под клеткой-воздухом — ДА:**
   - `lava@3,1,4` под одной клеткой воздуха;
   - `lava@5,1,4` под двумя;
   - контроль над камнем — `stone`.
   - **Огонь и огонь душ этот луч не видит:** первым идёт блок под ними (`stone`, `soul_soil`), и с `includeTypes` из списка
     опасностей тоже нет попадания.
5. **Луч в незагруженный чанк.** Граница — x=48, это 3 шага по чанку от теста. Исходы:
   - **нет попадания** — луч по воздуху из загруженного чанка в незагруженный (2 прогона из 2);
   - **исключение** `LocationInUnloadedChunkError` на клетке грунта (56,−61,6) — наклонный луч в грунт первого незагруженного
     чанка (2 из 2);
   - луч, стартующий внутри незагруженного чанка: **нет попадания** в одном прогоне, **исключение** на (64,−61,6) в другом;
   - **попадания** не было ни разу;
   - контроль — тот же наклон на 16 блоков назад, в загруженных чанках: `grass_block@40,−61,6`.
6. **`spawnParticle("minecraft:cherry_leaves_particle")` не бросает:**
   - 210 вызовов за тик (10 следов по 21 точке), 0 исключений, ~1 мс;
   - контроль: несуществующий id `andrew:no_such_particle` тоже не бросает, так что «не бросает» не доказывает, что частица
     есть — это видно только глазами на iPad;
   - тот же вызов в незагруженной точке бросает `LocationInUnloadedChunkError`.

## Решения KV: что подтверждено и что опровергнуто

В KV ничего не записано. Статусы — для ведущего агента.

| Решение | Вердикт | Чем |
|---|---|---|
| **L0-adr-ktfl** — самотелепорт в свою точку перед посадкой | **подтверждено** | P1: 21.0 у контроля против 0 у самотелепорта. Запасной вариант со `slow_falling` не нужен |
| **L0-adr-ktob §1** — флаги трассы | **подтверждено** | P2: 11/11 блоков совпали, контроль air проходит |
| **L0-adr-ktob §1** — `maxDistance: 20` как дальность 20 блоков | **опровергнуто** | P2b: по диагонали стена в 13.16–16.40 блока не видна, и Катана прошла бы сквозь неё (§14 п.2) |
| **L0-adr-ktob §2** — «нечитаемое = твёрдое, трасса стоп до него» | **подтверждено как необходимое** | P5: сам луч на незагруженном чанке не останавливается (нет попадания) или бросает |
| **L0-adr-ktob:54** — «жидкости пропускаются только при `includeLiquidBlocks:false`» | **неверно** (уже измерено разбором CX01, здесь не противоречит) | P4: при одном `includeLiquidBlocks:true` луч проходит лаву до `stone`; лаву он встречает только вместе с `includePassableBlocks:true` |
| **L0-katn-ad01 §1** — колонный луч длиной 2−2ε | **опровергнуто** | P3: нижняя плита в клетке ног — «влезает» |
| **L0-katn-ad01** Consequences — запасной вариант: два горизонтальных луча на y+0.1 и y+1.9 | **опровергнуто** в виде «внутри клетки» | P3: нет попадания на всех 9 случаях, даже на камне |
| **decision-katana-landing-above-lava-unsafe** — лава | **подтверждено** | P4: первый блок вниз — `lava` (1 и 2 клетки воздуха) |
| **decision-katana-landing-above-lava-unsafe** — `fire`, `soul_fire` | **опровергнуто** (луч не видит огня) | P4: первый блок — `stone` / `soul_soil` под огнём |

## Что из этого следует для сборки — решает ведущий, не задача

Замеры, на которые можно опереться:

- **Трасса (ktob §1).** `maxDistance` — бюджет шагов по клеткам. Для 20 блоков по направлению `d` нужно не меньше
  `20·(|dx|+|dy|+|dz|)` шагов (до 34.7). Обрезать по евклидовым 20 — самому, по точке попадания.
- **Колонна (ad01 §1).** Длина 2 вместо 2−2ε. «Не влезает» — попадание в клетку ног или головы; попадание в клетку ниже —
  пол. Измерено на всех 9 случаях P3: пусто, ковёр, трава — «влезает»; камень, обе плиты в ногах и в голове, забор —
  «не влезает».
- **Общее правило лучей на 1.26.51.** Полный блок ловится, когда луч входит в его клетку. Неполный блок, в который луч входит
  посреди клетки (нижняя плита сверху, столб забора сбоку), ловится только когда луч выходит из этой клетки. Любой луч,
  который судит клетку, должен заканчиваться за ней.
- **Огонь (решение о посадке).** Первый блок, который встречает луч вниз, — это опора огня. Над ней
  `getBlock(hit + up)` читает `fire` / `soul_fire` (замерено). Проверка «первый блок или блок над ним — из списка» закрывает
  огонь. Лава остаётся как есть.
- **Незагруженные чанки (ktob §2).** Нужны две вещи: проверка `isChunkLoaded` по клеткам до луча и `try/catch` вокруг
  `getBlockFromRay`. Без них Катана получит «нет попадания» через незагруженный грунт или исключение.
- **Падение (ktfl).** Телепорт гасит скорость: `vy −1.60 → 0.00` на следующем тике. Игрок «зависает» на тик и падает дальше с
  нуля, так что с 1.56 блока до пола он долетает за 8 тиков. Не измерено здесь:
  - упреждение на терминальной скорости (~3.9 блока за тик): с 25 блоков скорость у пола была 1.60;
  - зацеп за уступ;
  - живой клиент: замер на SimulatedPlayer, iPad не проверялся.

## Приложение — строки RESULT прогона 2026-10-04 00:26 UTC

```text
P1 RESULT control: fell 25, self-teleport none, landed +29, fallHurt=[21.0] allHurt=[fall:21.0] death=fall
P1 RESULT reset-at-2: fell 25, self-teleport +28 at 1.56 above the floor, vy -1.60 -> 0.00 next tick, landed +36, fallHurt=[] allHurt=[] death=none
P1 RESULT reset-at-12: fell 25, self-teleport +21 at 11.75 above the floor, vy -1.25 -> 0.00 next tick, landed +41, fallHurt=[8.0] allHurt=[fall:8.0] death=none
P1 RESULT verdict: control fall hurt events 1 (sum 21.0), reset-at-2 fall hurt events 0 -> self-teleport RESETS the fall
P2 RESULT summary: air=passes, water=passes, lava=passes, grass=passes, flower=passes, flower=passes, cobweb=passes, carpet=passes, stone=stops, bottom slab=stops, fence=stops, glass pane=stops; contradicting L0-adr-ktob: []
P2b RESULT along x: stone entered 15.50 blocks along the ray, 16 cell steps from the start cell; smallest maxDistance that hits it 16.00; maxDistance 20 -> stone@16,3,3
P2b RESULT diagonal in x/z: stone entered 16.40 blocks along the ray, 24 cell steps from the start cell; smallest maxDistance that hits it 24.00; maxDistance 20 -> none
P2b RESULT diagonal in x/y/z: stone entered 13.16 blocks along the ray, 24 cell steps from the start cell; smallest maxDistance that hits it 24.00; maxDistance 20 -> none
P3 RESULT bottom slab in the feet cell: ad01 segment (2-2eps) none -> fits; full-cell column (2) oak_slab@3,2,3 -> does not fit; fallback horizontals y+0.1 none, y+1.9 none
P3 RESULT top slab in the feet cell: ad01 segment (2-2eps) oak_slab@3,2,3 -> does not fit; full-cell column (2) oak_slab@3,2,3 -> does not fit; fallback horizontals y+0.1 none, y+1.9 none
P3 RESULT bottom slab in the head cell: ad01 segment (2-2eps) oak_slab@3,3,3 -> does not fit; full-cell column (2) oak_slab@3,3,3 -> does not fit
P3 RESULT top slab in the head cell: ad01 segment (2-2eps) oak_slab@3,3,3 -> does not fit; full-cell column (2) oak_slab@3,3,3 -> does not fit
P3 RESULT empty feet and head: ad01 segment (2-2eps) none -> fits; full-cell column (2) stone@3,1,3 -> fits
P3 RESULT stone in the feet cell: ad01 segment (2-2eps) stone@3,2,3 -> does not fit; full-cell column (2) stone@3,2,3 -> does not fit; fallback horizontals y+0.1 none, y+1.9 none
P3 RESULT carpet in the feet cell: ad01 segment (2-2eps) none -> fits; full-cell column (2) stone@3,1,3 -> fits
P3 RESULT short grass in the feet cell: ad01 segment (2-2eps) none -> fits; full-cell column (2) grass_block@3,1,3 -> fits
P3 RESULT oak fence in the feet cell: ad01 segment (2-2eps) oak_fence@3,2,3 -> does not fit; full-cell column (2) oak_fence@3,2,3 -> does not fit
P3 RESULT segment end, bottom slab, from F.y+1.99: len 1.60 none, len 1.98 none, len 2.00 oak_slab@3,2,3, len 2.20 oak_slab@3,2,3
P3 RESULT segment end, bottom slab, from F.y+0.99: len 0.60 none, len 0.98 none, len 1.20 oak_slab@3,2,3
P3 RESULT segment end, stone, from F.y+1.99: len 1.00 stone@3,2,3, len 1.20 stone@3,2,3, len 1.98 stone@3,2,3
P4 RESULT air over stone (control): first block down with both flags true = stone@1,1,4 (block above it air); includeLiquidBlocks only = stone@1,1,4; both flags + includeTypes hazards = none
P4 RESULT air over lava (CX01 F=(3,2,4)): first block down with both flags true = lava@3,1,4; includeLiquidBlocks only = stone@3,0,4; trace flags = stone@3,0,4; both flags + includeTypes hazards = lava@3,1,4
P4 RESULT two air cells over lava: first block down with both flags true = lava@5,1,4; includeLiquidBlocks only = stone@5,0,4; both flags + includeTypes hazards = lava@5,1,4
P4 RESULT air over fire: first block down with both flags true = stone@1,0,1 (block above it fire); both flags + includeTypes hazards = none; floor cell reads minecraft:fire
P4 RESULT air over soul fire: first block down with both flags true = soul_soil@3,0,1 (block above it soul_fire); both flags + includeTypes hazards = none; floor cell reads minecraft:soul_fire
P4 RESULT air over water: first block down with both flags true = water@5,1,1; includeLiquidBlocks only = stone@5,0,1
P5 RESULT level, through air: no hit; from 44.00,-56.50,6.50[L] to 56.00,-56.50,6.50[U]; unloaded from x=48 (3 chunk steps out)
P5 RESULT sloped onto the ground: threw LocationInUnloadedChunkError: Trying to access location (56.0, -61.0, 6.0) which is not in a chunk currently loaded and ticking.
P5 RESULT control: the same slope shifted 16 back: hit minecraft:grass_block@40,-61,6; from 28.00,-56.00,6.50[L] to 40.00,-60.00,6.50[L]
P5 RESULT starting inside the unloaded chunk: threw LocationInUnloadedChunkError: Trying to access location (64.0, -61.0, 6.0) …  (the previous run: no hit)
P6 RESULT minecraft:cherry_leaves_particle: 210 calls in one tick, 0 threw, 1 ms wall; control unknown id andrew:no_such_particle: no throw; control unloaded location (loaded=false): threw LocationInUnloadedChunkError
```

Строки сокращены до полей, на которые ссылается отчёт; полная строка на каждый блок P2 и каждый случай P3 есть в
`dist/bds-gametest.log` любого прогона и в stdout артефакта гейта.
