# Diagnose CNTR-XCX11-AA — CX-L0-11 (Void return target: Orbital §5 «last owner» vs as-built crafter)

ИСХОД: 4 — Подготовлено, ждёт решения

- Код разбора: `32f4aca`. KV прочитан в живом виде (`.ai/context/analysis/`, генерация 2026-09-29T19:09Z). Копия KV в дереве отслеживается git, но устарела: последний коммит `1a07f34` от 2026-09-27, узлов v3 в ней нет.
- Стенд: BDS 1.26.51.1 в Docker. Частный экземпляр `bds-xcx11` (порты 19210–19221), после прогона удалён. GameTest, 2026-09-29 19:52 UTC.
- Красный артефакт: `/Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-XCX11-AA/2.red.json`:
  - `ai-kit run-check --expect-red`, exit 1, `code_sha 32f4aca`, `run_kind: against_workspace`, 50.9 s;
  - тесты-репро в дерево не коммитились, исходник — в приложении A.

## 1. Проверка утверждения по пунктам

| # | Утверждение KV (`nodes/xcx11…:19-27`) | Чем проверено | Результат |
|---|---|---|---|
| 1 | Orbital §5: оружие не привязано к создателю, его можно передать | raw `orbitalcannonspecv1ruen-part-1.md:81` | **Верно** |
| 2 | Orbital §5: из Void возвращается «последнему владельцу», офлайн — при следующем входе | raw `…part-1.md:89` | **Верно** |
| 3 | `recovery.ts` возвращает `owner` из метки | `recovery.ts:219` (поиск игрока по `w.mark.owner`), `:225` (`setOwed(w.mark.owner)`), `:228` (`setPending(owner)`); живой прогон | **Верно, воспроизведено** |
| 4 | `owner` — это «крафтер или админ» | `craftgate.ts:139` — `makeMark("craft", player)`, крафтер. `commands.ts:106` — `makeMark("admin", player)`, где `player` — **получатель** `/give`, а не админ | **Неточно:** для админ-копии это получатель |
| 5 | В метке нет поля holder (`state.ts`) | `rules.ts:15-21`: `Mark = {origin, owner, id, ownerName?}`. `state.ts:14-25` читает 4 ключа. `grep -rnw holder src/legendary` находит только локальные переменные: `craftgate.ts:54-59`, `recovery.ts:154-156` | **Верно** |
| 6 | `L0-adr-wpn2` оставил as-built owner до ответа клиента на `L0-xq3` | `nodes/adr-wpn2…:29`, строка `lgnd-cx09`, пункт (3) | **Верно, но неполно.** На `xq3` ответил автопилот: `decisions/decision-l0-xq3-…-kraftivshem.md`, 2026-09-26 — «оставляем возврат крафтившему». Ни один узел analysis это решение не упоминает, `grep -rln decision-l0-xq3` находит только `decisions.md` |
| 7 | «A получает оружие обратно» | Живой прогон, §2 | **Верно:** онлайн — у A 1, у B 0; A офлайн — `owed[A]`, у B 0 |
| 8 | «Торговый эксплойт: B бесплатно “возвращает” оружие A» | Рассуждение, не замер | **Эксплойтом не является.** Дюпа нет, выгоды сверх прямой передачи из рук в руки нет. Настоящий вред обратный и измерен: B теряет владение при любой потере, а при офлайн-крафтере единственный экземпляр уходит из мира до входа A |
| 9 | «Старые спеки читались иначе» | raw: в спеке Web Sword нет правила потери (`grep -c "Void\|Бездн\|пустот"` по трём частям даёт 0; есть только удержание при смерти, `part-1:55,57`). Scythe §1 (`scytheofcalamityspecv1ruen-part-1.md:33`, импорт 2026-09-24): «возвращается последнему владельцу» | **Неверно.** «Крафтившему» читали только код (`ed7558b`, 2026-09-24, LG-KEEP-02-AA) и `decision-l0-xq3` |
| 10 | Orbital-спека новее | Mtime импорта: web sword 2026-09-21, scythe 2026-09-24, **orbital 2026-09-29 18:54**. `decision-l0-xq3` — 2026-09-26 | **Верно:** клиентский текст пришёл после автопилотного решения |

