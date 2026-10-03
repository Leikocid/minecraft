---
type: "concept-component"
node_id: "L0-ring"
source_channel: "rollout"
analysis_version: 5
title: "RMB rings (`ring`)"
aliases: ["L0-ring"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 540
size_chars: 4322
tags: ["is_a:component", "orbital-cannon", "rmb", "explosion", "relates_to:L0-orbc", "relates_to:L0-pntr", "relates_to:L0-lgnd", "relates_to:L0-adr-ochg", "relates_to:L0-xasm7", "relates_to:L0-xasm8", "relates_to:L0-xcx10", "title:RMB rings (ring) — five TNT rings, independent programmatic explosions"]
level: 1
needs_rebuild_marked_at: 2026-10-02T18:41:56.508Z
---
# RMB rings (`ring`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-orbc", "L0-pntr", "L0-lgnd", "L0-adr-ochg", "L0-xasm7", "L0-xasm8", "L0-xcx10"]`

**Status (v1.4.4).** Shipped in v1.4.0 (`src/orbital/ring.ts`, `ring-layout.ts`); retuned in v1.4.1 and v1.4.4; deviations in src/orbital/README.md:29-65. Stage 5 order: `lgnd` delta → `orbc` → `pntr` → **`ring`**. The typings for stable `@minecraft/server` 2.10.0 expose `ExplosionOptions {allowUnderwater, breaksBlocks, causesFire, source}`. `world.gameRules.doTileDrops` is writable outside restricted execution.

## Responsibility
This component is the *effect* half of the Orbital Cannon's RMB mode (Orbital §10, §12, §15; ACs 11–15). It registers `registerEffect("rmb", …)` against the charge contract `L0-orbc-r014`, and owns:
1. **Layout.** `layout(target)` returns the charge columns for five continuous rings at d = 1/7/14/21/28, powers 4/4/2/1/1 (`L0-ring-r001`, `L0-ring-p001`, `L0-xasm8`). `orbc` spawns them all in one tick (`L0-ring-r002`).
2. **Detonation.** On `onDetonate(dim, point, ownerId, "rmb", attackId)`, the blast is queued. A global, bounded detonation queue drains it at ≤ `RING_MAX_BLASTS_PER_TICK` per tick (`L0-ring-p003`, `L0-ring-ad02`).
3. **Blast.** For each queued blast: protect legendaries, then one `dimension.createExplosion(centre, 4, …)`. The blast deals TNT damage, including to the owner (`L0-ring-r004`), and breaks blocks by TNT resistance (`L0-ring-r005`). It causes no fire. Underwater, it deals damage only (`L0-ring-r007`). All of this runs in `L0-ring-p002`.
4. **Drop suppression.** Broken blocks and destroyed containers leave no items (`L0-ring-r006`, `L0-xasm7`). Mob loot, XP and players' death drops stay vanilla. The mechanism is a scoped `doTileDrops` toggle (`L0-ring-ad01`). It departs from the snapshot-diff in `L0-adr-ochg` §3; see `L0-ring-cx01`.
5. **Independence and cleanup.** No blast moves, removes or triggers another charge (`L0-ring-r003`). After the attack, no ring-made entity or item is left (`L0-ring-r009`, C-19).

## Inputs
- From `orbc`: `target` for `layout`, then `dim`, `point`, `ownerId` and `attackId` per detonation (`L0-orbc-r014`). `point` is a solid contact cell in a loaded chunk.
- From `lgnd`: `protectLegendariesIn(dimension, volume, {avoid})` (`L0-lgnd-p008`) and `isLegendaryItemEntity`.
- Engine: `Dimension.createExplosion`, `world.gameRules.doTileDrops`, `Dimension.getBlock`, `Dimension.getBlocks`, `Dimension.getEntities`, `world.getEntity`, and `system.runInterval` (run only while its queue is non-empty).

## Outputs
- Column list (201 `{x,z}`) per attack.
- Engine explosions. Each one plays its own sound and particles and applies damage and knockback.
- World mutation: blocks broken per TNT resistance, with no item drops.
- Legendaries in the blast AABB, moved to a safe spot by `lgnd`.
- An optional gametest report per attack: `{attackId, charges, blasts, maxBlastsInTick, ticksToDrain, itemsSuppressed, legendariesMoved}`.

## Not owned (referenced, not restated)
- Target lock, cooldown, spawn height, fall, Void/unload, orphans: `L0-orbc` (`p001`–`p003`, `r007`–`r011`).
- Retention, loss return, craft gate: `L0-lgnd`.
- The LMB column: `L0-pntr`. `ring` shares its charge contract and legendary call, but has the opposite block rule. `ring` follows TNT resistance through the engine, so it needs no keep list.

## Artifacts
- **Entities:** `ent1` Ring Layout, `ent2` Queued Blast, `ent3` Drop-Suppression Window.
- **Processes:** `p001` rasterise, `p002` one blast, `p003` detonation queue and load shaping.
- **Rules:** `r001`–`r010`.
- **Constraints:** `cons` (RG-1…RG-6).
- **ACs:** `ac11`–`ac15` (bds), `ai11`/`ai12`/`ai15` (ipad), `ac16` legendaries, `ac17` load, `ac18` cleanup and preserved loot.
- **ADRs:** `ad01` drop suppression, `ad02` queue cap, `ad03` underwater flags, `ad04` batched protection.
- **Assumptions:** `as01`–`as08`.
- **Glossary:** `gl01`–`gl05`.
- **Contradictions:** `cx01` (drop suppression in `L0-adr-ochg`), `cx02` (`lgnd` protection radius and safe-spot search).

## Constraints honoured
- C-2: stable API only.
- C-5a′: the queue loop exists only while blasts are queued.
- C-7′/C-15: a rank-1 failure keeps the gamerule restored and the item in the world.
- C-12: no write to unloaded chunks.
- C-16: deviations go in `src/orbital/ring.ts` comments.
- C-19: no leftovers.
- C-20: tests use two players.
