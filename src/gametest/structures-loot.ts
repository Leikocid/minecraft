// Chest fill on a real engine (L0-loot): the custom table and the three
// vanilla tables judged by what the container holds, never by successCount;
// a control table whose empty read fails the test; an occupied chest refused.
//
// World positions come from test.worldBlockLocation exactly once, at chest
// placement; Loot and every read below take that world position as-is. A
// second translation reads a different block — silently, consistently empty.

import { BlockComponentTypes, type Container, type Dimension, EnchantmentType, EnchantmentTypes, ItemStack, type Vector3 } from "@minecraft/server";
import { Test, register } from "@minecraft/server-gametest";
import { ANCIENT_CITY, BASTION_OTHER, BASTION_TREASURE, CONTROL_TABLE, CUSTOM_TABLE, Loot, LootError, contents } from "../structures/loot";
import { ATTEMPTS_MAX, ATTEMPTS_MIN, MAX_LEVEL } from "../structures/loot-table";
import type { ChestCtx } from "../structures/place";
import type { Vec3 } from "../structures/registry";

const STRUCTURE = "andrew:platform";
/** Two blocks apart: adjacent chests would pair into one double chest. */
const SPOTS: Vector3[] = [
  { x: 1, y: 2, z: 1 },
  { x: 5, y: 2, z: 5 },
];
const CUSTOM_ROUNDS = 40;

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const vec = (p: Vector3): Vec3 => [p.x, p.y, p.z];

interface Chest {
  pos: Vec3;
  container: Container;
}

function placeChest(test: Test, dim: Dimension, rel: Vector3): Chest {
  test.setBlockType("minecraft:chest", rel);
  const world = test.worldBlockLocation(rel);
  const container = dim.getBlock(world)?.getComponent(BlockComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`no chest container at ${JSON.stringify(world)}`);
  return { pos: vec(world), container };
}

/** Reads the block at `p` with no translation. */
function readAt(dim: Dimension, p: Vector3): string[] {
  const c = dim.getBlock(p)?.getComponent(BlockComponentTypes.Inventory)?.container;
  return c === undefined ? [] : contents(c);
}

/** The control assertion: a table that is never empty read back as empty means the read is in the wrong place. */
function assertFilled(label: string, items: string[]): void {
  if (items.length === 0) throw new Error(`${label}: chest read back empty — reading the wrong block or the insert went nowhere`);
}

const loot = (dim: Dimension): Loot => new Loot(dim, { ItemStack, EnchantmentType }, log);

function ctx(pos: Vec3, id: string, index: number): ChestCtx {
  const instance = { id } as ChestCtx["instance"];
  return { instance, templateSize: [1, 1, 1], at: () => pos, index, table: CUSTOM_TABLE, pos };
}

const cleanup = (chests: Chest[]): void => chests.forEach((c) => c.container.clearAll());

