# Diagnose CNTR-LGND-CX16 — CX-lgnd-16 (решение «последнему державшему» принято, код его не делает)

ИСХОД: 2 — Работа над кодом (готовая постановка на LGND-HOLD)

Код проверен на `ed05050` (1.6.1). Узлы KV читались из корневого `.ai/context/analysis/` (только чтение); пути ниже — от него, если не указано иное. Красный прогон — `.ai/verify/CNTR-LGND-CX16-AA/2.red.json`.

## 1. Проверка утверждения по пунктам

| Утверждение KV | Проверено | Итог |
|---|---|---|
| У метки нет поля держателя | `src/legendary/rules.ts:15-27` — `Mark = {origin, owner, id, gen, ownerName?}`; ключи `src/legendary/registry.ts:140-159`, `keysFor` `:166-178` — `holder` нет; `grep -rn holder src/legendary` — только локальные имена. В живом прогоне ключи стека у B: `ws_owner, ws_gen, ws_origin, ws_id, ws_owner_name` | **верно** |
| `lost()` целится в `w.mark.owner` | `src/legendary/recovery.ts:490` `const target = w.mark.owner;` → `:497` долг на него, `:500` выдача ему | **верно** |
| Передача из защиты и её долг — `mark.owner` | `src/legendary/recovery.ts:877` `reachable(mark.owner)`, `:879` `withOwed(…, mark.owner, …)`, `:880` лог | **верно** |
| `owner` пишется только при крафте/выдаче | `src/legendary/state.ts:63-67` (`makeMark`), вызовы `craftgate.ts:148`, `commands.ts:106`; подбор (`recovery.ts:156-168` → `noteArrival :248`) метку не трогает | **верно** (добавлено) |
| `LGND-GEN-01-AA` в архиве, держатель не отгружен | `.ai/tasks/archive/LGND-GEN-01-AA.md:4` `status: done`; все 5 критериев — gen и список долгов (`:35-39`); держатель **исключён самой карточкой**: `:31` «Кому именно возвращать … идёт отдельно (`L0-xcx11`). Пока цель возврата остаётся прежней», `:43` «The return target stays mark.owner; holder is L0-xcx11 and is not in this task» | **верно**, с уточнением ниже |
| `L0-adr-hold` всё ещё `status: proposed` | `nodes/adr-hold__concept-architecture-decision.md:15` тег `status:accepted`, `accepted_by:decision-resolve-l0-xcx11`; `:20` «**Status:** accepted … Not built at 1.6.1» | **устарело** — исправлено на reduce v7 (запись `17:12:14Z`, до старта волны `17:17:43Z`, `.ai/logs/ai-kit.log`); но файл остался `analysis_version: 3`, и индекс его не отдаёт (§6 п. 0) |
| `ac18` всё ещё «ждёт подтверждения клиента» | `nodes/lgnd-ac18__concept-acceptance-criterion.md:37` — «was accepted … this AC is unbuilt work, filed as `LGND-HOLD`» | **устарело** — исправлено на reduce v7 (запись `17:10:47Z`) |
| Компонент v6 говорил «`xcx11` остаётся открытым» | v7 `nodes/lgnd__concept-component.md:27`, `:54` — держатель «decided, unbuilt», `LGND-HOLD` отдельно. Но та же фраза жива в `nodes/lgnd-ad12__concept-architecture-decision.md:53` «…and `L0-xcx11` stays open» | v6-текст заменён; копия осталась (§6) |

