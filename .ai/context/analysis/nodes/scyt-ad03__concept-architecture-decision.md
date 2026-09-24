---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad03"
source_channel: "rollout"
analysis_version: 1
title: "ADR-scyt-03 — Trigger on `afterEvents.itemUse` only, with no `playerInteractWithBlock` twin"
aliases: ["L0-scyt-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1421
tags: ["is_a:architecture-decision", "trigger", "status:proposed"]
level: 2
---
# ADR-scyt-03 — Trigger on `afterEvents.itemUse` only, with no `playerInteractWithBlock` twin

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-p001", "L0-sitm-adr2", "L0-lgnd"]` · status: proposed.

**Context.** The Web Sword (`src/websword/trap.ts`) subscribes to both `itemUse` and `playerInteractWithBlock`, and de-duplicates them. It does this because its target is a **block point**, and a press on a block must use the clicked face. `itemUse` fires for every press, in the air or on a block. The Scythe's target is a **player** chosen by radius, so the block that was clicked does not matter. Because of `L0-sitm-adr2` (no hoe tag), a press on grass does not till.

**Decision.** The Scythe's ability entry point listens to `world.afterEvents.itemUse` alone. It is routed through `L0-lgnd`'s dispatcher, the same one that serves the Web Sword. There is no de-duplication window, and no block context is read.

**Rejected.**
- Mirroring the Web Sword's dual subscription. It adds a de-dup path with no behavioural gain, and a risk of double-firing if the de-dup key misses.
- `beforeEvents.itemUse` with a cancel. It is not needed because nothing vanilla must be suppressed, and before-events cannot mutate (C-10).

**Check:** a GameTest confirms that one press on a block produces exactly one activation. The probe pattern already exists at `src/gametest/main.ts:82`.
