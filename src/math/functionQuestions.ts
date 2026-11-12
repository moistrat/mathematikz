/**
 * Question generators for Unit 5: functions and graphs.
 *
 * Functions are kept as ASCII strings in x and evaluated exactly with the algebra engine. Composition and transformation
 * are done by substituting into the string, so the answer shown cannot disagree with the working.
 */
import {
  fmtFrac, fmtPoly, Frac, fNum, fr, fracStr, fAdd, fSub, fMul, fDiv, parsePoly, parseRat, pDivide, pEvalFrac, pretty, Poly, pAdd,
} from './algebra'
import { alg, numSpec, ri, rnz } from './algebraQuestions'
import { exactSet, exF, ineqSpec, MN, pairSpec, search, sgnText, tx } from './equationQuestions'
import { MINUS } from './exact'
import type { Gen, Spec } from './questions'
import { pick } from './rng'
import { complement, signSet } from './solve'

/* ------------------------------------------------------------------ helpers */

const fromCoeffs = (cs: number[]): Poly => cs.reduce<Poly>((p, c, i) => (c ? pAdd(p, [{ c: fr(c), e: i ? { x: i } : {} }]) : p), [])
/** ASCII source of a polynomial with coefficients cs[i] of x^i, in standard form */
const polySrc = (cs: number[]) => fmtPoly(fromCoeffs(cs), true)
const show = (src: string) => pretty(src)
const fn = (name: string, src: string) => `${name}(x) = ${show(src)}`
/** the function `src` with x replaced by the expression `repl` */
const subst = (src: string, repl: string) => src.replace(/x/g, `(${repl})`)

function evalAt(src: string, a: Frac): Frac | null {
  const r = parseRat(src)
  const d = pEvalFrac(r.d, { x: a })
  if (d.n === 0) return null
  return fDiv(pEvalFrac(r.n, { x: a }), d)
}
const fm = (f: Frac) => fmtFrac(f)
const w = (n: number | Frac) => (typeof n === 'number' ? (n < 0 ? `(${MN(String(n))})` : String(n)) : fNum(n) < 0 ? `(${fm(n)})` : fm(n))
/** vertex form a(x − h)² + k with the zero parts left out */
const vform = (h: number, k: number, a = '') => `${a}${h === 0 ? 'x' : `(x ${sgnText(-h)})`}²${k === 0 ? '' : ` ${sgnText(k)}`}`
const lx = (c: number, v = 'x') => (c === 0 ? v : `${v} ${sgnText(c)}`)

function randCoeffs(r: () => number, deg: number, range = 5, leadMax = 3): number[] {
  const cs = Array.from({ length: deg + 1 }, () => ri(r as never, -range, range))
  cs[deg] = rnz(r as never, 1, leadMax) * (r() < 0.35 ? -1 : 1)
  return cs
}

/** a function written neatly: a polynomial in standard form, or a single fraction in lowest terms */
function neat(src: string): string {
  const r = parseRat(src)
  const d = fmtPoly(r.d, true)
  return d === '1' ? fmtPoly(r.n, true) : fracStr(fmtPoly(r.n, true), d)
}

const eqvSpec = (prompt: string, answer: string, source: string, hint: string, expl: string[]): Spec => {
  const e = alg('equiv', prompt, source, answer, hint, expl)
  return { ...e, display: show(answer) }
}

/** a holds() for a function's domain: true when the formula gives a real number */
const real = (f: (x: number) => number) => (x: number) => Number.isFinite(f(x))

/* ------------------------------------------------------------------ 1. functions, notation and domain */

