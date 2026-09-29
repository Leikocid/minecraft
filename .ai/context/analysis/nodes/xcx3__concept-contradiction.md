---
type: "concept-contradiction"
node_id: "L0-xcx3"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "CX-L0-03 · \\"Ready\\" on the Action Bar: once (Web Sword 0.3.0) vs while held (Scythe §6). Escalated."
aliases: ["L0-xcx3"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1431
tags: ["title:Ready display differs between weapon specs","escalated","reduce","resolved"]
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx3
---

---
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-lgnd-cx01", "L0-lgnd-p005", "L0-lgnd-r007", "L0-webs", "L0-scyt", "L0-scyt-r003", "L0-xq1", "L0-adr-cast"]
status: open
category: source-vs-source
target_node: null
---
# CX-L0-03 · "Ready" on the Action Bar: once (Web Sword 0.3.0) vs while held (Scythe §6). Escalated.

This re-states `L0-lgnd-cx01` at system level. It cannot be resolved inside the analysis because the two raw specs disagree, and the answer changes the behaviour of a weapon that has already shipped.

- **Web Sword** (`webswordspecv1ruen-part-1` §8, shipped `cooldown.ts`): only the remaining time is required. "Ready" is written once, when the cooldown expires. After that the bar is left free.
- **Scythe** (`scytheofcalamityspecv1ruen-part-1` §6): *«Когда готова: Ready / «Готово»»*, shown continuously while held, in either hand. It sits next to the common legendary rules.

**Cross-component effect.**
- Resolved by decision-resolve-l0-xcx3: continuous for both weapons; `readyMode` not built.
- A continuous Ready also competes with transient texts. That is why `L0-adr-cast` puts a hold into `hud.notify`, which the Scythe's no-target message relies on (`L0-scyt-r003`, CTR-017).

**Interim (autopilot, not blocking):** Resolved by decision-resolve-l0-xcx3: continuous for both weapons; `readyMode` not built.
