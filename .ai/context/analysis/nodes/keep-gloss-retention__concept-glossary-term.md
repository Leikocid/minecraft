---
type: "concept-glossary-term"
node_id: "L0-keep-gloss-retention"
source_channel: "rollout"
aliases: ["L0-keep-gloss-retention"]
part_of: ["L0-keep"]
is_a: ["glossary-term"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 770
tags: ["glossary-term","L0-keep"]
---

**Death Retention** · RU: *«Сохранение после смерти»*

The behaviour required by spec §4 whereby a player's Web Sword is withheld from the death drop and returned to the same player on respawn. Implemented as a *withhold → owe → re-grant* cycle mediated by the Retention Ledger, **not** as the `keepInventory` gamerule (rejected in ADR-008 because it is server-wide and retains everything).

Retention is scoped to **one item** — `andrew:web_sword`. All other items, including `andrew:miners_pickaxe`, follow vanilla death rules untouched (C-10).

**Synonyms**: soulbound (informal, by analogy to modded Java — no such vanilla Bedrock mechanic exists), keep-on-death.
**Not to be confused with**: `keepInventory`, which is a different and explicitly rejected mechanism.
