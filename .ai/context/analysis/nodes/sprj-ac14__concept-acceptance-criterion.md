---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac14"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-14 — A lethal hit kills through the vanilla path; restart leaves no orphans"
aliases: ["L0-sprj-ac14"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 840
tags: ["is_a:acceptance-criterion", "channel:bds", "true-damage", "lethal"]
level: 2
---
# AC-sprj-14 — A lethal hit kills through the vanilla path; restart leaves no orphans

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-p003", "L0-sprj-cx02", "L0-sprj-p004", "C-14", "ADR-022"]` · channel: `bds`

**GIVEN** a target at 2 HP (no totem), **WHEN** one projectile hits, **THEN** the target dies, the chat death message names the owner, and the volley resolves `TARGET_INVALID` with the cooldown committed.

**GIVEN** the same with a Totem of Undying in the off hand, **THEN** the totem is consumed, the target survives, and the volley continues.

**GIVEN** a live volley after ≥ 1 hit, **WHEN** the BDS is stopped and restarted, **THEN** after load there are no volleys, no interval and no Scythe entities in the world, **AND** the owner's cooldown is still active (`L0-sprj-ad01`).
