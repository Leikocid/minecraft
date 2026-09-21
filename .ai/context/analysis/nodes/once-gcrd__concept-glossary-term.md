---
type: "concept-glossary-term"
node_id: "L0-once-gcrd"
source_channel: "rollout"
aliases: ["L0-once-gcrd"]
part_of: ["L0-once"]
is_a: ["glossary-term"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 947
tags: ["glossary-term","craft","scarcity","L0-once"]
---

**Craft Budget** / **Craft Right** (RU: «право на единственный survival-крафт», §3)

The world's allowance of exactly one successful survival craft of `andrew:web_sword`. Starts **unspent** in every new world, is **spent** by the first survival craft, and is never replenished by any in-game action.

The phrasing matters: the budget is a *right to craft*, not a *quota of swords*. An unbounded number of Web Swords may legitimately exist in a world (via Creative and `/give`) while the budget is still unspent, and conversely the budget can be spent in a world that currently contains zero Web Swords — if the crafted one was destroyed. That second case has no recovery path and is the subject of CTR-006.

**Scope:** *«на весь мир/сервер»* — implemented as world-scoped (ADR-005). On a dedicated BDS instance with one world these coincide; copying the world copies the spent budget.

**Synonyms:** the one-per-world budget, the craft allowance.