**Почему держатель не попал ни в одну карточку.** `LGND-GEN-01-AA` создана `2026-09-29T20:36:28Z` (`archive/LGND-GEN-01-AA.md:8`) из отчёта CX09 и с явным исключением держателя. Решение, называющее её носителем держателя (`decisions/decision-resolve-l0-xcx11.md:12`, `decisions/decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavsh.md:14`), записано коммитом `0dc3c25` в `20:41:13Z`; агент LGND-GEN стартовал в `20:41:22Z` (`:13`) по неисправленной карточке. Решение сослалось на карточку, карточку под решение не переписали. Ни на доске, ни в архиве карточки `LGND-HOLD` нет (поиск `LGND-HOLD|holder|держател|returnTarget` по `.ai/tasks/**`: только `CNTR-LGND-CX16-AA`, `CNTR-X21-AA`, `archive/CNTR-LGND-CX09-AA`, `archive/CNTR-XCX11-AA`, `archive/LGND-GEN-01-AA` — ни одна держатель не строит).

## 2. Блоки /diagnose

```text
OBSERVED: на ed05050 у метки нет holder (rules.ts:15-27); lost() и handBack целятся в mark.owner
          (recovery.ts:490, :877-880); принятое 2026-09-29 решение — «последнему державшему»; единственная
          названная в нём задача LGND-GEN-01-AA держатель исключила (archive/LGND-GEN-01-AA.md:31, :43).
VERDICT: bug — код расходится с записанным принятым решением оператора; ожидание по-прежнему нужно
         (v7 L0-adr-hldb, спеки катаны §3 и арбалета §3). Не смена решения: его никто не пересматривает.
CHECKS: contradiction: none (это и есть исполнение decision-resolve-l0-xcx11) · duplicate: none (LGND-HOLD
        не заведена; LGND-GEN-01-AA держатель исключила) · criteria writable: yes (ac18 + §4 ниже)
UNFOLD: task — одна единица работы, дизайн записан (ad11, ent2, adr-hold), критерии пишутся.
HUMAN: none по существу. Карточку заводит оператор: задаче запрещено заводить (issue_triage в этой
       сессии недоступен — таблица применена вручную).

REPRO: env ANDREW_BDS_DIR=bds-cx16 node scripts/bds-gametest.mjs
         --only andrew:legendary_cx16_void_after_transfer
         --only andrew:legendary_cx16_void_after_transfer_crafter_offline
       (частный BDS 1.26.51.1 docker/bds-cx16, код ed05050 + файл приложения A); 2 из 2 красные с первого прогона.
CAUSE: единственная цель возврата — owner. holder нет ни в Mark (rules.ts:15-27), ни в ключах
       (registry.ts:140-159); owner ставится один раз при крафте/выдаче (state.ts:63-67); подбор метку не
       переписывает (recovery.ts:156-168, noteArrival :248). lost(): target = w.mark.owner (recovery.ts:490)
       → долг (:497) или выдача (:500); handBack: reachable(mark.owner) / withOwed(…, mark.owner) (:877, :879).
PROOF: .ai/verify/CNTR-LGND-CX16-AA/2.red.json (exit 1, --expect-red, code_sha ed05050):
       online : "holder(B) gens=[] crafter(A) gens=[1] owed targets=[] ledger gen=1"
       offline: "holder(B) gens=[] crafter(A) offline owed targets=[A] ledger gen=1"
RULED OUT: (1) передача принята за потерю — нет: лог «picked up — seen entering an inventory», перед
           выбросом B=1, A=0. (2) подбор переписывает owner — нет: метка со стека B: owner=A, ключи
           ws_owner,ws_gen,ws_origin,ws_id,ws_owner_name, holder нет. (3) путь потери не сработал — сработал:
           «now gen 1, returning to cx16_crafter_online», ledger gen=1, у A gen 1. (Причина в логе —
           «vanished from the ground», не «fell into the Void»: та же lost(), та же строка цели.)

RADIUS: метод — grep по src/ на owner|markItem|makeMark|withOwed|reachable|protectLegendariesIn; прочитаны
        lost/handBack/grant/обработчик инвентаря. Цели возврата: recovery.ts:490, :877, :879. Места записи
        holder: state.ts:63-67 (makeMark — крафт и выдача), retention.ts:269-270 (grant — restore и возврат
        потери), recovery.ts:156-168 → noteArrival :248 (подбор). Сериализованные метки (parsePending,
        parseOwed в rules.ts) получают необязательное поле. Ключи только новые (keysFor registry.ts:166-178),
        старые не переименовываются. handBack достижим через protectLegendariesIn из src/main.ts,
        structures/place.ts, orbital/penetrator.ts, orbital/ring.ts, selftest/*-restart.ts. Удержание при смерти
        уже идёт умирающему (retention.ts:142, :201) и не меняется. Шов ad17 returnTarget(mark) в src/ и tests/
        не существует. KV: становятся построенными пункты держателя ac08, ac09, ac18, ac24 (T18), ac27, ad17.
        Смена поведения: A перестаёт получать оружие, которое потерял B — это решение оператора, а не
        придуманное здесь ограничение; непереданные стеки не меняются (holder == owner или нет → owner).
CASES: число переданных легендарок в живых мирах не посчитано — мир prod принадлежит другой сессии, чтение
       его leveldb отсюда = касание prod.
GREEN / LIVE: n/a в этом прогоне — исход 2, исправление уходит в LGND-HOLD; её AC 1–2 — те же красные тесты.
```

