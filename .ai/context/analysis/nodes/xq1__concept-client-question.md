---
type: "concept-client-question"
node_id: "L0-xq1"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "Q-L0-1 · Should \"Ready / Готово\" stay on the Action Bar while a legendary weapon is held, for both weapons?"
aliases: ["L0-xq1"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1044
tags: ["title:Should Ready show continuously for both weapons", "SHOULD_ASK", "non-blocking", "reduce"]
---
---
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx3", "L0-lgnd-cx01", "L0-lgnd-p005", "L0-webs", "L0-scyt"]
---
# Q-L0-1 · Should "Ready / Готово" stay on the Action Bar while a legendary weapon is held, for both weapons?

**Context.** Answered 2026-09-24: option (a), decision-legendary-ready-hud. The Scythe spec asks for «Готово» to stay visible the whole time the Scythe is held. Both weapons share one Action Bar display.

**Options.**
- **(a)** Both weapons show Ready continuously while held. This is consistent, but the Web Sword changes from 0.3.0. *Accepted.*
- **(b)** Only the Scythe does. The Web Sword stays as it is.
- **(c)** Neither does. The Scythe then drops the continuous Ready from its spec.

**Blocking?** No. Implemented as (a) in `src/legendary/hud.ts`; there is no `readyMode`.

**Why it is promoted to L0.** The answer affects both weapons and the shared HUD. It is not a question about one component.
