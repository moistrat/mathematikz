/**
 * Question generators for Unit 10, lessons 'integration-techniques' (algebra first, by parts, partial fractions, trig)
 * and 'integral-applications' (volumes, mean value, rates, Simpson's rule, improper integrals).
 */
import { fAdd, fMul, fr } from './algebra'
import { defCheck, fm, fracPiSpec, intSpec, MN, must, noneSpec, numSpec, P, piSpec, polyDef, ri, rnz, S, sup, w } from './calcHelpers'
import { simpson } from './calculus'
import { antiP } from './intAnti'
import { approxSpec } from './powerQuestions'
import type { Gen } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const piTxt = (f: { n: number; d: number }) => (f.d === 1 ? `${f.n === 1 ? '' : f.n}π` : `${f.n === 1 ? '' : f.n}π/${f.d}`)
const integral = (f: string) => `Find ∫ ${S(f)} dx.`
const lx = (a: number) => (a > 0 ? `x-${a}` : a === 0 ? 'x' : `x+${-a}`)
const randPoly = (r: () => number, deg: number) => { const cs = Array.from({ length: deg + 1 }, () => (r() < 0.2 ? 0 : ri(r, -5, 8))); cs[deg] = rnz(r, 1, 5); return cs }

export const TECH_GENS: Gen[] = [
  { lesson: 'integration-techniques', level: 1, make: (r) => {
    // simplify first: divide through by x
    const p = rnz(r, -5, 7), q = rnz(r, -6, 8)
    const f = `(${P([0, q, p])})/x`
    return intSpec(integral(f), f, antiP([q, p]), 'There is no rule for a quotient like this, so simplify first: divide each term of the top by x.', [`(${S(P([0, q, p]))})/x = ${S(P([q, p]))} for x ≠ 0.`, `Integrate term by term: ${S(antiP([q, p]))} + C.`])
  } },
  { lesson: 'integration-techniques', level: 1, make: (r) => {
    // simplify first: difference of squares, expand, or split a root
    const a = ri(r, 2, 7), t = ri(r, 1, 3)
    if (t === 1) { const f = `(x^2-${a * a})/(x-${a})`; return intSpec(integral(f), f, antiP([a, 1]), 'Factor the top as a difference of squares and cancel.', [`x² − ${a * a} = (x − ${a})(x + ${a}), so the fraction is x + ${a} (x ≠ ${a}).`, `∫ (x + ${a}) dx = ${S(antiP([a, 1]))} + C.`]) }
    if (t === 2) { const f = `(x+${a})^2`; return intSpec(integral(f), f, antiP([a * a, 2 * a, 1]), 'Expand the bracket first, then integrate term by term.', [`(x + ${a})² = x² + ${2 * a}x + ${a * a}.`, `∫ = ${S(antiP([a * a, 2 * a, 1]))} + C.`]) }
    const f = `(x+${a})/sqrt(x)`, F = `2x*sqrt(x)/3+${2 * a}sqrt(x)`
    return intSpec(integral(f), f, F, 'Split the fraction and write each part as a power of x.', [`(x + ${a})/√x = x^(1/2) + ${a}x^(−1/2).`, `∫ = (2/3)x^(3/2) + ${2 * a}x^(1/2) + C.`], { pos: true })
  } },
  { lesson: 'integration-techniques', level: 2, make: (r) => {
    // integration by parts: x times an exponential, sine or cosine
    const k = ri(r, 2, 5), t = ri(r, 1, 3)
    if (t === 1) { const f = `x*e^(${k}x)`; return intSpec(integral(f), f, `(${k}x-1)*e^(${k}x)/${k * k}`, 'By parts: let u = x (it gets simpler when differentiated) and dv = e^(kx) dx.', [`u = x, dv = e^(${k}x) dx, so du = dx and v = e^(${k}x)/${k}.`, `∫ u dv = uv − ∫ v du = x e^(${k}x)/${k} − (1/${k})∫ e^(${k}x) dx.`, `= x e^(${k}x)/${k} − e^(${k}x)/${k * k} + C = (${k}x − 1)e^(${k}x)/${k * k} + C.`]) }
    if (t === 2) { const f = `x*sin(${k}x)`; return intSpec(integral(f), f, `(sin(${k}x)-${k}x*cos(${k}x))/${k * k}`, 'By parts: let u = x and dv = sin(kx) dx.', [`u = x, dv = sin(${k}x) dx, so du = dx and v = −cos(${k}x)/${k}.`, `∫ = −x cos(${k}x)/${k} + (1/${k})∫ cos(${k}x) dx = −x cos(${k}x)/${k} + sin(${k}x)/${k * k}.`, `Answer: (sin(${k}x) − ${k}x cos(${k}x))/${k * k} + C.`]) }
    const f = `x*cos(${k}x)`; return intSpec(integral(f), f, `(cos(${k}x)+${k}x*sin(${k}x))/${k * k}`, 'By parts: let u = x and dv = cos(kx) dx.', [`u = x, dv = cos(${k}x) dx, so du = dx and v = sin(${k}x)/${k}.`, `∫ = x sin(${k}x)/${k} − (1/${k})∫ sin(${k}x) dx = x sin(${k}x)/${k} + cos(${k}x)/${k * k}.`, `Answer: (cos(${k}x) + ${k}x sin(${k}x))/${k * k} + C.`])
  } },
  { lesson: 'integration-techniques', level: 2, make: (r) => {
    // definite integrals by parts
    const t = ri(r, 1, 7), k = ri(r, 2, 4), n = ri(r, 2, 3)
    if (t === 6) { defCheck(`x*sin(${k}x)`, 0, Math.PI / k, Math.PI / (k * k)); return fracPiSpec(`Evaluate ∫ from 0 to π/${k} of x sin(${k}x) dx. Give the answer in terms of π.`, fr(1, k * k), 'By parts with u = x and dv = sin(kx) dx.', [`∫ x sin(${k}x) dx = (sin(${k}x) − ${k}x cos(${k}x))/${k * k}.`, `At π/${k}: (0 − π cos π)/${k * k} = π/${k * k}. At 0 the value is 0, so the integral is π/${k * k}.`]) }
    if (t === 7) { const v = (n * Math.E ** (n + 1) + 1) / ((n + 1) ** 2); defCheck(`x^${n}*ln(x)`, 1, Math.E, v); return approxSpec(`Evaluate ∫ from 1 to e of x${sup(n)} ln x dx.`, v, 3, 'By parts with u = ln x and dv = xⁿ dx.', [`∫ x${sup(n)} ln x dx = x${sup(n + 1)}(${n + 1} ln x − 1)/${(n + 1) ** 2}.`, `At e: e${sup(n + 1)}(${n + 1} − 1)/${(n + 1) ** 2}; at 1: −1/${(n + 1) ** 2}.`, `Difference: (${n}e${sup(n + 1)} + 1)/${(n + 1) ** 2} ≈ ${v.toFixed(3)}.`]) }
    if (t === 1) { defCheck('x*e^x', 0, 1, 1); return numSpec('Evaluate ∫ from 0 to 1 of x eˣ dx.', fr(1), 'By parts with u = x and dv = eˣ dx.', ['∫ x eˣ dx = x eˣ − eˣ = (x − 1)eˣ.', '[(x − 1)eˣ] from 0 to 1 = 0 − (−1) = 1.']) }
    if (t === 2) { defCheck('x*sin(x)', 0, Math.PI, Math.PI); return piSpec('Evaluate ∫ from 0 to π of x sin x dx. Give the answer in terms of π.', 1, 'By parts with u = x and dv = sin x dx.', ['∫ x sin x dx = −x cos x + sin x.', '[−x cos x + sin x] from 0 to π = π − 0 = π.']) }
    if (t === 3) { defCheck('ln(x)', 1, Math.E, 1); return numSpec('Evaluate ∫ from 1 to e of ln x dx.', fr(1), 'Write ln x as 1 × ln x and use parts with u = ln x and dv = dx.', ['∫ ln x dx = x ln x − x.', '[x ln x − x] from 1 to e = (e − e) − (0 − 1) = 1.']) }
    if (t === 4) { const v = Math.PI / 2 - 1; defCheck('x*cos(x)', 0, Math.PI / 2, v); return approxSpec('Evaluate ∫ from 0 to π/2 of x cos x dx.', v, 3, 'By parts with u = x and dv = cos x dx.', ['∫ x cos x dx = x sin x + cos x.', '[x sin x + cos x] from 0 to π/2 = π/2 − 1.', `Numerically ${v.toFixed(3)}.`]) }
    const v = (Math.E ** 2 + 1) / 4; defCheck('x*ln(x)', 1, Math.E, v)
    return approxSpec('Evaluate ∫ from 1 to e of x ln x dx.', v, 3, 'By parts with u = ln x and dv = x dx.', ['∫ x ln x dx = x² ln x/2 − x²/4.', '[x² ln x/2 − x²/4] from 1 to e = (e²/2 − e²/4) − (0 − 1/4) = (e² + 1)/4.', `Numerically ${v.toFixed(3)}.`])
  } },
  { lesson: 'integration-techniques', level: 2, make: (r) => {
    // partial fractions: find a constant
    for (;;) {
      const a = rnz(r, -4, 4), b = rnz(r, -4, 4), A1 = rnz(r, -5, 6), B1 = rnz(r, -5, 6)
      if (a === b) continue
      const p = A1 + B1, q = -(A1 * b + B1 * a), askA = r() < 0.5
      const top = P([q, p])
      return numSpec(`Write (${S(top)})/((${S(lx(a))})(${S(lx(b))})) in the form A/(${S(lx(a))}) + B/(${S(lx(b))}). Find ${askA ? 'A' : 'B'}.`, fr(askA ? A1 : B1), `Multiply through by the denominator: ${S(top)} = A(${S(lx(b))}) + B(${S(lx(a))}). Substitute x = ${askA ? A(a) : A(b)} to remove the other term.`, [`${S(top)} = A(${S(lx(b))}) + B(${S(lx(a))}).`, `Put x = ${A(a)}: ${A(p * a + q)} = A(${A(a - b)}), so A = ${A(A1)}.`, `Put x = ${A(b)}: ${A(p * b + q)} = B(${A(b - a)}), so B = ${A(B1)}.`])
    }
  } },
  { lesson: 'integration-techniques', level: 2, make: (r) => {
    // trigonometric squares
    const k = ri(r, 1, 3), t = ri(r, 1, 3)
    const kk = k === 1 ? '' : k
    if (t === 1) { const f = `sin(${kk}x)^2`; return intSpec(integral(f), f, `x/2-sin(${2 * k}x)/${4 * k}`, 'Use sin²θ = (1 − cos 2θ)/2 to get something you can integrate.', [`sin²(${kk}x) = (1 − cos(${2 * k}x))/2.`, `∫ = x/2 − sin(${2 * k}x)/${4 * k} + C.`]) }
    if (t === 2) { const f = `cos(${kk}x)^2`; return intSpec(integral(f), f, `x/2+sin(${2 * k}x)/${4 * k}`, 'Use cos²θ = (1 + cos 2θ)/2 to get something you can integrate.', [`cos²(${kk}x) = (1 + cos(${2 * k}x))/2.`, `∫ = x/2 + sin(${2 * k}x)/${4 * k} + C.`]) }
    const f = `sin(${kk}x)*cos(${kk}x)`; return intSpec(integral(f), f, `sin(${kk}x)^2/${2 * k}`, 'Let u = sin(kx), so du = k cos(kx) dx. (Or use sin 2θ = 2 sin θ cos θ.)', [`u = sin(${kk}x), du = ${k} cos(${kk}x) dx.`, `∫ u du/${k} = u²/${2 * k}.`, `Answer: sin²(${kk}x)/${2 * k} + C.`])
  } },
  { lesson: 'integration-techniques', level: 3, make: (r) => {
    // by parts twice, and logarithms
    const n = ri(r, 2, 4), t = ri(r, 1, 6)
    switch (t) {
      case 1: return intSpec(integral('x^2*e^x'), 'x^2*e^x', '(x^2-2x+2)*e^x', 'By parts twice: each time let u be the power of x, which reduces by one.', ['u = x², dv = eˣ dx: ∫ = x²eˣ − 2∫ x eˣ dx.', '∫ x eˣ dx = (x − 1)eˣ, so the total is x²eˣ − 2(x − 1)eˣ.', 'Answer: (x² − 2x + 2)eˣ + C.'])
      case 2: return intSpec(integral('x*ln(x)'), 'x*ln(x)', 'x^2*ln(x)/2-x^2/4', 'By parts with u = ln x (it gets simpler) and dv = x dx.', ['u = ln x, dv = x dx, so du = dx/x and v = x²/2.', '∫ = (x²/2) ln x − ∫ (x/2) dx = (x²/2) ln x − x²/4.', 'Answer: x² ln x/2 − x²/4 + C.'], { pos: true })
      case 3: return intSpec(integral('ln(x)'), 'ln(x)', 'x*ln(x)-x', 'Write ln x as 1 × ln x and use parts with u = ln x and dv = dx.', ['u = ln x, dv = dx, so du = dx/x and v = x.', '∫ = x ln x − ∫ 1 dx = x ln x − x.', 'Answer: x ln x − x + C.'], { pos: true })
      case 4: return intSpec(integral('e^x*sin(x)'), 'e^x*sin(x)', 'e^x*(sin(x)-cos(x))/2', 'Parts twice returns the original integral: call it I and solve for I.', ['First: I = eˣ sin x − ∫ eˣ cos x dx. Second: ∫ eˣ cos x dx = eˣ cos x + I.', 'So I = eˣ sin x − eˣ cos x − I, which gives 2I = eˣ(sin x − cos x).', 'Answer: eˣ(sin x − cos x)/2 + C.'])
      case 5: return intSpec(integral('x^2*sin(x)'), 'x^2*sin(x)', '-x^2*cos(x)+2x*sin(x)+2cos(x)', 'By parts twice, with u = x² and then u = x.', ['u = x², dv = sin x dx: ∫ = −x² cos x + 2∫ x cos x dx.', '∫ x cos x dx = x sin x + cos x.', 'Answer: −x² cos x + 2x sin x + 2 cos x + C.'])
      default: { const m = n + 1; return intSpec(integral(`x^${n}*ln(x)`), `x^${n}*ln(x)`, `x^${m}*(${m}ln(x)-1)/${m * m}`, 'By parts with u = ln x and dv = xⁿ dx.', [`u = ln x, dv = x${sup(n)} dx, so du = dx/x and v = x${sup(m)}/${m}.`, `∫ = x${sup(m)} ln x/${m} − (1/${m})∫ x${sup(n)} dx = x${sup(m)} ln x/${m} − x${sup(m)}/${m * m}.`, `Answer: x${sup(m)}(${m} ln x − 1)/${m * m} + C.`], { pos: true }) }
    }
  } },
  { lesson: 'integration-techniques', level: 3, make: (r) => {
    // integrate using partial fractions
    for (;;) {
      const a = rnz(r, -3, 3), b = rnz(r, -3, 3), A1 = rnz(r, -4, 5), B1 = rnz(r, -4, 5)
      if (a === b) continue
      const p = A1 + B1, q = -(A1 * b + B1 * a), lo = Math.max(a, b) + 0.2
      const f = `(${P([q, p])})/((${lx(a)})*(${lx(b)}))`
      const F = `${A1}ln(${lx(a)})+${B1}ln(${lx(b)})`
      return intSpec(integral(f) .replace('Find', 'For x > ' + Math.max(a, b) + ', find'), f, F, 'Split into partial fractions A/(x − a) + B/(x − b), then each part integrates to a logarithm.', [`Write it as A/(${S(lx(a))}) + B/(${S(lx(b))}): A = ${A(A1)} and B = ${A(B1)}.`, `∫ = ${A(A1)} ln|${S(lx(a))}| + ${A(B1)} ln|${S(lx(b))}| + C.`.replace('+ −', '− '), `(For x > ${Math.max(a, b)} both brackets are positive, so the bars are not needed.)`], { dom: [lo, lo + 5] })
    }
  } },
  { lesson: 'integration-techniques', level: 3, make: (r) => {
    // a definite integral needing a trig identity
    const t = ri(r, 1, 3), k = ri(r, 1, 4), kk = k === 1 ? '' : k, pk = k === 1 ? 'π' : `π/${k}`, p2k = `π/${2 * k}`
    if (t === 1) { defCheck(`sin(${kk}x)^2`, 0, Math.PI / k, Math.PI / (2 * k)); return fracPiSpec(`Evaluate ∫ from 0 to ${pk} of sin²(${kk}x) dx. Give the answer in terms of π.`, fr(1, 2 * k), 'Use sin²θ = (1 − cos 2θ)/2.', [`sin²(${kk}x) = (1 − cos(${2 * k}x))/2.`, `[x/2 − sin(${2 * k}x)/${4 * k}] from 0 to ${pk} = π/${2 * k} − 0.`]) }
    if (t === 2) { defCheck(`cos(${kk}x)^2`, 0, Math.PI / (2 * k), Math.PI / (4 * k)); return fracPiSpec(`Evaluate ∫ from 0 to ${p2k} of cos²(${kk}x) dx. Give the answer in terms of π.`, fr(1, 4 * k), 'Use cos²θ = (1 + cos 2θ)/2.', [`cos²(${kk}x) = (1 + cos(${2 * k}x))/2.`, `[x/2 + sin(${2 * k}x)/${4 * k}] from 0 to ${p2k} = π/${4 * k} − 0.`]) }
    defCheck(`sin(${kk}x)^3`, 0, Math.PI / k, 4 / (3 * k)); return numSpec(`Evaluate ∫ from 0 to ${pk} of sin³(${kk}x) dx.`, fr(4, 3 * k), 'Write sin³θ = sin θ (1 − cos²θ) and let u = cos(kx).', [`u = cos(${kk}x), du = −${kk}sin(${kk}x) dx. The limits become cos 0 = 1 and cos π = −1.`, `∫ (1 − u²)(−du${k === 1 ? '' : `/${k}`}) from 1 to −1 = (1/${k}) ∫ from −1 to 1 of (1 − u²) du = (1/${k})(4/3) = ${fm(fr(4, 3 * k))}.`])
  } },
]

