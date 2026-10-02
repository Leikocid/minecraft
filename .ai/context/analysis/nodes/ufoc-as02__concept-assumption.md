---
type: "concept-assumption"
node_id: "L0-ufoc-as02"
source_channel: "rollout"
analysis_version: 5
title: "AS-ufoc-2 · The target can be in any game mode; the centre is the literal block under the feet"
aliases: ["L0-ufoc-as02"]
is_a: ["assumption"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1050
tags: ["is_a:assumption", "targeting", "relates_to:L0-ufoc-r002"]
level: 2
---
# AS-ufoc-2 · The target can be in any game mode; the centre is the literal block under the feet

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r002", "L0-xasm14"]`

**Assumed:**
- **Game mode.** Any online, live Overworld player can be the target, including Creative and Spectator players. The spec says only "a random online player in the Overworld". `magn` still never pulls Creative or Spectator players (§5).
- **Centre.** The centre is `floor(y) − 1` under the target, with no downward raycast. A target who is flying, gliding or jumping gets a centre in the air.

**Impact if wrong:**
- If Spectators should be excluded, an event can happen over an observer. The fix is one filter in `overworldPlayers()`.
- With an airborne centre, the zone (centre − 20 … hoverY) can miss the ground, and the event pulls little. An alternative is a block raycast down to the first solid block, capped at 64 blocks. Note that a block raycast passes carpets, signs and ladders. Switching to it is a change local to `r002`.
