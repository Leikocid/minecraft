---
type: "concept-glossary-term"
node_id: "L0-item-gl05"
source_channel: "rollout"
aliases: ["L0-item-gl05"]
part_of: ["L0-item"]
is_a: ["glossary-term"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 440
tags: ["glossary"]
level: 2
---

**Translate Key (.lang catalogue)**

A rawtext `translate` identifier (e.g. `item.andrew:web_sword.name`) resolved at render time by the Resource Pack's `ru_RU.lang` / `en_US.lang` files, optionally with `with`-substituted values (player name, seconds remaining). The project-wide rule (C-9, ADR-009): **no script ever emits a literal user-facing string** — every message is a translate key owned by `L0-item`'s catalogue (`L0-item-ent3`).
