---
type: "raw-fragment"
node_id: "minerspickaxetestspec"
source_channel: "raw-import"
level: null
aliases: ["minerspickaxetestspec"]
is_a: ["raw-fragment"]
priority: 120
size_chars: 1829
tags: ["requirements", "guide", "api", "testing", "performance", "project"]
source: "docs/Miners_Pickaxe_Test_Spec.docx"
embed_lines: "1-54"
embed_slice: "1-54"
---
Purpose: validate the core Minecraft Bedrock Add-On stack on the user's installed version before implementing the full PvP Add-On.

# Scope

- One custom item only: Кирка шахтёра / Miner's Pickaxe.

- Behavior Pack + Resource Pack + stable Script API.

- Visible directly in Creative Inventory (Equipment/pickaxe group), Creative search, and available through /give.

- Russian and English item names.

# Recipe

- Top: Iron Ingot \| Iron Ingot \| Iron Ingot

- Middle: Raw Gold \| Stick \| Raw Gold

- Bottom: Empty \| Stick \| Empty

# Gameplay

- Infinite durability (prototype omits a durability component).

- Enchantable using the pickaxe enchantment slot.

- Diamond-like intended mining speed for common pickaxe blocks.

- Auto-smelt prototype: iron ore → iron ingot; gold ore → gold ingot; copper ore → copper ingot; deepslate variants likewise; ancient debris → netherite scrap.

- Normal non-smelting blocks keep vanilla breaking behavior.

# Deliberately deferred

- Fortune multiplication and Silk Touch override behavior are not part of this compatibility test.

- Exact parity with every diamond-pickaxe mining tag will be tuned after the user confirms the pack loads and scripts execute.

# Pass criteria

- The .mcaddon imports without dependency/manifest errors.

- The item is visible in Creative and can be obtained with /give.

- The recipe crafts the item.

- Supported ores produce smelted drops in Survival.

- The item accepts pickaxe enchantments and does not break.

# Compatibility target

Designed as a stable-API compatibility probe for current Bedrock 26.x. The behavior pack requests \@minecraft/server 2.9.0 and min_engine_version 1.26.0. If the installed game reports a dependency or format error, use the exact error text to retarget the pack rather than enabling Preview/Beta APIs by default.
