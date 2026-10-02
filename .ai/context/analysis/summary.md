---
title: Project Summary
type: analysis
generated_at: "2026-10-02T19:14:06.012Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 580
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v5: the UFO Magnet event fully analysed)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-infr", "L0-pick", "L0-lgnd", "L0-webs", "L0-scyt", "L0-orbc", "L0-pntr", "L0-ring", "L0-strf", "L0-loot", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast", "L0-ufoc", "L0-sauc", "L0-magn", "L0-adr-ufoi", "L0-adr-ufom", "L0-adr-ufpc", "L0-adr-ufnd", "L0-adr-ufht", "L0-adr-ufrs", "L0-adr-ufsd", "L0-ufoc-cx01", "L0-xcx15", "L0-xcx16", "L0-xcx17", "L0-xcx19", "L0-xcx20", "L0-xasm16", "L0-xasm17"]
requires: ["L0-adr-ufpc", "L0-adr-ufom"]
see_also: ["ufomagnetspecv1ruen-part-1", "ufomagnetspecv1ruen-part-2", "ufomagnetspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-3", "constraints"]
supersedes: ["L0@v4"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v5)

**What it is.**
- A Minecraft **Bedrock** add-on: one behavior pack and one resource pack, namespace `andrew:`, shipped as `dist/andrew.mcaddon`. The as-built version is **1.4.4**.
- It uses only the stable Script API: `@minecraft/server` 2.10.0 on BDS 1.26.51.1.
- It is played on an iPad and verified on a Mac mini.
  - The `bds` channel is BDS in Docker: production 19132, QA 19134, checks 19136.
  - The iPad is the only proof of what renders (`ipad` channel).

| Family | Members | State (2026-10-02) |
|---|---|---|
| Legendary weapons | Web Sword, Scythe of Calamity, Orbital Cannon | All shipped. The Cannon was tuned in v1.4.1–1.4.4. The v3 Orbital nodes are stale (`xcx16`). |
| World structures | Windmill, Warden City, Bastion, Airship | Shipped in v1.2.0. A scan-code reconcile is owed (`xcx12`). |
| **World events** | **UFO Magnet** | **All four nodes are now analysed** (`lgnd` v4 carried forward; `ufoc`, `sauc` and `magn` analysed in v5). Nothing is built yet: as read during reduce v5 there was no `src/ufo/`, only the probe branch `probe/ufo-magnet`. |

## The UFO Magnet as one system

```
lgnd (carried, v4) ── isLegendaryStack (ad13) · never-pulled r016 · death retention ac22
   ▲ predicate only; magn cites by id
   │
ufoc  the only clock and only state machine
  │ next_ms (epoch ms; 0 = in flight, adr-ufrs) + ufo_enabled  ← the only durable state (C-23)
  │ first arrival 10–20 min after first join; +15 min after any end or a restart; waits for an Overworld player
  │ centre frozen at arrival; hoverY = min(centre+40, ceiling−4)                         (adr-ufht)
  │ ONE runInterval: latch → advance → saucerStep → magnetStep → downed-end              (adr-ufpc, adr-ufsd)
  │ /andrew:ufo come|stop|enable|disable · arrival notice ≤150 blocks RU/EN · env seam (xasm13)
  │ restart sweep at worldLoad + entityLoad, keyed by eventId                            (xasm17)
  │
  ├─ onPhase / saucerStep ─→ sauc  andrew:ufo_saucer (snowball runtime id, 0×0 box, damage_sensor none, family andrew_ufo)
  │                                path 90 → hover → 90 opposite, legs at min(hoverY+10, ceiling−4); beam = bone + property
  │                                registerInterceptor(attack,…) on orbc flight → outcome "intercepted"   (adr-ufoi)
  │     ◄── requestMagnetOff("shot") [latched] + reportShotDown ──┘  fall ≤ 60 ticks, harmless blast, 8♦ + totem, broadcast
  │
  └─ onPhase / magnetStep ─→ magn  one zone scan at magnet-on (r 50, loaded chunks only) → ≤10 elements, nearest first
                                    containers give iron stacks; hopper is never a block (adr-ufnd); block → air + 1 item
                                    players: applyKnockback ≤0.6/tick to −6; elements: ring r 5 at −3, away from players
                                    reads saucerPosition() inside magnetStep; one-tick simultaneous release (magn-prel)
```

**How the children fit together.**
- **`ufoc` publishes exactly the contract `L0-adr-ufpc` fixed at v4.** The re-run consumes it as written: `onPhase`, `saucerStep`, `magnetStep`, the latched `requestMagnetOff`, an idempotent `reportShotDown`, and `saucerPosition()` read only inside `magnetStep`. No child needed a different signal, and `xcx20` (ufoc missing) is satisfied by this run.
- **The shoot-down is the one three-way flow.** Read in tick order across `sauc-p002`, `ufoc-p002` and `magn-prel`, it showed two seams no single child could see:
  - the release keyed on the current phase, which a shot has already moved to `downed`;
  - the end of `downed` came before the saucer's tick-60 step.

  `L0-adr-ufsd` fixes both and reconciles `ufoc-p002`/`ent2` in place.
