/**
 * Question generators for Unit 12, lessons 'probability' and 'statistics'.
 * Probabilities are exact fractions where possible; normal probabilities come from an accurate series for the error function.
 */
import { fAdd, fDiv, fMul, fr, fSub, Frac } from './algebra'
import { fm, gcd, MN, must, numSpec, ri, rnz, sup, w } from './calcHelpers'
import { approxSpec } from './powerQuestions'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }
const pwf = (f: Frac, k: number) => { let r = fr(1); for (let i = 0; i < k; i++) r = fMul(r, f); return r }
/** the standard normal cumulative distribution function */
export function phi(z: number): number {
  if (z > 6) return 1
  if (z < -6) return 0
  const x = z / Math.SQRT2
  let term = x, sum = x
  for (let n = 1; n < 120; n++) { term *= (-x * x) / n; sum += term / (2 * n + 1) }
  return 0.5 * (1 + (2 / Math.sqrt(Math.PI)) * sum)
}
const frText = (f: Frac) => fm(f)
const word = (prompt: string, ws: string[], opts: string[], hint: string, expl: string[]): Spec => ({ prompt, kind: 'word', answers: [], display: ws[0], input: ws[0], words: ws, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: false, extra: opts } })

export const PROB_GENS: Gen[] = [
  { lesson: 'probability', level: 1, make: (r) => {
    const n = ri(r, 5, 10), k = ri(r, 2, 4), t = ri(r, 1, 3)
    if (t === 1) return numSpec(`In how many ways can ${k} books be chosen from ${n} different books (order does not matter)?`, fr(choose(n, k)), 'Order does not matter, so use combinations: nCk = n!/(k!(n − k)!).', [`${n}C${k} = ${Array.from({ length: k }, (_, i) => n - i).join(' × ')} / ${k}! = ${choose(n, k)}.`])
    if (t === 2) { const m = ri(r, 4, 8); return numSpec(`In how many different orders can ${m} people stand in a queue?`, fr(fact(m)), 'The number of arrangements of m different objects is m! = m(m − 1)…2·1.', [`${m}! = ${Array.from({ length: m }, (_, i) => m - i).join(' × ')} = ${fact(m)}.`]) }
    return numSpec(`A club of ${n} members elects a president, a secretary and a treasurer, all different people${k === 2 ? '' : ''}. In how many ways can this be done?`, fr(n * (n - 1) * (n - 2)), 'The offices are different, so order matters: use permutations nPr = n(n − 1)…(n − r + 1).', [`${n} choices for president, then ${n - 1}, then ${n - 2}: ${n} × ${n - 1} × ${n - 2} = ${n * (n - 1) * (n - 2)}.`])
  } },
  { lesson: 'probability', level: 1, make: (r) => {
    const t = ri(r, 1, 4)
    if (t === 1) { const s = ri(r, 3, 11), ways = s <= 7 ? s - 1 : 13 - s; const v = fr(ways, 36); return numSpec(`Two fair dice are rolled. What is the probability that the total is ${s}?`, v, 'List the equally likely outcomes: 36 pairs. Count those with the required total.', [`The pairs with total ${s}: ${ways} of the 36 equally likely outcomes.`, `P = ${ways}/36 = ${frText(v)}.`]) }
    if (t === 2) return numSpec('Two fair dice are rolled. What is the probability that at least one shows a six?', fr(11, 36), 'Use the complement: P(at least one six) = 1 − P(no six).', ['P(no six on a die) = 5/6, so P(no sixes) = 25/36.', 'P(at least one six) = 1 − 25/36 = 11/36.'])
    if (t === 3) { const n = ri(r, 3, 6); return numSpec(`A fair coin is tossed ${n} times. What is the probability of at least one head?`, fr(2 ** n - 1, 2 ** n), 'Use the complement: P(at least one head) = 1 − P(all tails).', [`P(all tails) = (1/2)${sup(n)} = 1/${2 ** n}.`, `P(at least one head) = 1 − 1/${2 ** n} = ${frText(fr(2 ** n - 1, 2 ** n))}.`]) }
    const a = ri(r, 2, 6), b = ri(r, 2, 6)
    return numSpec(`A bag contains ${a} red and ${b} blue counters. One counter is drawn at random. What is the probability that it is red?`, fr(a, a + b), 'P = (favourable outcomes)/(total outcomes) when all outcomes are equally likely.', [`P(red) = ${a}/${a + b} = ${frText(fr(a, a + b))}.`])
  } },
  { lesson: 'probability', level: 2, make: (r) => {
    const t = ri(r, 1, 3)
    for (;;) {
      const pb = fr(ri(r, 2, 5), 10), pab = fr(ri(r, 1, 2), 10)
      if (pab.n / pab.d >= pb.n / pb.d) continue
      const pa = fr(ri(r, 3, 6), 10)
      if (t === 1) return numSpec(`P(B) = ${frText(pb)} and P(A and B) = ${frText(pab)}. Find the conditional probability P(A | B).`, fDiv(pab, pb), 'P(A | B) = P(A and B) / P(B).', [`P(A | B) = ${frText(pab)} / ${frText(pb)} = ${frText(fDiv(pab, pb))}.`])
      if (t === 2) return numSpec(`P(A) = ${frText(pa)}, P(B) = ${frText(pb)} and P(A and B) = ${frText(pab)}. Find P(A or B).`, fSub(fAdd(pa, pb), pab), 'The addition rule: P(A or B) = P(A) + P(B) − P(A and B).', [`P(A or B) = ${frText(pa)} + ${frText(pb)} − ${frText(pab)} = ${frText(fSub(fAdd(pa, pb), pab))}.`])
      return numSpec(`Events A and B are independent with P(A) = ${frText(pa)} and P(B) = ${frText(pb)}. Find P(A and B).`, fMul(pa, pb), 'For independent events, P(A and B) = P(A) × P(B).', [`P(A and B) = ${frText(pa)} × ${frText(pb)} = ${frText(fMul(pa, pb))}.`])
    }
  } },
  { lesson: 'probability', level: 2, make: (r) => {
    const a = ri(r, 3, 7), b = ri(r, 3, 7), n = a + b
    const v = fr(a * (a - 1), n * (n - 1))
    return numSpec(`A bag has ${a} red and ${b} blue counters. Two are drawn one after the other without replacement. What is the probability that both are red?`, v, 'Without replacement the second probability changes: multiply P(first red) by P(second red | first red).', [`P(first red) = ${a}/${n}. P(second red | first red) = ${a - 1}/${n - 1}.`, `P(both red) = ${a}/${n} × ${a - 1}/${n - 1} = ${frText(v)}.`])
  } },
  { lesson: 'probability', level: 2, make: (r) => {
    const n = ri(r, 4, 8), k = ri(r, 1, n - 1), p = pick(r, [fr(1, 2), fr(1, 3), fr(1, 4), fr(2, 3)])
    const q = fSub(fr(1), p), v = fMul(fr(choose(n, k)), fMul(pwf(p, k), pwf(q, n - k)))
    return numSpec(`A trial succeeds with probability ${frText(p)}. In ${n} independent trials, what is the probability of exactly ${k} success${k === 1 ? '' : 'es'}?`, v, 'Binomial: P(X = k) = nCk pᵏ (1 − p)ⁿ⁻ᵏ.', [`${n}C${k} = ${choose(n, k)}, p${sup(k)} = ${frText(pwf(p, k))}, (1 − p)${sup(n - k)} = ${frText(pwf(q, n - k))}.`, `P = ${choose(n, k)} × ${frText(pwf(p, k))} × ${frText(pwf(q, n - k))} = ${frText(v)}.`])
  } },
  { lesson: 'probability', level: 3, make: (r) => {
    // Bayes' theorem with percentages
    const a = ri(r, 1, 5), b = pick(r, [90, 95, 99, 80]), c = pick(r, [2, 5, 10]), P = a * b, Q = (100 - a) * c
    const v = fr(P, P + Q)
    return numSpec(`${a}% of a population has a condition. A test is positive for ${b}% of people who have it and for ${c}% of people who do not. A person tests positive. What is the probability they have the condition? Give a fraction.`, v, "Bayes' theorem: P(condition | positive) = P(positive and condition) / P(positive). Imagine 10 000 people (or work with the percentages).", [`P(positive and condition) = ${a}% × ${b}% = ${P}/10000.`, `P(positive and no condition) = ${100 - a}% × ${c}% = ${Q}/10000.`, `P(condition | positive) = ${P}/(${P} + ${Q}) = ${frText(v)} ≈ ${(P / (P + Q)).toFixed(3)}.`])
  } },
  { lesson: 'probability', level: 3, make: (r) => {
    // the expectation or variance of a discrete distribution
    const vals = [0, 1, 2, 3].map((_, i) => i * ri(r, 1, 2) + ri(r, 0, 1))
    const uniq = [...new Set(vals)].sort((a, b) => a - b)
    if (uniq.length < 3) return PROB_GENS[6].make(r)
    const k = uniq.length, parts = Array.from({ length: k }, () => ri(r, 1, 5)), tot = parts.reduce((s, x) => s + x, 0)
    const ps = parts.map((x) => fr(x, tot))
    const E = ps.reduce((s, p, i) => fAdd(s, fMul(p, fr(uniq[i]))), fr(0))
    const E2 = ps.reduce((s, p, i) => fAdd(s, fMul(p, fr(uniq[i] * uniq[i]))), fr(0))
    const V = fSub(E2, fMul(E, E)), wantE = r() < 0.5
    must(ps.reduce((s, p) => fAdd(s, p), fr(0)).n === 1, 'distribution sums to 1')
    return numSpec(`A random variable X takes the values ${uniq.join(', ')} with probabilities ${ps.map(frText).join(', ')} respectively. Find ${wantE ? 'the expected value E(X)' : 'the variance Var(X)'}.`, wantE ? E : V, wantE ? 'E(X) = Σ x P(X = x).' : 'Var(X) = E(X²) − (E(X))².', wantE ? [`E(X) = ${uniq.map((x, i) => `${x} × ${frText(ps[i])}`).join(' + ')} = ${frText(E)}.`] : [`E(X) = ${frText(E)} and E(X²) = ${uniq.map((x, i) => `${x * x} × ${frText(ps[i])}`).join(' + ')} = ${frText(E2)}.`, `Var(X) = ${frText(E2)} − (${frText(E)})² = ${frText(V)}.`])
  } },
  { lesson: 'probability', level: 3, make: (r) => {
    const n = ri(r, 4, 20), p = pick(r, [fr(1, 2), fr(1, 3), fr(1, 4), fr(1, 5), fr(2, 5)]), t = ri(r, 1, 3)
    const q = fSub(fr(1), p)
    if (t === 1) return numSpec(`X is binomial with n = ${n} trials and success probability ${frText(p)}. Find its mean E(X).`, fMul(fr(n), p), 'For a binomial distribution, E(X) = np.', [`E(X) = ${n} × ${frText(p)} = ${frText(fMul(fr(n), p))}.`])
    if (t === 2) return numSpec(`X is binomial with n = ${n} trials and success probability ${frText(p)}. Find its variance.`, fMul(fMul(fr(n), p), q), 'For a binomial distribution, Var(X) = np(1 − p).', [`Var(X) = ${n} × ${frText(p)} × ${frText(q)} = ${frText(fMul(fMul(fr(n), p), q))}.`])
    return numSpec(`Each independent attempt succeeds with probability ${frText(p)}. What is the expected number of attempts needed until the first success?`, fDiv(fr(1), p), 'For a geometric distribution the expected number of trials to the first success is 1/p.', [`E = 1/p = 1/${frText(p)} = ${frText(fDiv(fr(1), p))}.`])
  } },
]

