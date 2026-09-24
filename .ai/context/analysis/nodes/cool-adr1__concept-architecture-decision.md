---
type: "concept-architecture-decision"
node_id: "cool-adr1"
source_channel: "rollout"
analysis_version: 1
title: "ADR-1 · Shipped packs use only the stable Script API (`@minecraft/server` 2.10.0)"
aliases: ["cool-adr1"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1033
tags: ["title:ADR-1 Stable Script API only", "is_a:architecture-decision"]
---
# ADR-1 · Shipped packs use only the stable Script API (`@minecraft/server` 2.10.0)

**Context.** The add-on targets an iPad with the App Store Minecraft build. Beta APIs need the "Beta APIs" experiment on the world, which the specs forbid ("нет обязательной зависимости от Experiments/Preview"). They also break between game updates.

**Decision.** Behavior pack depends only on stable `@minecraft/server` 2.10.0, `min_engine_version` [1,26,50]. All versions come from `scripts/targets.mjs`. When an API is missing, degrade to the "nearest stable equivalent" the specs allow (e.g. Action Bar for the cooldown UI, script-driven Scythe projectiles).

**Rejected.** (a) `@minecraft/server` beta for richer events such as craft/cooldown components: needs experiments, violates DoD. (b) Pinning 2.9.0 as the pickaxe spec says: replaced after the actual iPad version was checked (see CTR-4).

**Note.** `@minecraft/server-gametest` (beta) is a devDependency used only by the BDS GameTest harness. It isn't part of the shipped `.mcaddon`.
