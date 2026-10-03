ИСХОД: 3 — Подчистка знания

# CNTR-X16 · L0-xcx16: узлы Пушки v3 против кода v1.4.4 и записей решений

Утверждение подтверждено. Все 147 узлов `adr-orbc`, `orbc-*`, `pntr-*` и `ring-*`
по содержанию остаются версией 3. Анализ v5 (коммит `0a8f2c1`) только сменил у них
`analysis_version: 3` на `5`; у трёх компонентов он ещё поставил
`needs_rebuild_marked_at`. Ниже перечислено, что править (`файл:строка — «было» →
«стало»`). Каждое «было» проверяется по своей строке скриптом
`docs/feedback/diagnose-CNTR-X16.measure.mjs --strict-citations`. Каждое «стало»
сверено с кодом, с решением или с измерением; адрес источника указан в строке.
Карточек не заведено, в KV ничего не записано.

## Фазы /diagnose

```text
OBSERVED: в 147 Orbital-узлах (живой KV через doc_get и обе копии .ai/context, корень и worktree, побайтно одинаковы) стоят прицел 10, спавн +30, кольца d 1/5/10/15/20, ~145–160 зарядов, потолок 200 и состояния «not implemented / Analysis only / blocked:L0-xq5». Код v1.4.4 и три решения оператора говорят другое (таблица «Измерено»).
VERDICT: bug (устаревшее знание). Ожидание записано (decision-ring-diameters… 2026-09-30, decision-aim-range-25… 2026-10-02, decision-ring-power-per-ring… 2026-10-02) и действует: код влит в v1.4.1/1.4.3/1.4.4.
REPRO: node docs/feedback/diagnose-CNTR-X16.measure.mjs → 72 строки-нарушения по 9 правилам, exit 1; детерминированно.
CAUSE: узлы написаны в v3 до кода (0dc3c25, 2026-09-29). Решения 09-30 и 10-02 ушли в decisions/ и в код (39dc93f, a76aa1f, 6e10366). Прогон v5 (0a8f2c1) перенёс узлы без перестройки: git diff 0a8f2c1^..0a8f2c1 по 147 файлам меняет только analysis_version (3→5) и needs_rebuild_marked_at у orbc/pntr/ring.
PROOF: ai-kit run-check --expect-red, артефакт .ai/verify/CNTR-X16-AA/2.red.json (хвост: список строк и счёт цитат).
RULED OUT: (1) «устарела только копия в worktree»: diff -rq корень↔worktree по 147 файлам пуст, а doc_get отдаёт orbc-r003 с «maxDistance: 10». (2) «код сам живёт на старых числах»: замер даёт 25 / 60·60·10 / 201 / 256, тесты это закрепляют (tests/ring-layout.test.mjs:68 → 201; src/gametest/orbital-core.ts:243-246 → 24.5/25.5 и 4.5 для минимума 7).
RADIUS: от узлов зависят /plan (порождение задач по orbc/ring/pntr; с v3-чисел план откатил бы сборку), sauc (числа уже берёт из кода, см. sauc «Orbital baseline (v1.4.4)»), обзор L0 (строка 37), а также узлы вне трёх семейств ниже. Как смотрел: grep по nodes/ на 10/+30/1-5-10-15-20/145/160/200, kv_contradictions(all), doc_get живого KV, сверка с корнем. Правка знаниевая, не ограничение: CASES/BYPASS не нужны.
GREEN: не в этом прогоне. Правки применяет последовательная фаза после волны. Зелёным будет тот же скрипт с exit 0 (0 нарушений) и строкой «N gone (applied)» по всем строкам ниже.
LIVE: не в этом прогоне, по той же причине. Живая проверка — doc_get правленых узлов.
```

## Измерено (код v1.4.4, `package.json` 1.4.4)

| Величина | Значение | Адрес |
|---|---|---|
| прицел | 25, от глаз до ближайшей точки блока | `src/orbital/target.ts:13`, `:29-32` |
| цель | блок события в пределах 25, иначе луч `maxDistance: 25` без жидкостей и проходимых | `target.ts:49-62` |
| минимум ПКМ | 7, тихо и без кулдауна; у ЛКМ минимума нет | `ring-layout.ts:39`, `ring.ts:668`, `activation.ts:140` |
| ввод | ПКМ `itemUse` / `itemStartUseOn`; ЛКМ `entityHitBlock` / `playerSwingStart(Attack)` | `activation.ts:150-173`; decision-vvod… 2026-09-29 |
| спавн | Верхний мир 60, Край 60, Нижний 10, прочие 60; `min(y+off, max−1)` | `spawn.ts:15-31` |
| падение | 1 блок/тик → 60 тиков = 3 с (Нижний 0.5 с) | `charge.ts:180` |
| `spawnY` | Верхний 64→124, Край 60→120, Нижний 120→127 | замер скриптом |
| диаметры | 1/7/14/21/28, радиусы 0.5/3.5/7/10.5/14 | `ring-layout.ts:98` |
| силы | 4/4/2/1/1, охват 2×сила = 8/8/4/2/2 | `ring-layout.ts:112` |
| колонки | 1+20+40+60+80 = 201; охват ±14; по силе 21×4, 40×2, 140×1 | замер; `tests/ring-layout.test.mjs:68` |
| инварианты колец | у каждой клетки ровно 2 соседа по кольцу; max\|dist−r\| 0.50/0.29/0.50/0.40 | замер скриптом |
| потолок | `RING_MAX_CHARGES` 256 | `ring-layout.ts:27` |
| очередь | 48 за тик; 1 атака 5 тиков (48/48/48/48/9), 3 атаки 13 | `ring.ts:53`; README:56, :63 |
| прочее | `MAX_QUEUE_AGE_TICKS` 200, `ATTACK_TIMEOUT_TICKS` 400, кулдаун 600 тиков | `ring.ts:62`, `flight.ts:61`, `legendary/rules.ts:10` |
| `source` взрыва | нет; моб, убитый кольцами, без XP | `ring.ts:488-495`, README:61 |
| v3-таблица | 1/5/10/15/20 → 145 (1+16+28+44+56), ±10 | замер `buildColumns` |

## Правки: orbc (56 файлов: adr-orbc + 55 orbc; правок в 27, без правки 29)

