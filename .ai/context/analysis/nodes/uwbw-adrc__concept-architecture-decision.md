---
type: "concept-architecture-decision"
node_id: "L0-uwbw-adrc"
source_channel: "rollout"
analysis_version: 10
title: "ADR-uwbw-rc · The Mace and the rockets are plain data recipes"
aliases: ["L0-uwbw-adrc"]
is_a: ["architecture-decision"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1033
tags: ["v10", "recipes", "status:proposed", "C-40"]
level: 2
---
# ADR-uwbw-rc · The Mace and the rockets are plain data recipes

**Links.** relates_to: L0-uwbw-r004, L0-uwbw-prcp, L0-xasm39, C-40, C-16.

**Context.** Both outputs are vanilla items with unlimited crafting. Spec §3 asks for "Flight Duration 1", and Bedrock recipe JSON cannot attach firework data.

**Decision.**
- **Two `minecraft:recipe_shaped` files with vanilla results.** They have no token, no `craftgate` and no script.
- **The rockets' flight is whatever the plain result carries.** Probe row 8 reads it. If it is not flight 1, it is reported as a limitation (C-16), with no script rewrite.
- **A checked-in unit test guards the shapes.** It loads the shapes from every add-on recipe plus a vanilla 1.26.51 shape list.

**Rejected.**
- **A token plus a script exchange,** to stamp flight 1. Stable 2.10.0 cannot write firework data, and this would add a legendary-style path to an unlimited vanilla craft.
- **Shapeless recipes.** Paper + String shapeless could shadow future vanilla recipes. The spec draws a vertical 1×2.
