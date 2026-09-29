---
title: Decisions
type: analysis
generated_at: "2026-09-29T22:51:16.978Z"
source_channel: rollout
node_id: rollout-decisions
aliases: ["rollout-decisions","decisions"]
is_a: ["rollout","decisions"]
relates_to: ["decision-completion-flow-quick","decision-merge-policy-autopilot","decision-namespace-addona-andrew-asm-002-q-002","decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001","decision-verification-approach-automatic","decision-windows-pk-ne-nuzhen-q-004","decision-yazyk-skriptov-typescript-asm-003-q-003","decision-zacharovanie-bez-durability-proverit-pervoy-zada","decision-q-006-web-sword-provenance-yes-metka-ekzemplyara","decision-q-007-enchantable-without-durability-podtverzhde","decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut","decision-q-009-cooldown-persistence-sohranyat-mezhdu-vyho","decision-q-010-main-hand-off-hand-priority-otlozheno","decision-q-011-cube-geometry-27-kletok-tsentr-sosednyaya-","decision-q-012-two-player-dod-gametest-s-dvumya-simulated","decision-q-013-protected-blocks-zakrytyy-spisok-posture-s","decision-q-014-budget-after-destruction-pravo-ostaetsya-p","decision-q-015-gate-game-modes-survival-i-adventure","decision-q-016-sword-unlootable-podtverzhdeno-kak-zaduman","decision-q-017-zero-cells-proval-s-lokalizovannym-soobsch","decision-resolve-l0","decision-resolve-l0-keep-ctr006","decision-resolve-l0-once","decision-resolve-l0-qatg-ctr1","decision-resolve-l0-trap-ct07","decision-resolve-l0-trap-ct08","decision-web-sword-item-values-uron-kak-u-vanilnogo-almaz","decision-legendary-hand-priority-realizuem-seychas-osnovn","decision-legendary-ready-hud-gotovo-pokazyvaetsya-postoya","decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk","decision-resolve-cool-ctr3","decision-resolve-l0-sprj-cx02","decision-resolve-l0-xcx3","decision-scythe-enchantments-slot-sword","decision-scythe-hidden-target-dynamic-property-andrew-hid","decision-scythe-launch-applyknockback-s-kalibrovannoy-ver","decision-scythe-melee-damage-8-proveryaetsya-zamerom-prot","decision-scythe-projectiles-virtualnye-bez-suschnostey-ri","decision-scythe-true-damage-pryamoe-umenshenie-zdorovya-d","decision-scythe-targets-mobs-moby-tozhe-tseli-igrok-v-pri","decision-ad-wrdn-01-l0-wrdn-ad01-podtverzhdeno-vanilnaya-","decision-adr-bast-02-l0-bast-ad02-podtverzhdeno-vanilnye-","decision-adr-l0-adr-strc-accepted-generatsiya-skriptom-pr","decision-adr-l0-adr-strs-accepted-s-ogovorkoy-q5-zond-str","decision-adr-l0-adr-tmpl-accepted-zond-strf-p006-q1-q2-q3","decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-","decision-adr-strf-01-l0-strf-d001-accepted-determinirovan","decision-adr-strf-02-l0-strf-d002-accepted-spavnery-vanil","decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno","decision-l0-xcx6-edinstvennyy-istochnik-pravdy-po-generat","decision-l0-xcx7-kanal-dokazatelstva-u-kazhdogo-kriteriya","decision-l0-xq2-plotnost-struktur-shansy-na-chank-rovno-k","decision-l0-xq3-vozvrat-poteryannogo-oruzhiya-kraftivshem","decision-l0-xq4-melnitsa-u-spavna-bez-suhoy-zemli-mira-be","decision-dirizhabl-udlinyaetsya-protiv-razmera-v-speke-ra","decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i","decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavsh","decision-resolve-cool-ctr1","decision-resolve-cool-ctr2","decision-resolve-cool-ctr4","decision-resolve-l0-airs-cx01","decision-resolve-l0-lgnd-cx01","decision-resolve-l0-lgnd-cx07","decision-resolve-l0-lgnd-cx08","decision-resolve-l0-lgnd-cx09","decision-resolve-l0-orbc-cx02","decision-resolve-l0-scyt-cx03","decision-resolve-l0-scyt-cx04","decision-resolve-l0-scyt-cx05","decision-resolve-l0-strf-cx01","decision-resolve-l0-strf-cx02","decision-resolve-l0-wind-cx01","decision-resolve-l0-wind-cx02","decision-resolve-l0-xcx11","decision-resolve-l0-xcx12","decision-resolve-l0-xcx13","decision-resolve-l0-xcx14","decision-resolve-l0-xcx5","decision-resolve-l0-xcx6","decision-resolve-l0-xcx7","decision-resolve-l0-xcx8","decision-resolve-l0-xcx9","decision-vvod-orbitalnoy-pushki-udar-po-playerswingstart-"]
priority: 540
---

# Decisions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Решения — override'ы над анализом. Каждое решение фиксируется скиллом `/refine` (CLI `ai-kit refine decision …`) и далее направляет `/plan` и `/execute`.

## completion_flow = quick (decision-completion-flow-quick)

_Decided: 2026-09-20_


Rationale: оффлайн-аддон без сети, авторизации и пользовательских данных — security-audit и demo-prep не нужны; демо и есть проверка на iPad. Impact: после завершения волн — только /verify.





## merge_policy = autopilot (decision-merge-policy-autopilot)

_Decided: 2026-09-20_


Rationale: решение оператора 2026-09-20 — полный автопилот: задачи выполняются, мержатся и верифицируются автоматически, без пауз на ревью. Ограничение: критерии типа manual (канал ipad — проверка глазами на устройстве) автопилот закрыть не может; такие задачи мержатся по артефактам build/bds, а iPad-критерии остаются открытыми до подтверждения оператором (task_accept / кнопка на борде). Impact: /execute идёт волнами без остановок; /verify — автоматически после каждой волны.





## Namespace аддона = andrew (ASM-002, Q-002) (decision-namespace-addona-andrew-asm-002-q-002)

_Decided: 2026-09-20_


Вопрос: имя аддона / namespace. Решение: namespace andrew. Все ID предметов, рецептов, ключи .lang и имена пакетов идут с префиксом andrew: (например andrew:miners_pickaxe). Обоснование: предложено в документе этапа 0, оператор не возразил; решено до первого коммита, пока переименование бесплатно. Закрывает ASM-002 и Q-002.





## Целевая версия Bedrock = 1.26.51 (ASM-001, Q-001) (decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001)

_Decided: 2026-09-20_


Вопрос: какая версия игры на iPad. Решение: на iPad установлена Minecraft Bedrock 1.26.51 (оператор прочитал с устройства 2026-09-20) — текущий стабильный релиз (BDS 1.26.51.1 по download API Mojang, bedrock-samples v1.26.50.4 от 2026-09-16). Целевые значения: min_engine_version [1, 26, 50]; @minecraft/server 2.10.0 (стабильный на npm, опубликован 2026-09-15); Bedrock Dedicated Server 1.26.51.1 в Docker. Preview 1.26.60 не используем. Влияние: спека кирки (2.9.0 / 1.26.0) подгоняется под эти значения; закрывает ASM-001 и Q-001.





## verification_approach = automatic (decision-verification-approach-automatic)

_Decided: 2026-09-20_


Rationale: решение оператора 2026-09-20 — полный автопилот. Проверка автоматическая: канал build (tsc против типов @minecraft/server 2.10.0, валидация JSON, сборка .mcaddon) и канал bds (Bedrock Dedicated Server 1.26.51.1 в Docker: загрузка пакета без ошибок манифеста/зависимостей, исполнение скрипта подтверждается логом сервера). Человек не участвует, если всё зелёное. Канал ipad остаётся только для того, что движок сервера физически не покрывает (визуал: иконка, название в креативе) — такие критерии планировать минимально и как manual; они не блокируют мерж. Impact: /plan типизирует критерии как build/unit/e2e везде, где проверку можно выполнить на Маке или BDS; /verify закрывает их артефактами run-check без участия оператора.





## Windows-ПК не нужен (Q-004) (decision-windows-pk-ne-nuzhen-q-004)

_Decided: 2026-09-20_


Вопрос: нужен ли Windows-ПК как запасной вариант. Решение: нет. Цикл разработки: Mac (сборка, статика) → BDS в Docker (лог движка) → iPad (проверка глазами). Пересмотреть только если BDS под Rosetta на M4 Pro окажется нестабильным. Закрывает Q-004.





## Язык скриптов = TypeScript (ASM-003, Q-003) (decision-yazyk-skriptov-typescript-asm-003-q-003)

_Decided: 2026-09-20_