Прицел 10 → 25 и минимум 7 (decision-aim-range-25…, decision-ring-power…):
- `orbc-r003:6` — «within 10 blocks» → «within 25 blocks»
- `orbc-r003:16` — «within 10 blocks» → «within 25 blocks»
- `orbc-r003:21` — «from the eye to the hit point: `maxDistance: 10`» → «from the eye to the nearest point of the block (`distanceToBlock`, target.ts:29): ≤ 25; ray `maxDistance: 25`»
- `orbc-r003:27` — «until `L0-xq5` is answered, LMB is physically limited to the vanilla reach» → «both reach 25 (LMB by `playerSwingStart` + ray); RMB also refuses a block nearer than 7, silently, no cooldown»
- `orbc-p001:28` — «within 10 blocks» → «within 25 blocks (RMB: and ≥ 7)»
- `orbc-p001:29` — «maxDistance: 10» → «maxDistance: 25»
- `orbc:45` — «maxDistance: 10» → «maxDistance: 25» (сначала блок события, target.ts:49-62)
- `orbc-ad01:28` — «its distance from the eye is ≤ 10» → «its distance from the eye to the block's nearest point is ≤ 25 and ≥ the effect's `minRange`»
- `orbc-ad01:29` — «maxDistance: 10,» → «maxDistance: 25,»
- `orbc-ad01:34` — «this loses RMB 6–10 on keyboard» → «this loses RMB beyond reach (up to 25) on keyboard»
- `orbc-ad01:36` — «The 6–10 range on the iPad needs the crosshair ("split controls") layout» → «What a touch press beyond reach sends is the open iPad check (`orbc-ac08`, decision 2026-09-29)»
- `orbc-gloss-activ:21` — «within 10 blocks» → «within 25 blocks (RMB: no nearer than 7)»
- `orbc-ac03:6` — «within 10» → «within 25»
- `orbc-ac03:16` — «within 10» → «within 25»
- `orbc-ac03:22` — «11 or more blocks away» → «more than 25 blocks away (test: 25.5, src/gametest/orbital-core.ts:244, :319)»
- `orbc-ac03:22` — «with air behind it within 10» → «with air behind it within 25»
- `orbc-ac03:30` — «at distance 9.5» → «at distance 24.5 (`IN_RANGE`, orbital-core.ts:243, :343-354)»; добавить THEN: «a block 4.5 away: RMB fires nothing, no cooldown; LMB fires (orbital-core.ts:245-246, :361-383)»
- `orbc-ac16:20` — «a target within 10» → «a target 7–25 blocks away (P fires RMB first)»
- `orbc-ac09:22` — «at T's side from 4 blocks» → «at T's side from 7.5 blocks (each case also fires RMB; orbital-core.ts:561-567)»
- `orbc-ac08:20` — «**Blocked** until `L0-xq5` is answered» → «Unblocked: input by decision 2026-09-29, range by 2026-10-02 (LMB ≤ 25, RMB 7–25); this check records what touch sends»
- `orbc-ac08:20` — «RMB up to 10» → «RMB 7–25»
- `orbc-ac08:23` — «**Tap** on a highlighted block 3 blocks away → one RMB attack lands on **that** block» → «Tap on a block 3 blocks away → no RMB attack, no cooldown (minimum 7); tap 8 blocks away → one RMB attack on that block»
- `orbc-ac08:25` — «(by the gesture that `cx02` settles)» → «(`itemStartUseOn` on a block, `itemUse` + ray in the air)»

Спавн +30 → +60 (Нижний мир +10 без изменений; spawn.ts:15-22):
- `orbc-r007:24` — «| `minecraft:overworld` | 30 |» → «| `minecraft:overworld` | 60 |»
- `orbc-r007:25` — «| `minecraft:the_end` | 30 |» → «| `minecraft:the_end` | 60 |»
- `orbc-r007:27` — «| any other dimension (future-proof) | 30 |» → «| any other dimension (future-proof) | 60 |»
- `orbc-ac04:6` — «+30 in the Overworld and End» → «+60 in the Overworld and End»
- `orbc-ac04:16` — «+30 in the Overworld and End» → «+60 in the Overworld and End»
- `orbc-ac04:25` — «| Overworld, T.y = 64 | 94 |» → «| Overworld, T.y = 64 | 124 |»
- `orbc-ac04:26` — «| End, T.y = 60 | 90 |» → «| End, T.y = 60 | 120 |»
- `orbc-ac05:21` — «(T.y + 30)» → «(T.y + 60; Nether T.y + 10)»
- `orbc-as01:20` — «§8 says "30 blocks above the selected point"» → «§8 says "60 blocks above the selected point" (Overworld, End; Nether 10)»
- `orbc-as02:24` — «A +30 drop onto flat ground takes 1.5 s» → «A +60 drop onto flat ground takes 60 ticks = 3 s»
- `orbc-as04:20` — «per-column terrain + 30, or target + 30» → «per-column terrain + 60, or target + 60»
- `orbc-ac18:21` — «so the fall is about 30 ticks» → «so the fall is about 60 ticks»

Число зарядов настоящего ПКМ 160 → 201:
- `orbc-ad02:24` — «~160 charges per attack» → «201 charges per attack»
- `orbc-ad02:32` — «480 × 2 ≈ 960 `getBlock` calls at the design load» → «603 × 2 ≈ 1,206 `getBlock` calls at the design load (3 × 201)»
- `orbc-ad03:33` — «about 160 charges» → «201 charges per RMB»
- `orbc-as04:24` — «about 160 `getTopmostBlock` calls» → «201 `getTopmostBlock` calls»
- `orbc-ent2:31` — «RMB: ~160 from `ring`'s layout (`xasm8`)» → «RMB: 201 from `ring`'s layout (`RING_LAYOUT.count`)»
- `orbc-gloss-charge:17` — «about 160 charges» → «201 charges»
- `orbc-ac11:20` = «returns 160 columns» — без правки: это заглушка, `STUB_RMB_COLUMNS = 160` (src/orbital/stub-effect.ts:10)
- `orbc-ac11:23` = «480 charges exist in the spawn tick» — без правки: так проверяет `orbital_flight_load_480` (src/gametest/orbital-flight.ts:561-618)

