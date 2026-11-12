/**
 * Question generators for Unit 4: exponents, radicals and logarithms.
 *
 * As in the other units, every question is built from its answer, then checked independently: the tests plug the answers
 * back into the equation as written (`holds`), and radical answers must also be in simplest form.
 */
import {
  fmtFrac, fmtPoly, Frac, parsePoly, Rat, fNum, fr, fracStr, parseRat, sup, gcdI, fDiv, fSub,
} from './algebra'
import { alg, numSpec, ri, rnz } from './algebraQuestions'
import { exactSet, exF, MN, search, sgnText, tx } from './equationQuestions'
import { MINUS } from './exact'
import type { Gen, Spec } from './questions'
import { extractRoot, isKFree, root, rootMul } from './radicals'
import { pick } from './rng'
import { fmtRoot, rootInput, rootValue } from './solve'

/* ------------------------------------------------------------------ text helpers */

const SUB = '₀₁₂₃₄₅₆₇₈₉'
const sub = (n: number) => String(n).split('').map((d) => SUB[Number(d)]).join('')
export const supInt = (n: number) => `${n < 0 ? '⁻' : ''}${sup(Math.abs(n))}`
/** ASCII with ^ and * -> typeset: x^3*y^(-2) becomes x³·y⁻² */
const fancy = (s: string) => s
  .replace(/\^\(-(\d+)\)/g, (_, d: string) => `⁻${sup(Number(d))}`)
  .replace(/\^\((\d+)\)/g, (_, d: string) => sup(Number(d)))
  .replace(/\^(\d+)/g, (_, d: string) => sup(Number(d)))
  .replace(/\*/g, '·')
  .replace(/-/g, MINUS)
const logT = (b: number | 'e', arg: string) => (b === 'e' ? `ln ${arg}` : `log${sub(b)} ${arg}`)
const paren = (n: string | number) => (/^[\d.]+$/.test(String(n)) ? String(n) : `(${n})`)
export const fm = (f: Frac) => fmtFrac(f)

/** a rational answer to a numeric question */
const valueFrac = (prompt: string, f: Frac, hint: string, expl: string[]): Spec => numSpec(prompt, f, hint, expl)

/** an exact answer a + b√r that must be in simplest radical form */
export function radicalSpec(prompt: string, x: ReturnType<typeof root>, hint: string, expl: string[], rejects: string[] = []): Spec {
  return {
    prompt, kind: 'value', answers: [rootValue(x)], display: fmtRoot(x), input: rootInput(x), unit: '', needsExact: x.b.n !== 0 || x.a.d !== 1,
    tol: 1e-9, hint, explanation: expl, pad: { pi: false, root: true, comma: false, alg: true }, simplest: true, rejects,
  }
}

/** a decimal answer of an exponential or logarithmic equation */
export function approxSpec(prompt: string, value: number, places: number, hint: string, expl: string[], holds?: (x: number) => boolean, label = 'x'): Spec {
  const shown = value.toFixed(places)
  return {
    prompt: `${prompt} Give your answer to ${places} decimal place${places === 1 ? '' : 's'}.`, kind: 'approx', answers: [value], display: `${label} ≈ ${shown.replace('-', MINUS)}`, input: shown, unit: '',
    needsExact: false, tol: 0.5 * Math.pow(10, -places) + 1e-9, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: true, extra: ['ln(', 'log('] }, holds,
  }
}

const approxHolds = (f: (x: number) => number, scale = 1) => (x: number) => Math.abs(f(x)) <= 1e-7 * Math.max(1, scale)

/* ------------------------------------------------------------------ 1. exponent laws */

/** monomial a x^p y^q as ASCII with brackets around negative exponents */
const mono = (c: number, e: [string, number][]) => `${c === 1 && e.length ? '' : c === -1 && e.length ? '-' : c}${e.filter(([, k]) => k !== 0).map(([v, k]) => (k === 1 ? v : k < 0 ? `${v}^(${k})` : `${v}^${k}`)).join('')}` || '1'

/** A ratio of two monomials in lowest terms: the powers of each letter cancel and the numbers reduce. */
function cancelMonomials(r: Rat): Rat {
  if (r.n.length !== 1 || r.d.length !== 1) return r
  const n = r.n[0], d = r.d[0]
  const c = fDiv(n.c, d.c)
  const num: Record<string, number> = {}, den: Record<string, number> = {}
  for (const v of new Set([...Object.keys(n.e), ...Object.keys(d.e)])) {
    const k = (n.e[v] ?? 0) - (d.e[v] ?? 0)
    if (k > 0) num[v] = k
    else if (k < 0) den[v] = -k
  }
  return { n: [{ c: fr(c.n), e: num }], d: [{ c: fr(c.d), e: den }] }
}

/** Simplify with positive exponents, via the algebra engine */
function simplifySpec(source: string, prompt: string, hint: string, expl: string[]): Spec | null {
  const r = cancelMonomials(parseRat(source))
  const answer = fracStr(fmtPoly(r.n, true), fmtPoly(r.d, true))
  if (answer === source) return null
  const e = alg('rational', prompt, source, answer, hint, expl)
  const dShown = fmtPoly(r.d, true)
  const shown = dShown === '1' ? fmtPoly(r.n, true) : /^[a-z](\^\d+)?$/.test(dShown) ? `${fmtPoly(r.n, true)}/${dShown}` : answer
  return { ...e, display: fancy(shown), alg: { ...e.alg!, positiveOnly: true } }
}


