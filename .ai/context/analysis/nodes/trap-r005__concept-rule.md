---
type: "concept-rule"
node_id: "L0-trap-r005"
source_channel: "rollout"
title: "R-005 — Real vanilla cobweb, permanent, and a partial cube is a success"
aliases: ["L0-trap-r005"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2033
tags: ["rule","placement","cobweb","partial-cube","L0-trap"]
---

# R-005 — Real vanilla cobweb, permanent, and a partial cube is a success

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pfil", "L0-trap-ecub", "L0-trap-ac01", "L0-trap-ac03"]`

**Rule (three parts).**

1. The blocks placed are **ordinary vanilla `minecraft:web`** — not a custom block, not a variant, not tagged or marked in any way. They behave for every player and mob under normal Minecraft rules.
2. They are **permanent world state**. No expiry timer, no despawn, no ownership. They remain until players clear them by normal means.
3. A cube in which some cells were skipped is a **success**, not a failure. The remaining valid cells are filled anyway and the cooldown is consumed.

**Source.** §5: *«Созданная паутина является настоящими обычными cobweb blocks и остаётся в мире, пока игроки не уберут её обычным способом.»* · §6: *«Если часть куба защищена, пропустить только эти клетки; остальные допустимые клетки всё равно заполнить паутиной.»* · §9: *«Паутина после создания является общей частью мира и взаимодействует со всеми игроками/мобами по обычным правилам Minecraft.»* · §12: *«Игрок выходит сразу после активации: уже созданная паутина остаётся.»* · L0 boundary: "Cobweb cleanup / expiry" is **excluded by decision**.

**Rationale.** Using real cobweb is what makes the trap interact correctly with mobs, projectiles, shears and everything else without the component reimplementing any of it. Permanence is a balance choice the owner made by omission — adding a timer would change the weapon.

**Why the partial-cube clause lives here.** The all-or-nothing reading is the most natural misreading of §6 and it inverts the weapon's behaviour in exactly the situations it matters most (near buildings, near bedrock). §13 test 10 exists to catch it.

**Non-goal.** No cleanup command, no owner attribution, no "my cobweb vs yours" distinction. Once placed, the component has no further relationship with the blocks.

**Verified by.** `L0-trap-ac01`, `L0-trap-ac03`, `L0-trap-ac07`.
