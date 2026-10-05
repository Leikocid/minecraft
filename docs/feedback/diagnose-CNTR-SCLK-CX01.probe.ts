// L0-sclk-cx01 probe against BDS 1.26.51.1: does the engine let Piercing onto an
// item with `minecraft:enchantable.slot = "crossbow"`, and does the strip that
// L0-adr-scpi / L0-sclk-r005 prescribe (playerInventoryItemChange →
// removeEnchantment → setItem) land, keeping the other enchantments?
//
// Not part of the shipped gametest pack: diagnose-CNTR-SCLK-CX01.repro.sh copies
// this file, the two probe items and the probe loot tables into the tree for one
// run and restores it. There is no crossbow code; the strip below is the one the
// KV prescribes, written here only to measure it.
//
// The anvil and enchanting-table screens are not driven: a SimulatedPlayer has no
// container-screen API. What is measured instead is the engine's own answer on
// the server — canAddEnchantment, /enchant, and the loot functions
// enchant_with_levels / enchant_randomly / specific_enchants.

import {
  BlockPermutation,
  type Container,
  type Enchantment,
  EnchantmentTypes,
  GameMode,
  type ItemEnchantableComponent,
  ItemStack,
  ItemTypes,
  type Player,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, register, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
/** slot crossbow, value 1, minecraft:shooter — the option-A shape of L0-adr-scbs. */
const XBOW = "andrew:probe_sclk_xbow";
/** slot crossbow, value 1, no shooter — separates the slot from the shooter. */
const PLAIN = "andrew:probe_sclk_plain";
/** Option B of L0-adr-scbs, and the vanilla reference. */
const VANILLA = "minecraft:crossbow";
/** slot sword: the negative control. */
const SWORD = "andrew:web_sword";
const STRIP_IDS = new Set([XBOW, VANILLA]);
const ROLLS = 400;

const log = (msg: string): void => console.warn(`[probe] SCLK ${msg}`);

function errText(err: unknown): string {
  if (err instanceof Error) return `${err.name}:${err.message.replace(/\s+/g, " ").slice(0, 120)}`;
  return String(err);
}

function ench(id: string, level: number): Enchantment {
  const type = EnchantmentTypes.get(id) ?? EnchantmentTypes.get(`minecraft:${id}`);
  if (type === undefined) throw new Error(`enchantment ${id} is unknown to the engine`);
  return { type, level };
}

function enchantableOf(stack: ItemStack): ItemEnchantableComponent {
  const e = stack.getComponent("minecraft:enchantable");
  if (e === undefined) throw new Error(`${stack.typeId} has no minecraft:enchantable`);
  return e;
}

function list(stack: ItemStack | undefined): string {
  if (stack === undefined) return "empty";
  const e = stack.getComponent("minecraft:enchantable");
  if (e === undefined) return `${stack.typeId}[no-enchantable]`;
  const names = e
    .getEnchantments()
    .map((x) => `${x.type.id}${x.level}`)
    .sort();
  return `${stack.typeId}[${names.join("+") || "none"}]`;
}

function hasPiercing(stack: ItemStack | undefined): boolean {
  if (stack === undefined) return false;
  return stack.getComponent("minecraft:enchantable")?.hasEnchantment(ench("piercing", 1).type) ?? false;
}

function canAdd(stack: ItemStack, id: string, level: number): string {
  try {
    return String(enchantableOf(stack).canAddEnchantment(ench(id, level)));
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

function tryAdd(stack: ItemStack, enchants: Enchantment[]): string {
  try {
    enchantableOf(stack).addEnchantments(enchants);
    return "ok";
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

function inventoryOf(player: Player): Container {
  const c = player.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${player.name} has no inventory container`);
  return c;
}

// ------------------------------------------------------------- Q2a: the engine

register("andrew", "probe_sclk_cx01_engine", (test: Test): void => {
  const piercing = ench("piercing", 1).type;
  log(`ENGINE piercing id=${piercing.id} maxLevel=${piercing.maxLevel}`);
  for (const id of [XBOW, PLAIN, VANILLA, "minecraft:bow", SWORD]) {
    if (ItemTypes.get(id) === undefined) {
      log(`ENGINE ${id} RESULT missing — the item did not load`);
      continue;
    }
    const s = new ItemStack(id, 1);
    const cells = [
      ["piercing", 1],
      ["piercing", 4],
      ["quick_charge", 3],
      ["multishot", 1],
      ["unbreaking", 3],
      ["mending", 1],
      ["power", 1],
      ["sharpness", 1],
    ] as const;
    log(`ENGINE ${id} RESULT ${cells.map(([e, l]) => `${e}${l}=${canAdd(s, e, l)}`).join(" ")}`);
  }

  for (const id of [XBOW, VANILLA]) {
    const a = new ItemStack(id, 1);
    const aFirst = tryAdd(a, [ench("multishot", 1)]);
    const aCan = canAdd(a, "piercing", 1);
    const aAdd = tryAdd(a, [ench("piercing", 1)]);
    const b = new ItemStack(id, 1);
    const bFirst = tryAdd(b, [ench("piercing", 4)]);
    const bCan = canAdd(b, "multishot", 1);
    const bAdd = tryAdd(b, [ench("multishot", 1)]);
    const c = new ItemStack(id, 1);
    const cAdd = tryAdd(c, [ench("piercing", 4), ench("multishot", 1)]);
    log(
      `CONFLICT ${id} RESULT multishot_then_piercing: first=${aFirst} canAdd=${aCan} add=${aAdd} final=${list(a)}; ` +
        `piercing_then_multishot: first=${bFirst} canAdd=${bCan} add=${bAdd} final=${list(b)}; ` +
        `both_at_once: add=${cAdd} final=${list(c)}`
    );
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(20)
  .tag("andrew");

// --------------------------------------------- Q2b: the table's generator, by loot

const TABLES = [
  "ewl30_xbow",
  "ewl30_plain",
  "ewl30_vanilla",
  "ewl30_sword",
  "ewlr_xbow",
  "ewlr_vanilla",
  "er_xbow",
  "er_vanilla",
  "se_combo_xbow",
  "se_combo_vanilla",
];

registerAsync("andrew", "probe_sclk_cx01_tables", async (test: Test): Promise<void> => {
  const manager = world.getLootTableManager();
  for (const name of TABLES) {
    const table = manager.getLootTable(`probe_sclk/${name}`);
    if (table === undefined) {
      log(`TABLE ${name} RESULT missing — the loot table did not load`);
      continue;
    }
    const per = new Map<string, number>();
    let stacks = 0;
    let withPiercing = 0;
    let onlyPiercing = 0;
    let piercingAndMultishot = 0;
    let bare = 0;
    let sample = "";
    for (let i = 0; i < ROLLS; i++) {
      for (const s of manager.generateLootFromTable(table) ?? []) {
        stacks++;
        const es = s.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
        const ids = es.map((e) => e.type.id);
        for (const id of ids) per.set(id, (per.get(id) ?? 0) + 1);
        if (ids.length === 0) bare++;
        if (ids.includes("piercing")) {
          withPiercing++;
          if (ids.length === 1) onlyPiercing++;
          if (ids.includes("multishot")) piercingAndMultishot++;
          if (sample === "") sample = list(s);
        }
      }
    }
    const counts = [...per]
      .sort()
      .map(([id, n]) => `${id}=${n}`)
      .join(",");
    log(
      `TABLE ${name} RESULT rolls=${ROLLS} stacks=${stacks} with_piercing=${withPiercing} only_piercing=${onlyPiercing} ` +
        `piercing_and_multishot=${piercingAndMultishot} bare=${bare} counts=${counts || "-"} sample=${sample || "-"}`
    );
    await test.idle(1);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

// ------------------------------------------------------- Q2c: the /enchant command

function enchantCommand(test: Test, player: Player, enchantment: string, level: number): string {
  try {
    return `success=${test.getDimension().runCommand(`enchant "${player.name}" ${enchantment} ${level}`).successCount}`;
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

registerAsync("andrew", "probe_sclk_cx01_command", async (test: Test): Promise<void> => {
  const cases: ReadonlyArray<{ name: string; item: string; pre: Enchantment[]; enchant: string; level: number }> = [
    { name: "xbow_piercing4", item: XBOW, pre: [], enchant: "piercing", level: 4 },
    { name: "plain_piercing4", item: PLAIN, pre: [], enchant: "piercing", level: 4 },
    { name: "vanilla_piercing4", item: VANILLA, pre: [], enchant: "piercing", level: 4 },
    { name: "xbow_multishot_then_piercing", item: XBOW, pre: [ench("multishot", 1)], enchant: "piercing", level: 1 },
    { name: "xbow_quickcharge3", item: XBOW, pre: [], enchant: "quick_charge", level: 3 },
    { name: "sword_piercing1", item: SWORD, pre: [], enchant: "piercing", level: 1 },
  ];
  let x = 1;
  for (const c of cases) {
    const player = test.spawnSimulatedPlayer({ x, y: 2, z: 2 }, `sclk_cmd_${c.name}`.slice(0, 30), GameMode.Survival);
    x += 1;
    await test.idle(4);
    const stack = new ItemStack(c.item, 1);
    if (c.pre.length > 0) enchantableOf(stack).addEnchantments(c.pre);
    const inv = inventoryOf(player);
    player.selectedSlotIndex = 0;
    inv.setItem(0, stack);
    await test.idle(2);
    const before = list(inv.getItem(0));
    const result = enchantCommand(test, player, c.enchant, c.level);
    await test.idle(2);
    log(`COMMAND ${c.name} RESULT before=${before} ${result} after=${list(inv.getItem(0))}`);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ------------------------------------------------ Q-strip: the strip L0-adr-scpi prescribes

interface Seen {
  tick: number;
  slot: number;
  inv: string;
  after: string;
  piercing: boolean;
  action: string;
}

let stripPlayer: string | undefined;
const seen: Seen[] = [];

/** The strip as r005 words it: any stripped id found with piercing loses it, the rest stays. */
function stripAll(container: Container): string {
  const done: string[] = [];
  for (let i = 0; i < container.size; i++) {
    const live = container.getItem(i);
    if (live === undefined || !STRIP_IDS.has(live.typeId) || !hasPiercing(live)) continue;
    try {
      enchantableOf(live).removeEnchantment(ench("piercing", 1).type);
      container.setItem(i, live);
      done.push(`slot${i}->${list(container.getItem(i))}`);
    } catch (err) {
      done.push(`slot${i}:threw(${errText(err)})`);
    }
  }
  return done.join(",") || "nothing";
}

world.afterEvents.playerInventoryItemChange.subscribe((event) => {
  const player = event.player as Player | undefined;
  if (player === undefined || player.name !== stripPlayer) return;
  const piercing = hasPiercing(event.itemStack);
  const rec: Seen = {
    tick: system.currentTick,
    slot: event.slot,
    inv: event.inventoryType,
    after: event.itemStack?.typeId ?? "empty",
    piercing,
    action: "-",
  };
  if (piercing && event.itemStack !== undefined && STRIP_IDS.has(event.itemStack.typeId)) {
    rec.action = `strip:${stripAll(inventoryOf(player))}`;
  }
  seen.push(rec);
});

function piercedStack(id: string): ItemStack {
  const s = new ItemStack(id, 1);
  enchantableOf(s).addEnchantments([ench("piercing", 4), ench("quick_charge", 3), ench("unbreaking", 3)]);
  return s;
}

function scan(container: Container): string {
  const out: string[] = [];
  for (let i = 0; i < container.size; i++) {
    const s = container.getItem(i);
    if (s !== undefined && STRIP_IDS.has(s.typeId)) out.push(`slot${i}:${list(s)}`);
  }
  return out.join(",") || "none";
}

registerAsync("andrew", "probe_sclk_cx01_strip", async (test: Test): Promise<void> => {
  const name = "sclk_cx01_strip";
  const player: SimulatedPlayer = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 3 }, name, GameMode.Survival);
  await test.idle(10);
  stripPlayer = name;
  const inv = inventoryOf(player);
  const chestCell = { x: 5, y: 2, z: 5 };
  test.getDimension().getBlock(test.worldBlockLocation(chestCell))?.setPermutation(BlockPermutation.resolve("minecraft:chest"));

  const cases: ReadonlyArray<{ name: string; prep?: () => void; put: () => void }> = [
    { name: "addItem_xbow", put: () => void inv.addItem(piercedStack(XBOW)) },
    { name: "setItem_slot20_xbow", put: () => inv.setItem(20, piercedStack(XBOW)) },
    { name: "pickup_xbow", put: () => void test.getDimension().spawnItem(piercedStack(XBOW), player.location) },
    {
      name: "chest_transfer_xbow",
      put: () => {
        const chest = test.getDimension().getBlock(test.worldBlockLocation(chestCell))?.getComponent("minecraft:inventory")?.container;
        if (chest === undefined) throw new Error("no chest container");
        chest.setItem(0, piercedStack(XBOW));
        chest.transferItem(0, inv);
      },
    },
    {
      name: "enchant_in_place_xbow",
      prep: () => {
        player.selectedSlotIndex = 0;
        inv.setItem(0, new ItemStack(XBOW, 1));
      },
      put: () => log(`STRIP enchant_in_place_xbow command ${enchantCommand(test, player, "piercing", 4)}`),
    },
    { name: "addItem_vanilla", put: () => void inv.addItem(piercedStack(VANILLA)) },
  ];

  for (const c of cases) {
    inv.clearAll();
    c.prep?.();
    await test.idle(3);
    seen.length = 0;
    const t0 = system.currentTick;
    let putErr = "";
    try {
      c.put();
    } catch (err) {
      putErr = ` put_threw(${errText(err)})`;
    }
    const samples: string[] = [`+0sync=${scan(inv)}`];
    let elapsed = 0;
    for (const d of [1, 2, 5, 20, 40]) {
      await test.idle(d - elapsed);
      elapsed = d;
      samples.push(`+${system.currentTick - t0}=${scan(inv)}`);
    }
    const events = seen.map((s) => `+${s.tick - t0}:${s.inv}#${s.slot}:${s.after}:piercing=${s.piercing}:${s.action}`).join(" | ");
    log(`STRIP ${c.name} RESULT${putErr} events=${seen.length} [${events || "none"}] ${samples.join(" ")}`);
  }
  stripPlayer = undefined;
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");
