// ENCH-PROBE-01 probes on BDS 1.26.51.1 (spec v3 §4, L0-ench-prob, L0-ench-cx01): what a script can see around the
// vanilla enchanting table and anvil, measured before any enchanting code exists. Nothing here changes a table or
// anvil result. The only cancel (Q3 "…_vetoed") measures what a playerInteractWithBlock cancel prevents; it is scoped
// to one fresh probe player and unsubscribed in the same step. The answers are the "[probe] ENCH … RESULT" lines,
// recorded in docs/feedback/probe-enchanting.md; the Q5 loot tables live in packs/gametest/loot_tables/probe_ench.

import {
  Block,
  BlockComponentTypes,
  BlockPermutation,
  type Container,
  EnchantmentType,
  EnchantmentTypes,
  Entity,
  GameMode,
  ItemComponentTypes,
  ItemStack,
  ItemTypes,
  Player,
  type PlayerInteractWithBlockBeforeEvent,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const TABLE = "minecraft:enchanting_table";
const ANVIL = "minecraft:anvil";
const CHEST = "minecraft:chest";
const GRINDSTONE = "minecraft:grindstone";
/** Floor cells of the 7×5×7 platform sit at relative y=1, so blocks and players go at y=2. */
const TABLE_AT: Vector3 = { x: 2, y: 2, z: 5 };
const ANVIL_AT: Vector3 = { x: 3, y: 2, z: 5 };
const CHEST_AT: Vector3 = { x: 5, y: 2, z: 5 };
const GRIND_AT: Vector3 = { x: 0, y: 2, z: 5 };
const STAND_AT: Vector3 = { x: 2, y: 2, z: 2 };
const ROLLS = 1000;
const POOL_ITEMS = [
  "mace",
  "iron_spear",
  "diamond_sword",
  "diamond_axe",
  "diamond_pickaxe",
  "diamond_helmet",
  "diamond_chestplate",
  "diamond_leggings",
  "diamond_boots",
  "bow",
  "crossbow",
  "trident",
  "fishing_rod",
  "book",
] as const;
/** enchant_with_levels at 30 and at 1–30 with treasure:false (the engine's level generator, in loot form), and at 30 with treasure:true. */
const POOL_KINDS = ["l30", "l1_30", "t30"] as const;

const log = (msg: string): void => console.warn(`[probe] ENCH ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0].slice(0, 160);

function enchList(stack: ItemStack | undefined): string {
  const list = stack?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  return list
    .map((e) => `${e.type.id}${e.level}`)
    .sort()
    .join("+");
}

function stackText(stack: ItemStack | undefined): string {
  if (stack === undefined) return "empty";
  const name = stack.nameTag === undefined ? "" : ` name="${stack.nameTag}"`;
  return `${short(stack.typeId)}×${stack.amount}[${enchList(stack) || "none"}]${name}`;
}

function enchanted(id: string, enchants: ReadonlyArray<readonly [string, number]>, nameTag?: string): ItemStack {
  const stack = new ItemStack(id, 1);
  const enchantable = stack.getComponent("minecraft:enchantable");
  for (const [e, level] of enchants) enchantable?.addEnchantment({ type: new EnchantmentType(e), level });
  if (nameTag !== undefined) stack.nameTag = nameTag;
  return stack;
}

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

function snapshot(player: Player): string {
  const c = inventoryOf(player);
  const out: string[] = [];
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s !== undefined) out.push(`${i}:${stackText(s)}`);
  }
  return out.join(" ") || "none";
}

function cursorText(player: Player): string {
  const cursor = player.getComponent("minecraft:cursor_inventory");
  if (cursor === undefined) return "no-component";
  return stackText(cursor.item);
}

// ------------------------------------------------------------------ the tap

interface Signal {
  subscribe(callback: (event: unknown) => void): unknown;
  unsubscribe(callback: (event: unknown) => void): void;
}

interface Tapped {
  tick: number;
  name: string;
  text: string;
}

function isSignal(value: unknown): value is Signal {
  return typeof value === "object" && value !== null && typeof (value as { subscribe?: unknown }).subscribe === "function";
}

/** Every signal on an events object, read at runtime: own and prototype properties, since native getters sit on the prototype. */
function signalNames(root: object): string[] {
  const names = new Set<string>();
  for (let o: object | null = root; o !== null && o !== Object.prototype; o = Object.getPrototypeOf(o) as object | null) {
    for (const k of Object.getOwnPropertyNames(o)) names.add(k);
  }
  for (const k in root) names.add(k);
  return [...names]
    .filter((k) => {
      try {
        return isSignal((root as Record<string, unknown>)[k]);
      } catch {
        return false;
      }
    })
    .sort();
}

function describe(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value !== "object") return String(value);
  try {
    if (value instanceof ItemStack) return stackText(value);
    if (value instanceof Block) return `${short(value.typeId)}@${value.x},${value.y},${value.z}`;
    if (value instanceof Player) return `player:${value.name}`;
    if (value instanceof Entity) return `entity:${short(value.typeId)}`;
  } catch (err) {
    return `invalid(${errText(err)})`;
  }
  if (Array.isArray(value)) return `[${value.length}]`;
  if (depth > 1) return "{…}";
  // Native event fields are getters on the prototype chain: BlockContainerOpenedAfterEvent gets `block` from BlockEvent.
  const names = new Set<string>(Object.keys(value));
  for (let o = Object.getPrototypeOf(value) as object | null; o !== null && o !== Object.prototype; o = Object.getPrototypeOf(o) as object | null) {
    for (const k of Object.getOwnPropertyNames(o)) names.add(k);
  }
  const parts: string[] = [];
  for (const k of names) {
    if (k === "constructor") continue;
    let v: unknown;
    try {
      v = (value as Record<string, unknown>)[k];
    } catch (err) {
      v = `threw(${errText(err)})`;
    }
    if (typeof v === "function") continue;
    parts.push(`${k}=${describe(v, depth + 1)}`);
  }
  return `{${parts.join(" ")}}`;
}

/** Subscribes a recorder to every world before- and after-event signal; returns the unsubscriber. */
function openTap(sink: Tapped[]): () => void {
  const undo: Array<() => void> = [];
  for (const [phase, root] of [
    ["before", world.beforeEvents],
    ["after", world.afterEvents],
  ] as const) {
    for (const name of signalNames(root)) {
      const signal = (root as unknown as Record<string, unknown>)[name];
      if (!isSignal(signal)) continue;
      const callback = (event: unknown): void => {
        sink.push({ tick: system.currentTick, name: `${phase}.${name}`, text: describe(event) });
      };
      try {
        signal.subscribe(callback);
        undo.push(() => signal.unsubscribe(callback));
      } catch (err) {
        log(`TAP ${phase}.${name} subscribe threw ${errText(err)}`);
      }
    }
  }
  return () => {
    for (const u of undo) u();
  };
}

/** Events in the window, grouped by signal, with the tick offset from `from` and the first texts. */
function eventsIn(sink: Tapped[], from: number, playerName: string): string {
  const mine = sink.filter((t) => t.tick >= from && (t.text.includes(playerName) || /enchanting_table|anvil|chest|grindstone/.test(t.text)));
  const by = new Map<string, Tapped[]>();
  for (const t of mine) by.set(t.name, [...(by.get(t.name) ?? []), t]);
  if (by.size === 0) return "no events";
  return [...by]
    .map(([name, ts]) => `${name}×${ts.length}{${ts.slice(0, 3).map((t) => `+${t.tick - from} ${t.text.slice(0, 260)}`).join(" | ")}}`)
    .join(" ; ");
}

async function survivor(test: Test, at: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(4);
  return p;
}

function put(test: Test, at: Vector3, typeId: string): Block {
  const block = test.getDimension().getBlock(test.worldBlockLocation(at));
  if (block === undefined) throw new Error(`no block at ${at.x},${at.y},${at.z}`);
  block.setPermutation(BlockPermutation.resolve(typeId));
  return block;
}

/** Watches the player's level each tick for `ticks` ticks and returns "L@+t" at every change. */
async function watchLevel(test: Test, player: Player, ticks: number, from: number): Promise<string> {
  const out: string[] = [];
  let last = player.level;
  for (let i = 0; i < ticks; i++) {
    await test.idle(1);
    if (player.level !== last) {
      out.push(`${last}->${player.level}@+${system.currentTick - from}`);
      last = player.level;
    }
  }
  return out.join(",") || `unchanged(${last})`;
}

// --------------------------------------------- Q1: what the API exposes at all

registerAsync("andrew", "probe_ench_surface", async (test: Test): Promise<void> => {
  const wb = signalNames(world.beforeEvents);
  const wa = signalNames(world.afterEvents);
  const sb = signalNames(system.beforeEvents);
  const sa = signalNames(system.afterEvents);
  const hint = /enchant|anvil|grind|craft|container|xp|experience|level|lapis|smith|repair|trade/i;
  log(`Q1 RESULT world.beforeEvents n=${wb.length} [${wb.join(",")}]`);
  log(`Q1 RESULT world.afterEvents n=${wa.length} [${wa.join(",")}]`);
  log(`Q1 RESULT system.beforeEvents n=${sb.length} [${sb.join(",")}] system.afterEvents n=${sa.length} [${sa.join(",")}]`);
  log(
    `Q1 RESULT names matching ${hint.source}: before=[${wb.filter((n) => hint.test(n)).join(",") || "none"}] ` +
      `after=[${wa.filter((n) => hint.test(n)).join(",") || "none"}]`
  );

  const blockIds = Object.values(BlockComponentTypes) as string[];
  const guesses = ["minecraft:enchanting_table", "minecraft:anvil", "minecraft:container", "minecraft:enchantable"];
  let chestHasInventory = false;
  for (const [typeId, at] of [
    [TABLE, TABLE_AT],
    [ANVIL, ANVIL_AT],
    [GRINDSTONE, GRIND_AT],
    [CHEST, CHEST_AT],
  ] as const) {
    const block = put(test, at, typeId);
    await test.idle(1);
    const present: string[] = [];
    for (const id of [...blockIds, ...guesses]) {
      try {
        if (block.getComponent(id) !== undefined) present.push(id);
      } catch (err) {
        present.push(`${id}:threw(${errText(err)})`);
      }
    }
    const size = block.getComponent("minecraft:inventory")?.container?.size;
    if (typeId === CHEST && size !== undefined) chestHasInventory = true;
    log(`Q1 BLOCK ${short(typeId)} RESULT components=[${present.join(",") || "none"}] inventory_size=${size ?? "none"} of ${blockIds.length} known + ${guesses.length} guessed ids`);
  }

  const itemIds = Object.values(ItemComponentTypes) as string[];
  for (const id of ["minecraft:diamond_sword", "minecraft:mace", "minecraft:iron_spear", "minecraft:book", "minecraft:enchanted_book", "minecraft:lapis_lazuli"]) {
    if (ItemTypes.get(id) === undefined) {
      log(`Q1 ITEM ${short(id)} RESULT unknown item`);
      continue;
    }
    const s = new ItemStack(id, 1);
    const listed = s.getComponents().map((c) => c.typeId);
    const probed = itemIds.filter((c) => s.getComponent(c) !== undefined);
    const slots = s.getComponent("minecraft:enchantable")?.slots ?? [];
    log(`Q1 ITEM ${short(id)} RESULT getComponents=[${listed.join(",")}] probed=[${probed.join(",")}] enchant_slots=${JSON.stringify(slots)}`);
  }

  const all = EnchantmentTypes.getAll();
  const typeProps = all.length > 0 ? Object.getOwnPropertyNames(Object.getPrototypeOf(all[0]) as object).filter((k) => k !== "constructor") : [];
  log(`Q1 RESULT EnchantmentTypes n=${all.length} [${all.map((e) => `${e.id}:${e.maxLevel}`).sort().join(",")}] EnchantmentType props=[${typeProps.join(",")}]`);

  const p = await survivor(test, STAND_AT, "ench_q1");
  const comps = p.getComponents().map((c) => c.typeId).sort();
  log(`Q1 PLAYER RESULT components=[${comps.join(",")}] inventory_size=${inventoryOf(p).size} cursor=${cursorText(p)}`);
  test.assert(chestHasInventory, "control: the chest exposes no minecraft:inventory — the component read is broken");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ------------------------------- Q2: which result signals a script receives

registerAsync("andrew", "probe_ench_result_signals", async (test: Test): Promise<void> => {
  const name = "ench_q2";
  const p = await survivor(test, STAND_AT, name);
  const inv = inventoryOf(p);
  p.addLevels(30);
  inv.setItem(0, new ItemStack("minecraft:diamond_sword", 1));
  inv.setItem(1, new ItemStack("minecraft:lapis_lazuli", 3));
  await test.idle(2);
  const sink: Tapped[] = [];
  const close = openTap(sink);
  try {
    const steps: ReadonlyArray<{ step: string; act: () => void }> = [
      { step: "plain_item_leaves", act: () => inv.setItem(0) },
      { step: "enchanted_arrives_empty_slot", act: () => inv.setItem(0, enchanted("minecraft:diamond_sword", [["sharpness", 3], ["unbreaking", 2]])) },
      { step: "enchant_command_in_place", act: () => void test.getDimension().runCommand(`enchant "${name}" looting 2`) },
      { step: "script_addEnchantment_in_place", act: () => {
        const s = inv.getItem(0);
        s?.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("fire_aspect"), level: 1 });
        inv.setItem(0, s);
      } },
      { step: "levels_minus_3_script", act: () => void p.addLevels(-3) },
      { step: "levels_minus_2_command", act: () => void test.getDimension().runCommand(`xp -2L "${name}"`) },
      { step: "lapis_3_to_1", act: () => inv.setItem(1, new ItemStack("minecraft:lapis_lazuli", 1)) },
      { step: "lapis_leaves", act: () => inv.setItem(1) },
      { step: "enchanted_pickup", act: () => void test.getDimension().spawnItem(enchanted("minecraft:diamond_pickaxe", [["efficiency", 4]]), p.location) },
      { step: "renamed_arrives", act: () => void inv.addItem(enchanted("minecraft:diamond_axe", [["sharpness", 1]], "Renamed")) },
    ];
    for (const { step, act } of steps) {
      const before = `level=${p.level} inv=${snapshot(p)}`;
      const from = system.currentTick;
      act();
      const levelSync = p.level;
      const levels = await watchLevel(test, p, 6, from);
      log(`Q2 ${step} RESULT before{${before}} level_same_tick=${levelSync} level_changes=${levels} after{level=${p.level} inv=${snapshot(p)}} events: ${eventsIn(sink, from, name)}`);
    }
  } finally {
    close();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// --------------------------- Q3: can a SimulatedPlayer operate the table at all

/** A hotbar slot left empty: interactWithBlock with an empty hand. */
const EMPTY_SLOT = 8;

interface Step {
  step: string;
  ticks: number;
  act: () => unknown;
}

async function runSteps(test: Test, p: SimulatedPlayer, sink: Tapped[], tag: string, steps: readonly Step[]): Promise<void> {
  for (const { step, ticks, act } of steps) {
    const before = `level=${p.level} inv=${snapshot(p)}`;
    const from = system.currentTick;
    let result: string;
    try {
      result = String(act());
    } catch (err) {
      result = `threw(${errText(err)})`;
    }
    const levels = await watchLevel(test, p, ticks, from);
    log(
      `${tag} ${step} RESULT returned=${result} before{${before}} level_changes=${levels} cursor=${cursorText(p)} ` +
        `after{level=${p.level} inv=${snapshot(p)}} events: ${eventsIn(sink, from, p.name)}`
    );
  }
}

registerAsync("andrew", "probe_ench_simplayer_table", async (test: Test): Promise<void> => {
  const name = "ench_q3";
  put(test, TABLE_AT, TABLE);
  put(test, ANVIL_AT, ANVIL);
  put(test, CHEST_AT, CHEST);
  const p = await survivor(test, STAND_AT, name);
  const inv = inventoryOf(p);
  p.addLevels(30);
  inv.setItem(0, new ItemStack("minecraft:diamond_sword", 1));
  inv.setItem(1, new ItemStack("minecraft:lapis_lazuli", 3));
  inv.setItem(2, enchanted("minecraft:enchanted_book", [["mending", 1]]));
  inv.setItem(3, new ItemStack("minecraft:stick", 1));
  await test.idle(2);
  const sink: Tapped[] = [];
  const close = openTap(sink);
  const look = (at: Vector3, slot: number): void => {
    p.selectedSlotIndex = slot;
    p.lookAtBlock(at, LookDuration.Instant);
  };
  let control = -1;
  try {
    await runSteps(test, p, sink, "Q3", [
      { step: "interact_table_empty_hand", ticks: 40, act: () => (look(TABLE_AT, EMPTY_SLOT), p.interactWithBlock(TABLE_AT)) },
      { step: "use_sword_on_table", ticks: 20, act: () => p.useItemInSlotOnBlock(0, TABLE_AT) },
      { step: "use_lapis_on_table", ticks: 20, act: () => p.useItemInSlotOnBlock(1, TABLE_AT) },
      {
        step: "control_enchant_command_on_held_sword",
        ticks: 4,
        act: () => {
          p.selectedSlotIndex = 0;
          control = test.getDimension().runCommand(`enchant "${name}" sharpness 2`).successCount;
          return control;
        },
      },
      { step: "interact_anvil_empty_hand", ticks: 20, act: () => (look(ANVIL_AT, EMPTY_SLOT), p.interactWithBlock(ANVIL_AT)) },
      { step: "use_book_on_anvil", ticks: 20, act: () => p.useItemInSlotOnBlock(2, ANVIL_AT) },
    ]);
  } finally {
    close();
  }
  test.assert(control === 1, `control: /enchant on the held sword answered ${control} — the player or the command is broken`);

  // What a playerInteractWithBlock cancel prevents, each case on a fresh player: a SimulatedPlayer keeps a container
  // open until the block goes, and interactWithBlock raises no playerInteractWithBlock, so only the item-use path is
  // vetoable here.
  test.removeSimulatedPlayer(p);
  const vetoCases: ReadonlyArray<{ step: string; at: Vector3; veto: string | undefined }> = [
    { step: "chest_stick_not_vetoed", at: CHEST_AT, veto: undefined },
    { step: "chest_stick_vetoed", at: CHEST_AT, veto: CHEST },
    { step: "table_stick_vetoed", at: TABLE_AT, veto: TABLE },
  ];
  let n = 0;
  for (const c of vetoCases) {
    const who = `ench_q3v${n++}`;
    const v = await survivor(test, STAND_AT, who);
    inventoryOf(v).setItem(3, new ItemStack("minecraft:stick", 1));
    v.selectedSlotIndex = 3;
    v.lookAtBlock(c.at, LookDuration.Instant);
    await test.idle(2);
    const sink: Tapped[] = [];
    const close = openTap(sink);
    const cancel = (event: PlayerInteractWithBlockBeforeEvent): void => {
      if (event.player.name === who && event.block.typeId === c.veto) event.cancel = true;
    };
    world.beforeEvents.playerInteractWithBlock.subscribe(cancel);
    const from = system.currentTick;
    let returned: string;
    try {
      returned = String(v.useItemInSlotOnBlock(3, c.at));
      await test.idle(5);
    } finally {
      world.beforeEvents.playerInteractWithBlock.unsubscribe(cancel);
      close();
    }
    log(`Q3 ${c.step} RESULT returned=${returned} container_events={${containerEvents(sink, from)}} events: ${eventsIn(sink, from, who)}`);
    test.removeSimulatedPlayer(v);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ----------------------------- Q4: what could tell a table result from an anvil

/** Blocks a player opens a screen on; which of them raise blockContainerOpened / Closed. */
const SWEEP = [
  "minecraft:chest",
  "minecraft:barrel",
  "minecraft:furnace",
  "minecraft:hopper",
  "minecraft:brewing_stand",
  "minecraft:crafting_table",
  "minecraft:enchanting_table",
  "minecraft:anvil",
  "minecraft:grindstone",
  "minecraft:smithing_table",
  "minecraft:loom",
  "minecraft:stonecutter_block",
  "minecraft:cartography_table",
];
const SWEEP_AT: Vector3 = { x: 4, y: 2, z: 5 };
/** A second chest, two cells off the sweep: whether it still opens tells if the swept block left a screen open. */
const WITNESS_AT: Vector3 = { x: 6, y: 2, z: 3 };
const SWEEP_STAND: Vector3 = { x: 4, y: 2, z: 3 };

function containerEvents(sink: Tapped[], from: number): string {
  return (
    sink
      .filter((t) => t.tick >= from && /blockContainer(Opened|Closed)|playerInteractWithBlock/.test(t.name))
      .map((t) => `${t.name}+${t.tick - from}:${(/([a-z_]+)@-?\d+,-?\d+,-?\d+/.exec(t.text) ?? ["", "?"])[1]}`)
      .join(",") || "none"
  );
}

function tablesWithin(test: Test, player: Player, r: number): number {
  const dim = test.getDimension();
  const c = player.location;
  let n = 0;
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++)
      for (let dz = -r; dz <= r; dz++) {
        if (dim.getBlock({ x: Math.floor(c.x) + dx, y: Math.floor(c.y) + dy, z: Math.floor(c.z) + dz })?.typeId === TABLE) n++;
      }
  return n;
}

function rayText(player: Player): string {
  const hit = player.getBlockFromViewDirection({ maxDistance: 6 });
  return hit === undefined ? "none" : short(hit.block.typeId);
}

/** Empty-hand interactWithBlock on `at`, then the events of the next three ticks. */
async function openWith(test: Test, p: SimulatedPlayer, sink: Tapped[], at: Vector3): Promise<string> {
  p.selectedSlotIndex = EMPTY_SLOT;
  p.lookAtBlock(at, LookDuration.Instant);
  const from = system.currentTick;
  const returned = p.interactWithBlock(at);
  await test.idle(3);
  return `${returned}:{${containerEvents(sink, from)}}`;
}

registerAsync("andrew", "probe_ench_separators", async (test: Test): Promise<void> => {
  const sink: Tapped[] = [];
  const close = openTap(sink);
  let chestOpened = false;
  let n = 0;
  try {
    put(test, WITNESS_AT, CHEST);
    for (const typeId of SWEEP) {
      put(test, SWEEP_AT, typeId);
      const p = await survivor(test, SWEEP_STAND, `ench_q4s${n++}`);
      const swept = await openWith(test, p, sink, SWEEP_AT);
      const witness = await openWith(test, p, sink, WITNESS_AT);
      const from = system.currentTick;
      put(test, SWEEP_AT, "minecraft:air");
      await test.idle(3);
      if (typeId === CHEST && swept.includes("blockContainerOpened")) chestOpened = true;
      log(`Q4 SWEEP ${short(typeId)} RESULT open=${swept} then_witness_chest=${witness} block_removed:{${containerEvents(sink, from)}}`);
      test.removeSimulatedPlayer(p);
      await test.idle(2);
    }

    // The other ways a SimulatedPlayer can touch a block, each on a fresh player, each followed by the witness chest.
    const ways: ReadonlyArray<readonly [string, (p: SimulatedPlayer) => boolean]> = [
      ["interact", (p) => p.interact()],
      ["use_empty_slot_on_block", (p) => p.useItemInSlotOnBlock(EMPTY_SLOT, SWEEP_AT)],
      ["use_stick_on_block", (p) => p.useItemInSlotOnBlock(3, SWEEP_AT)],
    ];
    for (const typeId of [CHEST, "minecraft:barrel", "minecraft:crafting_table", TABLE, ANVIL, GRINDSTONE]) {
      for (const [way, touch] of ways) {
        put(test, SWEEP_AT, typeId);
        const p = await survivor(test, SWEEP_STAND, `ench_q4w${n++}`);
        inventoryOf(p).setItem(3, new ItemStack("minecraft:stick", 1));
        p.selectedSlotIndex = way === "use_stick_on_block" ? 3 : EMPTY_SLOT;
        p.lookAtBlock(SWEEP_AT, LookDuration.Instant);
        await test.idle(2);
        const from = system.currentTick;
        let returned: string;
        try {
          returned = String(touch(p));
        } catch (err) {
          returned = `threw(${errText(err)})`;
        }
        await test.idle(3);
        const touched = containerEvents(sink, from);
        const witness = await openWith(test, p, sink, WITNESS_AT);
        log(`Q4 WAY ${short(typeId)} ${way} RESULT returned=${returned}:{${touched}} then_witness_chest=${witness}`);
        test.removeSimulatedPlayer(p);
        put(test, SWEEP_AT, "minecraft:air");
        await test.idle(2);
      }
    }

    for (const [how, leave] of [
      ["walk_17_blocks", (p: SimulatedPlayer) => p.teleport(test.worldLocation({ x: 4.5, y: 2, z: -14 }))],
      ["player_removed", (p: SimulatedPlayer) => test.removeSimulatedPlayer(p)],
    ] as const) {
      put(test, SWEEP_AT, CHEST);
      const p = await survivor(test, SWEEP_STAND, `ench_q4c${n++}`);
      const opened = await openWith(test, p, sink, SWEEP_AT);
      const from = system.currentTick;
      leave(p);
      await test.idle(40);
      log(`Q4 CLOSE chest ${how} RESULT open=${opened} closed_within_40:{${containerEvents(sink, from)}}`);
      if (how !== "player_removed") test.removeSimulatedPlayer(p);
      put(test, SWEEP_AT, "minecraft:air");
      await test.idle(2);
    }

    const name = "ench_q4";
    put(test, TABLE_AT, TABLE);
    put(test, ANVIL_AT, ANVIL);
    const p = await survivor(test, { x: 2, y: 2, z: 3 }, name);
    const inv = inventoryOf(p);
    p.lookAtBlock(TABLE_AT, LookDuration.Instant);
    await test.idle(2);
    log(`Q4 RAY facing_table RESULT ray=${rayText(p)} tables_r2=${tablesWithin(test, p, 2)} tables_r4=${tablesWithin(test, p, 4)}`);
    p.lookAtBlock(ANVIL_AT, LookDuration.Instant);
    await test.idle(2);
    log(`Q4 RAY facing_anvil RESULT ray=${rayText(p)} tables_r2=${tablesWithin(test, p, 2)} tables_r4=${tablesWithin(test, p, 4)}`);

    inv.setItem(2, enchanted("minecraft:enchanted_book", [["mending", 1]]));
    await test.idle(2);
    let from = system.currentTick;
    inv.setItem(2);
    await test.idle(2);
    log(`Q4 book_leaves RESULT events: ${eventsIn(sink, from, name)}`);

    from = system.currentTick;
    inv.setItem(4, enchanted("minecraft:diamond_pickaxe", [["mending", 1]], "My Pick"));
    inv.setItem(5, enchanted("minecraft:diamond_pickaxe", [["efficiency", 3]]));
    await test.idle(2);
    log(`Q4 rename_visible RESULT events: ${eventsIn(sink, from, name)}`);
  } finally {
    close();
  }
  test.assert(chestOpened, "control: opening a chest raised no blockContainerOpened — the tap is broken");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

// ---------------------- Q5: what the level generator already gives in 1.26.51

registerAsync("andrew", "probe_ench_table_pool", async (test: Test): Promise<void> => {
  const manager = world.getLootTableManager();
  const types = EnchantmentTypes.getAll();
  let loaded = 0;
  for (const item of POOL_ITEMS) {
    const id = `minecraft:${item}`;
    if (ItemTypes.get(id) === undefined) {
      log(`Q5 ${item} RESULT unknown item`);
      continue;
    }
    const probe = new ItemStack(id, 1);
    const admits: string[] = [];
    const threw: string[] = [];
    for (const t of types) {
      try {
        if (probe.getComponent("minecraft:enchantable")?.canAddEnchantment({ type: t, level: 1 }) === true) admits.push(t.id);
      } catch (err) {
        threw.push(`${t.id}:${errText(err)}`);
      }
    }
    if (threw.length > 0) log(`Q5 ${item} canAddEnchantment threw for [${threw.join(",")}]`);
    const seen = new Map<string, Set<string>>();
    for (const kind of POOL_KINDS) {
      const table = manager.getLootTable(`probe_ench/${item}_${kind}`);
      if (table === undefined) {
        log(`Q5 ${item} ${kind} RESULT missing loot table`);
        continue;
      }
      loaded++;
      const per = new Map<string, number>();
      const maxLevel = new Map<string, number>();
      let stacks = 0;
      let bare = 0;
      let outType = "";
      for (let i = 0; i < ROLLS; i++) {
        for (const s of manager.generateLootFromTable(table) ?? []) {
          stacks++;
          outType = short(s.typeId);
          const es = s.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
          if (es.length === 0) bare++;
          for (const e of es) {
            per.set(e.type.id, (per.get(e.type.id) ?? 0) + 1);
            maxLevel.set(e.type.id, Math.max(maxLevel.get(e.type.id) ?? 0, e.level));
          }
        }
        if (i % 200 === 199) await test.idle(1);
      }
      seen.set(kind, new Set(per.keys()));
      const counts = [...per]
        .sort((a, b) => b[1] - a[1])
        .map(([e, n]) => `${e}=${n}(max${maxLevel.get(e)})`)
        .join(",");
      log(`Q5 ${item} ${kind} RESULT rolls=${ROLLS} stacks=${stacks} out=${outType} bare=${bare} counts=${counts || "-"}`);
    }
    const table = new Set([...(seen.get("l30") ?? []), ...(seen.get("l1_30") ?? [])]);
    const treasure = [...(seen.get("t30") ?? [])].filter((e) => !table.has(e)).sort();
    const never = admits.filter((e) => !table.has(e) && !(seen.get("t30")?.has(e) ?? false)).sort();
    log(
      `Q5 ${item} SUMMARY admits=[${admits.sort().join(",")}] table_generator=[${[...table].sort().join(",")}] ` +
        `treasure_only=[${treasure.join(",") || "none"}] admitted_never_rolled=[${never.join(",") || "none"}]`
    );
  }
  test.assert(loaded > 0, "no probe_ench loot table loaded — packs/gametest/loot_tables did not reach the server");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");
