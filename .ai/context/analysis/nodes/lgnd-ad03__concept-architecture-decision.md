---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad03"
source_channel: "rollout"
analysis_version: 2
title: "AD-lgnd-03: A transient loss watcher that exists only while marked item entities exist"
aliases: ["L0-lgnd-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 980
tags: ["architecture-decision", "C-4", "C-13", "watcher"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-ac12", "L0-lgnd-cx06"]
---
# AD-lgnd-03: A transient loss watcher that exists only while marked item entities exist

**Context.** Void detection needs the entity's `y`, and it is safer to catch the entity before the engine kills it. C-4 forbids per-tick global scans. C-13 allows bounded temporary tick work.

**Decision.** A module-level `runInterval` (10 ticks) iterates **only the watch set**, the entity ids gathered from `entitySpawn`. It is created on the first add and cleared on the last removal. This is the same lifecycle as the ADR-025 volley loop.

**Rejected.**
- (a) Rely only on `entityRemove`. That depends on unmeasured engine behaviour for the Void (`L0-lgnd-as03`).
- (b) A permanent interval that polls `getEntities({type: item})`. That is a global scan (C-4).

**Note.** This goes beyond C-13's exception, which is worded for Scythe volleys only (`L0-lgnd-cx06`).