Связанные записи расходятся по статусу:
- `nodes/adr-wpn3…:33` (status:accepted) объявляет «Last holder… answers `L0-xq3`… `lgnd-ad11` → accepted».
- При этом `nodes/lgnd-ad11…:13,44` и `nodes/adr-hold…:15,20` остаются `proposed` и ждут подтверждения.
- Действующее решение `decision-l0-xq3` (канал cli) говорит «крафтившему». По шапке `decisions.md` решения имеют приоритет над анализом.

## 2. Блоки /diagnose

```text
OBSERVED: code 32f4aca, BDS 1.26.51.1, 2.red.json. A Web Sword stamped owner=A (craft) is handed
          to B through the ground, and B picks it up. B throws it and it goes below the floor.
          · A online  → "vanished from the ground; returning to xcx11_crafter_online";
            A=1, B=0, owed empty.
          · A offline → "owner -8589934585 offline, owed on next join"; B=0, owed keys=[A].
VERDICT:  decision-change. The observation diverges from recorded client text: Orbital §5:81,89,
          Scythe §1:33 and decision-legendary-rules-obschie (2026-09-24) all say «последнему
          владельцу». But it matches the recorded decision-l0-xq3 (2026-09-26, autopilot
          default: crafter, "offered to the operator as a separate small change when he wants it").
          Reversing a recorded decision that keeps operator-accepted shipped behaviour is the
          human's call.
CHECKS:   contradiction: decision-l0-xq3 · duplicate: L0-lgnd-cx09 item 1 (CNTR-LGND-CX09-AA),
          L0-xq3 · criteria writable: yes (both answers)
UNFOLD:   nothing now. Answer (b) → one task (§5). Answer (a) → knowledge cleanup (§6-A…D).
HUMAN:    decision-change decision-l0-xq3 — operator: crafter or last holder (§4)

REPRO:    ai-kit run-check --task CNTR-XCX11-AA --criterion 2 --expect-red -- env
          ANDREW_BDS_DIR=bds-xcx11 node scripts/bds-gametest.mjs
          --only andrew:legendary_returns_from_void
          --only andrew:legendary_xcx11_void_after_transfer
          --only andrew:legendary_xcx11_void_after_transfer_crafter_offline
          1 run. The target choice has no randomness (recovery.ts:219), so it is deterministic
          by construction; not repeated.
CAUSE:    the mark's owner is written once:
          · craftgate.ts:139 — craft, the crafter;
          · commands.ts:106 — admin copy, the recipient;
          · retention.ts:216 — restore re-stamps the same mark.
          Nothing writes it when a player picks the stack up: the playerInventoryItemChange
          handler only fills seenInInventory, and only for watched ids (recovery.ts:69-86).
          lost() (recovery.ts:218-232) resolves the target from w.mark.owner:
          :219 online lookup, :225 setOwed(owner), :228 setPending(owner).
PROOF:    2.red.json:
          · legendary_xcx11_void_after_transfer FAIL "got holder=0, crafter=1";
          · legendary_xcx11_void_after_transfer_crafter_offline FAIL "got holder=0,
            crafter=owed=true".
RULED OUT: (1) The hand-over itself was misread as a loss and A got it back then. Killed by the
          log "picked up — seen entering an inventory (playerInventoryItemChange)" and
          "before loss holder=1 crafter=0 pending(holder)=false".
          (2) owner is rewritten on pickup, but lost() used a stale watched mark. Killed: the
          mark read from B's own stack says owner=-8589934589 (A), while B's id is -8589934588.
          (3) The stand does not return anything at all. Killed: the control
          legendary_returns_from_void PASSes in the same run ("returning to andrew_voider").

RADIUS:   no fix in this task. For answer (b) I looked by grep -rnw over markItem, makeMark,
          getMark, mark.owner, setOwed, redeemOwed and restore:
          · recovery.ts: lost, setOwed, redeemOwed, the inventory handler;
          · registry.ts keysFor: a new <p>_holder key;
          · state.ts getMark/markItem;
          · rules.ts Mark/parseMark;
          · GameTest main.ts:343, websword_first_claim, which asserts mark.owner === crafter
            (stays valid: owner is kept);
          · retention.ts is NOT affected: death uses the pending mark of the dying player,
            which already has holder semantics.
          KV nodes: lgnd-ac08, ac18, ent2, ent4, p003, ad11, gl06, orbc-r009.
          This is a rule change for shipped weapons, neither a guard nor a restriction on
          misuse, which is why it goes to the operator.
GREEN/LIVE: n/a. Nothing was fixed; the outcome is a decision. The two red scenarios in
          appendix A are the ready e2e acceptance for (b).
```

