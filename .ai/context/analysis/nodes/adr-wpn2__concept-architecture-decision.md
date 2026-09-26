---
type: "concept-architecture-decision"
node_id: "L0-adr-wpn2"
source_channel: "rollout"
analysis_version: 2
title: "ADR-L0-wpn2 · v2 rulings on the weapons' spec-vs-code drift"
aliases: ["L0-adr-wpn2"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 4092
tags: ["title:ADR-L0 v2 rulings on weapon spec-vs-code drift", "reduce", "cross-component", "status:accepted", "resolves:L0-lgnd-cx07", "resolves:L0-lgnd-cx08", "resolves:L0-lgnd-cx10", "resolves:L0-scyt-cx03", "resolves:L0-scyt-cx04", "resolves:L0-scyt-cx05", "partial:L0-lgnd-cx09", "amends:L0-adr-cast", "amends:L0-adr-scyt", "amends:L0-adr-scope", "relates_to:L0-lgnd", "relates_to:L0-webs", "relates_to:L0-scyt", "relates_to:L0-sitm", "relates_to:L0-sprj", "relates_to:L0-infr", "relates_to:L0-lgnd-ad07", "relates_to:L0-lgnd-cx07", "relates_to:L0-lgnd-cx08", "relates_to:L0-lgnd-cx09", "relates_to:L0-lgnd-cx10", "relates_to:L0-scyt-cx03", "relates_to:L0-scyt-cx04", "relates_to:L0-scyt-cx05", "relates_to:L0-adr-cast", "relates_to:L0-adr-scyt", "relates_to:L0-adr-scope", "relates_to:L0-adr-lgnd", "relates_to:L0-xq3"]
level: 2
---
# ADR-L0-wpn2 · v2 rulings on the weapons' spec-vs-code drift

**Links:** `is_a: ["architecture-decision"]` · `relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-sitm", "L0-sprj", "L0-lgnd-ad07", "L0-adr-cast", "L0-adr-scyt", "L0-adr-scope", "L0-xq3"]` · **status:** accepted

**Context.** The reconcile passes on `lgnd` and `scyt` found that shipped code (`302fba4`) departs from accepted L0 decisions. Each item below touches more than one weapon or an L0 ADR, so the call is made here.

| Item | Ruling | Why at L0 |
|---|---|---|
| `L0-adr-cast` §2 (a single dispatcher) vs `lgnd-ad07` | **Amend `adr-cast`** to the as-built shape. Each weapon subscribes to `itemUse`/`playerInteractWithBlock` itself and acts only when `resolveActivation(player)?.def` is its own. The *decision* has one owner (`hands.ts`). `lgnd-r001`'s "may not subscribe" clause is retired. | Covers both weapons, and `adr-cast` is an L0 ADR. |
| `lgnd-cx07` (orphaned `ws_cooldown_until`) | **(a) Accept.** At most one 30 s cooldown is lost, once per player. Rewrite `lgnd-ac01` without the cooldown clause. | It is a Web Sword upgrade effect of the framework. |
| `lgnd-cx08` + `scyt-cx03` (no `allow_off_hand`) | **Fix the items.** Add `minecraft:allow_off_hand: true` to both item JSONs. The operator decisions (decision-legendary-hand-priority, decision-resolve-cool-ctr3) already require hand priority now. Verify on the iPad, which is the only channel that proves a real client can put the item in the off hand. A GameTest `setEquipment(Offhand)` pass does **not** count (`lgnd-cx08`). | Both weapons plus a shared AC set (`lgnd-ac04..06`, `scyt-ac16`). |
| `scyt-cx03` (hoe identity) | **Keep as built if Use does not till.** A `bds` check with the Scythe on a grass block must leave the grass untilled. If it passes, amend `sitm-adr2`/`sitm-asm3` and AC-15 to the hoe group and tags. If it fails, remove `is_hoe`/`is_tool` and `minecraft:digger`. | `sitm` is a stale sub-scope (see below). |
| `lgnd-cx10` (retention) | **(b) Accept** one marked copy per weapon, **plus** read the off-hand slot in `retain`. The off-hand read is mandatory once the fix above ships; otherwise an off-hand legendary drops and goes through loss return. Narrow `lgnd-ac07` to that. | It is a consequence of the `cx08` fix. |
| `lgnd-cx09` (loss return) | **Split.** (1) **Add the generation guard** (`lgnd-ad02`): a loss return bumps `gen`, and a copy with an old `gen` cannot cast and is deleted on its first `playerInventoryItemChange`. C-7 is hard, and the undetected-pickup window is a real duplicate, not a stale copy. This agrees with `L0-adr-lgnd`'s `cx02` ruling, which assumed a guard exists. (2) Turn `_owed` into a list per owner. (3) The return **target** (crafter vs last holder) goes to the client in `L0-xq3`. In the meantime, keep the as-built owner. (4) The online-inventory scan is event-scoped and bounded, so it is accepted under C-5a. | C-7 is a system constraint, and the reading of the spec text is the client's. |
| `scyt-cx04` (stale `L0-sprj`) | **Retire `L0-sprj` and `L0-sitm` into `L0-scyt`.** The code-updated `scyt-*` rules and ADRs (`ad04`–`ad06`) are authoritative. `sprj-*`/`sitm-*` are historical, and nobody implements against them. This amends `L0-adr-scope` §3, and `scyt-cx01` (graph hygiene) closes with it. | `adr-scope` is an L0 ADR. |
| `scyt-cx05` (tuning) | **Amend `L0-adr-scyt` §1** to the shipped values: 0.8 blocks/tick with pure pursuit, a 10-tick stagger (decision-scythe-projectiles), hit radius 1.0 and a 200-tick lifetime. They are kept as separate named exports in `src/scythe/volley-rules.ts`, which the GameTests already read. No `SCYTHE_TUNING` object is required. | It is an L0 ADR against shipped code. |

**Backlog produced** (Stage-3 follow-up epic, before structures start):
- `allow_off_hand` ×2;
- the Scythe till check;
- the off-hand read in retention;
- `gen` plus the `_owed` list;
- AC rewrites: `lgnd-ac01`, `ac07`, `ac08`, `ac10`, and the Scythe's AC-15.

After the epic merges, reopen the iPad criteria (memory "Orchestrator auto-verifies manual criteria").
