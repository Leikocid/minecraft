# Diagnose CNTR-WIND-CX02-AA — L0-wind-cx02 (duplicate of L0-airs-cx01)

ИСХОД: 3 — Подчистка знания

The conflict between §7 ("check the linked Airship once, after the Windmill") and C-12 / `L0-strf-r007` is already settled. The claim's premise is true: most of the ring is not loaded when a Windmill is placed. The claim's harm cannot happen. The shipped code took the "Alternative" the claim names, a temporary ticking area, applied per ring candidate rather than per Windmill (`decision-l0-airs-cx01`, 2026-09-26; code `b619e55`). It keeps a `pending` fallback. Two contradiction nodes are still `status:open`, and 12 KV documents still describe the pre-code design. Nothing is left for a human to decide.

**Duplicate: yes.** `L0-wind-cx02` and `L0-airs-cx01` are one fact:
- the same §7 sentence (`wind-cx02:21`, `airs-cx01:18`);
- the same constraint, C-12 / `strf-r007`;
- the same ring, 40–100;
- the same 4-chunk / 64-block figure (`wind-cx02:22`, `airs-cx01:22`);
- the same deferral proposal.

`L0-adr-link:20-22` already calls them "one issue", and `:36` closes both. The only extra in `wind-cx02` is the spawn-Windmill sentence, which is measured below. One resolution closes both nodes. `CNTR-AIRS-CX01-AA` (done, ИСХОД 3) reached the same verdict independently. Differences from that report are marked **Δ**.

## Intake

```text
OBSERVED: KV claim L0-wind-cx02 (status:open, severity low). An analysis artifact, no run or
          log behind it. The code it targets exists: src/structures/bodies/airship.ts,
          search-ring.ts, runtime.ts, place.ts, spawn-search.ts.
VERDICT:  bug by default at the fork → investigated. Result: the premise holds, the harm does
          not. Neither "evaluate only the loaded part" nor "read unloaded chunks" can happen.
          The expectations are recorded in §5.6, §7, C-12 and decision-l0-airs-cx01.
```

## Numbers re-measured

The measurement script is `scratchpad/measure-ring.mjs`. It bundles `src/` at HEAD, and its artifact is `.ai/verify/CNTR-WIND-CX02-AA/1.json`.

| Claim | Measured | Where |
|---|---|---|
| §7 "Проверку связанных Дирижаблей выполнять один раз после успешной генерации конкретной Мельницы" | verbatim | spec raw `fourstructuresspecruencopy-part-6` (§7) |
| §5.6 "search the whole 40–100 ring" | "перебрать другие подходящие позиции в жёстком радиусе 40–100 … Если во всём диапазоне … нет — не создаётся" | `fourstructuresspecruencopy-part-5` (§5.6) |
| discovery radius 4 chunks = 64 blocks | `R_DISCOVER = 4`, Chebyshev around the player's chunk | `config.ts:49`, `discovery.ts:64-67` |
| "most of a 100-block ring plus the footprint is not loaded" | **True.** Model: 4 chunks loaded around a player. With the player at the Windmill centre, **17–24 of 153–165** open candidates (11–15 %) have their whole load box loaded. With the player at the discovery edge, **28–34** (18–21 %). Measured over 4 parents. | `measure-ring.mjs`; the "~4 chunks" figure is the probe's, quoted in `decision-l0-airs-cx01:16` |
| ring + footprint reach | Candidate centres are at most 100 blocks out. The farthest block a candidate reads is **139.7 blocks** (Chebyshev 138) = **9 chunks** from the Windmill centre. That is 100 + half of the 75-long hull + the 2-block margin. | `airship.ts:24`, `templates/airship.ts:20`, `registry.ts:118` |
| candidates per ring **Δ** | **160–176**, of which **7–12** are vetoed over the plot. The count depends on the world salt and the position, so it is not a fixed 168/12. Live runs: 164/7, 176/6 and 172/10. | `search-ring.ts:47-77` |
| 10-area cap | 10. The 11th `tickingarea add` returns `successCount=0` (probe `b7876f9`, BDS 1.26.51.1). | `search-ring.ts:179-180` |
| ticking area per Windmill | Per **candidate**, not per Windmill. The ring pool has 4 names per dimension, and 2 are loaded at once. Each load box is **10–12 chunks**, under the 100-chunk limit per area. | `runtime.ts:290`, `airship.ts:75`, `search-ring.ts:85-90` |
| "returns `deferred`, resumes on later discovery visits" | The status is `pending`, not `deferred`. It is retried every 30 rounds × 20 ticks = **600 ticks** whatever the player's position, and again on restart. There is no cap. | `airship.ts:32,194-199`, `runtime.ts:32,131,149-151`, `config.ts:51` |
| "outcome recorded once" | `la=true` is written **before** the attempt, so "at most once" wins. The outcome is `ls` ∈ searching/pending/none/placed/skipped, and `none`/`placed` are terminal. A resume is not an attempt: `attempts` stays 1. | `place.ts:17,207-210`, `airship.ts:27,87-97,143-146` |
| "for the spawn Windmill, the ticking area covers the ring" | **False as a mechanism.** The spawn search releases its areas synchronously right after `placeAt` (`found.release()`, `finally releaseAll()`). The ring loader's first `tickingarea add` waits a tick. So the spawn Windmill's ring is loaded by the same ring loader as any other Windmill's. | `spawn-search.ts:269-280`, `search-ring.ts:206` |

