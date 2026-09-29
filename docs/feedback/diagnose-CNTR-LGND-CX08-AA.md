# Diagnose CNTR-LGND-CX08-AA — CX-lgnd-08 · hand priority is coded, but neither item can be held in the off hand

ИСХОД: 2 — Работа над кодом

Утверждение составное. Ядро подтверждено замером на движке. Одна часть **опровергнута**: механизм «ложного зелёного» указан неверно. Ещё одна часть (перетаскивание в UI на iPad и половина `as07` про `itemUse`) здесь не проверяема. **Поэтому узел `L0-lgnd-cx08` не закрывается**, пока правка не отгружена и не проверена на iPad.

Всё измерено на HEAD `32f4aca` (2026-09-29), BDS 1.26.51.1, `@minecraft/server` 2.10.0.

## Части утверждения

| # | Утверждение (строка узла) | Замер | Итог |
|---|---|---|---|
| 1 | decision-legendary-hand-priority и decision-resolve-cool-ctr3 требуют приоритет рук сейчас (`:26`) | `decisions.md:316`, `:371`, оба 2026-09-24; первое прямо отменяет Q-010 (`decisions.md:151`, 2026-09-21) | верно |
| 2 | `L0-lgnd-r004` **и `L0-scyt-r009`** требуют `allow_off_hand: true` (`:27`) | `lgnd-r004:29` требует для обоих предметов. `scyt-r009:29` **не требует**, а фиксирует отсутствие («**No `minecraft:allow_off_hand`**»). Требование для Косы — `adr-scyt:38` (шаг 2) и `adr-wpn2:26` | наполовину неверно (ссылка) |
| 3 | `hands.ts` идёт по основной руке, затем по второй (`:30`) | `src/legendary/hands.ts:20` `[Mainhand, Offhand]`, `:34-41` `resolveActivation`; единственное изменение — `392253d` 2026-09-24 | верно |
| 4 | `hud.ts` рисует обе руки (`:31`) | `src/legendary/hud.ts:36` итерирует `heldLegendaries` (обе руки), дедуп по ability key | верно |
| 5 | `grep -rl allow_off_hand packs/` не находит ни одного JSON (`:32`) | тот же grep: пусто, exit 1; предметов 4 (`find packs -path '*/items/*'`), с компонентом 0; `git log --all -S allow_off_hand -- packs src tests` пусто: в коде не было никогда | верно |
| 6 | без компонента Bedrock не пускает кастомный предмет во вторую руку (`:32`) | строка в бинаре `bedrock_server-1.26.51.1`: «The allow_off_hand component determines whether the item can be placed in the off hand slot of the inventory.»; `setEquipment(Offhand)` → `false` для обоих предметов (прогон A); с компонентом → `true` (прогон B). Перетаскивание в UI на устройстве не наблюдалось | верно для движка; UI — остаток (iPad) |
| 7 | ветка Offhand в `resolveActivation` на практике мертва (`:35`) | в Survival без команд — да. Через `/replaceitem … slot.weapon.offhand` оператор кладёт предмет во вторую руку, и `resolveActivation` → `slot=Offhand def=andrew:web_sword` (прогон A) | верно с оговоркой |
| 8 | `ac04`–`ac06` нельзя поставить на реальном клиенте (`:36`) | игрок через инвентарь — нет (п. 6). Оператор с читами — да, через `/replaceitem`: замерено на SimulatedPlayer, на iPad не проверялось | уточнить |
| 9 | GameTest может навязать слот через **`Equippable.setEquipment(Offhand)`** → ложный зелёный (`:37`) | **Неверно.** `setEquipment` возвращает `false` и оставляет слот пустым (A). Навязывает слот `/replaceitem` (A: successCount=1, резолвер берёт вторую руку). После правки `setEquipment`, вернувший `true`, становится **честной** bds-проверкой | опровергнуто: механизм другой |
| 10 | после правки `as07` измеряется «на 1.26.50» (`:40`) | Половина `as07` про `allow_off_hand` измерена на BDS 1.26.51.1: компонент принят и применён на кастомном мече и кастомной мотыге (B: `true`, 0 строк content log). Половина про `itemUse` из второй руки — только клиент | наполовину закрыто |

