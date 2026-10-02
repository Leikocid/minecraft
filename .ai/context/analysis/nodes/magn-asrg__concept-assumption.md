---
type: "concept-assumption"
node_id: "L0-magn-asrg"
source_channel: "rollout"
analysis_version: 5
title: "magn-asrg · A 3-block keep-away margin stops pickup; ring crowding is harmless"
aliases: ["L0-magn-asrg"]
is_a: ["assumption"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 760
tags: ["is_a:assumption", "CAN_ASSUME", "status:to-probe", "channel:bds", "relates_to:L0-magn-rrng"]
level: 2
---
# magn-asrg · A 3-block keep-away margin stops pickup; ring crowding is harmless

**Assumption.**
- U11 measured pickup at about 2 blocks for a hovering player, so a 3-block margin around every player suffices.
- Exempt drops grow the ring beyond 10 slots. At 30 slots the spacing on r 5 is still about 1 block, and held items do not merge, because each is teleported to its own point every tick.

**Impact if wrong.**
- **Pickup.** A held player would pick up ring items, so the "visible cloud" thins and the AC-8 counts drift. The fix is to raise the margin or the ring radius.
- **Merging.** Held stacks would merge, changing the element count. Then a minimum slot spacing would be needed (at most 1 slot per 1.5 blocks, overflow onto a second ring at −4).
