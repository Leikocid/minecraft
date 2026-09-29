// CX-L0-12 check, knowledge side: every KV copy that still describes the four
// structures as unbuilt, their decisions as proposed, or their size/contents as
// the pre-v1.2.0 figures. Read-only. Exit 1 while any copy remains, 0 once the
// cleanup list in diagnose-CNTR-XCX12-AA.md is applied.
//
//   node docs/feedback/diagnose-CNTR-XCX12-AA-kv.mjs <project>/.ai/context

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ctx = process.argv[2];
if (!ctx || !existsSync(join(ctx, 'analysis', 'nodes'))) {
  console.error('usage: diagnose-CNTR-XCX12-AA-kv.mjs <project>/.ai/context');
  process.exit(2);
}

const N = (f) => `analysis/nodes/${f}`;
const D = (f) => `analysis/decisions/${f}`;
const PROPOSED = /status:proposed|\*\*Status(:\*\*|\*\*:) proposed/;

/** [file, pattern, what it still claims] */
const STALE = [
  [N('airs__concept-component.md'), /"not-implemented"|Status:\*\* analysis only/, 'Airship unbuilt'],
  [N('wind__concept-component.md'), /"not-implemented"|Status:\*\* analysis only/, 'Windmill unbuilt'],
  [N('bast__concept-component.md'), /None of these sibling components exist yet/, 'siblings absent'],
  [N('infr__concept-component.md'), /not (yet )?fixed by any ADR/, 'template source path unfixed'],
  [N('loot__concept-component.md'), /is not yet confirmed/, '/loot insert unconfirmed'],
  [N('loot-p002__concept-process.md'), /pending confirmation by the `strf` probe/, '/loot insert unconfirmed'],

  [N('airs__concept-component.md'), /15×7×10–12/, 'Airship ≈15×7×10–12'],
  [N('airs-ac01__concept-acceptance-criterion.md'), /15×7×10–12/, 'Airship ≈15×7×10–12'],
  [N('airs-r001__concept-rule.md'), /15×7×10–12/, 'Airship ≈15×7×10–12'],
  [N('airs-e001__concept-entity.md'), /x: 15, y: 11, z: 7/, 'Airship def size 15×11×7'],

  [N('wrdn__concept-component.md'), /30×30|10–15 blocks|of the 10 chests|Exactly 2 Sculk|the 2 Shriekers|Exactly 10 chests/, 'Warden City 30×30, 10 chests, 2 shriekers'],
  [N('wrdn-ac03__concept-acceptance-criterion.md'), /30×30|10–15/, 'Warden City 30×30×10–15'],
  [N('wrdn-ac07__concept-acceptance-criterion.md'), /exactly 2 Sculk/, 'Warden City 2 shriekers'],
  [N('wrdn-ac08__concept-acceptance-criterion.md'), /exactly 10 chests/, 'Warden City 10 chests'],
  [N('wrdn-ent1__concept-entity.md'), /30×30/, 'Warden City 30×30'],
  [N('wrdn-ent2__concept-entity.md'), /Exactly 10 per/, 'Warden City 10 chests'],
  [N('wrdn-rul2__concept-rule.md'), /30×30|10–15/, 'Warden City 30×30×10–15'],
  [N('wrdn-rul4__concept-rule.md'), /3 of the structure's 10 chests/, 'Warden City 3 of 10 central'],
  [N('wrdn-rul5__concept-rule.md'), /Exactly 2 Sculk|the 2 Shriekers/, 'Warden City 2 shriekers'],
  [N('wrdn-rul6__concept-rule.md'), /Exactly 10 chests|All 10 chests/, 'Warden City 10 chests'],
  [N('wrdn-as01__concept-assumption.md'), /its 2 Shriekers/, 'Warden City 2 shriekers'],
  [N('wrdn-as02__concept-assumption.md'), /the 2 Shriekers/, 'Warden City 2 shriekers'],
  [N('strf-as01__concept-assumption.md'), /Warden City \(30×30\)/, 'Warden City 30×30'],
  [N('strf-e001__concept-entity.md'), /Warden City 10 \(3 central\)/, 'Warden City 10 chests'],
  [N('loot-e004__concept-entity.md'), /all 10 chests/, 'Warden City 10 chests'],
  [N('loot-ac09__concept-acceptance-criterion.md'), /Warden City's 10 chests|all 10 use/, 'Warden City 10 chests'],
  [N('loot-r007__concept-rule.md'), /Warden City \(10 chests\)/, 'Warden City 10 chests'],
  [N('loot__concept-component.md'), /Warden City \(10 chests/, 'Warden City 10 chests'],
  [N('loot-p002__concept-process.md'), /Warden City, all 10 chests/, 'Warden City 10 chests'],

  ...[
    'adr-strc', 'adr-strs', 'adr-tmpl', 'strf-d001', 'strf-d002', 'strf-d003', 'strf-d004',
    'wind-ad01', 'wind-ad02', 'wind-ad03', 'airs-d001', 'infr-d005',
  ].map((id) => [N(`${id}__concept-architecture-decision.md`), PROPOSED, 'ADR proposed']),

  [D('decision-dirizhabl-udlinyaetsya-protiv-razmera-v-speke-ra.md'), /25–30 блоков/, 'Airship decision 25–30, shipped 75'],
  [D('decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i.md'), /62x62/, 'Warden decision 62×62, shipped 63×63'],
];

/** Decision records that hold the probe acceptances and the Warden size but are bound to no node. */
const UNBOUND = [
  'decision-adr-l0-adr-strc-accepted-generatsiya-skriptom-pr.md',
  'decision-adr-l0-adr-strs-accepted-s-ogovorkoy-q5-zond-str.md',
  'decision-adr-l0-adr-tmpl-accepted-zond-strf-p006-q1-q2-q3.md',
  'decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-.md',
  'decision-adr-strf-01-l0-strf-d001-accepted-determinirovan.md',
  'decision-adr-strf-02-l0-strf-d002-accepted-spavnery-vanil.md',
  'decision-ad-wrdn-01-l0-wrdn-ad01-podtverzhdeno-vanilnaya-.md',
  'decision-adr-bast-02-l0-bast-ad02-podtverzhdeno-vanilnye-.md',
  'decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i.md',
].map(D);

// A renamed or deleted file must not read as a cleaned one.
const missing = [...new Set([...STALE.map(([f]) => f), ...UNBOUND])].filter((f) => !existsSync(join(ctx, f)));
for (const f of missing) console.log(`MISSING ${f}`);

let hits = 0;
for (const [file, re, what] of STALE) {
  const path = join(ctx, file);
  if (!existsSync(path)) continue;
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (!re.test(line)) return;
      hits++;
      console.log(`STALE ${file}:${i + 1} — ${what}`);
    });
}
for (const file of UNBOUND) {
  const path = join(ctx, file);
  if (!existsSync(path)) continue;
  const head = readFileSync(path, 'utf8').split('\n---')[0];
  if (/^part_of: \[".+"\]/m.test(head)) continue;
  hits++;
  console.log(`UNBOUND ${file} — no part_of, so no node shows this decision`);
}
if (missing.length > 0) {
  console.log(`RESULT UNKNOWN — ${missing.length} file(s) missing, ${hits} stale copies in the rest`);
  process.exit(2);
}
console.log(hits === 0 ? 'RESULT PASS — no stale copy left' : `RESULT FAIL — ${hits} stale copies`);
process.exit(hits === 0 ? 0 : 1);
