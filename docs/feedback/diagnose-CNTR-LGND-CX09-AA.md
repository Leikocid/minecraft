# Diagnose CNTR-LGND-CX09-AA — CX-lgnd-09 (loss return: owner vs last holder, no generation guard)

ИСХОД: 2 — Работа над кодом (пп. 2–3 утверждения). П. 1 требует решения оператора, поэтому узел `L0-lgnd-cx09` остаётся открытым. П. 4 закрыт уже принятым решением.

- Разбор выполнен на коде `32f4aca` (HEAD ветки при разборе).
- Стенд: BDS 1.26.51.1 в Docker (частный экземпляр `bds-cx09`), GameTest, прогон 2026-09-29 19:37 UTC.
- Артефакт красного прогона: `/Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-LGND-CX09-AA/2.red.json`. Команда `ai-kit run-check --expect-red`, exit 1, `run_kind: against_workspace`, в `file_hashes` лежат незакоммиченные тесты-репро.
- Исходник репро — в приложении. В дерево он не коммитился: красный тест сломал бы общий `bds:gametest`.

## 1. Проверка утверждения по пунктам

| # | Утверждение KV | Чем проверено | Результат |
|---|---|---|---|
| 1 | Возврат идёт `mark.owner`, поля `holder` нет | `recovery.ts:219,225,228` — везде `w.mark.owner`. `Mark = {origin, owner, id, ownerName?}` (`rules.ts:15-21`). `grep -rnwE 'holder\|gen' src/legendary` находит только локальные переменные (`craftgate.ts:54`, `recovery.ts:154`) | **Верно.** Кому возвращать — вопрос решения, он уходит оператору (§5) |
| 2 | Поколения нет. Незамеченный подбор даёт живой дубль с тем же id | Живой прогон, 3 сценария (ниже) | **Верно, дефект воспроизведён** |
| 3 | `_owed` хранит одну метку на владельца, долги перезаписываются | Живой прогон | **Верно, дефект воспроизведён** |
| 4 | Скан инвентарей всех онлайн-игроков шире формулировки C-5 | `recovery.ts:188-199`. Скан идёт внутри `check()` только для исчезнувшей наблюдаемой сущности в загруженном чанке, то есть один раз на событие | **Верно, но уже принято:** `L0-adr-wpn2`, решение (4) — «event-scoped and bounded, accepted under C-5a». Работы нет |

Числа из утверждения, перепроверенные той же операцией:

- «within 40 ticks»: `CHECK_INTERVAL_TICKS = 40` (`recovery.ts:34`). **Верно.**
- «эвристики: 3». **Неверно, их 4.** Утверждение пропускает набор `seenInInventory` из `playerInventoryItemChange` (заполняется в `recovery.ts:69-86`, читается в `180-182`). На вердикт это не влияет: набор тоже видит только инвентари игроков.
- «same id»: `restore()` штампует ту же метку: `markItem(def, new ItemStack(...), mark)` (`retention.ts:216`). Прогон дал одинаковый `ws_id` у копии владельца и у копии в сундуке. **Верно.**
- «survivor stays fully live»:
  - активация проверяет только `typeId`: `heldLegendaries` → `defForStack` (`hands.ts:17-40`), метка и id не смотрятся;
  - удержание при смерти берёт любую помеченную копию: `findMarked` (`state.ts:90-103`).

  **Верно по коду.** Сам каст второй копией в прогоне не выполнялся.
- «allay, fox»: не прогонялись. Механизм тот же (инвентарь сущности не сканируется), но живьём это **не доказано**.
- Адрес `recovery.ts:253` в нескольких узлах KV (см. §6-B) неточен: `owed[ownerId] = …` стоит в строке **254**, а 253 — это `const owed = readOwed(def)`.

## 2. Блоки /diagnose

