---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 3
title: "L0 Decomposition Plan (v3)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
supersedes: ["L0-plan@v2"]
priority: 540
size_chars: 4852
tags: ["title:L0 Decomposition Plan (v3)", "alias:L0-plan", "alias:Decomposition Plan", "is_a:plan", "relates_to:L0", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "supersedes:L0-plan@v2"]
level: 0
---
# L0 Decomposition Plan (v3)

## Survey
- **Volume.** 23 primary inputs, ~90 K chars raw. The KV already holds 422 artifacts from v1–v2. The v3 delta is one new spec, *Orbital Cannon* (4 fragments, ~16.5 K chars, with fragments 3/4 overlapping). The delta alone is above the self-work threshold and carries 20 acceptance tests, so decomposition is mandatory.
- **Diversity.** The Orbital spec mixes four topics:
  - an item and legendary-rule layer (§2–§5), which overlaps `lgnd`;
  - an activation/charge layer (§6–§8, §11);
  - two independent effects with different physics (§9 column, §10 rings).
- **Coherence.** High inside the spec. It has one weapon and one lifecycle. Its §5 restates the **general** legendary rules and changes two of them (Void return goes to the *last* owner; legendaries are "not destroyed"). That lands on the shared framework, not on the new weapon.
- **Dependencies.** A clear pipeline: input → target lock → cooldown → charge spawn and fall → detonation → effect (LMB | RMB) → cleanup. The effects are leaves with no data between them.

## Decomposition strategy: pipeline
The split follows the attack pipeline. The shared-framework delta goes to the existing `lgnd` node. Every other v2 node is carried at v2 and is **not** re-run.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| lgnd | Legendary framework — v3 delta only. Add `ORBITAL_CANNON` to the static registry (cooldown 600 ticks, refund 4 TNT + 1 Fishing Rod). Add an LMB activation path to `resolveActivation`. Make `/give` and Creative copies stop claiming the craft (`xcx9`). Return to the last holder, with a `holder` field in the mark (`xcx11`, answers `xq3`). Add a "not destroyed" policy and a container-destruction rule (`xcx10`). Expose a `protectLegendariesIn(dimension, volume)` helper for the effects. Reconcile existing ACs. | component-deep-dive | |
| orbc | Orbital Cannon core. Item JSON: fishing-rod icon, no fishing, no durability, not enchantable, punch damage, Equipment category (`xcx13`). Recipe and lang. Input mapping for LMB/RMB and touch (`xcx8`). 10-block raycast on any face; silent no-op with no cooldown when nothing is hit. Target lock, shared cooldown and HUD. Charge spawn height per dimension with ceiling clamp. A script-driven charge that falls through entities and detonates on first block contact or immediately when inside a solid block; the Void destroys it. Owner-independent lifecycle bound to its dimension; lost on unload or restart. | component-deep-dive | |
| pntr | LMB penetrator. Compute the irregular ~5×5 column from the detonation point down to `heightRange.min`. Keep liquids and Survival-unbreakable blocks without stopping below them (`xasm6`). Remove Obsidian, Nether portals, containers and spawners with no drops, but protect legendaries through `lgnd`. Batched removal that looks instant. One sound and a ~1 s top-down particle wave. No direct damage. ACs 7–10. | component-deep-dive | |
| ring | RMB rings. Rasterise continuous rings at d≈1/5/10/15/20 (`xasm8`). Spawn all charges at once. Each explodes independently (no chain push). TNT-equivalent damage including the owner. TNT-resistance block breaking with no drops (`xasm7`) and no fire. Underwater: damage only. Protect legendaries. Clean up temporaries. Performance under several simultaneous RMBs. ACs 11–15. | component-deep-dive | |

## Reduce plan
- **`lgnd` answers first.** `orbc`, `pntr` and `ring` reference `lgnd-*` rules by id and must not restate retention, loss return, the craft gate or cooldown storage. The `lgnd` delta also rewrites the web/scythe ACs that the rule changes touch. Web Sword and Scythe inherit last-holder return and the `/give` fix.
- **`orbc` publishes the charge contract** consumed by `pntr` and `ring`: `onDetonate(dimension, point, ownerId, mode)`, the spawn-height rule and the unload semantics. The effects publish only their block/entity rules and budgets. Any effect needing a different charge behaviour becomes a contradiction on L0.
- **AC routing.** Orbital ACs 1–2, 17 and 20 go to `lgnd`. ACs 3–6, 16 and 18–19 go to `orbc`. ACs 7–10 go to `pntr` and ACs 11–15 to `ring`. Each child splits its ACs into `bds` (gametest with 2 players, state and block counts) and `ipad` (look, highlight, sound, touch input, HUD), per C-9, avoiding `L0-xcx7`.
- **Roll-up.** Child overviews go into the L0 overview table. New constraints are de-duplicated against C-1…C-20. `xcx8` must be settled (child ADR plus client answer to `xq5`) before `orbc` tasks are created. `xcx9`–`xcx11` close through `lgnd` ADRs, which amend `L0-adr-wpn2`. Stage 5 order: `lgnd` delta → `orbc` (stub effect) → `pntr` → `ring`.
- **Not in this run:** a scan-code reconcile of the six structure nodes against v1.2.0 (`xcx12`). It is queued as a separate run and does not block Stage 5.
