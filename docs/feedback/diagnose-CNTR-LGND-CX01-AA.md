# Diagnose CNTR-LGND-CX01-AA — CX-lgnd-01 «Ready» на Action Bar

ИСХОД: 3 — Подчистка знания

Расхождение снято решением `decision-legendary-ready-hud` (2026-09-24) и в тот же день реализовано в `392253d`: «Готово» показывается непрерывно для любого легендарного предмета в любой руке. Узел `L0-lgnd-cx01` уже закрыт (`closed_reason: resolved_by_decision`, `closed_by_ref: decision-resolve-l0-lgnd-cx01`). Но четыре узла KV всё ещё описывают промежуточный вариант `readyMode` / «один раз» (список в §5).

## 1. Intake

```text
OBSERVED: утверждение KV L0-lgnd-cx01: shipped src/websword/cooldown.ts renderFor пишет
          andrew.web_sword.ready один раз, а Scythe §6 требует Ready постоянно, пока предмет в руке.
          Промежуточный вариант: per-weapon readyMode (once / while-held).
VERDICT:  расхождение было реальным (0.3.0) и снято записанным решением. Сейчас код и решение
          совпадают. Со своим кодом и решением расходятся только описания в KV → подчистка знания.
```

## 2. Investigation: каждое число проверено

| Утверждение | Операция | Измерение |
|---|---|---|
| `src/websword/cooldown.ts` существует, `renderFor` пишет Ready | `test -e`, `git log -1 -- src/websword/cooldown.ts` | файла **нет**; удалён в `392253d` 2026-09-24 (−158 строк) |
| в 0.3.0 Ready показывался один раз | `git show 37a0403:src/websword/cooldown.ts` (0.3.0, 2026-09-22) | верно для 0.3.0–0.3.2: `:155` `now - until < HUD_INTERVAL_TICKS * MS_PER_TICK`, `:156` `andrew.web_sword.ready` |
| окно «первого прохода» — 500 ms (`L0-lgnd-p005`) | `git show 392253d^:…` `:42`, `:97` | `MS_PER_TICK = 1000/20 = 50`, `HUD_INTERVAL_TICKS = 10` → 500 ms: верно для 0.3.x |
| HUD — один `runInterval` на 10 тиков | `grep -n` в `src/legendary/hud.ts` | `:9` `HUD_INTERVAL_TICKS = 10`: верно |
| сейчас в коде есть `readyMode` | `grep -rl readyMode src` | **0** файлов |
| сейчас в коде пишется `andrew.web_sword.ready` | `grep -rl andrew.web_sword.ready src` | **0** файлов |
| что HUD делает сейчас | чтение `src/legendary/hud.ts:33-57` | `remaining > 0` → `andrew.legendary.cooldown`, иначе всегда `andrew.legendary.ready` (имя оружия через `%s`); main+off, дедупликация по `abilityKey`; без легендарного предмета бар не трогается |
| Web Sword §8 требует только оставшееся время | `webswordspecv1ruen-part-1.md:101-107` | верно. Про Ready §8 **ничего не говорит**: ни «один раз», ни «не показывать» |
| цитата Scythe §6 | `scytheofcalamityspecv1ruen-part-1.md:93-99` | по сути верно. Дословно: «Когда готова: локализованное состояние Ready / «Готово»» (в утверждении — пересказ) |
| третий источник | `orbitalcannonspecv1ruen-part-2.md:35` | «Орбитальная пушка — Готово»: поддерживает непрерывный показ |

Отсюда: источники A и B друг другу не противоречили. §8 молчит про Ready. «Один раз» было решением реализации 0.3.x, а не требованием спеки. Настоящим расхождением было «Scythe §6 против shipped-кода Web Sword», и его закрыло решение.

