---
type: "concept-rule"
node_id: "L0-lgnd-r004"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-r004"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 964
tags: ["rule", "hand-priority", "Q-019", "CTR-013"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-as07", "L0-lgnd-as08"]
---
**R-lgnd-004: Hand priority.**

Source: Scythe §6 and Web Sword §8 (*«готовая способность main hand имеет приоритет; если main-hand способность на cooldown, может сработать готовая off-hand способность»*). Q-019 default (a).

- At most one ability runs per Use press.
- A ready main-hand legendary fires **even if it then refuses** (no target, no room). A refusal does not fall through.
- If the main-hand legendary is not ready (cooldown **or busy**, `L0-lgnd-as08`), a ready off-hand legendary with a *different* ability key fires.
- Both not ready → nothing happens and no state changes.
- The off hand can only be triggered through a main-hand legendary press (engine limit, `L0-lgnd-as07`). An empty or non-legendary main hand never casts the off-hand weapon.
- Both items declare `minecraft:allow_off_hand: true`. The JSON change is owned by `L0-webs` (Web Sword) and `L0-sitm` (Scythe), per `L0-adr-cast` §4.
