// GameTest scenarios for the Miner's Pickaxe and the Web Sword craft gate,
// driven by SimulatedPlayers.
//
// Dev-only: this module is the entry of packs/gametest, a behavior pack that
// only `npm run bds:gametest` installs. It is never bundled by `npm run build`
// and never enters dist/andrew.mcaddon.
//
// It is the ONE place in the repository that imports a beta module.
// @minecraft/server-gametest is beta-only — there is no stable channel for it —
// so it needs the "Beta APIs" experiment on the world, which is why this pack
// lives outside the product and runs against its own `gametest` world.
// The product packs stay on stable @minecraft/server 2.10.0.
// [src: concept-constraint C-2]
//
// Output contract, consumed by scripts/bds-gametest.mjs: the GameTest runner
// itself prints "onTestPassed: <name>" / "onTestFailed: <name> - <why>" to the
// server console. The [gametest] console.warn lines below are for a human
// reading dist/bds-gametest.log.

import {
  Container,
  Dimension,
  Entity,
  EquipmentSlot,
  GameMode,
  ItemStack,
  Player,
  Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, register } from "@minecraft/server-gametest";
import * as cooldown from "../legendary/cooldown";
import { registerCraftGate } from "../legendary/craftgate";
import { hideFromTargeting } from "../legendary/hidden";
import { registerLegendaryHud } from "../legendary/hud";
import { registerRecovery } from "../legendary/recovery";
import { SCYTHE_OF_CALAMITY, WEB_SWORD } from "../legendary/registry";
import { registerRetention } from "../legendary/retention";
import * as state from "../legendary/state";
import { registerScytheTargeting } from "../scythe/targeting";
import {
  LAUNCH_STRENGTH,
  PROJECTILE_PARTICLE,
  activeProjectileCount,
  activeVolleyCount,
  launchVolley,
  volleyTickErrors,
} from "../scythe/volley";
import { PROJECTILE_SPEED, TRUE_DAMAGE } from "../scythe/volley-rules";
import { WEB_BLOCK_ID } from "../websword/cube";
import { registerTrap } from "../websword/trap";
import "./probe-place";
import "./probe-chunk";
import "./probe-mobs";
import "./probe-loot";
import "./probe-give";
import "./legendary-craftgate";
import "./probe-retention";
import "./legendary-fireproof";
import "./legendary-offhand";
import "./strf-registry";
import "./structures";
import "./structures-site";
import "./structures-place";
import "./structures-loot";
import "./structures-commands";
import "./windmill";
import "./windmill-body";
import "./windmill-spawn";
import "./airship";
import "./airship-body";
import "./warden";
import "./warden-body";
import "./bastion";
import "./bastion-body";
import "./legendary-recovery";
import "./probe-input";
import "./websword-trap";
import { SPAWN_EVENT } from "../structures/spawn-search";

const WEB_SWORD_ID = WEB_SWORD.itemId;
const isWebSword = (stack: ItemStack | undefined): stack is ItemStack => state.isItemOf(WEB_SWORD, stack);
const getMark = (stack: ItemStack) => state.getMark(WEB_SWORD, stack);
const markSword = (stack: ItemStack, mark: ReturnType<typeof state.makeMark>) => state.markItem(WEB_SWORD, stack, mark);
const makeMark = state.makeMark;
const findMarkedSword = (container: Container) => state.findMarked(WEB_SWORD, container);
const hasPending = (player: Player) => state.readPending(WEB_SWORD, player).length > 0;
const isCrafted = () => state.isCrafted(WEB_SWORD);
const resetCrafted = () => state.resetCrafted(WEB_SWORD);
const isReady = (player: Player) => cooldown.isReady(player, WEB_SWORD.abilityKey);
const remainingTicks = (player: Player) => cooldown.remainingTicks(player, WEB_SWORD.abilityKey);

console.warn("[gametest] script loaded");

// The release pack's spawn-Windmill search would build at this world's spawn,
// which is where every GameTest runs. Its start delay leaves time for this
// skip, which it honours only before its first block write. The spawn search
// itself is tested in windmill-spawn.ts around a stand-in spawn.
world.afterEvents.worldLoad.subscribe(() => {
  world.getDimension("overworld").runCommand(`scriptevent ${SPAWN_EVENT} skip`);
});

// The release pack arms this same gate, and in this world it can do nothing:
// the engine cannot hand a pack without @minecraft/server-gametest a
// SimulatedPlayer object, so `playerInventoryItemChange.player` arrives
// undefined there. Measured on BDS 1.26.51.1 — `world.getAllPlayers()` in the
// release pack returned the right count (1, then 2, then 1, matching what the
// scenarios below spawn) with zero entries readable, so there is no route for
// it at all. [src: concept-constraint C-2]
//
// This pack owns the binding, so arming the *production* gate here is what lets
// the scenarios drive the real chain end to end — the same subscription, queue,
// once-per-tick flush and settle logic the release pack runs for a human.
registerCraftGate();

// Same binding problem, same answer: the release pack's entityDie handler
// cannot read a SimulatedPlayer either. Arming retention here is what lets the
// death scenarios drive the production module end to end — the same
// subscriptions, the same pending mark, the same restore a human gets.
registerRetention();

// Same binding problem: the release pack sees the item entity vanish but cannot
// find a SimulatedPlayer owner to hand it back to.
registerRecovery();

// Engine witness for AC#4 of LG-KEEP-02: which event reports a dropped item.
world.afterEvents.entitySpawn.subscribe((event) => {
  // An item removed in the same tick (test cleanup) arrives invalid; getComponent throws on it.
  if (event.entity.isValid && event.entity.typeId === "minecraft:item") {
    const stack = event.entity.getComponent("minecraft:item")?.itemStack;
    console.warn(`[gametest] probe entitySpawn: minecraft:item ${stack?.typeId ?? "?"} cause=${event.cause}`);
  }
});
world.afterEvents.playerInventoryItemChange.subscribe((event) => {
  if (isWebSword(event.itemStack) || isWebSword(event.beforeItemStack)) {
    console.warn(
      `[gametest] probe playerInventoryItemChange: ${WEB_SWORD_ID} slot=${event.slot} ` +
        `before=${event.beforeItemStack?.typeId ?? "empty"} after=${event.itemStack?.typeId ?? "empty"} ` +
        `player=${event.player === undefined ? "undefined" : event.player.name}`
    );
  }
});

// Same binding problem again, so the trap is armed here too: the release pack's
// itemUse handler cannot read a SimulatedPlayer, and the scenarios at the
// bottom of this file drive the production module's real chain — the two
// subscriptions, the same-tick dedup, the two rays, the cube and the cooldown.
registerTrap();

// Same binding problem: armed here so a SimulatedPlayer holding a legendary
// drives the real Action Bar path, and a rejected message reaches the log.
registerLegendaryHud();

// Which use-event a press actually produces on BDS 1.26.51.1 is an engine fact,
// not a documented one, and src/websword/trap.ts subscribes to both. This
// witness answers the question in the server log independently of whether a
// cube was placed, so a run says what fired even when a scenario fails.
// [src: task WS-TRAP-01 AC#4]
world.afterEvents.itemUse.subscribe((event) => {
  const source: Player | undefined = event.source;
  console.warn(
    `[gametest] probe itemUse: item=${event.itemStack.typeId} source=${source === undefined ? "undefined" : source.name}`
  );
});
world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const player: Player | undefined = event.player;
  console.warn(
    `[gametest] probe playerInteractWithBlock: item=${event.itemStack?.typeId ?? "none"} ` +
      `block=${event.block.typeId} face=${event.blockFace} first=${event.isFirstEvent} ` +
      `player=${player === undefined ? "undefined" : player.name}`
  );
});

const PICKAXE_ID = "andrew:miners_pickaxe";

/** The yardstick for mining speed: the pickaxe must match it block for block. */
const VANILLA_PICKAXE_ID = "minecraft:diamond_pickaxe";

/** Must match the structure written by scripts/bds-gametest.mjs. */
const STRUCTURE = "andrew:platform";

// Relative to the structure corner. The engine places the structure's bottom
// layer — the stone floor the generator writes — at y=1, not y=0, so y=1 is the
// floor itself and y=2 is the first air block above it. Measured on BDS
// 1.26.51.1: stone is present at 3,1,3 and 2,1,3, absent at 3,2,3.
const TARGET: Vector3 = { x: 3, y: 1, z: 3 };
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

// The platform is 7x7 and the craft-race scenario needs two players that are
// not standing on top of each other.
const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_B: Vector3 = { x: 4, y: 2, z: 5 };

/** Wide enough to catch a drop that bounced off the block it came from. */
const SEARCH_RADIUS = 4;

/**
 * Make `loc` hold `blockId`, tolerating the case where it already does.
 *
 * GameTest's setBlockType throws `gameTest.assert.couldNotSetBlock` when the
 * call would not change anything — the engine reports "no change" and "could
 * not" through the same failure. So placing stone on the stone floor is not a
 * no-op but a test failure ("Could not setBlock 'stone'"), while placing
 * iron_ore on that same block succeeds. Asking first is what separates the two.
 */
function placeBlock(test: Test, blockId: string, loc: Vector3): void {
  if (test.getBlock(loc).typeId === blockId) return;
  test.setBlockType(blockId, loc);
}

