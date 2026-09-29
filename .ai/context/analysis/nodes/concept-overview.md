---
type: "concept-overview"
node_id: "L0"
source_channel: "rollout"
analysis_version: 3
level: 0
title: "Project Overview"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-infr","L0-pick","L0-lgnd","L0-webs","L0-scyt","L0-orbc","L0-pntr","L0-ring","L0-strf","L0-loot","L0-wind","L0-airs","L0-wrdn","L0-bast","L0-adr-orbc","L0-adr-ochg","L0-adr-hold","L0-adr-wpn2","L0-adr-wpn3","L0-adr-odrp","L0-adr-oprt","L0-adr-oded","L0-xcx8","L0-xcx9","L0-xcx10","L0-xcx11","L0-xcx12","L0-xcx13","L0-xcx14","L0-xq5","L0-xasm11","L0-xasm12","orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-2","orbitalcannonspecv1ruen-part-3","orbitalcannonspecv1ruen-part-4","fourstructuresspecruencopy-part-1","fourstructuresspecruencopy-part-10","fourstructuresspecruencopy-part-11","fourstructuresspecruencopy-part-2","fourstructuresspecruencopy-part-3","fourstructuresspecruencopy-part-4","fourstructuresspecruencopy-part-5","fourstructuresspecruencopy-part-6","fourstructuresspecruencopy-part-7","fourstructuresspecruencopy-part-8","fourstructuresspecruencopy-part-9","scytheofcalamityspecv1ruen-part-1","scytheofcalamityspecv1ruen-part-2","webswordspecv1ruen-part-1","webswordspecv1ruen-part-2","webswordspecv1ruen-part-3","constraints","minerspickaxetestspec","stage-0-infrastructure"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4", "constraints"]
supersedes: ["L0@v2"]
priority: 540
size_chars: 7719
tags: ["v3-reduce", "relates_to:L0-lgnd", "relates_to:L0-orbc", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-webs", "relates_to:L0-scyt"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v3: + Orbital Cannon, after deep-dive)

**What it is.**
- A Minecraft **Bedrock** add-on: one behavior pack and one resource pack, namespace `andrew:`, shipped as `dist/andrew.mcaddon`.
- It uses only the stable Script API: `@minecraft/server` 2.10.0, BDS 1.26.51.1.
- It is played on an iPad and verified on a Mac mini. Bedrock Dedicated Server runs in Docker (`bds` channel), and the iPad is the only proof of what renders (`ipad` channel).
- It has two feature families:
  - **legendary weapons**: Web Sword and Scythe shipped; the Orbital Cannon is new in v3 and not started as of 2026-09-29;
  - **four world structures**: shipped in v1.2.0, carried at v2, with a scan-code reconcile owed (`xcx12`).

## The Orbital Cannon, as the four components now see it
A third legendary that looks like a fishing rod. It is crafted once per world from a Fishing Rod and 4 TNT. Two attacks share one 30 s per-player cooldown. Both lock a block and drop charges from above (+30 in the Overworld and End, +10 in the Nether, clamped to the ceiling).
- **LMB** cores an irregular ~5×5 column down to the world floor, with no drops.
- **RMB** drops ~145–160 independent TNT charges in five rings, with TNT damage and TNT-resistance breaking but no drops.

The deep-dive turned the L0 sketch into a four-layer pipeline with **one-way dependencies**:

```
lgnd (rules, registry, gate, holder, protection)  ←─ called by all three
  ↑
orbc (item, input, target lock, cooldown, HUD, charge spawn/fall/detonate, lifecycle)
  │  onDetonate(dim, point, ownerId, mode, attackId)   ── charge contract orbc-r014
  ├─→ pntr (LMB column: plan → keep/remove → protect → batched setType → sound + particle wave)
  └─→ ring (RMB layout → queued createExplosion under a scoped doTileDrops=false → protect)
```

| Node | Owns (v3) | Publishes | Key ADRs | State |
|---|---|---|---|---|
| `L0-lgnd` | the third `LegendaryDef`; `resolveActivation(player, "use"\|"attack")`; craft **tokens** (`/give` and Creative never claim); `holder` in the mark and last-holder return; prevent → spill → return policy; `protectLegendariesIn` | `LegendaryDef.activations`, `craftTokenId`; `protectLegendariesIn(dim, volume, {avoid})`; `isLegendaryItemEntity`; HUD, now with per-weapon key lookup | `lgnd-ad08/09/10/11`, amended by `L0-adr-wpn3`, `L0-adr-oprt` | shipped framework; the `wpn2` backlog is **unshipped** and is now v3 step 1 |
| `L0-orbc` | item JSON, recipe, lang; LMB/RMB and touch input; 10-block target lock; cooldown write; HUD strings; charge entity, fall, contact, Void; in-memory attacks with orphan sweep | `onDetonate` contract (`r014`), `registerEffect(mode, …)`, spawn-height rule | `orbc-ad01` (target source, proposed), `ad02` charge motion, `ad03` lifecycle | not started; **blocked** by `L0-xcx14`/`L0-xq5` |
| `L0-pntr` | column mask (seeded, 3×3 core), the `xasm6` keep set, no-drop removal in one top-down `runJob`, one sound + 20-tick particle wave, no direct damage | a per-attack report | `pntr-ad01/02/03` | analysis only |
| `L0-ring` | ring rasterisation (`xasm8`), a global bounded detonation queue, `createExplosion(power 4)` with owner damage and no fire, underwater damage-only, drop suppression, cleanup | a per-attack report | `ring-ad01` → `L0-adr-odrp`; `ad02` queue cap; `ad03`; `ad04` batched protection | analysis only |

**What ties them together.**
- `pntr` and `ring` share exactly two things: the `orbc` charge contract and `lgnd`'s protection call. They have *opposite* block rules: `pntr` ignores TNT resistance and keeps liquids and unbreakables, while `ring` delegates to the engine.
- The legendary rules are never restated below `lgnd`. `orbc`, `pntr` and `ring` reference `lgnd-*` by id (invariant checked).
- Web Sword and Scythe inherit the `lgnd` delta with no re-run (`L0-adr-wpn3`).

## Cross-component decisions made in this reduce
- **`L0-adr-wpn3`** amends `wpn2`:
  - return goes to the last holder (answers `xq3`);
  - craft tokens;
  - the destruction policy;
  - nested shulker/bundle legendaries are a documented limit;
  - the unshipped `wpn2` backlog is step 1 of the `lgnd` v3 task.

  `xcx9`–`xcx11` close when that task merges green.
- **`L0-adr-odrp`** withdraws `adr-ochg` §3 (the item snapshot-diff deleted death drops and mob loot) in favour of `ring-ad01`'s scoped `doTileDrops` toggle. Only `ring` writes the gamerule.
- **`L0-adr-oprt`** sets one protection contract for both effects:
  - the caller sizes the volume (`ring` ± 2·power);
  - the safe-spot search starts at the `avoid` edge;
  - `lgnd` owns item frames through a vanilla-spill `setblock … destroy`.

  It fixes `ring-cx02` and `pntr-cx01`, which turned out to be one gap shared by both effects.
- **`L0-adr-oded`**:
  - the HUD uses per-weapon lang keys, so the spec wording holds and the other weapons are unchanged;
  - the Nether roof clamp is kept literal, with a C-16 note.

## Acceptance routing (checked)
| Orbital AC | Node | `bds` | `ipad` |
|---|---|---|---|
| 1, 2, 17, 20 | `lgnd` | `ac17`, `ac15`, `ac16`, `ac18`–`ac20` | `ac15` (crafting preview) |
| 3–6, 16, 18, 19 | `orbc` | `ac03`–`ac07`, `ac09`–`ac11`, `ac16`, `ac18`, `ac19` | `ac02` look, `ac08` touch |
| 7–10 | `pntr` | `ac01`–`ac07`, `ac09` | `ac08` |
| 11–15 | `ring` | `ac11`–`ac18` | `ai11`, `ai12`, `ai15` |

**Verification-order note.** `lgnd-ac19` ("the Cannon never destroys a legendary") and `ring-ac16` exercise LMB and RMB. They can only go green after `pntr` and `ring` merge, even though `lgnd` owns the rule. The `lgnd` task ships with a stub-effect version of `ac19`, and the full `ac19` is re-run as the `ring` task's last gate. `ring-ac16` overlaps the RMB half of `lgnd-ac19` on purpose: `ring` asserts its own call site, and `lgnd` asserts the policy.

## Stage 5 (binding order)
1. The `lgnd` v3 task, in five ordered steps (`L0-adr-wpn3`), with the shared engine probes `L0-xasm11` run first in step 5.
2. `orbc` with a stub effect. **Gated** on `L0-xcx14` (an iPad observation) and the client's answer to the rewritten `L0-xq5`, whose default is option 1.
3. `pntr`.
4. `ring`, whose load ceiling is `L0-xasm12`.

Every acceptance run uses ≥ 2 players. After each merge, re-open auto-closed `ipad` criteria.

## Deviations to tell the client (C-16)
- A legendary nested in a shulker-box item or bundle is not protected (`lgnd-cx12`).
- Item frames: spill-then-sweep if probe P1 passes. Otherwise frames are kept by LMB, and a framed legendary is lost to RMB.
- Nether roof: RMB aimed at Y ≥ 113 detonates in the roof.
- On default touch, reach is limited to arm's length (`xq5`).
- Destroyed-then-returned is used in place of "not destroyed" for vanilla fire, lava, cactus, TNT and the Void (`lgnd-ad10` tier 3).

## Open at L0
- **New:** `L0-xcx14` (touch range and aim, blocking), `L0-xq5` (rewritten), `L0-xasm11` (probe set), `L0-xasm12`.
- **Closing on merge:** `L0-xcx9`, `L0-xcx10`, `L0-xcx11`.
- **Carried:** `L0-xcx5`, `L0-xcx6`, `L0-xcx7`, `L0-xcx8` (extended by `xcx14`), `L0-xcx12`, `L0-xcx13`, `L0-xq2`, `L0-xq4`, `L0-xasm5`.
