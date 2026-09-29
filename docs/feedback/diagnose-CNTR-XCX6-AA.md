# /diagnose · CNTR-XCX6-AA · L0-xcx6

ИСХОД: 3 — Подчистка знания

`KV/` below means `<project root>/.ai/context/analysis/nodes/`. That is the live KV; it is uncommitted. The worktree copy at `1a07f34` matches it for all 79 nodes this touches (`cmp`: 0 of 79 differ), so the line numbers hold for both. The invariant check is `docs/feedback/diagnose-CNTR-XCX6-AA.check.mjs`.

## 1. Intake

```text
OBSERVED: live KV (global version 3; kv_current_version says L0-wrdn = 2 and L0-bast = 2).
          wrdn (30 nodes) and bast (31 nodes) contain 0 strf-*/loot-* ids and 0 probe-item mentions.
          bast links L0-mill / L0-arsh, which do not exist. It keys generation off
          "world-generation/chunk-load events" and keeps its own init flags.
          wrdn treats L0-xcx4 as open.
          The node files date from 2026-09-26 10:26–10:28. That is before L0-adr-body (10:34) and
          decision-l0-xcx6 (10:38), and they have not been rewritten since.
VERDICT:  bug (in the knowledge). It diverges from a recorded invariant (L0 decomposition plan v2,
          reduce) and from decision-l0-xcx6 of 2026-09-26. That expectation still stands: the
          decision was not revoked, and summary.md:107 carries xcx6 as open. The code does not
          diverge (see RULED OUT 1).
CHECKS:   contradiction: none (the fix carries out decision-l0-xcx6) · duplicate: none on the board
          (BAST-BODY-01-AA / WRDN-BODY-01-AA are done, and they carried the corrections in the card
          text, not in the KV) · criteria writable: yes (the check below)
UNFOLD:   knowledge cleanup: a list of edits to KV text, no code work
HUMAN:    none
```

## 2. Re-checking the claim's numbers

| Claim | How measured | Measured | Result |
|---|---|---|---|
| `wrdn-rul1` restates roll/cancel/no-relocation/collision | `cat -n` | `wrdn-rul1:18-22` | confirmed |
| `rul7` restates persistence/idempotency; `rul6` restates fill-once | `cat -n` | `wrdn-rul7:17-19`; `wrdn-rul6:20` | confirmed |
| "only one plain mention of `L0-strf`" | `grep -n strf wrdn*` | 2 lines: tag `relates_to:L0-strf` (`wrdn__:12`) and a bare `` `strf` `` in the body (`wrdn-ad02:23`). `L0-strf` spelled out in a body: 0 | true in substance, loosely worded |
| no `strf-*` / `loot-*` id in wrdn | `grep -E '(strf\|loot)-[a-z]?[0-9]'` | 0 lines, 0 files | confirmed |
| `wrdn-ad02` treats `L0-xcx4` as open | `grep` | `wrdn-ad02:23`, plus `wrdn__:61` and `wrdn__:68`, which the claim does not name | confirmed, wider than stated |
| `strf-p005` closed `L0-xcx4` | frontmatter | `xcx4:13` `status:resolved`, `resolved_by:L0-adr-spwn`; `strf-p005:6` "closes L0-xcx4" | confirmed |
| wrdn depends on probe items 3, 4 | `strf-p006:24-28` | 3 and 4 name wrdn. Items 1 and 2 are "all" → the full set is **1, 2, 3, 4** (+8, 9 through strf), as in `adr-body:51-54` and the decision | **the claim is incomplete** |
| wrdn does not name its items | `grep -iE 'probe\|p006'` | 0. `can_summon` appears 4 times, but as a vanilla property, not as a probe item | confirmed |
| `bast-r001/r006/p001/p002` restate the pipeline | `cat -n` | `bast-r001:15`, `r006:15`, `p001:18-25`, `p002:18-26` | confirmed |
| `bast-ad01`: "keyed off world-generation/chunk-load events" | `grep` | `bast-ad01:19`, plus `bast__:21` and `bast-p001:18`, which the claim does not name | confirmed, wider than stated |
| no such event exists | `adr-strc:24`; code | `src/structures` subscribes to nothing except `startup` (`commands.ts:367`) | confirmed |
| `bast-as03` invents a marker | `cat -n` | `bast-as03:17`. It has spread to `bast-p002:20,24`, `bast-ent1:28`, `bast-ent2:26` and `bast-ent3:25`; the claim does not name these | confirmed, wider than stated |
| `bast-p001` omits `pending` | `grep -i pending bast*` | 0 | confirmed |
| phantom `L0-mill` / `L0-arsh` | `grep`; files by `node_id` | `bast__:13,18,41`. Nodes `L0-mill` and `L0-arsh` exist: 0 files. `L0-wind` and `L0-airs` exist | confirmed |
| bast has no strf/loot id and no probe item | `grep` | 0 / 0 / 0 | confirmed |
| bast depends on items 4, 5 | `strf-p006:24-28` | plus 1 and 2 ("all") → **1, 2, 4, 5** (+8, 9) | **the claim is incomplete** |
| `wind` and `airs` comply | the same `grep` | wind: 25 of 63 files, 76 lines with an id, 10 files name the probe. airs: 12 of 25 files, 52 lines, 5 files | confirmed |
| `wrdn-ac01` / `bast-ac01` test rates that `strf-r002` owns | `cat -n` | `wrdn-ac01:15`, `bast-ac01:17-19` against `strf-r002:20`. The code tests this in `tests/structures-roll.test.mjs:148-149` | confirmed |

