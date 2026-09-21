---
type: "concept-assumption"
node_id: "L0-trap-as20"
source_channel: "rollout"
title: "ASM-020 — An unloaded cell is detectable by a non-loading block read"
aliases: ["L0-trap-as20"]
part_of: ["L0-trap"]
is_a: ["assumption"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1801
tags: ["assumption","CAN_ASSUME","chunks","api","L0-trap"]
---

# ASM-020 — An unloaded cell is detectable by a non-loading block read

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §6, §12, C-1

**Assumed.** On the stable `@minecraft/server` 2.10.0 surface, attempting to read a block in an unloaded or inaccessible chunk either returns `undefined` or throws — and **does not itself cause the chunk to load**. Both outcomes are treated as `reason = unloaded ⇒ skip` (R-007).

**Basis.** §6 and §12 require the behaviour (*«не форсировать опасную запись в незагруженные чанки»*) but name no API. C-1 forbids reaching for a Beta chunk-state query if one exists there. A read-and-handle probe is the only mechanism this analysis can assume exists on the stable surface.

**Impact if wrong, by direction.**

- *The read force-loads the chunk.* The probe becomes the very thing §12 calls dangerous, and R-007 is unimplementable as designed. Requires a different detection mechanism — a distance-to-simulation-boundary heuristic, or escalation to L0 under C-1 if only a Beta API can answer it.
- *The read fails in a way that is indistinguishable from a legitimately empty cell.* Air and unloaded collapse into the same verdict. Harmless for correctness (air is `permit`, unloaded is `skip`) but the wrong way round — the cell would be **written**, breaching R-007. This is the dangerous direction and must be checked explicitly, not inferred.
- *Throwing rather than returning.* Purely mechanical — the classifier wraps the probe.

**How to close.** A GameTest that reads a block at a known far-edge coordinate and asserts both the return shape and that the loaded-chunk set is unchanged afterwards. This is also the evidence `L0-trap-ac04` needs, and its outcome decides whether AC-04 can be tested directly or must fall back to unit-level evidence.
