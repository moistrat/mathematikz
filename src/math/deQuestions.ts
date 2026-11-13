/**
 * Question generators for Unit 12, lessons 'first-order-de' and 'second-order-de'.
 * Every solution formula is checked inside the generator by substituting it back into the equation numerically.
 */
import { fAdd, fDiv, fMul, fr, fSub } from './algebra'
import { calcSpec, fc, fm, fracPiSpec, MN, numSpec, odeText, ri, rnz, S, solves1, solves2, sup, w } from './calcHelpers'
import { exactSet, exF } from './equationQuestions'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const big = (r: () => number, lo: number, hi: number) => { let v = 0; while (Math.abs(v) < 2) v = ri(r, lo, hi); return v }
const words = (prompt: string, ws: string[], opts: string[], hint: string, expl: string[]): Spec => ({ prompt, kind: 'word', answers: [], display: ws[0], input: ws[0], words: ws, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: false, extra: opts } })
const sol = (prompt: string, rhsText: string, y: string, hint: string, expl: string[], dom?: [number, number]) => calcSpec(prompt, rhsText, y, hint, expl, { check: false, dom })
/** a coefficient times an expression, dropping a coefficient of 1 */
const times = (c: ReturnType<typeof fr>, e: string) => (c.n === 1 && c.d === 1 ? e : c.n === -1 && c.d === 1 ? `-${e}` : `${fc(c)}*${e}`)

