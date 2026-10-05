---
type: "concept-architecture-decision"
node_id: "L0-adr-sckp"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk` (status: accepted, resolves `L0-lgnd-cx15`)"
aliases: ["L0-adr-sckp"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1581
tags: ["v7", "sculk-crossbow", "status:accepted", "resolves:L0-lgnd-cx15", "reduce"]
---
---
title: "ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk`"
aliases: ["L0-adr-sckp", "Crossbow key prefix"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-lgnd-cx15", "L0-xasm26", "L0-lgnd-as18", "L0-lgnd-ad16", "L0-sclk-p006", "L0-sclk-ent1", "L0-sclk-ac01", "L0-sclk-ac02", "L0-sclk-ac03"]
requires: ["L0-lgnd"]
governs_files: ["src/legendary/registry.ts"]
---
# ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk` (status: accepted, resolves `L0-lgnd-cx15`)

**Context.** The v7 plan row for `lgnd` and `L0-xasm26` gave def #5 `keyPrefix "sc"`. `sclk` built on that (p006, ent1, ac01–ac03). `lgnd` read `registry.ts` and found `sc` is the **Scythe's** prefix. It has been live since v3, and worlds already hold `andrew:sc_crafted`, `sc_owed`, `sc_pending` and `sc_gen:*`. Sharing it would merge the two weapons' craft flags and ledgers, and the registry uniqueness test (`lgnd-ac23`) would stop the build.

**Decision.** Def #5 uses **`keyPrefix: "sk"`**. No `andrew:sk_` key exists anywhere. Like every prefix, it is frozen once a world ships (`lgnd-r006`).

**Reconciled in place at reduce.** All of these were written in this run, so they were corrected rather than filed against: `sclk-p006`, `sclk-ent1`, `sclk-ac01`–`ac03` (flag `sk`), `L0-xasm26`, and the `lgnd` row of the v7 decomposition plan (now annotated). The `lgnd` side (`as18`, component delta #3) already said `sk`.

**Consequence.** The token id, item id and command `andrew:crossbow` are unaffected. A test asserting the craft flag reads `andrew:sk_crafted`.