const EXPONENTS: Gen[] = [
  { lesson: 'exponent-laws', level: 1, make: (r) => {
    const kind = ri(r, 1, 5)
    if (kind === 1) {
      const b = ri(r, 2, 9), e = ri(r, 2, b > 5 ? 3 : 5)
      return valueFrac(`Evaluate ${b}${supInt(e)}.`, fr(b ** e), 'Multiply the base by itself as many times as the exponent says.', [`${b}${supInt(e)} = ${Array(e).fill(b).join(' × ')} = ${b ** e}.`])
    }
    if (kind === 2) {
      const b = ri(r, 2, 6), e = pick(r, [3, 5, 4, 2])
      const neg = r() < 0.5
      return valueFrac(neg ? `Evaluate ${MINUS}${b}${supInt(e)}.` : `Evaluate (${MINUS}${b})${supInt(e)}.`, fr(neg ? -(b ** e) : (-b) ** e), neg ? 'The exponent applies only to the 3, not to the minus sign: the minus sign is applied last.' : 'The bracket means the whole of −b is multiplied by itself. An even power of a negative number is positive; an odd power is negative.', neg
        ? [`Without brackets the exponent belongs to ${b} only: ${MINUS}${b}${supInt(e)} = ${MINUS}(${b}${supInt(e)}) = ${MINUS}${b ** e}.`]
        : [`(${MINUS}${b})${supInt(e)} = ${Array(e).fill(`(${MINUS}${b})`).join(' × ')}.`, `${e % 2 === 0 ? 'An even number of negative factors gives a positive result' : 'An odd number of negative factors gives a negative result'}: ${MN(String((-b) ** e))}.`])
    }
    if (kind === 3) {
      const b = ri(r, 2, 12) * (r() < 0.5 ? -1 : 1)
      return valueFrac(`Evaluate (${MN(String(b))})⁰.`, fr(1), 'Anything that is not zero, raised to the power 0, is 1.', ['Any non-zero number to the power 0 equals 1, because dividing a power by itself gives bⁿ ÷ bⁿ = b⁰, and it is also 1.'])
    }
    if (kind === 4) {
      const b = ri(r, 2, 6), e = ri(r, 1, b > 4 ? 2 : 3)
      return valueFrac(`Evaluate ${b}${supInt(-e)}.`, fr(1, b ** e), 'A negative exponent means "one over": b⁻ⁿ = 1/bⁿ.', [`${b}${supInt(-e)} = 1/${b}${supInt(e)}.`, `${b}${supInt(e)} = ${b ** e}, so the answer is 1/${b ** e}.`])
    }
    const [n, d] = pick(r, [[2, 3], [3, 4], [2, 5], [3, 2], [4, 3], [5, 2]]), e = ri(r, 2, 3)
    return valueFrac(`Evaluate (${n}/${d})${supInt(-e)}.`, fr(d ** e, n ** e), 'A negative exponent flips a fraction: (a/b)⁻ⁿ = (b/a)ⁿ.', [`Flip the fraction and make the exponent positive: (${n}/${d})${supInt(-e)} = (${d}/${n})${supInt(e)}.`, `(${d}/${n})${supInt(e)} = ${d ** e}/${n ** e}.`])
  } },
  { lesson: 'exponent-laws', level: 1, make: (r) => {
    // the three basic laws on one or two letters
    const [x, y] = pick(r, [['x', 'y'], ['a', 'b'], ['m', 'n'], ['p', 'q']])
    const kind = ri(r, 1, 6)
    const a = ri(r, 2, 6), b = ri(r, 2, 6), c = ri(r, 2, 4)
    let source = '', prompt = '', expl: string[] = [], hint = ''
    if (kind === 1) { source = `${x}^${a}${x}^${b}`; hint = 'Same base multiplied: add the exponents.'; expl = [`Multiplying powers of the same base adds the exponents: ${x}${supInt(a)}·${x}${supInt(b)} = ${x}^(${a} + ${b}) = ${x}${supInt(a + b)}.`] }
    else if (kind === 2) { source = `${x}^${a + b}/${x}^${b}`; hint = 'Same base divided: subtract the exponents.'; expl = [`Dividing powers of the same base subtracts the exponents: ${x}${supInt(a + b)} ÷ ${x}${supInt(b)} = ${x}^(${a + b} − ${b}) = ${x}${supInt(a)}.`] }
    else if (kind === 3) { source = `(${x}^${a})^${c}`; hint = 'A power of a power: multiply the exponents.'; expl = [`A power of a power multiplies the exponents: (${x}${supInt(a)})${supInt(c)} = ${x}^(${a} × ${c}) = ${x}${supInt(a * c)}.`] }
    else if (kind === 4) { source = `(${x}^${a}${y}^${b})^${c}`; hint = 'The outer power applies to every factor inside the bracket.'; expl = [`Raise each factor to the outer power: (${x}${supInt(a)})${supInt(c)}(${y}${supInt(b)})${supInt(c)}.`, `Multiply the exponents: ${x}${supInt(a * c)}${y}${supInt(b * c)}.`] }
    else if (kind === 5) { const k = ri(r, 2, 6); source = `${k}${x}^${a}*${ri(r, 2, 5)}${x}^${b}`; hint = 'Multiply the numbers, and add the exponents of the same letter.'; const m = /^(\d+)[a-z]\^\d+\*(\d+)/.exec(source)!; expl = [`Multiply the coefficients: ${m[1]} × ${m[2]} = ${Number(m[1]) * Number(m[2])}.`, `Add the exponents of ${x}: ${a} + ${b} = ${a + b}.`] }
    else { source = `${x}^${a}/${x}^${a + c}`; hint = 'Subtract the exponents. If the result is negative the power belongs under the fraction bar.'; expl = [`Subtract the exponents: ${x}^(${a} − ${a + c}) = ${x}${supInt(-c)}.`, `A negative exponent means 1 over the positive power: ${x}${supInt(-c)} = 1/${x}${supInt(c)}.`] }
    prompt = `Simplify ${fancy(source.replace(/\*/g, '·'))}. Write the answer with positive exponents.`
    const s = simplifySpec(source, prompt, hint, expl)
    return s ?? simplifySpec('x^2x^3', 'Simplify x²x³. Write the answer with positive exponents.', 'Add the exponents.', ['x²·x³ = x⁵.'])!
  } },
  { lesson: 'exponent-laws', level: 2, make: (r) => {
    // fractional exponents: the denominator is the root, the numerator the power
    const k = pick(r, [2, 2, 3, 3, 4]), m = ri(r, 1, k === 2 ? 4 : 3), neg = r() < 0.35
    const cMax = k === 2 ? 12 : k === 3 ? 5 : 3
    const frac = r() < 0.25
    const c = ri(r, 2, cMax), d = ri(r, 2, 3)
    if (frac && gcdI(c, d) !== 1) return EXPONENTS[2].make(r)
    const baseText = frac ? `(${c ** k}/${d ** k})` : String(c ** k)
    const answer = frac ? fr(c ** m, d ** m) : fr(c ** m)
    const result = neg ? fDiv(fr(1), answer) : answer
    const exp = `${neg ? MINUS : ''}${m}/${k}`
    const rootName = k === 2 ? 'square root' : k === 3 ? 'cube root' : 'fourth root'
    const steps = [
      `The denominator ${k} means the ${rootName}, and the numerator ${m} means the power: a^(m/n) = (ⁿ√a)^m.`,
      `The ${rootName} of ${frac ? `${c ** k}/${d ** k}` : c ** k} is ${frac ? `${c}/${d}` : c}.`,
      `Raise it to the power ${m}: ${frac ? `(${c}/${d})${supInt(m)} = ${c ** m}/${d ** m}` : `${c}${supInt(m)} = ${c ** m}`}.`,
      ...(neg ? [`The exponent is negative, so take the reciprocal: ${fm(result)}.`] : []),
    ]
    return valueFrac(`Evaluate ${baseText}^(${exp}).`, result, 'Take the root named by the denominator first (it keeps the numbers small), then the power in the numerator. A negative exponent means reciprocal.', steps)
  } },
  { lesson: 'exponent-laws', level: 2, make: (r) => {
    // a product of powers with negative exponents, two letters
    const q = search(300, () => {
      const [x, y] = pick(r, [['x', 'y'], ['a', 'b'], ['m', 'n']])
      const c1 = ri(r, 1, 3), c2 = ri(r, 1, 4)
      const e = () => ri(r, -3, 4)
      const outer = pick(r, [2, 3, 2])
      const inner = mono(c1, [[x, e()], [y, e()]])
      const other = mono(c2, [[x, e()], [y, e()]])
      const source = `(${inner})^${outer}*(${other})`
      const rat = parseRat(source)
      const size = Math.max(...rat.n.map((t) => Math.abs(t.c.n)), ...rat.d.map((t) => Math.abs(t.c.n)))
      if (size > 200) return null
      const expl = [
        `Apply the outer power ${outer} to every factor inside the first bracket, multiplying exponents and raising the number to the power ${outer}.`,
        `Multiply by the second factor, adding exponents of the same letter (and multiplying the numbers).`,
        `Move any factor with a negative exponent to the other side of the fraction bar, changing the sign of the exponent: x⁻ⁿ = 1/xⁿ.`,
      ]
      return simplifySpec(source, `Simplify (${fancy(inner)})${supInt(outer)}·(${fancy(other)}). Write the answer with positive exponents.`, 'Deal with the bracket first, then collect each letter separately by adding exponents.', expl)
    })
    return q ?? simplifySpec('(2x^3y^(-2))^2*(x^(-1)y)', 'Simplify (2x³y⁻²)²·(x⁻¹y). Write the answer with positive exponents.', 'Bracket first, then collect.', ['(2x³y⁻²)² = 4x⁶y⁻⁴.', '4x⁶y⁻⁴ · x⁻¹y = 4x⁵y⁻³ = 4x⁵/y³.'])!
  } },
  { lesson: 'exponent-laws', level: 2, make: (r) => {
    // scientific notation product, as a decimal
    const a = ri(r, 2, 9), b = ri(r, 2, 9), m = ri(r, -3, 4), n = ri(r, -3, 4)
    const p = a * b, e = m + n
    if (e < -3 || e > 5) return EXPONENTS[4].make(r)
    const value = Number(`${p}e${e}`)
    const text = (v: number) => (Number.isInteger(v) ? String(v) : String(v))
    return {
      prompt: `Calculate (${a} × 10${supInt(m)})(${b} × 10${supInt(n)}) and write the answer as an ordinary decimal number.`, kind: 'value', answers: [value], display: text(value), input: text(value), unit: '',
      needsExact: false, tol: 1e-9 * Math.max(1, value), hint: 'Multiply the numbers in front, and add the powers of 10.',
      explanation: [`Multiply the numbers: ${a} × ${b} = ${p}.`, `Add the powers of 10: 10${supInt(m)} × 10${supInt(n)} = 10${supInt(e)}.`, `So the product is ${p} × 10${supInt(e)}, which as a decimal is ${text(value)}.`],
      pad: { pi: false, root: false, comma: false, alg: true },
    }
  } },
  { lesson: 'exponent-laws', level: 3, make: (r) => {
    // (a^(n+p) ± a^(n+q)) / a^(n+s): factor out the smallest power
    const a = pick(r, [2, 3, 5]), p = ri(r, 2, 4), q = ri(r, 0, 1), s = ri(r, 1, 2), plus = r() < 0.5
    const top = plus ? a ** p + a ** q : a ** p - a ** q
    const res = fr(top, a ** s)
    const sign = plus ? '+' : MINUS
    return valueFrac(`Without a calculator, find the exact value of (${a}^(n+${p}) ${sign} ${a}^(n${q ? `+${q}` : ''})) / ${a}^(n+${s}). It does not depend on n.`, res, 'Write each power as a^n times a number: a^(n+p) = a^n · a^p. Then a^n cancels.', [
      `Write each power as ${a}ⁿ times a number: ${[...new Set([`${a}^(n+${p}) = ${a}ⁿ · ${a ** p}`, `${a}^(n${q ? `+${q}` : ''}) = ${a}ⁿ · ${a ** q}`, `${a}^(n+${s}) = ${a}ⁿ · ${a ** s}`])].join(', ')}.`,
      `Factor ${a}ⁿ out of the top: ${a}ⁿ(${a ** p} ${sign} ${a ** q}) = ${a}ⁿ · ${top}.`,
      `Cancel ${a}ⁿ: ${top}/${a ** s} = ${fm(res)}.`,
    ])
  } },
  { lesson: 'exponent-laws', level: 3, make: (r) => {
    // solve an exponential equation by writing both sides as powers of the same base
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      for (;;) {
        const b0 = pick(r, [2, 3, 5]), k = ri(r, 1, 3), downward = r() < 0.2, mExp = ri(r, -3, 4)
        if (mExp === 0) continue
        const base = downward ? fr(1, b0 ** k) : fr(b0 ** k)
        const a = pick(r, [1, 2, 3, -1, -2]), c = rnz(r, -4, 4)
        const target = fr(mExp)
        const kk = downward ? -k : k
        // base^(a x + c) = b0^mExp  <=>  kk (a x + c) = mExp
        const x = fDiv(fSub(fDiv(target, fr(kk)), fr(c)), fr(a))
        const baseText = downward ? `(1/${b0 ** k})` : String(b0 ** k)
        const rhsText = mExp > 0 ? String(b0 ** mExp) : `1/${b0 ** -mExp}`
        const expText = `${a === 1 ? '' : a === -1 ? MINUS : MN(String(a))}x ${sgnText(c)}`
        const f = (xx: number) => Math.pow(fNum(base), a * xx + c) - Math.pow(b0, mExp)
        return exactSet(`Solve ${baseText}^(${expText}) = ${rhsText}. Give x as an exact fraction.`, [exF(x)], 'x',
          'Write both sides as powers of the same prime, then equate the exponents.', [
            kk === 1 ? `The base is already ${b0}, and ${rhsText} = ${b0}${supInt(mExp)}.` : `Write the base and the right side as powers of ${b0}: ${baseText} = ${b0}${supInt(kk)}, and ${rhsText} = ${b0}${supInt(mExp)}.`,
            `Equal powers of the same base have equal exponents: ${kk === 1 ? expText : `${MN(String(kk))}(${expText})`} = ${MN(String(mExp))}.`,
            `Solve the linear equation: x = ${fm(x)}.`,
          ], undefined, (xx) => Math.abs(f(xx)) < 1e-9 * Math.max(1, Math.pow(b0, Math.abs(mExp))))
      }
    }
    if (kind === 2) {
      for (;;) {
        const r1 = ri(r, -4, 5), r2 = ri(r, -4, 5), m = ri(r, 1, 4), b0 = pick(r, [2, 3])
        if (r1 >= r2) continue
        const bq = -(r1 + r2), c = r1 * r2 + m
        const exp = fmtPoly([{ c: fr(1), e: { x: 2 } }, ...(bq ? [{ c: fr(bq), e: { x: 1 } }] : []), ...(c ? [{ c: fr(c), e: {} }] : [])], false)
        const f = (x: number) => Math.pow(b0, x * x + bq * x + c) - Math.pow(b0, m)
        return exactSet(`Solve ${b0}^(${exp}) = ${b0 ** m}. Give all solutions, separated by commas.`, [exF(fr(r1)), exF(fr(r2))], 'x', 'Write the right side as a power of the same base, equate the exponents, and solve the quadratic.', [
          `${b0 ** m} = ${b0}^${m}, so both sides are powers of ${b0} and the exponents must be equal.`,
          `${exp} = ${m}, which is ${fmtPoly([{ c: fr(1), e: { x: 2 } }, ...(bq ? [{ c: fr(bq), e: { x: 1 } }] : []), { c: fr(c - m), e: {} }], false)} = 0.`,
          `Factor: (x ${sgnText(-r1)})(x ${sgnText(-r2)}) = 0, so x = ${MN(String(r1))} or x = ${MN(String(r2))}.`,
        ], undefined, (x) => Math.abs(f(x)) < 1e-9 * Math.max(1, Math.pow(b0, Math.max(0, x * x + bq * x + c))))
      }
    }
    // a hidden quadratic: 4^x - (2^p + 2^q) 2^x + 2^(p+q) = 0
    for (;;) {
      const p = ri(r, 0, 4), q = ri(r, 0, 4)
      if (p >= q) continue
      const mid = 2 ** p + 2 ** q, last = 2 ** (p + q)
      const f = (x: number) => Math.pow(4, x) - mid * Math.pow(2, x) + last
      return exactSet(`Solve 4^x ${MINUS} ${mid}·2^x + ${last} = 0. Give all solutions, separated by commas.`, [exF(fr(p)), exF(fr(q))], 'x',
        'Notice that 4^x = (2^x)². Let u = 2^x to get an ordinary quadratic in u.', [
          `Since 4^x = (2^x)², let u = 2^x. The equation becomes u² ${MINUS} ${mid}u + ${last} = 0.`,
          `Factor: (u ${MINUS} ${2 ** p})(u ${MINUS} ${2 ** q}) = 0, so u = ${2 ** p} or u = ${2 ** q}.`,
          `Now go back: 2^x = ${2 ** p} gives x = ${p}, and 2^x = ${2 ** q} gives x = ${q}.`,
        ], undefined, (x) => Math.abs(f(x)) < 1e-9 * Math.max(1, last))
    }
  } },
]

