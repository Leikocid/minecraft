---
title: Decisions
type: analysis
generated_at: "2026-09-26T08:34:28.670Z"
source_channel: rollout
node_id: rollout-decisions
aliases: ["rollout-decisions","decisions"]
is_a: ["rollout","decisions"]
relates_to: ["decision-completion-flow-quick","decision-merge-policy-autopilot","decision-namespace-addona-andrew-asm-002-q-002","decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001","decision-verification-approach-automatic","decision-windows-pk-ne-nuzhen-q-004","decision-yazyk-skriptov-typescript-asm-003-q-003","decision-zacharovanie-bez-durability-proverit-pervoy-zada","decision-q-006-web-sword-provenance-yes-metka-ekzemplyara","decision-q-007-enchantable-without-durability-podtverzhde","decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut","decision-q-009-cooldown-persistence-sohranyat-mezhdu-vyho","decision-q-010-main-hand-off-hand-priority-otlozheno","decision-q-011-cube-geometry-27-kletok-tsentr-sosednyaya-","decision-q-012-two-player-dod-gametest-s-dvumya-simulated","decision-q-013-protected-blocks-zakrytyy-spisok-posture-s","decision-q-014-budget-after-destruction-pravo-ostaetsya-p","decision-q-015-gate-game-modes-survival-i-adventure","decision-q-016-sword-unlootable-podtverzhdeno-kak-zaduman","decision-q-017-zero-cells-proval-s-lokalizovannym-soobsch","decision-resolve-l0","decision-resolve-l0-keep-ctr006","decision-resolve-l0-once","decision-resolve-l0-qatg-ctr1","decision-resolve-l0-trap-ct07","decision-resolve-l0-trap-ct08","decision-web-sword-item-values-uron-kak-u-vanilnogo-almaz","decision-legendary-hand-priority-realizuem-seychas-osnovn","decision-legendary-ready-hud-gotovo-pokazyvaetsya-postoya","decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk","decision-resolve-cool-ctr1","decision-resolve-cool-ctr2","decision-resolve-cool-ctr3","decision-resolve-cool-ctr4","decision-resolve-l0-lgnd-cx01","decision-resolve-l0-sprj-cx02","decision-resolve-l0-xcx3","decision-scythe-enchantments-slot-sword","decision-scythe-hidden-target-dynamic-property-andrew-hid","decision-scythe-launch-applyknockback-s-kalibrovannoy-ver","decision-scythe-melee-damage-8-proveryaetsya-zamerom-prot","decision-scythe-projectiles-virtualnye-bez-suschnostey-ri","decision-scythe-true-damage-pryamoe-umenshenie-zdorovya-d","decision-scythe-targets-mobs-moby-tozhe-tseli-igrok-v-pri"]
priority: 530
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





## Resolved cool-ctr1: Возврат из Бездны и невозможность безво… (decision-resolve-cool-ctr1)

_Decided: 2026-09-24_


Возврат из Бездны и невозможность безвозвратной потери распространяются и на Паутинный меч





## Resolved cool-ctr2: Коса на базе мотыги получает мечевые ча… (decision-resolve-cool-ctr2)

_Decided: 2026-09-24_


Коса на базе мотыги получает мечевые чары (slot=sword)





## Resolved cool-ctr3: Приоритет рук реализуется сейчас; отсро… (decision-resolve-cool-ctr3)

_Decided: 2026-09-24_


Приоритет рук реализуется сейчас; отсрочка Q-010 отменена





## Resolved cool-ctr4: Целевые версии закреплены decision-tsel… (decision-resolve-cool-ctr4)

_Decided: 2026-09-24_


Целевые версии закреплены decision-tselevaya-versiya-bedrock и scripts/targets.mjs; сырая спека устарела





## Resolved L0-lgnd-cx01: HUD: «Готово» показывается непрерывно, … (decision-resolve-l0-lgnd-cx01)

_Decided: 2026-09-24_


HUD: «Готово» показывается непрерывно, пока предмет в руке, одинаково для обоих оружий





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





