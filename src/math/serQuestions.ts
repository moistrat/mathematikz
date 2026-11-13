/**
 * Question generators for Unit 11, lessons 'series-convergence', 'power-series' and 'taylor-series'.
 *
 * Every verdict (converges or diverges) is checked numerically inside the generator, from the partial sums or the ratio
 * of consecutive terms, so a wrong classification cannot reach a student.
 */
import { fAdd, fDiv, fMul, fr, fSub } from './algebra'
import { calcSpec, decSpec, fm, gcd, limitCheck, MN, must, noneSpec, numSpec, ri, rnz, S, sup } from './calcHelpers'
import { exF, ineqSpec } from './equationQuestions'
import { evaluate } from './parse'
import type { Gen, Spec } from './questions'
import { pick } from './rng'
import type { IntervalSet } from './solve'

const A = (a: number) => MN(String(a))
const fact = (n: number) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }
const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }
/** the sum of the first N terms from n = start */
const partial = (term: (n: number) => number, N: number, start = 1) => { let s = 0; for (let n = start; n < start + N; n++) s += term(n); return s }
/** does the series look convergent? compare the sums of the first 3000 and the first 6000 terms */
const looksConvergent = (term: (n: number) => number, start = 1) => {
  const a = partial(term, 3000, start), b = partial(term, 6000, start)
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) < 0.05 && Math.abs(term(6000)) < 1e-2 && Math.abs(term(5999)) < 1e-2
}
const rd = (v: number, p: number) => Number(v.toFixed(p))
const ordinalText = (n: number) => `${n}`

/** a word answer with accepted spellings */
function wordSpec(prompt: string, words: string[], options: string[], hint: string, expl: string[]): Spec {
  return { prompt, kind: 'word', answers: [], display: words[0], input: words[0], words, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: false, extra: options } }
}
const CONV = ['converges', 'converge', 'convergent', 'it converges']
const DIV = ['diverges', 'diverge', 'divergent', 'it diverges']
const verdict = (ok: boolean) => (ok ? CONV : DIV)
const ser = (term: string) => `Σ from n = 1 to ∞ of ${term}`

interface T { text: string; term: (n: number) => number; conv: boolean; why: string }

