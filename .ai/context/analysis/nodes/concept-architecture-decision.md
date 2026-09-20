---
type: "concept-architecture-decision"
node_id: "L0"
source_channel: "rollout"
title: "Architecture Decisions"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["architecture-decision"]
relates_to: ["L0"]
analysis_version: 1
priority: 120
size_chars: 5497
tags: ["architecture-decision","adr","L0"]
level: 0
---

# Architecture Decisions

All decisions below are recorded in `stage-0-infrastructure` under *«Решения (2026-09-20)»* or implied by the Stage 1 compatibility-target section. Dates are the source document's.

---

## ADR-001 — Minecraft **Bedrock Edition**, not Java Edition

- **Status:** Accepted (2026-09-20)
- **Context:** The owner's play device is an iPad. The project must target a platform that actually runs there.
- **Decision:** Build for Bedrock Edition.
- **Rejected:** *Java Edition* — *«Java Edition исключена — целевое устройство iPad, Java там не работает.»*
- **Consequences:** Locks the add-on format to behavior pack + resource pack + JSON manifests with `.mcaddon` packaging; locks scripting to `@minecraft/server`; and — critically — means **no macOS client exists**, which forces the three-machine development loop (C-5, C-6). Java's far richer modding ecosystem (Forge/Fabric) is unavailable.

---

## ADR-002 — **Stable Script API only**; Beta/Preview forbidden

- **Status:** Accepted (2026-09-20), reinforced by the Stage 1 compatibility-target policy
- **Context:** Bedrock exposes `@minecraft/server` in both stable and beta channels. Beta modules unlock newer capabilities but require a Preview client and shift with each release.
- **Decision:** Use stable `@minecraft/server` 2.9.0 (2.10.0 permitted). *«Beta/Preview API не включаем.»* On a dependency or format error, **retarget using the exact error text** rather than switching channels.
- **Rejected:**
  - *Enable beta modules* — would require the iPad to run Minecraft Preview (a separate app), and would defeat the purpose of probing the retail build.
  - *Enable beta reactively as a workaround when an error appears* — explicitly named and forbidden by the spec. This is the important half of the decision: it constrains not just the design but the **debugging behavior**.
- **Consequences:** Some newer APIs are unavailable; capabilities must be checked against the 2.9.0 surface before being designed into the PvP add-on. In exchange, the compatibility signal from Stage 1 is trustworthy.

---

## ADR-003 — **Docker BDS as the log-bearing test rig**

- **Status:** Accepted (2026-09-20)
- **Context:** The iPad's Content Log GUI is the only client-side diagnostic, and it is awkward to read and impossible to grep. There is no macOS client. Iterating directly on the iPad would mean slow, low-information feedback.
- **Decision:** Run `itzg/minecraft-bedrock-server` in Docker on the Mac (`linux/amd64` via Rosetta) as the primary place to load the pack, read manifest/script errors, and serve LAN to the iPad.
- **Rejected:**
  - *Test only on the iPad* — slow loop, poor error visibility.
  - *Use a Windows PC* — *«не требуется»*; not in the environment. Parallels kept as an optional fallback (Q-004).
- **Consequences:** Accepts x86-on-ARM emulation overhead and the need for an explicit platform flag. Introduces a **version-coupling obligation**: the BDS image version must track the iPad's game version, or the server will validate against the wrong engine (see Q-001). Also note BDS renders nothing — resource packs, icons, Creative UI and localization still require the iPad (C-6).

---

## ADR-004 — **Staged de-risking (0 → 1 → 2)** rather than building the product directly

- **Status:** Accepted (2026-09-20)
- **Context:** Two unknowns stood between the owner and the PvP add-on: whether the toolchain works on this hardware at all, and whether the add-on stack works on this installed game version. Hitting either while writing product code would make failures ambiguous.
- **Decision:** Three stages with a hard gate. Stage 0 delivers a deliberately content-free add-on proving the pipeline; Stage 1 delivers a single item proving the stack; Stage 2 is the product. *«Прототип … начинается только после закрытия этого этапа.»*
- **Rejected:**
  - *Go straight at the PvP add-on* — a manifest or API failure would be indistinguishable from a game-logic bug.
  - *Fold Stage 0 into Stage 1* — the pickaxe carries enough content (recipe, scripts, enchantments, drop overrides) that a load failure could not be isolated to the pipeline. This is precisely why the Stage 0 item is mandated **not** to be a pickaxe.
- **Consequences:** Two throwaway deliverables before any product value. Also creates a documentation hazard: Stage 1's spec was written before Stage 0 existed and still claims to be the compatibility probe (see CTR-002).

---

## ADR-005 — **TypeScript** for scripts *(proposed — not settled)*

- **Status:** **Proposed**, listed by the source under *«Открытые вопросы»*
- **Context:** Scripts can be authored in plain JavaScript (shipped as-is) or TypeScript (compiled, type-checked against `@minecraft/server` types from npm).
- **Decision (proposed):** TypeScript — *«Язык скриптов: TypeScript (предложение; см. открытые вопросы)»*. Notably, Stage 0 pass criterion AC-S0-1 already *assumes* TypeScript (*«TypeScript компилируется без ошибок против типов @minecraft/server»*), so the proposal is load-bearing on the acceptance criteria.
- **Alternative:** *Plain JavaScript* — no build step, simpler packaging, but no compile-time check that the code matches the declared API version. Given that the entire project is an API-compatibility exercise, type-checking against versioned API typings has unusually high value here.
- **Consequences if reversed:** AC-S0-1 must be rewritten and the build pipeline simplified. Keep the build step thin until Q-003 is answered (C-10).