## 3. Investigation

```text
REPRO:     node docs/feedback/diagnose-CNTR-XCX6-AA.check.mjs "<root>/.ai/context/analysis/nodes"
           → 25 FAIL, exit 1. Deterministic: the final version gave exit 1 on all 3 runs (worktree x2, root via run-check).
CAUSE:     The reduce pass of 2026-09-26 (10:26–10:28) wrote the wrdn/bast deltas as paraphrases of
           spec §13–§15, before L0-adr-body existed (10:34). The analyze --incremental that
           decision-l0-xcx6 announced never re-ran these nodes: kv_current_version is 2 for both,
           271 nodes are at v3 and none of them is wrdn-* or bast-*, and the mtimes have not moved.
           The corrections went into the card text instead (.ai/tasks/BAST-BODY-01-AA.md:25-29,
           WRDN-BODY-01-AA.md:25,87).
PROOF:     .ai/verify/CNTR-XCX6-AA/2.red.json (run-check --expect-red; exit 1; code_sha 4bf8997;
           2026-09-29T20:03:28Z). The artifact's knowledge_sha is a git sha, and the live KV is
           outside git. Its state is pinned by the mtimes plus a cmp of 0/79 against 1a07f34.
RULED OUT: (1) "The drift reached the code." Killed by reading it:
             - discovery is runInterval over player positions (discovery.ts:278-281);
             - the bodies declare "no mark of its own" (bodies/bastion.ts:4-6, bodies/warden-city.ts:1-5);
             - setDynamicProperty is called only by the registry store (store.ts:39);
             - the guard tag andrew:guard:<id> (bodies/windmill.ts:20) is read nowhere outside
               gametest, so it is not an init gate;
             - pending exists (pending.ts); loot goes through /loot insert (loot.ts:59);
             - the chances live in one table (config.ts:24-27).
           (2) "The pass ran, and MCP serves stale data." Killed: the file on disk is v2 and its
               mtime is unchanged.
           (3) "The probe dependencies are unmet." Killed: docs/structures/probe-results.md:13-17
               has items 1–4 PASS and item 5 PASS (partial). Only the naming is missing.
```

## 4. Fix design

```text
RADIUS: Readers of these nodes:
          - executor agents through kv_search (future changes to the Bastion or the City);
          - the reconcile scan-code from CX-L0-12;
          - /plan.
        Code depends only on the ids of body-owned nodes:
          - L0-wrdn-rul2: templates/warden-city.ts, tests/warden-template.test.mjs, gametest/warden.ts
          - L0-bast-r002: templates/bastion.ts, tests/bastion-template.test.mjs, gametest/bastion.ts
          - L0-bast-r005: selftest/bastion-restart.ts
          - L0-wrdn-ad01, L0-bast-ad02: docs/structures/probe-results.md
        Method: grep -rnoE 'L0-(wrdn|bast)…' src tests scripts docs.
        → Rewrite the text and keep the ids. Only bast-as03 is voided (0 references in code).
        Aggregate docs (summary, scope, risks, assumptions, contradictions, project-knowledge/*):
        0 copies of the stale wording. decisions.md:610-619 and decision-l0-xcx6:16-20,34-38
        are the refutation itself, not copies.
        This is not a restriction: the edit is to text, and no running path is taken away.
```