## 3. Почему 2, а не 1, 3 или 4

- **Не 1:** улики есть — код, архив и живой красный прогон сходятся.
- **Не 3:** два из трёх пунктов «KV» уже исправлены на v7; главный пробел — непостроенный код, его подчисткой знания не закрыть. Остаток устаревшего текста — в §6, попутно.
- **Не 4:** решение принято (`decision-resolve-l0-xcx11`, 2026-09-29) и подтверждено на v7 (`L0-adr-hldb`, `status:accepted`). Открытого вопроса нет; нужно только завести карточку.

## 4. Постановка LGND-HOLD (не заведена)

**Заголовок:** «Возврат потери — последнему державшему: поле holder в метке».

**Parent work goal:** `decision-resolve-l0-xcx11` / `L0-adr-hold` (accepted), постройка по `L0-adr-hldb` п. 2; разбор `CNTR-LGND-CX16-AA` (OBSERVED + CAUSE §2).

**Touches:** `src/legendary/rules.ts`, `src/legendary/state.ts`, `src/legendary/registry.ts`, `src/legendary/recovery.ts`, `src/legendary/retention.ts`, `src/gametest/legendary-holder.ts` (новый, из приложения A), `src/gametest/main.ts`, `scripts/bds-gametest.mjs`, `tests/legendary-recovery.test.mjs`.

**Дизайн уже записан — заново не изобретать:** `lgnd-ad11` пп. 1–6, `lgnd-ent2` (строки holder/holderName), `adr-hold`:
- `holder`, `holderName` — dynamic properties на стеке, ключи `andrew:<p>_holder`, `andrew:<p>_holder_name` (новые; существующие ключи не трогать — `registry.ts:161-165`);
- пишется: в `makeMark` (крафт, выдача) = игрок; в `grant` (`retention.ts:269-270`) = получатель; на `playerInventoryItemChange` для **живого** помеченного стека, у которого `holder` ≠ игрок — clone, set, запись слота (условие «≠» гасит повторное событие; писать один раз на передачу);
- контейнер, хоппер, стойка, сущность-предмет держателем не становятся; левая рука — без события, holder уже записан, пока стек лежал в инвентаре;
- цель возврата = `holder ?? owner` в `lost()` (`recovery.ts:490`) и `handBack` (`recovery.ts:877-880`); `owed` ключуется целью;
- стеки без `holder` (все до LGND-HOLD) → `owner`, как сейчас;
- тестовый шов `ad17`: если к моменту работы в GameTest есть `returnTarget(mark)` — перевести на `holder ?? owner`; если нет — завести его здесь одним помощником в тестах (оракул читает ключи сам, не через `src/legendary`).

