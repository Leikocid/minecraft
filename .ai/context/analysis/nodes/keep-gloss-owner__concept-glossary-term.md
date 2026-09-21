---
type: "concept-glossary-term"
node_id: "L0-keep-gloss-owner"
source_channel: "rollout"
aliases: ["L0-keep-gloss-owner"]
part_of: ["L0-keep"]
is_a: ["glossary-term"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1100
tags: ["glossary-term","L0-keep"]
---

**Bonded owner** · RU: *«владелец»* (§4: *«должен вернуться тому же владельцу»*)

The player to whom a bonded Web Sword returns on respawn — the key of the Retention Ledger (`owner_id` in `L0-keep-ent1`).

Must be the player's **stable identity**, the one that persists across disconnect, reconnect and server restart. Explicitly **not** the display name (changeable, non-unique) and not any session- or connection-scoped handle (ASM-014). If the identity is unstable, a returning player is treated as a new player: the obligation is stranded and — worse — a fresh entry can be armed for the same physical person, which is a dup path.

§4 names the owner but never defines how ownership is established. This component reads it as **"the player who was carrying the sword at the moment of death"**, with the ledger keyed to that player. Whether ownership should instead be fixed at *craft* time (surviving trades and thefts) is an open design point folded into Q-006's `bound_owner` attribute.

**Related**: **bonded sword** — the marked instance; **admin copy** — an unmarked instance with no owner.
