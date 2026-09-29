---
type: "concept-assumption"
node_id: "L0-pntr-as05"
source_channel: "rollout"
analysis_version: 3
title: "AS-pntr-05 · Legendaries nested in storage items are `lgnd`'s problem"
aliases: ["L0-pntr-as05"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 904
tags: ["title:AS-pntr-05 · Legendaries nested in storage items are lgnd's problem", "is_a:assumption", "CAN_ASSUME", "relates_to:L0-lgnd", "relates_to:L0-pntr-r005", "relates_to:L0-xcx10"]
level: 2
---
# AS-pntr-05 · Legendaries nested in storage items are `lgnd`'s problem

**Gap.**
- A legendary can sit inside a bundle or shulker-box *item* that is inside a chest in the column.
- Stable 2.10.0 exposes `ItemInventoryComponent` only for items with the Storage Item component (bundles). Whether a shulker-box item's contents are readable is unverified.

**Assumption (CAN_ASSUME).**
- `lgnd.protectLegendariesIn` owns the recursion: it walks nested storage items where the API allows.
- `pntr` passes only the cell volume. It does not inspect items itself, so there is a single implementation shared with `ring`.

**Impact if wrong.**
- If shulker-box items are opaque, a legendary nested in one is deleted by the LMB. That violates C-7′.
- The `lgnd` delta must then either block putting legendaries into shulker boxes (a `beforeEvents` hook) or document the gap under C-16. Neither changes `pntr` code.
