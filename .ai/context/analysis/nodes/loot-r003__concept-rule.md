---
type: "concept-rule"
node_id: "L0-loot-r003"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-r003"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 536
tags: ["is_a:rule", "relates_to:L0-loot-p001"]
level: 2
---
**Rule:** Golden Apple succeeds at most once per chest, quantity 1–3 when it does. It is always a regular Golden Apple — Enchanted Golden Apple never appears via the custom table.

**Rationale:** spec §3.1 item 5 ("Золотое яблоко может успешно появиться не более одного раза"), §3.3 last bullet ("Зачарованное золотое яблоко никогда не входит в таблицу").

**Scope:** `L0-loot-p001` only — vanilla Ancient City chests (`L0-loot-p002`) may legitimately contain Enchanted Golden Apple since that's a normal, unmodified vanilla drop there.
