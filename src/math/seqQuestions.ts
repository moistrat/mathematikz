/**
 * Question generators for Unit 7: sequences, series and the binomial theorem.
 *
 * Every closed form (an nth term, a sum, a binomial coefficient) is computed twice, once from the formula and once by
 * brute force, and the generator throws if they disagree, so a wrong formula cannot reach a student.
 */
import { fmtFrac, fmtPoly, Frac, fAdd, fDiv, fMul, fNum, fr, fSub, parsePoly, parseRat, rEq } from './algebra'
import { alg, numSpec, ri, rnz } from './algebraQuestions'
import { exactSet, exF, MN, pairSpec, sgnText } from './equationQuestions'
import { MINUS } from './exact'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const fm = (f: Frac) => fmtFrac(f)
const SUB = '₀₁₂₃₄₅₆₇₈₉'
const sub = (n: number) => String(n).split('').map((d) => SUB[Number(d)]).join('')
const u = (n: number | string) => `u${typeof n === 'number' ? sub(n) : n === 'n' ? 'ₙ' : n === 'n+1' ? 'ₙ₊₁' : n}`
const must = (ok: boolean, what: string) => { if (!ok) throw new Error(`self-check failed: ${what}`) }

/** the first terms of a sequence as text */
const listTerms = (ts: Frac[], more = true) => `${ts.map(fm).join(', ')}${more ? ', …' : ''}`
/** a proper fraction between -1 and 1 (never 0, never ±1), for ratios of convergent series */
const properFrac = (r: () => number, negative = false): Frac => { const d = pick(r, [2, 3, 4, 5]); const n = ri(r, 1, d - 1); return fr(negative && r() < 0.5 ? -n : n, d) }

const ordinal = (n: number) => { const t = ['th', 'st', 'nd', 'rd'], v = n % 100; return `${n}${t[(v - 20) % 10] || t[v] || t[0]}` }
/** a Frac in brackets when negative */
const axText = (a: number) => (a === 1 ? 'x' : a === -1 ? `${MINUS}x` : `${MN(String(a))}x`)
const wf = (f: Frac) => (f.n < 0 ? `(${fm(f)})` : fm(f))
/** terms of a series as text: 3 + 1 − 1/3 … */
const seriesText = (ts: Frac[]) => `${ts.map((t, i) => (i === 0 ? fm(t) : `${t.n < 0 ? MINUS : '+'} ${fm(fr(Math.abs(t.n), t.d))}`)).join(' ')} + …`.replace(/(\S) \+ …$/, '$1 + …')
/** a closed form in n written for the screen */
const pn = (src: string) => src.replace(/-/g, MINUS).replace(/\^(\d)/g, (_, d: string) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])

/* ------------------------------------------------------------------ 1. sequences */