Вопрос: TypeScript или JavaScript. Решение: TypeScript. Обоснование: компиляция против типов @minecraft/server 2.10.0 ловит несовместимости API на Маке до дорогого цикла сборка→Docker→iPad. Влияние: npm run build = tsc/esbuild + валидация JSON + упаковка .mcaddon. Закрывает ASM-003 и Q-003.





## Зачарование без durability — проверить первой задачей этапа 1 (ASM-004, Q-005) (decision-zacharovanie-bez-durability-proverit-pervoy-zada)

_Decided: 2026-09-20_


Вопрос: принимает ли предмет без компонента minecraft:durability чары через minecraft:enchantable (slot pickaxe). Решение: проверить эмпирически первой задачей этапа 1 — стол зачарования и наковальня на iPad. Рабочая гипотеза: да, enchantable от durability не зависит. Если нет — спека кирки меняется (durability + защита от поломки или отказ от чар); это изменение спеки, а не баг. Закрывает ASM-004 и Q-005 как решение о способе проверки.





## Q-006 web-sword-provenance = yes: метка экземпляра на предмете (decision-q-006-web-sword-provenance-yes-metka-ekzemplyara)

_Decided: 2026-09-21_


Решение оператора (автопилот, 2026-09-21): экземпляр Web Sword несёт durable-метку — dynamic properties на ItemStack: andrew:ws_origin (craft|admin), andrew:ws_owner (id игрока), andrew:ws_id (уникальный id). Метку пишет обработчик крафта (L0-once) через общий модуль, которым владеет L0-keep (ADR-016). Death retention действует только для помеченных экземпляров. Копии из креативного инвентаря метки не имеют, не удерживаются при смерти и право крафта не тратят. Операторская команда /andrew:websword give [player] выдаёт помеченную копию origin=admin: удерживается при смерти (для тестов retention), право не тратит. Закрывает CTR-005 и CTR-009. Impact: L0-keep, L0-once, L0-item (ключи), L0-qatg.





## Q-007 enchantable-without-durability = подтверждено на 1.26.51 (decision-q-007-enchantable-without-durability-podtverzhde)

_Decided: 2026-09-21_


Проверено: SELFTEST-01-AA (bds:check, in-engine) — ItemEnchantableComponent.canAddEnchantment=true для andrew:miners_pickaxe без minecraft:durability на BDS 1.26.51.1; оператор 2026-09-21 принял iPad-проверку DEMO-S1. Web Sword повторяет форму: minecraft:enchantable slot=sword, без durability. Блокер снят.





## Q-008 blocked-craft-refund = (a) обнаружить и вернуть ингредиенты (decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut)

_Decided: 2026-09-21_


Решение (автопилот): повторный survival-крафт распознаётся по появлению непомеченного Web Sword в инвентаре non-creative игрока при уже потраченном праве; меч изымается, игроку возвращаются 4 minecraft:web и 1 новый minecraft:diamond_sword, показывается локализованное сообщение (RU/EN, ключ в каталоге L0-item). Известное ограничение: чары/прочность меча-ингредиента не восстанавливаются; /give в survival неотличим от крафта (для тестов — креатив или /andrew:websword give). Добавляется приёмочный тест на возврат. Закрывает CTR-003.





## Q-009 cooldown-persistence = сохранять между выходом и входом (decision-q-009-cooldown-persistence-sohranyat-mezhdu-vyho)

_Decided: 2026-09-21_


Решение (автопилот): cooldown хранится как dynamic property игрока — момент окончания в тиках мира (world.getAbsoluteTime), переживает reconnect и рестарт. Reconnect не даёт преимущества (C-7).





## Q-010 main-hand-off-hand-priority = отложено (decision-q-010-main-hand-off-hand-priority-otlozheno)

_Decided: 2026-09-21_


Решение (автопилот): правило приоритета рук из §8 не реализуется в v1 (один легендарный предмет). Сохраняется шов ability-key (ADR-007), чтобы добавить позже.





## Q-011 cube-geometry = 27 клеток, центр — соседняя с гранью попадания (decision-q-011-cube-geometry-27-kletok-tsentr-sosednyaya-)

_Decided: 2026-09-21_


Решение (автопилот): куб 3×3×3 = 27 клеток включая центр. Попадание в блок: центр — клетка, примыкающая к блоку со стороны попадания (block.face); попадание в сущность: клетка ног сущности, сущность выигрывает при равной дистанции; луч в воздух без попадания в пределах reach — нет цели: провал, cooldown не тратится. Дальность: блоки до 5, сущности до 3 (survival reach). Самозамуровывание при прицеле себе под ноги — допустимо (фича).





## Q-012 two-player-dod = GameTest с двумя SimulatedPlayer + LAN-проверка на одном iPad (decision-q-012-two-player-dod-gametest-s-dvumya-simulated)

_Decided: 2026-09-21_


Решение (автопилот): доказательство мультиплеера для скриптовой логики — GameTest на BDS с двумя симулированными игроками (гонка крафта, одинаковая паутина, retention). Живая проверка «два клиента видят одну паутину» — один iPad + симулированный игрок на LAN-сервере; настоящий второй клиент — если появится устройство, не гейт.





## Q-013 protected-blocks = закрытый список + посture «сомневаешься — пропусти» (decision-q-013-protected-blocks-zakrytyy-spisok-posture-s)

_Decided: 2026-09-21_


Решение (автопилот): защищены и пропускаются: клетки с живой сущностью не трогаются (паутина сущностей не удаляет, ставится вокруг); любой блок с инвентарём (компонент minecraft:inventory) и block entities по списку: сундук/ловушечный/эндер, бочка, шалкер, воронка, раздатчик, выбрасыватель, печи, варочная стойка, маяк, кафедра, проигрыватель, табличка, флаг, спавнер, костёр, стол зачарования, наковальня, кровать; неразрушимые и спец: bedrock, barrier, command/structure/jigsaw block, end portal + frame, nether portal, light block, reinforced deepslate; незагруженные клетки. Жидкости заменяются как обычные блоки. Всё, что не распознано как обычное — пропускается.





## Q-014 budget-after-destruction = право остаётся потраченным; сброс только командой оператора (decision-q-014-budget-after-destruction-pravo-ostaetsya-p)

_Decided: 2026-09-21_


Решение (автопилот): уничтожение единственного меча (лава, пустота, /clear) право крафта не возвращает — автоматического повторного открытия нет (дюп-путь). Операторская команда /andrew:websword reset очищает флаг мира с записью в лог сервера. Закрывает CTR-006.





## Q-015 gate-game-modes = Survival и Adventure (decision-q-015-gate-game-modes-survival-i-adventure)

_Decided: 2026-09-21_


Решение (автопилот): гейт «один крафт на мир» действует для игроков в Survival и Adventure; Creative и Spectator игнорируются (копии не удерживаются, право не тратят).





## Q-016 sword-unlootable = подтверждено как задумано (decision-q-016-sword-unlootable-podtverzhdeno-kak-zaduman)

_Decided: 2026-09-21_


Решение (автопилот): помеченный меч не выпадает при смерти владельца и не переходит по PvP — награда за первый крафт. Админ-копии origin=admin тоже удерживаются; копии из креатива — обычные предметы.





## Q-017 zero-cells = провал с локализованным сообщением, cooldown не тратится (decision-q-017-zero-cells-proval-s-lokalizovannym-soobsch)

_Decided: 2026-09-21_


Решение (автопилот): если валидная цель есть, но ни одна из 27 клеток не заменена (всё защищено/не загружено), способность считается несработавшей: cooldown не запускается, игроку в actionbar показывается локализованное «Нет места для паутины» / «No room for cobweb» (ключ в каталоге L0-item). Закрывает CTR-008.





## Resolved L0: Реестр: CTR-005 закрыт решением Q-006 (… (decision-resolve-l0)

_Decided: 2026-09-21_


Реестр: CTR-005 закрыт решением Q-006 (метка экземпляра), CTR-003 — Q-008, CTR-006 — Q-014, CTR-008 — Q-017; CTR-007/009/010 приняты по ADR-016/017/018





## Resolved L0-keep-ctr006: CTR-009: принят ADR-016 — метка экземпл… (decision-resolve-l0-keep-ctr006)

_Decided: 2026-09-21_


CTR-009: принят ADR-016 — метка экземпляра: производитель L0-once (обработчик крафта), потребитель и владелец определения L0-keep (общий модуль)





## Resolved L0-once: CTR-003: вернуть ингредиенты при заблок… (decision-resolve-l0-once)

_Decided: 2026-09-21_


CTR-003: вернуть ингредиенты при заблокированном крафте (вариант a) + сообщение; CTR-006: право после уничтожения меча не возвращается, сброс только операторской командой /andrew:websword reset





## Resolved L0-qatg-ctr1: CTR-010: принято четырёхвекторное чтени… (decision-resolve-l0-qatg-ctr1)

_Decided: 2026-09-21_


CTR-010: принято четырёхвекторное чтение DoD — крафт, смерть, reconnect и рестарт





