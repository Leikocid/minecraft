---
type: "concept-contradiction"
node_id: "L0-airs-cx01"
source_channel: "rollout"
analysis_version: 2
title: "Contradiction — \"check the linked Airship once\" (§7) vs the loaded-footprint guarantee (C-12)"
aliases: ["L0-airs-cx01"]
is_a: ["contradiction"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 2789
tags: ["is_a:contradiction", "category:invariant-violation", "severity:medium", "status:open", "target:L0-airs", "relates_to:L0-strf-r007", "relates_to:L0-wind", "title:\"Check the linked Airship once\" vs the loaded-footprint guarantee"]
level: 2
---
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
