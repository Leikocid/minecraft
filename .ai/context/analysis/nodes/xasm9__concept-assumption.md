---
type: "concept-assumption"
node_id: "L0-xasm9"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-9 · \"Standalone module\" means a separate source module, not a separate pack"
aliases: ["L0-xasm9"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0", "L0-orbc", "L0-adr-orbc"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
priority: 540
size_chars: 716
tags: ["title:ASM-L0-9 · \"Standalone module\" means a separate source module, not a separate pack", "alias:L0-xasm9", "is_a:assumption", "relates_to:L0", "relates_to:L0-orbc", "relates_to:L0-adr-orbc", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "CAN_ASSUME"]
level: 1
---
# ASM-L0-9 · "Standalone module" means a separate source module, not a separate pack

**Gap.** Orbital §1 says "a separate testable module suitable for later integration into the full PvP Add-On". This repo already is that full add-on.

**Assumption (CAN_ASSUME).**
- The Cannon ships inside `andrew.mcaddon` as `src/orbital/` plus its item, entity, recipe and lang entries.
- It is testable on its own through gametest tags such as `orbital:*`.
- No second pack.

**Impact if wrong.** If the client wants a separately installable pack, the craft gate, mark and HUD must be duplicated or extracted into a shared library pack. That is a large rework, and there is a risk of two gates fighting over one world (C-7′).
