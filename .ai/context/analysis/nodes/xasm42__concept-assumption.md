---
type: "concept-assumption"
node_id: "L0-xasm42"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ASM-L0-42 · Pearl Rod outcome table"
aliases: ["L0-xasm42"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 2308
tags: ["v11", "pearl-rod", "CAN_ASSUME"]
---
---
title: "ASM-L0-42 · Pearl Rod outcome table: what clears the binding, what keeps it, who may use it"
aliases: ["L0-xasm42", "Pearl Rod outcomes"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-adr-prbd", "L0-xcx34", "L0-xq12"]
see_also: ["underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
---
# ASM-L0-42 · Pearl Rod outcome table

**Class:** CAN_ASSUME.

**Gap.** The spec defines only three outcomes: success (clear), a broken or replaced plate (invalid), and a failed load or no safe spot (fail safely and report). It is silent on whether a failed use also casts, on non-owners, on riders, and on re-binding.

**Assumption.**

| Situation on use of a bound rod | Cast? | Teleport? | Binding after | Message |
|---|---|---|---|---|
| The owner, with the same epoch, and everything valid | no | yes | **cleared** | arrival line |
| The owner, but the plate is missing, another type, or has a bumped generation (`xcx34`) | no | no | **cleared** | "plate gone, bind again" |
| The owner, but the preload timed out, the pool is full, or the dimension is refused | no | no | **kept** | the specific reason, "try again" |
| The owner, but there is no safe spot at the plate or its 8 neighbours | no | no | **kept** | "destination unsafe" |
| The owner, with a teleport already pending | no | no | unchanged | "already travelling" |
| The owner dies, or dies while the teleport is pending | — | aborted | void (epoch) | none |
| A non-owner, or the owner after death (epoch mismatch) | **yes (vanilla cast)** | no | unchanged until their own hook binds, which **overwrites** it | none |
| The owner is riding | no | yes, after dismounting (`xq12` item 4) | cleared | arrival line |

- **One binding per rod.** Binding again overwrites. Bindings on different rods are independent.
- **Timeout.** The preload timeout is 10 s (200 ticks).
- **Lore.** The lore shows "bound: <dimension> x y z" or "unbound". It never shows the owner's name.

**Impact if wrong.**
- If Andrey wants a failed load to clear the binding, or a failed use to cast, each is a one-cell change in the table and in the scenario expectations.
- If a non-owner should be blocked from even casting a rod that someone else bound, the cancel branch widens. The spec only forbids *using the binding*.
