---
type: "concept-architecture-decision"
node_id: "L0-cool-adr1"
source_channel: "rollout"
aliases: ["L0-cool-adr1"]
part_of: ["L0-cool"]
is_a: ["architecture-decision"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 2555
tags: ["adr","architecture-decision","cooldown","persistence","performance","L0-cool"]
level: 2
---

## ADR-cool-1 — Player-scoped persistent storage, single holder-scoped render loop

**Context.** Two related "how" decisions fall out of L0-level ADR-007 (cooldown is a per-player-per-ability service) once implementation detail is needed: *where* the record lives, and *how* the actionbar loop stays within C-4's "no per-tick global scan" prohibition. Q-009 (open) asks whether the cooldown survives logout/rejoin; CTR-004 notes §12 defers this to a project-wide framework that doesn't exist; C-7 already establishes that reconnecting must never confer an advantage.

**Decision — storage.** Store each `CooldownRecord` as a **player-scoped dynamic property** (`player.setDynamicProperty`/`getDynamicProperty`), one per `abilityKey`. This adopts Q-009's recommended answer ("persist it") as the working default (`L0-cool-asm1`, `MUST_ASK` until confirmed).

**Decision — render loop.** Run **one** `system.runInterval` (not one per player), at a fixed cadence (`L0-cool-asm2`), that filters to players whose currently-held item matches a registered `itemTypeId` before doing any read or render work for them.

**Rejected alternatives — storage.**
- *In-memory `Map` keyed by player id* — resets on restart and possibly on player-object recreation at rejoin, reopening the logout-abuse path C-7 warns about.
- *World-scoped dynamic property indexed by player id* (mirroring ADR-005's craft flag) — works, but the craft flag is world state by nature; a cooldown is player state by nature, and the engine already offers per-player storage directly.
- *Scoreboard objective* — visible/editable by any operator, semantically a score (same objection ADR-005 raised).

**Rejected alternatives — render loop.**
- *Per-tick (every tick) updates* — no benefit for a countdown read in whole seconds; needlessly maximizes the frequency of the exact pattern C-4 is wary of.
- *One interval per player, registered on pickup / cleared on drop* — more "precise" in theory, but multiplies interval handles and requires hooking every equip/unequip transition for one loop's worth of scoping benefit.
- *Update only on demand* — fails §8 outright, which requires visibility *while holding*, not on request.

**Consequence.** No special-case code is needed for reconnect — `isReady` reads the same record regardless of session continuity. Loop cost scales with concurrent holders, not with online population or world size. If Q-009 is answered "reset on rejoin," only the storage half is superseded; the public contract (`isReady`/`start`) and the loop design are unaffected.
