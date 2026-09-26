// Compile src/structures/templates/<id>.json into
// packs/behavior/structures/andrew/<id>.mcstructure (engine id "andrew:<id>").
//
// The output directory is build output: it is wiped and regenerated on every
// run, so a deleted template cannot leave a stale structure in the pack.
// Every written file is parsed back and checked against its own template
// before the build moves on to packaging.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileTemplate, parseMcstructure } from './lib/mcstructure.mjs';
import { writeNbt } from './lib/nbt.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const templatesDir = join(root, 'src', 'structures', 'templates');
export const structuresDir = join(root, 'packs', 'behavior', 'structures', 'andrew');

function verifyRoundTrip(id, buffer, counts) {
  const parsed = parseMcstructure(buffer);
  const reCounts = {};
  for (const i of parsed.primary) {
    const name = parsed.palette[i].name;
    reCounts[name] = (reCounts[name] ?? 0) + 1;
  }
  const a = JSON.stringify(Object.entries(counts).sort());
  const b = JSON.stringify(Object.entries(reCounts).sort());
  if (a !== b) throw new Error(`${id}: block counts differ after round trip\n  wrote ${a}\n  read  ${b}`);
}

/** @returns {{ id: string, bytes: number, counts: Record<string, number> }[]} */
export function buildStructures({ from = templatesDir, to = structuresDir } = {}) {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  const results = [];
  for (const file of readdirSync(from).filter((f) => f.endsWith('.json')).sort()) {
    const id = basename(file, '.json');
    let template;
    try {
      template = JSON.parse(readFileSync(join(from, file), 'utf-8'));
    } catch (err) {
      throw new Error(`${file}: invalid JSON: ${err.message}`);
    }
    let compiled;
    try {
      compiled = compileTemplate(template);
    } catch (err) {
      throw new Error(`${file}: ${err.message}`);
    }
    const buffer = writeNbt(compiled.tag);
    verifyRoundTrip(id, buffer, compiled.counts);
    writeFileSync(join(to, `${id}.mcstructure`), buffer);
    results.push({ id, bytes: buffer.length, counts: compiled.counts });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const r of buildStructures()) {
    process.stdout.write(`  andrew:${r.id} -> ${r.bytes} bytes\n`);
  }
}