```text
REPRO:     git show 37a0403:src/websword/cooldown.ts | sed -n 151,158p → одноразовый Ready (0.3.0).
           На HEAD 32f4aca того же пути нет; src/legendary/hud.ts:53 пишет andrew.legendary.ready на каждом проходе.
CAUSE:     одноразовый показ жил в src/websword/cooldown.ts:155-156 (0.3.0–0.3.2). Решение
           decision-legendary-ready-hud (вариант (a) из L0-xq1) его отменило; 392253d (LG-CORE-01-AA)
           заменил модуль на src/legendary/hud.ts. Тест сменил ожидание с «shown once»
           (392253d^:tests/web-sword-cooldown.test.mjs:202) на «keeps showing long after expiry».
PROOF:     run-check .ai/verify/CNTR-LGND-CX01-AA/2.json (sha 32f4aca, exit 0): cooldown.ts отсутствует;
           0 файлов src с andrew.web_sword.ready и с readyMode; hud.ts:53 — andrew.legendary.ready;
           node --test tests/web-sword-cooldown.test.mjs → pass 17 / fail 0, в том числе
           «"ready" keeps showing long after expiry», «the off hand counts as holding»,
           «a player without a legendary in either hand gets no message».
RULED OUT: «вопрос всё ещё открыт у клиента (L0-xq1), в коде временный вариант (b)».
           Опровергнуто: decision-legendary-ready-hud-gotovo-pokazyvaetsya-postoya (2026-09-24) — вариант (a);
           decision-resolve-l0-lgnd-cx01 и decision-resolve-l0-xcx3 (outcome: changed); readyMode в src = 0;
           развёрнутый release-пакет на BDS 19132 содержит andrew.legendary.ready и не содержит
           andrew.web_sword.ready (см. LIVE).
```

## 3. Fix design

```text
RADIUS: правка кода не нужна: код совпадает с решением. Правится только текст KV (§5).
        Как искал: grep по живому KV (.ai/context/analysis, без decisions/) — readyMode,
        «websword/cooldown.ts` `renderFor», «registerCooldownHud` in», «shows «Готово» once», «current default»,
        «byte-identical to 0.3.0», «now - until», «hudKeys.active», «text: "  "»; kv_search по
        «readyMode once while-held»; doc_get lgnd-p005, lgnd-ent1, lgnd-r007, lgnd-ad07, xq1, xcx3.
        Уже согласованы с решением (не трогать): L0-lgnd-ent1:23, domain-model.md:28, L0-lgnd-ad07 §6,
        L0-lgnd-r007, AC-lgnd-06 (прямо пишет, что пункт «rawtext 0.3.0» отменён).
```

## 4. Proof

```text
GREEN: тот же run-check 2.json. Он касается нужного предмета: тест импортирует именно
       src/legendary/hud.ts (tests/web-sword-cooldown.test.mjs:51) и проверяет Ready через 100 тиков
       после истечения (atTick(700)) — именно здесь одноразовая версия молчала.
LIVE:  прод-BDS andrew-bds (1.26.51.1, :19132), лог 2026-09-27 17:53:08 — «[andrew] legendary hud armed»,
       «hud failed» = 0; /data/behavior_packs/andrew_bp/scripts/main.js: andrew.legendary.ready = 1,
       andrew.web_sword.ready = 0. Сам текст Action Bar сервер не видит: это канал ipad, здесь не проверялось.
       Непрерывный Ready есть в релизах 0.4.0 (dcb0bb4) и 1.2.0 (af024e4): 392253d — их предок.
