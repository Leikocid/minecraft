// The Web Sword's active ability: entomb the aimed-at position in a 3×3×3
// cobweb cube (spec §5, §6, §12).
//
// The engine half only. Every decision that can be made from values alone —
// which cells the cube covers, which of them may be replaced — lives in
// cube.ts and is tested without a game. This file does the four things that
// need the engine: listen for the use, cast the two rays, write the blocks,
// and arm the cooldown.
//
// Which held legendary a press activates is decided by legendary/hands.ts;
// the cooldown is written only through startCooldown(), and never for an
// activation that placed nothing.
// [src: KV L0 ADR-017]
//
// No polling: the only subscriptions are use-events, so there is no per-tick
// world scan [src: webswordspecv1ruen §11].

import {
  type Block,
  type Dimension,
  type Entity,
  type ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { startCooldown } from "../legendary/cooldown";
import { resolveActivation } from "../legendary/hands";
import { WEB_SWORD, defForStack } from "../legendary/registry";
import { WEB_BLOCK_ID, adjacentCell, classify, planCells, toCell } from "./cube";

/** Survival interaction reach for blocks — no artificial long ray (spec §5). */
const BLOCK_REACH = 5;

/** Survival melee reach for entities (Q-011). */
const ENTITY_REACH = 3;

/**
 * Players whose activation has already been handled on a given tick, keyed by
 * player id.
 *
 * Two events can describe the same press: `itemUse` always fires, and
 * `playerInteractWithBlock` fires as well when the press landed on a block.
 * Both are subscribed, because which of them a touchscreen tap produces is an
 * engine fact rather than a documented one (see docs/dev/gametest-on-bds.md for
 * what BDS 1.26.51.1 actually emits) — and the tick stamp is what keeps the
 * pair from placing two cubes for one press.
 */
const handledTick = new Map<string, number>();

/** The tick `handledTick` describes; a newer tick empties it (see claimTick). */
let handledAt = -1;

/**
 * Claims this tick for `player`, or reports that it is already claimed.
 *
 * The map is emptied whenever the tick moves on, so it never holds more than
 * the players who activated within one tick — nothing accumulates for players
 * who have long since left.
 */
function claimTick(player: Player): boolean {
  const tick = system.currentTick;
  if (tick !== handledAt) {
    handledTick.clear();
    handledAt = tick;
  }
  if (handledTick.has(player.id)) {
    return false;
  }
  handledTick.set(player.id, tick);
  return true;
}

export function registerTrap(): void {
  world.afterEvents.itemUse.subscribe((event) => {
    // Typed non-nullable, and for a real player it is. A SimulatedPlayer
    // arrives as undefined in a pack that does not load the beta gametest
    // module, which this one deliberately does not — so the release pack
    // cannot be driven by simulated players at all, and the GameTest pack arms
    // its own copy of this module instead. [src: concept-constraint C-2]
    const player: Player | undefined = event.source;
    if (player === undefined) {
      return;
    }
    activate(player, event.itemStack, "itemUse");
  });

  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    // A held interaction repeats this event every tick; only the press itself
    // is an activation.
    if (!event.isFirstEvent) {
      return;
    }
    const player: Player | undefined = event.player;
    const stack: ItemStack | undefined = event.itemStack;
    if (player === undefined || stack === undefined) {
      return;
    }
    activate(player, stack, "playerInteractWithBlock");
  });

  console.warn("[andrew] web sword trap armed (itemUse + playerInteractWithBlock)");
}

/**
 * One activation attempt. Returns nothing: the outcomes are a cube in the
 * world plus an armed cooldown, a "no room" message, or silence.
 *
 * Order of the success predicate is fixed [src: KV L0 ADR-006/ADR-017]:
 * readiness, then a target, then a plan with at least one placed cell. A
 * failure at any step before placement leaves the cooldown untouched — the
 * ability costs nothing when it does nothing (spec §5, §12).
 */
function activate(player: Player, stack: ItemStack, via: string): void {
  if (defForStack(stack) === undefined) {
    return;
  }

  if (!claimTick(player)) {
    return;
  }

  // Undefined also when every held legendary is on cooldown: the HUD is
  // already counting it down, and a message here would fight it for the bar.
  if (resolveActivation(player)?.def !== WEB_SWORD) {
    return;
  }

  const center = findCenter(player);
  if (center === undefined) {
    // Nothing within reach. Not a failure worth a message — the player aimed
    // at the sky. [src: webswordspecv1ruen §12]
    return;
  }

  const placed = placeCube(player.dimension, center);
  console.warn(
    `[andrew] web sword trap via ${via}: centre ${center.x},${center.y},${center.z} placed ${placed}/27`
  );

  if (placed === 0) {
    // Every cell was protected, already cobweb, or unloaded. The activation
    // failed, so the cooldown is not spent — and the player is told, because
    // unlike an out-of-reach miss this one looked like a valid aim.
    // [src: decision-q-017-zero-cells-proval]
    player.onScreenDisplay.setActionBar({ translate: "andrew.web_sword.no_room" });
    return;
  }

  startCooldown(player, WEB_SWORD.abilityKey);
}

