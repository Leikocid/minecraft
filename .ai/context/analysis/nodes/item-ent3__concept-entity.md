---
type: "concept-entity"
node_id: "L0-item-ent3"
source_channel: "rollout"
title: "Entity: Localization Catalogue"
aliases: ["L0-item-ent3"]
part_of: ["L0-item"]
is_a: ["entity"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1576
tags: ["entity","localization","catalogue"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["entity"]` · `relates_to: ["L0-once", "L0-cool", "L0-item-r005"]`

# Entity: Localization Catalogue

The RU/EN `.lang` key set this component owns and reconciles on behalf of its siblings (`L0-item-r005`).

| Attribute | Value |
|---|---|
| Files | `packs/resource/texts/ru_RU.lang`, `packs/resource/texts/en_US.lang` |
| Naming convention (items) | `item.andrew:<identifier>.name` — e.g. `item.andrew:web_sword.name` |
| Naming convention (runtime messages) | Not yet established in the repo (no precedent exists — pickaxe has no runtime messages). Proposed: `andrew.web_sword.<event>`, e.g. `andrew.web_sword.first_craft`, `andrew.web_sword.cooldown` |
| Substitution mechanism | `rawtext` `translate` + `with` (ADR-009) — e.g. first-craft key takes the creator's name, cooldown key takes remaining seconds |

## Keys this component must publish for v1

| Key | RU | EN | Consumer |
|---|---|---|---|
| `item.andrew:web_sword.name` | Паутинный меч | Web Sword | Resource Pack (item name) |
| `andrew.web_sword.first_craft` (proposed) | *(TBD, needs `%%1` for creator name)* | *(TBD)* | `L0-once` |
| `andrew.web_sword.cooldown` (proposed) | *(TBD, needs `%%1` for seconds)* | *(TBD)* | `L0-cool` |

## Note

The exact key names for the two runtime messages are **not fixed by the spec** — they are this component's naming proposal, offered so `L0-once` and `L0-cool` have a concrete contract to build against rather than inventing their own keys independently (which would silently violate `L0-item-r005`'s centralization rule).
