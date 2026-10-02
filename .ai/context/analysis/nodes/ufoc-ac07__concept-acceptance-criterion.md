---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac07"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-7 · Arrival notice within 150 blocks, RU/EN"
aliases: ["L0-ufoc-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 851
tags: ["is_a:acceptance-criterion", "notice", "localization", "channel:bds", "channel:ipad", "relates_to:L0-ufoc-r005"]
level: 2
---
# AC-ufoc-7 · Arrival notice within 150 blocks, RU/EN

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-r005", "L0-ufoc-as05"]`

**(bds, GameTest)**
- **GIVEN** simulated players A at 0, B at 149 and C at 151 horizontal blocks from the target, and D in the Nether,
- **WHEN** the arrival starts,
- **THEN** A and B each receive exactly one message with `translate: "andrew.ufo.arrival"`, and C and D receive none. The message is captured through a send-message spy on the core's player provider.
- **Static check:** `en_US.lang` and `ru_RU.lang` both define `andrew.ufo.arrival`, with exactly the spec's texts.

**(ipad, manual, separate criterion; reopen after every epic merge)** On the iPad with the game language set to Russian, `/andrew:ufo come` shows "В небе НЛО!" in chat. A screenshot is attached.
