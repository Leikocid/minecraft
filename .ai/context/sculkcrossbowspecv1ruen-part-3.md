---
type: "raw-fragment"
node_id: "sculkcrossbowspecv1ruen-part-3"
source_channel: "raw-import"
level: null
aliases: ["sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen"]
is_a: ["raw-fragment"]
priority: 610
size_chars: 4779
tags: ["config", "digest"]
source: "docs/Sculk_Crossbow_Spec_v1_RU_EN.docx"
embed_lines: "169-233"
embed_slice: "7-71"
---
- Частицы Sonic Boom должны иметь ограниченное время жизни и разумную плотность для multiplayer.

- Изменения блоков кратера и Sculk должны синхронизироваться для всех игроков и сохраняться как обычные изменения мира.

# 12. Приёмочные тесты / Acceptance tests

  ---------------------------------------------------------------------------------------------------------------------------------------
  **ID**                              **Проверка**
  ----------------------------------- ---------------------------------------------------------------------------------------------------
  **T01**                             Первый легальный Survival-крафт создаёт арбалет и устанавливает persistent unique-флаг.

  **T02**                             Повторный Survival-крафт в том же мире блокируется после перезапуска.

  **T03**                             Creative /give не расходует Survival-флаг.

  **T04**                             Выстрел создаёт видимый Sonic Boom-подобный след вдоль траектории.

  **T05**                             Визуальный след сам не наносит урон и не ломает блоки.

  **T06**                             Прямое попадание в сущность заменяет обычный arrow damage фиксированным Sonic Boom Normal damage.

  **T07**                             Смена сложности мира не меняет специальный урон.

  **T08**                             Броня, armor enchants и shield не уменьшают специальный урон.

  **T09**                             Соседние сущности не получают урон без прямого попадания.

  **T10**                             При entity hit кратер не создаётся; под целью появляется Sculk patch до \~5×5.

  **T11**                             При block hit создаётся нерегулярный кратер максимум около 5×5, глубиной 2--3.

  **T12**                             Block-hit кратер не наносит explosion damage ближайшим сущностям.

  **T13**                             Вокруг block-hit зоны появляется постоянный Sculk.

  **T14**                             Quick Charge работает.

  **T15**                             Piercing невозможно применить/использовать.

  **T16**                             Multishot выпускает три независимо обрабатываемых снаряда.

  **T17**                             Три отдельные Multishot-стрелы могут трижды поразить одного игрока, если каждая реально попала.

  **T18**                             Арбалет не теряет прочность.

  **T19**                             При смерти владельца легендарный арбалет из инвентаря не выпадает.

  **T20**                             Item entity арбалета переживает обычные опасности и Orbital Cannon согласно глобальным правилам.
  ---------------------------------------------------------------------------------------------------------------------------------------

# 13. English implementation handoff

Sculk Crossbow is a unique legendary crossbow with no active ability and no custom cooldown. Every fired projectile receives the weapon\'s passive behavior. A visible Warden Sonic Boom-like cylinder/beam accompanies the physical projectile.

- On a direct entity hit, suppress normal arrow damage and apply a fixed damage value equal to vanilla Warden Sonic Boom damage on Normal difficulty, independent of the world\'s current difficulty.

- The special direct-hit damage ignores armor, armor enchantments and shields. Only the entity actually struck by that projectile is affected.

- Do not create a crater on entity hit. Instead, create a permanent irregular Sculk patch up to roughly 5×5 beneath/around the struck entity.

- On a block hit, create an irregular crater up to roughly 5×5 and 2--3 blocks deep. This terrain effect must not deal explosion damage to nearby entities.

- Convert appropriate surrounding crater surfaces to permanent Sculk.

- Piercing is prohibited. Quick Charge and Multishot are allowed.

- With Multishot, process every projectile independently. Multiple projectiles may each deal the full fixed hit damage to the same player if they each physically connect.

- The Sonic Boom-like trail is visual only. A custom look-alike effect is acceptable if exact vanilla rendering is unavailable through stable Bedrock APIs.

- Preserve all global legendary rules: one legal Survival craft per world, persistent uniqueness, infinite durability, death retention, ordinary-hazard immunity, Void return, Creative/testing copies and first-craft announcement.

- Prefer stable Bedrock APIs and no Experiments. If an exact visual or damage-bypass behavior cannot be reproduced with stable APIs, implement the closest stable server-authoritative version without changing the core gameplay and document the deviation.

# 14. Implementation priorities

- Correct server-authoritative suppression/replacement of vanilla projectile damage.