```text
OBSERVED: code at 32f4aca: recovery.ts:219-231 returns a lost legendary to mark.owner; Mark has
          no holder/gen; _owed is Record<ownerId, one mark> (recovery.ts:252-256). Live on BDS
          1.26.51.1 (2.red.json): one ws_id in two places after recovery (hopper→chest,
          hopper minecart); an offline owner's two lost copies leave one owed entry.
VERDICT:  items 2–3 bug — breaks C-7′ ("no duplication of any legendary … through a container,
          the Void") and C-15 rank 1; the fix is already ordered by accepted L0-adr-wpn2 (1)–(2).
          item 1 decision-change — decision-l0-xq3 (2026-09-26, autopilot) keeps the crafter;
          L0-adr-hold (proposed) would reverse it. item 4 — accepted by L0-adr-wpn2 (4).

REPRO:    env ANDREW_BDS_DIR=bds-cx09 node scripts/bds-gametest.mjs --only andrew:legendary_cx09_*
          (source in the appendix); 3 runs, deterministic: the same verdicts every run.
CAUSE:    check() (recovery.ts:132-162) runs every 40 ticks; whereIs() (178-216) accepts a pickup
          only if seen via playerInventoryItemChange, as another watched entity, in an online
          player's inventory, or in a BLOCK container at dy 0/−1 of the last watched location.
          A hopper pushes the item on before the check; a hopper minecart is an entity inventory
          → lost() (218-231) → setPending + restore → a second stack with the identical mark
          (retention.ts:216). Casting and death retention do not distinguish the two.
          Owed: setOwed writes owed[ownerId] = mark (recovery.ts:254) — one slot per owner.
PROOF:    2.red.json — legendary_cx09_hopper_to_chest {"owner":1,"chest":1,"hopper":0} total=2 FAIL;
          legendary_cx09_hopper_minecart {"owner":1,"minecart":1} total=2 FAIL;
          legendary_cx09_owed_two_losses: two losses logged "owner -8589934582 offline, owed on
          next join" ×2, owed keeps 1 of 2 (only 199-4g7r6vu22cu, the second) FAIL.
RULED OUT: "the harness itself, or hoppers in general, make the duplicate" — control
          legendary_cx09_hopper_alone (hopper with no container in front) logs "picked up — in a
          container at the spot", total=1, PASS; the red needs the item to move on / sit in an
          entity inventory. Also ruled out for item 3: the first owed run read "0 of 2" because
          my teleport in the spawn tick made recovery log "unloaded with its chunk" — a harness
          artefact; fixed (teleport 3 ticks after the drop, as legendary_returns_from_void does).

RADIUS:   who depends on the mark/ledger the fix changes — found by grep -rlw over src/:
          markItem: craftgate.ts, commands.ts, retention.ts, state.ts, gametest/main.ts;
          getMark: craftgate.ts, retention.ts, recovery.ts, state.ts, gametest/main.ts;
          get/setPending: retention.ts, recovery.ts (+ gametest);
          parseMark/serializeMark: rules.ts, state.ts, recovery.ts; node test tests/web-sword-rules.test.mjs;
          resolveActivation: websword/trap.ts, scythe/targeting.ts (liveness gate goes here);
          heldLegendaries: hud.ts. Persistent keys: andrew:ws_*/sc_* (registry.ts keysFor —
          changing a key orphans existing swords). KV: ad02, r005, ent2, ent4, p003, ac08, ac10,
          cx02 ruling in L0-adr-lgnd. The gen guard is a guard, not a restriction: it only makes
          stale stacks inert, a state that is never correct today either.

GREEN:    not applicable — this task is a report by instruction; no fix was written.
LIVE:     the red run is the live system: the release code path recovery.ts lost() was entered
          (log: "vanished from the ground; returning to cx09_owner_30",
          "… owner -8589934582 offline, owed on next join").
```

## 3. Резолюция для `refine resolve` (L0-lgnd-cx09)

> Разобрано задачей CNTR-LGND-CX09-AA 2026-09-29. Код `32f4aca`, стенд BDS 1.26.51.1, артефакт `.ai/verify/CNTR-LGND-CX09-AA/2.red.json`.
>
> **П. 2 подтверждён живым прогоном.**
> - Хоппер над сундуком: `{owner:1, chest:1}`.
> - Хоппер-вагонетка: `{owner:1, minecart:1}`.
> - У обеих копий один `ws_id`. Контроль «хоппер без выхода» даёт 1 копию.
> - Активация проверяет только `typeId` (`hands.ts:17-40`). Значит, выживший экземпляр — второй живой (нарушение C-7′), а не безвредная устаревшая копия из cx02.
>
> **П. 3 подтверждён.** Две потерянные копии офлайн-владельца: `owed[owner]` хранит 1 из 2 (`recovery.ts:254`).
>
> **Решение по пп. 2–3.**
> - Это дефекты. Исправление уже решено в `L0-adr-wpn2` (1)–(2): `gen` и список `owed`. Постановка передана в отчёте.
> - Вариант (b) «принять окно дюпа» противоречит C-7′, C-15 и принятому ADR, поэтому отклонён.
>
> **П. 4 закрыт** решением `L0-adr-wpn2` (4): скан онлайн-инвентарей идёт по событию, один раз на исчезнувшую сущность (C-5a).
>
> **П. 1 (кому возвращать) открыт.**
> - `decision-l0-xq3` (2026-09-26) оставил скрафтившего.
> - `L0-adr-hold` (proposed) и Orbital §5 ведут к последнему державшему.
> - Это смена принятого решения — за оператором. Тот же вопрос стоит в `L0-xcx11` / CNTR-XCX11-AA.
>
> Узел закрывается после ответа по п. 1 и мержа задачи по пп. 2–3.

