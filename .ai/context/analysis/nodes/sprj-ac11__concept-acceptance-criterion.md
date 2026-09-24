---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac11"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-11 — Owner death, logout or dimension change cancels the volley (ASM-023)"
aliases: ["L0-sprj-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 764
tags: ["is_a:acceptance-criterion", "channel:bds", "owner-events"]
level: 2
---
# AC-sprj-11 — Owner death, logout or dimension change cancels the volley (ASM-023)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-p004", "L0-sprj-ad01", "L0-sprj-as06", "ASM-023"]` · channel: `bds`

**GIVEN** a live volley,
**WHEN** the owner dies, disconnects, or changes dimension,
**THEN** within 1 tick the volley resolves `OWNER_INVALID`, all projectiles are `GONE`, the target takes no further damage, and busy is cleared by id.

**AND WHEN** the owner had already scored ≥ 1 hit and disconnected, **THEN** on reconnect their Scythe cooldown is active, and remaining ≤ 30 s measured from the first hit (`L0-sprj-ad01`).
**AND WHEN** there were 0 hits, **THEN** on reconnect the ability is ready and not busy.
