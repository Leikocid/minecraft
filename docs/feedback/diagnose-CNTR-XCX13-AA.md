ИСХОД: 4 — Подготовлено, ждёт решения

# Разбор xcx13: «ровно ванильная удочка» против кастомного предмета, который не рыбачит

Проверено на HEAD `32f4aca` (ветка `task/CNTR-XCX13-AA`), 2026-09-29 22:05.
- Типы — `@minecraft/server` 2.10.0 из `npm install` в этом worktree.
- Движок — бинарь и `definitions/` BDS 1.26.51.1 в контейнере `andrew-bds`. Только чтение, ничего не запускалось.
- Ванильные ассеты — Mojang/bedrock-samples (тег v1.26.50.4, коммит 46ba6ea), выборка через read-only подагента.

## Итог

- **Половина «Спека» верна дословно**: part-1:29/43 (вид), :33/47 (рыбалка), :35/49 (прочность), :37/51 (зачарование).
- **Вывод «нужен кастомный `andrew:orbital_cannon`» верен, но по другой причине, чем записано.**
  - Рыбалку скрипт отключить может: у `ItemUseBeforeEvent` есть `cancel` (index.d.ts:16073).
  - Прочность скрипт сбросить может: `ItemDurabilityComponent.damage` доступен на запись (index.d.ts:14810).
  - Отказ стола зачарований и наковальни в 2.10.0 недостижим. В `WorldBeforeEvents` 14 сигналов, среди них нет ни enchant, ни anvil. Ванильная удочка к тому же имеет слот `EnchantmentSlot.FishingRod` (index.d.ts:733).
  - §4 требует свою запись в Creative → Equipment, поиск и `/give`, то есть свой идентификатор.
  - Слово «hard-wired» к рыбалке неточно. Решает зачарование плюс идентичность.
- **Названное в утверждении расхождение в руке — не расхождение со спекой.**
  - У ванильной удочки нет модели в руке: среди 55 attachables BDS 1.26.51.1 удочки нет (bow, crossbow, trident, shield, elytra, броня). В клиентском RP bedrock-samples v1.26.50.4 тоже нет: `resource_pack/attachables/` — bow, crossbow, elytra, shield, trident, turtle и броня. Модели удочки в `resource_pack/models/` нет; есть только поплавок `models/entity/fishing_hook.geo.json`.
  - Два состояния — это два кадра одной записи атласа: `item_texture.json:322–327` — `"fishing_rod": {"textures": ["textures/items/fishing_rod_uncast", "textures/items/fishing_rod_cast"]}`.
  - Кадр «cast» и леска появляются только пока поплавок заброшен. §2 рыбалку запрещает, значит Пушка их показывать не должна.
  - «cast/reeled model states» в KV — терминология Java (две модели). В Bedrock это кадры текстуры.
- **Не наблюдалось никем — отсюда исход 4, узел НЕ закрывается.** Совпадает ли в руке поза и ориентация спрайта ванильной удочки с кастомным `hand_equipped`-предметом на iPad?
  - Клиент может держать удочку особо; в Java это модель `handheld_rod`, повёрнутая иначе, чем `handheld`. В Bedrock для этого был компонент `minecraft:mirrored_art`. Он удалён для format ≥ 1.20.20 (minecraft.wiki, «Bedrock Edition 1.20.30»); в схеме компонентов 1.26.30 его нет, как и deprecated `render_offsets`. В `player.entity.json:107` bedrock-samples объявлена анимация `"fishing_rod": "animation.humanoid.fishing_rod"`, которая не определена ни в одном из 143 файлов `animations/`, то есть движковая. Применяет ли её клиент к удочке в покое, неизвестно. PNG не зеркальный: та же диагональ, что у `stick.png`.
  - В бинаре BDS 1.26.51.1 совпадений `[Mm]irrored_?[Aa]rt` — 0, `minecraft:hand_equipped` — 1. Сервер ничего не рисует, так что прибор здесь немой по построению.
  - Хроника: 0 наблюдений (поиск «fishing rod icon vanilla atlas hand_equipped in-hand sprite»). Кода Пушки нет (`grep -rni orbital src packs tests scripts` → 0 файлов). Задачи на реализацию на доске нет: `task_list` по backlog (5), active (6), review (0), blocked (0), done — ни одной про orbc, только карточки CNTR-*.
  - Проверка уже записана как `L0-orbc-ac02` п.1–2 (manual, ipad). До появления предмета её не выполнить.