## 3. Дубль ли это `L0-lgnd-cx09` (вопрос надзирающего)

**Да, по факту. Нет, по объёму.**
- `L0-xcx11` — тот же факт, что пункт 1 `L0-lgnd-cx09`:
  - те же строки `recovery.ts:219-228`;
  - тот же сценарий «крафтер отдал другу, друг уронил в Void, вернулось крафтеру» (`nodes/lgnd-cx09…:31`);
  - тот же открытый вопрос `L0-xq3`.
- Пункты 2–4 `cx09` (нет `gen` и живой дубль, перезапись `_owed`, ширина скана) — другие факты, в `xcx11` их нет.
- `CNTR-LGND-CX09-AA` (done) уже передал пункт 1 оператору с той же развилкой (a)/(b). Один ответ оператора закрывает сразу `L0-xcx11`, пункт 1 `L0-lgnd-cx09` и `L0-xq3`.

Что этот разбор добавляет к `cx09`:
- живое доказательство пункта 1 (`2.red.json` этой задачи); `cx09` проверял его только по коду;
- измеренное следствие при офлайн-крафтере;
- ошибочность довода «старые спеки читались иначе»;
- то, что вся цепочка v3 (`xcx11`, `adr-hold`, `lgnd-ad11`, `adr-wpn3`) построена без учёта `decision-l0-xq3`.

## 4. Оператору — единственный вопрос

**Кому возвращается потерянное легендарное оружие (Void, лава, огонь, despawn), если его передали другому игроку?**

- **(a) Тому, кто скрафтил.** Так работает сейчас и так записано в `decision-l0-xq3`.
  - Цена: переписать `lgnd-ac08` и `ac18`, `gl06`; отклонить `L0-adr-hold` и пункт 4 `lgnd-ad11`; поправить строку `adr-wpn3:33`.
  - Отступление от Orbital §5 внести в список отклонений для клиента.
  - Остаётся измеренное следствие: B теряет оружие при любой потере, а если A офлайн или ушёл навсегда, единственный экземпляр пропадает из мира.
- **(b) Последнему игроку, у которого оно было в инвентаре.** Это `L0-adr-hold`, `lgnd-ad11`.
  - Цена: одна задача (§5); `decision-l0-xq3` становится замещённым.
  - Старые стеки без `holder` продолжают возвращаться крафтеру (`holder ?? owner`), так что поведение миров v1.2.0 меняется только после первой передачи.

**Рекомендация агента: (b).** Решение за оператором. Почему (b):
1. Все три клиентских текста говорят «последнему владельцу». Orbital §5:81 прямо добавляет «не привязано навсегда к создателю», а §5:85 называет владельцем того, у кого оружие было («смерть прежнего владельца»).
2. Сам `decision-l0-xq3` признаёт: «по букве спеки прав вариант “последнему державшему”». Единственный его довод — не расширять эпик про структуры — отпал: структуры отгружены в v1.2.0 (`af024e4`, 2026-09-27).
3. Orbital-спека пришла 2026-09-29, после решения, и повторяет правило как общее для всех легендарных.

## 5. Постановка на случай ответа (b) (не заведена)

**Заголовок:** «Legendary loss return goes to the last holder (`holder` on the mark)».

**Parent work goal:** `L0-xcx11` и пункт 1 `L0-lgnd-cx09`, после ответа оператора на `L0-xq3` = (b).

- **Наблюдение.** `2.red.json` этой задачи. Меч, переданный B и потерянный B, уходит крафтеру A: онлайн — в руки, офлайн — в `andrew:ws_owed[A]`.
- **Механизм.** §2 CAUSE.
- **Достижимость.** Обычная игра: выбросить и подобрать, или положить в сундук и забрать; потом Void, лава или despawn. Прогон это подтверждает.
- **Дизайн уже записан** в `lgnd-ad11` пп. 1–5 и `lgnd-ent2`:
  - `holder` и `holderName` — dynamic properties **на стеке**;
  - `holder` пишется на `playerInventoryItemChange` для любого помеченного стека, у которого `holder` отличается от игрока: clone, set, запись слота. Условие «отличается» не даёт событию зациклиться. Сейчас обработчик `recovery.ts:76` выходит, если id не наблюдается, поэтому для записи `holder` нужна своя ветка;
  - ещё `holder` пишется при restore, возврате и `give`;
  - цель возврата = `holder ?? owner`;
  - `owed` ключуется целью;
  - контейнер держателем не становится.
