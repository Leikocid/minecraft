---
type: "concept-architecture-decision"
node_id: "L0-infr-d001"
source_channel: "rollout"
analysis_version: 5
title: "ADR: run BDS in Docker (Rosetta/amd64) on the Mac mini, not a Windows VM"
aliases: ["L0-infr-d001"]
is_a: ["architecture-decision"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1161
tags: ["is_a:architecture-decision"]
level: 2
---
# ADR: run BDS in Docker (Rosetta/amd64) on the Mac mini, not a Windows VM

**Links:** `part_of: ["L0-infr"]` · `is_a: ["architecture-decision"]`

**Context**: BDS ships Linux x86_64 binaries only — there is no native macOS build, and no client for Bedrock exists on macOS either. The dev rig is a Mac mini (M4 Pro) plus an iPad; a Windows PC was on the table as a fallback.

**Decision**: run BDS via Docker Desktop, image `itzg/minecraft-bedrock-server`, `platform: linux/amd64` (Rosetta 2 translation) [C-5]. Cycle: Mac (build, static checks) → BDS-in-Docker (engine log evidence) → iPad (eyes-only checks) [`decision-windows-pk-ne-nuzhen-q-004`].

**Rejected alternatives**:
- *Windows PC / Parallels VM running native BDS* — rejected as the default (`Q-004`, decided 2026-09-20): extra hardware/VM complexity for no proven benefit; kept only as a fallback "if BDS under Rosetta on the M4 Pro turns out unstable."
- *Wait for/require a native ARM or macOS BDS build* — doesn't exist on the stable channel; not viable.

**Status**: accepted, in production use since Stage 0. Revisit trigger: Rosetta-under-Docker instability on the M4 Pro (not yet observed).
