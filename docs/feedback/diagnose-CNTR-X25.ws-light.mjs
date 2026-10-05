// CNTR-X25 side finding: Web Sword classify() against every placed light-block id.
// Usage: node docs/feedback/diagnose-CNTR-X25.ws-light.mjs <worktree root>. Exit 1 while any id classifies "place".
const root = process.argv[2];
const { build } = await import(`${root}/node_modules/esbuild/lib/main.js`);
const out = await build({
  entryPoints: [`${root}/src/websword/cube.ts`], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'no-mc', setup(b) {
    b.onResolve({ filter: /^@minecraft\// }, (a) => ({ path: a.path, namespace: 'mc' }));
    b.onLoad({ filter: /.*/, namespace: 'mc' }, () => ({ contents: 'throw new Error("runtime mc import")' }));
  } }],
});
const { classify } = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
const block = (typeId) => ({ typeId, isAir: false, isLiquid: false, getComponent: () => undefined });
const rows = Array.from({ length: 16 }, (_, n) => `minecraft:light_block_${n}`).map((id) => [id, classify(block(id))]);
for (const [id, c] of rows) console.log(`${id} -> ${c}`);
const placed = rows.filter(([, c]) => c !== 'skip').map(([id]) => id);
console.log(`Q-013 protects the light block; Web Sword would replace ${placed.length} of 16 placed light-block ids with cobweb`);
process.exit(placed.length === 0 ? 0 : 1);