const FUNCTIONS: Gen[] = [
  { lesson: 'functions', level: 1, make: (r) => {
    const deg = pick(r, [1, 2, 2, 3]), cs = randCoeffs(r, deg, 5, 3)
    const src = polySrc(cs), a = rnz(r, -4, 4)
    const val = evalAt(src, fr(a))!
    return numSpec(`If ${fn('f', src)}, find f(${MN(String(a))}).`, val, 'Replace every x by the number, putting it in brackets so that signs and powers are handled correctly.', [
      `Substitute x = ${MN(String(a))}: f(${MN(String(a))}) = ${show(subst(src, String(a)).replace(/\(-/g, '(-'))}.`.replace(/-/g, MINUS),
      `Evaluate: the result is ${fm(val)}.`,
    ])
  } },
  { lesson: 'functions', level: 1, make: (r) => {
    const cs = randCoeffs(r, 2, 4, 2), src = polySrc(cs)
    const a = ri(r, -3, 3), b = ri(r, -3, 3)
    if (a === b) return FUNCTIONS[1].make(r)
    const kind = ri(r, 1, 3)
    const fa = evalAt(src, fr(a))!, fb = evalAt(src, fr(b))!
    if (kind === 1) {
      const v = fSub(fa, fb)
      return numSpec(`If ${fn('f', src)}, find f(${MN(String(a))}) ${MINUS} f(${MN(String(b))}).`, v, 'Work out each value separately, then subtract.', [`f(${MN(String(a))}) = ${fm(fa)}.`, `f(${MN(String(b))}) = ${fm(fb)}.`, `Subtract: ${fm(fa)} ${MINUS} ${w(fb)} = ${fm(v)}.`])
    }
    if (kind === 2) {
      const k = rnz(r, 2, 4), c = rnz(r, -5, 5)
      const v = fAdd(fMul(fr(k), fa), fr(c))
      return numSpec(`If ${fn('f', src)}, find ${k}f(${MN(String(a))}) ${sgnText(c)}.`, v, 'Find f at the number first, then multiply and add.', [`f(${MN(String(a))}) = ${fm(fa)}.`, `${k} × ${w(fa)} ${sgnText(c)} = ${fm(v)}.`])
    }
    const v = evalAt(src, fr(a + 1))!
    return numSpec(`If ${fn('f', src)}, find f(${MN(String(a))} + 1).`, v, 'Do the bracket first: the input is a + 1, a single number.', [`${MN(String(a))} + 1 = ${MN(String(a + 1))}, so we need f(${MN(String(a + 1))}).`, `f(${MN(String(a + 1))}) = ${fm(v)}.`])
  } },
  { lesson: 'functions', level: 1, make: (r) => {
    // a piecewise function evaluated at a point
    const t = ri(r, -2, 3), a1 = rnz(r, -3, 3), b1 = ri(r, -4, 4), a2 = rnz(r, 1, 3), b2 = ri(r, -4, 4)
    const e1 = polySrc([b1, a1]), e2 = polySrc([b2, 0, a2])
    const x0 = ri(r, t - 3, t + 3)
    const first = x0 < t
    const src = first ? e1 : e2
    const val = evalAt(src, fr(x0))!
    return numSpec(`A function is defined by f(x) = ${show(e1)} if x < ${MN(String(t))}, and f(x) = ${show(e2)} if x ≥ ${MN(String(t))}. Find f(${MN(String(x0))}).`, val, 'First decide which rule applies to the input, using the condition. Then use only that rule.', [
      `${MN(String(x0))} ${x0 < t ? '<' : '≥'} ${MN(String(t))}, so the ${first ? 'first' : 'second'} rule applies: ${show(src)}.`,
      `Substitute: f(${MN(String(x0))}) = ${fm(val)}.`,
    ])
  } },
  { lesson: 'functions', level: 2, make: (r) => {
    // domain of a formula
    const kind = ri(r, 1, 5)
    if (kind === 1) {
      const a = rnz(r, -6, 6), b = rnz(r, -5, 5), k = rnz(r, 1, 5)
      const f = (x: number) => (x === a ? NaN : k / (x - a) + b * 0)
      return ineqSpec(`Find the domain of ${fn('f', `${k}/(${lx(-a)})`)}. Write it as an inequality or in interval notation.`, complement([{ lo: a, hi: a, loIncl: true, hiIncl: true }]), 'x',
        'A fraction is undefined where its denominator is zero. Find that value and exclude it.', [`The denominator ${MN(lx(-a))} is zero when x = ${MN(String(a))}.`, `Division by zero is not allowed, so x ≠ ${MN(String(a))}. Every other real number works.`], [exF(fr(a))], real(f))
    }
    if (kind === 2) {
      const a = rnz(r, 1, 4), b = rnz(r, -9, 9)
      const bd = fr(-b, a)
      const f = (x: number) => Math.sqrt(a * x + b)
      return ineqSpec(`Find the domain of ${fn('f', `sqrt(${tx(a)} ${sgnText(b)})`).replace('sqrt(', '√(')}. Write it as an inequality or in interval notation.`, [{ lo: fNum(bd), hi: Infinity, loIncl: true, hiIncl: false }], 'x',
        'You cannot take the square root of a negative number, so the expression under the root must be at least zero.', [`We need ${tx(a)} ${sgnText(b)} ≥ 0.`, `Solve: ${tx(a)} ≥ ${MN(String(-b))}, so x ≥ ${fm(bd)}.`], [exF(bd)], real(f))
    }
    if (kind === 3) {
      const a = rnz(r, -5, 5), k = ri(r, 1, 3)
      const f = (x: number) => 1 / Math.sqrt(x - a)
      return ineqSpec(`Find the domain of f(x) = ${k === 1 ? '1' : k}/√(${MN(lx(-a))}). Write it as an inequality or in interval notation.`, [{ lo: a, hi: Infinity, loIncl: false, hiIncl: false }], 'x',
        'The expression under the root must be positive (not just non-negative), because it is also in a denominator and cannot be zero.', [`The root needs ${MN(lx(-a))} ≥ 0, and the denominator cannot be zero, so ${MN(lx(-a))} > 0.`, `So x > ${MN(String(a))}.`], [exF(fr(a))], real(f))
    }
    if (kind === 4) {
      const p = rnz(r, 1, 6), q = -p
      const f = (x: number) => (x * x === p * p ? NaN : (x + 1) / (x * x - p * p))
      return ineqSpec(`Find the domain of f(x) = (x + 1)/(x² ${MINUS} ${p * p}). Write it as an inequality or in interval notation.`, complement([{ lo: p, hi: p, loIncl: true, hiIncl: true }, { lo: q, hi: q, loIncl: true, hiIncl: true }]), 'x',
        'Find the values that make the denominator zero (factor it), and exclude them.', [`x² ${MINUS} ${p * p} = (x ${MINUS} ${p})(x + ${p}), which is zero when x = ${p} or x = ${MN(String(q))}.`, `The domain is every real number except ${MN(String(q))} and ${p}.`], [exF(fr(p)), exF(fr(q))], real(f))
    }
    const a = rnz(r, -4, 4), k = ri(r, 1, 3)
    const f = (x: number) => (x > a ? Math.log(x - a) : NaN)
    return ineqSpec(`Find the domain of f(x) = ln(${MN(lx(-a))}) ${k > 1 ? `+ ${k}` : ''}`.trim() + '. Write it as an inequality or in interval notation.', [{ lo: a, hi: Infinity, loIncl: false, hiIncl: false }], 'x',
      'The logarithm is defined only for positive inputs.', [`ln needs a positive input: ${MN(lx(-a))} > 0.`, `So x > ${MN(String(a))}.`], [exF(fr(a))], real(f))
  } },
  { lesson: 'functions', level: 2, make: (r) => {
    // range of a simple function
    const kind = ri(r, 1, 6)
    const h = ri(r, -4, 4), k = rnz(r, -6, 6)
    const hx = `(${MN(lx(-h))})`
    if (kind === 1) {
      const up = r() < 0.5
      const f = (y: number) => (up ? y >= k : y <= k)
      return ineqSpec(`Find the range of ${fn('f', `${up ? '' : '-'}(${lx(-h)})^2${k > 0 ? ` + ${k}` : ` - ${-k}`}`)}. Write it as an inequality in y.`, [up ? { lo: k, hi: Infinity, loIncl: true, hiIncl: false } : { lo: -Infinity, hi: k, loIncl: false, hiIncl: true }], 'y',
        'A square is never negative. Find the smallest (or largest) value the whole expression can take.', [`${hx}² is at least 0, with 0 attained at x = ${MN(String(h))}.`, up ? `So f(x) = ${hx}² ${sgnText(k)} is at least ${MN(String(k))}.` : `So −${hx}² is at most 0, and f(x) is at most ${MN(String(k))}.`, `The range is y ${up ? '≥' : '≤'} ${MN(String(k))}.`], [exF(fr(k))], f)
    }
    if (kind === 2) {
      const f = (y: number) => y >= k
      return ineqSpec(`Find the range of f(x) = √(${MN(lx(-h))}) ${sgnText(k)}. Write it as an inequality in y.`.replace('√(x)', '√x'), [{ lo: k, hi: Infinity, loIncl: true, hiIncl: false }], 'y', 'A square root is never negative, so the root part is at least 0.', [`√(${MN(lx(-h))}) takes every value from 0 upwards.`, `Adding ${MN(String(k))} shifts that: y ≥ ${MN(String(k))}.`], [exF(fr(k))], f)
    }
    if (kind === 3) {
      const f = (y: number) => y >= k
      return ineqSpec(`Find the range of f(x) = |${MN(lx(-h))}| ${sgnText(k)}. Write it as an inequality in y.`.replace('|x|', '|x|'), [{ lo: k, hi: Infinity, loIncl: true, hiIncl: false }], 'y', 'An absolute value is never negative, and it is 0 when its inside is 0.', [`|${MN(lx(-h))}| is at least 0.`, `So f(x) is at least ${MN(String(k))}, and y ≥ ${MN(String(k))}.`], [exF(fr(k))], f)
    }
    if (kind === 4) {
      const a = rnz(r, 1, 5)
      const f = (y: number) => y !== k
      return ineqSpec(`Find the range of f(x) = ${a}/(${MN(lx(-h))}) ${sgnText(k)}. Write it as an inequality in y.`, complement([{ lo: k, hi: k, loIncl: true, hiIncl: true }]), 'y',
        'The fraction a/(x − h) can be any number except 0, because a fraction with a non-zero numerator is never zero.', [`${a}/(${MN(lx(-h))}) takes every value except 0.`, `Adding ${MN(String(k))} shifts that: y ≠ ${MN(String(k))}.`], [exF(fr(k))], f)
    }
    if (kind === 5) {
      const f = (y: number) => y > k
      return ineqSpec(`Find the range of f(x) = 2^x ${sgnText(k)}. Write it as an inequality in y.`, [{ lo: k, hi: Infinity, loIncl: false, hiIncl: false }], 'y', 'An exponential 2ˣ is always positive but can be as close to 0 as you like.', ['2ˣ > 0 for every x, and it takes every positive value.', `Adding ${MN(String(k))}: y > ${MN(String(k))}. The value ${MN(String(k))} itself is never reached.`], [exF(fr(k))], f)
    }
    const a = rnz(r, -3, 3), b = rnz(r, 1, 4), c = rnz(r, -4, 5)
    const vx = fr(-b, 2 * a), vy = fSub(fr(c), fDiv(fr(b * b), fr(4 * a)))
    const up = a > 0
    const f = (y: number) => (up ? y >= fNum(vy) - 1e-12 : y <= fNum(vy) + 1e-12)
    return ineqSpec(`Find the range of ${fn('f', polySrc([c, b, a]))}. Write it as an inequality in y.`, [up ? { lo: fNum(vy), hi: Infinity, loIncl: true, hiIncl: false } : { lo: -Infinity, hi: fNum(vy), loIncl: false, hiIncl: true }], 'y',
      'The range of a parabola is bounded by the y-value of its vertex.', [`The vertex is at x = ${fm(vx)}, where y = ${fm(vy)}.`, `The parabola opens ${up ? 'upwards' : 'downwards'}, so ${up ? 'the vertex is its lowest point' : 'the vertex is its highest point'}.`, `The range is y ${up ? '≥' : '≤'} ${fm(vy)}.`], [exF(vy)], f)
  } },
  { lesson: 'functions', level: 2, make: (r) => {
    // composition evaluated at a point
    const f = polySrc(randCoeffs(r, 2, 4, 2)), g = polySrc(randCoeffs(r, 1, 4, 3)), a = ri(r, -3, 3)
    const fFirst = r() < 0.5
    const [outer, inner, on, inn] = fFirst ? [f, g, 'f', 'g'] : [g, f, 'g', 'f']
    const innerV = evalAt(inner, fr(a))!, value = evalAt(outer, innerV)!
    return numSpec(`If ${fn('f', f)} and ${fn('g', g)}, find ${on}(${inn}(${MN(String(a))})).`, value, `Work from the inside out: find ${inn}(${MN(String(a))}) first, then put that answer into ${on}.`, [
      `Inside first: ${inn}(${MN(String(a))}) = ${fm(innerV)}.`, `Then ${on}(${fm(innerV)}) = ${fm(value)}.`])
  } },
  { lesson: 'functions', level: 3, make: (r) => {
    // difference quotient
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      const cs = randCoeffs(r, 2, 5, 3), src = polySrc(cs)
      const source = `(${subst(src, 'x+h')}-(${src}))/h`
      const answer = fmtPoly(parsePoly(`${2 * cs[2]}x+${cs[2]}h+(${cs[1]})`), true)
      const e = alg('poly', `For ${fn('f', src)}, simplify the difference quotient (f(x + h) ${MINUS} f(x))/h. Expand fully and cancel h.`, source, answer, 'Expand f(x + h), subtract f(x): every term without h cancels, so h can be divided out of what remains.', [
        `f(x + h) = ${show(subst(src, 'x+h'))}, which expands to ${show(fmtPoly(parsePoly(subst(src, 'x+h')), true))}.`,
        `Subtract f(x). The terms without h cancel, leaving ${show(fmtPoly(parsePoly(`${subst(src, 'x+h')}-(${src})`), true))}.`,
        `Divide by h: ${show(answer)}.`,
      ])
      return { ...e, display: show(answer) }
    }
    if (kind === 2) {
      const a = ri(r, 1, 3), cs = [rnz(r, -4, 4), rnz(r, -3, 3), 0, a]
      const src = polySrc(cs)
      const source = `(${subst(src, 'x+h')}-(${src}))/h`
      const answer = fmtPoly(parsePoly(`${3 * a}x^2+${3 * a}xh+${a}h^2+(${cs[1]})`), true)
      const e = alg('poly', `For ${fn('f', src)}, simplify the difference quotient (f(x + h) ${MINUS} f(x))/h. Expand fully and cancel h.`, source, answer, 'Use (x + h)³ = x³ + 3x²h + 3xh² + h³, subtract f(x), and divide by h.', [
        `(x + h)³ = x³ + 3x²h + 3xh² + h³, so f(x + h) expands with those four terms.`,
        `Subtract f(x). Every term without h cancels.`,
        `Divide every remaining term by h: ${show(answer)}.`,
      ])
      return { ...e, display: show(answer) }
    }
    const k = ri(r, 1, 4)
    const source = `(${k}/(x+h)-${k}/x)/h`
    const answer = `-${k}/(x(x+h))`
    const kx = k === 1 ? 'x' : `${k}x`, kxh = k === 1 ? '(x + h)' : `${k}(x + h)`, kh = k === 1 ? 'h' : `${k}h`
    const e = alg('rational', `For f(x) = ${k}/x, simplify (f(x + h) ${MINUS} f(x))/h to a single fraction.`, source, answer, 'Combine f(x + h) − f(x) over the common denominator x(x + h); the numerator becomes a multiple of h.', [
      `f(x + h) ${MINUS} f(x) = ${k}/(x + h) ${MINUS} ${k}/x = (${kx} ${MINUS} ${kxh}) / (x(x + h)).`,
      `The numerator simplifies to ${MINUS}${kh}, so the difference is ${MINUS}${kh}/(x(x + h)).`,
      `Divide by h: ${MINUS}${k}/(x(x + h)).`,
    ])
    return { ...e, display: `${MINUS}${k}/(x(x + h))` }
  } },
  { lesson: 'functions', level: 3, make: (r) => {
    // domains that need a quadratic or a sign chart
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      const p = rnz(r, -5, 5), q = rnz(r, -5, 5)
      if (p === q) return FUNCTIONS[6].make(r)
      const cs = [p * q, -(p + q), 1]
      const f = (x: number) => Math.sqrt(x * x - (p + q) * x + p * q)
      const set = signSet((x) => x * x - (p + q) * x + p * q, [p, q], '>=')
      return ineqSpec(`Find the domain of ${fn('f', `sqrt(${polySrc(cs)})`).replace('sqrt(', '√(')}. Write it as an inequality or in interval notation.`, set, 'x',
        'The expression under the root must be at least 0. Solve that quadratic inequality with a sign chart.', [`We need ${show(polySrc(cs))} ≥ 0, which factors as (${MN(lx(-p))})(${MN(lx(-q))}) ≥ 0.`, `The roots are ${MN(String(Math.min(p, q)))} and ${MN(String(Math.max(p, q)))}. The parabola opens upwards, so it is non-negative outside the roots, and zero at them.`], [exF(fr(p)), exF(fr(q))], real(f))
    }
    if (kind === 2) {
      const p = rnz(r, -5, 5), q = rnz(r, -5, 5)
      if (p === q) return FUNCTIONS[6].make(r)
      const f = (x: number) => ((x - p) * (x - q) === 0 ? NaN : 1 / Math.sqrt((x - p) * (x - q)))
      const set = signSet((x) => (x - p) * (x - q), [p, q], '>')
      return ineqSpec(`Find the domain of f(x) = 1/√(${show(polySrc([p * q, -(p + q), 1]))}). Write it as an inequality or in interval notation.`, set, 'x',
        'The root needs a non-negative input, and the fraction needs it to be non-zero, so it must be strictly positive.', [`We need (${MN(lx(-p))})(${MN(lx(-q))}) > 0 (strict, because it is also in a denominator).`, `The product is positive outside the roots ${MN(String(Math.min(p, q)))} and ${MN(String(Math.max(p, q)))}, and the roots themselves are excluded.`], [exF(fr(p)), exF(fr(q))], real(f))
    }
    const a = rnz(r, -4, 4), b = rnz(r, -4, 4)
    if (a === b) return FUNCTIONS[6].make(r)
    const f = (x: number) => (x - a === 0 ? NaN : Math.sqrt((x - b) / (x - a)))
    const set = signSet((x) => (x - b) / (x - a), [a, b], '>=')
    return ineqSpec(`Find the domain of f(x) = √((${MN(lx(-b))})/(${MN(lx(-a))})). Write it as an inequality or in interval notation.`, set, 'x',
      'The fraction under the root must be at least 0, and its denominator can never be zero. Use a sign chart.', [`The top is zero at ${MN(String(b))} (allowed, because the square root of 0 is fine) and the bottom at ${MN(String(a))} (never allowed).`, 'Test a number in each region to find where the fraction is positive.', `Include ${MN(String(b))}, exclude ${MN(String(a))}.`], [exF(fr(a)), exF(fr(b))], real(f))
  } },
  { lesson: 'functions', level: 3, make: (r) => {
    // continuity of a piecewise function: find k so that the pieces meet
    const t = ri(r, -2, 3), a = rnz(r, -3, 4), b = ri(r, -5, 5), m = rnz(r, 1, 4)
    const left = a * t + b, k = left - m * t
    return numSpec(`The function f is defined by f(x) = ${show(polySrc([b, a]))} for x < ${MN(String(t))}, and f(x) = ${m === 1 ? '' : m}x + k for x ≥ ${MN(String(t))}. Find the value of k that makes the two pieces meet at x = ${MN(String(t))}, so that the graph has no jump.`, fr(k), 'The pieces meet when both rules give the same value at the join. Set them equal there and solve for k.', [
      `The first rule at x = ${MN(String(t))} gives ${MN(String(left))}.`, `The second rule at x = ${MN(String(t))} gives ${MN(String(m * t))} + k.`, `Set them equal: ${MN(String(m * t))} + k = ${MN(String(left))}, so k = ${MN(String(k))}.`])
  } },
]