## Resolved L0-trap-ct07: CTR-007: принят ADR-017 — L0-cool даёт … (decision-resolve-l0-trap-ct07)

_Decided: 2026-09-21_


CTR-007: принят ADR-017 — L0-cool даёт read-only isReady(), L0-trap вызывает его в предикате успеха и таймер не пишет





## Resolved L0-trap-ct08: CTR-008: ноль заменённых клеток = прова… (decision-resolve-l0-trap-ct08)

_Decided: 2026-09-21_


CTR-008: ноль заменённых клеток = провал, cooldown не тратится, локализованное сообщение в actionbar





## web-sword-item-values = урон как у ванильного алмазного меча, рецепт 4 паутины + алмазный меч (decision-web-sword-item-values-uron-kak-u-vanilnogo-almaz)

_Decided: 2026-09-21_


Решение (автопилот): minecraft:damage берётся из ванильного определения diamond_sword текущей версии BDS (проверить в пакете сервера при реализации, не гадать); прочности нет; enchantable slot=sword; menu_category equipment, группа мечей. Рецепт shaped: [ ,web, ] / [web,diamond_sword,web] / [ ,web, ] — меч-ингредиент любой прочности/чар, чары не переносятся. Объявление первого крафта: ключ RU/EN с именем оружия и ником игрока (player.name).





## legendary-hand-priority = реализуем сейчас, основная рука в приоритете (decision-legendary-hand-priority-realizuem-seychas-osnovn)

_Decided: 2026-09-24_


Решение (автопилот): правило приоритета рук из спеки Косы §6 реализуется в каркасе и отменяет отсрочку decision-q-010 (она принималась, когда легендарное оружие было одно). Если оба легендарных предмета готовы — срабатывает предмет основной руки; если основная рука на кулдауне ИЛИ занята (например, летит залп Косы) — может сработать готовая способность второй руки.





## legendary-ready-hud = «Готово» показывается постоянно, пока предмет в руке, у обоих оружий (decision-legendary-ready-hud-gotovo-pokazyvaetsya-postoya)

_Decided: 2026-09-24_


Решение (автопилот, вариант (a) из Q-L0-1): пока легендарный предмет в основной или второй руке, Action Bar показывает либо остаток кулдауна, либо «Готово» / «Ready» — непрерывно, а не один раз. Паутинный меч меняет поведение с версии 0.3.x ради единообразия: два оружия с разной индикацией путают игрока сильнее, чем изменение привычки.





## legendary-rules = общие для всех легендарных, включая возврат из Бездны, применяются и к Паутинному мечу (decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk)

_Decided: 2026-09-24_


Решение (автопилот, вариант (a) из ASM-lgnd-01): общий свод правил легендарного оружия — один survival-крафт на мир, объявление, освобождение креатива и /give, сохранение при смерти, бесконечная прочность, кулдаун 30 с с Action Bar, приоритет основной руки — плюс новое: предмет не теряется безвозвратно. Физической неуязвимости стабильный API не даёт, поэтому реализация такая: при уничтожении (Бездна, лава, огонь, кактус, деспаун) предмет выдаётся обратно последнему владельцу по тем же правилам, что и после смерти. Право крафта при этом НЕ открывается заново (см. decision-q-014). Применяется ретроактивно к Паутинному мечу: иначе единственный в мире меч можно уронить в Бездну навсегда.





## Resolved cool-ctr3: Приоритет рук реализуется сейчас; отсро… (decision-resolve-cool-ctr3)

_Decided: 2026-09-24_


Приоритет рук реализуется сейчас; отсрочка Q-010 отменена





## Resolved L0-sprj-cx02: Летальная ветка: при hp-3<=0 добивание … (decision-resolve-l0-sprj-cx02)

_Decided: 2026-09-24_


Летальная ветка: при hp-3<=0 добивание applyDamage с перебором (hp+100) от владельца — броня его не гасит, засчёт убийства и тотем работают





## Resolved L0-xcx3: Различие в показе Ready снято: принят н… (decision-resolve-l0-xcx3)

_Decided: 2026-09-24_


Различие в показе Ready снято: принят непрерывный режим для обоих оружий





## scythe-enchantments = слот sword (decision-scythe-enchantments-slot-sword)

_Decided: 2026-09-24_


Решение (автопилот): minecraft:enchantable slot=sword, хотя база предмета — алмазная мотыга. Обоснование: спека §1 требует урона как у незеритового меча и разрешает совместимые чары базового предмета «если они не конфликтуют с механикой»; боевое назначение делает осмысленными именно мечевые чары (Sharpness, Unbreaking), а мотыжные к бою отношения не имеют. Закрывает CTR-2.





## scythe-hidden-target = dynamic property andrew:hidden_until, ваниль-невидимость целью остаётся (decision-scythe-hidden-target-dynamic-property-andrew-hid)

_Decided: 2026-09-24_


Решение (автопилот): предикат isHiddenFromTargeting(player) читает dynamic property игрока andrew:hidden_until (метка времени Date.now(), тот же часовой механизм, что у кулдауна). Пока Теневого клинка нет, свойство никто не ставит, кроме тестовой команды. Обычная ванильная невидимость (зелье) цель НЕ исключает — иначе дешёвое зелье становится контрой легендарному оружию, чего спека не просит. Когда появится спека Теневого клинка, меняется только тело предиката.





## scythe-launch = applyKnockback с калиброванной вертикальной силой (decision-scythe-launch-applyknockback-s-kalibrovannoy-ver)

_Decided: 2026-09-24_


Решение (автопилот): подброс примерно на 10 блоков (допуск 8–12 на ровной земле) делается одним player.applyKnockback({x:0,z:0}, V). Константу V подобрать замером на BDS 1.26.51.1 — GameTest логирует пиковый location.y симулированного игрока, старт от 2.5. Сопротивление отбрасыванию (незеритовая броня) не компенсируем: бронированная цель летит ниже, это честно. Урон от падения — ванильный.





## scythe-melee-damage = 8, проверяется замером против настоящего незеритового меча (decision-scythe-melee-damage-8-proveryaetsya-zamerom-prot)

_Decided: 2026-09-24_


Решение (автопилот): minecraft:damage 8 (на один выше алмазного меча, у которого 7 и который замером даёт ровно 8 итогового урона). Значение не принимается на веру: GameTest бьёт корову нашей Косой и ванильным незеритовым мечом в одном прогоне и сравнивает — как сделано для Паутинного меча.





## scythe-projectiles = виртуальные, без сущностей, рисуются частицами (decision-scythe-projectiles-virtualnye-bez-suschnostey-ri)

_Decided: 2026-09-24_


Решение (автопилот): три снаряда не являются сущностями. Позиция каждого ведётся в скрипте, каждый тик рисуется частицами (визуал в духе Shulker Bullet), попадание определяется по расстоянию до цели. Отсюда бесплатно получаются требования спеки: проход сквозь любые блоки без их разрушения и отсутствие зависших сущностей при выходе игрока, смерти или смене измерения. Запуск с интервалом ~0.5 с, скорость выше бега, время жизни ~10 с; истечение при >=1 попадании — полный кулдаун, при 0 попаданий — как выход из радиуса, кулдаун не тратится.





## scythe-true-damage = прямое уменьшение здоровья, добивание через applyDamage (decision-scythe-true-damage-pryamoe-umenshenie-zdorovya-d)

_Decided: 2026-09-24_


Решение оператора (автопилот, 2026-09-24): каждое попадание снаряда Косы снимает ровно 3 HP в обход брони и защитных чар. Механизм: hp = health.currentValue; если hp - 3 > 0 — health.setCurrentValue(hp - 3) (броня и Protection на прямую запись не влияют); если hp - 3 <= 0 — добивание через entity.applyDamage(hp + 100, { cause: EntityDamageCause.entityAttack, damagingEntity: владелец }), чтобы сработали сообщение о смерти, засчёт убийства владельцу и тотем бессмертия — броня такой перебор не погасит. Закрывает CX-sprj-02 (ADR-022 lethal branch).





## scythe-targets-mobs = мобы тоже цели, игрок в приоритете (decision-scythe-targets-mobs-moby-tozhe-tseli-igrok-v-pri)

_Decided: 2026-09-25_


