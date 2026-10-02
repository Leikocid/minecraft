---
type: "concept-rule"
node_id: "L0-lgnd-r008"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-r008"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 932
tags: ["rule", "death-retention", "C-7"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-ent4"]
---
**R-lgnd-008: Death retention returns every live legendary, exactly once.**

Source: Scythe §1 (*«сохранение при смерти»* as a general rule); Web Sword §4, §12; Q-016 (unlootable).

The shipped code holds **one** `ws_pending` per player, and `findMarkedSword` returns only the **first** marked sword. With two weapons, admin copies and an off hand, that loses items.

- A player who dies carrying N live legendaries (any mix of weapons and admin copies, in any slot including the off hand) gets back each of them after respawn.
- Pending is per weapon and holds an array of marks.
- Restore is idempotent per `(id, gen)`. A repeated spawn/join, a reconnect or a restart grants nothing extra.
- No live legendary item entity remains at the death spot. Another player can never pick one up (Q-016).
- Unmarked copies follow vanilla death drops.