/* ------------------------------------------------------------------ 2. transformations */

type Pt = [Frac, Frac]
interface Op { key: string; text: string; word: string; apply: (src: string) => string; map: (p: Pt) => Pt }
const units = (n: number) => `${Math.abs(n)} unit${Math.abs(n) === 1 ? '' : 's'}`

const OPS = {
  shiftX: (h: number): Op => ({ key: 'shiftX', text: `shifted ${units(h)} to the ${h > 0 ? 'right' : 'left'}`, word: `f(x ${sgnText(-h)})`, apply: (s) => subst(s, `x-(${h})`), map: ([x, y]) => [fAdd(x, fr(h)), y] }),
  shiftY: (k: number): Op => ({ key: 'shiftY', text: `shifted ${units(k)} ${k > 0 ? 'up' : 'down'}`, word: `f(x) ${sgnText(k)}`, apply: (s) => `(${s})+(${k})`, map: ([x, y]) => [x, fAdd(y, fr(k))] }),
  reflectX: (): Op => ({ key: 'reflectX', text: 'reflected in the x-axis', word: '−f(x)', apply: (s) => `-(${s})`, map: ([x, y]) => [x, fMul(y, fr(-1))] }),
  reflectY: (): Op => ({ key: 'reflectY', text: 'reflected in the y-axis', word: 'f(−x)', apply: (s) => subst(s, '-x'), map: ([x, y]) => [fMul(x, fr(-1)), y] }),
  stretchY: (a: number): Op => ({ key: 'stretchY', text: `stretched vertically by a factor of ${a}`, word: `${a}f(x)`, apply: (s) => `${a}*(${s})`, map: ([x, y]) => [x, fMul(y, fr(a))] }),
  stretchX: (b: number): Op => ({ key: 'stretchX', text: `stretched horizontally by a factor of ${b}`, word: `f(x/${b})`, apply: (s) => subst(s, `x/${b}`), map: ([x, y]) => [fMul(x, fr(b)), y] }),
}
const randOp = (r: () => number): Op => {
  const k = ri(r as never, 1, 6)
  return k === 1 ? OPS.shiftX(rnz(r as never, -4, 4)) : k === 2 ? OPS.shiftY(rnz(r as never, -5, 5)) : k === 3 ? OPS.reflectX() : k === 4 ? OPS.reflectY() : k === 5 ? OPS.stretchY(pick(r, [2, 3, 4])) : OPS.stretchX(pick(r, [2, 3]))
}

const ptText = (p: Pt) => `(${fm(p[0])}, ${fm(p[1])})`
const apply2 = (src: string, ops: Op[]) => ops.reduce((s, op) => op.apply(s), src)

