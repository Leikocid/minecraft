---
type: "concept-assumption"
node_id: "L0-scyt-as03"
source_channel: "rollout"
analysis_version: 2
title: "ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME`"
aliases: ["L0-scyt-as03"]
is_a: ["assumption"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 633
tags: ["is_a:assumption", "CAN_ASSUME", "melee", "damage"]
level: 2
---
# ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r009", "L0-scyt-ac15"]`

**Assumed:** the shipped Web Sword uses `minecraft:damage: 7` to match a Diamond Sword (Web Sword §7 was accepted in Stage 2). Vanilla Netherite is one point above Diamond, so the Scythe uses `8`.

**Basis:** `packs/behavior/items/web_sword.json` (read 2026-09-24), plus the vanilla diamond → netherite step of +1.

**Impact if wrong:** a one-number change in the item JSON. AC-scyt-15's BDS comparison against a real netherite sword catches it.
