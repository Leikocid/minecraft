---
type: "concept-contradiction"
node_id: "L0-lgnd-cx04"
source_channel: "rollout"
analysis_version: 3
title: "CTR-lgnd-04: ADR-021 says existing tests stay unchanged, but the framework itself requires Web Sword changes"
aliases: ["L0-lgnd-cx04"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1255
tags: ["contradiction", "target:L0-lgnd", "C-10", "ADR-021", "resolved", "resolved_by:L0-adr-lgnd"]
level: 2
---
---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad06", "L0-lgnd-ac11"]
status: resolved
category: source-vs-decision
---
# CTR-lgnd-04: ADR-021 says existing tests stay unchanged, but the framework itself requires Web Sword changes

**ADR-021:** the migration is covered by the existing GameTests without changing them.

**Required changes that touch shipped Web Sword behaviour:**
1. `allow_off_hand` plus the off-hand HUD (Q-019 a).
2. Void and lava return for the Web Sword (Q-020 a). The shipped `andrew:websword_*` tests do not cover this, so they do not break. But Q-014's "lost for good" is no longer true.
3. Death retention of several items: pending becomes an array, with a legacy read.
4. `registerTrap` no longer subscribes to `itemUse` itself. The GameTest pack calls `registerTrap()` today (`src/gametest/main.ts`). It loses its trigger unless the shim keeps a subscribing variant.

**Effect.** "Tests unchanged" holds only with the shims in `L0-lgnd-ad06` plus a GameTest-side `registerLegendaryFramework()`. Because of item 4, `src/gametest/main.ts` has to change. That file is test harness code, not a test *assertion*.

**Needs:** L0 to read ADR-021 as "no assertion edits", not "no file edits under `src/gametest/`".