- **Порядок.** По `adr-wpn3` задача идёт после задачи «gen + owed list» из `CNTR-LGND-CX09-AA` §4. Корректность `holder` от `gen` не зависит: дубль при незамеченном подборе есть и сейчас, просто уходит крафтеру.

**Критерии приёмки:**
1. `[e2e]` `andrew:legendary_xcx11_void_after_transfer` (приложение A) зелёный. A скрафтил, B подобрал и потерял в Void: у B 1 экземпляр с тем же id, у A 0, у A нет сообщения.
2. `[e2e]` `andrew:legendary_xcx11_void_after_transfer_crafter_offline` зелёный: A офлайн, B онлайн получает меч, в `owed` нет записи A.
3. `[e2e]` B офлайн в момент потери: B выбросил и отключился, потом предмет ушёл в Void. `andrew:ws_owed` содержит id B и не содержит id A; A ничего не получает.
4. `[e2e]` A положил меч в сундук, хоппер перенёс его в другой сундук: `holder` остаётся A, контейнер держателем не становится (`ac18`, последний абзац).
5. `[e2e]` Без регрессий: `legendary_returns_from_void`, `legendary_survives_lava`, `legendary_pickup_no_duplicate`, `websword_death_returns`, `websword_first_claim` (`main.ts:343`, owner = крафтер), а затем полный `bds:gametest`.
6. `[unit]` Стек или метка без `holder` (v1.2.0) дают цель = `owner`. Некорректный `holder` не ломает `parseMark` и `getMark`.
7. `[build]` `npm run build` и `tsc --noEmit` (strict) зелёные.

## 6. Дубликаты в KV (пути от `.ai/context/analysis/`; не правились)

Чтобы не повторять `CNTR-LGND-CX09-AA` §6-D, перечислены прежде всего копии, которых там нет.

**A. Довод «старые спеки читались иначе» ложен.**
- `nodes/xcx11__concept-contradiction.md:27`, `contradictions.md:345`, `risks.md:356`.
  - Было: «It needs client confirmation because the older weapon specs were read the other way.»
  - Стало: «It needs the operator to reverse decision-l0-xq3 (2026-09-26, autopilot: keep the crafter). No spec reads it the other way: Scythe §1 and Orbital §5 both say «последнему владельцу»; the Web Sword spec has no loss-return rule.»
- `nodes/adr-hold__concept-architecture-decision.md:20`.
  - Было: «because the Orbital spec is newer than `xq3` but does not say “overrides”».
  - Стало: «because `xq3` was answered by decision-l0-xq3 (crafter, 2026-09-26) and this ADR reverses it».

**B. `xq3` уже решён, analysis этого не видит.**
- `nodes/xcx11…:23`, `contradictions.md:341`, `risks.md:352`.
  - «`L0-adr-wpn2` kept the as-built owner pending the client's answer to `L0-xq3`» → «… then decision-l0-xq3 (2026-09-26) kept the crafter until the operator asks».
  - Там же «which is the crafter or the admin» → «the crafter, or the recipient of an admin copy (`commands.ts:106`)».
- `nodes/xq3__concept-client-question.md:26`: к «Autopilot keeps (a) until you answer (`L0-adr-wpn2`)» добавить «— recorded as decision-l0-xq3».
- `nodes/lgnd-ad11__concept-architecture-decision.md:44`.
  - Было: «`L0-adr-hold` still needs the client's one-line confirmation».
  - Стало: «… the operator's reversal of decision-l0-xq3».

**C. «Торговый эксплойт» → измеренный вред.**
- `nodes/xcx11…:25`, `contradictions.md:343`, `risks.md:354`: «It also creates a trading exploit: B can "return" the weapon to A for free.» → «B loses possession to A on any loss; with A offline the only instance leaves the world until A rejoins (measured, `.ai/verify/CNTR-XCX11-AA/2.red.json`). No duplicate.»
- `nodes/lgnd-ad11…:25`: «That lets B "return" a traded weapon to A for free.» → то же.

