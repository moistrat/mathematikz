/**
 * Question generators for Unit 3: equations and inequalities.
 *
 * Linear and quadratic equations are built from known solutions and then checked by the algebra and
 * solve engines; inequalities come with their exact solution set, and every question carries a
 * `holds` predicate (the equation or inequality as written) that the tests use to check answers independently.
 */
import {
  fmtFrac, fmtPoly, Frac, fEq, fMul, fNum, fr, fSub, gcdI, parsePoly, parseRat, pretty as basePretty, solveEquation, evalExpr,
} from './algebra'
import { alg, numSpec, ri, rnz, rootsSpec } from './algebraQuestions'
import { MINUS } from './exact'
import type { Gen, Spec } from './questions'
import { pick, Rng } from './rng'
import {
  ExactRoot, fmtIntervals, fmtPlusMinus, fmtRoot, fmtSet, IntervalSet, intersect, normalise, quadRoots, rootInput, rootValue,
  setsEqual, signSet, solveSystem, solveSystem3, union, vertex,
} from './solve'

/* ------------------------------------------------------------------ small helpers */

const MN = (s: string) => s.replace(/-/g, MINUS)
/** neat display of an ASCII expression: x + (-3) becomes x − 3, and (6) becomes 6 */
const tidy = (s: string) => s
  .replace(/\+ \(-(\d+)\)/g, '- $1')
  .replace(/- \(-(\d+)\)/g, '+ $1')
  .replace(/([+-]) \((\d+)\)/g, '$1 $2')
const pretty = (s: string) => basePretty(tidy(s))
/** coefficient text: 1 -> '', -1 -> '−', 5 -> '5' */
const cf = (k: number) => (k === 1 ? '' : k === -1 ? MINUS : MN(String(k)))
const tx = (k: number, v = 'x') => `${cf(k)}${v}`
const sq = (n: number) => (n < 0 ? `(${MN(String(n))})²` : `${n}²`)
/** the last step of a linear solve: divide (or multiply by -1), skipped when the coefficient is 1 */
const divStep = (k: number, value: string, v = 'x'): string[] => (k === 1 ? [] : k === -1 ? [`Multiply both sides by ${MINUS}1: ${v} = ${value}.`] : [`Divide both sides by ${MN(String(k))}: ${v} = ${value}.`])
const lead = (c: number) => (c === 1 ? '' : c === -1 ? '-' : String(c))
/** ASCII  a x + b  ("2x - 3", "-x + 4", "x") */
const lin = (a: number, b: number, v = 'x') => `${lead(a)}${v}${b === 0 ? '' : b < 0 ? ` - ${-b}` : ` + ${b}`}`
/** ASCII  a x^2 + b x + c */
function quad(a: number, b: number, c: number, v = 'x'): string {
  const parts: string[] = []
  const t = (k: number, body: string) => `${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 && body ? '' : Math.abs(k)}${body}`
  if (a) parts.push(`${a < 0 ? '-' : ''}${Math.abs(a) === 1 ? '' : Math.abs(a)}${v}^2`)
  if (b) parts.push(parts.length ? t(b, v) : `${b < 0 ? '-' : ''}${Math.abs(b) === 1 ? '' : Math.abs(b)}${v}`)
  if (c || !parts.length) parts.push(parts.length ? t(c, '') : String(c))
  return parts.join(' ')
}
const sgnText = (n: number) => (n < 0 ? `${MINUS} ${-n}` : `+ ${n}`)

function search<T>(tries: number, f: () => T | null): T | null {
  for (let i = 0; i < tries; i++) { const v = f(); if (v) return v }
  return null
}

/** a/b with b > 0 and small denominators, as the nearest simple fraction */
function ratText(x: number): string {
  for (let d = 1; d <= 120; d++) {
    const n = Math.round(x * d)
    if (Math.abs(n / d - x) < 1e-9) return fmtFrac(fr(n, d))
  }
  return MN(String(Number(x.toFixed(6))))
}

/** An exact answer: its value, how it is written on screen, and how a student types it. */
interface Ex { val: number; disp: string; inp: string; exact: boolean }
const nonTerminating = (f: Frac) => { let d = f.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d !== 1 }
const exF = (f: Frac): Ex => ({ val: fNum(f), disp: fmtFrac(f), inp: fmtFrac(f).replace(MINUS, '-'), exact: nonTerminating(f) })
const exR = (x: ExactRoot): Ex => ({ val: rootValue(x), disp: fmtRoot(x), inp: rootInput(x), exact: x.b.n !== 0 || nonTerminating(x.a) })
const exSqrt = (n: number, neg = false): Ex => {
  const s = Math.round(Math.sqrt(n))
  if (s * s === n) return exF(fr(neg ? -s : s))
  let k = 1, r = n
  for (let f = 2; f * f <= r; f++) while (r % (f * f) === 0) { r /= f * f; k *= f }
  const disp = `${neg ? MINUS : ''}${k === 1 ? '' : k}√${r}`
  return { val: (neg ? -1 : 1) * Math.sqrt(n), disp, inp: `${neg ? '-' : ''}${k === 1 ? '' : `${k}*`}sqrt(${r})`, exact: true }
}

function exactSet(prompt: string, items: Ex[], v: string, hint: string, expl: string[], shown?: string, holds?: (x: number) => boolean): Spec {
  const sorted = [...items].sort((a, b) => a.val - b.val).filter((e, i, xs) => i === 0 || Math.abs(e.val - xs[i - 1].val) > 1e-9)
  return {
    prompt, kind: 'set', answers: sorted.map((e) => e.val),
    display: sorted.length ? shown ?? `${v} = ${sorted.map((e) => e.disp).join(', ')}` : 'no real solution',
    input: sorted.length ? sorted.map((e) => e.inp).join(', ') : 'no solution', unit: '', needsExact: sorted.some((e) => e.exact), tol: 1e-9,
    hint, explanation: expl, pad: { pi: false, root: sorted.some((e) => e.exact), comma: true, alg: true }, holds,
  }
}

function pairSpec(prompt: string, x: Frac, y: Frac, hint: string, expl: string[], holds?: (x: number) => boolean): Spec {
  return {
    prompt, kind: 'pair', answers: [fNum(x), fNum(y)], display: `(${fmtFrac(x)}, ${fmtFrac(y)})`,
    input: `(${fmtFrac(x).replace(MINUS, '-')}, ${fmtFrac(y).replace(MINUS, '-')})`, unit: '', needsExact: nonTerminating(x) || nonTerminating(y), tol: 1e-9,
    hint, explanation: expl, pad: { pi: false, root: false, comma: true, alg: true }, holds,
  }
}

