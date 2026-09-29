ИСХОД: 3 — Подчистка знания

# /diagnose CNTR-XCX5-AA — L0-xcx5 · заголовок спеки, её охват и «ранние черновики»

Замеры сняты 2026-09-29 на `fea2287` (родитель `32f4aca`). Пути KV даны относительно `.ai/context/` живого KV в корне проекта; worktree-копия `.ai/context` отстаёт (последний коммит `1a07f34`, 2026-09-27), поэтому номера строк взяты из корня, только чтением. Все замеры делает один скрипт: `docs/feedback/diagnose-CNTR-XCX5-AA.measure.sh`. Артефакты `ai-kit run-check` лежат в `.ai/verify/CNTR-XCX5-AA/`:

- `2.red.json` — `measure.sh header`, exit 1: видимый заголовок не называет Warden и Bastion;
- `2.json` — `measure.sh` плюс `measure.sh live andrew-bds`, exit 0: все числа утверждения, размеры в коде, история размеров, `structures-sizes` 5/5, замер боевого сервера;
- `3.json` — `measure.sh dupes <корень>/.ai/context`, exit 0: поиск дубликатов по адресу и по числу.

## Intake

**OBSERVED.** Источник один: `docs/Four_Structures_Spec_RU_EN_copy.docx`, sha1 `cfce59d…`. Копия в корне совпадает. В KV из него 11 фрагментов `fourstructuresspecruencopy-part-1..11`, priority 530. Что в нём видно:

- строка 1: «Мельница / Windmill + Дирижабль / Airship • RU/EN • v1»;
- в таблице §1 две колонки, Windmill и Airship;
- «четыр…» встречается в 7 строках: Purpose, §2, §11, §15;
- §13 (l.473) и §14 (l.577) называют себя «нормативным дополнением»;
- «прежний 50% шанс отменён» стоит в §4.7, пункт 6 (l.201);
- §12 (l.455) — английская выжимка; Warden и Bastion в ней не упоминаются ни разу;
- в метаданных самого файла (`docProps/core.xml`):
  - title — «Minecraft Bedrock PvP Add-On — Four Structures Specification»;
  - subject — «Windmill, Airship, Mini Warden City, Mini Bastion — RU/EN **v2**».

**VERDICT.** Это bug, расхождение источника с самим собой (развилка по умолчанию). Видимый заголовок и §1 расходятся с телом и метаданными того же файла. Второе утверждение узла — «повторный импорт тихо поменяет числа» — гипотеза без наблюдения; в Investigation проверено, достижим ли этот вред.

## Investigation

**REPRO.** `bash docs/feedback/diagnose-CNTR-XCX5-AA.measure.sh` — детерминированно, 1 из 1. Вывод в `2.json`.

| Что утверждает узел | Замер | Итог |
|---|---|---|
| Заголовок «Windmill + Airship • v1», в §1 две колонки | l.1; в §1 колонки `Мельница / Windmill`, `Дирижабль / Airship` | верно |
| Purpose и §2 говорят «четырёх структур» | 7 строк: l.3, l.33, §11, §15 | верно |
| §13 и §14 — «нормативное дополнение», приоритет над черновиками | l.473, l.577 | верно |
| §14: 20×20 вместо 30×30; §4.7.6: 50 % отменён, теперь 100 % | l.577; l.201, в §4.7 это пункт 6 | верно |
| Ранних черновиков нет в KV | `git log --all -- '*.docx'`: единственный путь Four Structures — этот файл. `kv_list_raw_sources`: только `fourstructuresspecruencopy-*`. В `.ai/inbox` лежит только `stage-0-infrastructure.md` | верно, и в репозитории их тоже никогда не было |
| У §2–§6 нет английского эквивалента | 124 строки тела, строк без кириллицы — 0 (заголовки двуязычные) | верно |
| «RU и EN равно нормативны» | l.455, дословно «The Russian sections above are equally normative; … preserve the agreed numeric rules» | верно, текст пересказан близко |
| Метка «v1» не отличает документ от предшественника | subject в docProps — «RU/EN v2», четыре структуры | **неверно**: версия в файле есть, она в метаданных, а не в видимой шапке |

