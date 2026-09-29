ИСХОД: 3 — Подчистка знания

# CNTR-XCX7-AA · CX-L0-07: каналы у критериев структур 14–59

Узел `L0-xcx7` закрывается по исходу 3.

- Числа узла верны.
- Названный в узле механизм вреда опровергнут измерением. Узел утверждает: «без канала оркестратор закроет визуальный критерий по зелёному счёту `bds`». На деле:
  - тег канала в KV не читает ничто;
  - каждый визуальный критерий структур на доске уже имеет `type:manual`;
  - ни один manual-критерий на доске не закрыт артефактом.
- Вред, приведённый в примечании надзирающего, настоящий, но идёт другим путём. Канал в карточке был, а критерий закрыло булево `true`, которое передал исполнитель. Чинить это нужно в ai-kit, не в этом репозитории и не в KV (пункт **П-1** ниже).
- Закрытие узла этот риск **не** закрывает. П-1 не должен потеряться вместе с узлом.

**Артефакт:** `.ai/verify/CNTR-XCX7-AA/2.json`. Это `bash docs/feedback/diagnose-CNTR-XCX7-AA.sh`, замеры M1–M8, каждый — утверждение: скрипт падает на первом расхождении. KV, доска и логи читались из корня проекта, только на чтение. Копия KV в worktree устаревшая.

Пути ниже даны от корня проекта. `nodes/` — это `.ai/context/analysis/nodes/`.

## OBSERVED / VERDICT

- **OBSERVED (KV):**
  - `wind-ac*` — 17 узлов: 14 тегов `verify:bds` и 4 тега `verify:ipad` (ac03, ac09, ac10, ac14);
  - `airs-ac*` — 8 узлов, `wrdn-ac*` — 10, `bast-ac*` — 9: ни одного тега `verify:`/`channel:` и ни одного слова bds/ipad в теле.
- **OBSERVED (доска, по примечанию надзирающего).** Три render-критерия `type:manual` стоят `vstatus:verified`, хотя проверки глазами, которую можно подтвердить, нет. Это `.ai/tasks/WRDN-BIG-01-AA.md:133`, `AIRS-SHAPE-01-AA.md:175` и `AIRS-SCALE-01-AA.md:86`.
- **VERDICT:** жалоба составная, части разобраны по отдельности.
  - (а) Числа верны.
  - (б) Примеры узла частично ложны.
  - (в) Механизм риска — гипотеза, опровергнута.
  - (г) Сам вред — баг ai-kit, при канале, который был на месте (П-1).

## Перепроверка чисел утверждения

| Утверждение узла | Чем проверено | Измерено |
|---|---|---|
| `wind-ac*`: 14 bds + 4 ipad | M1: теги в frontmatter 17 узлов | 14 `verify:bds`, 4 `verify:ipad` ✓ |
| `airs` 8, `wrdn` 10, `bast` 9 AC без канала | M2: число файлов, теги `(verify\|channel):*`, слова bds/ipad | 8 / 10 / 9 файлов; тегов 0, слов 0 ✓ |
| «reads as Ancient City / Bastion» — критерии | M3: `grep` по `wrdn-ac*`, `bast-ac*` | **ложно.** Таких AC нет (0). «reads as» есть только у `wrdn-ac09` («almost entirely dark»). Облик Города и Бастиона записан правилами: `nodes/wrdn-rul2__concept-rule.md:19`, `nodes/bast-r002__concept-rule.md:15`, `nodes/wrdn__concept-component.md:20` |
| `airs-ac01` — «modern look», iPad | чтение узла, `:16`, `:20-25` | **Смешанный.** THEN перечисляет счётное: палитру, целые стёкла, отсутствие ветхости, баллон без сундуков, габарит, повороты. «modern» есть только в заголовке. На доске счётное закрыто unit-тестом `AIRS-TMPL-01-AA` AC#3, а облик — iPad-критерием `DEMO-S4-01-AA` AC#7 (`accepted`) |
| `infr-p006` задаёт bds-дорожки; ни один узел `infr` не раскладывает тесты 24–59 | M4; `nodes/infr-p006__concept-process.md:20-32` | ✓ пораздельной раскладки нет (0 узлов). Правило класса есть: `nodes/infr__concept-component.md:47` («a green `bds` structural-count proof never closes an `ipad` criterion») и `nodes/infr-d005__concept-architecture-decision.md:28` |
| «C-6/C-9 это запрещают» | `nodes/concept-constraint.md:20`; `.ai/context/analysis/constraints.md:38-39` | Смешаны две нумерации. В нумерации L0: C-9 — разделение bds/ipad, C-6 — долговечное ограниченное состояние. В нумерации этапа 0: C-6 — «рисовка только на iPad», C-9 — Survival |
| Риск: «без канала — авто-закрытие по зелёному счёту bds» | M5, M6, M7, M8 | **не подтверждён**. Разбор ниже |

