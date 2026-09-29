# Diagnose CNTR-COOL-CTR3-AA — CTR-3 · off-hand priority deferred vs required

ИСХОД: 2 — Работа над кодом

Утверждение составное; разобрано по частям.

| Часть | Что утверждается | Состояние на 2026-09-29 |
|---|---|---|
| A | Q-010 откладывает приоритет рук, а §6 Косы требует его сейчас | **Снято.** Q-010 отменено решением оператора 2026-09-24, код есть и покрыт тестами |
| B | «custom items need `allow_off_hand`» — показ во второй руке по §6 | **Живо.** 0/2 легендарных предмета объявляют компонент; предмет нельзя положить во вторую руку в Survival |

Узел `cool-ctr3` формально закрыт 2026-09-24 (`closed_by_ref: decision-resolve-cool-ctr3`), но это закрыло только часть A. Часть B не поддаётся здесь: я не могу поставить на iPad проверку того, что предмет можно перетащить во вторую руку. **Поэтому узел как «доставлено» не закрывается**, пока не отгружена постановка ниже.

## Измерения (перепроверены той же операцией)

| Число / факт из утверждения | Команда | Результат |
|---|---|---|
| Web Sword §8 — «если в будущем» | `kv_search` raw `webswordspecv1ruen-part-2` | «Если в будущем одновременно используются легендарные предметы в обеих руках…» — подтверждено |
| Scythe §6 — «в основной **или второй** руке», общее правило без «в будущем» | raw `scytheofcalamityspecv1ruen-part-1` §6 | подтверждено дословно |
| Q-010 = отложено | `doc_get decision-q-010-…` | `decided_at 2026-09-21` |
| Q-010 отменено | `doc_get decision-legendary-hand-priority-…`, `decision-resolve-cool-ctr3` | оба `decided_at 2026-09-24`, `outcome: changed` |
| приоритет рук в коде | `git log -1 -- src/legendary/hands.ts` | `392253d 2026-09-24 LG-CORE-01-AA`; `hands.ts:20` Mainhand→Offhand, `hands.ts:33-40` resolveActivation |
| HUD обеих рук | `src/legendary/hud.ts:36-37` | итерирует `heldLegendaries` (обе руки), дедуп по ability key |
| unit-покрытие | `node --test tests/legendary-registry.test.mjs tests/web-sword-cooldown.test.mjs` | 40/40 pass; таблица из 9 строк `legendary-registry.test.mjs:161`, off-hand HUD `web-sword-cooldown.test.mjs:244` |
| «custom items need `allow_off_hand`» | `grep -a` по `bedrock_server-1.26.51.1` в `andrew-bds-qa` | «The allow_off_hand component determines whether the item can be placed in the off hand slot of the inventory.» |
| компонент в предметах | `grep -rl allow_off_hand packs/ \| wc -l` | **0** |
| компонент когда-либо в коде | `git log --all -S allow_off_hand` | только `68d5766`, `f216709` (оба `docs(kv)`), в `packs/` ни разу |
| ванильные BP на BDS | `grep -rl allow_off_hand behavior_packs` (в контейнере) | 0 |
| «reachable in **Stage 2**» | board: DEMO-S2-AA = Web Sword, DEMO-S3-AA = Scythe; `git log --diff-filter=A` предмета Косы | **неверно**: второй легендарный предмет появился на этапе 3 — `8a8d500 2026-09-24 SC-ITEM-01-AA` |

## /diagnose

