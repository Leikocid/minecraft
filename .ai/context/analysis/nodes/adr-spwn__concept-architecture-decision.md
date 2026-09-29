---
type: "concept-architecture-decision"
node_id: "L0-adr-spwn"
source_channel: "rollout"
analysis_version: 2
title: "ADR-L0-spwn · C-5 becomes C-5a/b/c. The spawn Windmill gets one bounded tickingarea sweep. \"No dry land\" fails softly."
aliases: ["L0-adr-spwn"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2874
tags: ["title:ADR-L0 one-time bounded tickingarea sweep for the spawn Windmill; C-5 split", "reduce", "cross-component", "status:accepted", "resolves:L0-strf-cx02", "resolves:L0-xcx4", "interim:L0-wind-cx01", "relates_to:L0-strf", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-infr", "relates_to:L0-strf-cx02", "relates_to:L0-wind-cx01", "relates_to:L0-xcx4", "relates_to:L0-strf-p005", "relates_to:L0-strf-p006", "relates_to:L0-wind-ad01", "relates_to:L0-wind-p002", "relates_to:L0-xq4", "relates_to:L0-adr-link"]
level: 2
---
# ADR-L0-spwn · C-5 becomes C-5a/b/c. The spawn Windmill gets one bounded tickingarea sweep. "No dry land" fails softly.

**Links:** `is_a: ["architecture-decision"]` · `relates_to: ["L0-strf", "L0-wind", "L0-airs", "L0-infr", "L0-strf-cx02", "L0-wind-cx01", "L0-xcx4"]` · **status:** accepted, pending probe item 11

**Context.**
- `L0-xcx4` (C-5 vs a permanent discovery loop). The plan closes it through `strf`'s tick budget. `strf-p005` delivers that: a throttled ≥20-tick player-position pass, with all heavy work in `runJob` under per-tick caps.
- `L0-strf-cx02`. §4.7 wants the *nearest* valid site within 500 blocks at first start. But C-5b and C-12 only allow chunks that players have loaded.
- `L0-wind-cx01`. There may be no dry site at all.

`wind-ad01` already chose temporary ticking areas. `strf-cx02` recommends option (a) with a 60 s cap and (b) as the fallback. The two children agree, so L0 makes it a constraint change.

**Decision.**
1. **The constraint text becomes:**
   - **C-5a** (weapons): short-lived loops only while temporary objects exist. Unchanged.
   - **C-5b** (structures): one shared, throttled (≥20 ticks) player-position → chunk discovery pass. Heavy work goes through `runJob` with per-tick caps.
   - **C-5c** (new, one-time): once per world, `wind` may run a bounded sweep for the spawn Windmill.
     - It loads rings of chunks outward from spawn with `/tickingarea add` through `runCommand`.
     - At most 10 areas are active at once (the engine cap). They are removed afterwards and prefixed `andrew_ws_*`.
     - Wall-clock cap: 60 s.
     - On timeout, it falls back to the best site in the chunks already evaluated: the same order as §4.7, forced preparation included.
     - Every chunk it touches is still evaluated only while loaded (C-12 holds).
2. **Deviation-report rows:** the sweep itself, and whether the result came from the full ring or from the fallback (`stage` in `andrew:st:spawn`).
3. **No dry site anywhere in the swept area** (`wind-cx01`). Option (a), decided by `L0-xq4` (2026-09-26): `status "failed", reason "no-dry-land"`, create no spawn Windmill, and log a deviation. This keeps "dry land" and "never damage structures". Test 14 runs on normal seeds, so this does not block the build.
4. The spawn Windmill's linked-Airship attempt runs while the sweep's areas still cover its ring (`L0-adr-link` §4).
5. **Tests.** `infr` asserts the following on a fresh world (`wind-ac01`):
   - no `andrew_ws_*` ticking area remains;
   - the sweep finishes within 60 s plus one place.

**If probe item 11 fails** (ticking areas do not load distant chunks through `runCommand`): only the fallback in §1 remains. That is the 9×9 area loaded around spawn plus forced preparation, recorded as a deviation.

**Closes:** `L0-xcx4` and `L0-strf-cx02`. `L0-wind-cx01` is closed by `L0-xq4`.
