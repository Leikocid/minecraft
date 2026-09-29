---
type: "concept-process"
node_id: "L0-lgnd-p004"
source_channel: "rollout"
analysis_version: 3
title: "P-lgnd-004: Use dispatch with hand priority"
aliases: ["L0-lgnd-p004"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1374
tags: ["process", "hand-priority", "dispatch", "CTR-013", "Q-019"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004", "L0-lgnd-r009", "L0-lgnd-ad04", "L0-stgt"]
---
# P-lgnd-004: Use dispatch with hand priority

Replaces the per-weapon `itemUse` / `playerInteractWithBlock` subscriptions (today in `trap.ts`) with one framework dispatcher.

1. **Trigger.** `itemUse` (always) and `playerInteractWithBlock`, for a main-hand item that is a registered legendary. Bedrock never raises Use for an off-hand custom item (CTR-013). The shipped `trap.ts` logic that de-duplicates the two events for one press moves here unchanged.
2. **Resolve hands.** `main` = Equippable `Mainhand`. `off` = `Offhand`. A stale marked stack counts as absent. An unmarked copy still counts, as today (`L0-lgnd-as05`).
3. **Pick:**
   - `main` is present and `isReady(main)` → call `main.ability(player, "main")`. **Stop**, whatever the outcome: a refusal does not fall through.
   - Otherwise, `off` is present, `off.abilityKey != main.abilityKey` and `isReady(off)` → call `off.ability(player, "off")`.
   - Otherwise → no ability runs and no state changes. The existing silent-on-cooldown behaviour is kept.
4. The framework never calls `start()` or `setBusy()` itself. The ability owner does, on success.

Two copies of the same weapon (main + off) share one ability key and so one cooldown. The off copy never fires in place of the main one.
