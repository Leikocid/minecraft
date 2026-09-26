---
type: "concept-architecture-decision"
node_id: "L0-adr-body"
source_channel: "rollout"
analysis_version: 2
title: "ADR-L0-body · Structure bodies consume `strf`/`loot` by id; binding crosswalk and probe dependencies"
aliases: ["L0-adr-body"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2790
tags: ["title:ADR-L0 body-to-contract crosswalk and probe dependencies", "reduce", "cross-component", "status:accepted", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-xcx6", "relates_to:L0-strf-p006", "relates_to:L0-adr-strc", "relates_to:L0-adr-strs"]
level: 2
---
# ADR-L0-body · Structure bodies consume `strf`/`loot` by id; binding crosswalk and probe dependencies

**Links:** `is_a: ["architecture-decision"]` · `relates_to: ["L0-strf", "L0-loot", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast", "L0-xcx6"]` · `requires: ["L0-strf", "L0-loot"]` · **status:** accepted

**Context.** `L0-xcx6`: `wrdn` and `bast` restate the contract layer. Until they are re-run, implementers need one reading.

**Decision 1: precedence.** Where a body node and a `strf`/`loot` node describe the same behaviour, the contract node wins. A body may add only:
- its `StructureDef` values;
- template content;
- its own hooks;
- the two allowed overrides: spawn Windmill relocation with forced preparation (`wind`), and the 40–100 linked ring (`airs`).

**Decision 2: crosswalk.**

| Body clause | Governing contract |
|---|---|
| `wrdn-rul1`, `bast-r001`, `bast-p001` (5 % roll, cancel, no relocation) | `strf-r001`, `strf-r002` (with `pending` deferral §2), `strf-p001` |
| Warden City top Y −35…−45, "surface must be land" | `strf-p002` `dryLand` (0 % liquid, centre + 8-point ring) + `depth` profile (top Y seeded in [−45, −35], bedrock-band reject) |
| Bastion "not lava ocean / solid support" | `strf` `netherFloor` profile; thresholds in `L0-xasm4` §3 |
| "Intersects any detected structure" | `strf-r006`; definitions in `L0-xasm3` |
| Rotation 0/90/180/270 (both) | `strf-r004`. The Warden City marker and the monument are template-local points rotated by the same transform. |
| `wrdn-rul7`, `bast-r006`, `bast-as03`, `bast-p002` step 1/5 (idempotent init) | `strf-r008`, `strf-p004`, `L0-adr-strs`. `bast-as03`'s own marker is **void**. |
| Garrison persistent, never replenished | `strf-r009`, `L0-adr-strs` |
| Vanilla chest tables, fill once | `loot-p002`, `loot-r006`, `loot-r007` |
| `bast-ad01`, `wrdn-ad02` (script-driven placement) | Superseded by `L0-adr-strc`. Placement is by player-position discovery, **not** chunk-load events. `L0-xcx4` is closed. |
| Body-local extras (`bast` gold blocks, Brute positions; `wrdn` surface marker) | Stay owned by the bodies as `afterPlace`/`spawnGuards` hooks (`strf` component, "Not owned") |

`bast`'s `L0-mill` and `L0-arsh` read as `L0-wind` and `L0-airs`.

**Decision 3: probe dependencies** (items of `strf-p006`). No body starts implementation until its items are PASS or have a chosen fallback.

| Body | Items |
|---|---|
| `wind` | 1 spawner/chest entities, 2 rotation, 5 persistence, 6 sun immunity + cure, 7 place cost, 11 tickingarea |
| `airs` | 1, 2, 7 |
| `wrdn` | 1, 2, 3 `can_summon`, 4 `/loot insert ancient_city` |
| `bast` | 1, 2, 4 bastion tables, 5 persistence |
| `loot` | 4 |
| all | 8 DP budget, 9 loaded detection (via `strf`) |

**Consequence.** Re-run `wrdn` and `bast` in delta mode against this table. After that, `L0-xcx6` closes.