Решение оператора 2026-09-25: «коса бедствия должна действовать на мобов тоже». Отменяет требование спеки §3 «Мобы не являются целями способности», приёмочный тест 2 и запись в границах проекта «Scythe: mobs as targets — out of scope».
Как реализовано: кандидатами становятся все живые сущности в тех же 20 блоках (признак — наличие компонента здоровья, он же отсекает стрелы, выпавшие предметы и шарики опыта) плюс игроки. Вся механика ниже по потоку — луч видимости, тай-брейк по взгляду, три снаряда, 3 HP чистого урона, подброс, радиус преследования, кулдаун — не менялась.
Приоритет: игрок побеждает любого моба в радиусе, как бы близко моб ни стоял. Иначе случайный зомби перехватывал бы залп, предназначенный противнику. Это один ключ сортировки в чистых правилах — если оператор захочет «побеждает ближайший, кто бы это ни был», меняется одна строка.
Сообщение о промахе изменено по смыслу: «Здесь нет игрока» → «Здесь нет цели» (There is no target here). Скрытность (Shadow Blade) по-прежнему только про игроков.
Замерено на BDS 1.26.51.1: игрок + более близкая корова → выбран игрок; в одиночку с коровой → выбрана корова, здоровье 10 → 7; только скрытый игрок → цели нет, кулдаун не тронут.





## AD-wrdn-01 (L0-wrdn-ad01) подтверждено: ванильная таблица chests/ancient_city работает (зонд strf-p006, Q4) (decision-ad-wrdn-01-l0-wrdn-ad01-podtverzhdeno-vanilnaya-)

_Decided: 2026-09-26_


Узел L0-wrdn-ad01. Решение (все 10 сундуков Мини-Города Стража — ванильная таблица Ancient City) подтверждено измерением. Основание — docs/structures/probe-results.md, пункт Q4, новое измерение после исправления ошибки координат в зонде: dimension.runCommand('loot insert x y z loot "chests/ancient_city"') дважды заполнил сундук разным ванильным содержимым. Движок принимает голый id в кавычках, без loot_tables/ и без .json. В полный сундук команда возвращает successCount=1, но ничего не кладёт, поэтому заполнение проверяется по содержимому контейнера. Первый вывод FAIL из PRB-LOOT-01-AA ложный и отозван.





## ADR-bast-02 (L0-bast-ad02) подтверждено: ванильные bastion_treasure / bastion_other работают (зонд strf-p006, Q4) (decision-adr-bast-02-l0-bast-ad02-podtverzhdeno-vanilnye-)

_Decided: 2026-09-26_


Узел L0-bast-ad02. Решение (сундуки Мини-Бастиона — ванильные таблицы Bastion Remnant: treasure для 3 центральных, other для 7 внешних) подтверждено измерением. Основание — docs/structures/probe-results.md, пункт Q4, новое измерение: loot insert … loot "chests/bastion_treasure" и "chests/bastion_other" через dimension.runCommand дважды дали разное ванильное содержимое (netherite_ingot и netherite_upgrade_smithing_template в treasure). Переход на нашу взвешенную таблицу, предложенный по ложному FAIL первого прогона, отменён.





## ADR L0-adr-strc = accepted: генерация скриптом при обнаружении чанка (зонд strf-p006, Q2/Q7/Q9/Q10) (decision-adr-l0-adr-strc-accepted-generatsiya-skriptom-pr)

_Decided: 2026-09-26_


Узел L0-adr-strc. Статус меняется с proposed на accepted. Основание — docs/structures/probe-results.md. Q9 PASS: dimension.isChunkLoaded есть в 2.10.0 и 0 раз расходится с getBlock; в незагруженном чанке getBlock=undefined, а getTopmostBlock/setBlockType бросают LocationInUnloadedChunkError. Поэтому валидация (шаг 3) сначала вызывает isChunkLoaded, потом getTopmostBlock. Q7 PASS: place 35×30×35 = 38 мс (каждая клетка меняется) / 23 мс, 64 getBlock = 0,560 мс — укладывается в тик. Q2 PASS: поворот и начало координат верны. Q10: fillBlocks работает через границы чанков, но берёт не больше 32 768 клеток за вызов; объёмы больше режутся на куски — это деталь реализации, схему она не меняет.





## ADR L0-adr-strs = accepted с оговоркой Q5 (зонд strf-p006, Q5/Q6/Q8) (decision-adr-l0-adr-strs-accepted-s-ogovorkoy-q5-zond-str)

_Decided: 2026-09-26_


Узел L0-adr-strs. Статус ADR (разреженный реестр; стражи по тегу и имени) меняется с proposed на accepted. Основание — docs/structures/probe-results.md. Q8: предел ключа 32 767 байт, записи региона помещаются. Q5 (bds:check, разгрузка + рестарт): выжили 10/10 именованных зомби-жителей, имена сохранили 10/10; контрольная группа без имени — тоже 10/10. Без игрока онлайн ничто не исчезает, поэтому доказана сохранность через разгрузку и перезапуск, а не то, что nameTag защищает от исчезновения по расстоянию. Эта часть остаётся предположением, её закрывает приёмочный тест Мельницы с игроком; запасной путь — список id стражей в динамическом свойстве мира и досоздание при загрузке чанка. Q6: бесконечная fire_resistance через runCommand держит ОЗ 20→20 в полдень (у контрольного 19→4) и переживает рестарт на 20/20. Вылеченный житель теряет эффект и тег, но сохраняет имя — именно этого требуют L0-wind-r005 и AC-wind-08; запасной путь зонда (вернуть эффект и тег) отвергнут как противоречащий спеке.





## ADR L0-adr-tmpl = accepted (зонд strf-p006, Q1/Q2/Q3) (decision-adr-l0-adr-tmpl-accepted-zond-strf-p006-q1-q2-q3)

_Decided: 2026-09-26_


Узел L0-adr-tmpl. Статус ADR L0-adr-tmpl (шаблоны .mcstructure генерируются Node-скриптом из исходников в репо) меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункты Q1, Q2, Q3 (BDS 1.26.51.1, прогон 2026-09-26, артефакт .ai/verify/PRB-REPORT-01-AA/6.json). Q1 PASS: после structureManager.place сундуки остались сундуками с инвентарём, mob_spawner с EntityIdentifier выдал minecraft:zombie за 40 тиков. Q2 PASS: состояния (cardinal_direction, direction двери, weirdo_direction ступени, can_summon) и позиции верны при 0/90/180/270, а начало координат — минимальный угол. Q3 PASS: визгун с can_summon=true из шаблона вызвал Хранителя после 4 визгов (тик 694). Поправка: регистрацию пакетной структуры проверять через structureManager.get(id), потому что getPackStructureIds() пакетных структур не видит.





## ADR L0-wind-ad01 = accepted с оговоркой о размере области (зонд strf-p006, Q9/Q11) (decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-)

_Decided: 2026-09-26_


Узел L0-wind-ad01. Статус (поиск места для Мельницы у спавна через временные ticking area) меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункты Q11 и Q9. Q11 PASS: runCommand('tickingarea add circle … 2') в 500 блоках в мире без игрока загружает чанк за 17–19 тиков (759–853 мс), remove разгружает за 1 тик, предел — 10 областей (11-я: successCount=0). Q9: в мире без игрока не загружено ничего, спавн тоже, так что без ticking area поиск невозможен. Оговорка: предел одной области в 100 чанков (L0-wind-as11) зонд не мерил — проверен только круг радиуса 2 (5×5 чанков). Окно поиска не должно превышать проверенного размера, пока тело Мельницы не измерит его само.





## ADR-strf-01 (L0-strf-d001) = accepted: детерминированные броски + битсет (зонд strf-p006, Q8) (decision-adr-strf-01-l0-strf-d001-accepted-determinirovan)

_Decided: 2026-09-26_


Узел L0-strf-d001. Статус ADR-strf-01 меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункт Q8 PASS (GameTest andrew:probe_dynamic_property_budget): одна строка динамического свойства — до 32 767 байт UTF-8 (32 767 ASCII / 16 383 кириллических символов, 32 768 → ArgumentOutOfBoundsError). Всего 1024 ключа × 32 767 = 33 574 826 байт записались без ошибки и без предупреждения движка. Битсет региона 32×32 чанка (128 байт) и компактные записи экземпляров укладываются с большим запасом.





## ADR-strf-02 (L0-strf-d002) = accepted: спавнеры — ванильные блок-сущности из шаблона (зонд strf-p006, Q1) (decision-adr-strf-02-l0-strf-d002-accepted-spavnery-vanil)

_Decided: 2026-09-26_


Узел L0-strf-d002. Статус ADR-strf-02 меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункт Q1 PASS (GameTest andrew:probe_place_block_entities): mob_spawner с EntityIdentifier=minecraft:zombie из .mcstructure после place остаётся mob_spawner и выдаёт зомби за 40 тиков (2 с), а в контрольной коробке мобов нет. Запасной путь (скриптовый псевдо-спавнер) не нужен и не реализуется.





## L0-airs-cx01 загрузка чанков кольца привязанного Дирижабля = временная область загрузки, но кольцо не расширяется и рельеф не правится (decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno)

_Decided: 2026-09-26_


