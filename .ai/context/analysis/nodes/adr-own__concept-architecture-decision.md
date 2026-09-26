---
type: "concept-architecture-decision"
node_id: "L0-adr-own"
source_channel: "rollout"
analysis_version: 2
title: "ADR-L0-own · One `strf` owner per world. Structure discovery stays off while weapon GameTests run."
aliases: ["L0-adr-own"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2338
tags: ["title:ADR-L0 one strf owner per world; strf discovery off during weapon GameTests", "reduce", "cross-component", "status:accepted", "resolves:L0-strf-cx01", "relates_to:L0-strf", "relates_to:L0-infr", "relates_to:L0-scyt", "relates_to:L0-lgnd", "relates_to:L0-strf-cx01", "relates_to:L0-strf-d003", "relates_to:L0-strf-r008", "relates_to:L0-strf-r009", "relates_to:L0-infr-p006", "relates_to:L0-infr-p007", "relates_to:L0-scyt-ad04", "relates_to:L0-scyt-r001"]
level: 2
---
# ADR-L0-own · One `strf` owner per world. Structure discovery stays off while weapon GameTests run.

**Links:** `is_a: ["architecture-decision"]` · `relates_to: ["L0-strf", "L0-infr", "L0-scyt", "L0-strf-cx01", "L0-strf-d003"]` · `requires: ["L0-strf", "L0-infr"]` · **status:** accepted

**Context.**
- `L0-strf-cx01`. Dynamic properties are per pack, and the project's test convention arms production modules inside the gametest pack. So two `strf` instances would generate the same world twice (C-7).
- `strf-d003` proposes `startStrf({owner, testHooks})` and a `scriptevent andrew:strf_claim` handshake. It needs `infr` to accept it.
- **Cross-family effect** that neither child saw: since 0.4.1 the Scythe targets mobs (`scyt-ad04`, `scyt-r001`). Its GameTests use a test cow as the target. If `strf` runs discovery in the same gametest world, it can spawn structures with guards (Zombie Villagers, Piglins) or spawners near the test area. A nearer mob then becomes the Scythe's target and the tests fail. This happened already with a real LAN player (`302fba4`).

**Decision.**
1. **Accept `strf-d003`.** Exactly one pack owns `strf` in a world. The gametest pack claims ownership, and the release pack yields. Test hooks are compiled only into the gametest bundle. `infr`'s release-size check asserts they are absent.
2. **`infr` harness changes** (`infr-p006`, `infr-p007`):
   - Structure lanes run on the dedicated `gametest` world.
   - A startup assertion checks that exactly one `strf: owner=` log line appears.
   - The restart lane checks the owner again after the restart.
3. **Discovery is off by default in the gametest pack.** `startStrf({owner:"gametest", discovery:false})`. Structure tests drive generation only through `evaluateChunk` / `queueFromPositions` hooks at a test-chosen location. Weapon tests never see a structure or guard they did not ask for.
4. **Backup.** If the handshake proves racy on BDS (the release pack starts before the claim arrives), structure lanes use a separate BDS world profile without the release pack. `strf-d003` rejects that variant only because it loses one signal.
5. **Operational.** Every `bds:*` structure lane obeys the rule in memory "BDS runs vs LAN server": the LAN server is stopped during runs, and run-check artifacts use absolute paths.

**Closes:** `L0-strf-cx01`.