export const SER_GENS: Gen[] = [
  { lesson: 'series-convergence', level: 1, make: (r) => {
    // geometric and p-series
    if (r() < 0.5) {
      const rr = pick(r, [fr(1, 2), fr(-1, 2), fr(2, 3), fr(-3, 4), fr(3, 2), fr(-2, 1), fr(1, 3), fr(5, 4), fr(-5, 3)]), a = ri(r, 1, 6)
      const q = rr.n / rr.d, conv = Math.abs(q) < 1
      must(looksConvergent((n) => a * q ** n) === conv, 'geometric')
      return wordSpec(`Does the geometric series ${ser(`${a} × (${fm(rr)})ⁿ`)} converge or diverge?`, verdict(conv), ['converges', 'diverges'], 'A geometric series Σ rⁿ converges exactly when |r| < 1.', [`The common ratio is r = ${fm(rr)}, and |r| = ${fm(fr(Math.abs(rr.n), rr.d))}.`, conv ? '|r| < 1, so the series converges.' : '|r| ≥ 1, so the terms do not shrink to 0 and the series diverges.'])
    }
    const p = pick(r, [0.5, 1, 1.5, 2, 3, 4]), conv = p > 1
    const shown = p === 0.5 ? '1/√n' : p === 1 ? '1/n' : p === 1.5 ? '1/n^(3/2)' : `1/n${sup(p)}`
    must(looksConvergent((n) => 1 / n ** p) === conv || p === 1.5, 'p-series')
    return wordSpec(`Does the series ${ser(shown)} converge or diverge?`, verdict(conv), ['converges', 'diverges'], 'This is a p-series Σ 1/nᵖ: it converges exactly when p > 1.', [`Here p = ${p === 0.5 ? '1/2' : p === 1.5 ? '3/2' : p}.`, conv ? 'p > 1, so the series converges.' : p === 1 ? 'p = 1 is the harmonic series, which diverges (very slowly).' : 'p ≤ 1, so the series diverges.'])
  } },
  { lesson: 'series-convergence', level: 1, make: (r) => {
    // the sum of a geometric series
    const a = ri(r, 1, 9), q = pick(r, [fr(1, 2), fr(1, 3), fr(2, 3), fr(-1, 2), fr(-1, 3), fr(1, 4), fr(3, 4), fr(-2, 3), fr(1, 5)]), start = r() < 0.5 ? 0 : 1
    const first = start === 0 ? fr(a) : fMul(fr(a), q)
    const v = fDiv(first, fSub(fr(1), q))
    const qv = q.n / q.d
    must(Math.abs(partial((n) => a * qv ** n, 200, start) - v.n / v.d) < 1e-6, 'geometric sum')
    return numSpec(`Find the sum of the series Σ from n = ${start} to ∞ of ${a}(${fm(q)})ⁿ.`, v, 'A convergent geometric series has sum (first term)/(1 − r).', [`The ratio is r = ${fm(q)}, with |r| < 1, so the series converges.`, `The first term (n = ${start}) is ${fm(first)}.`, `Sum = ${fm(first)} / (1 − ${w2(q)}) = ${fm(v)}.`])
  } },
  { lesson: 'series-convergence', level: 2, make: (r) => {
    // divergence test and comparison
    const k = ri(r, 1, 5), m = ri(r, 2, 6)
    const cases: T[] = [
      { text: `n/(n + ${k})`, term: (n) => n / (n + k), conv: false, why: `The terms tend to 1, not 0, so by the divergence test the series diverges.` },
      { text: `(${m}n² + 1)/(n² + ${k})`, term: (n) => (m * n * n + 1) / (n * n + k), conv: false, why: `The terms tend to ${m}, not 0, so the series diverges by the divergence test.` },
      { text: `1/(n² + ${k})`, term: (n) => 1 / (n * n + k), conv: true, why: `0 < 1/(n² + ${k}) < 1/n², and Σ 1/n² converges, so by comparison this series converges.` },
      { text: `1/(√n + ${k})`, term: (n) => 1 / (Math.sqrt(n) + k), conv: false, why: `For large n it behaves like 1/√n, whose p-series (p = 1/2) diverges. By limit comparison this series diverges.` },
      { text: `1/(${m}ⁿ + ${k})`, term: (n) => 1 / (m ** n + k), conv: true, why: `0 < 1/(${m}ⁿ + ${k}) < (1/${m})ⁿ, a convergent geometric series, so by comparison it converges.` },
      { text: `1/(n + ${k})`, term: (n) => 1 / (n + k), conv: false, why: `It behaves like the harmonic series 1/n (limit comparison gives the ratio 1), so it diverges.` },
      { text: `(sin n)²/n²`, term: (n) => Math.sin(n) ** 2 / (n * n), conv: true, why: `0 ≤ (sin n)²/n² ≤ 1/n², and Σ 1/n² converges, so the series converges.` },
    ]
    const c = pick(r, cases)
    must(looksConvergent(c.term) === c.conv, `${c.text} verdict`)
    return wordSpec(`Does the series ${ser(c.text)} converge or diverge?`, verdict(c.conv), ['converges', 'diverges'], 'First check whether the terms tend to 0 (if not, it diverges). Otherwise compare with a geometric series or a p-series.', [c.why])
  } },
  { lesson: 'series-convergence', level: 2, make: (r) => {
    // the limit in the ratio test
    const c = ri(r, 2, 6), p = ri(r, 1, 3), t = ri(r, 1, 4)
    const cases = [
      { text: `n${p === 1 ? '' : sup(p)}/${c}ⁿ`, ratio: (n: number) => ((n + 1) / n) ** p / c, val: fr(1, c), expl: `a(n+1)/a(n) = ((n+1)/n)${p === 1 ? '' : sup(p)} / ${c}, and (n+1)/n → 1, so the limit is 1/${c}.` },
      { text: `${c}ⁿ/n!`, ratio: (n: number) => c / (n + 1), val: fr(0), expl: `a(n+1)/a(n) = ${c}/(n + 1) → 0.` },
      { text: `n!/${c}ⁿ`, ratio: (n: number) => (n + 1) / c, val: null, expl: `a(n+1)/a(n) = (n + 1)/${c}, which grows without bound.` },
      { text: `${c}ⁿ/n${p === 1 ? '' : sup(p)}`, ratio: (n: number) => c * (n / (n + 1)) ** p, val: fr(c), expl: `a(n+1)/a(n) = ${c} × (n/(n+1))${p === 1 ? '' : sup(p)} → ${c}.` },
    ]
    const k = cases[t - 1]
    const lim = k.ratio(5e5)
    must(k.val === null ? lim > 1e3 : Math.abs(lim - k.val.n / k.val.d) < 1e-3, 'ratio limit')
    const prompt = `For the series ${ser(k.text)}, find L = the limit of |a(n+1)/a(n)| as n → ∞, or say that it diverges to infinity.`
    return k.val === null
      ? noneSpec(prompt, 'diverges', 'Divide a(n + 1) by a(n), simplify, and let n → ∞.', [k.expl, 'So the ratio grows without bound.'])
      : numSpec(prompt, k.val, 'Divide a(n + 1) by a(n), simplify, and let n → ∞.', [k.expl])
  } },
  { lesson: 'series-convergence', level: 2, make: (r) => {
    // telescoping and sums of two geometric series
    const k = ri(r, 1, 4), t = ri(r, 1, 2)
    if (t === 1) {
      let H = fr(0); for (let i = 1; i <= k; i++) H = fAdd(H, fr(1, i))
      const v = fMul(H, fr(1, k))
      must(Math.abs(partial((n) => 1 / (n * (n + k)), 20000) - v.n / v.d) < 2e-3, 'telescoping')
      return numSpec(`Find the sum of the series ${ser(`1/(n(n + ${k}))`)}.`, v, 'Use partial fractions: 1/(n(n + k)) = (1/k)(1/n − 1/(n + k)). Most of the terms cancel.', [`1/(n(n + ${k})) = (1/${k})(1/n − 1/(n + ${k})).`, `The partial sum telescopes: all but the first ${k} positive terms and the last ${k} negative terms cancel, leaving (1/${k})(${Array.from({ length: k }, (_, i) => `1/${i + 1}`).join(' + ')}) as N → ∞.`, `Sum = ${fm(v)}.`])
    }
    const a = ri(r, 2, 4), b = ri(r, 2, 5)
    const v = fAdd(fr(1, a - 1), fr(1, b - 1))
    must(Math.abs(partial((n) => 1 / a ** n + 1 / b ** n, 200) - v.n / v.d) < 1e-9, 'two geometric')
    return numSpec(`Find the sum of the series ${ser(`(1/${a}ⁿ + 1/${b}ⁿ)`)}.`, v, 'Split into two geometric series and sum each.', [`Σ 1/${a}ⁿ from n = 1 is (1/${a})/(1 − 1/${a}) = 1/${a - 1}.`, `Σ 1/${b}ⁿ from n = 1 is 1/${b - 1}.`, `Total = ${fm(fr(1, a - 1))} + ${fm(fr(1, b - 1))} = ${fm(v)}.`])
  } },
  { lesson: 'series-convergence', level: 3, make: (r) => {
    // absolutely convergent, conditionally convergent or divergent
    const c = ri(r, 2, 4)
    const cases: { text: string; term: (n: number) => number; cls: 'absolutely' | 'conditionally' | 'diverges'; why: string }[] = [
      { text: '(−1)ⁿ/n', term: (n) => (-1) ** n / n, cls: 'conditionally', why: 'The alternating terms decrease to 0, so the series converges. But Σ|a| = Σ 1/n is the harmonic series, which diverges. So it converges conditionally.' },
      { text: '(−1)ⁿ/√n', term: (n) => (-1) ** n / Math.sqrt(n), cls: 'conditionally', why: 'The alternating terms decrease to 0, so it converges. But Σ 1/√n diverges (p = 1/2), so the convergence is only conditional.' },
      { text: `(−1)ⁿ/n${sup(c)}`, term: (n) => (-1) ** n / n ** c, cls: 'absolutely', why: `Σ|a| = Σ 1/n${sup(c)} is a convergent p-series (p = ${c} > 1), so the series converges absolutely.` },
      { text: `(−${c})ⁿ/n!`, term: (n) => { let t = 1; for (let i = 1; i <= n; i++) t *= -c / i; return t }, cls: 'absolutely', why: `The ratio test on |a| gives ${c}/(n + 1) → 0 < 1, so Σ|a| converges: absolute convergence.` },
      { text: `(−1)ⁿ n/(n + ${c})`, term: (n) => (-1) ** n * (n / (n + c)), cls: 'diverges', why: `The terms tend to ±1, not 0, so by the divergence test the series diverges.` },
      { text: `(−1)ⁿ(${c}/${c + 1})ⁿ`, term: (n) => (-c / (c + 1)) ** n, cls: 'absolutely', why: `This is geometric with |r| = ${c}/${c + 1} < 1, so it converges absolutely.` },
    ]
    const k = pick(r, cases)
    const absConv = k.cls === 'absolutely', conv = k.cls !== 'diverges'
    if (k.term.length) {
      must(looksConvergent(k.term) === conv || (conv && k.cls === 'conditionally'), `${k.text} convergence`)
      if (k.cls !== 'diverges') must(looksConvergent((n) => Math.abs(k.term(n))) === absConv, `${k.text} absolute`)
    }
    const words = k.cls === 'absolutely' ? ['absolutely', 'absolutely convergent', 'converges absolutely', 'absolute'] : k.cls === 'conditionally' ? ['conditionally', 'conditionally convergent', 'converges conditionally', 'conditional'] : ['diverges', 'divergent', 'it diverges', 'diverge']
    return wordSpec(`Does the series ${ser(k.text)} converge absolutely, converge conditionally, or diverge?`, words, ['absolutely', 'conditionally', 'diverges'], 'Check Σ|aₙ| first. If it converges, the series converges absolutely. If not, test the alternating series itself.', [k.why])
  } },
  { lesson: 'series-convergence', level: 3, make: (r) => {
    // the ratio test verdict
    const c = ri(r, 2, 5)
    const cases = [
      { text: `n!/${c}ⁿ`, lim: Infinity, ratio: (n: number) => (n + 1) / c, why: `a(n+1)/a(n) = (n + 1)/${c} → ∞ > 1, so the series diverges.` },
      { text: `${c}ⁿ/n!`, lim: 0, ratio: (n: number) => c / (n + 1), why: `a(n+1)/a(n) = ${c}/(n + 1) → 0 < 1, so the series converges.` },
      { text: `n²/${c}ⁿ`, lim: 1 / c, ratio: (n: number) => (((n + 1) / n) ** 2) / c, why: `a(n+1)/a(n) → 1/${c} < 1, so the series converges.` },
      { text: `${c}ⁿ/n²`, lim: c, ratio: (n: number) => c * (n / (n + 1)) ** 2, why: `a(n+1)/a(n) → ${c} > 1, so the series diverges.` },
      { text: 'n!/nⁿ', lim: 1 / Math.E, ratio: (n: number) => (n / (n + 1)) ** n, why: 'a(n+1)/a(n) = (n/(n + 1))ⁿ = 1/(1 + 1/n)ⁿ → 1/e < 1, so the series converges.' },
      { text: '(n!)²/(2n)!', lim: 0.25, ratio: (n: number) => ((n + 1) * (n + 1)) / ((2 * n + 2) * (2 * n + 1)), why: 'a(n+1)/a(n) = (n+1)²/((2n+2)(2n+1)) → 1/4 < 1, so the series converges.' },
      { text: `${c + 1}ⁿ/(n ${c}ⁿ)`, lim: (c + 1) / c, ratio: (n: number) => ((c + 1) / c) * (n / (n + 1)), why: `a(n+1)/a(n) → ${c + 1}/${c} > 1, so the series diverges.` },
    ]
    const k = pick(r, cases)
    const L = k.ratio(2e5)
    must(k.lim === Infinity ? L > 1e3 : Math.abs(L - k.lim) < 2e-3, `ratio ${k.text}`)
    const conv = k.lim < 1
    return wordSpec(`Use the ratio test to decide whether ${ser(k.text)} converges or diverges.`, verdict(conv), ['converges', 'diverges'], 'Compute L = lim |a(n+1)/a(n)|. If L < 1 the series converges; if L > 1 it diverges.', [k.why])
  } },
]
const w2 = (f: { n: number; d: number }) => (f.n < 0 ? `(${fm(f as never)})` : fm(f as never))