## /diagnose

```text
OBSERVED: KV-узел L0-lgnd-cx08 (analysis v3, status open). Перемерено на HEAD 32f4aca:
          grep -rl allow_off_hand packs/ → пусто (exit 1); из 4 JSON предметов компонент в 0.
          hands.ts:20 Mainhand→Offhand; hud.ts:36 рисует каждый удерживаемый легендарный.
          decision-legendary-hand-priority + resolve-cool-ctr3 (2026-09-24) требуют приоритет
          сейчас и отменяют Q-010.
VERDICT: бага. Записанное ожидание (Scythe §6, decision-legendary-hand-priority, принятый
         L0-adr-wpn2 «Fix the items», lgnd-ac04..06, scyt-ac16) расходится с отгруженным JSON.
         Ожидание в силе: L0-adr-wpn3 (v3, accepted) ставит это шагом 1 задачи lgnd v3.
         Это не смена решения: альтернатива из узла («клиент отказывается от второй руки»)
         противоречит двум принятым решениям оператора.

REPRO: (1) статика: ai-kit run-check --expect-red → «legendary items admitted to the off
       hand by JSON: 0/2», код 1 → .ai/verify/CNTR-LGND-CX08-AA/2.red.json.
       (2) движок: разовый GameTest-зонд на приватном BDS 1.26.51.1 (bds-cx08), предметы
       как в HEAD: setEquipment(Offhand, web_sword | scythe) → returned=false, слот пуст.
       2 прогона из 2 (21:32, 21:34 CEST), детерминированно.
CAUSE: в packs/behavior/items/web_sword.json и scythe_of_calamity.json нет
       "minecraft:allow_off_hand"; движок пускает предмет во вторую руку только с ним.
PROOF: .ai/verify/CNTR-LGND-CX08-AA/2.json — один прогон A→B. A (HEAD) отказывает обоим.
       B добавляет только компонент — пускает обоих (returned=true, readBack совпадает).
       Контроли не сдвинулись: diamond_sword отказ в A и в B; shield, totem приняты в A и в B.
       Строк content log про компонент в B: 0.
       Не исполнимо здесь: перетаскивание в UI на iPad и itemUse из второй руки (as07).
RULED OUT: (1) механизм из самого утверждения «GameTest навязывает слот через
           setEquipment(Offhand)» — ложь: returned=false, слот пуст. Навязывает
           /replaceitem (successCount=1 → resolveActivation slot=Offhand).
           (2) «слот открывает идентичность меча/инструмента (hand_equipped, is_sword)» —
           ванильный diamond_sword отклонён и в A, и в B; A и B различаются только компонентом.

RADIUS: как искал: grep Offhand|EquipmentSlot|getEquipment по src/ (только hands.ts и
        gametest); прочитаны retention.ts:101-114, :231, craftgate.ts:103-125;
        PlayerInventoryType в @minecraft/server 2.10.0 index.d.ts:2615 = Hotbar|Inventory;
        grep allow_off_hand по живому KV. Временная правка замерена: validate ok,
        545/545 unit (ровно столько же без неё: ни один тест компонент не видит), build ok,
        компонент в .mcaddon.
        Кто зависит:
        - retain() (retention.ts:101-114) и carriesInstance() (:231) читают только
          контейнер. Легендарный предмет во второй руке невидим для удержания при смерти
          (lgnd-cx10; adr-wpn2: «the off-hand read is mandatory once the fix above ships»).
        - craft gate (craftgate.ts:103-125) сканирует только контейнер, а у
          playerInventoryItemChange нет типа Offhand. Немеченый крафт, положенный прямо во
          вторую руку, не получает claim/refund, пока его не переложат. Вывод из типов,
          не замер. Craft-токены (adr-wpn3 шаг 3) заменяют этот путь.
        - hud.ts, hands.ts уже читают обе руки — не меняются.
        - Орбитальная пушка: orbc-ent1:30 планирует тот же компонент.
        Правка добавляет возможность и ничего не отнимает — не ограничение. Но без чтения
        второй руки в retention она открывает новую потерю: предмет во второй руке выпадет
        при смерти. Отгружать вместе.

GREEN: правки нет — задача только отчёт. Механизм зелёный заранее: прогон B в 2.json
       (компонент → setEquipment true). Что прогон трогает тот же предмет: readBack
       возвращает andrew:web_sword / andrew:scythe_of_calamity, контроль diamond_sword
       по-прежнему отклонён.
LIVE: на iPad не запускалось. Остаются: перетаскивание обоих предметов во вторую руку
      в Survival, двухсегментный бар (ac06) и половина as07 про itemUse.
```

