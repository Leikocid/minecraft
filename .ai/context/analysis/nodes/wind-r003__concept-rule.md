---
type: "concept-rule"
node_id: "L0-wind-r003"
source_channel: "rollout"
analysis_version: 5
title: "Rule: 25 chests (5/8/12), 3 floor spawners, and dark spawner zones"
aliases: ["L0-wind-r003"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1424
tags: ["is_a:rule", "chests", "spawners", "lighting", "relates_to:L0-strf-r010", "relates_to:L0-loot", "relates_to:L0-wind-as06", "relates_to:L0-wind-as07"]
level: 2
---
# Rule: 25 chests (5/8/12), 3 floor spawners, and dark spawner zones

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-r010, L0-loot, L0-wind-e001, L0-wind-as06, L0-wind-as07]`

**Source:** §4.3, §2 spawner bullets, §3.3 last bullet, tests 16–18.

| Floor | Chests | Spawner mob | Intent |
|---|---|---|---|
| 1 | 5 | Zombie Villager (`zombie_villager_v2`) | entrance; free path to stairs |
| 2 | 8 | Zombie | middle floor |
| 3 | 12 | Vindicator **with an iron axe** | open storage/attic, full combat zone |

- All 25 chest positions and all 3 spawner positions are fixed in the template. Exactly 25 / 3 — no more, none elsewhere (single chests, not double, so counts are unambiguous).
- Every chest uses the one shared table and the 5–12 attempt algorithm (`L0-loot`). Floor never changes quality.
- Spawners are vanilla `mob_spawner` block entities from the template: infinite, proximity-activated, breakable, no block drop, vanilla XP, no script logic (`L0-strf-r010`).
- The Vindicator's iron axe comes from vanilla Vindicator equipment (`L0-wind-as06`). If the probe shows otherwise, it is a documented deviation, not script re-equipping of every Vindicator.
- **Lighting:** decorative and weak. Lanterns allowed per floor, but every spawnable cell within the spawner's range stays at block light ≤ `Lmax` (`L0-wind-as07`); checked by the template test from light-emitting block positions.