**Критерии приёмки:**
1. `[e2e]` `andrew:legendary_hold_void_after_transfer` (приложение A, красный в `2.red.json`) зелёный: A скрафтил, B подобрал и потерял в Бездне → у B один экземпляр gen 1, у A ноль и нет сообщения.
2. `[e2e]` `andrew:legendary_hold_void_after_transfer_crafter_offline` зелёный: A офлайн, B получает, в `owed` нет A.
3. `[e2e]` B офлайн в момент потери: `owed[B]` есть, `owed[A]` нет; B получает ровно один раз при входе.
4. `[e2e]` A положил в сундук, хоппер перенёс в другой сундук, предмет потерян → возврат A (`holder` = A; контейнер не держатель, `ac18` посл. абзац).
5. `[e2e]` передача из защиты (`protectLegendariesIn` без безопасного места) стека, последним державшего B: B онлайн → в руки B; B офлайн → `owed[B]`.
6. `[unit]` метка/стек/токен pending и owed без `holder` → цель `owner`; некорректный `holder` не ломает `getMark`, `parsePending`, `parseOwed`.
7. `[e2e]` без регрессий: `legendary_returns_from_void`, `legendary_pickup_no_duplicate`, `legendary_cx09_*`, `legendary_stand_void_hands`, `legendary_katana_void_thrown`, `legendary_katana_void_chest_minecart`, затем полный `npm run bds:gametest`.
8. `[build]` `npm run build`, `tsc --noEmit` (strict), `npm test` зелёные.

**Риск для исполнителя:** перезапись слота в обработчике инвентаря — запись в стек, который игрок может держать в момент использования (заряженный арбалет, коса в полёте залпа). Писать только при `holder` ≠ игрок, т. е. раз на передачу, и проверить, что clone сохраняет состояние предмета.

## 5. Дубликаты (найдены grep по корневому `.ai/context/analysis` на `LGND-HOLD|returnTarget`, `stays open|proposed|confirm` + holder)

Тот же факт «решено, не построено, LGND-HOLD отдельно» — уже верный текст, правки не требует:
- `nodes/adr-hldb__concept-architecture-decision.md:17, :27, :31-34` и копия `project-knowledge/architecture.md:135, :145, :149-152`
- `nodes/lgnd__concept-component.md:27, :36, :54`; копии `project-knowledge/domain-model.md:303, :321`, `project-knowledge/architecture.md:41, :59`
- `nodes/lgnd-ac18__concept-acceptance-criterion.md:37`; копии `scope.md:416`, `project-knowledge/glossary.md:414`
- `nodes/lgnd-ac27__concept-acceptance-criterion.md:15, :19, :23-25`; копии `scope.md:613, :617, :621-623`, `project-knowledge/glossary.md:611, :615, :619-621`
- `nodes/lgnd-ad17__concept-architecture-decision.md:23-24`
- `summary.md:61, :75`, `nodes/concept-overview.md:55, :69`
- `nodes/xq7__concept-client-question.md:34` (арбалет: возврат крафтеру до постройки держателя, `xasm26`)
- сам узел и его копии: `nodes/lgnd-cx16__concept-contradiction.md:28-32`, `risks.md:188-192`, `contradictions.md:182-186`

Тот же факт со стороны кода, но с устаревшими номерами строк — `nodes/lgnd-ad12__concept-architecture-decision.md:53` (`recovery.ts:477`, `:785-787` → сейчас `:490`, `:877-879`).

В коде: `src/legendary/recovery.ts:490`, `:877`, `:879` — три места цели `owner`; других нет (grep `\.owner\b` по `src/`, кроме `gametest/`).

## 6. Остаток устаревшего текста KV (не правился — для ближайшей подчистки)

