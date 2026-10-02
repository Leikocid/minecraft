---
type: "concept-acceptance-criterion"
node_id: "L0-sauc-ac05"
source_channel: "rollout"
analysis_version: 5
title: "AC-sauc-5 (bds) · The beam property and the sounds follow the magnet phase"
aliases: ["L0-sauc-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 857
tags: ["is_a:acceptance-criterion", "channel:bds", "beam", "sound", "relates_to:L0-sauc-r005", "relates_to:L0-sauc-r006"]
level: 2
---
# AC-sauc-5 (bds) · The beam property and the sounds follow the magnet phase

**GIVEN** a full event on scaled or real durations, with the `playUfoSound` wrapper spied.

**THEN**
- `andrew:beam` is false on every tick of arrival and departure.
- It is true from the magnet-on tick through the last magnet tick.
- It is false from the release tick on.
- `andrew:beam_len` = `hoverY` − centre.y.
- The sound log is exactly:
  - `beacon.activate` once, at magnet-on;
  - `beacon.ambient` every 40 ticks during the magnet (29 or 30 calls for 1200 ticks);
  - `beacon.deactivate` once, at release.
- No UFO sound plays after removal.

**Shoot-down variant** (in the magnet phase): the beam turns false and `beacon.deactivate` plays in the shot tick, then `random.explode` plays once at the blast. If the shot comes during arrival there is no `beacon.deactivate`.
