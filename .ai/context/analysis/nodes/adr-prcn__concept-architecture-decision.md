---
type: "concept-architecture-decision"
node_id: "L0-adr-prcn"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ADR-L0-prcn · Bound use: cancel or remove, chosen by the probe"
aliases: ["L0-adr-prcn"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 2480
tags: ["v11", "pearl-rod", "fishing-cancel", "status:accepted", "resolves:L0-pear-cx02", "amends:L0-adr-prbd", "probe-branched"]
---
---
title: "ADR-L0-prcn · Bound use starts by cancelling OR by removing the hook; the probe picks the branch"
aliases: ["L0-adr-prcn"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-pear-cx02", "L0-pear-pr03", "L0-pear-ac07", "L0-adr-prbd", "L0-xcx13", "L0-orbc"]
requires: ["L0-pear-ac07"]
see_also: ["L0-pear-ru01"]
governs_files: ["src/pearlrod/"]
---
# ADR-L0-prcn · Bound use: cancel or remove, chosen by the probe

**Status:** accepted at reduce (v11). Resolves `L0-pear-cx02`, a gap in the design. The probe result is still owed and picks the branch.

**Context.**
- `L0-adr-prbd` §5 assumed that cancelling `beforeEvents.itemUse` on a vanilla `minecraft:fishing_rod` stops the cast.
- The Orbital Cannon's deviation record (`L0-xcx13`, `src/orbital/README.md` item 1) says stable API "cannot switch fishing off" on a real rod. That claim was about turning fishing off permanently. No one has probed a one-use cancel.
- Nothing else in the run depends on the answer. The binding path and the non-owner path never cancel.

**Decision.**
- The bound-use pipeline (`L0-pear-pr03`) has one entry, `start(player, rod)`, and two triggers.
- The probe in `L0-pear-ac07` item 5 fixes which trigger ships. The choice is a build-time constant, not a runtime fallback.
  1. **Cancel branch.** The probe shows the cancelled use spawns no `minecraft:fishing_hook`. Then `beforeEvents.itemUse` cancels, and `system.run` calls `start`.
  2. **Remove branch.** A hook still spawns. Then the use is allowed, the hook is removed at `entitySpawn` +0, and `start` is called. Ownership comes from the `itemUse` correlation (the `trdt`/`uwbw` precedent).
- Either way, the owner/epoch test runs before the trigger. A non-owner always gets a plain vanilla cast.
- If the iPad shows a line flicker, it is a listed iPad item. It does not block the build.

**Why this closes the contradiction.** The design no longer depends on the unproven claim, and both outcomes have a fixed, tested path. Leaving `L0-pear-cx02` open would block nothing. The probe's verdict goes into `src/pearlrod/README.md` alongside the `xcx13` note.

**Consequences.**
- `L0-pear-ac02` and `L0-pear-ac03` assert "no hook survives a bound use", not "no hook ever spawns". That makes them true under both branches.
- If the cancel branch ships, `src/orbital/README.md` item 1 should be reworded to "cannot switch fishing off permanently", so the next reader does not inherit the over-broad claim.
