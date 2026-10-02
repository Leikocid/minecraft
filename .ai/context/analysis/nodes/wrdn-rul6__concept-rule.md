---
type: "concept-rule"
node_id: "L0-wrdn-rul6"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-wrdn-rul6"]
is_a: ["rule"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 947
tags: ["is_a:rule", "loot", "chests"]
level: 2
---
**Rule — Chests & loot**

- Exactly 40 chests at fixed positions: 12 in the central zone + 28 distributed across ruins, niches, side rooms and branches, such that a player must explore nearly the entire city to find them all.
- All 40 chests use the **real vanilla Ancient City loot table**, unmodified — same categories, quantities and rarities, including the possibility of Enchanted Golden Apple and Swift Sneak (`L0-loot-p002`, `/loot insert … chests/ancient_city`, probe item 4).
- The shared custom weighted loot system used by Windmill/Airship (spec §3) does **NOT** apply to Mini Warden City (§15, explicit exclusion).
- `L0-loot-r006`, `L0-loot-r007`.

Rationale (§15): Windmill/Airship are original builds that need an original loot system; Mini Warden City is explicitly meant to feel like the real Ancient City, so it reuses that loot table verbatim instead of the add-on's own weighted categories.