/* ------------------------------------------------------------------ statistics */

const data = (r: () => number, n: number, lo = 1, hi = 20) => Array.from({ length: n }, () => ri(r, lo, hi))
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)

export const STAT_GENS: Gen[] = [
  { lesson: 'statistics', level: 1, make: (r) => {
    const n = pick(r, [7, 9]), xs = data(r, n, 2, 15), s = sorted(xs), t = ri(r, 1, 3)
    if (t === 1) { const m = fr(xs.reduce((a, b) => a + b, 0), n); return numSpec(`Find the mean of the data ${xs.join(', ')}.`, m, 'Mean = (sum of the values)/(number of values).', [`The sum is ${xs.reduce((a, b) => a + b, 0)} and there are ${n} values.`, `Mean = ${xs.reduce((a, b) => a + b, 0)}/${n} = ${frText(m)}.`]) }
    if (t === 2) return numSpec(`Find the median of the data ${xs.join(', ')}.`, fr(s[(n - 1) / 2]), 'Put the values in order and take the middle one.', [`In order: ${s.join(', ')}.`, `The middle (${(n + 1) / 2}th) value is ${s[(n - 1) / 2]}.`])
    return numSpec(`Find the range of the data ${xs.join(', ')}.`, fr(s[n - 1] - s[0]), 'Range = largest value − smallest value.', [`The largest is ${s[n - 1]} and the smallest is ${s[0]}.`, `Range = ${s[n - 1] - s[0]}.`])
  } },
  { lesson: 'statistics', level: 1, make: (r) => {
    const mu = ri(r, 10, 100), sg = ri(r, 2, 12), z = pick(r, [-3, -2, -1, 1, 2, 3, 1.5, -1.5, 0.5, -0.5].map((v) => v)), x = mu + z * sg
    const zf = fr(Math.round(z * 2), 2)
    if (!Number.isInteger(x)) return STAT_GENS[1].make(r)
    return numSpec(`Scores have mean ${mu} and standard deviation ${sg}. What is the z-score of a score of ${x}?`, zf, 'z = (x − μ)/σ: the number of standard deviations from the mean.', [`z = (${x} − ${mu})/${sg} = ${A(x - mu)}/${sg} = ${frText(zf)}.`])
  } },
  { lesson: 'statistics', level: 2, make: (r) => {
    const xs = data(r, 5, 1, 12), n = xs.length, m = fr(xs.reduce((a, b) => a + b, 0), n)
    const ss = xs.reduce((s, x) => fAdd(s, fMul(fSub(fr(x), m), fSub(fr(x), m))), fr(0))
    const v = fDiv(ss, fr(n - 1)), sample = r() < 0.5
    const pv = fDiv(ss, fr(n))
    return numSpec(`Find the ${sample ? 'sample' : 'population'} variance of ${xs.join(', ')}. Give a fraction.`, sample ? v : pv, sample ? 'Sample variance s² = Σ(x − mean)²/(n − 1).' : 'Population variance σ² = Σ(x − mean)²/n.', [`The mean is ${frText(m)}.`, `Σ(x − mean)² = ${frText(ss)}.`, sample ? `s² = ${frText(ss)}/${n - 1} = ${frText(v)}.` : `σ² = ${frText(ss)}/${n} = ${frText(pv)}.`])
  } },
  { lesson: 'statistics', level: 2, make: (r) => {
    const z = pick(r, [0.5, 1, 1.5, 2, 2.5, -0.5, -1, -1.5, -2]), t = ri(r, 1, 3)
    if (t === 1) return approxSpec(`Z is a standard normal random variable. Find P(Z < ${z}).`, phi(z), 4, 'Use the standard normal table (or the symmetry P(Z < −z) = 1 − P(Z < z)).', [`P(Z < ${z}) = Φ(${z}) ≈ ${phi(z).toFixed(4)}.`], undefined, 'P')
    if (t === 2) { const a = pick(r, [-2, -1.5, -1, -0.5]), b = pick(r, [0.5, 1, 1.5, 2]); return approxSpec(`Z is a standard normal random variable. Find P(${a} < Z < ${b}).`, phi(b) - phi(a), 4, 'P(a < Z < b) = Φ(b) − Φ(a).', [`Φ(${b}) ≈ ${phi(b).toFixed(4)} and Φ(${a}) ≈ ${phi(a).toFixed(4)}.`, `The difference is ≈ ${(phi(b) - phi(a)).toFixed(4)}.`], undefined, 'P') }
    return approxSpec(`Z is a standard normal random variable. Find P(Z > ${Math.abs(z)}).`, 1 - phi(Math.abs(z)), 4, 'P(Z > z) = 1 − P(Z < z).', [`P(Z > ${Math.abs(z)}) = 1 − Φ(${Math.abs(z)}) ≈ ${(1 - phi(Math.abs(z))).toFixed(4)}.`], undefined, 'P')
  } },
  { lesson: 'statistics', level: 2, make: (r) => {
    const mu = ri(r, 20, 80), sg = ri(r, 2, 10), k = pick(r, [-2, -1, 1, 2, 1.5, -1.5]), x = mu + k * sg
    if (!Number.isInteger(x)) return STAT_GENS[4].make(r)
    return approxSpec(`X is normally distributed with mean ${mu} and standard deviation ${sg}. Find P(X < ${x}).`, phi(k), 4, 'Standardise: P(X < x) = P(Z < (x − μ)/σ).', [`z = (${x} − ${mu})/${sg} = ${k}.`, `P(X < ${x}) = Φ(${k}) ≈ ${phi(k).toFixed(4)}.`], undefined, 'P')
  } },
  { lesson: 'statistics', level: 3, make: (r) => {
    // a 95% confidence interval
    const m = ri(r, 2, 10), n = m * m, sg = ri(r, 2, 12) * 5, xb = ri(r, 20, 200)
    const margin = fMul(fr(49, 25), fr(sg, m))
    const upper = fAdd(fr(xb), margin)
    must(Math.abs(upper.n / upper.d - (xb + (1.96 * sg) / m)) < 1e-9, 'confidence limit')
    return numSpec(`A random sample of ${n} measurements has mean ${xb}. The population standard deviation is known to be ${sg}. Find the upper limit of a 95% confidence interval for the population mean (use z = 1.96). Give a fraction or decimal.`, upper, 'The interval is x̄ ± z σ/√n. Compute the margin of error z σ/√n.', [`σ/√n = ${sg}/${m} = ${frText(fr(sg, m))}.`, `Margin = 1.96 × ${frText(fr(sg, m))} = ${frText(margin)}.`, `Upper limit = ${xb} + ${frText(margin)} = ${frText(upper)}.`])
  } },
  { lesson: 'statistics', level: 3, make: (r) => {
    // the test statistic
    const m = ri(r, 2, 8), n = m * m, sg = ri(r, 2, 10), mu = ri(r, 20, 100), d = rnz(r, -12, 12)
    const xb = fr(mu * sg + d * 0, 1)
    void xb
    const xbar = mu + d / 2
    const zf = fDiv(fSub(fr(Math.round(xbar * 2), 2), fr(mu)), fr(sg, m))
    return numSpec(`H₀: μ = ${mu}. A sample of ${n} has mean ${xbar} and the population standard deviation is ${sg}. Find the test statistic z = (x̄ − μ₀)/(σ/√n).`, zf, 'z = (x̄ − μ₀)/(σ/√n).', [`σ/√n = ${sg}/${m} = ${frText(fr(sg, m))}.`, `z = (${xbar} − ${mu})/${frText(fr(sg, m))} = ${frText(zf)}.`])
  } },
  { lesson: 'statistics', level: 3, make: (r) => {
    const m = ri(r, 3, 9), n = m * m, sg = ri(r, 2, 8), mu = ri(r, 20, 80), z = pick(r, [1.2, 1.5, 1.8, 2.1, 2.4, 2.8, -1.4, -2.2, -2.6, -1.7])
    const xbar = mu + (z * sg) / m
    const rej = Math.abs(z) > 1.96
    const xs = Number.isInteger(xbar * 100) ? xbar : Math.round(xbar * 100) / 100
    const zz = ((xs - mu) * m) / sg
    const reject = Math.abs(zz) > 1.96
    void rej
    return word(`A two-sided test at the 5% level of H₀: μ = ${mu} uses a sample of ${n} with mean ${xs}. The population standard deviation is ${sg}. The critical values are ±1.96. Do you reject H₀ or fail to reject H₀?`, reject ? ['reject', 'reject h0', 'reject the null hypothesis'] : ['fail to reject', 'do not reject', 'fail to reject h0', 'do not reject h0'], ['reject', 'fail to reject'], 'Compute z = (x̄ − μ₀)/(σ/√n) and compare |z| with the critical value 1.96.', [`z = (${xs} − ${mu})/(${sg}/${m}) ≈ ${zz.toFixed(2)}.`, reject ? `|z| = ${Math.abs(zz).toFixed(2)} > 1.96, so reject H₀.` : `|z| = ${Math.abs(zz).toFixed(2)} < 1.96, so there is not enough evidence to reject H₀.`])
  } },
  { lesson: 'statistics', level: 3, make: (r) => {
    // the slope of the least-squares line
    for (;;) {
      const n = ri(r, 4, 5), xs = Array.from({ length: n }, (_, i) => i + 1 + ri(r, 0, 0)), ys = xs.map(() => ri(r, 1, 14))
      const mx = fr(xs.reduce((a, b) => a + b, 0), n), my = fr(ys.reduce((a, b) => a + b, 0), n)
      let sxy = fr(0), sxx = fr(0)
      xs.forEach((x, i) => { sxy = fAdd(sxy, fMul(fSub(fr(x), mx), fSub(fr(ys[i]), my))); sxx = fAdd(sxx, fMul(fSub(fr(x), mx), fSub(fr(x), mx))) })
      const slope = fDiv(sxy, sxx), wantB = r() < 0.5
      const icpt = fSub(my, fMul(slope, mx))
      const pts = xs.map((x, i) => `(${x}, ${ys[i]})`).join(', ')
      return numSpec(`Find the ${wantB ? 'slope' : 'y-intercept'} of the least-squares regression line y = a + bx for the data points ${pts}. Give a fraction.`, wantB ? slope : icpt, 'b = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)², and a = ȳ − b x̄.', [`x̄ = ${frText(mx)} and ȳ = ${frText(my)}.`, `Σ(x − x̄)(y − ȳ) = ${frText(sxy)} and Σ(x − x̄)² = ${frText(sxx)}.`, `b = ${frText(slope)}, and a = ${frText(my)} − (${frText(slope)}) × ${frText(mx)} = ${frText(icpt)}.`])
    }
  } },
]
void w; void gcd
export const PS_GENS: Gen[] = [...PROB_GENS, ...STAT_GENS]
