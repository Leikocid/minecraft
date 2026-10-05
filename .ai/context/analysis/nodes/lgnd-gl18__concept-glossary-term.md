---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl18"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl18"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 690
tags: ["v6", "glossary", "hud"]
level: 2
---
**`hudKeys` / uniqueness flag**

- **`hudKeys`.** An optional `LegendaryDef` field that names the weapon's own Action Bar lang keys (`ready`, `cooldown`). They take the same arguments as the shared `andrew.legendary.ready|cooldown` (`%s: Ready` / `%s: %s s`). A def uses them when its spec asks for a different string shape: the Orbital Cannon, and the Katana with "Dragon Katana — Ready".
- **Uniqueness flag (craft flag).** The world dynamic property `andrew:<keyPrefix>_crafted`: `ws`, `sc`, `oc`, and `dk` for the Katana. It is set by the one legal Survival craft, and it persists across restarts. Only `/andrew:<cmd> reset` clears it.

**Synonyms:** Survival craft flag, `crafted` key.
