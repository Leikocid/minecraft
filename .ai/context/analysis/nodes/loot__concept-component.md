---
type: "concept-component"
node_id: "L0-loot"
source_channel: "rollout"
analysis_version: 2
title: "Loot system — custom weighted table + vanilla loot-table application"
aliases: ["L0-loot"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2817
tags: ["is_a:component", "relates_to:L0-strf", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-infr", "title:Loot system - custom weighted table plus vanilla loot-table application"]
level: 1
---
# Loot system — custom weighted table + vanilla loot-table application

**Responsibility:** Fill every structure chest exactly once, at structure init time, with either (a) a custom weighted-random item table (Windmill, Airship) or (b) an unmodified vanilla Bedrock loot table (Mini Warden City, Mini Bastion). Owns: the 13-category weight table and its selection algorithm, equipment material/slot/enchantment rolling, and the vanilla-table dispatch for the two mini structures. Does not own: chest placement, structure templates, discovery/roll/collision (that's `strf`), or which structure gets which chest count (`wind`/`airs`/`wrdn`/`bast`).

**Inputs:** a call from the post-place init hook (`L0-adr-strc` step 5) per chest, carrying: chest block location, which structure type placed it (Windmill/Airship → custom path; Warden City/Bastion → vanilla path + table id).

**Outputs:** container contents written exactly once; frozen thereafter — nothing later re-invokes this component for the same chest (enforced by strf's instance registry, `L0-adr-strs`, not by loot itself).

**Two independent mechanisms, one scope boundary (`L0-loot-r007`):**
1. Custom weighted table (`L0-loot-p001`) — Windmill (25 chests) and Airship (10 chests) only. 5–12 attempts per chest; each attempt picks at most one of 13 categories by relative weight; category resolves to items per `L0-loot-e001`.
2. Vanilla loot-table application (`L0-loot-p002`) — Mini Warden City (40 chests, `chests/ancient_city`) and Mini Bastion (10 chests: 3× `chests/bastion_treasure`, 7× `chests/bastion_other`) only. Delegates entirely to the vanilla loot table; no custom weighting, no golden-apple cap, no curse filter — those constraints are specific to path 1.

**Cross-references:** `strf` (`L0-strf`) owns the post-place hook that calls this component and the persistence registry that guarantees "once." `wind`/`airs`/`wrdn`/`bast` own chest *placement* (counts, positions) but reference this component for chest *contents*. Both mechanisms reuse the shared structure rules in spec §2/§6/§7/§15 (persistence, idempotent init, no restoration after player destruction) only for "fill once" (`L0-loot-r006`); everything else in those sections belongs to `strf`.

**Key numbers:** 13 weighted categories; 5–12 attempts/chest; Golden Apple ≤1 success/chest, qty 1–3, never enchanted via the custom table; equipment 80/20 iron/diamond material split with random slot; enchants on the custom table are compatible, non-curse, up to vanilla max level.

**Confirmed:** the stable-API mechanism for invoking a vanilla loot table against a chest (`L0-loot-p002`) is `/loot insert` via `dimension.runCommand`, confirmed by strf-p006 Q4 re-measured PASS (`docs/structures/probe-results.md:16`); `src/structures/loot.ts` uses it — see `L0-loot-asm2`.
