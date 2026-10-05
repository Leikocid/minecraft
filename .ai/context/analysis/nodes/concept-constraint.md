---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 7
level: 0
title: "Global Constraints (v7)"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 2741
tags: ["v7", "sculk-crossbow"]
---
---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-sclk", "L0-adr-scdm", "L0-adr-sctr"]
see_also: ["constraints", "sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen-part-4"]
supersedes: ["L0-constraint@v6"]
---
# Global Constraints (v7)

**Carried unchanged:** C-1 … C-25, C-5a′, C-5d, C-5e, C-7″, C-12′, C-20″. All of them bind the crossbow. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. The craft gate, protection and the deny list come from `lgnd` and `orbc`.
- C-12: never write into unloaded chunks.
- C-15: the priority order; crossbow §14 restates it for this weapon.
- C-16: the closest stable equivalent, documented.
- C-22: filter out `undefined` players.
- C-23: in-flight state is not persisted.

v7 adds:

| ID | Constraint | Source |
|---|---|---|
| C-26 | *(new)* **One projectile, one outcome, decided by the server.** Each bolt is tracked separately (a Multishot volley is three records) and resolves **at most once**, to exactly one of: an entity hit (fixed damage to the struck entity only, plus a patch), a block hit (crater plus sculk), or expiry/unload (nothing). Vanilla projectile damage is never applied on top of the fixed damage, and no other entity is ever damaged by a bolt, a crater or a patch. | §5, §6, §9, §11, §14 |
| C-27 | *(new)* **Terrain edits by a weapon are bounded, protected and permanent.** A crossbow bolt edits only cells inside its own box: crater ≤ 5×5 footprint × 3 deep, sculk ≤ 5×5 around the impact. Before any edit, `protectLegendariesIn` runs on that box. The Survival-unbreakable deny list is never edited. Cells in unloaded chunks or outside the height range are skipped. The edits are ordinary world changes: synced to every client, saved, never rolled back. | §6, §7, §11, §14; C-12 |
| C-5f | *(new)* **Visuals of a flying projectile are bounded.** Boom particles are emitted only while a bolt is alive, at a fixed small count per bolt per tick, from the shared interval. A bolt has a lifetime cap. There are no lingering effect entities. With no bolts in flight, the cost is zero. | §4, §11 |
| C-28 | *(new)* **Fixed damage is fixed.** The crossbow's hit damage is one constant: the same at every difficulty and whatever the armour, Protection, the shield or the hurt-invulnerability window. Kill credit, the death message and totems still work (the true-damage pattern from `decision-scythe-true-damage`). Holds with cause `sonicBoom` and a write only inside the window (diagnose-CNTR-X22); with any other cause the shield clause fails. | §5, §8, §9; T06–T08, T17 |
| C-20‴ | *(extended)* Crossbow acceptance uses ≥ 2 players: a SimulatedPlayer target for T08 (armour and shield) and T17 (three hits), and a bystander for T09 and T12. | §12 |
