---
type: "concept-contradiction"
node_id: "L0-lgnd-cx11"
source_channel: "rollout"
analysis_version: 7
title: "CX-lgnd-11 · The accepted `wpn2` backlog is not in the code, and v3 builds on it"
aliases: ["L0-lgnd-cx11"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 1503
tags: ["status:resolved", "category:decision-vs-code", "severity:high", "target:L0-lgnd", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-wpn3
level: 2
---
---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-adr-wpn2", "L0-lgnd-cx08", "L0-lgnd-cx09", "L0-lgnd-cx10", "L0-lgnd-ad11", "L0-lgnd-p003"]
status: open
category: decision-vs-code
---
# CX-lgnd-11 · The accepted `wpn2` backlog is not in the code, and v3 builds on it

**Decision.** `L0-adr-wpn2` (accepted) ordered a Stage-3 follow-up "before structures start":
- `allow_off_hand` on both items;
- the off-hand read in `retain`;
- the `gen` guard;
- the `_owed` list;
- rewrites of `ac01`, `ac07`, `ac08` and `ac10`.

**Code (2026-09-29).**
- `git log -- src/legendary` ends at `120bdd5`, which predates the ruling.
- `state.ts` and `recovery.ts` have no `gen`.
- `_owed` is `owed[ownerId] = serializeMark(mark)` (`recovery.ts:253`).
- `retention.ts` has no `Offhand`.
- `grep allow_off_hand packs/` finds nothing.

Meanwhile the structures shipped (v1.2.0, `af024e4`). So the ordering in `wpn2` was not followed.

**Why it matters for v3.**
- `ad11` (holder return) without `gen` gives the **new** holder a live duplicate when a pickup is missed (C-7).
- `p008` and the Cannon RMB make item-entity churn next to hoppers much more likely.
- The `ac04`–`ac06` iPad checks stay impossible.

**Resolution needed.** Confirm that the `lgnd` v3 task **includes** the `wpn2` backlog as its first step, not as a separate epic. Otherwise, re-sequence `orbc` behind that epic. Also, per memory "orchestrator merges unproven work": after the merge, reopen and re-verify the iPad criteria by hand.

**Resolution (reduce, v3):** resolved by `L0-adr-wpn3`.
