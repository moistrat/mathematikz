/**
 * Question generators for Unit 9, lessons 'differentiation-rules' and 'implicit-higher'.
 *
 * Each derivative is written by hand from the rules, and calcSpec() then checks it against a numerical derivative
 * of the original function, so a wrong formula cannot reach a student.
 */
import { fr } from './algebra'
import { calcSpec, sup, cof, decSpec, dP, evP, fm, gcd, MN, must, numSpec, P, ri, rnz, S, w, xp } from './calcHelpers'
import { isDerivative, numDeriv } from './calculus'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const J = (...ps: string[]) => ps.filter(Boolean).join('+').replace(/\+-/g, '-')
const pw = (base: string, e: number) => (e === 1 ? base : e === 0 ? '1' : `${base}^${e}`)
/** c x^e fn as ASCII: tm(3, 2, 'sin(x)') = 3x^2*sin(x) */
const tm = (c: number, e: number, fn?: string) => {
  const coef = c === 1 && (e > 0 || fn) ? '' : c === -1 && (e > 0 || fn) ? '-' : String(c)
  const body = coef + xp(e)
  if (!fn) return body || '1'
  return body === '' || body === '-' ? body + fn : `${body}*${fn}`
}
const randPoly = (r: () => number, deg: number, zeros = true) => { const cs = Array.from({ length: deg + 1 }, () => (zeros && r() < 0.25 ? 0 : ri(r, -7, 8))); cs[deg] = rnz(r, 1, 6) * (r() < 0.3 ? -1 : 1); if (cs[1] === 0 && deg > 1 && cs.every((c, i) => i === 1 || c === 0)) cs[1] = 2; return cs }
const fx = (f: string) => `f(x) = ${S(f)}`
const dprompt = (f: string) => `Differentiate ${fx(f)}.`
const wf = (f: { n: number; d: number }) => (f.n < 0 ? `(${fm(f as never)})` : fm(f as never))
const lin = (a: number, b: number) => P([b, a])

/* ------------------------------------------------------------------ lesson: differentiation-rules */

interface Base { f: string; d: string; pos?: boolean; how: string }
const kc = (k: number) => (k === 1 ? '' : k === -1 ? '−' : A(k))
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const spw = (n: number) => `${n < 0 ? '⁻' : ''}${String(Math.abs(n)).split('').map((d) => SUPS[Number(d)]).join('')}`
const baseTerm = (r: () => number, kind: string, k: number): Base => {
  const n = ri(r, 1, 3)
  switch (kind) {
    case 'inv': return { f: `${k}/${pw('x', n)}`, d: `${-k * n}/${pw('x', n + 1)}`, how: `${A(k)}/x${n === 1 ? '' : spw(n)} = ${kc(k)}x${spw(-n)}, so the derivative is ${kc(-k * n)}x${spw(-n - 1)}.` }
    case 'sqrt': return { f: `${cof(k)}sqrt(x)`, d: `${k}/(2sqrt(x))`, pos: true, how: `${kc(k)}√x = ${kc(k)}x^(1/2), so the derivative is ${kc(k)}·(1/2)x^(−1/2) = ${A(k)}/(2√x).` }
    case 'cbrt': return { f: `${cof(k)}cbrt(x)`, d: `${k}/(3cbrt(x)^2)`, pos: true, how: `${kc(k)}∛x = ${kc(k)}x^(1/3), so the derivative is ${kc(k)}·(1/3)x^(−2/3) = ${A(k)}/(3∛x²).` }
    case 'x32': return { f: `${cof(k)}x^(3/2)`, d: `${3 * k}sqrt(x)/2`, pos: true, how: `${kc(k)}x^(3/2) has derivative ${kc(k)}·(3/2)x^(1/2) = ${A(3 * k)}√x/2.` }
    case 'exp': return { f: `${cof(k)}e^x`, d: `${cof(k)}e^x`, how: 'The derivative of eˣ is eˣ.' }
    case 'ln': return { f: `${cof(k)}ln(x)`, d: `${k}/x`, pos: true, how: 'The derivative of ln x is 1/x.' }
    case 'sin': return { f: `${cof(k)}sin(x)`, d: `${cof(k)}cos(x)`, how: 'The derivative of sin x is cos x.' }
    case 'cos': return { f: `${cof(k)}cos(x)`, d: `${cof(-k)}sin(x)`, how: 'The derivative of cos x is −sin x.' }
    case 'tan': return { f: `${cof(k)}tan(x)`, d: `${cof(k)}sec(x)^2`, how: 'The derivative of tan x is sec²x.' }
    default: { const e = ri(r, 2, 5); return { f: `${cof(k)}x^${e}`, d: `${k * e}${xp(e - 1)}`, how: `The derivative of ${kc(k)}x${spw(e)} is ${A(k * e)}${e === 2 ? 'x' : `x${spw(e - 1)}`}.` } }
  }
}
const sumOf = (a: Base, b: Base, c = 0): { f: string; d: string; pos: boolean } => ({ f: J(a.f, b.f, c ? String(c) : ''), d: J(a.d, b.d), pos: !!(a.pos || b.pos) })

