ИСХОД: 3 — Подчистка знания

# Разбор CX-sclk-02: арбалет «как лук» и очередь из тыков в обход перезарядки

Проверено 2026-10-05, 19:24–19:44 (+0200). Движок BDS 1.26.51.1, `@minecraft/server` 2.10.0, частный экземпляр
`dist/bds-sclk2` (контейнер `andrew-bds-sclk2`, порты 19836/19860–19869/7843), сейчас погашен. Узлы KV
прочитаны через MCP. Номера строк взяты из корневого `.ai/context/analysis/` (только чтение).

## Итог

- **Посылка узла ложна для предмета, который задан в самом KV.** `sclk-ent1`:29 задаёт `charge_on_draw: true`
  и `max_draw_duration` 1.25 с. Такой shooter **не** отпускается как лук:
  - отпускание раньше `max_draw_duration` не даёт стрелы и не тратит боеприпас;
  - удержание до `max_draw_duration` **заряжает** предмет: стрела списывается;
  - выстрел происходит на **следующее нажатие**, в тот же тик, на полной скорости.
  
  Это поведение арбалета, а не лука. Удержание без отпускания само не стреляет.
- **Вариант A держится, к варианту B падать не нужно** (по cx02, на BDS). Ворота нативные, их длина равна
  `max_draw_duration`: при 1.25 с это 25 тиков, при 0.5 с — 10 тиков. 84 ранних отпускания из 84 дали
  0 стрел и 0 потраченных стрел. Отсюда темп не выше 1 стрелы за `max_draw`+1 тик, как у ванильного
  арбалета (заряд 25 тиков + нажатие). Это вывод из двух замеров: заряд требует непрерывного натяжения
  ≥ draw, выстрел требует нового нажатия. Непрерывный цикл «выстрел → натяжение → выстрел» прямо не мерялся:
  после тапа в 1 тик SimulatedPlayer пропускает следующее использование.
- **Опасный режим есть, но в KV его нет.** При `charge_on_draw: false` и `scale_power_by_draw_duration: false`
  тык в 1 тик даёт стрелу на **полной** скорости (2.991), и так 13 из 13 тыков. Отсюда правило для сборки:
  `charge_on_draw: true` несущий, его должен держать тест.
- **Отличить раннее отпускание от полного можно, но не по скорости.** При `charge_on_draw` недозаряженной
  стрелы не существует: все 30 выстрелов дали v0 = 2.965…3.041. Скрипт видит длину заряжающего натяжения
  точно, во всех строках `release@+N`, `useDuration` = старт − N. А стрела появляется в тик *следующего*
  `itemStartUse`/`itemUse`, когда «тиков с itemStartUse» = 0.
- **Quick Charge на кастомный shooter нативно не действует.** QC III: заряд по-прежнему ровно 25 тиков (при
  draw 1.25 с) и ровно 10 тиков (при 0.5 с). Сдвигается только показание `useDuration` у старта (−15). Для
  лукоподобного варианта кривая скорости с QC III и без него совпадает (5 тиков: 0.440 против 0.437; 20 тиков:
  2.228 против 2.253). Это частичный ответ на Q3, и он ломает эмуляцию QC в `as05` в её нынешней записи (ниже).
- Узел `sclk-cx02` можно закрывать по измерению Q5. **Но не тем механизмом, который записан в `adr-scfc`/`as05`/
  `r006`/`p002`:** записанный гейт при `charge_on_draw` удалил бы каждый законный болт. Ниже список правок.
- Кода Скалкового арбалета нет: `crossbow` в `src` встречается только в `src/ufo/iron.ts` (железные предметы), а
  `sculk` — только в Warden City. Вред сейчас живёт только в проекте, но по этому проекту будут планировать.

## Замер (Q5 из `sclk-p001`)