0. **Главное.** `nodes/adr-hold__concept-architecture-decision.md:5` `analysis_version: 3` — reduce v7 переписал узел (`status:accepted`), но версию не поднял; пайплайн сам это отметил: `analysis_version mismatch after write — … adr-hold… (has 3, expected 7)` (`.ai/logs/ai-kit.log`, `2026-10-05T17:12:56Z`). Проверено: `kv_list({node_id: "L0-adr-hold"})` → `[]`, узел виден только с `status: "all"`. Итог: принятое ADR, на котором стоит решение, по умолчанию не находится, а видимый v7-узел `lgnd-ad11` говорит «proposed, ждёт клиента». Поднять до 7.
1. `nodes/lgnd-ad11__concept-architecture-decision.md:13` тег `status:proposed` → `status:accepted`; `:24` «(proposed, L0)» → «(accepted, L0)»; `:44` «**Open.** … still needs the client's one-line confirmation…» → «Accepted by `decision-resolve-l0-xcx11` (2026-09-29); build = `LGND-HOLD` (`adr-hldb`)».
2. `nodes/adr-hold__concept-architecture-decision.md:35` «`L0-xq3` closes once the client confirms» → «`L0-xq3` is closed by `decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavsh`».
3. `nodes/xcx11__concept-contradiction.md:14` теги `status:open` и `resolved` одновременно → убрать `status:open`; `:31` «Proposed… needs client confirmation» → «Decided: last holder (`decision-resolve-l0-xcx11`); unbuilt, `LGND-HOLD`».
4. `nodes/xq3__concept-client-question.md:13` (v2) тег `SHOULD_ASK` → отвечен решением `decision-legendarnoe-…` (отменяет `decision-l0-xq3`).
5. `nodes/xq6__concept-client-question.md:32` «last holder proposed» → «last holder decided, unbuilt (`LGND-HOLD`)».
6. `nodes/lgnd-ad12__concept-architecture-decision.md:53` «…and `L0-xcx11` stays open» → «`xcx11` decided; holder unbuilt (`cx16`, `adr-hldb`)», номера строк — на `recovery.ts:490`, `:877-879`.
7. `decisions.md:545` — `decision-l0-xq3` («крафтившему») стоит в индексе без пометки об отмене; отменён только текстом `decisions/decision-legendarnoe-…:16`. Читатель одного индекса видит «крафтившему».
8. `decisions/decision-resolve-l0-xcx11.md:12` и `decision-legendarnoe-…:14` называют `LGND-GEN-01-AA` носителем держателя — неверно (§1), но записи решений подчистка не правит; поправка уже есть в `adr-hldb:27` («That task shipped the mark generation only»).

## Приложение A. Репро (не закоммичено — красный тест сломал бы набор)

Подключение: `import "./legendary-holder";` в `src/gametest/main.ts` после `import "./katana-trail";`; два имени в `EXPECTED_TESTS` (`scripts/bds-gametest.mjs`) после `'andrew:legendary_cx09_owed_redeemed_on_respawn'`. В прогоне файл назывался `cx16-repro.ts`, тесты — `legendary_cx16_*`; для LGND-HOLD переименовать в `legendary_hold_*`. Частный инстанс: копия `docker/bds-ci` с `container_name: andrew-bds-cx16`, портами 19216/19217, UDP 19220-19229, 7561.

```ts
// CX-lgnd-16 repro: a Web Sword crafted by A, picked up by B and lost by B in
// the Void. Asserted in the last-holder reading (decision-resolve-l0-xcx11), so
// on code that returns to mark.owner both tests are red.

import { type Container, GameMode, ItemStack, type Player, type Vector3, world } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_B: Vector3 = { x: 4, y: 2, z: 5 };
const KEY = `andrew:${WEB_SWORD.keyPrefix}_`;
const WAIT_TICKS = 160;

const log = (msg: string): void => console.warn(`[gametest] cx16 ${msg}`);

function inv(player: Player): Container {
  const c = player.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${player.name} has no inventory`);
  return c;
}