## Investigation

```text
REPRO:    node --test tests/airship-body.test.mjs tests/structures-place.test.mjs → 26/26 pass,
          deterministic. The case the claim is about is tests/airship-body.test.mjs:318. The
          whole ring is unreadable → `pending`, the candidates are held, and retryPending() →
          `placed` with attempts 1. The companion case :335 has no loader → `pending`, and no
          Airship is placed blind.
CAUSE:    the claim's two wrong outcomes are closed by construction.
          - No read of an unloaded chunk. searchRing checks a candidate only after its ticking
            area reports every chunk loaded (search-ring.ts:128-137, 227-228). The site check
            itself returns `pending` on any unloaded chunk (site.ts:210,215,220,231).
          - No biased "no site". A candidate that cannot be loaded goes to `pending`, never to a
            reject (search-ring.ts:132-141). A ring with pending candidates ends `pending`,
            not `none` (search-ring.ts:154). `none` is reached only when every open candidate
            was read.
          - Once. The Placer writes `la=true` before the hook (place.ts:207-210). The Windmill
            reaches `done` in the same `finish` step whatever the linked outcome
            (state.ts:18,25), so it never waits in `guarded`.
PROOF:    red. The mutation "undefined remover → reject" in search-ring.ts:132 makes :318 fail with
          actual 'none', expected 'pending'. That is exactly the claim's harm. Artifact
          .ai/verify/CNTR-WIND-CX02-AA/2.red.json (tree dirty by that one-line mutation,
          then reverted).
          green. The unmodified code passes 26/26, plus the ring measurement.
          Artifact .ai/verify/CNTR-WIND-CX02-AA/1.json.
RULED OUT:
          (1) "an unloaded candidate is still read as a reject". Killed by the red mutation above,
              and live by airship_linked_ring_invalid: 170 of 170 open candidates were checked
              after loading, and none was pending.
          (2) "held linked candidates get placed by discovery on their own, giving two linked
              Airships". gate.held is read only by occupy() for a registry record with the same
              id (site.ts:344). A grep over src/ finds no other consumer.
          (3) "the spawn search holds the areas and starves the ring loader at world start".
              Its areas are released before the ring loader's first add (see the table).
              Contention can still happen with player-made areas, and then the fallback is
              `pending` plus a retry in 600 ticks.
          (4) "a crash or replay makes a second attempt". Killed live by the crash case of
              airship_linked_ring (the finish step reran → done, attempts 1), and by unit tests
              airship-body.test.mjs:234 and structures-place.test.mjs:247.
```

