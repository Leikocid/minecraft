---
type: "concept-contradiction"
node_id: "L0-xcx13"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-13 · \\"Exactly the vanilla Fishing Rod\\" vs a custom item that must not fish"
aliases: ["L0-xcx13"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0","L0-orbc"]
see_also: ["orbitalcannonspecv1ruen-part-1"]
priority: 540
size_chars: 1052
tags: ["title:CX-L0-13 · \"Exactly the vanilla Fishing Rod\" vs a custom item that must not fish","alias:L0-xcx13","is_a:contradiction","relates_to:L0","relates_to:L0-orbc","see_also:orbitalcannonspecv1ruen-part-1","category:source-vs-engine","severity:low","status:open","target:L0-orbc","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx13
---

# CX-L0-13 · "Exactly the vanilla Fishing Rod" vs a custom item that must not fish

**Spec (Orbital §2).**
- Appearance is **exactly** the vanilla fishing rod, with no custom texture.
- Normal fishing is **completely disabled**, durability is infinite and it cannot be enchanted.

**Engine.**
- Fishing behaviour, durability and enchantability are hard-wired into `minecraft:fishing_rod`, so the Cannon must be a custom `andrew:orbital_cannon`.
- A custom item can reuse the vanilla `fishing_rod` icon atlas entry, which gives an identical inventory icon.
- In hand, a custom item renders as the icon sprite. It does not show the vanilla rod's cast/reeled model states. The vanilla rod also shows a bobber line when cast, which is correctly absent here.
- Whether `minecraft:hand_equipped: true` renders the icon rod-like enough on iPad can only be judged on the `ipad` channel.

**Resolution path.** Accept "identical icon plus hand-equipped sprite" as the closest stable equivalent (C-3, C-15 rank 4), document it (C-16), and verify it on the iPad.
