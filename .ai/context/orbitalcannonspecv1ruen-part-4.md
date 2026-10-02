---
type: "raw-fragment"
node_id: "orbitalcannonspecv1ruen-part-4"
source_channel: "raw-import"
level: null
aliases: ["orbitalcannonspecv1ruen-part-4", "orbitalcannonspecv1ruen"]
is_a: ["raw-fragment"]
priority: 560
size_chars: 2598
tags: ["digest", "performance", "architecture", "domain"]
source: "docs/Orbital_Cannon_Spec_v1_RU_EN.docx"
embed_lines: "239-284"
embed_slice: "5-50"
---
7.  LMB removes an approximately 5×5 irregular vertical column to the bottom while preserving liquids and Survival-unbreakable blocks.

8.  LMB removes Obsidian and destructible containers/spawners with no ordinary drops.

9.  LMB causes no direct entity damage; environmental consequences still work.

10. LMB destruction is immediate; particle wave lasts about 1 second; only one main explosion sound.

11. RMB creates five continuous rings with approximate diameters 1/7/14/21/28.

12. RMB charges are independent from each other and each produces its own explosion sound.

13. RMB entity damage behaves like normal TNT, including self-damage to owner.

14. RMB block destruction follows TNT resistance, produces no block drops, and creates no fire.

15. Underwater RMB preserves terrain but still damages entities.

16. Shared 30-second cooldown starts immediately on successful use and blocks both modes.

17. Multiple cheated/Creative copies on one player share that player\'s cooldown; different players have independent cooldowns.

18. Owner death/logout/dimension change after firing does not cancel loaded-area charges.

19. Chunk unload/server shutdown may discard in-flight charges without refunding cooldown.

20. Orbital Cannon and all legendary weapons survive death and ordinary destruction; Void return works without duplication.

# 15. Definition of Done

- Импортируется в актуальную стабильную Minecraft Bedrock без обязательного включения Preview/Beta Experiments, если это технически возможно.

- Предмет доступен в Creative и /give, имеет правильный рецепт и уникальный Survival craft state.

- Оба режима работают в Overworld, Nether и End согласно правилам выше.

- Кулдаун, Action Bar, смерть/передача и сохранение состояния протестированы минимум с двумя игроками.

- Нет очевидного способа дублировать легендарный предмет через смерть, контейнер, Void, logout/rejoin или одновременные действия.

- Массовый ПКМ не вызывает неконтролируемое размножение сущностей/дропа; после завершения атаки временные объекты очищаются.

- Все известные ограничения Bedrock API задокументированы рядом с реализацией.

# 16. Приоритеты агента / Agent priorities

При конфликте между визуальной точностью и стабильностью приоритет: (1) отсутствие дюпов и повреждения сохранения мира, (2) корректная игровая механика, (3) мультиплеерная синхронизация и производительность, (4) визуальная точность.

If visual fidelity conflicts with stability, prioritize: (1) no duplication/save corruption, (2) correct gameplay behavior, (3) multiplayer synchronization/performance, (4) visual fidelity.