```text
RADIUS:   no code change. The fix is text in KV only, and it is applied by the post-wave phase,
          not here. How I looked: kv_get_subtree L0-wind / L0-airs (status=all); kv_list by tags
          linked-airship / linked-search / relates_to:*cx0* / resolves:L0-wind-cx02;
          kv_resolve_alias L0-adr-link, strf-r007, adr-spwn; doc_get on each hit; grep over src/
          and tests/ for linkedTried|tryLinked|deferred|airship:L:.
GREEN:    1.json at 250a720: 26/26 plus the measurement. The measurement still reaches the
          subject: the same test turns red on the one-line mutation (2.red.json) and green
          without it.
LIVE:     private BDS 1.26.51.1 (docker/bds-wcx02, own ports, deleted afterwards). There were two
          runs, each in a fresh world with a new salt. Run 1 was at 32f4aca; its artifact was
          overwritten, so its numbers come from its log. Run 2 was at 250a720, and its
          artifact is .ai/verify/CNTR-WIND-CX02-AA/2.json.
          - airship_linked_ring: Windmill windmill:o:239:-1, centre 3848,8, ~3,840 blocks from
            the test platform. Only ±24 blocks around it are loaded (airship-body.ts:267-270).
            Result: placed airship:linked:windmill:o:239:-1:0 at distance 90.45 (run 1) and
            90.25 (run 2), with la=true ls=placed attempts 1 in both runs. Run 1's ring had 164
            candidates, 7 vetoed over the plot.
          - The crash case of the same test: finish reran → done, attempts 1, in both runs.
          - airship_linked_ring_invalid: an all-water ring. Run 1: 176 candidates, 6 vetoed, 170
            checked. Run 2: 172 candidates, 10 vetoed, 162 checked. Every checked candidate was
            liquid → ls=none, attempts 1, not widened, 0 of 240,267 land blocks changed.
          The production code logged no unloaded-chunk error. The one UnloadedChunksError per run
          is test cleanup (see "Side finding").
```

## Resolution text (for `refine resolve L0-wind-cx02` and `L0-airs-cx01`)

> Resolved by `decision-l0-airs-cx01` (2026-09-26), implemented in `b619e55`, and re-measured on 2026-09-29 against `src/` at `32f4aca` (unchanged through `250a720`).
>
> "Once" = one attempt per Windmill. `la=true` is written before the attempt (`place.ts:207-210`). The outcome is `ls` ∈ searching/pending/none/placed/skipped, where `none` and `placed` are terminal.
>
> The ring is read only after each candidate's chunks are loaded by a temporary ticking area:
> - the pool has 4 names per dimension, with 2 loaded at once;
> - each area covers 10–12 chunks;
> - the engine's cap is 10 areas (probe `b7876f9`).
>
> A candidate that cannot be loaded leaves the attempt `pending`, never `none`. A pending attempt is retried every 600 ticks and after restart, with no cap.
>
> The spawn Windmill's ring is loaded the same way. The spawn search releases its own areas before the ring loader adds any.
>
> Measured:
> - rings have 160–176 candidates, of which 7–12 are vetoed over the plot;
> - a candidate reads up to 139.7 blocks (9 chunks) from the Windmill centre;
> - with 4 chunks loaded around a player at the Windmill, only 11–15 % of candidates are fully loaded (18–21 % with the player at the discovery edge), which is why the loader exists.
>
> Evidence:
> - unit tests: 26/26 (`.ai/verify/CNTR-WIND-CX02-AA/1.json`);
> - red mutation: `2.red.json`;
> - live on BDS 1.26.51.1 (`2.json`): a linked Airship was placed 90.45 and 90.25 blocks out with only the Windmill plot loaded, and an all-water ring was read in full (170/170 and 162/162 over two runs) and ended `none`.
>
> `L0-wind-cx02` and `L0-airs-cx01` are one issue and close together.

## Copies to fix (file:line — replace → with)

Paths are under `.ai/context/analysis/`. Every line number was counted from `doc_get` output.

- `nodes/wind-cx02__concept-contradiction.md`
  - `:13` `status:open` → `status:resolved`.
  - `:19` `**Status:** open.` → `**Status:** resolved — decision-l0-airs-cx01; duplicate of L0-airs-cx01.`
  - `:25` "attempt returns `deferred` and resumes on later discovery visits … For the spawn Windmill, the ticking area covers the ring … Alternative: a temporary ticking area per Windmill" → "As built: temporary ticking areas per ring candidate (pool 4, 2 at once). Unloadable → `ls=pending`, retried every 600 ticks and after restart. The spawn Windmill's ring uses the same loader."
  - `:27` "Needed: `airs` deep-dive …" → "Closed together with L0-airs-cx01."
