---
type: "concept-rule"
node_id: "L0-once-r003"
source_channel: "rollout"
aliases: ["L0-once-r003"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1643
tags: ["rule","creative","give","exemption","L0-once"]
---

**R-003 — Creative crafting and `/give` neither spend nor restore the craft budget.**

Source: §3 — *«Creative и /give предназначены для тестирования/администрирования и НЕ расходуют право на единственный survival-крафт.»* · §4 — *«Creative/test copies могут существовать у администратора; one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

The exemption is **symmetric and total**:

- A Creative craft before the first survival craft leaves the budget fully available.
- A Creative craft after it does **not** clear the gate.
- `/give` produces no craft event at all and is therefore exempt by construction.
- No announcement is broadcast on either path — the reveal belongs to the survival craft alone.
- There is **no cap** on the number of admin/test copies that may exist. §4 permits them without limit.

**Discrimination point.** Survival-vs-Creative is decided by reading the crafting player's game mode **at craft time**, server-side (C-3). It is not inferred from the item, the recipe or the inventory.

**Non-Creative, non-Survival modes.** Adventure-mode players can craft. The spec is silent. Assumed default: **Adventure spends the budget** (it is a play mode, not an admin mode); Spectator cannot craft and is moot. Recorded as ASM-013, raised as an open question. Do not treat this default as settled.

**Rationale.** Without this exemption, testing the weapon would consume the world's only craft, making the feature untestable on a live world. It is also the rule that makes swords indistinguishable by provenance — the root of CTR-005, which `L0-keep` owns.

**Verified by:** `L0-once-accp4`.