## Резолюция для `refine resolve L0-lgnd-cx08`

> Перемерено 2026-09-29 на HEAD 32f4aca, BDS 1.26.51.1. `grep -rl allow_off_hand packs/` → 0 файлов (из 4 JSON предметов). `git log --all -S allow_off_hand -- packs src tests` → пусто. `hands.ts:20` идёт Mainhand→Offhand (392253d, 2026-09-24), `hud.ts:36` рисует обе руки. Движок: без компонента `setEquipment(Offhand, andrew:web_sword | andrew:scythe_of_calamity)` → `false`, слот пуст. С одним добавленным `"minecraft:allow_off_hand": true` → `true`, 0 строк content log (`.ai/verify/CNTR-LGND-CX08-AA/2.json`; красный статический 0/2 — `2.red.json`). Контроли не сдвинулись: `diamond_sword` отклонён в обоих прогонах, `shield`/`totem` приняты в обоих. Поправка к узлу: слот навязывает не `setEquipment`, а `/replaceitem … slot.weapon.offhand` (successCount=1, `resolveActivation` → Offhand). Поэтому ложный зелёный даёт GameTest, собранный на `/replaceitem`; `setEquipment` с проверенным `true` — честная bds-проверка. `L0-scyt-r009` компонент не требует, а фиксирует его отсутствие; требование для Косы — `L0-adr-scyt` шаг 2 и `L0-adr-wpn2`. Половина `as07` про `allow_off_hand` измерена (принят и применён на кастомных мече и мотыге, 1.26.51.1). Половина про `itemUse` из второй руки и перетаскивание в UI — только iPad. Работа — шаг 1 задачи `lgnd` v3 по `L0-adr-wpn3`. Узел открыт до отгрузки и проверки на iPad.

## Постановка (исход 2)

**Отдельной карточкой не заводить.** Это шаг 1 задачи `lgnd` v3 (`L0-adr-wpn3` §Sequencing, строка `lgnd-cx08/cx10`). Тот же факт уже разобран соседом `CNTR-COOL-CTR3-AA` (`docs/feedback/diagnose-CNTR-COOL-CTR3-AA.md` на ветке `task/CNTR-COOL-CTR3-AA`), и его постановку он направил сюда. Ниже — объединённая постановка с поправкой про `setEquipment`.

**Наблюдение.** Spec §6 (Scythe) и decision-legendary-hand-priority требуют второй руки: приоритет и показ состояния. Код это умеет (`hands.ts`, `hud.ts`). Но ни `andrew:web_sword`, ни `andrew:scythe_of_calamity` не объявляют `minecraft:allow_off_hand`, поэтому движок не пускает их во вторую руку.

**Механизм.** Компонент `minecraft:allow_off_hand` — переключатель допуска во вторую руку (строка схемы BDS 1.26.51.1). Прогон A/B показывает: он один переводит `setEquipment(Offhand)` из `false` в `true`.

**Достижимость.** У каждого игрока, в каждом мире, без условий. Статика 0/2 (`2.red.json`), движок отказывает обоим (`2.json`, прогон A).