- `nodes/airs-cx01__concept-contradiction.md`
  - `:13` `status:open` → `status:resolved`.
  - `:29` Recommendation (c) → "Superseded: the ring is loaded by temporary ticking areas (decision-l0-airs-cx01). (c)'s `pending` survives only as the fallback when an area cannot be added or loaded."
  - `:31` "that artifact was never written — this filing supersedes …" → "L0-wind-cx02 exists; one issue (L0-adr-link:20-22)."
- `nodes/adr-link__concept-architecture-decision.md`
  - `:25` "`tryLinked` returns `placed | none | deferred` … `x.linkedTried` set only on `placed`/`none`" → "`LinkedAirships.start` (airship.ts:93). `la=true` is written before the attempt. The outcome is `ls` (airship.ts:32)."
  - `:29` "recorded once in `x.linkedTried`. Retries touch only the … `pending` … retry only when discovery next evaluates a chunk" → "one attempt (`la`). A pending attempt reruns the seeded ring every 600 ticks and after restart. A resume is not an attempt."
  - `:30` "A candidate earlier in order that is still `pending` blocks a later valid one … independent of player movement" → "The first candidate in the seeded order that loads and validates wins. A pending one does not block later ones (search-ring.ts:132-141). Loading does not depend on the player."
  - `:31` "costs one record field and no ticks. If the player never loads the ring …" → "costs one retry per 600 ticks. It resolves without the player, because the ring is loaded by ticking areas."
  - `:32` "runs inside the one-time tickingarea sweep (L0-adr-spwn)" → "starts from the same Placer hook when the spawn search places `windmill:spawn`. The ring loader loads its ring after the sweep's areas are released."
  - `:34` "`airship:L:<parentId>`" → "`airship:linked:<parentId>:<slot>`; replay-safe via `la` and the reserved spot `lo` (airship.ts:29,151-159)."
- `nodes/wind-ad03__concept-architecture-decision.md`
  - `:6` and `:16` "`afterInit` hook … `x.linkedTried`" → "the Placer's `finish` step (`linked` hook) … `la`/`ls`".
  - `:26` "`afterInit` calls `airs.tryLinked(…)` … returns `placed | none | deferred`" → "the `linked` hook calls `LinkedAirships.start(parent)` after `la=true`. The outcome is `ls`."
  - `:27` "set `x.linkedTried = {o: outcome}` and advance to `done`" → "the Windmill reaches `done` in the same step, whatever the outcome."
  - `:28` "`deferred` → stay in `guarded`; retry when discovery next sees the Windmill's chunk" → "`ls=pending`. Retried every 600 ticks and on restart. The Windmill does not wait in `guarded`."
  - `:29` "`airship:L:<parentId>`" → "`airship:linked:<parentId>:<slot>`".
- `nodes/wind-r012__concept-rule.md`
  - `:22` "`afterInit` hook" → "the Placer's `finish` step (`linked` hook, place.ts:205-211)".
  - `:23` "recorded in `InstanceRecord.x.linkedTried` with its outcome. It is never repeated" → "`la=true` before the attempt; the outcome is in `ls`. A `pending` attempt is resumed, never restarted as a second attempt."
- `nodes/wind-p004__concept-process.md`
  - `:28` "`def.afterInit(ctx)`: if `record.x.linkedTried` … `airs.tryLinked` … `x.linkedTried = true` with outcome" → "`body.linked(ctx)` when `la` is unset: first `la=true`, then `LinkedAirships.start`. The outcome is in `ls`."
  - `:33` "`windmill:S` … while the ticking area is still active" → "`windmill:spawn` (spawn-search.ts:23). Its ring is loaded by the ring loader after the spawn search released its own areas."
- `nodes/wind-ac16__concept-acceptance-criterion.md`
  - `:21` "`x.linkedTried` set once with an outcome" → "`la=true` once, with `ls` ∈ {placed, none}".
  - `:22` "`airship:L:<windmillId>`" → "`airship:linked:<windmillId>:<slot>`".
- `nodes/wind-g006__concept-glossary-term.md`
  - `:17` "Recorded … as `x.linkedTried`; … id is `airship:L:<windmillId>`" → "Recorded as `la` (tried) + `ls` (outcome); id `airship:linked:<windmillId>:<slot>`."
