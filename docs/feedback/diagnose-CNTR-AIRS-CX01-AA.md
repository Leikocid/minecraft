# Diagnose CNTR-AIRS-CX01-AA — L0-airs-cx01 (+ L0-wind-cx02)

ИСХОД: 3 — Подчистка знания

The conflict between §7 ("check the linked Airship once") and C-12 / `L0-strf-r007` is already settled. The decision is `decision-l0-airs-cx01-…` (2026-09-26, commit `b45fdcd`), and the code is `b619e55` (AIRS-BODY-01-AA). The harm the filing describes cannot happen in the shipped code. Two contradiction nodes are still `status:open`, and eight KV documents still describe the pre-code design. Nothing is left for a human to decide.

## Intake

```text
OBSERVED: the KV claim L0-airs-cx01 is an analysis artifact with no run or log behind it. Its
          sibling L0-wind-cx02 states the same conflict. Both are tagged status:open. The code
          for the linked attempt exists: src/structures/bodies/airship.ts, search-ring.ts,
          runtime.ts, place.ts.
VERDICT:  bug (default at the fork) → investigated. Result: the property is not live.
          Neither harm in the claim can happen: a site lost forever to an unloaded chunk, or
          a recheck loop that breaks "once". The expectations are recorded in §5.6, §7,
          C-12 and decision-l0-airs-cx01.
```

## Numbers re-measured

Each number was measured with the same operation that produced it. The measurement script is `scratchpad/ring-measure.mjs`. It bundles the shipped `src/` and has its own run-check artifact.

| Claim | Measured | Where |
|---|---|---|
| Windmill footprint ~35×35 | `PLOT = 35` → `WINDMILL_SIZE [35,31,35]` | `src/structures/templates/windmill-fields.ts:17`, `windmill.ts:17` |
| Ring 40–100 | `LINKED_RING {rMin 40, rMax 100, radialStep 10, arcStep 16}`. Candidate centres measure 40.0–100.0. | `src/structures/bodies/airship.ts:24` |
| Loaded radius ~4 chunks / 64 blocks | `R_DISCOVER = 4` chunks (64 blocks). `tick-distance` is not set in `docker/*/server.properties`, so the BDS default applies. I did not measure the engine's own radius. | `src/structures/config.ts:49` |
| "Ring can reach 100 blocks" | A footprint centre is at most 100 blocks out, but the farthest block the search loads is **140** from the Windmill centre (**9 chunks** Chebyshev): 100 + half of the 75-long hull + a 2-block margin. | `templates/airship.ts:20` `AIRSHIP_SIZE [75,18,13]`; `registry.ts:118` `COLLISION_MARGIN = 2` |
| Candidates in the ring | 168 in total. 12 are vetoed over the Windmill plot before any read. The order is seeded, and a second call gives the same order. | `ringCandidates`, `search-ring.ts:47-77` |
| "`L0-wind-cx02` was never written" | **False.** It exists and is `status:open` (`kv_contradictions node_id=L0-airs`). | `.ai/context/analysis/nodes/wind-cx02__concept-contradiction.md` |
| Retry cadence | `LINKED_RETRY_ROUNDS 30` × `DISCOVER_INTERVAL_TICKS 20` = 600 ticks (≈30 s) | `runtime.ts:32`, `config.ts:51`, `runtime.ts:131` |
| Ticking-area budget | `RING_AREA_POOL 4`, `RING_PARALLEL 2`, `ADD_RETRIES 30`, `LOAD_TIMEOUT_TICKS 300`. One candidate's load box is at most 79×17 blocks, which is 6×2 = 12 chunks. That is under the engine's 100-chunk limit per area. | `runtime.ts:290`, `airship.ts:75`, `search-ring.ts:175-176` |

## Investigation

```text
REPRO:    npm test on the linked-attempt suites (node --test tests/airship-body.test.mjs
          tests/structures-place.test.mjs): 26/26 pass, deterministic. The case the claim
          is about is tests/airship-body.test.mjs:318. Every ring chunk is unreadable →
          outcome `pending` (not `none`), and the linked candidates are held. When the
          chunks become readable, retryPending() → `placed`, and attempts stays 1.
CAUSE:    the conflict was settled by the ticking-area variant that L0-wind-cx02 lists as
          its "Alternative". It is not settled by options (a), (b) or (c) of L0-airs-cx01:
          - once: the Placer writes `la=true` before calling the hook, so "at most once" wins
            (src/structures/place.ts:207-210, bodies.ts:80 → LinkedAirships.start,
            airship.ts:93);
          - C-12: each candidate's chunks are loaded by a temporary ticking area. The site
            check runs only after isChunkLoaded && getBlock succeed
            (search-ring.ts:184-235). An unloaded candidate goes to `pending` and is never
            rejected (search-ring.ts:132-141);
          - resolution: `ls` on the parent record holds searching|pending|none|placed|skipped.
            A pending attempt reruns every 600 ticks (runtime.ts:131). After a restart
            resumeUnfinished relaunches every attempt with la=true that is not terminal
            (airship.ts:109-118, runtime.ts:150). There is no cap.
PROOF:    run-check artifact .ai/verify/CNTR-AIRS-CX01-AA/2.json (tests 26/26, and the ring
          measurement above). There is no red check. No fix is needed because the harm is
          absent. A red check can only be written against a defect that exists.
RULED OUT: (1) "an unloaded ring candidate is still read as a reject, e.g. an undefined
          surface sample taken as air or liquid". Killed by airship-body.test.mjs:318: with
          the whole ring unreadable the status is `pending`, not `none`. The site check
          returns `pending` on every unloaded branch (site.ts:210, 215, 220, 231).
          (2) "the once-guard can be beaten by a crash or replay into a second attempt".
          Killed by airship-body.test.mjs:234 (crash after the flag → resume → attempts
          stays 1) and structures-place.test.mjs:247 ("linked attempt is optional and runs
          at most once"). Both are green in 2.json.
```

