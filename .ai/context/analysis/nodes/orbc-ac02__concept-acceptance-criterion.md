---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac02"
source_channel: "rollout"
analysis_version: 5
title: "AC-orbc-02 · Look, no fishing, anvil and table refuse it, Creative placement `[ipad]` (manual)"
aliases: ["L0-orbc-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 960
tags: ["is_a:acceptance-criterion", "channel:ipad", "manual", "relates_to:L0-xcx13", "relates_to:L0-orbc-r001"]
level: 2
---
# AC-orbc-02 · Look, no fishing, anvil and table refuse it, Creative placement `[ipad]` (manual)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx13", "L0-orbc-r001"]`

On the iPad, on the current stable client:
1. The inventory icon is indistinguishable from a vanilla fishing rod placed beside it.
2. In hand, it reads as a rod. A screenshot goes into the task, per `xcx13`.
3. Tapping use in the air or on water casts **no** bobber, and nothing is ever caught.
4. The enchanting table does not accept it into the slot. In the anvil, the Cannon plus an enchanted book gives no result.
5. It appears under Creative → Equipment, and search "Orbital" finds it.
6. The name is shown as "Orbital Cannon" (EN) and "Орбитальная пушка" (RU).
7. The recipe book shows the TNT-cross recipe.

**Not auto-verifiable.** The orchestrator must not close it from a `bds` run (memory: "Orchestrator auto-verifies manual criteria").
