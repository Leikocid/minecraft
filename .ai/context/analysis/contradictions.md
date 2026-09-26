---
title: Contradictions
type: analysis
generated_at: "2026-09-26T08:34:28.652Z"
source_channel: rollout
node_id: rollout-contradictions
aliases: ["rollout-contradictions","contradictions"]
is_a: ["rollout","contradictions"]
relates_to: ["L0-airs-cx01","L0-scyt-cx01","L0-scyt-cx02","L0-strf-cx01","L0-strf-cx02","L0-wind-cx01","L0-wind-cx02","L0-xcx4","L0-xcx6","L0-xcx7"]
priority: 530
---

# Contradictions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### Contradiction — \ (L0-airs-cx01)

# Contradiction — "check the linked Airship once" (§7) vs the loaded-footprint guarantee (C-12)

**Statement A (spec §7, performance strategy).** "Проверку связанных Дирижаблей выполнять один раз после успешной генерации конкретной Мельницы." The linked-Airship check runs exactly once, right after the Windmill's own generation succeeds.

**Statement B (`L0-strf-r007`, C-12; `L0-strf-p002` step 2).** Every footprint probe requires its chunks to be loaded; an unloaded chunk returns `pending`, not a definitive reject, and is revalidated once loaded.

**Conflict.** A Windmill's own footprint (~35×35) is small enough to be loaded when it is placed, but the linked-Airship ring extends 40–100 blocks out — well past the loaded radius in many cases (a single player's simulation distance is commonly ~4 chunks / 64 blocks, per `L0-strf-as03`, and the ring can reach 100 blocks in any direction). If `airs.tryLinked` runs its search once and treats every unloaded ring candidate as a hard reject rather than `pending`, valid sites that happen to be in not-yet-loaded chunks are lost forever, even though they would have validated once the player walked closer. If instead it defers and retries later, that violates the "once" wording of §7 and reintroduces exactly the kind of recheck loop §7 is trying to avoid.

**Options.**
- (a) Treat unloaded ring candidates as `pending` and skip them for this attempt only; the search still completes once and never retries. Cheap, matches "once" literally, but silently misses some genuinely valid linked Airships near the edge of the loaded area.
- (b) Defer the whole `tryLinked` attempt (not just a candidate) until every chunk in the full [40,100] ring is loaded, then run it once. Matches §7's "once" but may never fire for a Windmill a player never fully circles.
- (c) Amend §7 for this case only: "once" means one *attempt*, not one *validation pass* — unloaded candidates are retried opportunistically the next time discovery revisits that chunk, capped at a small number of total tries, reusing `strf`'s existing `pending` deferral (`L0-strf-r007`).

**Recommendation.** (c) — it needs no new mechanism, only reusing the existing deferral path for the ring's individual candidates while keeping the *outer* `linkedTried` flag set only once the attempt fully resolves (found, or ring exhausted with everything loaded).

**Needs.** Confirmation this reading of "один раз" (once) is acceptable, or an explicit bound on how many discovery cycles a deferred linked search may span. Note: `wind`'s own component narrative already anticipated this exact tension under the id `L0-wind-cx02`, but that artifact was never written — this filing supersedes that forward reference and targets `L0-airs`, since `airs` owns the ring search's resolution.






### CX-scyt-01 · Scythe sub-scopes have children but no component nodes, and targeting has no nodes at all (L0-scyt-cx01)

# CX-scyt-01 · Scythe sub-scopes have children but no component nodes, and targeting has no nodes at all

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-sprj-cx03", "L0-sitm", "L0-sprj"]` · **Target:** `L0` · **Category:** scope overlap and graph hygiene · **Severity:** medium · **Status:** open.

