/**
 * Question generators for Unit 2: expanding, factoring, polynomials, and rational expressions.
 *
 * Every question is built from explicit factors, so the answer is known by construction, and then
 * pushed through the algebra engine (expand, cancel, solve) so the text shown cannot disagree with it.
 * Strings are kept in ASCII ("x^2 - 3x") and typeset with pretty() only when shown.
 */
import {
  AlgMode, Factored, Frac, Poly, factorsOf, fDiv, fEq, fmtFactored, fmtFrac, fmtPoly, fNum, fr, fracStr, gcdI,
  isConst, isZero, parse, parsePoly, parseRat, pDivExact, pEvalFrac, pMul, pretty, rationalRoots, rSub, solveEquation,
  pDeg, pAdd,
} from './algebra'
import type { Gen, Spec } from './questions'
import { pick, Rng } from './rng'

/* ------------------------------------------------------------------ small helpers */

export const ri = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
export const rnz = (r: Rng, lo: number, hi: number) => { let v = 0; while (v === 0) v = ri(r, lo, hi); return v }
const VARS = ['x', 'x', 'x', 'x', 't', 'n', 'y', 'a']
const PAIRS: [string, string][] = [['x', 'y'], ['x', 'y'], ['a', 'b'], ['m', 'n'], ['p', 'q'], ['u', 'v']]

const A = (p: Poly) => fmtPoly(p, true)
/** expand an expression to ASCII standard form */
const E = (s: string) => A(parsePoly(s))
/** expanded form as shown on screen */
const M = (s: string) => pretty(E(s))
const wrap = (s: string) => (/^[a-z]$/.test(s) ? s : `(${s})`)
const lead = (c: number) => (c === 1 ? '' : c === -1 ? '-' : String(c))
/** product text from a constant and a list of factors */
const prodStr = (c: number, fs: string[]) => (fs.length ? lead(c) + fs.map(wrap).join('') : String(c))
/** canonical factored text (merges repeats into powers, sorts) */
const FAC = (c: number, fs: string[]) => fmtFactored(factorsOf(parse(prodStr(c, fs))))
const sg = (n: number) => (n < 0 ? '−' : '+')

const lin = (a: number, b: number, v = 'x') => E(`${a}${v}+(${b})`)
const lin2 = (a: number, b: number, x: string, y: string) => E(`${a}${x}+(${b})${y}`)
const coprime = (a: number, b: number) => gcdI(a, b) === 1

/** a primitive linear factor with positive leading coefficient */
function linR(r: Rng, v = 'x', lo = -7, hi = 7, leads: number[] = [1, 1, 1, 1, 2, 3]): string {
  for (;;) { const a = pick(r, leads), b = rnz(r, lo, hi); if (coprime(a, Math.abs(b))) return lin(a, b, v) }
}
function lin2R(r: Rng, x: string, y: string, leads: number[] = [1, 1, 1, 2, 3]): string {
  for (;;) { const a = pick(r, leads), b = rnz(r, -4, 4); if (coprime(a, Math.abs(b))) return lin2(a, b, x, y) }
}
function distinct<T>(_r: Rng, n: number, make: () => T, key: (t: T) => string = String): T[] {
  const out: T[] = [], seen = new Set<string>()
  for (let i = 0; i < 400 && out.length < n; i++) { const t = make(), k = key(t); if (!seen.has(k)) { seen.add(k); out.push(t) } }
  return out
}

export const ALG_PAD = { pi: false, root: false, comma: false, alg: true }

export function alg(mode: AlgMode, prompt: string, source: string, answer: string, hint: string, explanation: string[], solveFor?: string): Spec {
  return {
    prompt, kind: 'alg', answers: [], display: pretty(answer), input: answer, unit: '', needsExact: false, tol: 0, hint, explanation,
    pad: ALG_PAD, alg: { mode, source, answer, solveFor },
  }
}
export function rootsSpec(prompt: string, roots: Frac[], v: string, hint: string, explanation: string[]): Spec {
  const sorted = [...roots].sort((a, b) => fNum(a) - fNum(b))
  const nonTerminating = sorted.some((f) => { let d = f.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d !== 1 })
  return {
    prompt, kind: 'set', answers: sorted.map(fNum), display: sorted.length ? `${v} = ${sorted.map(fmtFrac).join(', ')}` : 'no solution',
    input: sorted.length ? sorted.map(fmtFrac).join(', ') : 'no solution', unit: '', needsExact: nonTerminating, tol: 1e-9, hint, explanation,
    pad: { pi: false, root: false, comma: true, alg: true },
  }
}
export function numSpec(prompt: string, n: Frac, hint: string, explanation: string[]): Spec {
  return {
    prompt, kind: 'value', answers: [fNum(n)], display: fmtFrac(n), input: fmtFrac(n), unit: '', needsExact: n.d !== 1, tol: 1e-9, hint, explanation,
    pad: { pi: false, root: false, comma: false, alg: true },
  }
}
export const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/* ------------------------------------------------------------------ factored fractions */

/** cancel common factors between two factored products; the constant ends up as numerator / denominator */
function cancel(nf: Factored, df: Factored): { n: Factored; d: Factored } {
  const n = new Map(nf.f), d = new Map(df.f)
  for (const [k, v] of nf.f) {
    const w = df.f.get(k)
    if (w) { const m = Math.min(v.k, w.k); n.set(k, { p: v.p, k: v.k - m }); d.set(k, { p: w.p, k: w.k - m }) }
  }
  for (const m of [n, d]) for (const [k, v] of [...m]) if (v.k === 0) m.delete(k)
  const c = fDiv(nf.c, df.c)
  return { n: { c: fr(c.n), f: n, loose: false }, d: { c: fr(c.d), f: d, loose: false } }
}
const ratioText = (n: Factored, d: Factored) => fracStr(fmtFactored(n), fmtFactored(d))
const isOne = (x: Factored) => x.f.size === 0 && fEq(x.c, fr(1))

const content = (p: Poly): number => p.reduce((g, t) => gcdI(g, t.c.n), 0)

/** Reduce N / (factored denominator): remove every known factor that divides N, and the common number. */
function finish(N: Poly, D: Factored): { text: string; n: Poly; d: Factored; removed: string[] } | null {
  if (isZero(N)) return null
  const f = new Map(D.f)
  let n = N
  const removed: string[] = []
  for (const [k, v] of f) {
    let kk = v.k
    for (;;) {
      if (kk === 0) break
      const q = pDivExact(n, v.p)
      if (!q) break
      n = q; kk--; removed.push(fmtPoly(v.p, true))
    }
    f.set(k, { p: v.p, k: kk })
  }
  for (const [k, v] of [...f]) if (v.k === 0) f.delete(k)
  const g = gcdI(content(n), Math.abs(D.c.n))
  const nn = g > 1 ? pMul(n, [{ c: fr(1, g), e: {} }]) : n
  const dd: Factored = { c: fr(D.c.n / (g || 1)), f, loose: false }
  return { text: fracStr(A(nn), fmtFactored(dd)), n: nn, d: dd, removed }
}

/* ------------------------------------------------------------------ combining fractions (shared by several generators) */

interface TermIn { sign: 1 | -1; n: string; d: string }
interface Combined { src: string; answer: string; steps: string[]; N: Poly; lcd: string; trivial: boolean }

/**
 * a1/d1 ± a2/d2 ± ... with every denominator given in factored form.
 * showExpanded: print the denominators multiplied out, so the student has to factor them to find the LCD.
 */
function combine(ts: TermIn[], showExpanded: boolean): Combined | null {
  const dfs = ts.map((t) => factorsOf(parse(t.d)))
  const keys = new Map<string, Poly>()
  for (const df of dfs) for (const [k, v] of df.f) keys.set(k, v.p)
  const lcdF = new Map<string, { p: Poly; k: number }>()
  for (const [k, p] of keys) lcdF.set(k, { p, k: Math.max(...dfs.map((df) => df.f.get(k)?.k ?? 0)) })
  let lc = 1
  for (const df of dfs) lc = (lc / gcdI(lc, Math.abs(df.c.n))) * Math.abs(df.c.n)
  const lcd: Factored = { c: fr(lc), f: lcdF, loose: false }
  let N: Poly = []
  const adj: string[] = []
  ts.forEach((t, i) => {
    const df = dfs[i]
    const diff = new Map<string, { p: Poly; k: number }>()
    for (const [k, v] of lcdF) { const have = df.f.get(k)?.k ?? 0; if (v.k - have > 0) diff.set(k, { p: v.p, k: v.k - have }) }
    const mult = fmtFactored({ c: fr(lc / Math.abs(df.c.n)), f: diff, loose: false })
    const part = pMul(parsePoly(t.n), parsePoly(mult))
    N = pAdd(N, t.sign === 1 ? part : pMul(part, [{ c: fr(-1), e: {} }]))
    adj.push(mult === '1' ? `${pretty(fracStr(t.n, t.d))} already has the LCD` : `${pretty(fracStr(t.n, t.d))} = ${pretty(fracStr(`(${t.n})(${mult})`, fmtFactored(lcd)))}`)
  })
  const fin = finish(N, lcd)
  if (!fin) return null
  const show = (t: TermIn) => (showExpanded ? E(t.d) : t.d)
  const src = ts.map((t, i) => `${i === 0 ? (t.sign === -1 ? '-' : '') : t.sign === 1 ? ' + ' : ' - '}${fracStr(t.n, show(t))}`).join('')
  const lcdText = fmtFactored(lcd)
  const steps: string[] = []
  if (showExpanded) steps.push(`Factor each denominator: ${ts.map((t) => `${pretty(E(t.d))} = ${pretty(t.d)}`).join('; ')}.`)
  steps.push(`The lowest common denominator takes every factor the most times it appears in any denominator: ${pretty(lcdText)}.`)
  steps.push(`Rewrite each fraction over the LCD by multiplying top and bottom by what is missing: ${adj.join('; ')}.`)
  steps.push(`Combine the numerators: ${pretty(A(N))}, over ${pretty(lcdText)}.`)
  steps.push(fin.removed.length || (content(N) > 1 && gcdI(content(N), lc) > 1)
    ? `Look for common factors: ${fin.removed.length ? `${pretty(joinList([...new Set(fin.removed)]))} divides the numerator, so it cancels` : 'the common number cancels'}. The result is ${pretty(fin.text)}.`
    : `No factor of the denominator divides the numerator, so ${pretty(fin.text)} is in lowest terms.`)
  return { src, answer: fin.text, steps, N: fin.n, lcd: lcdText, trivial: isConst(fin.n) && fin.d.f.size === 0 }
}

/** A fixed, always-valid question for the rare case a random search finds nothing. */
function fallback(lesson: string): Spec {
  if (lesson === 'rational-simplify') {
    const src = '(x^2 - 9)/(x - 3)'
    return alg('rational', `Simplify: ${pretty(src)}`, src, 'x + 3', 'Factor the numerator, then cancel the bracket that is on both the top and the bottom.', ['Factor the numerator: (x − 3)(x + 3).', 'Cancel (x − 3) from the top and the bottom.', 'The result is x + 3.'])
  }
  if (lesson === 'rational-ops') return combineSpec([{ sign: 1, n: '1', d: 'x' }, { sign: 1, n: '1', d: 'y' }], false, 'The LCD of x and y is xy.')!
  return equationSpec('3/x', '6/(x + 2)', 'x', 'Cross-multiply, solve, and check that no denominator is zero.', null)!
}

/* ------------------------------------------------------------------ 1. expanding */

