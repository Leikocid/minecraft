---
type: "concept-glossary-term"
node_id: "L0-strm-gls-vrel"
source_channel: "rollout"
analysis_version: 8
aliases: ["L0-strm-gls-vrel"]
is_a: ["glossary-term"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 460
tags: ["v8", "glossary", "storm-blade"]
level: 3
---
**Valid release / invalid attempt (валидный выпуск / недопустимая попытка)**

A **valid release** is a Use that `resolveActivation` resolves to the Storm Blade, made by a living, non-spectating player holding a live stack with its eye's chunk loaded. It always spends the 30 s cooldown, whether it hits, misses or stops at a wall.

An **invalid attempt** is any other Use: on cooldown, stale stack, dead, wrong hand. It spends nothing (xasm31, `L0-strm-rcd`).
