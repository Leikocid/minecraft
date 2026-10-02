---
type: "concept-rule"
node_id: "L0-wind-r005"
source_channel: "rollout"
analysis_version: 5
title: "Rule: a cured field Zombie Villager becomes an ordinary Villager"
aliases: ["L0-wind-r005"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 900
tags: ["is_a:rule", "guards", "cure", "relates_to:L0-wind-e003", "relates_to:L0-adr-strs", "relates_to:L0-strf-r009"]
level: 2
---
# Rule: a cured field Zombie Villager becomes an ordinary Villager

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-e003, L0-adr-strs, L0-strf-r009]`

**Source:** §4.5 bullet 6, §9 edge case 9, test 19.

- Curing uses the vanilla route only (Weakness + golden apple → conversion). The add-on adds no cure logic and blocks none.
- The result is a vanilla `minecraft:villager`. It has no `andrew:guard:*` tag and no `fire_resistance` from structure logic; it may despawn/die like any villager (villagers do not burn anyway).
- No script ever turns it back into a Zombie Villager or re-applies guard properties. If a zombie later infects it again, that is vanilla behaviour and the new Zombie Villager is ordinary (burns in sun, no tag).
- A carried-over name tag, if the probe shows one, is acceptable; clearing it is optional and recorded as a deviation (`L0-strf-r009`).