## 4. Постановка задачи (пп. 2–3)

**Заголовок:** Loss return: generation guard and an owed list, so an unseen pickup never leaves a second live legendary.
**parent_work_goal:** `L0-lgnd-cx09` пп. 2–3. Это backlog-строка «`gen` plus the `_owed` list» из `L0-adr-wpn2`, которая так и не была заведена: на борде нет задачи ни в backlog, ни в active, ни в done (проверено `task_list` 2026-09-29).

**Наблюдение.** См. PROOF выше и `2.red.json`. Сценарии лежат в приложении: это готовая красная проверка, её переносят в `src/gametest/` вместе с исправлением.

**Механизм.** См. CAUSE. Два незамеченных пути подбора (хоппер, передающий предмет дальше, и хоппер-вагонетка) — обычные постройки Survival, без команд. Перезапись `owed` требует двух помеченных копий одного оружия у одного владельца: craft + `/andrew:<cmd> give` или две admin-копии. Путь достижим, но только с участием оператора.

**Дизайн уже принят, заново его не изобретать:**
- `L0-lgnd-ad02`, `L0-lgnd-r005`;
- `L0-lgnd-ent2` — только поле `gen`;
- `L0-lgnd-ent4` — мировой `andrew:<p>_gen:<id>`; `owed` как список, старое значение с одной меткой читается как список из одного элемента;
- `L0-lgnd-p003`, шаги 1, 3, 4, 5, 6. Цель возврата в шаге 4 остаётся `owner`, пока оператор не ответит по п. 1.

**Не входит:**
- `holder` — ждёт оператора, см. §5 и CNTR-XCX11-AA;
- v3-части: craft tokens, `protectLegendariesIn`.

**Критерии приёмки:**

1. `[e2e]` `legendary_cx09_hopper_to_chest`.
   - После возврата у владельца лежит копия с `gen` g+1.
   - Копия в сундуке (`gen` g) в руке игрока не активирует способность и не запускает кулдаун.
   - На первом событии инвентаря игрока она удаляется с приватным сообщением `voided` (`ac10`).
   - При смерти она не удерживается.
2. `[e2e]` `legendary_cx09_hopper_minecart` — то же самое.
3. `[e2e]` `legendary_cx09_hopper_alone` (контроль): возврата нет, `gen` не меняется.
4. `[e2e]` `legendary_cx09_owed_two_losses`.
   - В `owed` лежат обе записи.
   - При повторном входе владелец получает обе копии, каждую ровно один раз.
   - Записи переживают рестарт (прогон `bds:check` в две фазы).
5. `[e2e]` Игрок с отложенной меткой смерти по копии A и записью `owed` по копии B получает обе. Сейчас `redeemOwed` удаляет B без выдачи, когда pending уже есть (`recovery.ts:270-273`). Этот путь найден чтением кода, живьём не прогонялся.
6. `[unit]` Разбор меток:
   - `parseMark` читает метку без `gen` как `gen` 0;
   - некорректный `gen` делает метку некорректной;
   - старое значение `owed` `{id: "<mark json>"}` читается как список из одного элемента.
7. `[e2e]` Полный `bds:gametest` зелёный, регрессий нет: `legendary_returns_from_void`, `legendary_survives_lava`, `legendary_pickup_no_duplicate`, `websword_death_returns`, `websword_unmarked_drops`.
8. `[build]` `npm run build` и `tsc` в режиме strict зелёные. У проверки поколения стоит комментарий по C-16: стабильный API не сообщает причину удаления сущности.

## 5. Оператору (п. 1, решение — не агента)

**Вопрос.** Кому возвращается потерянное легендарное оружие?
- **(a)** Тому, кто его скрафтил. Так работает сейчас; так решил автопилот 2026-09-26 (`decision-l0-xq3`).
- **(b)** Последнему игроку, у которого оно было в инвентаре. Это `L0-adr-hold`.