Где числа живут сейчас:
- `src/structures/config.ts` `CHANCES` — 0.01 / 0.02 / 0.05 / 0.05;
- `templates/*_SIZE`:
  - Windmill `[35, 31, 35]`;
  - Airship `[75, 18, 13]`;
  - City `[63, 20, 63]`;
  - Bastion `[20, 12, 20]`;
- в `spawn-search.ts` нет броска шанса: Мельница у спавна ставится всегда, как требует §4.7.6.

История размеров, первые коммиты с каждым значением:
- Airship: `[15,12,7]` `05fce48` 09-26 → `[28,11,7]` `ffa9fd0` 09-27 → `[75,18,13]` `c5a1c27` 09-27;
- City: `[31,13,31]` `b70d450` 09-26 → `[63,20,63]` `1fb0851` 09-27.

**CAUSE.** Видимая шапка и §1 остались от издания на две структуры, а §13–§16 дописаны как дополнение. Метаданные файла при этом обновили до «v2, четыре структуры», а шапку — нет.

Тело документа согласовано с собой:
- все 24 числа §12 есть в §1–§11;
- все 19 чисел §16 есть в §13–§15. Единственный «пропуск» — `30×30×10–15`, но это не расхождение: в l.479 то же число записано раздельно, «30×30 … высота 10–15».

Значит, правило «при расхождении RU побеждает» ни разу не срабатывает.

Вред «повторный импорт тихо поменяет числа» в этом проекте недостижим, по трём причинам:
- (a) Другого черновика нет нигде: ни в git, ни в KV, ни в inbox.
- (b) Priority сырья в KV — это порядок импорта, а не версия в шапке: Web Sword 510 (импорт 09-21) → Scythe 520 (09-25) → Four Structures 530 (09-26) → Orbital 540. Любой будущий импорт встанет выше, как бы он ни был подписан, поэтому «подтвердить версию» ничего не меняет в механизме вытеснения.
- (c) Числа продукта живут в коде и закреплены тестами: `structures-sizes` 5/5, `airship-body` (2 % ± 5σ), тесты шаблонов. Импорт меняет KV, а не код.

**PROOF.**
- `2.red.json` (exit 1): шапка называет 2 структуры из 4.
- `2.json` (exit 0): каждое число из таблицы выше; `structures-sizes` 5 pass / 0 fail.
- Наблюдение: посылка «Interim handling» сегодня ложна. «Документ авторитетен целиком, числа §13/§14 перекрывают всё» расходится с поставкой для 2 структур из 4 — City `[63,20,63]` и Airship `[75,18,13]`.

**RULED OUT.**
1. «Шапка права: в охвате только 2 структуры». Опровергнуто:
   - subject в docProps называет все 4;
   - DoD §11 — «Все четыре структуры»;
   - тесты §13.8 (41–50) и §14.7 (51–59) продолжают нумерацию §10 (14–40): один сквозной список, а не приставка;
   - в `ROLL_DEFS` 4 id, тест «every roll def has a shipped template» зелёный;
   - `DEMO-S4-01-AA` («все четыре структуры на iPad») закрыт, 12/12.
2. «Ранний черновик где-то лежит и может всплыть». Опровергнуто: 1 путь в `git log --all` по `*.docx`, 11 фрагментов в KV из одного файла, inbox без него.

**Поправка к примечанию надзирающего.** «20×20 вместо 30×30» в §14 относится к **Мини-бастиону**, а не к Городу. Бастион поставлен ровно по §14: `[20, 12, 20]` — и в коде, и на сервере. Город по спеке ≈30×30×10–15 (§13.1): сначала был шаблон `[31,13,31]`, потом по решению оператора стал `[63,20,63]`. Дирижабль по спеке ≈15×7×10–12 (§5.1): `[15,12,7]` → `[28,11,7]` → `[75,18,13]`. Вывод надзирающего от этого не меняется: числа спеки разошлись с поставкой сильнее, чем описано в узле.

