---
type: "concept-rule"
node_id: "L0-cool-r002"
source_channel: "rollout"
aliases: ["L0-cool-r002"]
part_of: ["L0-cool"]
is_a: ["rule"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 1164
tags: ["rule","invariant","cooldown","ordering","L0-cool"]
level: 2
---

**R-cool-002 — Cooldown starts only on confirmed successful activation.**

Source: §5 — *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает и cooldown не запускается»*; §8; ADR-006's forced ordering (validate reach → check cooldown → place cells → start cooldown).

`start(player, abilityKey)` may only be called by `L0-trap`, and only after cell placement is confirmed complete. A failed reach check, an out-of-range target, or any other failed precondition must not call `start` — no cooldown-related state may be written on a failed attempt.

**Consequences:**
- `isReady()` (the pre-placement check) is strictly read-only — it must never have a side effect that could be mistaken for arming the timer.
- A failed attempt leaves any pre-existing cooldown record completely untouched, not reset, not extended.
- This component has exactly one call site that writes a new record; there is no secondary or implicit start path.

**Rationale.** §12's boundary note: *"failing [reach] is free"* — the cooldown is a cost of success only. Any other order lets a player burn the cooldown on a whiff.

**Verified by:** `L0-cool-ac04`.