function ineqSpec(prompt: string, set: IntervalSet, v: string, hint: string, expl: string[], ends: Ex[] = [], holds?: (x: number) => boolean): Spec {
  const find = (x: number) => ends.find((e) => Math.abs(e.val - x) < 1e-9)
  const disp = (x: number) => find(x)?.disp ?? ratText(x)
  const inp = (x: number) => find(x)?.inp ?? ratText(x).replace(/−/g, '-')
  const shown = fmtSet(set, v, disp)
  return {
    prompt, kind: 'ineq', answers: [], display: shown,
    input: fmtSet(set, v, inp).replace(/−/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>='), unit: '',
    needsExact: ends.some((e) => e.exact), tol: 0, hint,
    explanation: [...expl, `In interval notation: ${fmtIntervals(set, disp)}.`],
    pad: { pi: false, root: ends.some((e) => e.exact), comma: false, alg: true }, iv: normalise(set), holds,
  }
}

const roots2 = (a: number, b: number, c: number) => quadRoots(a, b, c)

/* ------------------------------------------------------------------ 1. linear equations */

/** solve  lhs = rhs  for x using the engine, returning the unique root (or null) */
function unique(lhs: string, rhs: string): Frac | null {
  const s = solveEquation(parseRat(lhs), parseRat(rhs), 'x')
  return !s.identity && s.roots.length === 1 ? s.roots[0] : null
}
const eqHolds = (lhs: string, rhs: string) => (x: number) => Math.abs(evalExpr(lhs, { x }) - evalExpr(rhs, { x })) < 1e-7

function linearSpec(lhs: string, rhs: string, root: Frac, hint: string, steps: string[], intro = 'Solve for x'): Spec {
  const sp = rootsSpec(`${intro}: ${pretty(`${lhs} = ${rhs}`)}.${root.d !== 1 ? ' Give an exact fraction.' : ''}`, [root], 'x', hint, steps)
  return { ...sp, holds: eqHolds(lhs, rhs) }
}

const LINEAR: Gen[] = [
  { lesson: 'linear-equations', level: 1, make: (r) => {
    let a = 0
    while (Math.abs(a) < 2) a = rnz(r, -9, 9)
    const x = rnz(r, -9, 9), b = rnz(r, -15, 15), c = a * x + b
    return linearSpec(lin(a, b), String(c), fr(x), 'Undo the addition or subtraction first, then divide by the number in front of x.', [
      `${b === 0 ? 'There is nothing to add or subtract.' : `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides`}: ${MN(`${a}x = ${c - b}`)}.`,
      `Divide both sides by ${MN(String(a))}: x = ${MN(String(x))}.`,
      `Check: ${MN(`${a}(${x}) ${sgnText(b)} = ${c}`)}.`,
    ])
  } },
  { lesson: 'linear-equations', level: 1, make: (r) => {
    const d = pick(r, [2, 3, 4, 5, 6, 8]), b = rnz(r, -9, 9), x0 = rnz(r, -6, 6), c = x0 + b
    const lhs = `x/${d} + (${b})`, rhs = String(c)
    return linearSpec(lhs, rhs, fr(d * x0), 'Get the fraction on its own, then multiply both sides by the denominator.', [
      `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${MN(`x/${d} = ${c - b}`)}.`,
      `Multiply both sides by ${d}: ${MN(`x = ${d * x0}`)}.`,
    ])
  } },
  { lesson: 'linear-equations', level: 1, make: (r) => {
    // variables on both sides, integer answer
    for (;;) {
      const a = ri(r, 2, 9), c = ri(r, 1, 8), x0 = rnz(r, -8, 8), b = rnz(r, -12, 12)
      if (a === c) continue
      const d = (a - c) * x0 + b
      const lhs = lin(a, b), rhs = lin(c, d)
      return linearSpec(lhs, rhs, fr(x0), 'Collect the x terms on one side and the plain numbers on the other.', [
        `Subtract ${tx(c)} from both sides: ${MN(`${tx(a - c)} ${sgnText(b)} = ${d}`)}.`,
        `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${MN(`${tx(a - c)} = ${d - b}`)}.`,
        ...(a - c === 1 ? [`So x = ${MN(String(x0))}.`] : divStep(a - c, MN(String(x0)))),
      ])
    }
  } },
  { lesson: 'linear-equations', level: 2, make: (r) => {
    const q = search(300, () => {
      const a = rnz(r, 2, 6), b = rnz(r, -6, 6), c = rnz(r, 1, 6), d = rnz(r, -6, 6), e = rnz(r, -12, 12)
      const lhs = `${a}(x + (${b})) - ${c}(x - (${d}))`, rhs = String(e)
      if (a === c) return null
      const root = unique(lhs, rhs)
      if (!root) return null
      const k = a - c, rhsN = e - a * b - c * d
      return linearSpec(lhs, rhs, root, 'Expand both brackets (watch the sign when you distribute a minus), collect like terms, then solve.', [
        `Expand: ${MN(`${a}x ${sgnText(a * b)} − ${tx(c)} ${sgnText(c * d)} = ${e}`)}.`,
        `Collect the x terms: ${MN(`${tx(k)} ${sgnText(a * b + c * d)} = ${e}`)}.`,
        `Move the number across: ${MN(`${tx(k)} = ${rhsN}`)}.`,
        ...(k === 1 ? [`So x = ${fmtFrac(root)}.`] : divStep(k, fmtFrac(root))),
      ])
    })
    return q ?? linearSpec('2(x + 1) - (x - 3)', '9', fr(4), 'Expand, collect, solve.', ['Expand: 2x + 2 − x + 3 = 9.', 'Collect: x + 5 = 9.', 'x = 4.'])
  } },
  { lesson: 'linear-equations', level: 2, make: (r) => {
    const q = search(400, () => {
      const b1 = pick(r, [2, 3, 4, 5]), b2 = pick(r, [2, 3, 4, 6]), a1 = rnz(r, -6, 6), a2 = rnz(r, -6, 6), e = rnz(r, -3, 5)
      if (b1 === b2) return null
      const lhs = `(x + (${a1}))/${b1} + (x - (${a2}))/${b2}`, rhs = String(e)
      const root = unique(lhs, rhs)
      if (!root) return null
      const L = (b1 * b2) / gcdI(b1, b2)
      return linearSpec(lhs, rhs, root, 'Multiply both sides by the LCD of the denominators to clear the fractions.', [
        `The LCD of ${b1} and ${b2} is ${L}. Multiply every term by ${L}.`,
        MN(`${L / b1 === 1 ? '' : L / b1}(x ${sgnText(a1)}) + ${L / b2 === 1 ? '' : L / b2}(x ${sgnText(-a2)}) = ${L * e}`),
        `Expand and collect: ${MN(`${L / b1 + L / b2}x ${sgnText((L / b1) * a1 - (L / b2) * a2)} = ${L * e}`)}.`,
        `Solve: x = ${fmtFrac(root)}.`,
      ])
    })
    return q ?? linearSpec('x/2 + x/3', '5', fr(6), 'Clear fractions with the LCD.', ['Multiply by 6: 3x + 2x = 30.', 'x = 6.'])
  } },
  { lesson: 'linear-equations', level: 3, make: (r) => {
    // solve for a letter in a formula (symbolic answer)
    const [p, q, s, t] = shuffleLetters(r, 4)
    const T = ri(r, 0, 4)
    const forms: [string, string, string, string[], string][] = [
      [`${p} = ${q}${s} + ${t}`, s, `(${p} - ${t})/${q}`, [`Subtract ${t} from both sides: ${p} − ${t} = ${q}${s}.`, `Divide both sides by ${q}: ${s} = (${p} − ${t})/${q}.`], 'Undo the addition first, then the multiplication.'],
      [`${p} = ${q} + ${s}${t}`, t, `(${p} - ${q})/${s}`, [`Subtract ${q} from both sides: ${p} − ${q} = ${s}${t}.`, `Divide both sides by ${s}: ${t} = (${p} − ${q})/${s}.`], 'Get the term with the letter alone first, then divide.'],
      [`${p}/${s} + ${q} = ${t}`, s, `${p}/(${t} - ${q})`, [`Subtract ${q} from both sides: ${p}/${s} = ${t} − ${q}.`, `The letter is in a denominator: swap ${s} and (${t} − ${q}), because if a/b = c then b = a/c.`, `${s} = ${p}/(${t} − ${q}).`], 'Get the fraction alone, then take the reciprocal of both sides.'],
      [`${p} = ${q}(1 + ${s}${t})`, s, `(${p} - ${q})/(${q}${t})`, [`Divide both sides by ${q}: ${p}/${q} = 1 + ${s}${t}.`, `Subtract 1: ${p}/${q} − 1 = ${s}${t}, which is (${p} − ${q})/${q}.`, `Divide by ${t}: ${s} = (${p} − ${q})/(${q}${t}).`], 'Divide by the number outside the bracket before you open it.'],
      [`${p} = ${q}/(${s} + ${t})`, s, `${q}/${p} - ${t}`, [`Swap: ${s} + ${t} = ${q}/${p}.`, `Subtract ${t}: ${s} = ${q}/${p} − ${t}.`], 'Take reciprocals first: a = b/c means c = b/a.'],
      [`${p}${s} + ${q} = ${t}${s} + ${p}`, s, `(${p} - ${q})/(${p} - ${t})`, [`Collect the ${s} terms on one side: ${p}${s} − ${t}${s} = ${p} − ${q}.`, `Factor out ${s}: ${s}(${p} − ${t}) = ${p} − ${q}.`, `Divide: ${s} = (${p} − ${q})/(${p} − ${t}).`], 'The letter appears twice: collect those terms, factor it out, then divide.'],
    ]
    const [eq, v, ans, steps, hint] = forms[T === 4 ? ri(r, 0, 5) : ri(r, 0, 5)]
    const [l, rr] = eq.split(' = ')
    const e = alg('equiv', `Solve for ${v}: ${eq}.`, `(${l}) - (${rr})`, ans, hint, steps, v)
    return { ...e, display: `${v} = ${pretty(ans)}` }
  } },
  { lesson: 'linear-equations', level: 3, make: (r) => {
    // fractions on both sides, possibly no solution
    const q = search(500, () => {
      const d1 = pick(r, [2, 3, 4, 5]), d2 = pick(r, [3, 4, 6, 8]), d3 = pick(r, [2, 3, 4, 6])
      const a = rnz(r, -4, 5), b = rnz(r, -5, 5), c = rnz(r, -3, 4), e = rnz(r, -3, 4)
      const lhs = `(${lead(a)}x - (${b}))/${d1} - (x + (${c}))/${d2}`, rhs = `(x - (${e}))/${d3} + 1`
      const root = unique(lhs, rhs)
      if (!root) return null
      const L = [d1, d2, d3].reduce((m, d) => (m / gcdI(m, d)) * d, 1)
      if (L > 36) return null
      return linearSpec(lhs, rhs, root, 'Multiply every term on both sides by the LCD of all the denominators, then expand carefully.', [
        `The LCD of ${d1}, ${d2} and ${d3} is ${L}. Multiply every term by ${L}, including the plain 1 on the right.`,
        `That gives whole-number coefficients: ${L / d1}(${MN(lin(a, -b))}) − ${L / d2}(${MN(lin(1, c))}) = ${L / d3}(${MN(lin(1, -e))}) + ${L}.`,
        `Expand, collect the x terms on one side and the numbers on the other.`,
        `Solve: x = ${fmtFrac(root)}.`,
      ])
    })
    return q ?? linearSpec('x/2 - x/3', '1', fr(6), 'Clear fractions.', ['Multiply by 6: 3x − 2x = 6.', 'x = 6.'])
  } },
]

const LETTERS = ['a', 'b', 'c', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w']
function shuffleLetters(r: Rng, n: number): string[] {
  const pool = [...LETTERS], out: string[] = []
  while (out.length < n) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
  return out
}

/* ------------------------------------------------------------------ 2. solving quadratics */

const VAR = (r: Rng) => pick(r, ['x', 'x', 'x', 'x', 't', 'n', 'y'])

function quadEq(lhs: string, rhs: string, v: string) {
  return (x: number) => Math.abs(evalExpr(lhs, { [v]: x }) - evalExpr(rhs, { [v]: x })) < 1e-7
}

const QUADRATICS: Gen[] = [
  { lesson: 'quadratic-solving', level: 1, make: (r) => {
    const v = VAR(r)
    const p = rnz(r, -9, 9), q = r() < 0.15 ? p : rnz(r, -9, 9)
    const b = -(p + q), c = p * q
    const eq = quad(1, b, c, v)
    const sp = exactSet(`Solve ${pretty(`${eq} = 0`)}. Give all solutions, separated by commas.`, [exF(fr(p)), exF(fr(q))], v,
      'Find two numbers that multiply to the constant term and add to the middle coefficient, then set each bracket to zero.', [
        `Look for two numbers with product ${MN(String(c))} and sum ${MN(String(b))}: they are ${MN(String(p))} and ${MN(String(q))}.`,
        `Factor: ${pretty(`(${lin(1, -p, v)})(${lin(1, -q, v)}) = 0`)}.`,
        `A product is zero only when a factor is zero: ${MN(`${v} = ${p}`)}${p === q ? ' (a repeated root)' : ` or ${v} = ${q}`}.`,
      ], undefined, quadEq(eq, '0', v))
    return sp
  } },
  { lesson: 'quadratic-solving', level: 1, make: (r) => {
    const v = VAR(r)
    const form = ri(r, 1, 4)
    if (form === 1) {
      const m = ri(r, 2, 12), k = m * m
      const eq = `${v}^2 = ${k}`
      return exactSet(`Solve ${pretty(eq)}. Give all solutions, separated by commas.`, [exF(fr(m)), exF(fr(-m))], v, 'Take the square root of both sides, and remember both signs.', [
        `If ${v}² = ${k} then ${v} is a number whose square is ${k}.`, `Both ${m} and ${MN(String(-m))} work, so ${v} = ±${m}.`], undefined, quadEq(`${v}^2`, String(k), v))
    }
    if (form === 2) {
      const m = ri(r, 2, 9), a = ri(r, 2, 5)
      const eq = `${a}${v}^2 = ${a * m * m}`
      return exactSet(`Solve ${pretty(eq)}. Give all solutions, separated by commas.`, [exF(fr(m)), exF(fr(-m))], v, 'Divide by the number in front first, then take the square root.', [
        `Divide both sides by ${a}: ${v}² = ${m * m}.`, `Take the square root of both sides: ${v} = ±${m}.`], undefined, quadEq(`${a}${v}^2`, String(a * m * m), v))
    }
    if (form === 3) {
      const b = rnz(r, -9, 9)
      const eq = `${v}^2 ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}${v} = 0`
      return exactSet(`Solve ${pretty(eq)}. Give all solutions, separated by commas.`, [exF(fr(0)), exF(fr(-b))], v, 'There is no constant term, so take out the common factor.', [
        `Take out the common factor ${v}: ${pretty(`${v}(${lin(1, b, v)}) = 0`)}.`, `Either ${v} = 0 or ${MN(`${v} ${sgnText(b)} = 0`)}, so ${v} = ${MN(String(-b))}.`], undefined, quadEq(`${v}^2 + (${b})${v}`, '0', v))
    }
    const h = rnz(r, -6, 6), m = ri(r, 1, 7)
    const eq = `(${lin(1, -h, v)})^2 = ${m * m}`
    return exactSet(`Solve ${pretty(eq)}. Give all solutions, separated by commas.`, [exF(fr(h + m)), exF(fr(h - m))], v, 'Take the square root of both sides (both signs), then solve the two linear equations.', [
      `Square root of both sides: ${pretty(lin(1, -h, v))} = ±${m}.`, `So ${MN(`${v} = ${h} + ${m} = ${h + m}`)} or ${MN(`${v} = ${h} − ${m} = ${h - m}`)}.`], undefined, quadEq(`(${lin(1, -h, v)})^2`, String(m * m), v))
  } },
  { lesson: 'quadratic-solving', level: 2, make: (r) => {
    // non-monic with rational roots
    const q = search(300, () => {
      const m = ri(r, 1, 4), n = ri(r, 1, 4), p = rnz(r, -6, 6), s = rnz(r, -6, 6)
      if (gcdI(m, Math.abs(p)) !== 1 || gcdI(n, Math.abs(s)) !== 1 || (m === 1 && n === 1)) return null
      const A = m * n, B = -(m * s + n * p), C = p * s
      const eq = quad(A, B, C)
      const rts = [fr(p, m), fr(s, n)]
      return exactSet(`Solve ${pretty(`${eq} = 0`)}. Give all solutions as exact fractions, separated by commas.`, rts.map(exF), 'x',
        'Factor with a leading coefficient: split the middle term using two numbers that multiply to a × c and add to b.', [
          `Multiply a × c: ${A} × ${MN(String(C))} = ${MN(String(A * C))}. Find two numbers with that product and sum ${MN(String(B))}: ${MN(String(-m * s))} and ${MN(String(-n * p))}.`,
          `Split the middle term and factor by grouping: ${pretty(`(${lin(m, -p)})(${lin(n, -s)}) = 0`)}.`,
          `Set each bracket to zero: x = ${fmtFrac(rts[0])} or x = ${fmtFrac(rts[1])}.`,
        ], undefined, quadEq(eq, '0', 'x'))
    })
    return q ?? exactSet('Solve 2x² + 5x − 3 = 0.', [exF(fr(1, 2)), exF(fr(-3))], 'x', 'Factor.', ['(2x − 1)(x + 3) = 0.', 'x = 1/2 or x = −3.'])
  } },
  { lesson: 'quadratic-solving', level: 2, make: (r) => {
    // not in standard form: (x+a)(x+b) = c, or x(x+a) = b
    for (;;) {
      const a = rnz(r, -6, 6), b = rnz(r, -6, 6), p = rnz(r, -6, 6)
      const q2 = -(a + b) - p
      if (q2 === p) continue
      const c = (p + a) * (p + b)
      const lhs = `(x + (${a}))(x + (${b}))`
      const eq = `${lhs} = ${c}`
      const A = 1, B = a + b, C = a * b - c
      const rr = roots2(A, B, C)
      if (rr.disc <= 0 || rr.r !== 1) continue
      return exactSet(`Solve ${pretty(eq)}. Give all solutions, separated by commas.`, rr.roots.map(exR), 'x',
        'Expand the brackets and move everything to one side before factoring. Setting each bracket equal to a number does not work.', [
          `Expand the left side: ${pretty(quad(1, a + b, a * b))} = ${c}.`,
          `Subtract ${MN(String(c))} from both sides so one side is zero: ${pretty(quad(A, B, C))} = 0.`,
          `Factor: ${pretty(`(x ${sgnText(-p)})(x ${sgnText(-q2)}) = 0`)}.`,
          `So x = ${MN(String(p))} or x = ${MN(String(q2))}.`,
        ], undefined, quadEq(lhs, String(c), 'x'))
    }
  } },
  { lesson: 'quadratic-solving', level: 3, make: (r) => {
    // complete the square, exact irrational roots
    const q = search(300, () => {
      const h = rnz(r, -6, 6), k = ri(r, 2, 14)
      if ([1, 4, 9].includes(k)) return null
      const a = pick(r, [1, 1, 1, 2, 3])
      const B = -2 * h * a, C = a * (h * h - k)
      const eq = quad(a, B, C)
      const rr = roots2(a, B, C)
      if (rr.disc <= 0 || rr.r === 1) return null
      const steps = [
        ...(a === 1 ? [] : [`Divide every term by ${a}: ${pretty(quad(1, B / a, C / a))} = 0.`]),
        `Move the constant: ${pretty(`x^2 ${B / a < 0 ? '-' : '+'} ${Math.abs(B / a)}x = ${-C / a}`)}.`,
        `Add (half the x coefficient)²: ${sq(B / a / 2)} = ${(B / a / 2) ** 2} to both sides: ${pretty(`x^2 ${B / a < 0 ? '-' : '+'} ${Math.abs(B / a)}x + ${(B / a / 2) ** 2} = ${-C / a + (B / a / 2) ** 2}`)}.`,
        `The left side is a perfect square: ${pretty(`(${lin(1, B / a / 2)})^2 = ${-C / a + (B / a / 2) ** 2}`)}.`,
        `Take square roots of both sides: ${pretty(lin(1, B / a / 2))} = ±√${k}.`,
        `So x = ${MN(String(h))} ± √${k}.`,
      ]
      return exactSet(`Solve ${pretty(`${eq} = 0`)} by completing the square. Give exact answers, separated by commas (you may use ±).`, rr.roots.map(exR), 'x',
        'Divide by the leading coefficient, move the constant across, add the square of half the middle coefficient to both sides.', steps, `x = ${fmtPlusMinus(a, B, C)}`, quadEq(eq, '0', 'x'))
    })
    return q ?? exactSet('Solve x² − 2x − 4 = 0.', [exR(roots2(1, -2, -4).roots[0]), exR(roots2(1, -2, -4).roots[1])], 'x', 'Complete the square.', ['(x − 1)² = 5.', 'x = 1 ± √5.'])
  } },
  { lesson: 'quadratic-solving', level: 3, make: (r) => {
    // higher powers: substitution u = x^2, or a cubic with three integer roots
    if (r() < 0.55) {
      const u1 = pick(r, [1, 4, 9, 16, 2, 3, 5, -1, -4]), u2 = pick(r, [1, 4, 9, 2, 3, 6, 0, -2])
      if (u1 === u2) return QUADRATICS[QUADRATICS.length - 1].make(r)
      const b = -(u1 + u2), c = u1 * u2
      const eq = fmtPoly(parsePoly(`(x^2 - (${u1}))(x^2 - (${u2}))`), true)
      const items: Ex[] = []
      for (const u of [u1, u2]) {
        if (u === 0) items.push(exF(fr(0)))
        else if (u > 0) { items.push(exSqrt(u)); items.push(exSqrt(u, true)) }
      }
      const steps = [
        `Let u = x². Then x⁴ = u², and the equation becomes ${pretty(quad(1, b, c, 'u'))} = 0.`,
        `Factor: (u ${sgnText(-u1)})(u ${sgnText(-u2)}) = 0, so u = ${MN(String(u1))} or u = ${MN(String(u2))}.`.replace(/\+ −/g, '− '),
        ...[u1, u2].map((u) => (u < 0 ? `x² = ${MN(String(u))} has no real solution, because a square cannot be negative.` : u === 0 ? 'x² = 0 gives x = 0.' : `x² = ${u} gives x = ±${exSqrt(u).disp.replace(MINUS, '')}.`)),
      ]
      return exactSet(`Solve ${pretty(`${eq} = 0`)} for real x. Give all real solutions, separated by commas (type "no solution" if there are none).`, items, 'x',
        'Substitute u = x² to get a quadratic in u. Then remember every positive u gives two values of x, and a negative u gives none.', steps, undefined, quadEq(eq, '0', 'x'))
    }
    const rts = [rnz(r, -4, 4), rnz(r, -4, 4), rnz(r, -4, 4)]
    if (new Set(rts).size < 3) return QUADRATICS[QUADRATICS.length - 1].make(r)
    const [p, q, s] = rts
    const c2 = -(p + q + s), c1 = p * q + p * s + q * s, c0 = -p * q * s
    const eq = fmtPoly(parsePoly(`(x - (${p}))(x - (${q}))(x - (${s}))`), true)
    return exactSet(`Solve ${pretty(`${eq} = 0`)}. Give all solutions, separated by commas.`, rts.map((t) => exF(fr(t))), 'x',
      'Try small whole numbers in the cubic (they must divide the constant term). When one works, divide it out and solve the quadratic that is left.', [
        `Try values that divide ${MN(String(c0))}: x = ${MN(String(p))} gives 0, so (x ${sgnText(-p)}) is a factor.`,
        `Divide it out: the quotient is the quadratic ${pretty(quad(1, c2 + p, c1 + p * (c2 + p)))}.`,
        `That factors as (x ${sgnText(-q)})(x ${sgnText(-s)}).`,
        `The solutions are x = ${[...rts].sort((m, n) => m - n).map((t) => MN(String(t))).join(', ')}.`,
      ], undefined, quadEq(eq, '0', 'x'))
  } },
]

/* ------------------------------------------------------------------ 3. quadratic formula */

const FORMULA_STEP = 'The quadratic formula: for ax² + bx + c = 0, x = (−b ± √(b² − 4ac)) / 2a.'

function formulaSpec(a: number, b: number, c: number, v = 'x'): Spec {
  const eq = quad(a, b, c, v)
  const rr = roots2(a, b, c)
  const D = rr.disc
  const steps = [
    FORMULA_STEP,
    `Here a = ${MN(String(a))}, b = ${MN(String(b))}, c = ${MN(String(c))}.`,
    `Discriminant: b² − 4ac = ${MN(`(${b})² − 4(${a})(${c}) = ${b * b} ${sgnText(-4 * a * c)} = ${D}`)}.`,
  ]
  let shown: string | undefined
  if (D < 0) steps.push('The discriminant is negative, and a negative number has no real square root, so there is no real solution.')
  else if (D === 0) steps.push(`The discriminant is 0, so there is one repeated solution: ${v} = ${MN(String(-b))}/${2 * a} = ${fmtFrac(fr(-b, 2 * a))}.`)
  else {
    steps.push(`Substitute: ${v} = (${MN(String(-b))} ± √${D}) / ${2 * a}.`)
    if (rr.r === 1) steps.push(`√${D} = ${rr.s}, so the solutions are ${rr.roots.map((x) => `${v} = ${fmtRoot(x)}`).join(' and ')}.`)
    else {
      steps.push(`Simplify the root: √${D} = ${rr.s === 1 ? '' : rr.s}√${rr.r}, then cancel any common factor with the denominator.`)
      shown = `${v} = ${fmtPlusMinus(a, b, c)}`
      steps.push(`${shown}.`)
    }
  }
  return exactSet(`Solve ${pretty(`${eq} = 0`)} using the quadratic formula. Give exact answers, separated by commas (you may use ±), or type "no solution".`, rr.roots.map(exR), v,
    'Identify a, b and c (with their signs), compute b² − 4ac first, then substitute.', steps, shown, quadEq(eq, '0', v))
}

const FORMULA: Gen[] = [
  { lesson: 'quadratic-formula', level: 1, make: (r) => {
    for (;;) {
      const a = pick(r, [1, 1, 1, 2]), b = rnz(r, -8, 8), c = rnz(r, -8, 8)
      const rr = roots2(a, b, c)
      if (rr.disc > 0 && rr.r > 1) return formulaSpec(a, b, c, VAR(r))
    }
  } },
  { lesson: 'quadratic-formula', level: 1, make: (r) => {
    const a = rnz(r, -4, 5), b = rnz(r, -9, 9), c = rnz(r, -9, 9)
    const eq = quad(a, b, c)
    const D = b * b - 4 * a * c
    return numSpec(`Find the discriminant b² − 4ac of ${pretty(eq)}.`, fr(D), 'Identify a, b, c with their signs, then compute b² − 4ac.', [
      `Here a = ${MN(String(a))}, b = ${MN(String(b))}, c = ${MN(String(c))}.`, `b² − 4ac = ${MN(`(${b})² − 4(${a})(${c}) = ${b * b} − (${4 * a * c}) = ${D}`)}.`])
  } },
  { lesson: 'quadratic-formula', level: 2, make: (r) => {
    // how many real solutions
    const a = rnz(r, -4, 5), b = rnz(r, -9, 9), c = rnz(r, -9, 9)
    const D = b * b - 4 * a * c
    const n = D > 0 ? 2 : D === 0 ? 1 : 0
    return numSpec(`How many real solutions does ${pretty(`${quad(a, b, c)} = 0`)} have? (Type 0, 1 or 2.)`, fr(n), 'The sign of the discriminant b² − 4ac decides: positive, zero or negative.', [
      `b² − 4ac = ${MN(`(${b})² − 4(${a})(${c}) = ${D}`)}.`, D > 0 ? 'It is positive, so there are 2 real solutions.' : D === 0 ? 'It is zero, so there is exactly 1 (repeated) real solution.' : 'It is negative, so there are no real solutions.'])
  } },
  { lesson: 'quadratic-formula', level: 2, make: (r) => {
    // vertex
    const a = rnz(r, -4, 4), b = rnz(r, -10, 10), c = rnz(r, -9, 9)
    const v = vertex(a, b, c)
    const eq = `y = ${quad(a, b, c)}`
    const sp = pairSpec(`Find the vertex of the parabola ${pretty(eq)}. Give it as (x, y).`, v.x, v.y, 'The vertex is at x = −b/(2a). Put that x back into the equation to get y.', [
      `The axis of symmetry is x = −b/(2a) = ${MN(`−(${b})/(2·${a})`)} = ${fmtFrac(v.x)}.`,
      `Substitute: y = ${MN(`${a === 1 ? '' : a === -1 ? '−' : a}(${fmtFrac(v.x)})² ${sgnText(b)}(${fmtFrac(v.x)}) ${sgnText(c)}`)} = ${fmtFrac(v.y)}.`,
      `The vertex is (${fmtFrac(v.x)}, ${fmtFrac(v.y)}), a ${a > 0 ? 'minimum' : 'maximum'} because the parabola opens ${a > 0 ? 'upwards' : 'downwards'}.`,
    ])
    return sp
  } },
  { lesson: 'quadratic-formula', level: 2, make: (r) => {
    // max / min value
    const a = rnz(r, -4, 4), b = rnz(r, -10, 10), c = rnz(r, -9, 9)
    const v = vertex(a, b, c)
    return numSpec(`What is the ${a > 0 ? 'minimum' : 'maximum'} value of ${pretty(quad(a, b, c))}?`, v.y, 'The extreme value is at the vertex, x = −b/(2a).', [
      `The parabola opens ${a > 0 ? 'upwards, so it has a minimum' : 'downwards, so it has a maximum'}, at x = −b/(2a) = ${fmtFrac(v.x)}.`,
      `Substitute x = ${fmtFrac(v.x)}: the value is ${fmtFrac(v.y)}.`])
  } },
  { lesson: 'quadratic-formula', level: 3, make: (r) => {
    // parameter: exactly one solution
    const form = ri(r, 1, 2)
    if (form === 1) {
      const m = ri(r, 1, 6)
      const eq = `x^2 + kx + ${m * m} = 0`
      return exactSet(`For which values of k does ${pretty(eq)} have exactly one solution? Give all values, separated by commas.`, [exF(fr(2 * m)), exF(fr(-2 * m))], 'k',
        'Exactly one solution means the discriminant b² − 4ac is zero.', [
          `Here a = 1, b = k, c = ${m * m}, so b² − 4ac = k² − ${4 * m * m}.`, `Set it to zero: k² = ${4 * m * m}, so k = ±${2 * m}.`])
    }
    const b = rnz(r, -8, 8), c = rnz(r, 1, 7)
    const k = fr(b * b, 4 * c)
    return exactSet(`Find the value of k for which ${pretty(`kx^2 ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x + ${c} = 0`)} has exactly one solution.`, [exF(k)], 'k',
      'Set the discriminant to zero and solve for k.', [`a = k, b = ${MN(String(b))}, c = ${c}, so b² − 4ac = ${b * b} − ${4 * c}k.`, `Set it to zero: ${4 * c}k = ${b * b}, so k = ${fmtFrac(k)}.`])
  } },
  { lesson: 'quadratic-formula', level: 3, make: (r) => {
    // sum and product of roots, symmetric expressions
    for (;;) {
      const a = ri(r, 1, 5), b = rnz(r, -9, 9), c = rnz(r, -9, 9)
      if (b * b - 4 * a * c <= 0) continue
      const S = fr(-b, a), P = fr(c, a)
      const eq = quad(a, b, c)
      if (r() < 0.5) {
        return pairSpec(`The roots of ${pretty(`${eq} = 0`)} are α and β. Find α + β and αβ. Give them as (sum, product).`, S, P, 'For ax² + bx + c = 0 the roots add to −b/a and multiply to c/a. You do not need to find the roots.', [
          `Sum of roots: −b/a = ${MN(`−(${b})/${a}`)} = ${fmtFrac(S)}.`, `Product of roots: c/a = ${MN(`${c}/${a}`)} = ${fmtFrac(P)}.`])
      }
      const sq = fSub(fMul(S, S), fMul(fr(2), P))
      return numSpec(`The roots of ${pretty(`${eq} = 0`)} are α and β. Find the exact value of α² + β².`, sq, 'Use α² + β² = (α + β)² − 2αβ, with the sum and product from the coefficients.', [
        `α + β = −b/a = ${fmtFrac(S)} and αβ = c/a = ${fmtFrac(P)}.`, `α² + β² = (α + β)² − 2αβ = ${MN(`(${fmtFrac(S)})² − 2(${fmtFrac(P)})`)} = ${fmtFrac(sq)}.`])
    }
  } },
]

/* ------------------------------------------------------------------ 4. inequalities */

type Op = '<' | '<=' | '>' | '>='
const OPTEXT: Record<Op, string> = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' }
const flip = (o: Op): Op => (o === '<' ? '>' : o === '>' ? '<' : o === '<=' ? '>=' : '<=')
const randOp = (r: Rng): Op => pick(r, ['<', '<=', '>', '>='] as Op[])

/** the region-by-region test lines used by every sign-chart explanation */
function regionSteps(f: (x: number) => number, crit: number[], label: (x: number) => string, v = 'x'): string[] {
  const pts = [...crit].sort((a, b) => a - b)
  const out: string[] = []
  const bounds = [-Infinity, ...pts, Infinity]
  for (let i = 0; i + 1 < bounds.length; i++) {
    const lo = bounds[i], hi = bounds[i + 1]
    const t = !isFinite(lo) && !isFinite(hi) ? 0 : !isFinite(lo) ? Math.floor(hi) - 1 : !isFinite(hi) ? Math.ceil(lo) + 1 : (lo + hi) / 2
    const val = f(t)
    const name = !isFinite(lo) ? `${v} < ${label(hi)}` : !isFinite(hi) ? `${v} > ${label(lo)}` : `${label(lo)} < ${v} < ${label(hi)}`
    out.push(`${MN(name)}: try ${v} = ${MN(ratText(t))}, the expression is ${val > 0 ? 'positive' : 'negative'}.`)
  }
  return out
}

function linearIneq(a: number, b: number, c: number, op: Op, v = 'x'): Spec {
  const lhs = lin(a, b, v)
  const boundary = fr(c - b, a)
  const o2: Op = a < 0 ? flip(op) : op
  const set: IntervalSet = o2.startsWith('<') ? [{ lo: -Infinity, hi: fNum(boundary), loIncl: false, hiIncl: o2.includes('=') }] : [{ lo: fNum(boundary), hi: Infinity, loIncl: o2.includes('='), hiIncl: false }]
  const steps = [
    `${b === 0 ? 'No constant to move.' : `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides`}: ${MN(`${a === 1 ? '' : a === -1 ? '-' : a}${v} ${OPTEXT[op]} ${c - b}`)}.`,
    a < 0 ? `Divide both sides by ${MN(String(a))}. Dividing by a negative number reverses the inequality sign: ${v} ${OPTEXT[o2]} ${MN(fmtFrac(boundary))}.` : a === 1 ? `${v} ${OPTEXT[o2]} ${fmtFrac(boundary)}.` : `Divide both sides by ${a} (positive, so the sign stays): ${v} ${OPTEXT[o2]} ${fmtFrac(boundary)}.`,
  ]
  const end = exF(boundary)
  return ineqSpec(`Solve the inequality ${pretty(`${lhs} ${OPTEXT[op]} ${c}`)}. Write the solution set.`, set, v, 'Solve it like an equation, but flip the sign whenever you multiply or divide by a negative number.', steps, [end],
    (x) => { const val = a * x + b; return op === '<' ? val < c - 1e-9 : op === '<=' ? val <= c + 1e-9 : op === '>' ? val > c + 1e-9 : val >= c - 1e-9 })
}

function quadIneq(a: number, b: number, c: number, op: Op, v = 'x'): Spec {
  const f = (x: number) => a * x * x + b * x + c
  const rr = roots2(a, b, c)
  const crit = rr.roots.map(rootValue)
  const set = signSet(f, crit, op)
  const ends = rr.roots.map(exR)
  const label = (x: number) => ends.find((e) => Math.abs(e.val - x) < 1e-9)?.disp ?? ratText(x)
  const steps = [
    `Find where the quadratic is zero: ${pretty(`${quad(a, b, c, v)} = 0`)}${rr.disc > 0 ? `, so ${v} = ${rr.r === 1 ? rr.roots.map((x) => fmtRoot(x)).join(' or ') : fmtPlusMinus(a, b, c)}` : rr.disc === 0 ? `, so ${v} = ${fmtRoot(rr.roots[0])} (a double root)` : ', which has no real roots (negative discriminant)'}.`,
    ...(crit.length ? [`These boundary points split the number line into regions. Test one number from each:`, ...regionSteps(f, crit, label, v)] : [`With no roots the parabola never crosses the x-axis, so it is ${f(0) > 0 ? 'always above' : 'always below'} it.`]),
    `The boundary values ${op.includes('=') ? 'are included, because the inequality has "or equal to"' : 'are not included, because the inequality is strict'}${crit.length === 1 && !op.includes('=') ? '' : ''}.`,
  ]
  return ineqSpec(`Solve the inequality ${pretty(`${quad(a, b, c, v)} ${OPTEXT[op]} 0`)}. Write the solution set.`, set, v,
    'Find the roots, mark them on a number line, and test a number in each region to see where the quadratic has the right sign.', steps, ends,
    (x) => { const val = f(x); return op === '<' ? val < -1e-9 : op === '<=' ? val <= 1e-9 : op === '>' ? val > 1e-9 : val >= -1e-9 })
}

const INEQ: Gen[] = [
  { lesson: 'inequalities', level: 1, make: (r) => {
    const a = pick(r, [-1, 1, 2, 3, 4, 5, -2, -3, -4, 6, -5]), b = rnz(r, -12, 12), c = rnz(r, -15, 15)
    return linearIneq(a, b, c, randOp(r), VAR(r))
  } },
  { lesson: 'inequalities', level: 1, make: (r) => {
    // compound  p < ax + b <= q
    for (;;) {
      const a = pick(r, [2, 3, 4, 5, -2, -3]), b = rnz(r, -8, 8), lo = rnz(r, -12, 6), hi = lo + ri(r, 4, 14)
      const o1 = pick(r, ['<', '<='] as Op[]), o2 = pick(r, ['<', '<='] as Op[])
      const x1 = (lo - b) / a, x2 = (hi - b) / a
      const L = Math.min(x1, x2), H = Math.max(x1, x2)
      // the sign of each end follows the side it lands on
      const loIncl = a > 0 ? o1 === '<=' : o2 === '<=', hiIncl = a > 0 ? o2 === '<=' : o1 === '<='
      const set: IntervalSet = [{ lo: L, hi: H, loIncl, hiIncl }]
      const ends = [fr(lo - b, a), fr(hi - b, a)].map(exF)
      const steps = [
        `Do the same thing to all three parts. ${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} each part: ${MN(`${lo - b} ${OPTEXT[o1]} ${a}x ${OPTEXT[o2]} ${hi - b}`)}.`,
        a < 0 ? `Divide all three parts by ${MN(String(a))}. This is negative, so both signs reverse: ${ratText(H)} ${OPTEXT[flip(o2)]} x ${OPTEXT[flip(o1)]} ${ratText(L)}. Written from smallest to largest: ${ratText(L)} ${loIncl ? '≤' : '<'} x ${hiIncl ? '≤' : '<'} ${ratText(H)}.` : `Divide all three parts by ${a} (positive, so the signs stay): ${ratText(L)} ${OPTEXT[o1]} x ${OPTEXT[o2]} ${ratText(H)}.`,
      ]
      return ineqSpec(`Solve the inequality ${pretty(`${lo} ${OPTEXT[o1]} ${lin(a, b)} ${OPTEXT[o2]} ${hi}`)}. Write the solution set.`, set, 'x',
        'Treat all three parts at once. Flip both signs if you divide by a negative number.', steps, ends,
        (x) => { const val = a * x + b; return (o1 === '<' ? lo < val - 1e-9 : lo <= val + 1e-9) && (o2 === '<' ? val < hi - 1e-9 : val <= hi + 1e-9) })
    }
  } },
  { lesson: 'inequalities', level: 2, make: (r) => {
    // unions: two linear conditions joined by "or", or "and" given as two inequalities
    for (;;) {
      const a1 = pick(r, [1, 2, 3, -1, -2]), a2 = pick(r, [1, 2, 3, -1, -2]), b1 = rnz(r, -6, 6), b2 = rnz(r, -6, 6), c1 = rnz(r, -8, 8), c2 = rnz(r, -8, 8)
      const o1: Op = pick(r, ['<', '<='] as Op[]), o2: Op = pick(r, ['>', '>='] as Op[])
      const mk = (a: number, b: number, c: number, op: Op) => {
        const bd = (c - b) / a, o: Op = a < 0 ? flip(op) : op
        return o.startsWith('<') ? [{ lo: -Infinity, hi: bd, loIncl: false, hiIncl: o.includes('=') }] : [{ lo: bd, hi: Infinity, loIncl: o.includes('='), hiIncl: false }]
      }
      const A1 = mk(a1, b1, c1, o1), A2 = mk(a2, b2, c2, o2)
      const useOr = r() < 0.6
      const set = useOr ? union(A1, A2) : intersect(A1, A2)
      if (!set.length || (set.length === 1 && !isFinite(set[0].lo) && !isFinite(set[0].hi))) continue
      // a union should have two separate pieces, and an overlap should be a genuinely smaller region than either part
      if (useOr ? set.length !== 2 : setsEqual(set, A1) || setsEqual(set, A2)) continue
      const e1 = exF(fr(c1 - b1, a1)), e2 = exF(fr(c2 - b2, a2))
      const steps = [
        `Solve each inequality separately (reverse the sign when you divide by a negative).`,
        `First: ${MN(`x ${OPTEXT[a1 < 0 ? flip(o1) : o1]} ${fmtFrac(fr(c1 - b1, a1))}`)}. Second: ${MN(`x ${OPTEXT[a2 < 0 ? flip(o2) : o2]} ${fmtFrac(fr(c2 - b2, a2))}`)}.`,
        useOr ? `"Or" means a number works if it satisfies either one, so take the union of the two regions.` : `"And" means a number must satisfy both, so take the overlap of the two regions.`,
      ]
      const hold = (a: number, b: number, c: number, op: Op) => (x: number) => { const v = a * x + b; return op === '<' ? v < c - 1e-9 : op === '<=' ? v <= c + 1e-9 : op === '>' ? v > c + 1e-9 : v >= c - 1e-9 }
      const h1 = hold(a1, b1, c1, o1), h2 = hold(a2, b2, c2, o2)
      return ineqSpec(`Solve ${pretty(`${lin(a1, b1)} ${OPTEXT[o1]} ${c1}`)} ${useOr ? 'or' : 'and'} ${pretty(`${lin(a2, b2)} ${OPTEXT[o2]} ${c2}`)}. Write the solution set.`, set, 'x',
        'Solve each part on its own, then combine: "or" is the union, "and" is the overlap.', steps, [e1, e2], (x) => (useOr ? h1(x) || h2(x) : h1(x) && h2(x)))
    }
  } },
  { lesson: 'inequalities', level: 2, make: (r) => {
    // fractions in a linear inequality
    for (;;) {
      const d1 = pick(r, [2, 3, 4, 5]), d2 = pick(r, [2, 3, 4, 6]), a = rnz(r, -3, 4), b = rnz(r, -6, 6), c = rnz(r, -6, 6), e = rnz(r, -4, 6)
      if (d1 === d2) continue
      const op = randOp(r)
      const lhs = `(${lead(a)}x + (${b}))/${d1} - (x - (${c}))/${d2}`
      const root = unique(lhs, String(e))
      if (!root) continue
      const L = (d1 * d2) / gcdI(d1, d2)
      const k = a * (L / d1) - L / d2
      if (k === 0) continue
      const o: Op = k < 0 ? flip(op) : op
      const set: IntervalSet = o.startsWith('<') ? [{ lo: -Infinity, hi: fNum(root), loIncl: false, hiIncl: o.includes('=') }] : [{ lo: fNum(root), hi: Infinity, loIncl: o.includes('='), hiIncl: false }]
      const steps = [
        `Multiply both sides by the LCD, ${L}. It is positive, so the sign does not change.`,
        `Expand and collect: ${MN(`${tx(k)} ${OPTEXT[op]} ${L * e - (L / d1) * b + (L / d2) * (-c)}`)}.`,
        k < 0 ? `Divide by ${MN(String(k))}: this is negative, so reverse the sign. x ${OPTEXT[o]} ${fmtFrac(root)}.` : `Divide by ${k}: x ${OPTEXT[o]} ${fmtFrac(root)}.`,
      ]
      return ineqSpec(`Solve the inequality ${pretty(`${lhs} ${OPTEXT[op]} ${e}`)}. Write the solution set.`, set, 'x', 'Clear the fractions with the LCD (a positive number, so the sign stays), then solve as usual.', steps, [exF(root)],
        (x) => { const v = evalExpr(lhs, { x }); return op === '<' ? v < e - 1e-9 : op === '<=' ? v <= e + 1e-9 : op === '>' ? v > e + 1e-9 : v >= e - 1e-9 })
    }
  } },
  { lesson: 'inequalities', level: 3, make: (r) => {
    // quadratic inequality, rational or irrational boundaries, possibly no roots
    const kind = ri(r, 1, 5)
    if (kind === 1) {
      const p = rnz(r, -6, 6), q = rnz(r, -6, 6)
      if (p === q) return quadIneq(1, -3, -4, '>')
      return quadIneq(1, -(p + q), p * q, randOp(r))
    }
    if (kind === 2) {
      const m = ri(r, 1, 3), n = ri(r, 1, 3), p = rnz(r, -5, 5), s = rnz(r, -5, 5)
      if (gcdI(m, Math.abs(p)) !== 1 || gcdI(n, Math.abs(s)) !== 1 || p / m === s / n) return quadIneq(2, 1, -3, '<=')
      const sign = pick(r, [1, -1])
      return quadIneq(sign * m * n, -sign * (m * s + n * p), sign * p * s, randOp(r))
    }
    if (kind === 3) {
      for (;;) {
        const a = pick(r, [1, 1, 2, -1]), b = rnz(r, -6, 6), c = rnz(r, -6, 6)
        const rr = roots2(a, b, c)
        if (rr.disc > 0 && rr.r > 1) return quadIneq(a, b, c, randOp(r))
      }
    }
    if (kind === 4) {
      for (;;) {
        const a = rnz(r, -3, 3), b = rnz(r, -6, 6), c = rnz(r, -6, 6)
        if (b * b - 4 * a * c < 0) return quadIneq(a, b, c, randOp(r))
      }
    }
    // double root: x^2 - 2px + p^2 op 0
    const p = rnz(r, -6, 6)
    return quadIneq(1, -2 * p, p * p, randOp(r))
  } },
  { lesson: 'inequalities', level: 3, make: (r) => {
    // rational or cubic inequality: the sign chart with excluded points
    const kind = ri(r, 1, 3)
    const op = randOp(r)
    const pts = new Set<number>()
    while (pts.size < 3) pts.add(rnz(r, -6, 6))
    const [p, q, s] = [...pts].sort((a, b) => a - b)
    let f: (x: number) => number, text: string, crit: number[]
    if (kind === 1) { f = (x) => (x - p) / (x - q); text = `(x - (${p}))/(x - (${q}))`; crit = [p, q] }
    else if (kind === 2) { f = (x) => ((x - p) * (x - q)) / (x - s); text = `(x - (${p}))(x - (${q}))/(x - (${s}))`; crit = [p, q, s] }
    else { f = (x) => (x - p) * (x - q) * (x - s); text = `(x - (${p}))(x - (${q}))(x - (${s}))`; crit = [p, q, s] }
    const set = signSet(f, crit, op)
    const lab = (x: number) => MN(String(x))
    const excluded = kind === 3 ? [] : [kind === 1 ? q : s]
    const steps = [
      `Find the critical values: where the top is zero (${kind === 1 ? lab(p) : kind === 2 ? `${lab(p)} and ${lab(q)}` : `${lab(p)}, ${lab(q)} and ${lab(s)}`}) ${excluded.length ? `and where the bottom is zero (${lab(excluded[0])}, which is never allowed)` : ''}.`.replace('  ', ' '),
      'Test a number in each region to find the sign of the whole expression:',
      ...regionSteps(f, crit, lab),
      `Include a boundary only if the inequality has "or equal to" AND the expression is actually defined there.${excluded.length ? ` ${lab(excluded[0])} is never included.` : ''}`,
    ]
    return ineqSpec(`Solve the inequality ${pretty(`${text} ${OPTEXT[op]} 0`)}. Write the solution set.`, set, 'x',
      'Mark every value that makes the top or the bottom zero, test each region for its sign, and never include a value that makes a denominator zero.', steps, crit.map((c) => exF(fr(c))),
      (x) => { const v = f(x); return Number.isFinite(v) && (op === '<' ? v < -1e-9 : op === '<=' ? v <= 1e-9 : op === '>' ? v > 1e-9 : v >= -1e-9) })
  } },
]

/* ------------------------------------------------------------------ 5. absolute value */

const ABS = (e: string) => `|${e}|`
const absHolds = (a: number, b: number, rel: Op, c: number) => (x: number) => {
  const v = Math.abs(a * x + b)
  return rel === '<' ? v < c - 1e-9 : rel === '<=' ? v <= c + 1e-9 : rel === '>' ? v > c + 1e-9 : v >= c - 1e-9
}

const ABSVAL: Gen[] = [
  { lesson: 'absolute-value', level: 1, make: (r) => {
    const h = rnz(r, -9, 9), c = ri(r, 1, 9)
    const none = r() < 0.2
    const rhs = none ? -c : c
    const ans = none ? [] : [exF(fr(h + c)), exF(fr(h - c))]
    const steps = none
      ? [`An absolute value is a distance, so it is never negative.`, `${ABS(MN(lin(1, -h)))} = ${MN(String(rhs))} is impossible: there is no solution.`]
      : [`${ABS(MN(lin(1, -h)))} = ${c} means the distance from x to ${MN(String(h))} is ${c}.`, `So x ${MN(sgnText(-h))} = ${c} or x ${MN(sgnText(-h))} = ${MN(String(-c))}.`, `x = ${MN(String(h + c))} or x = ${MN(String(h - c))}.`]
    return exactSet(`Solve ${ABS(MN(pretty(lin(1, -h))))} = ${MN(String(rhs))}. Give all solutions, separated by commas (or type "no solution").`, ans, 'x',
      'The expression inside is either equal to the number or equal to its negative.', steps, undefined,
      (x) => Math.abs(Math.abs(x - h) - rhs) < 1e-9)
  } },
  { lesson: 'absolute-value', level: 1, make: (r) => {
    // inequality |x - h| < c  or  > c, in distance language
    const h = rnz(r, -9, 9), c = ri(r, 1, 9), op = randOp(r)
    const less = op.startsWith('<')
    const set: IntervalSet = less ? [{ lo: h - c, hi: h + c, loIncl: op === '<=', hiIncl: op === '<=' }] : [{ lo: -Infinity, hi: h - c, loIncl: false, hiIncl: op === '>=' }, { lo: h + c, hi: Infinity, loIncl: op === '>=', hiIncl: false }]
    const steps = [`${ABS(MN(lin(1, -h)))} is the distance from x to ${MN(String(h))}.`, less ? `Distance ${OPTEXT[op]} ${c} means x is within ${c} of ${MN(String(h))}: ${MN(`${h - c} ${OPTEXT[op]} x ${OPTEXT[op]} ${h + c}`)}.` : `Distance ${OPTEXT[op]} ${c} means x is at least that far from ${MN(String(h))}, on either side: x ${OPTEXT[flip(op)]} ${MN(String(h - c))} or x ${OPTEXT[op]} ${MN(String(h + c))}.`]
    return ineqSpec(`Solve the inequality ${ABS(MN(pretty(lin(1, -h))))} ${OPTEXT[op]} ${c}. Write the solution set.`, set, 'x', 'Think of it as a distance. "Less than" stays between two values; "greater than" goes outside them.', steps,
      [exF(fr(h - c)), exF(fr(h + c))], absHolds(1, -h, op, c))
  } },
  { lesson: 'absolute-value', level: 2, make: (r) => {
    // |ax + b| = c
    for (;;) {
      const a = pick(r, [2, 3, 4, 5, -2, -3]), b = rnz(r, -9, 9), c = ri(r, 1, 12)
      const x1 = fr(c - b, a), x2 = fr(-c - b, a)
      return exactSet(`Solve ${ABS(MN(pretty(lin(a, b))))} = ${c}. Give all solutions, separated by commas.`, [exF(x1), exF(x2)], 'x', 'Split into two equations: the inside equals c, or the inside equals −c.', [
        `Two cases. Case 1: ${MN(lin(a, b))} = ${c}, so x = ${fmtFrac(x1)}.`, `Case 2: ${MN(lin(a, b))} = ${MN(String(-c))}, so x = ${fmtFrac(x2)}.`], undefined, (x) => Math.abs(Math.abs(a * x + b) - c) < 1e-9)
    }
  } },
  { lesson: 'absolute-value', level: 2, make: (r) => {
    // |ax + b| op c
    for (;;) {
      const a = pick(r, [2, 3, 4, -2, -3, 5]), b = rnz(r, -9, 9), c = ri(r, 1, 12), op = randOp(r)
      const x1 = (c - b) / a, x2 = (-c - b) / a, lo = Math.min(x1, x2), hi = Math.max(x1, x2)
      const less = op.startsWith('<')
      const incl = op.includes('=')
      const set: IntervalSet = less ? [{ lo, hi, loIncl: incl, hiIncl: incl }] : [{ lo: -Infinity, hi: lo, loIncl: false, hiIncl: incl }, { lo: hi, hi: Infinity, loIncl: incl, hiIncl: false }]
      const steps = less
        ? [`"Less than" becomes a double inequality: ${MN(`${-c} ${OPTEXT[op]} ${lin(a, b)} ${OPTEXT[op]} ${c}`)}.`, `Subtract ${MN(String(b))} from every part: ${MN(`${-c - b} ${OPTEXT[op]} ${a}x ${OPTEXT[op]} ${c - b}`)}.`, `Divide by ${MN(String(a))}${a < 0 ? ' (negative: the order of the ends swaps)' : ''}: ${MN(`${ratText(lo)} ${OPTEXT[op]} x ${OPTEXT[op]} ${ratText(hi)}`)}.`]
        : [`"Greater than" splits into two separate inequalities: ${MN(`${lin(a, b)} ${OPTEXT[op]} ${c}`)} or ${MN(`${lin(a, b)} ${OPTEXT[flip(op)]} ${-c}`)}.`, `Solve each one (reverse the sign when dividing by a negative). The boundaries are x = ${ratText(lo)} and x = ${ratText(hi)}.`, `The solution lies outside: x ${OPTEXT[flip(op)]} ${ratText(lo)} or x ${OPTEXT[op]} ${ratText(hi)}.`]
      return ineqSpec(`Solve the inequality ${ABS(MN(pretty(lin(a, b))))} ${OPTEXT[op]} ${c}. Write the solution set.`, set, 'x', '"|A| < c" means −c < A < c. "|A| > c" means A < −c or A > c.', steps, [exF(fr(c - b, a)), exF(fr(-c - b, a))], absHolds(a, b, op, c))
    }
  } },
  { lesson: 'absolute-value', level: 3, make: (r) => {
    // |ax + b| = cx + d : solve both cases and discard the false ones
    const q = search(500, () => {
      const a = pick(r, [1, 2, 3, -1, -2]), b = rnz(r, -8, 8), c = pick(r, [1, 2, -1, -2, 3]), d = rnz(r, -8, 8)
      if (a === c || a === -c) return null
      const cands = [fr(d - b, a - c), fr(-d - b, a + c)]
      const valid = cands.filter((x) => fNum(x) * c + d >= -1e-12)
      const uniqueValid = valid.filter((v, i) => valid.findIndex((w) => fEq(w, v)) === i)
      const invalid = cands.filter((x) => !valid.some((w) => fEq(w, x)))
      if (!invalid.length && r() < 0.6) return null
      const steps = [
        `The right side must not be negative, because an absolute value is never negative: need ${MN(lin(c, d))} ≥ 0.`,
        `Case 1 (inside positive): ${MN(`${lin(a, b)} = ${lin(c, d)}`)}, so x = ${fmtFrac(cands[0])}.`,
        `Case 2 (inside negative): ${MN(`${lin(a, b)} = −(${lin(c, d)})`)}, so x = ${fmtFrac(cands[1])}.`,
        invalid.length ? `Check each in the original equation: x = ${invalid.map(fmtFrac).join(', ')} makes the right side negative, so it is extraneous and is rejected.` : 'Check each in the original equation: both work.',
      ]
      return exactSet(`Solve ${ABS(MN(pretty(lin(a, b))))} = ${MN(pretty(lin(c, d)))}. Check your answers. Give all solutions, separated by commas (or type "no solution").`, uniqueValid.map(exF), 'x', 'Solve both cases, then substitute each answer back: the right side must come out non-negative.', steps, undefined,
        (x) => Math.abs(Math.abs(a * x + b) - (c * x + d)) < 1e-9)
    })
    return q ?? exactSet('Solve |x| = x − 2.', [], 'x', 'Check cases.', ['x = x − 2 is impossible.', 'x = −(x − 2) gives x = 1, but then x − 2 < 0.'])
  } },
  { lesson: 'absolute-value', level: 3, make: (r) => {
    // |x - p| = |x - q|  (the midpoint), or  |x - p| + something: the sum of distances
    if (r() < 0.5) {
      const p = rnz(r, -8, 8), q = rnz(r, -8, 8)
      if (p === q) return ABSVAL[ABSVAL.length - 1].make(r)
      const mid = fr(p + q, 2)
      return exactSet(`Solve ${ABS(MN(pretty(lin(1, -p))))} = ${ABS(MN(pretty(lin(1, -q))))}.`, [exF(mid)], 'x', 'The point equally far from p and q is the midpoint. Or square both sides.', [
        `The equation says x is the same distance from ${MN(String(p))} and ${MN(String(q))}.`, `That point is the midpoint: (${MN(`${p} ${sgnText(q)}`)})/2 = ${fmtFrac(mid)}.`], undefined, (x) => Math.abs(Math.abs(x - p) - Math.abs(x - q)) < 1e-9)
    }
    const p = rnz(r, -6, 6), gap = ri(r, 2, 8), q = p + gap, d = ri(r, 1, 5), k = gap + 2 * d
    return exactSet(`Solve ${ABS(MN(pretty(lin(1, -p))))} + ${ABS(MN(pretty(lin(1, -q))))} = ${k}.`, [exF(fr(p - d)), exF(fr(q + d))], 'x',
      'This is a sum of two distances. Between p and q the sum is always the gap q − p; outside, it grows by 2 for every step.', [
        `The distance from p = ${MN(String(p))} to q = ${MN(String(q))} is ${gap}, so for x between them the sum is exactly ${gap}, which is less than ${k}. No solutions there.`,
        `Outside, the sum is ${gap} + 2 × (distance beyond the nearer end). Set ${gap} + 2d = ${k}, so d = ${d}.`,
        `Going ${d} beyond each end gives x = ${MN(String(p - d))} and x = ${MN(String(q + d))}.`,
      ], undefined, (x) => Math.abs(Math.abs(x - p) + Math.abs(x - q) - k) < 1e-9)
  } },
]

/* ------------------------------------------------------------------ 6. systems */

function sysText(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) {
  const eq = (a: number, b: number, c: number) => `${MN(pretty(`${lead(a)}x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y`))} = ${MN(String(c))}`
  return `${eq(a1, b1, c1)} and ${eq(a2, b2, c2)}`
}

const eqText = (a: number, b: number, c: number) => MN(`${a === 0 ? '' : tx(a)}${b === 0 ? '' : a === 0 ? tx(b, 'y') : ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y`} = ${c}`)

function systemSpec(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number, hint: string): Spec | null {
  const sol = solveSystem({ a1, b1, c1, a2, b2, c2 })
  if (!sol) return null
  const B = a2 * b1 - a1 * b2, C = a2 * c1 - a1 * c2
  const steps = [
    `Label the equations (1) and (2). To eliminate x, make its coefficient the same in both: multiply (1) by ${MN(String(a2))} and (2) by ${MN(String(a1))}.`,
    `That gives ${eqText(a1 * a2, a2 * b1, a2 * c1)} and ${eqText(a1 * a2, a1 * b2, a1 * c2)}.`,
    `Subtract the second from the first. The x terms cancel: ${MN(`${tx(B, 'y')} = ${C}`)}.`,
    `So y = ${fmtFrac(sol.y)}.`,
    `Substitute into (1): ${MN(`${tx(a1)} ${sgnText(b1)}(${fmtFrac(sol.y)}) = ${c1}`)}, which gives x = ${fmtFrac(sol.x)}.`,
    `Check in (2): ${MN(`${a2}(${fmtFrac(sol.x)}) ${sgnText(b2)}(${fmtFrac(sol.y)}) = ${c2}`)}. It works.`,
  ]
  return pairSpec(`Solve the system ${sysText(a1, b1, c1, a2, b2, c2)}. Give the answer as (x, y).`, sol.x, sol.y, hint, steps)
}

const SYSTEMS: Gen[] = [
  { lesson: 'systems', level: 1, make: (r) => {
    for (;;) {
      const x = rnz(r, -6, 6), y = rnz(r, -6, 6), a1 = ri(r, 1, 4), b1 = rnz(r, -4, 4), a2 = rnz(r, -4, 4), b2 = rnz(r, -4, 4)
      if (a1 * b2 - a2 * b1 === 0 || !a2) continue
      const s = systemSpec(a1, b1, a1 * x + b1 * y, a2, b2, a2 * x + b2 * y, 'Make the coefficients of one letter match, then add or subtract the equations to eliminate it.')
      if (s) return s
    }
  } },
  { lesson: 'systems', level: 1, make: (r) => {
    // substitution: one equation already solved for y
    for (;;) {
      const x = rnz(r, -6, 6), m = rnz(r, -4, 4), c = rnz(r, -8, 8), a = ri(r, 1, 4), b = rnz(r, 1, 4)
      const y = m * x + c
      const C = a * x + b * y
      const lhs2 = `${lead(a)}x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${C}`
      if (!m) continue
      return pairSpec(`Solve the system y = ${MN(pretty(lin(m, c).replace(/^(-?\d*)x/, '$1x')))} and ${MN(pretty(lhs2))}. Give the answer as (x, y).`, fr(x), fr(y), 'The first equation already says what y is. Substitute that expression for y into the second equation.', [
        `Substitute y = ${MN(lin(m, c))} into the second equation: ${MN(`${tx(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}(${lin(m, c)}) = ${C}`)}.`,
        `Expand and collect: ${MN(`${tx(a + b * m)} ${sgnText(b * c)} = ${C}`)}, so x = ${MN(String(x))}.`,
        `Then y = ${MN(`${m}(${x}) ${sgnText(c)} = ${y}`)}.`,
      ])
    }
  } },
  { lesson: 'systems', level: 2, make: (r) => {
    // fractional solutions
    for (;;) {
      const a1 = rnz(r, -5, 5), b1 = rnz(r, -5, 5), c1 = rnz(r, -9, 9), a2 = rnz(r, -5, 5), b2 = rnz(r, -5, 5), c2 = rnz(r, -9, 9)
      if (!a1 || !a2 || a1 * b2 - a2 * b1 === 0) continue
      const sol = solveSystem({ a1, b1, c1, a2, b2, c2 })!
      if (sol.x.d === 1 && sol.y.d === 1) continue
      if (sol.x.d > 20 || sol.y.d > 20) continue
      const s = systemSpec(a1, b1, c1, a2, b2, c2, 'Eliminate one letter by scaling the equations, then solve. The answers may be fractions.')
      if (s) return s
    }
  } },
  { lesson: 'systems', level: 2, make: (r) => {
    // word problem: two kinds of thing, a count and a total
    const theme = ri(r, 1, 3)
    for (;;) {
      const x = ri(r, 2, 14), y = ri(r, 2, 14)
      const pa = theme === 3 ? pick(r, [10, 20, 25, 50]) : ri(r, 3, 15)
      const pb = theme === 3 ? pick(r, [1, 2, 5]) : ri(r, 1, 12)
      if (pa <= pb || x === y) continue
      const total = x + y, cost = pa * x + pb * y
      const [nameA, nameB, prompt] = theme === 1
        ? ['adult tickets', 'child tickets', `A theatre sold ${total} tickets. Adult tickets cost ${pa} dollars and child tickets cost ${pb} dollars, and the takings were ${cost} dollars. How many adult and how many child tickets were sold? Give the answer as (adult, child).`]
        : theme === 2
          ? [`${pa} kg crates`, `${pb} kg crates`, `A van carries ${total} crates. Some weigh ${pa} kg each and the rest weigh ${pb} kg each, ${cost} kg altogether. How many of each? Give the answer as (number of ${pa} kg crates, number of ${pb} kg crates).`]
          : [`${pa}-cent coins`, `${pb}-cent coins`, `A jar holds ${total} coins, all of them ${pa}-cent coins or ${pb}-cent coins, worth ${cost} cents altogether. How many of each? Give the answer as (number of ${pa}-cent coins, number of ${pb}-cent coins).`]
      return pairSpec(prompt, fr(x), fr(y), 'Let x and y be the two quantities. One equation counts the items, the other adds up the money or the weight.', [
        `Let x = the number of ${nameA} and y = the number of ${nameB}. Then x + y = ${total} and ${pa}x + ${pb}y = ${cost}.`,
        `From the first, y = ${total} − x. Substitute: ${pa}x + ${pb}(${total} − x) = ${cost}.`,
        `Expand: ${tx(pa - pb)} + ${pb * total} = ${cost}, so ${tx(pa - pb)} = ${cost - pb * total}.`,
        `That gives x = ${x}, and y = ${total} − ${x} = ${y}.`,
        `Check: ${pa} × ${x} + ${pb} × ${y} = ${cost}.`,
      ])
    }
  } },
  { lesson: 'systems', level: 3, make: (r) => {
    // 3 x 3 with integer solution
    for (;;) {
      const sol = [rnz(r, -4, 4), rnz(r, -4, 4), rnz(r, -4, 4)]
      const rows: number[][] = [0, 1, 2].map(() => { const c = [rnz(r, -3, 3), rnz(r, -3, 3), rnz(r, -3, 3)]; return [...c, c[0] * sol[0] + c[1] * sol[1] + c[2] * sol[2]] })
      const res = solveSystem3(rows)
      if (!res || res.x.d !== 1 || res.y.d !== 1 || res.z.d !== 1) continue
      const fmtRow = (row: number[]) => MN(pretty(`${lead(row[0])}x ${row[1] < 0 ? '-' : '+'} ${Math.abs(row[1]) === 1 ? '' : Math.abs(row[1])}y ${row[2] < 0 ? '-' : '+'} ${Math.abs(row[2]) === 1 ? '' : Math.abs(row[2])}z = ${row[3]}`))
      return {
        prompt: `Solve the system ${fmtRow(rows[0])}, ${fmtRow(rows[1])}, ${fmtRow(rows[2])}. Give the answer as (x, y, z).`, kind: 'pair', answers: sol, display: `(${sol.map((v) => MN(String(v))).join(', ')})`,
        input: `(${sol.join(', ')})`, unit: '', needsExact: false, tol: 1e-9,
        hint: 'Eliminate the same letter from two different pairs of equations. That leaves two equations in two letters.', explanation: [
          'Pick a letter and eliminate it from equations (1) and (2), then from (1) and (3). This gives two equations in the other two letters.',
          'Solve that 2 × 2 system for those two letters.',
          `Substitute back to find the third. The solution is x = ${MN(String(sol[0]))}, y = ${MN(String(sol[1]))}, z = ${MN(String(sol[2]))}.`,
          'Check it in all three original equations.'],
        pad: { pi: false, root: false, comma: true, alg: true },
      }
    }
  } },
  { lesson: 'systems', level: 3, make: (r) => {
    // line meets parabola: x-coordinates of the intersections
    for (;;) {
      const p = rnz(r, -5, 5), q = rnz(r, -5, 5)
      if (p === q) continue
      const a = pick(r, [1, 1, 2, -1]), m = rnz(r, -4, 4), c = rnz(r, -6, 6)
      // choose the parabola so that it meets y = mx + c at x = p and x = q:  a(x-p)(x-q) + mx + c
      const b = -a * (p + q) + m, k = a * p * q + c
      const eqP = `y = ${quad(a, b, k)}`, eqL = `y = ${lin(m, c)}`
      const rr = roots2(a, b - m, k - c)
      return exactSet(`Find the x-coordinates of the points where the parabola ${pretty(eqP)} meets the line ${pretty(eqL)}. Give them separated by commas.`, rr.roots.map(exR), 'x',
        'Where the graphs meet the two y-values are equal, so set the two right-hand sides equal and solve the resulting quadratic.', [
          `Set the two expressions for y equal: ${pretty(`${quad(a, b, k)} = ${lin(m, c)}`)}.`,
          `Move everything to one side: ${pretty(`${quad(a, b - m, k - c)} = 0`)}.`,
          `Factor or use the formula: x = ${MN(String(p))} or x = ${MN(String(q))}.`,
        ], undefined, (x) => Math.abs(a * x * x + b * x + k - (m * x + c)) < 1e-9)
    }
  } },
]

export const EQ_GENS: Gen[] = [...LINEAR, ...QUADRATICS, ...FORMULA, ...INEQ, ...ABSVAL, ...SYSTEMS]