function slotsOf(c: Container, id: string): number[] {
  const out: number[] = [];
  for (let s = 0; s < c.size; s++) {
    const st = c.getItem(s);
    if (state.isItemOf(WEB_SWORD, st) && state.getMark(WEB_SWORD, st)?.id === id) out.push(s);
  }
  return out;
}

function gens(c: Container, id: string): number[] {
  return slotsOf(c, id).map((s) => {
    const g = c.getItem(s)?.getDynamicProperty(`${KEY}gen`);
    return typeof g === "number" ? g : 0;
  });
}

function owedTargets(): string[] {
  const raw = world.getDynamicProperty(`${KEY}owed`);
  if (typeof raw !== "string") return [];
  return Object.entries(JSON.parse(raw) as Record<string, unknown[]>)
    .filter(([, v]) => Array.isArray(v) && v.length > 0)
    .map(([k]) => k);
}

function transferThenVoid(tag: string, crafterOffline: boolean) {
  return async (test: Test): Promise<void> => {
    const crafter = test.spawnSimulatedPlayer(STAND_A, `cx16_crafter_${tag}`, GameMode.Survival);
    const holder = test.spawnSimulatedPlayer(STAND_B, `cx16_holder_${tag}`, GameMode.Survival);
    const crafterId = crafter.id;
    const holderId = holder.id;
    await test.idle(4);
    const mark = state.makeMark("craft", crafter);
    const id = mark.id;
    holder.dimension.spawnItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark), holder.location);
    await test.idle(60);

    const b = inv(holder);
    const bSlots = slotsOf(b, id);
    test.assert(bSlots.length === 1 && slotsOf(inv(crafter), id).length === 0, `hand-over failed: B ${bSlots.length}, A ${slotsOf(inv(crafter), id).length}`);
    const onB = state.getMark(WEB_SWORD, b.getItem(bSlots[0]) as ItemStack);
    log(`${tag}: B=${holderId} holds ws_id ${id}; mark on B's stack owner=${onB?.owner} (A=${crafterId}) keys=${b.getItem(bSlots[0])?.getDynamicPropertyIds().join(",")}`);

    if (crafterOffline) crafter.disconnect();
    holder.selectedSlotIndex = bSlots[0];
    test.assert(holder.dropSelectedItem(), "dropSelectedItem refused");
    await test.idle(3);
    const e = holder.dimension
      .getEntities({ type: "minecraft:item", location: holder.location, maxDistance: 8 })
      .find((x) => {
        const s = x.getComponent("minecraft:item")?.itemStack;
        return state.isItemOf(WEB_SWORD, s) && state.getMark(WEB_SWORD, s)?.id === id;
      });
    test.assert(e !== undefined, "no dropped sword near the holder");
    e?.teleport({ x: e.location.x, y: e.dimension.heightRange.min - 8, z: e.location.z });
    await test.idle(WAIT_TICKS);

    const toHolder = gens(inv(holder), id);
    const toCrafter = crafterOffline ? undefined : gens(inv(crafter), id);
    const owed = owedTargets();
    const result =
      `holder(B) gens=[${toHolder.join(",")}] crafter(A) ${toCrafter === undefined ? "offline" : `gens=[${toCrafter.join(",")}]`} ` +
      `owed targets=[${owed.map((t) => (t === crafterId ? "A" : t === holderId ? "B" : t)).join(",")}] ledger gen=${state.ledgerGen(WEB_SWORD, id)}`;
    log(`${tag} RESULT ${result}`);
    test.assert(
      toHolder.length === 1 && (crafterOffline ? !owed.includes(crafterId) : toCrafter?.length === 0),
      `last-holder reading: ${result}`
    );
    test.succeed();
  };
}

registerAsync("andrew", "legendary_cx16_void_after_transfer", transferThenVoid("online", false))
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
registerAsync("andrew", "legendary_cx16_void_after_transfer_crafter_offline", transferThenVoid("offline", true))
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
```