**Критерии приёмки.**
1. `[unit]` В обоих JSON есть `"minecraft:allow_off_hand": true`. Это утверждают `tests/web-sword-item.test.mjs` и `tests/scythe-item.test.mjs`. Статическая проверка из `2.red.json` становится зелёной. `npm run validate && npm test && npm run build` — зелёные.
2. `[e2e, bds]` Новый GameTest (например, `andrew:legendary_offhand_admitted`). SimulatedPlayer в Survival: `setEquipment(Offhand, <предмет>)` возвращает `true`, и `getEquipment(Offhand).typeId` совпадает — для обоих предметов. Контроль `minecraft:diamond_sword` возвращает `false`. До правки красный (замерено, A), после — зелёный (замерено, B).
3. `[e2e, bds]` GameTest'ы `lgnd-ac04` и `lgnd-ac05` кладут предмет во вторую руку **только** через `setEquipment` и утверждают его `true`. `/replaceitem` запрещён: он навязывает слот и без компонента и даёт ложный зелёный (замерено, A). Нажатие — `useItemInSlot` основной руки. `ac05`: Коса в основной руке на кулдауне + готовый Web Sword во второй → паутина поставлена, кулдаун меча начат, состояние Косы не изменилось. Пустая основная рука + меч во второй → ничего.
4. `[unit]` `retain` (retention.ts) читает `Equippable Offhand`: помеченный предмет во второй руке при `entityDie` → pending записан, слот очищен. `carriesInstance` учитывает вторую руку (`lgnd-cx10`, `adr-wpn2`).
5. `[unit]` Гейт крафта видит немеченый крафт во второй руке (claim/refund). Либо критерий явно снимается, если в той же задаче отгружаются craft-токены (`adr-wpn3` шаг 3).
6. `[e2e, bds]` `npm run bds:check` зелёный, в content log нет строки про компонент.
7. `[manual, ipad]` Survival-игрок перетаскивает оба предмета во вторую руку. Бар показывает два сегмента (`ac06`). Проверка `ac05` на устройстве. Половина `as07`: пустая основная рука + легендарный во второй → Use ничего не делает.

## Дубликаты и копии (живой KV `.ai/context/analysis/`, строки на 2026-09-29 21:36 CEST)

Неверные сегодня — заменить:
- `nodes/lgnd-cx08__concept-contradiction.md:37`, `contradictions.md:198`, `risks.md:204` — «A GameTest can still force the slot through `Equippable.setEquipment(Offhand)`…» → «`setEquipment(Offhand)` is refused without the component (returns false, slot empty; measured BDS 1.26.51.1). `/replaceitem … slot.weapon.offhand` forces it and gives the false pass».
- `nodes/adr-wpn2__concept-architecture-decision.md:26` — «A GameTest `setEquipment(Offhand)` pass does **not** count» → «A GameTest that fills the off hand with `/replaceitem` does not count; `setEquipment(Offhand)` asserted `true` is a valid bds proof that the engine admits the item. The UI drag still needs the iPad».
- `nodes/lgnd-cx08__concept-contradiction.md:27`, `contradictions.md:188`, `risks.md:194` — «`L0-lgnd-r004` and `L0-scyt-r009` require…» → «`L0-lgnd-r004` (both items) and `L0-adr-scyt` step 2 / `L0-adr-wpn2` (Scythe) require…; `L0-scyt-r009:29` records the absence».
- `nodes/lgnd-cx08__concept-contradiction.md:36`, `contradictions.md:197`, `risks.md:203` — «cannot be set up on a real client» → «cannot be set up by a player through the inventory; an operator can with `/replaceitem`».
- `nodes/lgnd-cx08__concept-contradiction.md:40`, `contradictions.md:201`, `risks.md:207` — «`as07` is then measured on 1.26.50» → «`as07`'s `allow_off_hand` half is measured (accepted and applied on BDS 1.26.51.1); the `itemUse` half needs the iPad».
- `nodes/lgnd-as07__concept-assumption.md:15`, `assumptions.md:103` — add «`allow_off_hand` half measured 2026-09-29, BDS 1.26.51.1: accepted and applied on the custom sword and hoe (`setEquipment` true)».
- `nodes/lgnd-as07__concept-assumption.md:20`, `assumptions.md:108` — the «If `allow_off_hand` is rejected…» branch is ruled out by that measurement → remove or mark it ruled out.
- `nodes/lgnd-ac04__concept-acceptance-criterion.md:20`, `nodes/lgnd-ac05__concept-acceptance-criterion.md:20`, `scope.md:90`, `scope.md:109`, `project-knowledge/glossary.md:88`, `:107` — «Channel: `bds`.» → «Channel: `bds` (off hand filled by `setEquipment` with asserted `true`, never `/replaceitem`) + `ipad` (drag into the off hand)».
- `nodes/scyt-cx03__concept-contradiction.md:25` — «so the off-hand half of AC-16 … is probably untestable. This is not verified on the device.» → «the engine refuses it (`setEquipment` false on BDS 1.26.51.1); the UI drag is still unverified on the device».

