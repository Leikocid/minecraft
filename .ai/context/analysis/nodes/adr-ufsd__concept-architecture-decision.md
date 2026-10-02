---
type: "concept-architecture-decision"
node_id: "L0-adr-ufsd"
source_channel: "rollout"
analysis_version: 5
level: 1
title: "ADR-L0-ufsd · The shoot-down handshake"
aliases: ["L0-adr-ufsd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 3853
tags: ["v5", "status:accepted", "ufo", "shoot-down", "phase-contract", "relates_to:L0-ufoc", "relates_to:L0-sauc", "relates_to:L0-magn", "relates_to:L0-adr-ufpc", "relates_to:L0-ufoc-p002", "relates_to:L0-sauc-p002", "relates_to:L0-magn-prel", "relates_to:L0-magn-a14"]
---
---
title: "ADR-L0-ufsd · The shoot-down handshake across `sauc`, `ufoc` and `magn`: the release keys on 'magnet was on', and `downed` ends after the saucer's step"
aliases: ["L0-adr-ufsd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-magn", "L0-adr-ufpc", "L0-adr-ufoi", "L0-ufoc-p002", "L0-ufoc-ent2", "L0-sauc-p002", "L0-sauc-ent2", "L0-magn-prel", "L0-magn-a14", "L0-sauc-ac03"]
requires: ["L0-adr-ufpc"]
status: accepted
---
# ADR-L0-ufsd · The shoot-down handshake

**Why this is an L0 decision.** All three children are consistent with `L0-adr-ufpc` one by one. Two faults show up only when `L0-sauc-p002` (shoot-down), `L0-ufoc-p002` (phase machine) and `L0-magn-prel` (release) are read together, in the tick order of one shot.

**Fault 1: the magnet would never be released after a shot.** As written by the child run:
- `sauc-p002` calls `requestMagnetOff("shot")` and then `reportShotDown(...)`, both inside `orbc`'s flight step.
- `ufoc`'s `reportShotDown` latches `"shot"` and sets `phase = downed` at once.
- On the next UFO tick, `ufoc-p002` step 1 released only "if the phase is `magnet`". By then the phase is already `downed`, so `onPhase("release")` never fired.
- Result: `magn-prel` never runs. Held entities fall only because `magnetStep` stops being called. The drop-exemption `entitySpawn` listener stays subscribed, `andrew:ufo_iron` tags remain, and the magnet session leaks into the next event. That breaks `L0-magn-a14` ("a shoot-down releases identically to `stop`") and `magn-prel`'s claim that "every trigger takes the same path".

**Fault 2: the tick-60 blast had no step to run in.** `ufoc-p002` ended `downed` at `phaseTick ≥ 60` in its *advance* step, before `saucerStep`. `sauc-p002` runs the blast "on contact or at tick 60" inside `saucerStep`. So with no ground contact (a saucer shot over the Void or deep water), the blast, the 8 diamonds + totem and the broadcast depended on how `sauc` handled `endEvent`. No artifact defined that.

**Decision.**
1. **The release keys on a flag.** The session carries `magnetOn`. It is set at the arrival → magnet transition and cleared by the release. Latch step 1 releases if `magnetOn`, whatever the current phase is. In arrival or departure a shot latches with `magnetOn` false, so `magn` gets no release, which matches `sauc-p002` step 3 ("a no-op for `magn`").
2. **`downed` ends after the saucer's step.** In `downed`, `ufoc` calls `saucerStep` first. It then ends the event when `sauc` reports the fall finished, or when `phaseTick ≥ D.downed` (60), whichever comes first.
3. **`endEvent("downed")` is a completion guarantee for `sauc`.** Any of blast / reward / broadcast that has not run yet runs then, once per `eventId`, at the last known position. That is the existing `sauc-p002` failure clause ("tied to the latch, not to the entity"), now bound to a named call.
4. Order within the shot is unchanged. The absorb runs in `orbc`'s step and touches only the charge. Every world mutation (release, fall teleports, blast, reward) runs inside the UFO interval (`L0-adr-ufpc`, C-5d).

**Reconciled in place at this reduce** (all are this run's artifacts): `L0-ufoc-p002` (steps 1, 3, 6 and `reportShotDown`) and `L0-ufoc-ent2` (`magnetOn`). `sauc-p002` and `magn-prel` need no change.

**Proof obligations.**
- On `L0-sauc-ac03` (shot in the magnet phase), add these assertions:
  - within 2 UFO ticks of the shot, the `andrew:ufo_iron` tag count is 0;
  - the drop-exemption listener is unsubscribed: a test drop near the hover point afterwards is not exempted.
- Add a case for a shot over a column with no ground within 60 ticks. Assert exactly 8 diamonds + 1 totem and exactly one broadcast.
- Red proof: a negative control inside the test, with the release keyed on `phase === "magnet"`, must fail the first assertion.
