---
type: "concept-rule"
node_id: "L0-ench-r001"
source_channel: "rollout"
analysis_version: 10
title: "R-ench-001 · Eligibility comes from vanilla data, and curses never appear"
aliases: ["L0-ench-r001"]
is_a: ["rule"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1385
tags: ["v10", "enchanting", "eligibility", "curses"]
level: 2
---
# R-ench-001 · Eligibility comes from vanilla data, and curses never appear

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-ench-r003, L0-ench-ac04, L0-ench-ac06, L0-ench-adr1

**Rule.**
1. An item's eligible set is exactly the vanilla 1.26.51 enchantment set for its `minecraft:enchantable` slot(s). That covers vanilla items and custom items with an `enchantable` component, for example def #8 with slot `bow`.
2. Treasure enchantments are **included** (Mending, Frost Walker, Soul Speed, Swift Sneak, Wind Burst, and whatever else the probe lists).
3. The curses `binding` and `vanishing` are **always removed**, at a rate of 0 % with no exceptions (spec §4, "Проклятия НИКОГДА").
4. Levels never exceed the vanilla maximum.
5. An item without an `enchantable` component gets no roll at all.

**Data, not inference.** The table is a static map in `roll.ts`, generated once from the 1.26.51 data. A `bds` parity scenario (`ac06`) proves that the engine's `canAddEnchantment` agrees with it for each item and enchantment. A mismatch fails the check: the roller must never offer what the engine refuses, nor miss what it accepts.

**Usefulness is not filtered.** Mending or Unbreaking on an item with no durability (legendaries) stays eligible if the slot admits it, because the spec says "all compatible" (`L0-ench-asm1`).

**Source:** spec v2 §4 Goal; §5 bullets 4 and 6.
