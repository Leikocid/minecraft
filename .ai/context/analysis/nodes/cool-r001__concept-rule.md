---
type: "concept-rule"
node_id: "L0-cool-r001"
source_channel: "rollout"
aliases: ["L0-cool-r001"]
part_of: ["L0-cool"]
is_a: ["rule"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 875
tags: ["rule","invariant","cooldown","L0-cool"]
level: 2
---

**R-cool-001 — Exactly 30-second cooldown duration.**

Source: §8 — *«Cooldown способности: ровно 30 секунд после успешного создания ловушки.»*

Duration is exactly 30 real-time seconds (600 ticks at 20 TPS). It is stored on the ability's registration (`L0-cool-ent1`, `AbilityRegistration.durationTicks`), not hardcoded inline at each call site — so a future weapon can register its own duration without touching this component's core logic (ADR-007 seam).

**Consequences:**
- `readyAtTick = currentTick + durationTicks` at the moment `start()` is called (R-cool-002).
- No mechanism shortens or extends an in-progress cooldown; the duration is fixed at start time.

**Rationale.** This is the ability's balance knob. §8 states it as an exact figure with no tolerance language, unlike several other spec clauses that hedge.

**Verified by:** `L0-cool-ac01`, `L0-cool-ac02`.
