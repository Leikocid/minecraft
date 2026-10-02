---
type: "concept-rule"
node_id: "L0-lgnd-r007"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-r007"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 975
tags: ["rule", "hud", "C-9", "C-4"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p005", "L0-lgnd-cx01", "L0-sitm"]
---
**R-lgnd-007: One HUD, holders only, both hands, translate keys only.**

Source: Scythe §6 (*«в основной или второй руке показывать состояние … Ready / remaining time»*); Web Sword §8; C-9; ADR-021 (a single actionbar HUD).

- Exactly one module writes the Action Bar for legendaries. `L0-stgt`/`L0-sprj` supply state through `setBusy`/`start` and never call `setActionBar`.
- The bar is written only for players holding a legendary in either hand. Everyone else's bar is untouched, not even cleared.
- Order is main hand first, then off hand. Remaining time is shown in whole seconds, rounded up, and never 0 while cooling.
- All text is rawtext `translate`. The keys are owned by `L0-sitm` (Scythe) and the shipped lang files (Web Sword).
- This is the add-on's only standing interval (10 ticks). The loss watcher (`L0-lgnd-ad03`) and volley loops (ADR-025) are transient.
