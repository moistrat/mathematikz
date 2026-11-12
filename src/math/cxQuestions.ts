/**
 * Question generators for Unit 8: complex numbers and vectors.
 *
 * Complex arithmetic is exact (rational real and imaginary parts), so answers are compared as numbers. Vector questions use
 * integer data, and answers come out as exact fractions or surds.
 */
import { fmtFrac, fNum, fr, fMul, Frac, gcdI } from './algebra'
import { numSpec, ri, rnz } from './algebraQuestions'
import { MN } from './equationQuestions'
import { cNum, Cx, cAbs2, cAdd, cConj, cDiv, cMul, cPow, cSub, cx, cxInput, fmtCx } from './complex'
import { cosExact, fmtDeg, fmtPi, fmtSurd, MINUS, piInput, sinExact, surd, surdInput, surdMul, surdValue, Surd } from './exact'
import { approxSpec, radicalSpec } from './powerQuestions'
import type { Gen, Spec } from './questions'
import { root } from './radicals'
import { pick } from './rng'

const fm = (f: Frac) => fmtFrac(f)
const w = (n: number) => (n < 0 ? `(${MN(String(n))})` : String(n))
const bracket = (z: Cx) => `(${fmtCx(z)})`
const deg = (r: number) => (r * 180) / Math.PI
const rad = (d: number) => (d * Math.PI) / 180
const f1 = (x: number) => x.toFixed(1)
const must = (ok: boolean, what: string) => { if (!ok) throw new Error(`self-check failed: ${what}`) }

function cxSpec(prompt: string, answers: Cx[], hint: string, expl: string[]): Spec {
  return {
    prompt, kind: 'complex', cx: answers, answers: [], display: answers.map(fmtCx).join(',  '), input: answers.map(cxInput).join(', '), unit: '', needsExact: false, tol: 0, hint, explanation: expl,
    pad: { pi: false, root: false, comma: answers.length > 1, alg: true },
  }
}

/** an ordered tuple of exact fractions (a vector, a point, a pair of coordinates) */
function tupleSpec(prompt: string, vals: Frac[], hint: string, expl: string[], open = '('): Spec {
  const close = open === '(' ? ')' : open
  return {
    prompt, kind: 'pair', answers: vals.map(fNum), display: `${open}${vals.map(fm).join(', ')}${close}`, input: `(${vals.map((v) => fm(v).replace(MINUS, '-')).join(', ')})`, unit: '',
    needsExact: vals.some((v) => { let d = v.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d !== 1 }), tol: 1e-9, hint, explanation: expl, pad: { pi: false, root: false, comma: true, alg: true },
  }
}

/** a pair of exact surds, such as the rectangular form of a number given in polar form */
function surdPair(prompt: string, x: Surd, y: Surd, hint: string, expl: string[]): Spec {
  return {
    prompt, kind: 'pair', answers: [surdValue(x), surdValue(y)], display: `(${fmtSurd(x)}, ${fmtSurd(y)})`, input: `(${surdInput(x)}, ${surdInput(y)})`, unit: '', needsExact: true, tol: 1e-9, hint, explanation: expl,
    pad: { pi: false, root: true, comma: true, alg: true },
  }
}

/** c1 v1 + c2 v2 as text, leaving out zero parts and writing ±1 coefficients without the 1 */
const two = (c1: number, v1: string, c2: number, v2: string) => { const t = (c: number, v: string, first: boolean) => (c === 0 ? '' : `${first ? (c < 0 ? MINUS : '') : ` ${c < 0 ? MINUS : '+'} `}${Math.abs(c) === 1 ? '' : Math.abs(c)}${v}`); return (t(c1, v1, true) + t(c2, v2, c1 === 0)) || '0' }
const gauss = (r: () => number, lo = -6, hi = 6): Cx => cx(rnz(r, lo, hi), rnz(r, lo, hi))
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]]

/* ------------------------------------------------------------------ 1. complex arithmetic */

