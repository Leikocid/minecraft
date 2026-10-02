---
type: "concept-rule"
node_id: "L0-orbc-r005"
source_channel: "rollout"
analysis_version: 5
title: "Rule · One shared 30 s cooldown, started on activation"
aliases: ["L0-orbc-r005"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1067
tags: ["is_a:rule", "relates_to:L0-lgnd", "cooldown", "C-17"]
level: 2
---
# Rule · One shared 30 s cooldown, started on activation

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-p001", "L0-orbc-ac16"]`

- LMB and RMB read and write **one** key, `cooldownKey("orbital_cannon")` = `andrew:cd_orbital_cannon`. Its length is `cooldownTicks 600` (30 s). The storage is `lgnd`'s `cooldown.ts`: an epoch-ms deadline in a player dynamic property. It is per player and shared by all of that player's copies (C-17, AC-17 is owned by `lgnd`).
- The cooldown is written in the activation tick, after the target is validated and **before** any charge moves (`xasm10`). It is not written on hit, detonation or when the charge lands.
- While the cooldown runs, both modes are blocked silently (`as06`).
- It is **never refunded or shortened** by any charge outcome: void, lost, unload, restart or timeout. It is also unaffected by the owner dying or leaving.
- Operators can clear it through `/andrew:orbital reset`, if `lgnd` commands expose it. Otherwise only time clears it.

Source: Orbital §6, §8, §11; C-17.
