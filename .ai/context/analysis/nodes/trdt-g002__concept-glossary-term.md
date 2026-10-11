---
type: "concept-glossary-term"
node_id: "L0-trdt-g002"
source_channel: "rollout"
analysis_version: 9
aliases: ["L0-trdt-g002"]
is_a: ["glossary-term"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 309
tags: ["above-water-trident", "glossary"]
level: 2
---
**throwId**

The identifier of one throw. It is the key of the custody record, and the custody entity carries it as the entity dynamic property `andrew:tr.throw`. It ties an entity to its record across a restart without relying on `Entity.id`. It is also the idempotency key for the thrown +2 and the strike.
