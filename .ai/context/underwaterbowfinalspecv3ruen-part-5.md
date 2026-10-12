---
type: "raw-fragment"
node_id: "underwaterbowfinalspecv3ruen-part-5"
source_channel: "raw-import"
level: null
aliases: ["underwaterbowfinalspecv3ruen-part-5", "underwaterbowfinalspecv3ruen"]
is_a: ["raw-fragment"]
priority: 650
size_chars: 1403
tags: ["integration", "api", "architecture", "infrastructure"]
source: "docs/Underwater_Bow_Final_Spec_v3_RU_EN.docx"
embed_lines: "203-220"
embed_slice: "3-20"
---
- On the binding player's death, invalidate their bindings even if another player picks up the dropped item. Item transfer must not allow use of someone else's active binding; the recipient must bind it afresh.

- If destination chunks cannot be loaded or no safe arrival point exists, fail safely and report the limitation. Persist valid binding state across world reloads where supported. Cross-dimension use requires reliable supported teleport and destination loading; otherwise report the limitation instead of claiming success.

# 8. Additional acceptance tests

- Unlimited craft, correct grid, no durability loss.

- All vanilla pressure-plate types bind on bobber hit; next use teleports once and clears binding.

- Destroyed/replaced plates do not teleport; subsequent use after a successful teleport is a normal cast.

- Owner death resets binding; other players cannot exploit a transferred bound rod.

- Very distant and unloaded destinations are handled without an artificial range cap or unsafe teleport.

- Unbound fishing works; saved items and state survive reload without corruption.

Implementation note / Примечание: Preserve all v2 Underwater Bow, Mace, Firework Rocket and enchanting rules above. Vanilla enchanting-table modification and distant chunk loading may be impossible with stable Bedrock APIs; explicitly report such limitations rather than silently changing behavior.
