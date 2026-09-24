---
type: "raw-fragment"
node_id: "scytheofcalamityspecv1ruen-part-2"
source_channel: "raw-import"
level: null
aliases: ["scytheofcalamityspecv1ruen-part-2", "scytheofcalamityspecv1ruen"]
is_a: ["raw-fragment"]
priority: 520
size_chars: 2518
tags: ["api", "integration", "performance", "guide", "project"]
source: "docs/Scythe_of_Calamity_Spec_v1_RU_EN.docx"
embed_lines: "87-132"
embed_slice: "5-50"
---
- Когда готова: локализованное состояние Ready / «Готово».

- Во время кулдауна: оставшееся время.

- Общее правило приоритета легендарных оружий: если активные легендарные предметы находятся в обеих руках и оба готовы, приоритет у основной руки; если основная рука на кулдауне, готовая способность второй руки может сработать.

# 7. Технические указания / Technical notes

- Предпочитать stable Bedrock Script API; не использовать Preview/Experimental API без необходимости.

- Поиск цели выполнять при активации, а не постоянным тяжёлым сканированием каждый tick.

- Для полёта трёх снарядов допустим короткий временный tick/update только пока они существуют.

- Прохождение сквозь блоки проще и надёжнее реализовать скриптовым перемещением/визуалом, не полагаясь на обычную физику projectile entity.

- True damage необходимо реализовать так, чтобы итоговые 3 HP не уменьшались бронёй/защитными чарами; конкретный стабильный механизм выбрать по доступному API.

- Обязательно очистить временные сущности/состояния при смерти цели, выходе игрока, смене измерения или других ситуациях, где цель перестаёт быть валидной.

# 8. Приёмочные тесты / Acceptance tests

1.  Нет игрока в радиусе 20 -\> сообщение появляется, кулдауна нет.

2.  Ближайший видимый игрок выбирается корректно; мобы игнорируются.

3.  Shadow Blade-hidden player не выбирается.

4.  При равной дистанции работает tie-break по направлению взгляда.

5.  Создаются ровно 3 снаряда, которые проходят сквозь блоки и не ломают их.

6.  Каждый хит наносит 3 HP true damage и подбрасывает примерно на 10 блоков.

7.  Три попадания могут суммарно нанести 9 HP true damage.

8.  Выход цели за 20 блоков до первого хита отменяет атаку без кулдауна.

9.  Выход цели после первого хита запускает полный 30-секундный кулдаун.

10. Смерть/logout/смена измерения цели не оставляет зависших временных объектов.

11. Один успешный Survival craft на мир сохраняется после перезапуска.

# 9. Definition of Done

Модуль считается готовым, когда рецепт, уникальный крафт, обычный урон, поиск цели, три homing-снаряда, true damage, подбрасывание, правило 20-блочного радиуса, кулдаун, Action Bar и основные multiplayer edge cases работают стабильно и не создают дубликаты или зависшие сущности.

The module is done when crafting uniqueness, melee damage, target selection, three homing projectiles, true damage, launch effect, 20-block pursuit rule, cooldown, Action Bar, and core multiplayer edge cases work reliably without duplication or orphaned temporary entities.
