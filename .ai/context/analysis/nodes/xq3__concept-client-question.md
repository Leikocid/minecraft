---
type: "concept-client-question"
node_id: "L0-xq3"
source_channel: "rollout"
analysis_version: 2
title: "Q-L0-3 · When a legendary weapon is lost (Void, lava, despawn), who gets it back: the crafter or the last person who held it?"
aliases: ["L0-xq3"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 958
tags: ["title:Legendary loss return goes to the crafter or the last holder", "SHOULD_ASK", "non-blocking", "reduce", "relates_to:L0-lgnd", "relates_to:L0-webs", "relates_to:L0-scyt", "relates_to:L0-lgnd-cx09", "relates_to:L0-lgnd-p003", "relates_to:L0-adr-wpn2"]
level: 1
---
# Q-L0-3 · When a legendary weapon is lost (Void, lava, despawn), who gets it back: the crafter or the last person who held it?

**Links:** `is_a: ["client-question"]` · `relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-lgnd-cx09", "L0-adr-wpn2"]`

**Context.** Both weapon specs say it "returns to the last owner" («возвращается последнему владельцу»). Today the game gives it back to **whoever crafted it**. Example: you craft the Web Sword and give it to a friend. The friend drops it into the Void. The sword comes back to you, not to the friend.

**Options.**
- **(a)** Back to the crafter (current behaviour).
- **(b)** Back to the last player who had it in their inventory.

**Blocking?** No. Autopilot keeps (a) until you answer (`L0-adr-wpn2`). Switching to (b) is a small change in the shared framework, and it affects both weapons the same way.

**Why at L0.** It is shared behaviour for every legendary weapon, not a question about one of them.