/* ------------------------------------------------------------------ 2. radicals */

const RADICANDS = [2, 3, 5, 6, 7, 10, 11, 13]
const sqrtText = (n: number) => `√${n}`
/** p + q√r typeset, dropping a zero part */
function binom(p: number, q: number, rad: number): string {
  const rt = `${Math.abs(q) === 1 ? '' : Math.abs(q)}√${rad}`
  if (q === 0) return MN(String(p))
  if (p === 0) return `${q < 0 ? MINUS : ''}${rt}`
  return `${MN(String(p))} ${q < 0 ? MINUS : '+'} ${rt}`
}
const asciiRoot = (t: string) => t.replace(/−/g, '-').replace(/√(\d+)/g, 'sqrt($1)').replace(/(\d)sqrt/g, '$1*sqrt')
/** √(x + c), written √x when c is 0 */
const sx = (c: number) => (c === 0 ? '√x' : `√(x ${sgnText(c)})`)
/** x + c, written as just x when c is 0 */
const lx = (c: number, v = 'x') => (c === 0 ? v : `${v} ${sgnText(c)}`)
const coefText = (c: number) => (c === 1 ? '' : c === -1 ? MINUS : String(c))

const RADICALS: Gen[] = [
  { lesson: 'radicals', level: 1, make: (r) => {
    const s = ri(r, 2, 9), rad = pick(r, RADICANDS), n = s * s * rad
    const { outside } = extractRoot(n)
    const sq = s * s
    return radicalSpec(`Simplify ${sqrtText(n)}.`, root(0, outside, rad), 'Find the largest perfect square that divides the number, and take its square root outside.', [
      `Look for the largest perfect square factor of ${n}: ${n} = ${sq} × ${rad}.`,
      `${sqrtText(n)} = √${sq} × √${rad} = ${s}${sqrtText(rad)}.`,
      `${rad} has no square factor, so this is in simplest form.`,
    ], [`sqrt(${n})`])
  } },
  { lesson: 'radicals', level: 1, make: (r) => {
    // add or subtract like radicals, possibly after simplifying
    const rad = pick(r, [2, 3, 5, 6, 7]), simple = r() < 0.4
    const c1 = ri(r, 1, 6), c2 = ri(r, 1, 6)
    const plus = r() < 0.6
    if (simple) {
      if (c1 === c2 && !plus) return RADICALS[1].make(r)
      const total = plus ? c1 + c2 : c1 - c2
      return radicalSpec(`Simplify ${coefText(c1)}${sqrtText(rad)} ${plus ? '+' : MINUS} ${coefText(c2)}${sqrtText(rad)}.`, root(0, total, rad), 'Like radicals (the same number under the root) combine like like terms: add the coefficients.', [
        `Both terms contain ${sqrtText(rad)}, so they are like terms.`, `${c1}${sqrtText(rad)} ${plus ? '+' : MINUS} ${c2}${sqrtText(rad)} = (${c1} ${plus ? '+' : MINUS} ${c2})${sqrtText(rad)} = ${total === 0 ? '0' : `${coefText(total)}${sqrtText(rad)}`}.`])
    }
    const s1 = ri(r, 1, 5), s2 = ri(r, 1, 5)
    const t = plus ? c1 * s1 + c2 * s2 : c1 * s1 - c2 * s2
    if (t === 0 || (s1 === 1 && s2 === 1)) return RADICALS[1].make(r)
    return radicalSpec(`Simplify ${coefText(c1)}√${s1 * s1 * rad} ${plus ? '+' : MINUS} ${coefText(c2)}√${s2 * s2 * rad}.`, root(0, t, rad), 'Simplify each root first. If the numbers under the roots then match, combine like terms.', [
      `Simplify each: √${s1 * s1 * rad} = ${s1 === 1 ? '' : s1}${sqrtText(rad)} and √${s2 * s2 * rad} = ${s2 === 1 ? '' : s2}${sqrtText(rad)}.`,
      `So the expression is ${c1 * s1}${sqrtText(rad)} ${plus ? '+' : MINUS} ${c2 * s2}${sqrtText(rad)}.`,
      `Combine like radicals: ${coefText(t)}${sqrtText(rad)}.`,
    ])
  } },
  { lesson: 'radicals', level: 1, make: (r) => {
    // multiply roots
    const a = pick(r, [2, 3, 5, 6, 7, 10, 12, 15, 18, 20]), b = pick(r, [2, 3, 5, 6, 7, 8, 10, 12, 14]), c = ri(r, 1, 4), d = ri(r, 1, 4)
    const n = a * b
    const { outside, inside } = extractRoot(n)
    const val = root(0, c * d * outside, inside)
    return radicalSpec(`Simplify ${coefText(c)}${sqrtText(a)} × ${coefText(d)}${sqrtText(b)}.`, val, 'Multiply the numbers outside, multiply the numbers under the roots, then simplify.', [
      `Multiply the outside numbers (${c} × ${d} = ${c * d}) and the roots (√${a} × √${b} = √${n}).`,
      `That gives ${c * d === 1 ? '' : c * d}√${n}.`,
      `Simplify √${n} = ${fmtRoot(root(0, outside, inside))}, so the answer is ${fmtRoot(val)}.`,
    ])
  } },
  { lesson: 'radicals', level: 2, make: (r) => {
    // cube roots
    const s = ri(r, 2, 5), rad = pick(r, [2, 3, 4, 5, 6, 7]), neg = r() < 0.2
    if (!isKFree(rad, 3)) return RADICALS[3].make(r)
    const n = s ** 3 * rad
    const value = (neg ? -1 : 1) * s * Math.cbrt(rad)
    const disp = `${neg ? MINUS : ''}${s}∛${rad}`
    return {
      prompt: `Simplify ∛${neg ? `(${MINUS}${n})` : n}.`, kind: 'value', answers: [value], display: disp, input: `${neg ? '-' : ''}${s}*cbrt(${rad})`, unit: '', needsExact: true, tol: 1e-9,
      hint: 'For a cube root, look for the largest perfect cube that divides the number.',
      explanation: [`Find the largest perfect cube factor of ${n}: ${n} = ${s ** 3} × ${rad}, and ${s ** 3} = ${s}³.`, `∛${n} = ∛${s ** 3} × ∛${rad} = ${s}∛${rad}.`, ...(neg ? [`The cube root of a negative number is negative, so the answer is ${disp}.`] : []), `${rad} has no cube factor, so this is simplest.`],
      pad: { pi: false, root: true, comma: false, alg: true, extra: ['∛'] }, simplest: true, rejects: [`${neg ? '-' : ''}cbrt(${n})`],
    }
  } },
  { lesson: 'radicals', level: 2, make: (r) => {
    // rationalise a single root in the denominator
    const n = pick(r, [2, 3, 5, 6, 7, 8, 12, 18, 20, 27]), k = ri(r, 1, 12)
    const { outside, inside } = extractRoot(n)
    const val = root(0, fr(k, outside * inside), inside)
    const simpleDen = n === inside
    return radicalSpec(`Write ${k}/√${n} with a rational denominator, in simplest form.`, val, 'Multiply the top and bottom by the root in the denominator. Simplify the root first if you can.', [
      ...(simpleDen ? [] : [`First simplify the root: √${n} = ${outside}√${inside}, so the fraction is ${k}/(${outside}√${inside}).`]),
      `Multiply top and bottom by √${inside} (this does not change the value, since √${inside}/√${inside} = 1).`,
      `The denominator becomes ${outside === 1 ? '' : `${outside} × `}√${inside} × √${inside} = ${outside * inside}, with no root left.`,
      `So the answer is ${fmtRoot(val)} (after cancelling any common factor).`,
    ], [`${k}/sqrt(${n})`])
  } },
  { lesson: 'radicals', level: 2, make: (r) => {
    // expand brackets containing a root
    const rad = pick(r, [2, 3, 5, 6, 7]), kind = ri(r, 1, 3)
    const a = rnz(r, -4, 5), b = rnz(r, -3, 4), c = rnz(r, -4, 5), d = rnz(r, -3, 4)
    const show = (p: number, q: number) => `(${binom(p, q, rad)})`
    const A = root(a, b, rad)
    const w = (n: number) => (n < 0 ? `(${MN(String(n))})` : String(n))
    if (kind === 1) {
      const B = root(c, d, rad), prod = rootMul(A, B)
      return radicalSpec(`Expand and simplify ${show(a, b)}${show(c, d)}.`, prod, 'Multiply each term in the first bracket by each term in the second, remembering √r × √r = r.', [
        `Multiply every term of the first bracket by every term of the second.`,
        `Whole-number terms: ${w(a)} × ${w(c)} = ${a * c} and (${w(b)}${sqrtText(rad)})(${w(d)}${sqrtText(rad)}) = ${w(b)} × ${w(d)} × ${rad} = ${b * d * rad}.`,
        `Root terms: ${w(a)} × ${w(d)}${sqrtText(rad)} + ${w(b)}${sqrtText(rad)} × ${w(c)} = ${a * d + b * c === 0 ? '0' : `${coefText(a * d + b * c)}${sqrtText(rad)}`}.`,
        `Collect the whole numbers and the roots: ${fmtRoot(prod)}.`,
      ])
    }
    if (kind === 2) {
      const sq = rootMul(A, A)
      return radicalSpec(`Expand and simplify ${show(a, b)}².`, sq, 'Square a bracket by multiplying it by itself: (p + q)² = p² + 2pq + q². Remember (√r)² = r.', [
        `(p + q)² = p² + 2pq + q² with p = ${MN(String(a))} and q = ${MN(String(b))}${sqrtText(rad)}.`,
        `p² = ${a * a}, 2pq = ${MN(String(2 * a * b))}${sqrtText(rad)}, q² = ${b * b} × ${rad} = ${b * b * rad}.`,
        `Add: ${fmtRoot(sq)}.`,
      ])
    }
    const conj = rootMul(root(a, b, rad), root(a, -b, rad))
    return radicalSpec(`Expand and simplify ${show(a, b)}${show(a, -b)}.`, conj, 'These are conjugates: (p + q)(p − q) = p² − q², so the roots disappear.', [
      `(p + q)(p − q) = p² − q² with p = ${MN(String(a))} and q = ${MN(String(b))}${sqrtText(rad)}.`,
      `p² = ${a * a} and q² = ${b * b} × ${rad} = ${b * b * rad}.`,
      `So the product is ${a * a} ${MINUS} ${b * b * rad} = ${MN(String(a * a - b * b * rad))}.`,
    ])
  } },
  { lesson: 'radicals', level: 2, make: (r) => {
    // simple radical equation (and a cube-root one)
    if (r() < 0.65) {
      const a = ri(r, 1, 5), c = ri(r, 1, 7), b = rnz(r, -9, 9)
      const x = fr(c * c - b, a)
      const f = (xx: number) => (a * xx + b >= 0 ? Math.sqrt(a * xx + b) - c : 1)
      return exactSet(`Solve √(${a === 1 ? '' : a}x ${sgnText(b)}) = ${c}.`, [exF(x)], 'x', 'Square both sides to remove the root, then solve. Check the answer in the original equation.', [
        `Square both sides: ${a === 1 ? '' : a}x ${sgnText(b)} = ${c * c}.`, `Solve: ${tx(a)} = ${MN(String(c * c - b))}, so x = ${fm(x)}.`, `Check: √(${a}(${fm(x)}) ${sgnText(b)}) = √${c * c} = ${c}.`], undefined, (xx) => Math.abs(f(xx)) < 1e-9)
    }
    const c = ri(r, 1, 4), b = rnz(r, -5, 5)
    const x = c ** 3 - b
    return exactSet(`Solve ∛(x ${sgnText(b)}) = ${c}.`, [exF(fr(x))], 'x', 'Cube both sides to remove the cube root.', [`Cube both sides: x ${sgnText(b)} = ${c ** 3}.`, `So x = ${MN(String(x))}.`, `Check: ∛(${x} ${sgnText(b)}) = ∛${c ** 3} = ${c}.`], undefined, (xx) => Math.abs(Math.cbrt(xx + b) - c) < 1e-9)
  } },
  { lesson: 'radicals', level: 3, make: (r) => {
    // rationalise a binomial denominator with a conjugate: (p + q√r)/(s + t√r)
    for (;;) {
      const rad = pick(r, [2, 3, 5, 6, 7]), p = rnz(r, -5, 6), q = ri(r, 0, 3) * (r() < 0.5 ? -1 : 1), s = rnz(r, 1, 6), t = rnz(r, -3, 3)
      const den = s * s - t * t * rad
      if (t === 0 || den === 0 || Math.abs(den) > 40) continue
      const num = rootMul(root(p, q, rad), root(s, -t, rad))
      const val = root(fDiv(num.a, fr(den)), fDiv(num.b, fr(den)), rad)
      const topText = binom(p, q, rad), bottom = binom(s, t, rad), conj = binom(s, -t, rad)
      return radicalSpec(`Rationalise the denominator of (${topText}) / (${bottom}) and simplify.`, val, 'Multiply the top and bottom by the conjugate of the denominator (change the sign between the terms). The bottom becomes a difference of squares with no root.', [
        `The conjugate of ${bottom} is ${conj}. Multiply the top and bottom by it.`,
        `Bottom: (${s})² ${MINUS} (${Math.abs(t)}${sqrtText(rad)})² = ${s * s} ${MINUS} ${t * t * rad} = ${MN(String(den))}.`,
        `Top: (${topText})(${conj}) expands to ${fmtRoot(num)}.`,
        `Divide by ${MN(String(den))}: ${fmtRoot(val)}.`,
      ], [`(${asciiRoot(topText)})/(${asciiRoot(bottom)})`])
    }
  } },
  { lesson: 'radicals', level: 3, make: (r) => {
    // a radical equation with an extraneous solution: sqrt(x + k) = x + m
    for (;;) {
      const p = ri(r, -5, 6), q = ri(r, -5, 6)
      if (p === q || (p + q) % 2 === 0) continue
      const m = (1 - p - q) / 2, k = m * m - p * q
      if (Math.abs(k) > 30 || Math.abs(m) > 6) continue
      const valid = [p, q].filter((x) => x + m >= 0 && x + k >= 0)
      const f = (xx: number) => (xx + k >= 0 ? Math.sqrt(xx + k) - (xx + m) : 1)
      const bad = [p, q].filter((x) => !valid.includes(x))
      const eqText = `${sx(k)} = ${lx(m)}`
      const square = fmtPoly(parsePoly(`(x+(${m}))^2`))
      const quadText = fmtPoly(parsePoly(`x^2+(${2 * m - 1})x+(${m * m - k})`))
      return exactSet(`Solve ${eqText}. Check your answers. Give all solutions, separated by commas (or type "no solution").`, valid.map((x) => exF(fr(x))), 'x', 'Square both sides, solve the resulting quadratic, then check each answer in the ORIGINAL equation: squaring can create false solutions.', [
        `Square both sides: ${lx(k)} = (${lx(m)})² = ${square}.`,
        `Move everything to one side: ${quadText} = 0, which factors as (${lx(-p)})(${lx(-q)}) = 0.`,
        `Candidates: x = ${MN(String(p))} and x = ${MN(String(q))}.`,
        bad.length ? `Check in the original: for x = ${bad.map((x) => MN(String(x))).join(' and ')} the right side ${lx(m)} is negative, but a square root is never negative, so ${bad.length > 1 ? 'they are' : 'it is'} extraneous.` : 'Check both in the original: both work.',
        valid.length ? `Solution${valid.length > 1 ? 's' : ''}: x = ${valid.map((x) => MN(String(x))).join(', ')}.` : 'No candidate survives, so there is no solution.',
      ], undefined, (xx) => Math.abs(f(xx)) < 1e-9)
    }
  } },
  { lesson: 'radicals', level: 3, make: (r) => {
    // two square roots: sqrt(x + a) + sqrt(x + b) = c, built from integer values u and v
    for (;;) {
      const u = ri(r, 1, 6), v = ri(r, 1, 6), x0 = ri(r, -5, 10)
      if (u === v) continue
      const a = u * u - x0, b = v * v - x0, c = u + v
      const f = (xx: number) => (xx + a >= 0 && xx + b >= 0 ? Math.sqrt(xx + a) + Math.sqrt(xx + b) - c : 1)
      return exactSet(`Solve ${sx(a)} + ${sx(b)} = ${c}.`, [exF(fr(x0))], 'x', 'Isolate one root and square. Then isolate the other root and square again. Check the answer in the original equation.', [
        `Isolate one root: ${sx(a)} = ${c} ${MINUS} ${sx(b)}.`,
        `Square both sides: ${lx(a)} = ${c * c} ${MINUS} ${2 * c}${sx(b)} + ${lx(b)}.`,
        `Simplify and isolate the root: ${2 * c}${sx(b)} = ${MN(String(c * c + b - a))}, so ${sx(b)} = ${v}.`,
        `Square again: ${lx(b)} = ${v * v}, so x = ${MN(String(x0))}.`,
        `Check: x = ${MN(String(x0))} makes ${sx(a)} = √${u * u} = ${u} and ${sx(b)} = √${v * v} = ${v}, and ${u} + ${v} = ${c}.`,
      ], undefined, (xx) => Math.abs(f(xx)) < 1e-9)
    }
  } },
]