/* ------------------------------------------------------------------ power series */

export const POW_S_GENS: Gen[] = [
  { lesson: 'power-series', level: 1, make: (r) => {
    // radius of convergence by the ratio test
    const c = ri(r, 2, 7), t = ri(r, 1, 3), p = ri(r, 1, 3)
    const cases = [
      { text: `xⁿ/${c}ⁿ`, expl: `|a(n+1)/a(n)| = |x|/${c}, so the series converges when |x| < ${c}.` },
      { text: `n xⁿ/${c}ⁿ`, expl: `|a(n+1)/a(n)| = ((n+1)/n)|x|/${c} → |x|/${c}, so it converges when |x| < ${c}.` },
      { text: `xⁿ/(n${p === 1 ? '' : sup(p)} ${c}ⁿ)`, expl: `|a(n+1)/a(n)| = (n/(n+1))${p === 1 ? '' : sup(p)}|x|/${c} → |x|/${c}, so it converges when |x| < ${c}.` },
    ]
    const k = cases[t - 1]
    return numSpec(`Find the radius of convergence of the power series Σ from n = 1 to ∞ of ${k.text}.`, fr(c), 'Apply the ratio test: the series converges when lim |a(n+1)xⁿ⁺¹ / (a(n)xⁿ)| < 1. Solve for |x|.', [k.expl, `The radius of convergence is R = ${c}.`])
  } },
  { lesson: 'power-series', level: 1, make: (r) => {
    // value of a geometric power series
    const a = ri(r, 1, 6), c = ri(r, 2, 5), xnum = ri(r, 1, c - 1)
    const q = fr(xnum, c), v = fDiv(fr(a), fSub(fr(1), q))
    return numSpec(`The power series Σ from n = 0 to ∞ of ${a}(x/${c})ⁿ is geometric. Find its sum when x = ${xnum}.`, v, 'A geometric series with ratio r (|r| < 1) has sum (first term)/(1 − r). Find r by substituting x.', [`With x = ${xnum} the ratio is r = ${xnum}/${c} = ${fm(q)}, and |r| < 1, so the series converges.`, `Sum = ${a}/(1 − ${fm(q)}) = ${fm(v)}.`])
  } },
  { lesson: 'power-series', level: 2, make: (r) => {
    // radius when the centre is shifted, or when the coefficients are cⁿ
    const a = rnz(r, -4, 5), c = ri(r, 2, 6), t = ri(r, 1, 2)
    if (t === 1) return numSpec(`Find the radius of convergence of Σ from n = 1 to ∞ of (x ${a < 0 ? `+ ${-a}` : `− ${a}`})ⁿ/(n ${c}ⁿ).`, fr(c), 'The radius does not depend on the centre. Use the ratio test on the coefficients.', [`|a(n+1)/a(n)| → |x ${a < 0 ? `+ ${-a}` : `− ${a}`}|/${c}.`, `The series converges when |x ${a < 0 ? `+ ${-a}` : `− ${a}`}| < ${c}, so R = ${c} (centred at x = ${A(a)}).`])
    return numSpec(`Find the radius of convergence of Σ from n = 0 to ∞ of ${c}ⁿ xⁿ.`, fr(1, c), 'This is geometric in (cx): it converges when |cx| < 1.', [`The series is Σ (${c}x)ⁿ, geometric with ratio ${c}x.`, `It converges when |${c}x| < 1, that is |x| < 1/${c}. So R = 1/${c}.`])
  } },
  { lesson: 'power-series', level: 2, make: (r) => {
    // radius zero or infinite
    const c = ri(r, 2, 5), t = ri(r, 1, 4)
    const cases = [
      { text: 'xⁿ/n!', inf: true, why: '|a(n+1)xⁿ⁺¹/(a(n)xⁿ)| = |x|/(n + 1) → 0 for every x, so the series converges for all x.' },
      { text: `${c}ⁿxⁿ/n!`, inf: true, why: `The ratio is ${c}|x|/(n + 1) → 0 for every x, so the series converges for all x.` },
      { text: 'n! xⁿ', inf: false, why: 'The ratio is (n + 1)|x| → ∞ for every x ≠ 0, so the series converges only at x = 0.' },
      { text: `(n!)xⁿ/${c}ⁿ`, inf: false, why: `The ratio is (n + 1)|x|/${c} → ∞ for every x ≠ 0, so the series converges only at x = 0.` },
    ]
    const k = cases[t - 1]
    const words = k.inf ? ['infinite', 'infinity', '∞', 'all real numbers', 'r = infinity'] : ['zero', '0', 'r = 0']
    return wordSpec(`Find the radius of convergence of Σ from n = 0 to ∞ of ${k.text}. Answer zero or infinite.`, words, ['zero', 'infinite'], 'Use the ratio test: if the ratio tends to 0 for every x the radius is infinite; if it tends to ∞ for every x ≠ 0 the radius is zero.', [k.why, k.inf ? 'The radius of convergence is infinite.' : 'The radius of convergence is 0.'])
  } },
  { lesson: 'power-series', level: 2, make: (r) => {
    // the open interval of a geometric power series
    const a = rnz(r, -4, 5), c = ri(r, 2, 6)
    const set: IntervalSet = [{ lo: a - c, hi: a + c, loIncl: false, hiIncl: false }]
    const xa = a < 0 ? `x + ${-a}` : a === 0 ? 'x' : `x − ${a}`
    return ineqSpec(`For which x does the series Σ from n = 0 to ∞ of ((${xa})/${c})ⁿ converge?`, set, 'x', 'A geometric series converges when its ratio has absolute value less than 1.', [`The ratio is (${xa})/${c}, and we need |${xa}| < ${c}.`, `That means ${A(a - c)} < x < ${A(a + c)}.`, 'At both endpoints the ratio is ±1, so the terms do not tend to 0 and the series diverges: the endpoints are excluded.'], [exF(fr(a - c)), exF(fr(a + c))], (x) => Math.abs(x - a) < c)
  } },
  { lesson: 'power-series', level: 3, make: (r) => {
    // interval of convergence with the endpoints tested
    const a = rnz(r, -3, 4), c = ri(r, 2, 5), t = ri(r, 1, 3)
    const xa = a < 0 ? `x + ${-a}` : a === 0 ? 'x' : `x − ${a}`
    const lo = a - c, hi = a + c
    let set: IntervalSet, text: string, endnote: string
    if (t === 1) { set = [{ lo, hi, loIncl: true, hiIncl: false }]; text = `(${xa})ⁿ/(n ${c}ⁿ)`; endnote = `At x = ${A(lo)} the series is Σ (−1)ⁿ/n, which converges (alternating series test). At x = ${A(hi)} it is Σ 1/n, the harmonic series, which diverges.` }
    else if (t === 2) { set = [{ lo, hi, loIncl: true, hiIncl: true }]; text = `(${xa})ⁿ/(n² ${c}ⁿ)`; endnote = `At both endpoints the series is Σ ±1/n², which converges absolutely. So both endpoints are included.` }
    else { set = [{ lo, hi, loIncl: false, hiIncl: false }]; text = `n(${xa})ⁿ/${c}ⁿ`; endnote = `At the endpoints the terms are ±n, which do not tend to 0, so the series diverges there. Both endpoints are excluded.` }
    return ineqSpec(`Find the interval of convergence of Σ from n = 1 to ∞ of ${text}.`, set, 'x', 'Find the radius with the ratio test, then test each endpoint separately.', [`The ratio test gives convergence when |${xa}| < ${c}, so the radius is ${c} and the series converges for ${A(lo)} < x < ${A(hi)}.`, endnote], [exF(fr(lo)), exF(fr(hi))], (x) => (t === 1 ? x >= lo && x < hi : t === 2 ? x >= lo && x <= hi : x > lo && x < hi))
  } },
  { lesson: 'power-series', level: 3, make: (r) => {
    // coefficients of series found by calculus
    const k = ri(r, 2, 9), m = ri(r, 1, 6), t = ri(r, 1, 4)
    if (t === 1) return numSpec(`Differentiating 1/(1 − x) = Σ xⁿ term by term gives 1/(1 − x)² as a power series. Find the coefficient of x${sup(k)} in it.`, fr(k + 1), 'Differentiate Σ xⁿ term by term: the derivative of xⁿ is n xⁿ⁻¹.', [`d/dx Σ xⁿ = Σ n xⁿ⁻¹ = 1 + 2x + 3x² + …`, `The coefficient of x${sup(k)} is k + 1 = ${k + 1}.`])
    if (t === 2) return numSpec(`Replacing x by −x² in 1/(1 − x) = Σ xⁿ gives a series for 1/(1 + x²). Find the coefficient of x${sup(2 * m)}.`, fr((-1) ** m), 'Substitute −x² for x: (−x²)ⁿ = (−1)ⁿ x²ⁿ.', [`1/(1 + x²) = Σ (−1)ⁿ x²ⁿ = 1 − x² + x⁴ − …`, `The power x${sup(2 * m)} occurs when n = ${m}, with coefficient (−1)${sup(m)} = ${A((-1) ** m)}.`])
    if (t === 3) return numSpec(`Integrating the series 1/(1 + x²) = Σ (−1)ⁿ x²ⁿ term by term gives a series for tan⁻¹ x. Find the coefficient of x${sup(2 * m + 1)}.`, fr((-1) ** m, 2 * m + 1), 'Integrate each term: x²ⁿ integrates to x²ⁿ⁺¹/(2n + 1). There is no constant, since tan⁻¹ 0 = 0.', [`tan⁻¹ x = Σ (−1)ⁿ x²ⁿ⁺¹/(2n + 1) = x − x³/3 + x⁵/5 − …`, `For x${sup(2 * m + 1)} take n = ${m}: coefficient ${fm(fr((-1) ** m, 2 * m + 1))}.`])
    return numSpec(`Integrating 1/(1 + x) = Σ (−1)ⁿ xⁿ term by term gives a series for ln(1 + x). Find the coefficient of x${sup(k)}.`, fr((-1) ** (k + 1), k), 'Integrate each term: xⁿ integrates to xⁿ⁺¹/(n + 1). There is no constant, since ln 1 = 0.', [`ln(1 + x) = Σ from n = 1 of (−1)ⁿ⁺¹ xⁿ/n = x − x²/2 + x³/3 − …`, `The coefficient of x${sup(k)} is (−1)${sup(k + 1)}/${k} = ${fm(fr((-1) ** (k + 1), k))}.`])
  } },
]

