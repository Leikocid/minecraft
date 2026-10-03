---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 6
level: 0
title: "L0 Decomposition Plan (v6)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 5587
tags: ["v6", "title:L0 Decomposition Plan (v6)", "alias:L0-plan", "is_a:plan", "relates_to:L0", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:dragonkatanaspecv1ruen-part-2", "see_also:dragonkatanaspecv1ruen-part-3", "supersedes:L0-plan@v4"]
---
---
title: "L0 Decomposition Plan (v6)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0", "L0-katn", "L0-lgnd", "L0-adr-ktob", "L0-adr-ktfl"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
supersedes: ["L0-plan@v4"]
---
# L0 Decomposition Plan (v6)

## Survey
- **Volume.** There are 30 primary inputs, about 120 KB raw, and the KV holds 904 artifacts. The v6 delta is **one new spec**: the Dragon Katana. It has 3 fragments and about 12.6 K characters with overlap (part 2 repeats §5; part 3 repeats T03–T10), so about 9 K unique. It covers 14 sections and T01–T18. No other raw changed.
- **Diversity.** There is one topic: one weapon. It touches three areas:
  1. **item and framework**: def, recipe, craft gate, retention, protection, Void, HUD, hands;
  2. **ability physics**: trace, obstacle semantics, safe cell, teleport, cooldown;
  3. **after-effects**: the one-shot fall flag and the trail.

  Area 1 is almost entirely the existing `lgnd` contract. Areas 2 and 3 are new and small.
- **Coherence.** High. One weapon, one activation path. It has exactly one outward seam: the legendary framework. There are soft interactions with `webs` (trap escape) and `magn` (hold escape, never-pulled). Those are settled by assumption, not by code in those nodes.
- **Dependencies.** A short pipeline: `itemUse` → `resolveActivation` → trace → safe cell → teleport → cooldown → fall flag → trail. It is linear and thin, so there is no case for a pipeline split.

## Decomposition strategy: coherent-coverage
`webs` and `scyt` set the precedent: one node per weapon. The Katana spec goes to a single new child, `katn`. **`lgnd` is re-run** for two reasons:
- It must register def #4.
- Its v5 card is stale against the code. `resolveActivation` is listed as "not built", yet `src/legendary/hands.ts` ships it; and the Void-minecart holder fix has merged.

Every other node keeps its version and is **not** re-run.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| katn | Dragon Katana (`andrew:dragon_katana`). **Item:** a Diamond Sword clone on the `web_sword.json` template: damage 7, `is_sword`, sword enchant slot, `fire_resistant`, `allow_off_hand`, no durability, Creative "Equipment", RU/EN names. **Recipe:** golden apple / ender pearl ×2 / Diamond Sword, through the framework's craft token (T01–T03). **Ability:** `itemUse` (and the block-tap path as in `webs`/`scyt`) → `resolveActivation` → server-side trace from the head along the view, capped at 20 blocks (clamp per `L0-xasm18`), with obstacle semantics per `L0-adr-ktob` (water and lava pass, unreadable = solid) → the nearest safe standing cell on the owner's side (`L0-xasm19`), with no block edits → `teleport` keeping the facing → `startCooldown` 30 s epoch ms. A cooldown attempt is a no-op that does not reset the timer (T05–T10). **Fall:** a one-shot flag per `L0-adr-ktfl` / `L0-xasm20` (T11, T12). **Trail:** a pink cherry-petal trail A→B under C-5e, harmless (T13). **HUD:** the RU/EN ready string and seconds. **GameTests:** T04–T15 with SimulatedPlayers, plus the Katana instances of T16–T18 against the framework. **iPad:** the trail, the HUD, the icon and the Creative placement. Probe first: fall-distance reset and the ray flags (`includePassableBlocks`, liquids). | component-deep-dive | |
| lgnd | Legendary framework, v6 pass. **(1) Reconcile with as-built 1.4.4:** `resolveActivation` and `heldLegendaries` are shipped (`hands.ts`). The Void-minecart holder return has merged (`recovery.ts` `VOID_HOLDER_TYPES`). Re-state what is still open (`holder` for the last owner, `xcx11`; the armour stand). **(2) Katana delta:** def #4 and its craft token, and the uniqueness-flag key. Confirm that `isLegendaryStack`, retention, `protectLegendariesIn` (Orbital blast and rings, T17) and the HUD need no per-weapon code beyond the def. State T17 under C-16 (`L0-xcx21`, `L0-xasm22`). Make sure the Katana's self-teleport does not trip recovery (a player teleport moves no item entity) and that a teleport into another dimension's chunks is never attempted (same-dimension only). | component-deep-dive | |

## Reduce plan
- **`lgnd` answers first.** `katn` cites `lgnd-*` rules by id for the craft gate, retention, protection, Void and hands. It must not restate them. If `katn` needs a framework change (a new hook or a new HUD state), that is a contradiction on L0, not a local patch.
- **`katn` owns the ADR details** under `L0-adr-ktob` and `L0-adr-ktfl`. If a probe overturns the fall mechanism, `katn` writes a superseding ADR and the reduce updates the L0 constraint C-25 wording.
- **AC routing** is as in the overview table: T01–T03 and T16–T18 rules go to `lgnd`, with Katana call sites and tests in `katn`; T04–T15 go to `katn`. Each child splits its ACs into the `bds` and `ipad` channels.
- **Roll-up.** The `katn` overview goes into the L0 diagram. New constraints are de-duplicated against C-1 … C-25. The reduce re-checks the soft seams: `webs` trap escape and `magn` hold escape (`L0-xasm21`), and that the UFO "never pulled" GameTest still passes with def #4.
- **Stage 7 order:**
  1. `lgnd` v6 (def #4, reconcile);
  2. `katn` item, recipe and RP;
  3. `katn` trace and teleport;
  4. `katn` fall flag and trail.

  After the merge, run the full suite, then reopen the auto-closed `ipad` criteria.
- **Not in this run:** `xcx16` (the Orbital v1.4.4 reconcile) and `xcx12` (the structure scan-code reconcile). Both are still queued separately.