- **Решение за человеком одно, и спека уже задаёт ему умолчание.**
  - §16 (part-4:61/63): визуальная точность — ранг 4, корректная механика — ранг 2.
  - «Не рыбачит, не зачаровывается, бесконечная прочность» (ранг 2) побеждает «ровно ванильный вид» (ранг 4).
  - Принять компромисс можно заранее. Нужно только засвидетельствовать, какой он, на iPad.
- **Ссылка «C-3» в резолюции ошибочна.** C-3 — «на ошибке зависимости перечитать текст и перенацелить пакет» (constraints.md:19; в перечне v3 L0 стоит третьим: «retarget on error»). «Ближайшее стабильное соответствие» — это Orbital §12 (part-3:55), и там оно названо только для ввода ЛКМ/ПКМ и физики TNT. Общее основание — §15 (part-4:57) и §16.

## Перепроверка утверждения, по частям

| # | Часть утверждения | Как проверено | Результат |
|---|---|---|---|
| a | §2: вид ровно как ванильная удочка, без своей текстуры | `grep -n` по `orbitalcannonspecv1ruen-part-1.md` | верно: :29 (RU) / :43 (EN) |
| b | §2: рыбалка отключена, прочность бесконечна, зачаровать нельзя | то же | верно: :33/:47, :35/:49, :37/:51 |
| c | рыбалка, прочность, зачаровываемость зашиты в `minecraft:fishing_rod` → нужен кастомный предмет | index.d.ts 2.10.0: `ItemUseBeforeEvent.cancel` :16073; `ItemDurabilityComponent.damage` (запись) :14810; `awk` по `WorldBeforeEvents` → 14 сигналов, enchant/anvil среди них нет; `EnchantmentSlot.FishingRod` :733 | вывод верен, мотив неполон: рыбалку и прочность скрипт обойти может, отказ стола и наковальни — нет. Плюс §4 (part-1:77): своя запись в Creative и `/give` |
| d | кастомный предмет может взять запись атласа `fishing_rod` → иконка идентична | bedrock-samples v1.26.50.4 `resource_pack/textures/item_texture.json:322–327`; MS Learn `minecraft:icon`; схема `minecraft_icon v1.21.80.json` (server/item/1.26.30) | Ключ `fishing_rod` есть, кадры [uncast, cast]. `minecraft:icon` принимает ключ атласа, поля выбора кадра нет (`texture` deprecated). Что клиент рисует кадр [0] (uncast), — вывод, не наблюдение; проверяет AC-orbc-02 п.1. Своя текстура не нужна. |
| e | в руке кастомный предмет рисуется спрайтом иконки | `docker exec andrew-bds ls /data/definitions/attachables` → 55 файлов; `grep -l -iE "fishing\|carrot_on_a_stick\|warped_fungus"` → 0 | ванильная удочка в руке — тоже спрайт, а не attachable. Кастомный предмет может получить свой attachable с ванильной текстурой, так что «спрайт» — умолчание, а не предел движка (на iPad не проверялось) |
| f | «не показывает cast/reeled model states»; леска при забросе | `item_texture.json:322–327` (два кадра); дерево репо bedrock-samples, 22 865 путей, `truncated:false`: для удочки нет ни attachable, ни модели, кроме поплавка | состояния — кадры атласа, а не модели. Кадр cast и леска существуют только при заброшенном поплавке, а §2 заброс запрещает. Расхождения со спекой нет |
| g | насколько «rod-like» `hand_equipped` на iPad — судить только на канале ipad | бинарь BDS: `grep -a -o` по `minecraft:(hand_equipped\|icon\|render_offsets\|…)` → hand_equipped 1, icon 5, render_offsets 1; `[Mm]irrored_?[Aa]rt` → 0 | верно: сервер не рендерит; «mirrored art», если есть, — клиентский флаг, отсюда не наблюдаем. **Не проверено — нужен iPad** |
| h | резолюция: «C-3, C-15 rank 4» | `grep -rn 'C-3'` по `.ai/context` | C-3 = retarget on error (constraints.md:19). Для этой резолюции ссылка неверна; верны §12/§15/§16 и C-15, C-16 |
| i | (не в утверждении) код Пушки | `grep -rnic orbital src packs tests scripts` → 0 файлов; ни на одной локальной ветке нет файлов с orbital/cannon (`git ls-tree -r` по всем refs/heads) | кода нет, вред сейчас недостижим |
| j | (не в утверждении) где записана проверка вида | `doc_get orbc-ac02` | AC-orbc-02 п.1 «иконка неотличима рядом с ванильной», п.2 «в руке читается как удочка, скриншот в задачу» — manual/ipad |

## /diagnose