const expandSpec = (src: string, hint: string, steps: string[]): Spec =>
  alg('poly', `Expand and simplify: ${pretty(src)}`, src, E(src), hint, steps)

const EXPANDING: Gen[] = [
  { lesson: 'expanding', level: 1, make: (r) => {
    const v = pick(r, VARS), a = rnz(r, -9, 9), b = rnz(r, -9, 9)
    const src = `(${lin(1, a, v)})(${lin(1, b, v)})`
    return expandSpec(src, 'Multiply every term in the first bracket by every term in the second, then collect like terms.', [
      `Multiply each term of the first bracket by each term of the second: ${v}·${v} = ${pretty(`${v}^2`)}, ${v}·(${b}) = ${M(`${b}${v}`)}, (${a})·${v} = ${M(`${a}${v}`)}, (${a})(${b}) = ${a * b < 0 ? '−' : ''}${Math.abs(a * b)}.`,
      `Collect the like terms ${M(`${b}${v}`)} and ${M(`${a}${v}`)}: ${M(`${a + b}${v}`)}.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 1, make: (r) => {
    const v = pick(r, VARS), k = rnz(r, -5, 6), m = ri(r, 1, 5), n = rnz(r, -8, 8)
    const src = `${k}${v}(${lin(m, n, v)})`
    return expandSpec(src, 'Distribute the term outside the bracket to every term inside.', [
      `Multiply ${M(`${k}${v}`)} by each term inside the bracket: ${M(`${k}${v}*${m}${v}`)} and ${M(`${k}${v}*(${n})`)}.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 1, make: (r) => {
    const v = pick(r, VARS), a = rnz(r, -8, 8)
    const src = `(${lin(1, a, v)})^2`
    return expandSpec(src, '(p + q)² = p² + 2pq + q². The middle term is twice the product.', [
      `Use (p + q)² = p² + 2pq + q² with p = ${v} and q = ${a < 0 ? `(${pretty(String(a))})` : a}.`,
      `p² = ${pretty(`${v}^2`)}, 2pq = ${M(`${2 * a}${v}`)}, q² = ${a * a}.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 2, make: (r) => {
    const v = pick(r, VARS)
    const a = ri(r, 2, 4), c = ri(r, 1, 4), b = rnz(r, -7, 7), d = rnz(r, -7, 7)
    const src = `(${lin(a, b, v)})(${lin(c, d, v)})`
    return expandSpec(src, 'Multiply each term by each term, and collect the two middle terms.', [
      `Multiply every pair: ${M(`${a}${v}*${c}${v}`)}, ${M(`${a}${v}*(${d})`)}, ${M(`(${b})*${c}${v}`)}, ${b * d < 0 ? '−' : ''}${Math.abs(b * d)}.`,
      `The two middle terms combine: ${M(`${a * d}${v}`)} ${sg(b * c)} ${Math.abs(b * c)}${v} = ${M(`${a * d + b * c}${v}`)}.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 2, make: (r) => {
    const [x, y] = pick(r, PAIRS), a = ri(r, 1, 4), b = ri(r, 1, 5)
    const src = `(${a}${x} - ${b}${y})(${a}${x} + ${b}${y})`
    return expandSpec(src, '(p − q)(p + q) = p² − q²: the middle terms cancel.', [
      `This is a difference of squares, (p − q)(p + q) = p² − q², with p = ${a === 1 ? x : a + x} and q = ${b === 1 ? y : b + y}.`,
      `p² = ${M(`(${a}${x})^2`)} and q² = ${M(`(${b}${y})^2`)}.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 2, make: (r) => {
    const v = pick(r, VARS), a = rnz(r, -5, 5), b = rnz(r, -6, 6), c = rnz(r, -6, 6)
    const src = `(${lin(1, a, v)})(${E(`${v}^2+${b}${v}+(${c})`)})`
    return expandSpec(src, 'Multiply each of the two terms in the bracket by every term of the trinomial (six products), then collect.', [
      `Multiply ${v} by each term of the second bracket: ${M(`${v}*(${v}^2+${b}${v}+(${c}))`)}.`,
      `Multiply ${a < 0 ? `(${pretty(String(a))})` : a} by each term: ${M(`(${a})*(${v}^2+${b}${v}+(${c}))`)}.`,
      `Add and collect like terms: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 2, make: (r) => {
    const [x, y] = pick(r, PAIRS), a = ri(r, 1, 3), b = rnz(r, -4, 4)
    const src = r() < 0.5 ? `(${a}${x} + (${b})${y})^2` : `(${lin2(1, rnz(r, -4, 4), x, y)})(${lin2(a, b, x, y)})`
    return expandSpec(src, 'Expand step by step. In a square, the middle term is twice the product of the two terms.', [
      `Multiply out term by term, keeping ${x} and ${y} separate.`,
      `Collect like terms (same letters, same powers): ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 2, make: (r) => {
    const v = pick(r, VARS), a = rnz(r, -5, 5), b = rnz(r, -5, 5), c = rnz(r, -5, 5)
    const src = `(${lin(1, a, v)})^2 - (${lin(1, b, v)})(${lin(1, c, v)})`
    return expandSpec(src, 'Expand each part first. Subtracting a product means every term of it changes sign.', [
      `Expand the square: ${M(`(${lin(1, a, v)})^2`)}.`,
      `Expand the product: ${M(`(${lin(1, b, v)})(${lin(1, c, v)})`)}. Subtracting it changes every sign.`,
      `Collect like terms: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), a = ri(r, 1, 3), b = rnz(r, -3, 3)
    const pick3 = r() < 0.5
    const src = pick3 ? `(${x} + (${b})${y})^3` : `(${a}${x} - ${ri(r, 1, 3)}${y})^3`
    return expandSpec(src, '(p + q)³ = p³ + 3p²q + 3pq² + q³. Take care with signs and with coefficients that get cubed or squared.', [
      `Use the cube pattern (p + q)³ = p³ + 3p²q + 3pq² + q³ (a minus inside makes the 2nd and 4th terms negative).`,
      `Work out each of the four terms, remembering to cube and square the coefficients too.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 3, make: (r) => {
    const v = pick(r, VARS), a = rnz(r, -4, 4), b = rnz(r, -4, 4), c = rnz(r, -4, 4), d = rnz(r, -4, 4)
    const src = `(${E(`${v}^2+${a}${v}+(${b})`)})(${E(`${v}^2+${c}${v}+(${d})`)})`
    return expandSpec(src, 'Nine products in all. Write them in order of power and collect carefully.', [
      `Multiply each of the three terms of the first bracket by each of the three terms of the second (nine products).`,
      `Group the products by power of ${v} and add the coefficients.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 3, make: (r) => {
    const a = rnz(r, -2, 3), b = rnz(r, -3, 3), c = rnz(r, -3, 3)
    const src = `(${E(`${a}x+(${b})y+(${c})z`)})^2`
    return expandSpec(src, '(p + q + r)² = p² + q² + r² + 2pq + 2pr + 2qr. Square each term, then add twice every pair.', [
      `Square each term separately, then add twice the product of each pair of terms: 2pq, 2pr and 2qr.`,
      `Keep the three letters in alphabetical order and collect.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
  { lesson: 'expanding', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), a = ri(r, 1, 3), b = ri(r, 1, 3), sign = r() < 0.5 ? 1 : -1
    // (ax -/+ by)(a²x² +/- abxy + b²y²) = a³x³ -/+ b³y³
    const src = sign === 1
      ? `(${a}${x} - ${b}${y})(${E(`${a * a}${x}^2+${a * b}${x}${y}+${b * b}${y}^2`)})`
      : `(${a}${x} + ${b}${y})(${E(`${a * a}${x}^2-${a * b}${x}${y}+${b * b}${y}^2`)})`
    return expandSpec(src, 'Many terms cancel. This is the pattern for a sum or difference of cubes.', [
      `Multiply the first bracket by each of the three terms of the second.`,
      `The middle terms cancel in pairs, which is why this pattern is so useful.`,
      `Result: ${pretty(E(src))}. Remember it: this is how a sum or difference of cubes factors.`,
    ])
  } },
  { lesson: 'expanding', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), k = ri(r, 1, 3)
    const src = `(${x} + ${k}${y})^3 - (${x} - ${k}${y})^3`
    return expandSpec(src, 'Expand both cubes. Terms with an even power of the second letter cancel; the odd ones double.', [
      `Expand (${x} + ${k}${y})³ and (${x} − ${k}${y})³ with the cube pattern.`,
      `Subtract: terms that are the same in both cancel, and terms that differ in sign double.`,
      `Result: ${pretty(E(src))}.`,
    ])
  } },
]

/* ------------------------------------------------------------------ 2. factoring */

function factorSpec(c: number, fs: string[], hint: string, steps: (src: string, ans: string) => string[]): Spec {
  const src = E(prodStr(c, fs))
  const answer = FAC(c, fs)
  return alg('factor', `Factor completely: ${pretty(src)}`, src, answer, hint, steps(src, answer))
}

const FACTORING: Gen[] = [
  { lesson: 'factoring', level: 1, make: (r) => {
    const v = pick(r, VARS), k = ri(r, 2, 9)
    const a = ri(r, 1, 4), b = rnz(r, -6, 6)
    const lo = coprime(a, Math.abs(b)) ? lin(a, b, v) : lin(1, b, v)
    return factorSpec(k, [lo], 'Find the largest number that divides every term and take it out the front.', (src, ans) => [
      `Find the greatest common factor of the coefficients: ${k}.`,
      `Divide each term by ${k} and put the result in brackets: ${pretty(src)} = ${pretty(ans)}.`,
      `Check by expanding: ${M(ans)}.`,
    ])
  } },
  { lesson: 'factoring', level: 1, make: (r) => {
    const [x, y] = pick(r, [['x', 'y'], ['a', 'b'], ['m', 'n']] as [string, string][])
    const k = ri(r, 2, 6), e = ri(r, 1, 2)
    const inner = lin2R(r, x, y, [1, 2, 3])
    const fs = [x, ...(e === 2 ? [x] : []), ...(r() < 0.5 ? [y] : []), inner]
    return factorSpec(k, fs, 'Take out the greatest common factor: the biggest number and every letter that appears in all the terms.', (src, ans) => [
      `Common factor of the coefficients: ${k}. Every term also contains ${fs.filter((f) => f.length === 1).join('')}.`,
      `Take out ${pretty(fmtFactored(factorsOf(parse(prodStr(k, fs.filter((f) => f.length === 1))))))} and divide each term by it: ${pretty(ans)}.`,
      `Check by expanding: ${M(ans)} = ${pretty(src)}.`,
    ])
  } },
  { lesson: 'factoring', level: 1, make: (r) => {
    const v = pick(r, VARS), [a, b] = distinct(r, 2, () => rnz(r, -9, 9))
    return factorSpec(1, [lin(1, a, v), lin(1, b, v)], 'Find two numbers that multiply to the last term and add to the middle coefficient.', (src) => [
      `For ${pretty(src)} look for two numbers that multiply to ${a * b} and add to ${a + b}.`,
      `Those numbers are ${a} and ${b}, so the factors are (${pretty(lin(1, a, v))}) and (${pretty(lin(1, b, v))}).`,
      `Check: ${M(`(${lin(1, a, v)})(${lin(1, b, v)})`)}.`,
    ])
  } },
  { lesson: 'factoring', level: 1, make: (r) => {
    const v = pick(r, VARS), k = ri(r, 2, 12), c = ri(r, 1, 3)
    return factorSpec(1, [lin(c, -k, v), lin(c, k, v)], 'A difference of two squares: p² − q² = (p − q)(p + q).', (src) => [
      `${pretty(src)} is a difference of squares: ${M(`(${c}${v})^2`)} − ${k * k}.`,
      `p² − q² = (p − q)(p + q) with p = ${c === 1 ? v : c + v} and q = ${k}.`,
      `So it factors as ${pretty(FAC(1, [lin(c, -k, v), lin(c, k, v)]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 2, make: (r) => {
    const v = pick(r, VARS)
    const p = ri(r, 2, 4), q2 = ri(r, 1, 4)
    let fs: string[] = []
    for (let t = 0; t < 100; t++) {
      fs = distinct(r, 2, () => linR(r, v, -7, 7, [p, p, q2]), (s) => s)
      if (fs.length === 2 && fs.some((f) => /^[2-9]/.test(f))) break
    }
    return factorSpec(1, fs, 'The leading coefficient is not 1. Try the "ac" method: split the middle term, or test pairs of brackets.', (src) => [
      `Multiply the first and last coefficients (the "ac" number) and find two numbers with that product that add to the middle coefficient.`,
      `Use them to split the middle term of ${pretty(src)}, then factor by grouping.`,
      `The factors are ${pretty(FAC(1, fs))}. Check by expanding: ${M(prodStr(1, fs))}.`,
    ])
  } },
  { lesson: 'factoring', level: 2, make: (r) => {
    const v = pick(r, VARS), k = ri(r, 2, 5), [a, b] = distinct(r, 2, () => rnz(r, -8, 8))
    return factorSpec(k, [lin(1, a, v), lin(1, b, v)], 'Common factor first, then the trinomial that is left.', (src) => [
      `Take out the common factor ${k}: ${pretty(src)} = ${k}(${pretty(E(`${prodStr(1, [lin(1, a, v), lin(1, b, v)])}`))}).`,
      `Factor the trinomial: two numbers that multiply to ${a * b} and add to ${a + b} are ${a} and ${b}.`,
      `Answer: ${pretty(FAC(k, [lin(1, a, v), lin(1, b, v)]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 2, make: (r) => {
    const [x, y] = pick(r, PAIRS)
    const form = ri(r, 1, 3)
    if (form === 1) {
      const [a, b] = distinct(r, 2, () => rnz(r, -6, 6))
      return factorSpec(1, [lin2(1, a, x, y), lin2(1, b, x, y)], 'Treat it like a trinomial in the first letter; the last term carries the square of the second letter.', (src) => [
        `Think of ${pretty(src)} as a trinomial in ${x}, with ${y} in the coefficients: find two multiples of ${y} that multiply to ${a * b}${y}² and add to ${a + b}${y}.`,
        `They are ${a}${y} and ${b}${y}, so the factors are (${x} + ${a}${y}) and (${x} + ${b}${y}), written with the right signs.`,
        `Check: ${M(prodStr(1, [lin2(1, a, x, y), lin2(1, b, x, y)]))}.`,
      ])
    }
    if (form === 2) {
      const a = ri(r, 1, 4), b = ri(r, 1, 4), s = r() < 0.5 ? 1 : -1
      const f = lin2(a, s * b, x, y)
      if (!coprime(a, b)) return factorSpec(1, [lin2(1, 1, x, y), lin2(1, 1, x, y)], 'A perfect square trinomial: p² ± 2pq + q² = (p ± q)².', (src) => [`${pretty(src)} = (${x} + ${y})².`, `Check: ${M(`(${x}+${y})^2`)}.`])
      return factorSpec(1, [f, f], 'A perfect square trinomial: p² ± 2pq + q² = (p ± q)². Check that the middle term is twice the product.', (src) => [
        `The first and last terms are perfect squares: ${M(`(${a}${x})^2`)} and ${M(`(${b}${y})^2`)}.`,
        `The middle term should be 2 × ${a}${x} × ${b}${y} = ${2 * a * b}${x}${y}. It matches, so ${pretty(src)} = (${pretty(f)})².`,
      ])
    }
    const k = ri(r, 2, 5), a = ri(r, 1, 3), b = ri(r, 1, 3)
    return factorSpec(k, [lin2(a, -b, x, y), lin2(a, b, x, y)], 'Common factor first, then a difference of squares.', (src) => [
      `Take out the common factor ${k}: ${pretty(src)} = ${k}(${pretty(E(`(${lin2(a, -b, x, y)})(${lin2(a, b, x, y)})`))}).`,
      `What is left is a difference of squares: p² − q² = (p − q)(p + q).`,
      `Answer: ${pretty(FAC(k, [lin2(a, -b, x, y), lin2(a, b, x, y)]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 2, make: (r) => {
    const v = pick(r, VARS), a = rnz(r, -6, 6), b = pick(r, [1, 2, 3, 4, 5, 6, 7, 9])
    const q = E(`${v}^2+${b}`)
    return factorSpec(1, [lin(1, a, v), q], 'Four terms: group them in pairs, take a common factor from each pair, and look for a shared bracket.', (src) => [
      `Four terms, so try grouping: ${pretty(src)} = (${pretty(E(`${v}^3+(${a})${v}^2`))}) + (${pretty(E(`${b}${v}+(${a * b})`))}).`,
      `Take a common factor from each group: ${pretty(`${v}^2`)}(${pretty(lin(1, a, v))}) + ${b}(${pretty(lin(1, a, v))}).`,
      `Both groups contain (${pretty(lin(1, a, v))}), so factor it out: ${pretty(FAC(1, [lin(1, a, v), q]))}. The quadratic (${pretty(q)}) cannot be factored further.`,
    ])
  } },
  { lesson: 'factoring', level: 2, make: (r) => {
    const [x, y] = pick(r, PAIRS)
    const [f, g] = distinct(r, 2, () => lin2R(r, x, y, [1, 2]), (s) => s)
    const h = lin2R(r, x, y, [1])
    const hh = h === f || h === g ? lin2(1, 5, x, y) : h
    return factorSpec(1, [f, hh], 'Group the terms in pairs and look for a common bracket. Two letters, but the same idea.', (src) => [
      `Group the terms of ${pretty(src)} into pairs that share a factor.`,
      `Take the common factor from each pair; the same bracket should appear twice.`,
      `Factor out that bracket: ${pretty(FAC(1, [f, hh]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const v = pick(r, ['x', 'x', 'y', 't']), c = ri(r, 1, 4), p = ri(r, 1, 3), plus = r() < 0.5
    const a = p * c
    const f1 = plus ? lin(p, c, v) : lin(p, -c, v)
    const quad = plus ? E(`${p * p}${v}^2-${a}${v}+${c * c}`) : E(`${p * p}${v}^2+${a}${v}+${c * c}`)
    return factorSpec(1, [f1, quad], plus ? 'A sum of cubes: p³ + q³ = (p + q)(p² − pq + q²).' : 'A difference of cubes: p³ − q³ = (p − q)(p² + pq + q²).', (src) => [
      `${pretty(src)} = ${M(`(${p}${v})^3`)} ${plus ? '+' : '−'} ${c ** 3}, a ${plus ? 'sum' : 'difference'} of cubes with p = ${p === 1 ? v : p + v} and q = ${c}.`,
      plus ? 'Use p³ + q³ = (p + q)(p² − pq + q²).' : 'Use p³ − q³ = (p − q)(p² + pq + q²).',
      `Answer: ${pretty(FAC(1, [f1, quad]))}. The quadratic factor has no real roots, so it stays as it is.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), c = ri(r, 1, 3), plus = r() < 0.5
    const f1 = plus ? lin2(1, c, x, y) : lin2(1, -c, x, y)
    const quad = plus ? E(`${x}^2-${c}${x}${y}+${c * c}${y}^2`) : E(`${x}^2+${c}${x}${y}+${c * c}${y}^2`)
    const cc = ri(r, 2, 4)
    return factorSpec(cc, [y, f1, quad], 'Take out the common factor first, then spot the cubes.', (src) => [
      `Take out the common factor ${prodStr(cc, [y])}: ${pretty(src)} = ${pretty(prodStr(cc, [y]))}(${pretty(E(`${x}^3${plus ? '+' : '-'}${c ** 3}${y}^3`))}).`,
      `What is left is a ${plus ? 'sum' : 'difference'} of cubes: ${pretty(`${x}^3`)} ${plus ? '+' : '−'} (${c}${y})³.`,
      `Answer: ${pretty(FAC(cc, [y, f1, quad]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS)
    if (r() < 0.5) {
      const k = ri(r, 1, 3)
      return factorSpec(1, [lin(1, -k, x), lin(1, k, x), E(`${x}^2+${k * k}`)], 'A difference of squares, and then another difference of squares inside it. Factor until nothing more splits.', (src) => [
        `${pretty(src)} = (${pretty(`${x}^2`)})² − (${k * k})²: a difference of squares.`,
        `So it is (${pretty(`${x}^2`)} − ${k * k})(${pretty(`${x}^2`)} + ${k * k}).`,
        `The first bracket is itself a difference of squares: (${x} − ${k})(${x} + ${k}). The second, ${pretty(`${x}^2`)} + ${k * k}, cannot be factored.`,
      ])
    }
    const a = ri(r, 1, 2), b = ri(r, 1, 3)
    return factorSpec(1, [lin2(a, -b, x, y), lin2(a, b, x, y), E(`${a * a}${x}^2+${b * b}${y}^2`)], 'Difference of squares twice: p⁴ − q⁴ = (p² − q²)(p² + q²) = (p − q)(p + q)(p² + q²).', (src) => [
      `${pretty(src)} is a difference of squares, since each term is a perfect fourth power.`,
      `First split: (${pretty(E(`${a * a}${x}^2-${b * b}${y}^2`))})(${pretty(E(`${a * a}${x}^2+${b * b}${y}^2`))}).`,
      `The first bracket is another difference of squares. The sum of squares stays.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const v = pick(r, ['x', 'x', 'y', 't'])
    const [a, b] = distinct(r, 2, () => ri(r, 1, 5)).sort((m, n) => m - n)
    return factorSpec(1, [lin(1, -a, v), lin(1, a, v), lin(1, -b, v), lin(1, b, v)], 'It is a quadratic in disguise: treat v² as a single unknown, factor, then factor again.', (src) => [
      `${pretty(src)} only has even powers, so let u = ${pretty(`${v}^2`)}: it becomes ${pretty(E(`u^2-${a * a + b * b}u+${a * a * b * b}`))}.`,
      `That factors as (u − ${a * a})(u − ${b * b}), so ${pretty(`${v}^2`)} − ${a * a} and ${pretty(`${v}^2`)} − ${b * b}.`,
      `Each is a difference of squares: ${pretty(FAC(1, [lin(1, -a, v), lin(1, a, v), lin(1, -b, v), lin(1, b, v)]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const v = pick(r, ['x', 'x', 'y', 't'])
    const a = rnz(r, -5, 5), b = ri(r, 1, 5)
    return factorSpec(1, [lin(1, -a, v), lin(1, -b, v), lin(1, b, v)], 'A cubic with four terms: group the first pair and the last pair.', (src) => [
      `Group the terms of ${pretty(src)}: (${pretty(E(`${v}^3-${a}${v}^2`))}) + (${pretty(E(`-${b * b}${v}+${a * b * b}`))}).`,
      `Take out the common factors: ${pretty(`${v}^2`)}(${pretty(lin(1, -a, v))}) − ${b * b}(${pretty(lin(1, -a, v))}).`,
      `Factor out the shared bracket, then split the difference of squares: ${pretty(FAC(1, [lin(1, -a, v), lin(1, -b, v), lin(1, b, v)]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS)
    const k = ri(r, 1, 2)
    return factorSpec(1, [lin2(1, -k, x, y), lin2(1, k, x, y), E(`${x}^2+${k}${x}${y}+${k * k}${y}^2`), E(`${x}^2-${k}${x}${y}+${k * k}${y}^2`)], 'Treat it as a difference of squares and as a difference of cubes. Do the squares first, then the cubes.', (src) => [
      `${pretty(src)} = (${pretty(`${x}^3`)})² − (${k === 1 ? '' : k}${y}³)²: a difference of squares, with p = ${pretty(`${x}^3`)}.`,
      `Split it: (${pretty(`${x}^3`)} − ${k ** 3}${y}³)(${pretty(`${x}^3`)} + ${k ** 3}${y}³).`,
      `Now factor the difference of cubes and the sum of cubes. Neither quadratic can be factored further.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), k = ri(r, 1, 7)
    const f1 = E(`${x}+${y}-${k}`), f2 = E(`${x}+${y}+${k}`)
    return factorSpec(1, [f1, f2], 'A difference of squares where one of the squares is a whole bracket: p² − q² with p = (x + y).', (src) => [
      `${pretty(src)} is a difference of squares if you treat (${x} + ${y}) as one thing: (${x} + ${y})² − ${k * k}.`,
      `p² − q² = (p − q)(p + q) with p = ${x} + ${y} and q = ${k}.`,
      `Answer: ${pretty(FAC(1, [f1, f2]))}.`,
    ])
  } },
  { lesson: 'factoring', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), a = rnz(r, -4, 4)
    const f1 = E(`${x}-${y}+(${a})`), f2 = E(`${x}+${y}+(${-a})`)
    const src = E(`${x}^2-(${y}+(${-a}))^2`)
    return alg('factor', `Factor completely: ${pretty(src)}`, src, FAC(1, [f1, f2]), 'Group the three terms that make a perfect square, and see a difference of squares.', [
      `Notice ${pretty(E(`-${y}^2+(${2 * a})${y}+(${-a * a})`))} is the negative of a perfect square: ${pretty(src)} = ${pretty(`${x}^2`)} − (${pretty(E(`${y}+(${-a})`))})².`,
      `That is a difference of squares with p = ${x} and q = ${pretty(E(`${y}+(${-a})`))}: (p − q)(p + q).`,
      `Simplify inside each bracket: ${pretty(FAC(1, [f1, f2]))}.`,
    ])
  } },
]

/* ------------------------------------------------------------------ 3. polynomials */

function polyRoots(expr: string, v = 'x'): { roots: Frac[]; complete: boolean } { return rationalRoots(parseRat(expr).n, v) }
const rootText = (f: Frac, v: string) => `${v} = ${fmtFrac(f)}`

function cubicFactors(r: Rng, repeat: boolean, fractional: boolean): string[] {
  for (;;) {
    const a = ri(r, -4, 4), b = ri(r, -4, 4), c = ri(r, -4, 4)
    const distinctCount = new Set([a, b, c]).size
    const ok = fractional ? (repeat ? b === c : b !== c) : repeat ? distinctCount === 2 : distinctCount === 3
    if (!ok) continue
    const f1 = fractional ? lin(2, pick(r, [-5, -3, -1, 1, 3, 5]), 'x') : lin(1, -a, 'x')
    return [f1, lin(1, -b, 'x'), lin(1, -c, 'x')]
  }
}

const POLYNOMIALS: Gen[] = [
  { lesson: 'polynomials', level: 1, make: (r) => {
    const [a, b, c] = distinct(r, 3, () => rnz(r, -6, 6))
    const fs = [lin(1, -a, 'x'), lin(1, b, 'x'), lin(1, -c, 'x')]
    const lhs = prodStr(1, fs)
    const { roots } = polyRoots(lhs)
    return rootsSpec(`Solve ${pretty(lhs)} = 0. Give all real solutions, separated by commas.`, roots, 'x', 'A product is zero only when one of its factors is zero.', [
      'A product equals zero exactly when at least one factor is zero (the zero product property).',
      `Set each bracket to zero: ${fs.map((f) => `${pretty(f)} = 0`).join(', ')}.`,
      `Solve each: ${[-a, b, -c].map((_, i) => rootText(fr([a, -b, c][i]), 'x')).join(', ')}.`,
    ])
  } },
  { lesson: 'polynomials', level: 1, make: (r) => {
    const b = rnz(r, -4, 4), c = rnz(r, -5, 5), d = rnz(r, -6, 6), a = rnz(r, -3, 3)
    const p = E(`x^3+(${b})x^2+(${c})x+(${d})`)
    const val = pEvalFrac(parsePoly(p), { x: fr(a) })
    return numSpec(`Let p(x) = ${pretty(p)}. Find p(${a < 0 ? `−${-a}` : a}).`, val, 'Substitute the value for x everywhere, using brackets around negatives, and follow the order of operations.', [
      `Replace x with ${a < 0 ? `(−${-a})` : a}: p(${a}) = ${pretty(p.replace(/x/g, `(${a})`))}.`,
      `Work out the powers first, then the products, then add: p(${a}) = ${fmtFrac(val)}.`,
    ])
  } },
  { lesson: 'polynomials', level: 1, make: (r) => {
    const n = ri(r, 2, 3)
    const degs = Array.from({ length: n }, () => ri(r, 1, 4))
    const fs = degs.map((d) => `${rnz(r, 1, 3)}x^${d}+(${rnz(r, -5, 5)})x+(${rnz(r, 1, 5)})`)
    const lp = fs.map((f, i) => (degs[i] === 1 ? E(`${rnz(r, 1, 3)}x+(${rnz(r, 1, 5)})`) : E(f)))
    const total = lp.reduce((s, f) => s + pDeg(parsePoly(f)), 0)
    return numSpec(`What is the degree of ${lp.map((f) => `(${pretty(f)})`).join('')} once it is multiplied out?`, fr(total), 'You do not need to multiply it out: when polynomials are multiplied, the degrees add.', [
      `The degree of a product is the sum of the degrees of the factors.`,
      `The factors have degrees ${lp.map((f) => pDeg(parsePoly(f))).join(', ')}.`,
      `${lp.map((f) => pDeg(parsePoly(f))).join(' + ')} = ${total}.`,
    ])
  } },
  { lesson: 'polynomials', level: 2, make: (r) => {
    const [a, b] = distinct(r, 2, () => rnz(r, -6, 6))
    const lhs = prodStr(1, ['x', lin(1, -a, 'x'), lin(1, -b, 'x')])
    const { roots } = polyRoots(lhs)
    return rootsSpec(`Solve ${pretty(E(lhs))} = 0. Give all real solutions, separated by commas.`, roots, 'x', 'Factor first: take out the common factor, then factor what is left.', [
      `Every term contains x, so take it out: ${pretty(`x(${E(`${prodStr(1, [lin(1, -a, 'x'), lin(1, -b, 'x')])}`)})`)}.`,
      `Factor the quadratic: ${pretty(FAC(1, ['x', lin(1, -a, 'x'), lin(1, -b, 'x')]))} = 0.`,
      `Set each factor to zero: x = 0, x = ${a}, x = ${b}.`,
    ])
  } },
  { lesson: 'polynomials', level: 2, make: (r) => {
    const p = ri(r, 1, 3), q = ri(r, 1, 6)
    const c = ri(r, 1, 3)
    const g = coprime(p, q) ? [lin(p, -q, 'x'), lin(p, q, 'x')] : [lin(1, -q, 'x'), lin(1, q, 'x')]
    const lhs = prodStr(c, ['x', ...g])
    const { roots } = polyRoots(lhs)
    return rootsSpec(`Solve ${pretty(E(lhs))} = 0. Give all real solutions, separated by commas.`, roots, 'x', 'Take out the common factor x, then use a difference of squares. Do not divide both sides by x: you would lose a solution.', [
      `Factor out the common factor: ${pretty(FAC(c, ['x', ...g]))} = 0.`,
      `The bracket pair is a difference of squares, so it splits into two linear factors.`,
      `Each factor can be zero: ${roots.map((f) => rootText(f, 'x')).join(', ')}.`,
    ])
  } },
  { lesson: 'polynomials', level: 2, make: (r) => {
    const a = rnz(r, -5, 5), m = rnz(r, -4, 4), n = rnz(r, -6, 6)
    const quo = E(`x^2+(${m})x+(${n})`)
    const num = E(`(${lin(1, -a, 'x')})(${quo})`)
    const src = `(${num})/(${lin(1, -a, 'x')})`
    return alg('poly', `Divide ${pretty(num)} by (${pretty(lin(1, -a, 'x'))}). Give the quotient.`, src, quo, 'Divide the leading terms, multiply back, subtract, and repeat (long division). Or use synthetic division with the root.', [
      `Divide the leading terms: ${pretty('x^3')} ÷ x = ${pretty('x^2')}. Multiply back: ${pretty(`x^2(${lin(1, -a, 'x')})`)} and subtract.`,
      `Bring down and repeat with what is left.`,
      `The remainder is 0, so (${pretty(lin(1, -a, 'x'))}) is a factor and the quotient is ${pretty(quo)}.`,
    ])
  } },
  { lesson: 'polynomials', level: 2, make: (r) => {
    const a = rnz(r, -4, 4), plus = r() < 0.5
    const b = rnz(r, -4, 4), c = rnz(r, -5, 5), d = rnz(r, -6, 6)
    const p = E(`x^3+(${b})x^2+(${c})x+(${d})`)
    const root = plus ? -a : a
    const rem = pEvalFrac(parsePoly(p), { x: fr(root) })
    return numSpec(`Find the remainder when ${pretty(p)} is divided by (${pretty(lin(1, plus ? a : -a, 'x'))}).`, rem, 'Remainder theorem: dividing p(x) by (x − k) leaves remainder p(k). You do not need long division.', [
      `By the remainder theorem, the remainder on dividing by (x − k) is p(k). Here (${pretty(lin(1, plus ? a : -a, 'x'))}) = (x − (${root})), so k = ${root}.`,
      `Evaluate: p(${root}) = ${pretty(p.replace(/x/g, `(${root})`))}.`,
      `The remainder is ${fmtFrac(rem)}.`,
    ])
  } },
  { lesson: 'polynomials', level: 2, make: (r) => {
    const a = rnz(r, -3, 3), k = rnz(r, -4, 4), b = rnz(r, -5, 5)
    const cc = -(a ** 3 + k * a * a + b * a)
    const poly = `x^3 + k x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${cc < 0 ? '-' : '+'} ${Math.abs(cc)}`
    return numSpec(`The polynomial ${pretty(poly)} has (${pretty(lin(1, -a, 'x'))}) as a factor. Find the value of k.`, fr(k), 'Factor theorem: if (x − a) is a factor then p(a) = 0. Substitute x = a and solve for k.', [
      `If (x − ${a}) is a factor, then p(${a}) = 0 (the factor theorem).`,
      `Substitute x = ${a}: ${a ** 3} + k(${a * a}) ${b * a < 0 ? '−' : '+'} ${Math.abs(b * a)} ${cc < 0 ? '−' : '+'} ${Math.abs(cc)} = 0.`,
      `Solve for k: ${a * a}k = ${-(a ** 3 + b * a + cc)}, so k = ${k}.`,
    ])
  } },
  { lesson: 'polynomials', level: 2, make: (r) => {
    const c = ri(r, 1, 5), sign = r() < 0.5 ? 1 : -1
    const lhs = `x^3${sign === 1 ? '+' : '-'}${c ** 3}`
    return rootsSpec(`Solve ${pretty(E(lhs))} = 0. Give all real solutions, separated by commas.`, [fr(-sign * c)], 'x', 'Factor as a sum or difference of cubes. Does the quadratic factor ever equal zero for real x?', [
      `${pretty(E(lhs))} is a ${sign === 1 ? 'sum' : 'difference'} of cubes: ${pretty(FAC(1, [lin(1, sign * c, 'x'), sign === 1 ? E(`x^2-${c}x+${c * c}`) : E(`x^2+${c}x+${c * c}`)]))} = 0.`,
      `The linear factor gives x = ${-sign * c}.`,
      `The quadratic factor has discriminant ${c * c} − ${4 * c * c} = ${c * c - 4 * c * c} < 0, so it is never zero for real x.`,
      `The only real solution is x = ${-sign * c}.`,
    ])
  } },
  { lesson: 'polynomials', level: 3, make: (r) => {
    const fs = cubicFactors(r, r() < 0.3, r() < 0.35)
    const lhs = prodStr(1, fs)
    const { roots } = polyRoots(lhs)
    const mono = E(lhs)
    return rootsSpec(`Solve ${pretty(mono)} = 0. Give all real solutions, separated by commas.`, roots, 'x', 'Use the rational root theorem to find one root, divide it out, then solve the quadratic that remains.', [
      `Rational root theorem: any rational root is ± (a factor of the constant term) ÷ (a factor of the leading coefficient). List the candidates and test them in p(x).`,
      `One root that works gives a factor; divide it out to leave a quadratic, then factor the quadratic.`,
      `The factored form is ${pretty(FAC(1, fs))} = 0, so ${roots.map((f) => rootText(f, 'x')).join(', ')}.`,
    ])
  } },
  { lesson: 'polynomials', level: 3, make: (r) => {
    const fs = cubicFactors(r, false, false)
    const lhs = prodStr(1, fs)
    const { roots } = polyRoots(lhs)
    const given = pick(r, roots)
    return rootsSpec(`Given that x = ${fmtFrac(given)} is a solution, solve ${pretty(E(lhs))} = 0. Give all real solutions.`, roots, 'x', 'Use the given root to find a factor, divide it out, and solve the quadratic that is left.', [
      `Since x = ${fmtFrac(given)} is a solution, (x − (${fmtFrac(given)})) is a factor.`,
      `Divide ${pretty(E(lhs))} by that factor to get a quadratic: ${pretty(A(pDivExact(parsePoly(lhs), parsePoly(lin(1, -Math.round(fNum(given)), 'x')))!))}.`,
      `Factor the quadratic and solve: ${roots.map((f) => rootText(f, 'x')).join(', ')}.`,
    ])
  } },
  { lesson: 'polynomials', level: 3, make: (r) => {
    const [a, b] = distinct(r, 2, () => ri(r, 1, 5))
    const lhs = E(`x^4-${a * a + b * b}x^2+${a * a * b * b}`)
    const { roots } = polyRoots(lhs)
    return rootsSpec(`Solve ${pretty(lhs)} = 0. Give all real solutions, separated by commas.`, roots, 'x', 'Only even powers: let u = x², solve for u, then take square roots (both signs).', [
      `Let u = ${pretty('x^2')}: ${pretty(`u^2-${a * a + b * b}u+${a * a * b * b}`.replace('-', '-'))} = 0, which factors as (u − ${a * a})(u − ${b * b}) = 0.`,
      `So ${pretty('x^2')} = ${a * a} or ${pretty('x^2')} = ${b * b}.`,
      `Take square roots, remembering both signs: ${roots.map((f) => rootText(f, 'x')).join(', ')}.`,
    ])
  } },
  { lesson: 'polynomials', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), k = rnz(r, -3, 3), m = rnz(r, -3, 3), n = rnz(r, -3, 3)
    const quo = E(`${x}^2+(${m})${x}${y}+(${n})${y}^2`)
    const divisor = lin2(1, -k, x, y)
    const num = E(`(${divisor})(${quo})`)
    return alg('poly', `Divide ${pretty(num)} by (${pretty(divisor)}). Give the quotient.`, `(${num})/(${divisor})`, quo, 'Treat it as long division in the first letter, carrying the second letter in the coefficients.', [
      `Divide the leading terms: ${pretty(`${x}^3`)} ÷ ${x} = ${pretty(`${x}^2`)}, then multiply back by (${pretty(divisor)}) and subtract.`,
      `Repeat with the new leading term until nothing is left.`,
      `The remainder is 0, so the quotient is ${pretty(quo)}.`,
    ])
  } },
  { lesson: 'polynomials', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), k = rnz(r, -3, 3), a = ri(r, 2, 5), b = rnz(r, -3, 3)
    const p = E(`(${x}+(${k})${y})^3`)
    const val = pEvalFrac(parsePoly(p), { [x]: fr(a), [y]: fr(b) })
    return numSpec(`Find the value of ${pretty(p)} when ${x} = ${a} and ${y} = ${b < 0 ? `−${-b}` : b}.`, val, 'Substitute carefully, with brackets around negative values. Or spot the pattern first.', [
      `The expression is a perfect cube: ${pretty(p)} = (${pretty(E(`${x}+(${k})${y}`))})³.`,
      `Substitute: ${a} ${k * b < 0 ? '−' : '+'} ${Math.abs(k * b)} = ${a + k * b}.`,
      `Cube it: ${a + k * b}³ = ${fmtFrac(val)}.`,
    ])
  } },
]

/* ------------------------------------------------------------------ 4. simplifying rational expressions */

interface FracSide { c: number; fs: string[] }
function simplifyQ(common: FracSide, nSide: FracSide, dSide: FracSide, expanded: boolean, hint: string, steps: (info: { nStr: string; dStr: string; ans: string }) => string[]): Spec | null {
  const nStr = prodStr(common.c * nSide.c, [...common.fs, ...nSide.fs])
  const dStr = prodStr(dSide.c, [...common.fs, ...dSide.fs])
  const nf = factorsOf(parse(nStr)), df = factorsOf(parse(dStr))
  const { n, d } = cancel(nf, df)
  const ans = ratioText(n, d)
  const src = expanded ? fracStr(E(nStr), E(dStr)) : fracStr(fmtFactored(factorsOf(parse(nStr))), fmtFactored(factorsOf(parse(dStr))))
  if (src.replace(/\s/g, '') === ans.replace(/\s/g, '')) return null
  return alg('rational', `Simplify: ${pretty(src)}`, src, ans, hint, steps({ nStr, dStr, ans }))
}
const simplifySteps = (c: string) => ({ nStr, dStr, ans }: { nStr: string; dStr: string; ans: string }) => [
  `Factor the numerator and the denominator completely: ${pretty(fracStr(fmtFactored(factorsOf(parse(nStr))), fmtFactored(factorsOf(parse(dStr)))))}.`,
  `Cancel the factors that appear on both the top and the bottom: ${c}.`,
  `What remains is ${pretty(ans)}.`,
]

const SIMPLIFY: Gen[] = [
  { lesson: 'rational-simplify', level: 1, make: (r) => {
    for (;;) {
      const [x, y] = pick(r, [['x', 'y'], ['a', 'b'], ['m', 'n']] as [string, string][])
      const p1 = ri(r, 1, 4), q1 = ri(r, 0, 2), p2 = ri(r, 1, 4), q2 = ri(r, 0, 2)
      const k1 = ri(r, 1, 12), k2 = ri(r, 2, 15)
      const mono = (a: number, b: number) => [...Array(a).fill(x), ...Array(b).fill(y)] as string[]
      const num = prodStr(k1, mono(p1, q1)), den = prodStr(k2, mono(p2, q2))
      const { n, d } = cancel(factorsOf(parse(num)), factorsOf(parse(den)))
      const ans = ratioText(n, d)
      const src = fracStr(E(num), E(den))
      if (src === ans || (p1 === p2 && q1 === q2 && k1 === k2)) continue
      return alg('rational', `Simplify: ${pretty(src)}`, src, ans, 'Cancel the common number, then subtract the powers of each letter (the bigger power stays where it was).', [
        `Divide the numbers by their greatest common factor.`,
        `For each letter, subtract the smaller power from the larger one: the leftover stays on the side that had more.`,
        `Result: ${pretty(ans)}.`,
      ])
    }
  } },
  { lesson: 'rational-simplify', level: 1, make: (r) => {
    for (let t = 0; t < 100; t++) {
      const v = pick(r, VARS), c = rnz(r, -7, 7), b = rnz(r, -7, 7)
      if (b === c) continue
      const q = simplifyQ({ c: 1, fs: [lin(1, c, v)] }, { c: 1, fs: [lin(1, b, v)] }, { c: 1, fs: [] }, true, 'Factor the numerator, then cancel the bracket that also appears in the denominator.', simplifySteps(`the bracket (${pretty(lin(1, c, v))})`))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 1, make: (r) => {
    for (let t = 0; t < 100; t++) {
      const v = pick(r, VARS), k = ri(r, 2, 9), a = ri(r, 1, 4), b = rnz(r, -6, 6)
      if (!coprime(a, Math.abs(b))) continue
      const q = simplifyQ({ c: k, fs: [] }, { c: 1, fs: [lin(a, b, v)] }, { c: ri(r, 2, 12) * 1, fs: [] }, false, 'Cancel the common number first, then look for common brackets.', simplifySteps('the common number'))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 2, make: (r) => {
    for (let t = 0; t < 200; t++) {
      const v = pick(r, VARS), [c, b, d] = distinct(r, 3, () => rnz(r, -7, 7))
      const q = simplifyQ({ c: 1, fs: [lin(1, c, v)] }, { c: 1, fs: [lin(1, b, v)] }, { c: 1, fs: [lin(1, d, v)] }, true, 'Factor the top and the bottom completely, then cancel the common bracket. State nothing that cancels twice.', simplifySteps(`the bracket (${pretty(lin(1, c, v))})`))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 2, make: (r) => {
    for (let t = 0; t < 200; t++) {
      const v = pick(r, VARS)
      const [f, g, h] = distinct(r, 3, () => linR(r, v, -6, 6, [1, 2, 3]))
      const q = simplifyQ({ c: 1, fs: [f] }, { c: 1, fs: [g] }, { c: 1, fs: [h] }, true, 'The leading coefficient is not 1 in at least one factor. Factor with care, then cancel the common bracket.', simplifySteps(`the bracket (${pretty(f)})`))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 2, make: (r) => {
    for (let t = 0; t < 200; t++) {
      const [x, y] = pick(r, PAIRS)
      const [f, g, h] = distinct(r, 3, () => lin2R(r, x, y, [1, 2]))
      const q = simplifyQ({ c: 1, fs: [f] }, { c: 1, fs: [g] }, { c: 1, fs: [h] }, true, 'Two letters, same method: factor both parts and cancel the common bracket.', simplifySteps(`the bracket (${pretty(f)})`))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 2, make: (r) => {
    for (let t = 0; t < 200; t++) {
      const [a, b] = distinct(r, 2, () => rnz(r, -6, 6))
      const den = E(`(${lin(1, -a, 'x')})(${lin(1, -b, 'x')})`)
      const nume = E(`${rnz(r, 1, 4)}x+(${rnz(r, -6, 6)})`)
      const bad = [a, b]
      const src = fracStr(nume, den)
      return rootsSpec(`For which values of x is ${pretty(src)} undefined? Give all of them, separated by commas.`, bad.map((n) => fr(n)), 'x', 'A fraction is undefined when its denominator is zero. Factor the denominator and set each factor to zero.', [
        `The fraction is undefined when the denominator is zero.`,
        `Factor the denominator: ${pretty(FAC(1, [lin(1, -a, 'x'), lin(1, -b, 'x')]))} = 0.`,
        `Set each factor to zero: x = ${a} or x = ${b}. These values are excluded, even if a factor later cancels.`,
      ])
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 3, make: (r) => {
    for (let t = 0; t < 300; t++) {
      const x = pick(r, ['x', 'x', 'x', 't', 'n']), c = ri(r, 1, 4)
      const form = ri(r, 1, 4)
      let q: Spec | null
      if (form === 1) q = simplifyQ({ c: 1, fs: [lin(1, -c, x)] }, { c: 1, fs: [E(`${x}^2+${c}${x}+${c * c}`)] }, { c: 1, fs: [lin(1, c, x)] }, true, 'Cubes: p³ − q³ = (p − q)(p² + pq + q²). Factor top and bottom, then cancel.', simplifySteps(`the bracket (${pretty(lin(1, -c, x))})`))
      else if (form === 2) q = simplifyQ({ c: 1, fs: [lin(1, c, x)] }, { c: 1, fs: [E(`${x}^2-${c}${x}+${c * c}`)] }, { c: 1, fs: [lin(1, -c, x)] }, true, 'Cubes: p³ + q³ = (p + q)(p² − pq + q²). Factor top and bottom, then cancel.', simplifySteps(`the bracket (${pretty(lin(1, c, x))})`))
      else if (form === 3) q = simplifyQ({ c: 1, fs: [lin(1, -c, x), lin(1, c, x)] }, { c: 1, fs: [E(`${x}^2+${c * c}`)] }, { c: 1, fs: [E(`${x}^2-${c}${x}+${c * c}`), lin(1, c, x)].slice(0, 1) }, true, 'Fourth powers are differences of squares twice. Factor completely before cancelling.', simplifySteps('every bracket that appears on both the top and the bottom'))
      else q = simplifyQ({ c: 1, fs: [lin(1, -c, x), lin(1, c, x)] }, { c: ri(r, 1, 3), fs: [lin(1, ri(r, 5, 9), x)] }, { c: ri(r, 2, 5), fs: [lin(1, -ri(r, 5, 9), x)] }, true, 'Factor everything: look for common factors, differences of squares and trinomials, then cancel.', simplifySteps('the common brackets and the common number'))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 3, make: (r) => {
    for (let t = 0; t < 300; t++) {
      const [x, y] = pick(r, PAIRS), c = ri(r, 1, 3)
      const form = ri(r, 1, 3)
      let q: Spec | null
      if (form === 1) q = simplifyQ({ c: 1, fs: [lin2(1, -c, x, y)] }, { c: 1, fs: [E(`${x}^2+${c}${x}${y}+${c * c}${y}^2`)] }, { c: 1, fs: [lin2(1, c, x, y)] }, true, 'Cubes in two letters. Factor the difference of cubes and the difference of squares, then cancel.', simplifySteps(`the bracket (${pretty(lin2(1, -c, x, y))})`))
      else if (form === 2) q = simplifyQ({ c: ri(r, 2, 4), fs: [y, lin2(1, c, x, y)] }, { c: 1, fs: [E(`${x}^2-${c}${x}${y}+${c * c}${y}^2`)] }, { c: 1, fs: [x, lin2(1, -c, x, y)] }, true, 'Take out common factors first, including letters. Then factor and cancel.', simplifySteps('the common factors'))
      else q = simplifyQ({ c: 1, fs: [lin2(1, -c, x, y), lin2(1, c, x, y)] }, { c: 1, fs: [E(`${x}^2+${c * c}${y}^2`)] }, { c: ri(r, 1, 3), fs: [lin2(1, -2 * c, x, y)] }, true, 'Fourth powers: factor the difference of squares twice, then cancel.', simplifySteps('every common bracket'))
      if (q) return q
    }
    return fallback('rational-simplify')
  } },
  { lesson: 'rational-simplify', level: 3, make: (r) => {
    for (let t = 0; t < 300; t++) {
      const v = pick(r, ['x', 'x', 'x', 't']), [a, b, c] = distinct(r, 3, () => rnz(r, -6, 6))
      // numerator has (a - x), denominator has (x - a): opposite factors
      const num = prodStr(1, [lin(-1, a, v), lin(1, b, v)]), den = prodStr(1, [lin(1, -a, v), lin(1, c, v)])
      const { n, d } = cancel(factorsOf(parse(num)), factorsOf(parse(den)))
      const ans = ratioText(n, d)
      const src = fracStr(E(num), E(den))
      return alg('rational', `Simplify: ${pretty(src)}`, src, ans, 'Watch the signs: (a − x) = −(x − a), so opposite brackets cancel and leave a −1.', [
        `Factor top and bottom: ${pretty(num)} over ${pretty(den)}.`,
        `The brackets (${pretty(lin(-1, a, v))}) and (${pretty(lin(1, -a, v))}) are opposites: (${pretty(lin(-1, a, v))}) = −(${pretty(lin(1, -a, v))}).`,
        `Cancel and keep the −1: ${pretty(ans)}.`,
      ])
    }
    return fallback('rational-simplify')
  } },
]

/* ------------------------------------------------------------------ 5. operations on rational expressions */

interface Fr { kn: number; n: string[]; kd: number; d: string[] }
const frText = (f: Fr) => fracStr(FAC(f.kn, f.n), FAC(f.kd, f.d))
const frExp = (f: Fr) => fracStr(E(prodStr(f.kn, f.n)), E(prodStr(f.kd, f.d)))
const showOps = (s: string) => pretty(s).replace(/ \* /g, ' × ').replace(/\) \/ \(/g, ') ÷ (')

function mulDivSpec(a: Fr, b: Fr, divide: boolean, expanded: boolean, hint: string): Spec | null {
  const left = expanded ? frExp(a) : frText(a), right = expanded ? frExp(b) : frText(b)
  const src = `(${left}) ${divide ? '/' : '*'} (${right})`
  const second = divide ? { kn: b.kd, n: b.d, kd: b.kn, d: b.n } : b
  const nf = factorsOf(parse(prodStr(a.kn * second.kn, [...a.n, ...second.n])))
  const df = factorsOf(parse(prodStr(a.kd * second.kd, [...a.d, ...second.d])))
  const { n, d } = cancel(nf, df)
  const ans = ratioText(n, d)
  if (isOne(n) && isOne(d)) return null
  const steps = [
    divide ? `Dividing is multiplying by the reciprocal: flip the second fraction.` : `Multiplying fractions: multiply the tops and the bottoms, but cancel first.`,
    `Factor every numerator and denominator completely: ${pretty(frText(a))} and ${pretty(frText(second))}.`,
    `Cancel every factor that appears on both a top and a bottom (they may be in different fractions).`,
    `What is left: ${pretty(ans)}.`,
  ]
  return alg('rational', `${divide ? 'Divide' : 'Multiply'} and simplify: ${showOps(src)}`, src, ans, hint, steps)
}

function combineSpec(ts: TermIn[], showExpanded: boolean, hint: string, lead = 'Add and simplify'): Spec | null {
  const c = combine(ts, showExpanded)
  if (!c) return null
  return alg('rational', `${lead}: ${pretty(c.src)}`, c.src, c.answer, hint, c.steps)
}

const monoFr = (r: Rng, x: string, y: string): Fr => {
  const mono = (a: number, b: number) => [...Array(a).fill(x), ...Array(b).fill(y)] as string[]
  return { kn: ri(r, 1, 6), n: mono(ri(r, 0, 3), ri(r, 0, 2)), kd: ri(r, 2, 9), d: mono(ri(r, 1, 3), ri(r, 0, 2)) }
}

const OPERATIONS: Gen[] = [
  { lesson: 'rational-ops', level: 1, make: (r) => {
    for (let t = 0; t < 100; t++) {
      const [x, y] = pick(r, [['x', 'y'], ['a', 'b'], ['m', 'n']] as [string, string][])
      const a = monoFr(r, x, y), b = monoFr(r, x, y), divide = r() < 0.4
      const q = mulDivSpec(a, b, divide, false, 'Multiply across (or flip the second fraction to divide), then cancel numbers and powers of each letter.')
      if (q) return q
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 1, make: (r) => {
    for (let t = 0; t < 100; t++) {
      const v = pick(r, VARS)
      const d = linR(r, v, -6, 6, [1])
      const n1 = E(`${rnz(r, 1, 5)}${v}+(${rnz(r, -6, 6)})`), n2 = E(`${rnz(r, 1, 4)}${v}+(${rnz(r, -6, 6)})`)
      const sub = r() < 0.5
      const q = combineSpec([{ sign: 1, n: n1, d }, { sign: sub ? -1 : 1, n: n2, d }], false, 'Same denominator: combine the numerators and keep the denominator. Subtracting changes every sign in the second numerator.', sub ? 'Subtract and simplify' : 'Add and simplify')
      if (q) return q
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 1, make: (r) => {
    for (let t = 0; t < 100; t++) {
      const v = pick(r, VARS)
      const m = pick(r, [2, 3, 4, 5, 6]), n = pick(r, [2, 3, 4, 5, 6, 8, 9])
      if (m === n) continue
      const sub = r() < 0.5
      const q = combineSpec([{ sign: 1, n: E(`${rnz(r, 1, 4)}${v}+(${rnz(r, -5, 5)})`), d: String(m) }, { sign: sub ? -1 : 1, n: E(`${rnz(r, 1, 4)}${v}+(${rnz(r, -5, 5)})`), d: String(n) }], false, 'Find a common denominator (the lowest common multiple of the numbers), rewrite each fraction, then combine.', sub ? 'Subtract and simplify' : 'Add and simplify')
      if (q) return q
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 2, make: (r) => {
    for (let t = 0; t < 300; t++) {
      const v = pick(r, VARS)
      const [f, g, h, i, j] = distinct(r, 5, () => linR(r, v, -6, 6, [1, 1, 2]), (s) => s)
      const a: Fr = { kn: 1, n: [f, g], kd: 1, d: [h, i] }, b: Fr = { kn: 1, n: [h, j], kd: 1, d: [f, i] }
      const q = mulDivSpec(a, b, r() < 0.4, true, 'Factor every top and bottom first (the quadratics are written expanded), then cancel across both fractions.')
      if (q) return q
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 2, make: (r) => {
    for (let t = 0; t < 300; t++) {
      const v = pick(r, VARS)
      const [p, q2] = distinct(r, 2, () => rnz(r, -6, 6))
      const sub = r() < 0.5
      const spec = combineSpec([
        { sign: 1, n: r() < 0.5 ? String(rnz(r, 1, 6)) : lin(1, rnz(r, -5, 5), v), d: lin(1, p, v) },
        { sign: sub ? -1 : 1, n: r() < 0.5 ? String(rnz(r, 1, 6)) : lin(1, rnz(r, -5, 5), v), d: lin(1, q2, v) },
      ], false, 'Different denominators: the LCD is the product of the two. Multiply top and bottom of each fraction by the other denominator.', sub ? 'Subtract and simplify' : 'Add and simplify')
      if (spec) return spec
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 2, make: (r) => {
    for (let t = 0; t < 300; t++) {
      const [x, y] = pick(r, PAIRS)
      const form = ri(r, 1, 4)
      let spec: Spec | null
      if (form === 1) spec = combineSpec([{ sign: 1, n: '1', d: x }, { sign: 1, n: '1', d: y }], false, 'Different letters in the denominators: the LCD is the product of them.')
      else if (form === 2) spec = combineSpec([{ sign: 1, n: x, d: y }, { sign: -1, n: y, d: x }], false, 'The LCD is xy. Rewrite each fraction over it, then subtract the numerators.', 'Subtract and simplify')
      else if (form === 3) spec = combineSpec([{ sign: 1, n: String(ri(r, 1, 5)), d: prodStr(ri(r, 2, 4), [x]) }, { sign: r() < 0.5 ? 1 : -1, n: String(ri(r, 1, 5)), d: prodStr(ri(r, 2, 6), [y, ...(r() < 0.5 ? [y] : [])]) }], false, 'Find the LCD of the numbers and of the letters separately, then combine.')
      else spec = combineSpec([{ sign: 1, n: lin2(1, rnz(r, -3, 3), x, y), d: x }, { sign: -1, n: lin2(1, rnz(r, -3, 3), x, y), d: y }], false, 'The LCD is xy. Multiply top and bottom of each fraction by the missing letter, then combine.', 'Subtract and simplify')
      if (spec) return spec
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 3, make: (r) => {
    for (let t = 0; t < 400; t++) {
      const v = pick(r, ['x', 'x', 'x', 't'])
      const [f, g, h] = distinct(r, 3, () => linR(r, v, -6, 6, [1, 1, 2]), (s) => s)
      const sub = r() < 0.5
      const spec = combineSpec([
        { sign: 1, n: r() < 0.5 ? String(rnz(r, 1, 6)) : lin(1, rnz(r, -4, 4), v), d: prodStr(1, [f, g]) },
        { sign: sub ? -1 : 1, n: r() < 0.5 ? String(rnz(r, 1, 6)) : lin(1, rnz(r, -4, 4), v), d: prodStr(1, [f, h]) },
      ], true, 'The denominators are multiplied out: factor them first. The LCD uses each different factor once.', sub ? 'Subtract and simplify' : 'Add and simplify')
      if (spec) return spec
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 3, make: (r) => {
    for (let t = 0; t < 400; t++) {
      const v = pick(r, ['x', 'x', 'x', 't']), c = ri(r, 1, 4)
      const lin1 = lin(1, -c, v), quad = E(`${v}^2+${c}${v}+${c * c}`)
      const sub = r() < 0.5
      const second = r() < 0.5 ? { sign: (sub ? -1 : 1) as 1 | -1, n: String(rnz(r, 1, 6)), d: lin1 } : { sign: (sub ? -1 : 1) as 1 | -1, n: lin(1, rnz(r, -4, 4), v), d: quad }
      const spec = combineSpec([{ sign: 1, n: String(rnz(r, 1, 9)), d: prodStr(1, [lin1, quad]) }, second], true, 'The first denominator is a difference of cubes. Factor it, then find the LCD.', sub ? 'Subtract and simplify' : 'Add and simplify')
      if (spec) return spec
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 3, make: (r) => {
    for (let t = 0; t < 400; t++) {
      const v = pick(r, ['x', 'x', 'x', 't']), p = ri(r, 1, 5)
      const spec = combineSpec([
        { sign: 1, n: String(rnz(r, 1, 5)), d: lin(1, -p, v) },
        { sign: r() < 0.5 ? 1 : -1, n: String(rnz(r, 1, 5)), d: lin(1, p, v) },
        { sign: r() < 0.5 ? 1 : -1, n: String(rnz(r, 1, 9)), d: prodStr(1, [lin(1, -p, v), lin(1, p, v)]) },
      ], r() < 0.5, 'Three fractions. The LCD is the biggest denominator, (x − p)(x + p). Rewrite each over it.', 'Simplify')
      if (spec) return spec
    }
    return fallback('rational-ops')
  } },
  { lesson: 'rational-ops', level: 3, make: (r) => {
    const [x, y] = pick(r, PAIRS), v = pick(r, ['x', 'x', 't', 'n'])
    const a = ri(r, 1, 4), b = ri(r, 1, 4), p = ri(r, 1, 5), h = pick(r, ['h', 'h', 'k'])
    const form = ri(r, 1, 5)
    const make = (src: string, ans: string, hint: string, steps: string[]) => alg('rational', `Simplify: ${showOps(src)}`, src, ans, hint, steps)
    if (form === 1 && coprime(a, b)) return make(`(${a}/${x} + ${b}/${y}) / (${a}/${x} - ${b}/${y})`, fracStr(E(`${a}${y}+${b}${x}`), E(`${a}${y}-${b}${x}`)), 'Multiply the top and the bottom of the whole thing by the LCD of the small fractions, xy.', [
      `Find the LCD of all the small fractions: ${x}${y}.`,
      `Multiply the numerator and the denominator of the big fraction by ${x}${y}. Every small fraction clears.`,
      `The top becomes ${pretty(E(`${a}${y}+${b}${x}`))} and the bottom becomes ${pretty(E(`${a}${y}-${b}${x}`))}.`,
    ])
    if (form === 2) return make(`(1 - ${p * p}/${v}^2) / (1 - ${p}/${v})`, fracStr(E(`${v}+${p}`), v), 'Multiply the top and the bottom by the LCD, x². Then factor and cancel.', [
      `The LCD of the small fractions is ${pretty(`${v}^2`)}. Multiply the top and the bottom by it.`,
      `The top becomes ${pretty(E(`${v}^2-${p * p}`))} and the bottom becomes ${pretty(E(`${v}^2-${p}${v}`))}.`,
      `Factor: (${v} − ${p})(${v} + ${p}) over ${v}(${v} − ${p}). Cancel (${v} − ${p}) to leave ${pretty(fracStr(E(`${v}+${p}`), v))}.`,
    ])
    if (form === 3) return make(`(1/(${v} + ${h}) - 1/${v}) / ${h}`, fracStr('-1', prodStr(1, [v, E(`${v}+${h}`)])), 'This is a difference quotient. Combine the small fractions over the LCD x(x + h), and watch the h cancel.', [
      `Combine the fractions on top over the LCD ${pretty(`${v}(${v} + ${h})`)}: ${pretty(fracStr(E(`${v}-(${v}+${h})`), prodStr(1, [v, E(`${v}+${h}`)])))}.`,
      `The numerator simplifies to −${h}.`,
      `Dividing by ${h} cancels it: ${pretty(fracStr('-1', prodStr(1, [v, E(`${v}+${h}`)])))}.`,
    ])
    if (form === 4) return make(`(1/(${v} - ${p}) - 1/(${v} + ${p})) / (1/(${v} - ${p}) + 1/(${v} + ${p}))`, fracStr(String(p), v), 'Multiply top and bottom by the LCD (x − p)(x + p). Many terms cancel.', [
      `Multiply the numerator and denominator by the LCD ${pretty(`(${v} − ${p})(${v} + ${p})`)}.`,
      `The top becomes (${v} + ${p}) − (${v} − ${p}) = ${2 * p}; the bottom becomes (${v} + ${p}) + (${v} − ${p}) = ${pretty(`2${v}`)}.`,
      `So the result is ${pretty(`${2 * p}/(2${v})`)}, which simplifies to ${pretty(fracStr(String(p), v))}.`,
    ])
    return make(`(${v} - ${p * p}/${v}) / (1 - ${p}/${v})`, E(`${v}+${p}`), 'Multiply the top and the bottom by x to clear the small fractions.', [
      `Multiply the numerator and the denominator by ${v}, the LCD of the small fractions.`,
      `The top becomes ${pretty(E(`${v}^2-${p * p}`))} and the bottom becomes ${pretty(E(`${v}-${p}`))}.`,
      `Factor the top as (${v} − ${p})(${v} + ${p}) and cancel (${v} − ${p}): ${pretty(E(`${v}+${p}`))}.`,
    ])
  } },
]

/* ------------------------------------------------------------------ 6. rational equations */

function search<T>(tries: number, build: () => T | null): T | null {
  for (let i = 0; i < tries; i++) { const t = build(); if (t) return t }
  return null
}

function equationSpec(lhs: string, rhs: string, v: string, hint: string, lcdText: string | null): Spec | null {
  const L = parseRat(lhs), R = parseRat(rhs)
  const sol = solveEquation(L, R, v)
  if (sol.identity || !sol.complete) return null
  const diff = rSub(L, R)
  const excluded = [L.d, R.d].flatMap((d) => (isConst(d) ? [] : rationalRoots(d, v).roots))
  const uniq = (xs: Frac[]) => xs.filter((f, i) => xs.findIndex((g) => fEq(f, g)) === i).sort((a, b) => fNum(a) - fNum(b))
  const ex = uniq(excluded)
  const cand = uniq([...sol.roots, ...sol.extraneous])
  const steps = [
    ex.length ? `First note the restrictions: the denominators cannot be zero, so ${joinList(ex.map((f) => rootText(f, v).replace('=', '≠')))}.` : 'There is no letter in any denominator, so there are no restrictions.',
    lcdText ? `Multiply both sides by the LCD, ${pretty(lcdText)}, to clear the fractions.` : `Multiply both sides by the common denominator to clear the fractions.`,
    `Collect everything on one side: ${pretty(A(isConst(diff.d) ? diff.n : diff.n))} = 0.`,
    cand.length ? `Solve: ${cand.map((f) => rootText(f, v)).join(' or ')}.` : 'This has no solution.',
  ]
  if (sol.extraneous.length) steps.push(`Check each candidate against the restrictions: ${joinList(sol.extraneous.map((f) => rootText(f, v)))} makes a denominator zero, so it is extraneous and must be rejected.`)
  else if (cand.length) steps.push('Check each answer against the restrictions: none of them makes a denominator zero, so all are valid.')
  if (!sol.roots.length) steps.push('No candidate survives, so the equation has no solution.')
  const prompt = `Solve for ${v}: ${pretty(lhs)} = ${pretty(rhs)}. Give all solutions, separated by commas${sol.roots.length === 0 || sol.extraneous.length ? ' (if there are none, type "no solution")' : ''}.`
  return rootsSpec(prompt, sol.roots, v, hint, steps)
}

function solveForSpec(src: string, v: string, answer: string, steps: string[], hint: string): Spec {
  const [lhs, rhs] = src.split(' = ')
  const e = alg('equiv', `Solve for ${v}: ${pretty(src)}`, `(${lhs}) - (${rhs})`, answer, hint, steps, v)
  return { ...e, display: `${v} = ${pretty(answer)}` }
}

const EQUATIONS: Gen[] = [
  { lesson: 'rational-eq', level: 1, make: (r) => {
    const q = search(300, () => {
      const m = pick(r, [2, 3, 4, 5, 6]), n = pick(r, [2, 3, 4, 5, 6, 8])
      if (m === n) return null
      const sum = r() < 0.5
      const lhs = sum ? `x/${m} + (${rnz(r, -4, 4)})/${n}` : `(x + (${rnz(r, -6, 6)}))/${m}`
      const rhs = sum ? String(rnz(r, -3, 6)) : `(x + (${rnz(r, -6, 6)}))/${n}`
      const spec = equationSpec(lhs, rhs, 'x', 'Multiply both sides by the LCD of the numbers to clear the fractions, then solve the linear equation.', String(m * n / gcdI(m, n)))
      return spec && spec.answers.length === 1 ? spec : null
    })
    if (!q) return fallback('rational-eq')
    return q
  } },
  { lesson: 'rational-eq', level: 1, make: (r) => {
    const q = search(300, () => {
      const v = pick(r, ['x', 'x', 'x', 'n', 't'])
      const a = rnz(r, 1, 9), b = rnz(r, 1, 9), c = rnz(r, 1, 6)
      const form = ri(r, 1, 3)
      const lhs = form === 1 ? `${a}/${v}` : form === 2 ? `${v}/${a}` : `${a}/(${v} + ${c})`
      const rhs = form === 1 ? `${b}/(${v} + ${c})` : form === 2 ? `${b}/${v}` : `${b}/${v}`
      const spec = equationSpec(lhs, rhs, v, 'A proportion: cross-multiply (or multiply both sides by both denominators), then solve. Remember to check for values that make a denominator zero.', null)
      return spec
    })
    if (!q) return fallback('rational-eq')
    return q
  } },
  { lesson: 'rational-eq', level: 2, make: (r) => {
    const q = search(500, () => {
      const [p, q2] = distinct(r, 2, () => rnz(r, -5, 5))
      const n1 = rnz(r, 1, 5), n2 = rnz(r, 1, 5), k = rnz(r, 1, 4)
      const lhs = `${n1}/(x + (${p})) + ${n2}/(x + (${q2}))`
      const spec = equationSpec(lhs, String(k), 'x', 'Multiply every term by the LCD, (x + p)(x + q), to clear the fractions. You will get a quadratic: factor it.', prodStr(1, [lin(1, p, 'x'), lin(1, q2, 'x')]))
      return spec && spec.answers.length >= 1 ? spec : null
    })
    if (!q) return fallback('rational-eq')
    return q
  } },
  { lesson: 'rational-eq', level: 2, make: (r) => {
    const q = search(600, () => {
      const [p, q2] = distinct(r, 2, () => rnz(r, -5, 5))
      const n1 = rnz(r, 1, 4), n2 = rnz(r, 1, 4)
      const form = ri(r, 1, 2)
      let lhs: string, rhs: string
      if (form === 1) {
        // a/(x-p) + b/(x-q) = c/((x-p)(x-q)) with the root forced onto p or q
        const n3 = r() < 0.5 ? n1 * (p - q2) : n2 * (q2 - p)
        lhs = `${n1}/(x + (${-p})) + ${n2}/(x + (${-q2}))`
        rhs = `${n3}/((x + (${-p}))(x + (${-q2})))`
        if (n3 === 0) return null
      } else {
        lhs = `(x + (${rnz(r, -4, 4)}))/(x + (${-p}))`
        rhs = `(${rnz(r, -4, 4)})/(x + (${-p})) + ${rnz(r, 1, 3)}`
      }
      const spec = equationSpec(lhs, rhs, 'x', 'Multiply through by the LCD, then CHECK each answer in the original: a value that makes a denominator zero is extraneous and must be rejected.', null)
      return spec && (spec.display === 'no solution' || spec.answers.length >= 1) && /extraneous/.test(spec.explanation.join(' ')) ? spec : null
    })
    if (!q) return fallback('rational-eq')
    return q
  } },
  { lesson: 'rational-eq', level: 2, make: (r) => {
    const [a, b, c] = pick(r, [['a', 'b', 'c'], ['f', 'u', 'v'], ['p', 'q', 'r']] as [string, string, string][])
    const form = ri(r, 1, 4)
    if (form === 4) {
      let k = ri(r, 1, 4), m = rnz(r, -6, 6), d = rnz(r, -6, 6)
      while (m === k * d) { m = rnz(r, -6, 6); d = rnz(r, -6, 6) }
      const top = E(`${k}x+(${m})`), bottom = E(`x+(${d})`)
      const ans = fracStr(E(`${m}-(${d})y`), E(`y-(${k})`))
      return solveForSpec(`y = ${fracStr(top, bottom)}`, 'x', ans, [
        `Multiply both sides by (${pretty(bottom)}): y(${pretty(bottom)}) = ${pretty(top)}.`,
        `Expand: ${pretty(E(`y*(${bottom})`))} = ${pretty(top)}. Collect the x terms on one side: ${pretty(E(`y*x-(${k})x`))} = ${pretty(E(`${m}-(${d})y`))}.`,
        `Factor out x: x(${pretty(E(`y-(${k})`))}) = ${pretty(E(`${m}-(${d})y`))}, then divide: x = ${pretty(ans)}.`,
      ], 'Clear the fraction, get every term containing x on one side, factor x out, and divide.')
    }
    if (form === 1) return solveForSpec(`1/${a} = 1/${b} + 1/${c}`, c, fracStr(prodStr(1, [a, b]), E(`${b}-${a}`)), [
      `Subtract 1/${b} from both sides: 1/${c} = 1/${a} − 1/${b}.`,
      `Combine the right side over the LCD ${a}${b}: 1/${c} = (${b} − ${a})/(${a}${b}).`,
      `Flip both sides: ${c} = ${pretty(fracStr(prodStr(1, [a, b]), E(`${b}-${a}`)))}.`,
    ], `Get the fractions containing ${c} on their own, combine, then take the reciprocal of both sides.`)
    if (form === 2) return solveForSpec(`${a}/${b} + ${c} = ${rnz(r, 2, 5)}`.replace(/= (\d)/, '= d'), b, fracStr(a, E(`d-${c}`)), [
      `Subtract ${c} from both sides: ${a}/${b} = d − ${c}.`,
      `Multiply both sides by ${b}: ${a} = ${b}(d − ${c}).`,
      `Divide both sides by (d − ${c}): ${b} = ${pretty(fracStr(a, E(`d-${c}`)))}.`,
    ], `Isolate the fraction, multiply both sides by ${b}, then divide to get ${b} alone.`)
    return solveForSpec(`s = ${a}/(1 - ${b})`, b, fracStr(E(`s-${a}`), 's'), [
      `Multiply both sides by (1 − ${b}): s(1 − ${b}) = ${a}.`,
      `Expand and collect the ${b} terms: s − s${b} = ${a}, so s${b} = s − ${a}.`,
      `Divide by s: ${b} = ${pretty(fracStr(E(`s-${a}`), 's'))}.`,
    ], `Clear the fraction, then collect every term with ${b} on one side.`)
  } },
  { lesson: 'rational-eq', level: 3, make: (r) => {
    const q = search(800, () => {
      const v = 'x'
      const [f, g, h] = distinct(r, 3, () => linR(r, v, -5, 5, [1, 1, 2]), (s) => s)
      const n1 = rnz(r, 1, 5), n2 = rnz(r, 1, 5)
      const lhs = `${n1}/(${E(prodStr(1, [f, g]))}) - ${n2}/(${E(prodStr(1, [f, h]))})`
      const rhs = pick(r, ['0', String(rnz(r, 1, 3)), `${rnz(r, 1, 5)}/(${E(prodStr(1, [g, h]))})`])
      const lcd = fmtFactored(factorsOf(parse(prodStr(1, [f, g, h]))))
      const spec = equationSpec(lhs, rhs, v, 'Factor the denominators to find the LCD, state the restrictions, multiply through, solve, and check for extraneous solutions.', lcd)
      return spec && !/no solution/.test(spec.display) ? spec : null
    })
    if (!q) return fallback('rational-eq')
    return q
  } },
  { lesson: 'rational-eq', level: 3, make: (r) => {
    // Built from the answer: clearing A/(x³−c³) + B/(x−c) = C/(x²+cx+c²) gives B(x − r1)(x − r2) = 0,
    // so choose the roots first and solve for the numerators A and C.
    for (let t = 0; t < 200; t++) {
      const c = ri(r, 1, 3), B = ri(r, 1, 2), r1 = ri(r, -4, 4), r2 = ri(r, -4, 4)
      if (r1 === r2) continue
      const C = B * (c + r1 + r2), A = B * (r1 * r2 - 2 * c * c - c * (r1 + r2))
      if (A === 0 || C === 0) continue
      const quad = E(`x^2+${c}x+${c * c}`), lin1 = lin(1, -c, 'x'), cube = E(`x^3-${c ** 3}`)
      const spec = equationSpec(`${A}/(${cube}) + ${B}/(${lin1})`, `${C}/(${quad})`, 'x', 'The first denominator is a difference of cubes: factor it first. Then the LCD is easy to see.', fmtFactored(factorsOf(parse(prodStr(1, [lin1, quad])))))
      if (spec) return spec
    }
    return fallback('rational-eq')
  } },
  { lesson: 'rational-eq', level: 3, make: (r) => {
    const [a, b, c, d] = pick(r, [['a', 'b', 'c', 'd'], ['m', 'p', 'q', 'n'], ['f', 'g', 'h', 'k']] as [string, string, string, string][])
    const form = ri(r, 1, 4)
    if (form === 4) {
      let k = ri(r, 1, 4), m = rnz(r, -5, 5), cc = ri(r, 2, 3), dd = rnz(r, -5, 5)
      while (k * dd === m * cc) { m = rnz(r, -5, 5); dd = rnz(r, -5, 5) }
      const top = E(`${k}x+(${m})`), bottom = E(`${cc}x+(${dd})`)
      const ans = fracStr(E(`${dd}y-(${m})`), E(`${k}-${cc}y`))
      return solveForSpec(`y = ${fracStr(top, bottom)}`, 'x', ans, [
        `Multiply both sides by (${pretty(bottom)}): y(${pretty(bottom)}) = ${pretty(top)}.`,
        `Expand: ${pretty(E(`y*(${bottom})`))} = ${pretty(top)}. Collect every x term on one side: ${pretty(E(`${cc}x*y-(${k})x`))} = ${pretty(E(`${m}-(${dd})y`))}.`,
        `Factor out x: x(${pretty(E(`${cc}y-(${k})`))}) = ${pretty(E(`${m}-(${dd})y`))}. Divide by the bracket (and tidy the signs): x = ${pretty(ans)}.`,
      ], 'Clear the fraction, collect every term containing x on one side, factor x out, and divide.')
    }
    if (form === 1) return solveForSpec(`${a}/(x - ${b}) = ${c}/(x - ${d})`, 'x', fracStr(E(`${a}${d}-${b}${c}`), E(`${a}-${c}`)), [
      `Cross-multiply: ${a}(x − ${d}) = ${c}(x − ${b}).`,
      `Expand: ${a}x − ${a}${d} = ${c}x − ${b}${c}.`,
      `Collect the x terms on one side: x(${a} − ${c}) = ${a}${d} − ${b}${c}, then divide by (${a} − ${c}).`,
    ], 'Cross-multiply, expand, collect every x term on one side, factor x out, and divide.')
    if (form === 2) return solveForSpec(`1/${a} + 1/${b} = 1/${c}`, c, fracStr(prodStr(1, [a, b]), E(`${a}+${b}`)), [
      `Combine the left side over the LCD: (${b} + ${a})/(${a}${b}) = 1/${c}.`,
      `Flip both sides (take reciprocals): ${a}${b}/(${a} + ${b}) = ${c}.`,
      `So ${c} = ${pretty(fracStr(prodStr(1, [a, b]), E(`${a}+${b}`)))}.`,
    ], 'Add the two fractions on the left over their LCD, then take the reciprocal of both sides.')
    return solveForSpec(`y = (x + ${a})/(x - ${b})`, 'x', fracStr(E(`${b}y+${a}`), E('y-1')), [
      `Multiply both sides by (x − ${b}): y(x − ${b}) = x + ${a}.`,
      `Expand: yx − ${b}y = x + ${a}. Collect the x terms on one side: yx − x = ${b}y + ${a}.`,
      `Factor out x: x(y − 1) = ${b}y + ${a}, so x = ${pretty(fracStr(E(`${b}y+${a}`), E('y-1')))}.`,
    ], 'Clear the fraction, get every term containing x on one side, factor x out, and divide.')
  } },
]

export const ALG_GENS: Gen[] = [...EXPANDING, ...FACTORING, ...POLYNOMIALS, ...SIMPLIFY, ...OPERATIONS, ...EQUATIONS]
