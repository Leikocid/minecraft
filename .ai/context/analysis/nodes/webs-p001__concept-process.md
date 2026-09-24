---
type: "concept-process"
node_id: "L0-webs-p001"
source_channel: "rollout"
analysis_version: 1
level: 2
title: "P-webs-001: Cast-time target resolution and 3×3×3 trap placement"
aliases: ["L0-webs-p001"]
is_a: ["process"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1869
tags: ["process", "targeting", "trap"]
---
---
is_a: ["process"]
part_of: ["L0-webs"]
relates_to: ["L0-lgnd-p004", "L0-webs-r002", "L0-webs-r003", "L0-webs-r004", "L0-webs-r005", "L0-webs-ent2", "L0-webs-ent3"]
---
# P-webs-001: Cast-time target resolution and 3×3×3 trap placement

**Trigger.** `L0-lgnd-p004` dispatches a ready Web Sword cast to this component's `onCast(player)`.

**Steps.**
1. Cast a melee-interaction ray from the player's view, honoring vanilla survival reach (blocks ≤5, entities ≤3 — `L0-webs-r002`/Q-011). Stop at the first opaque block; never attack through walls.
2. If nothing valid is hit within reach: **no target** — return "no-op" to `L0-lgnd` immediately. No cube is built, no blocks touched, no cooldown starts.
3. Resolve the center cell (`L0-webs-ent2`): a block hit ⇒ the air cell adjacent to the struck face; an entity hit ⇒ that entity's foot cell; if both are hit within the same reach check, the entity wins.
4. Enumerate the 27 cells of the 3×3×3 cube centered there (`L0-webs-r003`).
5. For each cell, classify it (`L0-webs-r004`): entity-occupied → skip (place around, don't move/replace the entity); has-inventory / block-entity from the closed list, or an indestructible special, or outside the loaded/accessible area → skip; already Cobweb → counts as satisfied, no write; liquid or ordinary block → replace with Cobweb.
6. Sum the cells actually changed or already-satisfied. If the sum is 0 (`L0-webs-r005`/Q-017): ability fails — no cooldown, localized "No room for cobweb" / «Нет места для паутины» in the actionbar.
7. If the sum is ≥1: report success + count to `L0-lgnd`, which starts the 30 s cooldown and updates the HUD (`L0-lgnd-p005`).

**Not this component's job.** Starting/reading the cooldown timer, writing the busy flag, and picking the HUD string are all `L0-lgnd`'s (`L0-lgnd-ent3`, `L0-lgnd-p005`) — this process only returns a boolean/count.
