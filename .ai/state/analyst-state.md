---
current_analysis_version: 3
current_versions_by_node:
  L0: 3
  L0-lgnd: 3
  L0-pick: 2
  L0-infr: 2
  L0-scyt: 2
  L0-webs: 2
  L0-strf: 2
  L0-loot: 2
  L0-wind: 2
  L0-wrdn: 2
  L0-bast: 2
  L0-airs: 2
  L0-pntr: 3
  L0-orbc: 3
  L0-ring: 3
pending_revisions: []
last_run:
  started_at: '2026-09-29T18:44:27.410Z'
  completed_at: '2026-09-29T19:09:13.569Z'
  duration_seconds: 1486
  total_artifacts_current: 274
  total_size_kb: 1128
  open_contradictions: 23
  llm_calls: 6
  llm_budget_used_pct: 3
  input_hash: 2003c93a0c8e159a49272ca4ed4f892abe0eab1e4a27b006a881ac9ae4abca88
  run_priority: 540
  run_scope:
    recorded_at: '2026-09-29T18:44:27.428Z'
    rule: 'full: every node the decomposition plans name, from L0 down.'
    nodes:
      - L0
    reasons:
      L0: root — every run enters the tree here
  stages:
    - stage: nodes
      entered_at: '2026-09-24T19:23:43.218Z'
      done: 6
    - stage: rollout
      entered_at: '2026-09-24T19:42:02.813Z'
    - stage: nodes
      entered_at: '2026-09-26T08:02:47.839Z'
      done: 12
    - stage: rollout
      entered_at: '2026-09-26T08:34:28.601Z'
    - stage: collect-decisions
      entered_at: '2026-09-26T08:38:44.737Z'
    - stage: load-model
      entered_at: '2026-09-29T16:55:19.761Z'
    - stage: audit
      entered_at: '2026-09-29T16:55:19.768Z'
    - stage: delta 1/8
      entered_at: '2026-09-29T16:55:19.777Z'
    - stage: delta 2/8
      entered_at: '2026-09-29T16:55:48.347Z'
    - stage: delta 3/8
      entered_at: '2026-09-29T16:56:17.605Z'
    - stage: delta 4/8
      entered_at: '2026-09-29T16:56:23.957Z'
    - stage: delta 5/8
      entered_at: '2026-09-29T16:56:28.191Z'
    - stage: delta 6/8
      entered_at: '2026-09-29T16:56:33.467Z'
    - stage: delta 7/8
      entered_at: '2026-09-29T16:56:39.698Z'
    - stage: delta 8/8
      entered_at: '2026-09-29T16:57:02.786Z'
    - stage: nodes
      entered_at: '2026-09-29T18:44:27.434Z'
      done: 5
    - stage: rollout
      entered_at: '2026-09-29T19:09:13.581Z'
last_rollout_hashes:
  project-knowledge/glossary.md: 825c1021d33e942e
  project-knowledge/business-rules.md: ee27f716ce5399c3
  project-knowledge/boundaries.md: a65577e12b849e76
  project-knowledge/intent.md: 07cff0e1a496ae82
  project-knowledge/domain-model.md: f00f536d8be51b72
  project-knowledge/architecture.md: f8290ab0d88f380b
  assumptions.md: cbe126568ce4181f
  contradictions.md: e97679f585a7bda9
  client-questions.md: 9a04c139e75beb91
  summary.md: d3bb69a73ecfb912
  scope.md: 6168ee4cf1be604c
  risks.md: e34753667b586e10
  decisions.md: b656378471e427f7
runtime_vocabulary:
  concept-boundary:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-constraint:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-decomposition-plan:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-intent:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-overview:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-acceptance-criterion:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-entity:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-process:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-rule:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-component:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-architecture-decision:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-assumption:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-contradiction:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-glossary-term:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-client-question:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
