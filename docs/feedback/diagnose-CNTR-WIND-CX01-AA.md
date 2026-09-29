# CNTR-WIND-CX01-AA · CX-wind-01 — разбор

ИСХОД: 3 — Подчистка знания

Утверждение составное, разобраны обе части:

- **A.** «Мельница у спавна 100 %, но только на суше; нет суши в 500 блоках — не определено» (`L0-wind-cx01`).
- **B.** Примечание надзирающего: на проде одноразовый поиск сгорел на Peaceful (`failed`, `searches=1`), «в нынешнем коде `pumpPlacement` считает бросок восстановимым, а поиск у спавна — нет».

Обе проблемы в коде закрыты: A — решением `L0-xq4` и кодом, B — коммитом `16251e6`. Осталось только описание в KV, которое разошлось с кодом.

## Intake

```text
OBSERVED: A — узел L0-wind-cx01 (analysis v2, status:open) называет случай
          «нет сухого места в 500 блоках» неопределённым спекой.
          B — прод andrew-bds (19132), docker logs, 2026-09-27 17:31:21 UTC, первая строка
          после старта контейнера: «spawn windmill: search already ran once in this world
          (status=failed searches=1 reason=error: strf place: minecraft:zombie_villager_v2
          for windmill:spawn#0 waits: the world is Peaceful), not repeated».
VERDICT:  A — не баг: решение принято (decision L0-xq4, 2026-09-26, вариант a), и
          код ему соответствует. Устарел текст KV.
          B — был баг: одноразовый поиск нельзя сжигать о временное условие
          (L0-wind-as08: на Peaceful шаг стражей откладывается).
          Причина надзирающего — гипотеза; проверена ниже.
```

## Investigation

```text
REPRO:  bash docs/feedback/diagnose-CNTR-WIND-CX01-AA.check.sh prefix — стабильно, 1 из 1.
        Фейковый мир узловых тестов + настоящий engineSpawnGuard(peaceful → true),
        placeAt без try/catch (как до 16251e6). Результат — запись прода дословно:
        {"status":"failed","searches":1,"reason":"error: strf place: minecraft:zombie_villager_v2
        for windmill:spawn#0 waits: the world is Peaceful"}; реестр: windmill:spawn looted,
        шаблон поставлен 1 раз, в очереди 0.
CAUSE:  До 16251e6 StrfRuntime.placeAt звал placer.run без try/catch. Бросок шага стражей
        (place.ts:247, текст появился в 0ca0652) уходил в SpawnSearch.place → run() catch
        (spawn-search.ts:274-278) → status "failed". Мельница при этом уже стояла:
        шаблон и сундуки поставлены, запись в реестре в состоянии looted.
        Сейчас бросок ловится: src/structures/runtime.ts:232-245.
PROOF:  red  /Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-WIND-CX01-AA/2.red.json (sha 54df1e2)
        green, тот же тест на HEAD, плюс живой BDS: .../CNTR-WIND-CX01-AA/2.json (см. GREEN/LIVE)
RULED OUT: «И в нынешнем коде одноразовый поиск сжигается о шаг стражей» (гипотеза надзирающего).
        Опровергнуто трижды:
        (1) check.sh head: запись done, stage 1, searches 1; стражи в очереди (queued 1).
        (2) живой Peaceful-BDS на текущей сборке (GREEN/LIVE ниже): search finished: done.
        (3) Текст причины на проде воспроизводит только сборка из окна
            0ca0652..16251e6^: в нём есть строка «waits: the world is Peaceful»
            (0ca0652, 2026-09-27 00:11 +0200) и ещё нет catch в placeAt
            (16251e6, 2026-09-27 01:23 +0200). Коммиты в этом окне:
            0ca0652 47fb74a b86da80 8baea41 a618a24 82896c8 613ff09 (00:11–01:30 +0200).
        Мир прода рождён 2026-09-26 18:09:19 +0200 (stat worlds/andrew). С b372e74
        (2026-09-26 22:19) bds:up мир не стирает, так что поиск прошёл при деплое
        из этого окна. Точное время деплоя не измерено: лог прежнего контейнера не сохранился.
```

## Fix design

```text
RADIUS: Новый код не пишется. Поведение, которое пришлось бы менять (catch в placeAt), уже в
        HEAD и в v1.2.0: git merge-base --is-ancestor 16251e6 af024e4 → да.
        Кто зовёт placeAt (grep "\.placeAt(" src): spawn-search.ts:561 (поиск у спавна и
        find оператора), commands.ts:192 (/andrew:structure place), плюс 13 вызовов в
        gametest/selftest.
        Лечить запись прода не нужно: такой мир один (прод), породили его 7 коммитов,
        которые больше не отгружаются. По L0-wind-e002 наличие Мельницы определяет реестр,
        а не эта запись. Правка только сменила бы ярлык — Мельница на проде уже стоит.
```

## Proof

