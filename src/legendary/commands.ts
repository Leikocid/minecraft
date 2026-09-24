// Operator tools, one command per legendary: `<def.command> give [player]`
// and `<def.command> reset` (for the Web Sword: /andrew:websword).
//
// Both exist because the one-per-world gate is deliberately irreversible.
// `give` hands out a marked admin copy — retained on death like a crafted one,
// but outside the craft budget entirely, which is what makes retention testable
// without spending the world's single sword [src: decision-q-006-web-sword-
// provenance-yes-metka-ekzemplyara]. `reset` is the auditable escape hatch for
// the case Q-014 leaves open: the only sword destroyed, the budget spent, and
// no way back [src: decision-q-014-budget-after-destruction-pravo-ostaetsya-p].

import {
  CommandPermissionLevel,
  type CustomCommandOrigin,
  CustomCommandParamType,
  type CustomCommandResult,
  CustomCommandStatus,
  ItemStack,
  Player,
  type RawMessage,
  system,
  world,
} from "@minecraft/server";
import { LEGENDARIES, type LegendaryDef } from "./registry";
import { makeMark, markItem, resetCrafted } from "./state";

const GIVE = "give";
const RESET = "reset";

export function registerLegendaryCommands(): void {
  // Custom commands may only be registered during startup, before the world
  // exists — hence a before-event and a subscription taken at script load.
  system.beforeEvents.startup.subscribe((event) => {
    const registry = event.customCommandRegistry;

    for (const def of LEGENDARIES) {
      const actionEnum = `${def.command}_action`;
      registry.registerEnum(actionEnum, [GIVE, RESET]);
      registry.registerCommand(
        {
          name: def.command,
          description: `${def.itemId} operator tools: give a marked test copy, or reset the one-per-world craft budget.`,
          permissionLevel: CommandPermissionLevel.GameDirectors,
          mandatoryParameters: [{ name: actionEnum, type: CustomCommandParamType.Enum }],
          optionalParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }],
        },
        (origin, action: string, target?: unknown) => run(def, origin, action, target)
      );

      console.warn(`[andrew] registered /${def.command} <${GIVE}|${RESET}> [target] — one command, enum parameter`);
    }
  });
}

/**
 * The command callback runs in read-only mode: reading the origin and the
 * arguments is allowed, changing the world is not. So every branch below
 * decides synchronously and defers the mutation to the next tick.
 */
function run(def: LegendaryDef, origin: CustomCommandOrigin, action: string, target?: unknown): CustomCommandResult {
  const caller = origin.sourceEntity instanceof Player ? origin.sourceEntity : undefined;

  if (action === RESET) {
    system.run(() => {
      resetCrafted(def);
      // Deliberately to the server log as well as to chat: re-opening the
      // craft budget is the one operator action that changes world state
      // nobody can otherwise audit.
      console.warn(`[andrew] ${def.itemId} craft budget reset by ${caller?.name ?? "the server console"}`);
      world.sendMessage({ translate: `${def.textPrefix}.reset` });
    });
    return { status: CustomCommandStatus.Success };
  }

  const targets = playersFrom(target, caller);
  if (targets.length === 0) {
    return {
      status: CustomCommandStatus.Failure,
      message: `${def.command} ${GIVE}: no target — run it as a player, or name one`,
    };
  }

  system.run(() => {
    for (const player of targets) {
      giveAdminCopy(def, player);
      const note: RawMessage = { translate: `${def.textPrefix}.admin_given`, with: [player.name] };
      player.sendMessage(note);
      if (caller !== undefined && caller.id !== player.id) {
        caller.sendMessage(note);
      }
    }
  });
  return { status: CustomCommandStatus.Success };
}

/**
 * A marked copy with origin "admin": the craft gate ignores every marked sword,
 * so this neither claims nor spends the world's single survival craft.
 */
function giveAdminCopy(def: LegendaryDef, player: Player): void {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    return;
  }

  const copy = markItem(def, new ItemStack(def.itemId, 1), makeMark("admin", player));
  const leftover = container.addItem(copy);
  if (leftover !== undefined) {
    player.dimension.spawnItem(leftover, player.location);
  }
}

/**
 * Selector arguments reach the callback untyped, and a player selector can
 * match none, one or many — so both a bare Player and an array of them are
 * accepted here. This is the script's boundary with the command line; nothing
 * further in guesses at the shape. With no selector the command targets
 * whoever ran it, which is the common `/andrew:websword give` case.
 */
function playersFrom(value: unknown, caller: Player | undefined): Player[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is Player => entry instanceof Player);
  }
  if (value instanceof Player) {
    return [value];
  }
  return caller === undefined ? [] : [caller];
}