**Checked, not assumed** (`kv_list node_prefix "L0-s"`, `ls nodes/`, 2026-09-24):
- `L0-sitm-*` (3 nodes) and `L0-sprj-*` (32 nodes) are live, and each declares `part_of: L0-sitm` / `L0-sprj`. **Neither** `sitm__concept-component` nor `sprj__concept-component` exists.
- `L0-sprj` children cite `L0-sprj-p001…p004`, `r001…r004`, `ent1…ent3`, `ac01…ac04`. None of these are live.
- `L0-stgt` / `L0-sctg` (targeting) have **no** live artifacts. `L0-sprj` depends on its `selectTarget`.
- The L0 decomposition plan lists only `scyt` for the whole Scythe. So `sitm`/`sprj` overlap with this node's scope, under a different parent.

**Interim, done here:** `L0-scyt` acts as the umbrella. It owns targeting (`p001`, `r001`–`r003`, `ac01`–`ac04`), restates the missing `sprj` contract (`p002`, `p003`, `r004`–`r008`), and links to the live `sitm`/`sprj` children.

**Needed from L0:** either re-parent `sitm`/`sprj` under `L0-scyt` (as `L0-scyt-*` sub-components) or add their component nodes. Then regenerate the rollups (together with `L0-sprj-cx03`).






### CX-scyt-02 · Projectile tuning disagrees: 0.5 vs 0.6 block/tick, and turn-limited vs pure pursuit (L0-scyt-cx02)

# CX-scyt-02 · Projectile tuning disagrees: 0.5 vs 0.6 block/tick, and turn-limited vs pure pursuit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-sprj-ad02", "L0-sprj", "L0-scyt-p002"]` · **Target:** `L0-sprj` · **Category:** source vs source · **Severity:** low · **Status:** open.

- **`L0-sprj-ad02` (live):** constant speed **0.5** block/tick (ASM-018), **no** turn-rate limit.
- **`project-knowledge/domain-model.md` → `L0-scpr-ent2` (rollup):** speed **about 0.6** block/tick (ASM-029), with a "maximum turn rate", a 1.0 hit radius, a 5-tick stagger and a 200-tick lifetime.

**Why it matters:**
- The speed sets how long a volley lasts, so it sets how often the leash or an expiry decides the outcome (AC-sprj-08/13).
- A turn limit changes whether a target that dodges sideways can be missed.
- The ASM number also clashes: ASM-018 against ASM-029.
- GameTest timing windows must use one set of numbers.

**Proposed:** follow the live `L0-sprj-ad02` (0.5 block/tick, pure pursuit) and adopt the rollup's stagger, lifetime and hit radius where `sprj` is silent. Keep all of them in one exported `SCYTHE_TUNING` constant. **L0 decides.** This node does not resolve it.






### Contradiction — the test convention \ (L0-strf-cx01)

# Contradiction — the test convention "arm production modules inside the gametest pack" vs the single-registry invariant (C-7)

**Statement A (project practice, measured on BDS 1.26.51.1; see the Web Sword epic, commit `1bbcea5`).** SimulatedPlayers are not marshalled into packs that do not load the beta gametest module. GameTests therefore **import and register the production module inside the gametest pack**. Dynamic properties written by one pack are invisible to the other.

**Statement B (`L0-strf-r008`, C-7, §6/§11).** Exactly one durable registry decides whether a structure exists. Re-load never creates a second copy.

**Conflict.** If both the release pack and the gametest pack run `strf` discovery in the same BDS world, each has its **own** salt and registry. Both would generate structures on the same chunks, placing different rotations over each other, filling chests twice and doubling guards. Also, the release pack's discovery reads `getAllPlayers()` entries that are unreadable for SimulatedPlayers. So the GameTest cannot drive the release pack's `strf` at all.

**Proposed resolution** (see `L0-strf-d003`). `strf` exposes `startStrf({ owner })`. The release pack calls it only if the gametest pack is **not** present. Detection uses a `scriptevent andrew:strf_owner` handshake at startup: the gametest pack claims ownership, and the release pack yields. BDS structure tests therefore run the gametest pack's copy exclusively.

