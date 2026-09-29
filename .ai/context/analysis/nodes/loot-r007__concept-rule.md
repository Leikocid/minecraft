---
type: "concept-rule"
node_id: "L0-loot-r007"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-r007"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 926
tags: ["is_a:rule", "relates_to:L0-loot-p001", "relates_to:L0-loot-p002", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast"]
level: 2
---
**Rule:** The custom weighted table (`L0-loot-p001`) applies only to Windmill (25 chests) and Airship (10 chests). Mini Warden City (40 chests) and Mini Bastion (10 chests) use only their respective vanilla loot tables (`L0-loot-p002`) — never the custom table, and the custom table's constraints (Golden Apple cap, no curses, 80/20 split) never apply to vanilla-table chests. Floor/room location never changes loot quality on either path.

**Rationale:** spec §3.3 last bullet ("Одна и та же таблица... во всех 25 сундуках Мельницы и всех 10 сундуках Дирижабля"), §13.6 ("Общая пользовательская таблица лута Мельницы/Дирижабля к Mini Warden City НЕ применяется"), §15 shared addendum ("Mini Warden City и Mini Bastion используют только соответствующие ванильные loot tables").

**Scope:** boundary rule for the whole component; this is the rule a sibling body component would violate if it tried to reuse the wrong mechanism.