const ARITH: Gen[] = [
  { lesson: 'complex-arithmetic', level: 1, make: (r) => {
    const a = gauss(r), b = gauss(r), plus = r() < 0.5
    const val = plus ? cAdd(a, b) : cSub(a, b)
    return cxSpec(`Calculate ${bracket(a)} ${plus ? '+' : MINUS} ${bracket(b)}.`, [val], 'Add (or subtract) the real parts and the imaginary parts separately.', [
      `Real parts: ${w(a.re.n)} ${plus ? '+' : MINUS} ${w(b.re.n)} = ${fm(val.re)}.`, `Imaginary parts: ${w(a.im.n)} ${plus ? '+' : MINUS} ${w(b.im.n)} = ${fm(val.im)}.`, `The result is ${fmtCx(val)}.`])
  } },
  { lesson: 'complex-arithmetic', level: 1, make: (r) => {
    const a = gauss(r, -5, 5), b = gauss(r, -5, 5)
    const val = cMul(a, b)
    return cxSpec(`Calculate ${bracket(a)}${bracket(b)}.`, [val], 'Multiply out like two brackets, then replace i² by −1.', [
      `Expand: ${bracket(a)}${bracket(b)} = ${a.re.n * b.re.n} + ${w(a.re.n * b.im.n)}i + ${w(a.im.n * b.re.n)}i + ${w(a.im.n * b.im.n)}i².`, `Replace i² by ${MINUS}1: the last term becomes ${MN(String(-a.im.n * b.im.n))}.`, `Collect: real part ${fm(val.re)}, imaginary part ${fm(val.im)}, so ${fmtCx(val)}.`])
  } },
  { lesson: 'complex-arithmetic', level: 1, make: (r) => {
    const n = ri(r, 5, 99)
    const val = cPow(cx(0, 1), n)
    return cxSpec(`Simplify i^${n}.`, [val], 'The powers of i repeat in a cycle of four: i, −1, −i, 1. Divide the power by 4 and use the remainder.', [
      'i¹ = i, i² = −1, i³ = −i, i⁴ = 1, and then the cycle repeats.', n % 4 === 0 ? `${n} is a multiple of 4, so i^${n} = (i⁴)^${n / 4} = 1.` : `${n} = 4 × ${Math.floor(n / 4)} + ${n % 4}, so i^${n} = (i⁴)^${Math.floor(n / 4)} × i^${n % 4} = i^${n % 4}.`, `That is ${fmtCx(val)}.`])
  } },
  { lesson: 'complex-arithmetic', level: 2, make: (r) => {
    // division by a complex number
    for (;;) {
      const a = gauss(r, -6, 6), b = gauss(r, -4, 4)
      if (b.re.n === 0 && b.im.n === 0) continue
      const val = cDiv(a, b)
      const conj = cConj(b)
      const num = cMul(a, conj), den = cAbs2(b)
      return cxSpec(`Write ${bracket(a)} / ${bracket(b)} in the form a + bi.`, [val], 'Multiply the top and the bottom by the conjugate of the denominator. The bottom becomes the real number c² + d².', [
        `The conjugate of ${fmtCx(b)} is ${fmtCx(conj)}. Multiply top and bottom by it.`, `Top: ${bracket(a)}${bracket(conj)} = ${fmtCx(num)}.`, `Bottom: ${bracket(b)}${bracket(conj)} = ${b.re.n}² + ${b.im.n}² = ${fm(den)}.`, `So the quotient is ${fmtCx(num)} over ${fm(den)}, which is ${fmtCx(val)}.`])
    }
  } },
  { lesson: 'complex-arithmetic', level: 2, make: (r) => {
    // modulus, conjugate product
    const [p, q, h] = pick(r, TRIPLES), sp = r() < 0.5 ? 1 : -1, sq = r() < 0.5 ? 1 : -1
    const z = cx(sp * p, sq * q)
    if (r() < 0.5) return radicalSpec(`Find the modulus |${fmtCx(z)}|.`, root(h, 0, 1), 'The modulus is the distance from the origin: |a + bi| = √(a² + b²).', [`|z| = √(${p}² + ${q}²) = √${p * p + q * q} = ${h}.`], [])
    const val = cMul(z, cConj(z))
    return cxSpec(`Calculate ${bracket(z)}${bracket(cConj(z))} (a number times its conjugate).`, [val], 'A number times its conjugate is always the real number a² + b², the square of the modulus.', [`${bracket(z)}${bracket(cConj(z))} = a² + b² = ${p}² + ${q}² = ${p * p + q * q}.`])
  } },
  { lesson: 'complex-arithmetic', level: 2, make: (r) => {
    // solve a linear equation in z
    const z = gauss(r, -4, 5), c = gauss(r, -3, 3)
    if (c.re.n === 0 && c.im.n === 0) return ARITH[3].make(r)
    const rhs = cMul(z, c)
    return cxSpec(`Solve ${bracket(c)}z = ${fmtCx(rhs)} for the complex number z.`, [z], 'Divide both sides by the complex number, using its conjugate to clear the denominator.', [
      `z = ${fmtCx(rhs)} / ${bracket(c)}.`, `Multiply top and bottom by ${fmtCx(cConj(c))}: the denominator becomes ${fm(cAbs2(c))}.`, `z = ${fmtCx(z)}.`])
  } },
  { lesson: 'complex-arithmetic', level: 3, make: (r) => {
    // complex roots of a quadratic
    for (let tries = 0; tries < 400; tries++) {
      const a = pick(r, [1, 1, 1, 2]), b = ri(r, -8, 8), m = pick(r, [2, 4, 6, 8, 10])
      const num = b * b + m * m
      if (num % (4 * a) !== 0) continue
      const c = num / (4 * a)
      const re = fr(-b, 2 * a), im = fr(m, 2 * a)
      must(b * b - 4 * a * c === -m * m, 'discriminant')
      const quad = `${a === 1 ? '' : a}z² ${b === 0 ? '' : `${b < 0 ? MINUS : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}z `}+ ${c}`.replace(/\s+/g, ' ')
      const roots = [cx(re, im), cx(re, fr(-im.n, im.d))]
      return cxSpec(`Solve ${quad} = 0 over the complex numbers. Give both roots, separated by commas.`, roots, 'Use the quadratic formula. When the discriminant is negative, √(−m²) = mi. The roots are a pair of conjugates.', [
        `Discriminant: b² − 4ac = ${b * b} − ${4 * a * c} = ${b * b - 4 * a * c}.`, `√(${b * b - 4 * a * c}) = ${m}i.`, `z = (${MN(String(-b))} ± ${m}i) / ${2 * a} = ${fm(re)} ± ${fm(im) === '1' ? '' : fm(im)}i.`])
    }
    throw new Error('no complex quadratic')
  } },
  { lesson: 'complex-arithmetic', level: 3, make: (r) => {
    // real and imaginary parts: find x and y
    const x = rnz(r, -4, 5), y = rnz(r, -4, 5), c = cx(ri(r, 1, 4), rnz(r, -3, 3))
    const rhs = cMul(cx(x, y), c)
    return {
      prompt: `Find the real numbers x and y such that (x + yi)${bracket(c)} = ${fmtCx(rhs)}. Give (x, y).`, kind: 'pair', answers: [x, y], display: `(${MN(String(x))}, ${MN(String(y))})`, input: `(${x}, ${y})`, unit: '', needsExact: false, tol: 1e-9,
      hint: 'Multiply out the left side, then equate real parts and equate imaginary parts to get two equations for x and y.', explanation: [
        `Expand: (x + yi)${bracket(c)} = (${two(c.re.n, 'x', -c.im.n, 'y')}) + (${two(c.im.n, 'x', c.re.n, 'y')})i.`, `Equate real parts and imaginary parts: ${two(c.re.n, 'x', -c.im.n, 'y')} = ${MN(String(rhs.re.n))} and ${two(c.im.n, 'x', c.re.n, 'y')} = ${MN(String(rhs.im.n))}.`, `Solving the pair gives x = ${MN(String(x))}, y = ${MN(String(y))}.`],
      pad: { pi: false, root: false, comma: true, alg: true },
    } as Spec
  } },
  { lesson: 'complex-arithmetic', level: 3, make: (r) => {
    // modulus of a product or quotient
    const [a, b, c] = pick(r, TRIPLES.slice(0, 4)), [p, q, d] = pick(r, TRIPLES.slice(0, 4))
    const z1 = cx(a, b), z2 = cx(p, q)
    const prod = r() < 0.5
    const prodCx = cMul(z1, z2), n = cNum(prodCx)
    must(Math.abs(n.re ** 2 + n.im ** 2 - (c * d) ** 2) < 1e-6, '|z1 z2|')
    return numSpec(`Find ${prod ? `|${bracket(z1)}${bracket(z2)}|` : `|${bracket(z1)} / ${bracket(z2)}|`} without multiplying out.`, prod ? fr(c * d) : fr(c, d), 'The modulus of a product is the product of the moduli, and the modulus of a quotient is the quotient of the moduli.', [
      `|${fmtCx(z1)}| = √(${a * a} + ${b * b}) = ${c} and |${fmtCx(z2)}| = √(${p * p} + ${q * q}) = ${d}.`, prod ? `|z₁z₂| = |z₁||z₂| = ${c} × ${d} = ${c * d}.` : `|z₁/z₂| = |z₁|/|z₂| = ${c}/${d} = ${fm(fr(c, d))}.`])
  } },
]

