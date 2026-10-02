---
type: "concept-architecture-decision"
node_id: "L0-ufoc-ad04"
source_channel: "rollout"
analysis_version: 5
title: "ADR-ufoc-4 · `/andrew:ufo` as a custom command with an enum parameter, at GameDirectors"
aliases: ["L0-ufoc-ad04"]
is_a: ["architecture-decision"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1270
tags: ["is_a:architecture-decision", "command", "relates_to:L0-ufoc-p004"]
level: 2
---
# ADR-ufoc-4 · `/andrew:ufo` as a custom command with an enum parameter, at GameDirectors

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-ac06"]`

**Context.**
- UFO §9 wants `/andrew:ufo come|stop|enable|disable`, for operators only.
- The project already registers `andrew:` commands through `startup.customCommandRegistry` at script load (`src/main.ts:42`, `src/structures/commands.ts:368–378`), with `CommandPermissionLevel.GameDirectors`.

**Decision.**
- Register one command, `andrew:ufo`, with one mandatory enum parameter (`registerEnum("andrew:ufo_action", ["come","stop","enable","disable"])`) and `permissionLevel: GameDirectors`.
- The callback only queues the action. The world work happens in `system.run`, because callbacks run in restricted mode.

**Rejected.**
- `/scriptevent andrew:ufo …`. It has no proper permission gate, it is not discoverable in the command UI, and it does not match the spec's syntax.
- Four separate commands. That does not match the spec's single `/andrew:ufo <action>` and would add more registry entries.
- An `Admin` permission level. Operators in BDS at the default `op-permission-level` would be refused, and it would not match the other `andrew:` commands.
