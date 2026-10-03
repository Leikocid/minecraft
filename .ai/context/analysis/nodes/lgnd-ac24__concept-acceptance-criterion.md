---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac24"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-ac24"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 1870
tags: ["v6", "katana", "channel:bds", "C-16"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r017", "L0-lgnd-ac07", "L0-lgnd-ac08", "L0-lgnd-ac09", "L0-lgnd-ac19", "L0-xcx21", "L0-xasm22", "L0-xcx11", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-3"]
---
**AC-lgnd-24: Katana T16–T18 under C-16, and a teleport trips no recovery.** Channel: `bds` (GameTests `legendary_katana_*`, run with the shipped scenarios parameterised by def).

- **T16.** P has a marked Katana in the hotbar and dies (also in lava, after a teleport). THEN on respawn P holds the same id and gen, and no item entity remains.
- **T17, prevent.** A marked Katana item entity:
  - in fire, or in lava, is still there after 10 s, with the same id and gen;
  - in a chest in an Orbital LMB column, and on the ground in an RMB blast and ring AABB, ends up outside the volume with the same id and gen, and no `andrew.legendary.recovered` message, nothing in `dk_owed`.
- **T17, return (C-16, `L0-xcx21`).** A marked Katana entity on cactus, or hit by primed vanilla TNT: afterwards exactly one live Katana exists, either in the owner's inventory (at their feet if it is full, `retention.ts:270-275`) with `gen + 1` and `andrew.legendary.recovered`, or in `dk_owed` if the owner is offline.
- **T18.** A Katana dropped into the Void, or inside a chest minecart that falls into the Void, returns to **`mark.owner`** exactly once. The clause "to the last holder" waits for `L0-xcx11`.
- **Teleport (`r017`).** GIVEN a marked Katana on the ground near P, and P holding a second def's marked stack
  WHEN P activates the Katana 20 blocks away 3 times, then walks until the ground item's chunk unloads and returns
  THEN no `legendary recovery: … now gen` line appears, both gens are unchanged, `dk_owed` is empty and the ground Katana is watched again.
- **Same dimension.** A Katana teleport whose ray reaches the edge of a loaded area stops before the unloaded cell, and the player's `dimension.id` before and after is equal.
