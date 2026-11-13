/**
 * Question generators for Unit 10, lessons 'antiderivatives', 'definite-integrals' and 'integration-substitution'.
 * An antiderivative is accepted up to a constant, and is checked by differentiating it (inside the generator and in the tests).
 * Every definite integral is verified with Simpson's rule.
 */
import { fAdd, fr, fSub } from './algebra'
import { defCheck, dP, evP, fm, fracPiSpec, intSpec, MN, must, noneSpec, numSpec, P, polyDef, ri, rnz, S, sup, w, xp, cof, calcSpec } from './calcHelpers'
import { simpson } from './calculus'
import { evaluate } from './parse'
import type { Gen } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const pw = (b: string, e: number) => (e === 1 ? b : `${b}^${e}`)
const randPoly = (r: () => number, deg: number) => { const cs = Array.from({ length: deg + 1 }, () => (r() < 0.2 ? 0 : ri(r, -6, 8))); cs[deg] = rnz(r, 1, 6) * (r() < 0.3 ? -1 : 1); return cs }
/** one term of an antiderivative: (n/d) x^e as ASCII */
const ft = (c: { n: number; d: number }, e: number) => {
  if (c.n === 0) return ''
  const nn = Math.abs(c.n), sign = c.n < 0 ? '-' : ''
  const num = nn === 1 && e > 0 ? '' : String(nn)
  const body = `${num}${xp(e)}`
  return c.d === 1 ? `${sign}${body}` : `${sign}${body}/${c.d}`
}
/** the antiderivative of a polynomial with ascending coefficients, as ASCII */
export const antiP = (cs: number[]) => cs.map((c, e) => ft(fr(c, e + 1), e + 1)).filter(Boolean).join('+').replace(/\+-/g, '-') || '0'
const stepsOf = (cs: number[]) => cs.map((c, e) => (c === 0 ? '' : `${S(P(Array(e).fill(0).concat(c)))} → ${S(ft(fr(c, e + 1), e + 1))}`)).filter(Boolean).join(',  ')
const integral = (f: string) => `Find ∫ ${S(f)} dx.`
const evalAnti = (cs: number[], x: number) => cs.reduce((s, c, e) => fAdd(s, fr(c * x ** (e + 1), e + 1)), fr(0))
/** a nonzero integer with |value| of at least 2, so it never prints as a bare 1 */
const big = (r: () => number, lo: number, hi: number) => { let v = 0; while (Math.abs(v) < 2) v = ri(r, lo, hi); return v }
/** a Frac as text, in brackets when negative */
const wf = (f: { n: number; d: number }) => (f.n < 0 ? `(${fm(f as never)})` : fm(f as never))
/** x plus a constant as text with a proper sign: 19/3 − 2 */
const addTxt = (x: { n: number; d: number }, c: { n: number; d: number }) => `${fm(x as never)} ${c.n < 0 ? '−' : '+'} ${fm(fr(Math.abs(c.n), c.d) as never)}`
/** a polynomial with fraction coefficients (ascending) as text: (−1/2)t³ + 4t − 3 */
const polyF = (cs: { n: number; d: number }[], v: string) => {
  const terms = cs.map((c, e) => ({ c, e })).filter((t) => t.c.n !== 0).reverse()
  return terms.map((t, i) => {
    const mag = fr(Math.abs(t.c.n), t.c.d), isOne = mag.n === 1 && mag.d === 1
    const num = t.e > 0 && isOne ? '' : mag.d === 1 ? String(mag.n) : `(${mag.n}/${mag.d})`
    const body = `${num}${t.e === 0 ? '' : t.e === 1 ? v : `${v}${sup(t.e)}`}`
    return i === 0 ? `${t.c.n < 0 ? '−' : ''}${body}` : ` ${t.c.n < 0 ? '−' : '+'} ${body}`
  }).join('')
}

