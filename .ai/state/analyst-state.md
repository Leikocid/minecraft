---
current_analysis_version: 2
current_versions_by_node:
  L0: 2
  L0-lgnd: 2
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
pending_revisions: []
last_run:
  started_at: '2026-09-26T08:02:47.815Z'
  completed_at: '2026-09-26T08:34:28.585Z'
  duration_seconds: 1901
  total_artifacts_current: 363
  total_size_kb: 825
  open_contradictions: 18
  llm_calls: 13
  llm_budget_used_pct: 7
  input_hash: 5c56c534e63d8e68925f115ddde490e66140132dfc37fd6b3578b07ccfce9bf3
  run_priority: 530
  run_scope:
    recorded_at: '2026-09-26T08:02:47.832Z'
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
last_rollout_hashes:
  project-knowledge/glossary.md: dd99adee8f90aca2
  project-knowledge/business-rules.md: 98269fb397864989
  project-knowledge/boundaries.md: 52130c6cd83d1194
  project-knowledge/intent.md: f3fd26f46ed66ec4
  project-knowledge/domain-model.md: fc98abcc81ff20da
  project-knowledge/architecture.md: 151ffe909095d531
  assumptions.md: 9e16bf66763deb36
  contradictions.md: 5240c8b237df77ac
  client-questions.md: 8043fe545bc0546d
  summary.md: 0048f1cd8c4d0b37
  scope.md: ff9637ad7a18f5d5
  risks.md: a83c2ed64be9cb1a
  decisions.md: 1d8dbb34cb4ae3f1
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
| L0 | 2 |
| L0-airs | 2 |
| L0-bast | 2 |
| L0-infr | 2 |
| L0-lgnd | 2 |
| L0-loot | 2 |
| L0-pick | 2 |
| L0-scyt | 2 |
| L0-strf | 2 |
| L0-webs | 2 |
| L0-wind | 2 |
| L0-wrdn | 2 |

## Last Run

- Started: 2026-09-26T08:02:47.815Z
- Completed: 2026-09-26T08:34:28.585Z
- Duration: 1901s
- Current artifacts: 363 (825 KB total)
- LLM calls: 13 (7% budget)
- Open contradictions: 18

## Changelog

_(no entries yet)_

*Auto-generated by `ai-kit analyze`. Manual edit allowed only for forced rollback of `current_versions_by_node`. Other fields overwritten on next run.*
