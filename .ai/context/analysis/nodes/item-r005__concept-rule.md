---
type: "concept-rule"
node_id: "L0-item-r005"
source_channel: "rollout"
aliases: ["L0-item-r005"]
part_of: ["L0-item"]
is_a: ["rule"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1173
tags: ["rule","localization","ownership"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent3", "L0-once", "L0-cool"]`

**Rule — Localization is exhaustive and centralized.** Every user-facing string this add-on will ever emit for the Web Sword — the item's own RU/EN display name, the first-craft broadcast text (owned by `L0-once`), and the cooldown actionbar text (owned by `L0-cool`) — must exist as a translate key in **this component's** `.lang` catalogue before the consuming sibling ships. No sibling may hardcode a literal string in either language.

**Rationale.** §10 (*«Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт»*) plus C-9 plus `concept-architecture-decision` ADR-009 make this a **structural** requirement, not a style preference. A literal string in a script permanently fails the "not hardcoded" test even when the visible in-game behavior looks correct in one language.

**Enforcement note.** Any sibling PR/change that adds a `sendMessage`/actionbar call without a matching `.lang` pair in the same change is incomplete — this belongs in `L0-qatg`'s acceptance checks.

**Source:** §10, C-9, ADR-009.