## Fix design

**RADIUS.** Код не меняется, исход — только знание. Ограничений не вводится, поэтому CASES и BYPASS неприменимы.

Кто опирается на устаревшие строки:
1. Все, кто читает размеры через `kv_search`: в `L0-airs*` стоит ≈15×7×10–12, в `L0-wrdn*` — ≈30×30×10–15.
2. «Interim handling» самого `xcx5` (стр. 24). Если читать его буквально, он велит вернуть Город к 30×30.
3. Решения по размерам, лежащие в KV, не совпадают с поставкой:
   - по Дирижаблю — «примерно до 25–30 блоков»;
   - по Городу — «62x62».
   Поставленные 75×18×13 и 63×20×63 не записаны в KV нигде: `3.json`, секция «shipped sizes» — единственное совпадение там «63×63 chunks» из `wind-ad01`, про другое.
4. Списки «Carried» в `summary.md` и `concept-overview.md`.
5. `CNTR-XCX12-AA` — тот же кластер (устаревшие узлы структур). Строки про размеры перечислены ниже, но не как отдельная работа: их надо слить с разбором XCX12, а не заводить дважды.

Как искал:
- `grep` по живому KV по адресу (`xcx5`, «earlier drafts», «черновы») и по числам (30×30, 31×13×31, 62×62, 15×7, 28×11×7, 25–30, 75×18/13, 63×20/63, 50 %) — `3.json`;
- `kv_search` по формулировке узла;
- `git log` по `templates/{airship,warden-city}.ts`;
- `task_get AIRS-SCALE-01-AA` и `WRDN-BIG-01-AA`.

## Proof

**GREEN.** `2.json` на `fea2287`, exit 0. Проверка касается того же предмета, что и красный прогон:
- тот же docx (sha1 `cfce59d…`) и тот же скрипт, что в `2.red.json`;
- тест размеров реально выполнился: 5 тестов, 0 skip;
- размеры в выводе читаются из исходников, а не из кэша.

Один инструмент пришлось поправить по дороге: без `-Mutf8` perl не узнавал длинное тире в строках-линейках таблиц и считал их английским текстом (6 ложных строк). Поправлено до записи артефакта.

**LIVE.** Боевой LAN-сервер `andrew-bds` (19132) — `measure.sh live andrew-bds`, внутри `2.json`:
- `andrew_bp` загружен в версии `[1, 2, 0]`;
- размеры шаблонов: windmill `[35,31,35]`, airship `[75,18,13]`, warden-city `[63,20,63]`, bastion `[20,12,20]`.

Сборка `dist/andrew.mcaddon` в корне (manifest 1.2.0) даёт те же четыре размера. Это подтверждает сторону «как построено». Изменённого пути в коде нет, так что входить на сервере было не во что.

## Резолюция для refine resolve

`ai-kit refine resolve L0-xcx5 "<текст>" --outcome changed --evidence "c5a1c27, 1fb0851, af024e4 (1.2.0); .ai/verify/CNTR-XCX5-AA/2.json, 2.red.json, 3.json"`

