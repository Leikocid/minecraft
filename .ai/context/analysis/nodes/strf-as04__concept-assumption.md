---
type: "concept-assumption"
node_id: "L0-strf-as04"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — Guard persistence and sun immunity with stable tools"
aliases: ["L0-strf-as04"]
is_a: ["assumption"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1197
tags: ["is_a:assumption", "can-assume", "mobs", "probe", "relates_to:L0-wind"]
level: 2
---
# Assumption (CAN_ASSUME) — Guard persistence and sun immunity with stable tools

**Gap.** `L0-adr-strs` relies on a name tag to stop despawning and on infinite `fire_resistance` for sun immunity. The script `addEffect` duration is bounded (not infinite), and whether a *script-set* `nameTag` blocks despawn the same way a name-tag item does is unverified on BDS 1.26.51.

**Assumption.**
1. A script-set non-empty `nameTag` makes the mob persistent, as an item-applied name does.
2. `runCommand("effect @s fire_resistance infinite 0 true")` is stable, applies an infinite hidden effect, and survives restart. Fire resistance prevents sun damage; the mob may still show the burning animation, and that visual is a deviation.
3. Curing produces a new `minecraft:villager` without the effect.

**Impact if wrong.** (1) Guards vanish and test 19 fails. Fallback: re-apply persistence via a component group defined in a behavior-pack *entity event* on our own identifier, which the spec forbids (vanilla curing), or accept and document. (2) Guards burn at noon. Fallback: a helmet in the head slot via `EntityEquippableComponent`, if stable for mobs, which vanilla sun logic respects. Probe items 5–6.