function comboQuestion(r: () => number, lo: number, hi: number): Spec {
    // chain, product and quotient together
    const n = ri(r, 2, 4), k = ri(r, 2, 4), m = ri(r, 2, 4), p = ri(r, 1, 5)
    const t = ri(r, lo, hi)
    let f: string, d: string, how: string, pos = false
    switch (t) {
      case 1: f = `${xp(n)}*e^(${k}x)`; d = `(${P(Array.from({ length: n + 1 }, (_, i) => (i === n - 1 ? n : i === n ? k : 0)))})*e^(${k}x)`; how = `Product rule with u = x^${n}, v = e^(${k}x), where v′ = ${k}e^(${k}x) by the chain rule.`; break
      case 2: f = `e^(${k}x)*sin(${m}x)`; d = `e^(${k}x)*(${k}sin(${m}x)+${m}cos(${m}x))`; how = `Product rule: u′v + uv′ = ${k}e^(${k}x) sin(${m}x) + e^(${k}x) · ${m}cos(${m}x), then factor out e^(${k}x).`; break
      case 3: f = `x*sqrt(x+${p})`; d = `sqrt(x+${p})+x/(2sqrt(x+${p}))`; pos = true; how = `Product rule with u = x, v = √(x + ${p}); the chain rule gives v′ = 1/(2√(x + ${p})).`; break
      case 4: f = `ln(x^2+${p})/x`; d = `(2x^2/(x^2+${p})-ln(x^2+${p}))/x^2`; how = `Quotient rule with u = ln(x² + ${p}), whose derivative is 2x/(x² + ${p}), and v = x.`; break
      case 5: f = `(x^2+${p})^${n + 1}*(x+${k})`; d = `${2 * (n + 1)}x*(x^2+${p})^${n}*(x+${k})+(x^2+${p})^${n + 1}`; how = `Product rule, with the chain rule for (x² + ${p})^${n + 1}, whose derivative is ${2 * (n + 1)}x(x² + ${p})^${n}.`; break
      case 6: f = `sin(x)/e^(${k}x)`; d = `(cos(x)-${k}sin(x))/e^(${k}x)`; how = `Quotient rule: (cos x · e^(${k}x) − sin x · ${k}e^(${k}x))/e^(${2 * k}x), then cancel e^(${k}x).`; break
      case 7: f = 'ln(sin(x))'; d = 'cos(x)/sin(x)'; how = 'Chain rule: outer ln u → 1/u, inner u = sin x with u′ = cos x. The result is cot x.'; break
      default: f = 'e^(sqrt(x))'; d = 'e^(sqrt(x))/(2sqrt(x))'; pos = true; how = 'Chain rule: outer eᵘ → eᵘ, inner u = √x with u′ = 1/(2√x).'
    }
    return calcSpec(dprompt(f), f, d, 'Decide which rule is outermost (product, quotient or chain), apply it, and use the chain rule inside whenever a function of a function appears.', [how, 'Any equal form of the answer is accepted.'], { pos })
}

