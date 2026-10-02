---
type: "concept-rule"
node_id: "L0-sauc-r006"
source_channel: "rollout"
analysis_version: 5
title: "R-sauc-6 · Sounds"
aliases: ["L0-sauc-r006"]
is_a: ["rule"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 998
tags: ["is_a:rule", "sound", "relates_to:L0-sauc-as02"]
level: 2
---
# R-sauc-6 · Sounds

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-r005", "L0-sauc-p002", "L0-sauc-as02"]`

**Rule** (UFO §7: vanilla `beacon.*` is allowed):

| Moment | Sound | Where |
|---|---|---|
| Magnet on | `beacon.activate` | saucer position |
| Every 40 ticks during the magnet (first at +40) | `beacon.ambient` | saucer position |
| Magnet off (release or shoot-down while the magnet is on) | `beacon.deactivate` | saucer position |
| Shoot-down blast | `random.explode` | blast point |

- The sounds are played with `dimension.playSound(id, pos, {volume: 4})`. Bedrock attenuates over about 16 × volume blocks, so 4 gives a ~64-block range and covers a player on the ground 40 below, inside the 50-block zone (`as02`).
- All calls go through one `playUfoSound()` wrapper so GameTests can count them (`ac05`).
- There is no arrival or departure sound; the spec asks for none.
- The hum stops on the release tick. No sound plays after the saucer is removed.