export const FO_GENS: Gen[] = [
  { lesson: 'first-order-de', level: 1, make: (r) => {
    const k = big(r, -4, 4), a = ri(r, 1, 9), y = `${a}e^(${k}x)`
    solves1(y, (_, yy) => k * yy, [0, a])
    return sol(`Solve dy/dx = ${k}y with y(0) = ${a}. Give y as a function of x.`, `y'`, y, 'The solutions of dy/dx = ky are y = Ce^(kx). Use the initial condition to find C.', [`The general solution is y = Ce^(${k}x).`, `y(0) = C = ${a}, so C = ${a}.`, `y = ${S(y)}.`])
  } },
  { lesson: 'first-order-de', level: 1, make: (r) => {
    const a = big(r, -6, 8), b = rnz(r, -6, 6), c = rnz(r, -5, 9), cc = fr(a, 2)
    const y = `${fc(cc)}x^2${b === 0 ? '' : `${b > 0 ? '+' : ''}${b}x`}+${c}`.replace('+-', '-')
    solves1(y, (x) => a * x + b, [0, c])
    return sol(`Solve dy/dx = ${A(a)}x ${b < 0 ? `− ${-b}` : `+ ${b}`} with y(0) = ${A(c)}. Give y as a function of x.`, `y'`, y, 'Integrate both sides, then use the initial condition to find the constant.', [`Integrating: y = ${S(y.replace(/\+[-\d]+$/, ''))} + C.`, `y(0) = C = ${A(c)}.`])
  } },
  { lesson: 'first-order-de', level: 1, make: (r) => {
    const n0 = ri(r, 2, 20) * 8, T = ri(r, 2, 12), n = ri(r, 1, 3)
    const v = fr(n0, 2 ** n)
    return numSpec(`A radioactive sample has a half-life of ${T} years and starts with ${n0} g. How many grams remain after ${n * T} years?`, v, 'Each half-life halves the amount: after n half-lives you have N₀/2ⁿ. (This is the solution of dN/dt = −kN with k = ln 2 / T.)', [`${n * T} years is ${n} half-lives.`, `The mass is ${n0}/2${sup(n)} = ${fm(v)} g.`])
  } },
  { lesson: 'first-order-de', level: 2, make: (r) => {
    const a = ri(r, 1, 5), t = ri(r, 1, 4)
    let y: string, rhs: (x: number, y: number) => number, text: string, how: string[], dom: [number, number] | undefined
    if (t === 1) { y = `${a}e^(x^2/2)`; rhs = (x, yy) => x * yy; text = 'dy/dx = xy, y(0) = ' + a; how = ['Separate: dy/y = x dx. Integrate: ln|y| = x²/2 + C.', `So y = Ke^(x²/2), and y(0) = K = ${a}.`] }
    else if (t === 2) { y = `${a}/(1-${a}x)`; rhs = (_, yy) => yy * yy; text = `dy/dx = y², y(0) = ${a}`; dom = [0.02, 0.8 / a]; how = ['Separate: dy/y² = dx. Integrate: −1/y = x + C.', `y(0) = ${a} gives C = −1/${a}, so 1/y = 1/${a} − x, that is y = ${a}/(1 − ${a}x).`] }
    else if (t === 3) { y = `sqrt(x^2+${a * a})`; rhs = (x, yy) => x / yy; text = `dy/dx = x/y, y(0) = ${a} (y > 0)`; how = ['Separate: y dy = x dx. Integrate: y²/2 = x²/2 + C.', `y² = x² + K with y(0) = ${a} giving K = ${a * a}. Take the positive root.`] }
    else { y = `${a}x^2`; rhs = (x, yy) => (2 * yy) / x; text = `dy/dx = 2y/x, y(1) = ${a} (x > 0)`; dom = [0.3, 2]; how = ['Separate: dy/y = 2 dx/x. Integrate: ln|y| = 2 ln x + C.', `So y = Kx², and y(1) = K = ${a}.`] }
    solves1(y, rhs, t === 4 ? [1, a] : [0, a], t === 4 ? [0.5, 1, 1.5, 2] : t === 2 ? [0.2 / a, 0.4 / a, 0.6 / a] : [0.1, 0.2, 0.3])
    return sol(`Solve the separable equation ${text}. Give y as a function of x.`, `y'`, y, 'Separate the variables (all y on one side, all x on the other), integrate both sides, then use the initial condition.', [...how, `y = ${S(y)}.`], dom)
  } },
  { lesson: 'first-order-de', level: 2, make: (r) => {
    // linear with constant coefficients: y' + p y = q
    let p = ri(r, 2, 4), q = rnz(r, -6, 8), a = ri(r, -5, 6)
    while (fSub(fr(a), fr(q, p)).n === 0) a = ri(r, -5, 6)
    const ss = fr(q, p), cc = fSub(fr(a), ss)
    const y = `${fc(ss)}+${times(cc, `e^(-${p}x)`)}`.replace('+-', '-')
    solves1(y, (_, yy) => q - p * yy, [0, a])
    return sol(`Solve dy/dx + ${p}y = ${A(q)} with y(0) = ${A(a)}. Give y as a function of x.`, `y'`, y, 'Find the steady state (where dy/dx = 0), then add a decaying term Ce^(−px) and use the initial condition.', [`The steady state is y = ${A(q)}/${p} = ${fm(ss)}.`, `So y = ${fm(ss)} + Ce^(−${p}x), and y(0) = ${A(a)} gives C = ${A(a)} − ${w(ss.n)}${ss.d === 1 ? '' : `/${ss.d}`} = ${fm(cc)}.`])
  } },
  { lesson: 'first-order-de', level: 2, make: (r) => {
    // Euler's method
    const a = ri(r, 1, 3), h = pick(r, [fr(1, 2), fr(1, 4), fr(1)]), steps = ri(r, 2, 3), t = ri(r, 1, 2)
    const f = (x: ReturnType<typeof fr>, y: ReturnType<typeof fr>) => (t === 1 ? fAdd(x, y) : fSub(x, y))
    let x = fr(0), y = fr(a)
    const lines: string[] = []
    for (let i = 0; i < steps; i++) { const s = f(x, y); const yn = fAdd(y, fMul(h, s)); lines.push(`Step ${i + 1}: slope = ${fm(x)} ${t === 1 ? '+' : '−'} ${w(y.n)}${y.d === 1 ? '' : `/${y.d}`} = ${fm(s)}, so y = ${fm(y)} + ${fm(h)} × ${fm(s)} = ${fm(yn)}.`.replace('+ −', '− ')); y = yn; x = fAdd(x, h) }
    return numSpec(`Use Euler's method with step size h = ${fm(h)} to estimate y(${fm(x)}) for dy/dx = x ${t === 1 ? '+' : '−'} y, y(0) = ${a}. Give a fraction or decimal.`, y, "Euler's method: from (x, y) move to (x + h, y + h × f(x, y)), where f(x, y) is the slope given by the equation.", [...lines, `So y(${fm(x)}) ≈ ${fm(y)}.`])
  } },
  { lesson: 'first-order-de', level: 2, make: (r) => {
    // equilibrium in a mixing tank
    const V = ri(r, 2, 10) * 50, f = ri(r, 2, 10) * 5, c = ri(r, 1, 9)
    const inflow = f * c
    return numSpec(`A tank holds ${V} litres of water. Brine containing ${c} g of salt per litre flows in at ${f} litres per minute, and the well-mixed solution flows out at the same rate. In the long run, how many grams of salt are in the tank?`, fr(c * V), 'In the long run the salt amount stops changing: dS/dt = (salt in) − (salt out) = 0.', [`dS/dt = ${inflow} − (${f}/${V})S, where S is the grams of salt.`, `The equilibrium is where dS/dt = 0: S = ${inflow} × ${V}/${f} = ${c * V} g.`, 'Equivalently the concentration settles at the inflow concentration, so S = cV.'])
  } },
  { lesson: 'first-order-de', level: 3, make: (r) => {
    // integrating factor with x
    const m = ri(r, 1, 3), a = ri(r, 1, 5)
    const c = fSub(fr(a), fr(1, m + 2))
    const y = `x^2/${m + 2}+${times(c, `x^(-${m})`)}`.replace('+-', '-')
    solves1(y, (x, yy) => x - (m * yy) / x, [1, a], [0.5, 1, 1.5, 2])
    return sol(`Solve dy/dx + ${m === 1 ? '' : m}y/x = x for x > 0, with y(1) = ${a}. Give y as a function of x.`, `y'`, y, 'Multiply by the integrating factor μ = e^(∫ P dx), here xᵐ. Then the left side is (μy)′.', [`P(x) = ${m}/x, so μ = e^(${m} ln x) = x${sup(m)}.`, `(x${sup(m)} y)′ = x${sup(m + 1)}, so x${sup(m)} y = x${sup(m + 2)}/${m + 2} + C.`, `y = x²/${m + 2} + C x⁻${sup(m)}, and y(1) = ${a} gives C = ${fm(c)}.`], [0.4, 2.5])
  } },
  { lesson: 'first-order-de', level: 3, make: (r) => {
    // y' - p y = e^(q x)
    for (;;) {
      const p = ri(r, 1, 3), q = ri(r, 2, 5), a = ri(r, -3, 5)
      if (q <= p) continue
      const part = fr(1, q - p), cc = fSub(fr(a), part)
      if (cc.n === 0) continue
      const y = `${times(part, `e^(${q}x)`)}+${times(cc, `e^(${p === 1 ? '' : p}x)`)}`.replace('+-', '-')
      solves1(y, (_, yy) => Math.exp(q * _) + p * yy, [0, a], [0.2, 0.4, 0.6])
      return sol(`Solve dy/dx − ${p === 1 ? '' : p}y = e^(${q}x) with y(0) = ${A(a)}. Give y as a function of x.`, `y'`, y, 'Find a particular solution of the form Ae^(qx), then add the complementary solution Ce^(px) from the homogeneous equation.', [`Try y = Ae^(${q}x): (${q}A − ${p}A)e^(${q}x) = e^(${q}x), so A = ${fm(part)}.`, `The general solution is y = ${part.n === 1 && part.d === 1 ? '' : fm(part)}e^(${q}x) + Ce^(${p === 1 ? '' : p}x).`, `y(0) = ${A(a)} gives C = ${A(a)} − ${fm(part)} = ${fm(cc)}.`])
    }
  } },
  { lesson: 'first-order-de', level: 3, make: (r) => {
    // logistic growth
    const K = 100, P0 = pick(r, [10, 20, 25, 50]), rr = pick(r, [1, 2, 3]), k = (K - P0) / P0
    const y = `${K}/(1+${k}e^(-${rr === 1 ? '' : rr}x))`
    solves1(y, (_, yy) => rr * yy * (1 - yy / K), [0, P0], [0.2, 0.5, 1])
    return sol(`A population satisfies dP/dt = ${rr === 1 ? '' : rr}P(1 − P/${K}) with P(0) = ${P0}. The solution is P = ${K}/(1 + Ce^(−${rr === 1 ? '' : rr}t)). Find P as a function of the time, written in the variable x for t.`, `y'`, y, 'Substitute t = 0 into P = K/(1 + Ce^(−rt)) and solve for C.', [`P(0) = ${K}/(1 + C) = ${P0}, so 1 + C = ${K / P0} and C = ${k}.`, `P = ${K}/(1 + ${k}e^(−${rr === 1 ? '' : rr}t)). It levels off at the carrying capacity ${K}.`])
  } },
]

