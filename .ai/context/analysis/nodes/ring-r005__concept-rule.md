---
type: "concept-rule"
node_id: "L0-ring-r005"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-ring-r005"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 989
tags: ["is_a:rule", "blocks", "fire", "relates_to:L0-ring-ac14", "relates_to:L0-pntr-r003"]
level: 2
---
**R-ring-005 · Blocks break by TNT resistance only, and there is never fire** (Orbital §10; AC-14)

- The engine explosion (`breaksBlocks: true`, power 4) decides which blocks break. Blast-resistant blocks such as Obsidian, Crying Obsidian, Reinforced Deepslate, Ancient Debris, Enchanting Table, Anvil, Ender Chest, Bedrock and End Portal Frame survive, exactly as with vanilla TNT.
- `ring` never adds its own block removal. It keeps no keep-list and no remove-list. This is the opposite of `pntr` (`L0-pntr-r003`).
- `causesFire: false` on every blast. No fire block may appear in the blast AABB that was not there before.
- Liquids behave like vanilla TNT: source blocks are not removed, and flow into craters happens naturally.
- Structure blocks (C-13) are ordinary. Rings may crater the Windmill, the Bastion, the Warden City or the Airship.
- Protected spawners (`L0-strf-r006`) are protected against *generation* only, not against weapons. A spawner breaks if TNT would break it.