Верные сегодня (0/2), тот же факт — после отгрузки переключить на «`allow_off_hand: true`»:
- `nodes/lgnd-cx08__concept-contradiction.md:32`, `contradictions.md:193`, `risks.md:199`
- `nodes/lgnd__concept-component.md:32`, `project-knowledge/architecture.md:37`, `project-knowledge/domain-model.md:428`
- `nodes/lgnd-cx11__concept-contradiction.md:40`
- `nodes/scyt-r009__concept-rule.md:29`, `nodes/scyt-ent1__concept-entity.md:28`, `nodes/scyt__concept-component.md:55`, `nodes/scyt-cx03__concept-contradiction.md:6`, `:16`
- `nodes/lgnd-cx04__concept-contradiction.md:28`, `contradictions.md:84`, `risks.md:86`

Вне KV, соседний отчёт (ветка `task/CNTR-COOL-CTR3-AA`, `docs/feedback/diagnose-CNTR-COOL-CTR3-AA.md`):
- `:47` «слот заполняется только командой / setEquipment» → «только командой (`/replaceitem`); `setEquipment` отказывает».
- `:81` «GameTest с setEquipment(Offhand) даёт ложный зелёный» → «ложный зелёный даёт `/replaceitem`; `setEquipment` с проверенным `true` — честная bds-проверка».

## Мимоходом (не часть cx08)

- `nodes/lgnd-ac04__concept-acceptance-criterion.md:22` и `:25` ждут «no player is within 20 blocks» / «"no player here" message», но Коса целит и мобов (decision-scythe-targets-mobs), а сообщение сменилось на «Здесь нет цели» (DEMO-S3-AA AC#6). При переписывании `ac04` условие должно звучать «no target (player or mob) within 20».

## Приложение — зонд и скрипт A/B (не закоммичены в код; удалены после прогона)

Зонд был подключён строкой `import "./probe-offhand";` в `src/gametest/main.ts` и строкой `'andrew:probe_offhand_force',` в `EXPECTED_TESTS` (`scripts/bds-gametest.mjs`). Прогон шёл на приватной копии `docker/bds-cx08` (порты 19216/19220-19229), чтобы не мешать соседям по волне на `andrew-bds-ci`.

`src/gametest/probe-offhand.ts`:

```ts
import { EquipmentSlot, GameMode, ItemStack, Player, Vector3 } from "@minecraft/server";
import { type SimulatedPlayer, Test, register } from "@minecraft/server-gametest";
import { clearCooldown, startCooldown } from "../legendary/cooldown";
import { resolveActivation } from "../legendary/hands";
import { SCYTHE_OF_CALAMITY, WEB_SWORD } from "../legendary/registry";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const log = (msg: string): void => console.warn(`[probe] ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err));
const IDS = ["andrew:web_sword", "andrew:scythe_of_calamity", "minecraft:diamond_sword", "minecraft:shield", "minecraft:totem_of_undying"];

