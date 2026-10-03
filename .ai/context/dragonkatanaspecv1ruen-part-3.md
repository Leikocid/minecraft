---
type: "raw-fragment"
node_id: "dragonkatanaspecv1ruen-part-3"
source_channel: "raw-import"
level: null
aliases: ["dragonkatanaspecv1ruen-part-3", "dragonkatanaspecv1ruen"]
is_a: ["raw-fragment"]
priority: 600
size_chars: 3652
tags: ["architecture", "integration", "digest"]
source: "docs/Dragon_Katana_Spec_v1_RU_EN.docx"
embed_lines: "162-222"
embed_slice: "7-67"
---
**T03**                             Creative /give не расходует Survival-флаг.

  **T04**                             Обычный удар соответствует Diamond Sword.

  **T05**                             Телепорт к валидной точке на 20 блоках срабатывает и запускает 30 s cooldown.

  **T06**                             Точка дальше 20 блоков не позволяет превысить максимальную дальность.

  **T07**                             Сплошная стена между игроком и целью не пробивается; игрок оказывается у доступной стороны стены.

  **T08**                             Вода/лава не считаются твёрдой стеной для трассировки.

  **T09**                             Игрок не появляется внутри твёрдого блока; safe-position correction работает.

  **T10**                             Телепорт не разрушает блоки.

  **T11**                             После телепортации первое связанное приземление не наносит fall damage.

  **T12**                             Следующее обычное падение снова наносит стандартный fall damage.

  **T13**                             Розовый sakura trail проходит от A к B и не наносит урон.

  **T14**                             Во время cooldown обычные удары мечом продолжают работать.

  **T15**                             Катана не теряет прочность.

  **T16**                             При смерти игрока Катана из инвентаря не выпадает.

  **T17**                             Катана как item entity переживает огонь, лаву, TNT и воздействие Orbital Cannon.

  **T18**                             Void-return возвращает Катану последнему владельцу согласно глобальному правилу.
  ---------------------------------------------------------------------------------------------------------------------------------------

# 13. English implementation handoff

Dragon Katana is a unique legendary melee weapon based on the vanilla Diamond Sword. It deals normal Diamond Sword melee damage and has infinite durability. Its active ability has a 30-second cooldown and teleports the owner toward the point they are aiming at, with a maximum range of 20 blocks.

- Aim may resolve to a block face or a point in air.

- Solid blocks stop the teleport trace. Never phase the player through a solid obstacle.

- If an obstacle is encountered before the requested destination, resolve the nearest safe player-fitting position on the owner\'s side of that obstacle and consume the cooldown after the successful teleport.

- Water and lava are not solid trace blockers by themselves.

- Apply one-shot fall-damage protection to the next landing caused by the teleport.

- Spawn a pink cherry-blossom/petal trail from origin A to resolved destination B. It is visual only.

- Do not implement crawling/lying poses. Resolve a normal standing safe position instead.

- Preserve all global legendary-item rules: one legal Survival craft per world, persistent uniqueness, infinite durability, death retention, ordinary-hazard immunity, Void return, Creative/testing copies, localization and global first-craft announcement.

- Prefer stable Minecraft Bedrock APIs and no Experiments. If an exact behavior cannot be achieved with stable APIs, implement the closest stable version without changing the core gameplay and document the deviation.

# 14. Implementation priorities

- Server-authoritative target validation and 20-block range cap.

- Reliable collision/safe-position search that never phases through solids.

- Persistent legendary uniqueness and death/Void protection.

- Low-cost particles: short-lived trail only on successful activation; avoid permanent tick-heavy scans.

- Multiplayer synchronization and clean cooldown UI.