/**
 * The cube's centre cell, or undefined when nothing is in reach.
 *
 * Two rays, because the reaches differ: entities out to 3 blocks, blocks out
 * to 5 (Q-011). An entity wins a tie, a block that is strictly closer wins.
 *
 * The wall rule itself is kept by the entity ray: getEntitiesFromViewDirection
 * stops at the first colliding block unless given `ignoreBlockCollision`, so it
 * never returns an entity behind the face the block ray hit — 0 of 21 block
 * types on BDS 1.26.51.1 (websword_ray_stoppers). The distance comparison is
 * a backstop behind it.
 * [src: webswordspecv1ruen §12 — 'не атаковать сквозь стены']
 */
function findCenter(player: Player): Vector3 | undefined {
  const head = player.getHeadLocation();

  const entityHit = firstLivingEntity(player);
  const blockHit = player.getBlockFromViewDirection({
    maxDistance: BLOCK_REACH,
    includeLiquidBlocks: true,
    includePassableBlocks: false,
  });

  if (entityHit !== undefined) {
    const blockDistance =
      blockHit === undefined ? undefined : distance(head, hitPoint(blockHit.block, blockHit.faceLocation));
    if (blockDistance === undefined || entityHit.distance <= blockDistance) {
      // The cell the entity's feet occupy: the cube grows around it, and the
      // entity itself is neither moved nor removed (spec §6).
      return toCell(entityHit.entity.location);
    }
  }

  if (blockHit === undefined) {
    return undefined;
  }
  return adjacentCell(blockHit.block.location, blockHit.face);
}

interface LivingHit {
  entity: Entity;
  distance: number;
}

/** The nearest hit entity that is a living target rather than a dropped item. */
function firstLivingEntity(player: Player): LivingHit | undefined {
  for (const hit of player.getEntitiesFromViewDirection({ maxDistance: ENTITY_REACH })) {
    const entity: Entity | undefined = hit.entity;
    if (entity === undefined || entity.id === player.id) {
      continue;
    }
    // Items, arrows, xp orbs and the like are not targets; "living" is read
    // off the health component rather than an id allow-list, so a modded mob
    // counts and a new vanilla projectile does not.
    if (entity.getComponent("minecraft:health") === undefined) {
      continue;
    }
    return { entity, distance: hit.distance };
  }
  return undefined;
}

/**
 * Absolute position of a block-ray hit: the block's corner plus faceLocation.
 *
 * faceLocation is the hit point's fractional part, so a hit on the block's +1
 * plane — a full South, East or Up face — reads 0 along the normal and this
 * lands one block deep (BDS 1.26.51.1, websword_face_location). findCenter's
 * outcome does not change: the entity ray has already stopped at that face.
 */
function hitPoint(block: Block, faceLocation: Vector3): Vector3 {
  return {
    x: block.location.x + faceLocation.x,
    y: block.location.y + faceLocation.y,
    z: block.location.z + faceLocation.z,
  };
}

function distance(a: Vector3, b: Vector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Writes cobweb into every replaceable cell of the cube and returns how many
 * were placed.
 *
 * A direct write is legal here: these are after-events, not before-events, so
 * there is no need to defer through system.run.
 */
function placeCube(dimension: Dimension, center: Vector3): number {
  let placed = 0;

  for (const cell of planCells(center)) {
    let block: Block | undefined;
    try {
      block = dimension.getBlock(cell);
    } catch {
      // Outside the loaded area or outside the world: skip, never force
      // (spec §6, §12).
      continue;
    }

    if (block === undefined || classify(block) !== "place") {
      continue;
    }

    try {
      block.setType(WEB_BLOCK_ID);
      placed++;
    } catch (err) {
      // classify() said yes and the write still failed — the engine refused
      // this one cell. The rest of the cube is still worth placing.
      console.warn(`[andrew] web sword: setType failed at ${cell.x},${cell.y},${cell.z}: ${String(err)}`);
    }
  }

  return placed;
}
