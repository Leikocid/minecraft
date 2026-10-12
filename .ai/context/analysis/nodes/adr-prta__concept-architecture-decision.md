---
type: "concept-architecture-decision"
node_id: "L0-adr-prta"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ADR-L0-prta · Ticking areas: one world-wide allocator with a reserved Pearl Rod slot"
aliases: ["L0-adr-prta"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 3104
tags: ["v11", "pearl-rod", "structures", "tickingarea", "status:accepted", "resolves:L0-pear-cx01", "amends:L0-adr-prbd"]
---
---
title: "ADR-L0-prta · Ticking areas: one world-wide allocator with a reserved Pearl Rod slot (adopts L0-pear-ad01)"
aliases: ["L0-adr-prta"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-pear-ad01", "L0-pear-cx01", "L0-adr-prbd", "L0-strc", "L0-airs-cx01", "L0-pear-ac05", "L0-pear-ac07"]
requires: ["L0-pear-ad01"]
see_also: ["L0-pear-pr03"]
governs_files: ["src/structures/spawn-search.ts", "src/structures/search-ring.ts", "src/structures/runtime.ts", "src/main.ts", "src/pearlrod/"]
---
# ADR-L0-prta · Ticking areas: one world-wide allocator with a reserved Pearl Rod slot

**Status:** accepted at reduce (v11). Resolves `L0-pear-cx01`. Amends `L0-adr-prbd` §5.

**Context.**
- The plan's invariant: the Pearl Rod preload must allocate from the same pool as `spawn-search`, "so a structure search and a teleport never evict each other". If sharing needs an edit to `spawn-search`, that edit is a refactor that keeps the structures scenarios green.
- The deep-dive found that `spawn-search` owns only one of **two** script pools. The other belongs to the ring loaders (`L0-pear-cx01`). Both pools draw on an engine cap of **10 ticking areas per world**.
  - Observed during reduce on 2026-10-12: the cap comment is at `src/structures/search-ring.ts:179`; the `andrew_find_` pool is 5 at `src/main.ts:85-87`; `RING_AREA_POOL = 4` is at `src/structures/runtime.ts:291`.
- The engine does not evict areas. It refuses the add, so the real hazard is starvation.

**Decision.** Adopt `L0-pear-ad01` unchanged:
- one `areas.ts` allocator, the only code that runs `tickingarea add/remove`, with a world budget of 10;
- its clients are `spawn-search`, `search-ring` and the Pearl Rod;
- one slot is reserved for the Pearl Rod, and structure clients share the other 9;
- the Pearl Rod may also borrow a free unreserved slot;
- when no slot is free, the trip ends with "server busy" and the binding is kept (`L0-pear-ru01` §4).

**Invariant check.**
- *Same pool as `spawn-search`:* met, and the scope is wider. Every product area now comes from one budget.
- *Never evict each other:* met. The reserved slot means a structure search cannot starve a teleport. Because the Pearl Rod only borrows free slots, a teleport never takes a slot a search holds.
- *Refactor keeps structures green:* this is a gate on the change. Before merge, run the broad tier plus every `find`/`ring` scenario. The blast radius is two structures modules, so the full ~50-min suite is not required.

**Text change to `L0-adr-prbd` §5.** "a ticking-area allocator shared with `spawn-search`" now reads "the world-wide ticking-area allocator (`L0-adr-prta`)".

**Consequences.**
- The `pear` build depends on a `strc` refactor and must be sequenced after it in the same epic. The board rejects cross-epic dependencies.
- `L0-pear-ac05` "budget exhausted" fills slots through the allocator, never with raw `/tickingarea`.
- GameTest site areas stay outside the allocator (`L0-pear-ad01`). On checks they still count against the engine cap of 10. `L0-pear-ac07` records the cap that is actually observed.
