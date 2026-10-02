---
type: "concept-contradiction"
node_id: "L0-webs-cx01"
source_channel: "rollout"
analysis_version: 5
level: 2
title: "CX-webs-01 · The \"webs\" component scope (item/recipe + ability) overlaps L0-lgnd, which has already absorbed the item/recipe, craft-gate, retention, void-return, cooldown and HUD pieces"
aliases: ["L0-webs-cx01"]
is_a: ["contradiction"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 3051
tags: ["category:scope-overlap", "target:L0", "severity:medium", "resolved", "resolved_by:L0-adr-scope"]
---
---
is_a: ["contradiction"]
part_of: ["L0-webs"]
relates_to: ["L0-lgnd", "L0-lgnd-ad06", "L0-lgnd-cx04", "L0-lgnd-p001", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p005"]
status: resolved
category: scope-overlap
target_node: L0
---
# CX-webs-01 · The "webs" component scope (item/recipe + ability) overlaps L0-lgnd, which has already absorbed the item/recipe, craft-gate, retention, void-return, cooldown and HUD pieces

**Assigned scope** (this deep-dive's brief): "Web Sword (item/recipe, reach targeting, 3×3×3 cobweb trap, protected-block filter, unloaded-chunk safety)".

**Checked (not an unverified claim).** `kv_get_subtree("L0", status="all")` shows exactly one live `concept-component`, `L0-lgnd` ("Legendary weapon framework"), whose own scope statement is "craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization" and whose process `L0-lgnd-p006` is explicitly titled "Registration, startup **and Web Sword migration**". `L0-lgnd-ad06` keeps the shipped Web Sword module paths/commands as thin shims over the shared framework. No live node named `L0-item`, `L0-once`, `L0-keep`, `L0-cool`, or `L0-qatg` exists — those names survive only as targets of already-resolved rollup decisions (`decision-resolve-l0*`), i.e. they were superseded by the `L0-lgnd` migration, the same pattern `L0-sprj-cx03` documented for `L0-scpr`/`L0-sctg`/`L0-scit`.

**Consequence.** Item identity (recipe, damage, enchant slot — spec §1–2), the one-per-world craft gate + refund (§3), death retention (§4), cooldown persistence + Action Bar (§8), and multiplayer determinism for those flows (§9) are **already owned and deep-dived under `L0-lgnd`** (or, for item values specifically, only in the rollup decision `web-sword-item-values` with no live component home yet). Re-deriving rules/processes for them under `L0-webs` would either duplicate `L0-lgnd`'s content or drift from it over time.

**This node did not escalate.** It scoped itself down to the genuine gap instead: `L0-lgnd`'s migration explicitly stopped at the cast body (`L0-lgnd-cx04` names the shipped `registerTrap()` module, which no longer self-subscribes to `itemUse` under the new framework, as needing a framework-side shim) — the targeting + 3×3×3 trap + protected-block filter + unloaded-chunk safety mechanic was never re-homed after the migration and has no other live deep-dive. `L0-webs`'s artifacts in this run cover only that residual (item identity is included too, since it likewise has no other live home, but framed as a static definition consumed by `L0-lgnd`'s registry, not as craft/retention logic).

**Needed from L0.** Confirm `L0-webs` should be scoped down to "targeting + trap + protected-block filter + unloaded-chunk safety (+ static item/recipe definition)" going forward, with the legendary-framework concerns formally cross-referenced rather than restated, and update the L0 decomposition plan/rollups so future deep-dives don't re-open the item/craft/retention/cooldown/HUD ground under this slug.
