---
type: "concept-rule"
node_id: "L0-orbc-r006"
source_channel: "rollout"
analysis_version: 3
title: "Rule · At most one activation per player per tick"
aliases: ["L0-orbc-r006"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 952
tags: ["is_a:rule", "relates_to:L0-xasm10", "input", "dedup"]
level: 2
---
# Rule · At most one activation per player per tick

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm10", "L0-orbc-p001", "L0-orbc-ac09"]`

- A single press can raise several events in one tick:
  - `itemUse` together with `itemUseOn` or `playerInteractWithBlock`;
  - on touch, `entityHitBlock` together with a use.
- The **first** event in a tick that passes `p001` steps 1–5 activates.
- Every later event from the same player in that tick is ignored. It creates no charge and makes no second cooldown write.
- The mode is that of the first event.

**Implementation.** `Map<playerId, tick>` in memory. It is cleared on `playerLeave`, and nothing is persisted.

The cooldown check alone already stops a second attack. The explicit tick guard also covers the window where `startCooldown` has been written but a same-tick event was queued before it. Script events are synchronous, so this is defensive rather than required.
