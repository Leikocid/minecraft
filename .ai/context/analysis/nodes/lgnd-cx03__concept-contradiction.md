---
type: "concept-contradiction"
node_id: "L0-lgnd-cx03"
source_channel: "rollout"
analysis_version: 5
title: "CTR-lgnd-03: ASM-020 measures `hidden_until` in ticks, but the shipped code proved ticks are the wrong clock"
aliases: ["L0-lgnd-cx03"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1131
tags: ["contradiction", "target:L0-lgnd", "ASM-020", "clock", "resolved", "resolved_by:L0-adr-lgnd"]
level: 2
---
---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-lgnd-ent3", "L0-stgt"]
status: resolved
category: source-vs-code
---
# CTR-lgnd-03: ASM-020 measures `hidden_until` in ticks, but the shipped code proved ticks are the wrong clock

- **ASM-020 (L0):** a player is hidden iff `andrew:hidden_until` > "the current tick".
- **`src/websword/cooldown.ts`** (measured on BDS 1.26.51.1):
  - `world.getAbsoluteTime()` stops when `dodaylightcycle` is false.
  - `system.currentTick` restarts at 0 with the script engine.
  - A durable deadline on either clock is wrong after a restart, or never expires.
  For this reason the cooldown was moved to `Date.now()` milliseconds.

**Effect.** A tick-based `hidden_until` written before a restart would read as hidden for up to its whole stored value in new ticks. On a frozen day clock it would read as hidden forever.

**Interim position** (`L0-lgnd-r010`): use epoch ms via `Date.now()`, the same clock as the cooldowns. Only ASM-020's wording changes, not its contract.

**Needs:** L0 amends the wording of ASM-020, and the future Shadow Blade spec must write ms.