/* ------------------------------------------------------------------ 2. modulus, argument and polar form */

const ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]

const POLAR: Gen[] = [
  { lesson: 'complex-polar', level: 1, make: (r) => {
    // the argument of a number on an axis or a diagonal
    const k = ri(r, 1, 6)
    const dirs: [number, number, number][] = [[k, 0, 0], [k, k, 45], [0, k, 90], [-k, k, 135], [-k, 0, 180], [-k, -k, -135], [0, -k, -90], [k, -k, -45]]
    const [a, b, d] = pick(r, dirs)
    const z = cx(a, b)
    return {
      prompt: `Find the argument of ${fmtCx(z)}, in radians, between −π and π (you can type pi).`, kind: 'value', answers: [rad(d)], display: fmtPi(d), input: piInput(d), unit: '', needsExact: d !== 0, tol: 1e-9,
      hint: 'Plot the point on the Argand diagram. The argument is the angle from the positive real axis, positive anticlockwise.', explanation: [
        `${fmtCx(z)} is the point (${MN(String(a))}, ${MN(String(b))}) on the Argand diagram.`, a === 0 || b === 0 ? `It lies on an axis, so the angle is ${fmtDeg(d)}.` : `|a| = |b|, so it lies on a diagonal: the angle with the nearest axis is 45°.`, `Measured anticlockwise from the positive real axis the argument is ${fmtDeg(d)} = ${fmtPi(d)}.`],
      pad: { pi: true, root: false, comma: false, alg: true },
    } as Spec
  } },
  { lesson: 'complex-polar', level: 1, make: (r) => {
    // polar to rectangular, exact
    const m = ri(r, 1, 8), d = pick(r, ANGLES)
    const a = surdMul(surd(m), cosExact(d)), b = surdMul(surd(m), sinExact(d))
    return surdPair(`Write ${m === 1 ? '' : m}(cos ${d}° + i sin ${d}°) in the form a + bi. Give the exact pair (a, b).`.replace('Write (cos', 'Write (cos'), a, b, 'Find cos and sin of the angle exactly (the unit circle), and multiply both by the modulus.', [
      `cos ${d}° = ${fmtSurd(cosExact(d))} and sin ${d}° = ${fmtSurd(sinExact(d))}.`, `a = ${m} × ${fmtSurd(cosExact(d))} = ${fmtSurd(a)} and b = ${m} × ${fmtSurd(sinExact(d))} = ${fmtSurd(b)}.`])
  } },
  { lesson: 'complex-polar', level: 2, make: (r) => {
    // modulus and argument of a product or quotient in polar form
    const r1 = ri(r, 1, 6), r2 = ri(r, 1, 6), t1 = ri(r, 1, 17) * 10, t2 = ri(r, 1, 17) * 10
    const prod = r() < 0.5
    const mod = prod ? fr(r1 * r2) : fr(r1, r2), arg = prod ? t1 + t2 : t1 - t2
    return {
      prompt: `z₁ = ${r1}(cos ${t1}° + i sin ${t1}°) and z₂ = ${r2}(cos ${t2}° + i sin ${t2}°). Find the modulus and argument (in degrees) of ${prod ? 'z₁z₂' : 'z₁ / z₂'}. Give (modulus, argument).`, kind: 'pair', answers: [fNum(mod), arg], display: `(${fm(mod)}, ${fmtDeg(arg)})`, input: `(${fm(mod).replace(MINUS, '-')}, ${arg})`, unit: '', needsExact: false, tol: 1e-9,
      hint: prod ? 'To multiply, multiply the moduli and add the arguments.' : 'To divide, divide the moduli and subtract the arguments.', explanation: [
        prod ? `Moduli multiply: ${r1} × ${r2} = ${r1 * r2}.` : `Moduli divide: ${r1}/${r2} = ${fm(mod)}.`, prod ? `Arguments add: ${t1}° + ${t2}° = ${arg}°.` : `Arguments subtract: ${t1}° − ${t2}° = ${MN(String(arg))}°.`, `So the answer is (${fm(mod)}, ${fmtDeg(arg)}).`],
      pad: { pi: false, root: false, comma: true, alg: true },
    } as Spec
  } },
  { lesson: 'complex-polar', level: 2, make: (r) => {
    // rectangular to polar, not special angles
    const [a, b, c] = pick(r, TRIPLES.slice(0, 5))
    const sa = r() < 0.7 ? 1 : -1, sb = r() < 0.5 ? 1 : -1
    const z = cx(sa * a, sb * b)
    const theta = deg(Math.atan2(sb * b, sa * a))
    return {
      prompt: `Write ${fmtCx(z)} in polar form r(cos θ + i sin θ). Give (r, θ) with θ in degrees between −180° and 180°, to 1 decimal place.`, kind: 'pair', answers: [c, theta], display: `(${c}, ${f1(theta).replace('-', MINUS)}°)`, input: `(${c}, ${f1(theta)})`, unit: '', needsExact: false, tol: 0.06,
      hint: 'r = √(a² + b²). For the angle use tan⁻¹(b/a), then adjust for the quadrant the point is really in.', explanation: [
        `r = √(${a * a} + ${b * b}) = ${c}.`, `The point (${MN(String(sa * a))}, ${MN(String(sb * b))}) is in the ${sa > 0 ? (sb > 0 ? 'first' : 'fourth') : sb > 0 ? 'second' : 'third'} quadrant. The reference angle is tan⁻¹(${b}/${a}) = ${f1(deg(Math.atan(b / a)))}°.`, `So θ = ${f1(theta).replace('-', MINUS)}°.`],
      pad: { pi: false, root: false, comma: true, alg: true },
    } as Spec
  } },
  { lesson: 'complex-polar', level: 3, make: (r) => {
    // De Moivre: powers of 1 + i and friends
    const base = pick(r, [cx(1, 1), cx(1, -1), cx(-1, 1), cx(-1, -1), cx(0, 1), cx(0, -1)])
    const n = base.re.n === 0 ? ri(r, 5, 14) : ri(r, 3, 12)
    const val = cPow(base, n)
    const isUnit = base.re.n === 0
    const modText = isUnit ? '1' : '√2'
    const argDeg = Math.round(deg(Math.atan2(base.im.n, base.re.n)))
    return cxSpec(`Use De Moivre's theorem to calculate ${bracket(base)}^${n}.`, [val], 'Write the number in polar form r(cos θ + i sin θ). Then (r(cos θ + i sin θ))ⁿ = rⁿ(cos nθ + i sin nθ).', [
      `${fmtCx(base)} = ${modText}(cos ${argDeg}° + i sin ${argDeg}°).`, `Raise to the power ${n}: modulus ${modText}^${n}${isUnit ? ' = 1' : ` = ${2 ** (n / 2)}`}, angle ${n} × ${argDeg}° = ${n * argDeg}°.`, `Convert back: ${fmtCx(val)}. (Check by multiplying out for small powers.)`])
  } },
  { lesson: 'complex-polar', level: 3, make: (r) => {
    // roots of a number whose roots are Gaussian integers
    const kind = ri(r, 1, 3)
    if (kind === 1) {
      const k = ri(r, 1, 3)
      const roots = [cx(k, 0), cx(0, k), cx(-k, 0), cx(0, -k)]
      return cxSpec(`Find all the complex solutions of z⁴ = ${k ** 4}. Give all four, separated by commas.`, roots, 'There are four fourth roots, equally spaced on a circle. Here the circle has radius k and one root is real.', [
        `The real fourth root of ${k ** 4} is ${k}. The four roots are equally spaced, 90° apart, on the circle of radius ${k}.`, `Starting at ${k} and turning 90° each time: ${k}, ${k}i, −${k}, −${k}i.`])
    }
    if (kind === 2) {
      const k = ri(r, 1, 2)
      const roots = [cx(k, k), cx(-k, k), cx(-k, -k), cx(k, -k)]
      return cxSpec(`Find all the complex solutions of z⁴ = ${MN(String(-4 * k ** 4))}. Give all four, separated by commas.`, roots, 'Write the right side in polar form with modulus |−4k⁴| and argument 180°. The fourth roots have modulus k√2 and arguments 45° + 90°n.', [
        `${MN(String(-4 * k ** 4))} = ${4 * k ** 4}(cos 180° + i sin 180°). The fourth roots have modulus (${4 * k ** 4})^(1/4) = ${k}√2 and arguments (180° + 360°n)/4 = 45°, 135°, 225°, 315°.`, `Each root is ${k}√2(cos θ + i sin θ) with those angles, which gives ${k}(±1 ± i).`])
    }
    const p = ri(r, 1, 4), q = rnz(r, -3, 3)
    const sq = cMul(cx(p, q), cx(p, q))
    return cxSpec(`Find the two square roots of ${fmtCx(sq)}. Give both, separated by commas.`, [cx(p, q), cx(-p, -q)], 'Let z = x + yi, square it, and equate the real and imaginary parts. The two roots are always negatives of each other.', [
      `Let (x + yi)² = ${fmtCx(sq)}. Then x² − y² = ${MN(String(sq.re.n))} and 2xy = ${MN(String(sq.im.n))}.`, `Using also x² + y² = |z²| = ${p * p + q * q}: x² = ${(sq.re.n + p * p + q * q) / 2} and y² = ${(p * p + q * q - sq.re.n) / 2}.`, `The signs of x and y must make 2xy = ${MN(String(sq.im.n))}. The roots are ${fmtCx(cx(p, q))} and ${fmtCx(cx(-p, -q))}.`])
  } },
]

