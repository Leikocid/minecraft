---
type: "concept-process"
node_id: "L0-keep-p002"
source_channel: "rollout"
title: "Process — Restore on Respawn"
aliases: ["L0-keep-p002"]
part_of: ["L0-keep"]
is_a: ["process"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2772
tags: ["process","respawn","restore","idempotency","L0-keep"]
---

# Process — Restore on Respawn

**Links** — `part_of: ["L0-keep"]` · `is_a: ["process"]` · `relates_to: ["L0-keep-p001", "L0-keep-p003", "L0-keep-ent1", "L0-keep-r002"]` · `implements: ["WS-9", "K-2"]` · `spec: ["§4"]`

**Trigger.** A player respawns.

**Goal.** A player with a `pending` ledger entry receives **exactly one** Web Sword back — and any repeat of this event grants nothing.

## Steps

1. **Read the ledger entry** for the respawning player's `owner_id`.
2. **Guard:** if there is no entry, or its state is `redeemed`, **stop**. This is the normal path for every player who did not die holding the sword, and the safety net against duplicate events.
3. **Claim the entry:** flip `pending → redeemed`.
4. **Grant exactly one** `andrew:web_sword` carrying the provenance marker recorded in `instance_ref` (`L0-keep-ent2`).
5. Emit no message. Nothing in §4 asks for one; if one is later added, it is a translate key from `L0-item` (C-9).

## The claim-before-grant ordering

Step 3 precedes step 4, mirroring — and inverting — the ordering in `L0-keep-p001`. The reasoning is the same asymmetry:

- **Claimed, not granted** → player loses the sword. Recoverable by admin.
- **Granted, not claimed** → the entry stays `pending`, the next respawn grants a second sword. **Dup.** C-7 breached.

Again: prefer loss to duplication. Together, `p001` and `p002` sandwich the item between two durable state flips, and in both cases the crash window fails closed.

## Inventory-full handling

The player has just respawned, so an occupied inventory is unlikely but not impossible (a `keepInventory`-style server setting, or a mod/admin action). If the grant cannot be placed:

- **Do not** drop it at the player's feet and mark the entry redeemed — a ground drop of a one-per-world legendary next to a corpse is exactly the state §4 exists to prevent.
- **Do not** silently swallow it — the sword is then destroyed.
- **Leave the entry `pending`** and retry on the next join/respawn. The ledger is built to carry an unredeemed obligation indefinitely; use that property (ASM-016).

## Edge cases

| Case | Behaviour |
|---|---|
| Respawn event fires twice | Second pass sees `redeemed`, no-ops. `L0-keep-ac03`. |
| Player disconnects before respawning | No grant here; handled by `L0-keep-p003` on next join. |
| Server restarted between death and respawn | Entry is durable, so this path is unchanged. `L0-keep-ac04`. |
| Player somehow already holds a marked sword | Should be impossible — a `pending` entry asserts zero instances exist (`L0-keep-ent1` invariant 2). If observed, it means `p001` leaked; **grant nothing, redeem the entry, and log**. Failing closed preserves C-7. |
| Two players respawn simultaneously | Disjoint ledger keys, no interaction (C-5). |
