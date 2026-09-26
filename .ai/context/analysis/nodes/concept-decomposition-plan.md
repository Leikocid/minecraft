---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 2
title: "L0 Decomposition Plan (v2)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 5786
tags: ["title:L0 Decomposition Plan", "alias:L0-plan", "is_a:plan", "relates_to:L0", "see_also:fourstructuresspecruencopy", "supersedes:L0-plan@v1"]
level: 0
---
# L0 Decomposition Plan (v2)

## Survey
- **Volume.** 19 primary inputs, ~74 K chars of raw spec. The new Four Structures spec alone is ~51 K chars (11 fragments; the fragments overlap). There is also running TypeScript in `src/{legendary,websword,scythe,gametest,selftest}`. Far above the self-work threshold, so decomposition is mandatory.
- **Diversity.** Two feature families: legendary weapons (v1 tree, unchanged) and world structures (new). Inside structures there are four structure bodies plus two shared rule sets: generation/persistence (§2, §6, §7, §15) and loot (§3, §13.6, §14.4).
- **Coherence.** Medium. One add-on, one namespace, one build, one BDS harness. But the structures spec never references the weapon specs, except for gameplay mentions (Dragon Katana, cobwebs) and the shared stable-only policy. The families share platform constraints, not logic.
- **Dependencies.** Structures have a clear contract layer (`strf`, `loot`) that the four bodies consume. `wind` → `airs` is the one data link (linked-Airship attempt). This repeats the v1 weapons shape (`lgnd` → `webs`/`scyt`), so the same topical split with a contract hub is used.

## Decomposition strategy: diversity

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| infr | Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline — generating `.mcstructure` from repo sources, packing `structures/`, worldgen/placement GameTest harness, statistical chunk-roll checks, restart/idempotency checks on BDS) | component-deep-dive | sonnet |
| pick | Miner's Pickaxe probe (Stage 1, closed — reconcile only) | component-deep-dive | sonnet |
| lgnd | Legendary weapon framework (shipped `src/legendary/`; reconcile spec vs code) | component-deep-dive | |
| webs | Web Sword (shipped; reconcile) | component-deep-dive | sonnet |
| scyt | Scythe of Calamity (shipped Stage 3; mob targeting now in scope; reconcile) | component-deep-dive | |
| strf | Structure framework — StructureDef registry, chunk discovery + seeded per-chunk roll, rotation, footprint validity (dry land / water / lava ocean / world ceiling / flatness), vanilla/custom structure collision heuristic, loaded-footprint guarantee, `structureManager.place`, persistent instance registry + idempotent first-init, one-time persistent mobs, vanilla-like spawner semantics, deviation report | component-deep-dive | |
| loot | Loot system — custom weighted table (13 categories, 5–12 attempts, Golden Apple once, 80/20 iron/diamond, random armor slot, compatible non-curse enchants up to max level) + vanilla loot-table application (`chests/ancient_city`, `chests/bastion_treasure`, `chests/bastion_other`); one-time fill; statistical tests | component-deep-dive | sonnet |
| wind | Windmill — template (3 floors, stairs, blades, fields, fence, water, decay), 25 chests 5/8/12, 3 spawners, 10 sun-immune persistent field Zombie Villagers + cure behaviour, 1 % normal gen, guaranteed spawn-area search (5×5 chunks → ≤500 blocks → forced site prep with edge smoothing, shallow void fill only), linked-Airship trigger | component-deep-dive | |
| airs | Airship — template (gondola 4 rooms + corridor, balloon), 10 chests, 1 Vindicator spawner, whole-footprint land check, altitude 40–70 above max terrain, ceiling rejection, independent 2 %, Windmill-linked 40–100 block search (no dedupe, no widening) | component-deep-dive | sonnet |
| wrdn | Mini Warden City — ~30×30×10–15 template, random top Y −35…−45, land-above check, ~5×5 surface sculk marker aligned so digging down hits the hall, Reinforced Deepslate monument, 2 natural shriekers (`can_summon`), 10 Ancient City chests (3 central), sparse soul lighting, 5 % gen | component-deep-dive | sonnet |
| bast | Mini Bastion — Nether ~20×20×10–12 template, 2–3 levels, lava treasure room (3 treasure chests + 2–4 gold blocks), 7 bastion chests, 7–10 Piglins + 2 Brutes one-time persistent, no Hoglins, not over lava ocean, 5 % gen | component-deep-dive | sonnet |

## Reduce plan
- **Weapons branch (`lgnd`, `webs`, `scyt`, `pick`)** was analysed in v1 and is shipped. Children only reconcile spec against current code and report drift (for example, the Scythe mob-targeting change). The v1 rules and ids stay valid.
- **`strf` and `loot` are the contract layer for structures**, as `lgnd` is for weapons. The four body children reference `strf-*` / `loot-*` rules by id and must not restate generation, persistence or loot rules. Any rule a body overrides becomes a contradiction on L0. Known allowed overrides: the spawn Windmill may relocate and force-prepare terrain, and the linked Airship may search 40–100 blocks.
- **`strf` must answer first,** and must include a probe plan (a Stage-1-style spike). Questions the probe settles on BDS 1.26.51.1: does `structureManager.place` keep chest and spawner block entities and rotation; does `BlockPermutation` with `can_summon=true` produce a natural shriekers; is `/loot insert` with vanilla chest tables available through `runCommand`; do named/tagged mobs persist across unload and restart; what is the dynamic-property size budget for the registry. Body children list which probe results they depend on.
- **`infr`** contributes the template toolchain decision (`L0-adr-tmpl`) and the test harness. Structure acceptance tests 14–59 split into `bds` (counts, positions, state, statistics) and `ipad` (visual identity), following C-9.
- The parent rolls up: component overviews go into the L0 overview table. Constraints are de-duplicated against C-1…C-14. `L0-xcx4` (C-5 wording) is closed by `strf`'s tick-budget design. Staging: structures come after Stage 3, in the order `strf` + `loot` probe → Windmill (+ spawn guarantee) → Airship (linked) → Warden City → Bastion.