**D. «Accepted» против «proposed» и «закрывается на мерже».**
- `nodes/adr-wpn3__concept-architecture-decision.md:33`: «**Last holder.** … `lgnd-ad11` → accepted» → «Last holder — pending the operator's reversal of decision-l0-xq3; `lgnd-ad11` stays proposed».
- `nodes/adr-wpn3…:51`, `summary.md:67`, `summary.md:106`, `nodes/concept-overview.md:64`, `nodes/concept-overview.md:103`: «`xcx9`–`xcx11` close when that task merges» → «`xcx11` closes on the operator's answer to `xq3`: with the holder task if (b), with the rewrite of `ac08`/`ac18` if (a)».
- `nodes/lgnd__concept-component.md:41`, `project-knowledge/architecture.md:46`, `project-knowledge/domain-model.md:437`: «Loss return goes to the **last holder**» → «… if the operator accepts `L0-adr-hold` (today decision-l0-xq3 = crafter)».
- `nodes/orbc__concept-component.md:35`, `project-knowledge/architecture.md:112`, `project-knowledge/domain-model.md:501`: «and the last holder (`L0-xcx10`/`xcx11`, `L0-adr-hold`)» → «and the return target per `L0-xq3`».
- Уже перечислены в `CNTR-LGND-CX09-AA` §6-D, повторно не расписываю:
  - `nodes/orbc-r009…:23`, `project-knowledge/business-rules.md:595`;
  - `nodes/lgnd-gl06…:19`, `project-knowledge/glossary.md:550`;
  - `nodes/lgnd-ac08…:20` (+ `scope.md:172`, `glossary.md:170`);
  - `nodes/lgnd-ac18…:20` (+ `scope.md:399`, `glossary.md:397`); последняя строка `ac18` «Pending the client's confirmation» уже верна.

**E. Тот же факт в другой формулировке (дубли, не ошибки).**
- `nodes/lgnd-cx09__concept-contradiction.md:31`, `contradictions.md:226`, `risks.md:233` — пункт 1 `cx09`.
- `nodes/adr-hold…:21`, `project-knowledge/architecture.md:273` — «as-built code returns it to the mark's `owner`».
- `nodes/xq3__concept-client-question.md:21` — тот же сценарий в вопросе клиенту.

## 7. Резолюция для `refine resolve` (L0-xcx11) — по ответу оператора

**Измерено независимо от ответа.**
- Код `32f4aca` на BDS 1.26.51.1 (`.ai/verify/CNTR-XCX11-AA/2.red.json`, 2026-09-29T19:52Z) возвращает меч, переданный B и потерянным B, крафтеру A. Онлайн: A=1, B=0. A офлайн: `andrew:ws_owed` = [A], B=0.
- Причина: `owner` пишется только при крафте и выдаче (`craftgate.ts:139`, `commands.ts:106`), а `lost()` целится в `w.mark.owner` (`recovery.ts:219/225/228`). Поля `holder` нет (`rules.ts:15-21`).
- Довод «старые спеки читались иначе» неверен: Scythe §1:33 и Orbital §5:89 оба говорят «последнему владельцу»; в спеке Web Sword правила потери нет.
- «Торговый эксплойт» дюпа не даёт; настоящий вред — потеря владения у B.
- Узел — дубль пункта 1 `L0-lgnd-cx09`. Вопрос — `L0-xq3`.

**Если (b):**
- `decision-l0-xq3` замещается;
- `L0-adr-hold` и пункт 4 `lgnd-ad11` становятся accepted;
- `xcx11` закрывается мержем задачи §5 с зелёными критериями 1–5;
- `xq3` и пункт 1 `cx09` закрываются вместе с ним.

**Если (a):**
- `L0-adr-hold` отклоняется, пункт 4 `lgnd-ad11` → `owner`;
- `ac08`/`ac18`/`gl06` переписываются на «крафтеру»;
- строка `adr-wpn3:33` исправляется;
- отступление от Orbital §5 идёт в список отклонений для клиента;
- `xcx11`, `xq3` и пункт 1 `cx09` закрываются сразу, как «принято осознанно».

**До ответа** узел не закрывается.

## Приложение A. Репро (не закоммичено)

