---
type: "concept-contradiction"
node_id: "L0-xcx2"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "CX-L0-02 · Scythe design steps around the `lgnd` contract (trigger subscription, HUD hold)"
aliases: ["L0-xcx2"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1450
tags: ["title:Scythe trigger and HUD hold bypass lgnd contract", "target:L0", "resolved", "reduce"]
---
---
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-scyt", "L0-lgnd", "L0-scyt-ad03", "L0-scyt-r003", "L0-lgnd-r001", "L0-lgnd-p004", "L0-lgnd-r007", "L0-adr-cast"]
status: resolved
resolved_by: L0-adr-cast
category: weapon-overrides-framework
target_node: L0
---
# CX-L0-02 · Scythe design steps around the `lgnd` contract (trigger subscription, HUD hold)

**Pair 1: trigger.**
- `L0-scyt-ad03`: the Scythe "listens to `world.afterEvents.itemUse` alone … with no `playerInteractWithBlock` twin".
- `L0-lgnd-r001`: a weapon module **may not** subscribe to `itemUse` or `playerInteractWithBlock` for its own item.
- `L0-lgnd-p004`: the one dispatcher subscribes to both events and de-duplicates them for every registered legendary.

**Pair 2: HUD.**
- `L0-scyt-r003`: the no-target text is held on the Action Bar through "`L0-lgnd`'s `hud.hold`".
- `L0-lgnd`'s published contracts: `registerLegendary`, `cooldown.*`, `isHiddenFromTargeting` and the handler. There is no hold or notify call, and `r001` forbids weapons from calling `setActionBar`. The Web Sword has the same unserved need for its no-room text (`L0-webs-r005`).

**Resolution.** `L0-adr-cast`:
- (2) Triggers are the dispatcher's alone. `scyt-ad03` becomes "the Scythe ignores block context".
- (3) `hud.notify(player, key, holdMs)` is added to the published contract and serves both weapons.

The `scyt` artifacts can keep their wording. `L0-adr-cast` is the binding reading.