/* ------------------------------------------------------------------ applications */

export const APPL_GENS: Gen[] = [
  { lesson: 'integral-applications', level: 1, make: (r) => {
    // average value of a simple function
    const a = ri(r, 1, 6), k = ri(r, 2, 5), m = ri(r, 1, 6), t = ri(r, 1, 2)
    if (t === 1) { defCheck('x^2', 0, a, a ** 3 / 3); return numSpec(`Find the average value of f(x) = x² on the interval [0, ${a}].`, fr(a * a, 3), 'Average value = (1/(b − a)) ∫ f dx.', [`∫ from 0 to ${a} of x² dx = ${a}³/3 = ${a ** 3 / 3}.`, `Average = (1/${a}) × ${fm(fr(a ** 3, 3))} = ${fm(fr(a * a, 3))}.`]) }
    const b = a + ri(r, 1, 4), v = fr(k * (a + b) + 2 * m, 2)
    defCheck(P([m, k]), a, b, (v.n / v.d) * (b - a))
    return numSpec(`Find the average value of f(x) = ${S(P([m, k]))} on the interval [${a}, ${b}].`, v, 'Average value = (1/(b − a)) ∫ f dx. For a straight line it is the value at the midpoint.', [`∫ from ${a} to ${b} = ${fm(polyDef([m, k], a, b))}, and the length is ${b - a}.`, `Average = ${fm(v)}.`])
  } },
  { lesson: 'integral-applications', level: 1, make: (r) => {
    // accumulated change from a rate
    const k = ri(r, 1, 6), m = ri(r, 0, 9), T = ri(r, 2, 8), water = r() < 0.5
    const v = fr(k * T * T + 2 * m * T, 2)
    defCheck(P([m, k]), 0, T, v.n / v.d)
    return numSpec(water ? `Water flows into a tank at a rate of ${S(P([m, k], 't'))} litres per minute at time t minutes. How many litres flow in during the first ${T} minutes?` : `A car has velocity ${S(P([m, k], 't'))} m/s at time t seconds. How far does it travel in the first ${T} seconds?`, v, 'The total change is the integral of the rate of change over the time interval.', [`Total = ∫ from 0 to ${T} of (${S(P([m, k], 't'))}) dt = [${S(antiP([m, k]).replace(/x/g, 't'))}] from 0 to ${T}.`, `= ${fm(v)} ${water ? 'litres' : 'metres'}.`])
  } },
  { lesson: 'integral-applications', level: 2, make: (r) => {
    // volume of revolution about the x-axis
    const a = ri(r, 1, 5), k = ri(r, 2, 4), t = ri(r, 1, 3)
    let f: string, V: { n: number; d: number }, desc: string
    if (t === 1) { f = 'sqrt(x)'; V = fr(a * a, 2); desc = 'y = √x' }
    else if (t === 2) { f = `${k === 1 ? '' : k}x`; V = fr(k * k * a ** 3, 3); desc = `y = ${k === 1 ? '' : k}x` }
    else { f = 'x^2'; V = fr(a ** 5, 5); desc = 'y = x²' }
    defCheck(`(${f})^2`, 0, a, (V.n / V.d))
    return fracPiSpec(`The region under ${desc} between x = 0 and x = ${a} is rotated once about the x-axis. Find the volume of the solid. Give the answer in terms of π.`, V, 'Disc method: V = π ∫ y² dx.', [`V = π ∫ from 0 to ${a} of (${S(f)})² dx = π ∫ ${S(t === 1 ? 'x' : t === 2 ? `${k * k}x^2` : 'x^4')} dx.`, `= π [${S(t === 1 ? 'x^2/2' : t === 2 ? `${k * k}x^3/3` : 'x^5/5')}] from 0 to ${a} = ${piTxt(V)}.`])
  } },
  { lesson: 'integral-applications', level: 2, make: (r) => {
    // mean value of a polynomial
    const cs = randPoly(r, ri(r, 2, 3)), a = ri(r, -1, 1), b = a + ri(r, 2, 4)
    const I = polyDef(cs, a, b), avg = fMul(I, fr(1, b - a))
    defCheck(P(cs), a, b, I.n / I.d)
    return numSpec(`Find the average value of f(x) = ${S(P(cs))} on the interval [${A(a)}, ${b}].`, avg, 'Average value = (1/(b − a)) ∫ f dx.', [`∫ from ${A(a)} to ${b} of f dx = ${fm(I)}.`, `Average = (1/${b - a}) × ${fm(I)} = ${fm(avg)}.`])
  } },
  { lesson: 'integral-applications', level: 2, make: (r) => {
    // Simpson's rule
    const cs = [ri(r, -3, 6), ri(r, -4, 6), ri(r, -3, 4), ri(r, 1, 3)], h = pick(r, [1, 1, 2]), a = ri(r, 0, 2)
    const f = (x: number) => cs.reduce((s, c, e) => s + c * x ** e, 0)
    const sv = fr(f(a) + 4 * f(a + h) + f(a + 2 * h), 1)
    const est = fMul(sv, fr(h, 3))
    must(Math.abs(est.n / est.d - simpson(P(cs), a, a + 2 * h)) < 1e-9, "Simpson's rule is exact for cubics")
    return numSpec(`Use Simpson's rule with 2 strips to estimate ∫ from ${a} to ${a + 2 * h} of (${S(P(cs))}) dx.`, est, "Simpson's rule: (h/3)(y₀ + 4y₁ + y₂), where h is the strip width.", [`h = ${h}. The x-values are ${a}, ${a + h}, ${a + 2 * h}, giving y₀ = ${f(a)}, y₁ = ${f(a + h)}, y₂ = ${f(a + 2 * h)}.`, `Estimate = (${h}/3)(${f(a)} + 4 × ${w(f(a + h))} + ${w(f(a + 2 * h))}) = ${fm(est)}.`, 'For a cubic, Simpson’s rule is exact.'])
  } },
  { lesson: 'integral-applications', level: 2, make: (r) => {
    // improper integral to infinity of a power
    const k = ri(r, 2, 6), p = pick(r, [2, 3, 4, 5, 1, 0.5])
    const shown = p === 0.5 ? '√x' : p === 1 ? 'x' : `x${sup(p)}`
    const prompt = `Evaluate ∫ from 1 to ∞ of ${k === 1 ? '1' : k}/${shown} dx, or say that it diverges.`
    if (p <= 1) return noneSpec(prompt, 'diverges', 'Integrate up to a limit B, then let B → ∞. If the answer grows without bound the integral diverges.', [p === 1 ? '∫ from 1 to B of 1/x dx = ln B, which grows without bound as B → ∞.' : '∫ from 1 to B of x^(−1/2) dx = 2√B − 2, which grows without bound as B → ∞.', 'So the integral diverges.'])
    return numSpec(prompt, fr(k, p - 1), 'Integrate up to a limit B, then let B → ∞. For p > 1 the term B^(1−p) tends to 0.', [`∫ from 1 to B of ${k}x${sup(-p)} dx = [${k}x${sup(1 - p)}/(${A(1 - p)})] = ${k}/${p - 1} × (1 − B${sup(1 - p)}).`, `As B → ∞, B${sup(1 - p)} → 0, so the integral is ${fm(fr(k, p - 1))}.`])
  } },
  { lesson: 'integral-applications', level: 3, make: (r) => {
    // washer method
    const k = ri(r, 2, 6), m = ri(r, 2, 5)
    if (r() < 0.5) {
      const V = fr(2 * k ** 5, 15)
      defCheck(`(${k}x)^2-x^4`, 0, k, (V.n / V.d))
      return fracPiSpec(`The region between the line y = ${k}x and the parabola y = x² is rotated about the x-axis. Find the volume of the solid. Give the answer in terms of π.`, V, 'Washer method: V = π ∫ (outer² − inner²) dx, where the outer radius is the curve further from the axis.', [`The curves meet where x² = ${k}x: x = 0 and x = ${k}. In between, the line is the outer curve.`, `V = π ∫ from 0 to ${k} of (${k * k}x² − x⁴) dx = π [${k * k}x³/3 − x⁵/5] = π(${k ** 5}/3 − ${k ** 5}/5).`, `= ${piTxt(V)}.`])
    }
    const V = fr(8 * m ** 5, 5)
    defCheck(`(${m * m})^2-x^4`, -m, m, V.n / V.d)
    return fracPiSpec(`The region between the parabola y = x² and the line y = ${m * m} is rotated about the x-axis. Find the volume of the solid. Give the answer in terms of π.`, V, 'Washer method: the line is the outer curve and the parabola the inner. Use the symmetry about the y-axis.', [`The curves meet at x = ±${m}. V = π ∫ from −${m} to ${m} of (${m ** 4} − x⁴) dx = 2π ∫ from 0 to ${m} of (${m ** 4} − x⁴) dx.`, `= 2π [${m ** 4}x − x⁵/5] from 0 to ${m} = 2π(${m ** 5} − ${m ** 5}/5) = ${piTxt(V)}.`])
  } },
  { lesson: 'integral-applications', level: 3, make: (r) => {
    // cylindrical shells about the y-axis
    const a = ri(r, 1, 4), k = ri(r, 2, 4), t = ri(r, 1, 2)
    const V = t === 1 ? fr(a ** 4, 2) : fr(2 * k * a ** 3, 3)
    const f = t === 1 ? 'x^2' : `${k === 1 ? '' : k}x`
    defCheck(`2*x*(${f})`, 0, a, V.n / V.d)
    return fracPiSpec(`The region under y = ${S(f)} between x = 0 and x = ${a} is rotated about the y-axis. Use cylindrical shells to find the volume. Give the answer in terms of π.`, V, 'Shell method: V = 2π ∫ x · y dx (a shell of radius x, height y and thickness dx).', [`V = 2π ∫ from 0 to ${a} of x(${S(f)}) dx = 2π ∫ ${S(t === 1 ? 'x^3' : `${k}x^2`)} dx.`, `= 2π [${t === 1 ? `x⁴/4` : `${k}x³/3`}] from 0 to ${a} = ${piTxt(V)}.`])
  } },
  { lesson: 'integral-applications', level: 3, make: (r) => {
    // improper integrals with exponentials and at a singular point
    const k = ri(r, 2, 5), a = ri(r, 2, 6), t = ri(r, 1, 4)
    if (t === 1) { defCheck(`${a}*e^(-${k}x)`, 0, 15 / k, a / k); return numSpec(`Evaluate ∫ from 0 to ∞ of ${a === 1 ? '' : a}e^(−${k}x) dx.`, fr(a, k), 'Integrate up to B and let B → ∞: e^(−kB) → 0.', [`∫ from 0 to B of ${a}e^(−${k}x) dx = [−${a}e^(−${k}x)/${k}] = ${a}/${k} × (1 − e^(−${k}B)).`, `As B → ∞, e^(−${k}B) → 0, so the integral is ${fm(fr(a, k))}.`]) }
    if (t === 2) { defCheck(`x*e^(-${k}x)`, 0, 15 / k, 1 / (k * k)); return numSpec(`Evaluate ∫ from 0 to ∞ of x e^(−${k}x) dx.`, fr(1, k * k), 'By parts, then let B → ∞. Remember that B e^(−kB) → 0.', [`∫ x e^(−${k}x) dx = −x e^(−${k}x)/${k} − e^(−${k}x)/${k * k}.`, `[...] from 0 to ∞: the terms with e^(−${k}B) vanish, leaving 0 − (0 − 1/${k * k}) = 1/${k * k}.`]) }
    if (t === 3) return numSpec(`Evaluate ∫ from 0 to 1 of ${a}/√x dx. (The integrand is unbounded at x = 0.)`, fr(2 * a), 'Integrate from ε to 1 and let ε → 0⁺.', [`∫ from ε to 1 of ${a}x^(−1/2) dx = [${2 * a}√x] from ε to 1 = ${2 * a}(1 − √ε).`, `As ε → 0⁺, √ε → 0, so the integral is ${2 * a}.`])
    return noneSpec(`Evaluate ∫ from 0 to 1 of ${a === 1 ? '1' : a}/x dx, or say that it diverges.`, 'diverges', 'Integrate from ε to 1 and let ε → 0⁺.', [`∫ from ε to 1 of ${a}/x dx = ${a}(ln 1 − ln ε) = −${a} ln ε.`, 'As ε → 0⁺, −ln ε grows without bound, so the integral diverges.'])
  } },
]
void fAdd
