---
type: "concept-contradiction"
node_id: "L0-lgnd-cx14"
source_channel: "rollout"
analysis_version: 7
title: "CX-lgnd-14: A legendary held by an armour stand that falls into the Void is lost"
aliases: ["L0-lgnd-cx14"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 1601
tags: ["v6","category:source-vs-code","severity:low","status:resolved","resolved_by:L0-adr-ktgr","target:L0-lgnd","resolved"]
level: 2
closed_at: 2026-10-03
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx14
---

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad12", "L0-lgnd-r016", "L0-lgnd-as15", "L0-xcx11", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1"]
---
# CX-lgnd-14: A legendary held by an armour stand that falls into the Void is lost

**Sources.** Katana §3 (and the same rule in the Orbital, Scythe and Web Sword specs): "При падении в Void Катана должна вернуться последнему владельцу" ("If it falls into the Void, the Katana must return to its last owner").

**Code (1.4.4).**
- `VOID_HOLDER_TYPES` covers `chest_minecart` and `hopper_minecart` only (`recovery.ts:135`).
- An armour stand's hand slots cannot be read from a script on 2.10.0 (`README.md:71`, `probe_ufo_holder_void`).
- The engine removes it below the floor with no death and no spill, so the legendary it holds is gone and nothing is returned.

**Exposure.**
- Nothing in the add-on moves an armour stand: the magnet skips holders that carry a legendary (`r016`).
- Reaching this case takes a deliberate player setup: an armour stand pushed or placed over the Void, or the stand on a minecart.

**Options (not self-resolved).**
- (a) Accept it as a C-16 deviation and document it. This is the autopilot default.
- (b) Probe `/replaceitem`- or `hasitem`-based reads of armour-stand hands (memory: mob armour is readable only via `hasitem`). If `hasitem slot.weapon.mainhand` can detect a legendary *type*, a mark cannot be read anyway, so the return would have to re-issue the ledger's last known instance.

Filed so the operator confirms that it binds the Katana too.

**Resolved at reduce v6** by `L0-adr-ktgr` §3: option (a), a documented C-16 deviation binding all four legendaries. The Katana adds no exposure. Option (b) stays a backlog probe. Operator confirmation is collected via `L0-xq6`.
