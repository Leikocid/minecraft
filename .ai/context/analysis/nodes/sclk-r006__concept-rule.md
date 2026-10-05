---
type: "concept-rule"
node_id: "L0-sclk-r006"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r006"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 999
tags: ["rule", "ammunition", "charge", "reload", "xasm27"]
level: 2
---
**R-sclk-006 · Ammunition and charge (§9, `xasm27`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm27", "L0-sclk-cx02", "L0-sclk-ad01", "L0-sclk-p002"]`

- **Ammunition:** `minecraft:arrow` in every variant (plain, tipped, spectral). No firework rockets. Tipped and spectral effects are discarded.
- **Consumption:** as the engine spends it. In Survival, one arrow per shot, Multishot included. In Creative, none.
- **The reload is the only limiter** (§9: no cooldown).
  - A shot is charged if its **loading draw** lasted ≥ 25 − 5·QC ticks. Speed cannot tell: every fired arrow leaves at full speed (2.965–3.041 measured), so there is no under-charged arrow to detect.
  - Quick Charge does **not** natively shorten the time to full charge; shortening it is script work (`as05`).
  - An under-length release fires nothing and spends nothing — the native gate admits no early shot (`cx02`).
- **Bolts are never picked up.** They are removed on their outcome or on expiry.
- **Lifetime:** `BOLT_LIFETIME_TICKS = 100`.
