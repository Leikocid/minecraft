---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl05"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 478
tags: ["glossary"]
level: 2
---
**Pending / owed (return tokens)**

Durable tokens that each authorise exactly one grant of an instance.

- **Pending:** per player, stored in `andrew:<p>_pending`. Written on death, redeemed on respawn.
- **Owed:** per world, stored in `andrew:<p>_owed`. Written when an item is lost to the Void or destroyed while its last holder is offline. Redeemed on that player's next join.

The token is removed in the same turn as the grant, and there is never a grant without a token.
