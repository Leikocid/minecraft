---
type: "concept-rule"
node_id: "L0-once-r007"
source_channel: "rollout"
aliases: ["L0-once-r007"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1783
tags: ["rule","authority","C-4","invariant","L0-once"]
---

**R-007 — The flag is the sole authority. The gate is never derived from the world.**

Source: §3 (the budget counts crafts) · §4 (*«one-per-world относится к survival crafting, а не к количеству dev/test copies»*) · §11 / C-4 (no per-tick global world scan) · ADR-005 (rejected alternative: *deriving the flag by scanning for existing Web Swords*).

The craft gate reads `L0-once-ecft` and nothing else. The following are **forbidden** as inputs to the decision:

- Counting `andrew:web_sword` instances in player inventories, containers, or dropped on the ground.
- Scanning the world, periodically or on demand, for existing swords.
- Inspecting a scoreboard, a marker entity, or any file outside the world.
- Asking `L0-keep`'s ownership ledger whether a sword exists.

**Two independent reasons, either sufficient:**

1. **Correctness.** §4 permits an unbounded number of admin/Creative copies. Any count-based gate would be wrong the moment an operator runs `/give` — and would also wrongly re-open the budget if the crafted sword were destroyed.
2. **Performance.** A world scan is either per-tick (directly prohibited by §11 and C-4) or on-demand-and-incomplete (unloaded chunks are invisible), and neither is acceptable.

**Corollary for siblings.** `L0-keep` owns the item ledger and `L0-once` owns the craft flag; neither reads the other as an authority. The one connection between them is §12's invariant — death must not reset the flag — which is expressed here as R-002 and is a *prohibition* on `L0-keep`, not a data dependency.

**Rationale.** Separating "a craft happened" from "a sword exists" is what makes the Creative exemption (R-003) and the anti-dup requirement (C-7) coexist. Conflating them is precisely the mistake CTR-005 documents on the `L0-keep` side.
