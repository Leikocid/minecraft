---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac09"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1024
tags: ["acceptance-criterion", "katana", "channel:ipad", "manual", "is_a:acceptance-criterion"]
level: 2
---
---
title: "AC-katn-09 (ipad, manual): what only the operator can see"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r007", "L0-katn-r008", "L0-katn-ent1", "L0-katn-as02", "L0-xasm21"]
---
On the iPad, on the production server, the operator confirms:
1. **Icon.** The Katana icon reads as a katana in the hotbar and in the inventory.
2. **Creative.** It is found under Equipment → swords and by searching "Katana" / "Катана".
3. **HUD.** Holding it shows "Dragon Katana — Ready", or "Катана дракона — Готово" in Russian. After a use, the HUD counts down whole seconds from 30.
4. **Trail.** A pink petal trail runs visibly from A to B and fades within about 1.5 s. A second player nearby sees it too.
5. **Aim.** Tapping on air and tapping on a block both teleport toward the screen centre (view direction), and this feels right (`L0-katn-as02`).
6. **Escape.** The answer on a Web Sword trap and UFO magnet escape (`L0-xasm21`) is recorded.

The orchestrator must not auto-verify this criterion.
