---
type: "raw-fragment"
node_id: "orbitalcannonspecv1ruen-part-3"
source_channel: "raw-import"
level: null
aliases: ["orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen"]
is_a: ["raw-fragment"]
priority: 540
size_chars: 4821
tags: ["digest", "performance"]
source: "docs/Orbital_Cannon_Spec_v1_RU_EN.docx"
embed_lines: "165-239"
embed_slice: "9-83"
---
- Примерные диаметры колец: 1, 5, 10, 15 и 20 блоков. Диаметр 1 означает центральный TNT точно над выбранным блоком.

- TNT располагаются максимально непрерывно по окружностям без специально оставленных промежутков. Реализация окружности может быть дискретной по блочной сетке.

- Все заряды создаются одновременно на соответствующей высоте измерения и начинают падать одновременно.

- Каждый TNT независим: соседние взрывы не должны отбрасывать, уничтожать или менять траекторию остальных зарядов.

- Если конкретный TNT создаётся внутри твёрдого блока, он взрывается сразу. Если в воздухе --- падает до первого блока.

- Из-за разной высоты рельефа фактическое время отдельных взрывов может немного отличаться.

- Каждый TNT имеет обычный визуальный размер TNT и собственный звук взрыва.

- Взрыв наносит игрокам и мобам обычный TNT-урон, включая владельца Орбитальной пушки.

- Разрушение блоков соответствует обычной способности TNT разрушать конкретные блоки. Например, TNT-устойчивые блоки не должны специально пробиваться ПКМ.

- Блоки, которые взрыв разрушил, исчезают БЕЗ предметного дропа.

- ПКМ не создаёт огонь.

- Под водой взрыв не деформирует/не разрушает блоки, но продолжает наносить сущностям обычный TNT-урон.

- Легендарные оружия не могут быть уничтожены взрывами ПКМ.

# 11. Жизненный цикл атаки / Attack lifecycle

- После успешного запуска атака не зависит от владельца: смерть, смена предмета, выход игрока или переход владельца в другое измерение не отменяют уже выпущенные заряды.

- Заряды продолжают работать в том измерении, где были запущены.

- Не требуется принудительно удерживать чанки загруженными. Если область выгрузилась до завершения атаки, летящие заряды можно считать потерянными; кулдаун не отменяется.

- Если мир/сервер выключился во время полёта, незавершённые заряды не требуется сохранять/восстанавливать. Кулдаун и постоянные данные уникального крафта должны сохраняться.

# 12. Техническая стратегия / Implementation strategy

- Предпочтительная архитектура: Behavior Pack + Resource Pack (только если нужен) + Script API.

- Не использовать Experiments/Preview API без необходимости. Если точный ввод ЛКМ/ПКМ или физика TNT недоступны стабильным API, реализовать максимально близкое стабильное соответствие и явно документировать компромисс.

- Для ПКМ допускается использовать контролируемые script-driven charge entities/visuals и программные взрывы вместо полностью ванильных primed TNT, если это необходимо, чтобы соседние взрывы не влияли друг на друга и чтобы убрать block drops/fire.

- Для ЛКМ предпочтительно вычислить список блоков и удалить их пакетно/порциями максимально безопасным способом, но визуально считать разрушение мгновенным; частицы проигрывать отдельно около 1 секунды.

- Не выполнять тяжёлое полное сканирование мира каждый tick. Событийная логика и ограниченные временные задачи предпочтительнее.

- Особое внимание мультиплееру, одновременным активациям, защите от дублирования и постоянному world state.

# 13. Локализация / Localization

Минимум RU + EN. Все пользовательские строки должны идти через localization/lang-файлы, где это возможно.

  ---------------------------------------------------------------------------------
  Key / Meaning           RU                             EN
  ----------------------- ------------------------------ --------------------------
  Item name               Орбитальная пушка              Orbital Cannon

  Ready                   Орбитальная пушка --- Готово   Orbital Cannon --- Ready

  Cooldown example        Орбитальная пушка --- 27с      Orbital Cannon --- 27s
  ---------------------------------------------------------------------------------

# 14. Acceptance tests / Приёмочные тесты

1.  Survival craft succeeds once; a second Survival craft in the same world is blocked even after restart.

2.  Creative and /give copies do not consume the unique Survival craft flag.

3.  No valid block within 10 blocks -\> no shot and no cooldown.

4.  Overworld/End spawn height is +30; Nether is +10; world ceiling is clamped safely.

5.  Charge spawned inside a solid block triggers immediately.

6.  Entities do not stop falling charges.

7.  LMB removes an approximately 5×5 irregular vertical column to the bottom while preserving liquids and Survival-unbreakable blocks.

8.  LMB removes Obsidian and destructible containers/spawners with no ordinary drops.

9.  LMB causes no direct entity damage; environmental consequences still work.

10. LMB destruction is immediate; particle wave lasts about 1 second; only one main explosion sound.

11. RMB creates five continuous rings with approximate diameters 1/5/10/15/20.

12. RMB charges are independent from each other and each produces its own explosion sound.

13. RMB entity damage behaves like normal TNT, including self-damage to owner.