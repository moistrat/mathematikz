/**
 * Question generators for Unit 9, lesson 'derivative-applications': stationary points, optimisation, related rates,
 * approximation and l'Hôpital's rule. Every answer is checked by brute force inside the generator.
 */
import { fr } from './algebra'
import { calcSpec, decSpec, sup, evP, fm, limitCheck, MN, must, noneSpec, numSpec, P, piSpec, ri, rnz, S, w } from './calcHelpers'
import { exactSet, exF, ineqSpec } from './equationQuestions'
import type { Gen, Spec } from './questions'
import { pick } from './rng'
import type { IntervalSet } from './solve'

const A = (a: number) => MN(String(a))
const xs = (e: number) => (e === 1 ? 'x' : `x${sup(e)}`)
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]]

/** the cubic 2x³ − 3(p + q)x² + 6pqx, whose derivative is 6(x − p)(x − q) */
function cubic(r: () => number, lo = -4, hi = 5) {
  for (;;) {
    const p = ri(r, lo, hi), q = ri(r, lo, hi)
    if (p >= q) continue
    const cs = [0, 6 * p * q, -3 * (p + q), 2]
    return { p, q, cs, f: P(cs), d: P([6 * p * q, -6 * (p + q), 6]), fv: (x: number) => 2 * x ** 3 - 3 * (p + q) * x * x + 6 * p * q * x, d2: P([-6 * (p + q), 12]) }
  }
}
const open = (lo: number, hi: number): IntervalSet[number] => ({ lo, hi, loIncl: false, hiIncl: false })

