---
type: "concept-rule"
node_id: "L0-sclk-r002"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r002"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1146
tags: ["rule", "C-28", "damage", "true-damage", "T06", "T07", "T08", "T17"]
level: 2
---
**R-sclk-002 · Fixed Sonic Boom damage (C-28)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm23", "L0-xcx22", "L0-adr-scdm", "L0-scyt", "L0-sclk-p004"]`

- `SONIC_BOOM_DAMAGE = 10` (HP). It is exported from one module (`src/sculk/constants.ts`) and read by the GameTests (`xasm23`; the probe's Q8 may replace the value, never the shape).
- Every living direct hit takes **exactly D** from absorption, then health, or kills the target if hp ≤ D. This holds:
  - at any difficulty (T07);
  - with any armour, Protection level or raised shield (T08) — which holds only because the cause is `sonicBoom`;
  - inside the hurt-invulnerability window (T17, `xcx22`).
- The mechanism is `sonicBoom`-cause `applyDamage` (exact through armour, Protection and a raised shield, absorption first), plus `setCurrentValue(hp − D)` only inside a known window. If hp ≤ D, it is an overkill `applyDamage(hp + 100)` with the same cause. The shipped Scythe pattern it descends from spans `volley.ts:115-133`.
- `damagingEntity` is the bolt's owner while the owner is valid, so the kill credit and the death message name the shooter.
- No vanilla arrow damage, no Power bonus, no crit bonus and no tipped effect is ever added (§9, §14).
- A totem of undying still works, because the lethal path goes through `applyDamage` with cause `sonicBoom`; an `entityAttack` overkill is stopped by a raised shield instead.