Behaviours the claim does not cover, measured from the code rather than taken on faith:
- **The result does not depend on where the player walks.** The search loads its own chunks. A candidate is `pending` only when the engine refuses an area (the 10-area cap is shared with other users) or the load times out after 300 ticks.
- **Worst-case cost of `pending` without a cap.** This is computed from constants, not measured live. With every area refused, one pass takes 156 open candidates in 78 batches. Each batch costs about 301 ticks (≈19.6 min per pass) and sends 2 `tickingarea add` commands every 10 ticks. The next pass comes 600 ticks or less later. It reads no blocks and scans no chunks. The decision chose `pending`, never lost, so this is not a defect. It does mean the zero-cost rationale in ADR-L0-link §3 is false (see below).
- **Spawn Windmill.** Its attempt starts right after `placeAt` (spawn-search.ts:561) and uses the same ring loader (`andrew_ring_o_*`). The spawn search's own windows play no part. At most 4 spawn windows + 2 ring areas are open at once, which is within the 10-area cap.

## Fix design

```text
RADIUS: no code changes. The fix is text only, in the KV documents listed below. Their
        readers are /plan and /execute agents reading through kv_search/doc_get, plus the
        next analyze --incremental run. How I looked: kv_contradictions node_id=L0-airs;
        kv_list node_prefix L0-airs and L0-adr-link; kv_search "linkedTried airship:L:
        deferred tryLinked afterInit ring pending retry"; doc_get of every hit; for code,
        grep -rn "linked|tryLinked|linkedTried" src. Not a restriction.
```

## Proof

```text
GREEN: the same suites, same command, artifact .ai/verify/CNTR-AIRS-CX01-AA/2.json
       (re-recorded after this commit). It reaches the right thing: the bundle is built
       from src/ at HEAD. The unreadable-ring test asserts the held candidate ids
       `airship:linked:<windmill>:*` and asserts `attempts === 1`, so a test that silently
       never ran the ring could not pass.
LIVE:  not run in this session. At 21:2x andrew-bds-ci (port 19136) was being recreated by
       another session ("Up 12 seconds", then "Up 20 seconds"). A bds:gametest run of mine
       would have recreated that container under it. Earlier live evidence exists but I
       did not re-run it:
       AIRS-BODY-01-AA (2026-09-26): GameTest andrew:airship_linked_ring passed on BDS
       1.26.51.1 with a Windmill in a far chunk and only its plot loaded, so the ring was
       loaded by the production engineRingLoader. That was with the 28-long hull.
       32f4aca (2026-09-29, 75-long hull): the commit message says "Full suite 93/93".
       That is a self-report and I did not open its artifact.
```

## Resolution text (refine resolve — L0-airs-cx01 and L0-wind-cx02, one issue)

> Resolved by `decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno` (2026-09-26, b45fdcd) and implemented in b619e55 (AIRS-BODY-01-AA). "Once" means one attempt per Windmill instance: the Placer writes `la=true` before the hook (place.ts:207-210). Ring chunks are loaded through temporary ticking areas (pool 4, 2 at once, search-ring.ts:184-235). So no validity read touches an unloaded chunk, and the outcome does not depend on player movement. If a candidate's chunks cannot be loaded (area refused, or not loaded within 300 ticks), the attempt stays `ls=pending` and is never set to `none`. It is retried every 30 discovery rounds (600 ticks) and resumed after a restart, with no cap. Measured: plot 35×35; ring 40–100 = 168 candidates, 12 vetoed over the plot; the farthest loaded block is 140 from the Windmill centre (9 chunks), against a discovery radius of 4 chunks (64 blocks). npm tests 26/26, including unreadable ring → pending → retry → placed with attempts = 1 (run-check CNTR-AIRS-CX01-AA/2.json). Options (a), (b) and (c) of L0-airs-cx01 are superseded by the ticking-area variant from L0-wind-cx02. The claim that "L0-wind-cx02 was never written" is false.

## Copies to fix (file:line — what → with what)

These paths are under `.ai/context/analysis/`. Line numbers count from the file's first `---`.

