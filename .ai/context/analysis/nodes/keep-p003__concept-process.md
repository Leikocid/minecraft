---
type: "concept-process"
node_id: "L0-keep-p003"
source_channel: "rollout"
title: "Process — Reconnect & Restart Reconciliation"
aliases: ["L0-keep-p003"]
part_of: ["L0-keep"]
is_a: ["process"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3227
tags: ["process","reconnect","restart","reconciliation","L0-keep"]
---

# Process — Reconnect & Restart Reconciliation

**Links** — `part_of: ["L0-keep"]` · `is_a: ["process"]` · `relates_to: ["L0-keep-p002", "L0-keep-ent1"]` · `implements: ["WS-10", "K-3", "K-6"]` · `spec: ["§4", "§12"]` · `governed_by: ["C-6", "C-7"]`

**Trigger.** A player joins the world — after a disconnect, or after a server restart.

**Goal.** Close the gap between death and respawn when the player left the session in between. §4 names disconnect/reconnect and restart as first-class dup vectors; this process is where that requirement is actually met.

## Why this exists as a separate path

`L0-keep-p002` keys off the respawn event. A player who dies and immediately quits — or whose server dies with them — never fires it. Without reconciliation the ledger entry sits `pending` forever and the player is quietly robbed. With a *naive* reconciliation that simply grants on join, the player can quit/rejoin repeatedly and farm swords.

The ledger resolves both because the join path and the respawn path **share one token**. Reconciliation is not a second granting mechanism; it is the same `p002` redemption reached by a different trigger.

## Steps

1. On player join, read the ledger entry for `owner_id`.
2. If state is `pending` **and** the player is alive (i.e. already past respawn), run the redemption from `L0-keep-p002` steps 3–4 — claim, then grant.
3. If state is `pending` and the player is still in the death/respawn state, **do nothing**; `p002` will fire normally and handle it.
4. If state is `redeemed` or absent, do nothing. This is every ordinary join.

## Why repeated rejoin cannot farm copies

Step 2 flips the entry to `redeemed` as part of granting. The second rejoin reads `redeemed` and takes branch 4. The number of grants is bounded by the number of **deaths**, not by the number of sessions — which is precisely what C-7 demands.

## Restart durability

The entry is world-scoped durable state (`L0-keep-ent1`, per C-6 and ADR-005's storage class). A `pending` entry written before a crash is still `pending` after it. This makes restart survival a property of the storage choice rather than of extra recovery code — there is no startup scan, no reconciliation sweep, and therefore no C-4 violation.

**No boot-time world scan.** Do not, on server start, enumerate players or search the world to rebuild retention state. The ledger *is* the state. Scanning is forbidden by C-4 and was rejected for the analogous craft flag in ADR-005.

## Edge cases

| Case | Behaviour |
|---|---|
| Player dies, quits, server restarts, player rejoins | One grant, on rejoin. `L0-keep-ac04`. |
| Player dies, quits, rejoins, quits, rejoins | One grant total, on the first rejoin. `L0-keep-ac03`. |
| Server restarts with no deaths pending | No entries `pending`, nothing happens. |
| World is copied to a new server | Ledger travels with the world, like the craft flag. Both copies of the world independently owe the sword — consistent with §3's *«один раз на весь мир/сервер»* being per-world (ADR-005 consequence). |
| Player never rejoins | Entry stays `pending` indefinitely. Harmless: it represents an item that does not exist. No cleanup needed, and cleanup would risk granting on a stale entry. |