/* ------------------------------------------------------------------ 3. logarithms */

const POW_BASES: [number, number][] = [[2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [5, 1], [5, 2], [10, 1], [4, 1], [6, 1], [7, 1], [8, 1], [9, 1]]
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

const LOGS: Gen[] = [
  { lesson: 'logarithms', level: 1, make: (r) => {
    const kind = ri(r, 1, 4)
    if (kind === 1) {
      const [b0, p] = pick(r, POW_BASES), base = b0 ** p
      const q = pick(r, [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6])
      const arg = q >= 0 ? String(b0 ** q) : `1/${b0 ** -q}`
      if (base > 130 || b0 ** Math.abs(q) > 2000) return LOGS[0].make(r)
      const res = fr(q, p)
      return valueFrac(`Evaluate ${logT(base, paren(arg))}.`, res, 'log_b(a) asks: "what power of b gives a?" Write the base and the number as powers of the same small number.', [
        `${logT(base, paren(arg))} is the power to which ${base} must be raised to give ${arg}.`,
        `${base} = ${b0}${p === 1 ? '' : supInt(p)} and ${arg} = ${b0}${supInt(q)}.`,
        p === 1 ? `So ${base}^${MN(String(q))} = ${arg} and the logarithm is ${MN(String(q))}.` : `${base}^(${MN(fm(res))}) = (${b0}${supInt(p)})^(${MN(fm(res))}) = ${b0}${supInt(q)}, so the logarithm is ${fm(res)}.`,
      ])
    }
    if (kind === 2) {
      const k = pick(r, [-3, -2, -1, 1, 2, 3, 4, 5])
      return valueFrac(`Evaluate ln (e${supInt(k)}).`, fr(k), 'ln is the logarithm to the base e, so ln(eᵏ) = k.', [`ln means log to the base e. ln(e^k) asks "what power of e gives e^k?"`, `The answer is k = ${MN(String(k))}.`])
    }
    if (kind === 3) {
      const k = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6])
      const arg = k >= 0 ? String(10 ** k) : `0.${'0'.repeat(-k - 1)}1`
      return valueFrac(`Evaluate log${sub(10)} ${arg}.`, fr(k), 'This is the common logarithm, to the base 10. Count the zeros.', [`${arg} = 10${supInt(k)}.`, `So the power of 10 that gives ${arg} is ${MN(String(k))}.`])
    }
    const b = pick(r, [2, 3, 4, 5, 7, 10, 6])
    return valueFrac(`Evaluate ${logT(b, '1')} + ${logT(b, String(b))}.`, fr(1), 'log of 1 is 0 in every base, and log_b of b itself is 1.', [`${logT(b, '1')} = 0, because ${b}⁰ = 1.`, `${logT(b, String(b))} = 1, because ${b}¹ = ${b}.`, 'The sum is 0 + 1 = 1.'])
  } },
  { lesson: 'logarithms', level: 1, make: (r) => {
    // switch between logarithmic and exponential form: log_b x = k, or log_x N = k
    const kind = ri(r, 1, 3)
    const b0 = pick(r, [2, 3, 4, 5, 6, 10]), k = pick(r, [-3, -2, -1, 2, 3, 4])
    if (kind === 1) {
      const x = k >= 0 ? fr(b0 ** k) : fr(1, b0 ** -k)
      return exactSet(`Solve ${logT(b0, 'x')} = ${MN(String(k))}. Give x as an exact fraction or whole number.`, [exF(x)], 'x', 'Rewrite in exponential form: log_b(x) = k means x = bᵏ.', [`Rewrite in exponential form: x = ${b0}${supInt(k)}.`, `x = ${fm(x)}.`], undefined, (xx) => xx > 0 && near(Math.log(xx) / Math.log(b0), k))
    }
    if (kind === 2) {
      const kk = pick(r, [2, 3, 4]), bb = pick(r, [2, 3, 4, 5, 6]), N = bb ** kk
      return exactSet(`Solve log${'ₓ'} ${N} = ${kk}. Give x as a whole number.`, [exF(fr(bb))], 'x', 'Rewrite in exponential form: log_x(N) = k means xᵏ = N.', [`Rewrite in exponential form: x${supInt(kk)} = ${N}.`, `Take the ${kk === 2 ? 'square' : kk === 3 ? 'cube' : 'fourth'} root of ${N}: x = ${bb}. (A base must be positive.)`], undefined, (xx) => xx > 0 && xx !== 1 && near(Math.log(N) / Math.log(xx), kk))
    }
    const x = ri(r, 2, 9), kv = pick(r, [2, 3]), v = x ** kv
    return valueFrac(`Evaluate ${logT(x, String(v))}.`, fr(kv), `Ask: what power of ${x} gives ${v}?`, [`${x}${supInt(kv)} = ${v}, so ${logT(x, String(v))} = ${kv}.`])
  } },
  { lesson: 'logarithms', level: 2, make: (r) => {
    // use the laws to evaluate exactly
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      // sum of logs: product is a power of the base
      const q = search(300, () => {
        const b = pick(r, [6, 10, 12, 15, 18, 20, 24, 30]), k = ri(r, 1, 3)
        const N = b ** k
        const divs: number[] = []
        for (let d = 2; d < N; d++) if (N % d === 0) divs.push(d)
        const A = pick(r, divs), B = N / A
        if (A === B || [A, B].some((v) => [...Array(5).keys()].some((j) => b ** j === v))) return null
        return { b, k, A: Math.min(A, B), B: Math.max(A, B) }
      })
      if (!q) return LOGS[2].make(r)
      const { b, k, A, B } = q
      return valueFrac(`Evaluate ${logT(b, String(A))} + ${logT(b, String(B))}.`, fr(k), 'The sum of logs is the log of the product: log a + log b = log(ab).', [
        `Combine: ${logT(b, String(A))} + ${logT(b, String(B))} = ${logT(b, `(${A} × ${B})`)} = ${logT(b, String(A * B))}.`, `${A * B} = ${b}${supInt(k)}, so the result is ${k}.`])
    }
    if (kind === 2) {
      // difference: A / B = b^k
      const b = pick(r, [2, 3, 5, 6, 10]), k = ri(r, 1, 3), B = pick(r, [2, 3, 5, 7, 4]), A = B * b ** k
      if (A > 2000 || B === b) return LOGS[2].make(r)
      return valueFrac(`Evaluate ${logT(b, String(A))} ${MINUS} ${logT(b, String(B))}.`, fr(k), 'The difference of logs is the log of the quotient: log a − log b = log(a/b).', [
        `Combine: ${logT(b, String(A))} ${MINUS} ${logT(b, String(B))} = ${logT(b, `(${A} ÷ ${B})`)} = ${logT(b, String(b ** k))}.`, `${b ** k} = ${b}${supInt(k)}, so the result is ${k}.`])
    }
    // coefficient: p log A - log B = log b^k with A^p / B = b^k
    const q = search(300, () => {
      const A = ri(r, 2, 9), p = pick(r, [2, 3]), b0 = pick(r, [2, 3, 5, 7]), k = ri(r, 1, 3)
      const Ap = A ** p, bk = b0 ** k
      if (Ap % bk !== 0) return null
      const B = Ap / bk
      if (B <= 1 || A === b0) return null
      return { A, p, b0, k, B }
    })
    if (!q) return LOGS[2].make(r)
    const { A, p, b0, k, B } = q
    return valueFrac(`Evaluate ${p}${logT(b0, String(A))} ${MINUS} ${logT(b0, String(B))}.`, fr(k), 'Move the coefficient up as a power: p·log a = log(aᵖ). Then use the quotient law.', [
      `${p}${logT(b0, String(A))} = ${logT(b0, `${A}${supInt(p)}`)} = ${logT(b0, String(A ** p))}.`, `${logT(b0, String(A ** p))} ${MINUS} ${logT(b0, String(B))} = ${logT(b0, `(${A ** p} ÷ ${B})`)} = ${logT(b0, String(b0 ** k))}.`, `${b0 ** k} = ${b0}${supInt(k)}, so the result is ${k}.`])
  } },
  { lesson: 'logarithms', level: 2, make: (r) => {
    // exponential equation solved with logs, decimal answer
    const b = pick(r, [2, 3, 5, 7, 10]), kind = ri(r, 1, 3)
    for (;;) {
      const N = ri(r, 5, 200)
      if (Math.log(N) / Math.log(b) % 1 === 0) continue
      if (kind === 1) {
        const x = Math.log(N) / Math.log(b)
        return approxSpec(`Solve ${b}^x = ${N}.`, x, 3, 'Take logs of both sides, then bring the exponent down: x·log b = log N.', [
          `Take the natural logarithm of both sides: ln(${b}^x) = ln ${N}.`, `Use the power law to bring the exponent down: x ln ${b} = ln ${N}.`, `So x = ln ${N} / ln ${b} = ${x.toFixed(3)}.`], approxHolds((xx) => Math.pow(b, xx) - N, N))
      }
      if (kind === 2) {
        const a = ri(r, 2, 6), c = rnz(r, -3, 4)
        const M = a * ri(r, 3, 30)
        const x = Math.log(M / a) / Math.log(b) - c
        return approxSpec(`Solve ${a}·${b}^(x ${sgnText(c)}) = ${M}.`, x, 3, 'Divide by the number in front first, then take logs.', [
          `Divide both sides by ${a}: ${b}^(x ${sgnText(c)}) = ${M / a}.`,
          `Take logs: (x ${sgnText(c)}) ln ${b} = ln ${M / a}, so x ${sgnText(c)} = ln ${M / a} / ln ${b}.`, `Subtract ${MN(String(c))}: x = ${x.toFixed(3)}.`], approxHolds((xx) => a * Math.pow(b, xx + c) - M, M))
      }
      const k = pick(r, [2, 3])
      const x = Math.log(N) / (k * Math.log(b))
      return approxSpec(`Solve ${b}^(${k}x) = ${N}.`, x, 3, 'Take logs: the whole exponent 2x or 3x comes down as a factor.', [`Take logs: ${k}x ln ${b} = ln ${N}.`, `Divide by ${k} ln ${b}: x = ln ${N} / (${k} ln ${b}) = ${x.toFixed(3)}.`], approxHolds((xx) => Math.pow(b, k * xx) - N, N))
    }
  } },
  { lesson: 'logarithms', level: 2, make: (r) => {
    // change of base
    const b = pick(r, [2, 3, 4, 5, 6, 7, 8, 9]), N = ri(r, 3, 100)
    if (N === b || Number.isInteger(Math.log(N) / Math.log(b))) return LOGS[4].make(r)
    const v = Math.log(N) / Math.log(b)
    return {
      ...approxSpec(`Evaluate ${logT(b, String(N))}.`, v, 3, 'Use the change of base formula with natural logs: log_b N = ln N / ln b.', [
        `Change of base: ${logT(b, String(N))} = ln ${N} / ln ${b}.`, `ln ${N} ≈ ${Math.log(N).toFixed(4)} and ln ${b} ≈ ${Math.log(b).toFixed(4)}.`, `The quotient is ${v.toFixed(3)}.`], approxHolds((xx) => Math.pow(b, xx) - N, N), 'value'),
      display: `≈ ${v.toFixed(3)}`,
    }
  } },
  { lesson: 'logarithms', level: 3, make: (r) => {
    // log equations with a domain check
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      for (;;) {
        const b = pick(r, [2, 3, 4, 5]), k = ri(r, 2, 4), N = b ** k
        const divs: number[] = []
        for (let d = 1; d <= N; d++) if (N % d === 0) divs.push(d)
        const r1 = pick(r, divs), r2 = -N / r1
        const c = -(r1 + r2)
        if (c === 0 || Math.abs(c) > 30) continue
        const f = (x: number) => (x > 0 && x + c > 0 ? Math.log(x) / Math.log(b) + Math.log(x + c) / Math.log(b) - k : 1)
        return exactSet(`Solve ${logT(b, 'x')} + ${logT(b, `(x ${sgnText(c)})`)} = ${k}. Give all valid solutions, separated by commas.`, [exF(fr(r1))], 'x',
          'Combine the logs into one with the product law, rewrite in exponential form, solve, and then check the domain: every argument of a log must be positive.', [
            `Product law: ${logT(b, `[x(x ${sgnText(c)})]`)} = ${k}.`,
            `Exponential form: x(x ${sgnText(c)}) = ${b}${supInt(k)} = ${N}, so x² ${sgnText(c)}x ${MINUS} ${N} = 0.`.replace(/−/g, MINUS),
            `Factor: (x ${sgnText(-r1)})(x ${sgnText(-r2)}) = 0, so x = ${MN(String(r1))} or x = ${MN(String(r2))}.`,
            `Check the domain. x = ${MN(String(r2))} makes ${logT(b, 'x')} undefined (or the other log), because the argument is not positive, so reject it.`,
            `x = ${r1} works: both arguments (${r1} and ${r1 + c}) are positive.`,
          ], undefined, (x) => Math.abs(f(x)) < 1e-9)
      }
    }
    if (kind === 2) {
      for (;;) {
        const b = pick(r, [2, 3, 4, 5]), k = ri(r, 1, 3), q = rnz(r, -4, 4), x0 = ri(r, q + 1, q + 8)
        const bk = b ** k
        const p = (bk - 1) * x0 - bk * q
        if (Math.abs(p) > 40 || p === 0) continue
        const f = (x: number) => (x + p > 0 && x - q > 0 ? Math.log(x + p) / Math.log(b) - Math.log(x - q) / Math.log(b) - k : 1)
        return exactSet(`Solve ${logT(b, `(x ${sgnText(p)})`)} ${MINUS} ${logT(b, `(x ${sgnText(-q)})`)} = ${k}.`, [exF(fr(x0))], 'x',
          'Combine with the quotient law, rewrite in exponential form to remove the logs, then solve and check the domain.', [
            `Quotient law: ${logT(b, `[(x ${sgnText(p)}) ÷ (x ${sgnText(-q)})]`)} = ${k}.`,
            `Exponential form: (x ${sgnText(p)}) / (x ${sgnText(-q)}) = ${bk}.`,
            `Multiply out: x ${sgnText(p)} = ${bk}(x ${sgnText(-q)}), so ${tx(bk - 1)} = ${MN(String(p + bk * q))}, giving x = ${MN(String(x0))}.`,
            `Check the domain: ${MN(String(x0))} ${sgnText(p)} = ${x0 + p} > 0 and ${MN(String(x0))} ${sgnText(-q)} = ${x0 - q} > 0, so it is valid.`,
          ], undefined, (x) => Math.abs(f(x)) < 1e-9)
      }
    }
    const b = pick(r, [2, 3, 4, 5, 10]), k = ri(r, 1, 3), a = pick(r, [1, 2, 3, 4]), c = rnz(r, -5, 6)
    const x = fDiv(fSub(fr(b ** k), fr(c)), fr(a))
    const f = (xx: number) => (a * xx + c > 0 ? Math.log(a * xx + c) / Math.log(b) - k : 1)
    return exactSet(`Solve ${logT(b, `(${a === 1 ? '' : a}x ${sgnText(c)})`)} = ${k}. Give x as an exact fraction or whole number.`, [exF(x)], 'x', 'Rewrite in exponential form: log_b(A) = k means A = bᵏ. Then check A > 0.', [
      `Exponential form: ${a === 1 ? '' : a}x ${sgnText(c)} = ${b}${supInt(k)} = ${b ** k}.`, `Solve: ${tx(a)} = ${MN(String(b ** k - c))}, so x = ${fm(x)}.`, 'The argument equals a positive power, so the domain condition holds.'], undefined, (xx) => Math.abs(f(xx)) < 1e-9)
  } },
  { lesson: 'logarithms', level: 3, make: (r) => {
    // natural logs and e
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      const a = pick(r, [1, 2, 3, 5]), c = rnz(r, -5, 6), k = ri(r, 1, 3)
      const x = (Math.exp(k) - c) / a
      return approxSpec(`Solve ln(${a === 1 ? '' : a}x ${sgnText(c)}) = ${k}.`, x, 3, 'Undo ln by raising e to both sides: ln A = k means A = eᵏ.', [`Raise e to both sides: ${a === 1 ? '' : a}x ${sgnText(c)} = e${supInt(k)}.`, `e${supInt(k)} ≈ ${Math.exp(k).toFixed(4)}.`, `Solve: x = (e${supInt(k)} ${sgnText(-c)}) / ${a} ≈ ${x.toFixed(3)}.`], approxHolds((xx) => a * xx + c - Math.exp(k)))
    }
    if (kind === 2) {
      const a = pick(r, [2, 3, 4, 0.5].filter((v) => Number.isInteger(v))), N = ri(r, 3, 60)
      const x = Math.log(N) / a
      return approxSpec(`Solve e^(${a}x) = ${N}.`, x, 3, 'Take the natural log of both sides: ln(e^A) = A.', [`Take ln of both sides: ${a}x = ln ${N}.`, `ln ${N} ≈ ${Math.log(N).toFixed(4)}.`, `x = ln ${N} / ${a} ≈ ${x.toFixed(3)}.`], approxHolds((xx) => Math.exp(a * xx) - N, N))
    }
    // different bases: a^(x+c1) = b^(x+c2)
    for (;;) {
      const a = pick(r, [2, 3, 5]), b = pick(r, [2, 3, 4, 7]), c1 = ri(r, 0, 3), c2 = ri(r, 0, 4)
      if (a === b || (a === 2 && b === 4) || c1 === c2) continue
      const la = Math.log(a), lb = Math.log(b)
      const x = (c2 * lb - c1 * la) / (la - lb)
      if (Math.abs(x) > 40) continue
      return approxSpec(`Solve ${a}^(x ${c1 ? `+ ${c1}` : ''}) = ${b}^(x ${c2 ? `+ ${c2}` : ''}).`.replace('(x )', '(x)'), x, 3, 'Take logs of both sides, bring both exponents down, and collect the x terms.', [
        `Take ln of both sides: (x ${sgnText(c1)}) ln ${a} = (x ${sgnText(c2)}) ln ${b}.`.replace('+ 0', '').replace('x )', 'x)'),
        `Expand and collect the x terms: x ln ${a} ${MINUS} x ln ${b} = ${c2} ln ${b} ${MINUS} ${c1} ln ${a}.`,
        `Factor out x and divide: x = (${c2} ln ${b} ${MINUS} ${c1} ln ${a}) / (ln ${a} ${MINUS} ln ${b}) ≈ ${MN(x.toFixed(3))}.`,
      ], approxHolds((xx) => (xx + c1) * la - (xx + c2) * lb))
    }
  } },
  { lesson: 'logarithms', level: 3, make: (r) => {
    // growth and decay applications
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      const P = pick(r, [500, 1000, 2000, 5000, 10000]), rate = pick(r, [2, 3, 4, 5, 6, 8]), T = P * pick(r, [2, 3, 1.5, 2.5])
      const t = Math.log(T / P) / Math.log(1 + rate / 100)
      return approxSpec(`${P} dollars is invested at ${rate}% interest compounded annually. How many years until it is worth ${T} dollars?`, t, 1, 'The value after t years is P(1 + r)^t. Set it equal to the target and solve for t with logs.', [
        `After t years the value is ${P} × ${(1 + rate / 100).toFixed(2)}^t. Set it equal to ${T}.`, `${(1 + rate / 100).toFixed(2)}^t = ${T / P}.`, `Take logs: t = ln ${T / P} / ln ${(1 + rate / 100).toFixed(2)} ≈ ${t.toFixed(1)} years.`], approxHolds((x) => P * Math.pow(1 + rate / 100, x) - T, T), 't')
    }
    if (kind === 2) {
      const h = pick(r, [5, 8, 12, 20, 30]), pct = pick(r, [10, 20, 25, 40, 60])
      const t = h * Math.log(pct / 100) / Math.log(0.5)
      return approxSpec(`A substance has a half-life of ${h} days. How many days until only ${pct}% of it remains?`, t, 1, 'The amount left after t days is (1/2)^(t/h) of the original. Set that equal to the fraction remaining.', [
        `After t days the fraction remaining is (1/2)^(t/${h}). Set it equal to ${pct / 100}.`, `Take logs: (t/${h}) ln(1/2) = ln ${pct / 100}, so t = ${h} ln ${pct / 100} / ln 0.5.`, `That is about ${t.toFixed(1)} days.`], approxHolds((x) => Math.pow(0.5, x / h) - pct / 100), 't')
    }
    const rate = pick(r, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12])
    const t = Math.log(2) / Math.log(1 + rate / 100)
    return approxSpec(`How many years does it take for money to double at ${rate}% interest compounded annually?`, t, 1, 'Solve (1 + r)^t = 2 with logs.', [`Doubling means (1 + ${rate / 100})^t = 2.`, `Take logs: t = ln 2 / ln ${(1 + rate / 100).toFixed(2)}.`, `That is about ${t.toFixed(1)} years.`], approxHolds((x) => Math.pow(1 + rate / 100, x) - 2), 't')
  } },
]

export const POW_GENS: Gen[] = [...EXPONENTS, ...RADICALS, ...LOGS]