Ввод (decision-vvod… 2026-09-29; activation.ts:150-173):
- `adr-orbc:24` — «(plus `itemUseOn` / `playerInteractWithBlock` deduped per tick)» → «(in the air) or `itemStartUseOn` (on a block); LMB also `playerSwingStart` with `swingSource: Attack` + the ray»
- `adr-orbc:24` — «one `getBlockFromViewDirection({maxDistance: 10})` call at activation time. They do not use the event's block» → «the event's block within 25, else `getBlockFromViewDirection({maxDistance: 25})` (as amended by `orbc-ad01`)»
- `adr-orbc:29` — «there is no stable "swing" event» → «`playerSwingStart` is stable in 2.10.0 and is the LMB signal at any distance»
- `adr-orbc:32` — «LMB inherits the vanilla reach limit. See `L0-xcx8`: if the client insists on 10 blocks for LMB, only a stable workaround such as sneak+Use can deliver it.» → «LMB has no reach limit: `playerSwingStart` + the ray, up to 25 (measured 22/22; xcx8 closed).»
- `orbc-p001:21` — «RMB: `itemUse`, `itemUseOn` or `playerInteractWithBlock`.» → «RMB: `itemUse` (in the air) or `itemStartUseOn` (on a block).»
- `orbc-p001:22` — «LMB: `entityHitBlock` where the damager is a `Player`.» → «LMB: `entityHitBlock` (a `Player` damager) or `playerSwingStart` (`Attack`) + the ray; main hand only.»
- `orbc:43` — «`itemUseOn`/`playerInteractWithBlock` (RMB)» → «`itemStartUseOn` (RMB)»
- `orbc:44` — «`world.afterEvents.entityHitBlock` with a player damager» → «`world.afterEvents.entityHitBlock` with a player damager or `playerSwingStart` (`Attack`)»
- `orbc-ad01:24` — «`itemUseOn`, `playerInteractWithBlock` and `entityHitBlock` report that block» → «`itemStartUseOn` and `entityHitBlock` report that block»
- `orbc-ad01:28` — «(`itemUseOn.block`, `playerInteractWithBlock.block`, `entityHitBlock.hitBlock`)» → «(`itemStartUseOn.block`, `entityHitBlock.hitBlock`)»
- `orbc-ac09:20` — «`itemUse`, `itemUseOn` and `entityHitBlock`» → «`itemUse`/`itemStartUseOn` and `entityHitBlock`/`playerSwingStart`»
- `orbc-r006:21` — «`itemUse` together with `itemUseOn` or `playerInteractWithBlock`;» → «`entityHitBlock` together with `playerSwingStart`, or a use together with a swing;»
- `orbc-gloss-mode:18` — «via `entityHitBlock`» → «via `entityHitBlock` or `playerSwingStart` + the ray»
- `orbc-gloss-mode:19` — «via `itemUse`/`itemUseOn`» → «via `itemUse`/`itemStartUseOn`»
- `orbc-gloss-mode:21` — «pending `L0-xq5`» → «what the iPad sends is the `orbc-ac08` check»
- `orbc-r013:22` — «LMB reach and the answer to `xq5` (`xcx8`).» → «LMB by `playerSwingStart` + the ray, up to 25 (src/orbital/README.md:6).»
- `orbc-r013:27` — «There is no stable "swing at nothing" event.» → «A swing at nothing is `playerSwingStart` (`Attack`), stable in 2.10.0.»

Контракт эффекта и HUD:
- `orbc-r014:28` — «scale: 0 | 1;» → «scale: 0 | 1; minRange?: number; // a nearer target is refused silently, no cooldown; RMB 7 (charge.ts:22-29)»
- `orbc-r012:28` — «The wording is **pending `cx01`**. The shared keys currently render `Orbital Cannon: Ready` and `Orbital Cannon: 27 s`.» → «Own keys `andrew.orbital.hud_ready` = `%s — Ready`, `andrew.orbital.hud_cooldown` = `%s — %ss` (registry.ts:84; en_US.lang:25-26); cx01 closed.»

Состояние:
- `orbc:13` — «"not-implemented", "blocked:L0-xq5"» → убрать оба тега
- `orbc:21` — «**State (2026-09-29):** not implemented. There is no `src/orbital/` and no `andrew:orbital_cannon` item.» → «**State (v1.4.4):** shipped in v1.4.0 (3e26db8), tuned in v1.4.1/1.4.3/1.4.4; `src/orbital/` and `andrew:orbital_cannon` exist.»
- `orbc:21` — «**Task creation is blocked by `L0-xq5`/`L0-xcx8`**, the LMB reach question.» → удалить (запрет снят решением 2026-09-29)
- `orbc-ac08:13` — «"blocked:L0-xq5"» → убрать
- `adr-orbc:15` — «"status:proposed"» → «"status:accepted"» (с поправками `orbc-ad01` и решения 2026-09-29)
- `adr-orbc:20` — «**Status:** proposed.» → «**Status:** accepted, amended by `orbc-ad01` and decision 2026-09-29.»
- `orbc-ad01:13` — «"status:proposed"» → «"status:accepted"» (target.ts:49-62)
- `orbc-ad01:20` — «**Status:** proposed.» → «**Status:** accepted (target.ts:49-62, range 25).»
- `orbc-ad02:13` — «"status:proposed"» → «"status:accepted"» (src/orbital/README.md:9)
- `orbc-ad02:20` — «**Status:** proposed.» → «**Status:** accepted (README.md:9).»
- `orbc-ad03:13` — «"status:proposed"» → «"status:accepted"» (README.md:10)
- `orbc-ad03:20` — «**Status:** proposed.» → «**Status:** accepted (README.md:10).»

Закрытая запись: тело не трогать, поправить только статус (closed_at 2026-09-29, `orbc-cx02:15-17`):
- `orbc-cx02:13` — «"status:open"» → «"status:resolved"»
- `orbc-cx02:24` — «**Status:** open.» → «**Status:** resolved (decision-resolve-l0-orbc-cx02).»