export const RULE_GENS: Gen[] = [
  { lesson: 'differentiation-rules', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 3, 5)), f = P(cs), d = P(dP(cs))
    return calcSpec(dprompt(f), f, d, 'Power rule: the derivative of cxⁿ is cn xⁿ⁻¹. Differentiate each term, and a constant becomes 0.', [`Bring each power down and reduce it by 1: ${cs.map((c, e) => (c === 0 || e === 0 ? '' : `${S(tm(c, e))} → ${S(tm(c * e, e - 1))}`)).filter(Boolean).join(',  ')}.`, 'A constant term differentiates to 0.', `f′(x) = ${S(d)}.`])
  } },
  { lesson: 'differentiation-rules', level: 1, make: (r) => {
    // negative and fractional powers mixed with a polynomial
    const a = baseTerm(r, pick(r, ['inv', 'sqrt', 'inv', 'cbrt']), rnz(r, -6, 8)), b = baseTerm(r, 'poly', rnz(r, -5, 6)), c = ri(r, -5, 6)
    const s = sumOf(a, b, c)
    return calcSpec(dprompt(s.f), s.f, s.d, 'Rewrite roots and reciprocals as powers of x (1/xⁿ = x⁻ⁿ, √x = x^(1/2)), then use the power rule on each term.', [a.how, b.how, 'The constant differentiates to 0, so add the pieces.'], { pos: s.pos })
  } },
  { lesson: 'differentiation-rules', level: 1, make: (r) => {
    // basic exponential, logarithm and trigonometric derivatives
    const kinds = ['exp', 'ln', 'sin', 'cos', 'tan']
    const i = ri(r, 0, 4); let j = ri(r, 0, 4); if (j === i) j = (j + 1) % 5
    const a = baseTerm(r, kinds[i], rnz(r, -6, 7)), b = baseTerm(r, pick(r, ['poly', kinds[j]]), rnz(r, -6, 7))
    const s = sumOf(a, b)
    return calcSpec(dprompt(s.f), s.f, s.d, 'Learn the basic derivatives: (eˣ)′ = eˣ, (ln x)′ = 1/x, (sin x)′ = cos x, (cos x)′ = −sin x, (tan x)′ = sec²x. Constants multiply through.', [a.how, b.how, `So f′(x) = ${S(s.d)}.`], { pos: s.pos })
  } },
  { lesson: 'differentiation-rules', level: 2, make: (r) => {
    // two roots or reciprocals and an x^(3/2)
    const ks = ['inv', 'sqrt', 'cbrt', 'x32']
    const i = ri(r, 0, 3); let j = ri(r, 0, 3); if (j === i) j = (j + 1) % 4
    const a = baseTerm(r, ks[i], rnz(r, -6, 8)), b = baseTerm(r, ks[j], rnz(r, -6, 8)), c = baseTerm(r, 'poly', rnz(r, -4, 5))
    const s = { f: J(a.f, b.f, c.f), d: J(a.d, b.d, c.d), pos: true }
    return calcSpec(dprompt(s.f), s.f, s.d, 'Write every term as a power of x, then use the power rule: cxⁿ has derivative cn xⁿ⁻¹.', [a.how, b.how, c.how, 'Add the derivatives of the terms.'], { pos: true })
  } },
  { lesson: 'differentiation-rules', level: 2, make: (r) => {
    // the chain rule
    const a = rnz(r, -4, 4), b = rnz(r, -5, 5), n = ri(r, 2, 7), k = ri(r, 2, 5), m = ri(r, 2, 5)
    const inner = lin(a, b), forms = ['pow', 'sin', 'cos', 'exp', 'ln', 'sqrt', 'pow2', 'exp2', 'sin2'] as const
    const t = pick(r, [...forms])
    let f: string, d: string, how: string, pos = false
    const ib = `(${inner})`
    switch (t) {
      case 'pow': f = `${ib}^${n}`; d = `${a * n}${ib}${n > 2 ? `^${n - 1}` : ''}`; how = `Outer: u^${n} → ${n}u^${n - 1}. Inner: u = ${S(inner)}, with u′ = ${A(a)}.`; break
      case 'sin': f = `sin${ib}`; d = `${cof(a)}cos${ib}`; how = `Outer: sin u → cos u. Inner: u = ${S(inner)}, u′ = ${A(a)}.`; break
      case 'cos': f = `cos${ib}`; d = `${cof(-a)}sin${ib}`; how = `Outer: cos u → −sin u. Inner: u = ${S(inner)}, u′ = ${A(a)}.`; break
      case 'exp': f = `e^${ib}`; d = `${cof(a)}e^${ib}`; how = `Outer: eᵘ → eᵘ. Inner: u = ${S(inner)}, u′ = ${A(a)}.`; break
      case 'ln': { const aa = ri(r, 1, 5), bb = ri(r, 1, 6), ii = lin(aa, bb); f = `ln(${ii})`; d = `${aa}/(${ii})`; pos = true; how = `Outer: ln u → 1/u. Inner: u = ${S(ii)}, u′ = ${aa}.`; break }
      case 'sqrt': { const aa = ri(r, 1, 5), bb = ri(r, 1, 6), ii = lin(aa, bb); f = `sqrt(${ii})`; d = `${aa}/(2sqrt(${ii}))`; pos = true; how = `Outer: √u → 1/(2√u). Inner: u = ${S(ii)}, u′ = ${aa}.`; break }
      case 'pow2': { const kk = ri(r, 1, 6), nn = ri(r, 2, 5); f = `(x^2+${kk})^${nn}`; d = `${2 * nn}x*(x^2+${kk})^${nn - 1}`.replace('^1', ''); how = `Outer: u^${nn} → ${nn}u^${nn - 1}. Inner: u = x² + ${kk}, u′ = 2x.`; break }
      case 'exp2': f = `e^(${k}x^2)`; d = `${2 * k}x*e^(${k}x^2)`; how = `Outer: eᵘ → eᵘ. Inner: u = ${k}x², u′ = ${2 * k}x.`; break
      default: f = `sin(${k}x)^2`; d = `${2 * k}sin(${k}x)*cos(${k}x)`; how = `Outer: u² → 2u. Inner: u = sin(${k}x), u′ = ${k}cos(${k}x).`
    }
    void m
    return calcSpec(dprompt(f), f, d, 'Chain rule: differentiate the outer function, leave the inside alone, then multiply by the derivative of the inside.', [how, `Multiply: f′(x) = ${S(d)}.`], { pos })
  } },
  { lesson: 'differentiation-rules', level: 2, make: (r) => {
    // the product rule
    const n = ri(r, 2, 4), p = rnz(r, -4, 5), q = ri(r, 1, 6)
    const t = ri(r, 1, 7)
    let f: string, d: string, how: string, pos = false
    switch (t) {
      case 1: f = tm(1, n, 'e^x'); d = `(${P(Array.from({ length: n + 1 }, (_, i) => (i === n - 1 ? n : i === n ? 1 : 0)))})*e^x`; how = `u = x^${n}, v = eˣ: u′v + uv′ = ${n}${xp(n - 1)}eˣ + x^${n}eˣ.`; break
      case 2: f = tm(1, n, 'sin(x)'); d = `${tm(n, n - 1, 'sin(x)')}+${tm(1, n, 'cos(x)')}`; how = `u = x^${n}, v = sin x: u′v + uv′ = ${n}${xp(n - 1)} sin x + x^${n} cos x.`; break
      case 3: f = tm(1, n, 'ln(x)'); d = `${tm(n, n - 1, 'ln(x)')}+${xp(n - 1) || '1'}`; pos = true; how = `u = x^${n}, v = ln x: u′v + uv′ = ${n}${xp(n - 1)} ln x + x^${n} · (1/x).`; break
      case 4: f = 'e^x*sin(x)'; d = 'e^x*sin(x)+e^x*cos(x)'; how = 'u = eˣ, v = sin x: u′v + uv′ = eˣ sin x + eˣ cos x.'; break
      case 5: f = tm(1, n, 'cos(x)'); d = `${tm(n, n - 1, 'cos(x)')}-${tm(1, n, 'sin(x)')}`; how = `u = x^${n}, v = cos x: u′v + uv′ = ${n}${xp(n - 1)} cos x − x^${n} sin x.`; break
      case 6: f = `(${lin(1, p)})*(x^2+${q})`; d = `(x^2+${q})+2x*(${lin(1, p)})`; how = `u = ${S(lin(1, p))}, v = x² + ${q}: u′v + uv′ = (x² + ${q}) + 2x(${S(lin(1, p))}).`; break
      default: f = 'sqrt(x)*sin(x)'; d = 'sin(x)/(2sqrt(x))+sqrt(x)*cos(x)'; pos = true; how = 'u = √x, v = sin x: u′v + uv′ = sin x/(2√x) + √x cos x.'
    }
    return calcSpec(dprompt(f), f, d, 'Product rule: (uv)′ = u′v + uv′. Name the two factors, differentiate each, and combine.', [how, 'It is fine to leave the answer unsimplified: any equal form is accepted.'], { pos })
  } },
  { lesson: 'differentiation-rules', level: 2, make: (r) => {
    // the quotient rule
    const n = ri(r, 2, 4), k = ri(r, 1, 6)
    const t = ri(r, 1, 6)
    let f: string, d: string, how: string, pos = false
    if (t === 1) {
      let a = rnz(r, -4, 5), b = rnz(r, -5, 5), c = rnz(r, -4, 4), dd = rnz(r, -5, 5)
      while (a * dd - b * c === 0) { a = rnz(r, -4, 5); b = rnz(r, -5, 5); c = rnz(r, -4, 4); dd = rnz(r, -5, 5) }
      f = `(${lin(a, b)})/(${lin(c, dd)})`; d = `${a * dd - b * c}/(${lin(c, dd)})^2`; how = `(u′v − uv′)/v² with u = ${S(lin(a, b))}, v = ${S(lin(c, dd))}: the top is ${a}(${S(lin(c, dd))}) − ${w(c)}(${S(lin(a, b))}) = ${A(a * dd - b * c)}.`
    } else if (t === 2) { f = `x/(x^2+${k})`; d = `(${k}-x^2)/(x^2+${k})^2`; how = `u = x, v = x² + ${k}: (1·(x² + ${k}) − x·2x)/(x² + ${k})² = (${k} − x²)/(x² + ${k})².` }
    else if (t === 3) { f = `e^x/${pw('x', n)}`; d = `e^x*(x-${n})/${pw('x', n + 1)}`; how = `u = eˣ, v = x^${n}: (eˣ·x^${n} − eˣ·${n}${xp(n - 1)})/x^${2 * n} = eˣ(x − ${n})/x^${n + 1}.` }
    else if (t === 4) { f = 'sin(x)/x'; d = '(x*cos(x)-sin(x))/x^2'; how = 'u = sin x, v = x: (cos x · x − sin x · 1)/x².' }
    else if (t === 5) { f = `ln(x)/${pw('x', n)}`; d = `(1-${n}ln(x))/${pw('x', n + 1)}`; pos = true; how = `u = ln x, v = x^${n}: ((1/x)x^${n} − ln x · ${n}${xp(n - 1)})/x^${2 * n} = (1 − ${n} ln x)/x^${n + 1}.` }
    else { f = `x^2/(x+${k})`; d = `(x^2+${2 * k}x)/(x+${k})^2`; how = `u = x², v = x + ${k}: (2x(x + ${k}) − x²)/(x + ${k})² = (x² + ${2 * k}x)/(x + ${k})².` }
    return calcSpec(dprompt(f), f, d, 'Quotient rule: (u/v)′ = (u′v − uv′)/v². Take care over the order of the two terms on top.', [how, 'Any equal form is accepted, so you need not expand the top.'], { pos })
  } },
  { lesson: 'differentiation-rules', level: 2, make: (r) => {
    // the value of a derivative at a point
    const t = ri(r, 1, 3), a = ri(r, -3, 3)
    if (t === 1) { const k = ri(r, 1, 5), n = ri(r, 2, 4), v = 2 * n * a * (a * a + k) ** (n - 1); const f = `(x^2+${k})^${n}`; must(Math.abs(numDeriv(f, a) - v) < 1e-2 * (1 + Math.abs(v)), 'chain value'); return numSpec(`Find f′(${A(a)}) for ${fx(f)}.`, fr(v), 'Differentiate with the chain rule, then substitute x.', [`f′(x) = ${n}(x² + ${k})${n === 2 ? '' : sup(n - 1)} × 2x = ${2 * n}x(x² + ${k})${n === 2 ? '' : sup(n - 1)}.`, `f′(${A(a)}) = ${2 * n} × ${w(a)} × ${a * a + k}${n === 2 ? '' : sup(n - 1)} = ${A(v)}.`]) }
    if (t === 2) { const p = rnz(r, -4, 5), q = ri(r, 1, 6), v = (a * a + q) + 2 * a * (a + p); const f = `(x${p > 0 ? '+' : ''}${p})(x^2+${q})`; return numSpec(`Find f′(${A(a)}) for ${fx(f)}.`, fr(v), 'Use the product rule, then substitute x.', [`f′(x) = (x² + ${q}) + 2x(${S(lin(1, p))}).`, `f′(${A(a)}) = ${a * a + q} + 2 × ${w(a)} × ${w(a + p)} = ${A(v)}.`]) }
    let p = rnz(r, -5, 5), q = rnz(r, -5, 5)
    while (a + q === 0 || p === q) { p = rnz(r, -5, 5); q = rnz(r, -5, 5) }
    const v = fr(q - p, (a + q) * (a + q)), f = `(x${p > 0 ? '+' : ''}${p})/(x${q > 0 ? '+' : ''}${q})`
    return numSpec(`Find f′(${A(a)}) for ${fx(f)}.`, v, 'Use the quotient rule, then substitute x.', [`f′(x) = ((x ${q < 0 ? '−' : '+'} ${Math.abs(q)}) − (x ${p < 0 ? '−' : '+'} ${Math.abs(p)}))/(x ${q < 0 ? '−' : '+'} ${Math.abs(q)})² = ${A(q - p)}/(x ${q < 0 ? '−' : '+'} ${Math.abs(q)})².`, `f′(${A(a)}) = ${A(q - p)}/${(a + q) ** 2} = ${fm(v)}.`])
  } },
  { lesson: 'differentiation-rules', level: 3, make: (r) => comboQuestion(r, 1, 4) },
  { lesson: 'differentiation-rules', level: 3, make: (r) => comboQuestion(r, 5, 8) },
]

