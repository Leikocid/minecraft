---
type: "concept-architecture-decision"
node_id: "L0-adr-hold"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-hold · Legendary loss return goes to the last holder"
aliases: ["L0-adr-hold", "Last-holder ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0", "L0-lgnd", "L0-xq3", "L0-xcx11", "L0-adr-wpn2", "L0-lgnd-cx09"]
see_also: ["orbitalcannonspecv1ruen-part-1"]
governs_files: ["src/legendary/state.ts", "src/legendary/recovery.ts", "src/legendary/retention.ts"]
priority: 540
size_chars: 1426
tags: ["title:ADR-L0-hold · Legendary loss return goes to the last holder", "alias:L0-adr-hold", "alias:Last-holder ADR", "is_a:architecture-decision", "relates_to:L0", "relates_to:L0-lgnd", "relates_to:L0-xq3", "relates_to:L0-xcx11", "relates_to:L0-adr-wpn2", "relates_to:L0-lgnd-cx09", "see_also:orbitalcannonspecv1ruen-part-1", "status:proposed", "amends:L0-adr-wpn2", "answers:L0-xq3"]
level: 1
---
# ADR-L0-hold · Legendary loss return goes to the last holder

**Status:** proposed. It needs a one-line client confirmation, because the Orbital spec is newer than `xq3` but does not say "overrides". **Context.**
- `L0-xq3` asked whether a lost legendary returns to the crafter or to the last holder. Meanwhile the as-built code returns it to the mark's `owner` (the crafter).
- Orbital §5, which restates the *general* legendary rule, says: "returns to the **last owner**; if offline, on next join". It also says the weapon "is not bound to its creator forever" and can be handed to another player.

**Decision.**
- Add `holder` (player id plus name) to the mark.
- Rewrite `holder` on every `playerInventoryItemChange` that surfaces the instance in a player's inventory. A container never becomes the holder.
- Loss return and offline delivery target `holder`. When no holder was ever recorded (admin copies), fall back to `owner`.
- The `_owed` list per player from `L0-adr-wpn2` is keyed by holder.
- The generation guard (`gen`) from `adr-wpn2` stays mandatory.

**Rejected.**
- Keep the crafter: this contradicts Orbital §5 and turns "transfer" into a loan.
- Last player to *touch* the item entity: there is no stable event for that, and it can be spoofed by a hopper.

**Consequences.** It applies to Web Sword and Scythe too. `lgnd-ac*` loss-return criteria get rewritten. `L0-xq3` closes once the client confirms.
