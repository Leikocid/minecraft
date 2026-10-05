---
type: "concept-architecture-decision"
node_id: "L0-adr-hldb"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-hldb · Holder: decided, unbuilt, one seam (status: accepted, resolves `L0-lgnd-cx16`)"
aliases: ["L0-adr-hldb"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1984
tags: ["v7", "legendary", "status:accepted", "resolves:L0-lgnd-cx16", "amends:L0-adr-hold", "reduce"]
---
---
title: "ADR-L0-hldb · The last-holder return is decided and unbuilt; tests target `mark.owner` through one helper until `LGND-HOLD` ships"
aliases: ["L0-adr-hldb", "Holder build-out"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-katn", "L0-adr-hold", "L0-xcx11", "L0-lgnd-cx16", "L0-lgnd-ad11", "L0-lgnd-ad17", "L0-lgnd-ac18", "L0-lgnd-ac27", "L0-sclk-ac20", "L0-xasm26"]
requires: ["L0-adr-hold"]
governs_files: ["src/legendary/state.ts", "src/legendary/recovery.ts"]
---
# ADR-L0-hldb · Holder: decided, unbuilt, one seam (status: accepted, resolves `L0-lgnd-cx16`)

**Context.** `decision-resolve-l0-xcx11` (2026-09-29) chose "return to the last holder" and named `LGND-GEN-01-AA`. That task shipped the mark generation only. As read in this run (`lgnd`, 2026-10-05): the mark has no holder field (`state.ts`), and `lost()` and the protect hand-back target `mark.owner` (`recovery.ts:490`, `:877-879`). `L0-adr-hold` still says "proposed", and `lgnd-ac18` said "pending confirmation". The crossbow spec §3 is the fifth spec asking for the last holder. `sclk-ac20` was written against `mark.owner` (`xasm26`).

**Decision.**
1. `L0-adr-hold` is **accepted**: the operator decision is final, and there is no client question left. `lgnd-ac18` was corrected in place to drop "pending confirmation".
2. The holder field is **its own task, `LGND-HOLD`**, per `lgnd-ad11`. It is independent of and not blocking the crossbow epics.
3. Until it ships, every weapon's T20/Void test (the crossbow's `sclk-ac20` included) resolves the expected recipient through a single `returnTarget(mark)` test helper that returns `mark.owner` (`lgnd-ad17`). `LGND-HOLD` changes that helper and the holder clauses of `lgnd-ac08`/`ac09`/`ac24`/`ac27`, and no per-weapon test.

**Consequence.** The crossbow ships with the same documented deviation as the Katana: Void and loss go to the crafter or `/give` target. That remains true only until `LGND-HOLD` lands.
