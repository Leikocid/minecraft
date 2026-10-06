// The Survival-unbreakable deny list every weapon terrain edit shares: the
// Orbital LMB penetrator and the Sculk Crossbow crater (L0-xasm6,
// L0-pntr-r002, L0-sclk-r010). No per-weapon copy or extension: an extra
// exclusion goes here and the Orbital gate re-runs.
// C-16 deviation: stable @minecraft/server 2.10.0 exposes no block-hardness or
// "unbreakable" query, so this fixed list is the only way to keep engine-
// protected blocks. Obsidian, Reinforced Deepslate and Ancient Debris are
// deliberately absent: they are hard, but a Survival player can break them.
// A placed light block is light_block_<level> on BDS 1.26.51.1: setting
// minecraft:light_block reads back as light_block_0.

const LIGHT_LEVELS = Array.from({ length: 16 }, (_, level) => `light_block_${level}`);

const IDS = [
  "bedrock",
  "end_portal_frame",
  "end_portal",
  "end_gateway",
  "barrier",
  "light_block",
  ...LIGHT_LEVELS,
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

export const TERRAIN_KEEP: ReadonlySet<string> = new Set(IDS.map((id) => `minecraft:${id}`));
