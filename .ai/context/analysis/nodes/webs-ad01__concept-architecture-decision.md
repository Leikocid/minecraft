---
type: "concept-architecture-decision"
node_id: "L0-webs-ad01"
source_channel: "rollout"
analysis_version: 1
level: 2
title: "AD-webs-01 — Detect unloaded cells with a defensive stable-API block read, not an experimental chunk-ticking query"
aliases: ["L0-webs-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1296
tags: ["architecture-decision", "status:proposed", "unloaded-chunks"]
---
---
is_a: ["architecture-decision"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004", "L0-webs-as01"]
status: proposed
---
# AD-webs-01 — Detect unloaded cells with a defensive stable-API block read, not an experimental chunk-ticking query

**Context.** Spec §6/§12 require never forcing a write into an unloaded/inaccessible cell, and project constraint C-2 forbids beta/preview API or experimental manifest toggles. The stable `@minecraft/server` 2.10.0 surface has no dedicated "is this chunk loaded" query.

**Decision.** Treat a cell as unloaded/inaccessible when the stable block-query call for that position fails to return a usable block (throws or returns an unexpected/undefined result), and handle it identically to a protected cell (`L0-webs-r004`): skip, don't retry, don't force-generate.

**Rejected alternative.** Using an experimental "chunk state" API or a `system.run`-scheduled forced load — both would violate C-2 (stable-API-only) and risk generating/loading terrain purely to place a decorative trap, which spec §12 explicitly warns against ("не форсировать опасную запись в незагруженные чанки").

**Status.** Proposed — pending confirmation at implementation time of the exact stable API call available on BDS 1.26.51.1 / `@minecraft/server` 2.10.0 (see `L0-webs-as01`).