Repro: `env ANDREW_BDS_DIR=../dist/<приватная копия> [SCX2_ONLY="…"] bash docs/feedback/diagnose-CNTR-SCLK-CX02.repro.sh`.
- Проба `diagnose-CNTR-SCLK-CX02.probe.ts`, предметы `diagnose-CNTR-SCLK-CX02.items.json`.
- SimulatedPlayer в Survival, 64 стрелы.
- Отпускание на 1, 2, 3, 5, 10, 15, 20, 24, 25, 26, 30, 40 тиках, плюс 80 тиков без отпускания.
- После каждого выстрела тап в 1 тик: он показывает, заряжен ли предмет.
- Свидетели: `itemStartUse`/`itemReleaseUse`/`itemStopUse`/`itemCompleteUse`/`itemUse` с `useDuration`;
  `entitySpawn` стрелы со скоростью в тик спавна и владельцем; судьба стрелы (попадание или удаление);
  боеприпас через 1 тик после отпускания; урон и смерть игрока.

Артефакты:
- `.ai/verify/CNTR-SCLK-CX02-AA/2.json`: прогон 3, a7384a1, 9/9, exit 0, строки в `diagnose-CNTR-SCLK-CX02.probe.txt`;
- `.ai/verify/CNTR-SCLK-CX02-AA/3.json`: прогон 4, 5db3dd6, 3/3, exit 0.

| Вариант (все с `use_duration` 3600 с, кроме ud25) | Отпускание раньше draw | Удержание ≥ draw | Скорость выпущенной стрелы |
|---|---|---|---|
| ванильный лук (контроль) | 1–2 т: нет; 3 т: 0.324; 5: 0.555; 10: 1.246; 15: 2.069 | 20 т: 2.980 … 80 т: 3.036 | растёт с натяжением |
| ванильный арбалет (контроль) | 1–24 т: ничего, 0 стрел потрачено | `complete@+25`, стрела списана; тап → 3.127–3.171 | полная |
| ванильный арбалет + QC III | 1–5 т: ничего | `complete@+10`; тап → 3.137–3.188 | полная |
| **`cod`** = `sclk-ent1` (`charge_on_draw`, draw 1.25 с, `scale_power` по умолчанию) | 1–24 т: 0 стрел, 0 потрачено (8/8, тапы 8/8) | стрела списана, тап → выстрел в тик нажатия (5/5) | 2.976–3.021 |
| `cod_sp` (+ `scale_power`) | 0/8, 0 потрачено | 5/5 через тап | 2.991–3.041 |
| `cod_sp_ud25` (`use_duration` = draw) | 0/8, 0 потрачено | `complete@+25`, использование гаснет само; 5/5 через тап | 2.999–3.025 |
| `cod_sp` + QC III | 0/8 — **QC не укоротил** | заряд снова на 25 т; 5/5 | 2.979–3.033 |
| `cod_md05` (draw 0.5 с) | 1–9 т: 0/5, 0 потрачено | с 10 т заряд; 5/5 | 2.971–3.015 |
| `cod_md05` + QC III | 1–9 т: 0/5 — **QC ничего не меняет** | с 10 т; 5/5 | 2.965–3.025 |
| `bow_sp` (без `charge_on_draw`, `scale_power`) | 1–3 т: нет; 5: 0.437; 10: 0.964; 15: 1.568; 20: 2.253; 24: 2.830 | 25 т: 3.002 … 80 т: 3.010 | растёт, стрела тратится на каждом выстреле |
| `bow_sp` + QC III | 5: 0.440; 10: 0.960; 15: 1.556; 20: 2.228 | 25 т: 2.981 | как без QC |
| **`bow`** (без `charge_on_draw`, без `scale_power`) | **1 т: 2.991; 2 т: 3.001; 3 т: 3.047**, тапы 13/13 | 3.0 | **всегда полная** |

Удержание 80 тиков без отпускания: ни у одного варианта с `charge_on_draw` стрела во время удержания не
вылетела, автовыстрела нет. Игрок за прогоны 3–4 не получил урона ни разу (`harm total 0` во всех 12 RESULT).

## Перепроверка утверждения, по частям