register("andrew", "strf_loot_custom", (test: Test): void => {
  const dim = test.getDimension();
  const chests = SPOTS.map((p) => placeChest(test, dim, p));
  const l = loot(dim);
  try {
    const got = chests.map((c, i) => {
      l.hooks.fillChest(ctx(c.pos, `windmill:gt:${Date.now()}`, i));
      return contents(c.container);
    });
    got.forEach((items, i) => log(`strf loot custom chest ${i}: ${items.length} slots [${items.join(" ")}]`));
    for (const items of got) {
      test.assert(items.length >= ATTEMPTS_MIN && items.length <= ATTEMPTS_MAX, `occupied slots ${items.length}, expected ${ATTEMPTS_MIN}..${ATTEMPTS_MAX}`);
    }
    test.assert(got[0].join() !== got[1].join(), `two chests rolled the same contents [${got[0].join(" ")}]`);

    // Many rolls through one chest: every item id the table can produce is
    // constructed by the engine, and every enchantment it wrote is checked.
    const seen = new Set<string>();
    let enchanted = 0;
    for (let r = 0; r < CUSTOM_ROUNDS; r++) {
      chests[0].container.clearAll();
      l.hooks.fillChest(ctx(chests[0].pos, `airship:gt:${r}`, r));
      for (let s = 0; s < chests[0].container.size; s++) {
        const item = chests[0].container.getItem(s);
        if (item === undefined) continue;
        seen.add(item.typeId);
        const list = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
        if (list.length > 0) enchanted++;
        for (const e of list) {
          const max = EnchantmentTypes.get(e.type.id)?.maxLevel ?? 0;
          test.assert(!/binding|vanishing/.test(e.type.id), `curse ${e.type.id} on ${item.typeId}`);
          test.assert(e.level >= 1 && e.level <= max && e.level <= (MAX_LEVEL[e.type.id] ?? 0), `${e.type.id} ${e.level} on ${item.typeId}, engine max ${max}`);
        }
      }
    }
    log(`strf loot custom: ${CUSTOM_ROUNDS} rolls, ${seen.size} item ids, ${enchanted} enchanted items [${[...seen].sort().join(" ")}]`);
    test.assert(enchanted > 0, `no enchanted item in ${CUSTOM_ROUNDS} rolls`);
    test.succeed();
  } finally {
    cleanup(chests);
  }
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

function vanillaTest(name: string, table: string): void {
  register("andrew", name, (test: Test): void => {
    const dim = test.getDimension();
    const chests = SPOTS.map((p) => placeChest(test, dim, p));
    const l = loot(dim);
    try {
      const got = chests.map((c) => {
        const n = l.fillVanilla(c.pos, table);
        const items = readAt(dim, { x: c.pos[0], y: c.pos[1], z: c.pos[2] });
        log(`strf loot ${table}: fillVanilla=${n}, container ${items.length} slots [${items.join(" ")}]`);
        return items;
      });
      got.forEach((items) => assertFilled(table, items));
      test.assert(got[0].join() !== got[1].join(), `${table}: two calls rolled the same contents [${got[0].join(" ")}]`);
      test.succeed();
    } finally {
      cleanup(chests);
    }
  })
    .structureName(STRUCTURE)
    .maxTicks(200)
    .tag("andrew");
}

vanillaTest("strf_loot_ancient_city", ANCIENT_CITY);
vanillaTest("strf_loot_bastion_treasure", BASTION_TREASURE);
vanillaTest("strf_loot_bastion_other", BASTION_OTHER);

/**
 * The control table read where it was filled must pass the assertion, and the
 * same assertion on the structure-relative position — the block the double
 * translation reads — must go red. A check that cannot fail proves nothing.
 */
register("andrew", "strf_loot_control", (test: Test): void => {
  const dim = test.getDimension();
  const chest = placeChest(test, dim, SPOTS[0]);
  try {
    loot(dim).fillVanilla(chest.pos, CONTROL_TABLE);
    const right = readAt(dim, { x: chest.pos[0], y: chest.pos[1], z: chest.pos[2] });
    const wrong = readAt(dim, SPOTS[0]);
    log(`strf loot control ${CONTROL_TABLE}: world read [${right.join(" ")}], relative read [${wrong.join(" ")}]`);
    assertFilled(CONTROL_TABLE, right);
    let red = "";
    try {
      assertFilled(`${CONTROL_TABLE} (relative read)`, wrong);
    } catch (e) {
      red = String(e);
    }
    log(`strf loot control: deliberate wrong read -> ${red || "PASSED (check cannot fail)"}`);
    test.assert(red.includes("read back empty"), "the control check did not go red on a read from the wrong block");
    test.succeed();
  } finally {
    cleanup([chest]);
  }
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

register("andrew", "strf_loot_full_chest", (test: Test): void => {
  const dim = test.getDimension();
  const chest = placeChest(test, dim, SPOTS[0]);
  try {
    for (let s = 0; s < chest.container.size; s++) chest.container.setItem(s, new ItemStack("minecraft:dirt", 64));
    const before = contents(chest.container);
    const outcome = (fill: () => unknown): string => {
      try {
        fill();
        return "no error";
      } catch (e) {
        return e instanceof LootError ? `LootError: ${e.message}` : `other: ${String(e)}`;
      }
    };
    const vanilla = outcome(() => loot(dim).fillVanilla(chest.pos, ANCIENT_CITY));
    const custom = outcome(() => loot(dim).hooks.fillChest(ctx(chest.pos, "windmill:gt:full", 0)));
    const after = contents(chest.container);
    log(`strf loot full chest: vanilla -> ${vanilla}; custom -> ${custom}; contents ${before.join() === after.join() ? "unchanged" : "CHANGED"}`);
    test.assert(vanilla.startsWith("LootError") && vanilla.includes("occupied"), `vanilla fill of a full chest: ${vanilla}`);
    test.assert(custom.startsWith("LootError") && custom.includes("occupied"), `custom fill of a full chest: ${custom}`);
    test.assert(before.join() === after.join(), "a refused fill changed the chest");
    test.succeed();
  } finally {
    cleanup([chest]);
  }
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

export const STRF_LOOT_TESTS = [
  "strf_loot_custom",
  "strf_loot_ancient_city",
  "strf_loot_bastion_treasure",
  "strf_loot_bastion_other",
  "strf_loot_control",
  "strf_loot_full_chest",
];