export const ANTI_GENS: Gen[] = [
  { lesson: 'antiderivatives', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 2, 4)), f = P(cs)
    return intSpec(integral(f), f, antiP(cs), 'Reverse the power rule: add 1 to the power and divide by the new power. Do not forget + C.', [`Raise each power by 1 and divide by it: ${stepsOf(cs)}.`, `Add the constant of integration: ${S(antiP(cs))} + C.`])
  } },
  { lesson: 'antiderivatives', level: 1, make: (r) => {
    // reciprocals and roots
    const k = big(r, -6, 8), n = ri(r, 2, 4), m = big(r, -4, 6), t = ri(r, 1, 2)
    if (t === 1) { const f = `${k}/x^${n}+${m}x`.replace('+-', '-'), F = `${n === 2 ? `${-k}/x` : `${-k}/(${n - 1}x^${n - 1})`}+${m}x^2/2`.replace('+-', '-'); return intSpec(integral(f), f, F, 'Write 1/xⁿ as x⁻ⁿ, then use the power rule: add 1 to the power and divide by it.', [`${A(k)}/x${sup(n)} = ${A(k)}x⁻${sup(n)}, whose antiderivative is ${A(-k)}/${n - 1 === 1 ? 'x' : `(${n - 1}x${sup(n - 1)})`}.`, `${m}x has antiderivative ${m}x²/2.`, 'Add + C.']) }
    const f = `${cof(k)}sqrt(x)+${m}`.replace('+-', '-'), F = `${2 * k}x*sqrt(x)/3+${m}x`.replace('+-', '-')
    return intSpec(integral(f), f, F, 'Write √x as x^(1/2). The antiderivative of x^(1/2) is x^(3/2)/(3/2) = (2/3)x^(3/2).', [`${cof(k).replace('-', '−')}√x = ${cof(k).replace('-', '−')}x^(1/2), with antiderivative ${cof(k).replace('-', '−')}·(2/3)x^(3/2) = ${A(2 * k)}x√x/3.`, `The constant ${A(m)} has antiderivative ${A(m)}x.`, 'Add + C.'], { pos: true })
  } },
  { lesson: 'antiderivatives', level: 1, make: (r) => {
    // standard antiderivatives
    const k = rnz(r, -6, 7), m = big(r, -5, 6), i = ri(r, 0, 4)
    const T = [
      { f: `${cof(k)}e^x`, F: `${cof(k)}e^x`, how: 'The antiderivative of eˣ is eˣ.' },
      { f: `${cof(k)}sin(x)`, F: `${cof(-k)}cos(x)`, how: 'The antiderivative of sin x is −cos x.' },
      { f: `${cof(k)}cos(x)`, F: `${cof(k)}sin(x)`, how: 'The antiderivative of cos x is sin x.' },
      { f: `${k}/x`, F: `${cof(k)}ln(abs(x))`, how: 'The antiderivative of 1/x is ln|x|.' },
      { f: `${cof(k)}sec(x)^2`, F: `${cof(k)}tan(x)`, how: 'The antiderivative of sec²x is tan x.' },
    ]
    const a = T[i], b = { f: `${m}x`, F: `${m}x^2/2`, how: `${A(m)}x has antiderivative ${A(m)}x²/2.` }
    const f = `${a.f}+${b.f}`.replace('+-', '-'), F = `${a.F}+${b.F}`.replace('+-', '-')
    return intSpec(integral(f), f, F, 'Learn the standard antiderivatives: eˣ → eˣ, sin x → −cos x, cos x → sin x, 1/x → ln|x|, sec²x → tan x.', [a.how, b.how, 'Add + C.'])
  } },
  { lesson: 'antiderivatives', level: 2, make: (r) => {
    // find f(c) from f'(x) and one point
    let cs = randPoly(r, ri(r, 1, 3)), a = ri(r, -2, 3), b = ri(r, -9, 9), c = a + rnz(r, -3, 3)
    while (fSub(fr(b), evalAnti(cs, a)).n === 0 || evalAnti(cs, c).n === 0 || fAdd(evalAnti(cs, c), fSub(fr(b), evalAnti(cs, a))).n === 0) { cs = randPoly(r, ri(r, 1, 3)); a = ri(r, -2, 3); b = ri(r, -9, 9); c = a + rnz(r, -3, 3) }
    const v = fAdd(fSub(evalAnti(cs, c), evalAnti(cs, a)), fr(b))
    const C = fSub(fr(b), evalAnti(cs, a))
    return numSpec(`A curve has gradient function f′(x) = ${S(P(cs))} and passes through the point (${A(a)}, ${A(b)}). Find f(${A(c)}).`, v, 'Integrate to get f(x) + C, then use the given point to find C.', [`f(x) = ${S(antiP(cs))} + C.`, `At x = ${A(a)}: ${A(b)} = ${wf(evalAnti(cs, a))} + C, so C = ${fm(C)}.`, `f(${A(c)}) = ${addTxt(evalAnti(cs, c), C)} = ${fm(v)}.`])
  } },
  { lesson: 'antiderivatives', level: 2, make: (r) => {
    // find the constant of integration
    let cs = randPoly(r, ri(r, 1, 3)), a = ri(r, -2, 3), b = ri(r, -9, 9), C = fSub(fr(b), evalAnti(cs, a))
    while (evalAnti(cs, a).n === 0 || C.n === 0) { cs = randPoly(r, ri(r, 1, 3)); a = ri(r, -2, 3); b = ri(r, -9, 9); C = fSub(fr(b), evalAnti(cs, a)) }
    return numSpec(`Given that dy/dx = ${S(P(cs))} and y = ${A(b)} when x = ${A(a)}, find the constant of integration C in y = ${S(antiP(cs))} + C.`, C, 'Substitute the known pair of values into the antiderivative and solve for C.', [`Substitute x = ${A(a)}, y = ${A(b)}: ${A(b)} = ${wf(evalAnti(cs, a))} + C.`, `So C = ${A(b)} − ${wf(evalAnti(cs, a))} = ${fm(C)}.`])
  } },
  { lesson: 'antiderivatives', level: 2, make: (r) => {
    // velocity to position
    let cs = [ri(r, -4, 6), ri(r, -6, 6), rnz(r, 1, 3)], s0 = rnz(r, -5, 9), T = ri(r, 1, 4)
    while (evalAnti(cs, T).n === 0 || fAdd(evalAnti(cs, T), fr(s0)).n === 0) { cs = [ri(r, -4, 6), ri(r, -6, 6), rnz(r, 1, 3)]; s0 = rnz(r, -5, 9); T = ri(r, 1, 4) }
    const v = fAdd(evalAnti(cs, T), fr(s0))
    return numSpec(`A particle moves along a line with velocity v(t) = ${S(P(cs, 't'))} m/s. At time t = 0 its position is ${A(s0)} m. Find its position at t = ${T} s.`, v, 'Position is the antiderivative of velocity. Add a constant and use the starting position to find it.', [`s(t) = ${polyF(cs.map((c, e) => fr(c, e + 1)).reduce((acc: { n: number; d: number }[], c, e) => { acc[e + 1] = c; return acc }, [fr(0)]), 't')} + C.`, `s(0) = ${A(s0)} gives C = ${A(s0)}.`, `s(${T}) = ${addTxt(evalAnti(cs, T), fr(s0))} = ${fm(v)} m.`])
  } },
  { lesson: 'antiderivatives', level: 3, make: (r) => {
    // acceleration to position
    const al = big(r, -4, 6), be = big(r, -6, 6), v0 = big(r, -5, 8), s0 = big(r, -5, 8), T = ri(r, 1, 4)
    const vcs = [v0, be, al / 2], vfr = [fr(v0), fr(be), fr(al, 2)]
    const sT = fAdd(fr(s0), fr(v0 * T + (be * T * T) / 2 + 0, 1))
    const tot = fAdd(sT, fr(al * T ** 3, 6))
    void vcs; void vfr
    return numSpec(`A particle has acceleration a(t) = ${S(P([be, al], 't'))} m/s². At t = 0 its velocity is ${A(v0)} m/s and its position is ${A(s0)} m. Find its position at t = ${T} s.`, tot, 'Integrate once for the velocity and use v(0). Integrate again for the position and use s(0).', [`v(t) = ${polyF([fr(0), fr(be), fr(al, 2)], 't')} + C₁. Since v(0) = ${A(v0)}, C₁ = ${A(v0)}.`, `s(t) = ${polyF([fr(0), fr(v0), fr(be, 2), fr(al, 6)], 't')} + C₂, and s(0) = ${A(s0)} gives C₂ = ${A(s0)}.`, `s(${T}) = ${fm(tot)} m.`,])
  } },
  { lesson: 'antiderivatives', level: 3, make: (r) => {
    // second derivative to function value
    const cs = randPoly(r, ri(r, 1, 2)), m = ri(r, -6, 6), n = ri(r, -6, 6), T = rnz(r, -2, 3)
    const fp = [m, ...cs.map((c, e) => fr(c, e + 1))] // f' ascending as fractions
    let val = fr(n)
    // f(T) = n + m T + sum c/((e+1)(e+2)) T^(e+2)
    val = fAdd(val, fr(m * T))
    cs.forEach((c, e) => { val = fAdd(val, fr(c * T ** (e + 2), (e + 1) * (e + 2))) })
    void fp
    return numSpec(`Given that f″(x) = ${S(P(cs))}, f′(0) = ${A(m)} and f(0) = ${A(n)}, find f(${A(T)}).`, val, 'Integrate twice. Each integration brings a constant, found from f′(0) and f(0).', [`f′(x) = ${S(antiP(cs))} + C₁, and f′(0) = ${A(m)} gives C₁ = ${A(m)}.`, `Integrating again: f(x) = ∫ f′ dx = (an expression) + C₂, with f(0) = ${A(n)} giving C₂ = ${A(n)}.`, `f(${A(T)}) = ${fm(val)}.`])
  } },
]

