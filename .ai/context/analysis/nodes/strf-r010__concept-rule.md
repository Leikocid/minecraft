---
type: "concept-rule"
node_id: "L0-strf-r010"
source_channel: "rollout"
analysis_version: 5
title: "Rule: spawners are vanilla `mob_spawner` blocks from the template, with no script behaviour"
aliases: ["L0-strf-r010"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1151
tags: ["is_a:rule", "spawner", "relates_to:L0-xasm4", "relates_to:L0-strf-d002", "relates_to:L0-wind", "relates_to:L0-airs"]
level: 2
---
# Rule: spawners are vanilla `mob_spawner` blocks from the template, with no script behaviour

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- Each spawner (Windmill ×3: Zombie Villager, Zombie, Vindicator; Airship ×1: Vindicator) is a `minecraft:mob_spawner` block entity baked into the `.mcstructure` with its `EntityIdentifier` (`L0-adr-tmpl`).
- Everything else is **vanilla, unmodified** (§2, §4.3, §5.3):
  - infinite;
  - activates when a player is within the vanilla range;
  - light suppression per the engine rule;
  - breakable, with no block drop and vanilla XP.
- The iron axe on the Vindicator: vanilla Bedrock Vindicators spawn with an iron axe (`L0-xasm4` §1). No equipment script.
- Template authors (bodies) must keep light near each spawner at or below the engine threshold. `strf`'s template test asserts that no light-emitting block lies within 4 blocks of a spawner cell.
- A broken spawner is never restored (§9, test 22). No registry field tracks spawners.
- If probe item 1 fails (the entity id is lost on `place`), switch to the fallback in `L0-strf-d002` and record it in the deviation report. Bodies do not change.
