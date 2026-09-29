ИСХОД: 3 — Подчистка знания

# Разбор cool-ctr1 (CTR-1): Void return / неуничтожимость для Web Sword

Проверено на HEAD `32f4aca` (ветка `task/CNTR-COOL-CTR1-AA`), 2026-09-29.

Итог. Вреда из утверждения нет. Возврат из Void, лавы и других обычных уничтожений —
общее правило для всех легендарных. Решения приняты 2026-09-24, код в `src/legendary/recovery.ts`
тоже с 2026-09-24. Правило действует и для `andrew:web_sword`, что подтверждено прогоном на BDS
сегодня. Кодовая половина утверждения ссылается на файл, которого нет с 2026-09-24. Сам узел уже
закрыт решением (`closed_reason: resolved_by_decision`). В очередь он вернулся из-за оставшегося
тега `status:open`. Кроме него, в KV ещё пять документов описывают правило как открытое или
предположительное.

## Перепроверка утверждения, по частям

| # | Часть утверждения | Как проверено | Результат |
|---|---|---|---|
| a | Scythe §1: «…при падении в Void возвращается последнему владельцу **по общим правилам**» | `grep -n "Void" .ai/context/scytheofcalamityspecv1ruen-part-1.md` | верно, дословно, строка 33 |
| b | Web Sword §4 — только death retention; про void/lava/fire/cactus/despawn ничего | `grep -n -i -E "void\|бездн\|лав\|lava\|кактус\|cactus\|деспаун\|despawn\|огон\|fire\|уничтож\|destroy"` по трём частям спеки | верно: 0 совпадений по теме. Единственное совпадение, part-2:95, про контейнер внутри куба паутины. §4 — строки 53–61 part-1 |
| c | Код `src/websword/retention.ts` — только death sweep/restore | `git cat-file -e HEAD:src/websword/retention.ts` → `fatal: path … does not exist`; grep `Void\|lava\|heightRange\|entityRemove\|entitySpawn\|entityLoad\|runInterval` по `ebf3d0a:` и `392253d~1:` → 0 | было верно с `ebf3d0a` (2026-09-22) до `392253d` (2026-09-24 21:55). Устарело до записи утверждения: узел закоммичен в `f216709` 2026-09-25 00:13, а возврат потерь для всех легендарных — `ed7558b` 2026-09-24 22:02 |
| d | «Web Sword, брошенный в лаву или Void, потерян для мира навсегда» | GameTest на BDS 1.26.51.1, см. GREEN/LIVE | неверно на HEAD: меч возвращается владельцу, ровно 1 экземпляр |
| e | «Спеки расходятся, допустимо ли это» | decisions.md:338–354; Orbital part-1:79–91 (§5), part-4:41 (тест 20) | снято двумя решениями от 2026-09-24. Третий источник, Orbital §5, прямо называет это «общим правилом легендарных оружий» и в тесте 20 распространяет его на «all legendary weapons». Спека Web Sword молчит, но не противоречит |

Код на HEAD:
- `src/legendary/registry.ts:57`: `LEGENDARIES = [WEB_SWORD, SCYTHE_OF_CALAMITY]`.
- `src/legendary/recovery.ts` (277 строк): следит за любой помеченной копией любого def. Опций отказа нет: `grep -rn returnOnLoss src/` → 0, в `LegendaryDef` такого поля нет.
- `check()`: `y < heightRange.min` → Void; пропажа при загруженном чанке → «vanished from the ground», то есть лава, огонь, кактус, взрыв, деспаун.
- `lost()` → `setPending` + `retention.restore`, если владелец онлайн; мировое `_owed`, если офлайн.
- Подключено в `src/main.ts:33` и в `src/gametest/main.ts:118`.
- Между последним историческим зелёным артефактом `3306fb1` и HEAD `git diff --stat -- src/legendary src/main.ts src/gametest/main.ts` пуст.

## /diagnose