| # | Часть | Как проверено | Результат |
|---|---|---|---|
| A | §9: кулдауна нет, ограничитель — перезарядка и QC | спека part-2, раздел 9 | верно |
| B1 | кастомный shooter «натягивается и отпускается как лук» (`adr-scbs`:31) | проба, `cod`/`cod_sp`/`ud25` | **ложно при `charge_on_draw: true`**: у предмета есть заряженное состояние, выстрел идёт на следующее нажатие |
| B2 | лук стреляет при отпускании на **любой** доле, с меньшей скоростью | ванильный лук; `bow`; `bow_sp` | ложно и для ванильного лука (1–2 т — ничего). Для `bow` «на любой доле» верно, но на **полной** скорости, а не меньшей |
| B3 | тык 1–2 тика = 10 HP или кратер за тык | 84 ранних отпускания с `charge_on_draw` | **недостижимо** для предмета из KV. Достижимо только при `charge_on_draw: false` + `scale_power: false` |
| C | «ни ADR, ни xasm27 не задают минимального натяжения» | `sclk-ent1`:29 | минимум задан неявно: `max_draw_duration` 1.25 с **и есть** нативный минимум (25 т) |
| D1 | дефолт: стрела ниже `MIN_BOLT_SPEED` удаляется (`r006`:22, `p002`:24) | 30 выстрелов с `charge_on_draw` | ниже 90 % (2.7) нет ни одной стрелы: гейт по скорости ничего не ловит |
| D2 | «отпущенная раньше времени с поправкой на QC» удаляется, «боеприпас тратится» | 84 ранних отпускания | ранней стрелы нет, и боеприпас **не** тратится. Тратится он при заряде (≥ draw) |
| D3 | QC-поправка как «тики с `itemStartUse`» (`as05`:21) | стрела появляется в тик нового `itemStartUse` (`arrows=1[+0 …]` в каждом заряженном тапе) | **вредно**: по этой записи будет удалён каждый законный болт (0 < 25 − 5·lvl) |
| E | Q5: «если `charge_on_draw` + `max_draw_duration` сами не пускают раннее отпускание — противоречие закрыто» (`cx02`:27) | весь замер | **пускают**: условие закрытия выполнено на BDS |

## Можно ли отличить раннее отпускание от полного

- При `charge_on_draw` различать нечего: раннее отпускание не порождает ни стрелы, ни расхода.
- Если нужен скриптовый страж (ADR-scfc его требует, плюс QC, см. ниже), сигнал такой: **длина последнего
  заряжающего натяжения** = тик `itemReleaseUse` − тик `itemStartUse`, или разность `useDuration`. Совпадает с
  фактом во всех строках. Её надо запомнить на игрока и проверить при спавне стрелы на следующем нажатии.
  Скорость здесь не работает: 2.965–3.041 у всех выстрелов. «Тики с itemStartUse» тоже не работают: 0.
- Без `charge_on_draw` скорость различает только при `scale_power: true` (< 2.83 до 25 т, ≥ 2.97 с 25 т). При
  `scale_power: false` она не различает ничего (2.949–3.047 на 1–80 т).
- Владелец (`self`) и v0 читаются в тик спавна, но только в gametest-паке. Для продуктового пака с настоящим
  игроком это Q4, здесь не мерялось.

## Quick Charge (сопутствующее, ломает `as05`)

Нативно QC на кастомный shooter не действует: заряд равен `max_draw_duration` при любом уровне. Отсюда:
- T14 (`sclk-ac14`:18, QC III ≤ 50 %) и `sclk-ac27`:24 («QC-копия заряжается заметно быстрее») нативно не
  выполняются.
- Эмуляция `as05`:21 в нынешней записи не может сделать QC быстрее: до 25 тиков движок не заряжает вообще,
  подменять нечего.
- Рабочая схема собирается из измеренного. Нативный draw ставится на пол QC III (0.5 с = 10 т, измерено: ворота
  ровно на 10). Скрипт запоминает длину заряжающего натяжения. Если стрела, выпущенная следующим нажатием,
  заряжалась короче 25 − 5·lvl тиков, она удаляется, а боеприпас остаётся потраченным (он уже списан при заряде).
  Сквозной прогон этой схемы в продуктовом паке **не делался**. Её место — Q3/T14 при сборке, не повод падать к B.

