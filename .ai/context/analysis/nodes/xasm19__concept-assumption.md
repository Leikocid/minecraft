---
type: "concept-assumption"
node_id: "L0-xasm19"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ASM-L0-19 · Safe-cell search"
aliases: ["L0-xasm19"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1566
tags: ["v6", "katana", "CAN_ASSUME", "alias:L0-xasm19", "is_a:assumption", "relates_to:L0-katn", "relates_to:L0-adr-ktob", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:dragonkatanaspecv1ruen-part-2"]
---
---
title: "ASM-L0-19 · The safe-cell search walks back along the ray and never crosses the obstacle"
aliases: ["L0-xasm19", "Katana safe-cell search"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-adr-ktob"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2"]
---
# ASM-L0-19 · Safe-cell search

**Gap.** §5 says that at an obstacle the player goes to "the nearest safe position on the side facing the owner". §6 allows shifting the final position "a little up or sideways". Moving *up* in front of a low wall could put the player on top of it, which is arguably "past" the obstacle. "A little" has no number.

**Assumption (CAN_ASSUME).**
1. Candidate feet cells are taken, nearest first, from:
   - the endpoint cell;
   - then the cells stepping back toward the head along the ray (0.5-block steps);
   - at each step, offsets of +1 and +2 up and ±1 sideways.
2. A candidate must:
   - fit (per `L0-adr-ktob`);
   - lie on the owner's side of the hit face's plane;
   - be reachable from the head by a clear ray, so the player is never placed behind a solid block.
3. The search stops at the player's own cell. If nothing fits, there is **no teleport and no cooldown**, and the HUD says nothing.
4. A floor hit (aiming at the ground) is the same case: the feet cell sits on top of the hit face.

**Impact if wrong.**
- If "on top of a 1-high wall" must be allowed, the plane rule relaxes for upward offsets only.
- If a failed search must still consume the cooldown, add one line.

Neither change touches other nodes.
