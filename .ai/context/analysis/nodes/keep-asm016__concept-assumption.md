---
type: "concept-assumption"
node_id: "L0-keep-asm016"
source_channel: "rollout"
title: "ASM-016 — An unplaceable restore stays owed rather than being dropped or discarded"
aliases: ["L0-keep-asm016"]
part_of: ["L0-keep"]
is_a: ["assumption"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1865
tags: ["assumption","edge-case","L0-keep"]
---

# ASM-016 — An unplaceable restore stays owed rather than being dropped or discarded

**Links** — `part_of: ["L0-keep"]` · `is_a: ["assumption"]` · `relates_to: ["L0-keep-p002", "L0-keep-ent1"]`

**Assumed.** If the sword cannot be placed into the player's inventory at respawn (no free slot), the ledger entry is **left `pending`** and redemption is retried at the next respawn or join — rather than dropping the item at the player's feet or silently discarding it.

**Basis.** The spec does not consider this case at all. §4 assumes respawn yields an empty inventory, which is the vanilla default; a non-empty one requires a server setting or admin action, so the case is unlikely but reachable on a real dedicated server (C-5).

**Why this default.** The two alternatives are both bad in ways the spec explicitly cares about:
- **Drop at the player's feet** — recreates the exact state §4 exists to prevent: a one-per-world legendary lying on the ground, lootable by whoever is nearby (`L0-keep-r001`).
- **Discard** — destroys the sword permanently, and silently.

Leaving the entry `pending` costs nothing: the ledger is already designed to carry an unredeemed obligation indefinitely (`L0-keep-p003`), and an owed sword is an item that does not exist, so C-7 is not threatened by the delay.

**Impact if wrong.** Low. The failure mode is a player who has to free a slot and rejoin to get their sword — inconvenient and confusing, but not a dup and not a permanent loss. Recorded because the *other* two options are genuinely harmful, so the choice should not be made casually at implementation time.

**Possible refinement.** A localized actionbar/chat notice ("inventory full, sword will be returned") would remove the confusion — but it needs a translate-key pair from `L0-item` per C-9/ADR-009, and this component currently emits no text by design (KC-9).
