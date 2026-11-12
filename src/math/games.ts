/**
 * Pure logic for the Games page: card decks for the match-up game, scoring, and the graph rounds for Root Hunter.
 * Kept free of React so it can be tested like the rest of the maths.
 */
import { fmtFrac, fr, parsePoly, fmtPoly, pretty, pMul } from './algebra'
import {
  cosExact, fmtDeg, fmtPi, fmtSurd, sinExact, SPECIAL_DEGREES, tanExact,
} from './exact'
import { showF } from './calculus'
import { mulberry, pick, Rng, shuffle } from './rng'
import { fmtIntervals, fmtSet, IntervalSet } from './solve'
import { COMPOUND, IDENTITIES } from './trigQuestions'
import { showTrig } from './trigAlgebra'

/* ------------------------------------------------------------------ match-up decks */

export interface Pair { id: number; a: string; b: string }
export interface Deck { id: string; name: string; blurb: string; make: (r: Rng, n: number) => Pair[] }

const ri = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

/** Draw up to n pairs from candidates, never repeating either side. */
function draw(r: Rng, candidates: [string, string][], n: number): Pair[] {
  const out: Pair[] = []
  const as = new Set<string>(), bs = new Set<string>()
  for (const [a, b] of shuffle(candidates, r)) {
    if (as.has(a) || bs.has(b)) continue
    as.add(a); bs.add(b)
    out.push({ id: out.length, a, b })
    if (out.length === n) break
  }
  return out
}

const ANGLES = SPECIAL_DEGREES.filter((d) => d > 0 && d <= 360)


/* Unit 9 pools: ASCII pairs, so the tests can check each one numerically */
export function derivativePool(r: Rng): [string, string][] {
  const out: [string, string][] = []
  for (let i = 0; i < 60; i++) {
    const a = ri(r, 2, 9), n = ri(r, 2, 6), k = ri(r, 2, 6), b = ri(r, 1, 6)
    out.push([`${a}x^${n}`, `${a * n}x^${n - 1}`.replace(/x\^1$/, 'x')])
    out.push([`sin(${k}x)`, `${k}cos(${k}x)`], [`cos(${k}x)`, `-${k}sin(${k}x)`], [`e^(${k}x)`, `${k}e^(${k}x)`], [`ln(${k}x+${b})`, `${k}/(${k}x+${b})`])
    out.push([`(x+${b})^${n}`, `${n}(x+${b})^${n - 1}`.replace(/\^1$/, '')], [`${a}/x`, `-${a}/x^2`], [`x*e^x`, `(x+1)*e^x`], [`x*sin(x)`, `sin(x)+x*cos(x)`], [`${a}sqrt(x)`, `${a}/(2sqrt(x))`], [`tan(${k}x)`, `${k}sec(${k}x)^2`])
  }
  return out
}
export function limitPool(r: Rng): [string, string, string][] {
  const out: [string, string, string][] = []
  const g = (x: number, y: number): number => (y === 0 ? Math.abs(x) : g(y, x % y))
  for (let i = 0; i < 80; i++) {
    const a = ri(r, 1, 9), k = ri(r, 1, 7), m = ri(r, 1, 7), c = ri(r, 2, 6)
    out.push([`(x^2-${a * a})/(x-${a})`, String(2 * a), `x → ${a}`])
    const d = g(k, m); out.push([`sin(${k === 1 ? '' : k}x)/(${m === 1 ? '' : m}x)`, m / d === 1 ? String(k / d) : `${k / d}/${m / d}`, 'x → 0'])
    out.push([`(e^(${k === 1 ? '' : k}x)-1)/x`, String(k), 'x → 0'])
    out.push([`(${c}x^2+x)/(x^2+${a})`, String(c), 'x → ∞'], [`(${c}x+${a})/(x^2+1)`, '0', 'x → ∞'], [`(${c}x^2+${a})/(${m}x^2-1)`, m / g(c, m) === 1 ? String(c / g(c, m)) : `${c / g(c, m)}/${m / g(c, m)}`, 'x → ∞'])
  }
  return out
}
export function tangentPool(r: Rng): [string, string][] {
  const out: [string, string][] = []
  for (let i = 0; i < 80; i++) {
    const a = ri(r, 1, 3) * (r() < 0.4 ? -1 : 1), p = ri(r, 1, 4), q = ri(r, -6, 6), c3 = ri(r, 1, 2)
    // f = c3 x^3 + p x^2 + q x, f' = 3 c3 x^2 + 2 p x + q
    out.push([`${c3 === 1 ? '' : c3}x^3+${p === 1 ? '' : p}x^2${q === 0 ? '' : q > 0 ? `+${q}x` : `${q}x`} at x=${a}`, String(3 * c3 * a * a + 2 * p * a + q)])
  }
  return out
}
const tidy = (t: string) => showF(t).replace(/−/g, '−')