/**
 * One mining scenario: the simulated player breaks `blockId` with the pickaxe
 * and the test passes when `expectedDropId` is on the ground and
 * `forbiddenDropId` is not.
 *
 * `forbiddenDropId` is what vanilla would have dropped instead. Asserting its
 * absence is the half that actually proves the override: a test that only
 * looked for the ingot would also pass if the engine dropped both.
 */
function miningScenario(blockId: string, expectedDropId: string, forbiddenDropId: string) {
  return (test: Test): void => {
    placeBlock(test, blockId, TARGET);

    // Survival, not creative: creative suppresses vanilla block drops, so the
    // stone -> cobblestone control would prove nothing there.
    // [src: concept-constraint C-9]
    const player = test.spawnSimulatedPlayer(STAND, "andrew_tester", GameMode.Survival);

    // Giving and selecting the item is not observable on the same tick the
    // player is spawned, so the break is deferred rather than chained.
    test.runAfterDelay(4, () => {
      player.giveItem(new ItemStack(PICKAXE_ID, 1), true);
      test.runAfterDelay(4, () => {
        player.lookAtBlock(TARGET);
        player.breakBlock(TARGET);
      });
    });

    // Retried every tick until maxTicks; the last failure becomes the reported
    // reason, so a timeout says which half of the claim was missing.
    test.succeedWhen(() => {
      test.assertItemEntityPresent(expectedDropId, TARGET, SEARCH_RADIUS, true);
      test.assertItemEntityPresent(forbiddenDropId, TARGET, SEARCH_RADIUS, false);

      // Infinite durability is implemented by omitting the component, so the
      // proof that mining did not wear the tool down is that the held item is
      // still the pickaxe and still has no durability to spend.
      const held = player.getComponent("minecraft:inventory")?.container?.getItem(
        player.selectedSlotIndex
      );
      test.assert(held !== undefined, "the pickaxe left the player's hand while mining");
      test.assert(
        held?.typeId === PICKAXE_ID,
        `the selected slot holds ${held?.typeId} instead of ${PICKAXE_ID}`
      );
      test.assert(
        held?.getComponent("minecraft:durability") === undefined,
        "the pickaxe gained a durability component — it is no longer unbreakable by omission"
      );
    });
  };
}

// Iron ore is the auto-smelt claim: the override cancels the vanilla break and
// spawns the smelted product, so raw_iron must never hit the ground.
register(
  "andrew",
  "pickaxe_autosmelt",
  miningScenario("minecraft:iron_ore", "minecraft:iron_ingot", "minecraft:raw_iron")
)
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// Stone is the control: it is NOT on the allow-list, so the same pickaxe must
// leave vanilla behaviour alone and drop cobblestone.
register(
  "andrew",
  "pickaxe_keeps_vanilla_drops",
  miningScenario("minecraft:stone", "minecraft:cobblestone", "minecraft:iron_ingot")
)
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------- Web Sword: one per world
//
// A SimulatedPlayer cannot operate a crafting grid, so the craft is imitated by
// putting the recipe's output — the craft token — into the player's inventory.
// The gate has no "before craft" event to hook and reacts to a token appearing
// in an inventory, whatever put it there (AD-lgnd-08). The recipe itself is run
// by a Crafter in legendary-craftgate.ts.
// [src: decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut]
//
// The gate itself lives in the *release* behavior pack, which this world loads
// alongside the gametest pack; only src/legendary/state.ts is bundled in here,
// to read the world flag and the instance marks the gate writes.

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

/** Total amount per item id across the whole container. */
function countByType(container: Container): Map<string, number> {
  const counts = new Map<string, number>();
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined) continue;
    counts.set(stack.typeId, (counts.get(stack.typeId) ?? 0) + stack.amount);
  }
  return counts;
}

function countOf(container: Container, itemId: string): number {
  return countByType(container).get(itemId) ?? 0;
}

/** Hand the player a craft token — the stand-in for a completed craft. */
function fakeCraft(player: Player): void {
  inventoryOf(player).addItem(new ItemStack(WEB_SWORD.craftTokenId, 1));
}

// The world flag is durable by design, so it survives from one test to the
// next — and every scenario below starts from "nobody has crafted yet".
// Clearing it up front is what makes the three independent of run order.

