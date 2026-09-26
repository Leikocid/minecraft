---
type: "concept-glossary-term"
node_id: "L0-scyt-gl05"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-scyt-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 509
tags: ["is_a:glossary-term", "targeting", "shadow-blade", "delta:2026-09-26"]
level: 2
---
**Links:** `part_of: ["L0-scyt"]` · `is_a: ["glossary-term"]` · `relates_to: []`

**Hidden from targeting** (скрыт от наведения)

A player whose dynamic property `andrew:hidden_until` (epoch ms) is still in the future. `isHiddenFromTargeting()` reads it in `src/legendary/hidden.ts`. The future Shadow Blade will set it; today only `/andrew:hide <seconds> [target]` does. It applies to players only. Vanilla Invisibility is not hiding. The property is private per pack.

**Synonyms:** hidden by Shadow Blade.