- `nodes/wind__concept-component.md`
  - `:41` "One `airs.tryLinked(parentInstance)` call …, recorded as `x.linkedTried`" → "One `LinkedAirships.start(parent)` per instance, recorded as `la` + `ls`."
  - `:51` the open risk → "resolved: the ring is loaded by temporary ticking areas (decision-l0-airs-cx01)."
  - Adjacent: `:21` "No structure code exists yet" is stale beyond this claim. The code shipped in v1.2.0 (`src/structures/`).
- `nodes/airs__concept-component.md`
  - `:29` "calls `airs.tryLinked(parentInstance)` from its own `afterPlace` hook" → "is started by the Placer's `finish` step (`la` first)."
  - `:33` "`wind`'s `afterPlace` hook call `airs.tryLinked(...)`" → "the Placer's `linked` hook (bodies.ts:80)."
  - `:46` the open risk → resolved, as for `wind:51`.
  - Adjacent: `:21` has the same stale "No structure code exists yet".
- `nodes/airs-r004__concept-rule.md`
  - `:20` "`airs.tryLinked(...)` from its own `afterPlace` hook, guarded by `linkedTried`" → "… from the Placer's `finish` step, guarded by `la`".
  - `:25` "Chunk-loading of far ring candidates is not guaranteed … open contradiction" → "Far ring candidates are loaded by temporary ticking areas. One that cannot be loaded leaves the attempt `pending`."
- `nodes/airs-e002__concept-entity.md`
  - `:20-22` the `tryLinked` signature → "`LinkedAirships.start(parent: Instance): void`, called by the Placer's `linked` hook after `la=true`."
  - `:35` "no partial/deferred state persisted for a failed search" → "an unreadable ring persists `ls=pending` and is resumed. Only a fully read ring with no valid spot ends `none`."
- `decisions/decision-l0-airs-cx01-zagruzka-chankov-koltsa-privyazanno.md`
  - `:16` and `:35` "кольцо 40-100 блоков это до 7 чанков от центра" → "центры кандидатов — до 100 блоков (7 чанков), а читаемая область кандидата — до 140 блоков (9 чанков) от центра Мельницы".
  - `:22` and `:41` "по флагу linkedTried" → "по флагу `la` (исход — `ls`)".
- Adjacent: in `nodes/wind-as11__concept-assumption.md`, `:13` the tag `needs-probe` → measured. `b7876f9` found a 10-area cap; the 11th add returns `successCount=0`.

Code note, not a defect: `tests/structures-registry.test.mjs:126` and `src/selftest/main.ts:236` write an extras key named `linkedTried`. There it is an arbitrary key for a persistence round-trip. The production key is `la` (`place.ts:17`).

## Side finding — test-harness cleanup (not fixed here, handed to the operator)

```text
OBSERVED: both live runs (2 of 2), in dist/bds-gametest.log right after onTestPassed airship_linked_ring:
          "Unhandled promise rejection: UnloadedChunksError: Block Volume contains (12, then 10)
          unloaded chunk(s) out of (12, then 10) at fillBox → removeStructure → removeAirship".
CAUSE:    src/gametest/airship-body.ts:359 (and :291) queue removeAirship for ring Airships
          90 blocks from their Windmill. The test loads only ±24 blocks around each Windmill
          (:267-270), and the ring loader has already released the Airship's area
          (search-ring.ts:150-152). The `finally` at :368-372 runs the cleanups unguarded. The
          first throw skips the other cleanups and every `unloads` entry, which leaves
          andrew_gt_as_ring_w/_w2, 2 Windmills and 2 Airships in the GameTest world. The same
          pattern is at :470 (no_merge) and :506 (roll case); those tests were not run here.
IMPACT:   masked. loadBox clears leftover areas with `tickingarea remove_all` when it hits the
          cap (structures-place.ts:108-125). The GameTest world is recreated on every run, and
          the verdicts are unaffected. Every full-suite log carries this ERROR line.
FIX:      remove ring Airships under their own loadBox. loadBox waits with test.idle, so either
          run those cleanups before test.succeed() or use system.runTimeout waits. Run each
          cleanup in its own try, so `unloads` always runs.
WHY NOT HERE: the task limits the change to this diagnosis (CLAUDE.md "Who cuts tasks":
          it would change something I was told not to touch). No card was filed.
```
