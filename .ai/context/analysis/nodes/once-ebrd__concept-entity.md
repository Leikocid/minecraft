---
type: "concept-entity"
node_id: "L0-once-ebrd"
source_channel: "rollout"
title: "Entity — FirstCraftAnnouncement"
aliases: ["L0-once-ebrd"]
part_of: ["L0-once"]
is_a: ["entity"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2791
tags: ["entity","message","localization","rawtext","L0-once"]
---

# Entity — FirstCraftAnnouncement

**Links** — `part_of: ["L0-once"]` · `is_a: ["entity"]` · `relates_to: ["L0-once-r006", "L0-once-pcft", "L0-item"]` · `source: §3, §10` · `decided_by: ADR-009`

The server-wide message emitted exactly once per world, at the moment the Web Sword's single survival craft succeeds. §3: *«При первом успешном крафте отправить всем игрокам локализованное сообщение с названием оружия и именем создателя.»*

## Shape

A **rawtext payload with `translate` keys and `with` substitutions** — never a concatenated literal string (C-9, ADR-009). The engine resolves the key per receiving client, so one broadcast renders RU for a Russian client and EN for an English one.

| Attribute | Source | Notes |
|---|---|---|
| `translate` key | `L0-item`'s `.lang` catalogue | Proposed: `andrew.web_sword.first_craft` |
| weapon name | nested `translate` of the item's own name key | **Must be nested, not inlined.** Inlining the literal "Web Sword" would leave the weapon name untranslated inside a translated sentence |
| creator name | `with: [crafterName]` from `L0-once-ecft` | Player display name, not the raw id |
| audience | all players currently online | ASM-012 — no replay for later joiners |

## Required `.lang` entries

Owned and reconciled by `L0-item` (the localization catalogue is central; use is distributed — see the L0 decomposition plan's ownership rules). This component **requests** the following keys and adds no literals of its own:

| Key | Purpose |
|---|---|
| `andrew.web_sword.first_craft` | The announcement itself, with a `%s`-style slot for the creator and a slot for the weapon name |
| `andrew.web_sword.already_crafted` | The blocked-craft denial message (`L0-once-pblk` step 4) |

Both need a `ru_RU.lang` and an `en_US.lang` entry in the same change (ADR-009's consequence). Existing catalogues: `packs/resource/texts/ru_RU.lang`, `packs/resource/texts/en_US.lang`, alongside the pickaxe entries.

## Delivery

Broadcast server-side, after the flag write has succeeded (`L0-once-pcft` ordering contract). Sent once per craft event, not per player loop with independent failure — a partial broadcast is acceptable (a player disconnecting mid-send), a repeated broadcast is not.

## Why this is an entity and not just a side effect

It is the **only signal** a server receives that the world's craft budget has been spent. A player who misses it has no in-game way to learn the gate is closed, and may burn a Diamond Sword and 4 Cobweb discovering it. That is the reason ASM-012 (no replay for late joiners) is recorded at all, and the reason `L0-once-pblk` step 4 exists as a second, per-player signal.

## Verification

`L0-once-accp1` (announced on first craft), `L0-once-accp8` (both RU and EN render with no raw key text visible).
