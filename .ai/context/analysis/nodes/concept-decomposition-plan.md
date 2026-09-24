---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 1
title: "L0 Decomposition Plan"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 2592
tags: ["title:L0 Decomposition Plan", "alias:L0-plan", "is_a:plan", "relates_to:L0"]
level: 0
needs_rebuild_marked_at: 2026-09-24T19:44:29.131Z
---
# L0 Decomposition Plan

## Survey
- **Volume**: 8 primary inputs, ~24 K chars of raw spec + running TypeScript code (`src/`, `packs/`, `scripts/`) → above self-work threshold; decomposition required.
- **Diversity**: 4 distinct subject areas — dev/verification infrastructure, a compatibility-probe item, a shared legendary-weapon rule set, and per-weapon ability mechanics.
- **Coherence**: high — one add-on, one namespace, one build; specs cross-reference each other (stage-0 → pickaxe spec; scythe → "общие правила" and Shadow Blade).
- **Dependencies**: staged pipeline (infra → probe → legendary framework → weapons), but children are topical modules, not data-flow stages.

## Decomposition strategy: diversity

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| infr | Build & verification infrastructure (Stage 0: TS build, `.mcaddon` packaging, JSON validation, BDS in Docker, GameTest harness, iPad LAN cycle, version targets) | component-deep-dive | sonnet |
| pick | Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt) | component-deep-dive | sonnet |
| lgnd | Legendary weapon framework (one-per-world craft gate + refund, announcement, death retention/anti-dup, void return, cooldown store + Action Bar, hand priority, localization) | component-deep-dive | |
| webs | Web Sword (item/recipe, reach targeting, 3×3×3 cobweb trap, protected-block filter, unloaded-chunk safety) | component-deep-dive | sonnet |
| scyt | Scythe of Calamity (item/recipe, nearest-visible-player targeting + tie-break, 3 homing projectiles through blocks, 3 HP true damage, ~10-block launch, 20-block pursuit radius and cooldown outcomes, cleanup) | component-deep-dive | |

## Reduce plan
- `infr` and `pick` are closed stages; children should reconcile spec vs code and record residual gaps only.
- `lgnd` is the contract layer: it must extract the rules currently embedded in `src/websword/{craftgate,retention,cooldown,state}.ts` and phrase them as weapon-agnostic rules. `webs` and `scyt` reference `lgnd` rules by id instead of restating them; any rule a weapon overrides becomes a contradiction on L0.
- `scyt` has no code yet; its output seeds Stage-2 planning and must list its dependency on `lgnd` generalisation (today the framework is Web-Sword-specific).
- The parent rolls up: component overviews → L0 overview table; constraints de-duplicated against L0 C-1…C-12; assumptions/client-questions merged into the rollout files; cross-child overlaps (cooldown, craft gate, localization) resolved in favour of `lgnd`.
