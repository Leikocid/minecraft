---
type: "concept-glossary-term"
node_id: "L0-once-gsvc"
source_channel: "rollout"
aliases: ["L0-once-gsvc"]
part_of: ["L0-once"]
is_a: ["glossary-term"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 767
tags: ["glossary-term","craft","L0-once"]
---

**Survival Craft** (RU: survival-крафт)

A completed crafting-table craft of `andrew:web_sword` performed by a player **not** in Creative mode. Only a survival craft spends the world craft budget; this is the discriminator the whole component turns on.

Determined server-side by reading the crafting player's game mode at craft time (R-003) — never inferred from the item, the recipe, or the inventory.

**Boundary case:** Adventure mode. Players can craft at a table in Adventure, and the spec never says whether that counts. The working default is **yes, it spends the budget** (Adventure is a play mode, not an admin mode) — recorded as ASM-013 and open with the owner.

**Contrast with:** *Creative craft* and `/give`, both of which are exempt (`L0-once-gadm`).
