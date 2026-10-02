---
type: "concept-entity"
node_id: "L0-infr-e004"
source_channel: "rollout"
analysis_version: 5
title: "Entity: BDS Docker service (`docker/bds/compose.yaml`)"
aliases: ["L0-infr-e004"]
is_a: ["entity"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1394
tags: ["is_a:entity"]
level: 2
---
# Entity: BDS Docker service (`docker/bds/compose.yaml`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

**Image**: `itzg/minecraft-bedrock-server:latest`, `platform: linux/amd64` — BDS ships x86_64 only, so on Apple Silicon (Mac mini M4 Pro) it runs under Rosetta 2 [C-5].

**Key env vars** (overridable per invocation): `VERSION` (must equal `targets.mjs`'s `BDS_VERSION`, asserted at the top of every run), `LEVEL_NAME` (`andrew` default / `gametest` for the GameTest lane, via `BDS_LEVEL_NAME`), `LEVEL_TYPE` (`DEFAULT` / `FLAT` via `BDS_LEVEL_TYPE`), `GAMEMODE` (`creative` default / `survival` via `BDS_GAMEMODE` — the image reapplies `GAMEMODE` from env on every start via `set-property --bulk`, so writing "survival" straight into `server.properties` does not stick), `ONLINE_MODE: false` (LAN-only, no Xbox Live auth needed for the iPad to join), `CONTENT_LOG_FILE_ENABLED` / `CONTENT_LOG_CONSOLE_OUTPUT_ENABLED: true` (without these, `console.warn` from the add-on's script never reaches `docker logs`, and there is nothing for `bds:check` to assert on).

**Ports**: `19132/tcp+udp` (RakNet handshake+join — the iPad 1.26.51 client actually uses RakNet despite BDS's own log recommending NetherNet), `19140-19149/udp` (NetherNet gameplay, 1:1 published), `7551/udp` (NetherNet LAN discovery).

**Volume**: `./data:/data` (gitignored) — server binary, world, installed packs.
