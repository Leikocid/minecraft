---
type: "concept-process"
node_id: "L0-ufoc-p004"
source_channel: "rollout"
analysis_version: 5
title: "P-ufoc-4 · `/andrew:ufo come|stop|enable|disable`"
aliases: ["L0-ufoc-p004"]
is_a: ["process"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1727
tags: ["is_a:process", "command", "operator", "relates_to:L0-ufoc-ad04", "relates_to:L0-ufoc-r006", "relates_to:L0-ufoc-as01"]
level: 2
---
# P-ufoc-4 · `/andrew:ufo come|stop|enable|disable`

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["process"]` · `relates_to: ["L0-ufoc-ad04", "L0-ufoc-r006", "L0-ufoc-as01", "L0-ufoc-p001", "L0-ufoc-p002"]`

The command is registered at startup through `customCommandRegistry` with `permissionLevel: GameDirectors`, like `src/structures/commands.ts:378` (`ad04`). It takes one enum parameter, `andrew:ufo_action` = `come|stop|enable|disable`. For non-operators the engine refuses the command before the script sees it (AC-17).

The callback runs in a restricted context, so it only records the request and returns `Success`. The work runs through `system.run` on the next tick, inside the UFO flow.

| Action | Effect |
|---|---|
| `come` | If a session exists → `Failure`: "A UFO is already in the sky" (UFO §2, at most one). Target selection: the invoking player if they are a valid Overworld player; otherwise a random Overworld player (`as01`); if there is none → `Failure`. Then the arrival starts (`p001` step 5, `source = command`). This works even while the event is disabled (`as01`). |
| `stop` | No session → `Success` with "No UFO". Otherwise `requestMagnetOff("stop")`. The next tick runs the release if the magnet is on, then `endEvent("stop")`: the saucer is removed and `next_ms` = now + 15 min (`r006`). |
| `disable` | Writes `andrew:ufo_enabled = false`. A live event also gets `requestMagnetOff("stop")` (`r006`). |
| `enable` | Writes `andrew:ufo_enabled = true`. If `next_ms` is in the past, it is pushed to now + 15 min (`r006`). |

Replies use `CustomCommandStatus` and an English message, like the existing `andrew:` commands. The message is a plain string, not rawtext, so it is not localized (`as01`).