const TRANSFORMS: Gen[] = [
  { lesson: 'transformations', level: 1, make: (r) => {
    // one transformation of a point
    const forms: [string, Op][] = (() => {
      const h = rnz(r, 1, 5), k = rnz(r, 1, 5), a = pick(r, [2, 3, 4])
      return [
        [`f(x ${MINUS} ${h})`, OPS.shiftX(h)], [`f(x + ${h})`, OPS.shiftX(-h)], [`f(x) + ${k}`, OPS.shiftY(k)], [`f(x) ${MINUS} ${k}`, OPS.shiftY(-k)],
        [`${MINUS}f(x)`, OPS.reflectX()], [`f(${MINUS}x)`, OPS.reflectY()], [`${a}f(x)`, OPS.stretchY(a)], [`f(${a}x)`, { ...OPS.stretchX(1), map: ([x, y]) => [fDiv(x, fr(a)), y] }],
        [`f(x/${a})`, OPS.stretchX(a)],
      ]
    })()
    const [txt, op] = pick(r, forms)
    const p: Pt = [fr(ri(r, -6, 6)), fr(ri(r, -6, 6))]
    const q = op.map(p)
    return pairSpec(`The point ${ptText(p)} lies on the graph of y = f(x). Find the corresponding point on the graph of y = ${txt}.`, q[0], q[1],
      'Inside the bracket changes x (and does the opposite of what it looks like). Outside changes y (and does what it looks like).', [
        `Identify the change: y = ${txt}.`, /\(x [−+]|\(−x|\(\d+x|\(x\//.test(txt) ? 'The change is inside the bracket, so it moves the x-coordinate (shift the opposite way, and a factor in front of x divides).' : 'The change is outside the function, so it moves or scales the y-coordinate directly.',
        `The point ${ptText(p)} moves to ${ptText(q)}.`,
      ])
  } },
  { lesson: 'transformations', level: 1, make: (r) => {
    // write the new equation of a basic curve after one move
    const base = pick(r, ['x^2', 'x^2', 'x^3', '1/x'])
    const op = pick(r, [OPS.shiftX(rnz(r, -4, 4)), OPS.shiftY(rnz(r, -5, 5)), OPS.reflectX(), OPS.stretchY(pick(r, [2, 3]))])
    const answer = neat(op.apply(base))
    const baseName = base === 'x^2' ? 'y = x²' : base === 'x^3' ? 'y = x³' : 'y = 1/x'
    return eqvSpec(`The graph of ${baseName} is ${op.text}. Write the equation of the new graph. Any equivalent form is accepted.`, answer, answer,
      'Apply the rule for this move: inside the function for x, outside for y.', [
        `The move is ${op.text}, which corresponds to ${op.word} where f(x) = ${show(base)}.`, `Substitute: y = ${show(answer)}.`])
  } },
  { lesson: 'transformations', level: 2, make: (r) => {
    // two moves in a row applied to a polynomial, answer as a new function
    const q = search(100, () => {
      const base = polySrc(pick(r, [[0, 0, 1], [0, 0, 0, 1], [-2, 0, 1], [0, -1, 1], [1, 0, -1]]))
      const o1 = randOp(r), o2 = randOp(r)
      if (o1.key === o2.key) return null
      const raw = apply2(base, [o1, o2])
      const answer = fmtPoly(parsePoly(raw), true)
      return { base, o1, o2, answer, raw }
    })!
    const { base, o1, o2, answer, raw } = q
    return eqvSpec(`The graph of ${fn('y', base).replace('y(x)', 'y')} is first ${o1.text}, and then ${o2.text}. Find the equation of the final graph.`, answer, raw,
      'Apply the moves one at a time, in the order given, each time to the current equation.', [
        `After the first move (${o1.text}): ${show(fmtPoly(parsePoly(o1.apply(base)), true))}.`,
        `After the second move (${o2.text}): ${show(answer)}.`,
      ])
  } },
  { lesson: 'transformations', level: 2, make: (r) => {
    // vertex of a transformed parabola
    const h = ri(r, -5, 5), k = ri(r, -5, 5)
    let ops = [randOp(r), randOp(r)]
    while (ops[0].key === ops[1].key) ops = [randOp(r), randOp(r)]
    const start: Pt = [fr(h), fr(k)]
    const end = ops.reduce((p, op) => op.map(p), start)
    return pairSpec(`The parabola y = ${vform(h, k)} has its vertex at ${ptText(start)}. The parabola is first ${ops[0].text}, and then ${ops[1].text}. Find the vertex of the final parabola.`, end[0], end[1],
      'Move the vertex through each transformation in turn, as a single point.', [
        `Start at ${ptText(start)}.`, `${ops[0].text}: the vertex moves to ${ptText(ops[0].map(start))}.`, `${ops[1].text}: the vertex moves to ${ptText(end)}.`])
  } },
  { lesson: 'transformations', level: 3, make: (r) => {
    // y = a f(b(x - h)) + k applied to a point
    const a = pick(r, [-3, -2, 2, 3]), h = rnz(r, -4, 4), k = rnz(r, -5, 5)
    const bForm = pick(r, ['2', '3', '1/2', '1/3'])
    const b = bForm.includes('/') ? fr(1, Number(bForm.split('/')[1])) : fr(Number(bForm))
    const p: Pt = [fr(ri(r, -4, 4) * (bForm.includes('/') ? 1 : 6)), fr(rnz(r, -4, 4))]
    // new x = p / b + h, new y = a q + k
    const nx = fAdd(fDiv(p[0], b), fr(h)), ny = fAdd(fMul(fr(a), p[1]), fr(k))
    const inner = bForm === '1/2' ? `(x ${sgnText(-h)})/2` : bForm === '1/3' ? `(x ${sgnText(-h)})/3` : `${bForm}(x ${sgnText(-h)})`
    const fExpr = `${a === 1 ? '' : a === -1 ? MINUS : MN(String(a))}f(${inner.replace(/\(x \+ 0\)|x \+ 0/, 'x')}) ${sgnText(k)}`.replace(/ \+ 0$/, '')
    return pairSpec(`The point ${ptText(p)} lies on y = f(x). Find the corresponding point on the graph of y = ${fExpr}.`, nx, ny,
      'Undo the inside first for x: divide by the stretch factor b, then add the shift h. For y: multiply by a, then add k.', [
        `Inside the bracket: x-values are divided by ${bForm} (a factor ${bForm} in front of the bracket squeezes the graph) and shifted by ${MN(String(h))}.`,
        `New x = ${fm(p[0])} ÷ ${bForm} ${sgnText(h)} = ${fm(nx)}.`, `Outside: y-values are multiplied by ${MN(String(a))} and shifted by ${MN(String(k))}.`, `New y = ${MN(String(a))} × ${w(p[1])} ${sgnText(k)} = ${fm(ny)}.`,
      ])
  } },
  { lesson: 'transformations', level: 3, make: (r) => {
    // a parabola from its vertex and one other point
    const h = ri(r, -4, 4), k = ri(r, -5, 5), a = rnz(r, -3, 3)
    const dx = rnz(r, -3, 3)
    const px = h + dx, py = a * dx * dx + k
    if (r() < 0.5) {
      return numSpec(`A parabola with vertex (${MN(String(h))}, ${MN(String(k))}) has the form y = ${vform(h, k, 'a')} and passes through the point (${MN(String(px))}, ${MN(String(py))}). Find a.`, fr(a),
        'Substitute the point into the equation and solve for a.', [`Substitute x = ${MN(String(px))}, y = ${MN(String(py))}: ${MN(String(py))} = a(${MN(String(px))}${h === 0 ? '' : ` ${sgnText(-h)}`})²${k === 0 ? '' : ` ${sgnText(k)}`}.`, `That is ${MN(String(py - k))} = ${dx * dx === 1 ? '' : dx * dx}a, so a = ${MN(String(a))}.`])
    }
    const src = `${a}*(x-(${h}))^2+(${k})`
    const answer = fmtPoly(parsePoly(src), true)
    return eqvSpec(`A parabola has vertex (${MN(String(h))}, ${MN(String(k))}) and passes through (${MN(String(px))}, ${MN(String(py))}). Find its equation. Any equivalent form is accepted.`, answer, src,
      'Start from vertex form y = a(x − h)² + k, then use the extra point to find a.', [`Vertex form: y = ${vform(h, k, 'a')}.`, `Substitute the point to get a = ${MN(String(a))}.`, `So y = ${show(answer)} (expanded).`])
  } },
]

/* ------------------------------------------------------------------ 3. composition and inverses */

const linSrc = (a: number, b: number) => polySrc([b, a])

const INVERSES: Gen[] = [
  { lesson: 'inverse-functions', level: 1, make: (r) => {
    const f = polySrc(r() < 0.5 ? [rnz(r, -4, 4), rnz(r, 1, 3)] : randCoeffs(r, 2, 3, 2)), g = linSrc(rnz(r, -3, 3), rnz(r, -4, 4))
    const g2 = g === '0' ? 'x' : g
    const comp = subst(f, g2), answer = fmtPoly(parsePoly(comp), true)
    return eqvSpec(`If ${fn('f', f)} and ${fn('g', g2)}, find f(g(x)). Simplify your answer.`, answer, comp, 'f(g(x)) means: put the whole expression g(x) wherever f has an x.', [`Replace x in f by g(x) = ${show(g2)}: f(g(x)) = ${show(comp)}.`, `Expand and collect: ${show(answer)}.`])
  } },
  { lesson: 'inverse-functions', level: 1, make: (r) => {
    const f = linSrc(rnz(r, -3, 3), rnz(r, -4, 4)), g = polySrc(randCoeffs(r, 2, 3, 2))
    const comp = subst(g, f), answer = fmtPoly(parsePoly(comp), true)
    return eqvSpec(`If ${fn('f', f)} and ${fn('g', g)}, find g(f(x)). Simplify your answer.`, answer, comp, 'g(f(x)) means: put the whole expression f(x) wherever g has an x. The order matters.', [`Replace x in g by f(x) = ${show(f)}: g(f(x)) = ${show(comp)}.`, `Expand and collect: ${show(answer)}.`])
  } },
  { lesson: 'inverse-functions', level: 1, make: (r) => {
    // function of itself, or both orders at a number
    const a = rnz(r, -3, 3), b = ri(r, -4, 4), x0 = ri(r, -3, 3)
    const f = linSrc(a, b)
    const v1 = evalAt(f, evalAt(f, fr(x0))!)!
    return numSpec(`If ${fn('f', f)}, find f(f(${MN(String(x0))})).`, v1, 'Apply f twice: the answer from the first f goes into the second.', [`f(${MN(String(x0))}) = ${fm(evalAt(f, fr(x0))!)}.`, `f(${fm(evalAt(f, fr(x0))!)}) = ${fm(v1)}.`])
  } },
  { lesson: 'inverse-functions', level: 2, make: (r) => {
    // inverse of a linear function
    const a = pick(r, [-3, -2, 2, 3, 4, 5]), b = rnz(r, -8, 8)
    const answer = `(x-(${b}))/${a}`
    const f = linSrc(a, b)
    const norm = fmtPoly(parsePoly(`x-(${b})`), true)
    const e = alg('rational', `Find the inverse function f⁻¹(x) of ${fn('f', f)}.`, answer, `(${norm})/${a}`, 'Write y = f(x), swap x and y, then solve for y.', [
      `Write y = ${show(f)}.`, `Swap x and y: x = ${show(linSrc(a, b).replace(/x/g, 'y'))}.`, `Solve for y: ${MN(`${a === 1 ? '' : a}y = x ${sgnText(-b)}`)}, so y = (${show(norm)})/${MN(String(a))}.`, 'That is f⁻¹(x).'])
    return { ...e, display: `(${show(norm)})/${MN(String(a))}` }
  } },
  { lesson: 'inverse-functions', level: 2, make: (r) => {
    // inverse evaluated at a number
    const kind = ri(r, 1, 4)
    if (kind === 1) {
      const a = pick(r, [2, 3, 4, -2, -3]), b = rnz(r, -6, 6), x0 = ri(r, -4, 5)
      const c = a * x0 + b
      return numSpec(`If ${fn('f', linSrc(a, b))}, find f⁻¹(${MN(String(c))}).`, fr(x0), 'f⁻¹(c) is the input that gives output c. Solve f(x) = c.', [`f⁻¹(${MN(String(c))}) is the x for which f(x) = ${MN(String(c))}.`, `Solve ${show(linSrc(a, b))} = ${MN(String(c))}: x = ${MN(String(x0))}.`])
    }
    if (kind === 2) {
      const k = rnz(r, -6, 6), x0 = ri(r, -3, 4), c = x0 ** 3 + k
      return numSpec(`If ${fn('f', polySrc([k, 0, 0, 1]))}, find f⁻¹(${MN(String(c))}).`, fr(x0), 'Solve f(x) = c: undo the added number, then take the cube root.', [`Solve x³ ${sgnText(k)} = ${MN(String(c))}.`, `x³ = ${MN(String(c - k))}, so x = ${MN(String(x0))}.`])
    }
    if (kind === 3) {
      const x0 = ri(r, 0, 5), c = 2 ** x0
      return numSpec(`If f(x) = 2ˣ, find f⁻¹(${c}).`, fr(x0), 'Solve 2ˣ = c. Write c as a power of 2 (this is a logarithm).', [`Solve 2ˣ = ${c}.`, `${c} = 2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[x0]}, so x = ${x0}.`])
    }
    const k = rnz(r, -4, 4), x0 = rnz(r, -4, 4), c = fAdd(fr(1, x0), fr(k))
    return numSpec(`If ${fn('f', `1/x ${sgnText(k)}`)}, find f⁻¹(${fm(c)}).`, fr(x0), 'Solve f(x) = c: subtract the constant, then take the reciprocal.', [`Solve 1/x ${sgnText(k)} = ${fm(c)}.`, `1/x = ${fm(fSub(c, fr(k)))}, so x = ${MN(String(x0))}.`])
  } },
  { lesson: 'inverse-functions', level: 2, make: (r) => {
    // composition giving a rational function
    const b = pick(r, [2, 3, 4, -2, -3]), c = rnz(r, -5, 5)
    const f = `1/(${polySrc([c, 1])})`, g = polySrc([0, b])
    const answer = `1/(${linSrc(b, c)})`
    const e = alg('rational', `If ${fn('f', f)} and ${fn('g', g)}, find f(g(x)) as a single fraction.`, subst(f, g), answer, 'Put g(x) in place of x in the formula for f.', [
      `f(g(x)) = 1/(g(x) ${sgnText(c)}) = 1/(${show(g)} ${sgnText(c)}).`, `So f(g(x)) = 1/(${show(linSrc(b, c))}).`])
    return { ...e, display: `1/(${show(linSrc(b, c))})` }
  } },
  { lesson: 'inverse-functions', level: 3, make: (r) => {
    // inverse of a Mobius function (ax + b)/(cx + d)
    for (;;) {
      const a = rnz(r, -3, 4), b = rnz(r, -5, 5), c = rnz(r, 1, 3) * (r() < 0.5 ? -1 : 1), d = rnz(r, -5, 5)
      if (a * d - b * c === 0) continue
      const f = `(${linSrc(a, b)})/(${linSrc(c, d)})`
      const inv = `(${linSrc(-d, b)})/(${linSrc(c, -a)})`
      const e = alg('rational', `Find the inverse function f⁻¹(x) of ${fn('f', f)}. Give it as a single fraction.`, inv, inv, 'Write y = f(x), swap x and y, then collect the y terms on one side and factor out y.', [
        `Write y = (${show(linSrc(a, b))})/(${show(linSrc(c, d))}) and swap x and y: x = (${show(linSrc(a, b).replace(/x/g, 'y'))})/(${show(linSrc(c, d).replace(/x/g, 'y'))}).`,
        'Multiply out and collect everything with y on one side, then factor out y.',
        `Divide: y = (${show(linSrc(-d, b))})/(${show(linSrc(c, -a))}). That is f⁻¹(x).`,
      ])
      return { ...e, display: `(${show(linSrc(-d, b))})/(${show(linSrc(c, -a))})` }
    }
  } },
  { lesson: 'inverse-functions', level: 3, make: (r) => {
    // find the constant that makes g the inverse of f
    const a = pick(r, [2, 3, 4, -2, -3]), b = rnz(r, -6, 6)
    // f(x) = a x + b has inverse (x - b)/a = (x + k)/a with k = -b
    return numSpec(`${fn('f', linSrc(a, b))} and g(x) = (x + k)/${a < 0 ? `(${MN(String(a))})` : a}. Find the value of k that makes g the inverse of f.`, fr(-b), 'If g is the inverse of f then f(g(x)) = x. Put g into f and see what k must be.', [`f(g(x)) = ${a === 1 ? '' : MN(String(a))}(x + k)/${MN(String(a))} ${sgnText(b)} = x + k ${sgnText(b)}.`, `For this to equal x for every x we need k ${sgnText(b)} = 0, so k = ${MN(String(-b))}.`])
  } },
  { lesson: 'inverse-functions', level: 3, make: (r) => {
    // inverse of a restricted quadratic or square-root function at a point
    if (r() < 0.5) {
      const h = rnz(r, -3, 4), k = rnz(r, -4, 4), m = ri(r, 1, 6), c = m * m + k
      return numSpec(`${fn('f', polySrc([h * h + k, -2 * h, 1]))} for x ≥ ${MN(String(h))}. Find f⁻¹(${MN(String(c))}).`, fr(h + m), 'f(x) = (x − h)² + k, and the restriction x ≥ h picks the larger solution. Solve f(x) = c.', [
        `Complete the square: f(x) = (x ${sgnText(-h)})² ${sgnText(k)}.`.replace('(x + 0)', 'x'), `Solve (x ${sgnText(-h)})² ${sgnText(k)} = ${MN(String(c))}: (x ${sgnText(-h)})² = ${m * m}, so x ${sgnText(-h)} = ±${m}.`, `The domain restriction x ≥ ${MN(String(h))} means x ${sgnText(-h)} ≥ 0, so x ${sgnText(-h)} = ${m} and x = ${MN(String(h + m))}.`])
    }
    const h = rnz(r, -3, 4), k = rnz(r, -3, 4), m = ri(r, 1, 5), c = m + k
    return numSpec(`If f(x) = √(x ${sgnText(-h)}) ${sgnText(k)}, find f⁻¹(${MN(String(c))}).`.replace('√(x + 0)', '√x'), fr(m * m + h), 'Solve f(x) = c: isolate the root, then square both sides.', [`Solve √(x ${sgnText(-h)}) ${sgnText(k)} = ${MN(String(c))}.`.replace('√(x + 0)', '√x'), `√(x ${sgnText(-h)}) = ${m}, so x ${sgnText(-h)} = ${m * m} and x = ${MN(String(m * m + h))}.`.replace('x + 0', 'x')])
  } },
]

/* ------------------------------------------------------------------ 4. graphs of polynomials */

interface Root { r: number; m: number }
const factored = (a: number, roots: Root[]) => `${a === 1 ? '' : a === -1 ? '-' : a}${roots.map(({ r, m }) => `(x${r === 0 ? '' : r < 0 ? `+${-r}` : `-${r}`})${m > 1 ? `^${m}` : ''}`).join('')}`
const expandedOf = (a: number, roots: Root[]) => fmtPoly(parsePoly(factored(a, roots)), true)
const distinctInts = (r: () => number, n: number, lo: number, hi: number) => {
  const out: number[] = []
  while (out.length < n) { const v = ri(r as never, lo, hi); if (!out.includes(v)) out.push(v) }
  return out.sort((x, y) => x - y)
}
const SUPS = ['', '', '²', '³', '⁴']
const showFactored = (a: number, roots: Root[]) => `${a === 1 ? '' : a === -1 ? MINUS : MN(String(a))}${roots.map(({ r, m }) => `(x${r === 0 ? '' : r < 0 ? ` + ${-r}` : ` ${MINUS} ${r}`})${SUPS[m]}`).join('')}`

const upDown = (prompt: string, up: boolean, expl: string[], hint: string): Spec => ({
  prompt, kind: 'word', answers: [], display: up ? 'up (towards +∞)' : 'down (towards −∞)', input: up ? 'up' : 'down', unit: '', needsExact: false, tol: 0, hint, explanation: expl,
  pad: { pi: false, root: false, comma: false, extra: ['up', 'down'] }, words: up ? ['up', 'rises', 'goes up', 'positive infinity', '+infinity', '+∞', 'infinity', '∞', 'to +∞', 'to infinity'] : ['down', 'falls', 'goes down', 'negative infinity', '-infinity', '-∞', 'to -∞', 'to negative infinity'],
})

const POLYS: Gen[] = [
  { lesson: 'polynomial-graphs', level: 1, make: (r) => {
    const n = ri(r, 2, 3), roots = distinctInts(r, n, -4, 4).map((v) => ({ r: v, m: 1 })), a = pick(r, [1, 1, 2, -1, -2, 3])
    const y0 = roots.reduce((p, { r: rr }) => p * (0 - rr), a)
    return numSpec(`Find the y-intercept of the graph of y = ${showFactored(a, roots)}.`, fr(y0), 'The y-intercept is where x = 0. Substitute x = 0 into every bracket.', [
      `Put x = 0: y = ${a === 1 ? '' : `${w(a)} × `}${roots.map(({ r: rr }) => `(${MN(String(0 - rr))})`).join(' × ')}.`, `Multiply: y = ${MN(String(y0))}.`])
  } },
  { lesson: 'polynomial-graphs', level: 1, make: (r) => {
    // crosses or touches
    const roots = distinctInts(r, 3, -4, 4).map((v, i) => ({ r: v, m: i === 1 ? pick(r, [2, 2, 3, 4]) : pick(r, [1, 1, 2]) }))
    const a = pick(r, [1, -1, 2])
    const target = pick(r, roots)
    const crosses = target.m % 2 === 1
    const spec: Spec = {
      prompt: `Does the graph of y = ${showFactored(a, roots)} cross the x-axis or just touch it at x = ${MN(String(target.r))}? (Type crosses or touches.)`, kind: 'word', answers: [], display: crosses ? 'crosses' : 'touches', input: crosses ? 'crosses' : 'touches',
      unit: '', needsExact: false, tol: 0, hint: 'Look at the power on the bracket that gives that root: an odd power crosses, an even power touches and turns back.',
      explanation: [`The root x = ${MN(String(target.r))} comes from the bracket (x ${sgnText(-target.r)})${SUPS[target.m] || ''}, which has multiplicity ${target.m}.`.replace('(x + 0)', 'x'), crosses ? `${target.m} is odd, so the sign of y changes there and the graph crosses the axis.` : `${target.m} is even, so the sign of y does not change and the graph touches the axis and turns back.`],
      pad: { pi: false, root: false, comma: false, extra: ['crosses', 'touches'] }, words: crosses ? ['crosses', 'cross', 'crosses the axis'] : ['touches', 'touch', 'touches the axis', 'turns', 'bounces'],
    }
    return spec
  } },
  { lesson: 'polynomial-graphs', level: 1, make: (r) => {
    // number of x-intercepts
    const k = ri(r, 2, 4), roots = distinctInts(r, k, -5, 5).map((v) => ({ r: v, m: pick(r, [1, 1, 2, 3]) }))
    const a = pick(r, [1, -1, 2, -2, 3])
    return numSpec(`How many different x-intercepts does the graph of y = ${showFactored(a, roots)} have?`, fr(k), 'Each different bracket gives one x-intercept, whatever its power. Repeated roots are counted once.', [
      `The roots are ${roots.map(({ r: rr }) => MN(String(rr))).join(', ')}.`, `They are all different, so there are ${k} x-intercepts.`])
  } },
  { lesson: 'polynomial-graphs', level: 2, make: (r) => {
    // end behaviour
    const deg = ri(r, 2, 5), a = rnz(r, 1, 4) * (r() < 0.5 ? -1 : 1)
    const cs = Array.from({ length: deg + 1 }, (_, i) => (i === deg ? a : ri(r, -4, 4)))
    const src = polySrc(cs)
    const right = r() < 0.5
    const pos = a > 0
    const upRight = pos, upLeft = deg % 2 === 0 ? pos : !pos
    const up = right ? upRight : upLeft
    const prompt = `For y = ${show(src)}, what does y do as x → ${right ? '+∞' : '−∞'}? (Type up or down.)`
    return upDown(prompt, up, [`The leading term is ${show(`${a === 1 ? '' : a === -1 ? '-' : a}x^${deg}`)}, with degree ${deg} (${deg % 2 === 0 ? 'even' : 'odd'}) and ${pos ? 'positive' : 'negative'} leading coefficient.`, `For large |x| the leading term dominates. ${right ? 'As x → +∞ it' : `As x → −∞ the power x^${deg} is ${deg % 2 === 0 ? 'positive' : 'negative'}, so it`} ${up ? 'rises' : 'falls'}.`], 'Only the leading term matters for large x. An even power gives the same sign at both ends; an odd power gives opposite signs.')
  } },
  { lesson: 'polynomial-graphs', level: 2, make: (r) => {
    // maximum number of turning points
    const deg = ri(r, 2, 8), cs = Array.from({ length: deg + 1 }, (_, i) => (i === deg ? rnz(r, 1, 3) : ri(r, -3, 3)))
    return numSpec(`What is the greatest number of turning points the graph of y = ${show(polySrc(cs))} can have?`, fr(deg - 1), 'A polynomial of degree n has at most n − 1 turning points.', [`The degree is ${deg}.`, `A polynomial of degree n has at most n − 1 turning points, so at most ${deg - 1}.`])
  } },
  { lesson: 'polynomial-graphs', level: 2, make: (r) => {
    // where is P(x) > 0, with multiplicities
    const n = ri(r, 2, 3), roots = distinctInts(r, n, -5, 5).map((v) => ({ r: v, m: pick(r, [1, 1, 2]) }))
    const a = pick(r, [1, -1, 2, -2])
    const op = pick(r, ['>', '<', '>=', '<='] as const)
    const f = (x: number) => a * roots.reduce((p, { r: rr, m }) => p * (x - rr) ** m, 1)
    const set = signSet(f, roots.map((q) => q.r), op)
    const sym = op === '>' ? '>' : op === '<' ? '<' : op === '>=' ? '≥' : '≤'
    return ineqSpec(`Solve ${showFactored(a, roots)} ${sym} 0. Write the solution set.`, set, 'x', 'Mark the roots, find the sign in each region, remembering that an even power does not change the sign at its root.', [
      `The roots are ${roots.map((q) => `${MN(String(q.r))}${q.m > 1 ? ` (multiplicity ${q.m})` : ''}`).join(', ')}.`,
      `The sign changes at roots of odd multiplicity and stays the same at roots of even multiplicity. Test a point in each region.`,
      `Include the roots only if the inequality has "or equal to".`], roots.map((q) => exF(fr(q.r))),
    (x) => { const v = f(x); return op === '>' ? v > 1e-9 : op === '<' ? v < -1e-9 : op === '>=' ? v >= -1e-9 : v <= 1e-9 })
  } },
  { lesson: 'polynomial-graphs', level: 3, make: (r) => {
    // build the polynomial from its roots and a point
    const roots = distinctInts(r, 3, -4, 4).map((v, i) => ({ r: v, m: i === 1 && r() < 0.6 ? 2 : 1 }))
    const a = pick(r, [1, 2, -1, -2, 3])
    const y0 = a * roots.reduce((p, { r: rr, m }) => p * (0 - rr) ** m, 1)
    if (y0 === 0) return POLYS[POLYS.length - 1].make(r)
    const parts = roots.map((q) => `${MN(String(q.r))}${q.m > 1 ? ' (a double root)' : ''}`).join(', ')
    const src = factored(a, roots)
    return eqvSpec(`A polynomial has roots ${parts}, has the smallest possible degree, and its graph passes through (0, ${MN(String(y0))}). Find its equation. Any equivalent form is accepted.`, expandedOf(a, roots), src,
      'Write the factored form y = a(x − r₁)(x − r₂)… with the repeated factor squared, then use the extra point to find a.', [
        `Factored form: y = a${roots.map((q) => `(x ${sgnText(-q.r)})${q.m > 1 ? '²' : ''}`).join('').replace(/\(x \+ 0\)/g, 'x')}.`, `Substitute x = 0, y = ${MN(String(y0))}: ${MN(String(y0))} = a × ${MN(String(y0 / a))}, so a = ${MN(String(a))}.`, `So y = ${show(expandedOf(a, roots))} (expanded), or in factored form ${showFactored(a, roots)}.`])
  } },
  { lesson: 'polynomial-graphs', level: 3, make: (r) => {
    // an expanded polynomial inequality; the roots must be found first
    const n = ri(r, 3, 4)
    const roots = distinctInts(r, n === 4 ? 3 : n, -4, 4).map((v, i) => ({ r: v, m: n === 4 && i === 1 ? 2 : 1 }))
    const a = pick(r, [1, -1, 2])
    const op = pick(r, ['>', '<', '>=', '<='] as const)
    const expanded = expandedOf(a, roots)
    const f = (x: number) => a * roots.reduce((p, { r: rr, m }) => p * (x - rr) ** m, 1)
    const set = signSet(f, roots.map((q) => q.r), op)
    const sym = op === '>' ? '>' : op === '<' ? '<' : op === '>=' ? '≥' : '≤'
    return ineqSpec(`Solve ${show(expanded)} ${sym} 0. Write the solution set.`, set, 'x', 'Factor the polynomial first (try small whole-number roots), then use a sign chart.', [
      `Find the roots by trying small whole numbers: they are ${roots.map((q) => `${MN(String(q.r))}${q.m > 1 ? ' (twice)' : ''}`).join(', ')}.`,
      `So the polynomial is ${showFactored(a, roots)}.`, 'Test a point in each region, remembering that a repeated root does not change the sign.'], roots.map((q) => exF(fr(q.r))),
    (x) => { const v = f(x); return op === '>' ? v > 1e-9 : op === '<' ? v < -1e-9 : op === '>=' ? v >= -1e-9 : v <= 1e-9 })
  } },
]

/* ------------------------------------------------------------------ 5. rational functions and asymptotes */

const showRat = (num: string, den: string) => `(${show(num)})/(${show(den)})`

const RATIONALS: Gen[] = [
  { lesson: 'rational-graphs', level: 1, make: (r) => {
    for (;;) {
      const a = rnz(r, -4, 4), b = rnz(r, -5, 5), c = rnz(r, 1, 4) * (r() < 0.4 ? -1 : 1), d = rnz(r, -6, 6)
      if (a * d - b * c === 0) continue
      const f = showRat(linSrc(a, b), linSrc(c, d))
      if (r() < 0.5) {
        const va = fr(-d, c)
        return numSpec(`Find the equation of the vertical asymptote of f(x) = ${f}. Give the value of x.`, va, 'A vertical asymptote is where the denominator is zero (and the numerator is not).', [`Set the denominator to zero: ${MN(String(c))}x ${sgnText(d)} = 0.`.replace(/^(.*?)1x/, '$1x'), `So x = ${fm(va)}. The numerator is not zero there, so this is a vertical asymptote.`])
      }
      const ha = fr(a, c)
      return numSpec(`Find the horizontal asymptote of f(x) = ${f}. Give the value of y.`, ha, 'When the top and bottom have the same degree, divide the leading coefficients.', [`Both numerator and denominator have degree 1, with leading coefficients ${MN(String(a))} and ${MN(String(c))}.`, `As x grows large, f(x) approaches ${MN(String(a))}/${MN(String(c))} = ${fm(ha)}, so the horizontal asymptote is y = ${fm(ha)}.`])
    }
  } },
  { lesson: 'rational-graphs', level: 1, make: (r) => {
    // vertical asymptotes of a quotient with a factorable denominator
    const [p, q] = distinctInts(r, 2, -6, 6), c = rnz(r, 1, 4)
    const den = fmtPoly(parsePoly(`(x-(${p}))(x-(${q}))`), true)
    return exactSet(`Find the vertical asymptotes of f(x) = ${c}/(${show(den)}). Give the values of x, separated by commas.`, [exF(fr(p)), exF(fr(q))], 'x', 'Factor the denominator and find where it is zero. The numerator is a non-zero constant, so there are no holes.', [
      `Factor: ${show(den)} = (x ${sgnText(-p)})(x ${sgnText(-q)}).`.replace(/\(x \+ 0\)/g, 'x'), `The denominator is zero at x = ${MN(String(p))} and x = ${MN(String(q))}, and the numerator is never zero, so both are vertical asymptotes.`])
  } },
  { lesson: 'rational-graphs', level: 2, make: (r) => {
    // horizontal asymptote from the degrees
    const m = ri(r, 1, 3), n = ri(r, 1, 3)
    const num = Array.from({ length: m + 1 }, (_, i) => (i === m ? rnz(r, 1, 5) * (r() < 0.4 ? -1 : 1) : ri(r, -4, 4)))
    const den = Array.from({ length: n + 1 }, (_, i) => (i === n ? rnz(r, 1, 4) : ri(r, -4, 4)))
    const f = showRat(polySrc(num), polySrc(den))
    const prompt = `Find the horizontal asymptote of f(x) = ${f}. Give the value of y, or type none if there is no horizontal asymptote.`
    if (m > n) {
      return { prompt, kind: 'value', answers: [null], display: 'none', input: 'none', unit: '', needsExact: false, tol: 0, hint: 'Compare the degrees of the numerator and the denominator.', explanation: [`The numerator has degree ${m} and the denominator degree ${n}.`, 'The top grows faster than the bottom, so f(x) grows without bound and there is no horizontal asymptote.'], pad: { pi: false, root: false, comma: false, alg: true } }
    }
    const ha = m === n ? fr(num[m], den[n]) : fr(0)
    return numSpec(prompt, ha, 'Compare the degrees: lower on top gives y = 0, equal degrees give the ratio of leading coefficients.', [
      `The numerator has degree ${m} and the denominator degree ${n}.`, m === n ? `The degrees are equal, so y approaches the ratio of the leading coefficients: ${MN(String(num[m]))}/${MN(String(den[n]))} = ${fm(ha)}.` : 'The bottom grows faster than the top, so f(x) approaches 0 as x gets large.', `The horizontal asymptote is y = ${fm(ha)}.`])
  } },
  { lesson: 'rational-graphs', level: 2, make: (r) => {
    // the hole of a rational function
    const [a, b, c] = distinctInts(r, 3, -5, 5)
    const num = fmtPoly(parsePoly(`(x-(${a}))(x-(${b}))`), true), den = fmtPoly(parsePoly(`(x-(${a}))(x-(${c}))`), true)
    const y = fr(a - b, a - c)
    return pairSpec(`The graph of f(x) = (${show(num)})/(${show(den)}) has a hole. Find its coordinates (x, y).`, fr(a), y, 'Factor top and bottom. The common factor that cancels gives the x-value of the hole. Put that x into what is left to get the y-value.', [
      `Factor: top = (x ${sgnText(-a)})(x ${sgnText(-b)}), bottom = (x ${sgnText(-a)})(x ${sgnText(-c)}).`.replace(/\(x \+ 0\)/g, 'x'), `The common factor (x ${sgnText(-a)}) cancels, so there is a hole at x = ${MN(String(a))}.`.replace('(x + 0)', 'x'), `After cancelling, f(x) = (x ${sgnText(-b)})/(x ${sgnText(-c)}). At x = ${MN(String(a))} this is ${fm(y)}.`.replace(/\(x \+ 0\)|x \+ 0/g, 'x')])
  } },
  { lesson: 'rational-graphs', level: 2, make: (r) => {
    // intercepts
    const [p, q, c] = distinctInts(r, 3, -5, 5)
    const k = pick(r, [1, 2, -1, 3])
    if (p === 0 || q === 0 || c === 0) return RATIONALS[3].make(r)
    const num = `${k === 1 ? '' : k}(x-(${p}))(x-(${q}))`, den = `x-(${c})`
    const y0 = fDiv(fr(k * p * q), fr(-c))
    if (r() < 0.5) {
      return exactSet(`Find the x-intercepts of f(x) = ${showRat(fmtPoly(parsePoly(num), true), fmtPoly(parsePoly(den), true))}. Give the values of x, separated by commas.`, [exF(fr(p)), exF(fr(q))], 'x', 'A fraction is zero when its numerator is zero (and its denominator is not).', [
        `Set the numerator to zero: ${show(fmtPoly(parsePoly(num), true))} = 0, which factors as ${k === 1 ? '' : `${k}`}(x ${sgnText(-p)})(x ${sgnText(-q)}) = 0.`.replace(/\(x \+ 0\)/g, 'x'), `So x = ${MN(String(p))} or x = ${MN(String(q))}. The denominator is not zero at either, so both are x-intercepts.`])
    }
    return numSpec(`Find the y-intercept of f(x) = ${showRat(fmtPoly(parsePoly(num), true), fmtPoly(parsePoly(den), true))}.`, y0, 'The y-intercept is f(0): put x = 0 into the top and the bottom.', [`Numerator at x = 0: ${MN(String(k * p * q))}.`, `Denominator at x = 0: ${MN(String(-c))}.`, `f(0) = ${fm(y0)}.`])
  } },
  { lesson: 'rational-graphs', level: 3, make: (r) => {
    // oblique asymptote: build numerator = (mx + n)(dx + e) + remainder
    for (;;) {
      const m = rnz(r, 1, 3) * (r() < 0.4 ? -1 : 1), n = ri(r, -4, 4), d = rnz(r, 1, 3), e = rnz(r, -4, 4), rem = rnz(r, -5, 5)
      const num = fmtPoly(parsePoly(`(${m}x+(${n}))(${d}x+(${e}))+(${rem})`), true)
      const den = linSrc(d, e)
      const slant = fmtPoly(parsePoly(`${m}x+(${n})`), true)
      const q = pDivide(parsePoly(num), parsePoly(den)).q
      if (fmtPoly(q, true) !== slant) continue
      return eqvSpec(`Find the oblique (slant) asymptote of f(x) = ${showRat(num, den)}. Give the equation of the asymptote, y = …, in any equivalent form.`, slant, slant,
        'The numerator is one degree higher than the denominator. Divide: the quotient (ignoring the remainder) is the asymptote.', [
          `The numerator has degree 2 and the denominator degree 1, so there is an oblique asymptote.`, `Divide ${show(num)} by ${show(den)}: the quotient is ${show(slant)} with remainder ${MN(String(rem))}.`, `As x gets large the remainder term ${MN(String(rem))}/(${show(den)}) approaches 0, so y = ${show(slant)} is the asymptote.`])
    }
  } },
  { lesson: 'rational-graphs', level: 3, make: (r) => {
    // count vertical asymptotes and holes
    const [a, b, c, d] = distinctInts(r, 4, -5, 5)
    const kind = ri(r, 1, 2)
    const num = fmtPoly(parsePoly(`(x-(${a}))(x-(${b}))`), true), den = fmtPoly(parsePoly(`(x-(${a}))(x-(${c}))(x-(${d}))`), true)
    const text = `f(x) = (${show(num)})/(${show(den)})`
    if (kind === 1) return numSpec(`How many vertical asymptotes does the graph of ${text} have?`, fr(2), 'Factor everything. A factor that appears on top and bottom gives a hole, not an asymptote.', [`Factor: top = (x ${sgnText(-a)})(x ${sgnText(-b)}), bottom = (x ${sgnText(-a)})(x ${sgnText(-c)})(x ${sgnText(-d)}).`.replace(/\(x \+ 0\)/g, 'x'), `The factor (x ${sgnText(-a)}) cancels (a hole at x = ${MN(String(a))}), leaving zeros of the denominator at x = ${MN(String(c))} and x = ${MN(String(d))}.`.replace('(x + 0)', 'x'), 'That is 2 vertical asymptotes (the hole is not one).'])
    return numSpec(`How many holes does the graph of ${text} have?`, fr(1), 'A hole happens where a factor cancels between the numerator and the denominator.', [`Factor: top = (x ${sgnText(-a)})(x ${sgnText(-b)}), bottom = (x ${sgnText(-a)})(x ${sgnText(-c)})(x ${sgnText(-d)}).`.replace(/\(x \+ 0\)/g, 'x'), `Only (x ${sgnText(-a)}) appears on top and bottom, so there is exactly 1 hole.`.replace('(x + 0)', 'x')])
  } },
]

/* ------------------------------------------------------------------ 6. function models */

const MODELS: Gen[] = [
  { lesson: 'function-models', level: 1, make: (r) => {
    const cs = randCoeffs(r, ri(r, 2, 3), 4, 2), src = polySrc(cs)
    const a = ri(r, -3, 2), b = a + ri(r, 1, 4)
    const fa = evalAt(src, fr(a))!, fb = evalAt(src, fr(b))!
    const v = fDiv(fSub(fb, fa), fr(b - a))
    return numSpec(`Find the average rate of change of ${fn('f', src)} between x = ${MN(String(a))} and x = ${b}.`, v, 'Average rate of change is the slope of the chord: (f(b) − f(a)) / (b − a).', [
      `f(${MN(String(a))}) = ${fm(fa)} and f(${b}) = ${fm(fb)}.`, `Slope = (${fm(fb)} ${MINUS} ${w(fa)}) / (${b} ${MINUS} ${w(a)}) = ${fm(v)}.`])
  } },
  { lesson: 'function-models', level: 1, make: (r) => {
    // a linear model from two data points
    const m = ri(r, 2, 6), c = rnz(r, 2, 20), x1 = ri(r, 2, 4), x2 = x1 + ri(r, 2, 6), x3 = x2 + ri(r, 1, 6)
    const noun = pick(r, [['units', 'cost'], ['hours', 'charge'], ['kilometres', 'fare']])
    return numSpec(`A ${noun[1]} is a linear function of the number of ${noun[0]}. For ${x1} ${noun[0]} it is ${m * x1 + c}, and for ${x2} ${noun[0]} it is ${m * x2 + c}. What is the ${noun[1]} for ${x3} ${noun[0]}?`, fr(m * x3 + c), 'A linear model has constant slope: find the slope from the two data points, then extend it.', [
      `Slope = (${m * x2 + c} ${MINUS} ${m * x1 + c}) / (${x2} ${MINUS} ${x1}) = ${m}.`, `The intercept is ${m * x1 + c} ${MINUS} ${m} × ${x1} = ${c}, so the model is ${m}x + ${c}.`, `At ${x3}: ${m} × ${x3} + ${c} = ${m * x3 + c}.`])
  } },
  { lesson: 'function-models', level: 2, make: (r) => {
    const kind = ri(r, 1, 2)
    if (kind === 1) {
      // fence against a wall: A = x(P - 2x)
      const P = pick(r, [40, 60, 80, 100, 120, 200])
      const x = fr(P, 4), area = fMul(x, fSub(fr(P), fMul(fr(2), x)))
      return pairSpec(`A farmer has ${P} m of fencing for three sides of a rectangular pen; the fourth side is a wall. If the two sides at right angles to the wall are each x metres, find the value of x that gives the greatest area, and that area. Give (x, area).`, x, area, 'Write the area as a function of x and find the vertex of the parabola.', [
        `The side along the wall is ${P} ${MINUS} 2x, so the area is A = x(${P} ${MINUS} 2x) = ${P}x ${MINUS} 2x².`, `The parabola opens downwards, so its vertex is the maximum, at x = ${P}/4 = ${fm(x)}.`, `The greatest area is A(${fm(x)}) = ${fm(area)} m².`])
    }
    const v = pick(r, [10, 15, 20, 25, 30]), h0 = pick(r, [0, 1, 2, 5]), g = 5
    // h(t) = -5t^2 + v t + h0: vertex at t = v/10
    const t = fr(v, 10), height = fAdd(fSub(fMul(fr(v), t), fMul(fr(g), fMul(t, t))), fr(h0))
    return pairSpec(`A ball is thrown upwards, and its height in metres after t seconds is h(t) = ${MINUS}5t² + ${v}t${h0 ? ` + ${h0}` : ''}. Find the time at which the ball is highest, and the greatest height. Give (t, height).`, t, height, 'The height is a downward parabola in t, so the highest point is at its vertex, t = −b/(2a).', [
      `For h(t) = ${MINUS}5t² + ${v}t${h0 ? ` + ${h0}` : ''}, t = −b/(2a) = ${MN(`-${v}`)}/(2 × ${MN('-5')}) = ${fm(t)}.`, `Substitute: h(${fm(t)}) = ${fm(height)}.`])
  } },
  { lesson: 'function-models', level: 2, make: (r) => {
    // even, odd, or neither
    const pool = [[0, -1, 0, 1], [0, 3, 0, 0, 0, 1], [0, 0, 1, 0, 1], [5, 0, -2], [0, 0, 1, 1], [1, 1], [0, 2], [3], [0, 0, 0, 0, 1, 0, -1], [0, 1, 1], [0, -2, 0, 1, 0, 1], [2, 0, 3, 0, -1], [4, 1, 0, 1]]
    const src = polySrc(pick(r, pool))
    const terms = parsePoly(src)
    const odd = terms.every((t) => (t.e.x ?? 0) % 2 === 1), even = terms.every((t) => (t.e.x ?? 0) % 2 === 0)
    const truth = even ? 'even' : odd ? 'odd' : 'neither'
    return {
      prompt: `Is ${fn('f', src)} even, odd, or neither? (Type even, odd or neither.)`, kind: 'word', answers: [], display: truth, input: truth, unit: '', needsExact: false, tol: 0,
      hint: 'Compare f(−x) with f(x): equal means even, the opposite means odd. Or look at the powers: all even gives even, all odd gives odd.',
      explanation: [`f(${MINUS}x) = ${show(fmtPoly(parsePoly(subst(src, '-x')), true))}.`, truth === 'even' ? 'This equals f(x), so f is even (its graph is symmetric about the y-axis).' : truth === 'odd' ? `This equals ${MINUS}f(x), so f is odd (its graph is symmetric about the origin).` : 'It is neither equal to f(x) nor to −f(x), so f is neither even nor odd.'],
      pad: { pi: false, root: false, comma: false, extra: ['even', 'odd', 'neither'] }, words: [truth],
    }
  } },
  { lesson: 'function-models', level: 3, make: (r) => {
    // where is a quadratic increasing or decreasing
    const a = rnz(r, 1, 3) * (r() < 0.5 ? -1 : 1), h = ri(r, -5, 5), k = ri(r, -5, 5)
    const dec = r() < 0.5
    const src = fmtPoly(parsePoly(`${a}(x-(${h}))^2+(${k})`), true)
    const decreasingLeft = a > 0
    const set = (dec ? decreasingLeft : !decreasingLeft) ? [{ lo: -Infinity, hi: h, loIncl: false, hiIncl: false }] : [{ lo: h, hi: Infinity, loIncl: false, hiIncl: false }]
    const f = (x: number) => (dec ? a * (x - h) < 0 : a * (x - h) > 0)
    return ineqSpec(`On what values of x is ${fn('f', src)} ${dec ? 'decreasing' : 'increasing'}? Write it as an inequality.`, set, 'x', 'A parabola turns at its vertex. It moves one way on the left of the vertex and the other way on the right.', [
      `The vertex is at x = ${MN(String(h))}.`, `The parabola opens ${a > 0 ? 'upwards' : 'downwards'}, so it is ${a > 0 ? 'decreasing to the left of the vertex and increasing to the right' : 'increasing to the left of the vertex and decreasing to the right'}.`, `It is ${dec ? 'decreasing' : 'increasing'} for ${set[0].lo === -Infinity ? `x < ${MN(String(h))}` : `x > ${MN(String(h))}`}.`], [exF(fr(h))], f)
  } },
  { lesson: 'function-models', level: 3, make: (r) => {
    // parity of a combination
    const kinds: { f: 'even' | 'odd'; g: 'even' | 'odd'; op: string; text: string; ans: 'even' | 'odd' | 'neither' }[] = [
      { f: 'even', g: 'even', op: 'product', text: 'f(x)·g(x)', ans: 'even' }, { f: 'odd', g: 'odd', op: 'product', text: 'f(x)·g(x)', ans: 'even' }, { f: 'even', g: 'odd', op: 'product', text: 'f(x)·g(x)', ans: 'odd' },
      { f: 'even', g: 'odd', op: 'sum', text: 'f(x) + g(x)', ans: 'neither' }, { f: 'odd', g: 'odd', op: 'sum', text: 'f(x) + g(x)', ans: 'odd' }, { f: 'even', g: 'even', op: 'sum', text: 'f(x) + g(x)', ans: 'even' },
      { f: 'even', g: 'odd', op: 'composition', text: 'f(g(x))', ans: 'even' }, { f: 'odd', g: 'odd', op: 'composition', text: 'f(g(x))', ans: 'odd' },
    ]
    const k = pick(r, kinds)
    return {
      prompt: `f is an ${k.f} function and g is an ${k.g} function. Is ${k.text} even, odd, or neither? (Type even, odd or neither.)`.replace('an even', 'an even').replace('an odd function and', 'an odd function and'), kind: 'word', answers: [], display: k.ans, input: k.ans, unit: '', needsExact: false, tol: 0,
      hint: 'Replace x by −x and use f(−x) = ±f(x) and g(−x) = ±g(x). See what sign comes out.', explanation: [
        `Replace x by ${MINUS}x in ${k.text}.`, k.op === 'composition' ? `g(${MINUS}x) = ${k.g === 'even' ? 'g(x)' : '−g(x)'}, and then f of that is ${k.f === 'even' ? 'the same as f(g(x)) whatever the sign of its input' : 'minus f(g(x)) when the input changes sign'}.` : `Use f(${MINUS}x) = ${k.f === 'even' ? 'f(x)' : '−f(x)'} and g(${MINUS}x) = ${k.g === 'even' ? 'g(x)' : '−g(x)'}.`, `The result is ${k.ans === 'neither' ? 'neither f(x) + g(x) nor its negative, so it is neither even nor odd' : `${k.ans}`}.`,
      ], pad: { pi: false, root: false, comma: false, extra: ['even', 'odd', 'neither'] }, words: [k.ans],
    }
  } },
  { lesson: 'function-models', level: 3, make: (r) => {
    // piecewise cost
    const base = pick(r, [3, 4, 5, 6]), rate1 = pick(r, [2, 3]), cap = pick(r, [4, 5, 6, 8]), rate2 = pick(r, [1, 2]), dist = cap + ri(r, 2, 7)
    const cost = base + rate1 * cap + rate2 * (dist - cap)
    return numSpec(`A taxi charges ${base} dollars plus ${rate1} dollars per km for the first ${cap} km, and ${rate2} dollar${rate2 === 1 ? '' : 's'} per km after that. How much does a journey of ${dist} km cost?`, fr(cost), 'Split the distance at the point where the rate changes, and add the cost of each part.', [
      `First ${cap} km: ${rate1} × ${cap} = ${rate1 * cap}, plus the starting charge ${base}, makes ${base + rate1 * cap}.`, `Remaining ${dist - cap} km at ${rate2} per km: ${rate2 * (dist - cap)}.`, `Total: ${cost} dollars.`])
  } },
]

export const FN_GENS: Gen[] = [...FUNCTIONS, ...TRANSFORMS, ...INVERSES, ...POLYS, ...RATIONALS, ...MODELS]
