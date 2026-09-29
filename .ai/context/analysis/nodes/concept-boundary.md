---
type: "concept-boundary"
node_id: "L0"
source_channel: "rollout"
analysis_version: 3
title: "System Boundaries"
aliases: ["L0-boundary","Boundaries"]
is_a: ["boundary"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-2","orbitalcannonspecv1ruen-part-3","orbitalcannonspecv1ruen-part-4","fourstructuresspecruencopy-part-1"]
supersedes: ["L0-boundary@v2"]
priority: 540
size_chars: 2237
tags: ["title:System Boundaries","alias:L0-boundary","alias:Boundaries","is_a:boundary","relates_to:L0","see_also:orbitalcannonspecv1ruen-part-1","see_also:orbitalcannonspecv1ruen-part-2","see_also:orbitalcannonspecv1ruen-part-3","see_also:orbitalcannonspecv1ruen-part-4","see_also:fourstructuresspecruencopy-part-1","supersedes:L0-boundary@v2","resolved"]
level: 0
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0
---

# System Boundaries

## In scope
- Everything in scope at v2 is carried unchanged: Stage 0 infrastructure, Miner's Pickaxe, the legendary framework, Web Sword, Scythe, and the four structures (now shipped in v1.2.0).
- **New — Orbital Cannon (`andrew:orbital_cannon`):**
  - A custom item that looks like the vanilla Fishing Rod, with no fishing, no durability loss and no enchanting. Melee does empty-hand damage. It is in the Creative *Equipment* category, in search, and available through `/give`.
  - A shaped recipe: TNT on N/E/S/W and a Fishing Rod in the centre. One Survival craft per world, persisted, announced in RU/EN with the crafter's name.
  - The general legendary rules (death retention, free transfer, Void return with offline delivery, survival of container destruction) apply to **all** legendaries, not only the Cannon.
  - Two attacks with a shared 30 s per-player cooldown. Targeting is limited to 10 blocks, and the target is locked at activation.
  - Charges spawn at +30 (Overworld/End) or +10 (Nether), clamped to the ceiling. They fall through entities, detonate on first block contact or at once inside a solid block, and vanish in the Void.
  - LMB column effect and RMB five-ring effect as summarised in the overview.
  - Action-bar HUD for the main or off hand: "Orbital Cannon — Ready / 27s".
  - All three dimensions.
  - Acceptance tests 1–20 and the DoD in Orbital §14–§15.

## Out of scope (explicit)
- A custom texture or model for the Cannon (vanilla fishing-rod look only).
- A target marker beyond the vanilla block highlight.
- Force-loading chunks for in-flight charges. Persisting or restoring in-flight charges across restart. Refunding the cooldown when a charge is lost.
- Extra sounds along the LMB particle wave.
- Direct entity damage from LMB.
- Fire from RMB. Terrain damage from RMB underwater.
- Java Edition. Beta, Preview or Experiments (C-2).

## Undefined / to be settled by children or the client
- LMB activation beyond vanilla reach (`L0-xcx8`, `L0-xq5`).
- The exact list of "Survival-unbreakable" blocks (`L0-xasm6`).
- Whether ordinary container *contents* count as the "drops" that RMB suppresses (`L0-xasm7`).
- Shadow Blade and Dragon Katana are still only referenced.
