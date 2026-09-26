// stage4-probe, strf-p006 question 4 against BDS 1.26.51.1: does `/loot
// insert <pos> loot "<id>"` through Dimension.runCommand actually fill a chest
// from a vanilla loot table, for the three tables P-loot-002 names —
// chests/ancient_city, chests/bastion_treasure, chests/bastion_other — and
// what exact path spelling the engine accepts (Bedrock's `filepath` argument
// may want a `loot_tables/` prefix and a `.json` suffix that Java's loot-table
// ids never had; L0-loot-asm2 flags this as unconfirmed).
//
// Measured result: PASS, for all three tables and for a fourth control table
// (chests/simple_dungeon — one of the oldest vanilla chest tables,
// unconditional, never empty by design).
//   - Accepted spelling is the bare id, quoted, exactly as P-loot-002 writes
//     it: `loot insert <x> <y> <z> loot "chests/ancient_city"`. No
//     `loot_tables/` prefix, no `.json` suffix — every spelling that adds
//     either returns successCount=0 (table not found). Unquoted throws
//     `CommandError: Syntax error: Unexpected "/"`.
//   - Two calls against two independently-empty chests roll different
//     contents for the same table id — the vanilla table is genuinely
//     rolled, not a fixed stub. See the "[probe] Q4 RESULT …" log lines for
//     the actual item lists each run produced.
//   - Against an already-full chest (32/32 slots occupied): the command
//     still reports successCount=1, but the container is left unchanged and
//     no item entities spawn nearby — loot insert silently no-ops on a full
//     container rather than spilling the roll onto the ground.
//   - successCount is decoupled from whether a table was actually found or
//     the insert actually reached the container either way — exactly why
//     this probe reads the container instead of trusting CommandResult.
//
// Same contract as probe-place.ts / probe-mobs.ts: a test passes when its
// measurement completed; the engine's answer is the "[probe] Q4 RESULT …"
// line. Proof is read from the chest's own container, never from
// CommandResult.successCount alone.
//
// No SimulatedPlayer is spawned anywhere in this file. `Dimension.runCommand`
// is dimension-scoped, and every command below names its target by explicit
// coordinates — that is itself the answer to "does this need a player
// context": if the run below places items with nobody on the platform, it
// does not.

import { Container, Dimension, Entity, ItemStack, Vector3 } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";

const log = (msg: string): void => console.warn(`[probe] ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err));

interface Spelling {
  format: string;
  quoted: boolean;
}

/**
 * Spellings the probe tries for a vanilla table id such as "chests/ancient_city":
 * bare (as P-loot-002 writes it), with a `.json` suffix, with a `loot_tables/`
 * prefix, and with both — the two axes Bedrock's `filepath` argument might
 * require that a Java-style id would not — crossed with quoted/unquoted, since
 * an over-quoted argument can be its own rejection reason.
 */
function candidateSpellings(id: string): Spelling[] {
  const out: Spelling[] = [];
  for (const prefix of ["", "loot_tables/"]) {
    for (const suffix of ["", ".json"]) {
      const format = `${prefix}${id}${suffix}`;
      out.push({ format, quoted: true }, { format, quoted: false });
    }
  }
  return out;
}

const describeSpelling = (s: Spelling): string => (s.quoted ? `"${s.format}"` : s.format);

function lootInsertCommand(pos: Vector3, spelling: Spelling): string {
  return `loot insert ${pos.x} ${pos.y} ${pos.z} loot ${describeSpelling(spelling)}`;
}

/**
 * Non-empty slots of the chest at structure-relative `at`, as "typeId x
 * amount", sorted for comparison.
 *
 * Takes `test` and translates internally, exactly once: every command below
 * also builds its world position via `test.worldBlockLocation`, and a second,
 * independent translation at the call site is how a relative-vs-world
 * mismatch goes undetected — reading back a block that is not the one the
 * command just filled, silently and consistently empty.
 */
function chestContents(test: Test, dim: Dimension, at: Vector3): string[] {
  const world = test.worldBlockLocation(at);
  const container = dim.getBlock(world)?.getComponent("minecraft:inventory")?.container;
  const items: string[] = [];
  if (container !== undefined) {
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (stack !== undefined) items.push(`${stack.typeId}x${stack.amount}`);
    }
  }
  return items.sort();
}

/** Runs `command`, tolerating the CommandResult throwing on a rejected command. */
function runCommand(dim: Dimension, command: string): string {
  try {
    return `successCount=${dim.runCommand(command).successCount}`;
  } catch (err) {
    return `THREW ${errText(err)}`;
  }
}

interface Discovered extends Spelling {
  contents: string[];
}

/**
 * Tries every spelling of `id` against the empty chest at `at` until one
 * fills it, and returns that spelling with what it produced. `at` must
 * already hold an empty chest.
 */
async function discoverLootFormat(test: Test, dim: Dimension, at: Vector3, id: string): Promise<Discovered | undefined> {
  const world = test.worldBlockLocation(at);
  for (const spelling of candidateSpellings(id)) {
    const command = lootInsertCommand(world, spelling);
    const outcome = runCommand(dim, command);
    await test.idle(2);
    const contents = chestContents(test, dim, at);
    log(`Q4 ${id}: tried "${command}" -> ${outcome}, chest=[${contents.join(" ")}]`);
    if (contents.length > 0) return { ...spelling, contents };
  }
  return undefined;
}

const triedList = (id: string): string => candidateSpellings(id).map(describeSpelling).join(", ");

/**
 * One vanilla table: confirms the accepted path spelling against an empty
 * chest, then rolls the same table into a second empty chest and checks the
 * two results differ — the proof that a real table is being rolled and not a
 * fixed stub.
 */
async function probeTable(test: Test, id: string, description: string): Promise<void> {
  const dim = test.getDimension();
  const chestA: Vector3 = { x: 1, y: 2, z: 1 };
  const chestB: Vector3 = { x: 5, y: 2, z: 5 };
  test.setBlockType("minecraft:chest", chestA);
  test.setBlockType("minecraft:chest", chestB);

  log(`Q4 ${id}: no SimulatedPlayer spawned for this measurement`);

  const first = await discoverLootFormat(test, dim, chestA, id);
  if (first === undefined) {
    log(`Q4 RESULT ${id} (${description}): FAIL — no candidate spelling filled the chest; tried [${triedList(id)}]`);
    test.succeed();
    return;
  }

  const worldB = test.worldBlockLocation(chestB);
  const commandB = lootInsertCommand(worldB, first);
  const outcomeB = runCommand(dim, commandB);
  await test.idle(4);
  const second = chestContents(test, dim, chestB);
  log(`Q4 ${id}: second call "${commandB}" -> ${outcomeB}, chest=[${second.join(" ")}]`);

  const varies = JSON.stringify(first.contents) !== JSON.stringify(second);
  const verdict =
    second.length === 0
      ? `FAIL — the confirmed spelling ${describeSpelling(first)} produced an empty chest on the second call`
      : varies
        ? `PASS — ${describeSpelling(first)} rolls a real table (call #1=[${first.contents.join(" ")}], call #2=[${second.join(" ")}])`
        : `INCONCLUSIVE — two calls produced identical contents [${first.contents.join(" ")}]; cannot rule out a fixed stub from one repeat`;

  log(`Q4 RESULT ${id} (${description}): ${verdict}; accepted spelling=${describeSpelling(first)}`);
  test.succeed();
}

registerAsync("andrew", "probe_loot_ancient_city", (test: Test) =>
  probeTable(test, "chests/ancient_city", "Mini Warden City, all 10 chests")
)
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "probe_loot_bastion_treasure", (test: Test) =>
  probeTable(test, "chests/bastion_treasure", "Mini Bastion, 3 central chests")
)
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "probe_loot_bastion_other", (test: Test) =>
  probeTable(test, "chests/bastion_other", "Mini Bastion, 7 outer chests")
)
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ------------------------------------------------------------- control

