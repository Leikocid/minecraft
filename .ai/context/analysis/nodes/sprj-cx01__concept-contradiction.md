---
type: "concept-contradiction"
node_id: "L0-sprj-cx01"
source_channel: "rollout"
analysis_version: 1
title: "Contradiction: ADR-025's tick-only resolution cannot honour ASM-023 (owner logout) or §5 (restart after a hit)"
aliases: ["L0-sprj-cx01"]
is_a: ["contradiction"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1531
tags: ["is_a:contradiction", "category:invariant-violation", "target:L0-sprj", "severity:medium", "resolved", "resolved_by:L0-adr-scyt"]
level: 2
---
# Contradiction: ADR-025's tick-only resolution cannot honour ASM-023 (owner logout) or §5 (restart after a hit)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-lgnd", "L0-sprj-ad01"]` · **Target:** `L0-sprj` · **Category:** invariant violation (L0 decision vs L0 assumption and spec) · **Severity:** Medium · **Status:** open. Proposed resolution: `L0-sprj-ad01`. The CTR number is L0's to assign.

**ADR-025:** "Event subscriptions … only mark the volley for resolution. The resolution itself happens in the tick loop." Resolution with `hits ≥ 1` calls `cooldown.start`.

**ASM-023:** "If the owner logs out … the cooldown is committed only if there has already been ≥1 hit."

**Engine fact:** the cooldown is a player dynamic property (`L0-lgnd`, Q-009). After `playerLeave`, in the next tick, the owner's `Player` handle is invalid, and an offline player's dynamic property cannot be written. The `beforeEvents.playerLeave` callback runs in read-only mode.

**Spec §5:** "Если хотя бы один снаряд уже попал… запускается полный 30-секундный кулдаун." ADR-023 makes volleys disappear on restart, so a hit followed by a crash never reaches resolution and the owner rejoins ready.

**Conflict:** as written, ADR-025 + ASM-023 cannot be implemented for owner logout, and ADR-025 + ADR-023 violate §5 for a restart after a hit.

**Proposed (not self-resolved):** `L0-sprj-ad01`, which commits at the first hit and re-stamps at resolution. It needs L0 to accept it as an amendment to ADR-025.
