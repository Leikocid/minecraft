---
type: "concept-client-question"
node_id: "L0-xq2"
source_channel: "rollout"
analysis_version: 2
title: "Client question — Are 5 % (Warden City, Bastion) and 2 % (Airship) per chunk intended?"
aliases: ["L0-xq2"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1134
tags: ["title:Confirm structure densities", "alias:L0-xq2", "is_a:client-question", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-airs", "priority:should", "see_also:fourstructuresspecruencopy"]
level: 1
---
# Client question — Are 5 % (Warden City, Bastion) and 2 % (Airship) per chunk intended?

**Why we ask.** The chances are per chunk (16×16). What they mean on the ground:
- Mini Warden City and Mini Bastion at 5 % ≈ one candidate per 20 chunks, i.e. one every ~72 blocks on average, before cancellations. A player crossing 1 000 blocks of Overworld passes near roughly 10–15 Warden Cities. Vanilla Ancient Cities are far rarer.
- Airship at 2 % ≈ one per 50 chunks (~113 blocks), on top of one linked Airship per Windmill.
- Windmill at 1 % ≈ one per 100 chunks (~160 blocks).
- The 30×30 city footprint spans 2–3 chunks. At 5 %, neighbouring candidates collide often, so the effective density is lower than 5 % and uneven.

**Question.** Are these numbers per chunk, as written? Or were they meant as "per suitable region" or relative to vanilla rarity (e.g. comparable to villages)?

**Default if unanswered (CAN_ASSUME).** Implement exactly as written: per chunk, with chances as constants in one config table in `strf`, so a later change is a one-line edit. The statistical tests (41, 51, 23, 32) measure against those constants.
