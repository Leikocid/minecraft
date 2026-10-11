---
type: "concept-boundary"
node_id: "L0"
source_channel: "rollout"
analysis_version: 9
title: "System Boundaries (v9)"
aliases: ["L0"]
is_a: ["boundary"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 2016
tags: ["v9","above-water-trident","resolved"]
level: 0
closed_at: 2026-10-11
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0
---

---
title: "System Boundaries"
aliases: ["L0-boundary", "Boundaries"]
is_a: ["boundary"]
part_of: ["L0"]
relates_to: ["L0", "L0-trdt", "L0-lgnd"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2", "constraints"]
---
# System Boundaries (v9)

## In scope
- **One BP and one RP**, namespace `andrew:`. There are seven legendaries, two vanilla recipes, four structures, the UFO event and the magnet. Everything is server-authoritative in the stable Script API 2.10.0.
- **v9: the Above-Water Trident** (`L0-trdt`). It covers:
  - the item, the recipe with bucket return, and def #7;
  - melee and thrown damage, the +2 bonus, and the strike visual;
  - the dash and the one-shot fall cancel;
  - the underwater speed;
  - throw, flight, return, and the custody ledger;
  - the Loyalty/Riptide ban;
  - RU/EN lang, the RP icon, and the in-flight model.
- **The `lgnd` seam for an item in flight** (`xcx30`). This covers only what custody needs. The other `lgnd` rules are cited, not changed.
- **Verification:** BDS GameTests on checks (19136), plus the iPad acceptance sheet.

## Out of scope
- **Experiments, beta APIs, and client-side scripts.** Stable only (C-2).
- **Vanilla trident behaviour.** The vanilla `minecraft:trident`, its Loyalty/Riptide/Channeling, and drowned drops are untouched. The recipe consumes a vanilla trident and nothing else.
- **A Riptide spin animation or player pose.** No stable API drives it. Reported as a limitation (C-16).
- **Weather.** No rain or thunder is created.
- **Real lightning side effects** (fire, mob conversion, creeper charge) unless Andrey asks for them (`xq10`).
- **New HUD lines and cooldown timers.** The spec forbids a cooldown, so def #7 is a passive def like `sk`.
- **Changes to other weapons.** Changing `strm`/`katn` files to share code is in scope only as a refactor that keeps their scenarios green.
- **Carried out-of-scope items:** the structure reconcile (`xcx12`) and the Orbital reconcile, both queued separately.