1. `nodes/airs-cx01__concept-contradiction.md:13`: `status:open` → resolved, with `resolved_by:decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno` (through refine resolve).
2. `nodes/airs-cx01__concept-contradiction.md:31`: "that artifact was never written — this filing supersedes that forward reference" → "`L0-wind-cx02` exists; the two filings are one issue (ADR-L0-link)".
3. `nodes/wind-cx02__concept-contradiction.md:13` and `:19`: `status:open` / "**Status:** open" → resolved (same resolution).
4. `nodes/wind-cx02__concept-contradiction.md:27`: "Needed: `airs` deep-dive to adopt the deferral contract or choose the ticking-area variant" → "Chosen: the ticking-area variant (decision-l0-airs-cx01); deferral is only the fallback when an area cannot be loaded".
5. `nodes/adr-link__concept-architecture-decision.md:25`: "`x.linkedTried` is set only on `placed`/`none`" → "`la` is set before the attempt (place.ts:207-210); the outcome lives in `ls`".
6. `nodes/adr-link__concept-architecture-decision.md:29` (§1): "Retries touch only the ring candidates that were `pending` … a retry happens only when `strf` discovery next evaluates a chunk that holds a pending candidate" → "The ring is loaded by temporary ticking areas. A pending attempt re-searches the whole seeded ring every 30 discovery rounds (600 ticks) and after restart."
7. `nodes/adr-link__concept-architecture-decision.md:30` (§2): "A candidate earlier in order that is still `pending` blocks a later valid one. This keeps the result independent of player movement." → "Pending candidates are skipped. The first candidate in seeded order that loads and validates wins (search-ring.ts:114-155). Player movement plays no part because the search loads its own chunks." **This changes meaning, not only wording:** the code does not implement the blocking rule, and it has no reason to now that loading is active.
8. `nodes/adr-link__concept-architecture-decision.md:31` (§3): "A pending attempt costs one record field and no ticks. If the player never loads the ring, the linked Airship simply never exists." → "No cap. A pending attempt costs one ring pass per retry: up to 156 candidates in 78 batches, ≤ ~301 ticks each when areas are refused. It persists only while ticking areas cannot be had."
9. `nodes/adr-link__concept-architecture-decision.md:32` (§4): "runs inside the one-time tickingarea sweep (`L0-adr-spwn`)" → "starts right after the spawn Windmill's `placeAt`, through the same ring loader as any Windmill".
10. `nodes/adr-link__concept-architecture-decision.md:34` (§6) and `nodes/wind-ad03__concept-architecture-decision.md:29`: "`airship:L:<parentId>`" → "`airship:linked:<parentId>:<slot>` (airship.ts:38); replay is blocked by `la`/`ls`/`lo` on the parent record".
11. `nodes/wind-ad03__concept-architecture-decision.md:26-28`: "`WindmillDef.afterInit` calls `airs.tryLinked(…)` … returns `placed | none | deferred`; `placed`/`none` → set `x.linkedTried = {o: outcome}` …; `deferred` → stay in `guarded`; retry when discovery next sees the Windmill's chunk" → "The Placer's `finish` step calls the body's `linked` hook → `LinkedAirships.start(parent)`; `la=true` is written first; the Windmill reaches `done` at once; the outcome is `ls` = searching|pending|none|placed|skipped; `pending` is retried every 600 ticks and resumed after restart".
12. `nodes/wind-r012__concept-rule.md:23`: "the attempt is recorded in `InstanceRecord.x.linkedTried` with its outcome" → "the attempt is marked `la=true` before it starts; its outcome is `ls`; `skipped` (the Airship type is disabled when the Windmill finishes) spends the attempt (runtime.ts:112-116)".
13. `nodes/airs-r004__concept-rule.md:25`: "Chunk-loading of far ring candidates is not guaranteed … see the open contradiction `L0-airs-cx01`" → "Ring chunks are loaded through temporary ticking areas (decision-l0-airs-cx01); a candidate that cannot be loaded leaves the attempt `pending`, never rejected".
14. `nodes/airs-e002__concept-entity.md:21-22`: "`function tryLinked(parentInstance: InstanceRecord): void`" → "`LinkedAirships.start(parent: Instance): void` (airship.ts:93)". Also `:35`: "there is no partial/deferred state persisted for a failed search" → "persisted on the parent record: `ls` and `lo` = {id, origin} of the reserved spot; a pending or interrupted attempt is resumed".
15. `nodes/airs__concept-component.md:46` (Key risks): the §7-vs-C-12 bullet → "Resolved: ring loaded through temporary ticking areas; `pending` only when loading fails (decision-l0-airs-cx01, b619e55)". `:21`, `:26` and tag `not-implemented` at `:13` ("analysis only … No structure code exists yet", "~15×7×10–12") are already covered by the open `L0-xcx12`. They matter here only because the ring's reach depends on the hull (75×18×13).
16. `decisions/decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno.md:16` and `:35`: "кольцо 40-100 блоков это до 7 чанков от центра" → "до 9 чанков от центра (140 блоков: 100 до центра корпуса + половина 75-блочного корпуса + отступ 2)". The number went stale when the hull grew to 75 blocks in v1.2.0.

No cards were created and nothing was written to KV. Every item above goes to the phase that runs after the wave.
