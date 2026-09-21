---
title: Domain Model
type: project-knowledge
generated_at: "2026-09-21T21:24:41.657Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0","L0-cool","L0-cool-ent1","L0-item","L0-item-ent1","L0-item-ent2","L0-item-ent3","L0-keep","L0-keep-ent1","L0-keep-ent2","L0-once","L0-once-ebrd","L0-once-ecft","L0-qatg","L0-qatg-ent1","L0-qatg-ent2","L0-qatg-ent3","L0-trap","L0-trap-ecel","L0-trap-ecub","L0-trap-etgt"]
priority: 510
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

### Domain Entities (L0)

# Domain Entities

**Links** — `title: Domain Entities` · `aliases: ["L0-entity", "Domain Model"]` · `part_of: ["L0"]` · `is_a: ["entity"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `requires: ["L0-item"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

> **Rewritten at reduce (analysis_version 2).** The v1 model described the Stage 1 pickaxe. That work is shipped; it is compressed to a historical note at the bottom. The live domain is the Web Sword.

Per the decomposition plan's reduce pass 1: *"`andrew:web_sword` is the single shared entity — `L0-item` defines it, the others attach state to it."* That turned out to be exactly right, and the shape it produced is the most useful single picture of the system: **one item, four pieces of durable state at three different scopes, and one deliberately transient computation.**

## E-4 — `andrew:web_sword` (Паутинный меч) — the shared entity

Defined by `L0-item`; every other feature child attaches state to it.

| Attribute | Value | Owner |
|---|---|---|
| Base | Diamond Sword parity — damage, enchant slot, tags | `L0-item` |
| Durability | **Infinite**, implemented by *omitting* `minecraft:durability` | `L0-item` |
| Enchantable | `minecraft:enchantable`, `slot: "sword"` — **unverified on this build** (ASM-005 / Q-007) | `L0-item` |
| Display name | RU + EN via `item.andrew:web_sword.name` | `L0-item` |
| Creative placement | Equipment/«Снаряжение» + «Все» + findable by search | `L0-item` |
| Obtainable via | Survival craft (**once per world**), Creative, `/give` | `L0-item` shape, `L0-once` gate |
| Recipe | Plus-pattern: 4 Cobweb + Diamond Sword | `L0-item` |
| Passive behaviour | A normal melee hit does **nothing** beyond Diamond Sword damage | `L0-item` (+), `L0-trap` (−) |
| Active behaviour | On Use: reach-bounded target → 27-cell cobweb cube | `L0-trap` |

**The enchantability attribute is the one to verify first.** The shipped pickaxe already encodes the identical hypothesis and Stage 1's empirical outcome was never recorded — so the risk is live on an item that is already in players' hands, not just on this one.

## The state model — four durable pieces, three scopes

This is the part no child could see whole. Each piece has exactly one writer; each is a dynamic property on the stable surface (ADR-020); and the scope of each matches the lifetime of what it records.

| # | State | Scope | Writer | Readers | Lifetime |
|---|---|---|---|---|---|
| **S-1** | **World craft flag** | World | `L0-once` | `L0-once` | Write-once, forever |
| **S-2** | **Retention ledger** entry | World, keyed by owner | `L0-keep` | `L0-keep` | `pending` → `redeemed`, per death |
| **S-3** | **Cooldown record** | Player, keyed by ability | `L0-cool` | `L0-cool`, `L0-trap` (read-only) | 30 s, but **persists across logout** |
| **S-4** | **Provenance marker** | Item instance | `L0-once` *(producer)* | `L0-keep` *(consumer, exclusive)* | Life of the instance |

### S-1 — World craft flag (`L0-once-ecft`)

A **versioned record, not a bare boolean** (ADR-012), claimed by a synchronous read-check-write inside the craft-completion handler (ADR-011). The synchronicity *is* the concurrency control: the script host runs one handler to completion before the next, which is what makes §9's craft race safe without a lock.

It counts **craft events, not instances.** Deriving it by scanning the world for swords is forbidden — it violates C-4 and contradicts §4's admin copies. Its two failure modes are both silent and opposite: fail to persist and the budget re-opens (a C-7 dup path); write before the craft is confirmed and the budget is spent on a craft that never happened, with no recovery (CTR-006).

Ordering is load-bearing: **confirm craft → claim flag → announce.**

### S-2 — Retention ledger (`L0-keep-ent1`)

Not a record *about* retention — **the ledger entry is the idempotency token** (ADR-K1). Retention works by removing an item and re-granting it later, and every such pair is a duplication primitive if both halves can run or either can run twice. The entry is what prevents that: `owner → pending` written atomically with the drop removal; `pending → redeemed` flipped in the same operation that grants. A second event finds nothing pending and no-ops.

Restart safety then falls out for free: an entry written before a crash is still `pending` after it, so a player who died and immediately crashed the server is made whole on next join — **exactly once**.

Every interruption window is designed to fail toward *losing* the sword, never toward duplicating it (ADR-K2) — the asymmetry is deliberate, because a lost sword is visible and complainable while a duplicated one is silent and permanent.

### S-3 — Cooldown record (`L0-cool-ent1`)

Keyed by **player + ability key, never by item stack** (ADR-007, ASM-009) — per-instance keying would let a player alternate two copies to bypass the 30 s gate. Player-scoped, so it travels with the player and survives disconnect without extra plumbing; that also answers Q-009's "persist across logout" in the affirmative, which is `L0-cool`'s provisional position.

Read by `L0-trap` through `isReady()` and written only by `start()`, called after confirmed success (ADR-017). The ability-key indirection is the seam ADR-007 reserves for the cross-item framework §12 assumes and which does not exist.

### S-4 — Provenance marker

**The keystone, and the only piece with split ownership.** It distinguishes a survival-crafted sword from an admin copy, which is the predicate the entire retention/anti-dup design rests on. It can only be written at craft completion (`L0-once`'s handler) and is read only by `L0-keep`, so ADR-016 gives it a producer/consumer split: `L0-keep` defines the shape and durability contract, `L0-once` calls that definition at the write site.

**It does not exist yet as a requirement.** The spec never mandates it; Q-006 asks the owner to add it. If the owner says no, S-4 is deleted, `L0-keep` narrows retention to "the first sword a player ever acquires" or to nothing, and §14's absolute no-dup claim must be relaxed in writing.

### Deliberately transient — the placement plan (`L0-trap-ecub`, `L0-trap-etgt`)

`L0-trap` is the only feature child with **no durable state at all**, and that is a design property rather than an omission. A target resolution and a 27-cell verdict plan are computed in full, applied inside one synchronous handler invocation, and discarded (ADR-015). Nothing persists between activations, which is precisely what makes two concurrent activations resolve independently and identically on every client (C-3, C-5).

## Analysis-level entities (`L0-qatg`) — not runtime state

| Entity | What it is |
|---|---|
| **Acceptance Matrix** (`L0-qatg-ent2`) | Twelve §13 rows, each referencing a sibling's criterion artifact and a harness mechanism. **Complete-pending-execution** after the reduce correction |
| **Definition-of-Done Gate** (`L0-qatg-ent3`) | §14's five conditions as an aggregate go/no-go. Cannot be green while any matrix row is unproven, and adds conditions no single row carries |

## How the state pieces meet the acceptance tests

The §13 tests that matter most are exactly the ones that cross a state boundary — which is why they are also the ones §15 named as cost drivers.

| Test theme | State touched | Why it is hard |
|---|---|---|
| Second survival craft blocked, **after restart** | S-1 | Proves durability of the only write-once record |
| Death → respawn → still exactly one sword | S-2 (+ S-4) | Proves the retain/restore pair is a single idempotent operation |
| Death **during cooldown** creates no copy | S-2 + S-3 | The only test that crosses two state owners |
| Re-use blocked ~30 s after success | S-3 | Split-claim: `L0-trap` asserts the gate, `L0-cool` the duration (ADR-018) |
| Two clients see identical cobweb | *none* | Passes *because* `L0-trap` holds no state |

---

## Historical — Stage 1 entities (discharged)

Retained for context; both stages shipped at v0.2.1 and neither is live analysis.

- **E-1 — Miner's Pickaxe (Кирка шахтёра).** Infinite durability by omitting the durability component, enchantable via the pickaxe slot, diamond-*like* speed, a distinct plus-variant recipe, and a **closed** auto-smelt allow-list (iron/gold/copper ore + deepslate variants → ingots; ancient debris → netherite scrap). Fortune and Silk Touch deliberately deferred because both interact with the smelt rule. Two observations still relevant: infinite durability makes gold ore auto-smelt away its own recipe ingredient — harmless for a prototype, a genuine progression trap if carried into the PvP add-on; and the durability/enchantability tension it encodes is **still unverified** and is now Q-007 for the sword.
- **E-2 — Stage 0 placeholder item.** Deliberately unspecified, explicitly not a pickaxe. Existed to prove the RP and localization pipeline load. Discardable.
- **E-3 — Player spawn greeting.** `world.afterEvents.playerSpawn` filtered to `initialSpawn`, writing one chat line. Proof that scripts execute at all; the filter is what keeps it a one-shot signal rather than respawn noise.





### CooldownRecord & AbilityRegistration (L0-cool-ent1)

# CooldownRecord & AbilityRegistration

Two related shapes this component owns: the **per-player timer state**, and the **registration seam** ADR-007 requires for future weapons.

## CooldownRecord

Per-player, per-ability cooldown state. One record per `(playerId, abilityKey)` pair.

- `abilityKey` — namespaced string, e.g. `andrew:web_sword` (not hardcoded to the sword at the API boundary — ADR-007 seam)
- `readyAtTick` — absolute server tick at which the ability becomes usable again; `currentTick >= readyAtTick` ⇒ ready
- `startedAtTick` — tick the record was written; retained for diagnostics
- `v` — schema version, mirrors `L0-once`'s ADR-012 pattern so a future shared registry can read old records forward

**Storage** (`L0-cool-adr1`): a player-scoped dynamic property, one per `abilityKey` (e.g. `andrew:cd_web_sword`), holding a small serialized record. Survives disconnect/reconnect because it travels with the player entity's saved data.

**Lifecycle.** Absent, or `readyAtTick <= currentTick` ⇒ ready. Written once by `start()` — a whole-record replace, never a partial field update (mirrors ADR-012's torn-write avoidance). Read by `isReady()` and by the actionbar render loop.

## AbilityRegistration

The seam ADR-007 requires so a second legendary weapon can plug into the same cooldown service without a rewrite. Not a spec requirement by itself — justified by §8's forward-looking hand-priority clause and §12's reference to a project-wide cooldown system.

- `abilityKey` — one per weapon; v1 has exactly one: `andrew:web_sword`
- `durationTicks` — 600 for Web Sword (R-cool-001)
- `itemTypeId` — `andrew:web_sword`; the item that makes a player a "holder" (glossary: Holder)
- `readoutTranslateKey` — the `.lang` key (owned by `L0-item`) used to render the countdown

**v1 scope.** Exactly one registration exists; no registry beyond "one row" is required. Documented so the shape is right at weapon #2, not because v1 needs more. **Explicitly excludes** any hand-priority/arbitration field — that belongs to the deferred framework (Q-010; see component's "Explicitly not owned").

**Relates to:** `L0-cool-proc1` (write path for `CooldownRecord`), `L0-cool-proc2` (read path for both shapes).





### Entity: `andrew:web_sword` (L0-item-ent1)

**Links** — `part_of: ["L0-item"]` · `is_a: ["entity"]` · `relates_to: ["L0-once", "L0-keep", "L0-cool"]`

# Entity: `andrew:web_sword`

The shared entity of the whole L0 decomposition. This component defines its **static** shape; siblings attach **runtime** state to the same identifier (see decomposition-plan reduce pass §1).

## Static attributes owned by `L0-item`

| Attribute | Value | Source |
|---|---|---|
| Identifier | `andrew:web_sword` | namespace decision (project-level) |
| Base parity | Diamond Sword damage value; vanilla-compatible enchantments | §1 |
| Durability | Component **omitted** (infinite, unbreakable) | §1; precedent `miners_pickaxe.json` |
| `minecraft:enchantable` | `{ "slot": "sword", "value": <TBD> }` | §1; ASM-005/Q-007 |
| `minecraft:hand_equipped` | `true` | parity with any equippable weapon |
| `minecraft:max_stack_size` | `1` | parity with pickaxe / weapon convention |
| `minecraft:icon` | `andrew_web_sword` | §11 (RP half) |
| `menu_category` | `{ "category": "equipment", "group": "<sword-equivalent>" }` | §1, `L0-item-r002` |
| `minecraft:tags` | assumed `["minecraft:is_sword", "minecraft:sword", "minecraft:weapon"]` | ASM-item-2 (`L0-item-asm2`) |
| `minecraft:display_name` | `item.andrew:web_sword.name` | §10 |

## Runtime state attached by siblings (not defined here, listed for traceability)

| State | Owner | Nature |
|---|---|---|
| One-per-world craft flag | `L0-once` | World-scoped dynamic property (ADR-005) — not on the item instance |
| Per-instance ownership/provenance marker | `L0-keep` | Item-instance dynamic property, **blocked on Q-006** |
| Per-player cooldown key | `L0-cool` | Player-scoped service state (ADR-007), keyed by ability, not by item stack |

## Invariant

Any change to the static attributes above (e.g. damage value, enchant slot) must be reconciled against sibling expectations at L0 — a silent local change here can break `L0-trap`'s damage-parity assumption or `L0-qatg`'s AC-6.





### Entity: Web Sword Recipe (L0-item-ent2)

**Links** — `part_of: ["L0-item"]` · `is_a: ["entity"]` · `relates_to: ["L0-item-ent1", "L0-once"]`

# Entity: Web Sword Recipe

| Attribute | Value |
|---|---|
| Identifier | `andrew:web_sword` (recipe, same id as item per pickaxe precedent) |
| Format | `minecraft:recipe_shaped`, `format_version` matching platform (`1.21.0` per pickaxe precedent) |
| Pattern | Row 1: `" W "` · Row 2: `"WDW"` · Row 3: `" W "` |
| Key `W` | `minecraft:cobweb` |
| Key `D` | `minecraft:diamond_sword` |
| Result | `andrew:web_sword`, count 1 |
| Tags | `["crafting_table"]` |
| Unlock | at least one unlock item (precedent: pickaxe unlocks on its first-tier ingredient — here, plausibly `minecraft:diamond_sword` or `minecraft:cobweb`) |

## Notes

- This entity defines **shape only**. Whether a given craft attempt is *permitted to complete* (one-per-world gate) is `L0-once`'s runtime concern, evaluated at craft-completion time, not encoded in this recipe file.
- Diamond Sword is consumed as an ingredient — the recipe does not special-case *which* Diamond Sword (enchanted or not); the spec is silent on whether an enchanted Diamond Sword may be used. Not flagged as a blocking assumption (low impact, no acceptance test references it), but worth a one-line confirmation if the owner is asked about Q-007 anyway.





### Entity: Localization Catalogue (L0-item-ent3)

**Links** — `part_of: ["L0-item"]` · `is_a: ["entity"]` · `relates_to: ["L0-once", "L0-cool", "L0-item-r005"]`

# Entity: Localization Catalogue

The RU/EN `.lang` key set this component owns and reconciles on behalf of its siblings (`L0-item-r005`).

| Attribute | Value |
|---|---|
| Files | `packs/resource/texts/ru_RU.lang`, `packs/resource/texts/en_US.lang` |
| Naming convention (items) | `item.andrew:<identifier>.name` — e.g. `item.andrew:web_sword.name` |
| Naming convention (runtime messages) | Not yet established in the repo (no precedent exists — pickaxe has no runtime messages). Proposed: `andrew.web_sword.<event>`, e.g. `andrew.web_sword.first_craft`, `andrew.web_sword.cooldown` |
| Substitution mechanism | `rawtext` `translate` + `with` (ADR-009) — e.g. first-craft key takes the creator's name, cooldown key takes remaining seconds |

## Keys this component must publish for v1

| Key | RU | EN | Consumer |
|---|---|---|---|
| `item.andrew:web_sword.name` | Паутинный меч | Web Sword | Resource Pack (item name) |
| `andrew.web_sword.first_craft` (proposed) | *(TBD, needs `%%1` for creator name)* | *(TBD)* | `L0-once` |
| `andrew.web_sword.cooldown` (proposed) | *(TBD, needs `%%1` for seconds)* | *(TBD)* | `L0-cool` |

## Note

The exact key names for the two runtime messages are **not fixed by the spec** — they are this component's naming proposal, offered so `L0-once` and `L0-cool` have a concrete contract to build against rather than inventing their own keys independently (which would silently violate `L0-item-r005`'s centralization rule).





### Entity — Retention Ledger Entry (L0-keep-ent1)

# Entity — Retention Ledger Entry

**Links** — `part_of: ["L0-keep"]` · `is_a: ["entity"]` · `relates_to: ["L0-keep-ent2", "L0-keep-r002", "L0-keep-p001", "L0-keep-p002", "L0-keep-p003"]` · `governed_by: ["C-6", "C-7"]`

The single piece of durable state this component owns. One entry per bonded owner. It is simultaneously the retention record **and** the idempotency token that makes the retain→restore pair safe to replay (`L0-keep-r002`).

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `owner_id` | stable player identifier | Key. The player the sword returns to. Must be the identity that survives reconnect, not a display name (ASM-014). |
| `state` | `pending` \| `redeemed` | `pending` = the sword was withheld from a death drop and is owed back. `redeemed` = it has been returned. |
| `instance_ref` | provenance marker value (`L0-keep-ent2`) | Which sword instance is owed. **Conditional on Q-006.** |
| `retained_at` | tick / timestamp | Diagnostic; lets an operator see a stuck entry. |

## Lifecycle

```
(absent) --death, sword withheld--> pending --restore granted--> redeemed
                                      ^                              |
                                      +------ next death ------------+
```

- Only a `pending` entry may be redeemed. Redemption flips the state in the same operation that grants the item.
- A second respawn/join event finds `redeemed` and does nothing. This is the whole anti-dup mechanism.
- A new death re-arms the entry to `pending`. Entries are reused, not accumulated.

## Storage

World-scoped durable state on the stable `@minecraft/server` surface — the same class of storage ADR-005 chose for the craft flag, for the same reasons (C-6: must survive logout, world save and restart; C-1: stable API only).

**World-scoped, keyed by player** rather than stored on the player object, deliberately: a player-scoped property is not readable while that player is offline, and the reconnect-reconciliation path (`L0-keep-p003`) must be able to observe a `pending` entry belonging to a player who is not currently connected. It also means the ledger travels with the world, matching the craft flag's semantics.

## Invariants

1. At most one entry per `owner_id`. The ledger is a map, not a log.
2. A `pending` entry implies **zero** instances of that bonded sword exist in the world. The item is in the ledger *or* in an inventory, never both — this is the conservation law the whole component defends (`L0-keep-r002`).
3. The ledger is never read or written by `L0-once`, and never reads or writes the craft flag (`L0-keep-r004`).

## Boundary note

The ledger records **owed swords**, not swords in existence. It is not a census and must never be used as one — deriving anything by scanning the world for Web Swords is forbidden by C-4 and explicitly rejected in ADR-005.





### Entity — Web Sword Provenance Marker (L0-keep-ent2)

# Entity — Web Sword Provenance Marker

**Links** — `part_of: ["L0-keep"]` · `is_a: ["entity"]` · `relates_to: ["L0-keep-ent1", "L0-keep-r003", "L0-once"]` · `blocked_by: ["Q-006"]` · `source: ["CTR-005"]`

> **CONDITIONAL ENTITY.** The spec does not mandate this. It is the requirement CTR-005 shows to be *implied* by holding §4 and §14 together. It exists only if Q-006 is answered "yes".

A durable per-instance attribute on an `andrew:web_sword` item stack that records **how that instance came into the world**. It is what lets the restore predicate say *"this is the owner's sword"* rather than *"this is a Web Sword"*.

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `provenance` | `survival_craft` \| *(absent)* | Set at the moment of successful survival craft. **Absent** on `/give` and on Creative-inventory copies. |
| `bound_owner` | stable player id (optional) | The crafter. Present if the owner wants the sword bonded to a person rather than merely marked as crafted. |

Absence is meaningful and is the default: an unmarked Web Sword is an admin/test copy and is **outside** retention entirely.

## Semantics

- **Marked instance** → retained on death, restored on respawn, tracked in the Retention Ledger.
- **Unmarked instance** → behaves like any ordinary item. Drops on death, can be looted, can be destroyed. No ledger entry is created for it.

This is the branch that resolves CTR-005: §4's *«предмет должен вернуться тому же владельцу»* is scoped to the crafted sword, and §14's *«нет известных способов дюпа»* holds because the retained set is exactly the set the one-per-world gate already bounds to one.

## Who writes it — unresolved

The marker must be set **at craft completion**, which is inside `L0-once`'s handler, but it is **consumed and owned** by `L0-keep`. The parent decomposition states *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger… neither may write the other's"*. This entity does not fit either side of that line — filed as **CTR-006** against `L0`.

## Durability requirement

The marker must survive the operations an item stack normally survives: being dropped and picked up, moved between inventory slots, stored in a container, and — critically — **world restart** (C-6). A marker that is lost by any of these silently converts a crafted sword into an admin copy and turns retention off for that player without any error.

If the stable API offers no item-stack-durable custom attribute that survives all of the above, this entity is not implementable as specified, and Q-006's "no" branch applies. **Verify this before committing to the design** — it is the load-bearing technical assumption (ASM-015).





### Entity — FirstCraftAnnouncement (L0-once-ebrd)

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





### Entity — WorldCraftFlag (L0-once-ecft)

# Entity — WorldCraftFlag

**Links** — `part_of: ["L0-once"]` · `is_a: ["entity"]` · `relates_to: ["L0-once-r001", "L0-once-r002", "L0-once-r007", "L0-once-pcft"]` · `source: §3, §11` · `decided_by: ADR-005, ADR-012`

The single piece of durable state owned by this component. It records that the world's one survival craft of `andrew:web_sword` has been spent.

## Storage

A **world-scoped dynamic property** on the stable `@minecraft/server` surface (ADR-005). Not a scoreboard, not a marker entity, not an external file — all three were rejected at L0. Scope is the **world**, which on a dedicated BDS instance is also the server; copying the world copies the spent budget, which matches *«один раз на весь мир/сервер»*.

## Shape

Stored as a JSON string under a namespaced key, **not** as a bare boolean (ADR-012). Proposed key: `andrew:web_sword_craft_gate`.

| Attribute | Type | Required | Meaning |
|---|---|---|---|
| `v` | integer | yes | Record schema version. Starts at `1`. Lets a future weapon-framework migrate without re-opening the gate |
| `crafted` | boolean | yes | The gate itself. `true` = budget spent |
| `crafterName` | string | yes | Display name of the player who crafted it. Used in the first-craft announcement and re-usable in the blocked-craft denial message |
| `crafterId` | string | yes | Stable player identifier. Survives a name change; the name alone does not |
| `at` | number | yes | Epoch-ish timestamp or world tick of the claim. Diagnostic only — lets a log reader reconstruct when the budget was spent |

Absent property ⇒ budget unspent. This is the initial state of every new world and requires no bootstrap write.

## Lifecycle

- **Created** exactly once, in step 4 of `L0-once-pcft`, inside the same synchronous handler that read it.
- **Read** on every craft-completion event for `andrew:web_sword`, and nowhere else.
- **Never updated** after creation. A blocked craft does not touch it.
- **Never deleted** by game logic. There is no in-game reset path — see CTR-006 for why that is a question, not a settled decision.

## Invariants

1. **Write-once.** Any code path that can clear or overwrite `crafted: true` is a C-7 duplication path. (R-001)
2. **Durable across logout, world save and server restart.** Restart survival is an explicit §13 acceptance test. (R-002, C-6)
3. **Unaffected by death.** §12 is explicit: death during cooldown must not reset the flag. `L0-keep` must respect this and may not write here. (R-002)
4. **Sole authority.** No sibling component reads or writes it, and the gate is never derived from any other source such as counting swords in the world. (R-007)
5. **No instance linkage.** The record deliberately does **not** name the crafted item stack. It counts a *craft event*, not a sword. Adding an instance link would pull CTR-005's provenance question into this component, where it does not belong.

## Failure semantics

A failed write must leave the record absent, not partially written — which is why the payload is a single serialized value rather than several independent properties. A torn multi-property write could yield `crafted` set with no `crafterName`, producing a broken announcement and an unattributable gate.





### Entity — Acceptance Test (AT) (L0-qatg-ent1)

# Entity — Acceptance Test (AT)

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["entity"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-p001"]` · `spec: ["§13"]`

One row of the twelve-item list in §13. The unit the Acceptance Matrix is built from.

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `id` | `AT-1`..`AT-12` | Stable id, assigned in §13 bullet order (this analysis's numbering, not present in the spec text) |
| `spec_text` | RU quote | The literal §13 bullet |
| `owner_component` | `L0-item` \| `L0-once` \| `L0-keep` \| `L0-trap` \| `L0-cool` \| `L0-trap`+`L0-once` (AT-12 only) | The L1 component whose `concept-acceptance-criterion` artifact executes this test |
| `harness_mechanism` | one or more of: `npm test`, `bds:check`, `bds:gametest`, `iPad visual pass`, `2-client BDS LAN` | Where the evidence comes from (see `L0-qatg` component doc, harness table) |
| `environment` | `single-player` \| `multiplayer` \| `both` | Per §14's conjunction |
| `status` | `unclaimed` \| `claimed-no-artifact` \| `specified` \| `green` \| `red` | Current state as of this analysis |

## The twelve, as currently known

| AT | Spec fragment | Owner | Status at this analysis |
|---|---|---|---|
| AT-1 | Visible in Creative Equipment, catalogue/search, `/give` | `L0-item` | specified (`L0-item-ac*`) |
| AT-2 | Recipe = 4 Cobweb + Diamond Sword | `L0-item` | specified |
| AT-3 | First craft succeeds + announced; second blocked | `L0-once` | specified (`L0-once-accp*`) |
| AT-4 | Second craft still blocked after world restart | `L0-once` | specified |
| AT-5 | No durability loss after prolonged use | `L0-item` | specified |
| AT-6 | Normal melee = Diamond Sword, no cobweb | `L0-item` | specified |
| AT-7 | Use on valid target creates ~full 3×3×3 cobweb | `L0-trap` | claimed-no-artifact |
| AT-8 | Use out of reach: nothing, no cooldown spent | `L0-trap` | claimed-no-artifact |
| AT-9 | Reuse blocked 30s after success | `L0-cool` | claimed-no-artifact (component not yet deep-dived) |
| AT-10 | Protected block inside volume survives; valid cells still fill | `L0-trap` | claimed-no-artifact |
| AT-11 | No ground drop on death, no dup on return | `L0-keep` | specified (`L0-keep-ac01`, `ac02`) |
| AT-12 | Two clients see identical cobweb + world state | `L0-trap` + `L0-once` | claimed-no-artifact |

**Reading this table.** "claimed-no-artifact" means the decomposition plan already assigns an owner (§5/§6/§8 → `L0-trap`/`L0-cool`); it is a sequencing gap, not an ownership gap. `L0-qatg-p001` re-checks this table each time a sibling publishes.





### Entity — Acceptance Matrix (L0-qatg-ent2)

# Entity — Acceptance Matrix

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["entity"]` · `relates_to: ["L0-qatg-ent1", "L0-qatg-ent3", "L0-qatg-p001", "L0-qatg-r001"]`

The rolled-up artifact this component exists to produce: the twelve `L0-qatg-ent1` rows, aggregated into one table with an overall status. Not a new test format — a **reference structure**, pointing at existing sibling `concept-acceptance-criterion` artifacts and existing harness scripts rather than restating their content (`L0-qatg-adr1`).

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `rows` | `AT-1`..`AT-12` | See `L0-qatg-ent1` |
| `generated_at` | timestamp / analysis_version | When the matrix was last rebuilt |
| `unclaimed_count` | integer | §13 tests with zero owners — must be 0 before the matrix is "complete" |
| `duplicate_claim_count` | integer | §13 tests with more than one owner — must be 0 |
| `pending_artifact_count` | integer | Tests with a declared owner but no published AC artifact yet (**0** as of the reduce pass — see snapshot below) |
| `overall_status` | `incomplete` \| `complete-pending-execution` \| `green` \| `blocked` | Matrix-level rollup |

## Lifecycle

```
incomplete --all 12 rows claimed, artifacts exist--> complete-pending-execution
complete-pending-execution --harness runs, all rows green + DoD gate satisfied--> green
(any state) --regression on shipped platform (L0-qatg-r003)--> blocked
```

## Invariants

1. Every row traces to exactly one sibling artifact, **or to two when the row is a declared split-claim**. Split-claim rows are enumerated by L0 (ADR-018): AT-12 (`L0-trap` + `L0-once`, the multiplayer-determinism split), AT-9 (`L0-trap` + `L0-cool`, the success/cooldown seam), and the melee row (`L0-item` damage parity + `L0-trap` no-cobweb-on-swing). Outside that list, two owners is still a defect.
2. The matrix never contains criteria text duplicated from a sibling — only the reference (`L0-qatg-adr1`). If a sibling's criterion changes, the matrix reflects it automatically rather than needing a manual sync.
3. `overall_status` cannot be `green` while `L0-qatg-ent3` (the DoD gate) is unsatisfied, even if all twelve rows individually pass — the DoD adds conditions (no-dup across 4 vectors, no Preview dependency) that no single row carries alone.

## Current snapshot (this analysis)

*Superseded by the reduce-pass snapshot below.* At the time this component was deep-dived the author recorded `pending_artifact_count = 5`, believing `L0-trap` and `L0-cool` had not yet published acceptance criteria.

## Snapshot as corrected at reduce (analysis_version 2)

`unclaimed_count = 0` · `duplicate_claim_count = 0` (three declared split-claim rows, per invariant 1 as amended) · `pending_artifact_count = 0` · `overall_status = complete-pending-execution`.

`L0-trap` published `L0-trap-ac01`…`ac09` and `L0-cool` published `L0-cool-ac01`…`ac05` during the same run, before this component's artifacts were written; the "five pending" figure was stale on arrival rather than a real sequencing gap. Verified by reduce reading those artifacts on disk. The matrix is therefore **complete and awaiting execution**, not incomplete — which moves the remaining risk entirely onto the harness, where `L0-qatg-asm1` (two-client availability) and CTR-010 (four-vector dup reading) already sit.





### Entity — Definition-of-Done Gate (L0-qatg-ent3)

# Entity — Definition-of-Done Gate

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["entity"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-ac01", "L0-qatg-ac02", "L0-qatg-ac03", "L0-qatg-ac04", "L0-qatg-ac05", "L0-qatg-p002"]` · `spec: ["§14"]`

The five §14 conditions, modelled as subgates that must **all** be true for the Web Sword to count as a "самостоятельный готовый модуль" ready for the next weapon. This is the entity `L0-qatg-p002` evaluates.

## Attributes / subgates

| Subgate | §14 condition | Evidence source | AC |
|---|---|---|---|
| `imports_clean` | No content/dependency errors on the stable Bedrock target | `bds:check` load log | `L0-qatg-ac01` |
| `all_ats_pass` | Every §13 test green, single-player **and** ≥2-player | `L0-qatg-ent2` rollup | `L0-qatg-ac02` |
| `no_known_dup` | No known dup path — craft, death, reconnect, **and restart** (`L0-qatg-r005`) | `L0-keep`/`L0-once` dup-cycle GameTests | `L0-qatg-ac03` |
| `no_preview_dependency` | No mandatory Experiments/Preview dependency in shipped packs | `manifests.test.mjs`, `L0-qatg-r004` | `L0-qatg-ac04` |
| `module_ready` | All of the above hold → treat as standalone-ready, proceed to next weapon | derived (all four above) | `L0-qatg-ac05` |

## Evaluation rule

`module_ready` is a **derived** subgate, not independently evidenced — it is true iff the other four are true. This mirrors §14's own structure, where the fifth bullet is a consequence ("после прохождения тестов... можно считать") rather than a sixth independent check.

## Boundary note

This gate is evaluated **once per Web Sword release candidacy**, not per commit. Per-commit protection against shipped-platform regression is `L0-qatg-r003`'s job and runs continuously (`concept-decomposition-plan`: *"`qatg` runs continuously rather than last, since the existing harness already gates every commit"*). The DoD gate is the final, higher bar layered on top.





### Entity — CellVerdict (L0-trap-ecel)

# Entity — CellVerdict

**Links** — `part_of: ["L0-trap"]` · `is_a: ["entity"]` · `relates_to: ["L0-trap-ecub", "L0-trap-r006", "L0-trap-ad13"]`

One cell's classification result. 27 of these make a `CobwebCube`.

## Attributes

| Attribute | Type | Notes |
|---|---|---|
| `position` | block coordinate | Absolute, in the activating player's dimension |
| `verdict` | `permit` \| `skip` | Binary. There is no "maybe" — uncertainty resolves to `skip` (R-006) |
| `reason` | enum (below) | Why. Always populated, including for `permit` |

## `reason` values

| Value | Meaning | Rung |
|---|---|---|
| `unloaded` | Cell not readable / outside the accessible area | 1 (R-007) |
| `entity-present` | A living entity occupies the cell | 2 (§6) |
| `block-entity` | Container or functional block with contents/data | 3 (§6, ASM-007) |
| `indestructible` | bedrock, barrier, command block, end portal frame, … | 4 (§6, ASM-007) |
| `already-web` | Cell is already `minecraft:web` — no-op skip | 5 |
| `unclassified` | Not positively recognised as ordinary and replaceable | 7 — **the deny-by-default branch** |
| `ordinary` | Positively classified as replaceable ⇒ `permit` | 6 |

Rung numbers match the ladder in `L0-trap-pfil` phase A; classification short-circuits on the first match, so `reason` is always the *cheapest* applicable explanation.

## Why `reason` is retained rather than collapsed to a boolean

Because the two ways this component fails are both silent, and the reason code is the only thing that distinguishes them under test. A cube that places 12 of 27 cells is correct next to a bedrock floor and catastrophic next to a chest wall; `permittedCount` alone cannot tell those apart, `skipReasons` can. `L0-trap-ac03` asserts on `reason`, not on a count.

`unclassified` deserves specific monitoring: a high rate of it means the deny-list is mis-tuned and the weapon is quietly useless, which is the safe direction to fail (TC-5) but still a bug worth seeing.

## Invariant

`verdict = permit` ⟺ `reason = ordinary`. No other reason may produce a write. This is R-006 restated as a type-level constraint, and it is the single line most worth reviewing in the whole component.





### Entity — CobwebCube (placement plan) (L0-trap-ecub)

# Entity — CobwebCube (placement plan)

**Links** — `part_of: ["L0-trap"]` · `is_a: ["entity"]` · `relates_to: ["L0-trap-etgt", "L0-trap-ecel", "L0-trap-pfil", "L0-trap-ad15"]`

The complete decision record for one activation: 27 cells, each with a verdict, computed **before** any block is written (ADR-015). Transient; discarded when the handler returns.

## Attributes

| Attribute | Type | Notes |
|---|---|---|
| `centre` | block coordinate | From `TargetResolution.centre` |
| `cells` | `CellVerdict[27]` | Fixed length. Always 27, including cells that will be skipped |
| `permittedCount` | 0…27 | Derived. Drives the success predicate — see CTR-008 for the `0` case |
| `skipReasons` | count by reason | Derived; diagnostics and GameTest assertions only |

## Geometry

27 cells = `centre` ± 1 on each of X, Y, Z, **including the centre cell itself** (ASM-008). §5 says only *«куб … размером 3×3×3, центрированный на целевой позиции»*.

This is the component's most consequential under-specification. §13's acceptance test — *«приблизительно полный 3×3×3 куб Cobweb вокруг центра»* — is loose enough to pass a cube offset by one on every axis, so **the release gate provides no protection here**. Raised as **Q-011**. The GameTest written by `L0-qatg` must assert the exact 27 coordinates, not an approximate block count, or the gate stays blind.

## Lifecycle

1. Built in `L0-trap-pfil` phase A from pure world reads. Immutable once built.
2. Consumed in phase B: every `permit` cell is set to `minecraft:web`.
3. Discarded. Nothing about the cube is recorded in the world — the placed cobweb carries no marker, no owner and no expiry (R-005).

## Why the plan is materialised instead of placing as it classifies

Three reasons, in order of weight:

1. **Determinism** (R-008) — classify-then-write cannot depend on write order; classify-while-writing can, because cell *n* would observe the cobweb from cell *n-1*.
2. **Atomicity of failure** — an exception during classification leaves the world untouched; an exception during an interleaved loop leaves a half-cube.
3. **Testability** — the plan is exactly the artefact a GameTest asserts against, which is how `L0-trap-ac03` distinguishes "skipped the chest" from "happened not to reach the chest".





### Entity — TargetResolution (L0-trap-etgt)

# Entity — TargetResolution

**Links** — `part_of: ["L0-trap"]` · `is_a: ["entity"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-ecub"]`

The answer produced by target resolution: *where the cube goes, and why*. Transient — it exists for the duration of one handler invocation and is never persisted (TC-3).

## Attributes

| Attribute | Type | Notes |
|---|---|---|
| `outcome` | `resolved` \| `none` | `none` means the activation fails free (R-004) |
| `centre` | block coordinate | The cube's centre cell. Undefined when `outcome = none` |
| `kind` | `entity` \| `block` \| `near-point` | Which of §5's three target forms matched |
| `distance` | number (blocks) | Measured from the player's eye; must be ≤ the reach bound (R-002) |
| `hitEntityId` | id \| null | Present only when `kind = entity`; recorded for diagnostics, never used to mutate the entity |
| `dimension` | dimension ref | The activating player's dimension; all 27 cells resolve inside it |

## Why `kind` and `distance` exist

Neither is needed to place the cube. Both exist so a GameTest can assert **why** a target resolved rather than only that one did — the difference between "the cube appeared" and "the cube appeared for the right reason" is what makes `L0-trap-ac06` (wall blocking) and `L0-trap-ac02` (out of reach) meaningful tests instead of coincidences.

## The three target forms (§5)

*«Целью может быть точка на блоке, игрок/живая сущность или точка непосредственно рядом с владельцем, если она находится в допустимой reach-зоне.»*

All three collapse into one `centre` before the cube is expanded. The mapping from each form to a cell is the component's least-specified area:

- **block point → cell** — ASM-008 / **Q-011**. Whether the cube centres on the hit block itself or on the adjacent air cell at the hit face is unanswered, and §13's loose acceptance test will not distinguish them.
- **entity → cell** — ASM-019. Working assumption: the block cell containing the entity's feet position.
- **near point → cell** — ASM-018. Working assumption: the block cell at the ray's end point when nothing was hit inside reach.

## Invariants

- `outcome = resolved` ⟹ `distance ≤ reachBound` (R-002).
- `outcome = resolved` ⟹ `centre` is in a readable chunk, or the whole cube degenerates and CTR-008 applies.
- Every field is derived from server-read state only (R-008).





## Components (code-derived)

### Cooldown & Actionbar UI (L0-cool)

# Cooldown & Actionbar UI

**Links** — `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-trap", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]`

## Responsibility

Own the Web Sword ability's per-player cooldown and its player-visible countdown: the exact-30-second timer keyed by **player + ability** (not by item instance), the rule that only a *confirmed successful* activation starts the clock, the actionbar readout of remaining time while the sword is held, and the ability-key seam ADR-007 reserves for a future cross-item cooldown framework that does not exist yet. Spec sections owned: §8 in full, §12's *«cooldown должен сохраняться настолько, насколько это требуется общей системой cooldown проекта»*, and the cooldown half of §9's per-activation independence.

## Why this is its own component

Every sibling deals with a one-shot event (craft, death, cobweb placement). This component is the only one with **standing timed state and a recurring render loop** — the failure modes are different in kind: a timer that doesn't persist is a logout-abuse exploit (C-7's spirit), a render loop that isn't scoped is a C-4 violation, and a timer keyed wrong (per item instead of per player) is a balance bypass (ASM-009). None of `L0-item`, `L0-once`, `L0-keep` or `L0-trap` share this shape.

## Inputs

| Input | Origin | Notes |
|---|---|---|
| "Activation succeeded" signal for the Web Sword ability | `L0-trap`, after cell placement completes | This component never decides success; it only reacts to it — decomposition plan: *"Success is decided by L0-trap; the cooldown is consumed by L0-cool"* |
| "Is this ability ready?" query, before placement | `L0-trap`, step 2 of ADR-006's forced ordering | Must answer before any world state is written |
| Held-item state per online player, each render tick | Bedrock stable equipment surface | Drives which players get an actionbar update |
| Translate keys for the countdown string | `L0-item`'s `.lang` catalogue | Consumed only, never authored here (C-9, ADR-009) |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **Cooldown record** (`L0-cool-ent1`) — per player, per ability-key ready-at time | This component, read on every check/render | Keyed by player + `abilityKey`, never by item stack (ASM-009, ADR-007) |
| `isReady(player, abilityKey)` query result | `L0-trap`, gate before cell placement | Pure read; never mutates state |
| `start(player, abilityKey)` mutation | Called by `L0-trap`, only after a confirmed successful activation | The only write path that arms the timer |
| Actionbar countdown text | The holding player's client | Localized rawtext, `L0-item` keys + seconds substitution |
| Ability-key registration seam (`L0-cool-ent1`) | Future weapons (deferred) | Web Sword registers one key now; the API accepts more without redesign |

## Explicitly not owned

- **Whether an activation succeeds** — reach validation, targeting and cell placement are `L0-trap`. This component answers "ready?" and starts the clock; it never evaluates reach or targets.
- **The `.lang` catalogue** — `L0-item` owns every translate key this component consumes, including the countdown string itself.
- **The general cross-item cooldown framework** referenced by §12 — it does not exist anywhere in the KV. This component ships a single-item implementation with the ability-key seam (ADR-007) and must not invent the framework.
- **Main-hand/off-hand priority arbitration** (§8) — cannot be tested or meaningfully implemented with one legendary item. Provisionally deferred in `concept-boundary` (Q-010); this component keeps only the ability-key indirection a future rule would need.

## Architecture in one paragraph

The cooldown is a small **per-player, per-ability-key service** (ADR-007), not sword-local state. A successful activation writes one **cooldown record** — this component's proposal is a player-scoped dynamic property keyed by ability id, so the record travels with the player and survives disconnect/reconnect without extra plumbing (`L0-cool-adr1`; recommended default for open question Q-009). A single recurring interval, scoped **only to players currently holding a tracked ability's item** (never all online players, never a world scan), recomputes remaining time each cadence tick and renders the actionbar or clears it (also `L0-cool-adr1`). `L0-trap` is the sole caller of the service's mutating and gating entry points; this component never listens for the use-event itself.

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | Dynamic properties and `onScreenDisplay.setActionBar` are both stable-surface; no Beta dependency |
| **C-3** server-authoritative | Remaining time is computed from the server's own record and tick clock, never trusted from a client |
| **C-4** no per-tick global scan | The **only** child permitted a recurring tick, and only because it is scoped to sword holders — not the world (R-cool-004) |
| **C-6** durable world state | Extended here to *durable per-player* state — the cooldown record must outlive logout, in line with Q-009's recommended answer |
| **C-7** no duplication / no-advantage paths | A cooldown that resets on reconnect is a logout-abuse path; persisting it closes that door |
| **C-9** localization is structural | The countdown string is a translate key with a `with` substitution, never a literal (R-cool-005) |

## Open items carried

- **CTR-004** (inherited, root-level, not re-filed) — the framework §12 assumes doesn't exist; this component resolves it locally via ADR-007's seam rather than waiting for it.
- **Q-009** (persistence across logout) — treated as **provisionally answered "persist"** for design purposes (`L0-cool-asm1`, `MUST_ASK`); confirm before implementation.
- **Q-010** (hand-priority scope) — treated as **provisionally deferred**; only the seam ships in v1 (see "Explicitly not owned" above).
- **ASM-009** (inherited) — cooldown keyed per player + ability; this component's entity model enforces it structurally (R-cool-003).

## Risk note

The two failure modes that matter most are silent: a record that resets on reconnect looks correct in every single-session test and only shows up as a logout-abuse exploit under adversarial play; a render loop that iterates all online players instead of sword-holders looks correct at one player and only shows up as a performance regression at server scale — exactly the shape C-4 warns about.





### Item Definition, Recipe & Localization (L0-item)

# Item Definition, Recipe & Localization

**Links** — `title: Item Definition, Recipe & Localization` · `aliases: ["L0-item"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]`

## Responsibility

Owns everything about `andrew:web_sword` that exists **before any Script API logic runs**: the static item component definition, the crafting recipe, the Resource Pack presence (icon, display name), and the full RU/EN translate-key catalogue that this item — and every sibling component that emits a runtime message — draws from. Spec sections owned: §1 (Core), §2 (Recipe), §7 (Passive Behavior), §10 (Localization), and the Resource Pack half of §11 (Technical Architecture).

## Inputs

- Web Sword spec §1, §2, §7, §10, §11 (`webswordspecv1ruen-part-1`, `-part-2`)
- Shipped platform precedent this component extends, not reinvents (C-10): `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `packs/resource/texts/{en_US,ru_RU}.lang`, `packs/resource/textures/item_texture.json`
- Vanilla Diamond Sword's documented component shape (damage, enchant slot, tags) — not present anywhere in this repo, so treated as an assumption (`L0-item-asm2`), not a copyable source

## Outputs

- `packs/behavior/items/web_sword.json` — item definition
- `packs/behavior/recipes/web_sword.json` — shaped recipe
- `packs/resource/textures/items/andrew_web_sword.png` + an `item_texture.json` entry — icon
- `packs/resource/texts/ru_RU.lang` / `en_US.lang` — the `item.andrew:web_sword.name` pair **plus every other key any sibling component needs** (first-craft announcement, cooldown readout)

## What this component does NOT own

- The one-per-world craft gate, its persistent flag, and the broadcast trigger (`L0-once`) — this component defines the recipe's *shape*; whether a craft is *allowed to complete* is decided elsewhere.
- Any dynamic property, ownership marker, or death-retention logic (`L0-keep`).
- The active-ability handler, targeting, and cobweb placement (`L0-trap`) — this component only guarantees that a **plain melee hit** does nothing beyond vanilla Diamond Sword damage (§7).
- The cooldown timer and actionbar readout (`L0-cool`).

## Ownership rule inherited from the decomposition plan

Per `concept-decomposition-plan`: *"Localization ownership is central, use is distributed."* This component is the **sole writer** of `.lang` entries; `L0-once` and `L0-cool` are consumers that must request keys from here rather than hardcoding literals (C-9, ADR-009). This component must reconcile the sibling key list, not merely publish its own item name.

## Key open risk

Q-007 / ASM-005 (parent, `MUST_ASK`): does `minecraft:enchantable` actually function on an item with **no** `minecraft:durability` component on this Bedrock build? The pickaxe (`slot: "pickaxe"`) encodes the identical hypothesis, but Stage 1 never recorded the empirical outcome. The sword repeats the shape with `slot: "sword"`. Verify before or alongside implementation — see `L0-item-asm1`.

## Relation to siblings

`L0-once`, `L0-keep`, `L0-cool` and `L0-trap` all attach behavior/state to the **same entity** this component defines (`andrew:web_sword`) — per the decomposition plan's reduce pass: *"`andrew:web_sword` is the single shared entity — `L0-item` defines it, the others attach state to it."* Any attribute conflict between this component's static definition and a sibling's runtime expectation must be reconciled at L0, not silently overridden here.





### Death Retention & Anti-Duplication (L0-keep)

# Death Retention & Anti-Duplication

**Links** — `title: Death Retention & Anti-Duplication` · `aliases: ["L0-keep", "Death Retention"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-once", "L0-cool", "L0-item", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governed_by: ["C-1", "C-5", "C-6", "C-7", "C-10"]` · `implements: ["WS-9", "WS-10"]`

> **STATUS: analysis complete, implementation blocked on Q-006 / CTR-005.** Everything below that depends on telling one Web Sword instance from another is written *conditionally*. Do not build the ledger before the owner answers.

## Responsibility

Own the lifecycle of a Web Sword across **player death** and **session/world discontinuity**, such that the item is neither *lost* nor *multiplied*. Spec §4 and §12.

Two obligations that pull in opposite directions:

- **Retention (WS-9).** The owner's sword must not appear as a death drop, and must be back in the owner's hands after respawn.
- **Anti-duplication (WS-10, C-7).** Death, disconnect/reconnect and server restart must not — alone or in combination — yield a second copy. C-7 states this absolutely: *«Нет известных способов дюпа через смерть или reconnect.»*

Retention is implemented by *removing* an item from the world and *re-granting* it later. Every such pair is a dup primitive if the two halves can ever both run, or run twice. The entire component is therefore an **idempotency problem**, not an inventory problem.

## In scope

| Ref | Obligation | Spec |
|---|---|---|
| K-1 | Web Sword is excluded from the death drop — it never lands on the ground | §4 |
| K-2 | On respawn the same owner receives exactly one instance back | §4 |
| K-3 | The retain→restore pair is idempotent across death, disconnect/reconnect and server restart | §4, §12 |
| K-4 | Death during ability cooldown creates no copy | §12 |
| K-5 | Death never resets the one-per-world craft flag | §12 |
| K-6 | Retention state is durable world-level state, surviving logout/save/restart | §11, C-6 |

## Out of scope — belongs to siblings

- **The craft flag itself** (`L0-once`). K-5 is a *read-only invariant this component must not breach*; the flag's storage and semantics are `L0-once`'s. Per the parent ownership rule, neither child writes the other's state.
- **Cooldown persistence across death** (`L0-cool`). K-4 only forbids *item* duplication during the cooldown window; whether the timer itself survives is Q-009.
- **The item definition and its `.lang` keys** (`L0-item`). If retention emits any player-visible message, the key is consumed from `L0-item`'s catalogue (C-9, ADR-009); this component adds no literal strings.
- **Non-Web-Sword inventory.** Everything else follows vanilla death rules untouched — ADR-008 rejects `keepInventory` precisely to avoid this blast radius.

## Interfaces

**Consumes**
- Death / drop-path event on the stable `@minecraft/server` surface (ASM-013).
- Respawn event for the same player.
- Player join event (for reconnect reconciliation).
- Instance **provenance marker** written at craft time — *pending Q-006*, and written by `L0-once`'s handler (see CTR-009, resolved at L0 by ADR-016).

**Produces**
- A durable **Retention Ledger** entry per bonded owner (`L0-keep-ent1`).
- Exactly one restored `andrew:web_sword` instance per redeemed entry.

**Touches nothing else.** No world blocks, no other players' inventories, no craft flag.

## Core design (ADR-008, refined here)

Intercept the drop rather than change the gamerule. Concretely, the retain and restore halves are separated by a **durable ledger entry that acts as the idempotency token**:

1. **Retain** — on death, remove the bonded sword from the drop set and write a ledger entry `owner → pending`. Writing the entry and removing the item must be observably atomic (`L0-keep-r002`).
2. **Restore** — on respawn *or* on next join if respawn was missed, grant one instance **only if** an entry is `pending`, then flip it to `redeemed` in the same operation. A second event finds nothing pending and is a no-op.

The ledger is what makes restart safety free: an entry written before the crash is still `pending` after it, so a player who died and immediately crashed the server is made whole on next join — exactly once. This is `L0-keep-p003`.

**Why not "give if missing" at respawn** — rejected in ADR-008 and reconfirmed here: it cannot distinguish "died and lost it" from "an admin took it" or "the player is legitimately carrying an admin copy", so it dupes on the third case. The ledger replaces inference with a record.

## The blocking problem (CTR-005 / Q-006)

The restore predicate is *"does this player still have **their** sword?"* The spec permits unlimited Creative/`/give` copies (§3, §4) while specifying **no way to distinguish instances**. Without provenance, retention and anti-dup are not simultaneously satisfiable — see CTR-005's three-way case analysis.

This component's position: **adopt option three** — retention applies only to instances carrying a durable provenance marker set at survival craft. It is the only branch that satisfies §4 and §14 together. It requires a spec addition the owner must approve (Q-006).

Everything downstream is shaped by the answer:
- **Yes (recommended)** → the ledger binds `player → marked instance`, admin copies drop normally on death like any other item, and §14 holds without qualification.
- **No** → retention must be narrowed to "the first Web Sword a player ever acquires" or to nothing at all, and §14's absolute no-dup claim must be relaxed in writing to exclude admin copies. Two acceptance criteria (`L0-keep-ac05`, `L0-keep-ac06`) change meaning.

## Risk profile

§15 names death-retention/anti-dup as one of the three top cost drivers, alongside one-per-world persistence and multiplayer edge cases — and all three are governed by C-6 and C-7. The distinguishing risk here is that **failures are silent and permanent**: a dup path produces a second legendary item that persists in the world indefinitely, cannot be detected after the fact without auditing every inventory, and directly defeats the one-per-world design that `L0-once` exists to enforce. Test the failure modes (`L0-keep-ac03`, `ac04`) before the happy path.





### One-per-World Craft Gate (L0-once)

# One-per-World Craft Gate

**Links** — `title: One-per-World Craft Gate` · `aliases: ["L0-once", "One-per-World Craft Gate", "craft gate"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-keep", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governs_files: ["src/main.ts", "packs/resource/texts/ru_RU.lang", "packs/resource/texts/en_US.lang"]`

## Responsibility

Enforce the spec's scarcity rule: **in Survival, `andrew:web_sword` may be successfully crafted exactly once per world/server, forever.** This component owns the durable world-level flag that records that the craft budget has been spent, the enforcement of the block on every subsequent survival craft, the localized broadcast that announces the first craft and names its creator, and the exemption that keeps Creative crafting and `/give` outside the budget entirely.

Source: §3 in full, §9's craft-race clause, §12's *«смерть … не должна … сбрасывать persistent one-per-world flag»*, and the three §13 tests that exercise first craft, second craft and post-restart second craft.

## Why this is its own component

The gate is not a feature of the item — it is a piece of **durable global state with a concurrency contract**. §15 names one-per-world persistence as one of the three top cost drivers. The failure modes here are unlike every sibling's: a lost flag silently un-spends the world's budget, a double-write silently mints a second sword, and both are invisible until a player exploits them. That earns isolation from `L0-item` (which owns the item and recipe as static definitions) and from `L0-keep` (which owns per-instance ownership).

## Inputs

| Input | Origin | Notes |
|---|---|---|
| Craft-completion signal for `andrew:web_sword` | Bedrock stable script event surface | The enforcement point; see ADR-011 |
| Crafting player's game mode | `Player.getGameMode()` at craft time | Discriminates survival craft from Creative craft (R-003) |
| Crafting player's name | The same player object | Substituted into the announcement (`with`) |
| `andrew:web_sword` item identity and recipe | `L0-item` | The gate does not define either |
| Translate keys for announcement and denial text | `L0-item`'s `.lang` catalogue | Consumed, never authored here (C-9, ADR-009) |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **World craft flag** (`L0-once-ecft`) — durable record that the budget is spent | This component, on every subsequent craft | Sole authority (R-007). No sibling may write it |
| First-craft broadcast (`L0-once-ebrd`) | All online players | Localized rawtext, names weapon + creator |
| Blocked-craft denial outcome | The crafting player | Ingredients returned where the API permits (R-005, CTR-003) |
| Craft-event acceptance criteria | `L0-qatg` | Maps to §13 tests 3, 4 and part of 12 |

## Explicitly not owned

- **The item, the recipe, the icon, the `.lang` catalogue** — `L0-item`. This gate consumes keys and reconciles its list with that owner.
- **Which sword instance belongs to which player, and death/respawn restoration** — `L0-keep`. Per the decomposition plan's ownership rule, `L0-once` owns the *craft flag*; `L0-keep` owns the *item ledger*. Neither writes the other's state. §12's "death must not reset the flag" is an invariant `L0-keep` must respect, expressed here as R-002.
- **Counting swords in the world.** The flag counts *craft events*, not instances (`L0-once-gcrd`). Deriving the gate by scanning for existing swords is forbidden — it violates C-4 and contradicts §4's admin copies (R-007, ADR-005 rejected alternative).
- **Cooldown of any kind.** `L0-cool`. The craft gate has no timer; it is one-shot and permanent.

## Architecture in one paragraph

The flag is a **world-scoped dynamic property** on the stable `@minecraft/server` surface (ADR-005), holding a small versioned record rather than a bare boolean (ADR-012). Enforcement hooks the craft-completion event server-side (C-3) and performs a synchronous **read-check-write** inside a single handler invocation; because the Bedrock script host runs one handler to completion before the next, that sequence is the atomic claim that makes the §9 craft race safe (ASM-015, R-004). The first caller to observe an unset flag sets it, emits the broadcast, and keeps the sword. Every later caller observes a set flag, removes the crafted result and — where the stable API permits — returns the ingredients (ASM-011, R-005). Nothing polls; the component is entirely event-driven, which satisfies C-4 by construction.

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | The flag must be a stable-surface dynamic property. If only a Beta API can express pre-craft veto, the *mechanic* degrades to detect-and-refund — the channel does not change |
| **C-3** server-authoritative | Game mode and flag state are read server-side; no client input gates the craft |
| **C-4** no per-tick scan | The gate is event-driven only; it adds no recurring tick |
| **C-5** dedicated-multiplayer safety | Two simultaneous crafts must yield exactly one success (R-004). BDS is the test surface, not single-player |
| **C-6** durable world state | The flag must survive logout, world save and restart — the last is an explicit §13 test (R-002, `L0-once-accp3`) |
| **C-7** no duplication paths | A gate that can be re-opened *is* a craft dup path. R-002 and R-004 exist to close it |
| **C-9** localization is structural | The announcement and any denial message are translate keys, never literals (R-006) |
| **C-10** preserve the platform | Lands in the existing BP/RP alongside `andrew:miners_pickaxe` (ADR-010); the 7 existing suites must stay green |

## Open items carried by this component

- **CTR-003** (inherited) — "blocked without losing ingredients" is required, hedged by *«насколько это позволяет стабильный API»*, and has no §13 test. Refined here as `L0-once-accp7`, which is written as **conditional** on the owner's answer. Not self-resolved.
- **CTR-006** (new, raised here) — the craft budget is spent irreversibly, but the spec guarantees the sword against death only; it is silent on the sword being destroyed by lava/void/`/clear`, which leaves a world permanently with zero obtainable Web Swords.
- **ASM-011, ASM-012** (inherited from L0) plus **ASM-013…015** (new): non-survival game modes, craft-event granularity, and script-host atomicity.
- **Q-008** refinement — see `L0-once__concept-client-question`.

## Risk note

The two highest-consequence failures are both silent. A flag that fails to persist (wrong scope, written after a throw, lost on an unclean shutdown) re-opens the craft budget and mints swords — that is a C-7 dup path discovered only by a player. A flag written *before* the craft is confirmed spends the budget on a craft that never completed, permanently denying the world its sword with no recovery path (CTR-006). The ordering **confirm craft → claim flag → announce** is therefore load-bearing, and both directions need their own acceptance test.





### Verification, Acceptance & Definition of Done (L0-qatg)

# Verification, Acceptance & Definition of Done

**Links** — `title: Verification, Acceptance & Definition of Done` · `aliases: ["L0-qatg", "QATG", "Verification & DoD"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool"]` · `see_also: ["webswordspecv1ruen-part-2", "webswordspecv1ruen-part-3"]` · `governed_by: ["C-1", "C-5", "C-9", "C-10", "C-11", "C-12"]` · `implements: ["WS-18"]`

## Responsibility

Own §13 (Acceptance Tests), §14 (Definition of Done) and §15 (Estimate) of the Web Sword spec: turn the twelve acceptance tests into an executable matrix, map each onto the existing verification harness (`tests/`, `packs/gametest`, `packs/selftest`, `bds:check`, `bds:gametest`, the iPad visual pass), gate the "no Preview/Experiments dependency" rule, and protect the shipped platform (pickaxe + Stage 0/1 infra) from regression under C-10.

This component **invents no acceptance criteria of its own on the feature side**. Per the decomposition plan: *"`L0-qatg` does not invent criteria. It aggregates and makes executable what the other five define. If it finds a §13 test with no owner, that is a gap to report upward, not to absorb."* Its own criteria are the five §14 Definition-of-Done conditions, which are genuinely gate-level and belong to no single sibling.

## Inputs

- Web Sword spec §13, §14, §15 (`webswordspecv1ruen-part-2`, `-part-3`)
- Every sibling's `concept-acceptance-criterion` artifacts (`L0-item-ac*`, `L0-once-accp*`, `L0-keep-ac*`, and — pending at analysis time — `L0-trap-*`, `L0-cool-*`)
- The live harness: `tests/*.test.mjs` (7 suites), `packs/gametest` + `src/gametest/main.ts`, `packs/selftest` + `src/selftest/main.ts`, `scripts/bds-check.mjs`, `scripts/bds-gametest.mjs`, `package.json` scripts (`test`, `bds:check`, `bds:gametest`)
- C-1…C-12 (`concept-constraint`, node `L0`), inherited unchanged

## Outputs

- The **Acceptance Matrix** (`L0-qatg-ent2`): one row per §13 test, mapped to owner component, harness mechanism, and environment
- The **Definition-of-Done Gate** (`L0-qatg-ent3`): the five §14 conditions as an aggregate go/no-go
- A **gap report** naming any §13 test with zero or more-than-one claimed owner
- No new files in `packs/` or `src/` — this component governs process, not product code

## In scope

| Ref | Obligation | Spec |
|---|---|---|
| Q-1 | Every §13 test has exactly one owning sibling and at least one harness mechanism | §13 |
| Q-2 | Import/load correctness on the stable Bedrock target, no content/dependency errors | §14 |
| Q-3 | All twelve tests pass in a single-player world, and the DoD is corroborated by a ≥2-player test | §14, §9 |
| Q-4 | No known duplication path — across craft, death, disconnect/reconnect, **and restart** (C-7's four-vector reading; see `L0-qatg-ctr1`) | §14, C-7 |
| Q-5 | No mandatory Experiments/Preview dependency in the shipped packs | §14, C-1 |
| Q-6 | The 7 existing pickaxe-era `npm test` suites, `bds:check`, and `bds:gametest` stay green | C-10 |
| Q-7 | The iPad visual pass covers what BDS logs structurally cannot (Creative visibility, icon, RU/EN rendering, actionbar) | C-11 |

## Out of scope — belongs to siblings

- **Defining what "correct" looks like for any single mechanic.** `L0-item` through `L0-cool` each own their own rules, entities and edge cases; this component only aggregates their `concept-acceptance-criterion` output into one matrix.
- **Fixing a failing test.** This component reports gate status; it does not own the code paths under test.
- **The cross-item cooldown framework, or any Stage-2 weapon beyond the Web Sword** — both explicitly deferred at `L0` (`concept-boundary`).

## The harness, as it exists today

Verification is **not one thing** — it is five mechanisms with disjoint blind spots, matching C-11's three-hop loop:

| Mechanism | Runs | Proves | Blind to |
|---|---|---|---|
| `npm test` (`tests/*.test.mjs`, 7 suites) | Node, no engine | Build output, manifests, static item/recipe shape | Anything requiring a live world |
| `bds:check` (`packs/selftest`, stable API) | Docker BDS | In-engine static claims (item exists, is enchantable, recipe resolves) — the machine-checkable half of what used to need an iPad | Player-driven behaviour, multiplayer, death |
| `bds:gametest` (`packs/gametest`, **Beta** API, dev-only) | Docker BDS, `Beta APIs` experiment on a throwaway world | Scripted `SimulatedPlayer` behaviour: targeting, death, respawn, multi-player-in-one-tick races | Anything the Beta channel would make a **runtime** dependency if it leaked into `packs/behavior` (forbidden, C-1) |
| iPad visual pass | Real device, one iPad | Creative Equipment placement, icon, RU/EN text rendering, actionbar readout | Anything requiring two simultaneous clients (only one device exists — ASM-010) |
| Genuine 2-client BDS LAN | Docker BDS + ≥2 real clients, if borrowable | The literal §14 "two players" requirement | Not guaranteed available — see `L0-qatg-asm1` |

Nothing in this table is new infrastructure. `L0-qatg`'s job is to say, for each of the twelve tests, **which row(s) of this table produce its evidence** — not to build a sixth mechanism.

## Relation to siblings

Every sibling emits `concept-acceptance-criterion` artifacts for its own slice; per the decomposition plan's reduce pass #2, those "funnel into `L0-qatg`". This component does not fill gaps by writing siblings' criteria itself; it reports them and re-checks when the siblings publish.

> **Corrected at reduce (analysis_version 2).** This section originally reported that `L0-trap` had no acceptance criteria and `L0-cool` had not been deep-dived, leaving five §13 tests with a declared owner and no artifact. That was already false when written: `L0-trap-ac01`…`ac09` and `L0-cool-ac01`…`ac05` were on disk. **All twelve §13 tests have a published owning artifact**; `pending_artifact_count = 0`. Three rows are declared *split-claims* (AT-9, AT-12, and the melee row) rather than double-claim defects — see `L0-qatg-ent2` invariant 1 as amended and L0's ADR-018.

## Risk profile

§15 does not name verification itself as a cost driver, but three of its named drivers — persistence, dup-safety, multiplayer — are exactly the things this component's harness struggles hardest to prove, per C-11. The single largest risk owned here is **a false green**: a gate that reports DoD-satisfied while restart-dup safety (C-7's fourth vector) or the genuine two-player check (§14) was never actually exercised, only assumed. Both are captured as open items (`L0-qatg-ctr1`, `L0-qatg-asm1`) precisely so the gate cannot close silently around them.





### Active Ability — Targeting & Cobweb Placement (L0-trap)

# Active Ability — Targeting & Cobweb Placement

**Links** — `title: Active Ability — Targeting & Cobweb Placement` · `aliases: ["L0-trap", "Active Ability", "trap", "cobweb placement"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-cool", "L0-item", "L0-once", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governs_files: ["src/main.ts", "packs/behavior/scripts/main.js", "src/gametest", "src/selftest"]`

## Responsibility

Own everything between **the player using a held `andrew:web_sword`** and **the world containing (or deliberately not containing) a new cobweb trap**. Concretely: hooking the item-use activation, resolving a target server-side inside normal survival reach, deciding whether the activation *succeeded*, and writing up to 27 real vanilla Cobweb blocks through a deny-by-default per-cell safety filter.

Source: §5 in full, §6 in full, §9's determinism and concurrent-activation clauses, §11's server-side/no-per-tick-scan clauses, and §12's four ability edge cases (out of reach, wall-blocking, protected cells, chunk edge, logout-after-activation).

This component owns the **success predicate**. Everything that happens *after* success — starting the 30 s timer, rendering the actionbar — belongs to `L0-cool` (decomposition plan, ownership rule 3).

## Why this is its own component

It is the only child that performs **destructive-capable mutation of shared world state that other players own**. Its failure mode is unlike any sibling's: a mis-tuned safety filter silently and irrecoverably deletes a player's chest, and no acceptance test in §13 is precise enough to catch a subtly wrong cube geometry (§13's *«приблизительно полный 3×3×3 куб»* passes either reading — see ASM-008/Q-011). It is also the largest child by requirement count, and the one place where **C-3** (server authority), **C-4** (no per-tick scan) and **C-8** (non-destructive mutation) all bind simultaneously.

## Inputs

| Input | Origin | Notes |
|---|---|---|
| Item-use activation event for `andrew:web_sword` | Bedrock stable script event surface | The sole trigger. A melee swing must **not** raise it (R-001, ASM-006) |
| Activating player: position, view direction, dimension, reach | `Player` at activation time | All read server-side; no client-supplied coordinates (C-3, R-008) |
| Block and entity state along the view ray | `Dimension` raycast on the stable surface | Ray stops at the first solid block — no through-wall targeting (R-003) |
| Chunk-loaded / accessible state per cell | `Dimension` block lookup | An unreadable cell is an unloaded cell and is skipped (R-007) |
| **Cooldown readiness for (player, `web_sword` ability)** | `L0-cool` — *read only* | Part of the success predicate; this component never writes it (CTR-007) |
| `andrew:web_sword` item identity | `L0-item` | Not defined here |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **Placement plan** (`L0-trap-ecub`) — 27 cell verdicts | This component, then discarded | Computed in full before the first write (ADR-015) |
| Up to 27 vanilla `minecraft:web` blocks in the world | All players, permanently | Real ordinary cobweb; no despawn timer (R-005, boundary: cleanup out of scope) |
| **Success / failure signal** for the activation | `L0-cool` | The only thing that may start the cooldown (R-004) |
| Target-resolution result (`L0-trap-etgt`) | Internal; surfaced in GameTest assertions | The seam `L0-qatg` asserts against |
| Ability acceptance criteria | `L0-qatg` | §13 tests 6 (negative half), 7, 8, 10, 12 |

## Explicitly not owned

- **The 30-second timer, its persistence, and the actionbar readout** — `L0-cool` (§8, §12). This component reports *success*; it does not measure time. The ordering it must respect is ADR-006's: validate reach → check cooldown → place cells → **hand off** → start cooldown.
- **The item, recipe, icon and `.lang` catalogue** — `L0-item`. The ability emits no user-facing text in v1; a failed activation is silent per §5 (*«способность не срабатывает»* — no message is specified). If a message is later added it must be a translate key from `L0-item` (C-9, ADR-009).
- **Melee damage parity** — `L0-item` owns §7's damage clause. This component owns only §7's *negative* half: a normal hit creates no cobweb and starts no cooldown (R-001).
- **The craft gate and the ownership ledger** — `L0-once`, `L0-keep`. The ability does not care how the sword was obtained; an admin `/give` copy has the identical ability.
- **Multiplayer determinism as a component.** Per the decomposition plan §9 was deliberately *not* made a node; it binds here as C-3/C-5 (R-008) and separately in `L0-once`.

## Architecture in one paragraph

The ability is **entirely event-driven** (ADR-006): the stable item-use event is the only entry point, so C-4 is satisfied by construction — nothing polls, nothing scans. On activation the handler resolves a target server-side by casting a single ray from the player's eye along the view vector, bounded by vanilla interaction reach and stopped by the first solid block (ADR-014); entity hits, block hits and a bounded near-player fallback all collapse into one `TargetResolution`. If no target resolves inside reach the handler returns **before touching any state** — failure is free (R-004). Otherwise it expands the resolved cell to the 27-cell cube (target ±1 on each axis, ASM-008) and evaluates each cell against a **deny-by-default classifier** (ADR-013): unloaded, occupied by an entity, carrying a block entity, or indestructible ⇒ skip; unknown ⇒ skip. All 27 verdicts are computed **before** the first block is written (ADR-015), then the permitted cells are set to `minecraft:web` inside the same synchronous handler invocation, which is what makes two concurrent activations resolve independently and identically on every client (C-3, C-5, R-008).

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | Raycast, block get/set and the use event must all exist on `@minecraft/server` 2.10.0. If targeting is only expressible on a Beta surface, the *mechanic* degrades (e.g. a simpler front-of-player cell) — the channel does not change. Escalate rather than decide locally |
| **C-3** server-authoritative | Target is computed from server-read player state only. No client coordinate is trusted, and no cell verdict may depend on who is looking (R-008) |
| **C-4** no per-tick global scan | The component adds **zero** recurring ticks. Targeting happens once per activation. The one permitted tick in the whole add-on belongs to `L0-cool`'s actionbar writer |
| **C-5** dedicated-multiplayer safety | Concurrent activations by different players must each resolve independently (§9). No shared mutable targeting state may exist between handler invocations |
| **C-8** non-destructive world mutation | The governing constraint. Default posture is **deny**: a cell whose safety cannot be established is skipped, not filled (R-006). Asymmetry is deliberate — a weak trap is a tuning bug, destroyed storage is unrecoverable |
| **C-10** preserve the platform | Lands in the existing BP script module alongside the pickaxe's auto-smelt (ADR-010); the 7 shipped suites must stay green |
| **C-11** three-hop verification | Placement correctness is provable in GameTest on Docker BDS; only "does the trap look right / does Use work by long-press on touch" needs the iPad |

## Open items carried by this component

- **Q-011** (inherited, ASM-008) — exact cube geometry relative to the target, and whether self-entombment when targeting adjacent ground is intended. Refined in `L0-trap__concept-client-question`. **Not self-resolved.**
- **Q-013** (inherited, ASM-007) — the closed protected-block deny-list. Refined with a concrete proposed list. **Not self-resolved.**
- **ASM-006** (inherited) — use and attack are distinct engine events. Cheap to falsify; do it first.
- **ASM-017…020** (new) — reach value, no-hit fallback, entity→cell mapping, chunk-loaded probe.
- **CTR-007** (new) — the success predicate spans the `L0-trap` / `L0-cool` ownership line.
- **CTR-008** (new) — §5 and §6 disagree about the **zero-permitted-cells** activation.

## Risk note

Two failures dominate. The first is **over-permissive classification**: one missing block-entity check and the weapon becomes a storage-deletion tool, breaching C-8 with no undo and no test that would have caught it. The second is **wrong geometry** (ASM-008): §13's acceptance test is written loosely enough to pass a cube that is off by one on every axis, so the gate gives false assurance — this needs an explicit owner answer plus a GameTest that asserts the exact 27 coordinates, not an approximate count. A distant third: activating the cooldown before placement succeeds, which §5 and §12 both forbid and which is only visible as a player complaint.