## 5. Proof

```text
GREEN: Not reachable inside this task, because KV writes are forbidden. The same check, run on a
       scratch copy with the list in §7 applied, gives exit 0 (every item PASS). The control
       (wind 76, airs 52) is unchanged, so green does not come from the check going blind; a
       blind directory gives exit 2. The final green, for whoever applies the list:
       ai-kit run-check -- node docs/feedback/diagnose-CNTR-XCX6-AA.check.mjs "<root>/.ai/context/analysis/nodes" → exit 0
LIVE:  None. The subject is KV text, and no path in the product reads it. The code side was
       checked by reading it (RULED OUT 1).
```

## 6. Resolution text (for `refine resolve`)

> L0-xcx6 was re-measured on 2026-09-29 against the live KV. Every point is confirmed, and the defect is wider than the claim says:
> - the chunk-load-event wording is also at `bast__:21` and `bast-p001:18`;
> - the own init marker has spread to `bast-p002:20,24` and `bast-ent1/2/3`;
> - `wrdn-ent1`/`ent2` keep their own instance record and a `filled` flag, against `strf-r008` §4;
> - "xcx4 is open" also appears at `wrdn__:61,68`.
>
> Zero `strf-*`/`loot-*` ids in wrdn (30 nodes) and bast (31 nodes), against 76 and 52 lines in wind and airs.
>
> Cause: the analyze --incremental announced by decision-l0-xcx6 did not re-run wrdn/bast. Both are still at v2, with files dated 2026-09-26 10:26–10:28, before L0-adr-body.
>
> The code (v1.2.0) follows strf/loot: player-position discovery, a single registry, `pending`, `/loot insert`. There is no harm in the product.
>
> Correction to the claim itself: the probe dependencies are wrdn = 1, 2, 3, 4 and bast = 1, 2, 4, 5 (+8, 9 through strf), as in L0-adr-body — not "3, 4" and "4, 5". All of them are PASS in probe-results.md.
>
> Outcome: knowledge cleanup, per the list in docs/feedback/diagnose-CNTR-XCX6-AA.md §7. **The node does not close until the list is applied** and `docs/feedback/diagnose-CNTR-XCX6-AA.check.mjs` gives exit 0 on the live KV. Red: `.ai/verify/CNTR-XCX6-AA/2.red.json`.

## 7. Copies: `file:line — what to replace with what`

Where "cite" appears, replace the restatement with a reference. The body's own values (chance 0.05, dimension, top Y, template, counts) stay.

