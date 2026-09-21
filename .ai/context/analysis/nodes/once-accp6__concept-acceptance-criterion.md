---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp6"
source_channel: "rollout"
aliases: ["L0-once-accp6"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1553
tags: ["acceptance-criterion","death","C-7","spec-12","L0-once"]
---

**AC-ONCE-6 — Death does not reset the craft flag.**

Maps to §12: *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»* The second clause is this component's; the first belongs to `L0-keep`.

**GIVEN** a world where the Web Sword has been survival-crafted, and the crafter is holding it,
**WHEN** the crafter dies — including while the ability is on cooldown — and respawns,
**THEN** the world craft flag is unchanged: still `crafted: true`, same `crafterName`, same `at`,
**AND** a survival craft attempt after respawn is still blocked (AC-ONCE-2 holds).

**Extend to the adjacent reset vectors**, all of which must leave the flag untouched:

| Vector | Assertion |
|---|---|
| Death + respawn | Flag intact |
| Disconnect + reconnect | Flag intact |
| Crafter leaves the server permanently | Flag intact, `crafterName` still resolvable in the denial message |
| Crafted sword destroyed (lava / void / `/clear`) | Flag intact — **see CTR-006**, this is the disputed one |

The last row is asserted as written here (flag survives) because R-001 says the flag is write-once, but it is the behaviour CTR-006 asks the owner to confirm. If the owner decides destruction should re-open the budget, this row inverts and R-001 must be amended.

**Cross-component guard.** This criterion is really a test that `L0-keep` never writes `L0-once`'s state. `L0-qatg` should treat a failure here as a boundary breach, not a gate bug.

**Owned by:** `L0-once` · **Rules:** R-002, R-007 · **Rolls up to:** `L0-qatg`
