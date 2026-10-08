---
type: "raw-fragment"
node_id: "stormbladeelytratotemspecruen-part-2"
source_channel: "raw-import"
level: null
aliases: ["stormbladeelytratotemspecruen-part-2", "stormbladeelytratotemspecruen"]
is_a: ["raw-fragment"]
priority: 620
size_chars: 4297
tags: ["frontend"]
source: "docs/Storm_Blade_Elytra_Totem_Spec_RU_EN.docx"
embed_lines: "69-120"
embed_slice: "9-60"
---
-----------------------------------------------------------------------
           Перо                    Пусто                   Перо
  ----------------------- ----------------------- -----------------------
           Перо             Алмазный нагрудник             Перо

           Перо                    Пусто                   Перо
  -----------------------------------------------------------------------

Ингредиенты: 6× Feather + 1× Diamond Chestplate. Результат: 1× vanilla Elytra. Крафт неограниченный, без флагов уникальности, без изменений полёта/прочности/ремонта/зачарований. Все ингредиенты расходуются.

# 04 / Крафт тотема --- Totem of Undying recipe

  -----------------------------------------------------------------------
      Золотой слиток          Золотой слиток          Золотой слиток
  ----------------------- ----------------------- -----------------------
      Золотой слиток              Изумруд             Золотой слиток

      Золотой слиток          Золотой слиток          Золотой слиток
  -----------------------------------------------------------------------

Ингредиенты: 8× Gold Ingot + 1× Emerald. Результат: 1× vanilla Totem of Undying. Крафт неограниченный; работает как обычный ванильный тотем, без изменений механики. Все ингредиенты расходуются.

# 05 / Bedrock implementation notes

- Предпочтительны стабильные Minecraft Bedrock Behavior Pack / Script API без Experiments; использовать нативные shaped recipes для элитр и тотема.

- Рецепты элитр и тотема должны выдавать именно minecraft:elytra и minecraft:totem_of_undying, а не кастомные заменители.

- Уникальность Клинка бури проверять серверно и персистентно; учесть одновременный крафт нескольких игроков и возможные обходы через recipe book/shift-craft.

- Урон активной и пассивной способности не должен случайно удваиваться из-за стандартного урона молнии. Если ванильная молния не может быть строго визуальной, заменить её частицами/звуком без дополнительных эффектов.

- Урон в HP: 10 HP = 5 сердец, 6 HP = 3 сердца. Активный и пассивный урон обрабатываются отдельно.

- Если точное поведение недоступно в стабильном API, исполнитель должен указать ограничение и реализовать ближайший вариант без изменения основной механики.

# 06 / Проверки / Acceptance tests

- Survival: Клинок бури создаётся один раз; второй крафт блокируется после рестарта; Creative-копия не расходует флаг.

- Обычный удар равен алмазному мечу; пассивный бонус срабатывает приблизительно в 30% успешных попаданий на большой выборке.

- Пассивный удар наносит только +6 HP до брони, активный --- 10 HP до брони; визуальные молнии не добавляют урон.

- Активный луч не длиннее 10 блоков, останавливается первым твёрдым блоком и не поражает вторую цель за первой.

- Активный кулдаун 30 секунд, пассивный не зависит от него.

- Клинок не ломается, переживает смерть, обычные опасности и Void согласно правилам легендарки.

- Рецепт из 6 перьев + алмазного нагрудника создаёт настоящие элитры; повторный крафт работает.

- Рецепт из 8 золотых слитков + изумруда создаёт настоящий тотем; повторный крафт работает.

- Оба ванильных предмета сохраняют стандартные механики и не требуют уникального флага.

# 07 / English handoff

Deliver one Minecraft Bedrock Add-On containing three shaped recipes and Storm Blade behavior. Storm Blade: diamond-sword base damage, infinite durability, unique one-time Survival craft per world, transferable and protected as other legendary items. Recipe: lightning rods at top/bottom center, wind charges at middle-left/right, diamond sword at center. Active ability fires a visible straight electric/wind trace up to 10 blocks, blocked by first solid block; first living target takes 10 HP before armor. Show three visual-only lightning strikes with zero extra damage/knockback; 30-second cooldown. Passive: each successful melee hit has a 30% independent chance to add one visual-only lightning strike and 6 HP pre-armor damage, regardless of active cooldown. Elytra recipe: feathers at all four corners and middle-left/right, diamond chestplate at center; output vanilla Elytra, unlimited. Totem recipe: eight gold ingots surrounding one emerald; output vanilla Totem of Undying, unlimited. Use stable APIs, preserve multiplayer correctness, localization, and test all cases.