/* ------------------------------------------------------------------ 3. vectors */

type V = number[]
const vtxt = (v: V) => `(${v.map((x) => MN(String(x))).join(', ')})`
const vadd = (a: V, b: V) => a.map((x, i) => x + b[i]), vsub = (a: V, b: V) => a.map((x, i) => x - b[i])
const vscale = (k: number, a: V) => a.map((x) => k * x)
const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm2 = (a: V) => dot(a, a)
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const randV = (r: () => number, dim: 2 | 3, lo = -6, hi = 6): V => Array.from({ length: dim }, () => rnz(r, lo, hi))
const frs = (a: V) => a.map((x) => fr(x))
/** c0 + c1 v, as text, leaving out a zero part */
const lin = (c0: number, c1: number, v: string) => `${c0 === 0 ? '' : MN(String(c0))}${c1 === 0 ? '' : `${c0 === 0 ? (c1 < 0 ? MINUS : '') : ` ${c1 < 0 ? MINUS : '+'} `}${Math.abs(c1) === 1 ? '' : Math.abs(c1)}${v}`}` || '0'
/** the plane ax + by + cz = d as text */
const planeText = (n: V, d: number) => { const t = n.map((c, i) => [c, 'xyz'[i]] as [number, string]).filter(([c]) => c !== 0).map(([c, v], i) => `${i === 0 ? (c < 0 ? MINUS : '') : ` ${c < 0 ? MINUS : '+'} `}${Math.abs(c) === 1 ? '' : Math.abs(c)}${v}`).join(''); return `${t} = ${MN(String(d))}` }

