---
type: "concept-entity"
node_id: "L0-lgnd-ent2"
source_channel: "rollout"
analysis_version: 6
title: "LegendaryInstanceMark"
aliases: ["L0-lgnd-ent2"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2373
tags: ["v3-delta"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent4", "L0-lgnd-r005", "L0-lgnd-r006", "L0-lgnd-ad11", "L0-adr-hold", "L0-xcx11"]
---
# LegendaryInstanceMark

Dynamic properties on an `ItemStack` that distinguish one protected legendary from an ordinary copy (ADR-016, Q-006). As built, `Mark` is `{origin, owner, id, ownerName?}` in `rules.ts`. v3 adds `gen` (carried over from `wpn2`, unbuilt) and `holder`.

| Attribute | Key suffix | Type | Notes |
|---|---|---|---|
| `origin` | `_origin` | `"craft" \| "admin"` | `craft` is stamped only when a **craft token** is swapped (`r014`). `admin` is stamped by `/andrew:<cmd> give`. An unmarked stack is ordinary (`as11`). |
| `owner` | `_owner` | player id | The crafter or admin recipient. Informational, and the fallback return target. |
| `ownerName` | `_owner_name` | string? | `craft` only, for the broadcast. |
| `id` | `_id` | string | Instance id. Stable across re-issues. |
| `gen` | `_gen` | int ≥ 0 | Absent reads as 0 (0.3.0 and v2 stacks). |
| `holder` | `_holder` | player id? | **v3.** The last player whose inventory, hotbar or off hand held this stack. |
| `holderName` | `_holder_name` | string? | **v3.** Used in logs and in the owed entry, so an offline holder is readable. |

## Rules
- **Return target** = `holder ?? owner` (`ad11`). A container, hopper, allay or item entity never becomes the holder.
- **When holder is written:**
  - `holder` is rewritten when `playerInventoryItemChange` reports this marked stack in a player's container, and when `retain`/restore or a loss return hands the stack to a player.
  - The write is skipped when `holder` already equals that player. Writing a slot raises another change event, and the equality check stops the loop.
  - The Equippable off-hand slot raises no inventory event. The off hand is read at the points where it matters: death retention, and a swap back into the container.
- **Parsing:**
  - `parseMark` accepts v2 marks, which have no `gen`/`holder`, and v3 marks.
  - A `holder` that is present but not a string makes the mark **malformed** (undefined), the same as a bad `ownerName` today.
- Stamping clones the stack and never mutates the input (`markSword` semantics).
- A stale `gen` means the stack is not live: it cannot cast, is not retained, is not returned, and is deleted on its next player-inventory event (`r005`).
