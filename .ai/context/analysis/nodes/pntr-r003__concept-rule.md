---
type: "concept-rule"
node_id: "L0-pntr-r003"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-r003"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1103
tags: ["title:Remove everything else, ignoring blast resistance", "is_a:rule", "relates_to:L0-xasm6", "relates_to:L0-pntr-as08", "source:orbital-§9", "ac:7", "ac:8"]
level: 2
---
**Rule R-pntr-3 · Remove everything not kept.**

Every column cell that is not in the keep set (`L0-pntr-r002`) is removed, **whatever its blast resistance** (Orbital §9: "even if ordinary TNT does not destroy them"). This explicitly includes:
- `obsidian`, `crying_obsidian`, `respawn_anchor`, `ancient_debris`, `reinforced_deepslate`, `enchanting_table`, `anvil`s and `netherite_block`;
- active `portal` (Nether portal) blocks **and** their obsidian frame. Portal blocks outside the column become invalid and vanish by vanilla rules, which is acceptable;
- all containers (chests, trapped chests, barrels, placed shulker boxes, hoppers, droppers, dispensers, furnaces, brewing stands, lecterns, crafters and so on);
- `mob_spawner` and `trial_spawner`, and `vault`;
- non-solid breakables such as torches, flowers, snow layers, cobweb, rails and item frames (`L0-pntr-as08`; see `L0-pntr-cx01` for item frames);
- blocks of generated structures, which are ordinary (C-13).

This is the opposite of `ring`, which follows TNT resistance (Orbital §10). The two effects must not share a block classifier.