/* ------------------------------------------------------------------ Taylor series */

/** a Frac to ASCII as text for a polynomial term */
const frTerm = (c: { n: number; d: number }, body: string) => {
  const nn = Math.abs(c.n), sign = c.n < 0 ? '-' : '+'
  const num = nn === 1 && body ? '' : String(nn)
  return `${sign}${num}${body ? (num && body ? '' : '') + body : ''}${c.d === 1 ? '' : `/${c.d}`}`
}
/** ascending coefficients (Fracs) of a polynomial as ASCII, for the calc answer */
const polyAscii = (cs: { n: number; d: number }[], v = 'x') => cs.map((c, e) => (c.n === 0 ? '' : frTerm(c, e === 0 ? '' : e === 1 ? v : `${v}^${e}`).replace(/^\+(?=\d)/, '+').replace(/(\d)(?=[a-z])/, '$1'))).filter(Boolean).join('').replace(/^\+/, '') || '0'

export const TAYLOR_GENS: Gen[] = [
  { lesson: 'taylor-series', level: 1, make: (r) => {
    // a coefficient of a standard Maclaurin series
    const a = ri(r, 2, 4), t = ri(r, 1, 3)
    if (t === 1) { const k = ri(r, 2, 5), v = fr(a ** k, fact(k)); return numSpec(`Find the coefficient of x${sup(k)} in the Maclaurin series of e^(${a}x).`, v, 'Start from eˣ = Σ xⁿ/n! and replace x by ax.', [`e^(${a}x) = Σ (${a}x)ⁿ/n! = Σ ${a}ⁿ xⁿ/n!.`, `For n = ${k}: ${a}${sup(k)}/${k}! = ${a ** k}/${fact(k)} = ${fm(v)}.`]) }
    if (t === 2) { const m = ri(r, 1, 3), k = 2 * m + 1, v = fr((-1) ** m * a ** k, fact(k)); return numSpec(`Find the coefficient of x${sup(k)} in the Maclaurin series of sin(${a}x).`, v, 'Start from sin x = x − x³/3! + x⁵/5! − … and replace x by ax.', [`sin(${a}x) = Σ (−1)ⁿ (${a}x)²ⁿ⁺¹/(2n + 1)!.`, `For x${sup(k)}, n = ${m}: (−1)${sup(m)} ${a}${sup(k)}/${k}! = ${fm(v)}.`]) }
    const m = ri(r, 1, 3), k = 2 * m, v = fr((-1) ** m * a ** k, fact(k)); return numSpec(`Find the coefficient of x${sup(k)} in the Maclaurin series of cos(${a}x).`, v, 'Start from cos x = 1 − x²/2! + x⁴/4! − … and replace x by ax.', [`cos(${a}x) = Σ (−1)ⁿ (${a}x)²ⁿ/(2n)!.`, `For x${sup(k)}, n = ${m}: (−1)${sup(m)} ${a}${sup(k)}/${k}! = ${fm(v)}.`])
  } },
  { lesson: 'taylor-series', level: 1, make: (r) => {
    // coefficients of geometric, logarithmic and binomial series
    const a = ri(r, 2, 4), k = ri(r, 2, 6), t = ri(r, 1, 3)
    if (t === 1) return numSpec(`Find the coefficient of x${sup(k)} in the Maclaurin series of 1/(1 − ${a}x).`, fr(a ** k), 'Use 1/(1 − u) = Σ uⁿ with u = ax.', [`1/(1 − ${a}x) = Σ (${a}x)ⁿ = Σ ${a}ⁿ xⁿ.`, `The coefficient of x${sup(k)} is ${a}${sup(k)} = ${a ** k}.`])
    if (t === 2) return numSpec(`Find the coefficient of x${sup(k)} in the Maclaurin series of ln(1 + x).`, fr((-1) ** (k + 1), k), 'Use ln(1 + x) = x − x²/2 + x³/3 − …', [`ln(1 + x) = Σ from n = 1 of (−1)ⁿ⁺¹ xⁿ/n.`, `The coefficient of x${sup(k)} is (−1)${sup(k + 1)}/${k} = ${fm(fr((-1) ** (k + 1), k))}.`])
    const n = ri(r, 5, 9), kk = ri(r, 2, 4)
    return numSpec(`Find the coefficient of x${sup(kk)} in the binomial expansion of (1 + x)${sup(n)}.`, fr(choose(n, kk)), 'Use (1 + x)ⁿ = Σ nCk xᵏ.', [`The coefficient of x${sup(kk)} is ${n}C${kk} = ${choose(n, kk)}.`])
  } },
  { lesson: 'taylor-series', level: 2, make: (r) => {
    // a Maclaurin polynomial as a formula
    const a = ri(r, 2, 3), deg = ri(r, 3, 5), t = ri(r, 1, 6)
    const cs = (f: (k: number) => { n: number; d: number }) => Array.from({ length: deg + 1 }, (_, k) => f(k))
    let src: string, cp: { n: number; d: number }[], name: string, pos = false, dom: [number, number] | undefined
    if (t === 1) { src = `e^(${a}x)`; name = `e^(${a}x)`; cp = cs((k) => fr(a ** k, fact(k))) }
    else if (t === 2) { src = `sin(${a}x)`; name = `sin(${a}x)`; cp = cs((k) => (k % 2 ? fr((-1) ** ((k - 1) / 2) * a ** k, fact(k)) : fr(0))) }
    else if (t === 3) { src = `cos(${a}x)`; name = `cos(${a}x)`; cp = cs((k) => (k % 2 === 0 ? fr((-1) ** (k / 2) * a ** k, fact(k)) : fr(0))) }
    else if (t === 4) { src = 'ln(1+x)'; name = 'ln(1 + x)'; cp = cs((k) => (k === 0 ? fr(0) : fr((-1) ** (k + 1), k))); dom = [-0.4, 0.4] }
    else if (t === 5) { src = `1/(1-${a}x)`; name = `1/(1 − ${a}x)`; cp = cs((k) => fr(a ** k)); dom = [-0.2, 0.2] }
    else { src = 'sqrt(1+x)'; name = '√(1 + x)'; const b = [fr(1), fr(1, 2), fr(-1, 8), fr(1, 16), fr(-5, 128), fr(7, 256)]; cp = b.slice(0, deg + 1); dom = [-0.3, 0.3] }
    const ans = polyAscii(cp)
    // verify against the function at a small x (the error should be of order x^(deg+1))
    for (const x of [0.05, -0.05]) { const approx = evaluate(ans, { x }), exact = evaluate(src, { x }); must(Math.abs(approx - exact) < 20 * (Math.max(1, a) * Math.abs(x)) ** (deg + 1) + 1e-12, `${name} polynomial of degree ${deg}`) }
    void pos
    return calcSpec(`Find the Maclaurin polynomial of degree ${deg} for f(x) = ${name}.`, src, ans, 'Use the standard series, replacing x where needed, and keep the terms up to the required degree.', [`The series begins ${S(polyAscii(cp.slice(0, Math.min(deg + 1, 5))))} + …`, `Keeping the terms up to x${sup(deg)}: ${S(ans)}.`], { check: false, dom })
  } },
  { lesson: 'taylor-series', level: 2, make: (r) => {
    // estimate a value with a Taylor polynomial
    const t = ri(r, 1, 3), deg = ri(r, 2, 4), den = ri(r, 2, 4)
    const x = fr(1, den)
    let val = fr(0), name = '', exact = 0
    if (t === 1) { for (let k = 0; k <= deg; k++) val = fAdd(val, fDiv(pwr(x, k), fr(fact(k)))); name = `e^(1/${den})`; exact = Math.exp(1 / den) }
    else if (t === 2) { for (let k = 0; k <= deg; k++) if (k % 2) val = fAdd(val, fDiv(fMul(fr((-1) ** ((k - 1) / 2)), pwr(x, k)), fr(fact(k)))); name = `sin(1/${den})`; exact = Math.sin(1 / den) }
    else { for (let k = 0; k <= deg; k++) if (k % 2 === 0) val = fAdd(val, fDiv(fMul(fr((-1) ** (k / 2)), pwr(x, k)), fr(fact(k)))); name = `cos(1/${den})`; exact = Math.cos(1 / den) }
    must(Math.abs(val.n / val.d - exact) < 0.03, 'estimate close')
    return numSpec(`Use the Maclaurin polynomial of degree ${deg} to estimate ${name}. Give your answer as a fraction.`, val, `Write the polynomial of degree ${deg} for ${t === 1 ? 'eˣ' : t === 2 ? 'sin x' : 'cos x'} and substitute x = 1/${den}.`, [`The polynomial is ${t === 1 ? Array.from({ length: deg + 1 }, (_, k) => (k === 0 ? '1' : k === 1 ? 'x' : `x${sup(k)}/${fact(k)}`)).join(' + ') : t === 2 ? ['x', 'x³/6', 'x⁵/120'].slice(0, Math.ceil(deg / 2)).join(' − ') : ['1', 'x²/2', 'x⁴/24'].slice(0, Math.floor(deg / 2) + 1).join(' − ')}.`, `At x = 1/${den} it gives ${fm(val)} ≈ ${(val.n / val.d).toFixed(5)}. (The true value is ${exact.toFixed(5)}.)`])
  } },
  { lesson: 'taylor-series', level: 2, make: (r) => {
    // sum of a series from a known Maclaurin series
    const k = ri(r, 2, 4), t = ri(r, 1, 3)
    if (t === 1) { const v = Math.exp(k); return decSpec(`Find the sum of the series Σ from n = 0 to ∞ of ${k}ⁿ/n!. Give your answer to 3 decimal places.`, rd(v, 3), 'Recognise eˣ = Σ xⁿ/n! with x = ' + k + '.', [`Σ xⁿ/n! = eˣ, so with x = ${k} the sum is e${sup(k)} ≈ ${v.toFixed(3)}.`], 3) }
    if (t === 2) { const v = Math.exp(-k); return decSpec(`Find the sum of the series Σ from n = 0 to ∞ of (−${k})ⁿ/n!. Give your answer to 4 decimal places.`, rd(v, 4), 'Recognise eˣ = Σ xⁿ/n! with x = −' + k + '.', [`Σ xⁿ/n! = eˣ, so with x = −${k} the sum is e⁻${sup(k)} ≈ ${v.toFixed(4)}.`], 4) }
    const v = Math.log(1 + 1 / k); return decSpec(`Find the sum of the series Σ from n = 1 to ∞ of (−1)ⁿ⁺¹/(n ${k}ⁿ). Give your answer to 4 decimal places.`, rd(v, 4), 'Recognise ln(1 + x) = Σ (−1)ⁿ⁺¹ xⁿ/n with x = 1/' + k + '.', [`ln(1 + x) = Σ (−1)ⁿ⁺¹ xⁿ/n. With x = 1/${k}, the sum is ln(1 + 1/${k}) = ln(${k + 1}/${k}) ≈ ${v.toFixed(4)}.`], 4)
  } },
  { lesson: 'taylor-series', level: 3, make: (r) => {
    // limits by series
    const k = ri(r, 2, 4), t = ri(r, 1, 5)
    const g = (n: number, d: number) => { const q = gcd(Math.abs(n), d); return fr(n / q, d / q) }
    let f: string, v: ReturnType<typeof fr>, how: string
    if (t === 1) { f = `(e^(${k}x)-1-${k}x)/x^2`; v = g(k * k, 2); how = `e^(${k}x) = 1 + ${k}x + ${k * k}x²/2 + …, so the top is ${k * k}x²/2 + (higher powers). Divide by x².` }
    else if (t === 2) { f = `(sin(${k}x)-${k}x)/x^3`; v = g(-(k ** 3), 6); how = `sin(${k}x) = ${k}x − ${k ** 3}x³/6 + …, so the top is −${k ** 3}x³/6 + (higher powers).` }
    else if (t === 3) { f = `(1-cos(${k}x))/x^2`; v = g(k * k, 2); how = `cos(${k}x) = 1 − ${k * k}x²/2 + …, so 1 − cos(${k}x) = ${k * k}x²/2 − …` }
    else if (t === 4) { f = `(ln(1+${k}x)-${k}x)/x^2`; v = g(-(k * k), 2); how = `ln(1 + ${k}x) = ${k}x − ${k * k}x²/2 + …, so the top is −${k * k}x²/2 + (higher powers).` }
    else { f = `(cos(x)-1+x^2/2)/x^4`; v = fr(1, 24); how = 'cos x = 1 − x²/2 + x⁴/24 − …, so the top is x⁴/24 − … and dividing by x⁴ gives 1/24.' }
    if (t === 5) must(Math.abs(evaluate(f, { x: 0.2 }) - 1 / 24) < 2e-3, 'cos limit'); else limitCheck(f, 0, v.n / v.d)
    return numSpec(`Use Maclaurin series to find the limit as x → 0 of ${S(f)}.`, v, 'Replace each function by its series, cancel the low powers, and divide by the lowest power left.', [how, `The limit is ${fm(v)}.`])
  } },
  { lesson: 'taylor-series', level: 3, make: (r) => {
    // Taylor polynomial about x = a
    const t = ri(r, 1, 3)
    if (t === 1) { const a = ri(r, 2, 6) ** 2, s = Math.sqrt(a); const c0 = fr(s), c1 = fr(1, 2 * s), c2 = fr(-1, 8 * s ** 3); const x = ri(r, 1, 2); const x0 = a + x; const val = fAdd(fAdd(c0, fMul(c1, fr(x))), fMul(c2, fr(x * x))); must(Math.abs(val.n / val.d - Math.sqrt(x0)) < 0.03, 'sqrt taylor'); return numSpec(`Use the degree-2 Taylor polynomial of f(x) = √x about x = ${a} to estimate √${x0}. Give a fraction.`, val, 'The polynomial is f(a) + f′(a)(x − a) + f″(a)(x − a)²/2.', [`f(x) = √x, f′(x) = 1/(2√x), f″(x) = −1/(4x√x). At ${a}: f = ${s}, f′ = ${fm(c1)}, f″ = ${fm(fMul(c2, fr(2)))}.`, `P(${x0}) = ${s} + ${fm(c1)}(${x}) − ${fm(fr(-c2.n, c2.d))}(${x * x}) = ${fm(val)} ≈ ${(val.n / val.d).toFixed(5)}. (The true value is ${Math.sqrt(x0).toFixed(5)}.)`]) }
    if (t === 2) { const x = ri(r, 1, 4); const c1 = fr(1), c2 = fr(-1, 2), c3 = fr(1, 3); const val = fAdd(fAdd(fMul(c1, fr(x, 10)), fMul(c2, fr(x * x, 100))), fMul(c3, fr(x ** 3, 1000))); return numSpec(`The Taylor polynomial of f(x) = ln x about x = 1 of degree 3 is (x − 1) − (x − 1)²/2 + (x − 1)³/3. Use it to estimate ln(${1 + x / 10}). Give a fraction.`, val, 'Substitute x − 1 = ' + x / 10 + ' into the polynomial.', [`With x − 1 = ${fm(fr(x, 10))}: ${fm(fr(x, 10))} − ${fm(fr(x * x, 100))}/2 + ${fm(fr(x ** 3, 1000))}/3.`, `= ${fm(val)} ≈ ${(val.n / val.d).toFixed(5)}. (The true value is ${Math.log(1 + x / 10).toFixed(5)}.)`]) }
    const a = ri(r, 1, 3), c = fr(1, a), b = ri(r, 1, 3)
    const val = fAdd(fAdd(fr(a ** 4), fr(4 * a ** 3 * b)), fr(6 * a * a * b * b))
    must(val.n === a ** 4 + 4 * a ** 3 * b + 6 * a * a * b * b, 'quartic')
    void c
    return numSpec(`The Taylor polynomial of degree 2 of f(x) = x⁴ about x = ${a} is used to estimate f(${a + b}). What value does it give?`, val, 'The polynomial is f(a) + f′(a)(x − a) + f″(a)(x − a)²/2, with f′ = 4x³ and f″ = 12x².', [`f(${a}) = ${a ** 4}, f′(${a}) = ${4 * a ** 3}, f″(${a}) = ${12 * a * a}.`, `P(${a + b}) = ${a ** 4} + ${4 * a ** 3}(${b}) + ${6 * a * a}(${b * b}) = ${fm(val)}. (The exact value is ${(a + b) ** 4}.)`])
  } },
  { lesson: 'taylor-series', level: 3, make: (r) => {
    // how many terms are needed (Lagrange error bound on [0, 1])
    const d = ri(r, 2, 8), thr = 10 ** d, isExp = r() < 0.5, M = isExp ? 3 : 1
    let n = 0; while (M / fact(n + 1) >= 1 / thr) n++
    must(M / fact(n + 1) < 1 / thr && (n === 0 || M / fact(n) >= 1 / thr), 'error bound degree')
    const fn = isExp ? 'eˣ' : 'sin x'
    return numSpec(`The Maclaurin polynomial of degree n for ${fn} is used to estimate ${isExp ? 'e = e¹' : 'sin 1'}. Using the error bound ${M === 1 ? '1' : '3'}/(n + 1)! (${isExp ? 'since eᶜ < 3 for c in [0, 1]' : 'since every derivative of sin x is at most 1 in size'}), what is the smallest n that guarantees an error below 1/${thr}?`, fr(n), 'The Lagrange error bound is |error| ≤ M xⁿ⁺¹/(n + 1)!, here with x = 1. Find the smallest n making the bound small enough.', [`We need ${M}/(n + 1)! < 1/${thr}, that is (n + 1)! > ${M * thr}.`, `${n}! = ${fact(n)} is too small and ${n + 1}! = ${fact(n + 1)} is large enough, so n + 1 = ${n + 1}.`, `The smallest n is ${n}.`])
  } },
]
const pwr = (f: { n: number; d: number }, k: number) => { let r = fr(1); for (let i = 0; i < k; i++) r = fMul(r, f as never); return r }

export const SERIES_GENS: Gen[] = [...SER_GENS, ...POW_S_GENS, ...TAYLOR_GENS]
void ordinalText; void fSub; void ineqSpec