const VECTORS: Gen[] = [
  { lesson: 'vectors', level: 1, make: (r) => {
    const dim = pick(r, [2, 3] as const), a = randV(r, dim), b = randV(r, dim), s = rnz(r, 2, 4), t = rnz(r, -3, 3)
    const val = vadd(vscale(s, a), vscale(t, b))
    return tupleSpec(`a = ${vtxt(a)} and b = ${vtxt(b)}. Find ${s}a ${t < 0 ? MINUS : '+'} ${Math.abs(t) === 1 ? '' : Math.abs(t)}b. Give the components in brackets.`, val.map((x) => fr(x)), 'Work out each multiple first, then add the matching components.', [
      `${s}a = ${vtxt(vscale(s, a))} and ${MN(String(t))}b = ${vtxt(vscale(t, b))}.`, `Add the components: ${vtxt(val)}.`])
  } },
  { lesson: 'vectors', level: 1, make: (r) => {
    // magnitude: Pythagorean triples and 3D
    const dim = pick(r, [2, 3] as const)
    if (dim === 2) {
      const [p, q, h] = pick(r, TRIPLES), v = [r() < 0.5 ? p : -p, r() < 0.5 ? q : -q]
      return numSpec(`Find the magnitude |v| of v = ${vtxt(v)}.`, fr(h), 'The magnitude of (x, y) is √(x² + y²), by Pythagoras.', [`|v| = √(${p}² + ${q}²) = √${p * p + q * q} = ${h}.`])
    }
    const trip: V[] = [[2, 3, 6], [1, 4, 8], [4, 4, 7], [2, 6, 9], [6, 6, 7], [1, 2, 2], [2, 10, 11]]
    const t = pick(r, trip), v = t.map((x) => (r() < 0.5 ? x : -x))
    return numSpec(`Find the magnitude |v| of v = ${vtxt(v)}.`, fr(Math.round(Math.sqrt(norm2(v)))), 'The magnitude of (x, y, z) is √(x² + y² + z²).', [`|v| = √(${v.map((x) => `${w(x)}²`).join(' + ')}) = √${norm2(v)} = ${Math.round(Math.sqrt(norm2(v)))}.`])
  } },
  { lesson: 'vectors', level: 1, make: (r) => {
    // vector between two points, or a point from a vector
    const dim = pick(r, [2, 3] as const), A = randV(r, dim), B = randV(r, dim)
    return tupleSpec(`The points A and B have position vectors ${vtxt(A)} and ${vtxt(B)}. Find the vector AB (from A to B).`, frs(vsub(B, A)), 'AB = b − a: the position of the end minus the position of the start.', [`AB = b − a = ${vtxt(B)} − ${vtxt(A)}.`, `= ${vtxt(vsub(B, A))}.`])
  } },
  { lesson: 'vectors', level: 2, make: (r) => {
    // unit vector
    const dim = pick(r, [2, 3] as const)
    const pool: V[] = dim === 2 ? [[3, 4], [5, 12], [8, 15], [6, 8], [7, 24]] : [[2, 3, 6], [1, 4, 8], [4, 4, 7], [1, 2, 2], [2, 6, 9]]
    const t = pick(r, pool), v = t.map((x) => (r() < 0.5 ? x : -x)), m = Math.round(Math.sqrt(norm2(v)))
    return tupleSpec(`Find the unit vector in the direction of v = ${vtxt(v)}. Give its components as fractions.`, v.map((x) => fr(x, m)), 'Divide each component by the magnitude, so that the new vector has length 1.', [`|v| = √${norm2(v)} = ${m}.`, `The unit vector is v/|v| = ${vtxt(v.map((x) => x))} ÷ ${m} = (${v.map((x) => fm(fr(x, m))).join(', ')}).`])
  } },
  { lesson: 'vectors', level: 2, make: (r) => {
    // midpoint and section formula
    const dim = pick(r, [2, 3] as const), m = ri(r, 1, 3), n = ri(r, 1, 3)
    if (m === n && r() < 0.4) return VECTORS[3].make(r)
    const A = randV(r, dim, -8, 8), B = randV(r, dim, -8, 8)
    // P divides AB in the ratio m:n: p = (n a + m b) / (m + n)
    const P = A.map((x, i) => fr(n * x + m * B[i], m + n))
    return tupleSpec(`The point P lies on the line from A${vtxt(A)} to B${vtxt(B)}, and AP : PB = ${m} : ${n}. Find the position vector of P.`, P, 'Move from A towards B by the fraction m/(m + n) of the way: p = a + m/(m + n) (b − a).', [
      `AP is ${m}/${m + n} of AB, so p = a + (${m}/${m + n})(b − a).`, `(b − a) = ${vtxt(vsub(B, A))}, so p = ${vtxt(A)} + (${m}/${m + n}) × ${vtxt(vsub(B, A))}.`, `p = (${P.map(fm).join(', ')}).`])
  } },
  { lesson: 'vectors', level: 3, make: (r) => {
    // parallel vectors, or collinear points
    const a = [ri(r, 2, 6), rnz(r, -5, 5), ri(r, 1, 6)], k = rnz(r, 2, 4) * (r() < 0.5 ? 1 : -1)
    const unknown = pick(r, [1, 2])
    const b = vscale(k, a)
    const shown = b.map((x, i) => (i === unknown ? 'p' : MN(String(x))))
    return numSpec(`The vectors a = ${vtxt(a)} and b = (${shown.join(', ')}) are parallel. Find the value of p.`, fr(b[unknown]), 'Parallel vectors are scalar multiples of each other: b = ka. Find k from a component you can see.', [
      `b = ka, so each component of b is k times the matching component of a.`, `From the first component: ${MN(String(b[0]))} = k × ${a[0]}, so k = ${MN(String(k))}.`, `So p = ${MN(String(k))} × ${w(a[unknown])} = ${MN(String(b[unknown]))}.`])
  } },
  { lesson: 'vectors', level: 3, make: (r) => {
    // a vector of given length in a given direction, or the component of a force
    const [p, q, h] = pick(r, TRIPLES.slice(0, 4)), L = ri(r, 2, 4) * h
    const sa = r() < 0.5 ? 1 : -1
    return tupleSpec(`Find the vector of length ${L} in the same direction as (${MN(String(sa * p))}, ${q}).`, [fr(sa * p * (L / h)), fr(q * (L / h))], 'Find the unit vector in that direction (divide by the length), then multiply by the required length.', [
      `The length of (${MN(String(sa * p))}, ${q}) is √(${p * p} + ${q * q}) = ${h}.`, `The unit vector is (${fm(fr(sa * p, h))}, ${fm(fr(q, h))}).`, `Multiply by ${L}: (${MN(String(sa * p * (L / h)))}, ${q * (L / h)}).`])
  } },
]

