---
type: "concept-assumption"
node_id: "L0-lgnd-as18"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-as18"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1450
tags: ["v7", "sculk-crossbow"]
level: 2
---
**ASM-lgnd-18: Def #5's data that the spec does not name.**

Related: L0-lgnd-ad16, L0-lgnd-cx15, L0-sclk.

The crossbow spec gives the recipe (§2: echo shard top and bottom, deepslate left and right, crossbow in the centre) but no keys, ids, refund or command. Filled with defaults:
| Field | Value | Basis |
|---|---|---|
| `itemId` | `andrew:sculk_crossbow` | L0 plan (`sclk`), `adr-scbs` option A |
| `keyPrefix` | `sk` | `cx15`; `sc` is taken |
| `craftTokenId` | `andrew:sculk_crossbow_crafted` | `ad08` naming |
| `refund` | `minecraft:echo_shard` ×2, `minecraft:deepslate` ×2, `minecraft:crossbow` ×1 | the recipe inputs, as for every shipped def. "Deepslate" = the plain block `minecraft:deepslate` (§2 "обычный блок"), not cobbled |
| `textPrefix` | `andrew.crossbow` | |
| `command` | `andrew:crossbow` | |
| `nameKey` | `item.andrew:sculk_crossbow` | |

The refunded crossbow is a fresh, unenchanted, full-durability `minecraft:crossbow`. An enchanted or damaged input crossbow loses its enchantments and damage on a blocked craft (as the Web Sword's and Katana's diamond sword already do).

**Impact if wrong.** All are one-line data changes **until the first world ships**. After that, `keyPrefix` and the command are frozen (`r006`). If the operator wants the input crossbow's enchantments preserved on refund, the gate needs the consumed stack, which stable 2.10.0 does not expose (no craft event): that would be an L0 contradiction.
