---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 9
title: "L0 Decomposition Plan (v9)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 7794
tags: ["v9", "above-water-trident", "supersedes:L0-plan@v8"]
level: 0
---
---
title: "L0 Decomposition Plan (v9)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0", "L0-trdt", "L0-lgnd", "L0-strm", "L0-katn", "L0-adr-twlt", "L0-adr-twth", "L0-adr-twrp", "L0-xcx28", "L0-xcx29", "L0-xcx30", "L0-xq9", "L0-xq10", "L0-xasm33", "L0-xasm34", "L0-xasm35", "L0-xasm36", "L0-xasm37"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
supersedes: ["L0-plan@v8"]
---
# L0 Decomposition Plan (v9)

## Survey
- **Volume.** 38 raw fragments (about 150 KB) and 566 indexed artifacts. The v9 delta is **one new spec**, "Above Water Trident v1" (priority 630). It is 2 fragments, about 7.2 K characters; the EN half mirrors the RU half, so about 3.6 K is unique. It has 4 sections and 12 acceptance bullets. No other raw changed. The code is at 1.9.2, and the Storm Blade has shipped and been accepted.
- **Diversity.** Medium for a single weapon. The spec has five mechanic areas:
  1. item, recipe and def (buckets, refund);
  2. hit damage (+2, strike);
  3. movement (dash, fall cancel, swim);
  4. throw/return with custody;
  5. the enchantment ban.

  Areas 2 and 3 reuse proven project pieces (`strm` damage and visuals, the `katn` fall pattern). **Area 4 is new.** It is the first legendary that leaves every inventory, and it touches `lgnd` (`xcx30`).
- **Coherence.** High. It is one item, one module (`src/trident/`), and one acceptance list. Its outward seams:
  - `lgnd`: the def, plus the delivery entry point for custody;
  - `strm`: shared damage helper and visual;
  - `katn`: fall pattern, as fallback;
  - `sclk`: projectile engine facts;
  - `magn`: def-driven, and a returning trident must not be pulled.
- **Dependencies.** Three paths share one entry point (`itemReleaseUse`) and one helper (the bonus): throw → hit → return → re-insert, dash → land, and melee → bonus. That is too intertwined for a pipeline split and too small for several nodes.
- **Blocking contradictions?** None block the node. `xcx28` and `xcx29` have shippable defaults (`xq9`, `xq10`). `xcx30` is the node's first deliverable.

## Decomposition strategy: coherent-coverage
This follows the one-node-per-weapon precedent (`webs`, `scyt`, `katn`, `sclk`, `strm`). One new child, **`trdt`**, covers the whole spec.