/* ------------------------------------------------------------------ definite integrals */

export const DEF_GENS: Gen[] = [
  { lesson: 'definite-integrals', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 1, 3)), a = ri(r, -2, 1), b = a + ri(r, 1, 4), v = polyDef(cs, a, b)
    defCheck(P(cs), a, b, v.n / v.d)
    return numSpec(`Evaluate ∫ from ${A(a)} to ${b} of (${S(P(cs))}) dx.`, v, 'Find an antiderivative F, then compute F(b) − F(a).', [`An antiderivative is F(x) = ${S(antiP(cs))}.`, `F(${b}) = ${fm(evalAnti(cs, b))} and F(${A(a)}) = ${fm(evalAnti(cs, a))}.`, `F(${b}) − F(${A(a)}) = ${fm(v)}.`])
  } },
  { lesson: 'definite-integrals', level: 1, make: (r) => {
    // area under a straight line
    const k = ri(r, 1, 5), m = ri(r, 0, 6), a = ri(r, 0, 2), b = a + ri(r, 1, 4)
    const v = polyDef([m, k], a, b)
    defCheck(P([m, k]), a, b, v.n / v.d)
    return numSpec(`Find the area under the line y = ${S(P([m, k]))} between x = ${a} and x = ${b}.`, v, 'The area under a curve is the definite integral. (You can check a straight line with the trapezium formula.)', [`Area = ∫ from ${a} to ${b} of (${S(P([m, k]))}) dx = [${S(antiP([m, k]))}] evaluated from ${a} to ${b}.`, `= ${fm(evalAnti([m, k], b))} − ${fm(evalAnti([m, k], a))} = ${fm(v)}.`])
  } },
  { lesson: 'definite-integrals', level: 1, make: (r) => {
    // properties of definite integrals
    const p = rnz(r, -8, 9), q = rnz(r, -8, 9), c = ri(r, 2, 5), t = ri(r, 1, 3)
    if (t === 1) return numSpec(`Given that ∫ from 1 to 4 of f(x) dx = ${A(p)} and ∫ from 4 to 9 of f(x) dx = ${A(q)}, find ∫ from 1 to 9 of f(x) dx.`, fr(p + q), 'Integrals over adjacent intervals add.', [`∫ from 1 to 9 = ∫ from 1 to 4 + ∫ from 4 to 9 = ${A(p)} + ${w(q)} = ${A(p + q)}.`])
    if (t === 2) return numSpec(`Given that ∫ from 0 to 5 of f(x) dx = ${A(p)}, find ∫ from 5 to 0 of f(x) dx.`, fr(-p), 'Swapping the limits changes the sign.', [`∫ from 5 to 0 = −∫ from 0 to 5 = ${A(-p)}.`])
    return numSpec(`Given that ∫ from 0 to 3 of f(x) dx = ${A(p)} and ∫ from 0 to 3 of g(x) dx = ${A(q)}, find ∫ from 0 to 3 of (${c}f(x) − g(x)) dx.`, fr(c * p - q), 'Integrals are linear: constants come out and sums split.', [`${c}∫f − ∫g = ${c} × ${w(p)} − ${w(q)} = ${A(c * p - q)}.`])
  } },
  { lesson: 'definite-integrals', level: 2, make: (r) => {
    // trigonometric and exponential definite integrals with exact answers
    const k = ri(r, 1, 6), a = ri(r, 2, 9), t = ri(r, 1, 4)
    if (t === 1) { const f = `sin(${k === 1 ? '' : k}x)`; defCheck(f, 0, Math.PI / k, 2 / k); return numSpec(`Evaluate ∫ from 0 to π/${k} of sin(${k === 1 ? '' : k}x) dx.`.replace('π/1 ', 'π '), fr(2, k), 'The antiderivative of sin(kx) is −cos(kx)/k.', [`[−cos(${k === 1 ? '' : k}x)/${k}] from 0 to π/${k} = (−cos π)/${k} − (−cos 0)/${k}.`, `= 1/${k} + 1/${k} = ${fm(fr(2, k))}.`]) }
    if (t === 2) { const f = `cos(${k === 1 ? '' : k}x)`; defCheck(f, 0, Math.PI / (2 * k), 1 / k); return numSpec(`Evaluate ∫ from 0 to π/${2 * k} of cos(${k === 1 ? '' : k}x) dx.`, fr(1, k), 'The antiderivative of cos(kx) is sin(kx)/k.', [`[sin(${k === 1 ? '' : k}x)/${k}] from 0 to π/${2 * k} = sin(π/2)/${k} − sin 0/${k} = ${fm(fr(1, k))}.`]) }
    if (t === 3) { const f = 'e^x'; defCheck(f, 0, Math.log(a), a - 1); return numSpec(`Evaluate ∫ from 0 to ln ${a} of eˣ dx.`, fr(a - 1), 'The antiderivative of eˣ is eˣ, and e^(ln a) = a.', [`[eˣ] from 0 to ln ${a} = e^(ln ${a}) − e⁰ = ${a} − 1 = ${a - 1}.`]) }
    defCheck('1/x', 1, a, Math.log(a))
    return numSpec(`Evaluate ∫ from 1 to e of ${k}/x dx.`, fr(k), 'The antiderivative of 1/x is ln x, and ln e = 1.', [`[${k} ln x] from 1 to e = ${k}(ln e − ln 1) = ${k}(1 − 0) = ${k}.`])
  } },
  { lesson: 'definite-integrals', level: 2, make: (r) => {
    // area between a line and a parabola
    const k = ri(r, 2, 7), t = ri(r, 1, 2)
    const v = fr(k ** 3, 6)
    if (t === 1) { defCheck(`${k}x-x^2`, 0, k, k ** 3 / 6); return numSpec(`Find the area enclosed between the curve y = ${S(`${k}x-x^2`)} and the x-axis.`, v, 'The curve meets the x-axis where y = 0. Integrate between those points.', [`${S(`${k}x-x^2`)} = x(${k} − x) = 0 at x = 0 and x = ${k}.`, `Area = ∫ from 0 to ${k} = [${k}x²/2 − x³/3] = ${k}³/2 − ${k}³/3 = ${fm(v)}.`]) }
    defCheck(`${k}x-x^2`, 0, k, k ** 3 / 6)
    return numSpec(`Find the area enclosed between the parabola y = x² and the line y = ${k}x.`, v, 'Find where the curves meet, then integrate (top curve) − (bottom curve) between those x-values.', [`x² = ${k}x gives x = 0 or x = ${k}. On that interval the line is above the parabola.`, `Area = ∫ from 0 to ${k} of (${k}x − x²) dx = [${k}x²/2 − x³/3] = ${fm(v)}.`])
  } },
  { lesson: 'definite-integrals', level: 2, make: (r) => {
    // a left or right Riemann sum
    const a = ri(r, 0, 2), n = 4, h = pick(r, [1, 1, 2]) / 2 === 1 ? 1 : 1, width = n * h, left = r() < 0.5, c = ri(r, 1, 3)
    const f = (x: number) => c * x * x + 1
    let tot = 0; for (let i = 0; i < n; i++) tot += f(a + (left ? i : i + 1) * h)
    return numSpec(`Estimate the area under y = ${S(`${c === 1 ? '' : c}x^2+1`)} from x = ${a} to x = ${a + width} using ${n} rectangles of equal width and the ${left ? 'left' : 'right'} end of each. (Give the sum.)`, fr(tot * h), `Each rectangle has width ${h}. Its height is f at its ${left ? 'left' : 'right'} end. Add width × height for each.`, [`The x-values used are ${Array.from({ length: n }, (_, i) => a + (left ? i : i + 1) * h).join(', ')}.`, `The heights are ${Array.from({ length: n }, (_, i) => f(a + (left ? i : i + 1) * h)).join(', ')}.`, `Sum = ${h} × ${tot} = ${fm(fr(tot * h))}.`])
  } },
  { lesson: 'definite-integrals', level: 2, make: (r) => {
    // the trapezium rule
    const c = ri(r, 1, 3), a = ri(r, 0, 2), n = pick(r, [3, 4, 5]), h = 1, f = (x: number) => c * x * x + x + 1
    const ys = Array.from({ length: n + 1 }, (_, i) => f(a + i * h))
    const T = fr(ys[0] + ys[n] + 2 * ys.slice(1, n).reduce((s, y) => s + y, 0), 2)
    return numSpec(`The table gives y = ${S(`${c === 1 ? '' : c}x^2+x+1`)} at x = ${Array.from({ length: n + 1 }, (_, i) => a + i).join(', ')}: y = ${ys.join(', ')}. Use the trapezium rule with ${n} strips to estimate the area under the curve.`, T, 'Trapezium rule: (h/2)(first + last + 2 × the sum of the middle values).', [`h = 1, first = ${ys[0]}, last = ${ys[n]}, middle sum = ${ys.slice(1, n).reduce((s, y) => s + y, 0)}.`, `Area ≈ (1/2)(${ys[0]} + ${ys[n]} + 2 × ${ys.slice(1, n).reduce((s, y) => s + y, 0)}) = ${fm(T)}.`])
  } },
  { lesson: 'definite-integrals', level: 3, make: (r) => {
    // total distance when the velocity changes sign
    for (;;) {
      const p = ri(r, 1, 3), q = p + ri(r, 1, 3), T = q + ri(r, 1, 2)
      const cs = [p * q, -(p + q), 1]
      const v = (x: number) => polyDef(cs, 0, x)
      const part = (a: number, b: number) => polyDef(cs, a, b)
      const tot = fAdd(fSub(fAdd(part(0, p), fr(0)), part(p, q)), part(q, T))
      const disp = v(T)
      must(Math.abs(simpson(`abs(${P(cs)})`, 0, T, 4000) - tot.n / tot.d) < 1e-3, 'distance')
      const dist = r() < 0.5
      return numSpec(`A particle has velocity v(t) = ${S(P(cs, 't'))} m/s for 0 ≤ t ≤ ${T}. Find the ${dist ? 'total distance travelled' : 'displacement (change in position)'}.`, dist ? tot : disp, dist ? 'Distance needs |v|: find where v changes sign, and integrate each piece, taking the positive value of each.' : 'Displacement is the plain integral of v, with signs.', dist ? [`v = (t − ${p})(t − ${q}) changes sign at t = ${p} and t = ${q}.`, `∫ from 0 to ${p} = ${fm(part(0, p))}, ∫ from ${p} to ${q} = ${fm(part(p, q))} (negative), ∫ from ${q} to ${T} = ${fm(part(q, T))}.`, `Distance = ${fm(part(0, p))} + ${fm(fr(-part(p, q).n, part(p, q).d))} + ${fm(part(q, T))} = ${fm(tot)} m.`] : [`Displacement = ∫ from 0 to ${T} of v dt = [${S(antiP(cs).replace(/x/g, 't'))}] from 0 to ${T}.`, `= ${fm(disp)} m.`])
    }
  } },
  { lesson: 'definite-integrals', level: 3, make: (r) => {
    // the fundamental theorem: differentiate an integral
    const t = ri(r, 1, 6), k = ri(r, 2, 4), lo0 = ri(r, 0, 2)
    const cases = [
      { f: 'sin(x)', sh: 'sin t', up: 'x', ans: 'sin(x)', lo: 0, up2: 'x' },
      { f: 'sin(x)', sh: 'sin t', up: `${k}x`, ans: `${k}sin(${k}x)`, lo: 0, up2: `${k}x` },
      { f: 'e^x', sh: 'eᵗ', up: 'x^2', ans: '2x*e^(x^2)', lo: 1, up2: 'x^2' },
      { f: '1/(1+x^2)', sh: '1/(1 + t²)', up: 'x^3', ans: '3x^2/(1+x^6)', lo: 0, up2: 'x^3' },
      { f: 'cos(x)', sh: 'cos t', up: 'x^2', ans: '2x*cos(x^2)', lo: 0, up2: 'x^2' },
      { f: 'e^x', sh: 'eᵗ', up: `${k}x`, ans: `${k}e^(${k}x)`, lo: 0, up2: `${k}x` },
    ]
    const c = { ...cases[t - 1], lo: lo0 }
    const G = (x: number) => simpson(c.f, c.lo, evalU(c.up2, x), 600)
    const x0 = 0.8, h = 1e-3
    const num = (G(x0 + h) - G(x0 - h)) / (2 * h)
    must(Math.abs(num - evalU(c.ans, x0)) < 1e-2 * (1 + Math.abs(num)), `FTC ${c.f} up to ${c.up}`)
    const shownF = c.sh, up = S(c.up)
    return calcSpec(`Find d/dx of the integral from ${c.lo} to ${up} of ${shownF} dt.`, '0', c.ans, 'Fundamental theorem: d/dx of ∫ from a to g(x) of f(t) dt equals f(g(x)) × g′(x).', [`The upper limit is g(x) = ${up}, with g′(x) = ${numDerivText(c.up)}.`, `By the theorem the derivative is f(g(x)) g′(x) = ${S(c.ans)}.`], { check: false })
  } },
  { lesson: 'definite-integrals', level: 3, make: (r) => {
    // area between curves, using symmetry
    const k = ri(r, 2, 6)
    if (r() < 0.5) {
      const v = fr(k ** 4, 2)
      defCheck(`abs(${k * k}x-x^3)`, -k, k, k ** 4 / 2)
      return numSpec(`Find the total area enclosed between the curves y = x³ and y = ${k * k}x.`, v, 'Find the intersections, and use the symmetry: the region is the same on both sides of the origin.', [`x³ = ${k * k}x gives x = 0 or x = ±${k}.`, `For 0 ≤ x ≤ ${k} the line is above the cubic, so that half is ∫ (${k * k}x − x³) dx = [${k * k}x²/2 − x⁴/4] = ${k ** 4}/2 − ${k ** 4}/4 = ${fm(fr(k ** 4, 4))}.`, `By symmetry the other half is the same: total ${fm(v)}.`])
    }
    const v = fr(4 * k ** 3, 3)
    defCheck(`${k * k}-x^2`, -k, k, (4 * k ** 3) / 3)
    return numSpec(`Find the area enclosed between the parabola y = x² and the line y = ${k * k}.`, v, 'Find the intersections, and use the symmetry about the y-axis.', [`x² = ${k * k} gives x = ±${k}. Between them the line is above the parabola.`, `Area = ∫ from −${k} to ${k} of (${k * k} − x²) dx = 2[${k * k}x − x³/3] from 0 to ${k} = 2(${k ** 3 * 1} · 2/3)... = 2(${k * k * k} − ${k ** 3}/3).`.replace(/= 2\(.*$/, `= 2(${k ** 3} − ${k ** 3}/3) = ${fm(v)}.`)])
  } },
]
const evalU = (src: string, x: number) => evaluate(src, { x })
const numDerivText = (up: string) => (up === 'x' ? '1' : up === 'x^2' ? '2x' : up === 'x^3' ? '3x²' : up.replace('x', ''))

