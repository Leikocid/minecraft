---
type: "concept-process"
node_id: "L0-lgnd-p006"
source_channel: "rollout"
analysis_version: 2
title: "P-lgnd-006: Registration, startup and Web Sword migration"
aliases: ["L0-lgnd-p006"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1466
tags: ["process", "registration", "migration"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-lgnd-r006", "L0-lgnd-ad01", "L0-lgnd-ad06"]
---
# P-lgnd-006: Registration, startup and Web Sword migration

1. **Load order in `src/main.ts`:**
   1. `registerLegendary(webSwordDef)` and `registerLegendary(scytheDef)`.
   2. `registerLegendaryFramework()`, which subscribes the craft gate, retention, loss watcher, dispatcher and HUD **once**.
   3. `registerLegendaryCommands()` in `system.beforeEvents.startup`.
   The shipped `registerCraftGate / registerRetention / registerCooldownHud` calls are replaced by step 2. `trap.ts` exports the ability handler instead of subscribing to events.
2. **Migration is code-only.** No data is rewritten at startup. Prefix `ws` yields exactly the shipped key names. Legacy formats are read on access (`L0-lgnd-r006`). There is no "migrated" flag and no half-run migration state.
3. **GameTest pack** (`src/gametest/main.ts`) arms its own copy of the framework, as it does today for the craft gate and retention, because SimulatedPlayer bindings exist only there.
4. **Shims** keep shipped import paths and exports alive (`L0-lgnd-ad06`): `src/websword/{state,cooldown,craftgate,retention,commands}.ts` re-export from `src/legendary/*` bound to the Web Sword def.
5. The startup `console.warn` lines (`[andrew] web sword … armed`) are kept for log continuity. `scripts/*.mjs` does not assert on them (checked), so this is a convenience, not a gate.
