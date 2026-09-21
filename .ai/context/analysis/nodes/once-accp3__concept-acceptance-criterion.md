---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp3"
source_channel: "rollout"
aliases: ["L0-once-accp3"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1168
tags: ["acceptance-criterion","persistence","restart","spec-13-4","C-6","L0-once"]
---

**AC-ONCE-3 — The block survives a server restart.**

Maps to §13: *«После рестарта мира второй survival-крафт всё ещё заблокирован.»* This is the spec's only explicit persistence test and the direct evidence for C-6.

**GIVEN** a world where the Web Sword has been survival-crafted once,
**WHEN** all players disconnect, the world is saved, and the dedicated server is stopped and restarted,
**THEN** on rejoin, a survival craft attempt is still blocked exactly as in AC-ONCE-2,
**AND** the flag still reports the original `crafterName` and `at` values.

**Extend to all three durability events separately** — a single restart test hides two weaker failures:

| Sub-case | Assertion |
|---|---|
| a. Crafter logs out and back in (no restart) | Flag intact |
| b. World autosaves / manual save, no restart | Flag intact |
| c. Full server stop + start | Flag intact |

**Harness:** Docker BDS — this one cannot be covered by GameTest alone, since GameTest does not restart the host. Stop/start the container, rejoin, attempt the craft, grep the content log. This is the `bds:check` hop of C-11.

**Owned by:** `L0-once` · **Rules:** R-002 · **Rolls up to:** `L0-qatg`
