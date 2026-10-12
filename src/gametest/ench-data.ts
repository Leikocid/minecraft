// ENCH-DATA-01 on BDS (spec v3 §4, L0-ench-ac06): re-measures src/enchanting/eligibility.ts from the live engine and
// fails on any difference. Every measured table is also printed as `[ench-data] REF` lines in the literal form that
// file uses, so a new engine's reference is pasted from the log, never written from memory.

import { type EnchantmentType, EnchantmentTypes, type ItemEnchantableComponent, ItemStack, ItemTypes, world } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import {
  type Accepts,
  ENGINE_ACCEPTS,
  ENGINE_CONFLICTS,
  ENGINE_MAX_LEVEL,
  NOT_SHIPPED,
  OUTSIDE_TABLE,
  TABLE_ALREADY_OFFERS,
  TABLE_WITHHOLDS,
  diffAccepts,
  diffPairs,
  pairKey,
} from "../enchanting/eligibility";
import { ELIGIBILITY } from "../enchanting/roll-rules";

/** Loot tables (packs/gametest/loot_tables) holding the engine's table generator for one vanilla item each, `_<kind>` appended. */
const GENERATOR_TABLES = [
  "probe_ench/mace",
  "probe_ench/iron_spear",
  "probe_ench/diamond_sword",
  "probe_ench/diamond_axe",
  "probe_ench/diamond_pickaxe",
  "probe_ench/diamond_helmet",
  "probe_ench/diamond_chestplate",
  "probe_ench/diamond_leggings",
  "probe_ench/diamond_boots",
  "probe_ench/bow",
  "probe_ench/crossbow",
  "probe_ench/trident",
  "probe_ench/fishing_rod",
  "ench_data/carrot_on_a_stick",
  "ench_data/warped_fungus_on_a_stick",
] as const;
const GENERATOR_KINDS = ["l30", "l1_30"] as const;
/** One pool per OUTSIDE_TABLE item but the books, each enchant_with_levels 30, treasure off. */
const OUTSIDE_GENERATOR = "ench_data/outside_l30";
const BOOKS = ["minecraft:book", "minecraft:enchanted_book"];
const ROLLS = 1000;

const log = (msg: string): void => console.warn(`[ench-data] ${msg}`);
const short = (id: string): string => id.replace(/^minecraft:/, "");
const quoted = (ids: readonly string[]): string => ids.map((id) => `"${id}"`).join(", ");
const rowText = (row: Record<string, number>): string =>
  Object.entries(row)
    .map(([id, level]) => `${id}: ${level}`)
    .join(", ");

function enchantableOf(itemId: string): ItemEnchantableComponent | undefined {
  return new ItemStack(itemId, 1).getComponent("minecraft:enchantable");
}

/** canAdd, with a throw read as a refusal: the engine throws for a level above the type's max. */
function canAdd(enchantable: ItemEnchantableComponent, type: EnchantmentType, level: number): { ok: boolean; threw: boolean } {
  try {
    return { ok: enchantable.canAddEnchantment({ type, level }), threw: false };
  } catch {
    return { ok: false, threw: true };
  }
}

/** Enchantment → highest accepted level on a bare stack; a gap below it, an accept above max or a throw within 1..max is an anomaly. */
function measureAccepts(itemId: string, types: readonly EnchantmentType[], anomalies: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const enchantable = enchantableOf(itemId);
  if (enchantable === undefined) return out;
  for (const type of types) {
    const answers: boolean[] = [];
    for (let level = 1; level <= type.maxLevel + 1; level++) {
      const { ok, threw } = canAdd(enchantable, type, level);
      if (threw && level <= type.maxLevel) anomalies.push(`${itemId}: ${short(type.id)} level ${level} threw`);
      answers.push(ok);
    }
    const top = answers.lastIndexOf(true) + 1;
    if (top === 0) continue;
    if (answers.slice(0, top).includes(false)) anomalies.push(`${itemId}: ${short(type.id)} accepted levels have a gap [${answers.join(",")}]`);
    if (top > type.maxLevel) anomalies.push(`${itemId}: ${short(type.id)} accepted at ${top}, above maxLevel ${type.maxLevel}`);
    out[short(type.id)] = top;
  }
  return out;
}