- **The restart path is one chain.**
  - `ufoc-p003` removes everything tagged `andrew:ufo` or in the `andrew_ufo` family whose `andrew:ufo_event` is not live (`sauc-ent1` stamps it).
  - It strips `andrew:ufo_iron` from held entities. This is `magn`'s cleanup hook, and `magn` owns no subscription for it.
  - It rewrites the in-flight marker `next_ms = 0` to now + 15 min (`L0-adr-ufrs`, which resolves `ufoc-cx01`).
- **`lgnd` answers first.** `magn-rleg` calls `isLegendaryStack` at every call site. For the rules it cites `lgnd-ad13`, `lgnd-r016`, `lgnd-as15` and `lgnd-ac22` by id, and states "`lgnd` wins" where they differ.
  - Its holder check reads hand **and** armour slots, while `lgnd-r016` §3 names hand slots only. That is a harmless superset, because legendaries are not wearable.
- **`sauc` owns the only change to shipped `orbc`.** The interceptor is additive, and its gate is the full Orbital suite unchanged, plus the whole suite (`sauc-ac04`).
- **One budget.** `L0-xasm16` (≤ 2 ms mean per active tick) is shared by `saucerStep` and `magnetStep`. `ufoc`'s idle cost is one counter per tick plus one property read per 100 ticks (`ufoc-ac08`). No `runJob` is used and there is no second interval (C-5d).

## AC routing (UFO 1–18): checked, it holds

| UFO AC | Owner | `bds` | `ipad` (separate, reopened after every epic merge) |
|---|---|---|---|
| 1, 2 (timing), 3, 17, 18 | `ufoc` | `ac01`–`ac06`, `ac08`: GameTest on the scaled clock; `ac04` keeps real durations. Restart cases run as `bds-check` on 19136 (`ac03`, `ac05`) | `ac07` (the RU notice in chat) |
| 2 (path and look), 15, 16 | `sauc` | `ac01`–`ac05` | `ac06` (DoD visuals) |
| 4–12, 14 | `magn` | `a04`–`a14`, `atps` | `aipd`: smooth lift, visible cloud, visible fall. This satisfies `xcx19`. |
| 13 | `lgnd-ac21` (rule), `magn-a13` (call site) | `bds` + a `build` unit test | — |

The restart and real-time ACs are automated under the reading proposed in `xcx17`, which is still awaiting operator acceptance.

## Decided at this reduce (v5)
- **`L0-adr-ufrs`:** the in-flight marker is `next_ms = 0`. It amends `L0-adr-ufom` §4 and keeps C-23 literal. It resolves `ufoc-cx01` and accepts `ufoc-ad03`.
- **`L0-adr-ufsd`:** the shoot-down handshake. The release keys on `magnetOn`, and `downed` ends after `saucerStep` with a completion guarantee to `sauc`. New proof obligations go onto `sauc-ac03`.

## Open at L0 after v5
- **Satisfied by this run; formal closure is up to the operator's resolve:**
  - `xcx20` (`ufoc` re-run done);
  - `xcx19` (`magn-aipd`).
- **Still open:**
  - `xcx15`: the interceptor is designed, not built;
  - `xcx16`: the Orbital v1.4.4 reconcile;
  - `xcx17`: the restart and real-time automation reading;
  - `lgnd-cx09`/`cx11`/`cx12`, carried with `lgnd`;
  - carried: `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`.
- **Autopilot defaults the operator may overturn:**
  - `adr-ufnd` (hopper / dependant pops);
  - `magn-aslh` (legendary holders are skipped);
  - `adr-ufrs` (marker encoding; this one is internal only);
  - `xcx17`.

## Stage 6 order (unchanged)
1. `lgnd` v4 (`isLegendaryStack` and the `ufo:legendary_*` GameTests).
2. `ufoc` with a stub saucer; no longer blocked.
3. `sauc` with the `orbc` interceptor, the full Orbital re-run, and the `adr-ufsd` assertions.
4. `magn`.

After each merge, run the full suite, then reopen the auto-closed `ipad` criteria.


## Statistics

- **Total artifacts:** 1040
- **concept-aggregate:** 76 (195 KB)
- **concept-atomic:** 747 (680 KB)
- **concept-special:** 60 (85 KB)
- **raw:** 27 (107 KB)
- **decision:** 91 (60 KB)
- **other:** 39 (706 KB)

### By level

- L0: 14 artifacts
- L1: 61 artifacts
- L2: 789 artifacts
- L3: 6 artifacts


_Analysis version: 5_
