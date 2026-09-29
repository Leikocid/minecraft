---
type: "concept-architecture-decision"
node_id: "L0-adr-lgnd"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "ADR-L0-lgnd · L0 rulings on the framework's open contradictions"
aliases: ["L0-adr-lgnd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 2648
tags: ["title:ADR-L0 framework rulings on lgnd contradictions", "reduce", "cross-component"]
---
---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-sprj", "L0-infr", "L0-lgnd-cx02", "L0-lgnd-cx03", "L0-lgnd-cx04", "L0-lgnd-cx06", "L0-lgnd-ad02", "L0-lgnd-ad03", "L0-lgnd-ad06", "L0-lgnd-ac11", "L0-lgnd-as03", "L0-xasm1", "cool-ctr1"]
status: accepted
---
# ADR-L0-lgnd · L0 rulings on the framework's open contradictions

These contradictions were filed inside `L0-lgnd`. Each one needs an L0 reading because it changes a global constraint, a global assumption or a shipped weapon.

| Child item | L0 ruling | Why it is L0's call |
|---|---|---|
| `L0-lgnd-cx02`: a stale copy after a hopper or allay pickup | **(a) Accept.** A stale generation cannot cast. It is deleted on its first `playerInventoryItemChange` in any player inventory (`L0-lgnd-r005`). No heuristic proximity query is added. | C-7 is about *usable* duplicates. A melee-only stale copy that disappears on first player contact does not break it. The heuristic (b) would add a local query on every removal (C-5), and (c) would undo the CTR-1 default. |
| `L0-lgnd-cx03`: `hidden_until` in ticks | **Epoch ms.** ASM-020 is amended by `L0-xasm1`. | The same clock problem affects the cooldown store, which `webs` ships and `scyt` will use. |
| `L0-lgnd-cx04`: "tests unchanged" | ADR-021 reads as **"no edits to assertions"**. Harness wiring in `src/gametest/main.ts` (calling `registerLegendaryFramework()` in place of the self-subscribing `registerTrap()`) is allowed. `L0-lgnd-ac11` is the gate. | The GameTest harness belongs to `L0-infr`. The code it calls belongs to `L0-webs`. |
| `L0-lgnd-cx06`: the loss watcher vs C-5 | **The wording of C-5 is widened:** *"short-lived tick loops are allowed only while temporary objects exist: Scythe volleys, or marked legendary item entities on the ground. Each such loop iterates only those objects."* Before `L0-lgnd-ad03` ships, `L0-lgnd-as03` must be measured on BDS 1.26.51.1. If `beforeEvents.entityRemove` reliably fires on a Void kill, the watcher is dropped. | C-5 is an L0 constraint. `webs` and `scyt` also cite it. |

**Not re-ruled here:** CTR-1 (Void/lava return for the Web Sword) is closed by `decision-resolve-cool-ctr1` (2026-09-24) and shipped in `src/legendary/recovery.ts`.

**Consequences.**
- `lgnd-cx02`, `cx03`, `cx04` and `cx06` are resolved by this ADR. `cx05` is resolved by `L0-adr-scope` §5.
- `lgnd-cx01` is escalated separately (`L0-xcx3`), because it needs the client.
- The `lgnd` generalisation task gets one extra acceptance step: the BDS probe for `as03`.
