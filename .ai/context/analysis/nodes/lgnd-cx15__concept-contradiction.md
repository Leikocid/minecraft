---
type: "concept-contradiction"
node_id: "L0-lgnd-cx15"
source_channel: "rollout"
analysis_version: 7
title: "CX-lgnd-15: The L0 plan gives the crossbow `keyPrefix: \\"sc\\"`, which the Scythe already uses"
aliases: ["L0-lgnd-cx15"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1272
tags: ["v7","sculk-crossbow","category:plan-vs-code","severity:high","status:resolved","target:L0-xasm26","resolved_by:L0-adr-sckp","resolved"]
level: 2
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx15
---

# CX-lgnd-15: The L0 plan gives the crossbow `keyPrefix: "sc"`, which the Scythe already uses

Related: L0-xasm26, L0-lgnd-ent1, L0-lgnd-r006, L0-lgnd-as02, L0-lgnd-as18, L0-sclk.

**Plan.** The L0 decomposition (`lgnd` row, item 3) and `L0-xasm26` say def #5 has `keyPrefix "sc"`.

**Code.** `SCYTHE_OF_CALAMITY.keyPrefix = "sc"` (`registry.ts`, `as02`), shipped since v3. Worlds already hold `andrew:sc_crafted`, `sc_owed`, `sc_pending` and `andrew:sc_gen:<id>`.

**Effect if built as planned.** `keysFor` gives both weapons the same keys:
- one craft flag for two weapons: a world that crafted the Scythe refunds every crossbow craft (T01 fails), and `/andrew:crossbow reset` re-opens the Scythe;
- pending, owed and gen ledgers merge, so a returned crossbow could be redeemed as a Scythe mark or bump a Scythe instance's gen;
- the registry uniqueness test (`ac23`) fails, so the build would stop anyway.

**Proposed resolution (autopilot default).** `keyPrefix: "sk"` (SculK). It is free, two letters like the others, and no `andrew:sk_` key exists anywhere. Also free: `sx`, `cb`. Frozen once a world ships (`r006`). `L0-xasm26` and the plan row should be corrected at reduce. Severity is high only in that it would corrupt live Scythe state; the fix is one string.

**Resolved at reduce (v7):** `L0-adr-sckp`.
