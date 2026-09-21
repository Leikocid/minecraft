---
type: "concept-constraint"
node_id: "L0-qatg-cons"
source_channel: "rollout"
title: "Component Constraints — Verification, Acceptance & Definition of Done"
aliases: ["L0-qatg-cons"]
part_of: ["L0-qatg"]
is_a: ["constraint"]
relates_to: ["L0-qatg-r003", "L0-qatg-r004"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2762
tags: ["constraint","nfr","L0-qatg"]
---

# Component Constraints — Verification, Acceptance & Definition of Done

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["constraint"]` · `relates_to: ["L0-qatg-r003", "L0-qatg-r004"]` · `inherits: ["C-1", "C-5", "C-9", "C-10", "C-11", "C-12"]`

Inherited constraints C-1…C-12 bind unchanged. The entries below are the component-specific reading — how each one actually bites here. This component is unusual in that most of C-1…C-12 bite it **directly as gate criteria**, not just as background policy.

## QC-1 — C-10 is the floor this component exists to hold (regression)

Every other sibling's obligations are *additive*; C-10's is *conservative* — nothing may get worse. This component is where that distinction becomes an enforceable rule (`L0-qatg-r003`), not just a stated intent.

## QC-2 — C-11 splits verification into two non-substitutable halves

BDS answers "did it load and run?"; the iPad answers "does it look right?". This component's harness table exists specifically because conflating the two — e.g. assuming a green `bds:check` run means the icon renders correctly — would be a category error, not just an oversight.

## QC-3 — C-1: Beta evidence must never become a runtime claim

The one place in the repository importing a Beta module (`packs/gametest`) is also the one place most tempting to lean on for the two-player gate (`L0-qatg-p003`). `L0-qatg-r004` exists to keep that dev-only convenience from ever showing up as a shipped-pack dependency.

## QC-4 — C-5: the gate must mean something under dedicated multiplayer, not just locally

Evidence collected against a single-player world satisfies none of the multiplayer-tagged rows (`L0-qatg-r002`). The Docker BDS rig, not the single-player world, is this component's test surface wherever §9 is in play — same posture C-5 sets for every sibling.

## QC-5 — C-9: this component introduces no new user-facing literals

The Acceptance Matrix and DoD gate are internal/process artifacts with no in-game surface. If a future harness change adds a player-visible message (e.g. a debug HUD), the key must come from `L0-item`'s catalogue (ADR-009) like everywhere else — noted here for completeness, not because it currently applies.

## QC-6 — C-12: verification effort stays inside the estimated envelope

§15's 4–10h estimate for "a properly tested standalone module" already prices in the harness this component maps to (`bds:check`, `bds:gametest`) as a precondition, not an added cost. A gate design that requires building new infrastructure beyond what's listed in the harness table would silently blow this budget — which is why `L0-qatg`'s architecture decisions (`adr1`–`adr3`) all reuse existing mechanisms rather than adding new ones.
