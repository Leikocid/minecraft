---
type: "concept-rule"
node_id: "L0-pick-r003"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-pick-r003"]
is_a: ["rule"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 1373
tags: ["is_a:rule", "auto-smelt", "relates_to:L0-pick-ent2", "relates_to:L0-pick-asm1", "relates_to:L0-pick-asm2"]
level: 2
---
**Rule R3 — Auto-smelt is a closed 7-entry allow-list, not a general ore→ingot transform.**

`src/autosmelt.ts` maps exactly these block type ids to a smelted item, via a `Map` (not an object literal, to avoid prototype-pollution lookups like `"constructor"`):

| Block | Smelted drop |
|---|---|
| `minecraft:iron_ore` / `minecraft:deepslate_iron_ore` | `minecraft:iron_ingot` |
| `minecraft:gold_ore` / `minecraft:deepslate_gold_ore` | `minecraft:gold_ingot` |
| `minecraft:copper_ore` / `minecraft:deepslate_copper_ore` | `minecraft:copper_ingot` |
| `minecraft:ancient_debris` | `minecraft:netherite_scrap` |

The override only fires when `event.itemStack.typeId === "andrew:miners_pickaxe"` **and** the broken block is in this map. It cancels the vanilla break in a `beforeEvents.playerBreakBlock` handler, then — because before-events must never mutate the world synchronously — defers the actual `setBlockType(air)` + `spawnItem(drop)` to the next tick via `system.run`.

**Count is always 1**, even for blocks whose vanilla raw drop varies (copper ore normally drops 2–5 raw copper) — the spec's wording ("copper ore → copper ingot") is read literally (`L0-pick-asm1`). **No XP is granted**: all seven raw drops give 0 XP in vanilla, so cancelling the break takes nothing away; furnace XP is intentionally not replicated (`L0-pick-asm2`). [src: `src/autosmelt.ts`]