slug_mappings:
  'Build & verification infrastructure (Stage 0: TS build, `.mcaddon` packaging, JSON validation, BDS in Docker, GameTest harness, iPad LAN cycle, version targets)': L0-infr
  'Miner''s Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt)': L0-pick
  Legendary weapon framework (one-per-world craft gate + refund, announcement, death retention/anti-dup, void return, cooldown store + Action Bar, hand priority, localization): L0-lgnd
  Web Sword (item/recipe, reach targeting, 3×3×3 cobweb trap, protected-block filter, unloaded-chunk safety): L0-webs
  Scythe of Calamity (item/recipe, nearest-visible-player targeting + tie-break, 3 homing projectiles through blocks, 3 HP true damage, ~10-block launch, 20-block pursuit radius and cooldown outcomes, cleanup): L0-scyt
  'Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline — generating `.mcstructure` from repo sources, packing `structures/`, worldgen/placement GameTest harness, statistical chunk-roll checks, restart/idempotency checks on BDS)': L0-infr
  Miner's Pickaxe probe (Stage 1, closed — reconcile only): L0-pick
  Legendary weapon framework (shipped `src/legendary/`; reconcile spec vs code): L0-lgnd
  Web Sword (shipped; reconcile): L0-webs
  Scythe of Calamity (shipped Stage 3; mob targeting now in scope; reconcile): L0-scyt
  Structure framework — StructureDef registry, chunk discovery + seeded per-chunk roll, rotation, footprint validity (dry land / water / lava ocean / world ceiling / flatness), vanilla/custom structure collision heuristic, loaded-footprint guarantee, `structureManager.place`, persistent instance registry + idempotent first-init, one-time persistent mobs, vanilla-like spawner semantics, deviation report: L0-strf
  Loot system — custom weighted table (13 categories, 5–12 attempts, Golden Apple once, 80/20 iron/diamond, random armor slot, compatible non-curse enchants up to max level) + vanilla loot-table application (`chests/ancient_city`, `chests/bastion_treasure`, `chests/bastion_other`); one-time fill; statistical tests: L0-loot
  Windmill — template (3 floors, stairs, blades, fields, fence, water, decay), 25 chests 5/8/12, 3 spawners, 10 sun-immune persistent field Zombie Villagers + cure behaviour, 1 % normal gen, guaranteed spawn-area search (5×5 chunks → ≤500 blocks → forced site prep with edge smoothing, shallow void fill only), linked-Airship trigger: L0-wind
  Airship — template (gondola 4 rooms + corridor, balloon), 10 chests, 1 Vindicator spawner, whole-footprint land check, altitude 40–70 above max terrain, ceiling rejection, independent 2 %, Windmill-linked 40–100 block search (no dedupe, no widening): L0-airs
  Mini Warden City — ~30×30×10–15 template, random top Y −35…−45, land-above check, ~5×5 surface sculk marker aligned so digging down hits the hall, Reinforced Deepslate monument, 2 natural shriekers (`can_summon`), 10 Ancient City chests (3 central), sparse soul lighting, 5 % gen: L0-wrdn
  Mini Bastion — Nether ~20×20×10–12 template, 2–3 levels, lava treasure room (3 treasure chests + 2–4 gold blocks), 7 bastion chests, 7–10 Piglins + 2 Brutes one-time persistent, no Hoglins, not over lava ocean, 5 % gen: L0-bast
  Legendary framework — v3 delta only. Add `ORBITAL_CANNON` to the static registry (cooldown 600 ticks, refund 4 TNT + 1 Fishing Rod). Add an LMB activation path to `resolveActivation`. Make `/give` and Creative copies stop claiming the craft (`xcx9`). Return to the last holder, with a `holder` field in the mark (`xcx11`, answers `xq3`). Add a "not destroyed" policy and a container-destruction rule (`xcx10`). Expose a `protectLegendariesIn(dimension, volume)` helper for the effects. Reconcile existing ACs.: L0-lgnd
  'Orbital Cannon core. Item JSON: fishing-rod icon, no fishing, no durability, not enchantable, punch damage, Equipment category (`xcx13`). Recipe and lang. Input mapping for LMB/RMB and touch (`xcx8`). 10-block raycast on any face; silent no-op with no cooldown when nothing is hit. Target lock, shared cooldown and HUD. Charge spawn height per dimension with ceiling clamp. A script-driven charge that falls through entities and detonates on first block contact or immediately when inside a solid block; the Void destroys it. Owner-independent lifecycle bound to its dimension; lost on unload or restart.': L0-orbc
  LMB penetrator. Compute the irregular ~5×5 column from the detonation point down to `heightRange.min`. Keep liquids and Survival-unbreakable blocks without stopping below them (`xasm6`). Remove Obsidian, Nether portals, containers and spawners with no drops, but protect legendaries through `lgnd`. Batched removal that looks instant. One sound and a ~1 s top-down particle wave. No direct damage. ACs 7–10.: L0-pntr
  'RMB rings. Rasterise continuous rings at d≈1/5/10/15/20 (`xasm8`). Spawn all charges at once. Each explodes independently (no chain push). TNT-equivalent damage including the owner. TNT-resistance block breaking with no drops (`xasm7`) and no fire. Underwater: damage only. Protect legendaries. Clean up temporaries. Performance under several simultaneous RMBs. ACs 11–15.': L0-ring
tags:
  - analysis
  - registry
type: system-registry
---

# Analyst State

Runtime state for the analyst pipeline (analyse runs, vocabulary, slug map, rollout caches). Updated automatically.

## Current Versions

| Node | Version |
|------|---------|
| L0 | 3 |
| L0-airs | 2 |
| L0-bast | 2 |
| L0-infr | 2 |
| L0-lgnd | 3 |
| L0-loot | 2 |
| L0-orbc | 3 |
| L0-pick | 2 |
| L0-pntr | 3 |
| L0-ring | 3 |
| L0-scyt | 2 |
| L0-strf | 2 |
| L0-webs | 2 |
| L0-wind | 2 |
| L0-wrdn | 2 |

## Last Run

- Started: 2026-09-29T18:44:27.410Z
- Completed: 2026-09-29T19:09:13.569Z
- Duration: 1486s
- Current artifacts: 274 (1128 KB total)
- LLM calls: 6 (3% budget)
- Open contradictions: 23

## Changelog

_(no entries yet)_

*Auto-generated by `ai-kit analyze`. Manual edit allowed only for forced rollback of `current_versions_by_node`. Other fields overwritten on next run.*
