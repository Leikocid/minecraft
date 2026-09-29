---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl01"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-gl01"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 831
tags: ["v3-delta"]
level: 2
---
**Legendary weapon** (легендарное оружие)

An item with an entry in the static `LEGENDARIES` array (`src/legendary/registry.ts`), bound by the shared rules:
- one Survival craft per world, spent only by a craft token, with a first-craft broadcast;
- death retention;
- the destruction policy (prevent / spill / return to the last holder);
- one cooldown per ability, shared by all its activation modes, with a busy deadline;
- hand priority;
- one Action Bar HUD.

Today these are the Web Sword (`andrew:web_sword`), the Scythe of Calamity (`andrew:scythe_of_calamity`) and the Orbital Cannon (`andrew:orbital_cannon`, v3). Shadow Blade is named in the Scythe spec but not specified.

Only **marked** copies get protection. Plain `/give` and Creative copies cast, but are ordinary items (`L0-lgnd-as11`).

**Synonyms:** legendary.
