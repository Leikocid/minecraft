---
type: "concept-assumption"
node_id: "L0-infr-as04"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — \"restart\" for the idempotency check means a same-volume server restart, not `bds:down`/`bds:up`"
aliases: ["L0-infr-as04"]
is_a: ["assumption"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 1121
tags: ["is_a:assumption", "kind:CAN_ASSUME", "relates_to:L0-infr-p007", "relates_to:L0-adr-strs", "v2-delta"]
level: 2
---
# Assumption (CAN_ASSUME) — "restart" for the idempotency check means a same-volume server restart, not `bds:down`/`bds:up`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-p007", "L0-adr-strs"]`

**Gap**: no ADR specifies how the restart/idempotency check restarts BDS. The existing `bds:check`/`bds:up` flow re-stages the data directory fresh on every run (`L0-infr-p002`), which would erase the very world state the idempotency check needs to survive a restart.

**Assumed**: the check restarts the *server process* while keeping the same `data/` volume/world (e.g. `docker compose restart`, or stopping and restarting the container without re-staging) — distinct from `bds:down` + `bds:up`, which intentionally resets to a clean world.

**Impact if wrong**: if the intended check is actually "reinstall the add-on into a fresh world and confirm first-init still runs exactly once" rather than "survive a mid-lifetime restart," the check needs `bds:up`'s re-stage semantics instead, and both scenarios (fresh-install idempotency vs. restart idempotency) may be needed, not just one.
