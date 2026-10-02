---
type: "concept-entity"
node_id: "L0-ufoc-ent2"
source_channel: "rollout"
analysis_version: 5
title: "E-ufoc-2 · Live event session (in memory only)"
aliases: ["L0-ufoc-ent2"]
is_a: ["entity"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1583
tags: ["is_a:entity", "in-memory", "relates_to:L0-adr-ufpc", "relates_to:L0-sauc-ent2", "relates_to:L0-xasm17"]
level: 2
---
# E-ufoc-2 · Live event session (in memory only)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-ufpc", "L0-sauc-ent2", "L0-xasm17", "L0-ufoc-p002"]`

There is at most one session at a time (UFO §2). It exists from arrival start to the end of the event, and it is never persisted (C-23).

| Field | Type | Notes |
|---|---|---|
| `eventId` | string | `${now()}-${random}`. It is unique per script load, so after a restart no entity's `andrew:ufo_event` can match (`L0-xasm17`). |
| `phase` | `arrival` \| `magnet` \| `departure` \| `downed` | `release` is instant and `pause` means no session, so neither is ever stored. |
| `phaseTick` | int | Ticks elapsed in the current phase. It is advanced only by the UFO interval. |
| `centre` | `{x, y, z}` int | The block under the target's feet at arrival start, frozen (`r002`). |
| `hoverY` | number | `r003`. It is computed once and passed in every `onPhase`. |
| `targetId` | string | Informational only. The event goes on if the target leaves or dies (UFO §10). |
| `source` | `schedule` \| `command` | Whether the event was started by the schedule or by `/andrew:ufo come`. |
| `offLatch` | `undefined` \| `shot` \| `stop` \| `abort` | Set by `requestMagnetOff(reason)`. Consumed at the start of the next interval tick (`adr-ufpc`). The first reason wins. |
| `magnetOn` | boolean | Set when the magnet phase starts and cleared by the release. Step 1 of `p002` releases the magnet on this flag, not on `phase`, because a shoot-down moves `phase` to `downed` before the latch is consumed (*reduce v5*, `L0-adr-ufsd`). |
| `downedHandled` | boolean | Makes `reportShotDown` idempotent per `eventId`. |

The phase durations come from the environment seam's table (`ad01`): `{arrival: 400, magnet: 1200, departure: 300, downed: 60}` in ticks, and `PAUSE_MS: 900000`.