> Замеры на fea2287 (2026-09-29), скрипт docs/feedback/diagnose-CNTR-XCX5-AA.measure.sh.
>
> Спека Four Structures (sha1 cfce59d…) — единственный такой источник за всю историю git; в KV — 11 фрагментов, priority 530. Ранних черновиков нет ни в git, ни в KV, ни в inbox.
>
> Видимая шапка «Windmill + Airship • v1» и две колонки §1 устарели. Сам файл в метаданных называет себя «Windmill, Airship, Mini Warden City, Mini Bastion — RU/EN v2». Это ответ на «Ask», и от человека он не нужен.
>
> Расхождений RU/EN по числам нет: 24 числа §12 есть в §1–§11, 19 чисел §16 — в §13–§15.
>
> Priority сырья в KV растёт с порядком импорта (510 → 520 → 530 → 540), а не с версией в шапке. Поэтому переподписанная версия ничего не меняет в вытеснении.
>
> Числа продукта живут в коде и закреплены тестами:
> - `src/structures/config.ts` CHANCES — 0.01 / 0.02 / 0.05 / 0.05;
> - `*_SIZE`: Windmill [35,31,35], Airship [75,18,13], City [63,20,63], Bastion [20,12,20];
> - `tests/structures-sizes.test.mjs` — 5/5;
> - те же размеры загружены на боевом BDS 19132 в andrew_bp 1.2.0.
>
> Порядок власти над числами структур: решения оператора → спека (все §1–§16) → черновики, которых нет. Как построено — код.
>
> Решениями оператора перекрыты два размера спеки:
> - Город ≈30×30×10–15 (§13.1) → 63×20×63, decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i, коммит 1fb0851;
> - Дирижабль ≈15×7×10–12 (§5.1) → 75×18×13 по выбору оператора 2026-09-27 (Zeppelin NT, AIRS-SCALE-01-AA, коммит c5a1c27). Решения в KV на него пока нет; действующая запись говорит «25–30».
>
> Бастион 20×20×10–12 (§14) и Мельница 100 % у спавна (§4.7.6) поставлены ровно по спеке.

## Копии для подчистки — «файл:строка — что заменить на что»

По адресу (сам узел `xcx5`):

1. `analysis/nodes/xcx5__concept-contradiction.md:24` — если тело узла сохраняется после resolve:
   - было: «This document (priority 530) is authoritative in full, including §13–§16. The numbers in §13/§14 override anything earlier.»
   - стало: «Structure numbers: operator decisions override the spec; the spec (all §1–§16) overrides nothing else, because no other draft exists. As built: `src/structures/config.ts` and `templates/*_SIZE`, pinned by `tests/structures-sizes.test.mjs`.»
2. `analysis/nodes/xcx5__concept-contradiction.md:22` и `:26`:
   - было: «The version marker "v1" does not distinguish…» / «Confirm the document version…»
   - стало: «The file's own docProps subject reads "Windmill, Airship, Mini Warden City, Mini Bastion — RU/EN v2". KV raw priority follows import order, not the header's version.»
3. `analysis/summary.md:107` и `analysis/nodes/concept-overview.md:104` — убрать `` `L0-xcx5`, `` из списка «Carried», если это не сделает пересборка сводок в `refine resolve`.
4. `analysis/nodes/wrdn__concept-component.md:68`:
   - было: «the two that already target it (`L0-xcx4`, `L0-xcx5`) are cross-cutting and unresolved at the parent level»
   - стало: «`L0-xcx4` targets it and is cross-cutting; `L0-xcx5` is closed (the header is stale, the file says v2 with four structures).»
5. `analysis/nodes/wrdn__concept-component.md:17` — после «overrides earlier drafts on conflict» дописать: «; its footprint and contents are superseded by `decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i` (as built `[63, 20, 63]`, 40 chests, 8 shriekers)».

По числу — Город (кластер `L0-xcx12`, слить с разбором `CNTR-XCX12-AA`):