const SEQUENCES: Gen[] = [
  { lesson: 'sequences', level: 1, make: (r) => {
    // an arithmetic sequence: a term far along
    const a = ri(r, -12, 20), d = rnz(r, -7, 9), n = ri(r, 8, 40)
    const ts = [0, 1, 2, 3].map((k) => fr(a + k * d))
    const val = a + (n - 1) * d
    must(Array.from({ length: n }, (_, k) => a + k * d).pop() === val, 'arithmetic term')
    return numSpec(`The sequence ${listTerms(ts)} is arithmetic. Find the ${ordinal(n)} term.`, fr(val), 'In an arithmetic sequence each term adds the same common difference d: the nth term is a + (n − 1)d.', [
      `The first term is a = ${MN(String(a))} and the common difference is d = ${MN(String(ts[1].n / ts[1].d - a))}.`, `${u('n')} = a + (n − 1)d = ${MN(String(a))} + ${n - 1} × ${w(d)} = ${MN(String(val))}.`])
  } },
  { lesson: 'sequences', level: 1, make: (r) => {
    // a geometric sequence: a term
    const a = rnz(r, 1, 6) * (r() < 0.3 ? -1 : 1), rr = pick(r, [2, 3, -2, -3, 2, 3]), n = ri(r, 4, 9)
    const ts = [0, 1, 2, 3].map((k) => fr(a * rr ** k))
    const val = a * rr ** (n - 1)
    return numSpec(`The sequence ${listTerms(ts)} is geometric. Find the ${ordinal(n)} term.`, fr(val), 'In a geometric sequence each term multiplies by the same common ratio r: the nth term is a r^(n−1).', [
      `The first term is a = ${MN(String(a))} and the common ratio is r = ${MN(String(rr))}.`, `${u('n')} = a r^(n−1) = ${MN(String(a))} × ${w(rr)}^${n - 1} = ${MN(String(val))}.`])
  } },
  { lesson: 'sequences', level: 1, make: (r) => {
    // recognise the type
    const kind = pick(r, ['arithmetic', 'geometric', 'neither'] as const)
    let ts: number[]
    if (kind === 'arithmetic') { const a = ri(r, -5, 12), d = rnz(r, -6, 8); ts = [0, 1, 2, 3, 4].map((k) => a + k * d) }
    else if (kind === 'geometric') { const a = rnz(r, 1, 5), q = pick(r, [2, 3, -2, 4, -3]); ts = [0, 1, 2, 3, 4].map((k) => a * q ** k) }
    else { const t = pick(r, [0, 1, 2]); ts = t === 0 ? [1, 4, 9, 16, 25].map((x) => x + ri(r, 0, 1) * 0) : t === 1 ? [1, 1, 2, 3, 5] : [2, 5, 10, 17, 26] }
    return {
      prompt: `Is the sequence ${ts.map((x) => MN(String(x))).join(', ')}, … arithmetic, geometric or neither? (Type arithmetic, geometric or neither.)`, kind: 'word', answers: [], display: kind, input: kind, unit: '', needsExact: false, tol: 0,
      hint: 'Arithmetic: the differences between consecutive terms are all equal. Geometric: the ratios between consecutive terms are all equal.',
      explanation: [`Differences: ${ts.slice(1).map((x, i) => MN(String(x - ts[i]))).join(', ')}.`, `Ratios: ${ts.slice(1).map((x, i) => (ts[i] === 0 ? 'undefined' : fm(fr(x, ts[i])))).join(', ')}.`, kind === 'neither' ? 'Neither the differences nor the ratios are constant, so it is neither.' : kind === 'arithmetic' ? 'The differences are constant: arithmetic.' : 'The ratios are constant: geometric.'],
      pad: { pi: false, root: false, comma: false, extra: ['arithmetic', 'geometric', 'neither'] }, words: [kind],
    } as Spec
  } },
  { lesson: 'sequences', level: 2, make: (r) => {
    // two terms of an arithmetic sequence: find a and d
    const a = ri(r, -10, 15), d = rnz(r, -6, 8), p = ri(r, 2, 6), q = p + ri(r, 2, 6)
    const tp = a + (p - 1) * d, tq = a + (q - 1) * d
    return pairSpec(`An arithmetic sequence has ${u(p)} = ${MN(String(tp))} and ${u(q)} = ${MN(String(tq))}. Find the first term and the common difference. Give (a, d).`, fr(a), fr(d), 'Subtract the two terms: the difference of terms q − p apart is (q − p)d. Then find a from either term.', [
      `${u(q)} ${MINUS} ${u(p)} = (${q} ${MINUS} ${p})d, so ${MN(String(tq - tp))} = ${q - p}d and d = ${MN(String(d))}.`, `${u(p)} = a + ${p - 1}d, so a = ${MN(String(tp))} ${MINUS} ${p - 1} × ${w(d)} = ${MN(String(a))}.`])
  } },
  { lesson: 'sequences', level: 2, make: (r) => {
    // two terms of a geometric sequence: the ratio
    const a = rnz(r, 1, 5), q = pick(r, [2, 3, -2, -3, 4]), p = ri(r, 1, 3), k = ri(r, 2, 3)
    const tp = a * q ** (p - 1), tq = a * q ** (p - 1 + k)
    return numSpec(`A geometric sequence has ${u(p)} = ${MN(String(tp))} and ${u(p + k)} = ${MN(String(tq))}. Find a possible common ratio r (give a whole number).`, fr(q), `Divide the later term by the earlier: ${u(p + k)} / ${u(p)} = r^${k}. Then take the ${k === 2 ? 'square' : 'cube'} root.`, [
      `${u(p + k)} / ${u(p)} = ${MN(String(tq))} / ${w(tp)} = ${MN(String(q ** k))}, and this equals r^${k}.`, k === 2 ? `r² = ${q * q}, so r = ±${Math.abs(q)}. Both fit the two terms, and ${MN(String(q))} is one of them.` : `r³ = ${MN(String(q ** 3))}, so r = ${MN(String(q))}.`])
  } },
  { lesson: 'sequences', level: 2, make: (r) => {
    // a recurrence relation
    const m = pick(r, [2, 3, -1, -2, 1]), c = rnz(r, -5, 6), u1 = ri(r, -4, 6), n = ri(r, 4, 6)
    let t = u1
    const terms = [t]
    for (let k = 1; k < n; k++) { t = m * t + c; terms.push(t) }
    const rule = `${m === 1 ? '' : m === -1 ? MINUS : MN(String(m))}${u('n')} ${sgnText(c)}`
    return numSpec(`A sequence is defined by ${u('n+1')} = ${rule} with ${u(1)} = ${MN(String(u1))}. Find ${u(n)}.`, fr(t), 'A recurrence gives each term from the one before. Work out the terms one at a time.', [
      ...terms.slice(0, n).map((x, i) => (i === 0 ? `${u(1)} = ${MN(String(x))}.` : `${u(i + 1)} = ${MN(rule.replace(/uₙ/g, `(${terms[i - 1]})`))} = ${MN(String(x))}.`.replace(/\(([^)]*)\)/g, '($1)'))).slice(0, 5)])
  } },
  { lesson: 'sequences', level: 3, make: (r) => {
    // which term is equal to ...? (arithmetic or geometric)
    if (r() < 0.5) {
      const a = ri(r, -8, 12), d = rnz(r, 2, 7), n = ri(r, 12, 60), target = a + (n - 1) * d
      return numSpec(`The arithmetic sequence ${listTerms([0, 1, 2].map((k) => fr(a + k * d)))} has a term equal to ${MN(String(target))}. Which term is it? (Give the term number n.)`, fr(n), 'Set a + (n − 1)d equal to the value and solve for n.', [`${MN(String(a))} + (n ${MINUS} 1) × ${d} = ${MN(String(target))}.`, `(n ${MINUS} 1) × ${d} = ${MN(String(target - a))}, so n ${MINUS} 1 = ${(target - a) / d} and n = ${n}.`])
    }
    const a = pick(r, [1, 2, 3, 5]), q = pick(r, [2, 3]), n = ri(r, 6, 11), target = a * q ** (n - 1)
    return numSpec(`The geometric sequence ${listTerms([0, 1, 2].map((k) => fr(a * q ** k)))} has a term equal to ${target}. Which term is it? (Give the term number n.)`, fr(n), 'Set a r^(n−1) equal to the value, divide by a, and write the result as a power of r.', [`${a} × ${q}^(n−1) = ${target}.`, `${q}^(n−1) = ${target / a} = ${q}^${n - 1}, so n ${MINUS} 1 = ${n - 1} and n = ${n}.`])
  } },
  { lesson: 'sequences', level: 3, make: (r) => {
    // first term over a bound, or the first negative term
    const a = ri(r, 30, 90), d = -rnz(r, 3, 8)
    const n = Math.floor(a / -d) + 2
    must(a + (n - 1) * d < 0 && a + (n - 2) * d >= 0, 'first negative term')
    return numSpec(`The arithmetic sequence ${listTerms([0, 1, 2].map((k) => fr(a + k * d)))} is decreasing. Which is the first term that is negative? (Give the term number n.)`, fr(n), 'Solve a + (n − 1)d < 0 for n. The first whole number that satisfies it is the answer.', [
      `${a} + (n ${MINUS} 1) × (${MN(String(d))}) < 0, so (n ${MINUS} 1) × ${-d} > ${a}.`, `n ${MINUS} 1 > ${Number((a / -d).toFixed(2))}, so the smallest whole n is ${n}.`, `Check: ${u(n)} = ${MN(String(a + (n - 1) * d))}, which is negative, while ${u(n - 1)} = ${MN(String(a + (n - 2) * d))} is not.`])
  } },
]

