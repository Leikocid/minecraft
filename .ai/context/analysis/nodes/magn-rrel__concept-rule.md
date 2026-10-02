---
type: "concept-rule"
node_id: "L0-magn-rrel"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rrel"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1014
tags: ["is_a:rule", "release", "fall-damage", "relates_to:L0-xasm16", "see_also:ufomagnetspecv1ruen-part-3"]
level: 2
---
**Rule (UFO §6; U1, U2; AC-7, AC-14).**

**One tick.** When the magnet goes off, every element and every held player is released in the **same tick**, with no staggering.

**Vanilla physics.**
- After the release the magnet applies no impulse and no teleport.
- Things fall from where they are, under vanilla gravity.

**Fall damage.**
- Fall damage is vanilla, counted **from the release point only**; time spent hovering adds nothing.
- U2: release at 37 blocks dealt 33 damage, a death; this is intended.
- A player lowered near the ground before release takes none (U1).
- If `applyKnockback` holding is found to accumulate fall distance, `magn` resets it before release (`L0-xasm16`, `L0-magn-a07`).

**Mobs.** Mobs take vanilla fall damage; iron golems are immune.

**Afterwards.** Released items are ordinary items: they can be picked up and despawn on the vanilla timer.

**Death from the fall.** A player who dies from the fall keeps legendaries under `lgnd` death retention; the other drops are vanilla.