```text
GREEN:  2.json — `check.sh head && live.sh`, sha 6d7ea74, exit 0, 2026-09-29T19:49:16Z.
        Юнит: RECORD {"status":"done","searches":1,"stage":1}; REGISTRY windmill:spawn
        looted; queued 1; summon-команд 0. Тест доходит до того же места: в runtime.ts
        2 из 2 мест «placement threw» (в prefix — 1, catch в placeAt снят), и шаблон
        поставлен 1 раз в обоих прогонах. Значит, отличаются только catch и итог.
LIVE:   Частный BDS 1.26.51.1 `andrew-bds-wcx1` (порты 19380–19389/7577; прод, QA и bds-ci
        не тронуты), свежий мир, Andrew BP 1.2.0 из текущего дерева. В логе:
          19:48:37 Difficulty: 0 PEACEFUL
          19:48:43 spawn windmill: search started around spawn 0,0 (radius 500)
          19:48:59 strf runtime: windmill:spawn placement threw Error: strf place:
                   minecraft:zombie_villager_v2 for windmill:spawn#0 waits: the world is Peaceful
                   ← catch в placeAt, изменённый путь пройден
          19:48:59 spawn windmill: search finished: done at 36,66,72 rot 0 stage 2; checked 2113
                   place(s) … rejected by reason: uneven=1388 liquid=724
          после docker restart:
          19:49:11 search already ran once in this world (status=done searches=1 origin=36,66,72)
        Тот же бросок, что сжёг поиск на проде, и на текущей сборке поиск кончается done.
        Контейнер и каталог docker/bds-wcx1 удалены.
```

## Числа утверждения — перепроверка

| Утверждение | Операция | Результат |
|---|---|---|
| радиус 500 | `grep -n "SEARCH_RADIUS = " src/structures/spawn-search.ts` | `:24 SEARCH_RADIUS = 500` ✓ |
| 5×5 чанков | `grep -n "STAGE1_CHUNKS = "` | `:26 STAGE1_CHUNKS = 2` → ±2 = 5×5 ✓ |
| «сухая» | `grep -n windmill src/structures/profiles.ts` | `:78 dryLand.maxLiquidShare 0.05` (≤ 5 %) ✓ |
| на подготовку идут только сухие места | `grep -n keepForced spawn-search.ts` | `:533`, `:551` — только отказ `uneven`; место с отказом `liquid` в список подготовки не попадает ✓ |
| 100 % | `sed -n 48,51p src/main.ts` | Поиск без броска шанса, но только после `/andrew:structure enable windmill` (по умолчанию всё выключено; живой лог: «not started: windmill is not enabled») |
| поведение «нет суши» | `sed -n 580,584p spawn-search.ts` | `status "failed", reason "no-dry-land"`, строка в логе ✓ (решение L0-xq4, вариант a) |
| тест «нет суши» | `node --test tests/windmill-spawn.test.mjs` | 25/25 pass, в т.ч. AC8 (`:341`) и повтор (`:382`) |
| имя ключа записи | `grep -n "SPAWN_KEY = "` | `:21 "andrew:st:spawn"` — в KV `andrew:st:spawnWindmill` ✗ |
| id в реестре | `grep -n "SPAWN_ID = "` | `:23 "windmill:spawn"` — в KV `windmill:S` ✗ |
| код причины | см. выше | `no-dry-land` — в KV `noDryLand` ✗ |
| прод: searches=1, failed | `docker logs andrew-bds` | строки 90 и 202 журнала ✓ |
| прод: Мельница стоит | `docker logs andrew-bds \| grep windmill:spawn` | `state looted`; 112 строк «placement threw» с 2026-09-28 06:27 по 13:42 UTC (замер 2026-09-29 21:48 +0200) |

## Резолюция для `refine resolve L0-wind-cx01`

> Закрыто решением L0-xq4 (2026-09-26, вариант a) и кодом. Нет сухого места в 500 блоках (SEARCH_RADIUS=500, spawn-search.ts:24; сухость — maxLiquidShare 0.05, profiles.ts:78) → запись `status "failed", reason "no-dry-land"`, Мельницы у спавна нет, лог перечисляет проверенные места по причинам (spawn-search.ts:580-584). На принудительную подготовку идут только сухие места (:533, :551). Тесты: tests/windmill-spawn.test.mjs:341, :382 (25/25 pass), gametest windmill-spawn.ts:405. Вариант (b) остаётся за оператором, как записано в L0-xq4. Сгоревший на проде поиск (failed, searches=1, «waits: the world is Peaceful») сделан сборкой из окна 0ca0652..613ff09 (2026-09-27 00:11–01:30 +0200): тогда placeAt не ловил бросок шага стражей. Исправлено в 16251e6 (2026-09-27 01:23), входит в v1.2.0. Красный: .ai/verify/CNTR-WIND-CX01-AA/2.red.json. Зелёный + живой Peaceful-BDS: 2.json.

## Дубликаты в KV — `файл:строка — что заменить на что`