## REPRO / CAUSE / PROOF / RULED OUT

- **REPRO:** `bash docs/feedback/diagnose-CNTR-XCX7-AA.sh`. Результат детерминирован: 29 замеров, все PASS.
- **CAUSE** (вред из примечания). В ai-kit 3.7.5 три пути, по которым manual-критерий закрывается без доказательства:
  - `dist/tasks/board.js:960`: для manual/static любое не-null значение даёт `verification_status: "verified"`;
  - `dist/tasks/board.js:958`: любая строка-артефакт закрывает manual-критерий без проверки файла;
  - `dist/orchestrator/autopilot-verify.js`, `buildAutopilotSubmitResults`: для не-exec критериев после мержа передаётся булево LLM-инспектора.

  Ни один из трёх путей не смотрит ни на тег KV, ни на канал карточки.
- **PROOF.** M7: на позиции render-критерия исполнитель сам передал `true`.
  - `WRDN-BIG-01-AA` — оба сабмита. Первый — `2026-09-27T14:09:49Z`, строка 810 лога. В `.ai/verify/WRDN-BIG-01-AA/` тогда лежали только json: каталог `renders/` создан в 17:06:11Z, на проходе доработки.
  - `AIRS-SHAPE-01-AA` и `AIRS-SCALE-01-AA` — позиция 9.
  - Булево `true` принимается только для не-exec типа (`board.js:937` бросает ошибку на exec). Значит, в момент закрытия эти критерии уже были `manual`: канал стоял.
  - M8: обе строки ai-kit на месте.
- **RULED OUT** — «причина в том, что у AC в KV нет канала». Каждый довод — измерение:
  1. M5: в пакете ai-kit 3.7.5 (без `node_modules`) нет ни одного файла, который читает `verify:`/`channel:`-теги. Тип критерию ставит `/plan` в карточке.
  2. M6: 14 задач структур несут 122 критерия, и у каждого есть `type`. 16 из них `type:manual`: 11 `accepted` оператором и 5 `verified`. Все 5 закрыты при `type:manual`.
  3. M6: на **всей** доске 0 manual-критериев несут `[artifact:]`. «По зелёному счёту bds» не закрыт ни один.
  4. Решение `decision-l0-xcx7-…` ссылается на DEMO-S2-AA и DEMO-S3-AA. У каждой из них по 4 критерия `type:manual`, то есть канал был и там.

## Разбор примечания надзирающего (`.ai/tasks/CNTR-XCX7-AA.md:35`)

- **«DEMO-S4-01-AA, картинки от отвергнутого захода, 14:41 → 15:13».** На самом деле это `AIRS-SHAPE-01-AA.md:175`: `finished_at` 13:12:28Z = 15:12 по +02:00. В заметке `[accepted:]` у самого критерия надзирающий пишет, что перерисовал в 15:15: 8 PNG от 15:15:17. У `DEMO-S4-01-AA` render-критерия нет. Его 7 iPad-критериев (`:81-87`) стоят `vstatus:accepted`, и исполнитель передал на них `null`.
- **«WRDN-BIG-01-AA — при полном отсутствии картинок».** Для `.ai/verify` это верно. Но исполнитель рисовал: до первого сабмита в его логе 6 вызовов `render-structure` и 20 обращений к PNG в `dist/renders` своего worktree (например, `warden-city-cut15-16px-0.png`). Он смотрел и не увидел пустой верхний зал, а картинок в доказательствах не оставил.
- **Третий случай, в примечании не названный: `AIRS-SCALE-01-AA.md:86`.** Исполнитель передал `true`. 16 PNG созданы в 16:58:58Z, за 12 с до `finished_at`. Слов человека на критерии нет.

## RADIUS