**wrdn**
1. `KV/wrdn__concept-component.md:12` — in `tags`, add `relates_to:L0-loot` and `relates_to:L0-adr-body`.
2. `KV/wrdn__concept-component.md:28-31` — roll, cancel and collision prose → "Governed by `L0-strf-r001`, `L0-strf-r002` (with `pending` §2), `L0-strf-p001`, `L0-strf-p002` (`dryLand` + `depth`), `L0-strf-r006`. Body: Overworld, 0.05, top Y ∈ [−45, −35]."
3. `KV/wrdn__concept-component.md:53` — "fills exactly once…" → "`L0-loot-r006`, `L0-loot-r007`".
4. `KV/wrdn__concept-component.md:56-58` — Persistence → "`L0-strf-r008`, `L0-strf-p004`, `L0-adr-strs`".
5. `KV/wrdn__concept-component.md:61` — "`L0-xcx4` (whether a permanent … C-5) and" → delete. Put in its place "`L0-xcx4` is resolved (`L0-strf-p005`, `L0-adr-spwn`)".
6. `KV/wrdn__concept-component.md:67` — "…placement mechanism" → "`ad02` is superseded by `L0-adr-strc`".
7. `KV/wrdn__concept-component.md:68` — "(`L0-xcx4`, `L0-xcx5`) are cross-cutting and unresolved" → "`L0-xcx5` is open; `L0-xcx6` targets this component (`L0-adr-body`)".
8. `KV/wrdn__concept-component.md` (new line after 68) — "Probe dependencies (`L0-strf-p006`): 1, 2, 3, 4 (+8, 9 through `strf`); all PASS, `docs/structures/probe-results.md:13-16`".
9. `KV/wrdn-rul1__concept-rule.md:18-19,22` — cite `L0-strf-r001`, `L0-strf-r002` (with `pending` §2), `L0-strf-p001`, `L0-strf-r006`. `:20` → `L0-strf-p002` `dryLand`. `:21` → "body value; profile `depth` (`L0-strf-p002`)". `:24` rationale → delete.
10. `KV/wrdn-rul6__concept-rule.md:18` — add "`L0-loot-p002` (`/loot insert … chests/ancient_city`, probe item 4)". `:20` → "`L0-loot-r006`, `L0-loot-r007`".
11. `KV/wrdn-rul7__concept-rule.md:17-19,21` — cite `L0-strf-r008`, `L0-strf-p004`, `L0-adr-strs`.
12. `KV/wrdn-ad01__concept-architecture-decision.md:19` — add "the mechanism is `L0-loot-p002`".
13. `KV/wrdn-ad02__concept-architecture-decision.md:19` — "a shared, throttled per-chunk discovery pass…" → "`L0-strf-p001` (superseded by `L0-adr-strc`)". `:23` "Open dependency … still open … see `L0-xcx4`" → "`L0-xcx4` is resolved by `L0-strf-p005` / `L0-adr-spwn`".
14. `KV/wrdn-ent1__concept-entity.md:17` — "read for idempotency checks on every subsequent chunk load" → "the instance is an `L0-strf-e002` InstanceRecord; idempotency is `L0-strf-r008`". `:27` state `candidate → placed | cancelled` → "`L0-strf-e002` states; the candidate is `L0-strf-e003` and is never persisted". `:32` → cite `L0-strf-r008`, `L0-strf-r002` §3.
15. `KV/wrdn-ent2__concept-entity.md:24-25` — "`filled` — boolean, set true on first open…" and `filledAtTimestamp` → "fill state = registry `looted`; the container itself is the loot state (`L0-strf-r008` §4)".
16. `KV/wrdn-gl05__concept-glossary-term.md:17` — cite `L0-strf-r002`, `L0-strf-e003`.
17. `KV/wrdn-ac01__concept-acceptance-criterion.md:15` — the rate belongs to `L0-strf-r002` §1 and is proven by `tests/structures-roll.test.mjs:148`. The body AC → "`StructureDef.chance = 0.05`" (`src/structures/config.ts:26`).
18. `KV/wrdn-ac02__concept-acceptance-criterion.md:15` — cite `L0-strf-p002` `dryLand`. `KV/wrdn-ac10__concept-acceptance-criterion.md:15` — cite `L0-strf-r006`.

**bast**