const w = (n: number) => (n < 0 ? `(${MN(String(n))})` : String(n))

/* ------------------------------------------------------------------ 2. arithmetic and geometric series */

const SERIES: Gen[] = [
  { lesson: 'series', level: 1, make: (r) => {
    const a = ri(r, -6, 15), d = rnz(r, -4, 8), n = ri(r, 8, 30)
    const S = (n * (2 * a + (n - 1) * d)) / 2
    must(S === Array.from({ length: n }, (_, k) => a + k * d).reduce((x, y) => x + y, 0), 'arithmetic sum')
    return numSpec(`Find the sum of the first ${n} terms of the arithmetic series ${listTerms([0, 1, 2].map((k) => fr(a + k * d)))}`, fr(S), 'Use S_n = n/2 (2a + (n − 1)d), or n/2 (first term + last term).', [
      `a = ${MN(String(a))}, d = ${MN(String(d))}, n = ${n}.`, `S = ${n}/2 × (2 × ${w(a)} + ${n - 1} × ${w(d)}) = ${n / 2} × ${w(2 * a + (n - 1) * d)} = ${MN(String(S))}.`])
  } },
  { lesson: 'series', level: 1, make: (r) => {
    const a = rnz(r, 1, 5), q = pick(r, [2, 3, -2, 2, 3]), n = ri(r, 5, 9)
    const terms = Array.from({ length: n }, (_, k) => a * q ** k)
    const S = terms.reduce((x, y) => x + y, 0)
    must(S === (a * (q ** n - 1)) / (q - 1), 'geometric sum')
    return numSpec(`Find the sum of the first ${n} terms of the geometric series ${listTerms([0, 1, 2].map((k) => fr(a * q ** k)))}`, fr(S), 'Use S_n = a(1 − rⁿ)/(1 − r), or equivalently a(rⁿ − 1)/(r − 1).', [
      `a = ${a} and r = ${MN(String(q))}.`, `S = ${a}(1 ${MINUS} ${w(q)}^${n}) / (1 ${MINUS} ${w(q)}) = ${a} × ${w(1 - q ** n)} / ${w(1 - q)} = ${MN(String(S))}.`])
  } },
  { lesson: 'series', level: 2, make: (r) => {
    // infinite geometric series
    const a = rnz(r, 1, 12), rr = properFrac(r, true)
    const S = fDiv(fr(a), fSub(fr(1), rr))
    let partial = 0, t = a
    for (let k = 0; k < 200; k++) { partial += t; t *= fNum(rr) }
    must(Math.abs(partial - fNum(S)) < 1e-6, 'infinite geometric sum')
    return numSpec(`Find the sum to infinity of the geometric series ${seriesText([fr(a), fMul(fr(a), rr), fMul(fr(a), fMul(rr, rr))])}`, S, 'A geometric series converges when |r| < 1, and then S∞ = a / (1 − r).', [
      `The first term is a = ${a} and the ratio is r = ${fm(rr)}, with |r| < 1, so the series converges.`, `S∞ = a / (1 ${MINUS} r) = ${a} / (1 ${MINUS} ${wf(rr)}) = ${fm(S)}.`])
  } },
  { lesson: 'series', level: 2, make: (r) => {
    // how many terms to reach a sum
    const a = ri(r, 2, 10), d = ri(r, 2, 6), n = ri(r, 6, 20), S = (n * (2 * a + (n - 1) * d)) / 2
    return exactSet(`The arithmetic series ${a} + ${a + d} + ${a + 2 * d} + … has a sum of ${S}. How many terms are there?`, [exF(fr(n))], 'n',
      'Put the sum formula equal to the given sum. You get a quadratic in n: solve it and reject any root that is negative or not a whole number.', [
        `S = n/2 (2 × ${a} + (n ${MINUS} 1) × ${d}) = ${S}.`, `Multiply out: n(${2 * a - d} + ${d}n) = ${2 * S}, so ${d}n² + ${2 * a - d}n ${MINUS} ${2 * S} = 0.`, `The positive whole-number root is n = ${n}. (The other root is negative, so it is rejected.)`])
  } },
  { lesson: 'series', level: 2, make: (r) => {
    // find r from the sum to infinity
    const a = pick(r, [3, 4, 5, 6, 8, 9, 10]), r0 = properFrac(r)
    const S = fDiv(fr(a), fSub(fr(1), r0))
    return numSpec(`A geometric series has first term ${a} and a sum to infinity of ${fm(S)}. Find the common ratio.`, r0, 'Use S∞ = a / (1 − r) and solve for r: r = 1 − a / S∞.', [`${fm(S)} = ${a} / (1 ${MINUS} r), so 1 ${MINUS} r = ${a} ÷ ${wf(S)} = ${fm(fDiv(fr(a), S))}.`, `r = 1 ${MINUS} ${fm(fDiv(fr(a), S))} = ${fm(r0)}.`])
  } },
  { lesson: 'series', level: 3, make: (r) => {
    // multiples of k up to a limit
    const k = pick(r, [3, 4, 6, 7, 9, 11, 13]), lim = pick(r, [100, 150, 200, 300, 500, 1000])
    const n = Math.floor(lim / k), S = (k * n * (n + 1)) / 2
    must(S === Array.from({ length: n }, (_, i) => (i + 1) * k).reduce((x, y) => x + y, 0), 'multiples sum')
    return numSpec(`Find the sum of all the multiples of ${k} that are less than or equal to ${lim}.`, fr(S), 'The multiples form an arithmetic series k, 2k, 3k, …. Find how many there are, then use the sum formula.', [
      `The multiples are ${k}, ${2 * k}, ${3 * k}, …, ${n * k}. There are ⌊${lim} / ${k}⌋ = ${n} of them.`, `S = n/2 (first + last) = ${n}/2 × (${k} + ${n * k}) = ${S}.`])
  } },
  { lesson: 'series', level: 3, make: (r) => {
    // a loan or saving: geometric series in context
    const dep = pick(r, [100, 200, 500, 1000]), rate = pick(r, [2, 4, 5, 8]), yrs = ri(r, 5, 12)
    const q = 1 + rate / 100
    let total = 0
    for (let k = 1; k <= yrs; k++) total += dep * q ** k
    const closed = (dep * q * (q ** yrs - 1)) / (q - 1)
    must(Math.abs(total - closed) < 1e-6, 'savings annuity')
    const shown = Math.round(total * 100) / 100
    return {
      prompt: `${dep} dollars is saved at the start of each year for ${yrs} years, earning ${rate}% interest compounded annually. How much is in the account at the end of year ${yrs}? Give your answer to the nearest cent.`, kind: 'value', answers: [shown], display: shown.toFixed(2), input: shown.toFixed(2), unit: '', needsExact: false, tol: 0.006,
      hint: 'The first deposit grows for the whole time, the next for one year less, and so on. The amounts form a geometric series.', explanation: [
        `The deposit made at the start of year k grows for ${yrs} − k + 1 years, so the total is ${dep}(${q.toFixed(2)} + ${q.toFixed(2)}² + … + ${q.toFixed(2)}^${yrs}).`, `This is a geometric series with first term ${dep} × ${q.toFixed(2)}, ratio ${q.toFixed(2)} and ${yrs} terms.`, `S = ${dep} × ${q.toFixed(2)} × (${q.toFixed(2)}^${yrs} − 1) / ${(q - 1).toFixed(2)} = ${shown.toFixed(2)}.`],
      pad: { pi: false, root: false, comma: false, alg: true },
    } as Spec
  } },
]

