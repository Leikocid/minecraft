---
type: "raw-fragment"
node_id: "abovewatertridentspecv1ruen-part-2"
source_channel: "raw-import"
level: null
aliases: ["abovewatertridentspecv1ruen-part-2", "abovewatertridentspecv1ruen"]
is_a: ["raw-fragment"]
priority: 630
size_chars: 3133
tags: ["digest"]
source: "docs/Above_Water_Trident_Spec_v1_RU_EN.docx"
embed_lines: "37-66"
embed_slice: "3-32"
---
# EN --- Recipe and item rules

  -----------------------------------------------------------------------
  Empty                   Golden Apple            Empty
  ----------------------- ----------------------- -----------------------
  Water Bucket            Trident                 Water Bucket

  Empty                   Golden Apple            Empty
  -----------------------------------------------------------------------

Output: 1 Above-Water Trident. Ingredients: 2 Golden Apples, 2 Water Buckets, 1 vanilla Trident. Return both empty buckets without duplication, including full-inventory edge cases. Fixed shaped recipe.

Legendary: only one successful Survival craft of this item type per world/server, persisted across restarts. Creative inventory Equipment/search and /give remain available; Creative copies do not consume the Survival flag. Infinite durability; freely transferable, droppable, and storable. On player death, keep/restore the trident if in inventory; items in containers stay there. Dropped legendary item entities survive fire, lava, cactus, explosions, and container destruction; void loss returns to last owner, including offline pending delivery. Broadcast first Survival craft with crafter name.

# EN --- Combat, movement and throwing

• Normal melee and thrown-hit base damage equals the vanilla trident. Every successful hit on a living entity summons exactly one lightning strike and deals +2 HP (one heart). Prevent recursive lightning-triggered damage and duplicate hit processing.

• Built-in Riptide III-like propulsion works anywhere, including dry air, underwater and all dimensions; no rain or water required. No separate active button and no 30-second active cooldown. Cancel fall damage on the next landing after a dash, once only.

• While held in either hand underwater, increase swimming speed to approximately land running speed; remove boost when not held.

• Throwing uses vanilla-like trajectory. Entity hits apply base damage plus lightning and +2 HP, then return the weapon. On a miss or block collision, immediately begin a visible return at 10 blocks/second. Re-throw only once the item has actually returned. Prevent duplicates, loss, and simultaneous held/in-flight copies.

• Disallow Loyalty and Riptide enchantments, because their effects are built in. Permit other compatible trident enchantments if they do not break behavior.

# EN --- Implementation and acceptance

Prefer stable Minecraft Bedrock Behavior Pack / Script API; avoid Experiments. Report any exact stable-API limitations instead of silently simplifying. Suggested identifier addon:above_water_trident, localized ru_RU/en_US. Keep authoritative unique-craft and throw/return state server-side and persistent.

Acceptance: recipe and two returned buckets; one Survival craft persists after restart; Creative copies do not consume limit; base damage +2 HP and one lightning per hit; dry-air Riptide propulsion; next-landing fall protection; underwater speed; visible 10-block/s return on miss/block; no re-throw before return; death/void/offline/container/hazard cases; Loyalty and Riptide disallowed.
