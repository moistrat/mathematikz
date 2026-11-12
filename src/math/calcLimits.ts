/**
 * Question generators for Unit 9, lessons 'limits' and 'derivative-definition'.
 *
 * Every limit is built so that its value is known by construction, and is then checked against a numerical estimate.
 */
import { fr } from './algebra'
import { numDeriv } from './calculus'
import { calcSpec, decSpec, sup, dP, evP, fm, gcd, limitCheck, MN, must, noneSpec, numSpec, P, ri, rnz, S, w } from './calcHelpers'
import { MINUS } from './exact'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const lin = (a: number) => (a === 0 ? 'x' : a > 0 ? `x-${a}` : `x+${-a}`)
const lim = (a: string, expr: string) => `Find the limit as x → ${a} of ${S(expr)}.`
const A = (a: number) => MN(String(a))

/* ------------------------------------------------------------------ lesson: limits */

export const LIMIT_GENS: Gen[] = [
  { lesson: 'limits', level: 1, make: (r) => {
    const p = rnz(r, -4, 5), q = ri(r, -6, 6), c = ri(r, -9, 9), a = rnz(r, -4, 4)
    const f = P([c, q, p]), v = p * a * a + q * a + c
    limitCheck(f, a, v)
    return numSpec(lim(A(a), f), fr(v), 'A polynomial has no breaks, so the limit is just the value: substitute x = a.', [`Substitute x = ${A(a)}: ${S(f).replace(/x/g, `(${A(a)})`)} = ${A(v)}.`, 'For a function that is continuous at the point, the limit equals the value there.'])
  } },
  { lesson: 'limits', level: 1, make: (r) => {
    // 0/0, factor and cancel
    const a = rnz(r, -5, 5), m = rnz(r, -6, 6)
    if (m === a) return LIMIT_GENS[1].make(r)
    const num = P([a * m, -(a + m), 1]), den = lin(a), v = a - m
    limitCheck(`(${num})/(${den})`, a, v)
    return numSpec(lim(A(a), `(${num})/(${den})`), fr(v), 'Substituting gives 0/0, which is not an answer. Factor the top and cancel the common factor before substituting.', [
      `Substituting x = ${A(a)} gives 0/0, so factor: ${S(num)} = (${S(lin(a))})(${S(lin(m))}).`, `Cancel the common factor: the expression is ${S(lin(m))} for every x ≠ ${A(a)}.`, `Now substitute: ${A(a)} ${m < 0 ? `+ ${-m}` : `− ${m}`} = ${A(v)}.`])
  } },
  { lesson: 'limits', level: 1, make: (r) => {
    // limit at infinity of a rational function of equal degree
    const p = rnz(r, -6, 7), q = ri(r, -5, 5), c = ri(r, -5, 5), s = rnz(r, 1, 6) * (r() < 0.3 ? -1 : 1), t = ri(r, -5, 5), u = ri(r, 1, 6)
    const f = `(${P([c, q, p])})/(${P([u, t, s])})`
    const inf = pick(r, ['inf', '-inf'] as const)
    limitCheck(f, 0, p / s, inf)
    const g = gcd(p, s), n = p / g, d = s / g
    return numSpec(lim(inf === 'inf' ? '∞' : `${MINUS}∞`, f), fr(n * (d < 0 ? -1 : 1), Math.abs(d)), 'Divide the top and bottom by the highest power of x. Every term with x left in the denominator tends to 0.', [
      'Divide the top and the bottom by x², the highest power: each of the terms c/x² and q/x tends to 0.', `What is left is the ratio of the leading coefficients: ${A(p)}/${A(s)} = ${fm(fr(n * (d < 0 ? -1 : 1), Math.abs(d)))}.`])
  } },
  { lesson: 'limits', level: 2, make: (r) => {
    // rationalise a numerator with a square root
    const s = ri(r, 2, 5), k = ri(r, -3, 8), a = s * s - k
    const f = `(sqrt(x${k === 0 ? '' : k > 0 ? `+${k}` : k})-${s})/(${lin(a)})`
    const xk = k === 0 ? 'x' : `x ${k < 0 ? '−' : '+'} ${Math.abs(k)}`
    limitCheck(f, a, 1 / (2 * s))
    return numSpec(lim(A(a), f), fr(1, 2 * s), 'Substituting gives 0/0. Multiply the top and the bottom by the conjugate of the numerator: the root plus the number.', [
      `Multiply top and bottom by √(${xk}) + ${s}. The top becomes (${xk}) − ${s * s} = ${S(lin(a))}.`, `Cancel the factor ${S(lin(a))}: the expression is 1/(√(${xk}) + ${s}).`, `Substitute x = ${A(a)}: 1/(${s} + ${s}) = 1/${2 * s}.`])
  } },
  { lesson: 'limits', level: 2, make: (r) => {
    // top and bottom of different degree
    const dt = ri(r, 1, 3), db = ri(r, 1, 3)
    if (dt === db) return LIMIT_GENS[4].make(r)
    const p = rnz(r, -5, 6), q = ri(r, -6, 6), s = rnz(r, 1, 5), t = ri(r, 1, 6)
    const top = `${P([0].concat(Array(dt - 1).fill(0), [p]).slice(0, dt + 1))}${q === 0 ? '' : q > 0 ? `+${q}` : q}`, bot = `${s === 1 ? '' : s}x^${db}+${t}`.replace('x^1', 'x')
    const f = `(${top})/(${bot})`
    const inf = dt < db
    limitCheck(f, 0, inf ? 0 : null, 'inf')
    return inf
      ? numSpec(lim('∞', f), fr(0), 'Compare the highest powers. When the bottom grows faster than the top, the fraction is squeezed to 0.', [`The top has degree ${dt} and the bottom has degree ${db}. Divide both by x${db === 1 ? '' : sup(db)}.`, `The top becomes terms with x in the denominator, which tend to 0, and the bottom tends to ${s}.`, 'So the limit is 0/' + s + ' = 0.'])
      : noneSpec(lim('∞', f), 'diverges', 'Compare the highest powers. When the top grows faster than the bottom, the fraction grows without bound.', [`The top has degree ${dt} and the bottom has degree ${db}, so the top wins.`, 'The values grow without bound (towards +∞ or −∞), so there is no finite limit: the limit diverges.'])
  } },
  { lesson: 'limits', level: 2, make: (r) => {
    // square root at infinity
    const m = ri(r, 1, 5), q = rnz(r, -9, 9), s = ri(r, 1, 6), t = ri(r, -5, 5)
    const f = `sqrt(${m * m === 1 ? '' : m * m}x^2${q === 0 ? '' : q > 0 ? `+${q}` : q})/(${s === 1 ? '' : s}x${t === 0 ? '' : t > 0 ? `+${t}` : t})`
    limitCheck(f, 0, m / s, 'inf')
    const g = gcd(m, s)
    return numSpec(lim('∞', f), fr(m / g, s / g), 'For large x the square root behaves like the square root of its highest power: √(m²x²) = mx.', [`For large x, √(${m * m === 1 ? '' : m * m}x² ${q < 0 ? `− ${-q}` : `+ ${q}`}) is close to √(${m * m === 1 ? '' : m * m}x²) = ${m === 1 ? '' : m}x.`, `So the fraction is close to ${m === 1 ? '' : m}x/(${s === 1 ? '' : s}x) = ${m}/${s}.`, 'Check by dividing top and bottom by x: the extra terms all tend to 0.'])
  } },
  { lesson: 'limits', level: 2, make: (r) => {
    // a one-sided limit of a piecewise function
    const a = ri(r, -3, 4), p = rnz(r, -4, 4), q = ri(r, -6, 6), c = rnz(r, -3, 3), e = ri(r, -9, 9)
    const left = r() < 0.5
    const f1 = P([q, p]), f2 = P([e, 0, c]), v1 = p * a + q, v2 = c * a * a + e
    limitCheck(left ? f1 : f2, a, left ? v1 : v2, left ? 'left' : 'right')
    const v = left ? v1 : v2
    return numSpec(`Let f(x) = ${S(f1)} when x < ${A(a)}, and f(x) = ${S(f2)} when x ≥ ${A(a)}. Find the limit of f(x) as x → ${A(a)}${left ? '⁻' : '⁺'}.`, fr(v), `As x → ${A(a)}${left ? '⁻' : '⁺'}, x approaches ${A(a)} from the ${left ? 'left (x < a)' : 'right (x > a)'}, so use the ${left ? 'first' : 'second'} formula.`, [
      `From the ${left ? 'left' : 'right'} the values of x are ${left ? 'less' : 'greater'} than ${A(a)}, so f(x) = ${S(left ? f1 : f2)}.`, `Substitute x = ${A(a)} into that formula: ${A(v)}.`])
  } },
  { lesson: 'limits', level: 2, make: (r) => {
    // does the two-sided limit exist?
    const a = ri(r, -3, 4), p = rnz(r, -4, 4), q = ri(r, -6, 6), c = rnz(r, -3, 3)
    const v1 = p * a + q, same = r() < 0.5
    const off = same ? 0 : rnz(r, -4, 4), e = v1 - c * a * a + off
    const f1 = P([q, p]), f2 = P([e, 0, c]), v2 = c * a * a + e
    limitCheck(f1, a, v1, 'left'); limitCheck(f2, a, v2, 'right')
    const prompt = `Let f(x) = ${S(f1)} when x < ${A(a)}, and f(x) = ${S(f2)} when x ≥ ${A(a)}. Find the limit of f(x) as x → ${A(a)}, or type does not exist.`
    const steps = [`From the left, f(x) → ${S(f1).replace(/x/g, `(${A(a)})`)} = ${A(v1)}.`, `From the right, f(x) → ${A(v2)}.`]
    return same
      ? numSpec(prompt, fr(v1), 'The two-sided limit exists only when the left and right limits are equal. Find both.', [...steps, `They agree, so the limit is ${A(v1)}.`])
      : noneSpec(prompt, 'does not exist', 'The two-sided limit exists only when the left and right limits are equal. Find both.', [...steps, `${A(v1)} ≠ ${A(v2)}, so the limit does not exist (the graph jumps).`])
  } },
  { lesson: 'limits', level: 2, make: (r) => {
    // the standard trigonometric limits
    const k = ri(r, 1, 6), m = ri(r, 1, 6), t = ri(r, 1, 4)
    const kk = k === 1 ? '' : k, mm = m === 1 ? '' : m
    let f: string, v: Spec, g = (n: number, d: number) => { const q = gcd(n, d); return fr(n / q, d / q) }
    if (t === 1) { f = `sin(${kk}x)/(${mm}x)`; v = numSpec(lim('0', f), g(k, m), 'Use sin(u)/u → 1 as u → 0. Make the bottom match the angle in the sine.', [`Write sin(${kk}x)/(${mm}x) = (${k}/${m}) × sin(${kk}x)/(${kk}x).`, 'As x → 0, sin(kx)/(kx) → 1, so the limit is k/m = ' + `${k}/${m}.`]) }
    else if (t === 2) { f = `tan(${kk}x)/(${mm}x)`; v = numSpec(lim('0', f), g(k, m), 'Write tan u = sin u / cos u. Then sin(u)/u → 1 and cos u → 1.', [`tan(${kk}x)/(${mm}x) = (${k}/${m}) × [sin(${kk}x)/(${kk}x)] × 1/cos(${kk}x).`, 'The three factors tend to k/m, 1 and 1.']) }
    else if (t === 3) { f = `sin(${kk}x)/sin(${mm}x)`; v = numSpec(lim('0', f), g(k, m), 'Divide the top and bottom by x and use sin(u)/u → 1.', [`Divide the top and bottom by x: [sin(${kk}x)/x] / [sin(${mm}x)/x].`, `These tend to ${k} and ${m}, so the limit is ${k}/${m}.`]) }
    else { f = `(1-cos(${kk}x))/(${mm}x^2)`; v = numSpec(lim('0', f), g(k * k, 2 * m), 'Use 1 − cos u = 2 sin²(u/2), then sin(u)/u → 1.', ['1 − cos(kx) = 2 sin²(kx/2), so the expression is 2 sin²(kx/2) / (m x²).', `As x → 0, sin(kx/2)/x → k/2, so the limit is 2 × (k/2)² / m = k²/(2m) = ${k * k}/${2 * m}.`]) }
    limitCheck(f, 0, v.answers[0] as number)
    return v
  } },
  { lesson: 'limits', level: 3, make: (r) => {
    // 0/0 with a common factor in top and bottom
    const a = rnz(r, -4, 4), p = rnz(r, -5, 5), q = rnz(r, -5, 5)
    if (p === a || q === a) return LIMIT_GENS[9].make(r)
    const top = P([a * p, -(a + p), 1]), bot = P([a * q, -(a + q), 1]), v = fr(a - p, a - q)
    limitCheck(`(${top})/(${bot})`, a, (a - p) / (a - q))
    return numSpec(lim(A(a), `(${top})/(${bot})`), v, 'Both the top and the bottom are zero at x = a, so (x − a) is a factor of each. Factor and cancel.', [
      `Both are zero at x = ${A(a)}. Factor: top = (${S(lin(a))})(${S(lin(p))}), bottom = (${S(lin(a))})(${S(lin(q))}).`, `Cancel (${S(lin(a))}): the expression is (${S(lin(p))})/(${S(lin(q))}).`, `Substitute: (${A(a - p)})/(${A(a - q)}) = ${fm(v)}.`])
  } },
  { lesson: 'limits', level: 3, make: (r) => {
    // exponential and logarithmic standard limits
    const k = ri(r, 1, 6), m = ri(r, 1, 6), t = ri(r, 1, 3)
    const kk = k === 1 ? '' : k, mm = m === 1 ? '' : m
    const g = gcd(k, m)
    if (t === 1) { const f = `(e^(${kk}x)-1)/(${mm}x)`; limitCheck(f, 0, k / m); return numSpec(lim('0', f), fr(k / g, m / g), 'Use (eᵘ − 1)/u → 1 as u → 0. Match the bottom to the exponent.', [`(e^(${kk}x) − 1)/(${mm}x) = (${k}/${m}) × (e^(${kk}x) − 1)/(${kk}x).`, 'The second factor tends to 1, because (eᵘ − 1)/u → 1.']) }
    if (t === 2) { const f = `ln(1+${kk}x)/(${mm}x)`; limitCheck(f, 0, k / m); return numSpec(lim('0', f), fr(k / g, m / g), 'Use ln(1 + u)/u → 1 as u → 0. Match the bottom to the u inside the logarithm.', [`ln(1 + ${kk}x)/(${mm}x) = (${k}/${m}) × ln(1 + ${kk}x)/(${kk}x).`, 'The second factor tends to 1, because ln(1 + u)/u → 1.']) }
    const mm2 = m === k ? m + 1 : m
    const f = `(e^(${k === 1 ? '' : k}x)-e^(${mm2 === 1 ? '' : mm2}x))/x`
    limitCheck(f, 0, k - mm2)
    return numSpec(lim('0', f), fr(k - mm2), 'Subtract and add 1 in the top: e^(ax) − e^(bx) = (e^(ax) − 1) − (e^(bx) − 1).', [`(${S(f)}) = (e^(${k === 1 ? '' : k}x) − 1)/x − (e^(${mm2 === 1 ? '' : mm2}x) − 1)/x.`, `The two pieces tend to ${k} and ${mm2}, so the limit is ${A(k - mm2)}.`])
  } },
  { lesson: 'limits', level: 3, make: (r) => {
    // difference of square roots at infinity
    const p = rnz(r, -8, 8), two = r() < 0.5
    const lx = (c: number) => `${c > 0 ? '+' : '-'}${Math.abs(c) === 1 ? '' : Math.abs(c)}x`
    let f: string, v: number
    const rr = rnz(r, -8, 8)
    if (two && rr !== p) { f = `sqrt(x^2${lx(p)})-sqrt(x^2${lx(rr)})`; v = (p - rr) / 2 }
    else { f = `sqrt(x^2${lx(p)})-x`; v = p / 2 }
    limitCheck(f, 0, v, 'inf')
    const fv = fr(Math.round(v * 2), 2)
    return numSpec(lim('∞', f), fv, 'Infinity minus infinity is not an answer. Multiply by the conjugate (the same with a plus sign) over itself.', [
      'Multiply the top and the bottom by the conjugate (the same expression with + instead of −). The top becomes a difference of squares, which is a polynomial.', 'Divide the top and the bottom by x. Every root then tends to √1 = 1.', `The limit is ${fm(fv)}.`])
  } },
  { lesson: 'limits', level: 3, make: (r) => {
    // continuity: choose k so that the function is continuous
    for (;;) {
      const a = rnz(r, -3, 3), p = rnz(r, -4, 4), q = rnz(r, -6, 6), s = rnz(r, -6, 6)
      const num = p * a + q - s, k = fr(num, a * a)
      if (num === 0) continue
      const f1 = P([q, p]), kt = a * a === 1 ? 'k' : `${a * a}k`
      return numSpec(`Let f(x) = ${S(f1)} when x < ${A(a)}, and f(x) = kx² ${s < 0 ? `− ${-s}` : `+ ${s}`} when x ≥ ${A(a)}. Find k so that f is continuous at x = ${A(a)}.`, k, 'For continuity the left limit, the right limit and the value must all agree. Set the two formulas equal at x = a.', [
        `From the left, f → ${S(f1).replace(/x/g, `(${A(a)})`)} = ${A(p * a + q)}.`, `The value from the right is k × (${A(a)})² ${s < 0 ? `− ${-s}` : `+ ${s}`} = ${kt} ${s < 0 ? `− ${-s}` : `+ ${s}`}.`, `Set them equal: ${kt} = ${A(p * a + q)} ${s < 0 ? `+ ${-s}` : `− ${s}`} = ${A(num)}, so k = ${fm(k)}.`])
    }
  } },
]