**Что говорит текст спецификаций (сверено с raw):**
- Orbital §5: «Оружие не привязано навсегда к создателю: его можно … передать другому игроку» и «падает в Void — возвращается последнему владельцу».
- Там же, §5: «Если оружие лежит в контейнере, смерть прежнего владельца ничего с ним не делает». Здесь «владелец» — тот, у кого оружие было, а не создатель.
- Scythe §1: «возвращается последнему владельцу по общим правилам».
- `decision-l0-xq3` сам признаёт: «по букве спеки прав вариант «последнему державшему»». Он оставил (a) только затем, чтобы не менять принятое на iPad поведение внутри эпика про структуры.

**Цена каждого ответа:**
- **(a):** переписать `ac08` («last holder» → «crafter»), снять `ac18`, отклонить `adr-hold`. Остаётся обмен, который отмечен в `xcx11`: B «возвращает» оружие A, уронив его в Void.
- **(b):** принять `adr-hold`, `decision-l0-xq3` становится замещённым. Задача по `holder` (`ent2`, `ad11`, `ac08`, `ac18`) идёт после задачи §4.

Подготовлено: цитаты и перечень затрагиваемых узлов. Решение за человеком.

## 6. Дубликаты в KV (пути от `.ai/context/analysis/`; не правились)

**A. Список эвристик: 3 → 4.**
- Где:
  - `nodes/lgnd-cx09__concept-contradiction.md:32-35`
  - `contradictions.md:227-230`
  - `risks.md:234-237`
- Что заменить: в список «Mis-classification is reduced by heuristics» добавить «a `playerInventoryItemChange` seen-set (`recovery.ts:69-86`, `180-182`)».
- Там же, строки `:37` / `:232` / `:239`: «(an allay, a hopper minecart, a hopper chain …, a fox) … a real duplicate» → «measured on BDS 1.26.51.1: hopper→chest and hopper minecart leave two live copies with one ws_id (`.ai/verify/CNTR-LGND-CX09-AA/2.red.json`); allay and fox not run».

**B. `recovery.ts:253` → `recovery.ts:254`.** Строки:
- `nodes/lgnd-cx11__concept-contradiction.md:38`
- `nodes/lgnd__concept-component.md:30`
- `project-knowledge/architecture.md:35`
- `project-knowledge/domain-model.md:426`

**C. Посылка cx02 «устаревшая копия безвредна» сейчас ложна: `gen` не построен.**
- `nodes/lgnd-cx02__concept-contradiction.md:29`, `contradictions.md:34`, `risks.md:34`: «Autopilot default: (a)» → «(a) holds only once the gen guard ships (L0-adr-wpn2 (1)); as built at 32f4aca the survivor is a second live copy — measured, CX-lgnd-09 item 2».
- `nodes/adr-lgnd__concept-architecture-decision.md:28`: к «(a) Accept. A stale generation cannot cast» добавить «— conditional on the unbuilt gen guard».
- `nodes/lgnd-ad02__concept-architecture-decision.md:32`: «costs a harmless stale copy, never a second live one» → пометить как цель; дописать «as built: a second live copy (2.red.json)».

**D. Ответ на xq3 (`decision-l0-xq3`, 2026-09-26) не упомянут в узлах про holder.**
- `nodes/xq3__concept-client-question.md:26`: «Autopilot keeps (a) until you answer» → добавить «— recorded as decision-l0-xq3».
- `nodes/adr-hold__concept-architecture-decision.md:20-21`: добавить «L0-xq3 is answered by the autopilot default decision-l0-xq3 (crafter); this ADR changes that decision».
- `nodes/xcx11__concept-contradiction.md:23`: «kept the as-built owner pending the client's answer» → «… recorded as decision-l0-xq3 (crafter)».
- `project-knowledge/architecture.md:46` (v3 delta, строка 4): «Loss return goes to the **last holder**» → «… if the operator accepts L0-adr-hold; today decision-l0-xq3 = crafter».
- `nodes/lgnd-gl06__concept-glossary-term.md:19`, `project-knowledge/glossary.md:550`: «The last holder is who gets the item back» → «under L0-adr-hold (proposed); as built and per decision-l0-xq3 — the crafter (`owner`)».
- `nodes/orbc-r009__concept-rule.md:23`, `project-knowledge/business-rules.md:595`: «(return to the last holder)» → «(return target per L0-xq3)».
- `nodes/lgnd-ac08__concept-acceptance-criterion.md:20` (+ `scope.md:172`, `glossary.md:170`) и `nodes/lgnd-ac18__concept-acceptance-criterion.md:20` (+ `scope.md:399`, `glossary.md:397`): критерии предполагают ответ (b). Пометить «pending operator on L0-xq3». Абзац `ac08` про «two instances … both redeemed» от цели возврата не зависит и остаётся.

