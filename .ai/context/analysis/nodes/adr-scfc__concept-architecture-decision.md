---
type: "concept-architecture-decision"
node_id: "L0-adr-scfc"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-scfc · Full-charge gate (status: accepted, probe-gated; resolves `L0-sclk-cx02`)"
aliases: ["L0-adr-scfc"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 2163
tags: ["v7", "sculk-crossbow", "status:accepted", "probe-gated", "resolves:L0-sclk-cx02", "amends:L0-adr-scbs", "reduce"]
---
---
title: "ADR-L0-scfc · Full charge is the crossbow's fire-rate gate; a failed gate falls back to option B and re-opens `lgnd` identity"
aliases: ["L0-adr-scfc", "Crossbow full-charge gate"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-adr-scbs", "L0-sclk-cx02", "L0-sclk-r006", "L0-sclk-as05", "L0-sclk-p001", "L0-sclk-ac18", "L0-xasm27", "L0-xq7"]
requires: ["L0-adr-scbs"]
governs_files: ["src/sculk/", "packs/behavior/items/sculk_crossbow.json"]
---
# ADR-L0-scfc · Full-charge gate (status: accepted, probe-gated; resolves `L0-sclk-cx02`)

**Context.** Spec §9 makes the standard crossbow reload (with Quick Charge) the weapon's only limiter: there is no cooldown. Option A of `adr-scbs` is a custom `minecraft:shooter`, which may release like a bow at any draw. Damage is fixed (C-28) and every block hit carves a full crater, so a tap-release would multiply both the DPS and the terrain edits.

**Decision.**
- Under option A, a bolt is spawned **only** for a release at or past the Quick-Charge-adjusted full-charge time (`sclk-r006`, `as05`). An early projectile is removed with no bolt, and the ammunition stays spent.
- Probe **Q5** (release at 1/5/10/20/25 ticks) is now gate (4) of `adr-scbs`, edited in place at reduce. If `charge_on_draw` / `max_draw_duration` already blocks an early release natively, the scripted check stays as a guard, and its test still runs.
- If neither the native nor the scripted gate holds reliably on BDS **and** the iPad, `adr-scbs` falls to **option B**.

**Why this is cross-component.** Option B is not a `sclk`-local change. It makes legendary identity mark-based across `lgnd` (`isLegendaryStack`, `defForStack`, the craft gate, retention) and `magn` (`hasitem` holder tags cannot read a mark). It also moves **T18** (durability) from `sclk` to `lgnd`, which has to keep a vanilla crossbow repaired. A Q1 or Q5 failure therefore needs a new L0 decision before any build task. This ADR does not pre-approve that rewrite.

**T18 routing (plan invariant).** Option A: T18 is in `sclk` (`sclk-ac18`: the item JSON has no `minecraft:durability`). Option B: T18 is in `lgnd`.
