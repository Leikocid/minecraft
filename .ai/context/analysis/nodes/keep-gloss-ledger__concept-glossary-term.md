---
type: "concept-glossary-term"
node_id: "L0-keep-gloss-ledger"
source_channel: "rollout"
aliases: ["L0-keep-gloss-ledger"]
part_of: ["L0-keep"]
is_a: ["glossary-term"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1002
tags: ["glossary-term","L0-keep"]
---

**Retention Ledger**

The durable, world-scoped map of `owner_id → {state, instance_ref}` that records which players are **owed** a Web Sword back. The only state `L0-keep` owns. Full definition: `L0-keep-ent1`.

Its dual role is the component's core idea: it is both the *record* of the obligation and the *idempotency token* that makes the withhold/re-grant pair safe to replay across death, reconnect and restart (`L0-keep-r002`).

Two states: **`pending`** (withheld, owed back) and **`redeemed`** (returned). A grant is only permitted against a `pending` entry, and claiming flips it in the same operation.

**Important**: the ledger records *owed swords*, not *existing swords*. It is not a census of Web Swords in the world and must never be used as one — deriving state by scanning is forbidden by C-4 (`L0-keep-r005`).

**Not to be confused with**: the **one-per-world craft flag**, which is separate state owned by `L0-once` and which this component may never read or write (`L0-keep-r004`).
