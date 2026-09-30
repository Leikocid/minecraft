// The LMB penetrator's Survival-unbreakable deny list (L0-xasm6, L0-pntr-r002).
// C-16 deviation: stable @minecraft/server 2.10.0 exposes no block-hardness or
// "unbreakable" query, so this fixed list is the only way to keep engine-
// protected blocks. Obsidian, Reinforced Deepslate and Ancient Debris are
// deliberately absent: they are hard, but a Survival player can break them.

const IDS = [
  "bedrock",
  "end_portal_frame",
  "end_portal",
  "end_gateway",
  "barrier",
  "light_block",
  "command_block",
  "chain_command_block",
  "repeating_command_block",
  "structure_block",
  "structure_void",
  "jigsaw",
  "allow",
  "deny",
  "border_block",
  "invisible_bedrock",
  "moving_block",
  "piston_arm_collision",
  "sticky_piston_arm_collision",
];

export const PENETRATOR_KEEP: ReadonlySet<string> = new Set(IDS.map((id) => `minecraft:${id}`));