/* ------------------------------------------------------------------ 3. sigma notation and proof */

const polyIn = (src: string) => fmtPoly(parsePoly(src), true).replace(/x/g, 'n')

const SIGMA: Gen[] = [
  { lesson: 'sigma-induction', level: 1, make: (r) => {
    // evaluate a sigma sum
    const kind = ri(r, 1, 3), n = ri(r, 5, 12), m = rnz(r, 1, 4), c = rnz(r, -5, 6)
    let total = 0, text = '', how = ''
    for (let k = 1; k <= n; k++) total += kind === 1 ? m * k + c : kind === 2 ? k * k : k * (k + 1)
    if (kind === 1) { text = `${m === 1 ? '' : m}k ${sgnText(c)}`; how = `The sum splits into ${m === 1 ? '' : `${m} × `}Σk ${sgnText(c)} × ${n} (there are ${n} terms), which is ${m === 1 ? '' : `${m} × `}${(n * (n + 1)) / 2} ${sgnText(c * n)}.` }
    else if (kind === 2) { text = 'k²'; how = `Use Σk² = n(n + 1)(2n + 1)/6 = ${n} × ${n + 1} × ${2 * n + 1} / 6.` }
    else { text = 'k(k + 1)'; how = 'Expand k(k + 1) = k² + k and add Σk² and Σk.' }
    return numSpec(`Evaluate Σ (${text}) for k = 1 to ${n}.`, fr(total), 'Use the standard sums Σk = n(n + 1)/2 and Σk² = n(n + 1)(2n + 1)/6, and split the sum into pieces.', [how, `The total is ${MN(String(total))}.`])
  } },
  { lesson: 'sigma-induction', level: 1, make: (r) => {
    // write a sum in sigma form: sum of the first n terms: pick the right limit/value
    const a = ri(r, 1, 9), d = ri(r, 2, 6), n = ri(r, 4, 9)
    const last = a + (n - 1) * d
    const S = (n * (a + last)) / 2
    return numSpec(`Evaluate Σ (${d}k${a === d ? '' : ` ${sgnText(a - d)}`}) for k = 1 to ${n}. (It is the series ${a} + ${a + d} + ${a + 2 * d} + … + ${last}.)`, fr(S), 'Each term is a term of an arithmetic series: the sum is n/2 (first + last).', [`The first term (k = 1) is ${a} and the last (k = ${n}) is ${last}.`, `S = ${n}/2 × (${a} + ${last}) = ${S}.`])
  } },
  { lesson: 'sigma-induction', level: 2, make: (r) => {
    // closed form of a sum in n
    const a = rnz(r, 1, 6), b = rnz(r, -6, 8)
    const answer = polyIn(`(${a}/2)x^2+(${a}/2+(${b}))x`)
    const source = `${a}n(n+1)/2+(${b})n`
    const e = alg('equiv', `Find a simple formula in n for Σ (${a === 1 ? '' : a}k ${sgnText(b)}) from k = 1 to n.`, source, answer, 'Split the sum: a Σk + b Σ1, using Σk = n(n + 1)/2 and Σ1 = n (n ones).', [
      `Σ (${a}k ${sgnText(b)}) = ${a} Σk ${sgnText(b)} Σ1.`, `= ${a} × n(n + 1)/2 ${sgnText(b)}n.`, `= ${MN(answer)}.`])
    const check = (n: number) => { let t = 0; for (let k = 1; k <= n; k++) t += a * k + b; return t }
    must([1, 2, 5, 9].every((n) => Math.abs(check(n) - (a * n * (n + 1)) / 2 - b * n) < 1e-9), 'closed form')
    return { ...e, display: pn(answer) }
  } },
  { lesson: 'sigma-induction', level: 2, make: (r) => {
    // sum of squares between two limits
    const lo = ri(r, 3, 9), hi = lo + ri(r, 4, 12)
    let total = 0
    for (let k = lo; k <= hi; k++) total += k * k
    return numSpec(`Evaluate Σ k² for k = ${lo} to ${hi}.`, fr(total), `Write it as the sum to ${hi} minus the sum to ${lo - 1}, using Σk² = n(n + 1)(2n + 1)/6.`, [
      `Σ from 1 to ${hi} = ${hi} × ${hi + 1} × ${2 * hi + 1} / 6 = ${(hi * (hi + 1) * (2 * hi + 1)) / 6}.`, `Σ from 1 to ${lo - 1} = ${lo - 1} × ${lo} × ${2 * lo - 1} / 6 = ${((lo - 1) * lo * (2 * lo - 1)) / 6}.`, `Subtract: ${total}.`])
  } },
  { lesson: 'sigma-induction', level: 3, make: (r) => {
    // closed form of a quadratic or product sum
    const kind = ri(r, 1, 9)
    const specs: { text: string; answer: string; f: (k: number) => number }[] = [
      { text: 'k(k + 1)', answer: 'n(n+1)(n+2)/3', f: (k) => k * (k + 1) }, { text: '(2k − 1)²', answer: 'n(2n-1)(2n+1)/3', f: (k) => (2 * k - 1) ** 2 }, { text: 'k(k + 2)', answer: 'n(n+1)(2n+7)/6', f: (k) => k * (k + 2) },
      { text: 'k(k + 3)', answer: 'n(n+1)(n+5)/3', f: (k) => k * (k + 3) }, { text: 'k(2k − 1)', answer: 'n(n+1)(4n-1)/6', f: (k) => k * (2 * k - 1) }, { text: 'k³', answer: 'n^2(n+1)^2/4', f: (k) => k ** 3 },
      { text: '(k + 1)²', answer: 'n(2n^2+9n+13)/6', f: (k) => (k + 1) ** 2 }, { text: '3k² − 1', answer: 'n(2n^2+3n-1)/2', f: (k) => 3 * k * k - 1 }, { text: '(k + 1)(k + 2)', answer: 'n(n^2+6n+11)/3', f: (k) => (k + 1) * (k + 2) },
    ]
    const s = specs[kind - 1]
    for (const n of [1, 2, 3, 6, 10]) { let t = 0; for (let k = 1; k <= n; k++) t += s.f(k); must(Math.abs(t - Number(Function('n', `return ${s.answer.replace(/\^/g, '**').replace(/(\d)n/g, '$1*n').replace(/\)\(/g, ')*(').replace(/n\(/g, 'n*(').replace(/\)n/g, ')*n').replace(/(\d)\(/g, '$1*(')}`)(n))) < 1e-9, `closed form ${s.text}`) }
    const e = alg('equiv', `Find a formula in n for Σ ${s.text} from k = 1 to n. (Any equivalent form is accepted.)`, s.answer, s.answer, 'Expand the bracket, split into Σk² and Σk (and Σ1), and use the standard formulas. Check your answer at n = 1.', [
      'Expand the term and split the sum into standard sums Σk², Σk and Σ1.', `Add them up and factorise: Σ ${s.text} = ${s.answer.replace(/\*/g, '')}.`, `Check n = 1: the sum is ${s.f(1)}, and the formula gives the same.`])
    return { ...e, display: pn(s.answer) }
  } },
  { lesson: 'sigma-induction', level: 3, make: (r) => {
    // telescoping series: closed form (d = 1) or sum to infinity (d > 1)
    const d = pick(r, [1, 1, 2, 3, 4, 5]), c = pick(r, [1, 1, 2, 3, 4])
    const text = `${c === 1 ? '1' : c}/(k(k + ${d}))`.replace('(k + 1)', '(k + 1)')
    if (d !== 1) {
      let h = fr(0)
      for (let k = 1; k <= d; k++) h = fAdd(h, fr(1, k))
      const val = fMul(fr(c), fDiv(h, fr(d)))
      let t = 0
      for (let k = 1; k <= 40000; k++) t += c / (k * (k + d))
      must(Math.abs(t - fNum(val)) < 1e-3, 'telescoping infinite sum')
      return numSpec(`Find the sum to infinity of the series Σ ${text} for k = 1 to ∞.`, val, `Split with partial fractions: 1/(k(k + ${d})) = (1/${d})(1/k − 1/(k + ${d})). Most terms cancel (the series telescopes).`, [
        `${text} = ${c === 1 ? '' : `${c} × `}(1/${d})(1/k ${MINUS} 1/(k + ${d})).`, `Adding, all terms cancel except the first ${d} of the 1/k parts: the sum is ${c === 1 ? '' : `${c} × `}(1/${d})(${Array.from({ length: d }, (_, i) => `1/${i + 1}`).join(' + ')}).`, `S = ${fm(val)}.`])
    }
    const answer = `${c}n/(n+1)`
    const e = alg('rational', `Find a formula in n for Σ ${text} from k = 1 to n, as a single fraction.`, answer, answer, 'Split 1/(k(k + 1)) = 1/k − 1/(k + 1) by partial fractions. Then write out the first few terms and see which cancel.', [
      `${text} = ${c === 1 ? '' : `${c}(`}1/k ${MINUS} 1/(k + 1)${c === 1 ? '' : ')'}.`, `Add: (1 ${MINUS} 1/2) + (1/2 ${MINUS} 1/3) + … + (1/n ${MINUS} 1/(n + 1)). Everything cancels except the first and last pieces.`, `The sum is ${c === 1 ? '' : `${c}(`}1 ${MINUS} 1/(n + 1)${c === 1 ? '' : ')'} = ${c === 1 ? '' : c}n/(n + 1).`])
    must([1, 2, 5, 9].every((n) => { let t = 0; for (let k = 1; k <= n; k++) t += c / (k * (k + 1)); return Math.abs(t - (c * n) / (n + 1)) < 1e-12 }), 'telescoping closed form')
    return { ...e, display: `${c === 1 ? '' : c}n/(n + 1)` }
  } },
]

/* ------------------------------------------------------------------ 4. the binomial theorem */

const choose = (n: number, k: number): number => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }
const pascal = (n: number, k: number): number => { let row = [1]; for (let i = 0; i < n; i++) row = [1, ...row.slice(1).map((x, j) => x + row[j]), 1].slice(0, i + 2); return row[k] }

const BIN: Gen[] = [
  { lesson: 'binomial-theorem', level: 1, make: (r) => {
    const n = ri(r, 4, 14), k = ri(r, 2, Math.floor(n / 2))
    must(choose(n, k) === pascal(n, k), 'nCr')
    return numSpec(`Evaluate ${n}C${k} (the number of ways of choosing ${k} items from ${n}).`, fr(choose(n, k)), `Use nCr = n! / (r!(n − r)!), cancelling before you multiply.`, [`${n}C${k} = ${n}! / (${k}! × ${n - k}!).`, `= ${Array.from({ length: k }, (_, i) => n - i).join(' × ')} / ${Array.from({ length: k }, (_, i) => k - i).join(' × ')} = ${choose(n, k)}.`])
  } },
  { lesson: 'binomial-theorem', level: 1, make: (r) => {
    // expand (x + a)^n
    const n = ri(r, 3, 5), a = rnz(r, -4, 4)
    const src = `(x+(${a}))^${n}`
    const answer = fmtPoly(parsePoly(src), true)
    const coeffs = Array.from({ length: n + 1 }, (_, k) => choose(n, k))
    must(rEq(parseRat(answer), parseRat(src)), 'expansion')
    const e = alg('poly', `Expand (x ${sgnText(a)})${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]} fully.`, src, answer, 'Use the binomial theorem with the row of Pascal\'s triangle for this power, and the powers of a.', [
      `The row of Pascal's triangle for n = ${n} is ${coeffs.join(', ')}.`, `Multiply each coefficient by a power of ${MN(String(a))}: ${coeffs.map((c, k) => `${c}·x^${n - k}·(${MN(String(a))})^${k}`).join(' + ')}.`.replace(/x\^1/g, 'x').replace(/·x\^0/g, '').replace(/\^1\b/g, '').replace(/·\(([^)]*)\)\^0/g, ''), `Simplify: ${MN(answer)}.`])
    return { ...e, display: answer.replace(/-/g, MINUS).replace(/\^(\d)/g, (_, d: string) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]) }
  } },
  { lesson: 'binomial-theorem', level: 2, make: (r) => {
    // coefficient of x^k in (a x + b)^n
    const n = ri(r, 4, 9), a = pick(r, [1, 2, 3, -1, -2]), b = rnz(r, -3, 4), k = ri(r, 1, n - 1)
    const val = choose(n, k) * a ** k * b ** (n - k)
    const brute = fNum(parsePolyCoeff(`(${a}x+(${b}))^${n}`, k))
    must(Math.abs(brute - val) < 1e-6, 'binomial coefficient')
    return numSpec(`Find the coefficient of x${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]} in the expansion of (${a === 1 ? '' : a === -1 ? MINUS : MN(String(a))}x ${sgnText(b)})${n > 9 ? `^${n}` : '⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}.`, fr(val), 'The term in x^k is nCk (ax)^k b^(n−k). Take the coefficient of x^k.', [
      `General term: ${n}C${k} (${axText(a)})^${k} (${MN(String(b))})^${n - k}.`, `Coefficient: ${choose(n, k)} × (${MN(String(a))})^${k} × (${MN(String(b))})^${n - k} = ${MN(String(val))}.`])
  } },
  { lesson: 'binomial-theorem', level: 2, make: (r) => {
    // the term in x^k as an expression
    const n = ri(r, 5, 8), a = pick(r, [1, 2, 3]), b = rnz(r, -3, 3), k = ri(r, 2, n - 1)
    const coef = choose(n, k) * a ** k * b ** (n - k)
    const answer = `${coef}x^${k}`
    const e = alg('equiv', `Find the term in x${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]} in the expansion of (${a === 1 ? '' : a}x ${sgnText(b)})${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}.`, answer, answer, 'The term in x^k is nCk (ax)^k b^(n−k): write it as a number times x^k.', [
      `The term is ${n}C${k} (${a === 1 ? '' : a}x)^${k} (${MN(String(b))})^${n - k}.`, `= ${choose(n, k)} × ${a ** k} x^${k} × ${MN(String(b ** (n - k)))} = ${MN(String(coef))}x^${k}.`])
    return { ...e, display: `${MN(String(coef))}x${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]}` }
  } },
  { lesson: 'binomial-theorem', level: 3, make: (r) => {
    // a product of two binomials: a coefficient
    const n1 = ri(r, 3, 6), n2 = ri(r, 2, 4), a = pick(r, [1, 2, -1, -2]), b = pick(r, [1, 2, 3, -1, -2]), k = ri(r, 1, 4)
    const src = `(1+(${a})x)^${n1}*(2+(${b})x)^${n2}`
    const coeff = parsePolyCoeff(src, k)
    let direct = 0
    for (let i = 0; i <= Math.min(k, n1); i++) { const j = k - i; if (j <= n2) direct += choose(n1, i) * a ** i * choose(n2, j) * b ** j * 2 ** (n2 - j) }
    must(Math.abs(fNum(coeff) - direct) < 1e-6, 'product coefficient')
    const term = (c0: number, c1: number) => `${c0} ${c1 < 0 ? MINUS : '+'} ${Math.abs(c1) === 1 ? '' : Math.abs(c1)}x`
    const supN = (n: number) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[n]
    const polyText = (cs: number[]) => cs.map((c, i) => { const mag = Math.abs(c), body = i === 0 ? String(mag) : `${mag === 1 ? '' : mag}x${i > 1 ? supN(i) : ''}`; return i === 0 ? `${c < 0 ? MINUS : ''}${body}` : ` ${c < 0 ? MINUS : '+'} ${body}` }).join('')
    const series = (c0: number, c1: number, n: number) => polyText(Array.from({ length: Math.min(k, n) + 1 }, (_, i) => choose(n, i) * c0 ** (n - i) * c1 ** i))
    return numSpec(`Find the coefficient of x${supN(k)} in the expansion of (${term(1, a)})${supN(n1)}(${term(2, b)})${supN(n2)}.`, coeff, 'Expand each bracket as far as x^k, then collect the ways of making x^k: a term in x^i from the first with a term in x^(k−i) from the second.', [
      `First bracket: (${term(1, a)})${supN(n1)} = ${series(1, a, n1)} + …`, `Second bracket: (${term(2, b)})${supN(n2)} = ${series(2, b, n2)} + …`, `Multiply, and pick out the pairs of terms whose powers of x add to ${k}. The coefficient of x${supN(k)} is ${MN(String(direct))}.`])
  } },
  { lesson: 'binomial-theorem', level: 3, make: (r) => {
    // the constant term in (x + c/x)^n or an approximation with (1 + x)^n
    if (r() < 0.5) {
      const n = pick(r, [4, 6, 8, 10]), c = pick(r, [1, 2, 3, -1, -2]), k = n / 2
      const val = choose(n, k) * c ** k
      return numSpec(`Find the constant term (the term independent of x) in the expansion of (x ${sgnText(c)}/x)^${n}.`.replace('+ 1/x', '+ 1/x'), fr(val), 'In the general term the power of x is (n − k) − k = n − 2k. The constant term is where n − 2k = 0.', [
        `General term: ${n}C_k x^(${n}−k) (${MN(String(c))}/x)^k = ${n}C_k (${MN(String(c))})^k x^(${n}−2k).`, `The power is zero when k = ${n / 2}.`, `Constant term = ${n}C${k} × (${MN(String(c))})^${k} = ${choose(n, k)} × ${MN(String(c ** k))} = ${MN(String(val))}.`])
    }
    const p = pick(r, [1.01, 1.02, 1.03, 0.98, 0.99]), n = ri(r, 5, 12), x = p - 1
    const approx = 1 + n * x + (n * (n - 1) / 2) * x * x + ((n * (n - 1) * (n - 2)) / 6) * x ** 3
    return {
      prompt: `Use the first four terms of the binomial expansion of (1 + x)^${n} to estimate ${p}^${n}, taking x = ${Number(x.toFixed(2))}. Give your answer to 5 decimal places.`, kind: 'approx', answers: [approx], display: `≈ ${approx.toFixed(5)}`, input: approx.toFixed(5), unit: '', needsExact: false, tol: 5.5e-6,
      hint: '(1 + x)^n = 1 + nx + n(n − 1)/2 · x² + n(n − 1)(n − 2)/6 · x³ + …, which is accurate when x is small.', explanation: [
        `x = ${Number(x.toFixed(2))} and n = ${n}.`, `1 + ${n}x + ${(n * (n - 1)) / 2}x² + ${(n * (n - 1) * (n - 2)) / 6}x³ with x = ${Number(x.toFixed(2))}.`, `= ${approx.toFixed(5)}. (The exact value is ${(p ** n).toFixed(5)}.)`],
      pad: { pi: false, root: false, comma: false, alg: true },
    } as Spec
  } },
]

