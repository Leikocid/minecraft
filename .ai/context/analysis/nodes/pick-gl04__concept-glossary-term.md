---
type: "concept-glossary-term"
node_id: "L0-pick-gl04"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-pick-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 758
tags: ["is_a:glossary-term", "relates_to:L0-pick-r001"]
level: 2
---
**Pickaxe destructibility tag family**

Bedrock ships several overlapping tag families that gate what a pickaxe-tier tool can break: legacy per-tier tags (`stone_pick_diggable`, `iron_pick_diggable`, …), `diamond_tier_destructible`, and the newer umbrella tag `is_pickaxe_item_destructible`. A given block may carry only one of these families — e.g. on BDS 1.26.51.1, `copper_ore` carries only the `stone_pick_diggable` family, `deepslate` only `is_pickaxe_item_destructible`, `ancient_debris` only `diamond_tier_destructible` — measured via `getTags()`, not documented by Mojang in one place. The pickaxe's single `destroy_speeds` entry queries `is_pickaxe_item_destructible` and is verified (`L0-pick-r001`) to still cover all three representative blocks.
