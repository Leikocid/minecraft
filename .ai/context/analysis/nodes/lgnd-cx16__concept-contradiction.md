---
type: "concept-contradiction"
node_id: "L0-lgnd-cx16"
source_channel: "rollout"
analysis_version: 7
title: "CX-lgnd-16: `decision-resolve-l0-xcx11` closed the holder question with a task, but the holder was never built"
aliases: ["L0-lgnd-cx16"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1557
tags: ["v7", "category:decision-vs-code", "severity:medium", "status:resolved", "target:L0-lgnd", "resolved_by:L0-adr-hldb"]
level: 2
---
# CX-lgnd-16: `decision-resolve-l0-xcx11` closed the holder question with a task, but the holder was never built

Related: L0-xcx11, L0-adr-hold, L0-lgnd-ad11, L0-lgnd-ac18, L0-lgnd-ad17, L0-xasm26.

**Decision (2026-09-29).** "Return goes to the last holder… a holder field is added to the mark, the return target changes to it. Work is filed as LGND-GEN-01-AA."

**Code (1.6.1).**
- The mark has no holder field (`state.ts`).
- `lost()` targets `w.mark.owner` (`recovery.ts:490`).
- The protect hand-back and its owed entry use `mark.owner` (`recovery.ts:877-879`).
- `LGND-GEN-01-AA` is in `.ai/tasks/archive/`; the generation guard shipped, the holder did not.

**KV.** `L0-adr-hold` still reads `status: proposed`, `ac18` still says "pending the client's confirmation", and the v6 component said `xcx11` "stays open". All three predate or ignore the decision.

**Why it matters now.** The Katana spec (§3) and the crossbow spec (§3: "возвращается последнему владельцу"; "no permanent binding to one owner") are the fourth and fifth specs asking for the last holder. Every new weapon's T20/Void test is written against the owner and must be rewritten later.

**Proposed resolution (autopilot default).** The decision stands; the gap is unbuilt work, not an open question. File `LGND-HOLD` per `ad11` as its own task, independent of `sclk`. Until it ships, the crossbow's Void/T20 clauses target `mark.owner` through one `returnTarget(mark)` test helper (`ad17`). Mark `L0-adr-hold` accepted and drop the "pending confirmation" text of `ac18` at reduce.

**Resolved at reduce (v7):** `L0-adr-hldb`.
