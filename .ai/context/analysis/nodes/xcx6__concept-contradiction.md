---
type: "concept-contradiction"
node_id: "L0-xcx6"
source_channel: "rollout"
analysis_version: 2
title: "CX-L0-06 · `wrdn` and `bast` restate the structure contract instead of referencing `strf-*` / `loot-*`, and list no probe dependencies"
aliases: ["L0-xcx6"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2554
tags: ["title:wrdn and bast restate the strf/loot contract instead of referencing it", "target:L0", "status:open", "category:invariant-violation", "severity:medium", "reduce", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-adr-strc", "relates_to:L0-adr-body", "relates_to:L0-wrdn-rul1", "relates_to:L0-wrdn-rul7", "relates_to:L0-wrdn-ad02", "relates_to:L0-bast-r001", "relates_to:L0-bast-r006", "relates_to:L0-bast-ad01", "relates_to:L0-bast-as03", "relates_to:L0-bast-p001", "relates_to:L0-bast-p002", "relates_to:L0-strf-r002", "relates_to:L0-strf-r008", "relates_to:L0-strf-p001", "relates_to:L0-strf-p005", "relates_to:L0-strf-p006"]
level: 1
---
# CX-L0-06 · `wrdn` and `bast` restate the structure contract instead of referencing `strf-*` / `loot-*`, and list no probe dependencies

**Links:** `is_a: ["contradiction"]` · `relates_to: ["L0-wrdn", "L0-bast", "L0-strf", "L0-loot", "L0-adr-body"]` · **target_node:** `L0` · **status:** open

**Invariant (L0 decomposition plan v2, reduce section).**
- The four body children reference `strf-*` / `loot-*` rules by id and must not restate generation, persistence or loot rules.
- `strf` answers first with a probe plan, and body children list which probe results they depend on.

`wind` and `airs` comply. `wrdn` and `bast` do not. Evidence below is as read during this reduce at version 2.

**`L0-wrdn`**
- `rul1` restates roll, cancel and no-relocation, and collision. `rul7` restates persistence and idempotency. `rul6` restates fill-once.
- In the whole subtree, only one plain mention of `L0-strf` appears, and no `strf-*` or `loot-*` id at all.
- `wrdn-ad02` still treats `L0-xcx4` as open. `strf-p005` closed it in this same run.
- It depends on probe items 3 (`can_summon`) and 4 (`/loot insert chests/ancient_city`), but it does not name them.

**`L0-bast`**
- `r001`, `r006`, `p001` and `p002` restate the full roll → validate → place → populate pipeline.
- `bast-ad01` duplicates `L0-adr-strc`, and it says generation is "keyed off world-generation/chunk-load events". That contradicts `L0-adr-strc` and `strf-p001`: no such stable event exists, and discovery is a throttled player-position pass.
- `bast-as03` invents a per-instance marker ("dynamic property or block/entity tag") that competes with the single region-sharded registry (`strf-r008`, `L0-adr-strs`).
- `bast-p001` step 2, "the chunk is not re-rolled later", is fine. But it omits `pending` deferral (`strf-r002` §2, `strf-r007`).
- It links to sibling ids that do not exist: `L0-mill` and `L0-arsh` should be `L0-wind` and `L0-airs`. It references no `strf-*` or `loot-*` id and no probe item. It depends on items 4 and 5.

**Why it matters.** Paraphrases drift. Example: `bast-as03` would give a second source of truth for "already initialised" (C-7). Also, the statistical ACs (`wrdn-ac01`, `bast-ac01`) test rates that `strf-r002` owns.

**Resolution path.** `L0-adr-body` gives the binding crosswalk: each restated clause maps to its `strf`/`loot` id, and `strf` wins where wording differs. It also lists each body's probe dependencies. The contradiction stays open until a delta pass on `wrdn`/`bast` replaces the restatements with references and fixes the phantom ids.
