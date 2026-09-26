---
type: "concept-assumption"
node_id: "L0-webs-as01"
source_channel: "rollout"
analysis_version: 2
level: 2
title: "ASM-webs-01 — Unloaded-cell detection is \"query fails/returns undefined\", not a chunk-ticking probe `CAN_ASSUME`"
aliases: ["L0-webs-as01"]
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1006
tags: ["CAN_ASSUME", "assumption", "unloaded-chunks"]
---
---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
# ASM-webs-01 — Unloaded-cell detection is "query fails/returns undefined", not a chunk-ticking probe `CAN_ASSUME`

**Assumed.** A cell counts as outside the loaded/accessible area when the stable block-query API cannot return a definite block there (undefined result or a thrown error), not via any experimental "is chunk loaded/ticking" API. Such cells are handled exactly like `L0-webs-r004`'s protected-block branch: skip, don't force-load, don't retry.

**Basis.** Project constraint C-2 forbids beta/preview API and experimental toggles; the stable `@minecraft/server` 2.10.0 surface has no dedicated "chunk loaded" query, so a defensive read is the only stable-API way to detect this.

**Impact if wrong.** If a stable "is loaded" query does exist at implementation time, this narrows to a direct check instead of a defensive try/read; the skip *behavior* (`L0-webs-r004`, `L0-webs-ac07`) is unaffected either way. Low.
