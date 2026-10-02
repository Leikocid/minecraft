---
type: "concept-architecture-decision"
node_id: "L0-webs-ad02"
source_channel: "rollout"
analysis_version: 5
level: 2
title: "AD-webs-02 — This component exposes a narrow cast callback into `L0-lgnd`'s dispatcher; it does not own its own `itemUse` subscription"
aliases: ["L0-webs-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1556
tags: ["architecture-decision", "status:proposed", "dispatch"]
---
---
is_a: ["architecture-decision"]
part_of: ["L0-webs"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-ad06", "L0-lgnd-cx04"]
status: proposed
---
# AD-webs-02 — This component exposes a narrow cast callback into `L0-lgnd`'s dispatcher; it does not own its own `itemUse` subscription

**Context.** Before the `L0-lgnd` migration, the shipped `registerTrap()` (`src/websword/trap.ts`) subscribed to `itemUse` directly. `L0-lgnd-ad06`/`L0-lgnd-cx04` establish that the framework now owns dispatch (busy/cooldown/hand-priority, `L0-lgnd-p004`) and that `registerTrap` must stop self-subscribing, needing a framework-side shim so the existing GameTest harness (`src/gametest/main.ts`) keeps working.

**Decision.** `L0-webs` implements only a pure `resolveAndPlaceTrap(player): { filled: number }`-shaped callback (per `L0-webs-p001`), registered once against `L0-lgnd`'s `LegendaryDef` registry (`L0-lgnd-ent1`) as the Web Sword's cast implementation. Ready/busy/hand-priority dispatch and the HUD stay in `L0-lgnd`. Reconciled at L0 (`L0-adr-cast`): the registered `ability(player, hand)` wraps the trap, calls `cooldown.start(player, "web_sword")` when `filled > 0` and returns `"cast"`, otherwise returns `"refused"` — the `L0-lgnd` handler contract, not a bare `{filled}`.

**Rejected alternative.** Keeping `registerTrap`'s independent `itemUse` subscription and having it call into `L0-lgnd` only for cooldown bookkeeping — rejected because it duplicates hand-priority/busy dispatch logic in two places and is exactly what `L0-lgnd-cx04` flags as breaking without a shim.

**Status.** Proposed — consistent with `L0-lgnd-ad06`'s existing shim direction; callback shape settled by `L0-adr-cast`.