## Сопутствующее (измерено)

- `SimulatedPlayer.useItemInSlot` сразу после использования длиной 1 тик возвращает `false` и ничего не
  начинает. Вызов на тик позже срабатывает (`startedOnTry=2` во всех таких строках). Это пригодится будущему
  GameTest T14.
- Относительный `y=1` на `andrew:platform` — каменный пол. Игрок, поставленный туда, получает 2.0 удушья
  каждые 10 тиков и умирает к 212-му тику. Стрелы из пола удаляются через тик и подбираются обратно. Из-за
  этого прогоны 1–2 врали («стрелы не тратятся», «ничего не стреляет после 15 т»), их числа выброшены.
- Быстрые стрелы во всех вариантах упирались в камень через тик (`hit-block stone@+1`). Поэтому v0 ≈ 3.0
  сверяется с контролем «ванильный лук, полное натяжение» (2.980–3.036), а не смещением. У медленных стрел
  смещение совпало со скоростью (0.358/0.358, 0.586/0.586).
- Внешний источник (Bedrock Wiki через изолированный поиск, не проверено): `charge_on_draw` требует
  `use_duration` ≥ `max_draw_duration`. Баги MCPE-228332/228333 («первое использование может не
  сработать», «перезаряжается сразу после выстрела») помечены исправленными в Preview 26.30.20. Значит,
  нативные ворота держатся на поведении движка, которое Mojang меняет. Страж-тест T14 «тык не стреляет»
  нужен как сторож обновлений.

## Текст для refine resolve (L0-sclk-cx02)

Resolved by measurement (probe Q5), not by the mechanism in L0-adr-scfc. Checked 2026-10-05 on BDS 1.26.51.1,
artifacts .ai/verify/CNTR-SCLK-CX02-AA/2.json (a7384a1) and 3.json (5db3dd6), exit 0.
- A custom minecraft:shooter with charge_on_draw: true (L0-sclk-ent1) does not release like a bow. A release
  before max_draw_duration fires nothing and spends nothing: 84 of 84 early releases, 1–24 ticks at 1.25 s and
  1–9 ticks at 0.5 s.
- A draw of at least max_draw_duration loads it and spends one arrow. The next press fires in the same tick at
  2.965–3.041 blocks/tick (30 of 30).
- Holding without a release never fires.
- The fire rate is therefore one arrow per max_draw_duration + 1 tick, the vanilla crossbow's.
- Tap spam is reachable only with charge_on_draw: false and scale_power_by_draw_duration: false: a 1-tick tap
  fires at full speed (2.991, 13 of 13 taps). charge_on_draw: true is load-bearing.
- Quick Charge has no native effect on this shooter: the load stays at max_draw_duration at level III.
- No under-charged arrow exists, so a spawn-speed gate (MIN_BOLT_SPEED) catches nothing.
- A gate on "ticks since itemStartUse" at arrow spawn reads 0 for every legitimate shot.
- A scripted guard must use the length of the last loading draw (itemReleaseUse − itemStartUse, exact).
- Option A stands for this contradiction. The iPad check of a quick tap stays with L0-sclk-ac27.

## Список правок (файл:строка от `.ai/context/analysis/`; что на что)

Узлы:
- `nodes/sclk-cx02`:15, :21, :26–27 — «a bow-like custom shooter… fires on release at any draw» → резолюция
  выше. Статус «resolved by `L0-adr-scfc`» → «resolved by measurement (Q5)».
- `nodes/adr-scbs`:31 — «draws and releases like a bow, with no stored "loaded" state» → «with charge_on_draw it
  loads at max_draw_duration and fires on the next press, like a crossbow. Quick Charge has no native effect
  (measured). Multishot is not measured». `:42` gate (4) → «satisfied natively on BDS (Q5)». `:31` QC
  emulation → схема с draw 0.5 с и гейтом по длине заряжающего натяжения.
