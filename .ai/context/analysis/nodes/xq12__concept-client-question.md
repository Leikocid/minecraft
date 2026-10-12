---
type: "concept-client-question"
node_id: "L0-xq12"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "Q-L0-12 · Pearl Rod: the ingredient, the display name, and cross-dimension trips"
aliases: ["L0-xq12"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 1805
tags: ["v11", "pearl-rod", "non-blocking"]
---
---
title: "Q-L0-12 · Pearl Rod: the ingredient, the display name, and cross-dimension trips"
aliases: ["L0-xq12", "Pearl Rod questions"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-xasm43", "L0-xasm42", "L0-adr-prbd"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4"]
---
# Q-L0-12 · Pearl Rod: the ingredient, the display name, and cross-dimension trips

**To Andrey.** None of these blocks the build. Each one ships with the default shown.

1. **The ingredient.** The spec says: «Название "эндер перо" в речи интерпретировано как эндер-жемчуг; если подразумевался другой предмет, уточнить перед выпуском» ("ender feather" in speech was read as Ender Pearl; confirm before release if something else was meant). **Is it the Ender Pearl?** *Default: yes. Ender Pearl directly above a Fishing Rod, every other cell empty.*
2. **The name.** The rod is a real vanilla fishing rod renamed by the server, so its name is one fixed string and does not follow the iPad's language. **Which should it show: «Перовый сокровятель», "Pearl Rod", or both?** *Default: «Перовый сокровятель» as the name, with "Pearl Rod" on the lore line.*
3. **Other dimensions.** If the probe shows the server can reliably preload and teleport across dimensions, should a rod bound in the Nether take you there from the Overworld? *Default: yes when the probe passes. Otherwise the rod refuses with a message.*
4. **Riders.** If you are riding a horse or boat when you use the rod, should the trip fail, or should you travel and leave the mount behind? *Default: you are dismounted and travel alone, as with `/tp`.*

**Why we ask.** Items 1 and 2 are visible on the iPad and hard to change after players have crafted rods. Items 3 and 4 decide what "safe" means for §7.