/* ------------------------------------------------------------------ substitution */

export const SUB_GENS: Gen[] = [
  { lesson: 'integration-substitution', level: 1, make: (r) => {
    // linear substitution: powers and exponentials
    const a = big(r, -4, 5), b = rnz(r, -5, 6), n = ri(r, 2, 6), t = ri(r, 1, 2)
    const lin = P([b, a])
    if (t === 1) { const f = `(${lin})^${n}`; const F = `${a < 0 ? '-' : ''}(${lin})^${n + 1}/${Math.abs(a) * (n + 1)}`; return intSpec(integral(f), f, F, 'Let u = ax + b. Then dx = du/a, and the integral becomes (1/a)∫uⁿ du.', [`Let u = ${S(lin)}, so du = ${A(a)} dx.`, `∫ uⁿ du/(${A(a)}) = u${sup(n + 1)}/(${A(a)} × ${n + 1}).`, `Substitute back: ${a < 0 ? '−' : ''}(${S(lin)})${sup(n + 1)}/${Math.abs(a) * (n + 1)} + C.`]) }
    const f = `e^(${lin})`, F = `${a < 0 ? '-' : ''}e^(${lin})${Math.abs(a) === 1 ? '' : `/${Math.abs(a)}`}`
    return intSpec(integral(f), f, F, 'Let u = ax + b. Then dx = du/a, and the integral becomes (1/a)∫eᵘ du.', [`Let u = ${S(lin)}, du = ${A(a)} dx.`, `∫ eᵘ du/(${A(a)}) = eᵘ/(${A(a)}).`, `Substitute back: ${a < 0 ? '−' : ''}e^(${S(lin)})${Math.abs(a) === 1 ? '' : `/${Math.abs(a)}`} + C.`])
  } },
  { lesson: 'integration-substitution', level: 1, make: (r) => {
    // linear substitution: trigonometric, reciprocal, root
    const a = ri(r, 2, 5), b = ri(r, 1, 6), c = rnz(r, -4, 5), i = ri(r, 1, 4)
    const lin = P([b, a])
    if (i === 1) { const f = `sin(${a}x)`; return intSpec(integral(f), f, `-cos(${a}x)/${a}`, 'Let u = kx. Then dx = du/k.', [`∫ sin(${a}x) dx = −cos(${a}x)/${a} + C.`]) }
    if (i === 2) { const f = `cos(${lin})`; return intSpec(integral(f), f, `sin(${lin})/${a}`, 'Let u = ax + b, so dx = du/a.', [`u = ${S(lin)}, du = ${a} dx, so ∫ cos u du/${a} = sin u/${a}.`, `The answer is sin(${S(lin)})/${a} + C.`]) }
    if (i === 3) { const f = `${c}/(${lin})`; return intSpec(integral(f), f, `${c}ln(${lin})/${a}`, 'The antiderivative of 1/u is ln u. With u = ax + b divide by a.', [`u = ${S(lin)}, du = ${a} dx, so ∫ ${A(c)}/u × du/${a} = ${A(c)}/${a} × ln u.`, `(For ${S(lin)} > 0; in general use ln|${S(lin)}|.)`], { pos: true }) }
    const f = `sqrt(${lin})`, F = `2(${lin})^(3/2)/${3 * a}`
    return intSpec(integral(f), f, F, 'Write the root as u^(1/2) with u = ax + b. Then dx = du/a.', [`u = ${S(lin)}, du = ${a} dx, so ∫ u^(1/2) du/${a} = (2/3)u^(3/2)/${a}.`, `The answer is 2(${S(lin)})^(3/2)/${3 * a} + C.`], { pos: true })
  } },
  { lesson: 'integration-substitution', level: 2, make: (r) => {
    // recognise f'(g) g'
    const k = ri(r, 1, 6), n = ri(r, 2, 5), m = ri(r, 2, 6), t = ri(r, 1, 4)
    if (t === 1) { const f = `2x(x^2+${k})^${n}`; return intSpec(integral(f), f, `(x^2+${k})^${n + 1}/${n + 1}`, 'Let u = x² + k. Then du = 2x dx, which is exactly the other factor.', [`Let u = x² + ${k}, du = 2x dx.`, `∫ uⁿ du = u${sup(n + 1)}/${n + 1}.`, `Answer: (x² + ${k})${sup(n + 1)}/${n + 1} + C.`]) }
    if (t === 2) { const f = `${m}x*e^(x^2)`, Fm = m % 2 === 0 ? `${m / 2}e^(x^2)` : `${m}e^(x^2)/2`, Fs = m % 2 === 0 ? `${m / 2}e^(x²)` : `${m}e^(x²)/2`; return intSpec(integral(f), f, Fm, 'Let u = x². Then du = 2x dx, so x dx = du/2.', [`Let u = x², du = 2x dx.`, `∫ ${m}x e^(x²) dx = (${m}/2)∫ eᵘ du = ${m % 2 === 0 ? `${m / 2}eᵘ` : `${m}eᵘ/2`}.`, `Answer: ${Fs} + C.`]) }
    if (t === 3) { const f = `cos(x)*sin(x)^${n}`; return intSpec(integral(f), f, `sin(x)^${n + 1}/${n + 1}`, 'Let u = sin x. Then du = cos x dx.', [`u = sin x, du = cos x dx.`, `∫ uⁿ du = u${sup(n + 1)}/${n + 1}.`, `Answer: sin${sup(n + 1)}x/${n + 1} + C.`]) }
    const f = `sin(x)*cos(x)^${n}`; return intSpec(integral(f), f, `-cos(x)^${n + 1}/${n + 1}`, 'Let u = cos x. Then du = −sin x dx.', [`u = cos x, du = −sin x dx.`, `∫ uⁿ (−du) = −u${sup(n + 1)}/${n + 1}.`, `Answer: −cos${sup(n + 1)}x/${n + 1} + C.`])
  } },
  { lesson: 'integration-substitution', level: 2, make: (r) => {
    // more substitutions
    const k = ri(r, 1, 6), n = ri(r, 1, 3), t = ri(r, 1, 4)
    if (t === 1) { const f = `ln(x)/x`; return intSpec(integral(f), f, 'ln(x)^2/2', 'Let u = ln x. Then du = dx/x.', ['u = ln x, du = dx/x.', '∫ u du = u²/2.', 'Answer: (ln x)²/2 + C.'], { pos: true }) }
    if (t === 2) { const f = `x/(x^2+${k})`; return intSpec(integral(f), f, `ln(x^2+${k})/2`, 'The top is half the derivative of the bottom: let u = x² + k.', [`u = x² + ${k}, du = 2x dx, so x dx = du/2.`, '∫ du/(2u) = (1/2) ln u.', `Answer: (1/2) ln(x² + ${k}) + C.`]) }
    if (t === 3) { const f = `e^x/(e^x+${k})`; return intSpec(integral(f), f, `ln(e^x+${k})`, 'The top is the derivative of the bottom: let u = eˣ + k.', [`u = eˣ + ${k}, du = eˣ dx.`, '∫ du/u = ln u.', `Answer: ln(eˣ + ${k}) + C.`]) }
    const f = `x^2*(x^3+${k})^${n + 1}`; return intSpec(integral(f), f, `(x^3+${k})^${n + 2}/${3 * (n + 2)}`, 'Let u = x³ + k. Then du = 3x² dx.', [`u = x³ + ${k}, du = 3x² dx, so x² dx = du/3.`, `∫ u${sup(n + 1)} du/3 = u${sup(n + 2)}/${3 * (n + 2)}.`, `Answer: (x³ + ${k})${sup(n + 2)}/${3 * (n + 2)} + C.`])
  } },
  { lesson: 'integration-substitution', level: 2, make: (r) => {
    // a definite integral by substitution
    const k = ri(r, 1, 4), n = ri(r, 1, 4), a = ri(r, 1, 3), t = ri(r, 1, 3)
    if (t === 1) { const v = fr((a * a + k) ** (n + 1) - k ** (n + 1), 2 * (n + 1)); defCheck(`x*(x^2+${k})^${n}`, 0, a, v.n / v.d); return numSpec(`Evaluate ∫ from 0 to ${a} of x(x² + ${k})${sup(n)} dx.`, v, 'Substitute u = x² + k, and change the limits too: x = 0 → u = k, x = a → u = a² + k.', [`u = x² + ${k}, du = 2x dx. When x = 0, u = ${k}; when x = ${a}, u = ${a * a + k}.`, `∫ from ${k} to ${a * a + k} of u${sup(n)} du/2 = [u${sup(n + 1)}/${2 * (n + 1)}] = (${a * a + k}${sup(n + 1)} − ${k}${sup(n + 1)})/${2 * (n + 1)}.`, `= ${fm(v)}.`]) }
    const v = fr(1, n + 1)
    if (t === 2) { defCheck(`cos(x)*sin(x)^${n}`, 0, Math.PI / 2, 1 / (n + 1)); return numSpec(`Evaluate ∫ from 0 to π/2 of cos x sin${sup(n)}x dx.`, v, 'Let u = sin x, with du = cos x dx. The limits become sin 0 = 0 and sin(π/2) = 1.', [`∫ from 0 to 1 of u${sup(n)} du = [u${sup(n + 1)}/${n + 1}] from 0 to 1 = ${fm(v)}.`]) }
    defCheck(`sin(x)*cos(x)^${n}`, 0, Math.PI / 2, 1 / (n + 1)); return numSpec(`Evaluate ∫ from 0 to π/2 of sin x cos${sup(n)}x dx.`, v, 'Let u = cos x, with du = −sin x dx. The limits become cos 0 = 1 and cos(π/2) = 0.', [`∫ from 1 to 0 of −u${sup(n)} du = ∫ from 0 to 1 of u${sup(n)} du = ${fm(v)}.`])
  } },
  { lesson: 'integration-substitution', level: 3, make: (r) => {
    // substitution where x is replaced
    const k = ri(r, 1, 6), t = ri(r, 1, 2)
    if (t === 1) return intSpec(integral(`x*sqrt(x+${k})`), `x*sqrt(x+${k})`, `2(x+${k})^(3/2)*(3x-${2 * k})/15`, 'Let u = x + k, so x = u − k and dx = du. Expand and integrate each power.', [`u = x + ${k}, x = u − ${k}: ∫ (u − ${k})√u du = ∫ (u^(3/2) − ${k}u^(1/2)) du.`, `= (2/5)u^(5/2) − (${2 * k}/3)u^(3/2) + C.`, `Factor: 2(x + ${k})^(3/2)(3x − ${2 * k})/15 + C.`], { pos: true })
    return intSpec(integral(`x/sqrt(x+${k})`), `x/sqrt(x+${k})`, `2sqrt(x+${k})*(x-${2 * k})/3`, 'Let u = x + k, so x = u − k and dx = du. Split into two powers.', [`u = x + ${k}: ∫ (u − ${k})/√u du = ∫ (u^(1/2) − ${k}u^(−1/2)) du.`, `= (2/3)u^(3/2) − ${2 * k}u^(1/2) + C.`, `Factor: 2√(x + ${k})(x − ${2 * k})/3 + C.`], { pos: true })
  } },
  { lesson: 'integration-substitution', level: 3, make: (r) => {
    // odd powers of sine and cosine, and tangent
    const t = ri(r, 1, 3), k = ri(r, 1, 3), kk = k === 1 ? '' : k, d = k === 1 ? '' : `/${k}`, d3 = `/${3 * k}`
    if (t === 1) return intSpec(integral(`sin(${kk}x)^3`), `sin(${kk}x)^3`, `-cos(${kk}x)${d}+cos(${kk}x)^3${d3}`, 'Split off one sine: sin³θ = sin θ (1 − cos²θ). Then let u = cos(kx).', [`sin³(${kk}x) = sin(${kk}x)(1 − cos²(${kk}x)). Let u = cos(${kk}x), du = −${kk}sin(${kk}x) dx.`, `∫ (1 − u²)(−du${d}) = −(u − u³/3)${d}.`.replace('−(u − u³/3)', '(−u + u³/3)'), `Answer: ${k === 1 ? '' : '('}−cos(${kk}x) + cos³(${kk}x)/3${k === 1 ? '' : `)/${k}`} + C.`])
    if (t === 2) return intSpec(integral(`cos(${kk}x)^3`), `cos(${kk}x)^3`, `sin(${kk}x)${d}-sin(${kk}x)^3${d3}`, 'Split off one cosine: cos³θ = cos θ (1 − sin²θ). Then let u = sin(kx).', [`cos³(${kk}x) = cos(${kk}x)(1 − sin²(${kk}x)). Let u = sin(${kk}x), du = ${kk}cos(${kk}x) dx.`, `∫ (1 − u²) du${d} = (u − u³/3)${d}.`, `Answer: ${k === 1 ? '' : '('}sin(${kk}x) − sin³(${kk}x)/3${k === 1 ? '' : `)/${k}`} + C.`])
    return intSpec(integral(`tan(${kk}x)`), `tan(${kk}x)`, `-ln(cos(${kk}x))${d}`, 'Write tan θ = sin θ / cos θ and let u = cos(kx).', [`tan(${kk}x) = sin(${kk}x)/cos(${kk}x). Let u = cos(${kk}x), du = −${kk}sin(${kk}x) dx.`, `∫ −du/u${d} = −ln u${d}.`, `Answer: −ln|cos(${kk}x)|${d} + C.`], { dom: [-1.2 / k, 1.2 / k] })
  } },
]
export const INT_A: Gen[] = [...ANTI_GENS, ...DEF_GENS, ...SUB_GENS]
void dP; void evP; void pw; void fracPiSpec; void noneSpec; void ri