- `nodes/adr-scfc`:27 — «which may release like a bow at any draw» → «which, with charge_on_draw, cannot fire
  before max_draw_duration (measured)». `:30` — «An early projectile is removed with no bolt, and the ammunition
  stays spent» → «no early projectile exists. A load shorter than the Quick-Charge-adjusted time (possible only
  if the native draw is set below 25 ticks) is caught when its arrow spawns on the next press; that arrow is
  removed, and the arrow spent at load stays spent». `:31` — страж оставить, но мерить длиной заряжающего
  натяжения, а не скоростью.
- `nodes/sclk-r006`:22 — «A charged shot is an arrow whose spawn speed is ≥ MIN_BOLT_SPEED» → «a shot is
  charged if its loading draw lasted ≥ 25 − 5·QC ticks; every fired arrow is full speed (2.965–3.041)». `:23` —
  «the time to full charge shortens» → «natively it does not; script». `:24` — «the arrow is removed, the
  ammunition stays spent» → «an under-length release fires nothing and spends nothing».
- `nodes/sclk-as05`:21 — «measured in ticks since `itemStartUse`… A release before that spawns no bolt» → «the
  native draw is set to the QC III floor (0.5 s); the script holds each load to 25 − 5·level ticks of the
  loading draw and removes the arrow fired by the next press if it is shorter». `:24` — посылка «bow-like feel»
  неверна.
- `nodes/sclk-as04`:24 — строку `MIN_BOLT_SPEED` (90 %, «Q5 measures it») снять: Q5 измерил, что недозаряженных
  стрел нет.
- `nodes/sclk-p002`:24 — шаг 2 (гейт по скорости) → гейт по длине заряжающего натяжения, если он нужен.
  Триггер: стрела рождается на нажатии **после** заряда, в тик `itemStartUse`.
- `nodes/sclk-p001`:24 Q1 «stored loaded state, or bow-like?» → ответ «loaded state, при charge_on_draw»
  (проверено на SimulatedPlayer; iPad не смотрели). `:28` Q5 → числа выше. `:26` Q3 → «QC: нет нативного
  эффекта» (Multishot не мерялся).
- `nodes/sclk-ac14`:20 — «a release after 2 ticks spawns no bolt» выполняется нативно, оставить как страж.
  `:18` (QC III ≤ 50 %) нативно не выполняется: только по схеме из `as05`.
- `nodes/sclk-ac27`:22 — «like a crossbow (or like a bow, per xq7 item 8)» → «like a crossbow: hold to load,
  press to fire». `:24` — нативно ложно, держится на скрипте.
- `nodes/xq7`:35 (п. 8) — посылка «if the custom item cannot hold a loaded bolt» ложна: держит. Вопрос
  переформулировать: «hold to load, press to fire; Quick Charge by script — acceptable?».
- `nodes/sclk-ent1`:29 — добавить: `charge_on_draw: true` несущий (без него и без `scale_power` тык = полный
  болт); `max_draw_duration` — это и есть нативные ворота; «probe-tuned» → 1.25 с, или 0.5 с под схему QC.

Роллапы (перегенерируются из узлов, перечислены для сверки): `risks.md`:224;
`contradictions.md`:216, :222, :227; `assumptions.md`:435, :452, :455; `client-questions.md`:42;
`project-knowledge/architecture.md`:177, :252, :255; `project-knowledge/business-rules.md`:615, :617;
`project-knowledge/glossary.md`:1277. `nodes/cool-ctr1`:25 совпал по слову «stays spent», но он о праве крафта,
не трогать.

## Чего этот разбор не доказал

- **iPad.** На настоящем клиенте ни тык, ни заряд, ни видимое «заряженное» состояние не смотрели.
  `sclk-ac27` остаётся ручным.
- **Сквозной скриптовый гейт QC** в продуктовом паке не собирался (кода нет).
- **Multishot** (Q3) и **владелец в продуктовом паке** (Q4) — вне этого узла, не мерялись.

Карточек не заведено, в KV ничего не записано. Частный экземпляр погашен, дерево `src/` восстановлено.
