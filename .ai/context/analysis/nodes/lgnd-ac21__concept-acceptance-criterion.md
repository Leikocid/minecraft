---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac21"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac21"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1292
tags: ["v7", "magnet"]
level: 2
---
**AC-lgnd-21 (v7): Legendary weapons are pulled, tokens are not, and no instance is lost or duplicated (operator tuning 1.6.0).** Channel: `build` (node unit test) + `bds` (GameTest `ufo_magnet_legendaries` and `ufo_magnet_hold*`).

Related: L0-lgnd-r016, L0-magn, L0-lgnd-ac22.

**Predicate.** `isMagneticStack` is true for every def's `itemId` (all five once def #5 lands), marked, unmarked or stale. It is false for every `_crafted` token, for `undefined` and for an empty slot.

GIVEN a magnet zone with iron candidates and:
- a marked Scythe on the ground;
- a hopper **block** holding only a marked Orbital Cannon;
- a craft token item entity on the ground;
- a Survival player holding a marked Katana and no iron
WHEN the magnet runs and releases
THEN the Scythe was selected as a ground candidate,
AND the hopper block is still in place, holding the Cannon (a non-empty hopper is a container),
AND the token was never selected,
AND the player was lifted,
AND after release the world holds exactly one live copy of each marked instance, every gen is unchanged, and no owed list changed.

Negative control: `isLegendaryWeapon` stubbed to `false` makes the "Scythe selected" and "player lifted" clauses fail.

The pre-1.6.0 "never within 6 blocks of the hover column" clause is retired.