Прочитаны без правки (29): ac01, ac02, ac06, ac07, ac10, ac11 (сверено выше), ac19, as03, as05–as08, cx01, cx03, ent1, ent3, gloss-cont, gloss-lock, gloss-orph, p002, p003, r001, r002, r004, r005, r008–r011. `orbc-ad01:23` описывает исправляемый ADR в его прежнем виде и остаётся как есть. `orbc-ac09:23` («6» — пассивный блок, ЛКМ) совпадает с тестом.

## Правки: ring (48 файлов; правок в 29, без правки 19)

Диаметры, радиусы и места на кольцах (DIAMETERS `ring-layout.ts:98`):
- `ring:25` — «d ≈ 1/5/10/15/20» → «d = 1/7/14/21/28, powers 4/4/2/1/1; RMB refuses a target nearer than `RING_MIN_RANGE` 7 (ring-layout.ts:39)»
- `ring-r001:15` — «d ≈ 1/5/10/15/20» → «d = 1/7/14/21/28»
- `ring-r001:19` — «**d = 5, 10, 15, 20**» → «**d = 7, 14, 21, 28** (r 3.5/7/10.5/14)»
- `ring-ac11:15` — «d ≈ 1/5/10/15/20» → «d = 1/7/14/21/28»
- `ring-ac11:17` — «for r ∈ {2.5, 5, 7.5, 10}» → «for r ∈ {3.5, 7, 10.5, 14}»
- `ring-ac11:17` — «the count is 140–160» → «the count is 201»
- `ring-ac11:18` — «a flat stone pad» → «a flat dirt pad (power 1 breaks nothing in stone; src/gametest/ring.ts:805-808)»
- `ring-ac11:18` — «an owner holding the Cannon aimed at the pad's centre block» → «an owner 9 blocks from the pad's centre block, aiming at it (`standFor`, gametest ring.ts:184)»
- `ring-ac11:18` — «y = target.y + 30» → «y = target.y + 60»
- `ring-ent1:25` — «d ∈ {1,5,10,15,20}, r = d/2» → «d ∈ {1,7,14,21,28}, r = d/2, power 4/4/2/1/1»
- `ring-ent1:31` — «Each ring for d ≥ 5» → «Each ring for d ≥ 7» (инвариант измерен: ровно 2 соседа)
- `ring-gl01:17` — «d = 5/10/15/20» → «d = 7/14/21/28»
- `ring-gl01:17` — «~145 `{x,z}` offsets» → «201 `{x,z}` offsets»
- `ring-p001:23` — «r ∈ {2.5, 5, 7.5, 10}** (d = 5/10/15/20)» → «r ∈ {3.5, 7, 10.5, 14}** (d = 7/14/21/28)»
- `ring-p001:33` — «between r = 2.5 and r = 5» → «between r = 3.5 and r = 7»
- `ring-ac13:17` — «owner A stands 2 blocks from the ring-5 line, and B stands 2 blocks from the ring-15 line, plus one zombie on ring 10» → «the owner fires from 9 blocks; A stands 5, B 6 and a zombie 5 blocks from the target (gametest ring.ts:966-971, :1044)»
- `ring-ac14:17` — «Reinforced Deepslate pillars on ring 10 and a chest with 10 cobblestone on ring 15» → «Reinforced Deepslate pillars on ring d7 and a chest with 10 cobblestone on ring d14 (power ≥ 2: power 1 leaves a chest whole in 3 of 12; gametest ring.ts:1174-1181)»
- `ring-ac15:17` — «a zombie on the seabed on ring 5» → «a zombie on the seabed 3 blocks from the target (gametest ring.ts:1276)»
- `ring-ac16:17` — «in a chest on ring 5» → «in a chest 3 blocks from the target»
- `ring-ac16:17` — «6 blocks outside ring 20» → «16 blocks from the target, 2 outside ring d28 (gametest ring.ts:1349-1359)»
- `ring-ac17:17` — «their footprints overlap by 5 blocks» → «targets 16 apart, footprints overlap by 13 blocks (gametest ring.ts:1413-1414; README:63)»
- `ring-ac18:17` — «B holding 5 diamonds on ring 10, 3 zombies on rings 5 and 15, and 4 pre-existing dirt item entities on ring 20» → «B holding 5 diamonds 5 blocks from the target, 3 zombies on ring d7 and 3 on ring d14, 4 dirt item entities on ring d28 (gametest ring.ts:1488-1498)»
- `ring-gl05:19` — «the 21 × 21 XZ box» → «the 29 × 29 XZ box (±14)»