/** Ordered pairs `a>b` where b is refused once a is on the stack, among the item's accepted enchantments. */
function measureRefusals(itemId: string, accepted: readonly string[], byId: ReadonlyMap<string, EnchantmentType>): Set<string> {
  const refused = new Set<string>();
  for (const a of accepted) {
    const stack = new ItemStack(itemId, 1);
    const enchantable = stack.getComponent("minecraft:enchantable");
    const typeA = byId.get(a);
    if (enchantable === undefined || typeA === undefined) continue;
    enchantable.addEnchantment({ type: typeA, level: 1 });
    for (const b of accepted) {
      const typeB = byId.get(b);
      if (b === a || typeB === undefined) continue;
      if (!canAdd(enchantable, typeB, 1).ok) refused.add(`${a}>${b}`);
    }
  }
  return refused;
}

/** Accepted enchantments of `item` that `rolls` × each generator table never yielded, plus what it did yield. */
async function rollGenerator(test: Test, path: string): Promise<{ offered: Set<string>; missing: string[] }> {
  const manager = world.getLootTableManager();
  const offered = new Set<string>();
  const missing: string[] = [];
  for (const kind of GENERATOR_KINDS) {
    const table = manager.getLootTable(`${path}_${kind}`);
    if (table === undefined) {
      missing.push(`${path}_${kind}`);
      continue;
    }
    for (let i = 0; i < ROLLS; i++) {
      for (const stack of manager.generateLootFromTable(table) ?? []) {
        for (const e of stack.getComponent("minecraft:enchantable")?.getEnchantments() ?? []) offered.add(short(e.type.id));
      }
      if (i % 250 === 249) await test.idle(1);
    }
  }
  return { offered, missing };
}

/** Item id → how many of `ROLLS` generator stacks of it came back enchanted, and with what. */
async function rollOutside(test: Test): Promise<Map<string, { enchanted: number; ids: Set<string> }>> {
  const manager = world.getLootTableManager();
  const out = new Map<string, { enchanted: number; ids: Set<string> }>();
  const table = manager.getLootTable(OUTSIDE_GENERATOR);
  if (table === undefined) return out;
  for (let i = 0; i < ROLLS; i++) {
    for (const stack of manager.generateLootFromTable(table) ?? []) {
      const row = out.get(stack.typeId) ?? { enchanted: 0, ids: new Set<string>() };
      const es = stack.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
      if (es.length > 0) row.enchanted++;
      for (const e of es) row.ids.add(short(e.type.id));
      out.set(stack.typeId, row);
    }
    if (i % 100 === 99) await test.idle(1);
  }
  return out;
}