```text
OBSERVED: A KV claim (cool-ctr1, analysis v1, f216709 2026-09-25 00:13) says the Web Sword
          spec §4 and the code in src/websword/retention.ts have no Void/destruction return.
          Stated harm: the sword is lost for good. No run, log or report comes with it, only a
          reading of a file path.
VERDICT: hypothesis → checked as a bug (the default at a fork). The spec quotes are accurate;
         the code half is stale (the file is absent from HEAD, and loss return for all
         LEGENDARIES landed in ed7558b before the claim was written). The expectation "a
         legendary is never lost for good" is recorded in decision-legendary-rules-obschie-
         dlya-vseh-legendarnyh-vk and decision-resolve-cool-ctr1 (both 2026-09-24).

REPRO: The harm does not reproduce. A marked andrew:web_sword that is dropped and then
       destroyed (below heightRange.min / real lava) comes back to its owner, 1 instance, the
       ground empty. Historical record: 29 of 29 run-check artifacts in .ai/verify/*/ from
       2026-09-24 22:17 (LG-KEEP-02-AA/2.json, e38cb75) to 2026-09-27 19:25
       (WRDN-BIG-01-AA/5.json, 3306fb1) have exit 0 and all 3 tests passed.
CAUSE: No live cause. The claimed mechanism held only for src/websword/retention.ts
       @ebf3d0a..392253d~1. At HEAD, recovery.ts covers every LEGENDARIES def, Web Sword included.
PROOF: 29 historical artifacts + a fresh artifact at HEAD (below). There is no red check,
       because there is no defect at HEAD for one to be red about.
RULED OUT: "Loss return exists but is Scythe-only" (the per-def returnOnLoss from lgnd-as01
       option b): grep returnOnLoss src/ = 0, and the green tests use WEB_SWORD itself
       (gametest/main.ts:74-75). "Only the test pack arms recovery": the release pack arms it
       at src/main.ts:33.

RADIUS: No code fix; knowledge text only. Readers: the lgnd v3 plan (ASM-lgnd-01 impact list
        ac08–ac10, ac12, p003), L0-adr-lgnd, and the contradiction queue (the stale
        status:open tag put an already-closed node back into this wave). How I looked: grep over
        the root vault for the address (websword/retention: 2 hits) and for identifiers
        (cool-ctr1|CTR-1|Scythe-only|returnOnLoss|lost for good|навсегда|безвозвратно:
        40 hits, read one by one); grep in src/ for returnOnLoss and for the registerRecovery
        call sites. Not a restriction: nothing that works today stops working.

GREEN: /Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-COOL-CTR1-AA/2.json — exit 0,
       code_sha 32f4aca (=HEAD), 2026-09-29T19:26:33Z, run_kind against_workspace,
       cmd `env ANDREW_BDS_DIR=bds-ctr1 node scripts/bds-gametest.mjs --only
       andrew:legendary_returns_from_void --only andrew:legendary_survives_lava --only
       andrew:legendary_pickup_no_duplicate`. All three passed. It reached the subject: the
       server log has recovery.ts lines for andrew:web_sword itself, see LIVE.
LIVE: BDS 1.26.51.1 in Docker, release pack + gametest pack, dist/bds-gametest.log:
        19:26:14 legendary recovery: watching andrew:web_sword id 62-0h4rpak8c91m (via entitySpawn)
        19:26:14 [gametest] void: teleported the dropped sword to y=-72
        19:26:16 … id 62-0h4rpak8c91m vanished from the ground; returning to andrew_voider
        19:26:16 legendary retention: returned andrew:web_sword id 62-0h4rpak8c91m to andrew_voider
        19:26:19 [gametest] lava: sword entity burned in real lava
        19:26:20 … id 83-hnpma6i16wg vanished from the ground; returning to andrew_burner
        19:26:20 legendary retention: returned andrew:web_sword id 83-hnpma6i16wg to andrew_burner
        19:26:25 … id 107-xf7pwyc6vp picked up — seen entering an inventory (control: nothing returned)
      The lava sword was destroyed by the engine itself ("burned in real lava"), not by
      entity.remove(). Not measured separately: fire, cactus, explosion, despawn (same
      "vanished from the ground" branch as lava).
```

Среда прогона. Первый прогон на общем `andrew-bds-ci` упал из-за среды, а не теста. Соседний
разборщик CNTR-COOL-CTR2-AA запустил `bds-check.mjs` в 21:24:50, и тот пересоздал контейнер;
мой прогон умер в 21:24:52 с «container which is dead or marked for removal». Этот артефакт
перезаписан зелёным. Зелёный прогон шёл на временном экземпляре `docker/bds-ctr1`: копия
`bds-ci` с контейнером `andrew-bds-ctr1` и портами 19196/19197, 19180–19189, 7556. Экземпляр не
закоммичен и удалён после прогона. Параллельные разборщики одной волны делят одно имя
контейнера `andrew-bds-ci` и убивают друг другу прогоны. Это стоит знать тому, кто
запускает волну.

## Резолюция для `refine resolve cool-ctr1`

> Подтверждено: возврат из Бездны и возврат после обычного уничтожения (лава, огонь,
> кактус, взрыв, деспаун) — общее правило всех легендарных, включая Паутинный меч.
> Это закреплено в decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk и
> decision-resolve-cool-ctr1 (обе от 2026-09-24); Orbital §5 и тест 20 говорят то же.
> Реализовано в `src/legendary/recovery.ts` (ed7558b, 2026-09-24) для всех
> `LEGENDARIES` (`registry.ts:57` = [WEB_SWORD, SCYTHE_OF_CALAMITY]), без отказа по
> оружию. `src/websword/retention.ts` на HEAD не существует: он перенесён в
> `src/legendary/retention.ts` (392253d, 2026-09-24). Измерения: GameTest
> `legendary_returns_from_void` и `legendary_survives_lava` на `andrew:web_sword` зелёные
> в 29 из 29 артефактов с 2026-09-24 по 2026-09-27 и в
> `.ai/verify/CNTR-COOL-CTR1-AA/2.json` (HEAD 32f4aca, 2026-09-29, BDS 1.26.51.1). Лог
> показывает «burned in real lava» → «returned andrew:web_sword … to andrew_burner».
> Право крафта не открывается (Q-014, L0-lgnd-r011). Кому возвращается (крафтившему или
> последнему державшему) — вне этого узла: decision-l0-xq3 (2026-09-26) оставляет
> крафтившего; «последний державший» ведут L0-xcx11 и L0-lgnd-cx09. «Неуничтожимо» против
> «уничтожено — значит возвращено» ведёт L0-xcx10.