/* ------------------------------------------------------------------ lesson: implicit-higher */

interface Curve { text: (c: number) => string; F: (x: number, y: number) => number; Fx: (x: number, y: number) => number; Fy: (x: number, y: number) => number; fx: string; fy: string }
const CURVES: Curve[] = [
  { text: (c) => `x² + xy + y² = ${A(c)}`, F: (x, y) => x * x + x * y + y * y, Fx: (x, y) => 2 * x + y, Fy: (x, y) => x + 2 * y, fx: '2x + y', fy: 'x + 2y' },
  { text: (c) => `x³ + y³ = ${A(c)}`, F: (x, y) => x ** 3 + y ** 3, Fx: (x) => 3 * x * x, Fy: (_, y) => 3 * y * y, fx: '3x²', fy: '3y²' },
  { text: (c) => `x²y + y³ = ${A(c)}`, F: (x, y) => x * x * y + y ** 3, Fx: (x, y) => 2 * x * y, Fy: (x, y) => x * x + 3 * y * y, fx: '2xy', fy: 'x² + 3y²' },
  { text: (c) => `xy + y² − x = ${A(c)}`, F: (x, y) => x * y + y * y - x, Fx: (_, y) => y - 1, Fy: (x, y) => x + 2 * y, fx: 'y − 1', fy: 'x + 2y' },
  { text: (c) => `2x² + 3xy − y² = ${A(c)}`, F: (x, y) => 2 * x * x + 3 * x * y - y * y, Fx: (x, y) => 4 * x + 3 * y, Fy: (x, y) => 3 * x - 2 * y, fx: '4x + 3y', fy: '3x − 2y' },
  { text: (c) => `x² − y² + xy = ${A(c)}`, F: (x, y) => x * x - y * y + x * y, Fx: (x, y) => 2 * x + y, Fy: (x, y) => x - 2 * y, fx: '2x + y', fy: 'x − 2y' },
]
function implicitPoint(r: () => number) {
  for (;;) {
    const cv = pick(r, CURVES), a = ri(r, -3, 3), b = ri(r, -3, 3)
    if (cv.Fy(a, b) === 0 || cv.Fx(a, b) === 0) continue
    return { cv, a, b, c: cv.F(a, b), m: fr(-cv.Fx(a, b), cv.Fy(a, b)) }
  }
}