- Код этого репозитория не меняется.
- Правки касаются только KV (список ниже). Их читают `kv_search` и `/plan`.
- Как искал: `grep` по `.ai/context` на `xcx7`, `14-59`, «14 bds», `(8)…(10)…(9)`, «канал не указан», «зелёного счётчика»; потребителей тегов — M5.
- Ничего работающего правки не отнимают.
- Тег канала в 27 AC — не защита, а документация для delta pass. CASES = 0: тег не читает ничто, и все 5 закрытий без проверяемых глаз прошли при канале.

## GREEN / LIVE

- **GREEN:** `.ai/verify/CNTR-XCX7-AA/2.json`, exit 0, 29 PASS (в артефакте хранится хвост вывода, `stdout_tail`). Каждый регэксп сначала проверен на заведомом совпадении, так что зелёный не от слепого прибора:
  - M3 ловит `wrdn__concept-component.md:20`;
  - M4 ловит `airs__concept-component.md:20`;
  - M5 на `nodes/` находит 108 файлов.
- **LIVE:** исправления нет. Живая система осмотрена как есть: доска (122 критерия), логи агентов, установленный ai-kit 3.7.5.

## Резолюция для refine resolve

> L0-xcx7 закрыт (исход 3, подчистка знания). Перемерено 2026-09-29 скриптом `docs/feedback/diagnose-CNTR-XCX7-AA.sh` (артефакт `.ai/verify/CNTR-XCX7-AA/2.json`, 29 PASS).
> - KV: `wind-ac` 17 узлов — 14 `verify:bds`, 4 `verify:ipad`. `airs-ac` 8, `wrdn-ac` 10, `bast-ac` 9 — 0 тегов канала.
> - Инвариант выполнен в карточках, как велит `decision-l0-xcx7-kanal-dokazatelstva-u-kazhdogo-kriteriya` (2026-09-26). 14 задач структур — 122 критерия, тип есть у всех. Все 16 визуальных — `type:manual`, 11 из них приняты оператором (`accepted`).
> - Тег канала в KV не читает ни ai-kit 3.7.5 (0 файлов), ни `/plan`.
> - Механизм «без канала — авто-закрытие по зелёному bds» не подтверждён. На доске 0 manual-критериев с артефактом. Три render-критерия, закрытые без проверяемых глаз (WRDN-BIG-01-AA:133, AIRS-SHAPE-01-AA:175, AIRS-SCALE-01-AA:86), имели `type:manual` и закрыты булевым `true` исполнителя через ai-kit `board.js:960`. Это дефект ai-kit вне узла (доклад CNTR-XCX7-AA, П-1).
> - Критериев «reads as Ancient City / Bastion» среди AC нет: облик записан в `wrdn-rul2` и `bast-r002`. iPad-часть есть только у `airs-ac01` и `wrdn-ac09`.

## Копии для подчистки (файл:строка — что заменить на что)

Пути от `.ai/context/analysis/`.

1. `nodes/xcx7__concept-contradiction.md:25`: «the Warden City and Bastion "reads as Ancient City / Bastion" criteria, and "almost entirely dark"» → «`wrdn-ac09` ("almost entirely dark") and the look half of `airs-ac01`; the Ancient City / Bastion look is rule text (`wrdn-rul2`, `bast-r002`), not an AC».
2. `nodes/xcx7__concept-contradiction.md:26`: дописать «the class rule exists: `infr:47`, `infr-d005:28`; only the per-test mapping is missing».
3. `nodes/xcx7__concept-contradiction.md:28`. Было: «Without a channel, the orchestrator can auto-verify a visual criterion from a green `bds` count». Стало: «A KV channel tag is read by nothing. Board criteria carry their own `type`, and every visual structure criterion is `type:manual`. The three render criteria closed without auditable eyes were `type:manual`; the executor's `true` closed them (ai-kit `board.js:960`)».
4. `nodes/xcx7__concept-contradiction.md:20` и `:28`: «C-9», «C-6/C-9» → «C-9 (L0 numbering, `concept-constraint.md:20`)». C-6 в нумерации L0 — это долговечное состояние, а не каналы.
5. `decisions/decision-l0-xcx7-kanal-dokazatelstva-u-kazhdogo-kriteriya.md:12` и `:24`: «часть из них заведомо только для глаз: «выглядит современно», «читается как Древний город», «читается как Бастион», «почти полностью темно»» → «iPad-часть есть у airs-ac01 (облик) и wrdn-ac09 (темнота); узнаваемость Города и Бастиона записана правилами wrdn-rul2 и bast-r002, а на доске проверяется критериями DEMO-S4-01-AA AC#8 и AC#9».
6. Тот же файл, `:16` и `:28`. Было: «без канала оркестратор при мерже эпика помечает проверенным визуальный критерий на основании зелёного счётчика блоков … DEMO-S2-AA и DEMO-S3-AA». Стало: «критерии DEMO-S2-AA и DEMO-S3-AA были type:manual — канал стоял; ai-kit закрывает manual-критерий любым не-null значением исполнителя или инспектора, и канал это не предотвращает (CNTR-XCX7-AA, П-1)». Правило самого решения остаётся в силе.
7. `decisions.md:630` и `:632`: генерируется из п. 5–6, руками не править.
8. Доска, не KV: `.ai/tasks/CNTR-XCX7-AA.md:35`.
   - «В DEMO-S4-01-AA критерий «отрисовка просмотрена глазами»…» → «В AIRS-SHAPE-01-AA (критерий :175)…».
   - «при полном отсутствии картинок» → «без картинок в `.ai/verify`; в worktree исполнитель рисовал и смотрел, пустой зал не заметил».