## Дубликаты и устаревшие копии (править не мной — после волны)

Пути от корня проекта. Строки — по корневому хранилищу на 2026-09-29.

1. `.ai/context/analysis/nodes/cool-ctr1__concept-contradiction.md:13`. В тегах `"status:open"`
   заменить на `"status:resolved"`. Узел уже закрыт (`closed_at: 2026-09-24`,
   `closed_reason: resolved_by_decision`), и этот тег противоречит закрытию.
2. `.ai/context/analysis/nodes/cool-ctr1__concept-contradiction.md:23`. Фразу «Code `src/websword/retention.ts` handles the death sweep/restore only (verified: no void/destroy handling).» заменить на «Code (at 2026-09-24): `src/websword/retention.ts` handled death only; it moved to `src/legendary/retention.ts` (392253d), and loss return for every legendary, the Web Sword included, lives in `src/legendary/recovery.ts` (ed7558b).»
3. `.ai/context/analysis/nodes/adr-lgnd__concept-architecture-decision.md:33`. Фразу «CTR-1 (Void/lava return for the Web Sword) and CTR-3 (off-hand priority). Both stay open at L0 and run on their autopilot defaults (Q-020 a, Q-019 a)» заменить на «CTR-1 (Void/lava return for the Web Sword) is closed by `decision-resolve-cool-ctr1` (2026-09-24) and shipped in `src/legendary/recovery.ts`.» Часть про CTR-3 — вне этого разбора: у cool-ctr3 по `kv_contradictions` тоже `closed_reason: resolved_by_decision`, но я это не перепроверял.
4. `.ai/context/analysis/nodes/lgnd-as01__concept-assumption.md:12` и `:15`. Тег `"CAN_ASSUME"` заменить на «decided», со ссылкой на `decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk`. Фразу «ASM-lgnd-01: Q-020 default (a) applies to both weapons.» заменить на «ASM-lgnd-01 — decided 2026-09-24 (decision-legendary-rules-…): loss return applies to all legendaries, shipped in ed7558b.» Сводка `.ai/context/analysis/assumptions.md:19` генерируется из узла и обновится сама.
5. `.ai/context/analysis/nodes/cool-asm3__concept-assumption.md:13` и `:21`. Тег `"CAN_ASSUME"` заменить на «decided» (то же решение). Фразу «if it applies but isn't implemented, the already-shipped Web Sword (v0.3.x) can be lost permanently» заменить на «implemented in `src/legendary/recovery.ts` (ed7558b); proven by `legendary_returns_from_void` / `legendary_survives_lava` on `andrew:web_sword`».
6. `.ai/context/analysis/nodes/lgnd-p002__concept-process.md:23`. Фразу «Generalised from `src/websword/retention.ts`.» заменить на «Lives in `src/legendary/retention.ts` (moved from `src/websword/` in 392253d).» Это то же устаревшее имя файла; приоритет низкий.

Проверено и верно, не трогать:
- `lgnd-r011:26` — история, «used to destroy the sword for good»;
- `lgnd-cx04:29`, `analysis/contradictions.md:85`, `analysis/risks.md:87` — «Q-014's "lost for good" is no longer true»;
- `analysis/decisions.md:338–354`.

## Остаток составного утверждения (узел это не держит)

- **«Последнему владельцу».** Код возвращает `mark.owner`, то есть крафтившему или получателю
  admin-копии (`recovery.ts:219`, `:225`). Это решено через decision-l0-xq3 (2026-09-26): оставить
  крафтившего. Вариант «последний державший» ведут открытые L0-xcx11 и L0-lgnd-cx09, а также
  пункт 4 плана lgnd v3. Новой карточки не нужно.
- **«Не должно уничтожаться» против «уничтожено — значит возвращено».** Ведёт открытый L0-xcx10.
  Решение от 2026-09-24 прямо фиксирует возврат вместо физической неуязвимости.
- **Огонь, кактус, взрыв, деспаун** проходят ту же ветку кода, что и лава, но отдельными GameTest
  не покрыты. Это запланировано как `L0-lgnd-ac09` (канал bds) в задаче lgnd v3. Не дефект.

Карточек не заведено, в KV ничего не записано.
