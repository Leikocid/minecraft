---
type: "concept-entity"
node_id: "L0"
source_channel: "rollout"
title: "Domain Entities"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["entity"]
relates_to: ["L0"]
analysis_version: 1
priority: 120
size_chars: 4274
tags: ["entity","pickaxe","item","stage-1","L0"]
level: 0
---

# Domain Entities

The project has a very small domain. Two custom items and one behavior rule.

---

## E-1 — Miner's Pickaxe (Кирка шахтёра)

The sole domain entity of Stage 1, and the only item with real behavior anywhere in the specs.

### Attributes

| Attribute | Value | Notes |
|---|---|---|
| Display name (RU) | Кирка шахтёра | Mandatory |
| Display name (EN) | Miner's Pickaxe | Mandatory |
| Creative group | Equipment / pickaxe group | Must also be findable via Creative **search** |
| Obtainable via | Creative inventory, Creative search, `/give`, crafting | All four are separately tested |
| Durability | **Infinite** — implemented by *omitting* the durability component | Not "very high"; the component is absent |
| Enchantable | Yes, via the **pickaxe enchantment slot** | |
| Mining speed | "Diamond-**like**" for common pickaxe blocks | Deliberately approximate; exact tag parity deferred |
| Namespace | Unresolved — `andrew` suggested | See Q-002 |

### Crafting recipe (3×3)

|  | Left | Middle | Right |
|---|---|---|---|
| **Top** | Iron Ingot | Iron Ingot | Iron Ingot |
| **Middle** | Raw Gold | Stick | Raw Gold |
| **Bottom** | *(empty)* | Stick | *(empty)* |

Note the shape departs from the vanilla pickaxe pattern: vanilla places the handle in the middle and bottom *centre* with a full top row of material. Here the middle row carries **Raw Gold** on both flanks instead of being empty, so this is a distinct shaped recipe and will not conflict with the vanilla iron pickaxe.

### Auto-smelt mapping (prototype)

A closed allow-list. Breaking one of these blocks yields the smelted product **directly**, skipping the vanilla raw-material stage:

| Block broken | Drop |
|---|---|
| Iron ore | Iron ingot |
| Deepslate iron ore | Iron ingot |
| Gold ore | Gold ingot |
| Deepslate gold ore | Gold ingot |
| Copper ore | Copper ingot |
| Deepslate copper ore | Copper ingot |
| Ancient debris | Netherite scrap |

*"deepslate variants likewise"* in the source is expanded above. **Every block not in this table keeps vanilla breaking behavior** — the override must not generalise.

### Deferred behavior

- **Fortune multiplication** — not part of this compatibility test.
- **Silk Touch override** — not part of this compatibility test.

Both are deferred *specifically because they interact with the auto-smelt rule*: Fortune would need to decide whether to multiply before or after smelting, and Silk Touch would need to suppress smelting entirely. The prototype sidesteps both questions.

### Design observations

- **Infinite durability makes the recipe nearly single-use in practice.** Once the player owns the pickaxe, gold ore auto-smelts to ingots, so **Raw Gold — a required recipe ingredient — can no longer be obtained with this pickaxe.** Crafting a second one requires a vanilla pickaxe or a Silk Touch tool. Harmless for a prototype (one indestructible pickaxe is enough), but worth flagging before this item is carried into the PvP add-on, where it would be a genuine progression trap.
- **"Infinite durability" and "enchantable" are in tension on Bedrock.** Items without a durability component may not be acceptable to an enchanting table or anvil. The spec asserts both, and pass criteria require both. This is an unverified engine-behavior question rather than a documented contradiction — recorded as ASM-004 with high `impact_if_wrong`.

---

## E-2 — Stage 0 placeholder item

| Attribute | Value |
|---|---|
| Identity | Deliberately unspecified — *«любой пустой предмет»* |
| Explicitly **not** | A pickaxe |
| Display name | RU + EN required |
| Icon | Own icon required (proves the resource pack loads) |
| Behavior | None |

Exists purely as evidence that the resource pack and localization pipeline function. Expected to be discarded once Stage 0 closes.

---

## E-3 — Player spawn greeting (Stage 0 behavior)

Not an item but the only specified *behavior* in Stage 0:

| Attribute | Value |
|---|---|
| Trigger | `world.afterEvents.playerSpawn` |
| Filter | `initialSpawn` only |
| Effect | Write a message to chat |
| Purpose | Proof that scripts execute at all |

The `initialSpawn` filter matters: without it the message would fire on every respawn, which would be noise rather than a clean one-shot signal.
