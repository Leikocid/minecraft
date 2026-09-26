// Compile src/structures/templates/<id>.json into
// packs/behavior/structures/andrew/<id>.mcstructure (engine id "andrew:<id>").
// A template too large to write by hand is <id>.ts whose default export is the
// template object or a function returning it; a .ts file without a default
// export is a helper module, not a template.
//
// The output directory is build output: it is wiped and regenerated on every
// run, so a deleted template cannot leave a stale structure in the pack.
// Every written file is parsed back and checked against its own template
// before the build moves on to packaging.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join } from 'node:path';
import { buildSync } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STRUCTURE_VOID, compileTemplate, parseMcstructure } from './lib/mcstructure.mjs';
import { writeNbt } from './lib/nbt.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const templatesDir = join(root, 'src', 'structures', 'templates');
export const structuresDir = join(root, 'packs', 'behavior', 'structures', 'andrew');

function verifyRoundTrip(id, buffer, counts) {
  const parsed = parseMcstructure(buffer);
  const reCounts = {};
  for (const i of parsed.primary) {
    const name = i === -1 ? STRUCTURE_VOID : parsed.palette[i].name;
    reCounts[name] = (reCounts[name] ?? 0) + 1;
  }
  const a = JSON.stringify(Object.entries(counts).sort());
  const b = JSON.stringify(Object.entries(reCounts).sort());
  if (a !== b) throw new Error(`${id}: block counts differ after round trip\n  wrote ${a}\n  read  ${b}`);
}

const isTsTemplate = (path) => /^export default\b/m.test(readFileSync(path, 'utf-8'));

/** Bundle a .ts template module (with its imports) to CommonJS and evaluate its default export. */
export function loadTsTemplate(path) {
  const dir = mkdtempSync(join(tmpdir(), 'andrew-template-'));
  const out = join(dir, 'template.cjs');
  try {
    buildSync({ entryPoints: [path], bundle: true, format: 'cjs', platform: 'neutral', outfile: out, logLevel: 'error' });
    const exported = createRequire(import.meta.url)(out).default;
    return typeof exported === 'function' ? exported() : exported;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Template ids and how to load each, in build order. */
export function listTemplates(from = templatesDir) {
  return readdirSync(from)
    .filter((f) => f.endsWith('.json') || (f.endsWith('.ts') && isTsTemplate(join(from, f))))
    .sort()
    .map((file) => ({ id: basename(file, extname(file)), file }));
}

/** @returns {{ id: string, bytes: number, counts: Record<string, number> }[]} */
export function buildStructures({ from = templatesDir, to = structuresDir } = {}) {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  const results = [];
  for (const { id, file } of listTemplates(from)) {
    let template;
    try {
      template = file.endsWith('.ts') ? loadTsTemplate(join(from, file)) : JSON.parse(readFileSync(join(from, file), 'utf-8'));
    } catch (err) {
      throw new Error(`${file}: invalid template: ${err.message}`);
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
