---
title: Client Questions
type: analysis
generated_at: "2026-10-05T17:12:56.151Z"
source_channel: rollout
node_id: rollout-client-questions
aliases: ["rollout-client-questions","client-questions"]
is_a: ["rollout","client-questions"]
relates_to: ["L0-xq7"]
priority: 610
---

# Client Questions (MUST_ASK)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Заполните секцию **Answer** по каждому вопросу — аналитик использует ответы на следующей итерации.

## Q-L0-7 · Sculk Crossbow: confirm the defaults (non-blocking)

### Question

---
title: "Q-L0-7 · The Sculk Crossbow defaults the operator should confirm"
aliases: ["L0-xq7", "Sculk Crossbow confirmation sheet"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xcx23", "L0-adr-scbs"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# Q-L0-7 · Sculk Crossbow: confirm the defaults (non-blocking)

The build proceeds on these defaults. A "no" changes only the item named.

1. **Damage** is 10 HP (5 hearts) per bolt, the same at every difficulty, through any armour or shield (`xasm23`).
2. **A hit on a shield** counts as a hit on its holder (`xcx23`).
3. **The crater drops nothing.** Water is not removed. Bedrock, portals and similar stay. Chests in the crater spill. Structures get no protection (`xasm25`).
4. **The patch under a target in the air**: only if there is ground at most 6 blocks below. Boats, minecarts and the UFO take no damage but still get a patch (`xasm24`).
5. **Arrows only, no fireworks.** Tipped-arrow effects are dropped (`xasm27`).
6. **The crossbow is pulled by the UFO magnet**, like every legendary since 1.6.0 (`xasm26`).
7. **Void return** goes to the crafter (the current behaviour for all weapons), not to the last holder, until the holder change is built (`xasm26`).
8. **Feel:** if the custom item cannot hold a loaded bolt like a vanilla crossbow, it is drawn and released like a bow, and Quick Charge shortens the draw (`adr-scbs`). Is that acceptable?

**Source node:** L0-xq7

### Answer

_..._

---