Число, потолок, очередь (201, 256, 48/тик; README:56, :63):
- `ring:37` — «~140–160 `{x,z}`» → «201 `{x,z}`»
- `ring-ent1:27` — «≈ 141–161» → «201»
- `ring-ent1:27` — «Hard cap `RING_MAX_CHARGES = 200`» → «Hard cap `RING_MAX_CHARGES = 256`»
- `ring-p001:43` — «1 + ~16 + ~28 + ~44 + ~56 ≈ 145» → «1 + 20 + 40 + 60 + 80 = 201 (measured)»
- `ring-p001:44` — «`xasm8` estimate: ≈ 160.» → удалить
- `ring-p001:45` — «`as06` fixes the budget at ≤ 200.» → «`RING_MAX_CHARGES` = 256; a layout over it throws (ring-layout.ts:91-93).»
- `ring-as06:15` — «The charge count is 140–160 per RMB, with a hard cap of 200» → «The charge count is 201 per RMB, with a hard cap of 256 (measured)»
- `ring-as06:18` — «gives about 1 + 16 + 28 + 44 + 56 ≈ 145 columns. `L0-xasm8` estimated ≈ 160.» → «gives 1 + 20 + 40 + 60 + 80 = 201 columns (tests/ring-layout.test.mjs:68).»
- `ring-as06:19` — «orbc's 480-charge flight sweep» → «orbc's flight sweep (480 with the stub, 603 real in `ring_three_budget`)»
- `ring-as06:19` — «are sized for ≤ 160 per attack × 3 attacks» → «hold for 201 per attack × 3 (drain 13 ticks, RG-3 held)»
- `ring-as06:20` — «`layout` asserts ≤ 200» → «`buildColumns` throws above 256»
- `ring-as06:23` — «the count roughly doubles to ~300» → удалить строки 22-24 («Impact if wrong»): допущение закрыто замером, а числа ~300/~100 не измерены
- `ring-as05:24` — «the drain time grows to ≤ 30 ticks (1.5 s)» → «the drain time grows to ⌈603/16⌉ = 38 ticks (1.9 s) (derived, not measured)»
- `ring-ad02:21` — «all ~145 charges» → «all 201 charges»
- `ring-ad02:22` — «That means ~480 power-4 explosions that could fall due in one tick.» → «Real load: 3 × 201 = 603 explosions in one tick (63 at power 4, 120 at 2, 420 at 1).»
- `ring-ad02:31` — «up to 480 explosions in one tick» → «up to 603 explosions in one tick»
- `ring-ad02:37` — «The latency is ≤ 0.2 s per attack and ≤ 0.5 s for three.» → «The latency is 5 ticks (0.25 s) per attack and 13 ticks (0.65 s) for three (measured).»
- `ring-ad04:21` — «~145 detonations per attack» → «201 detonations per attack»
- `ring-ad04:21` — «~290 queries per attack, and ~870 for three attacks» → «~402 queries per attack, and ~1,206 for three attacks»
- `ring-ad04:26` — «37 × 37 horizontally» → «45 × 45 horizontally (±`RING_REACH` 14 ± `PROTECT_MARGIN` 8; ring.ts:254-264)»
- `ring-ad04:31` — «(up to ~1.5 s)» → «(up to ~3 s)»
- `ring-ad04:33` — «must escape a 37 × 37 `avoid` box. The current 16-block search radius cannot (`L0-ring-cx02`).» → «must escape a 45 × 45 `avoid` box; it walks max(16, halfExtent + 4) rings out (`L0-adr-oprt` §2, src/legendary/recovery.ts:733-739).»
- `ring-p002:29` — «The safe spot must clear a 37×37 footprint, so it needs a search radius ≥ 19 (`L0-ring-cx02`).» → «The safe spot must clear the 45×45 box; the walk is max(16, halfExtent + 4) rings out (recovery.ts:733-739).»
- `ring-cons:21` — «The queue drains in ≤ 4 ticks for 1 attack and ≤ 10 ticks for 3 concurrent attacks on flat ground.» → «The queue drains in 5 ticks for 1 attack and 13 ticks for 3 concurrent attacks on flat ground (measured; asserted ≤ 13, gametest ring.ts:1452).»
- `ring-p003:20` — «The ~145 contacts» → «The 201 contacts»
- `ring-p003:20` — «up to ~480 power-4 explosions could fall due in one tick» → «up to 603 explosions (63 at power 4, 120 at 2, 420 at 1) could fall due in one tick»
- `ring-p003:30` — «One attack: ≤ ⌈160/48⌉ = 4 ticks (0.2 s).» → «One attack: ⌈201/48⌉ = 5 ticks (0.25 s), measured 48/48/48/48/9.»
- `ring-p003:31` — «Three attacks: ≤ 10 ticks (0.5 s).» → «Three attacks: 13 ticks (0.65 s), measured.»
- `ring-r002:19` — «may add **≤ 4 ticks** for one attack and **≤ 10 ticks** with 3 concurrent attacks» → «may add **5 ticks** for one attack and **13 ticks** with 3 concurrent attacks»
- `ring-ac17:19` — «all queued blasts drain within 10 ticks» → «all queued blasts drain within 13 ticks»
- `ring-ac17:21` — «after 60 ticks the ring queue interval is cleared» → «once every attack's report is in (fall ≈ 60 ticks, then the drain), the ring queue interval is cleared (gametest ring.ts:1427-1429, :1455-1456)»

