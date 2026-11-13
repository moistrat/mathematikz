/**
 * Question generators for Unit 11, lessons 'partial-derivatives' and 'multiple-integrals'.
 * Partial derivatives are checked against numerical partial derivatives, and double integrals against nested Simpson's rule.
 */
import { fAdd, fDiv, fMul, fr } from './algebra'
import { double } from './calculus'
import { fm, fracPiSpec, MN, must, noneSpec, numSpec, pdSpec, ri, rnz, S, sup, w, decSpec } from './calcHelpers'
import { pairSpec } from './equationQuestions'
import { evaluate } from './parse'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
type Term = [number, number, number] // coefficient, power of x, power of y
const mono = (c: number, i: number, j: number) => {
  const body = [i === 0 ? '' : i === 1 ? 'x' : `x^${i}`, j === 0 ? '' : j === 1 ? 'y' : `y^${j}`].filter(Boolean).join('*')
  if (!body) return String(c)
  return `${c === 1 ? '' : c === -1 ? '-' : `${c}${/^\d/.test(body) ? '*' : ''}`}${body}`.replace(/^(-?\d+)\*(x|y)/, '$1$2').replace(/^(-?\d+)(x|y)/, '$1$2')
}
const poly2 = (ts: Term[]) => ts.filter((t) => t[0] !== 0).map((t) => mono(...t)).join('+').replace(/\+-/g, '-') || '0'
const evalT = (ts: Term[], x: number, y: number) => ts.reduce((s, [c, i, j]) => s + c * x ** i * y ** j, 0)
const dxT = (ts: Term[]): Term[] => ts.filter((t) => t[1] > 0).map(([c, i, j]) => [c * i, i - 1, j])
const dyT = (ts: Term[]): Term[] => ts.filter((t) => t[2] > 0).map(([c, i, j]) => [c * j, i, j - 1])
const randTerms = (r: () => number, n = 3, maxDeg = 3): Term[] => {
  const out: Term[] = []
  const seen = new Set<string>()
  while (out.length < n) {
    const i = ri(r, 0, maxDeg), j = ri(r, 0, maxDeg - i)
    if (i + j === 0 || seen.has(`${i},${j}`)) continue
    if (i === 0 && j === 0) continue
    seen.add(`${i},${j}`); out.push([rnz(r, -5, 6), i, j])
  }
  return out.sort((a, b) => b[1] + b[2] - (a[1] + a[2]) || b[1] - a[1])
}
const f2 = (src: string) => `f(x, y) = ${S(src)}`
const pt = (x: number, y: number) => `(${A(x)}, ${A(y)})`