**Needs.** Confirmation that the handshake is acceptable for `infr`'s harness. Alternative: a separate BDS world profile without the release pack for structure tests.






### Contradiction — the spawn-area search radius (§4.7) vs discovery-only loading (C-5b, C-12) (L0-strf-cx02)

# Contradiction — the spawn-area search radius (§4.7) vs discovery-only loading (C-5b, C-12)

**Statement A (§4.7.7–9, test 14).** On a new world's first start, search 5×5 chunks around world spawn, then outward up to **500 blocks**, choose the *nearest* valid site, and only then fall back to forced preparation. The Windmill "всё равно появится" (100 %).

**Statement B (C-5b, C-12, `L0-strf-r007`).** Chunks are evaluated only when a player's presence has loaded them, and nothing is read from or written into unloaded chunks.

**Conflict.** At first start only ~4–10 chunks around the player are loaded, and chunks 500 blocks out do not even exist yet. To find the *nearest* valid site within 500 blocks, `wind` must force-load (generate) up to ~3 000 chunks. The only stable means is `/tickingarea add` through `runCommand`, limited to 10 areas. That is neither "discovery from player positions" nor cheap. Waiting for the player to explore breaks "guaranteed at first start".

**Options.**
- (a) Amend C-5b: allow one bounded, one-time `tickingarea`-driven sweep for the spawn Windmill (rings of chunks, ≤ 10 areas at a time, removed afterwards). Cost: seconds of generation at world start.
- (b) Search only the loaded area around spawn (≈ 9×9 chunks), then force-prepare the best dry site found there. This deviates from "nearest valid ≤ 500 blocks" but keeps the 100 % guarantee.

**Recommendation.** (a) with a time cap of 60 s, falling back to (b) on timeout. Record either as a deviation. `wind` owns the policy; `strf` provides `isLoaded`/`searchRing` and the tickingarea helper.






### CX-wind-01 · The spawn Windmill is \ (L0-wind-cx01)

# CX-wind-01 · The spawn Windmill is "100 %" but must be on dry land — undefined when there is no dry land within 500 blocks

**Links:** `part_of: ["L0-wind"]` · `is_a: ["contradiction"]` · `relates_to: [L0-wind-r007, L0-wind-p002, L0-wind-e002]`
**Target:** `L0-wind` · **Category:** assumption-gap · **Severity:** medium · **Status:** open.

- §4.7.6: the spawn Windmill is mandatory, 100 %. §11 DoD: "фактически гарантирована".
- §4.7.9 / §9.1: forced prep picks "лучшую доступную **сухую наземную** позицию"; "при наличии сухой позиции форсировать".
- A world spawning on a small island or in a large ocean area (possible on custom seeds, or when the only land within 500 blocks is covered by villages/structures) has no eligible position. The spec says nothing about this case. Forced prep may replace liquids, which could mean building on water — but that contradicts "сухую".

**Options:**
- (a) Record `status:"failed", reason:"noDryLand"`, no spawn Windmill, deviation logged. **Autopilot default** — keeps the "dry land" and "don't damage structures" rules intact.
- (b) Relax to "least-wet" site: allow shallow liquid (≤ 3 deep) to be filled as part of prep.
- (c) Extend the radius beyond 500.

Needs a client answer; the BDS test uses a normal seed, so it does not block implementation.






### CX-wind-02 · \ (L0-wind-cx02)

# CX-wind-02 · "Check the linked Airship once, right after the Windmill" vs never touching unloaded chunks

**Links:** `part_of: ["L0-wind"]` · `is_a: ["contradiction"]` · `relates_to: [L0-wind-r012, L0-wind-ad03, L0-strf-r007, L0-airs]`
**Target:** `L0-airs` · **Category:** spec vs constraint C-12 · **Severity:** low · **Status:** open.