```text
OBSERVED: узел cool-ctr3 (analysis_version 1) говорит: Q-010 (2026-09-21) откладывает
          приоритет рук, а Scythe §6 требует Action Bar во второй руке и приоритет сейчас.
          В frontmatter узла одновременно стоят closed_at 2026-09-24 и тег status:open.
VERDICT: (A) смена решения, уже сделана (decision-legendary-hand-priority, 2026-09-24).
         (B) бага: §6 требует показ во второй руке, а предмет туда не кладётся.
         Расхождение с записанным требованием (§6, AC-scyt-16, lgnd-ac04..06).

REPRO: ai-kit run-check --expect-red, скрипт читает оба JSON легендарных предметов →
       "legendary items placeable in off hand: 0/2", код 1. Детерминировано, 1/1.
CAUSE: packs/behavior/items/web_sword.json и scythe_of_calamity.json — в components
       нет "minecraft:allow_off_hand". Движок (строка схемы BDS 1.26.51.1) решает этим
       компонентом, можно ли положить предмет во вторую руку. Поэтому ветка Offhand в
       src/legendary/hands.ts:20 и двухсегментный бар hud.ts:36 в Survival не получают
       входа (слот заполняется только командой / setEquipment).
PROOF: .ai/verify/CNTR-COOL-CTR3-AA/2.red.json (красный, 0/2) + строка движка (grep -a).
       Не исполнимо здесь: отказ UI на iPad перетащить предмет во вторую руку. Это
       клиент; симулированный игрок не шлёт перемещений инвентаря. На устройстве
       не наблюдалось (так же помечено в L0-scyt-cx03:25).
RULED OUT: (1) «решение всё ещё откладывает» — опровергнуто: decision-legendary-hand-
           priority 2026-09-24 отменяет Q-010; 392253d реализует; 40/40 unit
           (.ai/verify/CNTR-COOL-CTR3-AA/2.json).
           (2) «hand_equipped / теги инструмента уже пускают предмет во вторую руку» —
           движок держит для этого отдельный компонент; ни один ванильный BP на BDS его
           не использует. Прямого наблюдения на устройстве нет — остаток в PROOF.

RADIUS: как искал: grep Offhand|EquipmentSlot|getEquipment по src/ (только hands.ts);
        прочитаны retention.ts:101-121, craftgate.ts:37-128, вызовы resolveActivation
        (websword/trap.ts:126, scythe/targeting.ts:160), тесты предметов
        (web-sword-item.test.mjs:88, scythe-item.test.mjs:65 — проверяют отдельные
        компоненты, не закрытый список), scripts/validate.mjs (нет allow-list),
        @minecraft/server 2.10.0 index.d.ts:2615 (PlayerInventoryType = Hotbar|Inventory),
        KV L0-adr-wpn2, L0-adr-wpn3, lgnd-cx10, lgnd-cx11.
        Кто зависит:
        (1) гейт крафта читает только container и слушает playerInventoryItemChange,
            у которого нет типа для второй руки → свежескрафченная немеченая копия,
            положенная с курсора сразу во вторую руку, минует claim/refund (риск C-7),
            пока не отгружены craft-токены (wpn3 шаг 3). Вывод из типов, не замер.
        (2) удержание при смерти, путь A, вторую руку не читает; путь B (подбор с
            земли, retention.ts:134) её подберёт, кроме выхода игрока в тот же тик.
        (3) Орбитальная пушка: orbc-ent1 уже планирует allow_off_hand: true.
        Правка добавляет возможность и ничего не отнимает → не ограничение, CASES/BYPASS нет.

GREEN: часть A — тот же прогон unit 40/40 (.ai/verify/CNTR-COOL-CTR3-AA/2.json);
       тесты импортируют src/legendary/*.ts через стаб @minecraft/server и зовут
       настоящий resolveActivation/hudMessage. Часть B — правки нет (задача — отчёт),
       красный остаётся красным.
LIVE: не выполнялся. Единственный канал, доказывающий часть B, — iPad (L0-adr-wpn2);
      GameTest с setEquipment(Offhand) даёт ложный зелёный (lgnd-cx08).
```

## Резолюция для `refine resolve cool-ctr3`

> Часть «решение vs спека» закрыта 2026-09-24: decision-legendary-hand-priority отменяет Q-010 (decision-resolve-cool-ctr3, outcome=changed). Код: `src/legendary/hands.ts` (392253d, 2026-09-24) — основная рука, затем вторая; `hud.ts` показывает обе; unit 40/40, включая таблицу приоритета из 9 строк. Доставка не завершена: `grep -rl allow_off_hand packs/` → 0 (0/2 легендарных предмета), `git log -S allow_off_hand` → только KV-коммиты 68d5766 и f216709. Движок BDS 1.26.51.1 пускает предмет во вторую руку только с этим компонентом, поэтому в Survival показ §6 во второй руке и правило приоритета недостижимы. Остаток — принятая работа L0-adr-wpn2 (строка lgnd-cx08+scyt-cx03) = шаг 1 задачи lgnd v3 по L0-adr-wpn3. Исправление: второй легендарный предмет появился на этапе 3 (8a8d500), а не 2. Узел остаётся открытым до отгрузки и проверки на iPad.

## Постановка (исход 2)

**Не заводить отдельной карточкой.** Тот же факт уже лежит на доске: `CNTR-LGND-CX08-AA` (backlog), а retention-часть — `CNTR-LGND-CX10-AA` (backlog). Он же — шаг 1 задачи `lgnd` v3 (`L0-adr-wpn3` §Sequencing). Постановку ниже влить туда.

**Наблюдение.** Scythe §6 требует показывать состояние способности, когда Коса во второй руке, и применять общее правило приоритета рук. Код это делает (`hands.ts`, `hud.ts`), но ни `andrew:web_sword`, ни `andrew:scythe_of_calamity` не объявляют `minecraft:allow_off_hand`. Survival-игрок на iPad не может положить их во вторую руку.