export const HIGHER_GENS: Gen[] = [
  { lesson: 'implicit-higher', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 3, 5)), f = P(cs), d2 = P(dP(dP(cs)))
    return calcSpec(`Find the second derivative of ${fx(f)}.`, f, d2, 'The second derivative is the derivative of the derivative: differentiate twice.', [`f′(x) = ${S(P(dP(cs)))}.`, `f″(x) = ${S(d2)}.`], { order: 2 })
  } },
  { lesson: 'implicit-higher', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 3, 4)), a = ri(r, -3, 3), d2 = dP(dP(cs)), v = evP(d2, a)
    return numSpec(`Find f″(${A(a)}) for ${fx(P(cs))}.`, fr(v), 'Differentiate twice, then substitute x.', [`f′(x) = ${S(P(dP(cs)))} and f″(x) = ${S(P(d2))}.`, `f″(${A(a)}) = ${A(v)}.`])
  } },
  { lesson: 'implicit-higher', level: 1, make: (r) => {
    // implicit differentiation of a circle
    const [x0, y0] = pick(r, [[3, 4], [4, 3], [5, 12], [12, 5], [6, 8], [8, 6]]), sx = pick(r, [1, -1]), sy = pick(r, [1, -1])
    const a = sx * x0, b = sy * y0, R = Math.round(Math.sqrt(x0 * x0 + y0 * y0)), v = fr(-a, b)
    return numSpec(`The point (${A(a)}, ${A(b)}) lies on the circle x² + y² = ${R * R}. Find dy/dx at that point.`, v, 'Differentiate both sides with respect to x, remembering that y depends on x (so d(y²)/dx = 2y dy/dx). Then solve for dy/dx.', [`Differentiate: 2x + 2y dy/dx = 0, so dy/dx = −x/y.`, `At (${A(a)}, ${A(b)}): dy/dx = −${w(a)}/${w(b)} = ${fm(v)}.`])
  } },
  { lesson: 'implicit-higher', level: 2, make: (r) => {
    const { cv, a, b, c, m } = implicitPoint(r)
    return numSpec(`The point (${A(a)}, ${A(b)}) lies on the curve ${cv.text(c)}. Find dy/dx at that point.`, m, 'Differentiate every term with respect to x (use the product rule on xy, and the chain rule on powers of y, giving a factor dy/dx). Collect the dy/dx terms and solve.', [
      `Differentiate both sides. Collecting the dy/dx terms gives dy/dx = −(${cv.fx})/(${cv.fy}).`, `At (${A(a)}, ${A(b)}): the top is ${A(cv.Fx(a, b))} and the bottom is ${A(cv.Fy(a, b))}.`, `dy/dx = −(${A(cv.Fx(a, b))})/(${A(cv.Fy(a, b))}) = ${fm(m)}.`])
  } },
  { lesson: 'implicit-higher', level: 3, make: (r) => {
    const { cv, a, b, c, m } = implicitPoint(r)
    const icpt = fr(b, 1)
    const mm = m, v = fr(b * mm.d - a * mm.n, mm.d)
    void icpt
    return numSpec(`The curve ${cv.text(c)} passes through (${A(a)}, ${A(b)}). At what value of y does the tangent there cross the y-axis?`, v, 'Find dy/dx at the point by implicit differentiation, write the tangent y − b = m(x − a), and put x = 0.', [`Implicit differentiation gives dy/dx = −(${cv.fx})/(${cv.fy}) = ${fm(m)} at the point.`, `The tangent is y − ${w(b)} = ${wf(m)}(x − ${w(a)}).`, `Put x = 0: y = ${A(b)} − ${wf(m)} × ${w(a)} = ${fm(v)}.`])
  } },
  { lesson: 'implicit-higher', level: 2, make: (r) => {
    // parametric differentiation
    for (;;) {
      const p = rnz(r, 1, 4), q = ri(r, -3, 3), s = rnz(r, 1, 4), u = rnz(r, -5, 5), t0 = rnz(r, -3, 3)
      const dx = 2 * p * t0, dy = 3 * s * t0 * t0 + u
      if (dx === 0 || dy === 0) continue
      const v = fr(dy, dx)
      return numSpec(`A curve has parametric equations x = ${S(P([q, 0, p], 't'))}, y = ${S(P([0, u, 0, s], 't'))}. Find dy/dx when t = ${A(t0)}.`, v, 'For a parametric curve, dy/dx = (dy/dt) / (dx/dt).', [`dx/dt = ${S(P([0, 2 * p], 't'))} and dy/dt = ${S(P([u, 0, 3 * s], 't'))}.`, `At t = ${A(t0)}: dx/dt = ${A(dx)} and dy/dt = ${A(dy)}.`, `dy/dx = ${A(dy)}/${w(dx)} = ${fm(v)}.`])
    }
  } },
  { lesson: 'implicit-higher', level: 2, make: (r) => {
    // second derivatives of standard functions
    const k = ri(r, 2, 5), n = ri(r, 1, 3), t = ri(r, 1, 6)
    let f: string, d: string, how: string, pos = false
    switch (t) {
      case 1: f = `e^(${k}x)`; d = `${k * k}e^(${k}x)`; how = `(e^(${k}x))′ = ${k}e^(${k}x), and again: ${k * k}e^(${k}x).`; break
      case 2: f = `sin(${k}x)`; d = `${-k * k}sin(${k}x)`; how = `(sin ${k}x)′ = ${k}cos ${k}x, and (cos ${k}x)′ = −${k}sin ${k}x, so f″ = −${k * k}sin ${k}x.`; break
      case 3: f = `cos(${k}x)`; d = `${-k * k}cos(${k}x)`; how = `(cos ${k}x)′ = −${k}sin ${k}x, and again: −${k * k}cos ${k}x.`; break
      case 4: f = `ln(${k}x)`; d = '-1/x^2'; pos = true; how = '(ln kx)′ = 1/x = x⁻¹, and again: −x⁻² = −1/x².'; break
      case 5: f = `1/${pw('x', n)}`; d = `${n * (n + 1)}/${pw('x', n + 2)}`; how = `x${spw(-n)} → ${kc(-n)}x${spw(-n - 1)} → ${n * (n + 1)}x${spw(-n - 2)}.`; break
      default: f = 'x^2*e^x'; d = '(x^2+4x+2)*e^x'; how = 'f′ = (2x + x²)eˣ by the product rule. Differentiate again: (2 + 2x)eˣ + (2x + x²)eˣ = (x² + 4x + 2)eˣ.'
    }
    return calcSpec(`Find the second derivative of ${fx(f)}.`, f, d, 'Differentiate twice. Keep the rules for exponentials and trig functions in mind, and use the product rule where needed.', [how], { order: 2, pos })
  } },
  { lesson: 'implicit-higher', level: 3, make: (r) => {
    // the derivative of an inverse function
    for (;;) {
      const a = rnz(r, -3, 3), c = ri(r, 2, 5), f = (x: number) => x ** 3 + c * x, d = 3 * a * a + c
      return numSpec(`The function f(x) = x³ + ${c}x is one-to-one, with f(${A(a)}) = ${A(f(a))}. Find the gradient of the inverse function f⁻¹ at x = ${A(f(a))}.`, fr(1, d), 'If f(a) = b then (f⁻¹)′(b) = 1/f′(a). Find f′(a).', [`f′(x) = 3x² + ${c}, so f′(${A(a)}) = ${d}.`, `(f⁻¹)′(${A(f(a))}) = 1/f′(${A(a)}) = 1/${d}.`])
    }
  } },
  { lesson: 'implicit-higher', level: 3, make: (r) => {
    // inverse trigonometric derivatives
    const k = ri(r, 2, 4), t = ri(r, 1, 4)
    const kk = k === 1 ? '' : k
    if (t === 1) return calcSpec(`Differentiate f(x) = tan⁻¹(${kk}x).`, `atan(${kk}x)`, `${k}/(1+${k * k}x^2)`, 'The derivative of tan⁻¹ u is 1/(1 + u²), times u′ by the chain rule.', [`u = ${kk}x, u′ = ${k}.`, `f′(x) = ${k}/(1 + ${k * k}x²).`])
    if (t === 2) return calcSpec(`Differentiate f(x) = sin⁻¹(${kk}x).`, `asin(${kk}x)`, `${k}/sqrt(1-${k * k}x^2)`, 'The derivative of sin⁻¹ u is 1/√(1 − u²), times u′ by the chain rule.', [`u = ${kk}x, u′ = ${k}.`, `f′(x) = ${k}/√(1 − ${k * k}x²).`], { dom: [-1 / k, 1 / k] })
    if (t === 3) return calcSpec(`Differentiate f(x) = cos⁻¹(${kk}x).`, `acos(${kk}x)`, `-${k}/sqrt(1-${k * k}x^2)`, 'The derivative of cos⁻¹ u is −1/√(1 − u²), times u′ by the chain rule.', [`u = ${kk}x, u′ = ${k}.`, `f′(x) = −${k}/√(1 − ${k * k}x²).`], { dom: [-1 / k, 1 / k] })
    return calcSpec(`Differentiate f(x) = x tan⁻¹(x).`, 'x*atan(x)', 'atan(x)+x/(1+x^2)', 'Use the product rule: the derivative of tan⁻¹ x is 1/(1 + x²).', ['u = x, v = tan⁻¹ x: u′v + uv′ = tan⁻¹ x + x/(1 + x²).'])
  } },
  { lesson: 'implicit-higher', level: 3, make: (r) => {
    // exponentials with other bases, and logarithmic differentiation
    const a = pick(r, [2, 3, 5, 10]), t = ri(r, 1, 4), k = ri(r, 1, 3)
    if (t === 1) return calcSpec(`Differentiate f(x) = ${a}^x.`, `${a}^x`, `${a}^x*ln(${a})`, 'Write aˣ = e^(x ln a), or remember (aˣ)′ = aˣ ln a.', [`aˣ = e^(x ln a), so by the chain rule its derivative is ln a · e^(x ln a) = aˣ ln a.`, `f′(x) = ${a}ˣ ln ${a}.`])
    if (t === 2) return calcSpec(`Differentiate f(x) = x^x for x > 0.`, 'x^x', 'x^x*(ln(x)+1)', 'Take logarithms first: ln y = x ln x. Differentiate both sides implicitly and solve for dy/dx.', ['ln y = x ln x. Differentiate: (1/y) dy/dx = ln x + 1.', 'So dy/dx = y(ln x + 1) = xˣ(ln x + 1).'], { pos: true })
    if (t === 3) return calcSpec(`Differentiate f(x) = x^(${k + 1}x) for x > 0.`, `x^(${k + 1}x)`, `${k + 1}x^(${k + 1}x)*(ln(x)+1)`, 'Take logarithms first: ln y = (k + 1)x ln x. Differentiate both sides implicitly.', [`ln y = ${k + 1}x ln x, so (1/y) dy/dx = ${k + 1}(ln x + 1).`, `dy/dx = ${k + 1}x^(${k + 1}x)(ln x + 1).`], { pos: true })
    return calcSpec('Differentiate f(x) = x^(sin x) for x > 0.', 'x^sin(x)', 'x^sin(x)*(cos(x)*ln(x)+sin(x)/x)', 'Take logarithms first: ln y = sin x · ln x. Differentiate both sides implicitly.', ['ln y = sin x ln x, so (1/y) dy/dx = cos x ln x + sin x / x.', 'dy/dx = x^(sin x)(cos x ln x + sin x / x).'], { pos: true })
  } },
]

void decSpec; void gcd; void isDerivative
export type { Spec }