Противоречие: привязанный к Мельнице Дирижабль ищется в кольце 40-100 блоков, но чанки там могут быть не загружены, а правило L0-airs-r004 запрещает 'форсировать размещение любой ценой' — в отличие от поиска Мельницы у спавна, где загрузка принудительная.
Решение: **загружать чанки кольца временной ticking area можно**, расширять кольцо и править рельеф — нельзя.
Обоснование, почему это не нарушает правило. 'Не форсировать' в L0-airs-r004 означает две конкретные вещи, названные там же: не расширять поиск за 100 блоков и не готовить площадку насильно, как это делает Мельница у спавна. Загрузка чанка — не то и не другое: она не меняет ни одного блока и не двигает границы поиска, она лишь даёт прочитать то, что в мире уже есть. Без неё привязанный Дирижабль не появился бы почти никогда: кольцо 40-100 блоков это до 7 чанков от центра, а вокруг только что поставленной Мельницы загружено заметно меньше — зонд измерил, что вокруг игрока держится около 4 чанков. То есть механика, прямо предусмотренная спекой (§5.6, у каждой Мельницы свой Дирижабль в 40-100 блоках), молча не работала бы в игре.
Ограничения, которые остаются в силе: 1. Область загрузки временная: добавил, дождался, снял. Предел движка измерен зондом — 10 областей одновременно, и сорить ими нельзя. 2. Кольцо 40-100 не расширяется ни при каких условиях. Не нашлось места — привязанного Дирижабля у этой Мельницы нет, и это нормальный исход. 3. Рельеф не правится никогда. Асимметрия с Мельницей у спавна сохранена намеренно: там выравнивание разрешено спекой, здесь нет. 4. Попытка одна на экземпляр Мельницы, по флагу linkedTried в её записи. 5. Если чанки кольца не удалось загрузить (например исчерпан предел областей), кандидат уходит в pending механизмом каркаса, а не теряется и не считается провалившейся попыткой.
Target: L0-airs-cx01.





## L0-xcx6 единственный источник правды по генерации/хранению/луту = strf и loot; пересказы в wrdn и bast недействительны (decision-l0-xcx6-edinstvennyy-istochnik-pravdy-po-generat)

_Decided: 2026-09-26_


Противоречие: Город Стража и Бастион пересказывают контракт структур своими словами вместо ссылок на strf-* / loot-*, и пересказ уже разошёлся с оригиналом.
Решение: strf и loot — единственный источник правды по генерации, хранению состояния и луту. Любая формулировка в wrdn или bast, расходящаяся с ними, недействительна. Конкретно объявляю недействительными:
1. bast-ad01 — утверждает, что генерация вешается на события генерации мира / загрузки чанка. Такого события в стабильном API нет вообще (L0-adr-strc, strf-p001). Обход идёт от позиции игрока с троттлингом. Это самый опасный пересказ из всех: агент, реализующий Бастион по этому узлу, пошёл бы искать несуществующее событие. 2. bast-as03 — вводит собственную метку экземпляра (динамическое свойство или тег блока/сущности) и тем создаёт второй источник правды для «уже инициализировано», конкурирующий с единым реестром по регионам (strf-r008, L0-adr-strs). Нарушает C-7. 3. bast-p001 шаг 2 — верен, но упускает отложенное состояние pending (strf-r002 §2, strf-r007). 4. Ссылки bast на несуществующих соседей L0-mill и L0-arsh читать как L0-wind и L0-airs. 5. wrdn-ad02 считает L0-xcx4 открытым; он закрыт в этом же прогоне через strf-p005 и L0-adr-spwn.
Зависимости от зонда, которые wrdn и bast не назвали сами: wrdn зависит от пунктов 1, 2, 3, 4; bast — от 1, 2, 4, 5. Кроссворк в L0-adr-body.
Порядок действий: запускаю analyze --incremental, чтобы пересказы в узлах заменились ссылками — потому что агенты-исполнители читают узлы KV, а не этот чат, и оставленный пересказ про несуществующее событие сработал бы как инструкция. Плюс те же поправки дублирую в описания карточек. Target: L0-xcx6.





## L0-xcx7 канал доказательства у каждого критерия структур = внешность на iPad, всё остальное на BDS (decision-l0-xcx7-kanal-dokazatelstva-u-kazhdogo-kriteriya)

_Decided: 2026-09-26_


Противоречие: критерии приёмки структур 14-59 разделены по каналам только у Мельницы (14 bds + 4 ipad). У Дирижабля (8), Города Стража (10) и Бастиона (9) канал не указан вообще, хотя часть из них заведомо только для глаз: «выглядит современно», «читается как Древний город», «читается как Бастион», «почти полностью темно».
Решение: принимаю промежуточное правило разбора как обязательное. Критерий, у которого следствие говорит о внешности, узнаваемости, освещении, настроении или «читается как», имеет канал ipad. Всё остальное — bds. Разделение проставляется при планировании, в карточках задач, и без канала ни один критерий структур в план не попадает.
Почему это не мелочь: без канала оркестратор при мерже эпика помечает проверенным визуальный критерий на основании зелёного счётчика блоков. Это не гипотеза — это уже случалось дважды на этом проекте (DEMO-S2-AA и DEMO-S3-AA), оба раза пришлось возвращать критерии в открытое состояние вручную. C-6 и C-9 это прямо запрещают.
Практическое следствие для оператора: глазами на iPad ему придётся смотреть только на внешность — что постройка похожа на то, чем должна быть. Всё счётное (сколько сундуков, где спавнеры, какие состояния блоков, статистика шанса) доказывается движком без него. Target: L0-xcx7.





## L0-xq2 плотность структур = шансы на чанк ровно как в спеке, одной конфигурационной таблицей (decision-l0-xq2-plotnost-struktur-shansy-na-chank-rovno-k)

_Decided: 2026-09-26_


Вопрос: 1% Мельница / 2% Дирижабль / 5% Город Стража / 5% Бастион — это правда на чанк, или имелось в виду «на подходящий регион»?
Решение (автопилот, default CAN_ASSUME): реализуем ровно как написано — на чанк. Все четыре числа живут константами в одной конфигурационной таблице strf; статистические тесты меряют против этих же констант, а не против зашитых чисел. Смена любого шанса = правка одной строки.
Обоснование: спека говорит именно это. Домыслить «на регион» вместо написанного — подмена требования, а не его уточнение.
Важное следствие, которое оператор обязан знать (посчитано разбором, а не на глаз): при 5% на чанк мини-Город Стража с пятном 30x30 выходит примерно один на 20 чанков — один на ~72 блока. Игрок, прошедший 1000 блоков Обычного мира, минует 10-15 городов. Это не редкое сокровище, это обои; ванильные Древние города несравнимо реже. Дирижабль при 2% — один на ~113 блоков, и это сверх одного привязанного к каждой Мельнице. Вдобавок при такой плотности соседние кандидаты часто сталкиваются пятнами, поэтому фактическая плотность будет ниже заявленной и неровной — то есть числа не дадут даже того, что обещают.
Влияние: ответ оператора после первой прогулки по готовому миру стоит одну правку конфига, а не переделку. Target: L0-xq2.





## L0-xq3 возврат потерянного оружия = крафтившему, как сейчас в коде (decision-l0-xq3-vozvrat-poteryannogo-oruzhiya-kraftivshem)

_Decided: 2026-09-26_


Вопрос: когда легендарное оружие пропало (Пустота, лава, despawn), кому оно возвращается — тому, кто его скрафтил, или тому, кто держал его последним? Обе спеки говорят «последнему владельцу», код возвращает крафтившему.
Решение (автопилот, default): оставляем текущее поведение — возврат крафтившему.
Обоснование: этапы 2 и 3 отгружены и только что приняты оператором глазами на iPad. Менять принятое поведение отгруженного оружия по своей инициативе внутри эпика про структуры — расширение рамок задачи, а не её исполнение. Расхождение со спекой при этом настоящее и я его не прячу: по букве спеки прав вариант «последнему державшему».
Переключение стоит недорого: это одна точка в общем каркасе src/legendary/recovery.ts, и оба оружия меняются одинаково. Предлагается оператору как отдельная мелкая доработка, когда он захочет — не как часть Stage 4.
Связано: L0-lgnd-cx09 (в коде возврат идёт владельцу, а не последнему державшему, и без защиты от повторного возврата — вторая половина этого противоречия, защита от повторного возврата, дефект настоящий и его я проверю измерением отдельно). Target: L0-xq3.





## L0-xq4 Мельница у спавна без сухой земли = мира без неё, с записью причины в лог (decision-l0-xq4-melnitsa-u-spavna-bez-suhoy-zemli-mira-be)

_Decided: 2026-09-26_


