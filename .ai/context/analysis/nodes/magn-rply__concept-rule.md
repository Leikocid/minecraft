---
type: "concept-rule"
node_id: "L0-magn-rply"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rply"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1055
tags: ["is_a:rule", "players", "relates_to:L0-xasm14", "relates_to:L0-xasm16", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
**Rule (UFO §5, §6; AC-4, AC-5, AC-6).** A player is pulled in a given tick **if and only if** all of the following hold:
- they are inside the zone cylinder and alive;
- their game mode is neither Creative nor Spectator; Adventure is pulled (`L0-xasm14`);
- the **main-hand or off-hand** stack is in IRON_ITEMS.

**What does not count.** Iron in the inventory or in worn armour slots. A legendary in hand is never iron.

**How.**
- `applyKnockback`, each tick, toward the point 6 blocks below the saucer, with the step capped at **0.6 blocks per tick**.
- Once there, the player is held, with a measured deviation of ≤ 0.03 (U1).

**Stop and resume (U10).**
- The hand state is re-read every tick. After a drop (`Q`) or a slot switch to non-iron, no knockback is sent from that tick on, and the player falls.
- Taking iron back into a hand while the magnet is on resumes the pull on the next tick.
- Leaving the zone horizontally stops the pull in the same way.

**Unlimited.** Any number of players can be pulled; they are outside the 10-element limit.