/* ------------------------------------------------------------------ 4. dot and cross products */

const DOTS: Gen[] = [
  { lesson: 'dot-cross', level: 1, make: (r) => {
    const dim = pick(r, [2, 3] as const), a = randV(r, dim), b = randV(r, dim)
    return numSpec(`Find the dot product of a = ${vtxt(a)} and b = ${vtxt(b)}.`, fr(dot(a, b)), 'Multiply the matching components and add: a·b = a₁b₁ + a₂b₂ (+ a₃b₃).', [`a·b = ${a.map((x, i) => `${w(x)} × ${w(b[i])}`).join(' + ')}.`, `= ${MN(String(dot(a, b)))}.`])
  } },
  { lesson: 'dot-cross', level: 1, make: (r) => {
    // perpendicular: find the unknown
    const dim = pick(r, [2, 3] as const), a = randV(r, dim, 1, 6).map((x) => x * (r() < 0.4 ? -1 : 1)), idx = ri(r, 0, dim - 1)
    const b = randV(r, dim, -5, 5)
    if (a[idx] === 0) return DOTS[1].make(r)
    // choose b[idx] = p so that a.b = 0 requires an integer p
    const rest = a.reduce((s, x, i) => (i === idx ? s : s + x * b[i]), 0)
    if (rest % a[idx] !== 0) return DOTS[1].make(r)
    const p = -rest / a[idx]
    const shown = b.map((x, i) => (i === idx ? 'p' : MN(String(x))))
    return numSpec(`The vectors a = ${vtxt(a)} and b = (${shown.join(', ')}) are perpendicular. Find p.`, fr(p), 'Perpendicular vectors have dot product 0. Write a·b and solve for p.', [`a·b = ${a.map((x, i) => (i === idx ? `${w(x)}p` : `${w(x)} × ${w(b[i])}`)).join(' + ')} = 0.`, `${MN(String(rest))} + ${w(a[idx])}p = 0, so p = ${MN(String(p))}.`])
  } },
  { lesson: 'dot-cross', level: 2, make: (r) => {
    // angle between two vectors
    for (;;) {
      const dim = pick(r, [2, 3] as const), a = randV(r, dim, -6, 6), b = randV(r, dim, -6, 6)
      if (norm2(a) === 0 || norm2(b) === 0) continue
      const c = dot(a, b) / Math.sqrt(norm2(a) * norm2(b))
      if (Math.abs(c) > 0.999) continue
      const th = deg(Math.acos(c))
      const s = approxSpec(`Find the angle between a = ${vtxt(a)} and b = ${vtxt(b)}.`, th, 1, 'Use cos θ = a·b / (|a||b|), then take the inverse cosine.', [
        `a·b = ${MN(String(dot(a, b)))}, |a| = √${norm2(a)} and |b| = √${norm2(b)}.`, `cos θ = ${MN(String(dot(a, b)))} / √(${norm2(a)} × ${norm2(b)}) = ${MN(c.toFixed(4))}.`, `θ = cos⁻¹(${MN(c.toFixed(4))}) = ${f1(th)}°.`], (x) => Math.abs(Math.cos(rad(x)) - c) < 1e-9, 'θ')
      return { ...s, display: `θ ≈ ${f1(th).replace('-', MINUS)}°`, unit: '°' }
    }
  } },
  { lesson: 'dot-cross', level: 2, make: (r) => {
    // vector projection of a onto b, with an integer-friendly result
    for (let tries = 0; tries < 300; tries++) {
      const a = randV(r, 2, -6, 6), b = randV(r, 2, -5, 5)
      if (norm2(b) === 0) continue
      const k = fr(dot(a, b), norm2(b))
      return tupleSpec(`Find the projection of a = ${vtxt(a)} onto b = ${vtxt(b)}, as a vector.`, b.map((x) => fMul(k, fr(x))), 'The projection of a onto b is ((a·b)/(b·b)) b: the part of a that points along b.', [
        `a·b = ${MN(String(dot(a, b)))} and b·b = ${norm2(b)}.`, `The scalar is ${MN(String(dot(a, b)))}/${norm2(b)} = ${fm(k)}.`, `The projection is ${fm(k)} × ${vtxt(b)} = (${b.map((x) => fm(fMul(k, fr(x)))).join(', ')}).`])
    }
    throw new Error('no projection')
  } },
  { lesson: 'dot-cross', level: 2, make: (r) => {
    // area of a triangle in the plane
    const A = randV(r, 2, -5, 5), B = randV(r, 2, -5, 5), C = randV(r, 2, -5, 5)
    const u = vsub(B, A), v = vsub(C, A)
    const cr = u[0] * v[1] - u[1] * v[0]
    if (cr === 0) return DOTS[4].make(r)
    return numSpec(`Find the area of the triangle with vertices A${vtxt(A)}, B${vtxt(B)} and C${vtxt(C)}.`, fr(Math.abs(cr), 2), 'The area is half the size of the cross product of two sides: ½|AB × AC| = ½|u₁v₂ − u₂v₁|.', [
      `AB = ${vtxt(u)} and AC = ${vtxt(v)}.`, `u₁v₂ − u₂v₁ = ${w(u[0])} × ${w(v[1])} − ${w(u[1])} × ${w(v[0])} = ${MN(String(cr))}.`, `Area = ½ × |${MN(String(cr))}| = ${fm(fr(Math.abs(cr), 2))}.`])
  } },
  { lesson: 'dot-cross', level: 3, make: (r) => {
    const a = randV(r, 3, -5, 5), b = randV(r, 3, -5, 5)
    const c = cross(a, b)
    return tupleSpec(`Find the cross product a × b, where a = ${vtxt(a)} and b = ${vtxt(b)}.`, frs(c), 'a × b = (a₂b₃ − a₃b₂, a₃b₁ − a₁b₃, a₁b₂ − a₂b₁). The result is perpendicular to both a and b.', [
      `First component: a₂b₃ − a₃b₂ = ${w(a[1])}×${w(b[2])} − ${w(a[2])}×${w(b[1])} = ${MN(String(c[0]))}.`, `Second: a₃b₁ − a₁b₃ = ${w(a[2])}×${w(b[0])} − ${w(a[0])}×${w(b[2])} = ${MN(String(c[1]))}.`, `Third: a₁b₂ − a₂b₁ = ${w(a[0])}×${w(b[1])} − ${w(a[1])}×${w(b[0])} = ${MN(String(c[2]))}.`, `Check: (a × b)·a = ${dot(c, a)} and (a × b)·b = ${dot(c, b)}, both 0.`])
  } },
  { lesson: 'dot-cross', level: 3, make: (r) => {
    // area of a parallelogram or triangle in 3D
    for (;;) {
      const a = randV(r, 3, -4, 4), b = randV(r, 3, -4, 4), c = cross(a, b), s = norm2(c)
      if (s === 0 || s > 400 || Number.isInteger(Math.sqrt(s)) || c.some((x) => x === 0)) continue
      const tri = r() < 0.5
      const half = tri ? fr(1, 2) : fr(1)
      // area = half * sqrt(s)
      const rt = root(0, half, s)
      return radicalSpec(`Find the exact area of the ${tri ? 'triangle with sides' : 'parallelogram with adjacent sides'} given by the vectors a = ${vtxt(a)} and b = ${vtxt(b)}. Give the answer in simplest form.`, rt, `The area of the parallelogram is |a × b|, and the triangle is half of that. Find a × b first, then its length.`, [
        `a × b = ${vtxt(c)}.`, `|a × b| = √(${c.map((x) => `${w(x)}²`).join(' + ')}) = √${s}.`, tri ? `The triangle is half the parallelogram: ½√${s}.` : `The parallelogram has area √${s}.`], [])
    }
  } },
  { lesson: 'dot-cross', level: 3, make: (r) => {
    // volume of a parallelepiped: the scalar triple product
    const a = randV(r, 3, -4, 4), b = randV(r, 3, -4, 4), c = randV(r, 3, -4, 4)
    const v = dot(a, cross(b, c))
    return numSpec(`Find the volume of the parallelepiped with edges a = ${vtxt(a)}, b = ${vtxt(b)} and c = ${vtxt(c)}. (A volume is positive: take the size of your answer.)`, fr(Math.abs(v)), 'The volume is |a · (b × c)|, the scalar triple product.', [`b × c = ${vtxt(cross(b, c))}.`, `a · (b × c) = ${MN(String(v))}.`, `The volume is |${MN(String(v))}| = ${Math.abs(v)}.`])
  } },
]

