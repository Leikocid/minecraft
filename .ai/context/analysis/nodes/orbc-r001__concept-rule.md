---
type: "concept-rule"
node_id: "L0-orbc-r001"
source_channel: "rollout"
analysis_version: 3
title: "Rule · Item identity: a rod icon with no rod behaviour"
aliases: ["L0-orbc-r001"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 871
tags: ["is_a:rule", "relates_to:L0-orbc-ent1", "relates_to:L0-xcx13", "item"]
level: 2
---
# Rule · Item identity: a rod icon with no rod behaviour

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-ent1", "L0-xcx13"]`

The Cannon must:
- show the vanilla `fishing_rod` icon, with no custom texture;
- never cast a bobber or catch anything;
- never lose durability;
- be rejected by the enchanting table and the anvil, including combining with books;
- deal an empty-hand punch in melee, with no knockback or effect bonus;
- appear under Creative → Equipment and in search/All;
- be obtainable with `/give`.

**Implementation.** These follow from the item JSON **omitting** `durability`, `enchantable`, `damage`, `digger`, `use_modifiers`, `shooter` and `throwable` (`ent1`). Nothing is enforced by script.

Source: Orbital §2 and §4. Deviation: the in-hand model is the icon sprite, not the vanilla cast/reeled model (`xcx13`, C-16).