/** the coefficient of x^k in an ASCII polynomial, by the algebra engine (independent of the binomial formula) */
function parsePolyCoeff(src: string, k: number): Frac {
  const p = parsePoly(src)
  const t = p.find((t) => (t.e.x ?? 0) === k)
  return t ? t.c : fr(0)
}

/* ------------------------------------------------------------------ 5. limits of sequences */

const LIMITS: Gen[] = [
  { lesson: 'sequence-limits', level: 1, make: (r) => {
    // the limit of a rational expression in n
    const kind = ri(r, 1, 3)
    const a = rnz(r, 1, 6), c = rnz(r, 1, 5), b = rnz(r, -5, 5)
    let d = rnz(r, -5, 5)
    if (a === c && b === d) d += 1 + (d === -1 ? 1 : 0)
    const deg = pick(r, [1, 2])
    const pw = deg === 2 ? 'n²' : 'n'
    const num = `${a}${pw} ${sgnText(b)}`, den = `${c}${pw} ${sgnText(d)}`
    const over = (v: number) => `${v < 0 ? MINUS : '+'} ${Math.abs(v)}/${pw}`
    if (kind === 1) {
      const val = fr(a, c)
      return numSpec(`Find the limit of (${num}) / (${den}) as n → ∞.`, val, 'Divide the top and bottom by the highest power of n. Terms like 1/n and 1/n² tend to 0.', [`Divide top and bottom by ${pw}: (${a} ${over(b)}) / (${c} ${over(d)}).`, `As n → ∞ the fractions tend to 0, leaving ${a}/${c}${fm(val) === `${a}/${c}` ? '' : ` = ${fm(val)}`}.`])
    }
    if (kind === 2) {
      return numSpec(`Find the limit of (${a}n ${sgnText(b)}) / (${c}n² ${sgnText(d)}) as n → ∞.`, fr(0), 'The denominator grows faster than the numerator (degree 2 against degree 1), so the fraction tends to 0.', [`Divide top and bottom by n²: (${a}/n ${b < 0 ? MINUS : '+'} ${Math.abs(b)}/n²) / (${c} ${d < 0 ? MINUS : '+'} ${Math.abs(d)}/n²).`, `The numerator tends to 0 and the denominator to ${c}, so the limit is 0.`])
    }
    return {
      prompt: `Find the limit of (${a}n² ${sgnText(b)}) / (${c}n ${sgnText(d)}) as n → ∞. If it grows without bound, type infinity.`, kind: 'value', answers: [null], display: '∞ (it grows without bound)', input: 'infinity', unit: '', needsExact: false, tol: 0,
      hint: 'Compare the degrees: if the top has the higher degree the fraction grows without bound.', explanation: ['The numerator has degree 2 and the denominator degree 1.', `Dividing top and bottom by n: (${a}n ${b < 0 ? MINUS : '+'} ${Math.abs(b)}/n) / (${c} ${d < 0 ? MINUS : '+'} ${Math.abs(d)}/n), which grows like ${a}n/${c} without bound. So there is no finite limit: the sequence diverges to ∞.`],
      pad: { pi: false, root: false, comma: false, alg: true },
    } as Spec
  } },
  { lesson: 'sequence-limits', level: 1, make: (r) => {
    // a geometric sequence: does it converge?
    const q = r() < 0.5 ? properFrac(r, true) : (() => { const [n, d] = pick(r, [[3, 2], [4, 3], [5, 2], [5, 3], [7, 4], [2, 1], [3, 1]] as [number, number][]); return fr(r() < 0.5 ? -n : n, d) })()
    const conv = Math.abs(fNum(q)) < 1
    if (conv) return numSpec(`Find the limit of the sequence (${fm(q)})ⁿ as n → ∞.`, fr(0), 'A geometric sequence rⁿ tends to 0 when |r| < 1.', [`|${fm(q)}| < 1, so each multiplication makes the terms smaller in size.`, 'The limit is 0.'])
    return {
      prompt: `Find the limit of the sequence (${fm(q)})ⁿ as n → ∞. If it does not settle to one number, type diverges.`, kind: 'value', answers: [null], display: 'diverges', input: 'diverges', unit: '', needsExact: false, tol: 0, hint: 'rⁿ tends to 0 only when |r| < 1. If |r| > 1 the terms grow in size.',
      explanation: [`|${fm(q)}| > 1, so the terms grow in size without bound${fNum(q) < 0 ? ' (and alternate in sign)' : ''}.`, 'The sequence does not settle to a single number: it diverges.'], pad: { pi: false, root: false, comma: false, alg: true },
    } as Spec
  } },
  { lesson: 'sequence-limits', level: 2, make: (r) => {
    // the limit of a recurrence is the fixed point
    const m = properFrac(r, true), c = rnz(r, -6, 9)
    const L = fDiv(fr(c), fSub(fr(1), m))
    let t = 1
    for (let k = 0; k < 400; k++) t = fNum(m) * t + c
    must(Math.abs(t - fNum(L)) < 1e-9, 'fixed point')
    const mc = `(${fm(m)})`
    const gap = fSub(fr(1), m)
    return numSpec(`A sequence is defined by ${u('n+1')} = ${mc}${u('n')} ${sgnText(c)}, with ${u(1)} = 1. It converges. Find its limit.`, L, 'If the sequence converges to L, then both uₙ and uₙ₊₁ tend to L, so L = (the rule applied to L). Solve for L.', [
      `If uₙ → L then uₙ₊₁ → L as well, so L = ${mc}L ${sgnText(c)}.`, `L(1 ${MINUS} ${wf(m)}) = ${MN(String(c))}, so L = ${MN(String(c))} ÷ (${fm(gap)}) = ${fm(L)}.`])
  } },
  { lesson: 'sequence-limits', level: 2, make: (r) => {
    // the squeeze theorem with a bounded oscillation
    const k = ri(r, 1, 6), fn = pick(r, ['sin n', 'cos n', '(−1)ⁿ'])
    const kind = ri(r, 1, 2)
    const text = kind === 1 ? `(${k}n + ${fn}) / n` : `(${k}n² ${fn === 'sin n' ? '+' : '−'} ${fn}) / n²`
    return numSpec(`Find the limit of ${text} as n → ∞.`, fr(k), `The oscillating part (${fn}) is always between −1 and 1. Divide through, and squeeze that term between −1/n${kind === 1 ? '' : '²'} and 1/n${kind === 1 ? '' : '²'}.`, [
      kind === 1 ? `Split: ${k} + ${fn} / n.` : `Split: ${k} ${fn === 'sin n' ? '+' : MINUS} ${fn} / n².`, `Since −1 ≤ ${fn} ≤ 1, the term ${fn} / n${kind === 1 ? '' : '²'} lies between −1/n${kind === 1 ? '' : '²'} and 1/n${kind === 1 ? '' : '²'}, and both bounds tend to 0, so it tends to 0 (squeeze theorem).`, `The limit is ${k}.`])
  } },
  { lesson: 'sequence-limits', level: 3, make: (r) => {
    // a limit that needs algebra: difference of roots, or ratio of sums
    const kind = ri(r, 1, 2)
    if (kind === 1) {
      // sum of the first n terms of an arithmetic series over n^2
      const a = ri(r, 1, 5)
      let d = ri(r, 1, 6)
      if (2 * a === d) d += 1
      const val = fr(d, 2)
      return numSpec(`Let S_n be the sum of the first n terms of the arithmetic series with first term ${a} and common difference ${d}. Find the limit of S_n / n² as n → ∞.`, val, 'S_n = n/2 (2a + (n − 1)d) is a quadratic in n. Divide by n² and let n → ∞.', [
        `S_n = n/2 (${2 * a} + (n ${MINUS} 1) × ${d}) = (${d}n² ${2 * a - d < 0 ? MINUS : '+'} ${Math.abs(2 * a - d)}n)/2.`, `S_n / n² = (${d} ${2 * a - d < 0 ? MINUS : '+'} ${Math.abs(2 * a - d)}/n) / 2, which tends to ${d}/2 as n → ∞.`])
    }
    // sum of the geometric series partial sums
    const q = properFrac(r), a = ri(r, 1, 9)
    const L = fDiv(fr(a), fSub(fr(1), q))
    return numSpec(`Let S_n = ${a} + ${fm(fMul(fr(a), q))} + ${fm(fMul(fr(a), fMul(q, q)))} + … be the sum of the first n terms of a geometric series. Find the limit of S_n as n → ∞.`, L, 'S_n = a(1 − rⁿ)/(1 − r). As n → ∞, rⁿ → 0 because |r| < 1.', [`S_n = ${a}(1 ${MINUS} (${fm(q)})ⁿ) / (1 ${MINUS} ${fm(q)}).`, `As n → ∞ the term (${fm(q)})ⁿ tends to 0, so S_n → ${a} / (1 ${MINUS} ${fm(q)}) = ${fm(L)}.`])
  } },
  { lesson: 'sequence-limits', level: 3, make: (r) => {
    // the positive fixed point of a square-root recurrence: u_{n+1} = sqrt(a u_n + b)
    for (;;) {
      const L = ri(r, 2, 9), a = ri(r, 1, 6)
      const b = L * L - a * L
      if (b <= 0 || b > 80) continue
      let t = 1
      for (let k = 0; k < 400; k++) t = Math.sqrt(a * t + b)
      must(Math.abs(t - L) < 1e-8, 'sqrt recurrence')
      return numSpec(`A sequence is defined by ${u('n+1')} = √(${a === 1 ? '' : a}${u('n')} + ${b}), with ${u(1)} = 1. It converges. Find its limit.`, fr(L), 'If uₙ → L then L = √(aL + b). Square both sides and solve the quadratic; the limit cannot be negative because the terms are square roots.', [
        `L = √(${a === 1 ? '' : a}L + ${b}), so L² = ${a === 1 ? '' : a}L + ${b}, i.e. L² ${MINUS} ${a === 1 ? '' : a}L ${MINUS} ${b} = 0.`, `The roots are L = ${L} and L = ${MN(String(a - L))}. The limit is not negative (each term is a square root), so L = ${L}.`])
    }
  } },
]

export const SEQ_GENS: Gen[] = [...SEQUENCES, ...SERIES, ...SIGMA, ...BIN, ...LIMITS]