**E. Противоречие двух решений (сами решения не правятся, только отмечено).**
- `decisions/decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk.md:16`: «выдаётся обратно последнему владельцу».
- `decisions/decision-l0-xq3-vozvrat-poteryannogo-oruzhiya-kraftivshem.md:28`: «возврат крафтившему».
- Действует более позднее решение (xq3).

**F. Борд, не KV.** Заголовок `LG-KEEP-02-AA` (done): «возврат … последнему владельцу». Отгруженный код возвращает скрафтившему.

## 7. Попутные наблюдения (вне утверждения; живьём не доказаны)

1. **Долг теряется ещё двумя путями того же класса** (одна ячейка на игрока). Найдено чтением кода, в прогоне не было:
   - `lost()` для онлайн-владельца вызывает `setPending` и перезаписывает уже лежащую метку смерти другой копии (`recovery.ts:228`);
   - `redeemOwed` удаляет запись `owed`, если pending уже есть (`recovery.ts:270-273`).

   Оба пути требуют двух помеченных копий у одного игрока. В постановку включён критерий 5.
2. **Предмет, который уже ниже `heightRange.min` в момент `entitySpawn`, считается выгруженным, а не потерянным.** Если движок убирает его до первой 40-тиковой проверки, `isChunkLoaded` для этой точки даёт false, recovery пишет «unloaded with its chunk», и ничего не возвращается.
   - Наблюдалось на моём артефакте: телепорт в тике спавна, прогон 2.
   - Бывает ли так в реальной игре (игрок ниже пола бросает предмет до смерти от Void), не проверено.

## Приложение A. Репро (не закоммичено)

Подключение: `import "./cx09-repro";` в `src/gametest/main.ts` после `import "./bastion-body";` и четыре имени в `EXPECTED_TESTS` (`scripts/bds-gametest.mjs`) после `'andrew:legendary_pickup_no_duplicate'`:
`andrew:legendary_cx09_hopper_to_chest`, `andrew:legendary_cx09_hopper_alone`, `andrew:legendary_cx09_hopper_minecart`, `andrew:legendary_cx09_owed_two_losses`.

`src/gametest/cx09-repro.ts`:

