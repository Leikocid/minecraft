---
type: "concept-rule"
node_id: "L0-keep-r005"
source_channel: "rollout"
title: "Rule K-R5 — Retention state is durable and event-driven; never derived by scanning"
aliases: ["L0-keep-r005"]
part_of: ["L0-keep"]
is_a: ["rule"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1999
tags: ["rule","performance","storage","no-scan","L0-keep"]
---

# Rule K-R5 — Retention state is durable and event-driven; never derived by scanning

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-ent1", "L0-keep-p003"]` · `governed_by: ["C-4", "C-6", "C-1"]` · `spec: ["§11"]`

**Rule.** Retention state lives in durable world-level storage on the stable API and is mutated **only** from discrete events (death, respawn, join). It is never reconstructed by enumerating players, scanning inventories, or searching the world for Web Sword instances — neither per tick nor once at server start.

**Source.** C-6 / §11 *«Persistent … state хранить в устойчивом world-level состоянии, доступном после рестартов»* · C-4 / §11 *«Не делать постоянный глобальный скан мира каждый tick»* · C-1, stable APIs only.

**Rationale.** Three separate reasons converge:

1. **Performance (C-4).** The prohibition is explicit and is the spec's only stated performance requirement.
2. **Correctness.** A scan cannot see offline players' inventories or items inside unloaded chunks, so any derived state is wrong exactly when it matters — a disconnected player mid-death is the case `L0-keep-p003` exists for.
3. **Precedent.** ADR-005 rejected *«Deriving the flag by scanning for existing Web Swords»* for the analogous craft flag. The same reasoning binds here.

**Corollary — no startup sweep.** Restart safety comes from the storage being durable, not from recovery logic. If a boot-time reconciliation pass seems necessary, the ledger design is wrong.

**Corollary — no cleanup job.** A `pending` entry for a player who never returns costs one map key and represents an item that does not exist. Expiring entries would risk granting on stale state; leave them.

**Storage class.** World-scoped dynamic properties on `@minecraft/server` 2.10.0 — the same mechanism ADR-005 chose, for the same durability requirements (survives logout, world save, restart) and within the same stable-API boundary. No Beta/Preview surface (C-1), no external files.
