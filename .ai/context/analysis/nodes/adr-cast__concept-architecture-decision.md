---
type: "concept-architecture-decision"
node_id: "L0-adr-cast"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "ADR-L0-cast · One ability-handler contract for every legendary weapon"
aliases: ["L0-adr-cast"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 2839
tags: ["title:ADR-L0 cast contract", "reduce", "cross-component"]
---
---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-lgnd-r001", "L0-lgnd-r003", "L0-lgnd-r007", "L0-lgnd-p004", "L0-webs-r005", "L0-webs-ad02", "L0-scyt-ad03", "L0-scyt-r003", "L0-sprj-ad01", "L0-xcx1", "L0-xcx2"]
requires: ["L0-lgnd"]
status: accepted
---
# ADR-L0-cast · One ability-handler contract for every legendary weapon

**Context.** After the deep-dive, the three children describe the boundary between framework and weapon in three different ways:
- `L0-lgnd` (`r001`, `r003`, `p004`): the handler is `(player, hand) → "cast" | "refused" | "busy"`, and **only the ability owner** calls `cooldown.start`. The dispatcher alone subscribes to `itemUse` and `playerInteractWithBlock`. No weapon calls `setActionBar`.
- `L0-webs` (`r005`, `ad02`): the callback returns `{filled}`, and "`L0-lgnd` decides whether to start the cooldown". → `L0-xcx1`.
- `L0-scyt` (`ad03`, `r003`): "listens to `afterEvents.itemUse` alone" and shows its no-target text through a `hud.hold` that the `lgnd` contract does not publish. → `L0-xcx2`.

**Decision.**
1. **The handler contract is `lgnd`'s.** Each weapon registers `ability(player, hand): "cast" | "refused" | "busy"`. The weapon calls `cooldown.start(player, key)` itself, and only on success:
   - Web Sword: when `filled > 0`.
   - Scythe: at the first hit and again at resolution (`L0-sprj-ad01`).

   The framework never infers success. The Web Sword's pure `resolveAndPlaceTrap → {filled}` stays as an internal function inside the Web Sword handler.
2. **Trigger events belong to the dispatcher.** `L0-lgnd-p004` subscribes to both events and de-duplicates them for every weapon. `L0-scyt-ad03` reads as *"the Scythe ability ignores block context"*. It does not mean the Scythe keeps its own subscription. Its GameTest (one press on a block → one activation) still applies, now against the dispatcher.
3. **Transient messages are added to the published contract:** `hud.notify(player, translateKey, holdMs ≈ 2000)`.
   - Only the HUD module writes it.
   - The steady HUD pass skips a player whose hold has not expired.
   - It covers the Web Sword's no-room and no-target texts (`L0-webs-r005`) and the Scythe's `no_target` (`L0-scyt-r003`, CTR-017).

   Weapons still never call `setActionBar` (`L0-lgnd-r001`, `r007`).
4. **Item JSON ownership.** The Web Sword's `minecraft:allow_off_hand` change belongs to `L0-webs` (item identity, `L0-webs-r001`). The Scythe's belongs to `L0-sitm`. This corrects the wording in `L0-lgnd-r004`.

**Consequences.** One rule, one owner: C-17 in `lgnd`'s crosswalk, carried as `L0-lgnd-r001`. `L0-webs-r005`, `L0-webs-ad02` and the `L0-webs` component text were reconciled in place during reduce to point here. `hud.notify` must be part of the `lgnd` generalisation task, before either weapon migrates.
