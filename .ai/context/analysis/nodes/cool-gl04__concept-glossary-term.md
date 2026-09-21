---
type: "concept-glossary-term"
node_id: "L0-cool-gl04"
source_channel: "rollout"
aliases: ["L0-cool-gl04"]
part_of: ["L0-cool"]
is_a: ["glossary-term"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 442
tags: ["glossary-term","cooldown","actionbar","L0-cool"]
level: 2
---

**Holder**

A player currently equipping (main hand or off hand — see `L0-cool-asm3`) an item whose type is registered with the cooldown service's `AbilityRegistration`. The actionbar render loop's per-tick scope is defined entirely in terms of holders (R-cool-004) — being a holder is what makes a player eligible for a countdown render, independent of whether their ability is actually on cooldown.

**Synonyms:** sword holder, item holder.
