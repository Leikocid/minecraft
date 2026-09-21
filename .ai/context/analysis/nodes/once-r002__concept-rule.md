---
type: "concept-rule"
node_id: "L0-once-r002"
source_channel: "rollout"
aliases: ["L0-once-r002"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1540
tags: ["rule","persistence","durability","C-6","C-7","L0-once"]
---

**R-002 — The craft flag survives logout, world save, server restart and player death.**

Source: §3 — *«Флаг успешного крафта должен сохраняться после выхода игроков, сохранения мира и рестарта сервера.»* · §11 — *«Persistent one-per-world state хранить в устойчивом world-level состоянии, доступном после рестартов.»* · §12 — *«Смерть во время cooldown не должна … сбрасывать persistent one-per-world flag.»*

Four survival events, each independently testable:

| Event | Requirement |
|---|---|
| Crafter logs out | Flag unaffected. Per-player storage therefore does not satisfy this |
| World save / autosave | Flag written durably, not held in memory only |
| Server restart | Flag readable on next boot. **Explicit §13 acceptance test** |
| Player death (incl. during cooldown) | Flag unaffected. §12 names this directly |

**Enforcement.** The flag is a world-scoped dynamic property (ADR-005), which gives the first three for free. The fourth is a **negative** requirement on a *sibling*: `L0-keep` handles death and respawn and must not write, clear or derive from this flag. The decomposition plan's ownership rule makes this explicit — `L0-once` owns the craft flag, `L0-keep` owns the item ledger, neither writes the other's state.

**Rationale.** C-6 makes durability a constraint; C-7 makes the consequence of losing it a duplication path. A flag lost on restart silently re-opens the world's craft budget, and no one notices until a second sword appears.

**Verified by:** `L0-once-accp3` (restart), `L0-once-accp6` (death).
