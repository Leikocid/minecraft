---
type: "concept-rule"
node_id: "L0-sclk-r009"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r009"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 622
tags: ["rule", "passive", "no-ability", "xcx24", "hud"]
level: 2
---
**R-sclk-009 · Passive legendary: no ability, no cooldown, no HUD (§1, §9, §10, `xcx24`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx24", "L0-lgnd"]`

- Def #5 has no ability block. It writes no cooldown or busy key, never claims a Use in `resolveActivation`, and never adds an Action Bar line.
- With the crossbow in one hand and the Katana, Cannon or Scythe in the other, the other weapon's Use and HUD behave as they do today.
- Holding the crossbow alone shows **no** "Ready" line.
- `sclk` adds no other framework hook. Any further need is a new L0 contradiction (plan, reduce §1).