/* ------------------------------------------------------------------ lesson: derivative-definition */

const polyText = (cs: number[]) => S(P(cs))
const randPoly = (r: () => number, deg: number) => { const cs = Array.from({ length: deg + 1 }, () => ri(r, -6, 6)); cs[deg] = rnz(r, 1, 3) * (r() < 0.3 ? -1 : 1); return cs }

export const DEFN_GENS: Gen[] = [
  { lesson: 'derivative-definition', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 2, 3)), a = ri(r, -3, 3), d = dP(cs), v = evP(d, a)
    must(Math.abs(numDeriv(P(cs), a) - v) < 1e-3, 'gradient')
    return numSpec(`Find the gradient of the tangent to y = ${polyText(cs)} at the point where x = ${A(a)}.`, fr(v), 'The gradient of the tangent is the derivative f′(a). Differentiate term by term (the power rule), then substitute.', [`The derivative is f′(x) = ${S(P(d))}.`, `Substitute x = ${A(a)}: f′(${A(a)}) = ${A(v)}.`])
  } },
  { lesson: 'derivative-definition', level: 1, make: (r) => {
    const cs = randPoly(r, ri(r, 2, 3)), a = ri(r, -3, 1), b = a + ri(r, 1, 3)
    const v = fr(evP(cs, b) - evP(cs, a), b - a)
    return numSpec(`Find the average rate of change of f(x) = ${polyText(cs)} between x = ${A(a)} and x = ${b}.`, v, 'The average rate of change is the gradient of the chord: (f(b) − f(a)) / (b − a).', [`f(${A(a)}) = ${A(evP(cs, a))} and f(${b}) = ${A(evP(cs, b))}.`, `(${A(evP(cs, b))} − ${w(evP(cs, a))}) / (${b} − ${w(a)}) = ${fm(v)}.`])
  } },
  { lesson: 'derivative-definition', level: 1, make: (r) => {
    const cs = [0, ri(r, 1, 9), ri(r, -9, -2), 1], t = ri(r, 1, 5), d = dP(cs)
    const v = evP(d, t)
    return numSpec(`A particle moves along a line so that its position after t seconds is s(t) = ${polyText(cs)} metres. Find its velocity when t = ${t} seconds. Give the number of metres per second.`, fr(v), 'Velocity is the rate of change of position: v(t) = s′(t).', [`v(t) = s′(t) = ${S(P(d))}.`, `At t = ${t}: v = ${A(v)} m/s.`])
  } },
  { lesson: 'derivative-definition', level: 2, make: (r) => {
    const p = rnz(r, -4, 5), q = ri(r, -6, 6), c = ri(r, -6, 6), f = P([c, q, p]), d = P([q, 2 * p])
    return calcSpec(`Use the definition f′(x) = lim (f(x + h) − f(x))/h as h → 0 to find f′(x) for f(x) = ${S(f)}.`, f, d, 'Expand f(x + h), subtract f(x), divide by h, then let h → 0.', [
      `f(x + h) − f(x) = ${p === 1 ? '' : `${p}`}(2xh + h²) ${q === 0 ? '' : `${q < 0 ? '−' : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}h`} (the constants cancel).`, `Divide by h: ${2 * p}x ${p < 0 ? '−' : '+'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}h ${q === 0 ? '' : `${q < 0 ? '−' : '+'} ${Math.abs(q)}`}.`, `Let h → 0: f′(x) = ${S(d)}.`])
  } },
  { lesson: 'derivative-definition', level: 2, make: (r) => {
    let cs = randPoly(r, ri(r, 2, 3)), a = rnz(r, -2, 3), m = evP(dP(cs), a)
    while (m === 0) { cs = randPoly(r, ri(r, 2, 3)); a = rnz(r, -2, 3); m = evP(dP(cs), a) }
    const y0 = evP(cs, a), c = y0 - m * a
    return numSpec(`Find the y-intercept of the tangent to y = ${polyText(cs)} at the point where x = ${A(a)}.`, fr(c), 'The tangent is y − f(a) = f′(a)(x − a). Find f(a) and f′(a), then set x = 0.', [`f(${A(a)}) = ${A(y0)} and f′(${A(a)}) = ${A(m)}.`, `The tangent is y = ${A(y0)} + ${w(m)}(x − ${w(a)}).`, `At x = 0: y = ${A(y0)} − ${w(m)} × ${w(a)} = ${A(c)}.`])
  } },
  { lesson: 'derivative-definition', level: 2, make: (r) => {
    const p = rnz(r, -3, 3), q = ri(r, -6, 6), c = ri(r, -5, 5), m = ri(r, -8, 8)
    const x = fr(m - q, 2 * p)
    return numSpec(`At what value of x does the curve y = ${S(P([c, q, p]))} have gradient ${A(m)}?`, x, 'Find the derivative, set it equal to the required gradient, and solve for x.', [`y′ = ${S(P([q, 2 * p]))}.`, `Set y′ = ${A(m)}: ${S(P([q, 2 * p]))} = ${A(m)}, so ${A(2 * p)}x = ${A(m - q)}.`, `x = ${fm(x)}.`])
  } },
  { lesson: 'derivative-definition', level: 2, make: (r) => {
    const p = rnz(r, -4, 5), a = ri(r, 1, 4), h = pick(r, [0.1, 0.01, 0.2, 0.5]), v = p * (2 * a + h)
    return decSpec(`For f(x) = ${S(P([0, 0, p]))}, find the gradient of the chord from x = ${a} to x = ${a + h}.`, Number(v.toFixed(6)), 'The chord gradient is (f(a + h) − f(a))/h. It is close to the tangent gradient when h is small.', [`f(${a}) = ${A(p * a * a)} and f(${a + h}) = ${A(Number((p * (a + h) ** 2).toFixed(6)))}.`, `The chord gradient is ${A(Number((p * (2 * a + h)).toFixed(6)))}: it is ${p}(2 × ${a} + h) with h = ${h}, which tends to ${A(2 * p * a)} as h → 0.`])
  } },
  { lesson: 'derivative-definition', level: 3, make: (r) => {
    // differentiable? continuous?
    const a = ri(r, -2, 3), kind = pick(r, ['smooth', 'kink', 'jump'] as const)
    const m = kind === 'smooth' ? 2 * a : rnz(r, -5, 6) === 2 * a ? 2 * a + 1 : rnz(r, -5, 6)
    const slope = kind === 'smooth' ? 2 * a : m === 2 * a ? m + 1 : m
    const c = a * a - slope * a + (kind === 'jump' ? rnz(r, -3, 3) : 0)
    const f2 = P([c, slope])
    const words = kind === 'smooth' ? ['differentiable'] : kind === 'kink' ? ['continuous but not differentiable', 'continuous not differentiable'] : ['not continuous', 'discontinuous']
    const ex = kind === 'smooth' ? ['Both pieces equal a² at x = a, so f is continuous.', `The gradients are 2x = ${A(2 * a)} from the left and ${A(slope)} from the right: they agree.`, 'So f is differentiable at x = a (the join is smooth).'] : kind === 'kink' ? [`Both pieces equal ${A(a * a)} at x = ${A(a)}, so f is continuous there.`, `The gradient from the left is 2x = ${A(2 * a)} and from the right is ${A(slope)}: they disagree, so there is a corner.`, 'f is continuous but not differentiable at x = a.'] : [`The left piece gives ${A(a * a)} at x = ${A(a)}, but the right piece gives ${A(slope * a + c)}.`, 'The graph has a jump, so f is not continuous there (and so cannot be differentiable).']
    return { prompt: `Let f(x) = x² when x < ${A(a)}, and f(x) = ${S(f2)} when x ≥ ${A(a)}. At x = ${A(a)}, is f differentiable, continuous but not differentiable, or not continuous?`, kind: 'word', answers: [], display: words[0], input: words[0], words, unit: '', needsExact: false, tol: 0, hint: 'Check continuity first (do the pieces meet?), then compare the gradients of the two pieces at the join.', explanation: ex, pad: { pi: false, root: false, comma: false, alg: false, extra: ['differentiable', 'continuous but not differentiable', 'not continuous'] } }
  } },
  { lesson: 'derivative-definition', level: 3, make: (r) => {
    // first principles for a reciprocal, a root or a cube
    const k = rnz(r, -4, 5), t = ri(r, 1, 3)
    if (t === 1) return calcSpec(`Use the definition of the derivative to find f′(x) for f(x) = ${A(k)}/x.`, `${k}/x`, `${-k}/x^2`, 'Combine 1/(x + h) − 1/x over a common denominator, simplify, then let h → 0.', [`f(x + h) − f(x) = ${A(k)}(1/(x + h) − 1/x) = ${A(k)} × (−h)/(x(x + h)).`, `Divide by h: ${A(-k)}/(x(x + h)).`, `Let h → 0: f′(x) = ${A(-k)}/x².`])
    if (t === 2) return calcSpec(`Use the definition of the derivative to find f′(x) for f(x) = ${k === 1 ? '' : k === -1 ? MINUS : A(k)}√x.`, `${k}sqrt(x)`, `${k}/(2sqrt(x))`, 'Multiply the top and bottom of the difference quotient by √(x + h) + √x.', [`(√(x + h) − √x)/h = ((x + h) − x) / (h(√(x + h) + √x)) = 1/(√(x + h) + √x).`, `Let h → 0: the limit is 1/(2√x), so f′(x) = ${A(k)}/(2√x).`], { pos: true })
    return calcSpec(`Use the definition of the derivative to find f′(x) for f(x) = ${k === 1 ? '' : k === -1 ? MINUS : A(k)}x³.`, `${k}x^3`, `${3 * k}x^2`, 'Expand (x + h)³ = x³ + 3x²h + 3xh² + h³.', [`(x + h)³ − x³ = 3x²h + 3xh² + h³.`, `Divide by h: 3x² + 3xh + h². Let h → 0: 3x².`, `With the factor ${A(k)}: f′(x) = ${A(3 * k)}x².`])
  } },
  { lesson: 'derivative-definition', level: 3, make: (r) => {
    for (;;) {
      const cs = randPoly(r, ri(r, 2, 3)), a = ri(r, -3, 3), m = evP(dP(cs), a)
      if (m === 0) continue
      return numSpec(`Find the gradient of the normal to the curve y = ${polyText(cs)} at the point where x = ${A(a)}.`, fr(-1, m), 'The normal is perpendicular to the tangent, so its gradient is −1 divided by the tangent gradient.', [`The tangent gradient is f′(${A(a)}) = ${A(m)}.`, `The normal gradient is −1/${w(m)} = ${fm(fr(-1, m))}.`])
    }
  } },
]
