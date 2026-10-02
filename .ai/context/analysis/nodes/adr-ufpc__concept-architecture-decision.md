---
type: "concept-architecture-decision"
node_id: "L0-adr-ufpc"
source_channel: "rollout"
analysis_version: 4
title: "ADR-L0-ufpc · The UFO phase contract as `sauc` and `magn` consume it"
aliases: ["L0-adr-ufpc"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 3124
tags: ["v4", "status:accepted", "ufo", "relates_to:L0-ufoc", "relates_to:L0-sauc", "relates_to:L0-magn", "relates_to:L0-adr-ufom", "relates_to:L0-adr-ufoi"]
level: 2
---
---
title: "ADR-L0-ufpc · The UFO phase contract as `sauc` and `magn` consume it (binding on the `ufoc` re-run)"
aliases: ["L0-adr-ufpc"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-magn", "L0-adr-ufom", "L0-adr-ufoi", "L0-sauc-p002", "L0-sauc-p003", "L0-magn-phld", "L0-magn-prel"]
requires: ["L0-adr-ufom"]
status: accepted
---
# ADR-L0-ufpc · The UFO phase contract as `sauc` and `magn` consume it

**Context.**
- The L0 plan says `ufoc` publishes three signals: `onPhase`, `requestMagnetOff` and `saucerPosition()`.
- `ufoc` failed in this run, so no artifact publishes the contract.
- `sauc` and `magn` were both analysed against the plan's wording. On top of the three signals they rely on:
  - two more calls (`saucerStep`, `reportShotDown`);
  - an extra argument on the `orbc` interceptor (`attack`).

  These are **additions**, not different signals. Neither child contradicts the plan or the other child.

**Decision.** The `ufoc` re-run implements exactly this surface. Changing it needs a new L0 ADR.

| Call | Direction | Consumer | Semantics |
|---|---|---|---|
| `onPhase(phase, {centre, hoverY, saucerPos, eventId})` | `ufoc` → both | `sauc` (all phases), `magn` (`magnet`, `release`) | Phases: `arrival` → `magnet` → `release` → `departure` → `pause`, plus `downed`. Every call carries the same `eventId`. |
| `saucerStep(tick)` | `ufoc` interval → `sauc` | `sauc-p001` | Called once per active tick, before the magnet step. |
| `magnetStep(tick)` | `ufoc` interval → `magn` | `magn-phld` | Called after `saucerStep` in the same tick, so `saucerPosition()` is already this tick's position. |
| `saucerPosition()` | `sauc` → `magn` | `magn-phld` | Read only inside `magnetStep`. |
| `requestMagnetOff(reason)` | `sauc`, command → `ufoc` | `magn-prel` | Reasons: `"shot"`, `"stop"`, `"abort"`. It **latches**: `ufoc` runs the release at the start of its next interval tick, never inside the caller's stack. |
| `reportShotDown({eventId, ownerId, ownerName})` | `sauc` → `ufoc` | `ufoc` | Enters `downed`, and sets the next arrival to now + 15 min. Idempotent per `eventId`. |
| `registerInterceptor((attack, charge, from, to, tick) => boolean)` | `sauc` → `orbc` | `sauc-p003` | As in `L0-adr-ufoi`. Its signature was reconciled at this reduce to include `attack`. |

**Why the latch.**
- A shoot-down is detected inside `orbc`'s flight interval, not the UFO interval.
- Running `magn-prel` from there would put UFO world mutation outside the one shared interval (C-5d, `L0-adr-ufom` §3). It would also make the release order depend on which interval Bedrock runs first.
- The latch costs at most one extra hold step (one tick). `magn-a14`'s "identical release from a shoot-down" holds because the release path is the same.

**Consequences.**
- Every UFO world mutation (teleport, `setType`, knockback, release) runs inside the UFO interval. The one exception is `sauc`'s charge absorption, which runs in `orbc`'s step and touches only the charge.
- The `sauc` and `magn` tasks can be built against a stub `ufoc` that implements this table (Stage 6 order, step 2).