**`lgnd` is not re-run unless `xcx30` escalates.** `trdt` names the exact `lgnd` touch points. If they go beyond one delivery entry point and the custody state, the reduce step schedules `lgnd` at v10. `strm`, `katn`, `sclk` and `magn` are not re-run; their scenarios join the gate.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| trdt | **The Above-Water Trident (`andrew:above_water_trident`), def #7.**<br>**First deliverable: settle `xcx30`.** Design the custody ledger (`L0-adr-twth` §2/§5) and list every `lgnd` touch point: delivery to the last holder, death and offline handling, the stale entity on `entityLoad`, and the magnet ignoring the return entity.<br>**Probe, on checks (19136):**<br>• the engine bucket return for a token recipe, including a full inventory (`xasm33`);<br>• vanilla trident melee and thrown damage, and Impaling on a custom item (`xasm34`);<br>• `itemReleaseUse` and the charge on iPad touch, and `isSneaking` at release;<br>• vanilla Riptide III launch distance, and its `applyKnockback` calibration (`xasm37`);<br>• the fall cancel via the hurt before-event (with the katana teleport as fallback);<br>• vanilla swim speed with a sprint-swim baseline;<br>• vanilla throw speed and gravity;<br>• the return at 0.5 b/tick through blocks;<br>• a stale projectile on restart.<br>**Item:** custom trident: charge, no throwable, no durability, trident enchant slot, `allow_off_hand`; RU/EN lang; a Creative "Equipment" entry; RP icon and in-flight model (trident geometry).<br>**Recipe:** ` G / BTB / G ` → token. Exact bucket return and refund (C-34).<br>**Damage:** vanilla trident base for melee and thrown hits; +2 pre-armour through the shared `native / window / lethal` helper (extracted from or imported from `src/storm/damage.ts`); one strike visual per hit (`adr-twlt`); idempotent per hit event.<br>**Movement:** a sneak-release dash, with no cooldown, anywhere; a one-shot fall grant (`xasm36`); a held-only swim boost (C-36).<br>**Throw:** the ledger, then remove from hand, then spawn and launch; hit → damage → return; miss/block → visible 10 b/s return; re-insert exactly once; fallbacks (offline, death, dimension, unloaded, 30 s cap).<br>**Enchant:** scrub Loyalty and Riptide (C-37, `xasm35`).<br>**GameTests (`bds`)** for every acceptance bullet:<br>• recipe plus 2 buckets, full inventory;<br>• second craft blocked across a restart; Creative copy free;<br>• melee and thrown = vanilla + 2 against armour, with an in-window negative control; exactly one strike and no `lightning_bolt` entity;<br>• a dash on a dry platform with no rain, in the Nether and the End;<br>• no damage on the next landing, then normal damage on the one after;<br>• swim speed with and without the trident, in either hand;<br>• return speed 10 b/s ± 5 % from a block hit; re-throw refused mid-return; no duplicate at any tick;<br>• thrower dies, logs off or switches dimension mid-flight; Void, chest, fire, lava, explosion (through the `lgnd` scenarios with def #7);<br>• Loyalty and Riptide stripped, Unbreaking kept.<br>The magnet's legendary scenarios include def #7.<br>**iPad (`ipad`):** dash feel, swim feel, the visible flight and return, the strike reads as lightning, icon, Creative entry, recipe in the recipe book, the sneak gesture. | component-deep-dive | |

## Reduce plan
- **Cite, do not restate.** `trdt` cites `lgnd-*` rules for the gate, the token and refund, retention, protection, the Void, pending delivery and Creative copies. It cites `strm` for the hurt-window modes and `katn` for the fall facts.
- **`xcx30` decides the framework widening.** Reduce accepts `trdt`'s list of `lgnd` touch points as a deliberate, recorded widening of `xasm32`. That needs an ADR at reduce, `L0-adr-twlg`, if it is accepted. If the list goes beyond a delivery entry point and the custody exclusion, reduce emits a v10 `lgnd` re-run instead.
- **`trdt` owns** `L0-adr-twth` and `L0-adr-twrp`, and the probe outcomes behind them. A failed probe supersedes its ADR before the build tasks. `L0-adr-twlt` and `xcx29` follow `xq10`, and `xcx28` follows `xq9`. Both default to a documented limitation.
- **AC routing.**
  - To `lgnd` rules, with trident call sites in `trdt`: craft-once, Creative, death, Void, offline, chest and hazards.
  - To `trdt`: buckets, damage, strike, dash, landing, swim, throw/return and the enchant ban.
  - Every AC is split into the `bds` and `ipad` channels.
- **Roll-up.**
  - The `trdt` overview goes into the L0 diagram.
  - New constraints are de-duplicated against C-1 … C-37.
  - Seams re-checked at reduce:
    - the bonus helper and the strike visual are shared, not copied;
    - `src/katana/fall.ts` is untouched, or touched only as a pure refactor;
    - the recipe ` G / BTB / G ` stays distinct from the Web Sword and the Storm Blade;
    - no code path leaves a held copy and an in-flight copy at the same time (C-33).
- **Stage-11 order:**
  1. The `trdt` probe on checks.
  2. The custody ledger and the `lgnd` seam.
  3. Def #7, item, token, recipe with buckets, RP and lang.
  4. Melee damage +2 and strike (shared helper).
  5. Throw, hit, return and re-insert.
  6. Dash and fall grant.
  7. Swim boost.
  8. Enchant scrub.

  Gate each merge by blast radius plus the `lgnd`/`strm`/`magn` scenarios. Reopen the `ipad` criteria after each epic merge.
- **Not in this run:** `xcx12` (the structure reconcile) and the Orbital v1.4.4 reconcile. Both are still queued separately.
