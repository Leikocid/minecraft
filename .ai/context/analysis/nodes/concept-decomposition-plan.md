---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 7
level: 0
title: "L0 Decomposition Plan (v7)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 6918
tags: ["v7", "sculk-crossbow", "supersedes:L0-plan@v6"]
---
---
title: "L0 Decomposition Plan (v7)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0", "L0-sclk", "L0-lgnd", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen-part-4"]
supersedes: ["L0-plan@v6"]
---
# L0 Decomposition Plan (v7)

## Survey
- **Volume.** There are 34 primary inputs, about 135 KB raw, and the KV holds 336 indexed artifacts. The v7 delta is **one new spec**: the Sculk Crossbow. It has 4 fragments and about 15.5 K characters with overlap (parts 2–4 repeat §5, §11–§13), so about 10 K unique. It covers 14 sections and T01–T20. No other raw changed. The code moved under the KV: 1.5.0 shipped the Katana, and 1.6.0/1.6.1 retuned the UFO and made legendaries magnetic.
- **Diversity.** There is one topic: one weapon. It touches four areas:
  1. **item and framework:** def, recipe, gate, durability, retention, Void, Creative;
  2. **projectile pipeline:** fire → bolt per projectile → visual → hit;
  3. **hit resolution:** fixed damage;
  4. **terrain:** crater, sculk patch.

  Area 1 is the `lgnd` contract plus one new capability (a def with no ability). Areas 2–4 are new.
- **Coherence.** High. One weapon, one event path. It has two outward seams:
  - `lgnd`: the no-ability def, protection before carving, and the magnet now pulling the item;
  - `orbc`: the shared deny list for terrain edits.
- **Dependencies.** A linear pipeline: fire → swap → fly → hit → (damage | carve). It is thin and lives in one module, so there is no case for a pipeline split. The four areas fit one child.

## Decomposition strategy: coherent-coverage
`webs`, `scyt` and `katn` set the precedent: one node per weapon. The crossbow goes to a single new child, `sclk`. **`lgnd` is re-run** for three reasons:
- It must register def #5 with no ability (`L0-xcx24`).
- Its v6 card is stale against 1.6.1: the magnet pulls legendaries, and the Katana has shipped.
- The holder target (`xcx11`) is decided but not built.

`orbc` is **not** re-run. Moving its deny list to a shared module is a refactor with no change in behaviour, and `sclk` owns the task (`L0-xcx25`). `magn` is not re-run: its selector is def-driven.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| sclk | Sculk Crossbow (`andrew:sculk_crossbow`). **Probe first** (gates `L0-adr-scbs` and `L0-adr-scdm`): does a custom `minecraft:shooter` item get a loaded state, and do Quick Charge and Multishot apply to it? Does the vanilla crossbow's projectile spawn expose its owner and velocity at `entitySpawn`, so it can be swapped for a bolt? Snowball-runtime bolt against a shield-holder (`xcx23`). Hurt-invulnerability on three hits in the same tick (`xcx22`). The `sonic_explosion` particle on the iPad. **Item:** the def from `L0-adr-scbs`, infinite durability, an enchant slot without Piercing (strip it on sight if the slot cannot exclude it), RU/EN lang, the Creative "Equipment" entry. **Recipe:** echo shard / deepslate / crossbow through the craft token (T01–T03). **Pipeline:** each projectile spawned by a marked crossbow becomes exactly one `andrew:sculk_bolt` with the same velocity and owner (C-26). It emits boom particles along its real path while in flight (C-5f), and has a lifetime cap. **Entity hit:** fixed `SONIC_BOOM_DAMAGE` (10, `xasm23`) through the Scythe true-damage pattern (C-28); a sculk patch under the target (`xasm24`); no crater. **Block hit:** an irregular crater seeded per bolt, ≤ 5×5×3, plus sculk on the exposed surfaces ≤ 5×5, under C-27 (`L0-adr-sctr`, `xasm25`); no entity damage. **Ammunition** per `xasm27`. **GameTests:** T04–T18 with SimulatedPlayers (≥ 2, C-20‴), plus the crossbow instances of T19–T20 against the framework. **iPad:** trail, crater, sculk, icon, Creative. | component-deep-dive | |
| lgnd | Legendary framework, v7 pass. **(1) Reconcile with 1.6.1:** the Katana shipped (1.5.0). Legendaries are magnetic (`magnet-select.ts`, `magnet-hold.ts`): restate the old "never pulled" rule as an operator-tuned exception. **(2) No-ability def (`L0-xcx24`):** `LegendaryDef` gains an optional ability. Without it: no cooldown key, no `resolveActivation` claim and no HUD line (`hud.ts:37`). `cooldownTicks`/`abilityKey` become optional or are moved into an `ability` block, with no behaviour change for defs #1–#4. **(3) Crossbow delta:** def #5 (`keyPrefix: "sk"`; the plan first said `"sc"`, the Scythe's prefix, corrected at reduce per `L0-lgnd-cx15`), the craft token and refund (echo shard ×2, deepslate ×2, crossbow). Confirm that retention, recovery, Void and `protectLegendariesIn` need no per-weapon code. If `L0-adr-scbs` falls back to the vanilla crossbow, `isLegendaryStack` must become mark-aware; that is a larger change and must be stated as such. **(4) Holder (`xcx11`):** the decision says "the last holder" and the code returns to `mark.owner`. Either plan the holder field or restate T20 / the Void return against `mark.owner`, as v6 did for the Katana. | component-deep-dive | |

## Reduce plan
- **`lgnd` answers first.** `sclk` cites `lgnd-*` rules by id for the craft gate, retention, protection, Void and Creative copies. It must not restate them. The no-ability def is the only framework change allowed. Any other framework hook `sclk` needs is a new L0 contradiction.
- **`sclk` owns the three ADRs** `L0-adr-scbs`, `L0-adr-scdm` and `L0-adr-sctr`, and their probe outcomes. A failed probe supersedes its ADR before the build tasks. If `scbs` falls back to the vanilla crossbow, the reduce re-opens `lgnd` (3).
- **AC routing:**
  - T01–T03, T19 and T20 rules go to `lgnd`, with crossbow call sites in `sclk`.
  - T04–T18 go to `sclk`.
  - T18 (durability) goes to `sclk` if the base is a custom item; it goes to `lgnd` if a vanilla crossbow must be kept repaired.
  - Each child splits its ACs into the `bds` and `ipad` channels.
- **Roll-up.** The `sclk` overview goes into the L0 diagram. New constraints are de-duplicated against C-1 … C-28. The reduce re-checks the seams:
  - Orbital protection is still green after the deny-list move.
  - The magnet's legendary GameTests include def #5.
  - The Katana's ray passes a sculk block (a full solid block, so it is an obstacle).
  - A crossbow crater never lands inside a structure's `protect` box, if one exists (check, do not assume).
- **Stage 7 order:**
  1. The `sclk` probe on checks (19136);
  2. `lgnd` v7 (no-ability def, def #5);
  3. `sclk` item, token, recipe and RP;
  4. `sclk` bolt pipeline and damage;
  5. `sclk` crater and sculk (with the deny-list extraction).

  Gate each merge by blast radius, plus the legendary and Orbital scenarios. After each epic merge, reopen the crossbow `ipad` criteria.
- **Not in this run:** `xcx12` (the structure reconcile) and the Orbital v1.4.4 reconcile. Both are still queued separately.
