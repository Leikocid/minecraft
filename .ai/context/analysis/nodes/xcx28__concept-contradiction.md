---
type: "concept-contradiction"
node_id: "L0-xcx28"
source_channel: "rollout"
analysis_version: 10
title: "CX-L0-28 · Throw vs dash on the same input"
aliases: ["L0-xcx28"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1895
tags: ["v9","above-water-trident","status:open","spec-internal","resolved"]
level: 1
closed_at: 2026-10-12
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx28
---

---
title: "CX-L0-28 · Throw and dash share one input with no separate button"
aliases: ["L0-xcx28", "Trident throw vs dash"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twrp", "L0-xq9"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# CX-L0-28 · Throw vs dash on the same input

**Statement A (trident §02, dash):** a Riptide-III-like dash "works anywhere, including dry air". "No separate active button."

**Statement B (trident §02, throw):** "Throwing uses vanilla-like trajectory". The re-throw lock and the 10 b/s return assume the trident is thrown in ordinary play, wherever the player is.

**Why they collide.** A vanilla trident has exactly one Use gesture: hold to charge, release. With Riptide, release *always* dashes, and the trident can never be thrown in water or rain. That is why Riptide and Loyalty are mutually exclusive in vanilla. The spec makes the dash work everywhere but keeps the throw, and gives no second input to choose between them. As written, every release would have to do both, or one would never happen.

**Category:** spec-internal ambiguity. It blocks the `trdt` input design, but not the rest of the node.

**Default, unless Andrey answers `xq9` otherwise:** a **sneaking release dashes, and a plain release throws** (`L0-adr-twrp`).
- Sneaking is the one modifier that is readable server-side on stable and works on iPad touch.
- It is the same signal the shield already uses (`isSneaking`).

Rejected alternatives:
- **Dash when airborne or in water, throw on the ground.** Players could not throw while swimming, and the choice is implicit.
- **Charge length chooses** (short = throw, long = dash). It cannot be read reliably on touch.

**Closes when:** Andrey answers `xq9`, or the default ships with the input written into the README and the iPad sheet as a reported limitation.