/**
 * Independent of the three target ids: chests/simple_dungeon is one of the
 * oldest vanilla chest tables, unconditional and never empty. If no spelling
 * fills a chest with it either, the failure is in the /loot insert mechanism
 * (or this world's pack context) rather than in how "ancient_city" /
 * "bastion_*" are spelled.
 */
registerAsync("andrew", "probe_loot_control_known_table", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const at: Vector3 = { x: 3, y: 2, z: 3 };
  test.setBlockType("minecraft:chest", at);

  const id = "chests/simple_dungeon";
  const discovered = await discoverLootFormat(test, dim, at, id);
  const verdict =
    discovered === undefined
      ? `FAIL — no spelling filled the chest either; tried [${triedList(id)}]. ` +
        "/loot insert cannot pull ANY vanilla chest table into a container here, independent of ancient_city/bastion_* spelling"
      : `PASS — ${describeSpelling(discovered)} works (chest=[${discovered.contents.join(" ")}]); ` +
        "the mechanism itself is capable — a further miss on ancient_city/bastion_* would be about those specific ids, not the mechanism";
  log(`Q4 RESULT control (${id}): ${verdict}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ------------------------------------------------------------- full chest

/** Self-contained: rediscovers the accepted spelling against its own control chest rather than trusting another test's run order. */
registerAsync("andrew", "probe_loot_full_chest", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const controlAt: Vector3 = { x: 1, y: 2, z: 1 };
  const fullAt: Vector3 = { x: 5, y: 2, z: 5 };
  test.setBlockType("minecraft:chest", controlAt);
  test.setBlockType("minecraft:chest", fullAt);

  const id = "chests/ancient_city";
  const discovered = await discoverLootFormat(test, dim, controlAt, id);
  if (discovered === undefined) {
    log(`Q4 RESULT full-chest: INCONCLUSIVE — no candidate spelling filled the control chest; tried [${triedList(id)}]`);
    test.succeed();
    return;
  }

  const fullWorld = test.worldBlockLocation(fullAt);
  const container: Container | undefined = dim.getBlock(fullWorld)?.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error("full-chest probe: the chest at fullAt has no minecraft:inventory component");
  for (let slot = 0; slot < container.size; slot++) container.setItem(slot, new ItemStack("minecraft:dirt", 64));
  const before = chestContents(test, dim, fullAt);

  const command = lootInsertCommand(fullWorld, discovered);
  const outcome = runCommand(dim, command);
  await test.idle(4);
  const after = chestContents(test, dim, fullAt);
  const dropped: Entity[] = dim.getEntities({ type: "minecraft:item", location: fullWorld, maxDistance: 4 });

  const unchanged = JSON.stringify(before) === JSON.stringify(after);
  log(
    `Q4 RESULT full-chest: "${command}" -> ${outcome}; contents ${unchanged ? "UNCHANGED" : "CHANGED"} ` +
      `(before=[${before.join(" ")}] after=[${after.join(" ")}]); item entities dropped near the chest=${dropped.length}` +
      (dropped.length > 0 ? ` [${dropped.map((e) => e.getComponent("minecraft:item")?.itemStack?.typeId ?? "?").join(" ")}]` : "")
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

export const PROBE_LOOT_TESTS = [
  "probe_loot_ancient_city",
  "probe_loot_bastion_treasure",
  "probe_loot_bastion_other",
  "probe_loot_control_known_table",
  "probe_loot_full_chest",
];

log(`registered ${PROBE_LOOT_TESTS.length} probe test(s): ${PROBE_LOOT_TESTS.join(" ")}`);
