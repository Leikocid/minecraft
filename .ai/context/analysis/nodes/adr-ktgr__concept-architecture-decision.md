---
type: "concept-architecture-decision"
node_id: "L0-adr-ktgr"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ADR-L0-ktgr · The Katana inherits the framework's C-16 deviations"
aliases: ["L0-adr-ktgr"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 3604
tags: ["v6", "katana", "C-16", "status:accepted-autopilot", "resolves:L0-xcx21", "resolves:L0-lgnd-cx14", "relates_to:L0-katn", "relates_to:L0-lgnd"]
---
---
title: "ADR-L0-ktgr · The Katana inherits the framework's documented C-16 deviations unchanged; no Katana-specific recovery code"
aliases: ["L0-adr-ktgr", "Katana global-rules ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-lgnd", "L0-xcx21", "L0-lgnd-cx14", "L0-xcx11", "L0-adr-hold", "L0-xasm22", "L0-lgnd-ad14", "L0-lgnd-r016", "L0-lgnd-r017", "L0-lgnd-ac24", "L0-katn-ac07", "L0-katn-r002"]
requires: ["L0-lgnd-ad14", "L0-lgnd-r017"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-3", "L0-xq6"]
governs_files: ["src/legendary/", "src/katana/"]
---
# ADR-L0-ktgr · The Katana inherits the framework's C-16 deviations

**Status:** accepted at reduce v6 as the autopilot default. The operator confirms or overturns it through `L0-xq6`, which does not block the build.

## Context
Katana §3/§13 asks to "preserve all global legendary-item rules". Both children agree that the framework meets those rules as built, by registering def #4 (`L0-lgnd-ad14`, `L0-xasm22`). Two child findings asked the reduce whether the **existing** deviations also bind the new weapon:
- `L0-xcx21`: T17 says the item "survives" cactus and TNT. As built, the item is destroyed and a marked copy is **returned** (C-16, the reading accepted when `xcx10` closed).
- `L0-lgnd-cx14`: a legendary held by an **armour stand** that falls into the Void is lost. Stand hands cannot be read on 2.10.0, and only chest and hopper minecarts are `VOID_HOLDER_TYPES` (`recovery.ts:135`, as read 2026-10-03).

## Decision
1. **T17 = the shipped three-tier reading** for the Katana, as for the other three weapons:
   - fire and lava are prevented (`fire_resistant`);
   - Orbital blast and ring are prevented (`protectLegendariesIn`);
   - cactus, TNT and despawn are returned (immediately, or owed).
   - The test text is `L0-lgnd-ac24`, which `L0-katn-ac07` now cites instead of restating. **Resolves `L0-xcx21`.**
2. **T18 target is `mark.owner`** until `L0-xcx11` / `L0-adr-hold` closes. The Katana's "последнему владельцу" adds a fourth spec voice to that open question but does not change it. Nothing in `katn` reads or writes `holder`.
3. **The armour stand in the Void is a documented C-16 deviation for all four legendaries** (`cx14` option a). The Katana adds no exposure:
   - its ability moves only the wielder, edits no block and spawns no entity (`L0-katn-r002`, `L0-lgnd-r017`);
   - the magnet skips holders that carry a legendary (`L0-lgnd-r016`).

   Option (b), a `hasitem` probe, stays a backlog note: it could detect a legendary type but never read its mark, so the best it could do is re-issue the ledger's last instance. **Resolves `L0-lgnd-cx14`** as a recorded deviation.
4. **No Katana-specific recovery, retention or HUD code.** The only framework delta is def #4 (`L0-lgnd-ad14`). Any later need for a hook ("rooted" for traps, `L0-xasm21`; a craft-time ingredient read, `L0-lgnd-as17`) is raised as an L0 contradiction, not patched locally.

## Rejected
- **A per-weapon Void or TNT path for the Katana.** It splits one policy into four, against `L0-lgnd-ad14`.
- **Holding the Katana build until `xcx11` closes.** T18 already passes against `mark.owner`; the holder change is one line in `lost()` and is reused by all four weapons.

## Consequences
- `L0-xcx21` and `L0-lgnd-cx14` close as resolved, pointing here.
- The module README's deviation list gains one line, "armour stand in the Void: lost", which covers all four legendaries.
- If the operator rejects item 1 or 3 via `L0-xq6`, the fix belongs in `lgnd` and applies to all four weapons.