Сила, урон, `source`, XP (decision-ring-power…; ring.ts:287-291, :488-495; README:61, :65):
- `ring:27` — «`dimension.createExplosion(centre, 4, …)`» → «`createExplosion(centre, power, …)` at the column's ring power 4/4/2/1/1»
- `ring:28` — «Mob loot, XP and players' death drops stay vanilla.» → «Mob loot and players' death drops stay vanilla; a mob the rings kill drops no XP (no `source`).»
- `ring-r004:15` — «TNT-equivalent entity damage, including the owner» → «Engine explosion damage at the ring's own power, including the owner»
- `ring-r004:17` — «Each blast is `createExplosion(centre, 4, …)`. Power 4 is vanilla TNT» → «Each blast is `createExplosion(centre, power, …)`, power 4/4/2/1/1 by ring; power 4 is vanilla TNT (29.11/29.13 at 3 blocks), reach 2 × power»
- `ring-r004:18` — «takes normal TNT damage and can die from their own RMB» → «takes the field's damage and can die from their own RMB (standing: 8 → 20, 10 → 11.1, 12 → 7.2, 14 → 20, 16 → 1.9, ≥ 18 → 0)»
- `ring-r004:19` — «**`source` is the owner when resolvable.**» → «**No blast carries a `source`** (the engine spares the source entity, probe_ring_drops): kills read "blown up", mobs drop no XP.» Остаток строки удалить
- `ring-r005:17` — «(`breaksBlocks: true`, power 4)» → «(`breaksBlocks: !underwater`, power 4/4/2/1/1)»
- `ring-r005:17` — «exactly as with vanilla T» → «as vanilla TNT does at power 4; power 1 breaks soil only, nothing in stone or planks (gametest ring.ts:370-381)» — заменить хвост «exactly as with vanilla TNT»
- `ring-r006:22` — «Loot and XP from mobs killed by the blast.» → «Loot from mobs killed by the blast; no XP (no `source`).»
- `ring-r007:23` — «entities in range take normal TNT damage and knockback» → «entities in range take the blast's damage and knockback at its ring power»
- `ring-p002:26` — «`source`: `world.getEntity(ownerId)` if it is valid and `entity.dimension.id === dimensionId`, otherwise `undefined`» → «no `source`, ever; `power` = `powerAtOffset(offset)`, fallback `BLAST_POWER` 4»
- `ring-p002:37` — «dim.createExplosion(centre, 4, {» → «dim.createExplosion(centre, blast.power, {»
- `ring-p002:41` — «source,» → удалить строку
- `ring-ent2:29` — «The explosion `source` is resolved at blast time (`L0-ring-r004`)» → «Report only; no blast has a `source`»; добавить строку `power | number | the column's ring power, set at contact` (ring.ts:87-88, :301)
- `ring-as03:15` — «`source: owner` does not exempt the owner from damage» → «FAILED: `source` exempts the source entity; no blast carries one»
- `ring-as03:17` — «The source entity still takes damage and knockback, as a player who lit vanilla TNT does.» → «Measured false (probe_ring_drops, twice): the source zombie took 0 at 4 blocks; the same blast without a source killed an identical zombie (23.5/23.1).»
- `ring-as03:21` — «The only loss is kill attribution in the death message ("blown up" instead of "blown up by X").» → «Taken: no `source`. Lost: kill attribution and the XP of mobs the rings kill (README:61).»
- `ring-ac13:18` — «in the range a vanilla primed TNT gives at the same distance» → «the damage of the blasts at their own ring's power; one power-4 ring blast = one vanilla TNT (3/5/7 blocks), and the owner at 9 blocks takes > 0 (gametest ring.ts:1136)»
- `ring-ac13:19` — «A's death message, if A died, attributes the blast» → «A's death message, if A died, reads "blown up", never "blown up by <owner>"»
- `ring-ac14:18` — «the dirt, stone and planks around each charge are cratered» → «every column whose power breaks its material leaves a crater; the power-1 rings d21/d28 leave stone and planks whole»
- `ring-ac18:20` — «the zombie loot and XP orbs were spawned» → «the zombie loot was spawned; XP orbs are counted, not required (no `source`; gametest ring.ts:1546-1547)»
- `ring-ac16:22` — «This AC fails today by design until `L0-ring-cx02` is resolved.» → удалить (cx02 закрыт `L0-adr-oprt`; `ring_legendaries_survive` в составе)

Состояние:
- `ring:13` — «"not-implemented"» → убрать
- `ring:21` — «**Status (2026-09-29).** Analysis only. `src/orbital/` does not exist» → «**Status (v1.4.4).** Shipped in v1.4.0 (`src/orbital/ring.ts`, `ring-layout.ts`); retuned in v1.4.1 and v1.4.4; deviations in src/orbital/README.md:29-65»
- `ring-ad01:13` — «"status:proposed"» → «"status:accepted"» (README:57)
- `ring-ad01:18` — «**Status:** proposed.» → «**Status:** accepted (README:57).»
- `ring-ad02:13` — «"status:proposed"» → «"status:accepted"» (ring.ts:53, :62)
- `ring-ad02:18` — «**Status:** proposed.» → «**Status:** accepted (ring.ts:53, :62).»
- `ring-ad03:13` — «"status:proposed"» → «"status:accepted"» (ring.ts:495)
- `ring-ad03:18` — «**Status:** proposed.» → «**Status:** accepted (ring.ts:495).»
- `ring-ad04:13` — «"status:prop» → «"status:accepted"» (ring.ts:462-477)
- `ring-ad04:18` — «**Status:** proposed.» → «**Status:** accepted (ring.ts:462-477).»

Без правки, проверено:
- `ring-as05:15` = «48 power-4 explosions per tick» — верно: `ring_three_budget` мерил это при v1.4.1 (39dc93f), когда все 603 взрыва были силы 4, то есть худший случай.
- `ring-ent1:31-32`, `ring-r001:20-21`, `ring-p001:29,32`, а также «exactly 2 ring neighbours» и «≤ 0.75» в `ring-ac11:17` — инварианты выполняются и на новых радиусах (замер выше).
- `ring-ac13:20`: прогон «владелец в другом измерении» есть в тесте (gametest ring.ts:1110-1145).
- `ring-ad03:21`, `ring-as04:26`: цитаты спеки §10, не числа кода.
- Закрытые записи `ring-cx01:25` и `ring-cx02:29` (21×21 / 37×37 / 19): тело не трогать; статус уже `resolved`.
- Без правки (19): ac12, ai11, ai12, ai15, as01, as02, as04, as07, as08, cx01, cx02, ent3, gl02–gl04, r003, r008–r010. У ad01 и ad03 правится только статус.

## Правки: pntr (43 файла; правок в 20, без правки 23)

Чисел прицела, спавна и колец в узлах pntr нет. Расходятся состояние и устройство:
сделано не так, как было задумано в v3 (src/orbital/README.md:14-27).
- `pntr:13` — «"not-implemented"» → убрать
- `pntr:19` — «**Status.** Analysis only. `src/orbital/` does not exist yet (checked 2026-09-29).» → «**Status (v1.4.4).** Shipped in v1.4.0: `penetrator.ts`, `penetrator-plan.ts`, `penetrator-keep.ts`; deviations in src/orbital/README.md:14-27.»
- `pntr:25` — «including Obsidian, Nether portal, containers and spawners» → «including Obsidian, Nether portal, containers and spawners; a crafter, decorated pot or shelf (no 2.10.0 inventory) and a chest half paired outside the plan are kept (README:22-23)»
- `pntr:27` — «batched top-down in one bounded `system.runJob` job that looks instant» → «the top 16 layers in the detonation tick, the rest in ~512-cell steps from one shared `system.runInterval`, ≤ 25 ms a tick (penetrator.ts:38-46, :615, :678)»
- `pntr:33` — «`pntr` passes the column footprint over its full height, once per attack, before its first `setType`.» → «one call per holder cell, in the step that clears it, `avoid` = live columns within 24 (penetrator.ts:314; README:24).»
- `pntr:34` — «`system.runJob`» → «`system.runInterval`, `Dimension.getBlocks`, `Dimension.fillBlocks`»
- `pntr:39` — «`{attackId, cellsScanned, cellsRemoved, cellsKept, ticksUsed}`» → «`PenetratorReport` (penetrator.ts:78-106)»
- `pntr:48` — «a per-cell scan plus `setType` in one top-down `runJob`, rather than `fillBlocks` or a synchronous loop» → «superseded by its alternative 1: native queries + `fillBlocks`, stepped by one shared `runInterval` (README:25-26)»
- `pntr:51` — «`L0-pntr-cx01` (open)» → «`L0-pntr-cx01` (closed by `L0-adr-oprt` §3; README:19)»
- `pntr-ad01:13` — «"status:proposed"» → «"status:superseded"»
- `pntr-ad01:18` — «**Status:** proposed.» → «**Status:** superseded: the per-cell job failed PN-1 (20–23 µs a cell; 3–4 / 7–10 / 7 ticks), alternative 1 shipped with one shared `runInterval` (README:25-26).» Тело (строки 26-36) остаётся записью отвергнутого варианта
- `pntr-ad02:13` — «"status:proposed"» → «"status:accepted"» (penetrator-plan.ts:14-94)
- `pntr-ad02:18` — «**Status:** proposed.» → «**Status:** accepted (penetrator-plan.ts:14-94).»
- `pntr-ad03:13` — «"status:proposed"» → «"status:accepted"» (penetrator.ts:242-254)
- `pntr-ad03:18` — «**Status:** proposed.» → «**Status:** accepted (penetrator.ts:242-254).»
- `pntr-ad03:23` — «A second bounded `runJob` (or `system.runInterval` cleared after 20 ticks)» → «A `system.runInterval` cleared after `WAVE_TICKS` = 20 (penetrator.ts:30, :244; README:27)»
- `pntr-as02:21` — «`setType` replaces the block silently: no item entities and no XP orbs.» → «… after `clearAll`; `setType` on a paired chest half spills that half (38 items measured), so such a half outside the plan is kept (README:23).»
- `pntr-as03:18` — «There are no measured numbers for `getBlock` + `setType` cost on BDS 1.26.x with `runJob`.» → «Measured on BDS 1.26.51.1: 20–23 µs a cell, 13 µs of it reading (README:25).»
- `pntr-as03:21` — «`runJob` processes at least ~2,000 column cells per tick» → «FAILED: `runJob` moved 1,000–1,500 cells a tick; the hybrid was taken»
- `pntr-as03:22` — «finishes in ≤ 3 ticks, and the worst case (~9,600 cells) in ≤ 6 ticks (PN-1)» → «per-cell: 3–4 / 7–10 / 7 ticks (PN-1 failed); shipped hybrid: 3 / 5 / 4–5 (README:25-26)»
- `pntr-as04:24` — «The solid is removed and the cell becomes `minecraft:water`, a source block.» → «… only for types whose default permutation holds water (714 ids); others lose the water with the block (README:21).»
- `pntr-as08:20` — «Everything that is not air, liquid or on the `xasm6` keep list is removed» → «Everything that is not air, liquid or on the `xasm6` keep list is removed, except holders with no 2.10.0 inventory, a holder whose protection throws, and a chest half paired outside the plan (README:22-23)»
- `pntr-cons:21` — «No `pntr` job step exceeds its `runJob` slice.» → «No tick spends more than `REMOVAL_MS_PER_TICK` = 25 ms of removal (penetrator.ts:46, :592-606).»
- `pntr-cons:21` — «The server tick time must not rise above 50 ms because of one LMB» → «A tick is slow only above max(50 ms, the idle server's own worst tick over 200 ticks) (README:26)»
- `pntr-cons:22` — «2 jobs per attack, both self-terminating» → «a 20-tick wave interval per attack plus one shared removal interval, cleared when no column is left (penetrator.ts:244, :603-615)»
- `pntr-cons:27` — «The fallback is to relax PN-1 to "≤ 10 ticks"» → «Not taken: PN-1 and PN-2 both hold with the hybrid (README:26).»
- `pntr-ac07:24` — «no server tick above 50 ms in (a)» → «no slow tick in (a), slow = above max(50 ms, idle worst) (src/gametest/penetrator.ts:920, :931)»
- `pntr-ent1:21` — «| `dimensionId` | string |» → убрать строку: поля нет в `ColumnPlan` (penetrator-plan.ts:22-33), оно в задании и отчёте
- `pntr-ent1:27` — «| `ownerId` | string | For logging only.» → убрать строку: поля нет, `onDetonate` его не читает (penetrator.ts:684)
- `pntr-ent2:18` — «There are two `system.runJob` generators per attack: **removal** and **wave**.» → «Removal: a generator per attack stepped by one shared `runInterval`; wave: a 20-tick `runInterval` per attack (penetrator.ts:244, :615).»
- `pntr-ent2:23` — «| `cursorY`, `cursorCell` |» → «| `steps`, `removing`, `waving` |» (penetrator.ts:109-121)
- `pntr-ent2:24` — «| `waveTick` | 0…19 for the particle job. |» → «| `waveHandle`, `waveDone` | (penetrator.ts:118-119) |»
- `pntr-ent2:29` — «At most 2 jobs per attack, and both end on their own.» → как `pntr-cons:22`
- `pntr-ent3:24` — «`block.getComponent("minecraft:inventory")` present» → «`HOLDERS.has(typeId)` or an inventory component (penetrator.ts:350)»
- `pntr-ent3:26` — «| `remove` | anything else | `setType("minecraft:air")` |» → «| `remove` | anything else | `fillBlocks` air (penetrator.ts:496) |»
- `pntr-p002:18` — «There is one `system.runJob` generator per attack, and it ends by itself (C-5a′).» → «One generator per attack: top 16 layers in the detonation tick, the rest from one shared `runInterval` (penetrator.ts:38, :615, :678).»
- `pntr-p002:20` — «**Per layer, from `top` down to `bottom`, for each masked `(x, z)` cell:**» → «**Per step of whole bands: two native queries, holders and water-holding cells one by one, then `fillBlocks` air (penetrator.ts:462-508):**»
- `pntr-p002:21` — «`block = dim.getBlock(pos)`.» → «`getBlock` only for holder and water-holding cells; unloaded pieces are skipped and counted.»
- `pntr-p002:28` — «synchronously call `lgnd.protectLegendariesIn(dim, cellVolume)`, then `container.clearAll()`, then `setType("minecraft:air")`» → «protect with `avoid`, `clearAll`, `setType(waterlogged ? water : air)`; crafter/pot/shelf and a pair beyond the plan are kept (penetrator.ts:302-329)»
- `pntr-p002:29` — «Else if `block.isWaterlogged`: `setType("minecraft:water")`.» → «Else if its type holds water by default: `setType("minecraft:water")` (README:21).»
- `pntr-p002:30` — «Else: `setType("minecraft:air")`.» → «Else: `fillBlocks` air (penetrator.ts:496).»
- `pntr-p002:31` — «Every N cells, `yield`. N is tuned so the job stays inside C-5a′ (starting value 512, `L0-pntr-cons`).» → «Steps: first 16 layers, then ~512 cells; steps per tick bounded by 25 ms (penetrator.ts:38-46).»
- `pntr-p002:34` — «`{attackId, scanned, removed, kept, skippedUnloaded, ticks}`» → «`PenetratorReport` (penetrator.ts:78-106), field `ticksUsed`»
- `pntr-p002:44` — «because runJob generators are interleaved, not parallel» → «because steps run round robin from one shared `runInterval`»
- `pntr-p003:20` — «or block removal: `setType` is silent» → «or block removal: `fillBlocks`/`setType` are silent; a frame broken by lgnd plays the engine's break sound (README:19)»
- `pntr-r002:20` — «`barrier`, `light_block`, the command blocks» → «`barrier`, `light_block_0`…`light_block_15` (penetrator-keep.ts:9; README:18), the command blocks»
- `pntr-r003:20` — «crafters and so on)» → «and so on); a crafter, decorated pot and shelf are kept (no 2.10.0 inventory), and so is a chest half paired outside the plan (README:22-23)»
- `pntr-r004:16` — «Blocks are removed with `Block.setType`, never with `/setblock … destroy`, `/fill … destroy` or `createExplosion`.» → «Blocks are removed by `fillBlocks` air; holders and water-holding cells by `setType`; never `createExplosion`. lgnd breaks a frame with `setblock … destroy` (README:19, :25).»
- `pntr-r005:17` — «which is proposed in `L0-xcx10`» → «shipped in src/legendary/recovery.ts, called per holder cell (penetrator.ts:314)»
- `pntr-r005:26` — «Item frames have no stable API (`L0-pntr-cx01`).» → «Item frames go through `protectLegendariesIn` (`L0-adr-oprt` §3; README:19).»
- `pntr-r007:18` — «The job keeps no shared mutable state between attacks» → «Jobs share the `jobs` map, one stepper interval and the `avoid` box»
- `pntr-r007:19` — «`runJob` interleaves them, so each extra concurrent column adds latency and not a per-tick spike» → «one shared `runInterval` steps them round robin within 25 ms; three at once: 4–5 ticks each (README:26)»

Без правки (23): ac01–ac06, ac08, ac09, as01, as05–as07, cx01 (закрытая запись), gl01–gl05, p001, r001, r006, r008, r009. «~5×5» в `pntr:13,24` и `pntr-r001:17` повторяет формулировку спеки; маска — 7×7 при `MASK_RADIUS` 3 (penetrator-plan.ts:18), и сами узлы это оговаривают.

## Вне трёх семейств (тот же источник ошибки)

- `concept-boundary:30` — «Targeting is limited to 10 blocks» → «Targeting is limited to 25 blocks (RMB: no nearer than 7)»
- `concept-boundary:31` — «Charges spawn at +30 (Overworld/End)» → «Charges spawn at +60 (Overworld/End)»
- `lgnd-p009:25` — «`world.afterEvents.entityHitBlock`, where `damagingEntity` is a `Player`.» → «`entityHitBlock` (a `Player` damager) or `playerSwingStart` (`Attack`) + the ray.»
- `lgnd-p009:32` — «It then raycasts `getBlockFromViewDirection({maxDistance: 10})`» → «It then takes the event block within 25, else `getBlockFromViewDirection({maxDistance: 25})`»
- `lgnd-p009:38` — «**Reach.** `entityHitBlock` fires only within vanilla reach, so LMB beyond about 6 blocks cannot trigger.» → «**Reach.** LMB beyond reach arrives as `playerSwingStart` (decision 2026-09-29); not blocking.»
- `xasm8:19` — «approximately 1/5/10/15/20 in diameter» → «approximately 1/7/14/21/28 in diameter» (решение 2026-09-30)
- `xasm8:22` — «(0, 2.5, 5, 7.5, 10)» → «(0.5, 3.5, 7, 10.5, 14)»
- `xasm8:26` — «That gives roughly 1 + 16 + 32 + 48 + 64 ≈ **160** charges per RMB.» → «That gives 1 + 20 + 40 + 60 + 80 = **201** charges per RMB (measured).»
- `xq5:13` — «"status:open", "priority:blocking", "blocks:L0-orbc"» → закрыть: вопрос снят решениями 2026-09-29 (ввод, запрет на задачи) и 2026-10-02 (дальность 25); на устройстве остаётся только проверка `orbc-ac08`
- `xq5:28` — «**This blocks the Orbital Cannon core work.**» → удалить
- `concept-overview:37` — «The v3 Orbital nodes are» → после применения правок фразу «… stale (`xcx16`)» снять. В корне (v6) та же строка 37, плюс строка 104 «Carried … `xcx16`»
- Без правки: `xcx8`, `xcx14` (закрыты решением, тела — запись); `sauc` (числа уже из кода); `sauc-ac04:25` и `sauc-p003:39` («target + 30» — плоскость заглушки между целью и спавном +60, верно и сейчас).

## Найдено вне KV (не правлю: задача — только отчёт; говорю оператору)

1. `src/orbital/README.md:74`: «range 10» → должно быть 25.
2. `src/orbital/stub-effect.ts:9`: «About the charge count of the real five rings (L0-xasm8)». Настоящих колонок 201, а 160 — это старая оценка.
3. Тест колец: комментарий `src/gametest/ring.ts:966` всё ещё называет кольца «ring-5/15/10», а сообщение `:1359` говорит «6 blocks outside ring 20». Позиции 5/6/5 и 16 блоков остались от старой геометрии.
4. Ожидание в `src/gametest/ring.ts:1428` (`fireTick + 60`), сообщения `:1455-1456` и README:63 («60 ticks after the shots») написаны при спавне +30 (df4760e). При +60 проверка фактически идёт после отчётов, около 73 тиков, а не через 60.
5. У силы 4 в грунте два замера: 133 клетки (решение и README:48) против 126 (комментарий `src/gametest/ring.ts:372`). Они не сведены.
