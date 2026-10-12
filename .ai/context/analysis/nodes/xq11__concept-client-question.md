---
type: "concept-client-question"
node_id: "L0-xq11"
source_channel: "rollout"
analysis_version: 10
title: "Q-L0-11 · Enchanting table: which alternative do you approve?"
aliases: ["L0-xq11"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 1679
tags: ["v10", "enchanting", "blocking:ench-build", "underwater-bow"]
level: 1
---
---
title: "Q-L0-11 · Enchanting table: which alternative, if any, do you approve? (+ the bow's arming gesture)"
aliases: ["L0-xq11", "Enchanting alternative approval"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-ench", "L0-xcx32", "L0-xcx33", "L0-adr-enrl", "L0-xasm38", "L0-ench-cx01", "L0-uwbw"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
---
# Q-L0-11 · Enchanting table: which alternative do you approve?

**For Andrey.** Send this after the `ench` probe's verdict, attached to it.

1. **The enchanting table (blocking for §4's build).** Stable Bedrock does not let an add-on change what the vanilla table *offers* (`xcx32`). The spec says to ask before building any alternative. Pick one:
   - **(a) Re-roll after enchanting.** The table looks vanilla. When you enchant, our rules (20 % rare, no curses, the 70/40/20 levels) replace the result. *Cost:* the hint on the table can name a different enchantment from the one you get. *Anvils:* **[fill in from the probe verdict, Q4]** — either "anvils and books are untouched" (only if the probe proves a signal that tells a table result from an anvil result), or "it may also re-roll some anvil results, for example a book applied for 1–3 levels" (`L0-ench-cx01`).
   - **(b) Our own enchanting station.** This is a new block or menu that shows our offers honestly. *Cost:* it is a new item and recipe, and the vanilla table stays vanilla.
   - **(c) Nothing.** We report it as not possible on stable Bedrock and ship only the tested rules engine, unused.

   The default if there is no answer is **(c)**, plus the report.
2. **The bow's ability (non-blocking).** The spec does not say how to switch the charge on. Our default is **to hold sneak and start drawing**; a normal draw shoots as usual. Is that right?

**Why we ask.** The spec forbids a silent substitute (C-38) and names no gesture (`xcx33`).
