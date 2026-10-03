---
title: Project Summary
type: analysis
generated_at: "2026-10-03T18:06:22.801Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 600
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v6 reduce: the Dragon Katana)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-infr", "L0-pick", "L0-lgnd", "L0-webs", "L0-scyt", "L0-orbc", "L0-pntr", "L0-ring", "L0-strf", "L0-loot", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast", "L0-ufoc", "L0-sauc", "L0-magn", "L0-katn", "L0-adr-ktob", "L0-adr-ktfl", "L0-adr-ktgr", "L0-adr-hold", "L0-xcx11", "L0-xcx21", "L0-lgnd-cx14", "L0-katn-cx01", "L0-xq6", "L0-xasm18", "L0-xasm19", "L0-xasm20", "L0-xasm21", "L0-xasm22", "L0-lgnd-ad14", "L0-lgnd-r017", "L0-lgnd-ac23", "L0-lgnd-ac24", "L0-katn-p001", "L0-katn-p002"]
requires: ["L0-lgnd"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3", "webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1", "ufomagnetspecv1ruen-part-1", "constraints"]
governs_files: ["src/legendary/", "src/websword/", "src/scythe/", "src/orbital/", "src/ufo/", "src/structures/", "src/katana/"]
supersedes: ["L0@v5"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v6)

**What it is.**
- A Minecraft **Bedrock** add-on: one behavior pack and one resource pack, namespace `andrew:`, shipped as `dist/andrew.mcaddon`. The as-built version is **1.4.4**.
- It uses only the stable Script API: `@minecraft/server` 2.10.0 on BDS 1.26.51.1. No Experiments, Beta or Preview.
- It is played on an iPad and verified on a Mac mini.
  - The `bds` channel is BDS in Docker: production 19132, QA 19134, checks 19136.
  - The iPad is the only proof of what renders (`ipad` channel).

| Family | Members | State (2026-10-03) |
|---|---|---|
| Legendary weapons | Web Sword, Scythe of Calamity, Orbital Cannon, **Dragon Katana (v6)** | The first three are shipped. **The Katana is analysed and ready for Stage 7 tasks; it is not built.** |
| World structures | Windmill, Warden City, Bastion, Airship | Shipped in v1.2.0. A scan-code reconcile is owed (`xcx12`). |
| World events | UFO Magnet (`ufoc`, `sauc`, `magn`) | Built and merged. The magnet-on cost of 36–39 ms is accepted as measured. |
| Probe / infra | Miner's Pickaxe, Stage 0 | Closed. |

## v6: how the two children fit together
v6 analysed two children: the new **`katn`** (the Katana) and a re-run of **`lgnd`** (the framework). The result is one thin seam. The Katana is **data plus one ability module** on top of the framework as shipped.

```
                 lgnd (as built 1.4.4 + def #4)                         katn (new, src/katana/)
 craft ─ recipe JSON ─► token ─► craftgate (lgnd-p001, ac23) ─► marked Katana, dk_crafted
 Use ─ itemUse / blockTap ─► resolveActivation (hands.ts:35) ─► def === DRAGON_KATANA ?
                                                                   │ trace (adr-ktob §1–2)
                                                                   │ safe cell (adr-ktob §3, katn-r004)
                                                                   │ player.teleport, same dim, no blocks
                         startCooldown("dragon_katana") ◄──────────┤
                         HUD via def.hudKeys (hud.ts:45) ◄─ reads ─┤
                                                                   │ fall flag (adr-ktfl, katn-local interval)
                                                                   └ petal trail (visual only)
 death / Void / hazard / Orbital ─► retention · recovery · protectLegendariesIn — def-driven, no Katana code (lgnd-ad14)
```

**The cross-component contract.** It holds in both directions and is verified from both sides.
- **The framework gives the Katana:** `LEGENDARIES` def #4, `resolveActivation`, `startCooldown`/`isReady`, the HUD through `hudKeys`, and every protection path. The framework adds no new hook, no new HUD state and no `mode` argument. The resolver's Use priority is all the Katana needs (`L0-lgnd-ad12` §2).
- **The Katana gives the framework:** a *wielder teleport*. It moves only the player, in the player's own dimension. It edits no block, spawns no entity and raises no inventory or `DropItem` event. So it is **invisible to recovery** (`L0-lgnd-r017`) and never calls `protectLegendariesIn`. The ability side states the same guarantee in `L0-katn-r002`.
- **Soft seams settled by assumption, with no code in the other nodes:**
  - The magnet never pulls the Katana. This is automatic through the type-based `isLegendaryStack`, and `L0-lgnd-ac23` adds the Katana stack to the UFO "never pulled" test.
  - The Katana may leave a Web Sword trap (cobweb is passable to the ray) and the magnet's hold (`L0-xasm21`).

## Invariant check ("`lgnd` answers first")
**It holds after reconciliation.** `katn` cites `lgnd-p001`/`p002`/`p003`/`p004`/`p005`/`p008` by id and needs no framework change. Five places disagreed between the two children of this run. The reduce reconciled them in place rather than filing contradictions:

| Disagreement | Settled to | Why |
|---|---|---|
| Katana HUD cooldown key: shared `andrew.legendary.cooldown` (`katn-ent1`, `r008`) vs `andrew.katana.hud_cooldown` (`lgnd-ad14`) | `andrew.katana.hud_cooldown`, `%s — %s s` | `hudKeys` takes both keys (`registry.ts:34`); the Orbital precedent; `lgnd` owns the key names |
| Teleport call with `dimension: dim` (`katn-p001` step 8) vs without it (`lgnd-r017` §3) | without | same dimension by construction; one fewer argument to get wrong |
| T16 restore "gen + 1" (`katn-ac07`) vs "same id and gen" (`lgnd-ac24`) | same gen | `retention.ts` restore does not bump the gen (as read during reduce) |
| T18 "last owner" (`katn-ac07`) vs `mark.owner` until `xcx11` (`lgnd-ac24`) | `mark.owner` | the holder change is not built |
| T01–T03 and T16–T18 asserted in both `katn-ac01`/`ac07` and `lgnd-ac23`/`ac24` | `lgnd` owns the assertions; `katn-ac01` keeps only the recipe → token check; `katn-ac07` points at `lgnd-ac24` | otherwise each test becomes two criteria |

One more correction does not involve `lgnd`. `katn-p002` and `L0-adr-ktfl` said the fall watcher would join "the add-on's shared runInterval". As read during reduce at v6, there is no pack-wide tick hub, so the watcher is a **`katn`-local, lazily created interval**. That follows the Orbital pattern (`penetrator.ts:615`), and it is not a framework hook.

## Contradictions surfaced and how they ended
| Id | Issue | Outcome |
|---|---|---|
| `L0-katn-cx01` | `adr-ktob` §3 let a lava cell count as "fits" | **Resolved:** `adr-ktob` §3 amended: *fits* = column ray clear (`katn-ad01`); *safe* = fits and no lava or fire (`katn-as03`) |
| `L0-xcx21` | T17 "survives" vs the shipped return under C-16 | **Resolved** by `L0-adr-ktgr` §1 |
| `L0-lgnd-cx14` | armour stand in the Void loses its legendary | **Resolved** as a documented C-16 deviation for all four weapons (`L0-adr-ktgr` §3) |

The operator confirms all of these defaults, plus `xasm18`/`xasm21` and the iPad aim model, through **`L0-xq6`**. It does **not** block the build.

## AC routing (Katana T01–T18), final
| T | Criterion | Channel |
|---|---|---|
| T01–T03 gate, flag, restart, `/give`, broadcast | `L0-lgnd-ac23` | `bds` + `build` |
| T01 recipe → token | `L0-katn-ac01` | `bds` + `build` |
| T04, T14, T15 | `L0-katn-ac02` | `bds` |
| T05–T10 | `L0-katn-ac03`, `ac04` | `bds` |
| T11, T12 | `L0-katn-ac05` | `bds` |
| T13 | `L0-katn-ac06` (counts) + `ac09` (look) | `bds` + `ipad` |
| T16–T18, teleport trips no recovery, same dimension | `L0-lgnd-ac24` | `bds` |
| Engine probes (fall reset, ray flags, column ray, unloaded chunk, particle) | `L0-katn-ac08` | `bds`, **before** any build task |
| Icon, Creative, HUD look, trail, aim feel | `L0-katn-ac09` | `ipad`, manual: **the orchestrator must not auto-close it** |

## Still open at L0 after v6
- **Re-asserted, not new:** `L0-xcx11` / `L0-adr-hold` / `L0-xq3`: Void return to the last holder. The Katana is the fourth spec asking for it. T18 is tested against `mark.owner`.
- **Probe-gated proposals:** `L0-adr-ktob`, `L0-adr-ktfl` and `L0-katn-ad01` stay `proposed` until `L0-katn-ac08` records the engine facts. A failed probe supersedes the matching ADR before the build tasks. A superseded `adr-ktfl` also rewords C-25.
- **Carried, not touched in v6:** `xcx17`, `xcx19`; `lgnd-cx09`/`cx11`/`cx12`; `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`.

## Stage 7 order
1. **Probe** (`katn-ac08`) on the checks instance (19136).
2. **`lgnd` v6:** def #4, the uniqueness-test extension, `dk` key asserts, and the Katana instances of the framework tests (`lgnd-ac23`, `ac24`). This lands together with step 3.
3. **`katn`:** item, token, recipe, RP texture and lang (both HUD keys).
4. **`katn`:** trace, safe cell and teleport (`plan.ts`, pure, with node tests).
5. **`katn`:** fall flag and trail.

Each merge needs a green **full** suite on the task branch. After each epic merge, reopen `katn-ac09`.


## Statistics

- **Total artifacts:** 1108
- **concept-aggregate:** 79 (203 KB)
- **concept-atomic:** 793 (738 KB)
- **concept-special:** 63 (91 KB)
- **raw:** 30 (120 KB)
- **decision:** 103 (68 KB)
- **other:** 40 (331 KB)

### By level

- L0: 14 artifacts
- L1: 72 artifacts
- L2: 830 artifacts
- L3: 6 artifacts


_Analysis version: 6_
