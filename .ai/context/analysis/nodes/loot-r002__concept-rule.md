---
type: "concept-rule"
node_id: "L0-loot-r002"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-r002"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 689
tags: ["is_a:rule", "relates_to:L0-loot-e001"]
level: 2
---
**Rule:** The custom table has exactly 13 categories, each with a fixed relative weight and quantity range (full table in `L0-loot-e001`): Sticks(45, 2–8), Logs/Wood(24, 2–6), Iron Ingots(32, 2–8), Copper Ingots(30, 3–10), Gold Ingots(17, 1–5), Diamonds(6, 1–3), Golden Apple(7, 1–3), Unenchanted Armor(15, 1 item), Enchanted Armor(5, 1 item), Unenchanted Sword(12, 1), Enchanted Sword(4, 1), Unenchanted Axe(12, 1), Enchanted Axe(4, 1).

**Rationale:** spec §3.2 table. Weights intentionally do not sum to 100 — they are relative weights normalized at selection time, not percentages (explicit spec note: "веса намеренно не обязаны суммироваться до 100").

**Scope:** `L0-loot-p001` only.