export const PD_GENS: Gen[] = [
  { lesson: 'partial-derivatives', level: 1, make: (r) => {
    const ts = randTerms(r, 3), src = poly2(ts), wrt = pick(r, ['x', 'y'] as const)
    const d = poly2(wrt === 'x' ? dxT(ts) : dyT(ts))
    return pdSpec(`Find ∂f/∂${wrt} for ${f2(src)}.`, src, d, wrt, `Treat the other variable as a constant and differentiate with respect to ${wrt}.`, [`Hold ${wrt === 'x' ? 'y' : 'x'} fixed and differentiate each term with respect to ${wrt}.`, `∂f/∂${wrt} = ${S(d)}.`])
  } },
  { lesson: 'partial-derivatives', level: 1, make: (r) => {
    const ts = randTerms(r, 3), a = ri(r, -3, 3), b = ri(r, -3, 3), wrt = pick(r, ['x', 'y'] as const)
    const d = wrt === 'x' ? dxT(ts) : dyT(ts), v = evalT(d, a, b)
    return numSpec(`For ${f2(poly2(ts))}, find ∂f/∂${wrt} at the point ${pt(a, b)}.`, fr(v), `Differentiate with respect to ${wrt} (treating the other variable as a constant), then substitute.`, [`∂f/∂${wrt} = ${S(poly2(d))}.`, `At ${pt(a, b)}: ${A(v)}.`])
  } },
  { lesson: 'partial-derivatives', level: 2, make: (r) => {
    // partial derivatives of exponentials, trig functions and quotients
    const k = ri(r, 2, 4), t = ri(r, 1, 7), wrt = pick(r, ['x', 'y'] as const)
    const T: { f: string; dx: string; dy: string; hx: string; hy: string }[] = [
      { f: 'x*e^(x*y)', dx: 'e^(x*y)+x*y*e^(x*y)', dy: 'x^2*e^(x*y)', hx: 'product rule: e^(xy) + x · y e^(xy)', hy: 'x is constant: x · x e^(xy)' },
      { f: 'sin(x*y)', dx: 'y*cos(x*y)', dy: 'x*cos(x*y)', hx: 'chain rule: cos(xy) × y', hy: 'chain rule: cos(xy) × x' },
      { f: 'ln(x^2+y^2)', dx: '2x/(x^2+y^2)', dy: '2y/(x^2+y^2)', hx: 'chain rule: (1/(x² + y²)) × 2x', hy: 'chain rule: (1/(x² + y²)) × 2y' },
      { f: 'sqrt(x^2+y^2)', dx: 'x/sqrt(x^2+y^2)', dy: 'y/sqrt(x^2+y^2)', hx: 'chain rule: (1/(2√(x² + y²))) × 2x', hy: 'chain rule: (1/(2√(x² + y²))) × 2y' },
      { f: `x^2*e^(${k}y)`, dx: `2x*e^(${k}y)`, dy: `${k}x^2*e^(${k}y)`, hx: `e^(${k}y) is constant`, hy: `chain rule on e^(${k}y): ${k}e^(${k}y)` },
      { f: 'x/y', dx: '1/y', dy: '-x/y^2', hx: 'y is constant: 1/y', hy: 'write x y⁻¹: −x y⁻²' },
      { f: `x^2*sin(${k}y)`, dx: `2x*sin(${k}y)`, dy: `${k}x^2*cos(${k}y)`, hx: `sin(${k}y) is constant`, hy: `chain rule on sin(${k}y): ${k}cos(${k}y)` },
    ]
    const c = T[t - 1]
    return pdSpec(`Find ∂f/∂${wrt} for ${f2(c.f)}.`, c.f, wrt === 'x' ? c.dx : c.dy, wrt, `Treat the other variable as a constant and use the usual rules (chain, product, quotient) in ${wrt}.`, [wrt === 'x' ? `With y constant: ${c.hx}.` : `With x constant: ${c.hy}.`, `∂f/∂${wrt} = ${S(wrt === 'x' ? c.dx : c.dy)}.`])
  } },
  { lesson: 'partial-derivatives', level: 2, make: (r) => {
    // the gradient at a point
    const ts = randTerms(r, 3), a = ri(r, -3, 3), b = ri(r, -3, 3)
    const gx = evalT(dxT(ts), a, b), gy = evalT(dyT(ts), a, b)
    return pairSpec(`Find the gradient vector ∇f at the point ${pt(a, b)} for ${f2(poly2(ts))}. Write it as (∂f/∂x, ∂f/∂y).`, fr(gx), fr(gy), 'The gradient is ∇f = (∂f/∂x, ∂f/∂y). Find each partial derivative and substitute the point.', [`∂f/∂x = ${S(poly2(dxT(ts)))} and ∂f/∂y = ${S(poly2(dyT(ts)))}.`, `At ${pt(a, b)}: ∇f = (${A(gx)}, ${A(gy)}).`])
  } },
  { lesson: 'partial-derivatives', level: 2, make: (r) => {
    // the directional derivative
    let ts = randTerms(r, 3), a = ri(r, -3, 3), b = ri(r, -3, 3)
    while (evalT(dxT(ts), a, b) === 0 || evalT(dyT(ts), a, b) === 0) { ts = randTerms(r, 3); a = ri(r, -3, 3); b = ri(r, -3, 3) }
    const [u, v, m] = pick(r, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [-3, 4, 5], [12, 5, 13], [3, -4, 5], [-5, 12, 13], [8, 15, 17]] as [number, number, number][])
    const gx = evalT(dxT(ts), a, b), gy = evalT(dyT(ts), a, b), val = fr(u * gx + v * gy, m)
    return numSpec(`Find the directional derivative of ${f2(poly2(ts))} at ${pt(a, b)} in the direction of the vector (${A(u)}, ${A(v)}).`, val, 'The directional derivative is ∇f · û, where û is the unit vector in the given direction: divide the vector by its length.', [`∇f at ${pt(a, b)} is (${A(gx)}, ${A(gy)}).`, `The length of (${A(u)}, ${A(v)}) is ${m}, so û = (${A(u)}/${m}, ${A(v)}/${m}).`, `D = (${A(gx)} × ${w(u)} + ${w(gy)} × ${w(v)})/${m} = ${fm(val)}.`])
  } },
  { lesson: 'partial-derivatives', level: 2, make: (r) => {
    // a mixed second partial derivative
    const ts = randTerms(r, 4, 4), a = ri(r, -2, 3), b = ri(r, -2, 3)
    const fxy = dyT(dxT(ts)), val = evalT(fxy, a, b)
    must(Math.abs(val - evalT(dxT(dyT(ts)), a, b)) < 1e-9, 'mixed partials equal')
    return numSpec(`For ${f2(poly2(ts))}, find the mixed partial derivative ∂²f/∂y∂x at ${pt(a, b)}.`, fr(val), 'Differentiate with respect to x first, then with respect to y. (For these functions the order does not matter.)', [`∂f/∂x = ${S(poly2(dxT(ts)))}.`, `∂²f/∂y∂x = ${S(poly2(fxy))}.`, `At ${pt(a, b)}: ${A(val)}.`])
  } },
  { lesson: 'partial-derivatives', level: 2, make: (r) => {
    // a stationary point of a quadratic in two variables
    for (;;) {
      const a = rnz(r, -3, 4), b = ri(r, -3, 3), c = rnz(r, -3, 4), p = ri(r, -3, 3), q = ri(r, -3, 3)
      if (4 * a * c - b * b === 0) continue
      const d = -(2 * a * p + b * q), e = -(b * p + 2 * c * q)
      const src = poly2([[a, 2, 0], [b, 1, 1], [c, 0, 2], [d, 1, 0], [e, 0, 1]])
      return pairSpec(`Find the stationary point of ${f2(src)}. Give it as (x, y).`, fr(p), fr(q), 'At a stationary point both partial derivatives are zero: solve ∂f/∂x = 0 and ∂f/∂y = 0 together.', [`∂f/∂x = ${S(poly2([[2 * a, 1, 0], [b, 0, 1], [d, 0, 0]]))} = 0 and ∂f/∂y = ${S(poly2([[b, 1, 0], [2 * c, 0, 1], [e, 0, 0]]))} = 0.`, `Solving the pair of equations gives x = ${A(p)}, y = ${A(q)}.`], (x) => Number.isFinite(x))
    }
  } },
  { lesson: 'partial-derivatives', level: 3, make: (r) => {
    // classify a stationary point (second derivative test)
    for (;;) {
      const a = rnz(r, -3, 4), b = ri(r, -4, 4), c = rnz(r, -3, 4), p = ri(r, -2, 2), q = ri(r, -2, 2)
      const D = 4 * a * c - b * b
      if (D === 0) continue
      const d = -(2 * a * p + b * q), e = -(b * p + 2 * c * q), k = ri(r, -4, 5)
      const src = poly2([[a, 2, 0], [b, 1, 1], [c, 0, 2], [d, 1, 0], [e, 0, 1], [k, 0, 0]])
      const words = D < 0 ? ['saddle point', 'saddle', 'a saddle point'] : a > 0 ? ['minimum', 'local minimum', 'min', 'a minimum'] : ['maximum', 'local maximum', 'max', 'a maximum']
      const opts = ['minimum', 'maximum', 'saddle point']
      return { prompt: `${f2(src)} has a stationary point at ${pt(p, q)}. Is it a minimum, a maximum or a saddle point?`, kind: 'word', answers: [], display: words[0], input: words[0], words, unit: '', needsExact: false, tol: 0, hint: 'Second derivative test: compute D = fxx fyy − (fxy)². If D < 0 it is a saddle point. If D > 0 it is a minimum when fxx > 0 and a maximum when fxx < 0.', explanation: [`fxx = ${A(2 * a)}, fyy = ${A(2 * c)}, fxy = ${A(b)}.`, `D = (${A(2 * a)})(${A(2 * c)}) − (${A(b)})² = ${A(D)}.`, D < 0 ? 'D < 0, so it is a saddle point.' : `D > 0 and fxx ${a > 0 ? '> 0' : '< 0'}, so it is a ${words[0]}.`], pad: { pi: false, root: false, comma: false, alg: false, extra: opts } } as Spec
    }
  } },
  { lesson: 'partial-derivatives', level: 3, make: (r) => {
    // the chain rule with two variables
    let p = rnz(r, -3, 4), q = ri(r, -3, 4), s = rnz(r, -3, 4), t0 = ri(r, 1, 3)
    let x = t0 * t0, y = t0 ** 3, fx = 2 * p * x + q * y, fy = q * x + 2 * s * y
    while (fx === 0 || fy === 0) { p = rnz(r, -3, 4); q = ri(r, -3, 4); s = rnz(r, -3, 4); t0 = ri(r, 1, 3); x = t0 * t0; y = t0 ** 3; fx = 2 * p * x + q * y; fy = q * x + 2 * s * y }
    const dz = fx * (2 * t0) + fy * (3 * t0 * t0)
    const src = poly2([[p, 2, 0], [q, 1, 1], [s, 0, 2]])
    const z = (t: number) => p * t ** 4 + q * t ** 5 + s * t ** 6
    must(Math.abs((z(t0 + 1e-6) - z(t0 - 1e-6)) / 2e-6 - dz) < 1e-3 * (1 + Math.abs(dz)), 'chain rule')
    return numSpec(`Let z = ${S(src)}, where x = t² and y = t³. Use the chain rule to find dz/dt when t = ${t0}.`, fr(dz), 'dz/dt = (∂z/∂x)(dx/dt) + (∂z/∂y)(dy/dt). Evaluate each factor at the given t.', [`∂z/∂x = ${S(poly2([[2 * p, 1, 0], [q, 0, 1]]))} and ∂z/∂y = ${S(poly2([[q, 1, 0], [2 * s, 0, 1]]))}. Also dx/dt = 2t and dy/dt = 3t².`, `At t = ${t0}: x = ${x}, y = ${y}, so ∂z/∂x = ${A(fx)}, ∂z/∂y = ${A(fy)}, dx/dt = ${2 * t0}, dy/dt = ${3 * t0 * t0}.`, `dz/dt = ${A(fx)} × ${2 * t0} + ${w(fy)} × ${3 * t0 * t0} = ${A(dz)}.`])
  } },
  { lesson: 'partial-derivatives', level: 3, make: (r) => {
    // the tangent plane
    let ts = randTerms(r, 3), a = ri(r, -2, 2), b = ri(r, -2, 2), c = a + rnz(r, -2, 2), d = b + rnz(r, -2, 2)
    while (evalT(dxT(ts), a, b) === 0 || evalT(dyT(ts), a, b) === 0 || evalT(ts, a, b) === 0) { ts = randTerms(r, 3); a = ri(r, -2, 2); b = ri(r, -2, 2); c = a + rnz(r, -2, 2); d = b + rnz(r, -2, 2) }
    const f0 = evalT(ts, a, b), fx = evalT(dxT(ts), a, b), fy = evalT(dyT(ts), a, b)
    const z = f0 + fx * (c - a) + fy * (d - b)
    return numSpec(`Find the height z of the tangent plane to z = ${S(poly2(ts))} at the point above ${pt(a, b)}, measured above the point ${pt(c, d)}. (The plane is z = f(a, b) + fx(a, b)(x − a) + fy(a, b)(y − b).)`, fr(z), 'Find f, fx and fy at (a, b), write the plane equation, and substitute the new x and y.', [`f${pt(a, b)} = ${A(f0)}, fx = ${A(fx)}, fy = ${A(fy)}.`, `z = ${A(f0)} + ${w(fx)}(x − ${w(a)}) + ${w(fy)}(y − ${w(b)}).`, `At ${pt(c, d)}: z = ${A(f0)} + ${w(fx)}(${A(c - a)}) + ${w(fy)}(${A(d - b)}) = ${A(z)}.`])
  } },
]

