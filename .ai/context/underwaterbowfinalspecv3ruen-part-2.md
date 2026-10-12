---
type: "raw-fragment"
node_id: "underwaterbowfinalspecv3ruen-part-2"
source_channel: "raw-import"
level: null
aliases: ["underwaterbowfinalspecv3ruen-part-2", "underwaterbowfinalspecv3ruen"]
is_a: ["raw-fragment"]
priority: 650
size_chars: 5111
tags: ["security", "performance", "api", "frontend"]
source: "docs/Underwater_Bow_Final_Spec_v3_RU_EN.docx"
embed_lines: "53-108"
embed_slice: "7-62"
---
## 4. Улучшенный стол зачарований

Цель: обычный стол зачарований предлагает ВСЕ ванильные зачарования, допустимые для выбранного предмета, включая сокровищные: Починка (Mending), Порыв ветра (Wind Burst) для булавы, Быстрая скрытность (Swift Sneak) и т. п. Проклятия НИКОГДА не предлагаются. Уровни не превышают ванильные максимумы; несовместимые чары не совмещаются. Применяется ко всем подходящим ванильным и поддерживаемым пользовательским предметам, не только к луку. «Выпад» (Lunge) для копья не модифицировать, если уже доступен на столе в целевой версии Bedrock.

Распределение: на одно предложение/генерацию зачарования 20% вероятность включить хотя бы одно подходящее редкое (ранее недоступное через стол) зачарование; 80% --- обычный ванильный пул. Если подходящих редких чар нет, использовать обычный пул. «Нерушимость» (Unbreaking) уже обычная чара, но её уровни подчиняются специальному правилу ниже.

Для Порыва ветра и Нерушимости: при выборе этой чары независимо проверять доступность уровней I (70%), II (40%), III (20%); если успешны несколько проверок --- брать наивысший успешный уровень; если ни одна не успешна --- выбрать I как безопасный fallback. Эти проценты НЕ являются долями, суммируемыми до 100%. Шансы редкой категории (20%) и уровней (70/40/20) --- разные стадии. При недоступном уровне из-за стоимости/ограничений стола использовать максимально разрешённый уровень.

Техническое ограничение: стабильный Bedrock API может не разрешать менять нативный алгоритм/интерфейс стола зачарований. Исполнитель обязан проверить поддержку для выбранной версии; НЕ заявлять о полной реализации, если ванильный стол нельзя перехватить. Любая альтернатива (свой блок/интерфейс/обмен) допускается только после согласования с заказчиком. Без экспериментов, если возможно.

## 5. Проверки при приёмке

• Обычные и новые рецепты булавы/ракет работают параллельно; результат --- именно ванильные предметы.

• Подводный лук сохраняет скорость стрел под водой и в лаве; обычный и заряженный огонь различаются.

• Промах заряженным выстрелом не включает кулдаун; попадание включает 30 секунд.

• В 1000+ проверках редкая категория возникает приблизительно в 20% допустимых генераций, проклятия --- 0%.

• Порыв ветра и Нерушимость дают уровни I--III по независимым проверкам 70/40/20 и выбору максимума.

• Починка и другие совместимые редкие чары доступны, несовместимые сочетания исключены.

• Перезапуск мира сохраняет уникальность легендарного лука и состояние восстановления.

# ENGLISH --- implementation requirements

## 1. Underwater Bow (legendary)

3×3 recipe: Lightning Rod above the Bow, Sand below, Water Buckets to the left and right. Return empty buckets. Output: one Underwater Bow.

  -----------------------------------------------------------------------
  Empty                   Lightning Rod           Empty
  ----------------------- ----------------------- -----------------------
  Water Bucket            Bow                     Water Bucket

  Empty                   Sand                    Empty
  -----------------------------------------------------------------------

Arrows maintain air-like velocity and trajectory in water and lava. Normal hits use vanilla bow damage and ignite for 2 seconds (ordinary fire may be extinguished by water). Active ability arms the next successful hit against a living entity. Misses retain the charge and do not start cooldown. A hit deals 14 HP pre-armor, shows a zero-damage lightning visual, and applies Super Fire for 5 seconds with normal burning damage that water cannot extinguish. Start 30-second cooldown on successful hit; show status in UI. Works on players and mobs.

Legendary rules: one Survival craft per world (persistent), infinite durability, transferable and storable; protected from ordinary item destruction; returned on inventory death and from the Void to last owner. Creative copies do not consume the Survival limit. Allow compatible bow enchantments, enforcing vanilla conflicts.

## 2. Additional vanilla Mace recipe

  -----------------------------------------------------------------------
  Empty                   Empty                   Empty
  ----------------------- ----------------------- -----------------------
  Empty                   Iron Block              Empty

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