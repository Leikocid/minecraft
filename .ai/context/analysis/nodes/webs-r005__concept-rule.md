---
type: "concept-rule"
node_id: "L0-webs-r005"
source_channel: "rollout"
analysis_version: 1
level: 2
aliases: ["L0-webs-r005"]
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1005
tags: ["rule", "trap", "cooldown-contract"]
---
---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001", "L0-lgnd-p005"]
---
**Rule (R-webs-005 — Ability outcome contract).** (a) *Zero-cells failure (Q-017/CTR-008):* if a valid target was found but every one of the 27 cells is protected, unloaded, or entity-occupied (none filled and none already-Cobweb), the ability is treated as **not having fired**: the Web Sword ability returns `"refused"` and does not call `cooldown.start` (per `L0-lgnd-r003`, the ability owner arms the cooldown; reconciled at L0 by `L0-adr-cast`), and the player sees a localized "No room for cobweb" / «Нет места для паутины» actionbar message. (b) *Passive melee:* an ordinary attack with the Web Sword (no ability activation) never places Cobweb and never touches the cooldown — it is plain Diamond-Sword-equivalent melee damage with whatever compatible enchantments are applied (spec §7).

**Rationale.** Spec §5/§7/§12/§13 tests; closes CTR-008 via decision Q-017. This is the contract boundary between this component (which only ever reports a fill count or "no target") and `L0-lgnd` (which owns the cooldown store, dispatch and HUD; the start/skip call itself is made by this ability on `filled > 0`, per `L0-lgnd-r003` and `L0-adr-cast`).
