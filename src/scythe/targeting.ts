// The Scythe's target choice at the moment of Use (spec §3): the engine half.
// Rules live in targeting-rules.ts; this file gathers players, casts the line
// of sight and answers a miss with the "no player here" message.
//
// A miss never touches the cooldown (acceptance test 1). A hit hands the
// target to `onTarget`; the volley owns the cooldown from there (spec §5).

import { type Block, type ItemStack, type Player, type Vector3, system, world } from "@minecraft/server";
import { resolveActivation } from "../legendary/hands";
import { isHiddenFromTargeting } from "../legendary/hidden";
import { SCYTHE_OF_CALAMITY, defForStack } from "../legendary/registry";
import { type TargetCandidate, pickTarget, rayCells } from "./targeting-rules";

export type ScytheTargetListener = (owner: Player, target: Player | undefined) => void;

/**
 * Line of sight from the owner's eyes to the candidate's eyes.
 *
 * An obstacle is any block that is neither air nor liquid — glass, leaves,
 * cobweb, tall grass included: stable 2.10.0 has no `isSolid`, and a see-
 * through block is still a wall the owner is aiming through. A cell that
 * cannot be read (unloaded chunk, outside the world) is an obstacle too, so an
 * unreadable path never yields a target.
 */
export function hasLineOfSight(owner: Player, candidate: Player): boolean {
  const dimension = owner.dimension;
  for (const cell of rayCells(owner.getHeadLocation(), candidate.getHeadLocation())) {
    let block: Block | undefined;
    try {
      block = dimension.getBlock(cell);
    } catch {
      return false;
    }
    if (block === undefined || !(block.isAir || block.isLiquid)) {
      return false;
    }
  }
  return true;
}

/** The nearest visible, unhidden player within 20 blocks, or undefined. Mobs are never queried. */
export function selectTarget(owner: Player): Player | undefined {
  const byId = new Map<string, Player>();
  const candidates: TargetCandidate[] = [];
  for (const entry of world.getAllPlayers()) {
    // Typed non-nullable; a SimulatedPlayer arrives as undefined in a pack
    // that does not load the beta gametest module.
    const player: Player | undefined = entry;
    if (player === undefined || !player.isValid) {
      continue;
    }
    byId.set(player.id, player);
    candidates.push({
      id: player.id,
      location: player.location,
      dimensionId: player.dimension.id,
      hidden: isHiddenFromTargeting(player),
    });
  }

  const picked = pickTarget(
    {
      id: owner.id,
      location: owner.location,
      dimensionId: owner.dimension.id,
      viewDirection: owner.getViewDirection(),
    },
    candidates,
    (c) => {
      const player = byId.get(c.id);
      return player !== undefined && hasLineOfSight(owner, player);
    }
  );
  return picked === undefined ? undefined : byId.get(picked.id);
}

/** Players already activated on the current tick — itemUse and a block tap can describe one press. */
const handledTick = new Set<string>();
let handledAt = -1;

function claimTick(player: Player): boolean {
  if (system.currentTick !== handledAt) {
    handledTick.clear();
    handledAt = system.currentTick;
  }
  if (handledTick.has(player.id)) {
    return false;
  }
  handledTick.add(player.id);
  return true;
}

function logTarget(owner: Player, target: Player | undefined): void {
  const at = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
  console.warn(
    target === undefined
      ? `[andrew] scythe: no target for ${owner.name} at ${at(owner.location)}`
      : `[andrew] scythe: ${owner.name} targets ${target.name} at ${at(target.location)}`
  );
}

export function registerScytheTargeting(onTarget: ScytheTargetListener = () => undefined): void {
  const activate = (player: Player, stack: ItemStack): void => {
    if (defForStack(stack) === undefined || !claimTick(player)) {
      return;
    }
    // Undefined too when the Scythe is on cooldown: the HUD counts that down.
    if (resolveActivation(player)?.def !== SCYTHE_OF_CALAMITY) {
      return;
    }
    const target = selectTarget(player);
    logTarget(player, target);
    if (target === undefined) {
      player.onScreenDisplay.setActionBar({ translate: "andrew.scythe.no_target" });
    }
    onTarget(player, target);
  };

  world.afterEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined) {
      activate(player, event.itemStack);
    }
  });

  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    if (!event.isFirstEvent) {
      return;
    }
    const player: Player | undefined = event.player;
    const stack: ItemStack | undefined = event.itemStack;
    if (player !== undefined && stack !== undefined) {
      activate(player, stack);
    }
  });

  console.warn("[andrew] scythe targeting armed (itemUse + playerInteractWithBlock)");
}
