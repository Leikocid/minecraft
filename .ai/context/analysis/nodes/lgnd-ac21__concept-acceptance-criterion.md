---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac21"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-ac21"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 1623
tags: ["ufo", "ufo-ac-13"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r016", "L0-lgnd-ad13", "L0-magn", "ufomagnetspecv1ruen-part-4"]
---
**AC-lgnd-21: Legendary weapons are never pulled (UFO AC 13, rule side).** Channel: `build` (node unit test for the predicate) + `bds` (GameTest `ufo:legendary_*`).

**Predicate.** `isLegendaryStack` is true for each of `andrew:web_sword`, `andrew:scythe_of_calamity`, `andrew:orbital_cannon` and their three `_crafted` tokens, whether marked, unmarked or stale. It is false for `iron_sword`, for `undefined` and for an empty slot.

GIVEN, inside a magnet zone with at least 10 iron candidates, the following and a Survival player holding iron:
- a marked Scythe on the ground;
- an unmarked Web Sword in a chest next to an iron ingot;
- a marked Orbital Cannon in a hopper **block**;
- a chest minecart holding a marked Web Sword and an iron ingot;
- an armour stand in iron armour holding a marked Scythe

WHEN the magnet runs its full 60 s and releases
THEN:
- no legendary stack is ever within 6 blocks of the saucer's hover column;
- the ground Scythe and the chest's Web Sword have not moved;
- the hopper block is still in place and the Cannon is still inside it, untouched. A hopper holding anything is a container and never a pulled block (`decision-resolve-l0-lgnd-cx13`); an iron ingot placed in the same hopper is extracted;
- the chest minecart and the armour stand were not selected;
- the iron ingot in the chest was extracted;
- the world holds exactly one live copy of each marked instance, and neither owed list changed.

Negative control: the same scenario with `isLegendaryStack` stubbed to return `false` must fail the "never within 6 blocks" clause. (Reconciled at reduce v4: the earlier control, a hopper pull without `protectLegendariesIn`, has no code path to exercise once a hopper holding anything is never a block.)