Пути от `.ai/context/analysis/nodes/`.

1. `wind__concept-component.md:50` — «**No dry land within 500 blocks** is undefined in the spec (`L0-wind-cx01`).» → «No dry land within 500 blocks: no spawn Windmill, `status "failed", reason "no-dry-land"`, logged (decision `L0-xq4`).»
2. `wind-r007__concept-rule.md:28` — «7. No dry position at all → undefined by spec (`L0-wind-cx01`).» → «7. No dry position at all → `failed`/`no-dry-land`, no Windmill, reasons logged (`L0-xq4`).»
3. `adr-spwn__concept-architecture-decision.md:38` — «Interim default: option (a). Record `status:"failed", reason:"noDryLand"` … It is escalated as `L0-xq4`.» → «Option (a), decided by `L0-xq4` (2026-09-26): `status "failed", reason "no-dry-land"` …»
4. `adr-spwn__concept-architecture-decision.md:46` — «It gives `L0-wind-cx01` an interim answer.» → «`L0-wind-cx01` is closed by `L0-xq4`.»
5. `wind-e002__concept-entity.md:34` — `// for "failed": e.g. "noDryLand"` → `// "no-dry-land", "interrupted: …", "error: …", "placement …"`
6. `wind-e002__concept-entity.md:6`, `:16` — `andrew:st:spawnWindmill` → `andrew:st:spawn` (spawn-search.ts:21). Та же замена: `wind-r011__concept-rule.md:22`, `wind-p002__concept-process.md:22`, `wind-r013__concept-rule.md:22`, `wind__concept-component.md:30`, `wind__concept-component.md:35`, `strf__concept-component.md:41`, `adr-strs__concept-architecture-decision.md:27`, `adr-spwn__concept-architecture-decision.md:37`, `xasm5__concept-assumption.md:26` (`spawnWindmill` → `spawn`), `wind-ac01__concept-acceptance-criterion.md:21`.
7. `windmill:S` → `windmill:spawn` (spawn-search.ts:23): `wind-e002__concept-entity.md:41`, `wind-p002__concept-process.md:31`, `wind-p004__concept-process.md:33`, `wind-ac01__concept-acceptance-criterion.md:22`, `wind-ac02__concept-acceptance-criterion.md:22`, `wind__concept-component.md:39`, `wind-g002__concept-glossary-term.md:17`.
8. `wind-e002__concept-entity.md:25` — `status: "searching" | "preparing" | "placing" | "done" | "failed"` → `"searching" | "preparing" | "done" | "failed" | "skipped"` (spawn-search.ts:51). Та же лишняя `placing` — в `wind-p002__concept-process.md:22`.
9. `wind__concept-component.md:21` — «**Status:** analysis only. No structure code exists yet …» → «Implemented: `src/structures/spawn-search.ts`, `bodies/windmill.ts`; shipped in v1.2.0.»
10. `wind__concept-component.md:53` — «… guard behaviour under Peaceful are assumptions to confirm in the probe (`L0-wind-as06`…`as08`)» → «… on Peaceful the guard step throws and waits in the queue: the instance stays `looted`, the one spawn search is not spent (runtime.ts:232-245, measured live, CNTR-WIND-CX01-AA).»
11. `wind-p002__concept-process.md:30` — «No candidate at all → `L0-wind-cx01` fallback.» → «No candidate at all → `failed`/`no-dry-land`, no Windmill (`L0-xq4`).»
12. `xq4__concept-client-question.md:13` — тег `SHOULD_ASK` при решённом `L0-xq4`. Вопрос клиенту остаётся только про вариант (b), и только если оператор захочет держать обещание любой ценой. Тег снять или заменить на `answered:decision-l0-xq4`.

Сам `L0-wind-cx01` закрывается резолюцией выше. Узел закрывается целиком: обе части разобраны.

## Замечено попутно, не входит в утверждение

- **Состояние прода.** Мельница у спавна стоит: `windmill:spawn` в состоянии `looted`, шаблон и 25 сундуков. Стражей нет. Связанный Дирижабль не будет попробован, пока мир на Peaceful: шаг `finish` идёт после шага стражей (place.ts:206-211). Запись спавна навсегда останется `failed` — поиск одноразовый. Если переключить прод на Easy, при следующей прокачке очереди появятся стражи и будет попытка Дирижабля. Это решение оператора о проде, код тут ни при чём.
- **Шум в логе прода.** На Peaceful, пока рядом игрок, повтор шага стражей пишет «placement threw» раз в секунду: 112 строк за сессию игрока 2026-09-28. По устройству так и задумано (runtime.ts:175-183). Здесь не разбиралось.
- **Широкий catch в placeAt** (runtime.ts:232-245) ловит любой бросок placer.run, включая шаг place. Если бы сам шаблон бросил, поиск записал бы `done` при записи реестра в `planned`. Наблюдения такого нет — это свойство кода, не дефект. Не разбиралось.