```text
OBSERVED: A KV claim (L0-xcx13, analysis v3, severity low) says Orbital §2 wants "exactly the vanilla
          Fishing Rod", while the engine forces a custom item that renders as the icon sprite in hand,
          without the vanilla rod's "cast/reeled model states". No run, screenshot or log of either
          item's in-hand look exists (chronicle 0; no Orbital code).
VERDICT: hypothesis on the engine half; the spec half is verified verbatim (a, b). The "deviation" it
         names is not a deviation: the cast frame and the line exist only while fishing, which §2
         forbids. A different, unnamed deviation (held pose / orientation) is possible and unobserved.

CHECKS: contradiction: none. Orbital §16 already ranks visual fidelity 4th (C-15) ·
        duplicate: the claim is restated in 7 KV files (list below); no board task ·
        criteria writable: yes, already written as L0-orbc-ac02 items 1–2 (manual, ipad)
UNFOLD: nothing. The check exists as AC-orbc-02. No new work until the orbc item exists.
HUMAN: decision: close xcx13 now and let AC-orbc-02 carry the look, or keep it open until the
       operator has looked at the item on the iPad

REPRO: Not reproducible here. There is no Orbital item, and nothing on the Mac renders Bedrock items.
       BDS is blind by construction: it has no renderer, and "mirrored art", if it exists, is a
       client flag (0 matches in the 1.26.51.1 server binary).
CAUSE: Design level only. The custom item is forced by §2's enchant refusal plus §4's own Creative
       entry. 2.10.0 WorldBeforeEvents has 14 signals and none of them is enchant or anvil.
       The vanilla rod has no attachable (0 of 55 in BDS definitions/attachables). Its in-hand
       "states" are the atlas frames [fishing_rod_uncast, fishing_rod_cast] (bedrock-samples item_texture.json:322–327).
PROOF: No executable check (needs the device and an item that does not exist yet). Measurements:
       rows c, e, f, g, i above.
RULED OUT: (1) "A vanilla fishing_rod neutralised by script would do": itemUse.cancel and a writable
       durability exist, but no stable hook refuses the table or anvil, and a vanilla rod cannot
       have its own Creative entry or /give id (§4). (2) "The vanilla rod has a 3D in-hand model the
       custom item lacks": no fishing_rod attachable in BDS 1.26.51.1 nor in bedrock-samples v1.26.50.4 resource_pack/attachables.
       NOT separated: "same pose as vanilla" vs "the client flips or rotates the vanilla rod".
       Only the iPad separates them.

RADIUS: KV: kv_get_subtree L0-xcx13; kv_search on the item JSON, icon and hand_equipped; then
        grep -n for the phrases (cast/reeled, icon sprite, hard-wired, rod-like, xcx13) for line
        numbers. Dependants: orbc-ent1 (item JSON), orbc-r001 (rule), orbc-r013 (input), orbc-ac02
        (iPad AC), orbc component and decomposition plan. Code: none (row i).
GREEN: n/a. No fix is written.
LIVE: No live run possible: the item does not exist, and only the iPad renders it.
```

## Резолюция для `refine resolve` (готовый текст)

> CX-L0-13 — не противоречие спеки и движка; остаток — одна проверка глазами, уже записанная как
> AC-orbc-02 п.1–2.
> 1. §2 (part-1:29/43) и §16 (part-4:61/63) вместе: механика (ранг 2) — не рыбачит, не
>    зачаровывается, бесконечная прочность — выше визуальной точности (ранг 4). Поэтому Пушка —
>    кастомный `andrew:orbital_cannon`. Вынуждает это не рыбалка (её отменяет
>    `beforeEvents.itemUse.cancel`), а зачарование: в 2.10.0 нет before-события стола или наковальни
>    (14 сигналов `WorldBeforeEvents`, проверено по index.d.ts). Плюс §4: своя запись в Creative
>    и `/give`.
> 2. Иконка: `minecraft:icon: "fishing_rod"` — ванильная запись атласа (bedrock-samples v1.26.50.4 `item_texture.json:322–327`, кадры uncast, cast; поля выбора кадра у `minecraft:icon` нет). Своей
>    текстуры нет.
> 3. В руке: у ванильной удочки нет attachable (0 из 55 в `definitions/attachables` BDS 1.26.51.1).
>    Её «состояния» — кадры атласа. Кадр cast и леска бывают только при заброшенном поплавке,
>    который §2 запрещает, так что Пушка их не показывает по спеке, а не по компромиссу.
> 4. Не наблюдалось: особая поза или ориентация ванильной удочки в руке на клиенте. Проверка —
>    AC-orbc-02 п.2 на iPad после реализации orbc. Если поза отличается, это ранг 4 по §16:
>    принять и задокументировать рядом с кодом (C-16). Либо, если оператор хочет точнее, дать
>    предмету attachable с ванильной текстурой `textures/items/fishing_rod_uncast` без своей текстуры. Attachable — файл ресурс-пака, не эксперимент; на iPad этот путь не проверялся.
> 5. Ссылка «C-3» в прежней резолюции неверна (C-3 — retarget on error); основание — §12, §15, §16,
>    C-15, C-16.

