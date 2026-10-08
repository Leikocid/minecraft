// P6 (docs/feedback/probe-storm.md): how many melee hits an acceptance scenario needs to tell a 30 %
// passive from 25 % and from 35 %, by the exact binomial distribution — no normal approximation.
//
// The scenario accepts when the observed share k/N lies in [0.275, 0.325], the midpoints to the two
// alternatives. Two errors matter:
//   false fail — a correct 30 % passive lands outside the window (the "lottery" a red suite would be);
//   false pass — a 25 % or 35 % passive lands inside it.
// Prints the error rates for a set of N and the smallest N that holds both under each target rate.

const LO = 0.275;
const HI = 0.325;

const logFact = [0];
for (let i = 1; i <= 20000; i++) logFact.push(logFact[i - 1] + Math.log(i));

function pmf(n, k, p) {
  return Math.exp(logFact[n] - logFact[k] - logFact[n - k] + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

/** P(lo ≤ k/N ≤ hi) for Binomial(N, p). */
function inside(n, p) {
  const kLo = Math.ceil(LO * n - 1e-9);
  const kHi = Math.floor(HI * n + 1e-9);
  let s = 0;
  for (let k = kLo; k <= kHi; k++) s += pmf(n, k, p);
  return Math.min(1, s);
}

function errors(n) {
  return { falseFail: 1 - inside(n, 0.3), pass25: inside(n, 0.25), pass35: inside(n, 0.35) };
}

const fmt = (x) => (x < 1e-6 ? x.toExponential(1) : x.toPrecision(3));

console.log("P6 N falseFail(p=0.30) falsePass(p=0.25) falsePass(p=0.35) window=[0.275,0.325]");
for (const n of [100, 300, 500, 1000, 2000, 3000, 3500, 3700, 4000, 5000]) {
  const e = errors(n);
  console.log(`P6 N=${n} ${fmt(e.falseFail)} ${fmt(e.pass25)} ${fmt(e.pass35)}`);
}
for (const target of [0.05, 0.01, 0.001, 0.0001]) {
  let found = -1;
  for (let n = 50; n <= 20000; n++) {
    const e = errors(n);
    if (Math.max(e.falseFail, e.pass25, e.pass35) > target) continue;
    // Discreteness makes the error non-monotone in N: require the next 200 N to hold too.
    let holds = true;
    for (let m = n + 1; m <= n + 200 && holds; m++) {
      const f = errors(m);
      holds = Math.max(f.falseFail, f.pass25, f.pass35) <= target;
    }
    if (holds) {
      found = n;
      break;
    }
  }
  const e = errors(found);
  console.log(`P6 MIN target=${target} N=${found} falseFail=${fmt(e.falseFail)} pass25=${fmt(e.pass25)} pass35=${fmt(e.pass35)}`);
}
