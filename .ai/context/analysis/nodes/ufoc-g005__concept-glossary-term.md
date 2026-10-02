---
type: "concept-glossary-term"
node_id: "L0-ufoc-g005"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ufoc-g005"]
is_a: ["glossary-term"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 372
tags: ["is_a:glossary-term", "session"]
level: 2
---
**Event session / `eventId`**

The in-memory record of the one live UFO event (`L0-ufoc-ent2`), identified by an `eventId` that is unique per script load.
- The saucer carries it as `andrew:ufo_event`.
- Any UFO entity whose id does not match the live session is stale, and the cleanup removes it.
- `reportShotDown` is idempotent per `eventId`.

**Synonyms:** live event.
