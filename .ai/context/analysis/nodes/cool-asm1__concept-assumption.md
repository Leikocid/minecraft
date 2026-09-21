---
type: "concept-assumption"
node_id: "L0-cool-asm1"
source_channel: "rollout"
aliases: ["L0-cool-asm1"]
part_of: ["L0-cool"]
is_a: ["assumption"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 927
tags: ["assumption","must-ask","persistence","L0-cool"]
level: 2
---

## ASM-cool-1 — Cooldown persists across disconnect/reconnect `MUST_ASK`

**Assumed.** The cooldown record survives player logout and rejoin (and ordinary server restart, since it rides on the player's saved data) — i.e. Q-009 is answered "persist."

**Basis.** L0's `concept-client-question` (Q-009) recommends this explicitly: *"A resetting cooldown is an obvious logout-abuse path, and C-7 already establishes that reconnecting must not confer an advantage."* No stronger source exists — the spec itself (§12) defers to an unspecified framework.

**Impact if wrong.** If the owner instead wants the cooldown to reset on rejoin, `L0-cool-adr1`'s storage choice is superseded — move off player-scoped dynamic properties to a non-persistent structure cleared at world start. `L0-cool-proc1` and the public API shape (`isReady`/`start`) are unaffected. Confirm before implementation; this governs only storage, not the contract.