### Каналы 27 AC по промежуточному правилу (для delta pass)

Теги в строке `tags:`: у `airs-ac*` — `:13`, у `wrdn-ac*` и `bast-ac*` — `:12`. Добавлять `verify:*`, как у `wind-ac`. В KV сейчас две записи: у Мельницы `verify:*`, у Орбитальной пушки `channel:*`.

- **С iPad-частью — 2 из 27:**
  - `airs-ac01`: `verify:unit`, `verify:bds`, `verify:ipad`. iPad — только облик «современный, целый»;
  - `wrdn-ac09`: `verify:unit`, `verify:ipad`. Число светильников — unit, «почти полностью тёмен» — iPad.
- **`verify:unit` + `verify:bds` — 13:** `airs-ac02, -03, -04, -07`; `wrdn-ac01, -03, -05, -06, -07`; `bast-ac01, -03, -05, -06`.
- **`verify:bds` — 12:** `airs-ac05, -06, -08`; `wrdn-ac02, -04, -08, -10`; `bast-ac02, -04, -07, -08, -09`.

## П-1. Отдельно, вне узла и вне репозитория: ai-kit закрывает manual-критерий без доказательства

Карточку на этой доске не завожу: код в пакете `@instinctools/ai-kit`, не здесь. Решение — за оператором. Ниже постановка, по которой можно начать работу.

- **Наблюдение.** Из 16 manual-критериев структур 5 стоят `verified` без `task_accept`:
  - `WRDN-BIG-01-AA:127` и `DEMO-S4-01-AA:79` — со словами человека в тексте критерия;
  - `WRDN-BIG-01-AA:133`, `AIRS-SHAPE-01-AA:175`, `AIRS-SCALE-01-AA:86` — только `true` исполнителя.

  В WRDN-BIG render-критерий закрыт, когда картинок в доказательствах не было, и пустой верхний зал ушёл в `done`. Задачу вернули на доработку (раздел «Возвращено 2026-09-27» в карточке).
- **Записанное ожидание.** Решение `merge_policy = autopilot`: «iPad-критерии остаются открытыми до подтверждения оператором (task_accept)».
- **Механизм:** `board.js:958`, `board.js:960` и `autopilot-verify.js` `buildAutopilotSubmitResults` — см. CAUSE выше.
- **Доказательство достижимости:** M7 и M8 в `2.json`.
- **Критерии приёмки:**
  1. [unit] `submitTask` с булевым `true` на `type:manual` не ставит `vstatus:verified`. Критерий остаётся открытым, пока нет `task_accept` или ссылки на файл-доказательство в `.ai/verify/<task>/`.
  2. [unit] Строка-артефакт на manual-критерии проверяется: файл существует, лежит в `.ai/verify/<task>/` и создан после старта задачи. Иначе ошибка, как для exec.
  3. [unit] `buildAutopilotSubmitResults` отдаёт `null` на manual-критерии задачи с `demo_channel: ipad`: инспектор их не закрывает.
  4. [e2e] На отдельной доске задача с одним manual-критерием и `true` от исполнителя после волны остаётся в `review`, а не `done`.