export const DECKS: Deck[] = [
  {
    id: 'degrees-radians', name: 'Degrees and radians', blurb: 'Pair every angle with the same angle in radians.',
    make: (r, n) => draw(r, ANGLES.map((d) => [fmtDeg(d), fmtPi(d)]), n),
  },
  {
    id: 'trig-values', name: 'Exact trig values', blurb: 'Pair sin, cos and tan of a special angle with its exact value.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (const d of ANGLES) {
        c.push([`sin ${fmtDeg(d)}`, fmtSurd(sinExact(d))], [`cos ${fmtDeg(d)}`, fmtSurd(cosExact(d))])
        const t = tanExact(d)
        if (t) c.push([`tan ${fmtDeg(d)}`, fmtSurd(t)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'expand-factor', name: 'Expand and factor', blurb: 'Pair each product of brackets with the expanded polynomial.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 80; i++) {
        const a = ri(r, 1, 3), p = ri(r, -6, 6), q = ri(r, -6, 6), b = pick(r, [1, 1, 2])
        if (!p || !q) continue
        const f1 = `${a === 1 ? '' : a}x${p < 0 ? '−' : '+'}${Math.abs(p)}`, f2 = `${b === 1 ? '' : b}x${q < 0 ? '−' : '+'}${Math.abs(q)}`
        const ascii = (s: string) => s.replace(/−/g, '-')
        const poly = fmtPoly(pMul(parsePoly(ascii(f1)), parsePoly(ascii(f2))), true)
        c.push([`(${f1})(${f2})`, pretty(poly)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'interval-notation', name: 'Inequalities and intervals', blurb: 'Pair each inequality with the same set in interval notation.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 120; i++) {
        const a = ri(r, -8, 6), b = a + ri(r, 2, 8), kind = ri(r, 1, 4)
        const ai = r() < 0.5, bi = r() < 0.5
        const set: IntervalSet = kind === 1 ? [{ lo: -Infinity, hi: a, loIncl: false, hiIncl: ai }]
          : kind === 2 ? [{ lo: a, hi: Infinity, loIncl: ai, hiIncl: false }]
            : kind === 3 ? [{ lo: a, hi: b, loIncl: ai, hiIncl: bi }]
              : [{ lo: -Infinity, hi: a, loIncl: false, hiIncl: ai }, { lo: b, hi: Infinity, loIncl: bi, hiIncl: false }]
        c.push([fmtSet(set), fmtIntervals(set)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'quadratic-roots', name: 'Quadratics and their roots', blurb: 'Pair each quadratic equation with its two solutions.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 120; i++) {
        const p = ri(r, -7, 7), q = ri(r, -7, 7)
        if (!p || !q || p >= q) continue
        const poly = fmtPoly(pMul(parsePoly(`x-(${p})`), parsePoly(`x-(${q})`)), true)
        c.push([`${pretty(poly)} = 0`, `x = ${p < 0 ? '−' : ''}${Math.abs(p)}, ${q < 0 ? '−' : ''}${Math.abs(q)}`])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'radical-simplify', name: 'Simplifying roots', blurb: 'Pair each square root with its simplest form.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 120; i++) {
        const s = ri(r, 2, 9), rad = pick(r, [2, 3, 5, 6, 7, 10, 11])
        c.push([`√${s * s * rad}`, `${s}√${rad}`])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'exponent-values', name: 'Powers and their values', blurb: 'Pair each power, including negative and fractional exponents, with its value.',
    make: (r, n) => {
      const c: [string, string][] = []
      const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
      const sup = (k: number) => `${k < 0 ? '⁻' : ''}${String(Math.abs(k)).split('').map((d) => SUP[Number(d)]).join('')}`
      for (let i = 0; i < 160; i++) {
        const kind = ri(r, 1, 3)
        if (kind === 1) { const b = ri(r, 2, 6), e = ri(r, 2, 4); c.push([`${b}${sup(e)}`, String(b ** e)]) }
        else if (kind === 2) { const b = ri(r, 2, 6), e = ri(r, 1, 3); c.push([`${b}${sup(-e)}`, fmtFrac(fr(1, b ** e))]) }
        else { const k = pick(r, [2, 3]), m = ri(r, 1, 3), base = ri(r, 2, k === 2 ? 11 : 4); c.push([`${base ** k}^(${m}/${k})`, String(base ** m)]) }
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'log-values', name: 'Logarithms and their values', blurb: 'Pair each logarithm with the number it equals.',
    make: (r, n) => {
      const SUB = '₀₁₂₃₄₅₆₇₈₉'
      const sub = (k: number) => String(k).split('').map((d) => SUB[Number(d)]).join('')
      const c: [string, string][] = []
      for (let i = 0; i < 160; i++) {
        const b = pick(r, [2, 3, 4, 5, 6, 10]), k = ri(r, -3, 5)
        if (b ** Math.abs(k) > 5000) continue
        const arg = k >= 0 ? String(b ** k) : `1/${b ** -k}`
        c.push([`log${sub(b)} ${k >= 0 ? arg : `(${arg})`}`, `${k < 0 ? '−' : ''}${Math.abs(k)}`])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'inverse-pairs', name: 'Functions and their inverses', blurb: 'Pair each linear function with its inverse.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 160; i++) {
        const a = pick(r, [2, 3, 4, 5, -2, -3]), b = ri(r, -9, 9)
        if (!b) continue
        const f = `f(x) = ${a === -1 ? '−' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
        const g = `(x ${-b < 0 ? '−' : '+'} ${Math.abs(b)})/${a < 0 ? `(${'−'}${-a})` : a}`
        c.push([f, g])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'transform-words', name: 'Transformations in words', blurb: 'Pair each change to y = f(x) with what it does to the graph.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 160; i++) {
        const k = ri(r, 1, 7), kind = ri(r, 1, 8)
        const [a, b]: [string, string] = kind === 1 ? [`y = f(x − ${k})`, `shift right ${k}`] : kind === 2 ? [`y = f(x + ${k})`, `shift left ${k}`] : kind === 3 ? [`y = f(x) + ${k}`, `shift up ${k}`]
          : kind === 4 ? [`y = f(x) − ${k}`, `shift down ${k}`] : kind === 5 ? [`y = ${k + 1}f(x)`, `stretch vertically, factor ${k + 1}`] : kind === 6 ? [`y = f(${k + 1}x)`, `squeeze horizontally, factor ${k + 1}`]
            : kind === 7 ? ['y = −f(x)', 'reflect in the x-axis'] : ['y = f(−x)', 'reflect in the y-axis']
        c.push([a, b])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'trig-identities', name: 'Trigonometric identities', blurb: 'Pair each expression with the simpler expression it is equal to.',
    make: (r, n) => draw(r, IDENTITIES.map((t): [string, string] => [showTrig(t.src), showTrig(t.ans)]), n),
  },
  {
    id: 'compound-values', name: 'Exact values at 15°, 75°, 105° and 165°', blurb: 'Pair each function of a compound angle with its exact value.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (const [d, v] of Object.entries(COMPOUND)) for (const fn of ['sin', 'cos', 'tan'] as const) c.push([`${fn} ${d}°`, v[fn]])
      return draw(r, c, n)
    },
  },
  {
    id: 'trig-periods', name: 'Periods of trigonometric graphs', blurb: 'Pair each graph with its period.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (const fn of ['sin', 'cos', 'tan']) for (const [num, den] of [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [1, 2], [1, 3], [2, 3], [3, 2]]) {
        const base = fn === 'tan' ? 180 : 360, period = (base * den) / num
        if (!Number.isInteger(period)) continue
        const arg = den !== 1 ? (num === 1 ? `x/${den}` : `${num}x/${den}`) : `${num}x`
        c.push([`y = ${fn}${den !== 1 ? `(${arg})` : ` ${arg}`}`, fmtPi(period)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'binomial-values', name: 'Choosing: the values of nCr', blurb: 'Pair each nCr with its value.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let nn = 4; nn <= 12; nn++) for (let k = 2; k <= nn / 2; k++) { let v = 1; for (let i = 1; i <= k; i++) v = (v * (nn - k + i)) / i; c.push([`${nn}C${k}`, String(Math.round(v))]) }
      return draw(r, c, n)
    },
  },
  {
    id: 'series-sums', name: 'Sums of arithmetic series', blurb: 'Pair each arithmetic series with its sum.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 160; i++) {
        const a = ri(r, 1, 12), d = ri(r, 1, 6), terms = ri(r, 8, 30)
        c.push([`${a} + ${a + d} + ${a + 2 * d} + … (${terms} terms)`, String((terms * (2 * a + (terms - 1) * d)) / 2)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'sequence-limits', name: 'Limits as n → ∞', blurb: 'Pair each expression in n with the number it approaches.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 160; i++) {
        const a = ri(r, 1, 9), cc = ri(r, 1, 6), b = ri(r, -5, 5), dd = ri(r, -5, 5)
        const s = (k: number) => `${k < 0 ? '−' : '+'} ${Math.abs(k)}`
        c.push([`(${a}n ${s(b || 1)}) / (${cc}n ${s(dd || 1)})`, fmtFrac(fr(a, cc))])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'complex-products', name: 'Multiplying complex numbers', blurb: 'Pair each product of two complex numbers with the answer in the form a + bi.',
    make: (r, n) => {
      const c: [string, string][] = []
      const t = (re: number, im: number) => { const m = (v: number) => (v < 0 ? '−' : '+'); const bi = `${Math.abs(im) === 1 ? '' : Math.abs(im)}i`; return re === 0 ? `${im < 0 ? '−' : ''}${bi}` : `${re < 0 ? '−' : ''}${Math.abs(re)} ${m(im)} ${bi}` }
      for (let i = 0; i < 200; i++) {
        const a = ri(r, -5, 5), b = ri(r, -5, 5), cc = ri(r, -5, 5), d = ri(r, -5, 5)
        if (!a || !b || !cc || !d) continue
        const re = a * cc - b * d, im = a * d + b * cc
        if (!im) continue
        c.push([`(${t(a, b)})(${t(cc, d)})`, t(re, im)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'dot-products', name: 'Dot products', blurb: 'Pair each pair of vectors with the value of their dot product.',
    make: (r, n) => {
      const c: [string, string][] = []
      const v = (x: number[]) => `(${x.map((e) => (e < 0 ? `−${-e}` : String(e))).join(', ')})`
      for (let i = 0; i < 200; i++) {
        const dim = ri(r, 2, 3), a = Array.from({ length: dim }, () => ri(r, -6, 6)), b = Array.from({ length: dim }, () => ri(r, -6, 6))
        const d = a.reduce((sum, x, j) => sum + x * b[j], 0)
        c.push([`${v(a)} · ${v(b)}`, d < 0 ? `−${-d}` : String(d)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'cross-products', name: 'Cross products', blurb: 'Pair each cross product of two vectors in space with the vector it gives.',
    make: (r, n) => {
      const c: [string, string][] = []
      const v = (x: number[]) => `(${x.map((e) => (e < 0 ? `−${-e}` : String(e))).join(', ')})`
      for (let i = 0; i < 200; i++) {
        const a = [ri(r, -4, 4), ri(r, -4, 4), ri(r, -4, 4)], b = [ri(r, -4, 4), ri(r, -4, 4), ri(r, -4, 4)]
        const x = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
        if (x.every((e) => e === 0)) continue
        c.push([`${v(a)} × ${v(b)}`, v(x)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'derivative-pairs', name: 'Functions and their derivatives', blurb: 'Pair each function with its derivative.',
    make: (r, n) => draw(r, derivativePool(r).map(([f, d]) => [tidy(f), tidy(d)] as [string, string]), n),
  },
  {
    id: 'limit-values', name: 'Limits and their values', blurb: 'Pair each limit with the number it equals.',
    make: (r, n) => draw(r, limitPool(r).map(([f, v, at]) => [`${at}:  ${tidy(f)}`, v] as [string, string]), n),
  },
  {
    id: 'tangent-gradients', name: 'Gradients of tangents', blurb: 'Pair each curve and point with the gradient of the tangent there.',
    make: (r, n) => draw(r, tangentPool(r).map(([f, v]) => [`Gradient of y = ${tidy(f)}`, v.replace('-', '−')] as [string, string]), n),
  },
]

export const deckById = (id: string) => DECKS.find((d) => d.id === id)

export interface Tile { key: string; pair: number; text: string }

/** 2n tiles, shuffled. Two tiles match when they share a pair id. */
export function buildBoard(deckId: string, n = 6, seed = Math.floor(Math.random() * 1e9)): Tile[] {
  const deck = deckById(deckId) ?? DECKS[0]
  const r = mulberry(seed)
  const pairs = deck.make(r, n)
  return shuffle(pairs.flatMap((p) => [{ key: `${p.id}a`, pair: p.id, text: p.a }, { key: `${p.id}b`, pair: p.id, text: p.b }]), r)
}

/* ------------------------------------------------------------------ scoring */

/** Sprint: 10 per correct answer, plus 2 for each step of the best streak beyond 2. */
export const sprintScore = (correct: number, bestStreak: number) => correct * 10 + Math.max(0, bestStreak - 2) * 2
/** Survival gets harder as you go: level 1 for the first five, level 2 up to ten, then level 3. */
export const survivalLevel = (correct: number) => Math.min(3, 1 + Math.floor(correct / 5))
/** Match-up is a memory game, so the pairs themselves are the floor: 3 stars up to 1.5 moves per pair, 2 stars up to 2.5. */
export const matchStars = (moves: number, pairs: number) => (moves <= Math.ceil(pairs * 1.5) ? 3 : moves <= Math.ceil(pairs * 2.5) ? 2 : 1)

/* ------------------------------------------------------------------ root hunter */

export interface RootRound { roots: number[]; k: number; xMin: number; xMax: number; yMin: number; yMax: number }
export const rootValue = (round: RootRound, x: number) => round.k * round.roots.reduce((p, r) => p * (x - r), 1)

/** A polynomial with integer roots at least 2 apart (2 at first, up to 4), scaled so the smallest hump between roots is clearly visible. */
export function rootRound(difficulty: 1 | 2 | 3, seed: number): RootRound {
  const r = mulberry(seed)
  const count = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  let roots: number[] = []
  for (let tries = 0; tries < 500; tries++) {
    const cand: number[] = []
    while (cand.length < count) { const v = ri(r, -5, 5); if (!cand.includes(v)) cand.push(v) }
    cand.sort((a, b) => a - b)
    roots = cand
    if (cand.every((v, i) => i === 0 || v - cand[i - 1] >= 2)) break
  }
  const sign = r() < 0.5 ? 1 : -1
  const unit: RootRound = { roots, k: 1, xMin: -6.5, xMax: 6.5, yMin: -6, yMax: 6 }
  // the smallest hump (largest |f| between two neighbouring roots) is scaled to 1.8 units tall
  let smallest = Infinity
  for (let i = 1; i < roots.length; i++) {
    let peak = 0
    for (let x = roots[i - 1]; x <= roots[i]; x += 0.02) peak = Math.max(peak, Math.abs(rootValue(unit, x)))
    smallest = Math.min(smallest, peak)
  }
  return { ...unit, k: (sign * 1.8) / smallest }
}

/** Does every root have exactly one click within tol, and no stray clicks? */
export function judgeClicks(roots: number[], clicks: number[], tol = 0.35): { found: number[]; stray: number[]; ok: boolean } {
  const found: number[] = []
  const stray: number[] = []
  const used = new Set<number>()
  for (const c of clicks) {
    const i = roots.findIndex((r, j) => !used.has(j) && Math.abs(r - c) <= tol)
    if (i >= 0) { used.add(i); found.push(roots[i]) } else stray.push(c)
  }
  return { found, stray, ok: found.length === roots.length && stray.length === 0 }
}