registerAsync("andrew", "ench_data_parity", async (test: Test): Promise<void> => {
  const failures: string[] = [];
  const anomalies: string[] = [];
  const types = EnchantmentTypes.getAll().sort((a, b) => short(a.id).localeCompare(short(b.id)));
  const byId = new Map(types.map((t) => [short(t.id), t]));

  // 1. Max levels.
  const maxLevel = new Map(types.map((t) => [short(t.id), t.maxLevel]));
  log(`REF MAX ${[...maxLevel].map(([id, level]) => `["${id}", ${level}],`).join(" ")}`);
  for (const id of [...new Set([...maxLevel.keys(), ...ENGINE_MAX_LEVEL.keys()])].sort()) {
    if (maxLevel.get(id) !== ENGINE_MAX_LEVEL.get(id)) failures.push(`max level ${id}: engine ${maxLevel.get(id) ?? "none"}, reference ${ENGINE_MAX_LEVEL.get(id) ?? "none"}`);
  }

  // 2. What each item accepts, and to which level: every item the roller has a row for, and every reference row.
  const items = [...new Set([...ELIGIBILITY.keys(), ...ENGINE_ACCEPTS.keys()])].sort();
  const measured = new Map<string, Record<string, number>>();
  for (const itemId of items) {
    const known = ItemTypes.get(itemId) !== undefined;
    if (known && NOT_SHIPPED.includes(itemId)) failures.push(`${itemId}: listed as not shipped, but the item type exists — measure it`);
    if (!known) {
      if (NOT_SHIPPED.includes(itemId)) log(`PENDING ${itemId}: the roller has a row, the item type does not exist yet`);
      else failures.push(`${itemId}: unknown item type`);
      continue;
    }
    const accepts = measureAccepts(itemId, types, anomalies);
    measured.set(itemId, accepts);
    log(`REF ACCEPTS ["${itemId}", { ${rowText(accepts)} }],`);
    await test.idle(1);
  }
  const accepts: Accepts = measured;
  failures.push(...diffAccepts(accepts, ENGINE_ACCEPTS));

  // 3. Conflicts: refused pairs on every item, against one global list.
  const refusedOn = new Map<string, Set<string>>();
  const pairs = new Map<string, [string, string]>();
  for (const [itemId, row] of measured) {
    const refused = measureRefusals(itemId, Object.keys(row), byId);
    refusedOn.set(itemId, refused);
    for (const ordered of refused) {
      const [a, b] = ordered.split(">");
      if (!refused.has(`${b}>${a}`)) anomalies.push(`${itemId}: ${b} refused after ${a}, but ${a} accepted after ${b}`);
      pairs.set(pairKey(a, b), [a, b].sort() as [string, string]);
    }
    await test.idle(1);
  }
  const conflictList = [...pairs.values()].sort((x, y) => pairKey(...x).localeCompare(pairKey(...y)));
  log(`REF CONFLICTS ${conflictList.map(([a, b]) => `["${a}", "${b}"],`).join(" ")}`);
  failures.push(...diffPairs(conflictList, ENGINE_CONFLICTS));
  for (const [itemId, row] of measured) {
    const refused = refusedOn.get(itemId) ?? new Set<string>();
    for (const [a, b] of conflictList) {
      if (a in row && b in row && !refused.has(`${a}>${b}`)) anomalies.push(`${itemId}: accepts ${a} beside ${b}, which another item refuses`);
    }
  }

  // 4. Every other vanilla item the engine lets carry an enchantment; add-on items are held by tests/enchanting-roll.test.mjs.
  const elsewhere: string[] = [];
  let unconstructible = 0;
  const all = ItemTypes.getAll();
  for (let i = 0; i < all.length; i++) {
    const id = all[i].id;
    if (!id.startsWith("minecraft:") || measured.has(id)) continue;
    let found: ItemEnchantableComponent | undefined;
    try {
      found = enchantableOf(id);
    } catch {
      unconstructible++;
      continue;
    }
    const enchantable = found;
    if (enchantable !== undefined && types.some((t) => canAdd(enchantable, t, 1).ok)) {
      elsewhere.push(id);
      log(`OUTSIDE ["${id}", { ${rowText(measureAccepts(id, types, anomalies))} }],`);
    }
    if (i % 100 === 99) await test.idle(1);
  }
  elsewhere.sort();
  log(`REF OUTSIDE ${quoted(elsewhere)} (item types ${all.length}, not constructible ${unconstructible})`);
  for (const id of elsewhere.filter((x) => !OUTSIDE_TABLE.includes(x))) failures.push(`${id}: takes enchantments, has no row and is not listed outside the table`);
  for (const id of OUTSIDE_TABLE.filter((x) => !elsewhere.includes(x))) failures.push(`${id}: listed outside the table, but the engine gives it no enchantment`);
  const outside = await rollOutside(test);
  log(`OUTSIDE generator ${ROLLS} rolls: ${[...outside].map(([id, r]) => `${short(id)}=${r.enchanted}[${[...r.ids].sort().join(",")}]`).join(" ") || "missing loot table"}`);
  for (const id of OUTSIDE_TABLE.filter((x) => !BOOKS.includes(x))) {
    const row = outside.get(id);
    if (row === undefined) failures.push(`${id}: no pool in ${OUTSIDE_GENERATOR}`);
    else if (row.enchanted > 0) failures.push(`${id}: the table generator enchanted it ${row.enchanted} of ${ROLLS} times — the roller needs a row`);
  }
  for (const id of [...outside.keys()].filter((x) => !OUTSIDE_TABLE.includes(x))) failures.push(`${id}: pooled in ${OUTSIDE_GENERATOR}, not in OUTSIDE_TABLE`);

  // 5. What the engine's table generator never yields (the roller's treasure), and the §4 treasure it already offers.
  const withholds = new Map<string, string[]>();
  for (const path of GENERATOR_TABLES) {
    const itemId = `minecraft:${path.slice(path.indexOf("/") + 1)}`;
    const { offered, missing } = await rollGenerator(test, path);
    if (missing.length > 0) failures.push(`missing generator loot tables ${missing.join(", ")}`);
    const row = measured.get(itemId) ?? {};
    const never = Object.keys(row).filter((id) => !offered.has(id));
    const strange = [...offered].filter((id) => !(id in row));
    if (strange.length > 0) anomalies.push(`${itemId}: the generator yields ${strange.join(",")}, which canAddEnchantment refuses`);
    withholds.set(itemId, never);
    log(`REF WITHHOLDS ["${itemId}", [${quoted(never)}]], offered=[${[...offered].sort().join(",")}]`);
    const expected = TABLE_WITHHOLDS.get(itemId);
    if (expected === undefined) failures.push(`${itemId}: no TABLE_WITHHOLDS row`);
    else if ([...expected].sort().join(",") !== never.join(",")) failures.push(`${itemId}: generator withholds [${never}], reference [${expected}]`);
  }
  for (const id of [...TABLE_WITHHOLDS.keys()].filter((k) => !withholds.has(k))) failures.push(`${id}: TABLE_WITHHOLDS row for an item the generator is not rolled on`);
  for (const [enchantment, itemId] of TABLE_ALREADY_OFFERS) {
    const never = withholds.get(itemId);
    if (never === undefined || !(enchantment in (measured.get(itemId) ?? {})) || never.includes(enchantment)) {
      failures.push(`${enchantment}: listed as already offered on ${itemId}, but the generator does not yield it there`);
    }
  }

  // Negative control: one reference row with one enchantment removed must surface as exactly one difference.
  const [firstItem, firstRow] = [...ENGINE_ACCEPTS][0] ?? ["", {}];
  const dropped = Object.keys(firstRow)[0];
  if (dropped !== undefined) {
    const mutated: Accepts = new Map([...ENGINE_ACCEPTS].map(([k, v]) => [k, k === firstItem ? Object.fromEntries(Object.entries(v).filter(([id]) => id !== dropped)) : v]));
    const caught = diffAccepts(accepts, mutated);
    log(`CONTROL drop ${dropped} from ${firstItem}: ${caught.join(" | ") || "not caught"}`);
    if (caught.length !== 1 || !caught[0].startsWith(`${firstItem}: ${dropped}`)) failures.push(`control: dropping ${dropped} from ${firstItem} gave [${caught.join(" | ")}]`);
  } else {
    failures.push("control: ENGINE_ACCEPTS is empty, nothing to compare against");
  }

  for (const a of anomalies) log(`ANOMALY ${a}`);
  for (const f of failures) log(`MISMATCH ${f}`);
  log(
    `RESULT items=${measured.size} enchantment_types=${types.length} conflicts=${conflictList.length} outside=${elsewhere.length} ` +
      `generator_items=${withholds.size} anomalies=${anomalies.length} mismatches=${failures.length}`
  );
  test.assert(failures.length === 0 && anomalies.length === 0, `${failures.length} mismatches, ${anomalies.length} anomalies: ${[...failures, ...anomalies].slice(0, 6).join(" | ")}`);
  test.succeed();
})
  .structureName("andrew:platform")
  .maxTicks(3000)
  .tag("andrew");
