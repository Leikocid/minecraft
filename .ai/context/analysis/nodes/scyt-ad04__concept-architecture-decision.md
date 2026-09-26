---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad04"
source_channel: "rollout"
analysis_version: 1
title: "ADR-scyt-04 — Mobs are targets too; any visible player outranks any mob"
aliases: ["L0-scyt-ad04"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1412
tags: ["is_a:architecture-decision", "mob-targeting", "decision", "spec-override", "delta:2026-09-26"]
level: 2
---
# ADR-scyt-04 — Mobs are targets too; any visible player outranks any mob

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-r001", "L0-scyt-r002", "L0-scyt-ac02", "L0-scyt-ac17", "L0-scyt-ac18"]`

Status: **accepted and implemented**. Operator decision `decision-scythe-targets-mobs`, 2026-09-25, commit `4b74f2f`, build 0.4.1.

**Context.** The operator said «коса бедствия должна действовать на мобов тоже». That reverses spec §3 («Мобы не являются целями способности»), §8 test 2 and the boundary entry "Scythe: mobs as targets — out of scope".

**Decision.** Living entities within 20 blocks become candidates (`L0-scyt-ad01`). `pickTarget` sorts by `isPlayer` first, so a visible player at 19 blocks beats a cow at 2 blocks. Everything downstream (LOS, gaze tie-break, 3 projectiles, 3 HP, the launch, the leash, the cooldown) takes an `Entity` and is unchanged. The hidden state applies to players only. The miss text changes to «Здесь нет цели».

**Rejected.**
- Pure nearest-wins across players and mobs. A passing zombie would swallow a PvP volley. It stays a one-line flip if the operator asks.
- Hostile mobs only. This was not asked for, and the health component is the only discriminator used.

**Measured:** a player plus a nearer cow → the player is chosen. A lone cow → the cow is chosen, hp 10 → 7. Only a hidden player → no target and no cooldown.