- §7: "Проверку связанных Дирижаблей выполнять один раз после успешной генерации конкретной Мельницы." §5.6: search the whole 40–100 ring before giving up.
- C-12 / `L0-strf-r007`: no validity read in an unloaded chunk. A normal Windmill is placed when a player is near its plot (discovery radius 4 chunks = 64 blocks), so most of a 100-block ring plus the Airship's footprint is usually **not loaded** at that moment.
- Read literally, "once, right after" gives one of two wrong outcomes: evaluating only the loaded part of the ring (biased, often "no site"), or reading unloaded chunks (forbidden).

**Proposed reading (`L0-wind-ad03`):** "once" = one *completed* attempt. While ring chunks are unloaded, the attempt returns `deferred` and resumes on later discovery visits; the outcome is recorded once. For the spawn Windmill, the ticking area covers the ring, so its attempt completes at start. Alternative: a temporary ticking area per Windmill (more load, 10-area cap).

**Needed:** `airs` deep-dive to adopt the deferral contract or choose the ticking-area variant.






### Contradiction: v1 constraint C-5 vs structure generation (resolved) (L0-xcx4)

# Contradiction: v1 constraint C-5 vs structure generation (resolved)

**Links:** `is_a: ["contradiction"]` · `relates_to: ["L0-strf", "L0-strf-p005", "L0-adr-strc", "L0-adr-spwn", "L0-wrdn", "L0-bast"]` · **target_node:** `L0` · **status:** resolved · **resolved_by:** `L0-adr-spwn`

**Statement A (L0 C-5, v1).** "No permanent global per-tick world scans. Short-lived tick loops allowed **only while temporary objects (Scythe projectiles) exist**."

**Statement B (Four Structures spec §7).** Structures appear per chunk across the explored world, with event-driven initialisation and no global scans of loaded chunks.

**Conflict.** The stable API has no chunk-generated event (`L0-adr-strc`), so noticing new chunks needs a permanent, throttled loop over player positions.

**Resolution.**
- `strf-p005` delivers the tick-budget design the plan required: one ≥20-tick player-position pass, with all heavy work in `runJob` under per-tick caps.
- `L0-adr-spwn` fixes the constraint text:
  - C-5a (weapons): unchanged.
  - C-5b: the discovery pass.
  - C-5c: the one-time, bounded tickingarea sweep for the spawn Windmill.

`wrdn-ad02` and `bast-ad01`, which still call this open, read as superseded (`L0-adr-body`).






### CX-L0-06 · `wrdn` and `bast` restate the structure contract instead of referencing `strf-*` / `loot-*`, and list no probe dependencies (L0-xcx6)

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






### CX-L0-07 · Structure tests 14–59 are channel-split only for the Windmill (L0-xcx7)

# CX-L0-07 · Structure tests 14–59 are channel-split only for the Windmill

**Links:** `is_a: ["contradiction"]` · `relates_to: ["L0-infr", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast"]` · **target_node:** `L0` · **status:** open

**Invariant (plan v2).** `infr` contributes the test harness. Structure acceptance tests 14–59 split into `bds` (counts, positions, state, statistics) and `ipad` (visual identity), following C-9.

**Observed during this reduce (version 2).**
- The `L0-wind-ac*` nodes carry the split: 14 mentions of `bds` and 4 of `ipad`.
- The `airs` ACs (8), `wrdn` ACs (10) and `bast` ACs (9) carry no channel at all.
- Some of these are clearly iPad-only. For example, `airs-ac01` (modern look), the Warden City and Bastion "reads as Ancient City / Bastion" criteria, and "almost entirely dark".
- `infr-p006` defines the `bds` lanes. No `infr` node maps tests 24–59 to channels.

**Risk.** Without a channel, the orchestrator can auto-verify a visual criterion from a green `bds` count. That is the failure recorded in memory "Orchestrator auto-verifies manual criteria", and C-6/C-9 forbid it.

**Interim rule until the delta pass.** Every structure AC whose THEN clause is about appearance, recognisability, lighting mood or "reads as" is `ipad`. Everything else is `bds`. `infr-p006` adds the per-test mapping.






