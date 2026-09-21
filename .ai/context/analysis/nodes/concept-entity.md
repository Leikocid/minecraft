---
type: "concept-entity"
node_id: "L0"
source_channel: "rollout"
title: "Domain Entities"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["entity"]
relates_to: ["L0"]
analysis_version: 2
level: 0
priority: 510
size_chars: 9226
tags: ["entity","domain-model","state","web-sword","reduce","L0"]
---

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
