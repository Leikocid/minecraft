---
type: "concept-architecture-decision"
node_id: "L0"
source_channel: "rollout"
title: "Architecture Decisions"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["architecture-decision"]
relates_to: ["L0"]
analysis_version: 2
level: 0
priority: 510
size_chars: 19310
tags: ["adr","architecture-decision","web-sword","cross-component","reduce","L0"]
---

# Architecture Decisions

**Links** — `title: Architecture Decisions` · `aliases: ["L0-adr", "Architecture Decisions"]` · `part_of: ["L0"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

ADR-001…004 (Bedrock over Java; stable API only; three-hop verification loop; TypeScript + namespace `andrew`) were recorded at v1 and remain in force — now evidenced by shipped code rather than by intent.

**Numbering across the tree.** ADR-005…010 are L0's, forced by the spec at decompose time. ADR-011/012 belong to `L0-once`, ADR-013/014/015 to `L0-trap`; `L0-keep`, `L0-cool` and `L0-qatg` used local prefixes (`ADR-K*`, `L0-cool-adr1`, `ADR-Q*`). **ADR-016…020 are new at reduce** — each one is a decision no single child could take, because it settles something visible only across two or more of them.

---

## ADR-005 — One-per-world state lives in world-level dynamic properties

**Context.** §3 requires a craft flag surviving logout, world save and restart; §11 requires *«устойчивое world-level состояние»*; C-1 forbids Beta APIs; §13 makes restart survival an acceptance test.

**Decision.** Persist the flag as a **world-scoped dynamic property** on the stable `@minecraft/server` surface, written inside the craft-completion handler, read before any craft is allowed. Treat the property as the single source of truth; nothing else may gate the craft.

**Rejected alternatives.** *Scoreboard objective* — operator-visible, trivially reset, semantically a score. *Marker entity* — despawnable, killable, lost with a chunk. *State file outside the world* — not portable with the world, unreachable from the sandbox. *Deriving the flag by scanning for existing swords* — violates C-4 and contradicts §4's admin copies.

**Consequence.** World-scoped, therefore correctly shared by all players on a dedicated server (C-5), and correctly *per world*: copying the world copies the spent budget, matching *«один раз на весь мир/сервер»*.

---

## ADR-006 — Ability executes event-driven and server-side, on a reach-bounded raycast

**Context.** §5 (Use-activated, normal reach, no artificial long ray), §6 (per-cell safety), §9 + §11 (server-authoritative), C-4 (no per-tick global scan), §12 (*«Луч упирается в ближайший доступный блок»*).

**Decision.** Hook the stable item-use event. Resolve the target **server-side** by raycasting from the player, bounded by vanilla interaction reach, stopping at the first solid block; accept a block point, an entity, or a nearby point within reach. Validate reach **before** writing any state, then iterate the 27 cells applying the safety filter per cell.

**Rejected alternatives.** *Per-tick proximity scan* — prohibited by §11. *Client-supplied coordinates* — violates C-3. *Custom extended-range ray* — prohibited by §5. *Structure/fill in one call* — cannot express per-cell skipping (§6) and risks writing into unloaded chunks (§12).

**Consequence.** Ordering is forced: **validate reach → check cooldown → place cells → start cooldown.** Any other order can consume the cooldown on a failed activation. *The cooldown-check step straddles a child boundary; see ADR-017.*

---

## ADR-007 — Cooldown is a shared per-player ability service, not sword-local state

**Context.** §8 requires exactly 30 s, an actionbar readout of *remaining* time, and a main-hand-over-off-hand priority rule presupposing multiple legendary items. §12 defers persistence to an *«общая система cooldown проекта»* that does not exist. More weapons are coming.

**Decision.** Implement cooldown as a small **per-player, per-ability-key service** owned by the add-on, with the Web Sword registering one ability into it. Ship a single-item implementation now, with the ability-key indirection already in place — the seam the future framework plugs into.

**Rejected alternatives.** *`minecraft:cooldown` component alone* — gates re-use but exposes no remaining-time value, so §8's UI requirement cannot be met from it. *Ad-hoc inline timer* — makes hand-priority unimplementable, guarantees a rewrite at weapon #2. *Per-item-instance cooldown* — lets a player alternate two copies to bypass the gate (ASM-009).

**Consequence.** Keying by **player + ability** is a deliberate anti-abuse choice. The actionbar writer is the one permitted recurring tick under C-4, scoped to players currently holding the sword.

---

## ADR-008 — Death retention intercepts the drop; it does not rely on `keepInventory`

**Context.** §4: no drop on death, return to the same owner on respawn, no extra copy across death/disconnect/restart. §12: death during cooldown must neither dupe the sword nor reset the craft flag. C-7 states anti-dup absolutely.

**Decision.** Handle the sword specifically on the death/drop path — remove it from the death drop and restore exactly one instance to the same player on respawn, guarded by an idempotency check so a repeated or late event cannot restore a second copy.

**Rejected alternatives.** *`keepInventory` gamerule* — server-wide, retains everything, materially changes PvP stakes for every other item. *Soulbound-style enchantment* — no such vanilla Bedrock mechanic. *Respawn-time "give if missing" with no ledger* — cannot distinguish "died and lost it" from "admin took it" or "legitimately holding an admin copy", so it dupes.

**Consequence.** The restore path needs a notion of *which* sword instance belongs to the player. This collides with §3's allowance of admin copies — CTR-005, and now ADR-016.

---

## ADR-009 — All user-facing text is a translate key resolved by the Resource Pack

**Context.** §10 mandates RU/EN for the item name *and* every runtime message, and forbids hardcoding one language in the script (C-9).

**Decision.** Scripts emit **rawtext with `translate` keys plus `with` substitutions**; the strings live in `packs/resource/texts/ru_RU.lang` and `en_US.lang` alongside the pickaxe entries. `L0-item` owns the catalogue; `L0-once` and `L0-cool` consume keys and add no literals.

**Rejected alternatives.** *Literal Russian strings in `sendMessage`* — prohibited by §10, leaves EN players unserved. *Script-side language dictionary* — reimplements the engine's own system.

**Consequence.** Every message-emitting feature lands a `.lang` pair in the same change. *When the catalogue may be frozen is itself a cross-component question; see ADR-019.*

---

## ADR-010 — Web Sword ships inside the existing `andrew` packs, not as a separate add-on

**Context.** §14 calls the weapon a *«самостоятельный готовый модуль»*, which invites a separate pack. But Stages 0–1 delivered one BP + one RP at a fixed version target with a working build/validate/GameTest/BDS pipeline (C-10).

**Decision.** Add `andrew:web_sword` as a new item, recipe and script module **within** `packs/behavior` / `packs/resource`, reusing manifests, version scheme, test suites and BDS harness. "Standalone module" is honoured as **code and test isolation**, not pack isolation.

**Rejected alternatives.** *Separate BP/RP pair per weapon* — multiplies manifests and UUIDs, forces N installs, re-opens the import-compatibility risk Stage 0 closed once. *Core pack + per-weapon packs* — right at ten weapons, premature at one.

**Consequence.** Pickaxe regression protection is mandatory (C-10). If the weapon count later justifies splitting, this is the ADR to revisit.

---
---

# Cross-component decisions (reduce phase)

## ADR-016 — The provenance marker is a third piece of durable state, with a declared producer/consumer split

**Resolves:** CTR-009 (`L0-keep`). **Relates to:** `L0-once`, `L0-keep`, and CTR-005 / CTR-006. **Conditional on:** Q-006 — if the owner refuses the marker, this ADR is void and `L0-keep` narrows instead.

**Context.** The decomposition plan partitioned durable state cleanly in two: *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger. These are different pieces of state and neither may write the other's."* CTR-005's recommended resolution introduces a **third** piece — a per-instance provenance marker distinguishing a survival-crafted sword from an admin copy. It can only be *written* at craft completion, which is `L0-once`'s handler, and it is *read* exclusively by `L0-keep`. The two-way partition has no slot for it, and under the rule as written either child breaches it.

**Decision.** Name the marker explicitly as a third piece of state with **split producer/consumer ownership**:

- **Producer:** `L0-once`, at craft completion, in the same synchronous handler that claims the craft flag (ADR-011).
- **Consumer:** `L0-keep`, exclusively. No other child reads or writes it.
- **Definition:** a single shared constant/helper module whose shape, durability contract and semantics are **specified by `L0-keep`** (`L0-keep-ent2`) and *called* by `L0-once`. The write site belongs to `L0-once`; the definition is not duplicated.

This mirrors the pattern the plan already established for localization — *"ownership is central, use is distributed"* — so it extends an existing rule rather than inventing one.

**Rejected alternatives.** *Extend `L0-once`'s ownership to cover the marker* — `L0-once` would own state whose invariants and impact-if-wrong are entirely `L0-keep`'s, with no contract between them. *Let `L0-keep` hook the craft event* — two children mutating state inside one handler is the concrete form of the overlap the rule exists to prevent, and it would collide at integration as a merge conflict in the craft handler. *Leave it unstated* — the observed failure mode is the worst one: a marker one child assumes is written and the other never writes, which silently stops retaining swords with no error anywhere.

**Consequence.** The decomposition plan's ownership rule 2 is **amended** to read: *`L0-once` owns the craft flag, `L0-keep` owns the retention ledger and defines the provenance marker, and `L0-once` writes the marker through `L0-keep`'s helper at craft completion.* This must be settled **before the craft handler is written** — it is the one place the two children meet in code.

---

## ADR-017 — `L0-cool` exposes a read-only readiness query; `L0-trap` calls it and never writes the timer

**Resolves:** CTR-007 (`L0-trap`). **Relates to:** `L0-trap`, `L0-cool`, `L0-qatg`.

**Context.** The decomposition plan's ownership rule 3 draws the boundary at the moment of success: *"`L0-trap` owns the success predicate; `L0-cool` owns everything after it."* But ADR-006's forced ordering places a **cooldown check inside** that predicate — an activation while the timer runs is not a success. "Everything after success" and "check cooldown before placing" cannot describe the same line. Both children noticed independently and both provisionally implemented the same answer, which is the strongest available evidence that it is the right one.

**Decision.** `L0-cool` exposes exactly two entry points and `L0-trap` is their only caller:

- `isReady(player, abilityKey)` — **pure read, never mutates.** Called by `L0-trap` as step 2 of ADR-006's ordering, before any world state is written.
- `start(player, abilityKey)` — **the sole write path that arms the timer.** Called by `L0-trap` only after placement has confirmed success.

`L0-cool` does **not** listen for the use event. The event hook stays with the component that owns §5.

**Rejected alternatives.** *`L0-cool` wraps the activation*, intercepting the use event and calling into `L0-trap` when ready — this moves the §5 event hook out of `L0-trap`, contradicting its ownership of activation, and forces targeting knowledge into a component that should have none. *Leave it unstated* — the concrete predicted failure is that both children implement a gate and the sword checks the cooldown twice, harmless until one of them also starts it.

**Consequence.** Ownership rule 3 is **amended**: *`L0-cool` owns all mutation of the timer and exposes a read-only readiness query; `L0-trap` calls it as part of the success predicate and never writes cooldown state.* §13 test 9 is consequently claimed from **both** sides by design (`L0-trap-ac08` asserts the gate, `L0-cool-ac01` asserts the duration) — see ADR-018, which stops `L0-qatg` flagging it as a defect.

---

## ADR-018 — The acceptance matrix admits declared split-claim rows, and the DoD gate uses the four-vector dup reading

**Resolves:** CTR-010 (`L0-qatg`), and the double-claim ambiguity left by ADR-017. **Relates to:** `L0-qatg`, `L0-trap`, `L0-cool`, `L0-item`, `L0-once`.

**Context.** Two things about the gate only resolve above the children. First, `L0-qatg`'s matrix invariant demanded exactly one owning artifact per §13 row, with a single hand-carved exception for AT-12 — but three rows legitimately have two owners, because three §13 lines each bundle two claims. Second, §14's DoD sentence names **three** dup vectors (*«крафт, смерть или reconnect»*) while §4, §12 and C-7 name **four**, adding restart. A gate implemented literally from §14 would report green without ever requiring restart-dup evidence.

**Decision.** Two rulings, both on the side of the stricter reading.

1. **Split-claim rows are legitimate and enumerated.** Exactly three §13 rows have two owners, and no others may:
   - **AT-9** — `L0-trap` (the re-use gate) + `L0-cool` (the 30 s duration), per ADR-017.
   - **AT-12** — `L0-trap` (identical cobweb on both clients) + `L0-once` (the craft race), per the plan's deliberate refusal to make multiplayer determinism its own node.
   - **The melee row** — `L0-item` (damage parity with Diamond Sword) + `L0-trap` (a normal swing creates no cobweb and starts no cooldown).

   Outside this list, two owners remains a defect to report upward.
2. **The DoD gate adopts the four-vector reading.** §14's sentence is treated as **elliptical** — dropping "and restart" because §12 covers it two paragraphs earlier — not as a deliberate narrowing. Restart-dup evidence is required before the gate can close.

**Rejected alternatives.** *Force each §13 line onto one owner* — would push either damage parity into `L0-trap` or the cooldown duration into `L0-trap`, in both cases relocating a criterion away from the component that owns the code it tests. *Follow §14 literally on three vectors* — there is no scenario where honouring C-7 over §14's text produces a worse outcome, and the failure it permits ("false green") is exactly the risk `L0-qatg` names as its largest.

**Consequence.** `L0-qatg-ent2`'s invariant 1 and its snapshot were amended in place at reduce. The matrix now stands at `unclaimed_count = 0`, `duplicate_claim_count = 0`, `pending_artifact_count = 0`, `overall_status = complete-pending-execution`. Neither ruling requires the owner's input; both are recorded so the gap between the two texts stays visible rather than being silently absorbed into rule text.

---

## ADR-019 — The `.lang` catalogue is frozen last, not first

**Relates to:** `L0-item`, `L0-once`, `L0-trap`, `L0-cool`. **Blocked by:** Q-008, Q-017, and conditionally Q-006.

**Context.** The decomposition plan's build order opens with `item`, and ADR-009 makes `L0-item` the sole writer of the catalogue. Read together, that invites publishing the `.lang` pairs first and moving on. Looking across all six children shows the opposite dependency: the **set of keys is not knowable** until questions owned by other children are answered.

| Key | Needed by | Blocked on |
|---|---|---|
| `item.andrew:web_sword.name` | `L0-item` | nothing — publishable today |
| First-craft announcement (+ creator `with`) | `L0-once` | nothing — publishable today |
| Cooldown remaining-time readout (+ seconds `with`) | `L0-cool` | nothing — publishable today |
| Blocked-craft denial message | `L0-once` | **Q-008** — exists only if the owner picks "block and consume with an explanation" |
| "No valid space" on a zero-cell activation | `L0-trap` | **Q-017** — exists only under CTR-008 option (c) |
| Any retention-related message | `L0-keep` | **Q-006** — the component emits none today, but its shape is unsettled |

**Decision.** `L0-item` publishes the three unblocked pairs immediately so nothing waits on it, and **holds the catalogue open** until Q-008 and Q-017 are answered. "Catalogue frozen" becomes an explicit `L0-item` milestone that `L0-qatg` checks, not an implicit consequence of `L0-item` finishing first.

**Rejected alternatives.** *Freeze the catalogue at `L0-item` completion and amend later* — guarantees a second RP pass and a second iPad verification hop for what is otherwise a one-line change, and the iPad hop is the expensive one (C-11). *Let the blocked children author their own literals provisionally* — directly violates C-9/ADR-009, and provisional literals are exactly the kind of thing that ships.

**Consequence.** The build order in the decomposition plan stays as written — `L0-item` still goes **first** — but its *definition of done* now has a tail that closes after `L0-once` and `L0-trap`. Two of the three blocking questions are cheap for the owner to answer, so this is a scheduling note rather than a risk.

---

## ADR-020 — One persistence mechanism, one recurring tick, for the whole add-on

**Relates to:** all six children. **Records convergence rather than forcing it.**

**Context.** No child was told how to persist state or whether it might poll. Four of them independently reached for **dynamic properties on the stable `@minecraft/server` surface** — at three different scopes — and five of them independently concluded they must add **zero** recurring ticks. That is convergence worth freezing before a second weapon erodes it by precedent.

**Decision.** Two standing rules for the add-on, not just the Web Sword:

1. **All durable add-on state is a dynamic property on the stable surface.** No scoreboards, no marker entities, no files outside the world, no structure abuse. Scope is chosen to match the state's lifetime: world for the craft flag and retention ledger, player for the cooldown record, item-instance for the provenance marker (ADR-016).
2. **The add-on spends exactly one recurring interval, and `L0-cool`'s actionbar writer holds it** — scoped to players currently holding a tracked ability's item, never all online players, never a world scan. A child that believes it needs a second tick escalates to L0 rather than adding one; per C-1's precedent the *mechanic* degrades before the budget grows.

**Rejected alternatives.** *Leave both implicit* — they are currently true only by coincidence, and the failure is gradual: the second weapon adds "just one more" interval, and C-4 erodes into a per-tick scan nobody decided on. *Mandate a single persistence facade module now* — premature at one weapon; four call sites with three different scopes do not yet justify an abstraction, and the constraint above gets the safety without the indirection.

**Consequence.** C-4 acquires a concrete, countable form — *the add-on has one interval; grep for it* — which `L0-qatg` can assert cheaply in the existing `npm test` layer without a live engine. It also means any future cross-item cooldown framework (ADR-007's seam, CTR-004) inherits the tick budget rather than being free to add its own.