```ts
// CX-lgnd-09 repro (uncommitted): a pickup the recovery heuristic cannot see is
// classed as a loss, and the owner is handed a second copy with the same id.

import { BlockPermutation, type Container, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { type Test, register } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";

const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const WAIT_TICKS = 160;

type Counter = (id: string) => Record<string, number>;

function count(container: Container | undefined, id: string): number {
  if (container === undefined) return -1;
  let n = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (state.isItemOf(WEB_SWORD, stack) && state.getMark(WEB_SWORD, stack)?.id === id) n++;
  }
  return n;
}

function onGround(test: Test, id: string): number {
  return test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 16 })
    .filter((e) => {
      const s = e.getComponent("minecraft:item")?.itemStack;
      return state.isItemOf(WEB_SWORD, s) && state.getMark(WEB_SWORD, s)?.id === id;
    }).length;
}

function scenario(name: string, build: (test: Test) => Counter, dropAt: Vector3): void {
  register("andrew", name, (test: Test): void => {
    const owner = test.spawnSimulatedPlayer(STAND_A, `cx09_owner_${name.length}`, GameMode.Survival);
    const elsewhere = build(test);
    test.runAfterDelay(4, () => {
      const mark = state.makeMark("admin", owner);
      const id = mark.id;
      test.getDimension().spawnItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark), test.worldLocation(dropAt));
      console.warn(`[cx09] ${name}: dropped ws_id ${id} at tick ${system.currentTick}`);
      test.runAfterDelay(WAIT_TICKS, () => {
        const where: Record<string, number> = {
          owner: count(owner.getComponent("minecraft:inventory")?.container, id),
          ground: onGround(test, id),
          ...elsewhere(id),
        };
        let total = 0;
        for (const n of Object.values(where)) total += n > 0 ? n : 0;
        console.warn(
          `[cx09] ${name}: ws_id ${id} copies ${JSON.stringify(where)} total=${total} ` +
            `pending=${state.getPending(WEB_SWORD, owner) !== undefined} tick ${system.currentTick}`
        );
        test.assert(total === 1, `${total} copies of ws_id ${id} exist (${JSON.stringify(where)}), expected exactly 1`);
        test.succeed();
      });
    });
  })
    .structureName("andrew:platform")
    .maxTicks(WAIT_TICKS + 60)
    .tag("andrew");
}

const HOPPER: Vector3 = { x: 5, y: 3, z: 1 };
const CHEST: Vector3 = { x: 5, y: 2, z: 1 };
const DROP_OVER_HOPPER: Vector3 = { x: 5.5, y: 4.3, z: 1.5 };

function inventoryAt(test: Test, at: Vector3): Container | undefined {
  return test.getBlock(at).getComponent("minecraft:inventory")?.container;
}

// Hopper facing down into a chest: the hopper pulls the sword and pushes it on
// within 8 ticks, so the 40-tick check finds both the spot and the cell below empty.
scenario(
  "legendary_cx09_hopper_to_chest",
  (test) => {
    test.setBlockType("minecraft:chest", CHEST);
    test.setBlockPermutation(BlockPermutation.resolve("minecraft:hopper", { facing_direction: 0 }), HOPPER);
    return (id) => ({ chest: count(inventoryAt(test, CHEST), id), hopper: count(inventoryAt(test, HOPPER), id) });
  },
  DROP_OVER_HOPPER
);

// Control: a hopper with no container in front keeps the sword at dy=-1, which
// the heuristic does scan. Expected green on the as-built code.
scenario(
  "legendary_cx09_hopper_alone",
  (test) => {
    test.setBlockPermutation(BlockPermutation.resolve("minecraft:hopper", { facing_direction: 2 }), HOPPER);
    return (id) => ({ hopper: count(inventoryAt(test, HOPPER), id) });
  },
  DROP_OVER_HOPPER
);

// Hopper minecart: an entity inventory, which the heuristic never scans.
scenario(
  "legendary_cx09_hopper_minecart",
  (test) => {
    test.setBlockType("minecraft:rail", { x: 5, y: 2, z: 3 });
    const cart = test.spawn("minecraft:hopper_minecart", { x: 5, y: 2, z: 3 });
    return (id) => ({ minecart: cart.isValid ? count(cart.getComponent("minecraft:inventory")?.container, id) : -1 });
  },
  { x: 5.5, y: 3.6, z: 3.5 }
);

// Two different marked copies owned by one offline player are both lost: the
// owed map keeps one entry per owner, so the second loss overwrites the first.
register("andrew", "legendary_cx09_owed_two_losses", (test: Test): void => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "cx09_offline_owner", GameMode.Survival);
  const ownerId = owner.id;
  const a = state.makeMark("admin", owner);
  const b = state.makeMark("admin", owner);
  test.runAfterDelay(4, () => {
    owner.disconnect();
    test.runAfterDelay(4, () => {
      const entities = ([[a, 1.5], [b, 5.5]] as const).map(([mark, x]) =>
        test
          .getDimension()
          .spawnItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark), test.worldLocation({ x, y: 2.2, z: 1.5 }))
      );
      // Watched on the platform first, then into the Void, as legendary_returns_from_void does.
      test.runAfterDelay(3, () => {
        for (const entity of entities) {
          const floor = entity.dimension.heightRange.min;
          entity.teleport({ x: entity.location.x, y: floor - 8, z: entity.location.z });
        }
        console.warn(`[cx09] owed_two_losses: owner ${ownerId} offline, lost ws_id ${a.id} and ${b.id}`);
      });
      test.runAfterDelay(WAIT_TICKS, () => {
        const raw = world.getDynamicProperty(`andrew:${WEB_SWORD.keyPrefix}_owed`);
        const owed = typeof raw === "string" ? (JSON.parse(raw) as Record<string, string>) : {};
        const entry = owed[ownerId] ?? "";
        const kept = [a.id, b.id].filter((id) => entry.includes(id));
        console.warn(`[cx09] owed_two_losses: owed[${ownerId}] = ${entry || "(none)"}; debts kept ${kept.length} of 2`);
        test.assert(kept.length === 2, `owed keeps ${kept.length} of 2 debts for the offline owner: ${entry || "(none)"}`);
        test.succeed();
      });
    });
  });
})
  .structureName("andrew:platform")
  .maxTicks(WAIT_TICKS + 60)
  .tag("andrew");
```
