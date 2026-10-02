---
type: "concept-process"
node_id: "L0-magn-prel"
source_channel: "rollout"
analysis_version: 5
title: "Release (simultaneous)"
aliases: ["L0-magn-prel"]
is_a: ["process"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1691
tags: ["is_a:process", "release", "relates_to:L0-magn-rrel", "relates_to:L0-adr-ufpc", "relates_to:L0-adr-ufom", "relates_to:L0-sauc"]
level: 2
---
# Release (simultaneous)

## Triggers
All of them reach `magn` as `onPhase("release")` from `ufoc`. None runs the release directly:
- the 60 s magnet phase ending;
- a shoot-down (`sauc` → `requestMagnetOff("shot")`);
- `/andrew:ufo stop` (`requestMagnetOff("stop")`);
- the event being aborted (`requestMagnetOff("abort")`).

**Latch (`L0-adr-ufpc`).** `requestMagnetOff` only latches. `ufoc` runs the release at the start of its next interval tick, never inside the caller's stack. A shoot-down detected inside `orbc`'s flight interval therefore never mutates the world from there. The cost is at most one extra hold step. Because every trigger takes the same path, AC-14 "release from a shoot-down and from stop behaves identically" holds by construction.

## Steps (one tick, no partial release)
1. Unsubscribe the drop-exemption listener.
2. Clear the element set and stop sending knockback to players. No velocity is set and nothing is teleported: every entity keeps the zero velocity left by the last hold step and falls under vanilla gravity (U3/U4, AC-14).
3. Remove the transient tag `andrew:ufo_iron` from any entity that still carries it.
4. Free the session. A later `magnetStep` with no session does nothing.

## After the release
- Items are ordinary items: they can be picked up and despawn on the vanilla timer.
- Mobs take vanilla fall damage; iron golems are immune.
- Players take vanilla fall damage measured from the release point (`L0-magn-rrel`).

## Restart
- Nothing is released explicitly. The entities stay where they were saved and fall on load.
- `ufoc` removes the saucer and beam (C-23).
- Tags left on mobs are cleared at world load by `magn`'s cleanup hook.
