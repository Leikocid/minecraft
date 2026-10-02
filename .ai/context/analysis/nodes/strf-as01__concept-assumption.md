---
type: "concept-assumption"
node_id: "L0-strf-as01"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — Where the candidate footprint sits relative to its chunk"
aliases: ["L0-strf-as01"]
is_a: ["assumption"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 899
tags: ["is_a:assumption", "can-assume", "anchor"]
level: 2
---
# Assumption (CAN_ASSUME) — Where the candidate footprint sits relative to its chunk

**Gap.** The spec gives a chance "per chunk", but the Windmill (35×35), Warden City (63×63) and Bastion (20×20) are larger than a chunk. It never says where the footprint lies.

**Assumption.** The **centre** of the rotated footprint is at the centre of the rolled chunk (`cx*16+8`, `cz*16+8`), with no jitter. The origin is `centre − floor(size'/2)`. The footprint therefore spills into neighbouring chunks symmetrically. Two adjacent positive rolls for large structures always collide, and the later one in discovery order is cancelled.

**Impact if wrong.** It lowers the effective density of large structures at 5 % (see `L0-xq2`). Structures are aligned to a visible chunk grid. Adding seeded jitter (±4) later is a one-line change, and existing worlds are unaffected because placed records store the origin.
