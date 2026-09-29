---
type: "concept-process"
node_id: "L0-wind-p002"
source_channel: "rollout"
analysis_version: 2
title: "Process — guaranteed spawn-area Windmill search"
aliases: ["L0-wind-p002"]
is_a: ["process"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 3146
tags: ["is_a:process", "spawn-windmill", "search", "relates_to:L0-wind-r007", "relates_to:L0-wind-r011", "relates_to:L0-wind-r013", "relates_to:L0-wind-ad01", "relates_to:L0-wind-e002", "relates_to:L0-wind-p003"]
level: 2
---
# Process — guaranteed spawn-area Windmill search

**Links:** `part_of: ["L0-wind"]` · `is_a: ["process"]` · `relates_to: [L0-wind-r007, L0-wind-r011, L0-wind-r013, L0-wind-ad01, L0-wind-e002, L0-wind-p003, L0-strf-p002, L0-strf-r006]`

**Source:** §4.7 items 6–13, §6 last bullet, §7 ("стартовый поиск выполняется один раз"), §9 edge cases 1–4, test 14, §11 DoD 2.

**Trigger.** `world.afterEvents.worldLoad` (or first script tick). Runs only if `andrew:st:spawn` is absent or has `status ∈ {searching, preparing}` (resume). `done`/`failed` → never again (`L0-wind-r011`).

## Steps
1. **Record intent.** Write `{status:"searching", spawn:[x,z], stage:1, cursor:0}` (`L0-wind-e002`). Gate the `strf` discovery worker for Overworld chunks within 500 + 48 blocks of spawn until status is terminal (`L0-wind-r013`).
2. **Load terrain** through temporary ticking areas, one window at a time (`L0-wind-ad01`). Never read or write an unloaded chunk (C-12).
3. **Stage 1 — 5×5 chunks.** Candidate plot centres = every 4-block grid point whose chunk is within ±2 chunks of the spawn chunk, × 4 rotations. Validate each with the *normal* rules (`dryLand` + `flat` + collision, `L0-wind-p001` §5). Pick the valid candidate nearest to spawn (tie → lower seeded hash). Found → go to 6.
4. **Stage 2 — expand to ≤ 500 blocks.** Square rings of chunks outward from stage 1, ring by ring. For each ring, validate candidates as in stage 3 and remember the nearest valid one. Stop at the first ring that yields a valid site *and* whose inner radius exceeds that site's distance (so "nearest" is exact). Candidates whose centre is > 500 blocks from spawn (horizontal Euclidean, `L0-wind-as02`) are skipped. Found → go to 6.
   - During stages 1–2 also keep the best **forced-prep** candidate: dry land (liquid share ≤ 5 % *or* only shallow liquid removable by prep), no collision, minimal site score (`L0-wind-as05`).
5. **Stage 3 — forced preparation.** No natural site within 500 blocks → take the best forced-prep candidate and run `L0-wind-p003`. If prep aborts (a detected structure/spawner or non-natural block appears), drop it and take the next-best candidate. No candidate at all → `failed`/`no-dry-land`, no Windmill (`L0-xq4`).
6. **Place** via `strf.tryPlaceAt(def, origin, rot, {spawn:true})` → registry record id `windmill:spawn`, then the normal init (`L0-wind-p004`).
7. **Persist result** `{status:"done", origin, rot, stage, prepared:bool}`; remove ticking areas; release the discovery gate.

## Budget
All probing runs in a `system.runJob` generator under the `strf` per-tick cap (`L0-strf-p005`). The cursor (stage, ring, window) is persisted every window, so a restart resumes rather than restarts; it never produces a second Windmill (the registry id `windmill:S` is unique).

## Edge cases
- Spawn next to ocean: stage 1–2 find the nearest dry land; if none is flat, stage 3 prepares a dry site (§9.1).
- Existing-world install: identical, once; natural-block whitelist protects player builds (`L0-wind-r008`, `L0-wind-as10`).
- A player walks in during the search: discovery near spawn is gated, so no other structure is placed into the area first.