function forceOffhand(player: Player, id: string): void {
  const eq = player.getComponent("minecraft:equippable");
  if (eq === undefined) { log(`OFFHAND RESULT id=${id} equippable=undefined`); return; }
  eq.setEquipment(EquipmentSlot.Offhand, undefined);
  let returned: string;
  try { returned = String(eq.setEquipment(EquipmentSlot.Offhand, new ItemStack(id))); }
  catch (err) { returned = `threw ${errText(err)}`; }
  const readBack = eq.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
  log(`OFFHAND RESULT setEquipment id=${id} returned=${returned} readBack=${readBack}`);
}

function commandOffhand(player: Player, id: string): void {
  const eq = player.getComponent("minecraft:equippable");
  eq?.setEquipment(EquipmentSlot.Offhand, undefined);
  let result: string;
  try { result = `successCount=${player.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${id}`).successCount}`; }
  catch (err) { result = `threw ${errText(err)}`; }
  const readBack = eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
  log(`OFFHAND RESULT replaceitem id=${id} ${result} readBack=${readBack}`);
}

register("andrew", "probe_offhand_force", (test: Test): void => {
  const player: SimulatedPlayer = test.spawnSimulatedPlayer(STAND, "andrew_offhander", GameMode.Survival);
  test.runAfterDelay(4, () => {
    for (const id of IDS) forceOffhand(player, id);
    for (const id of IDS.slice(0, 3)) commandOffhand(player, id);
    const eq = player.getComponent("minecraft:equippable");
    for (const via of ["setEquipment", "replaceitem"]) {
      eq?.setEquipment(EquipmentSlot.Offhand, undefined);
      eq?.setEquipment(EquipmentSlot.Mainhand, new ItemStack(SCYTHE_OF_CALAMITY.itemId));
      const put = via === "setEquipment"
        ? String(eq?.setEquipment(EquipmentSlot.Offhand, new ItemStack(WEB_SWORD.itemId)))
        : String(player.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${WEB_SWORD.itemId}`).successCount);
      clearCooldown(player, WEB_SWORD.abilityKey);
      startCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
      const hit = resolveActivation(player);
      log(`OFFHAND RESULT ac05-setup via=${via} put=${put} main=${eq?.getEquipment(EquipmentSlot.Mainhand)?.typeId} ` +
        `off=${eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty"} -> resolveActivation slot=${hit?.slot ?? "none"} def=${hit?.def.itemId ?? "none"}`);
      clearCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
    }
    test.succeed();
  });
}).structureName(STRUCTURE).maxTicks(100).tag("andrew");
```

Скрипт `offhand-ab.sh`, запущенный как `ai-kit run-check --task CNTR-LGND-CX08-AA --criterion 2 -- bash offhand-ab.sh`. Прогон A — HEAD; затем в оба JSON добавляется `"minecraft:allow_off_hand": true`; прогон B; `git checkout` возвращает JSON. Код 0 только если A отказывает обоим, B пускает обоих, а в B нет строк content log про компонент.

Ответы движка (дословно из `2.json`):

```text
run A (HEAD 32f4aca)                                          run B (+ allow_off_hand)
setEquipment web_sword          returned=false readBack=empty  returned=true readBack=andrew:web_sword
setEquipment scythe_of_calamity returned=false readBack=empty  returned=true readBack=andrew:scythe_of_calamity
setEquipment diamond_sword      returned=false readBack=empty  returned=false readBack=empty
setEquipment shield             returned=true                  returned=true
setEquipment totem_of_undying   returned=true                  returned=true
replaceitem  web_sword / scythe / diamond_sword  successCount=1, readBack=<id>   (A и B одинаково)
ac05-setup via=setEquipment  put=false off=empty -> none       put=true off=andrew:web_sword -> Offhand web_sword
ac05-setup via=replaceitem   put=1 off=web_sword -> Offhand    put=1 off=web_sword -> Offhand web_sword
VERDICT A refuses web_sword=1 scythe=1 | B admits web_sword=1 scythe=1 | B content errors=0
```
