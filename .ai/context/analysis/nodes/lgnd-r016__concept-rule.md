---
type: "concept-rule"
node_id: "L0-lgnd-r016"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-r016"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 1989
tags: ["ufo", "magn", "invariant"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad13", "L0-magn", "L0-lgnd-r013", "L0-lgnd-ac21", "L0-lgnd-ac22", "L0-lgnd-cx13"]
---
**R-lgnd-016: The magnet never moves a legendary, and anything it moves that holds one stays recoverable.** Source: UFO §4, AC 13; Agent priorities (1).

1. **Predicate.** "Legendary" for the magnet means `isLegendaryStack(stack)`: the type is a def's `itemId` or `craftTokenId`, in any mark state (`ad13`).
2. **Ground / container stacks.** A stack for which the predicate is true is never selected, never extracted and never teleported. It does not count towards the 10-element limit.
3. **Whole-entity elements.** The magnet does not select:
   - a chest or hopper minecart with any slot holding a legendary;
   - an armour stand or mob with a legendary in a hand slot.
   It takes the next candidate instead.
4. **Holder blocks.** *Reduce v4: dormant.* `L0-magn-adhp` takes the hopper out of the pulled-block list, so the magnet turns no `HOLDER_TYPES` block into air (`L0-adr-ufnd`). The clause stays as the floor for any future change to that list. Turning a `HOLDER_TYPES` block into air is script-caused destruction. `protectLegendariesIn` runs first, in the same synchronous step (`r013`, tier 1). The legendary is then dropped next to the cell with the same id and gen, and is **not** pulled.
5. **Players.** A player is pulled by iron in either hand. A legendary in the other hand rides along as part of the player. That is not "pulling the weapon", and death retention covers it (`ac22`).
6. **Late drops.** A legendary dropped during the magnet within 12 blocks of the hover point is not iron, so it is not pulled beyond the limit either.
7. **Release / stop / restart.** The magnet holds no legendary, so it never has to release, persist or restore one.

**Why the entity case is a rule, not a nicety.** A pulled entity is teleported every tick and dropped with vanilla physics. It may land in lava, cactus or the Void. Its contents then spill as item entities, and recovery only catches them through `entitySpawn`, after the magnet has already moved the weapon. That is visible "pulling" (AC 13).