6. `analysis/nodes/wrdn__concept-component.md:23` — «footprint ≈30×30, height ≈10–15 blocks» → «footprint 63×63, height 20 (`WARDEN_CITY_SIZE` `[63, 20, 63]`; §13.1's ≈30×30×10–15 is superseded by decision)».
7. `analysis/nodes/wrdn-rul2__concept-rule.md:17` — «footprint ≈30×30 blocks, height ≈10–15 blocks» → «footprint 63×63 blocks, height 20 (decision 2026-09-27; spec §13.1 said ≈30×30×10–15)».
8. `analysis/nodes/wrdn-ac03__concept-acceptance-criterion.md:15` — «the footprint is ≈30×30, the height is 10–15 blocks» → «the footprint is 63×63 and the height is 20 (unrotated `[63, 20, 63]`)». Пометку «(Raw AC 43.)» дополнить: «superseded by decision».
9. `analysis/nodes/wrdn-ent1__concept-entity.md:24` — «≈30×30×(10–15)» → «`[63, 20, 63]` (`WARDEN_CITY_SIZE`)».
10. `analysis/nodes/strf-as01__concept-assumption.md:18` — «Warden City (30×30)» → «Warden City (63×63 as built)». Сам вывод узла от этого только крепче.
11. `analysis/nodes/xq2__concept-client-question.md:22` — «The 30×30 city footprint spans 2–3 chunks» → «The 63×63 city footprint spans 4–5 chunks per axis».
12. `analysis/decisions/decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i.md:10,:20` (в сводке — `analysis/decisions.md:706`) — «62x62 в плане» расходится с поставленными 63×63 (`1fb0851`). Историю не переписывать; дописать строку «Как построено: `[63, 20, 63]`».
13. Только отметка, без правки: `analysis/decisions/decision-l0-xq2-plotnost-struktur-shansy-na-chank-rovno-k.md:16,:30` (в сводке — `decisions.md:647`). Там оценка «с пятном 30x30 один на ~72 блока» посчитана для 30×30. При 63×63 столкновения кандидатов чаще, и эти числа не переиспользовать.

По числу — Дирижабль (тот же кластер `L0-xcx12`):

14. `analysis/nodes/airs__concept-component.md:26` — «~15×7×10–12» → «75×18×13 (`AIRSHIP_SIZE`; envelope 73×13×13, gondola 13×7×4; spec §5.1's ≈15×7×10–12 superseded by the operator 2026-09-27, AIRS-SCALE-01-AA)».
15. `analysis/nodes/airs-r001__concept-rule.md:20` — «Fixed size ≈15×7×10–12 (L×W×H, unrotated)» → «Fixed size 75×13×18 (L×W×H), template `[75, 18, 13]` (x, y, z); spec §5.1 said ≈15×7×10–12».
16. `analysis/nodes/airs-ac01__concept-acceptance-criterion.md:23` — «≈15×7×10–12 (L×W×H)» → «75×13×18 (L×W×H), template `[75, 18, 13]`».
17. `analysis/decisions/decision-dirizhabl-udlinyaetsya-protiv-razmera-v-speke-ra.md:18,:34` (в сводке — `decisions.md:693`) — «примерно до 25–30 блоков» перекрыто. Текст не править. Записать новое решение (`ai-kit refine decision`) и пометить старое как `superseded by`. Готовый текст нового решения:
    > «Дирижабль 75×18×13 (Zeppelin NT) — заменяет «25–30» из decision-dirizhabl-udlinyaetsya-protiv-razmera-v-speke-ra. Оператор 2026-09-27 выбрал размер Zeppelin NT после сравнения пропорций настоящих дирижаблей (поперечник 7–8 ростов игрока). Ширина 13, а не 14: нечётный поперечник даёт центральный ряд под кили и коридор гондолы. Оболочка 73×13×13, гондола 13×7×4, 4 каюты, 10 сундуков, 1 спавнер. Поставлено в 1.2.0 (c5a1c27; на BDS 19132 airship [75,18,13]). Основание: AIRS-SCALE-01-AA, parent_work_goal.»

Проверено и **не требует правки**:
- `nodes/wind-r007__concept-rule.md:22` — 100 %, «old 50 % is cancelled»; совпадает с кодом;
- `nodes/bast__concept-component.md:18` — ~20×20×10-12; совпадает с `[20,12,20]`.

## Карточки и KV

Карточек не заведено: ни `task_create`, ни `refine`. В KV ничего не записано. Корневой `.ai/context` только читался. В worktree записаны только этот отчёт и скрипт замеров.

Попутно, для оператора, без карточки: в `releases/` нет `andrew-1.2.0.mcaddon`, последняя там — 1.1.0. При этом `README.md:456` говорит, что туда кладут копию того, что отдавали на устройство, а боевой сервер 19132 работает на 1.2.0.
