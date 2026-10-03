---
type: "concept-rule"
node_id: "L0-katn-r008"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r008"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1037
tags: ["rule", "katana", "hud", "localization", "is_a:rule", "relates_to:L0-lgnd-p005"]
level: 2
---
---
title: "R-katn-008: HUD and localization strings"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p005", "L0-katn-ent1"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.** The shared HUD pass (`L0-lgnd-p005`) renders the Katana through the def's `hudKeys`, the field the Orbital Cannon already uses. No framework code changes.

| Key | en_US | ru_RU |
|---|---|---|
| `item.andrew:dragon_katana.name` | Dragon Katana | Катана дракона |
| `andrew.katana.hud_ready` | `%s — Ready` | `%s — Готово` |
| `andrew.katana.hud_cooldown` | `%s — %s s` | `%s — %s с` |

- Ready reads exactly "Dragon Katana — Ready" / "Катана дракона — Готово" (§10). The shared `%s: Ready` would not match.
- `hudKeys` takes both keys (`registry.ts:34`), so the Katana carries its own cooldown line too, in the same em-dash shape. The Orbital Cannon set the precedent (`andrew.orbital.hud_cooldown`). Key names: `L0-lgnd-ad14` (reconciled at reduce v6).
- During cooldown the HUD shows the whole seconds left, rounded up.
- Both lang files also carry the `andrew.katana.*` texts that `lgnd` needs: first_craft, craft_blocked, returned, admin_given, reset.
- Creative inventory: Equipment → swords group, and found by search; `/give @s andrew:dragon_katana` works.

Source: Katana §10.