/* ------------------------------------------------------------------ multiple integrals */

/** the integral of x^i y^j over the rectangle [0,a] × [0,b] */
const rect = (i: number, j: number, a: number, b: number) => fr(a ** (i + 1) * b ** (j + 1), (i + 1) * (j + 1))
const rectTotal = (ts: Term[], a: number, b: number) => ts.reduce((s, [c, i, j]) => fAdd(s, fMul(fr(c), rect(i, j, a, b))), fr(0))
/** the integral of x^i y^j over the triangle 0 ≤ y ≤ x ≤ a, or over 0 ≤ y ≤ x² ≤ a² */
const tri = (i: number, j: number, a: number) => fr(a ** (i + j + 2), (j + 1) * (i + j + 2))
const parab = (i: number, j: number, a: number) => fr(a ** (i + 2 * j + 3), (j + 1) * (i + 2 * j + 3))

export const MI_GENS: Gen[] = [
  { lesson: 'multiple-integrals', level: 1, make: (r) => {
    const a = ri(r, 1, 3), b = ri(r, 1, 4), ts = randTerms(r, 3, 3)
    const v = rectTotal(ts, a, b), src = poly2(ts)
    must(Math.abs(double(src, 0, a, () => 0, () => b, 20) - v.n / v.d) < 1e-6, 'rectangle')
    return numSpec(`Evaluate the double integral of f(x, y) = ${S(src)} over the rectangle 0 ≤ x ≤ ${a}, 0 ≤ y ≤ ${b}.`, v, 'Integrate in one variable at a time. For a rectangle the order does not matter, and each term x^i y^j integrates to a^(i+1) b^(j+1) / ((i + 1)(j + 1)).', [`Integrate term by term: ${ts.map(([c, i, j]) => `${S(mono(c, i, j))} → ${fm(fMul(fr(c), rect(i, j, a, b)))}`).join(',  ')}.`, `The total is ${fm(v)}.`])
  } },
  { lesson: 'multiple-integrals', level: 1, make: (r) => {
    const a = ri(r, 1, 4), b = ri(r, 1, 4), al = ri(r, 1, 6), be = ri(r, 1, 4), ga = ri(r, 1, 4)
    const ts: Term[] = [[al, 0, 0], [be, 1, 0], [ga, 0, 1]]
    const v = rectTotal(ts, a, b)
    must(Math.abs(double(poly2(ts), 0, a, () => 0, () => b, 20) - v.n / v.d) < 1e-6, 'plane volume')
    return numSpec(`Find the volume under the plane z = ${S(poly2(ts))} above the rectangle 0 ≤ x ≤ ${a}, 0 ≤ y ≤ ${b}.`, v, 'Volume = the double integral of the height z over the rectangle.', [`V = ∫ from 0 to ${a} ∫ from 0 to ${b} of (${S(poly2(ts))}) dy dx.`, `The three terms give ${fm(rectTotal([ts[0]], a, b))}, ${fm(rectTotal([ts[1]], a, b))} and ${fm(rectTotal([ts[2]], a, b))}, so V = ${fm(v)}.`])
  } },
  { lesson: 'multiple-integrals', level: 2, make: (r) => {
    // average value over a rectangle
    const a = ri(r, 1, 3), b = ri(r, 1, 3), ts = randTerms(r, 2, 3)
    const v = fDiv(rectTotal(ts, a, b), fr(a * b))
    return numSpec(`Find the average value of f(x, y) = ${S(poly2(ts))} over the rectangle 0 ≤ x ≤ ${a}, 0 ≤ y ≤ ${b}.`, v, 'Average value = (double integral of f) / (area of the region).', [`The integral is ${fm(rectTotal(ts, a, b))} and the area is ${a} × ${b} = ${a * b}.`, `Average = ${fm(rectTotal(ts, a, b))}/${a * b} = ${fm(v)}.`])
  } },
  { lesson: 'multiple-integrals', level: 2, make: (r) => {
    // a triangular or parabolic region
    const a = ri(r, 1, 3), ts = randTerms(r, 2, 2).map(([c, i, j]) => [c, i, j] as Term), triangle = r() < 0.5
    const v = ts.reduce((s, [c, i, j]) => fAdd(s, fMul(fr(c), triangle ? tri(i, j, a) : parab(i, j, a))), fr(0))
    const src = poly2(ts)
    must(Math.abs(double(src, 0, a, () => 0, triangle ? (x) => x : (x) => x * x, 80) - v.n / v.d) < 1e-3 * (1 + Math.abs(v.n / v.d)), 'region')
    return numSpec(`Evaluate the double integral of f(x, y) = ${S(src)} over the region 0 ≤ x ≤ ${a}, 0 ≤ y ≤ ${triangle ? 'x' : 'x²'}.`, v, 'Integrate with respect to y first, with limits 0 to the upper boundary (a function of x), then integrate the result with respect to x.', [`Inner integral over y from 0 to ${triangle ? 'x' : 'x²'}: each term x^i y^j becomes x^i · ${triangle ? 'x^(j+1)' : 'x^(2j+2)'}/(j + 1).`, `Then integrate in x from 0 to ${a}: the total is ${fm(v)}.`])
  } },
  { lesson: 'multiple-integrals', level: 2, make: (r) => {
    // polar coordinates
    const a = ri(r, 1, 4), t = ri(r, 1, 4)
    if (t === 1) return fracPiSpec(`Evaluate the double integral of x² + y² over the disk x² + y² ≤ ${a * a}. Give the answer in terms of π.`, fr(a ** 4, 2), 'Switch to polar coordinates: x² + y² = r² and dA = r dr dθ, with r from 0 to a and θ from 0 to 2π.', [`∫ from 0 to 2π ∫ from 0 to ${a} of r² · r dr dθ = 2π [r⁴/4] from 0 to ${a}.`, `= 2π × ${a ** 4}/4 = ${fm(fr(a ** 4, 2))}π.`])
    if (t === 2) { const k = ri(r, 2, 6); return fracPiSpec(`Evaluate the double integral of the constant ${k} over the disk x² + y² ≤ ${a * a}. Give the answer in terms of π.`, fr(k * a * a), 'This is the constant times the area of the disk, πr². (Or use polar coordinates.)', [`The area of the disk is π(${a})² = ${a * a}π.`, `The integral is ${k} × ${a * a}π = ${k * a * a}π.`]) }
    if (t === 3) return fracPiSpec(`Evaluate the double integral of x² + y² over the quarter disk x ≥ 0, y ≥ 0, x² + y² ≤ ${a * a}. Give the answer in terms of π.`, fr(a ** 4, 8), 'Use polar coordinates with θ from 0 to π/2.', [`∫ from 0 to π/2 ∫ from 0 to ${a} of r³ dr dθ = (π/2) × ${a ** 4}/4.`, `= ${fm(fr(a ** 4, 8))}π.`])
    const v = fr(a ** 4, 8)
    must(Math.abs(double('x*y', 0, a, () => 0, (x) => Math.sqrt(Math.max(0, a * a - x * x)), 120) - v.n / v.d) < 0.02, 'quarter xy')
    return numSpec(`Evaluate the double integral of xy over the quarter disk x ≥ 0, y ≥ 0, x² + y² ≤ ${a * a}.`, v, 'Use polar coordinates: x = r cos θ, y = r sin θ, dA = r dr dθ.', [`xy = r² cos θ sin θ, so the integral is ∫ from 0 to π/2 of cos θ sin θ dθ × ∫ from 0 to ${a} of r³ dr.`, `The θ integral is 1/2 and the r integral is ${a ** 4}/4, so the result is ${fm(v)}.`])
  } },
  { lesson: 'multiple-integrals', level: 3, make: (r) => {
    // reversing the order of integration
    const k = ri(r, 2, 4), t = ri(r, 1, 3)
    const specs = [
      { f: 'e^(x^2)', name: 'e^(x²)', val: (Math.E - 1) / 2, ex: '(e − 1)/2', inner: '∫ from 0 to 1 of x e^(x²) dx = (e − 1)/2' },
      { f: 'sin(x^2)', name: 'sin(x²)', val: (1 - Math.cos(1)) / 2, ex: '(1 − cos 1)/2', inner: '∫ from 0 to 1 of x sin(x²) dx = (1 − cos 1)/2' },
      { f: 'cos(x^2)', name: 'cos(x²)', val: Math.sin(1) / 2, ex: '(sin 1)/2', inner: '∫ from 0 to 1 of x cos(x²) dx = (sin 1)/2' },
    ][t - 1]
    const v = k * specs.val
    must(Math.abs(double(`${k}*${specs.f}`, 0, 1, () => 0, (x) => x, 60) - v) < 1e-4, 'reversed order')
    return decSpec(`Evaluate ∫ from y = 0 to 1 of ∫ from x = y to 1 of ${k}${specs.name} dx dy. Give the answer to 4 decimal places. (Hint: the order as written cannot be done directly.)`, Number(v.toFixed(4)), 'Sketch the region: 0 ≤ y ≤ x ≤ 1. Reverse the order so that x is on the outside, with y running from 0 to x.', [`The region is the triangle 0 ≤ y ≤ x ≤ 1. Reversing: ∫ from x = 0 to 1 of ∫ from y = 0 to x of ${k}${specs.name} dy dx.`, `The inner integral is ${k}${specs.name} × x, so we need ${k} × ${specs.inner}.`, `= ${k} × ${specs.ex} ≈ ${v.toFixed(4)}.`], 4)
  } },
  { lesson: 'multiple-integrals', level: 3, make: (r) => {
    // volume under a paraboloid
    const a = ri(r, 1, 4), k = ri(r, 1, 3), v = fr(k * a ** 4, 2)
    const zf = `${k === 1 ? '' : `${k}*`}(${a * a}-x^2-y^2)`
    must(Math.abs(double(zf, -a, a, (x) => -Math.sqrt(Math.max(0, a * a - x * x)), (x) => Math.sqrt(Math.max(0, a * a - x * x)), 160) - (Math.PI * k * a ** 4) / 2) < 0.06 * k * a ** 3, 'paraboloid')
    const zt = k === 1 ? `${a * a} − x² − y²` : `${k}(${a * a} − x² − y²)`
    return fracPiSpec(`Find the volume of the solid between the xy-plane and the paraboloid z = ${zt}. Give the answer in terms of π.`, v, 'The paraboloid meets the plane where x² + y² = a², a disk. Integrate the height over that disk using polar coordinates.', [`In polar coordinates z = ${k === 1 ? '' : `${k}`}(${a * a} − r²), with r from 0 to ${a} and θ from 0 to 2π.`, `V = ∫ from 0 to 2π ∫ from 0 to ${a} of ${k === 1 ? '' : `${k}`}(${a * a} − r²) r dr dθ = ${k === 1 ? '' : `${k} × `}2π [${a * a}r²/2 − r⁴/4] from 0 to ${a}.`, `= ${k === 1 ? '' : `${k} × `}2π (${a ** 4}/2 − ${a ** 4}/4) = ${fm(v)}π.`])
  } },
  { lesson: 'multiple-integrals', level: 3, make: (r) => {
    // triple integrals
    const a = ri(r, 1, 3), b = ri(r, 1, 3), c = ri(r, 1, 3), t = ri(r, 1, 3)
    if (t === 1) { const v = fr(a * b * c * (a + b + c), 2); return numSpec(`Evaluate the triple integral of x + y + z over the box 0 ≤ x ≤ ${a}, 0 ≤ y ≤ ${b}, 0 ≤ z ≤ ${c}.`, v, 'Integrate each term over the box: the term x gives (a²/2)(b)(c), and similarly for y and z.', [`∫∫∫ x dV = (${a}²/2)(${b})(${c}) = ${fm(fr(a * a * b * c, 2))}, and similarly for y and z.`, `Total = abc(a + b + c)/2 = ${fm(v)}.`]) }
    if (t === 2) { const v = fr(a * a * b * b * c * c, 8); return numSpec(`Evaluate the triple integral of xyz over the box 0 ≤ x ≤ ${a}, 0 ≤ y ≤ ${b}, 0 ≤ z ≤ ${c}.`, v, 'The integrand factors, so the triple integral is a product of three single integrals.', [`∫ from 0 to ${a} of x dx = ${a * a}/2, and similarly ${b * b}/2 and ${c * c}/2.`, `The product is ${fm(v)}.`]) }
    const v = fr(a ** 3, 6)
    return numSpec(`Find the volume of the tetrahedron bounded by the coordinate planes and the plane x + y + z = ${a}.`, v, 'Integrate 1 over the region: z from 0 to a − x − y, y from 0 to a − x, x from 0 to a.', [`V = ∫ from 0 to ${a} ∫ from 0 to ${a} − x of (${a} − x − y) dy dx.`, `The inner integral is (${a} − x)²/2, and ∫ from 0 to ${a} of (${a} − x)²/2 dx = ${a}³/6.`, `V = ${fm(v)}.`])
  } },
]
void noneSpec; void evaluate; void sup
export const MV_GENS: Gen[] = [...PD_GENS, ...MI_GENS]
