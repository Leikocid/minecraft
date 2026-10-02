---
type: "concept-rule"
node_id: "L0-magn-rrng"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rrng"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 810
tags: ["is_a:rule", "ring", "relates_to:L0-magn-asrg", "see_also:ufomagnetspecv1ruen-part-3"]
level: 2
---
**Rule (UFO §6, U11).** Elements hold on a ring of **radius 5 at 3 blocks below the saucer**, spaced evenly and rotating slowly. Players are held 6 blocks below the saucer on its axis, so a held player is about 5.8 blocks from every slot.

**Keep-away.** A hovering player picks up items within about 2 blocks (U11). In every tick, an **item** element's target that comes within 3 blocks of any player (for example, a player rising past the ring) is moved radially outward until it is 3 blocks clear. If it cannot clear radially, it is moved up instead. The margin is an assumption (`L0-magn-asrg`).

**Scope.** Mobs, minecarts and armour stands are not subject to pickup, but they use the same ring.

**On the way in.** Elements still flying toward the ring use the same keep-away offset for their next step.
