---
type: "concept-rule"
node_id: "L0-cool-r004"
source_channel: "rollout"
aliases: ["L0-cool-r004"]
part_of: ["L0-cool"]
is_a: ["rule"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 1254
tags: ["rule","invariant","actionbar","performance","L0-cool"]
level: 2
---

**R-cool-004 — Actionbar is visible only to current holders, and the render loop is scoped the same way.**

Source: §8 — *«При удержании Web Sword игрок должен видеть...»*; C-4; decomposition plan — *"the only child with a per-tick component, which must stay scoped to holders of the sword."*

The countdown renders only for a player currently holding (main or off hand — `L0-cool-asm3`) an item registered with an active ability key; it is cleared, or simply not written, the instant they stop holding it or the timer reaches zero. The recurring render interval that produces this must enumerate **only** such holders each cadence tick — never all online players unconditionally, never a world scan.

These are the same requirement seen from two sides: what the player sees, and what the loop is allowed to cost.

**Consequences:**
- Holding state is re-evaluated every cadence tick, not cached — unequipping mid-cooldown stops both the display and its per-tick cost immediately.
- A server with zero current holders costs this component nothing beyond the loop's own holder-filter check.

**Rationale.** C-4 forbids per-tick global scans; this is the one named exception, conditional on staying scoped.

**Verified by:** `L0-cool-ac03`, `L0-cool-ac05`.
