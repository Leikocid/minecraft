---
title: Intent
type: project-knowledge
generated_at: "2026-09-24T19:42:02.844Z"
source_channel: rollout
node_id: rollout-intent
aliases: ["rollout-intent","intent","project-knowledge/intent"]
is_a: ["rollout","intent"]
relates_to: ["L0"]
priority: 520
---

# Intent

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

_node: L0_

# Project Intent

1. **Primary goal** — give the user a PvP add-on for Minecraft Bedrock on iPad with a set of *legendary* weapons: unique per world (one Survival craft), undroppable, with a server-side active ability on a 30 s cooldown. Web Sword and Scythe of Calamity are the first two; more weapons (e.g. Shadow Blade, referenced by the Scythe spec) are expected.
2. **De-risking goal** — before any PvP content, prove that the toolchain works end-to-end on the available hardware (Mac mini + iPad, no Windows, no macOS Bedrock client) — Stage 0 — and that the stable-API stack works on the user's installed game version — Stage 1 (Miner's Pickaxe as a compatibility probe).
3. **Delivery goal** — each weapon is a self-contained module that can be developed, tested (single world + two-player) and accepted independently before moving to the next ("после прохождения тестов … переходить к следующему оружию").
4. **Quality goal** — no duplication exploits (craft, death, reconnect, restart), no orphaned temporary entities, no dependency on Experiments/Preview, safe on a dedicated multiplayer server.
