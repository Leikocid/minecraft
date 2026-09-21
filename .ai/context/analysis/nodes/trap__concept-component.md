---
type: "concept-component"
node_id: "L0-trap"
source_channel: "rollout"
title: "Active Ability — Targeting & Cobweb Placement"
aliases: ["L0-trap"]
part_of: ["L0"]
is_a: ["component"]
relates_to: ["L0"]
analysis_version: 2
level: 1
priority: 510
size_chars: 8896
tags: ["component","web-sword","ability","targeting","raycast","cobweb","placement-safety","L0-trap"]
needs_rebuild_marked_at: 2026-09-21T21:27:45.356Z
---

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