export const APP_GENS: Gen[] = [
  { lesson: 'derivative-applications', level: 1, make: (r) => {
    const { p, q, f, d, cs } = cubic(r)
    return exactSet(`Find the x-coordinates of the stationary points of f(x) = ${S(f)}.`, [exF(fr(p)), exF(fr(q))], 'x', 'Stationary points are where the gradient is zero: solve f′(x) = 0.', [`f′(x) = ${S(d)} = 6(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})(x ${q < 0 ? '+' : '−'} ${Math.abs(q)}).`, `Set f′(x) = 0: x = ${A(p)} or x = ${A(q)}.`], undefined, (x) => Math.abs(evP([6 * p * q, -6 * (p + q), 6], x)) < 1e-9 && cs.length === 4)
  } },
  { lesson: 'derivative-applications', level: 1, make: (r) => {
    // maximum height of a projectile
    const a = pick(r, [1, 2, 4, 5]), b = ri(r, 2, 6) * a * 2, c = ri(r, 0, 12)
    const tm = fr(b, 2 * a), H = fr(c * 4 * a + b * b, 4 * a)
    must(Math.abs(evP([c, b, -a], b / (2 * a)) - (c + (b * b) / (4 * a))) < 1e-9, 'vertex')
    return numSpec(`A ball is thrown so that its height after t seconds is h(t) = ${S(P([c, b, -a], 't'))} metres. Find its greatest height.`, H, 'The ball is highest when its vertical velocity is zero: set h′(t) = 0, then substitute that t into h.', [`h′(t) = ${A(b)} ${a === 1 ? '− 2t' : `− ${2 * a}t`}. Setting this to 0 gives t = ${fm(tm)}.`, `h(${fm(tm)}) = ${fm(H)} metres.`, `The graph is a downward parabola, so this stationary point is the maximum.`])
  } },
  { lesson: 'derivative-applications', level: 1, make: (r) => {
    // classify a stationary point with the second derivative test
    const { p, q, f, d2 } = cubic(r), at = r() < 0.5 ? p : q
    const val = 12 * at - 6 * (p + q), max = val < 0
    const words = max ? ['maximum', 'local maximum', 'max', 'a maximum'] : ['minimum', 'local minimum', 'min', 'a minimum']
    return { prompt: `The function f(x) = ${S(f)} has a stationary point at x = ${A(at)}. Is it a maximum or a minimum?`, kind: 'word', answers: [], display: words[0], input: words[0], words, unit: '', needsExact: false, tol: 0, hint: 'Use the second derivative test: f″ > 0 means a minimum (concave up), f″ < 0 means a maximum (concave down).', explanation: [`f″(x) = ${S(d2)}.`, `f″(${A(at)}) = ${A(val)}, which is ${max ? 'negative' : 'positive'}, so the graph is concave ${max ? 'down' : 'up'} there: a ${words[0]}.`], pad: { pi: false, root: false, comma: false, alg: false, extra: ['maximum', 'minimum'] } } as Spec
  } },
  { lesson: 'derivative-applications', level: 1, make: (r) => {
    // two numbers with a fixed sum
    const S0 = 2 * ri(r, 3, 15), sq = r() < 0.5
    const v = sq ? (S0 * S0) / 2 : (S0 * S0) / 4
    must(v === (sq ? 2 * (S0 / 2) ** 2 : (S0 / 2) ** 2), 'two numbers')
    return numSpec(sq ? `Two numbers add to ${S0}. What is the least possible value of the sum of their squares?` : `Two positive numbers add to ${S0}. What is the greatest possible value of their product?`, fr(v), sq ? 'Call the numbers x and S − x, write the sum of squares as a function of x, and find where its derivative is zero.' : 'Call the numbers x and S − x, write the product as a function of x, and find where its derivative is zero.', sq ? [`Let the numbers be x and ${S0} − x. Then Q(x) = x² + (${S0} − x)², with Q′(x) = 2x − 2(${S0} − x) = 4x − ${2 * S0}.`, `Q′ = 0 gives x = ${S0 / 2}, so both numbers are ${S0 / 2}, and Q = 2 × ${(S0 / 2) ** 2} = ${v}.`, 'Q″ = 4 > 0, so this is a minimum.'] : [`Let the numbers be x and ${S0} − x. Then F(x) = x(${S0} − x), with F′(x) = ${S0} − 2x.`, `F′ = 0 gives x = ${S0 / 2}, so F = ${S0 / 2} × ${S0 / 2} = ${v}.`, 'F″ = −2 < 0, so this is a maximum.'])
  } },
  { lesson: 'derivative-applications', level: 1, make: (r) => {
    // related rates: a square
    const s = ri(r, 2, 12), v = ri(r, 1, 5)
    return numSpec(`The side of a square is increasing at ${v} cm/s. At what rate, in cm² per second, is the area increasing when the side is ${s} cm?`, fr(2 * s * v), 'Write the area A = s², differentiate with respect to time using the chain rule: dA/dt = 2s ds/dt.', ['A = s², so dA/dt = 2s × ds/dt.', `When s = ${s} and ds/dt = ${v}: dA/dt = 2 × ${s} × ${v} = ${2 * s * v} cm²/s.`])
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // where is a cubic increasing or decreasing?
    const { p, q, f, d } = cubic(r), inc = r() < 0.5
    const set: IntervalSet = inc ? [{ lo: -Infinity, hi: p, loIncl: false, hiIncl: false }, { lo: q, hi: Infinity, loIncl: false, hiIncl: false }] : [open(p, q)]
    return ineqSpec(`For what values of x is f(x) = ${S(f)} ${inc ? 'increasing' : 'decreasing'}?`, set, 'x', `A function is ${inc ? 'increasing where f′(x) > 0' : 'decreasing where f′(x) < 0'}. Factor f′ and use a sign chart.`, [`f′(x) = ${S(d)} = 6(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})(x ${q < 0 ? '+' : '−'} ${Math.abs(q)}), which is zero at x = ${A(p)} and x = ${A(q)}.`, `This is an upward parabola in x, so it is ${inc ? 'positive outside the two roots' : 'negative between the two roots'}.`], [exF(fr(p)), exF(fr(q))], (x) => (evP([6 * p * q, -6 * (p + q), 6], x) > 0) === inc)
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // point of inflection of a cubic
    const k = rnz(r, -4, 5), m = ri(r, -9, 9), cs = [0, m, -3 * k, 1]
    return exactSet(`Find the x-coordinate of the point of inflection of y = ${S(P(cs))}.`, [exF(fr(k))], 'x', 'A point of inflection is where the concavity changes: solve y″ = 0 and check that y″ changes sign.', [`y′ = ${S(P([m, -6 * k, 3]))}, so y″ = ${S(P([-6 * k, 6]))}.`, `y″ = 0 gives x = ${A(k)}, and y″ changes sign there (it is a straight line with non-zero gradient), so it is a point of inflection.`], undefined, (x) => Math.abs(6 * x - 6 * k) < 1e-9)
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // concave up?
    const { p, q, f, d2 } = cubic(r)
    const c = fr(p + q, 2)
    const up = r() < 0.5
    const set: IntervalSet = up ? [{ lo: fr(p + q, 2).n / fr(p + q, 2).d, hi: Infinity, loIncl: false, hiIncl: false }] : [{ lo: -Infinity, hi: c.n / c.d, loIncl: false, hiIncl: false }]
    return ineqSpec(`For what values of x is the graph of y = ${S(f)} concave ${up ? 'up' : 'down'}?`, set, 'x', `The graph is concave ${up ? 'up where y″ > 0' : 'down where y″ < 0'}.`, [`y″ = ${S(d2)}.`, `y″ = 0 at x = ${fm(c)}, and y″ ${up ? '> 0 to the right of that' : '< 0 to the left of that'}.`], [exF(c)], (x) => (12 * x - 6 * (p + q) > 0) === up)
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // fence against a river
    const L = pick(r, [40, 48, 60, 72, 80, 96, 100, 120, 160, 200]), best = (L * L) / 8
    let m = 0; for (let x = 0; x <= L / 2; x += 0.5) m = Math.max(m, x * (L - 2 * x))
    must(Math.abs(m - best) < 1e-9, 'fence')
    return numSpec(`A farmer has ${L} m of fencing and uses it for three sides of a rectangular field, the fourth side being a straight river that needs no fence. What is the greatest area that can be enclosed? Give the area in m².`, fr(best), 'Let the two sides at right angles to the river be x. Then the third side is L − 2x. Write the area in terms of x and find where its derivative is zero.', [`The sides perpendicular to the river are x, so the side parallel to it is ${L} − 2x, and A(x) = x(${L} − 2x) = ${L}x − 2x².`, `A′(x) = ${L} − 4x = 0 gives x = ${L / 4}, so the long side is ${L / 2} m.`, `A = ${L / 4} × ${L / 2} = ${best} m². A″ = −4 < 0, so it is a maximum.`])
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // minimum cost
    const a = ri(r, 1, 5), k = ri(r, 2, 6), b = a * k * k, v = 2 * a * k
    let m = Infinity; for (let x = 0.1; x < 50; x += 0.1) m = Math.min(m, a * x + b / x)
    must(Math.abs(m - v) < 0.05, 'cost')
    return numSpec(`The cost, in dollars per hour, of running a machine at speed x is C(x) = ${a === 1 ? '' : a}x + ${b}/x for x > 0. Find the minimum possible cost per hour.`, fr(v), 'Differentiate, set C′(x) = 0 to find the best speed, then substitute it into C.', [`C′(x) = ${a} − ${b}/x². Setting this to 0: x² = ${k * k}, so x = ${k} (x > 0).`, `C(${k}) = ${a * k} + ${b / k} = ${v} dollars per hour.`, `C″(x) = ${2 * b}/x³ > 0 for x > 0, so this is a minimum.`])
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // the sliding ladder
    const [x, y, L] = pick(r, TRIPLES), v = ri(r, 1, 4)
    return numSpec(`A ${L} m ladder leans against a vertical wall. Its foot slides away from the wall at ${v} m/s. How fast, in metres per second, is the top sliding down the wall at the instant when the foot is ${x} m from the wall? Give the speed (a positive number).`, fr(x * v, y), 'Let x be the distance of the foot and y the height of the top. They satisfy x² + y² = L². Differentiate with respect to time.', [`x² + y² = ${L * L}. Differentiating with respect to t: 2x dx/dt + 2y dy/dt = 0, so dy/dt = −(x/y) dx/dt.`, `When x = ${x} the height is y = √(${L * L} − ${x * x}) = ${y}.`, `dy/dt = −(${x}/${y}) × ${v} = −${fm(fr(x * v, y))}. The top slides down at ${fm(fr(x * v, y))} m/s.`])
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // related rates with pi
    const rr = ri(r, 2, 10), v = ri(r, 1, 4)
    if (r() < 0.5) return piSpec(`The radius of a circular ripple grows at ${v} cm/s. At what rate is its area increasing when the radius is ${rr} cm? Give the answer in cm² per second, in terms of π.`, 2 * rr * v, 'A = πr², so dA/dt = 2πr dr/dt.', ['A = πr², so dA/dt = 2πr × dr/dt.', `dA/dt = 2π × ${rr} × ${v} = ${2 * rr * v}π cm²/s.`])
    return piSpec(`A spherical balloon is inflated so that its radius grows at ${v} cm/s. At what rate is its volume increasing when the radius is ${rr} cm? Give the answer in cm³ per second, in terms of π.`, 4 * rr * rr * v, 'V = (4/3)πr³, so dV/dt = 4πr² dr/dt.', ['V = (4/3)πr³, so dV/dt = 4πr² × dr/dt.', `dV/dt = 4π × ${rr * rr} × ${v} = ${4 * rr * rr * v}π cm³/s.`])
  } },
  { lesson: 'derivative-applications', level: 2, make: (r) => {
    // linear approximation
    const a = pick(r, [2, 4, 5, 8, 10]), d = rnz(r, -3, 3), est = a + d / (2 * a)
    return decSpec(`Use the linear approximation (the tangent line) of f(x) = √x at x = ${a * a} to estimate √${a * a + d}.`, est, 'Near x = a, f(x) ≈ f(a) + f′(a)(x − a). Here f′(x) = 1/(2√x).', [`f(${a * a}) = ${a} and f′(${a * a}) = 1/(2 × ${a}) = 1/${2 * a}.`, `√${a * a + d} ≈ ${a} + (1/${2 * a})(${a * a + d} − ${a * a}) = ${a} ${d < 0 ? '−' : '+'} ${Math.abs(d)}/${2 * a} = ${A(est)}.`, `(The true value is ${Math.sqrt(a * a + d).toFixed(4)}.)`], 6)
  } },
  { lesson: 'derivative-applications', level: 3, make: (r) => {
    // the open box
    const s = pick(r, [6, 12, 18, 24, 30, 36, 42, 48, 54]), best = (2 * s ** 3) / 27
    let m = 0; for (let x = 0; x <= s / 2; x += s / 3000) m = Math.max(m, x * (s - 2 * x) ** 2)
    must(Math.abs(m - best) < 1e-3 * best, 'box')
    return numSpec(`A square sheet of card with side ${s} cm has a square of side x cm cut from each corner. The sides are then folded up to make an open box. Find the greatest possible volume of the box, in cm³.`, fr(best), 'The base has side s − 2x and the height is x, so V = x(s − 2x)². Differentiate, solve V′ = 0, and keep the root that fits (0 < x < s/2).', [`V(x) = x(${s} − 2x)². By the product rule, V′(x) = (${s} − 2x)² − 4x(${s} − 2x) = (${s} − 2x)(${s} − 6x).`, `V′ = 0 gives x = ${s / 2} (no box at all) or x = ${s / 6}.`, `V(${s / 6}) = ${s / 6} × ${s - s / 3}² = ${best} cm³, and V″ < 0 there, so it is the maximum.`])
  } },
  { lesson: 'derivative-applications', level: 3, make: (r) => {
    // extreme values on a closed interval
    const { p, q, f, fv } = cubic(r, -3, 4), lo = ri(r, -4, 0), hi = lo + ri(r, 3, 7), max = r() < 0.5
    const cands = [lo, hi, ...[p, q].filter((x) => x > lo && x < hi)], vals = cands.map(fv)
    const best = max ? Math.max(...vals) : Math.min(...vals)
    let scan = max ? -Infinity : Infinity; for (let x = lo; x <= hi + 1e-9; x += 0.01) scan = max ? Math.max(scan, fv(x)) : Math.min(scan, fv(x))
    must(Math.abs(scan - best) < 0.5 + Math.abs(best) * 1e-3, 'closed interval')
    return numSpec(`Find the ${max ? 'greatest' : 'least'} value of f(x) = ${S(f)} on the interval ${A(lo)} ≤ x ≤ ${hi}.`, fr(best), 'On a closed interval the extreme values occur at the endpoints or at stationary points inside the interval. Compare them all.', [`f′(x) = 6(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})(x ${q < 0 ? '+' : '−'} ${Math.abs(q)}), so the stationary points are x = ${A(p)} and x = ${A(q)}. Keep those inside [${A(lo)}, ${hi}].`, `Candidates: ${cands.map((x, i) => `f(${A(x)}) = ${A(vals[i])}`).join(', ')}.`, `The ${max ? 'greatest' : 'least'} is ${A(best)}.`])
  } },
  { lesson: 'derivative-applications', level: 3, make: (r) => {
    // Newton's method, one step
    const x0 = ri(r, 2, 6), cube = r() < 0.4
    if (!cube) { let N = ri(r, 2, 30); while (Math.sqrt(N) % 1 === 0) N = ri(r, 2, 30); const v = fr(x0 * x0 + N, 2 * x0); return numSpec(`Use one step of Newton's method on f(x) = x² − ${N}, starting from x₀ = ${x0}, to find x₁. Give x₁ as a fraction or a decimal.`, v, "Newton's method: x₁ = x₀ − f(x₀)/f′(x₀).", [`f′(x) = 2x, so f(${x0}) = ${x0 * x0 - N} and f′(${x0}) = ${2 * x0}.`, `x₁ = ${x0} − (${A(x0 * x0 - N)})/${2 * x0} = ${fm(v)}.`]) }
    const N = ri(r, 2, 40), v = fr(2 * x0 ** 3 + N, 3 * x0 * x0)
    return numSpec(`Use one step of Newton's method on f(x) = x³ − ${N}, starting from x₀ = ${x0}, to find x₁. Give x₁ as a fraction or a decimal.`, v, "Newton's method: x₁ = x₀ − f(x₀)/f′(x₀).", [`f′(x) = 3x², so f(${x0}) = ${x0 ** 3 - N} and f′(${x0}) = ${3 * x0 * x0}.`, `x₁ = ${x0} − (${A(x0 ** 3 - N)})/${3 * x0 * x0} = ${fm(v)}.`])
  } },
  { lesson: 'derivative-applications', level: 3, make: (r) => {
    // l'Hopital: repeated 0/0
    const p = ri(r, 2, 5), t = ri(r, 1, 3), n = ri(r, 2, 5), a = rnz(r, -3, 3)
    const g = (nn: number, dd: number) => { const q = gcd(nn, dd); return fr(nn / q, dd / q) }
    if (t === 1) { const f = `(e^(${p === 1 ? '' : p}x)-1-${p === 1 ? '' : p}x)/x^2`; limitCheck(f, 0, (p * p) / 2); return numSpec(`Find the limit as x → 0 of ${S(f)}.`, g(p * p, 2), "Both the top and the bottom tend to 0, so use l'Hôpital's rule: differentiate the top and bottom separately. Repeat if you still get 0/0.", [`Top and bottom → 0. Differentiate both: (${p}e^(${p}x) − ${p})/(2x), still 0/0.`, `Again: ${p * p}e^(${p}x)/2 → ${p * p}/2.`]) }
    if (t === 2) { const f = `(sin(${p === 1 ? '' : p}x)-${p === 1 ? '' : p}x)/x^3`; limitCheck(f, 0, -(p ** 3) / 6); return numSpec(`Find the limit as x → 0 of ${S(f)}.`, g(-(p ** 3), 6), "Use l'Hôpital's rule, repeating it while the form is 0/0.", [`0/0: differentiate to get (${p}cos(${p}x) − ${p})/(3x²), still 0/0.`, `Again: −${p * p}sin(${p}x)/(6x), still 0/0. Once more: −${p ** 3}cos(${p}x)/6 → −${p ** 3}/6.`]) }
    const f = `(x^${n}-${A(a ** n).replace('−', '-')})/(x-${a})`.replace('-(-', '+(').replace(/--/g, '+')
    const src = `(x^${n}-(${a ** n}))/(x-(${a}))`
    limitCheck(src, a, n * a ** (n - 1))
    void f
    return numSpec(`Find the limit as x → ${A(a)} of (x^${n} − ${w(a ** n)})/(x − ${w(a)}).`.replace(/x\^(\d)/, (_m, d: string) => `x${'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]}`), fr(n * a ** (n - 1)), "The limit is 0/0, so use l'Hôpital's rule (this is also the definition of the derivative of xⁿ at a).", [`Differentiate the top and the bottom: ${n}x^${n - 1} / 1.`, `At x = ${A(a)}: ${n} × ${w(a)}^${n - 1} = ${A(n * a ** (n - 1))}.`])
  } },
  { lesson: 'derivative-applications', level: 3, make: (r) => {
    // l'Hopital: other forms
    const n = ri(r, 2, 4), k = ri(r, 2, 3), t = ri(r, 1, 4)
    if (t === 1) { const f = `x^${n}/e^(${k}x)`; limitCheck(f, 0, 0, 'inf'); return numSpec(`Find the limit as x → ∞ of ${S(f)}.`, fr(0), "The form is ∞/∞, so use l'Hôpital's rule repeatedly: each differentiation lowers the power of x, while the exponential stays.", [`∞/∞: differentiate top and bottom: ${n}${xs(n - 1)}/(${k}e^(${k}x)).`, `After ${n} steps the top is a constant and the bottom is still a multiple of e^(${k}x) → ∞, so the limit is 0.`, 'In general an exponential beats any power.']) }
    if (t === 2) { const f = `ln(x)/x^${n}`; limitCheck(f, 0, 0, 'inf'); return numSpec(`Find the limit as x → ∞ of ${S(f)}.`, fr(0), "∞/∞: use l'Hôpital's rule.", [`Differentiate: (1/x)/(${n}${xs(n - 1)}) = 1/(${n}${xs(n)}) → 0.`, 'A power beats a logarithm.']) }
    if (t === 3) { const f = 'ln(x)/(x-1)'; limitCheck(f, 1, 1, 'both'); return numSpec(`Find the limit as x → 1 of ${S(f)}.`, fr(1), "0/0: use l'Hôpital's rule.", ['Differentiate top and bottom: (1/x)/1 = 1/x.', 'At x = 1 this is 1.']) }
    const f = '(tan(x)-x)/x^3'; limitCheck(f, 0, 1 / 3)
    return numSpec(`Find the limit as x → 0 of ${S(f)}.`, fr(1, 3), "0/0: use l'Hôpital's rule, twice.", ['Differentiate: (sec²x − 1)/(3x²) = tan²x/(3x²), still 0/0 in this form.', 'Since tan x / x → 1, tan²x/(3x²) → 1/3. (Or differentiate again: 2 sec²x tan x/(6x) → 1/3.)'])
  } },
]

void noneSpec; void calcSpec
export type { Spec }
