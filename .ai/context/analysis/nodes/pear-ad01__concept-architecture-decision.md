---
type: "concept-architecture-decision"
node_id: "L0-pear-ad01"
source_channel: "rollout"
analysis_version: 11
title: "ADR-pear-01 · One world-wide ticking-area budget, with a reserved Pearl Rod slot"
aliases: ["L0-pear-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 2474
tags: ["v11", "pearl-rod", "decision", "tickingarea", "status:proposed"]
level: 2
---
# ADR-pear-01 · One world-wide ticking-area budget, with a reserved Pearl Rod slot

**Is a:** architecture-decision. **Part of:** L0-pear. **Relates to:** L0-adr-prbd, L0-pear-cx01, L0-strc, L0-airs-cx01.

**Context.**
- The engine caps ticking areas at **10 per world**, shared by every user (`src/structures/search-ring.ts:179`, `L0-airs-cx01`).
- Two script pools already draw on it:
  - `spawn-search` (`andrew_find_`, pool 5, `src/main.ts:87`; `AREA_POOL` 8 by default, `spawn-search.ts:713`);
  - `search-ring` (`andrew_ring_<d>`, `RING_AREA_POOL` 4 per dimension, `structures/runtime.ts:291`).
- Their nominal sum already exceeds 10 when several dimensions search at once. Refused adds are retried, then reported as never loaded.
- `L0-adr-prbd` says to share "the pool with `spawn-search`". That is not enough: a teleport can also be starved by the ring loaders.

**Decision.**
- Extract a single `areas.ts` allocator with a world budget of 10 named slots. It is the only code that runs `tickingarea add/remove`. `spawn-search`, `search-ring` and the Pearl Rod are its clients.
- **One slot is reserved for the Pearl Rod.** Structure clients may use at most 9 between them. The Pearl Rod may also borrow a free unreserved slot.
- With the reserved slot taken (another player's pending trip), a second concurrent trip borrows a free slot, or else fails with "server busy" and keeps its binding. Trips take seconds, so contention is rare.
- On startup the allocator sweeps every known prefix (`andrew_find_*`, `andrew_ring_*`, `andrew_pearl_*`).
- GameTest site areas (`structures-site.ts`, orbital `RESTART_AREA`) stay outside the allocator. They run only on checks, and the suite tiering keeps them from colliding with product areas.

**Rejected alternatives.**
- **Share only the `spawn-search` pool** (`L0-adr-prbd` as written): the ring loaders can still exhaust the cap, and the "pool full" message would then appear with free pool slots.
- **Pearl Rod areas from its own unbudgeted pool:** adds are refused once the cap is reached, so this pushes the failure onto structure searches, which have no player-facing message.
- **No preload; teleport and let the player's arrival load the chunk:** forbidden by C-44 ("перед перемещением убедиться").

**Consequences.**
- It refactors two structures modules. The broad structures scenarios plus the ring and find scenarios must stay green.
- `L0-adr-prbd` §5's "shared with spawn-search" reads "shared world budget".
