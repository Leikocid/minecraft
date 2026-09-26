---
type: "concept-overview"
node_id: "L0"
source_channel: "rollout"
analysis_version: 2
level: 0
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v2: weapons + world structures, after the deep-dive)"
aliases: ["L0"]
is_a: ["overview"]
priority: 530
size_chars: 6418
tags: ["title:Project Overview", "alias:L0", "is_a:system-overview", "reduce", "relates_to:L0-infr", "relates_to:L0-pick", "relates_to:L0-lgnd", "relates_to:L0-webs", "relates_to:L0-scyt", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-adr-link", "relates_to:L0-adr-spwn", "relates_to:L0-adr-own", "relates_to:L0-adr-wpn2", "relates_to:L0-adr-body", "relates_to:L0-xcx6", "relates_to:L0-xcx7", "see_also:fourstructuresspecruencopy", "supersedes:L0@v1"]
relates_to: ["fourstructuresspecruencopy-part-1","fourstructuresspecruencopy-part-10","fourstructuresspecruencopy-part-11","fourstructuresspecruencopy-part-2","fourstructuresspecruencopy-part-3","fourstructuresspecruencopy-part-4","fourstructuresspecruencopy-part-5","fourstructuresspecruencopy-part-6","fourstructuresspecruencopy-part-7","fourstructuresspecruencopy-part-8","fourstructuresspecruencopy-part-9","scytheofcalamityspecv1ruen-part-1","scytheofcalamityspecv1ruen-part-2","webswordspecv1ruen-part-1","webswordspecv1ruen-part-2","webswordspecv1ruen-part-3","constraints","minerspickaxetestspec","stage-0-infrastructure"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v2: weapons + world structures, after the deep-dive)

**Links:** `is_a: ["overview"]` · `relates_to: ["L0-infr", "L0-pick", "L0-lgnd", "L0-webs", "L0-scyt", "L0-strf", "L0-loot", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast"]`

**What it is.** A Minecraft **Bedrock** add-on: a behavior pack plus a resource pack, namespace `andrew:`. It uses only the stable Script API (`@minecraft/server` 2.10.0, engine [1,26,50], BDS 1.26.51.1). It is played on an iPad and built and verified on a Mac mini, with Bedrock Dedicated Server running in Docker.

It has two feature families on one platform:
- **Legendary weapons.** These are shipped and in reconcile mode.
- **Four world structures.** These are analysis only. As read at `302fba4`, no structure code or `structures/` directory existed.

## Components after the deep-dive

| Layer | Node | State (2026-09-26) | What the deep-dive established |
|---|---|---|---|
| Platform | `L0-infr` | Stage 0 closed; v2 delta planned | Adds `scripts/build-structures.mjs`, which compiles repo layout sources into `.mcstructure` files (`L0-adr-tmpl`), with a round-trip test. New `bds` lanes cover 4-rotation placement, the statistical chunk-roll rate and restart idempotency (`infr-p005..p007`). |
| Probe | `L0-pick` | closed (DEMO-S1) | Nothing new. CTR-4 is carried. |
| Weapons, contract | `L0-lgnd` | shipped `src/legendary/` | As built, the registry is static, there is no central dispatcher, busy is a durable deadline and Ready shows continuously (`lgnd-ad07`). There are four source-vs-code drifts (`cx07..cx10`), ruled on in `L0-adr-wpn2`. |
| Weapons | `L0-webs` | shipped | The cast body only (3×3×3 cobweb cube). Everything else goes through `lgnd`. |
| Weapons | `L0-scyt` | shipped 0.4.2 | It now targets mobs, but players outrank mobs. The leash is horizontal. Hits are dealt through a damage event plus a correction. Its `L0-sprj`/`L0-sitm` sub-scopes are stale (`scyt-cx03..05`, ruled on in `L0-adr-wpn2`). |
| Structures, contract | `L0-strf` | analysis | Registry, throttled discovery, seeded rolls, rotation transform, validity profiles (`dryLand`, `flat`, `altitude`, `depth`, `netherFloor`), collision heuristic, loaded-footprint rule, `structureManager.place`, the region-sharded registry state machine, one-time mobs, the deviation report, the `runJob` budget, and an 11-question **probe** (`strf-p006`). |
| Structures, contract | `L0-loot` | analysis | Two paths: the custom weighted table (Windmill, Airship) and vanilla tables applied through `/loot insert` (Warden City, Bastion). Fill-once is enforced by the `strf` registry. |
| Structures | `L0-wind` | analysis | Template and 25 chests. 3 spawners. 10 field guards. 1 % per chunk. The guaranteed spawn Windmill, with forced site preparation. The linked-Airship trigger. |
| Structures | `L0-airs` | analysis | 10 chests and 1 Vindicator spawner. Altitude profile. 2 % independent. A linked 40–100 ring search, with no dedupe and no widening. |
| Structures | `L0-wrdn` | analysis | A buried city with its top at Y −35…−45 and a surface sculk marker. 2 natural shriekers. 10 Ancient City chests. |
| Structures | `L0-bast` | analysis | Nether. Lava treasure room. 3 + 7 vanilla bastion chests. A one-time garrison. |

## How the parts relate
- **Weapons** couple only through `lgnd`. Its contract is now "shared resolver + per-weapon subscription" (`lgnd-ad07`), not the single dispatcher from `L0-adr-cast` §2. `L0-adr-wpn2` records that amendment.
- **Structures** couple only through `strf` + `loot`. The data flow for one instance is:
  1. `strf` discovery produces a roll.
  2. The validity profile runs, then collision, then the loaded check.
  3. `place` runs, and the record moves to `placed`.
  4. Body `afterPlace`/`afterInit` hooks run: `loot.fillChest` ×N, then `spawnGuards`, then (Windmill only) `airs.tryLinked`.
  5. The record reaches `done`.

  There are exactly two relocating searches (`strf-r002` §5): the spawn Windmill and the linked Airship. There is one body-to-body data link (`wind → airs`, `L0-adr-link`).
- **`infr`** owns the template compiler and the `bds` lanes. `strf` owns what those lanes measure. Test hooks are compiled only into the gametest pack, and exactly one pack owns `strf` in a world (`L0-adr-own`).
- **Between the families** at runtime, the touch points are:
  - One dynamic-property budget (`L0-xasm5`).
  - One script tick budget (C-5a/C-5b, plus the one-time spawn sweep from `L0-adr-spwn`).
  - The **gametest pack**, which will host both the Scythe's mob-targeting tests and `strf`. Structure guards are mobs the Scythe can target, so `strf` discovery must stay off during weapon tests (`L0-adr-own` §3).

## Central technical fact
The stable API has no chunk-generated event and no way to query structures. Generation is therefore script-driven on chunk discovery (`L0-adr-strc`), and the gap is recorded in the deviation report. Every structure decision is `proposed` until the `strf` probe on BDS 1.26.51.1 reports. The body children depend on these probe items:
- `wind` on 1, 2, 5, 6, 7, 11.
- `airs` on 1, 2, 7.
- `wrdn` on 1, 2, 3, 4.
- `bast` on 1, 2, 4, 5.

These dependencies are stated in `L0-adr-body`, because `wrdn` and `bast` did not state them themselves.

## Staging
Stage 3 (Scythe) is done. Next: the `strf` + `loot` probe, then Windmill with the spawn guarantee, then Airship (linked), then Warden City, then Bastion.

## Open at L0
- `L0-xcx6`: `wrdn` and `bast` restate the contract layer instead of referencing it, and `bast` points at phantom sibling ids. `L0-adr-body` supplies the binding crosswalk; a delta pass must edit the nodes.
- `L0-xcx7`: the `airs`, `wrdn` and `bast` ACs are not split into `bds` and `ipad` (C-9).
- `L0-xcx5`: spec version and earlier drafts. Unchanged.
- `L0-xq2`: densities. `L0-xq3`: weapon questions (off-hand, "last owner"). `L0-xq4`: spawn Windmill with no dry land.
- Closed in this reduce:
  - `L0-xcx4`, by `strf-p005` + `L0-adr-spwn`.
  - `strf-cx02` and `wind-cx01` (interim), by `L0-adr-spwn`.
  - `wind-cx02` and `airs-cx01`, by `L0-adr-link`.
  - `strf-cx01`, by `L0-adr-own`.
  - `lgnd-cx07..10` and `scyt-cx03..05`, ruled on in `L0-adr-wpn2`. `cx08`/`cx09` are partly escalated to `L0-xq3`.
- `L0-xcx3` and `L0-xq1` are already closed: Ready shows continuously for both weapons, and the code matches (`lgnd` component).