/* ------------------------------------------------------------------ 5. lines and planes */

const gcd3 = (a: number, b: number, c: number) => gcdI(gcdI(Math.abs(a), Math.abs(b)), Math.abs(c))

const LINES: Gen[] = [
  { lesson: 'lines-planes', level: 1, make: (r) => {
    const dim = pick(r, [2, 3] as const), a = randV(r, dim), d = randV(r, dim, -4, 4), t = rnz(r, -3, 4)
    if (d.every((x) => x === 0)) return LINES[0].make(r)
    const P = vadd(a, vscale(t, d))
    return tupleSpec(`A line has the equation r = ${vtxt(a)} + t${vtxt(d)}. Find the point on the line where t = ${MN(String(t))}.`, frs(P), 'Substitute the value of t into the equation and add the components.', [`r = ${vtxt(a)} + ${w(t)} × ${vtxt(d)} = ${vtxt(a)} + ${vtxt(vscale(t, d))}.`, `= ${vtxt(P)}.`])
  } },
  { lesson: 'lines-planes', level: 1, make: (r) => {
    // the line through two points: direction vector, and a given point's parameter
    const dim = pick(r, [2, 3] as const), A = randV(r, dim), B = randV(r, dim)
    if (A.every((x, i) => x === B[i])) return LINES[1].make(r)
    return tupleSpec(`Find a direction vector for the line through A${vtxt(A)} and B${vtxt(B)}. Give the vector AB.`, frs(vsub(B, A)), 'A direction vector for the line is the vector from one point to the other: b − a.', [`AB = b − a = ${vtxt(B)} − ${vtxt(A)} = ${vtxt(vsub(B, A))}.`, 'Any non-zero multiple of this is also a direction vector, and the line is r = a + t(b − a).'])
  } },
  { lesson: 'lines-planes', level: 2, make: (r) => {
    // intersection of two lines in the plane: find the point
    for (;;) {
      const P = randV(r, 2, -5, 5), d1 = randV(r, 2, -3, 3), d2 = randV(r, 2, -3, 3)
      const det = d1[0] * -d2[1] + d1[1] * d2[0]
      if (det === 0) continue
      const s = rnz(r, -3, 3), t = rnz(r, -3, 3)
      const a1 = vsub(P, vscale(s, d1)), a2 = vsub(P, vscale(t, d2))
      return tupleSpec(`Find the point where the lines r = ${vtxt(a1)} + s${vtxt(d1)} and r = ${vtxt(a2)} + t${vtxt(d2)} meet.`, frs(P), 'Set the two expressions equal. That gives two equations (one for each component) in s and t. Solve, then substitute back.', [
        `Equate components: ${lin(a1[0], d1[0], 's')} = ${lin(a2[0], d2[0], 't')} and ${lin(a1[1], d1[1], 's')} = ${lin(a2[1], d2[1], 't')}.`, `Solving the pair gives s = ${MN(String(s))} and t = ${MN(String(t))}.`, `Substitute s into the first line: ${vtxt(a1)} + ${w(s)} × ${vtxt(d1)} = ${vtxt(P)}.`])
    }
  } },
  { lesson: 'lines-planes', level: 2, make: (r) => {
    // the angle between two lines
    for (let tries = 0; tries < 200; tries++) {
      const d1 = randV(r, 2, -5, 5), d2 = randV(r, 2, -5, 5)
      if (norm2(d1) === 0 || norm2(d2) === 0) continue
      const c = Math.abs(dot(d1, d2)) / Math.sqrt(norm2(d1) * norm2(d2))
      if (c > 0.999) continue
      const th = deg(Math.acos(c))
      const s = approxSpec(`Find the acute angle between the lines with direction vectors ${vtxt(d1)} and ${vtxt(d2)}.`, th, 1, 'The angle between two lines is the angle between their direction vectors. Use cos θ = |d₁·d₂| / (|d₁||d₂|), taking the absolute value to get the acute angle.', [
        `d₁·d₂ = ${MN(String(dot(d1, d2)))}, |d₁| = √${norm2(d1)} and |d₂| = √${norm2(d2)}.`, `cos θ = |${MN(String(dot(d1, d2)))}| / √(${norm2(d1)} × ${norm2(d2)}) = ${c.toFixed(4)}.`, `θ = cos⁻¹(${c.toFixed(4)}) = ${f1(th)}°.`], (x) => Math.abs(Math.cos(rad(x)) - c) < 1e-9, 'θ')
      return { ...s, display: `θ ≈ ${f1(th)}°`, unit: '°' }
    }
    throw new Error('no angle')
  } },
  { lesson: 'lines-planes', level: 2, make: (r) => {
    // does a point lie on the line? (find t, or report that none works)
    const a = randV(r, 3), d = randV(r, 3, -3, 3).map((x) => (x === 0 ? 1 : x)), t = ri(r, -3, 4)
    const on = r() < 0.5
    const P = vadd(a, vscale(t, d)).map((x, i) => (on || i !== ri(r, 0, 2) ? x : x + rnz(r, 1, 3)))
    const consistent = [0, 1, 2].every((i) => P[i] === a[i] + t * d[i])
    return {
      prompt: `Does the point P${vtxt(P)} lie on the line r = ${vtxt(a)} + t${vtxt(d)}? (Type yes or no.)`, kind: 'word', answers: [], display: consistent ? 'yes' : 'no', input: consistent ? 'yes' : 'no', unit: '', needsExact: false, tol: 0,
      hint: 'Set each component equal and solve for t. P is on the line only if every component gives the SAME value of t.', explanation: [
        `Equate components: ${P.map((x, i) => `${MN(String(x))} = ${a[i]} + ${w(d[i])}t`).join(',  ')}.`, `These give t = ${[0, 1, 2].map((i) => fm(fr(P[i] - a[i], d[i]))).join(', ')}.`, consistent ? 'All three agree, so P is on the line.' : 'They are not all equal, so no single t works: P is not on the line.'],
      pad: { pi: false, root: false, comma: false, extra: ['yes', 'no'] }, words: consistent ? ['yes', 'y', 'true', 'it does', 'on the line'] : ['no', 'n', 'false', 'it does not', 'not on the line'],
    } as Spec
  } },
  { lesson: 'lines-planes', level: 3, make: (r) => {
    // plane through three points: ax + by + cz = d
    for (;;) {
      const A = randV(r, 3, -4, 4), B = randV(r, 3, -4, 4), C = randV(r, 3, -4, 4)
      const n = cross(vsub(B, A), vsub(C, A))
      if (n.every((x) => x === 0)) continue
      const g = gcd3(n[0], n[1], n[2])
      let m = n.map((x) => x / g)
      const lead = m.find((x) => x !== 0)!
      if (lead < 0) m = m.map((x) => -x)
      const d = dot(m, A)
      return {
        prompt: `Find the equation of the plane through A${vtxt(A)}, B${vtxt(B)} and C${vtxt(C)} in the form ax + by + cz = d, with a, b, c, d whole numbers with no common factor and the first non-zero one of a, b, c positive. Give (a, b, c, d).`, kind: 'pair', answers: [...m, d], display: `(${m.map((x) => MN(String(x))).join(', ')}, ${MN(String(d))})`, input: `(${m.join(', ')}, ${d})`, unit: '', needsExact: false, tol: 1e-9,
        hint: 'A normal vector to the plane is AB × AC. The plane is n · r = n · a, where a is any point on it.', explanation: [
          `AB = ${vtxt(vsub(B, A))} and AC = ${vtxt(vsub(C, A))}.`, `A normal vector is AB × AC = ${vtxt(n)}${g > 1 ? `, which we simplify by dividing by ${g}` : ''}: n = ${vtxt(m)}.`, `The plane is n · r = n · a: ${vtxt(m)} · (x, y, z) = ${vtxt(m)} · ${vtxt(A)} = ${MN(String(d))}.`, `Check that B and C satisfy it too: n·B = ${dot(m, B)} and n·C = ${dot(m, C)}.`],
        pad: { pi: false, root: false, comma: true, alg: true },
      } as Spec
    }
  } },
  { lesson: 'lines-planes', level: 3, make: (r) => {
    // distance from a point to a plane
    for (;;) {
      const n = randV(r, 3, -4, 4)
      if (n.every((x) => x === 0)) continue
      const d = ri(r, -8, 8), P = randV(r, 3, -5, 5)
      const num = Math.abs(dot(n, P) - d), den = Math.sqrt(norm2(n))
      if (num === 0) continue
      const dist = num / den
      const s = approxSpec(`Find the distance from the point P${vtxt(P)} to the plane ${planeText(n, d)}.`, dist, 2, 'For the plane ax + by + cz = d, the distance from (x₀, y₀, z₀) is |ax₀ + by₀ + cz₀ − d| / √(a² + b² + c²).', [
        `Substitute the point: ${n.map((x, i) => `${w(x)} × ${w(P[i])}`).join(' + ')} − ${w(d)} = ${MN(String(dot(n, P) - d))}.`, `The denominator is √(${n.map((x) => `${w(x)}²`).join(' + ')}) = √${norm2(n)}.`, `Distance = |${MN(String(dot(n, P) - d))}| / √${norm2(n)} = ${dist.toFixed(2)}.`], (x) => Math.abs(x * Math.sqrt(norm2(n)) - num) < 1e-9, 'distance')
      return { ...s, display: `distance ≈ ${dist.toFixed(2)}`, unit: '' }
    }
  } },
]

export const CX_GENS: Gen[] = [...ARITH, ...POLAR, ...VECTORS, ...DOTS, ...LINES]
