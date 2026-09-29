---
type: "concept-assumption"
node_id: "L0-xasm1"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "ASM-L0-1 · Every durable deadline in the add-on is stored as epoch ms (`Date.now()`)"
aliases: ["L0-xasm1"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1427
tags: ["title:All durable deadlines use epoch ms", "CAN_ASSUME", "reduce", "cross-component"]
---
---
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-lgnd-cx03", "L0-lgnd-r010", "L0-lgnd-r003", "L0-lgnd-r006", "L0-lgnd-ent3"]
status: CAN_ASSUME
---
# ASM-L0-1 · Every durable deadline in the add-on is stored as epoch ms (`Date.now()`)

**Assumption.** Every persisted "until" value is an **epoch-millisecond** number compared against `Date.now()`. This covers the cooldowns of both weapons, `andrew:hidden_until` (ASM-020, amended), and any future deadline. `system.currentTick` and `world.getAbsoluteTime()` are used only for in-memory, single-session timing: HUD cadence, volley flight, and the watcher interval.

**Basis.** Measured on BDS 1.26.51.1 by the shipped `src/websword/cooldown.ts`:
- `getAbsoluteTime()` stops when `dodaylightcycle` is false.
- `currentTick` restarts at 0 with the script engine.

A tick-based durable deadline is therefore wrong after a restart. Legacy `ws_cooldown_until` values are not read at all (`cx07`).

**Amends.** The wording of ASM-020 changes from "`hidden_until` > the current tick" to "`hidden_until` > `Date.now()`". The contract (a read-only predicate, false when absent) does not change. The future Shadow Blade spec must write ms.

**If wrong.** If the server clock jumps (the host's wall-clock is changed), cooldowns shorten or lengthen by the size of the jump. This is accepted for a single operator's LAN server.
