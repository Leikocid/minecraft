---
title: Decisions
type: analysis
generated_at: "2026-09-21T21:27:44.659Z"
source_channel: rollout
node_id: rollout-decisions
aliases: ["rollout-decisions","decisions"]
is_a: ["rollout","decisions"]
relates_to: ["decision-completion-flow-quick","decision-merge-policy-autopilot","decision-namespace-addona-andrew-asm-002-q-002","decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001","decision-verification-approach-automatic","decision-windows-pk-ne-nuzhen-q-004","decision-yazyk-skriptov-typescript-asm-003-q-003","decision-zacharovanie-bez-durability-proverit-pervoy-zada","decision-q-006-web-sword-provenance-yes-metka-ekzemplyara","decision-q-007-enchantable-without-durability-podtverzhde","decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut","decision-q-009-cooldown-persistence-sohranyat-mezhdu-vyho","decision-q-010-main-hand-off-hand-priority-otlozheno","decision-q-011-cube-geometry-27-kletok-tsentr-sosednyaya-","decision-q-012-two-player-dod-gametest-s-dvumya-simulated","decision-q-013-protected-blocks-zakrytyy-spisok-posture-s","decision-q-014-budget-after-destruction-pravo-ostaetsya-p","decision-q-015-gate-game-modes-survival-i-adventure","decision-q-016-sword-unlootable-podtverzhdeno-kak-zaduman","decision-q-017-zero-cells-proval-s-lokalizovannym-soobsch","decision-resolve-l0","decision-web-sword-item-values-uron-kak-u-vanilnogo-almaz"]
priority: 510
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





## Resolved L0: CTR-001: версия зафиксирована по устрой… (decision-resolve-l0)

_Decided: 2026-09-21_


Реестр: CTR-005 закрыт решением Q-006 (метка экземпляра), CTR-003 — Q-008, CTR-006 — Q-014, CTR-008 — Q-017; CTR-007/009/010 приняты по ADR-016/017/018





## web-sword-item-values = урон как у ванильного алмазного меча, рецепт 4 паутины + алмазный меч (decision-web-sword-item-values-uron-kak-u-vanilnogo-almaz)

_Decided: 2026-09-21_


Решение (автопилот): minecraft:damage берётся из ванильного определения diamond_sword текущей версии BDS (проверить в пакете сервера при реализации, не гадать); прочности нет; enchantable slot=sword; menu_category equipment, группа мечей. Рецепт shaped: [ ,web, ] / [web,diamond_sword,web] / [ ,web, ] — меч-ингредиент любой прочности/чар, чары не переносятся. Объявление первого крафта: ключ RU/EN с именем оружия и ником игрока (player.name).