export const SO_GENS: Gen[] = [
  { lesson: 'second-order-de', level: 1, make: (r) => {
    let r1 = rnz(r, -5, 5), r2 = rnz(r, -5, 5)
    while (r1 === r2) r2 = rnz(r, -5, 5)
    const b = -(r1 + r2), c = r1 * r2
    const lhs = odeText(b, c)
    return exactSet(`Find the roots of the characteristic equation of ${lhs} = 0.`, [exF(fr(r1)), exF(fr(r2))], 'r', 'Replace y″, y′ and y by r², r and 1: the characteristic equation is r² + br + c = 0.', [`r² ${b < 0 ? `− ${Math.abs(b) === 1 ? '' : -b}r` : b === 0 ? '' : `+ ${b === 1 ? '' : b}r`} ${c < 0 ? `− ${-c}` : `+ ${c}`} = 0, which factors as (r ${r1 < 0 ? '+' : '−'} ${Math.abs(r1)})(r ${r2 < 0 ? '+' : '−'} ${Math.abs(r2)}) = 0.`, `The roots are ${A(r1)} and ${A(r2)}, so the general solution is y = C₁e^(${A(r1)}x) + C₂e^(${A(r2)}x).`.replace('e^(1x)', 'eˣ')])
  } },
  { lesson: 'second-order-de', level: 1, make: (r) => {
    const om = ri(r, 1, 10)
    return fracPiSpec(`A mass on a spring satisfies y″ + ${om * om}y = 0. What is the period of its oscillation? Give the answer in terms of π.`, fr(2, om), 'The solutions of y″ + ω²y = 0 are sines and cosines of ωt, with period 2π/ω.', [`Here ω² = ${om * om}, so ω = ${om}.`, `Period = 2π/${om} = ${fm(fr(2, om))}π.`])
  } },
  { lesson: 'second-order-de', level: 2, make: (r) => {
    let r1 = rnz(r, -3, 3), r2 = rnz(r, -3, 3), a = ri(r, -4, 6), b = ri(r, -6, 6)
    const co = () => { const B = fr(b - r1 * a, r2 - r1); return { B, Acoef: fSub(fr(a), B) } }
    while (r1 === r2 || co().B.n === 0 || co().Acoef.n === 0) { r1 = rnz(r, -3, 3); r2 = rnz(r, -3, 3); a = rnz(r, -4, 6); b = rnz(r, -6, 6); if (r1 === r2) continue }
    const { B, Acoef } = co()
    const y = `${times(Acoef, `e^(${r1}x)`)}+${times(B, `e^(${r2}x)`)}`.replace('+-', '-')
    solves2(y, -(r1 + r2), r1 * r2, () => 0, [a, b])
    const bb = -(r1 + r2), cc = r1 * r2
    return calcSpec(`Solve ${odeText(bb, cc)} = 0 with y(0) = ${A(a)} and y′(0) = ${A(b)}. Give y as a function of x.`, `y''`, y, 'Find the roots of the characteristic equation, write y = C₁e^(r₁x) + C₂e^(r₂x), then use both initial conditions to find C₁ and C₂.', [`The roots are r = ${A(r1)} and r = ${A(r2)}, so y = C₁e^(${A(r1)}x) + C₂e^(${A(r2)}x).`, `y(0): C₁ + C₂ = ${A(a)}. y′(0): ${A(r1)}C₁ ${r2 < 0 ? '−' : '+'} ${Math.abs(r2) === 1 ? '' : Math.abs(r2)}C₂ = ${A(b)}.`, `Solving gives C₁ = ${fm(Acoef)} and C₂ = ${fm(B)}.`], { check: false })
  } },
  { lesson: 'second-order-de', level: 2, make: (r) => {
    const om = ri(r, 2, 5), a = rnz(r, -4, 6), b = rnz(r, -8, 8)
    const co = fr(b, om)
    const y = `${a}cos(${om}x)+${times(co, `sin(${om}x)`)}`.replace('+-', '-')
    solves2(y, 0, om * om, () => 0, [a, b])
    return calcSpec(`Solve y″ + ${om * om}y = 0 with y(0) = ${A(a)} and y′(0) = ${A(b)}. Give y as a function of x.`, `y''`, y, 'The roots are r = ±iω, so y = A cos(ωx) + B sin(ωx). Then y(0) = A and y′(0) = ωB.', [`ω = ${om}, so y = A cos(${om}x) + B sin(${om}x).`, `y(0) = A = ${A(a)}, and y′(0) = ${om}B = ${A(b)}, so B = ${fm(co)}.`], { check: false })
  } },
  { lesson: 'second-order-de', level: 2, make: (r) => {
    let rr = rnz(r, -3, 3), a = rnz(r, -4, 6), b = ri(r, -6, 6)
    while (b - rr * a === 0) b = ri(r, -6, 6)
    const B = b - rr * a
    const y = `(${a}+${B}x)e^(${rr}x)`.replace('+-', '-')
    solves2(y, -2 * rr, rr * rr, () => 0, [a, b])
    const p = -2 * rr, q = rr * rr
    return calcSpec(`Solve ${odeText(p, q)} = 0 with y(0) = ${A(a)} and y′(0) = ${A(b)}. Give y as a function of x.`, `y''`, y, 'A repeated root r gives y = (C₁ + C₂x)e^(rx). Use both initial conditions.', [`The characteristic equation is (r ${rr < 0 ? '+' : '−'} ${Math.abs(rr)})² = 0, a repeated root r = ${A(rr)}.`, `y = (C₁ + C₂x)e^(${A(rr)}x). y(0) = C₁ = ${A(a)}.`, `y′(0) = ${A(rr)}C₁ + C₂ = ${A(b)}, so C₂ = ${A(B)}.`], { check: false })
  } },
  { lesson: 'second-order-de', level: 2, make: (r) => {
    const b = ri(r, 1, 8), c = ri(r, 1, 16), D = b * b - 4 * c
    const ws = D > 0 ? ['overdamped', 'over damped', 'overdamped (two real roots)'] : D === 0 ? ['critically damped', 'critical', 'critically damped (repeated root)'] : ['underdamped', 'under damped', 'underdamped (complex roots)']
    return words(`The motion ${odeText(b, c)} = 0 has characteristic equation r² + ${b === 1 ? '' : b}r + ${c} = 0. Is the motion overdamped, critically damped or underdamped?`, ws, ['overdamped', 'critically damped', 'underdamped'], 'Compute the discriminant b² − 4c. Positive: two real roots (overdamped). Zero: one repeated root (critically damped). Negative: complex roots (underdamped: oscillation).', [`Discriminant = ${b}² − 4(${c}) = ${A(D)}.`, D > 0 ? 'Positive: two distinct real roots, so the solution is a sum of exponentials: overdamped.' : D === 0 ? 'Zero: a repeated real root: critically damped.' : 'Negative: complex roots, so the solution oscillates with a changing size: underdamped.'])
  } },
  { lesson: 'second-order-de', level: 2, make: (r) => {
    const m = ri(r, 1, 4), om = ri(r, 1, 4), k = m * om * om
    return fracPiSpec(`A ${m} kg mass hangs on a spring of stiffness ${k} N/m. Its motion satisfies ${m === 1 ? '' : m}y″ + ${k}y = 0. Find the period of oscillation in seconds, in terms of π.`, fr(2, om), 'Divide by m to get y″ + (k/m)y = 0, so ω² = k/m and the period is 2π/ω.', [`ω² = ${k}/${m} = ${om * om}, so ω = ${om}.`, `Period = 2π/${om} = ${fm(fr(2, om))}π seconds.`])
  } },
  { lesson: 'second-order-de', level: 3, make: (r) => {
    // complex roots with a real part
    let al = ri(r, -2, 2), be = ri(r, 1, 3), a = rnz(r, -3, 5), b = ri(r, -5, 5)
    while (b - al * a === 0) b = ri(r, -5, 5)
    const co = fr(b - al * a, be)
    const y = `e^(${al}x)*(${a}cos(${be}x)+${times(co, `sin(${be}x)`)})`.replace('+-', '-')
    solves2(y, -2 * al, al * al + be * be, () => 0, [a, b])
    const p = -2 * al, q = al * al + be * be
    return calcSpec(`Solve ${odeText(p, q)} = 0 with y(0) = ${A(a)} and y′(0) = ${A(b)}. Give y as a function of x.`, `y''`, y, 'Complex roots α ± βi give y = e^(αx)(A cos βx + B sin βx). Find α and β from the characteristic equation, then use the initial conditions.', [`r = ${A(al)} ± ${be}i, so y = e^(${A(al)}x)(A cos ${be}x + B sin ${be}x).`, `y(0) = A = ${A(a)}. y′(0) = ${A(al)}A + ${be}B = ${A(b)}, so B = ${fm(co)}.`], { check: false })
  } },
  { lesson: 'second-order-de', level: 3, make: (r) => {
    // undetermined coefficients: a particular solution of a linear forcing term
    let m = rnz(r, -3, 4), n = rnz(r, -4, 5), p = ri(r, -3, 3), q = big(r, -4, 5)
    if (m === 0) m = 1
    const a = q * m, b = p * m + q * n
    const yp = `${m}x${n > 0 ? '+' : ''}${n}`
    solves2(yp, p, q, (x) => a * x + b)
    return calcSpec(`Find a particular solution of the form y = mx + n for ${odeText(p, q)} = ${A(a)}x ${b < 0 ? `− ${-b}` : b === 0 ? '' : `+ ${b}`}.`, `y''`, yp, 'Substitute y = mx + n (so y′ = m and y″ = 0) and match the coefficients of x and the constants.', [`With y = mx + n: y″ = 0 and y′ = m, so the left side is ${p === 0 ? '' : `${A(p)}m + `}${A(q)}(mx + n).`, `Matching the coefficients of x: ${A(q)}m = ${A(a)}, so m = ${A(m)}.`, `Matching the constants: ${p === 0 ? '' : `${A(p)}m + `}${A(q)}n = ${A(b)}, with m = ${A(m)}, so n = ${A(n)}.`], { check: false })
  } },
]
void words; void pick; void fDiv; void sup
