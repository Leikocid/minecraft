---
type: "concept-rule"
node_id: "L0-bast-r005"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-bast-r005"]
is_a: ["rule"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 833
tags: ["is_a:rule", "guards", "persistence", "piglin"]
level: 2
---
**Rule:** On first initialization of a given Mini Bastion instance, spawn — exactly once — 7-10 regular Piglins and exactly 2 Piglin Brutes; Hoglins are never spawned as part of this roster. One Brute guards the treasure room (R-bast-004); the other occupies a second fixed position elsewhere in the template. All of these initial mobs follow `L0-strf-r009`, `L0-adr-strs`. No mob spawners are used for this garrison — it exists solely as the one-time initial set.

**Rationale:** The garrison is a fixed, exhaustible challenge, not a renewable one; matches the "one-time persistent" pattern the family addendum uses for Windmill's field Zombie Villagers too.

**Source:** §14.5, §15.
