---
type: "concept-glossary-term"
node_id: "L0-once-gwcf"
source_channel: "rollout"
aliases: ["L0-once-gwcf"]
part_of: ["L0-once"]
is_a: ["glossary-term"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 725
tags: ["glossary-term","state","L0-once"]
---

**World Craft Flag** (RU: флаг крафта)

The durable world-scoped record that `andrew:web_sword` has been survival-crafted in this world. Stored as a dynamic property under `andrew:web_sword_craft_gate` holding a small versioned JSON record (see entity `L0-once-ecft`). Absent ⇒ the world's craft budget is unspent; present with `crafted: true` ⇒ spent, permanently.

It records a **craft event**, not a sword. It is never derived from the number of Web Swords in the world (R-007).

**Synonyms:** craft flag, one-per-world flag, the gate's state.
**Not to be confused with:** the *ownership ledger* (`L0-keep`), which tracks which player owns which sword instance. Different state, different owner, neither writes the other.