Подключение:
- `import "./xcx11-repro";` в `src/gametest/main.ts` после `import "./bastion-body";`;
- два имени в `EXPECTED_TESTS` (`scripts/bds-gametest.mjs`) после `'andrew:legendary_pickup_no_duplicate'`: `andrew:legendary_xcx11_void_after_transfer` и `andrew:legendary_xcx11_void_after_transfer_crafter_offline`.

Файл `src/gametest/xcx11-repro.ts`: утверждения записаны в прочтении (b), поэтому на `32f4aca` оба теста красные.

```ts
import { type Container, GameMode, ItemStack, type Player, type Vector3, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, register } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_B: Vector3 = { x: 4, y: 2, z: 5 };
const OWED_KEY = "andrew:ws_owed";

function inv(player: Player): Container {
  const c = player.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${player.name} has no inventory`);
  return c;
}
function slotOf(c: Container, id: string): number {
  for (let s = 0; s < c.size; s++) {
    const st = c.getItem(s);
    if (state.isItemOf(WEB_SWORD, st) && state.getMark(WEB_SWORD, st)?.id === id) return s;
  }
  return -1;
}
function count(c: Container, id: string): number {
  let n = 0;
  for (let s = 0; s < c.size; s++) {
    const st = c.getItem(s);
    if (state.isItemOf(WEB_SWORD, st) && state.getMark(WEB_SWORD, st)?.id === id) n++;
  }
  return n;
}
function owedIds(): string[] {
  const raw = world.getDynamicProperty(OWED_KEY);
  if (typeof raw !== "string") return [];
  try { return Object.keys(JSON.parse(raw) as Record<string, string>); } catch { return []; }
}

function transferThenVoid(tag: string, crafterOffline: boolean) {
  return (test: Test): void => {
    const crafter = test.spawnSimulatedPlayer(STAND_A, `xcx11_crafter_${tag}`, GameMode.Survival);
    const holder = test.spawnSimulatedPlayer(STAND_B, `xcx11_holder_${tag}`, GameMode.Survival);
    const crafterId = crafter.id;
    let id = "";
    test.runAfterDelay(4, () => {
      const mark = state.makeMark("craft", crafter);
      id = mark.id;
      holder.dimension.spawnItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark), holder.location);
    });
    test.runAfterDelay(60, () => {            // past one 40-tick recovery check
      const b = inv(holder);
      test.assert(count(b, id) === 1 && count(inv(crafter), id) === 0, "hand-over failed");
      if (crafterOffline) (crafter as SimulatedPlayer).disconnect();
      holder.selectedSlotIndex = slotOf(b, id);
      test.assert(holder.dropSelectedItem(), "dropSelectedItem refused");
      test.runAfterDelay(3, () => {
        const e = holder.dimension.getEntities({ type: "minecraft:item", location: holder.location, maxDistance: 8 })
          .find((x) => { const s = x.getComponent("minecraft:item")?.itemStack;
                         return state.isItemOf(WEB_SWORD, s) && state.getMark(WEB_SWORD, s)?.id === id; });
        test.assert(e !== undefined, "no dropped sword near the holder");
        e!.teleport({ x: e!.location.x, y: e!.dimension.heightRange.min - 8, z: e!.location.z });
        test.runAfterDelay(80, () => {
          const toHolder = count(inv(holder), id);
          const toCrafter = crafterOffline ? -1 : count(inv(crafter), id);
          const owed = owedIds();
          test.assert(toHolder === 1 && (crafterOffline ? !owed.includes(crafterId) : toCrafter === 0),
            `Orbital §5 reading (last holder): got holder=${toHolder}, crafter=${crafterOffline ? `owed=${owed.includes(crafterId)}` : toCrafter}`);
          test.succeed();
        });
      });
    });
  };
}

register("andrew", "legendary_xcx11_void_after_transfer", transferThenVoid("online", false))
  .structureName(STRUCTURE).maxTicks(300).tag("andrew");
register("andrew", "legendary_xcx11_void_after_transfer_crafter_offline", transferThenVoid("offline", true))
  .structureName(STRUCTURE).maxTicks(300).tag("andrew");
```

В прогоне использовалась версия с диагностическими `console.warn`: строки `[xcx11] …`, которые цитирует §2. Логика та же, что здесь.
