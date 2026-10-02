---
type: "concept-assumption"
node_id: "L0-ufoc-as01"
source_channel: "rollout"
analysis_version: 5
title: "AS-ufoc-1 · How the commands behave where the spec is silent"
aliases: ["L0-ufoc-as01"]
is_a: ["assumption"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1413
tags: ["is_a:assumption", "command", "relates_to:L0-ufoc-p004", "relates_to:L0-ufoc-r006"]
level: 2
---
# AS-ufoc-1 · How the commands behave where the spec is silent

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-r006"]`

**Spec (§9)** says only: `come` targets the invoker, or a random player; `stop` removes the saucer and drops what it holds; `enable`/`disable` is a stored flag. Everything below fills a gap.

**Assumed:**
1. **`come` from the Nether or End, or from the console:** the target is a random Overworld player. With no Overworld player, `come` fails with a message.
2. **`come` while a UFO is up:** it is refused (at most one saucer).
3. **`come` while the event is disabled:** it works, as an operator override for testing. The flag is unchanged.
4. **After `stop`:** the next arrival is now + 15 min, the same as a departure.
5. **`disable` mid-event:** it also stops the event.
6. **`enable` when `next_ms` is overdue:** the arrival is pushed to now + 15 min.
7. **Command replies:** plain English text, not localized. `CustomCommandResult.message` is a string, not rawtext.

**Impact if wrong:**
- Points 1–3 and 7: low; each is a small change in `commands.ts`.
- Point 4: if `stop` should leave the old schedule, the next saucer could arrive sooner than 15 min.
- Point 5: if `disable` should let a live event finish, the saucer stays up after the operator disabled the event.
- Point 6: an overdue arrival would fire within 5 s of `enable`.