```

## 5. Копии, разошедшиеся с кодом (файл:строка — что заменить на что)

Пути — от `.ai/context/analysis/`, строки — по живому KV на 2026-09-29.

1. `nodes/lgnd-p005__concept-process.md:23` — «Generalised from `registerCooldownHud` in `src/websword/cooldown.ts`» → «Implemented as `registerLegendaryHud` / `hudMessage` in `src/legendary/hud.ts`».
2. `nodes/lgnd-p005__concept-process.md:29` — «`busy` → `hudKeys.active` (Scythe only, ASM-017)» → «no busy segment: during a volley the bar shows Ready (`L0-lgnd-ad07` §6)».
3. `nodes/lgnd-p005__concept-process.md:30-33` — `hudKeys.cooldown` / «ready → depends on `readyMode`: "once" … "while-held" …» → «`remaining > 0` → `andrew.legendary.cooldown` (name, `ceil(remaining/1000)`); otherwise → `andrew.legendary.ready` (name), on every pass while held (decision-legendary-ready-hud)».
4. `nodes/lgnd-p005__concept-process.md:34` — «One segment → `setActionBar(segment)`, which is exactly the shipped rawtext for a Web Sword-only holder. Two segments → `{text: "  "}`» → «always `{ rawtext: [...] }`; segments separated by `{ text: "   " }` (three spaces, `hud.ts:45`)».
5. `nodes/lgnd-p005__concept-process.md:36` — «`readyMode` keeps Web Sword output byte-identical to 0.3.0…» → удалить (пункт отменён решением, см. AC-lgnd-06).
6. `nodes/xq1__concept-client-question.md:23` — «Right now … the bar shows «Готово» once and then goes quiet» → «Answered 2026-09-24: option (a), decision-legendary-ready-hud».
7. `nodes/xq1__concept-client-question.md:27` — «(b) … *This is the current default.*» → пометку «current default» перенести на (a) как «accepted».
8. `nodes/xq1__concept-client-question.md:30` — «Autopilot runs on (b) through a per-weapon `readyMode`…» → «Implemented as (a) in `src/legendary/hud.ts`; there is no `readyMode`».
9. `nodes/lgnd-cx01__concept-contradiction.md:27` — «Shipped `src/websword/cooldown.ts` `renderFor` (verified) writes … once» → «0.3.x (`37a0403:src/websword/cooldown.ts:155-156`) wrote it once; since `392253d` `src/legendary/hud.ts` shows it continuously».
10. `nodes/lgnd-cx01__concept-contradiction.md:31,33` — «the framework needs a per-weapon `readyMode` (the current interim design…)» / «Resolution needed … Interim: per-weapon `readyMode`» → «Resolved by decision-resolve-l0-lgnd-cx01: continuous for both; `readyMode` not built».
11. `nodes/xcx3__concept-contradiction.md:36,39` — «needs a per-weapon `readyMode`…» / «Interim … `readyMode = "once"` … byte-identical to 0.3.0» → «Resolved by decision-resolve-l0-xcx3: continuous for both weapons; `readyMode` not built».

Рядом, но **не в составе CX-lgnd-01** (это отдельный вопрос про сегмент `active`, на закрытие узла не влияет):
- `nodes/scyt-ac16__concept-acceptance-criterion.md:21` — «"active" while a volley flies» расходится с `L0-lgnd-ad07` §6 и с кодом (`hud.ts:43-54` не читает `isBusy`, во время залпа показывается Ready). `ad07:49` отмечает это только для `ac13`; `scyt-ac16` не обновлён. Нужно одно из двух: либо принять «Ready во время залпа» и поправить AC, либо вернуть сегмент `active`. Решает оператор.

## 6. Текст резолюции для `refine resolve`

> CX-lgnd-01 снят решением `decision-legendary-ready-hud` (2026-09-24, вариант (a) из `L0-xq1`): «Готово» / «Ready» показывается непрерывно, пока легендарный предмет в основной или второй руке, одинаково для всех оружий. Измерения на `32f4aca`: `src/websword/cooldown.ts` удалён в `392253d` 2026-09-24; одноразовый показ существовал только в 0.3.0–0.3.2 (`37a0403:src/websword/cooldown.ts:155-156`, окно 10 тиков × 50 ms = 500 ms); `grep -rl readyMode src` = 0, `grep -rl andrew.web_sword.ready src` = 0; `src/legendary/hud.ts:53` пишет `andrew.legendary.ready` на каждом проходе (интервал 10 тиков, `:9`); `tests/web-sword-cooldown.test.mjs` — 17/17, включая «ready keeps showing long after expiry»; прод-BDS 1.26.51.1 — «legendary hud armed», 0 «hud failed». Web Sword §8 про Ready не говорит, поэтому непрерывный показ его не нарушает. `readyMode` не строился. Устаревшие описания — `L0-lgnd-p005`, `L0-xq1`, `L0-xcx3` и тело `L0-lgnd-cx01` (список в `docs/feedback/diagnose-CNTR-LGND-CX01-AA.md` §5).

## 7. Замечания оператору (карточки не заведены)

- `packs/resource/texts/en_US.lang:6-7` и `ru_RU.lang:6-7` — `andrew.web_sword.cooldown` / `andrew.web_sword.ready` с `392253d` никто не читает. Их держит только `tests/web-sword-item.test.mjs:227-228` (проверка, что ключ есть в lang). Мёртвый текст, на поведение не влияет.
