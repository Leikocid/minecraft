---
type: "concept-rule"
node_id: "L0-lgnd-r010"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-r010"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 1543
tags: ["c-21", "hidden"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-stgt", "L0-lgnd-as09", "L0-lgnd-cx03", "L0-lgnd-ac14"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` reads `andrew:hidden_until` as an epoch-ms deadline (C-21).** Source: Scythe §3; L0 C-21.

- **Storage.** The player dynamic property `andrew:hidden_until` (`HIDDEN_UNTIL_KEY`, `src/legendary/hidden.ts:21`) holds a `Date.now()` deadline in **milliseconds**. That is the same clock as the cooldown (`andrew:cd_*`) and busy (`andrew:busy_*`) deadlines and the next UFO arrival. C-21 applies: every durable deadline uses epoch ms. `system.currentTick` restarts with the script engine, and `getAbsoluteTime()` stops under `dodaylightcycle false`.
- **Read.** `isHiddenAt(Date.now(), value)`. A missing or non-number value means not hidden; nothing throws.
- **Write.** `hideFromTargeting(player, seconds)` writes `Date.now() + seconds × 1000`. Zero or less clears it. `/andrew:hide <seconds> [target]` is the operator and test seam. The future Shadow Blade writes the same key in ms, and replaces only the body of `isHiddenFromTargeting`.
- **Durability.** It survives reconnect and restart. A deadline written before a restart is still exact after it.
- **Pack scope.** Dynamic properties are per pack. A player hidden by the release pack reads as not hidden in the GameTest pack (`hidden.ts:24-27`), so a GameTest must hide through its own pack.
- **Not hiding.** Vanilla invisibility is not hiding.

This settles `cx03`: C-21 is now the L0 wording, and ASM-020's "ticks" is retired.
