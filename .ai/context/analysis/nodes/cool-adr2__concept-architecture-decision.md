---
type: "concept-architecture-decision"
node_id: "cool-adr2"
source_channel: "rollout"
analysis_version: 1
title: "ADR-2 · Verification pipeline: BDS in Docker (automated) + iPad (manual), no Windows client"
aliases: ["cool-adr2"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 952
tags: ["title:ADR-2 Verification on BDS in Docker + iPad", "is_a:architecture-decision"]
---
# ADR-2 · Verification pipeline: BDS in Docker (automated) + iPad (manual), no Windows client

**Context.** There's no Bedrock client for macOS, and the available hardware is a Mac mini (M4 Pro) + iPad. The specs require runtime/content logs, two-player tests and restart persistence checks.

**Decision.** Run `itzg/minecraft-bedrock-server` (linux/amd64 via Rosetta) in Docker for pack loading, script execution and GameTest with SimulatedPlayers (two-player, restart scenarios). Use the same BDS as the LAN server for the iPad. The iPad channel alone closes the visual criteria: icons, Creative placement, RU/EN names.

**Rejected.** (a) A Windows PC / Parallels with the Windows client: not available, not needed (decision q-004). (b) iPad-only manual testing: no logs, can't be automated, doesn't fit the autopilot merge policy.

**Consequence.** Autopilot can merge on build/bds evidence. iPad criteria stay open until the operator accepts them.