**Механизм.** Компонент `minecraft:allow_off_hand` решает, пускает ли движок предмет в слот второй руки (строка схемы BDS 1.26.51.1). Его нет в `packs/behavior/items/{web_sword,scythe_of_calamity}.json`.

**Достижимость.** У каждого игрока, по устройству: 0/2 предмета, красный артефакт `.ai/verify/CNTR-COOL-CTR3-AA/2.red.json`.

**Критерии приёмки.**
1. [build] Оба JSON содержат `"minecraft:allow_off_hand": true`. Проверка: `tests/web-sword-item.test.mjs` и `tests/scythe-item.test.mjs` утверждают компонент; `npm run validate && npm run build` зелёные. Красный run-check выше становится зелёным.
2. [e2e, bds] `npm run bds:check` на BDS 1.26.51.1: пакет грузится без ошибок content log по новому компоненту.
3. [unit] `retain` (retention.ts) читает и слот `Equippable Offhand`: помеченная Коса во второй руке при `entityDie` → pending записан, слот очищен (L0-adr-wpn2, строка lgnd-cx10).
4. [unit] Гейт крафта видит немеченый крафт во второй руке: при сканировании (craftgate.ts `gate`) читается и `Offhand`, и немеченая крафтовая копия там получает claim/refund. Либо критерий снимается, если в том же изменении отгружаются craft-токены (L0-adr-wpn3 шаг 3).
5. [manual, ipad] На iPad обе вещи перетаскиваются во вторую руку. Action Bar показывает два сегмента (lgnd-ac06). Web Sword в основной руке на кулдауне + готовая Коса во второй → Use запускает Косу (AC-scyt-16, lgnd-ac05). Готовый Web Sword в основной → срабатывает только он (lgnd-ac04).

## Дубликаты и копии (живой KV `.ai/context/analysis/`, строки на 2026-09-29)

Устаревшие — заменить:
- `nodes/cool-ctr3__concept-contradiction.md:13` — теги `"status:open"` и `"resolved"` одновременно при `closed_at 2026-09-24` → оставить одно состояние: `status:decided` (+ ссылка на lgnd-cx08 как на остаток доставки).
- `nodes/cool-ctr3__concept-contradiction.md:25` — «reachable in Stage 2» → «reachable since Stage 3 (SC-ITEM-01-AA, 8a8d500, 2026-09-24)».
- `decisions/decision-q-010-main-hand-off-hand-priority-otlozheno.md:6` — title «= отложено» → добавить «(отменено 2026-09-24: decision-legendary-hand-priority)»; тогда перегенерируется `decisions.md:151`.
- `nodes/adr-lgnd__concept-architecture-decision.md:33` — «CTR-3 (off-hand priority)… stay open at L0 and run on their autopilot defaults» → «CTR-3 decided 2026-09-24 (decision-resolve-cool-ctr3); delivery = L0-adr-wpn2 allow_off_hand ×2».
- `decisions/decision-resolve-l0-trap-ct07.md:15` — evidence `decision-q-010-… (шов ability-key)` → `decision-legendary-hand-priority (шов ability-key использован в src/legendary/hands.ts)`.
- `nodes/scyt-ac16__concept-acceptance-criterion.md:18` и `:27` — «CTR-012» → «L0-lgnd-as07 (CTR-013)». CTR-012 — это слот зачарований (`nodes/sitm-adr1__concept-architecture-decision.md:6`), не вторая рука.
- `nodes/lgnd-ac04__concept-acceptance-criterion.md:20`, `nodes/lgnd-ac05__concept-acceptance-criterion.md:20` — «Channel: `bds`» → «Channel: `bds` (resolver через setEquipment) + `ipad` (предмет реально кладётся во вторую руку)». Иначе bds даёт ложный зелёный (lgnd-cx08).

Верные сегодня, но это тот же факт (0/2). После отгрузки переключить на «`allow_off_hand: true`»:
- `nodes/lgnd-cx08__concept-contradiction.md:32`, `nodes/scyt-cx03__concept-contradiction.md:25`, `nodes/lgnd-cx11__concept-contradiction.md:40`
- `nodes/lgnd__concept-component.md:32`, `project-knowledge/architecture.md:37`, `project-knowledge/domain-model.md:428`
- `nodes/scyt-r009__concept-rule.md:29`, `nodes/scyt-ent1__concept-entity.md:28`, `nodes/scyt__concept-component.md:55`
- `nodes/lgnd-cx04__concept-contradiction.md:28`