register("andrew", "websword_first_claim", (test: Test): void => {
  resetCrafted();

  const player = test.spawnSimulatedPlayer(STAND_A, "andrew_crafter", GameMode.Survival);

  // The player is not observable on the tick it is spawned.
  test.runAfterDelay(4, () => {
    fakeCraft(player);
  });

  test.succeedWhen(() => {
    const found = findMarkedSword(inventoryOf(player));
    test.assert(found !== undefined, "no marked Web Sword in the crafter's inventory");
    test.assert(
      found?.mark.origin === "craft",
      `mark origin is ${String(found?.mark.origin)}, expected "craft"`
    );
    test.assert(
      found?.mark.owner === player.id,
      `mark owner is ${String(found?.mark.owner)}, expected ${player.id}`
    );
    // The half that proves the *world* changed, not just the item: without it
    // a gate that marked swords and never spent the budget would pass.
    test.assert(isCrafted(), "the world craft flag was not claimed");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "websword_second_refund", (test: Test): void => {
  resetCrafted();

  const first = test.spawnSimulatedPlayer(STAND_A, "andrew_first", GameMode.Survival);
  const second = test.spawnSimulatedPlayer(STAND_B, "andrew_second", GameMode.Survival);

  test.runAfterDelay(4, () => {
    fakeCraft(first);
    // Far enough after the first claim that the flag is already set — the
    // same-tick race is a separate concern and is settled inside one flush.
    test.runAfterDelay(10, () => {
      fakeCraft(second);
    });
  });

  test.succeedWhen(() => {
    test.assert(
      findMarkedSword(inventoryOf(first)) !== undefined,
      "the first player's craft was never claimed, so the second one proves nothing"
    );

    const inventory = inventoryOf(second);
    const swords = countOf(inventory, WEB_SWORD_ID);
    test.assert(swords === 0, `the second player kept ${swords} Web Sword(s) — the craft was not blocked`);

    const cobweb = countOf(inventory, "minecraft:web");
    test.assert(cobweb === 4, `the second player was returned ${cobweb} cobweb, expected 4`);

    const diamondSword = countOf(inventory, "minecraft:diamond_sword");
    test.assert(
      diamondSword === 1,
      `the second player was returned ${diamondSword} diamond sword(s), expected 1`
    );
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "websword_creative_ignored", (test: Test): void => {
  resetCrafted();

  const player = test.spawnSimulatedPlayer(STAND_A, "andrew_builder", GameMode.Creative);

  test.runAfterDelay(4, () => {
    fakeCraft(player);
  });

  // A negative claim cannot be proven by succeedWhen — "nothing happened" is
  // true on the first tick whether the gate is exempting Creative or simply has
  // not run yet. So the assertions wait until long after the gate would have
  // acted (the claim path is one tick) and then check once.
  // [src: decision-q-015-gate-game-modes-survival-i-adventure]
  test.runAfterDelay(40, () => {
    const inventory = inventoryOf(player);
    test.assert(!isCrafted(), "a Creative copy spent the world's one survival craft");
    test.assert(
      findMarkedSword(inventory) === undefined,
      "the gate stamped an instance mark on a Creative copy"
    );
    const swords = countOf(inventory, WEB_SWORD_ID);
    test.assert(swords === 1, `the Creative player holds ${swords} Web Sword(s), expected the 1 they were given`);
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ Web Sword: death retention
//
// The sword handed out here is marked with origin "admin", the same stamp
// /andrew:websword give writes. That is deliberate: it is retained on death
// exactly like a crafted one, but it does not spend the world's single craft,
// so these scenarios cannot interfere with the gate ones above.
// [src: decision-q-006-web-sword-provenance-yes-metka-ekzemplyara]

/** Must agree with DROP_SEARCH_RADIUS in src/legendary/retention.ts. */
const RETENTION_RADIUS = 8;

/** How many Web Swords in `container` carry instance id `id`. */
function countInstance(container: Container, id: string): number {
  let found = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (isWebSword(stack) && getMark(stack)?.id === id) {
      found++;
    }
  }
  return found;
}

/** Web Sword item entities lying within the retention radius of `location`. */
function swordsOnGround(dimension: Dimension, location: Vector3): number {
  let found = 0;
  for (const entity of dimension.getEntities({
    type: "minecraft:item",
    location,
    maxDistance: RETENTION_RADIUS,
  })) {
    if (isWebSword(entity.getComponent("minecraft:item")?.itemStack)) {
      found++;
    }
  }
  return found;
}

register("andrew", "websword_death_returns", (test: Test): void => {
  const player = test.spawnSimulatedPlayer(STAND_A, "andrew_keeper", GameMode.Survival);

  // succeedWhen re-runs its body every tick from the start of the test, and
  // the *pre-death* state satisfies every assertion below — one marked sword
  // in hand, nothing on the ground, no pending mark. Without this gate the
  // scenario would go green on tick one having proven nothing at all.
  let stage: "setup" | "killed" | "respawned" = "setup";
  let instanceId = "";
  let deathLocation: Vector3 = STAND_A;
  let deathDimension: Dimension | undefined;

  test.runAfterDelay(4, () => {
    const mark = makeMark("admin", player);
    instanceId = mark.id;
    inventoryOf(player).addItem(markSword(new ItemStack(WEB_SWORD_ID, 1), mark));

    test.runAfterDelay(4, () => {
      deathLocation = player.location;
      deathDimension = player.dimension;
      stage = "killed";
      player.kill();

      // Long enough for the engine to finish the death (and for retention's
      // next-tick sweep to run) before the respawn is asked for.
      test.runAfterDelay(10, () => {
        player.respawn();
        stage = "respawned";
      });
    });
  });

  test.succeedWhen(() => {
    test.assert(stage === "respawned", `the player has not died and respawned yet (stage: ${stage})`);

    const held = countInstance(inventoryOf(player), instanceId);
    test.assert(
      held === 1,
      `the player carries ${held} Web Sword(s) with ws_id ${instanceId} after respawn, expected exactly 1`
    );

    const dropped = swordsOnGround(deathDimension ?? player.dimension, deathLocation);
    test.assert(dropped === 0, `${dropped} Web Sword(s) are lying at the death spot`);

    // The token that makes the whole thing idempotent: left set, the next
    // respawn — or the next reconnect — would hand out a second sword.
    test.assert(
      !hasPending(player),
      "the pending return survived the restore, so a further respawn would issue a duplicate"
    );
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// The control. An unmarked sword — a Creative copy — is an ordinary item, and
// retention must not latch onto it: no pending mark, and nothing handed back.
// [src: decision-q-006-web-sword-provenance-yes-metka-ekzemplyara]
//
// The player starts in Creative and dies in Survival. The Survival half is
// load-bearing: a Creative player cannot be killed. Measured on BDS 1.26.51.1:
// the first version of this scenario stayed Creative throughout, went green,
// and proved nothing — kill() raised no entityDie at all, so retention was
// never asked the question. The death witness below is what makes the
// negative claim mean something.
register("andrew", "websword_unmarked_drops", (test: Test): void => {
  const player = test.spawnSimulatedPlayer(STAND_B, "andrew_bystander", GameMode.Creative);

  let died = false;
  const witness = world.afterEvents.entityDie.subscribe((event) => {
    const dead: Entity | undefined = event.deadEntity;
    if (player.isValid && dead?.id === player.id) {
      died = true;
    }
  });

  test.runAfterDelay(4, () => {
    inventoryOf(player).addItem(new ItemStack(WEB_SWORD_ID, 1));

    // The gate settles on the next tick; ten is comfortably past that, so the
    // switch below cannot be seen by the flush that decides this sword's fate.
    test.runAfterDelay(10, () => {
      player.setGameMode(GameMode.Survival);

      test.runAfterDelay(4, () => {
        player.kill();
        test.runAfterDelay(10, () => {
          player.respawn();

          // A negative claim, so it is checked once, late — long after
          // retention would have acted (retain is immediate, restore is one
          // tick later) rather than on the first tick, when "nothing happened"
          // is trivially true because nothing has happened yet.
          test.runAfterDelay(20, () => {
            world.afterEvents.entityDie.unsubscribe(witness);

            test.assert(
              died,
              "the control player never died, so retention was never offered an unmarked sword to ignore"
            );
            test.assert(
              !hasPending(player),
              "retention latched an unmarked Web Sword and owes the player a marked one"
            );
            test.assert(
              findMarkedSword(inventoryOf(player)) === undefined,
              "retention handed out a marked Web Sword in place of an unmarked copy"
            );
            test.succeed();
          });
        });
      });
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ----------------------------------------------- Web Sword: the trap ability
//
// The sword handed out below is marked "admin", as in the retention scenarios.
//
// Coordinates: everything below is structure-relative, including the arguments
// to lookAtBlock/lookAtLocation.
//
// SimulatedPlayer inherits those methods from Player, so a world location looks
// like the obvious reading — and it is wrong. Measured on BDS 1.26.51.1: with
// the structure at origin (0, -60, 3), `lookAtBlock(test.worldBlockLocation(
// {3,1,3}))` aimed the player at world {3,-119,9}, i.e. the engine subtracted
// the origin a second time. Every scenario then reported the same centre —
// `[andrew] web sword trap via itemUse: centre 3,-58,8` — the cell under the
// player's own feet, because aiming that steeply down made the floor the first
// block the ray hit. Passing the relative location directly is what aims them,
// which is also what the pickaxe scenario above has always done.

/** The structure written by scripts/bds-gametest.mjs: 7 x 5 x 7, floor at y=1. */
const PLATFORM = { sx: 7, sy: 5, sz: 7 } as const;

// The scenarios below aim at a purpose-placed block at eye level rather than at
// the stone floor, because a floor aim is not deterministic. Aiming from STAND
// {3,2,5} at the floor cell {3,1,3} sends the ray across the top of {3,1,4} and
// into {3,1,3} within ~0.01 of the boundary between them — which of the two the
// engine calls the hit is a coin toss, and on BDS 1.26.51.1 it was the nearer
// one, putting the cube one cell off what the scenario asserted.
//
// A block at eye level removes the guess. The ray from the head (y ~3.6) to the
// centre of AIM_BLOCK (y 3.5) stays inside the y=3 layer for its whole length
// and keeps x at 3.5, dead centre of its column, so the only solid block it can
// meet is AIM_BLOCK itself and it can only enter through the face pointing at
// the player. That makes the cube's centre a fact of the geometry:
// AIM_BLOCK + South.

/** Aimed at by the block-ray scenarios: eye level, three blocks north of STAND. */
const AIM_BLOCK: Vector3 = { x: 3, y: 3, z: 2 };

/** The cube the engine must build for an aim at AIM_BLOCK — one step back along +Z. */
const AIM_CENTER: Vector3 = { x: 3, y: 3, z: 3 };

/** A second aim, due west instead of north, for the cooldown scenario's retry. */
const SECOND_AIM: Vector3 = { x: 0, y: 3, z: 5 };

/** The cube for an aim at SECOND_AIM — one step back along +X. */
const SECOND_CENTER: Vector3 = { x: 1, y: 3, z: 5 };

/** Cells of the 3x3x3 cube the scenarios expect around `center`, relative. */
function cubeCells(center: Vector3): Vector3[] {
  const cells: Vector3[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        cells.push({ x: center.x + dx, y: center.y + dy, z: center.z + dz });
      }
    }
  }
  return cells;
}

/**
 * Cobweb blocks anywhere on the platform.
 *
 * A whole-platform count rather than a per-cell assertion: it is what makes
 * "the second activation added nothing" a claim about the world instead of a
 * claim about one cell that may never have been in the second cube.
 */
function countWebs(test: Test): number {
  let found = 0;
  for (let x = 0; x < PLATFORM.sx; x++) {
    for (let y = 0; y <= PLATFORM.sy; y++) {
      for (let z = 0; z < PLATFORM.sz; z++) {
        try {
          if (test.getBlock({ x, y, z }).typeId === WEB_BLOCK_ID) found++;
        } catch {
          // y=0 and y=sy sit just outside the structure; whether they are
          // readable depends on the console's origin, and a cell that is not
          // readable simply does not count.
        }
      }
    }
  }
  return found;
}

/**
 * Give `player` a marked Web Sword in the slot they are holding, and return
 * that slot so the activation can go through it.
 */
function armSword(player: SimulatedPlayer): number {
  const slot = player.selectedSlotIndex;
  inventoryOf(player).setItem(slot, markSword(new ItemStack(WEB_SWORD_ID, 1), makeMark("admin", player)));
  return slot;
}

register("andrew", "websword_cube_placed", (test: Test): void => {
  placeBlock(test, "minecraft:stone", AIM_BLOCK);
  const player = test.spawnSimulatedPlayer(STAND, "andrew_trapper", GameMode.Survival);

  // Everything in the cube is either air or the stone block aimed at, so
  // nothing in it is protected — the expected result is the full 27.
  // [src: webswordspecv1ruen §13 — 'Use по валидной цели создаёт
  // приблизительно полный 3×3×3 куб']
  const center = AIM_CENTER;
  let used = false;

  test.runAfterDelay(4, () => {
    const slot = armSword(player);
    test.runAfterDelay(4, () => {
      player.lookAtBlock(AIM_BLOCK);
      test.runAfterDelay(4, () => {
        player.useItemInSlot(slot);
        used = true;
      });
    });
  });

  test.succeedWhen(() => {
    test.assert(used, "the sword has not been used yet");

    for (const cell of cubeCells(center)) {
      const actual = test.getBlock(cell).typeId;
      test.assert(
        actual === WEB_BLOCK_ID,
        `cell ${cell.x},${cell.y},${cell.z} holds ${actual} instead of ${WEB_BLOCK_ID}`
      );
    }

    // The half that proves the ability was *spent*: a cube placed without
    // arming the cooldown would be a free trap every tick.
    test.assert(!isReady(player), "the cooldown is still ready right after a successful activation");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "websword_protected_skipped", (test: Test): void => {
  const center = AIM_CENTER;
  placeBlock(test, "minecraft:stone", AIM_BLOCK);

  // Both sit inside the cube and off the line of sight, which runs straight
  // down the x=3 column: they are in the volume without being what the ray
  // hits.
  const chestAt: Vector3 = { x: center.x - 1, y: center.y, z: center.z - 1 };
  const bedrockAt: Vector3 = { x: center.x + 1, y: center.y, z: center.z + 1 };
  placeBlock(test, "minecraft:chest", chestAt);
  placeBlock(test, "minecraft:bedrock", bedrockAt);

  const player = test.spawnSimulatedPlayer(STAND, "andrew_respecter", GameMode.Survival);
  let used = false;

  test.runAfterDelay(4, () => {
    const slot = armSword(player);
    test.runAfterDelay(4, () => {
      player.lookAtBlock(AIM_BLOCK);
      test.runAfterDelay(4, () => {
        player.useItemInSlot(slot);
        used = true;
      });
    });
  });

  test.succeedWhen(() => {
    test.assert(used, "the sword has not been used yet");

    // The neighbours first: without them "the chest survived" would also be
    // true of an ability that did nothing at all.
    // [src: webswordspecv1ruen §6 — 'остальные допустимые клетки всё равно
    // заполнить паутиной']
    for (const cell of cubeCells(center)) {
      const isProtectedCell =
        (cell.x === chestAt.x && cell.y === chestAt.y && cell.z === chestAt.z) ||
        (cell.x === bedrockAt.x && cell.y === bedrockAt.y && cell.z === bedrockAt.z);
      if (isProtectedCell) continue;

      const actual = test.getBlock(cell).typeId;
      test.assert(
        actual === WEB_BLOCK_ID,
        `unprotected cell ${cell.x},${cell.y},${cell.z} holds ${actual} instead of ${WEB_BLOCK_ID}`
      );
    }

    const chest = test.getBlock(chestAt).typeId;
    test.assert(chest === "minecraft:chest", `the chest was replaced by ${chest}`);

    const bedrock = test.getBlock(bedrockAt).typeId;
    test.assert(bedrock === "minecraft:bedrock", `the bedrock was replaced by ${bedrock}`);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// A negative claim, so it is checked once and late rather than by succeedWhen:
// "no cobweb anywhere" is trivially true on the first tick, before the player
// has even been given a sword.
// [src: webswordspecv1ruen §13 — 'Use вне reach ничего не создаёт и не
// запускает cooldown']
register("andrew", "websword_out_of_reach_noop", (test: Test): void => {
  const player = test.spawnSimulatedPlayer(STAND, "andrew_skywatcher", GameMode.Survival);

  test.runAfterDelay(4, () => {
    const slot = armSword(player);
    test.runAfterDelay(4, () => {
      // Straight up into open sky: no block within the 5-block block reach and
      // no entity within the 3-block entity reach, so there is no target.
      player.lookAtLocation({ x: STAND.x + 0.5, y: STAND.y + 30, z: STAND.z + 0.5 });

      test.runAfterDelay(8, () => {
        player.useItemInSlot(slot);

        test.runAfterDelay(30, () => {
          const webs = countWebs(test);
          test.assert(webs === 0, `${webs} cobweb block(s) appeared for an activation with no target`);
          test.assert(isReady(player), "a failed activation spent the cooldown");
          test.succeed();
        });
      });
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "websword_cooldown_blocks_reuse", (test: Test): void => {
  placeBlock(test, "minecraft:stone", AIM_BLOCK);
  placeBlock(test, "minecraft:stone", SECOND_AIM);

  const player = test.spawnSimulatedPlayer(STAND, "andrew_repeater", GameMode.Survival);
  let afterFirst = -1;

  // Both clocks at every step. The cooldown is measured in real milliseconds
  // (see src/legendary/cooldown.ts for why neither of these two can be it), and
  // logging them is what turned a bare "had not expired" into the reason: the
  // world's day clock stood still while the server ticked on.
  const clock = (label: string): void => {
    console.warn(
      `[gametest] cooldown ${label}: dateNow=${Date.now()} absoluteTime=${world.getAbsoluteTime()} ` +
        `currentTick=${system.currentTick} remaining=${remainingTicks(player)}`
    );
  };

  /**
   * The activation the cooldown was blocking, replayed once it has expired.
   *
   * Without it the scenario would only show that the retry placed nothing,
   * which is also what a mis-aimed retry looks like. Running the same aim
   * again and watching cobweb appear is what makes the cooldown the reason.
   */
  const replayBlockedActivation = (slot: number): void => {
    player.lookAtBlock(SECOND_AIM);
    test.runAfterDelay(4, () => {
      player.useItemInSlot(slot);
      test.runAfterDelay(10, () => {
        for (const cell of cubeCells(SECOND_CENTER)) {
          const actual = test.getBlock(cell).typeId;
          test.assert(
            actual === WEB_BLOCK_ID,
            `after the cooldown expired, cell ${cell.x},${cell.y},${cell.z} holds ${actual} ` +
              `instead of ${WEB_BLOCK_ID} — the blocked retry was not blocked by the cooldown`
          );
        }
        test.succeed();
      });
    });
  };

  /**
   * Waits for the cooldown, rather than asserting once at a fixed delay: the
   * scenario's own waits are ~50 ticks and the cooldown is 30 seconds of real
   * time, so how many ticks that is depends on the server keeping 20 TPS.
   */
  const waitForReady = (slot: number, attemptsLeft: number): void => {
    if (isReady(player)) {
      clock("expired");
      replayBlockedActivation(slot);
      return;
    }
    test.assert(attemptsLeft > 0, `cooldown still running: ${remainingTicks(player)} tick(s) left`);
    test.runAfterDelay(20, () => waitForReady(slot, attemptsLeft - 1));
  };

  test.runAfterDelay(4, () => {
    const slot = armSword(player);

    test.runAfterDelay(4, () => {
      player.lookAtBlock(AIM_BLOCK);

      test.runAfterDelay(4, () => {
        player.useItemInSlot(slot);

        // Ten ticks is long enough for the cube to be in the world and short
        // enough to be nowhere near the 600-tick cooldown.
        test.runAfterDelay(10, () => {
          clock("armed");
          afterFirst = countWebs(test);

          // A *different* aim: repeating the first one would place nothing even
          // with the cooldown ready, because every cell there is already
          // cobweb — the retry has to be able to succeed for its failure to
          // mean anything.
          player.lookAtBlock(SECOND_AIM);

          test.runAfterDelay(10, () => {
            player.useItemInSlot(slot); // 20 ticks into a 30-second cooldown
            clock("retried");

            test.runAfterDelay(20, () => {
              const afterSecond = countWebs(test);
              test.assert(
                afterFirst > 0,
                "the first activation placed no cobweb, so the blocked retry proves nothing"
              );
              test.assert(
                afterSecond === afterFirst,
                `the retry added ${afterSecond - afterFirst} cobweb block(s) while the cooldown was running`
              );
              test.assert(!isReady(player), "the cooldown reported ready 30 ticks after being armed");

              waitForReady(slot, 45);
            });
          });
        });
      });
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(1400)
  .tag("andrew");

// ---------------------------------------------------------------- dig speed
//
// The pickaxe must dig like a diamond one. minecraft:digger picks its speed by
// a molang tag query, and a block the query misses does not fall back to some
// tier default — it falls back to speed 1, bare hand. That is how the shipped
// 0.3.0 pickaxe took 15.1s on copper ore (302 ticks, measured) against 0.65s
// for a vanilla diamond pickaxe, and never finished ancient debris at all.
//
// The three blocks below are the three tag families that query must cover, one
// representative each — measured on BDS 1.26.51.1 with getTags():
//   copper_ore      stone_pick_diggable only       (no *_pick_diggable for iron/diamond)
//   deepslate       is_pickaxe_item_destructible only
//   ancient_debris  diamond_tier_destructible only (no *_pick_diggable at all)
//
// The assertion calibrates itself: each block is broken twice in the same run,
// once with our pickaxe and once with a vanilla diamond one, and the two times
// are compared. No hardcoded tick counts to drift when Mojang retunes hardness.

/** Blocks whose tags exercise a different branch of the digger query. */
const SPEED_BLOCKS: ReadonlyArray<string> = [
  "minecraft:copper_ore",
  "minecraft:deepslate",
  "minecraft:ancient_debris",
];

/** Ours may be this many ticks slower than vanilla before the test fails. */
const SPEED_TOLERANCE_TICKS = 4;

/** Long enough for the slowest block here at diamond speed, far short of hand speed. */
const BREAK_LIMIT_TICKS = 300;

/**
 * Breaks the block at `loc` with whatever the player has selected and reports
 * how many ticks it took, or -1 if it was still standing at `limit`.
 */
function timeBreak(
  test: Test,
  player: SimulatedPlayer,
  loc: Vector3,
  label: string,
  done: (ticks: number) => void,
  limit: number = BREAK_LIMIT_TICKS
): void {
  player.lookAtBlock(loc);
  player.breakBlock(loc);

  let ticks = 0;
  const step = (): void => {
    ticks++;
    if (test.getBlock(loc).isAir) {
      console.warn(`[gametest] ${label}: ${ticks} ticks (${(ticks / 20).toFixed(2)}s)`);
      done(ticks);
      return;
    }
    if (ticks >= limit) {
      console.warn(`[gametest] ${label}: still standing after ${limit} ticks`);
      done(-1);
      return;
    }
    test.runAfterDelay(1, step);
  };
  test.runAfterDelay(1, step);
}

register("andrew", "pickaxe_digs_at_diamond_speed", (test: Test) => {
  const player = test.spawnSimulatedPlayer(STAND, "andrew_digger", GameMode.Survival);
  let index = 0;

  const nextBlock = (): void => {
    if (index >= SPEED_BLOCKS.length) {
      test.succeed();
      return;
    }
    const id = SPEED_BLOCKS[index++];

    placeBlock(test, id, TARGET);
    player.giveItem(new ItemStack(PICKAXE_ID, 1), true);

    test.runAfterDelay(4, () => {
      timeBreak(test, player, TARGET, `${PICKAXE_ID} on ${id}`, (ours) => {
        // A fresh copy of the same block, so the two runs are comparable.
        placeBlock(test, id, TARGET);
        player.giveItem(new ItemStack(VANILLA_PICKAXE_ID, 1), true);

        test.runAfterDelay(4, () => {
          timeBreak(test, player, TARGET, `${VANILLA_PICKAXE_ID} on ${id}`, (vanilla) => {
            test.assert(
              vanilla > 0,
              `the vanilla diamond pickaxe did not break ${id} either — the probe itself is broken`
            );
            test.assert(
              ours > 0,
              `${PICKAXE_ID} did not break ${id} within ${BREAK_LIMIT_TICKS} ticks ` +
                `while a vanilla diamond pickaxe took ${vanilla}`
            );
            test.assert(
              ours <= vanilla + SPEED_TOLERANCE_TICKS,
              `${PICKAXE_ID} took ${ours} ticks on ${id} against ${vanilla} for a vanilla ` +
                `diamond pickaxe — the digger tag query does not cover this block`
            );
            test.runAfterDelay(4, nextBlock);
          });
        });
      });
    });
  };

  test.runAfterDelay(4, nextBlock);
})
  .structureName(STRUCTURE)
  .maxTicks(1000)
  .tag("andrew");

// --------------------------------------------- Scythe: melee and dig speed
//
// SC-ITEM-01-AA: prove the item JSON's two numeric claims by measurement
// rather than trust them — Netherite Sword melee parity [src: decision-
// scythe-melee-damage-8] and diamond-hoe dig speed on a hoe-destructible
// block, both self-calibrated against the real vanilla item in the same run
// (no hardcoded HP or tick counts to drift when Mojang retunes balance) —
// the same pattern pickaxe_digs_at_diamond_speed above uses for tool tiers.

const SCYTHE_ID = "andrew:scythe_of_calamity";
const NETHERITE_SWORD_ID = "minecraft:netherite_sword";
const VANILLA_HOE_ID = "minecraft:diamond_hoe";
const COW_ID = "minecraft:cow";

// Hay Bale: vanilla hoes break it near-instantly, the hoe-tier counterpart of
// the pickaxe test's ore blocks and the sword test's cobweb.
/**
 * The block the hoe-speed assertion uses. Measured on BDS 1.26.51.1 with
 * Block.getTags(): oak_leaves carries minecraft:is_hoe_item_destructible, the
 * tag the Scythe's digger names, so parity here is reachable from data.
 *
 * NOT hay_block: it carries no hoe tag at all, yet a vanilla diamond hoe still
 * clears it in 3 ticks against our 16 — the same engine-hardcoded tool/block
 * pair as "a vanilla sword cuts bamboo instantly", which no destroy_speeds
 * entry reaches. It is measured below for the record, without an assertion.
 */
const HOE_BLOCK_ID = "minecraft:oak_leaves";
const HARDCODED_HOE_BLOCK_ID = "minecraft:hay_block";

const COW_SPOT: Vector3 = { x: 3, y: 2, z: 2 };

function entityHealth(entity: Entity): number {
  const health = entity.getComponent("minecraft:health");
  if (health === undefined) {
    throw new Error(`${entity.typeId} has no minecraft:health component`);
  }
  return health.currentValue;
}

function mustSpawn(test: Test, entityTypeId: string, loc: Vector3, why: string): Entity {
  const entity = test.spawn(entityTypeId, loc);
  test.assert(entity !== undefined, why);
  return entity as Entity;
}

/**
 * Gives `player` `itemId`, swings once at `target` and reports the damage
 * dealt (health before minus health after). Delayed rather than read back
 * synchronously: attackEntity() performs the swing, but there is no
 * documented guarantee the health component reflects it before the next tick.
 */
function meleeHit(
  test: Test,
  player: SimulatedPlayer,
  itemId: string,
  target: Entity,
  done: (damage: number) => void
): void {
  player.giveItem(new ItemStack(itemId, 1), true);
  const before = entityHealth(target);
  test.runAfterDelay(2, () => {
    player.attackEntity(target);
    test.runAfterDelay(4, () => {
      done(before - entityHealth(target));
    });
  });
}


/** An admin-marked Scythe — the same thing `/andrew:scythe give` hands out. */
function giveMarkedScythe(player: SimulatedPlayer): void {
  const stack = state.markItem(
    SCYTHE_OF_CALAMITY,
    new ItemStack(SCYTHE_ID, 1),
    state.makeMark("admin", player)
  );
  inventoryOf(player).addItem(stack);
  player.selectedSlotIndex = 0;
}

register("andrew", "scythe_melee_matches_netherite", (test: Test): void => {
  const player = test.spawnSimulatedPlayer(STAND, "andrew_reaper", GameMode.Survival);

  test.runAfterDelay(4, () => {
    const cowA = mustSpawn(test, COW_ID, COW_SPOT, "could not spawn a cow for the scythe hit");

    meleeHit(test, player, SCYTHE_ID, cowA, (scytheDamage) => {
      cowA.remove();

      // 20 ticks clear of the first swing: vanilla's per-weapon attack-speed
      // cooldown (unrelated to this add-on's legendary cooldown) resets the
      // same way ahead of both hits, so the comparison stays fair.
      test.runAfterDelay(20, () => {
        const cowB = mustSpawn(test, COW_ID, COW_SPOT, "could not spawn a cow for the netherite sword hit");

        meleeHit(test, player, NETHERITE_SWORD_ID, cowB, (netheriteDamage) => {
          cowB.remove();

          test.assert(scytheDamage > 0, "the scythe dealt no measurable damage to the cow");
          test.assert(
            netheriteDamage > 0,
            "a vanilla netherite sword dealt no measurable damage — the probe itself is broken"
          );
          test.assert(
            scytheDamage === netheriteDamage,
            `${SCYTHE_ID} dealt ${scytheDamage} damage against ${netheriteDamage} for a vanilla ${NETHERITE_SWORD_ID}`
          );
          console.warn(`[gametest] scythe melee: ours=${scytheDamage} netherite=${netheriteDamage}`);

          // Second half: dig speed on a hoe-destructible block, calibrated
          // the same way as pickaxe_digs_at_diamond_speed above.
          placeBlock(test, HOE_BLOCK_ID, TARGET);
          giveMarkedScythe(player);

          test.runAfterDelay(4, () => {
            timeBreak(test, player, TARGET, `${SCYTHE_ID} on ${HOE_BLOCK_ID}`, (ours) => {
              placeBlock(test, HOE_BLOCK_ID, TARGET);
              player.giveItem(new ItemStack(VANILLA_HOE_ID, 1), true);

              test.runAfterDelay(4, () => {
                timeBreak(test, player, TARGET, `${VANILLA_HOE_ID} on ${HOE_BLOCK_ID}`, (vanilla) => {
                  test.assert(
                    vanilla > 0,
                    `the vanilla diamond hoe did not break ${HOE_BLOCK_ID} either — the probe itself is broken`
                  );
                  test.assert(
                    ours > 0,
                    `${SCYTHE_ID} did not break ${HOE_BLOCK_ID} within ${BREAK_LIMIT_TICKS} ticks ` +
                      `while a vanilla diamond hoe took ${vanilla}`
                  );
                  test.assert(
                    ours <= vanilla + SPEED_TOLERANCE_TICKS,
                    `${SCYTHE_ID} took ${ours} ticks on ${HOE_BLOCK_ID} against ${vanilla} for a vanilla ` +
                      "diamond hoe — the digger tag query does not cover this block"
                  );
                  test.succeed();
                });
              });
            });
          });
        });
      });
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(1000)
  .tag("andrew");

// ------------------------------------------------------- sword cuts its web
//
// The sword's own ability fills 27 cells with cobweb, so a Web Sword that
// cannot cut cobweb works against itself. Shipped 0.3.1 had no
// minecraft:digger at all, and an item with no destroy_speeds entry for a
// block breaks it at speed 1 — bare hand. Measured on BDS 1.26.51.1:
// 401 ticks (20.05s) per cobweb block against 9 for a vanilla diamond sword.
//
// Block.getTags() says cobweb carries minecraft:is_sword_item_destructible —
// the sword-side twin of the pickaxe's tag — so one entry covers it.
//
// Calibrated in-run against a vanilla diamond sword, like the pickaxe test:
// no hardcoded tick counts to drift when Mojang retunes hardness.

const SWORD_ID = "andrew:web_sword";
const VANILLA_SWORD_ID = "minecraft:diamond_sword";

/** Item typeIds lying within SEARCH_RADIUS of `loc`, sorted, for comparison. */
function dropsNear(test: Test, loc: Vector3): string[] {
  return test
    .getDimension()
    .getEntities({
      type: "minecraft:item",
      location: test.worldBlockLocation(loc),
      maxDistance: SEARCH_RADIUS,
    })
    .map((e) => e.getComponent("minecraft:item")?.itemStack?.typeId ?? "?")
    .sort();
}

/** Clears those drops, so the next break is measured on an empty floor. */
function clearDrops(test: Test, loc: Vector3): void {
  for (const entity of test.getDimension().getEntities({
    type: "minecraft:item",
    location: test.worldBlockLocation(loc),
    maxDistance: SEARCH_RADIUS,
  })) {
    entity.remove();
  }
}

register("andrew", "web_sword_cuts_its_own_web", (test: Test) => {
  const player = test.spawnSimulatedPlayer(STAND, "andrew_swordsman", GameMode.Survival);

  placeBlock(test, WEB_BLOCK_ID, AIM_BLOCK);
  player.giveItem(new ItemStack(SWORD_ID, 1), true);

  test.runAfterDelay(4, () => {
    timeBreak(test, player, AIM_BLOCK, `${SWORD_ID} on cobweb`, (ours) => {
      // What the cut leaves on the ground is also calibrated against vanilla
      // rather than assumed: a sword does not drop the cobweb itself, and the
      // point is that ours drops whatever the vanilla one does.
      test.runAfterDelay(6, () => {
        const oursDrops = dropsNear(test, AIM_BLOCK);
        clearDrops(test, AIM_BLOCK);

        placeBlock(test, WEB_BLOCK_ID, AIM_BLOCK);
        player.giveItem(new ItemStack(VANILLA_SWORD_ID, 1), true);

        test.runAfterDelay(4, () => {
        timeBreak(test, player, AIM_BLOCK, `${VANILLA_SWORD_ID} on cobweb`, (vanilla) => {
          test.assert(
            vanilla > 0,
            "the vanilla diamond sword did not cut cobweb either — the probe itself is broken"
          );
          test.assert(
            ours > 0,
            `${SWORD_ID} did not cut cobweb within ${BREAK_LIMIT_TICKS} ticks ` +
              `while a vanilla diamond sword took ${vanilla}`
          );
          test.assert(
            ours <= vanilla + SPEED_TOLERANCE_TICKS,
            `${SWORD_ID} took ${ours} ticks on cobweb against ${vanilla} for a vanilla ` +
              `diamond sword — the digger does not cover minecraft:is_sword_item_destructible`
          );

          test.runAfterDelay(6, () => {
            const vanillaDrops = dropsNear(test, AIM_BLOCK);
            console.warn(
              `[gametest] cobweb drops — ours: ${oursDrops.join(",") || "(none)"} · ` +
                `vanilla: ${vanillaDrops.join(",") || "(none)"}`
            );
            test.assert(
              oursDrops.join(",") === vanillaDrops.join(","),
              `cutting cobweb dropped [${oursDrops.join(",")}] for ${SWORD_ID} but ` +
                `[${vanillaDrops.join(",")}] for a vanilla diamond sword`
            );
            test.succeed();
          });
        });
        });
      });
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------ Legendary: loss recovery
//
// Marked "admin" for the reasons the retention scenarios give. The claim is on
// the product, not the timing of the check: within 3 s of the item entity
// vanishing, the owner holds exactly one instance with that id and nothing of
// it lies on the ground.

/** Scythe spec §1 / task wording: "ждём ≤3 с". */
const RECOVERY_DEADLINE_TICKS = 60;

/** The marked Web Sword item entity carrying `id`, if one is lying near `location`. */
function droppedInstance(dimension: Dimension, location: Vector3, id: string): Entity | undefined {
  return dimension
    .getEntities({ type: "minecraft:item", location, maxDistance: RETENTION_RADIUS })
    .find((entity) => {
      const stack = entity.getComponent("minecraft:item")?.itemStack;
      return isWebSword(stack) && getMark(stack)?.id === id;
    });
}

/**
 * Drives one loss: arm the player, put the sword on the ground via `drop`, let
 * `destroy` make the entity vanish, then check the owner got exactly one back.
 */
function lossScenario(
  name: string,
  drop: (test: Test, player: SimulatedPlayer, stack: ItemStack) => void,
  destroy: (test: Test, entity: Entity) => void
) {
  return (test: Test): void => {
    const player = test.spawnSimulatedPlayer(STAND_A, name, GameMode.Survival);
    let instanceId = "";

    test.runAfterDelay(4, () => {
      const stack = inventoryOf(player).getItem(armSword(player));
      const mark = stack === undefined ? undefined : getMark(stack);
      test.assert(stack !== undefined && mark !== undefined, "the marked sword did not reach the player's hand");
      instanceId = (mark as NonNullable<typeof mark>).id;
      drop(test, player, stack as ItemStack);

      test.runAfterDelay(3, () => {
        test.assert(
          countInstance(inventoryOf(player), instanceId) === 0,
          "the sword is still in the inventory after the drop, so there is nothing to lose"
        );
        const entity = droppedInstance(player.dimension, player.location, instanceId);
        test.assert(entity !== undefined, `no item entity with ws_id ${instanceId} is lying near the player`);
        destroy(test, entity as Entity);

        test.runAfterDelay(RECOVERY_DEADLINE_TICKS, () => {
          const held = countInstance(inventoryOf(player), instanceId);
          test.assert(
            held === 1,
            `the owner carries ${held} Web Sword(s) with ws_id ${instanceId} ${RECOVERY_DEADLINE_TICKS} ticks after the loss, expected exactly 1`
          );
          const dropped = swordsOnGround(player.dimension, player.location);
          test.assert(dropped === 0, `${dropped} Web Sword(s) are still lying on the ground`);
          test.assert(!hasPending(player), "the pending return survived the restore");
          test.succeed();
        });
      });
    });
  };
}

function throwHeld(test: Test, player: SimulatedPlayer): void {
  test.assert(player.dropSelectedItem(), "dropSelectedItem refused to drop the held sword");
}

register(
  "andrew",
  "legendary_returns_from_void",
  lossScenario("andrew_voider", throwHeld, (_test, entity) => {
    const floor = entity.dimension.heightRange.min;
    const at = entity.location;
    entity.teleport({ x: at.x, y: floor - 8, z: at.z });
    console.warn(`[gametest] void: teleported the dropped sword to y=${floor - 8}`);
  })
)
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// andrew:legendary_survives_lava and andrew:legendary_survives_fire moved to
// src/gametest/legendary-fireproof.ts: fire/lava no longer destroy a marked
// legendary (minecraft:fire_resistant), so there is no loss for this
// lossScenario helper to drive.

// The control: a pickup also makes the entity vanish, and must not be read as
// a loss — that would hand the owner a second copy.
register("andrew", "legendary_pickup_no_duplicate", (test: Test): void => {
  const player = test.spawnSimulatedPlayer(STAND_B, "andrew_picker", GameMode.Survival);
  let instanceId = "";
  let pickedAt = -1;

  test.runAfterDelay(4, () => {
    const mark = makeMark("admin", player);
    instanceId = mark.id;
    player.dimension.spawnItem(markSword(new ItemStack(WEB_SWORD_ID, 1), mark), player.location);
  });

  test.succeedWhen(() => {
    test.assert(instanceId !== "", "the sword has not been dropped yet");
    const held = countInstance(inventoryOf(player), instanceId);
    if (pickedAt < 0) {
      test.assert(held === 1, "the player has not picked the sword up yet");
      pickedAt = system.currentTick;
    }
    // Past two recovery checks, so a misread pickup has had time to re-issue.
    test.assert(system.currentTick - pickedAt >= 2 * RECOVERY_DEADLINE_TICKS, "waiting out the recovery checks");
    test.assert(held === 1, `the player carries ${held} Web Sword(s) with ws_id ${instanceId}, expected exactly 1`);
    test.assert(!hasPending(player), "recovery owes the player a sword they picked up themselves");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");



/**
 * Entity ids the engine itself reported as hurt, with who hurt them.
 *
 * This is the only measurable half of "the player can see the hit": a health
 * write is silent, while a real damage event is what makes the target flash
 * red, play the hurt sound and turn on its attacker. If the event arrives, the
 * feedback follows from the engine.
 */
const hurtBy = new Map<string, string>();

world.afterEvents.entityHurt.subscribe((event) => {
  const hurt = event.hurtEntity;
  const source = event.damageSource.damagingEntity;
  if (hurt !== undefined) {
    hurtBy.set(hurt.id, source?.typeId ?? "unknown");
  }
});


// ------------------------------------------------------ Scythe: targeting
//
// SC-TGT-01-AA, spec §8 acceptance tests 1–3. "Who was chosen" is read from
// the listener the production module calls with its choice; a miss is also
// proven by the cooldown staying ready.

/** Owner id -> chosen target's name or type id, or null for "no target". Absent: no activation yet. */
const scytheChoice = new Map<string, string | null>();

/** What a volley scenario sees of its volley, and the hooks it drives it with. */
interface VolleyWatch {
  onLaunch?(target: Entity): void;
  onHit?(hitNumber: number, target: Entity): void;
  hits: number;
  hpAfter: number[];
  endReason?: string;
  launched: boolean;
}

/** Owner id -> the scenario's watch. Registered before the Use. */
const volleyWatch = new Map<string, VolleyWatch>();

// Same binding problem as the trap: the release pack cannot see a
// SimulatedPlayer, so the production targeting and volley are armed here as
// well — the same chain registerScytheVolley() wires in src/main.ts, with an
// observer added.
registerScytheTargeting((owner, target) => {
  scytheChoice.set(
    owner.id,
    target === undefined ? null : target.typeId === "minecraft:player" ? (target as Player).name : target.typeId
  );
  if (target === undefined) {
    return;
  }
  const watch = volleyWatch.get(owner.id) ?? { hits: 0, hpAfter: [], launched: false };
  volleyWatch.set(owner.id, watch);
  watch.launched = launchVolley(owner, target, {
    onHit(n, hp) {
      watch.hits = n;
      watch.hpAfter.push(hp);
      watch.onHit?.(n, target);
    },
    onEnd(reason) {
      watch.endReason = reason;
    },
  });
  watch.onLaunch?.(target);
});

const scytheReady = (player: Player) => cooldown.isReady(player, SCYTHE_OF_CALAMITY.abilityKey);

/** Arms `owner` with a marked Scythe and uses it facing the open sky, so no block is tapped. */
function useScythe(test: Test, owner: SimulatedPlayer, then: () => void): void {
  test.runAfterDelay(4, () => {
    giveMarkedScythe(owner);
    test.runAfterDelay(4, () => {
      owner.lookAtLocation({ x: STAND_A.x + 0.5, y: STAND_A.y + 30, z: STAND_A.z + 0.5 });
      test.runAfterDelay(4, () => {
        owner.useItemInSlot(owner.selectedSlotIndex);
        test.runAfterDelay(10, then);
      });
    });
  });
}

function choiceOf(test: Test, owner: Player): string | null {
  const choice = scytheChoice.get(owner.id);
  test.assert(choice !== undefined, "the Scythe use never reached the targeting module");
  console.warn(
    `[gametest] scythe choice for ${owner.name}: ${choice ?? "no target"} ` +
      `(players online: ${world.getAllPlayers().length})`
  );
  return choice as string | null;
}

register("andrew", "scythe_no_target_no_cooldown", (test: Test): void => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "andrew_lonely", GameMode.Survival);
  useScythe(test, owner, () => {
    test.assert(choiceOf(test, owner) === null, "a target was chosen with nobody else in range");
    test.assert(scytheReady(owner), "a Use with no target started the cooldown");
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// Mobs became targets on 2026-09-25 (operator: "способность должна действовать
// на мобов тоже"). A player still outranks every mob in range — otherwise a cow
// wandering past would swallow the volley meant for an enemy — so the decoy cow
// here stands nearer than the player and must still lose.
register("andrew", "scythe_prefers_player_over_mob", (test: Test): void => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "andrew_reaper_owner", GameMode.Survival);
  const victim = test.spawnSimulatedPlayer({ x: 5, y: 2, z: 1 }, "andrew_victim", GameMode.Survival);
  mustSpawn(test, COW_ID, { x: 2, y: 2, z: 4 }, "could not spawn the decoy cow");

  useScythe(test, owner, () => {
    const choice = choiceOf(test, owner);
    test.assert(choice === victim.name, `the Scythe chose ${choice ?? "nobody"} instead of ${victim.name}`);
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// The other half of the same change: with no player around, the mob is the
// target and takes a real volley — 3 HP of true damage per hit.
register("andrew", "scythe_hits_mob_when_alone", (test: Test): void => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "andrew_herdsman", GameMode.Survival);
  const cow = mustSpawn(test, COW_ID, { x: 3, y: 2, z: 4 }, "could not spawn the target cow");
  const before = cow.getComponent("minecraft:health")?.currentValue ?? -1;

  useScythe(test, owner, () => {
    const choice = choiceOf(test, owner);
    test.assert(choice === COW_ID, `the Scythe chose ${choice ?? "nobody"} instead of the cow`);

    test.succeedWhen(() => {
      const alive = cow.isValid;
      const after = alive ? (cow.getComponent("minecraft:health")?.currentValue ?? -1) : 0;
      console.warn(`[gametest] scythe on cow: hp ${before} -> ${after} (alive ${alive})`);
      test.assert(
        before > 0,
        "the cow had no readable health before the volley — the probe itself is broken"
      );
      test.assert(
        after <= before - TRUE_DAMAGE,
        `the cow lost ${before - after} hp, less than the ${TRUE_DAMAGE} one hit must take`
      );
      // Silent damage reads in game as no damage at all (operator, 2026-09-26),
      // so the engine's own hurt event is asserted, not just the number.
      test.assert(
        hurtBy.has(cow.id),
        "the cow lost health without a single damage event — no red flash, no hurt sound"
      );
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "scythe_skips_hidden", (test: Test): void => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "andrew_seeker", GameMode.Survival);
  const hidden = test.spawnSimulatedPlayer(STAND_B, "andrew_shadow", GameMode.Survival);

  // The function behind `/andrew:hide 10`: the command itself lives in the
  // release pack, which can neither resolve a SimulatedPlayer nor write a
  // property this pack can read.
  test.runAfterDelay(2, () => hideFromTargeting(hidden, 10));

  useScythe(test, owner, () => {
    test.assert(choiceOf(test, owner) === null, `the hidden ${hidden.name} was chosen`);
    test.assert(scytheReady(owner), "a Use whose only candidate was hidden started the cooldown");
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ------------------------------------------------------- Scythe: the volley
//
// SC-VOLLEY-01-AA, spec §8 acceptance tests 5–10, plus the lethal branch of
// decision-scythe-true-damage. Two simulated players face each other across
// the platform; the owner uses the Scythe looking at the sky, so no block is
// tapped and the Use is an itemUse.

const DUEL_OWNER: Vector3 = { x: 1, y: 2, z: 3 };
const DUEL_TARGET: Vector3 = { x: 5, y: 2, z: 3 };

/** Far enough from DUEL_OWNER to be outside the 20-block pursuit radius. */
const FAR_AWAY: Vector3 = { x: DUEL_TARGET.x + 25, y: 2, z: DUEL_TARGET.z };

const scytheBusy = (player: Player) => cooldown.isBusy(player, SCYTHE_OF_CALAMITY.abilityKey);

function newWatch(): VolleyWatch {
  return { hits: 0, hpAfter: [], launched: false };
}

/** Owner id -> the killer's id of that owner's target, recorded by entityDie. */
const scytheKills = new Map<string, string | null>();
world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead.typeId !== "minecraft:player") {
    return;
  }
  const killer = event.damageSource.damagingEntity;
  scytheKills.set(dead.id, killer === undefined ? null : killer.id);
  console.warn(
    `[gametest] probe entityDie: ${dead.id} cause=${event.damageSource.cause} killer=${killer?.id ?? "none"}`
  );
});

/** Spawns owner and target, registers `watch`, then hands the owner a Scythe and uses it. */
function scytheDuel(
  test: Test,
  ownerName: string,
  targetName: string,
  watch: VolleyWatch,
  ownerAt: Vector3 = DUEL_OWNER,
  targetAt: Vector3 = DUEL_TARGET
): { owner: SimulatedPlayer; target: SimulatedPlayer } {
  const owner = test.spawnSimulatedPlayer(ownerAt, ownerName, GameMode.Survival);
  const target = test.spawnSimulatedPlayer(targetAt, targetName, GameMode.Survival);
  volleyWatch.set(owner.id, watch);
  test.runAfterDelay(4, () => {
    giveMarkedScythe(owner);
    test.runAfterDelay(4, () => {
      owner.lookAtLocation({ x: ownerAt.x + 0.5, y: ownerAt.y + 30, z: ownerAt.z + 0.5 });
      test.runAfterDelay(4, () => owner.useItemInSlot(owner.selectedSlotIndex));
    });
  });
  return { owner, target };
}

function assertLaunched(test: Test, watch: VolleyWatch): void {
  test.assert(watch.launched, "the Scythe Use did not launch a volley");
}

function assertNothingInFlight(test: Test): void {
  test.assert(activeVolleyCount() === 0, `${activeVolleyCount()} volley interval(s) still running`);
  test.assert(activeProjectileCount() === 0, `${activeProjectileCount()} projectile(s) still in flight`);
  test.assert(volleyTickErrors() === 0, `${volleyTickErrors()} exception(s) were caught inside volley ticks`);
}

register("andrew", "scythe_three_hits_true_damage", (test: Test): void => {
  const watch = newWatch();
  const { target } = scytheDuel(test, "andrew_scy_owner_dmg", "andrew_scy_armored", watch);
  let hpBefore = -1;

  test.runAfterDelay(2, () => {
    const equippable = target.getComponent("minecraft:equippable");
    test.assert(equippable !== undefined, "the target has no equippable component");
    equippable?.setEquipment(EquipmentSlot.Head, new ItemStack("minecraft:diamond_helmet"));
    equippable?.setEquipment(EquipmentSlot.Chest, new ItemStack("minecraft:diamond_chestplate"));
    equippable?.setEquipment(EquipmentSlot.Legs, new ItemStack("minecraft:diamond_leggings"));
    equippable?.setEquipment(EquipmentSlot.Feet, new ItemStack("minecraft:diamond_boots"));
    // Only the volley may move the health bar: no fall damage, no regeneration.
    target.addEffect("slow_falling", 1200, { showParticles: false });
    world.gameRules.naturalRegeneration = false;
  });
  watch.onLaunch = () => {
    hpBefore = entityHealth(target);
    const chest = target.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Chest)?.typeId;
    console.warn(`[gametest] scythe damage: target hp ${hpBefore} at launch, chest=${chest ?? "none"}`);
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(watch.endReason !== undefined, "the volley is still in flight");
    world.gameRules.naturalRegeneration = true;
    const hpAfter = entityHealth(target);
    console.warn(
      `[gametest] scythe damage: ${watch.hits} hit(s), hp ${hpBefore} -> ${hpAfter} ` +
        `(after each hit: ${watch.hpAfter.join(", ")}), end=${watch.endReason}`
    );
    test.assert(
      target.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Chest)?.typeId ===
        "minecraft:diamond_chestplate",
      "the target lost its diamond chestplate"
    );
    test.assert(watch.hits === 3, `${watch.hits} of 3 projectiles hit (end=${watch.endReason})`);
    test.assert(hpBefore - hpAfter === 9, `the volley took ${hpBefore - hpAfter} HP through diamond armour, expected exactly 9`);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "scythe_launches_target", (test: Test): void => {
  const watch = newWatch();
  const { target } = scytheDuel(test, "andrew_scy_owner_up", "andrew_scy_flier", watch);
  let launchedAt = -1;
  let startY: number | undefined;
  let peak = -Infinity;
  let apex = false;

  watch.onLaunch = () => {
    launchedAt = system.currentTick;
  };
  watch.onHit = (n, hit) => {
    if (n === 1) {
      startY = hit.location.y;
      peak = startY;
      console.warn(
        `[gametest] scythe speed: first hit ${system.currentTick - launchedAt} ticks after launch over ` +
          `${DUEL_TARGET.x - DUEL_OWNER.x} blocks at ${PROJECTILE_SPEED} b/t, particle ${PROJECTILE_PARTICLE}`
      );
    }
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(startY !== undefined, "no projectile has hit yet");
    const y = target.location.y;
    if (!apex) {
      if (y > peak) {
        peak = y;
      } else if (peak > (startY as number) + 0.5 && y < peak - 0.05) {
        apex = true;
        console.warn(
          `[gametest] scythe launch: strength ${LAUNCH_STRENGTH} -> peak +${(peak - (startY as number)).toFixed(2)} ` +
            `blocks (start y=${(startY as number).toFixed(2)}, peak y=${peak.toFixed(2)}, hits so far ${watch.hits})`
        );
      }
    }
    test.assert(apex, "the target is still rising");
    const rise = peak - (startY as number);
    test.assert(rise >= 8 && rise <= 12, `the first hit launched the target ${rise.toFixed(2)} blocks, expected 8–12`);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

const WALL_X = 3;

register("andrew", "scythe_through_walls", (test: Test): void => {
  const watch = newWatch();
  const wall: Vector3[] = [];
  for (let y = 2; y <= 4; y++) {
    for (let z = 0; z <= 6; z++) {
      wall.push({ x: WALL_X, y, z });
    }
  }
  scytheDuel(test, "andrew_scy_owner_wall", "andrew_scy_walled", watch, { x: 0, y: 2, z: 3 }, { x: 6, y: 2, z: 3 });

  // Built after the target is chosen: targeting itself needs line of sight.
  watch.onLaunch = () => {
    for (const cell of wall) {
      test.setBlockType("minecraft:obsidian", cell);
    }
    console.warn(`[gametest] scythe walls: ${wall.length} obsidian blocks between owner and target`);
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(watch.endReason !== undefined, "the volley is still in flight");
    test.assert(watch.hits >= 1, `no projectile passed the wall (end=${watch.endReason})`);
    const broken = wall.filter((cell) => test.getBlock(cell).typeId !== "minecraft:obsidian");
    console.warn(
      `[gametest] scythe walls: ${watch.hits} hit(s) through the wall, ${wall.length - broken.length}/${wall.length} ` +
        `obsidian intact, end=${watch.endReason}`
    );
    test.assert(broken.length === 0, `${broken.length} wall block(s) are no longer obsidian`);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "scythe_out_of_radius_no_cooldown", (test: Test): void => {
  const watch = newWatch();
  const { owner, target } = scytheDuel(test, "andrew_scy_owner_miss", "andrew_scy_runner", watch);
  watch.onLaunch = () => {
    target.teleport(test.worldLocation(FAR_AWAY));
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(watch.endReason !== undefined, "the volley is still in flight");
    console.warn(
      `[gametest] scythe radius before hit: end=${watch.endReason} hits=${watch.hits} ready=${scytheReady(owner)} busy=${scytheBusy(owner)}`
    );
    test.assert(watch.endReason === "out_of_radius", `the volley ended with ${watch.endReason}, not out_of_radius`);
    test.assert(watch.hits === 0, `${watch.hits} projectile(s) hit a target that had left`);
    test.assert(scytheReady(owner), "a volley with no hit started the cooldown");
    test.assert(!scytheBusy(owner), "the owner is still busy after the volley ended");
    assertNothingInFlight(test);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "scythe_out_of_radius_after_hit_cooldown", (test: Test): void => {
  const watch = newWatch();
  const { owner } = scytheDuel(test, "andrew_scy_owner_late", "andrew_scy_escapee", watch);
  watch.onHit = (n, hit) => {
    if (n === 1) {
      hit.teleport(test.worldLocation(FAR_AWAY));
    }
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(watch.endReason !== undefined, "the volley is still in flight");
    console.warn(
      `[gametest] scythe radius after hit: end=${watch.endReason} hits=${watch.hits} ready=${scytheReady(owner)} ` +
        `remaining=${cooldown.remainingTicks(owner, SCYTHE_OF_CALAMITY.abilityKey)} ticks`
    );
    test.assert(watch.endReason === "out_of_radius", `the volley ended with ${watch.endReason}, not out_of_radius`);
    test.assert(watch.hits === 1, `${watch.hits} hit(s), expected exactly the one before the escape`);
    test.assert(!scytheReady(owner), "a volley that landed a hit left the Scythe ready");
    assertNothingInFlight(test);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

/** Acceptance test 10 asks for "2 s" after the death. */
const CLEANUP_WAIT_TICKS = 40;

register("andrew", "scythe_cleanup_on_target_death", (test: Test): void => {
  const watch = newWatch();
  const { owner } = scytheDuel(test, "andrew_scy_owner_kill", "andrew_scy_doomed", watch);
  let killedAt = -1;
  watch.onHit = (n, hit) => {
    if (n === 1) {
      hit.kill();
      killedAt = system.currentTick;
    }
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(killedAt >= 0, "the target has not been killed yet");
    test.assert(system.currentTick - killedAt >= CLEANUP_WAIT_TICKS, "waiting 2 s after the death");
    console.warn(
      `[gametest] scythe cleanup: end=${watch.endReason} hits=${watch.hits} volleys=${activeVolleyCount()} ` +
        `projectiles=${activeProjectileCount()} tickErrors=${volleyTickErrors()} ready=${scytheReady(owner)}`
    );
    test.assert(watch.endReason === "target_invalid", `the volley ended with ${watch.endReason ?? "nothing"}`);
    test.assert(!scytheReady(owner), "a volley that landed a hit left the Scythe ready");
    assertNothingInFlight(test);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "scythe_lethal_hit_kills", (test: Test): void => {
  const watch = newWatch();
  const { owner, target } = scytheDuel(test, "andrew_scy_owner_lethal", "andrew_scy_frail", watch);
  test.runAfterDelay(2, () => {
    world.gameRules.naturalRegeneration = false;
  });
  // 4 -> 1 by direct write, then 1 -> dead through applyDamage.
  watch.onLaunch = () => {
    target.getComponent("minecraft:health")?.setCurrentValue(4);
  };

  test.succeedWhen(() => {
    assertLaunched(test, watch);
    test.assert(watch.endReason !== undefined, "the volley is still in flight");
    world.gameRules.naturalRegeneration = true;
    const killer = scytheKills.get(target.id);
    console.warn(
      `[gametest] scythe lethal: end=${watch.endReason} hits=${watch.hits} hp after each: ${watch.hpAfter.join(", ")} ` +
        `killer=${killer ?? "none"} owner=${owner.id}`
    );
    test.assert(watch.hits === 2, `${watch.hits} hit(s), expected 2 (3 HP, then the kill)`);
    test.assert(watch.endReason === "target_invalid", `the volley ended with ${watch.endReason}, not target_invalid`);
    test.assert(killer === owner.id, `the kill was credited to ${killer ?? "nobody"}, not the owner`);
    assertNothingInFlight(test);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

console.warn("[gametest] registered 27 test(s) under tag 'andrew'");