## Дубликаты — «файл:строка — что заменить на что» (не правил)

Пути — от `.ai/context/`.

**Мотив кастомного предмета** — «hard-wired … so the Cannon must be a custom» / «because fishing is hard-wired»
→ «a vanilla `fishing_rod` cannot be refused by the enchanting table or anvil (no stable before-event in 2.10.0) and has no Creative entry or `/give` id of its own (§4); fishing alone could be cancelled via `beforeEvents.itemUse`»:
- `analysis/nodes/xcx13__concept-contradiction.md:24`
- `analysis/contradictions.md:381`
- `analysis/risks.md:394`
- `analysis/nodes/orbc-ent1__concept-entity.md:23`
- `analysis/project-knowledge/domain-model.md:171`

**«Модели» cast/reeled** — «It does not show the vanilla rod's cast/reeled model states» → «The vanilla rod has no in-hand model (no attachable); its cast texture frame and line appear only while a bobber is out, which §2 forbids — so the Cannon must not show them»:
- `analysis/nodes/xcx13__concept-contradiction.md:26`
- `analysis/contradictions.md:383`
- `analysis/risks.md:396`

**Отклонение в правиле** — «Deviation: the in-hand model is the icon sprite, not the vanilla cast/reeled model (`xcx13`, C-16)» → «Possible deviation, unobserved: the vanilla rod's in-hand pose; checked by `orbc-ac02` item 2 (`xcx13`, C-15 rank 4, C-16)»:
- `analysis/nodes/orbc-r001__concept-rule.md:31`
- `analysis/project-knowledge/business-rules.md:412`

**Ссылка на C-3** — «(C-3, C-15 rank 4)» → «(Orbital §12, §15, §16; C-15 rank 2 over rank 4)»:
- `analysis/nodes/xcx13__concept-contradiction.md:29`
- `analysis/contradictions.md:386`
- `analysis/risks.md:399`

**Без правок** — верны после разбора:
- `analysis/nodes/orbc-ent1__concept-entity.md:28` и `analysis/project-knowledge/domain-model.md:176` («Held rod-like (`xcx13`, iPad check)»);
- `analysis/nodes/orbc-ac02__concept-acceptance-criterion.md:22`, `analysis/scope.md:496`, `analysis/project-knowledge/glossary.md:671`;
- `analysis/nodes/orbc-r013__concept-rule.md:21`, `analysis/project-knowledge/business-rules.md:676`.

## Попутно (вне этого узла, словами оператору)

1. **Генератор роллапов режет заголовки на экранированной кавычке.** 8 заголовков вида `### CX-L0-13 · \ (L0-xcx13)`:
   - `analysis/risks.md:316`, `:385`;
   - `analysis/contradictions.md:306`, `:372`;
   - `analysis/assumptions.md:270`, `:793`, `:814`, `:856`.

   `kv_get_subtree L0-xcx13` тоже отдаёт title `CX-L0-13 · \\`, хотя во frontmatter узла он целый (`xcx13__concept-contradiction.md:6`). Это дефект ai-kit, не проекта. Здесь не чинится: вне репозитория, и правка KV запрещена.
2. **C-3 цитируется ещё в двух местах в чужом смысле.** «deviations required by … C-3»:
   - `analysis/nodes/strf-r012__concept-rule.md:21`;
   - `analysis/nodes/strf-g006__concept-glossary-term.md:17`.

   C-3 там не подходит: это retarget on error. Основание — сама спека структур (преамбула, §7, §11 DoD); C-16 тоже не подходит, он из спеки Пушки и про оружие.

## Что остаётся человеку

Одно решение. Всё проверяемое отсюда сделано.
- (a) **Рекомендую:** закрыть xcx13 резолюцией выше сейчас. Проверка вида живёт в AC-orbc-02 п.1–2 и не теряется. Компромисс заранее принят по §16.
- (b) Держать xcx13 открытым, пока оператор не посмотрит на реализованный предмет на iPad.

Допустимые ответы, если на iPad поза отличается:
- принять и задокументировать (C-16);
- attachable с ванильной текстурой без своей текстуры.

Третьего пути среди компонентов предмета нет: `render_offsets` в бинаре есть, но он deprecated и отсутствует в схеме компонентов 1.26.30, а `minecraft:mirrored_art` удалён для format ≥ 1.20.20 (наш `format_version` 1.21.0).