19. `KV/bast__concept-component.md:13` — `relates_to:L0-mill`, `relates_to:L0-arsh` → `relates_to:L0-wind`, `relates_to:L0-airs`; also add `L0-strf`, `L0-loot` and `L0-adr-body`.
20. `KV/bast__concept-component.md:18` — `` `L0-mill` `` → `` `L0-wind` ``, `` `L0-arsh` `` → `` `L0-airs` ``.
21. `KV/bast__concept-component.md:21` — "Per-chunk world-generation/load events in the Nether dimension" → "Nether chunks that the player-position discovery pass `L0-strf-p001` puts in the queue (`L0-adr-strc`: the stable API has no chunk-generated event)".
22. `KV/bast__concept-component.md:34-36,38-39` — cite, line by line: `L0-strf-r002`; profile `netherFloor` (`L0-xasm4` §3); `L0-strf-r006`; `L0-strf-r009`; `L0-strf-r008`.
23. `KV/bast__concept-component.md:41` — `L0-mill`/`L0-arsh` → `L0-wind`/`L0-airs`. Delete "None of these sibling components exist yet in the KV…".
24. `KV/bast__concept-component.md` (new line) — "Probe dependencies (`L0-strf-p006`): 1, 2, 4, 5 (+8, 9 through `strf`); PASS (5 partial), `docs/structures/probe-results.md:13-17`".
25. `KV/bast-r001__concept-rule.md:15` — cite `L0-strf-r001`, `L0-strf-r002` (with `pending` §2), `L0-strf-p001`, `L0-strf-r006`, and profile `netherFloor` (`L0-xasm4` §3). Body: Nether, 0.05.
26. `KV/bast-r003__concept-rule.md:15` — tables → `L0-loot-p002` (`chests/bastion_treasure`, `chests/bastion_other`). "generated exactly once and never refill…" → "`L0-loot-r006`, `L0-loot-r007`".
27. `KV/bast-r005__concept-rule.md:15` — "persistent until death … never replaced" → "`L0-strf-r009`, `L0-adr-strs`". The roster counts stay here, because the code cites this node.
28. `KV/bast-r006__concept-rule.md:15` — cite `L0-strf-r008`, `L0-strf-p004`, `L0-strf-r009`, `L0-adr-strs`.
29. `KV/bast-p001__concept-process.md:18` — "GIVEN a Nether chunk is generated/loaded" → "GIVEN the `strf` discovery worker dequeues a Nether chunk (`L0-strf-p001`)". `:20-25` → "steps `L0-strf-p001` → `p002` → `p003`; the body supplies the `StructureDef` and the template". `:23` — add "except `pending` (footprint not loaded): the same origin and rotation are retried (`L0-strf-r002` §2, `L0-strf-r007`)". `:29` — add the strf ids.
30. `KV/bast-p002__concept-process.md:20` — "Check the instance's initialization flag/marker… (see ASM-bast-03)" → "each step runs only while the registry record is in its predecessor state (`L0-strf-r008` §2, `L0-strf-p004`)". `:24` — "set the initialization flag" → "advance the registry record (planned → placed → looted → guarded → done)". `:26` → `L0-strf-r008`, `L0-strf-r009`.
31. `KV/bast-ad01__concept-architecture-decision.md:19` — "keyed off world-generation/chunk-load events" → "driven by the player-position discovery pass `L0-strf-p001`". Mark the whole ADR "superseded by `L0-adr-strc`".
32. `KV/bast-ad02__concept-architecture-decision.md:19` — add "the mechanism is `L0-loot-p002`".
33. `KV/bast-as03__concept-assumption.md:15-21` — void. Replace with "Superseded: idempotency is the single region-sharded registry (`L0-strf-r008`, `L0-adr-strs`); there is no per-instance marker". Or delete it: nothing in the code refers to it.
34. `KV/bast-ent1__concept-entity.md:28` — "`initialized_flag` — bool; drives the idempotency guard… (see ASM-bast-03)" → "init state = the state of the `L0-strf-e002` InstanceRecord (`L0-strf-r008`)".
35. `KV/bast-ent2__concept-entity.md:26` — "`filled_flag`…" → "registry `looted`; the container is the loot state (`L0-strf-r008` §4)".
36. `KV/bast-ent3__concept-entity.md:25` — "`spawned_once_flag`…" → "registry `guarded`, never reset (`L0-strf-r008` §3)". `:26-27` → `L0-strf-r009`.
37. `KV/bast-as01__concept-assumption.md:15-19` — "suitable chunk" → "profile `netherFloor` of `strf`, thresholds in `L0-xasm4` §3" (row 3 of the `L0-adr-body` crosswalk).
38. `KV/bast-gl04__concept-glossary-term.md:17` — cite `L0-strf-e003`, `L0-strf-r002`. `KV/bast-gl05__concept-glossary-term.md:17` — cite `L0-strf-r009`.
39. `KV/bast-ac01__concept-acceptance-criterion.md:17-19` — the rate belongs to `L0-strf-r002` §1 and is proven by `tests/structures-roll.test.mjs:148`. The body AC → "`StructureDef.chance = 0.05`" (`src/structures/config.ts:27`). `KV/bast-ac09__concept-acceptance-criterion.md:19` — cite `L0-strf-r006`.

Outside wrdn/bast there are no copies. Searched by the same patterns plus `xcx4`, `L0-mill`, `L0-arsh`, `initialized_flag`, `chunk-load`.
