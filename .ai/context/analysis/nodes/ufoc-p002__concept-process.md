---
type: "concept-process"
node_id: "L0-ufoc-p002"
source_channel: "rollout"
analysis_version: 5
title: "P-ufoc-2 · Per-tick phase machine"
aliases: ["L0-ufoc-p002"]
is_a: ["process"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 2181
tags: ["is_a:process", "phase-machine", "relates_to:L0-adr-ufpc", "relates_to:L0-sauc-p001", "relates_to:L0-magn-phld", "relates_to:L0-magn-prel"]
level: 2
---
# P-ufoc-2 · Per-tick phase machine

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["process"]` · `relates_to: ["L0-adr-ufpc", "L0-adr-ufsd", "L0-sauc-p001", "L0-sauc-p002", "L0-magn-pscn", "L0-magn-phld", "L0-magn-prel", "L0-ufoc-r004"]`

This runs on every interval tick while a session exists. The order inside one tick is fixed (`adr-ufpc`, `r004`):

1. **Latch.** If `offLatch` is set:
   - if `magnetOn` is set: `onPhase("release")`, which runs `magn-prel`, then clear `magnetOn`. *Reduce v5:* the test is the flag, not the current phase, because `reportShotDown` has already moved the phase to `downed` by this point (`L0-adr-ufsd`);
   - then:
     - `stop` or `abort` → `endEvent(reason)`, which `sauc` takes as "remove the saucer now";
     - `shot` → continue, because `reportShotDown` has already moved the phase to `downed`.

   Clear the latch.
2. **Saucer liveness.** If the phase is not `downed` and `sauc` reports no valid saucer after the first arrival tick, request `abort` and go to the next tick (`as04`).
3. **Advance.** `phaseTick++`, then:
   - `arrival` and `phaseTick ≥ D.arrival` (400) → set `magnetOn`, then `onPhase("magnet")`. `magn` scans once (C-5d).
   - `magnet` and `≥ D.magnet` (1200) → clear `magnetOn`, `onPhase("release")`, then `onPhase("departure")` in the same tick.
   - `departure` and `≥ D.departure` (300) → `endEvent("departed")`. `sauc` removes the saucer in that tick (`sauc-r002`).
   - `downed` is **not** ended here (see step 6).

   On every transition `phaseTick` resets to 0.
4. `saucerStep(tick)`, while the session still exists.
5. `magnetStep(tick)`, only in the `magnet` phase and only after step 4, so `saucerPosition()` is this tick's position.
6. **Downed end** (*reduce v5*, `L0-adr-ufsd`). In `downed`, the event ends with `endEvent("downed")` after step 4, when `sauc` reports the fall finished or `phaseTick ≥ D.downed` (60), whichever is first. `sauc`'s fall therefore gets its tick-60 `saucerStep`, where the blast, reward and broadcast run. On `endEvent("downed")`, `sauc` runs any of those it has not run yet, once per `eventId`, at the last known position.

**reportShotDown({eventId, …})**, from `sauc`, in `orbc`'s flight step:
- ignored if `eventId` is not the live one or `downedHandled` is set;
- otherwise: set `downedHandled`, write `next_ms = now() + PAUSE_MS`, set `offLatch ??= "shot"` (`magnetOn` is left as it is, so step 1 releases the magnet if it was on), set `phase = downed` and `phaseTick = 0`, and call `onPhase("downed")`.

No world mutation happens here; the magnet release waits for step 1 of the next UFO tick.

**Every `onPhase` payload** is `{centre, hoverY, saucerPos: sauc.saucerPosition() ?? undefined, eventId}`. Consumers must not mutate it.

Exceptions thrown by a consumer are caught and logged with `[andrew] ufo`. The event is then aborted, so a broken consumer cannot leave a saucer hanging.
