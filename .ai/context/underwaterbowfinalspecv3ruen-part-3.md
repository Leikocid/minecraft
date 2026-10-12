---
type: "raw-fragment"
node_id: "underwaterbowfinalspecv3ruen-part-3"
source_channel: "raw-import"
level: null
aliases: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen"]
is_a: ["raw-fragment"]
priority: 650
size_chars: 5557
tags: ["performance", "digest", "requirements", "testing"]
source: "docs/Underwater_Bow_Final_Spec_v3_RU_EN.docx"
embed_lines: "105-163"
embed_slice: "8-66"
---
Empty                   Breeze Rod              Empty
  -----------------------------------------------------------------------

Output: one vanilla Mace. Keep the original Heavy Core recipe. Unlimited crafting; vanilla durability, stats, and enchantments.

## 3. Additional vanilla Firework Rocket recipe

  -----------------------------------------------------------------------
  Empty                   Empty                   Empty
  ----------------------- ----------------------- -----------------------
  Empty                   Paper                   Empty

  Empty                   String                  Empty
  -----------------------------------------------------------------------

Output: three vanilla Firework Rockets, Flight Duration 1, usable for Elytra boosts. Keep existing recipes; unlimited crafting.

## 4. Expanded enchanting table

Goal: make all item-compatible vanilla enchantments available via the standard enchanting table, including treasure enchantments (Mending, Wind Burst on Mace, Swift Sneak, etc.). Never offer curses. Enforce vanilla maximum levels and mutual exclusions. Apply globally to eligible vanilla/custom items. Leave spear Lunge unchanged if already obtainable at the table in the target Bedrock version.

For each generated enchantment offer: 20% chance to include at least one eligible formerly table-inaccessible enchantment; otherwise 80% standard pool. If no eligible rare enchantments exist, use the standard pool. Unbreaking remains a normal enchantment but uses the special level rule.

For Wind Burst and Unbreaking, once that enchantment is selected, independently roll level I at 70%, level II at 40%, and level III at 20%; choose the highest successful level. If all rolls fail, use level I as fallback. These are independent probabilities, not additive shares. The 20% rare-enchantment selection is a separate stage. Respect any maximum level allowed by the enchanting context.

Bedrock feasibility: stable add-on APIs may not permit modifying the native enchanting-table algorithm/UI. Validate target-version support. Do not silently substitute a custom station or claim exact behavior if impossible; report constraints and seek approval for alternatives. Avoid experimental toggles where feasible.

## 5. Acceptance tests

• Both old and new Mace/Rocket recipes coexist and output real vanilla items.

• Underwater/lava arrow velocity, normal fire and Super Fire behave as specified.

• Charged misses do not start cooldown; successful hits start a 30-second cooldown.

• Across a large sample, eligible rare enchantments occur approximately 20% of the time; curses never occur.

• Wind Burst and Unbreaking use independent 70/40/20 level checks and highest-success selection.

• Mending and other eligible treasure enchantments can be offered; conflicts remain forbidden.

• Legendary bow uniqueness and recovery persist across world restarts.

РУССКИЙ --- дополнение v3: «Перовый сокровятель»

# 6. Предмет и рецепт

Название: «Перовый сокровятель» (рабочее английское название: Pearl Rod). Обычный дополнительный предмет, НЕ легендарный: без лимита крафтов, можно передавать и выбрасывать; бесконечная прочность. Внешне и при обычной рыбалке работает как удочка.

Верстак 3×3 (строки сверху вниз):

  -----------------------------------------------------------------------
  Пусто                   Эндер-жемчуг            Пусто
  ----------------------- ----------------------- -----------------------
  Пусто                   Удочка                  Пусто

  Пусто                   Пусто                   Пусто
  -----------------------------------------------------------------------

Ингредиенты: 1 эндер-жемчуг (Ender Pearl) непосредственно над 1 обычной удочкой (Fishing Rod); результат --- 1 Перовый сокровятель. Позиции фиксированы, прочие клетки пустые. Название «эндер перо» в речи интерпретировано как эндер-жемчуг; если подразумевался другой предмет, уточнить перед выпуском.

# 7. Привязка и телепортация

- Состояние «не привязана»: обычный заброс поплавка; удочкой можно рыбачить. Когда поплавок попадает именно в существующую нажимную плиту любого ванильного типа, запомнить измерение, точные координаты и тип/идентичность блока, а также UUID игрока, который привязал удочку. Поплавок немедленно убрать, удочку визуально вернуть в обычное положение.

- Состояние «привязана»: следующее использование этой удочки ТЕМ ЖЕ живым игроком инициирует телепортацию к запомненной плите вместо нового заброса. Без ограничений расстояния; допустимы удалённые чанки. Перед перемещением убедиться, что плита по-прежнему существует на тех же координатах и что есть безопасное место для игрока над ней или рядом.

- После УСПЕШНОЙ телепортации привязка стирается: для повторного перемещения нужно вновь попасть поплавком в плиту. Если плита сломана/заменена --- привязка недействительна, телепортации нет, требуется новая привязка.

- При смерти привязавшего игрока все его активные привязки этого предмета сбрасываются, даже если предмет позже поднимет другой игрок. Передача/выбрасывание не дают другому игроку права использовать чужую привязку: необходима собственная новая привязка. Сам предмет выпадает по обычным правилам мира, не имеет защиты легендарного предмета.

- При невозможности загрузить удалённый чанк или найти безопасную точку не телепортировать в опасное место; сообщить об ошибке, не заявлять об успешном переносе. Успешная привязка должна сохраняться при перезапуске мира, если игрок жив и плита существует; техническую реализуемость стабильным API проверить.