Вопрос: спека требует гарантированную Мельницу у спавна на сухой земле. Что делать на сиде, где рядом со спавном сухого места нет — остров или посреди океана?
Решение (автопилот, default (a)): в таком мире Мельницы у спавна нет, а серверный лог пишет, почему именно — сколько мест проверено и чем каждое не подошло. Поиск остаётся одноразовым, в радиусе 500 блоков, и не расширяется.
Обоснование: два других варианта каждый платит чем-то настоящим. Досыпать мелководье (до ~3 блоков) — это правка рельефа у самого спавна, а спека отдельным правилом требует не вредить чужим структурам, и цена ошибки здесь максимальная: это место, куда игрок попадает первым и всегда. Искать дальше 500 блоков — это задержка при первом создании мира, то есть плата в каждом нормальном мире за редкий случай.
Вариант (a) не ломает ничего и остаётся наблюдаемым: причина в логе, а не молчаливое отсутствие.
Чего это стоит и я этого не скрываю: на океанском старте обещание «Мельница всегда рядом со спавном» не выполняется. Если оператор захочет держать обещание любой ценой — это вариант (b), досыпка мелководья, и он небольшой. Решается его словом, не моим.
Влияние: L0-adr-spwn (одноразовый поиск у спавна) и через него привязанный Дирижабль Мельницы — на таком сиде не будет и его. Нормальные сиды не затронуты, тесты идут на нормальных сидах. Target: L0-xq4.





## Дирижабль удлиняется против размера в спеке ради узнаваемого силуэта (decision-dirizhabl-udlinyaetsya-protiv-razmera-v-speke-ra)

_Decided: 2026-09-27_


Проблема, увиденная глазами на отрисовке постройки (2026-09-27): Дирижабль читается как серая коробка с плоской плитой сверху, а не как дирижабль.
Причина в пропорциях, а не в отрисовке. В нынешней постройке гондола занимает 6 блоков высоты из 12, баллон тоже 6 — пополам. И гондола при этом такая же длинная и широкая, как баллон: 15x7, во всё пятно. У настоящего дирижабля оболочка составляет почти весь объём, а гондола — небольшая коробка под ней.
Корень глубже: спека требует двух несовместимых вещей одновременно. Размер задан как ≈15x7x10–12 (§5.1), а внутри гондолы должны поместиться коридор, 4 комнаты, 10 сундуков и спавнер Разорителя (§5.1, AC-airs-03, AC-airs-04). Чтобы силуэт читался, гондола обязана стать короткой и низкой — тогда начинка в неё не влезает. Нынешняя постройка разрешила спор в пользу начинки и перестала быть похожей на дирижабль.
Решение оператора 2026-09-27: **удлинить постройку** (вариант 1 из трёх предложенных) — примерно до 25–30 блоков, чтобы оболочка получила нормальную длину, а гондола осталась достаточной для четырёх комнат. Отвергнуты: сокращение начинки (потеря 4 комнат) и «оставить как есть» (потеря узнаваемости).
Цена и последствия: прямой отход от «≈15» в §5.1 — это осознанное отклонение, а не недосмотр. Точные размеры берутся из разведки пропорций настоящих дирижаблей. Затрагивает: AIRSHIP_SIZE и всю разметку шаблона, тесты размера, проверку пригодности места (большее пятно — больше чанков должно быть загружено до первой записи), а также поиск привязанного Дирижабля в кольце 40-100 от Мельницы: кольцо не меняется, но кандидатов с большим пятном будет отвергаться больше.
Как это вскрылось, и это стоит запомнить: дефект нашёлся не прогоном, а тем, что постройку **посмотрели глазами** — отрисовали из данных пакета. Ни один из 92 тестов его не видел, потому что все они считают блоки, а не смотрят на силуэт. Оператор: «Хорошо что просмотрели».





## Город Хранителя растёт вчетверо по площади, и начинка растёт вместе с ним (decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i)

_Decided: 2026-09-27_


Оператор 2026-09-27: «город расширяем в 4 раза». Принято прочтение вчетверо по площади — 62x62 в плане вместо 31x31, вдвое по каждой стороне. Отброшено: 124x124 (вчетверо по стороне) почти не находит себе ровного сухого места и проверка отвергала бы почти всех кандидатов; 49x49 (вчетверо по объёму) не даёт заметной глазом разницы.
Высота растёт с 13 до 20. Потолок по спеке прежний (верх на Y от -35 до -45), значит низ опускается к -55...-65 и дно мира -64 становится настоящей границей: место без нужной глубины должно отвергаться, а не обрезать город.
Отклонение от спеки §6: содержимое растёт пропорционально площади — 10 сундуков становятся 40 (12 из них в центральном зале вместо 3), 2 визгуна становятся 8. Причина: при вчетверо большей площади прежние числа дают вчетверо меньшую плотность, то есть пустые залы, а пустота и была тем, из-за чего оператор смотрел отрисовки. Восемь визгунов призывают Хранителя заметно быстрее двух, поэтому их разводят по дальним углам, а не собирают в центре.





## Легендарное возвращается последнему державшему, а не скрафтившему (decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavsh)

_Decided: 2026-09-29_


Спека Орбитальной §5 (самая новая из трёх) прямо говорит: оружие не привязано к создателю, передаётся другим, и при падении в Бездну возвращается ПОСЛЕДНЕМУ ДЕРЖАВШЕМУ; если он офлайн — при следующем входе. Код (src/legendary/recovery.ts) возвращает владельцу метки, то есть скрафтившему или получившему от админа; поля держателя в метке нет.
РЕШЕНИЕ: последний державший. Основания: самая новая спека выигрывает у прочтения более ранних; нынешнее поведение даёт торговый эксплойт — получивший оружие может бесплатно вернуть его дарителю, уронив в Бездну; и это же прочтение заложено в проекте L0-adr-hold.
Как: в метку добавляется поле держателя, обновляемое при переходе предмета к другому игроку. Целью возврата становится оно. Делается вместе с поколением метки и списком долгов — задача LGND-GEN-01-AA.
Отменяет: decision-l0-xq3 (2026-09-26), оставлявшее скрафтившего.





## Resolved cool-ctr1: > Подтверждено: возврат из Бездны и воз… (decision-resolve-cool-ctr1)

_Decided: 2026-09-29_


> Подтверждено: возврат из Бездны и возврат после обычного уничтожения (лава, огонь, > кактус, взрыв, деспаун) — общее правило всех легендарных, включая Паутинный меч. > Это закреплено в decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk и > decision-resolve-cool-ctr1 (обе от 2026-09-24); Orbital §5 и тест 20 говорят то же. > Реализовано в `src/legendary/recovery.ts` (ed7558b, 2026-09-24) для всех > `LEGENDARIES` (`registry.ts:57` = [WEB_SWORD, SCYTHE_OF_CALAMITY]), без отказа по > оружию. `src/websword/retention.ts` на HEAD не существует: он перенесён в > `src/legendary/retention.ts` (





## Resolved cool-ctr2: > CTR-2 (`cool-ctr2`) уже решено 2026-0… (decision-resolve-cool-ctr2)

_Decided: 2026-09-29_


> CTR-2 (`cool-ctr2`) уже решено 2026-09-24 (`decision-scythe-enchantments-slot-sword`, `decision-resolve-cool-ctr2`): `minecraft:enchantable` slot=`sword`, value 10 (`packs/behavior/items/scythe_of_calamity.json:18–21`, коммит `8a8d500`). Перемерено 2026-09-29 на BDS 1.26.51.1 / @minecraft/server 2.10.0: движок принимает на Косу sharpness, smite, bane_of_arthropods, knockback, fire_aspect, looting, unbreaking, mending, vanishing и отвергает efficiency, fortune, silk_touch — совпадение с `minecraft:netherite_sword` 12/12; `minecraft:diamond_hoe` — обратный набор по боевым и мотыжным чарам. Уда





## Resolved cool-ctr4: > CTR-4 закрыт по существу ещё 2026-09-… (decision-resolve-cool-ctr4)

_Decided: 2026-09-29_


> CTR-4 закрыт по существу ещё 2026-09-24 (`decision-resolve-cool-ctr4`); остаток — подчистка знания. Замеры на HEAD 32f4aca (2026-09-29): `minerspickaxetestspec.md:67` — 2.9.0 / 1.26.0; `stage-0-infrastructure.md:22` — 2.9.0 «при необходимости 2.10.0», `:55` — engine и BDS от версии iPad; `scripts/targets.mjs:7-9` — [1,26,50] / 2.10.0 / 1.26.51.1; `package.json:27` и `package-lock.json:472` — 2.10.0; `packs/*/manifest.json:8` — [1,26,50] (4 из 4), `:27` — 2.10.0 (3 из 3); `docker/bds/compose.yaml:20` — 1.26.51.1. `npm run validate` — ok, `tsc --noEmit` — exit 0. `git log -S2.9.0` по коду — 0





## Resolved L0-airs-cx01: > Resolved by `decision-l0-airs-cx01-za… (decision-resolve-l0-airs-cx01)

_Decided: 2026-09-29_


> Resolved by `decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno` (2026-09-26, b45fdcd) and implemented in b619e55 (AIRS-BODY-01-AA). "Once" means one attempt per Windmill instance: the Placer writes `la=true` before the hook (place.ts:207-210). Ring chunks are loaded through temporary ticking areas (pool 4, 2 at once, search-ring.ts:184-235). So no validity read touches an unloaded chunk, and the outcome does not depend on player movement. If a candidate's chunks cannot be loaded (area refused, or not loaded within 300 ticks), the attempt stays `ls=pending` and is never set to `none`.





## Resolved L0-lgnd-cx01: > CX-lgnd-01 снят решением `decision-le… (decision-resolve-l0-lgnd-cx01)

_Decided: 2026-09-29_


> CX-lgnd-01 снят решением `decision-legendary-ready-hud` (2026-09-24, вариант (a) из `L0-xq1`): «Готово» / «Ready» показывается непрерывно, пока легендарный предмет в основной или второй руке, одинаково для всех оружий. Измерения на `32f4aca`: `src/websword/cooldown.ts` удалён в `392253d` 2026-09-24; одноразовый показ существовал только в 0.3.0–0.3.2 (`37a0403:src/websword/cooldown.ts:155-156`, окно 10 тиков × 50 ms = 500 ms); `grep -rl readyMode src` = 0, `grep -rl andrew.web_sword.ready src` = 0; `src/legendary/hud.ts:53` пишет `andrew.legendary.ready` на каждом проходе (интервал 10 тиков,





## Resolved L0-lgnd-cx07: > Resolved by `L0-adr-wpn2` (accepted),… (decision-resolve-l0-lgnd-cx07)

_Decided: 2026-09-29_


> Resolved by `L0-adr-wpn2` (accepted), option (a). Re-measured 2026-09-29: > - 0.3.0–0.3.2 (`37a0403`…`2d57c52`) wrote `andrew:ws_cooldown_until` as epoch ms. > - From 0.4.0 (`dcb0bb4`, 2026-09-24 23:58), `cooldownKey` reads only >   `andrew:cd_<abilityKey>` (`registry.ts:106`); `grep ws_cooldown_until src tests scripts packs` >   finds 0 matches. > - A 0.3.x player cooling with 20 s left reads Ready after the upgrade (repro, red, >   positive control green). > - Loss is bounded by `COOLDOWN_TICKS` = 600 → one cooldown ≤ 30 000 ms, once per player. > - The 7 other `ws_*` keys are byte-identic





## Resolved L0-lgnd-cx08: Починено задачей LGND-OFFHAND-01-AA (6 … (decision-resolve-l0-lgnd-cx08)

_Decided: 2026-09-29_


Починено задачей LGND-OFFHAND-01-AA (6 критериев из 6). В JSON обоих легендарных предметов добавлен minecraft:allow_off_hand, поэтому движок теперь допускает их во вторую руку, и написанная ранее ветка приоритета рук (hands.ts, hud.ts) перестала быть мёртвой. Заодно вторую руку начали читать сохранение при смерти и гейт крафта. Ложный зелёный через setEquipment(Offhand) исключён: проверка построена так, что без компонента она красная — три красных артефакта до правки (1.red, 2.red, 3.red, все с ненулевым кодом) и четыре зелёных после, включая полный bds:gametest и bds:check на отдельном экземпляре bds-offhand.





## Resolved L0-lgnd-cx09: Починено задачей LGND-GEN-01-AA (5 крит… (decision-resolve-l0-lgnd-cx09)

_Decided: 2026-09-29_


Починено задачей LGND-GEN-01-AA (5 критериев из 5), пункты 2-3 утверждения. В метку добавлено поколение: при выдаче возвратной копии оно растёт, и уцелевшая копия становится устаревшей, поэтому незамеченный подбор больше не оставляет двух живых экземпляров. Долги хранятся списком, две потери одного офлайн-владельца больше не затирают друг друга; старое значение с одной меткой читается как список из одного. Пункт 1 (кому возвращать) решён отдельно: последнему державшему, см. decision-legendarnoe-vozvraschaetsya-poslednemu-derzhavshemu и узел L0-xcx11. Пункт 4 закрыт решением L0-adr-wpn2.





## Resolved L0-orbc-cx02: Закрыто решением decision-vvod-orbitaln… (decision-resolve-l0-orbc-cx02)

_Decided: 2026-09-29_


Закрыто решением decision-vvod-orbitalnoy-pushki: удар ловится через playerSwingStart, применение через itemUse, цель — блок события с лучом (maxDistance 10) как запасным. Посылки опровергнуты измерением: сервер дальность не режет (22/22 на всех дистанциях), playerSwingStart стабилен и приходит при ударе в пустоту, луч находит блок при 9.5 и не находит при 10.5. Маркер спекой не запрещён, а объявлен ненужным; частица добавляется только если подсветка на iPad не достанет. Остаток — наблюдение раскладки управления на устройстве — идёт критерием приёмки демо Пушки.





## Resolved L0-scyt-cx03: Вытеснено полным анализом версии 3 от 2… (decision-resolve-l0-scyt-cx03)

_Decided: 2026-09-29_


Вытеснено полным анализом версии 3 от 2026-09-29: узлы, на которые это утверждение ссылалось, перевыпущены, и их содержимое пересобрано из кода. Во frontmatter уже стояла причина replaced_by_pipeline, но формального закрытия не было. Закрывается как устаревшее; всё, что в нём было живого, разобрано заново в очереди противоречий 2026-09-29 (25 разборов) — в частности про допуск во вторую руку задачей LGND-OFFHAND-01-AA.





## Resolved L0-scyt-cx04: Вытеснено полным анализом версии 3 от 2… (decision-resolve-l0-scyt-cx04)

_Decided: 2026-09-29_


Вытеснено полным анализом версии 3 от 2026-09-29: узлы, на которые это утверждение ссылалось, перевыпущены, и их содержимое пересобрано из кода. Во frontmatter уже стояла причина replaced_by_pipeline, но формального закрытия не было. Закрывается как устаревшее; всё, что в нём было живого, разобрано заново в очереди противоречий 2026-09-29 (25 разборов) — в частности про допуск во вторую руку задачей LGND-OFFHAND-01-AA.





## Resolved L0-scyt-cx05: Вытеснено полным анализом версии 3 от 2… (decision-resolve-l0-scyt-cx05)

_Decided: 2026-09-29_


Вытеснено полным анализом версии 3 от 2026-09-29: узлы, на которые это утверждение ссылалось, перевыпущены, и их содержимое пересобрано из кода. Во frontmatter уже стояла причина replaced_by_pipeline, но формального закрытия не было. Закрывается как устаревшее; всё, что в нём было живого, разобрано заново в очереди противоречий 2026-09-29 (25 разборов) — в частности про допуск во вторую руку задачей LGND-OFFHAND-01-AA.





## Resolved L0-strf-cx01: > Resolved as built; the proposed `star… (decision-resolve-l0-strf-cx01)

_Decided: 2026-09-29_


> Resolved as built; the proposed `startStrf`/`andrew:strf_owner` handshake was never implemented > (0 matches in `src/`, `scripts/`, `tests/` at `32f4aca`) and is not needed. In the gametest world > the release pack keeps its `strf` runtime but cannot generate: (1) `EnabledTypes` has no stored set > on a fresh world, and the world is deleted before every `bds:gametest` run > (`scripts/bds-gametest.mjs:500`); `runtime.discover` returns before rolling > (`src/structures/runtime.ts:132`); the harness asserts `[andrew] structures enabled: none` and the > spawn search standing down on every run (`





## Resolved L0-strf-cx02: Принят вариант (a) с ограничением по вр… (decision-resolve-l0-strf-cx02)

_Decided: 2026-09-29_


Принят вариант (a) с ограничением по времени: для гарантированной Мельницы у спавна разрешается один ограниченный разовый проход с подгрузкой кольцами через tickingarea, не больше десяти областей разом, с их снятием после; потолок 60 секунд, по истечении — откат к варианту (b), то есть поиск по уже загруженной округе спавна и форсированная подготовка лучшего сухого места там. Любой из двух исходов записывается отклонением. Политику держит wind, strf даёт isLoaded, searchRing и помощник по областям. Основание: без подгрузки правило «ближайшее годное в 500 блоках» недостижимо в принципе, а ожидание, пока игрок дойдёт сам, ломает «гарантирована при первом запуске».





## Resolved L0-wind-cx01: Разбор CNTR-WIND-CX01-AA (2026-09-29): … (decision-resolve-l0-wind-cx01)

_Decided: 2026-09-29_


Разбор CNTR-WIND-CX01-AA (2026-09-29): свойство в коде соответствует замыслу, расхождение только в описании. Список правок знания — в docs/feedback/diagnose-CNTR-WIND-CX01-AA.md; применяется задачей KV-CLEANUP-CONTRADICTIONS-AA.





## Resolved L0-wind-cx02: > Resolved by `decision-l0-airs-cx01` (… (decision-resolve-l0-wind-cx02)

_Decided: 2026-09-29_


> Resolved by `decision-l0-airs-cx01` (2026-09-26), implemented in `b619e55`, and re-measured on 2026-09-29 against `src/` at `32f4aca` (unchanged through `250a720`). > > "Once" = one attempt per Windmill. `la=true` is written before the attempt (`place.ts:207-210`). The outcome is `ls` ∈ searching/pending/none/placed/skipped, where `none` and `placed` are terminal. > > The ring is read only after each candidate's chunks are loaded by a temporary ticking area: > - the pool has 4 names per dimension, with 2 loaded at once; > - each area covers 10–12 chunks; > - the engine's cap is 10 areas (pro





## Resolved L0-xcx11: Закрыто решением: возврат идёт последне… (decision-resolve-l0-xcx11)

_Decided: 2026-09-29_


Закрыто решением: возврат идёт последнему державшему. Самая новая спека (Орбитальная §5) выигрывает; нынешнее поведение даёт торговый эксплойт. В метку добавляется поле держателя, цель возврата меняется на него. Работа заведена задачей LGND-GEN-01-AA.





## Resolved L0-xcx12: Проверка: структуры в поставке с 1.2.0,… (decision-resolve-l0-xcx12)

_Decided: 2026-09-29_


Проверка: структуры в поставке с 1.2.0, узлы описывали их как только-анализ.





## Resolved L0-xcx13: Принято как ближайший стабильный эквива… (decision-resolve-l0-xcx13)

_Decided: 2026-09-29_


Принято как ближайший стабильный эквивалент: предмет Пушки — свой andrew:orbital_cannon, но переиспользует ванильную иконку удочки, поэтому в инвентаре неотличим. В руке рисуется спрайтом иконки, без состояний заброса и без лески — последнее спеке и не противоречит, там рыбалка выключена. Рыбалка, прочность и зачарование жёстко вшиты в minecraft:fishing_rod, поэтому «ровно ванильная удочка» и «не удочка по поведению» одновременно недостижимы; спека сама допускает ближайший стабильный эквивалент. Записано отклонением по C-16; вид в руке проверяется глазами на iPad критерием демо.





## Resolved L0-xcx14: Закрыто решением decision-vvod-orbitaln… (decision-resolve-l0-xcx14)

_Decided: 2026-09-29_


Закрыто решением decision-vvod-orbitalnoy-pushki: удар ловится через playerSwingStart, применение через itemUse, цель — блок события с лучом (maxDistance 10) как запасным. Посылки опровергнуты измерением: сервер дальность не режет (22/22 на всех дистанциях), playerSwingStart стабилен и приходит при ударе в пустоту, луч находит блок при 9.5 и не находит при 10.5. Маркер спекой не запрещён, а объявлен ненужным; частица добавляется только если подсветка на iPad не достанет. Остаток — наблюдение раскладки управления на устройстве — идёт критерием приёмки демо Пушки.





## Resolved L0-xcx5: `ai-kit refine resolve L0-xcx5 \ (decision-resolve-l0-xcx5)

_Decided: 2026-09-29_


`ai-kit refine resolve L0-xcx5 "<текст>" --outcome changed --evidence "c5a1c27, 1fb0851, af024e4 (1.2.0); .ai/verify/CNTR-XCX5-AA/2.json, 2.red.json, 3.json"`  > Замеры на fea2287 (2026-09-29), скрипт docs/feedback/diagnose-CNTR-XCX5-AA.measure.sh. > > Спека Four Structures (sha1 cfce59d…) — единственный такой источник за всю историю git; в KV — 11 фрагментов, priority 530. Ранних черновиков нет ни в git, ни в KV, ни в inbox. > > Видимая шапка «Windmill + Airship • v1» и две колонки §1 устарели. Сам файл в метаданных называет себя «Windmill, Airship, Mini Warden City, Mini Bastion — RU/EN v2».





## Resolved L0-xcx6: > L0-xcx6 was re-measured on 2026-09-29… (decision-resolve-l0-xcx6)

_Decided: 2026-09-29_


> L0-xcx6 was re-measured on 2026-09-29 against the live KV. Every point is confirmed, and the defect is wider than the claim says: > - the chunk-load-event wording is also at `bast__:21` and `bast-p001:18`; > - the own init marker has spread to `bast-p002:20,24` and `bast-ent1/2/3`; > - `wrdn-ent1`/`ent2` keep their own instance record and a `filled` flag, against `strf-r008` §4; > - "xcx4 is open" also appears at `wrdn__:61,68`. > > Zero `strf-*`/`loot-*` ids in wrdn (30 nodes) and bast (31 nodes), against 76 and 52 lines in wind and airs. > > Cause: the analyze --incremental announced by de





## Resolved L0-xcx7: > L0-xcx7 закрыт (исход 3, подчистка зн… (decision-resolve-l0-xcx7)

_Decided: 2026-09-29_


> L0-xcx7 закрыт (исход 3, подчистка знания). Перемерено 2026-09-29 скриптом `docs/feedback/diagnose-CNTR-XCX7-AA.sh` (артефакт `.ai/verify/CNTR-XCX7-AA/2.json`, 29 PASS). > - KV: `wind-ac` 17 узлов — 14 `verify:bds`, 4 `verify:ipad`. `airs-ac` 8, `wrdn-ac` 10, `bast-ac` 9 — 0 тегов канала. > - Инвариант выполнен в карточках, как велит `decision-l0-xcx7-kanal-dokazatelstva-u-kazhdogo-kriteriya` (2026-09-26). 14 задач структур — 122 критерия, тип есть у всех. Все 16 визуальных — `type:manual`, 11 из них приняты оператором (`accepted`). > - Тег канала в KV не читает ни ai-kit 3.7.5 (0 файлов), н





## Resolved L0-xcx8: Закрыто решением decision-vvod-orbitaln… (decision-resolve-l0-xcx8)

_Decided: 2026-09-29_


Закрыто решением decision-vvod-orbitalnoy-pushki: удар ловится через playerSwingStart, применение через itemUse, цель — блок события с лучом (maxDistance 10) как запасным. Посылки опровергнуты измерением: сервер дальность не режет (22/22 на всех дистанциях), playerSwingStart стабилен и приходит при ударе в пустоту, луч находит блок при 9.5 и не находит при 10.5. Маркер спекой не запрещён, а объявлен ненужным; частица добавляется только если подсветка на iPad не достанет. Остаток — наблюдение раскладки управления на устройстве — идёт критерием приёмки демо Пушки.





## Resolved L0-xcx9: Починено задачей LGND-CRAFTGATE-01-AA (… (decision-resolve-l0-xcx9)

_Decided: 2026-09-29_


Починено задачей LGND-CRAFTGATE-01-AA (5 критериев из 5). Выдача легендарного командой игроку в выживании больше не объявляется крафтом и не тратит единственный крафт мира; настоящий крафт по-прежнему тратит его ровно один раз. Доказано красной проверкой до правки (артефакт 1.red.json, код 1) и зелёной после (1.json, код 0), плюс сквозной прогон на отдельном сервере (3.json, npm test и bds:gametest, код 0).





## Ввод Орбитальной пушки: удар по playerSwingStart, применение по itemUse, цель — блок события, луч как запасной (decision-vvod-orbitalnoy-pushki-udar-po-playerswingstart-)

_Decided: 2026-09-29_


Разбор CNTR-XCX14-AA измерил движок прибором src/gametest/probe-input.ts (три GameTest, два совпавших прогона, 122 шага, артефакт .ai/verify/CNTR-XCX14-AA/2.json). Посылки утверждений L0-xcx8 и L0-xcx14 опровергнуты: сервер дальность не режет — entityHitBlock, before.playerInteractWithBlock и itemStartUseOn приходят на всех дистанциях (22/22); world.afterEvents.playerSwingStart стабилен в 2.10.0 и приходит даже при ударе в пустое небо в обоих режимах; getBlockFromViewDirection({maxDistance:10}) находит блок при грани 9.5 и не находит при 10.5.
РЕШЕНИЕ. Удар (левая кнопка) ловится через playerSwingStart, применение (правая) — через itemUse. Цель в обоих режимах: блок из события, если он есть, иначе луч взгляда с ограничением 10. Дальность 10 блоков остаётся как в спеке.
Маркер. Спека (part-1:109) говорит, что дополнительный маркер НЕ НУЖЕН, а не что он запрещён. Поэтому: штатно маркера нет; если проверка на iPad покажет, что ванильная подсветка не достаёт до 6-10 блоков, добавляется минимальная частица — это не отклонение от спеки.
Что остаётся на устройстве: наблюдение на iPad, какая раскладка управления (обычная сенсорная или с прицелом) даёт какую цель и какую предельную дальность касания. Это идёт критерием приёмки демо Пушки, а не блокирует разработку.
СЛЕДСТВИЕ: запрет на создание задач по orbc снимается.





