/**
 * Question generators for Unit 6: trigonometry, continued.
 *
 * Triangles are built from their true measurements. Numeric answers carry a `holds` predicate that tests whether a value
 * satisfies the defining relation (the sine rule, the cosine rule, a ratio...), so the tests check the answer without
 * repeating the formula that produced it. Identities are checked numerically at many angles.
 */
import { approxSpec, fm, radicalSpec } from './powerQuestions'
import { numSpec, ri, rnz } from './algebraQuestions'
import { exactSet, MN, sgnText } from './equationQuestions'
import { fmtDeg, fmtPi, fmtSurd, MINUS, piInput, solveSpecial, specialValues, surd, surdValue } from './exact'
import { fr, fDiv, fMul, fSub, fAdd, Frac } from './algebra'
import { fmtRoot } from './solve'
import type { Gen, Spec } from './questions'
import { root } from './radicals'
import { pick } from './rng'
import { showTrig } from './trigAlgebra'

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
const sin = (d: number) => Math.sin(rad(d))
const cos = (d: number) => Math.cos(rad(d))
const tan = (d: number) => Math.tan(rad(d))
const near = (a: number, b: number, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b))
const f1 = (x: number) => x.toFixed(1)
const f2 = (x: number) => x.toFixed(2)

/** a length to 2 decimal places */
const length = (prompt: string, value: number, hint: string, steps: string[], holds: (x: number) => boolean, label = 'length', unit = 'cm'): Spec => {
  const s = approxSpec(prompt, value, 2, hint, steps, holds, label)
  return { ...s, display: `${label} ≈ ${f2(value)} ${unit}`, unit }
}
/** an angle to 1 decimal place, in degrees */
const angle = (prompt: string, value: number, hint: string, steps: string[], holds: (x: number) => boolean, label = 'θ'): Spec => {
  const s = approxSpec(prompt, value, 1, hint, steps, holds, label)
  return { ...s, display: `${label} ≈ ${f1(value)}°`, unit: '°' }
}

/* ------------------------------------------------------------------ 1. right-angled triangles */

type Side = 'hyp' | 'adj' | 'opp'
const SIDE_NAME: Record<Side, string> = { hyp: 'hypotenuse', adj: 'side adjacent to the angle', opp: 'side opposite the angle' }

const RIGHT: Gen[] = [
  { lesson: 'right-triangles', level: 1, make: (r) => {
    const th = ri(r, 18, 72), g = ri(r, 5, 40)
    const given = pick(r, ['hyp', 'adj', 'opp'] as Side[]), unknown = pick(r, (['hyp', 'adj', 'opp'] as Side[]).filter((s) => s !== given))
    const H = given === 'hyp' ? g : given === 'adj' ? g / cos(th) : g / sin(th)
    const val = unknown === 'hyp' ? H : unknown === 'adj' ? H * cos(th) : H * sin(th)
    const key = [given, unknown].sort().join('-')
    const ratio = key === 'hyp-opp' ? 'sin' : key === 'adj-hyp' ? 'cos' : 'tan'
    const [num, den] = ratio === 'sin' ? ['opp', 'hyp'] : ratio === 'cos' ? ['adj', 'hyp'] : ['opp', 'adj']
    const holds = (x: number) => {
      const v: Record<string, number> = { [given]: g, [unknown]: x }
      return near(v[num] / v[den], ratio === 'sin' ? sin(th) : ratio === 'cos' ? cos(th) : tan(th))
    }
    const steps = [
      `Label the sides: the ${SIDE_NAME[given]} is the one we know (${g} cm), and we want the ${SIDE_NAME[unknown]}.`,
      `These two sides are linked by ${ratio} θ = ${num} / ${den} (SOH CAH TOA).`,
      `Substitute: ${ratio} ${th}° = ${num === unknown ? 'x' : g} / ${den === unknown ? 'x' : g}.`,
      `Solve for x: x = ${f2(val)} cm.`,
    ]
    return length(`In a right-angled triangle one of the acute angles is ${th}°, and the ${SIDE_NAME[given]} is ${g} cm. Find the length of the ${SIDE_NAME[unknown]}.`, val, 'Decide which two sides are involved, choose sin, cos or tan to match (SOH CAH TOA), then rearrange.', steps, holds, 'x')
  } },
  { lesson: 'right-triangles', level: 1, make: (r) => {
    // find an angle from two sides
    const pair = pick(r, [['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj']] as [Side, Side][])
    let a = ri(r, 3, 20), b = ri(r, 3, 20)
    if (pair[1] === 'hyp') { b = a + ri(r, 1, 12) } else if (a === b) b += 2
    const ratio = pair[1] === 'hyp' ? (pair[0] === 'opp' ? 'sin' : 'cos') : 'tan'
    const th = ratio === 'sin' ? deg(Math.asin(a / b)) : ratio === 'cos' ? deg(Math.acos(a / b)) : deg(Math.atan(a / b))
    const inv = `${ratio}⁻¹`
    const holds = (x: number) => near(ratio === 'sin' ? sin(x) : ratio === 'cos' ? cos(x) : tan(x), a / b)
    return angle(`In a right-angled triangle, the ${SIDE_NAME[pair[0]].replace(' to the angle', '')} to angle θ is ${a} cm and the ${pair[1] === 'hyp' ? 'hypotenuse' : SIDE_NAME[pair[1]].replace(' to the angle', '')} is ${b} cm. Find θ.`.replace('side opposite the angle to angle θ', 'side opposite angle θ').replace('side adjacent to the angle to angle θ', 'side adjacent to angle θ'), th,
      'Use the inverse trig function that matches the two sides: sin⁻¹ for opposite and hypotenuse, cos⁻¹ for adjacent and hypotenuse, tan⁻¹ for opposite and adjacent.', [
        `The two known sides are ${pair[0] === 'opp' ? 'opposite' : 'adjacent'} and ${pair[1] === 'hyp' ? 'hypotenuse' : pair[1] === 'adj' ? 'adjacent' : 'opposite'}, so ${ratio} θ = ${a}/${b}.`,
        `θ = ${inv}(${a}/${b}) ≈ ${f1(th)}°.`,
      ], holds)
  } },
  { lesson: 'right-triangles', level: 1, make: (r) => {
    // special triangles, exact values
    const kind = ri(r, 1, 4)
    if (kind === 1) {
      const h = 2 * ri(r, 2, 12)
      return numSpec(`A right-angled triangle has angles 30°, 60° and 90°, and its hypotenuse is ${h} cm. Find the length of the side opposite the 30° angle.`, fr(h / 2), 'In a 30-60-90 triangle the side opposite 30° is half the hypotenuse.', [`sin 30° = 1/2, so the side opposite 30° is ${h} × 1/2.`, `That is ${h / 2} cm.`])
    }
    if (kind === 2) {
      const h = ri(r, 2, 14)
      return radicalSpec(`A right-angled triangle has angles 30°, 60° and 90°, and its hypotenuse is ${h} cm. Find the exact length of the side opposite the 60° angle, in simplest form.`, root(0, fr(h, 2), 3), 'sin 60° = √3/2, so the side opposite 60° is the hypotenuse times √3/2.', [`sin 60° = √3/2.`, `The side is ${h} × √3/2 = ${h % 2 === 0 ? `${h / 2}√3` : `${h}√3/2`} cm.`], [])
    }
    if (kind === 3) {
      const leg = ri(r, 2, 15)
      return radicalSpec(`A right-angled isosceles triangle (angles 45°, 45° and 90°) has two equal sides of ${leg} cm. Find the exact length of the hypotenuse, in simplest form.`, root(0, leg, 2), 'In a 45-45-90 triangle the hypotenuse is √2 times a leg (Pythagoras: √(l² + l²)).', [`By Pythagoras the hypotenuse is √(${leg}² + ${leg}²) = √${2 * leg * leg}.`, `√${2 * leg * leg} = ${leg}√2 cm.`])
    }
    const h = ri(r, 2, 12) * 2
    return radicalSpec(`The hypotenuse of a right-angled triangle with angles 45°, 45° and 90° is ${h} cm. Find the exact length of each of the equal sides, in simplest form.`, root(0, fr(h, 2), 2), 'Each leg is the hypotenuse times sin 45° = √2/2. Rationalise if needed.', [`Each leg = ${h} × sin 45° = ${h} × √2/2.`, `That is ${h / 2}√2 cm.`])
  } },
  { lesson: 'right-triangles', level: 2, make: (r) => {
    // angles of elevation, ladders, ramps
    const kind = ri(r, 1, 4)
    if (kind === 1) {
      const d = ri(r, 12, 90), th = ri(r, 15, 65)
      const val = d * tan(th)
      return length(`A person stands ${d} m from the foot of a tall building. The angle of elevation of the top of the building is ${th}°. How tall is the building (measured from eye level)?`, val, 'Draw a right-angled triangle: the distance is the adjacent side, the height is the opposite side, so use tan.', [`Opposite = height h, adjacent = ${d} m, so tan ${th}° = h/${d}.`, `h = ${d} × tan ${th}° = ${f2(val)} m.`], (x) => near(x / d, tan(th)), 'h', 'm')
    }
    if (kind === 2) {
      const L = ri(r, 4, 12), th = ri(r, 55, 80)
      const val = L * sin(th)
      return length(`A ladder ${L} m long leans against a vertical wall and makes an angle of ${th}° with the ground. How far up the wall does it reach?`, val, 'The ladder is the hypotenuse and the height up the wall is opposite the angle at the ground: use sin.', [`sin ${th}° = height / ${L}.`, `height = ${L} × sin ${th}° = ${f2(val)} m.`], (x) => near(x / L, sin(th)), 'h', 'm')
    }
    if (kind === 3) {
      const h = ri(r, 20, 120), th = ri(r, 12, 55)
      const val = h / tan(th)
      return length(`From the top of a cliff ${h} m high, the angle of depression of a boat on the sea is ${th}°. How far is the boat from the foot of the cliff?`, val, 'The angle of depression equals the angle of elevation from the boat (alternate angles). Height is opposite, distance is adjacent: use tan.', [`The angle of elevation from the boat to the top is also ${th}°.`, `tan ${th}° = ${h} / d, so d = ${h} / tan ${th}° = ${f2(val)} m.`], (x) => near(h / x, tan(th)), 'd', 'm')
    }
    const L = ri(r, 3, 12), h = ri(r, 1, L - 1) + 0.5 * (r() < 0.5 ? 1 : 0)
    const th = deg(Math.asin(h / L))
    return angle(`A ramp ${L} m long rises ${h} m. Find the angle the ramp makes with the horizontal.`, th, 'The ramp is the hypotenuse and the rise is the opposite side: sin θ = opposite / hypotenuse.', [`sin θ = ${h}/${L}.`, `θ = sin⁻¹(${h}/${L}) ≈ ${f1(th)}°.`], (x) => near(sin(x), h / L))
  } },
  { lesson: 'right-triangles', level: 2, make: (r) => {
    // two legs: hypotenuse and the smaller angle
    const a = ri(r, 3, 15), b = a + ri(r, 1, 12)
    const hyp = Math.hypot(a, b), th = deg(Math.atan(a / b))
    if (r() < 0.5) return length(`A right-angled triangle has legs of ${a} cm and ${b} cm. Find the length of the hypotenuse.`, hyp, 'Use Pythagoras: hypotenuse² = a² + b².', [`h² = ${a}² + ${b}² = ${a * a + b * b}.`, `h = √${a * a + b * b} ≈ ${f2(hyp)} cm.`], (x) => near(x * x, a * a + b * b), 'h')
    return angle(`A right-angled triangle has legs of ${a} cm and ${b} cm. Find the size of its smallest angle.`, th, 'The smallest angle is opposite the shorter leg. Use tan θ = opposite / adjacent.', [`The shorter leg ${a} is opposite the smallest angle, so tan θ = ${a}/${b}.`, `θ = tan⁻¹(${a}/${b}) ≈ ${f1(th)}°.`], (x) => near(tan(x), a / b))
  } },
  { lesson: 'right-triangles', level: 3, make: (r) => {
    // two angles of elevation
    for (;;) {
      const al = ri(r, 15, 40), be = al + ri(r, 8, 30), d = ri(r, 20, 120)
      const h = d / (1 / tan(al) - 1 / tan(be))
      if (h > 400) continue
      return length(`The angle of elevation of the top of a tower from a point A on level ground is ${al}°. From a point B, ${d} m closer to the tower and in line with it, the angle of elevation is ${be}°. Find the height of the tower.`, h, 'Let the height be h. The horizontal distances are h/tan α from A and h/tan β from B. Their difference is d.', [
        `From A the distance to the foot is h/tan ${al}°; from B it is h/tan ${be}°.`, `The difference is d = ${d}: h(1/tan ${al}° − 1/tan ${be}°) = ${d}.`, `h = ${d} ÷ (1/tan ${al}° − 1/tan ${be}°) ≈ ${f2(h)} m.`], (x) => near(x / tan(al) - x / tan(be), d), 'h', 'm')
    }
  } },
  { lesson: 'right-triangles', level: 3, make: (r) => {
    // three dimensions
    if (r() < 0.55) {
      const a = ri(r, 3, 12), b = ri(r, 3, 12), c = ri(r, 2, 10)
      const base = Math.hypot(a, b), th = deg(Math.atan(c / base))
      return angle(`A cuboid is ${a} cm long, ${b} cm wide and ${c} cm high. Find the angle between the space diagonal (from one bottom corner to the opposite top corner) and the base.`, th, 'First find the diagonal of the base with Pythagoras. Then the space diagonal, the base diagonal and the height form a right-angled triangle.', [
        `The diagonal of the base is √(${a}² + ${b}²) = √${a * a + b * b} ≈ ${f2(base)} cm.`, `In the vertical right-angled triangle, tan θ = height / base diagonal = ${c} / ${f2(base)}.`, `θ = tan⁻¹(${c}/${f2(base)}) ≈ ${f1(th)}°.`], (x) => near(tan(x) * Math.hypot(a, b), c))
    }
    const s = ri(r, 4, 14), h = ri(r, 3, 14)
    const half = (s * Math.SQRT2) / 2, th = deg(Math.atan(h / half))
    return angle(`A square-based pyramid has a base of side ${s} cm and a vertical height of ${h} cm, with its apex directly above the centre of the base. Find the angle between a sloping edge and the base.`, th, 'The distance from the centre of the base to a corner is half the base diagonal. The height, that distance and the sloping edge form a right-angled triangle.', [
      `Half the base diagonal is ${s}√2/2 ≈ ${f2(half)} cm.`, `tan θ = ${h} / ${f2(half)}.`, `θ = tan⁻¹(${h}/${f2(half)}) ≈ ${f1(th)}°.`], (x) => near(tan(x) * half, h))
  } },
]

/* ------------------------------------------------------------------ 2. the sine and cosine rules */

const cosineSide = (b: number, c: number, A: number) => Math.sqrt(b * b + c * c - 2 * b * c * cos(A))

const TRIANGLES: Gen[] = [
  { lesson: 'sine-cosine-rules', level: 1, make: (r) => {
    const A = ri(r, 25, 85), B = ri(r, 25, 75), a = ri(r, 6, 30)
    const b = (a * sin(B)) / sin(A)
    return length(`In triangle ABC, angle A = ${A}°, angle B = ${B}° and side a = ${a} cm (opposite A). Find side b.`, b, 'Use the sine rule: a / sin A = b / sin B.', [`The sine rule: a/sin A = b/sin B, so ${a}/sin ${A}° = b/sin ${B}°.`, `b = ${a} × sin ${B}° / sin ${A}° ≈ ${f2(b)} cm.`], (x) => near(x / sin(B), a / sin(A)), 'b')
  } },
  { lesson: 'sine-cosine-rules', level: 1, make: (r) => {
    const A = ri(r, 30, 120), b = ri(r, 5, 20), c = ri(r, 5, 20)
    const a = cosineSide(b, c, A)
    return length(`In triangle ABC, b = ${b} cm, c = ${c} cm and angle A = ${A}°. Find side a.`, a, 'Two sides and the angle between them: use the cosine rule a² = b² + c² − 2bc cos A.', [`a² = ${b}² + ${c}² − 2 × ${b} × ${c} × cos ${A}°.`, `a² = ${f2(b * b + c * c - 2 * b * c * cos(A))}, so a = ${f2(a)} cm.`], (x) => near(x * x, b * b + c * c - 2 * b * c * cos(A), 1e-9), 'a')
  } },
  { lesson: 'sine-cosine-rules', level: 1, make: (r) => {
    const a = ri(r, 4, 20), b = ri(r, 4, 20), C = ri(r, 25, 140)
    const area = 0.5 * a * b * sin(C)
    return length(`Triangle ABC has sides a = ${a} cm and b = ${b} cm, and the angle between them is C = ${C}°. Find its area.`, area, 'Area = ½ ab sin C, using two sides and the angle between them.', [`Area = ½ × ${a} × ${b} × sin ${C}°.`, `= ${f2(area)} cm².`], (x) => near(x, 0.5 * a * b * sin(C)), 'area', 'cm²')
  } },
  { lesson: 'sine-cosine-rules', level: 2, make: (r) => {
    // three sides: an angle
    for (;;) {
      const a = ri(r, 4, 16), b = ri(r, 4, 16), c = ri(r, 4, 16)
      if (a + b <= c + 1 || a + c <= b + 1 || b + c <= a + 1) continue
      const A = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)))
      return angle(`Triangle ABC has sides a = ${a} cm, b = ${b} cm and c = ${c} cm. Find angle A (opposite side a).`, A, 'With three sides, rearrange the cosine rule: cos A = (b² + c² − a²) / (2bc).', [`cos A = (${b}² + ${c}² − ${a}²) / (2 × ${b} × ${c}) = ${MN(String(b * b + c * c - a * a))}/${2 * b * c}.`, `A = cos⁻¹(${MN(f2((b * b + c * c - a * a) / (2 * b * c)))}) ≈ ${f1(A)}°.`], (x) => near(a * a, b * b + c * c - 2 * b * c * cos(x), 1e-9), 'A')
    }
  } },
  { lesson: 'sine-cosine-rules', level: 2, make: (r) => {
    // sine rule for an angle with a > b: no ambiguity
    for (;;) {
      const A = ri(r, 30, 100), b = ri(r, 5, 15), a = b + ri(r, 2, 10)
      const s = (b * sin(A)) / a
      if (s >= 1) continue
      const B = deg(Math.asin(s))
      return angle(`In triangle ABC, a = ${a} cm, b = ${b} cm and angle A = ${A}°. Find angle B (the acute value).`, B, 'Use the sine rule in the form sin B / b = sin A / a, then take the inverse sine.', [`sin B / ${b} = sin ${A}° / ${a}, so sin B = ${b} × sin ${A}° / ${a} = ${f2(s)}.`, `B = sin⁻¹(${f2(s)}) ≈ ${f1(B)}°.`], (x) => near(sin(x) / b, sin(A) / a), 'B')
    }
  } },
  { lesson: 'sine-cosine-rules', level: 2, make: (r) => {
    // bearings: distance from the start
    for (;;) {
      const p = ri(r, 8, 25), q = ri(r, 8, 25), b1 = ri(r, 10, 170), d = ri(r, 30, 150), b2 = b1 + d
      const x = p * Math.sin(rad(b1)) + q * Math.sin(rad(b2)), y = p * Math.cos(rad(b1)) + q * Math.cos(rad(b2))
      const dist = Math.hypot(x, y)
      const z = (n: number) => String(n).padStart(3, '0')
      const turn = 180 - d
      return length(`A ship sails ${p} km on a bearing of ${z(b1)}°, then ${q} km on a bearing of ${z(b2)}°. How far is it from its starting point?`, dist, 'Find the angle inside the triangle at the turning point, then use the cosine rule with the two legs.', [
        `The two legs and the straight line back form a triangle. The change of bearing is ${b2} − ${b1} = ${d}°, so the angle inside the triangle at the turn is 180° − ${d}° = ${turn}°.`, `Cosine rule: distance² = ${p}² + ${q}² − 2 × ${p} × ${q} × cos ${turn}°.`, `= ${f2(dist * dist)}, so the distance is ${f2(dist)} km.`], (v) => near(v, dist, 1e-9), 'distance', 'km')
    }
  } },
  { lesson: 'sine-cosine-rules', level: 3, make: (r) => {
    // the ambiguous case: how many triangles?
    const A = ri(r, 25, 80), b = ri(r, 8, 20)
    const kind = ri(r, 1, 3)
    const h = b * sin(A)
    let a: number
    if (kind === 1) a = Math.floor(h * 0.7 * 10) / 10 || 1
    else if (kind === 2) a = Math.round((h + (b - h) * 0.5) * 10) / 10
    else a = Math.round((b + 2 + ri(r, 0, 6)) * 10) / 10
    if (kind === 2 && !(a > h + 0.05 && a < b - 0.05)) return TRIANGLES[6].make(r)
    const count = a < h - 1e-9 ? 0 : Math.abs(a - h) < 1e-9 ? 1 : a >= b ? 1 : 2
    return numSpec(`In triangle ABC, angle A = ${A}°, side b = ${b} cm and side a = ${a} cm. How many different triangles can be drawn? (Type 0, 1 or 2.)`, fr(count), 'Compare a with the height h = b sin A. Too short (a < h): none. A little longer (h < a < b): two. At least b: one.', [
      `The height from C to the line AB is h = b sin A = ${b} × sin ${A}° = ${f2(h)} cm.`, count === 0 ? `a = ${a} is shorter than h, so side a cannot reach the line: no triangle.` : count === 2 ? `h < a < b: side a can swing to meet the line in two places: two triangles.` : `a = ${a} ≥ b, so there is only one position that works: one triangle.`])
  } },
  { lesson: 'sine-cosine-rules', level: 3, make: (r) => {
    // both solutions of the ambiguous case
    for (;;) {
      const A = ri(r, 25, 65), b = ri(r, 8, 20), h = b * sin(A)
      const a = Math.round((h + (b - h) * (0.3 + 0.4 * r())) * 10) / 10
      if (!(a > h + 0.3 && a < b - 0.3)) continue
      const B1 = deg(Math.asin((b * sin(A)) / a)), B2 = 180 - B1
      const sorted = [B1, B2].sort((p, q) => p - q)
      return {
        prompt: `In triangle ABC, angle A = ${A}°, b = ${b} cm and a = ${a} cm. There are two possible triangles. Find both possible values of angle B, to 1 decimal place, separated by a comma.`, kind: 'set', answers: sorted, display: `B ≈ ${f1(sorted[0])}° or ${f1(sorted[1])}°`, input: `${f1(sorted[0])}, ${f1(sorted[1])}`, unit: '', needsExact: false, tol: 0.05,
        hint: 'Find the acute B from the sine rule. The other solution is its supplement, 180° − B, since sin(180° − B) = sin B.', explanation: [
          `sin B = b sin A / a = ${b} × sin ${A}° / ${a} = ${f2((b * sin(A)) / a)}.`, `One solution is B = sin⁻¹(${f2((b * sin(A)) / a)}) ≈ ${f1(B1)}°.`, `The other is 180° − ${f1(B1)}° = ${f1(B2)}°, which also fits because the angles of the triangle must still total less than 180°: ${A}° + ${f1(B2)}° < 180°.`],
        pad: { pi: false, root: false, comma: true, alg: true }, holds: (x) => Math.abs(sin(x) - (b * sin(A)) / a) < 1e-4,
      } as Spec
    }
  } },
  { lesson: 'sine-cosine-rules', level: 3, make: (r) => {
    // area from three sides (Heron), or the largest angle
    for (;;) {
      const a = ri(r, 5, 20), b = ri(r, 5, 20), c = ri(r, 5, 20)
      if (a + b <= c + 1 || a + c <= b + 1 || b + c <= a + 1) continue
      const s = (a + b + c) / 2
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
      if (r() < 0.5) {
        const A = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)))
        return length(`Triangle ABC has sides a = ${a} cm, b = ${b} cm and c = ${c} cm. Find its area.`, area, 'Either find an angle with the cosine rule and use ½ bc sin A, or use Heron: area = √(s(s − a)(s − b)(s − c)) with s the semi-perimeter.', [
          `Semi-perimeter s = (${a} + ${b} + ${c})/2 = ${s}.`, `Area = √(${s} × ${s - a} × ${s - b} × ${s - c}) = √${Number((s * (s - a) * (s - b) * (s - c)).toFixed(4))}.`, `That is ${f2(area)} cm². (Check: ½ bc sin A with A ≈ ${f1(A)}° gives the same.)`], (x) => near(x, 0.5 * b * c * Math.sin(Math.acos((b * b + c * c - a * a) / (2 * b * c))), 1e-9), 'area', 'cm²')
      }
      const m = Math.max(a, b, c)
      const [o1, o2] = m === a ? [b, c] : m === b ? [a, c] : [a, b]
      const big = deg(Math.acos((o1 * o1 + o2 * o2 - m * m) / (2 * o1 * o2)))
      return angle(`Triangle ABC has sides ${a} cm, ${b} cm and ${c} cm. Find its largest angle.`, big, 'The largest angle is opposite the longest side. Use the cosine rule with that side on its own.', [`The longest side is ${m} cm, so the largest angle is opposite it.`, `cos θ = (${o1}² + ${o2}² − ${m}²) / (2 × ${o1} × ${o2}) = ${f2((o1 * o1 + o2 * o2 - m * m) / (2 * o1 * o2))}.`, `θ ≈ ${f1(big)}°.`], (x) => near(m * m, o1 * o1 + o2 * o2 - 2 * o1 * o2 * cos(x), 1e-9))
    }
  } },
]

/* ------------------------------------------------------------------ helpers for the symbolic and exact lessons */

const VARS = ['x', 'x', 'x', 'θ', 't']
/** the same expression written in another letter, for display */
const inVar = (shown: string, v: string) => shown.replace(/(?<![A-Za-z])x(?![A-Za-z])/g, v)

function trigSpec(prompt: string, source: string, answer: string, hint: string, expl: string[], extra: { must?: string; mustNote?: string } = {}, v = 'x'): Spec {
  return {
    prompt: inVar(prompt, v), kind: 'alg', answers: [], display: inVar(showTrig(answer), v), input: answer, unit: '', needsExact: false, tol: 0, hint, explanation: expl.map((e) => inVar(e, v)),
    pad: { pi: true, root: false, comma: false, alg: true, extra: ['sin(', 'cos(', 'tan(', 'sec(', 'csc(', 'cot('] }, trig: { source, answer, ...extra },
  }
}

/** a multiple of π shown on screen and typed as text */
function piSpec(prompt: string, degrees: number, hint: string, expl: string[]): Spec {
  return {
    prompt, kind: 'value', answers: [rad(degrees)], display: fmtPi(degrees), input: piInput(degrees), unit: '', needsExact: true, tol: 1e-9, hint, explanation: expl,
    pad: { pi: true, root: false, comma: false, alg: true },
  }
}

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]

/** the six functions of an angle with sin = a/c and cos = b/c (positive), given signs for its quadrant */
function sixFns(a: number, b: number, c: number, sinSign: 1 | -1, cosSign: 1 | -1): Record<string, Frac> {
  const s = fr(sinSign * a, c), co = fr(cosSign * b, c)
  return { sin: s, cos: co, tan: fDiv(s, co), sec: fDiv(fr(1), co), csc: fDiv(fr(1), s), cot: fDiv(co, s) }
}
const QUADS: { name: string; s: 1 | -1; c: 1 | -1; range: string }[] = [
  { name: 'I', s: 1, c: 1, range: '0° < θ < 90°' }, { name: 'II', s: 1, c: -1, range: '90° < θ < 180°' }, { name: 'III', s: -1, c: -1, range: '180° < θ < 270°' }, { name: 'IV', s: -1, c: 1, range: '270° < θ < 360°' },
]

/* ------------------------------------------------------------------ 3. reciprocal functions and identities */

export interface Tmpl { level: 1 | 2 | 3; src: string; ans: string; hint?: string }
export const IDENTITIES: Tmpl[] = [
  { level: 1, src: 'sin(x)/cos(x)', ans: 'tan(x)' }, { level: 1, src: 'tan(x)*cos(x)', ans: 'sin(x)' }, { level: 1, src: '1-sin(x)^2', ans: 'cos(x)^2' }, { level: 1, src: '1-cos(x)^2', ans: 'sin(x)^2' },
  { level: 1, src: 'cot(x)*sin(x)', ans: 'cos(x)' }, { level: 1, src: 'sec(x)*sin(x)', ans: 'tan(x)' }, { level: 1, src: '3sin(x)^2+3cos(x)^2', ans: '3' }, { level: 1, src: 'sec(x)^2-tan(x)^2', ans: '1' },
  { level: 1, src: 'csc(x)*tan(x)', ans: 'sec(x)' }, { level: 1, src: 'sin(x)*csc(x)+cos(x)*sec(x)', ans: '2' },
  { level: 2, src: '(1-cos(x)^2)/sin(x)', ans: 'sin(x)' }, { level: 2, src: 'tan(x)^2+1', ans: 'sec(x)^2' }, { level: 2, src: '(sin(x)+cos(x))^2-2*sin(x)*cos(x)', ans: '1' },
  { level: 2, src: 'cos(x)^2/(1-sin(x))', ans: '1+sin(x)' }, { level: 2, src: 'csc(x)-sin(x)', ans: 'cos(x)*cot(x)' }, { level: 2, src: '(1+tan(x)^2)*cos(x)^2', ans: '1' },
  { level: 2, src: 'sin(x)/(1+cos(x))+(1+cos(x))/sin(x)', ans: '2*csc(x)' }, { level: 2, src: '(1-sin(x)^2)*tan(x)^2', ans: 'sin(x)^2' }, { level: 2, src: 'cot(x)^2+1', ans: 'csc(x)^2' },
  { level: 2, src: '1/tan(x)+tan(x)', ans: 'sec(x)*csc(x)' },
  { level: 3, src: '1/(1-sin(x))+1/(1+sin(x))', ans: '2*sec(x)^2' }, { level: 3, src: '(sec(x)+tan(x))*(sec(x)-tan(x))', ans: '1' }, { level: 3, src: 'cos(x)/(1-sin(x))-cos(x)/(1+sin(x))', ans: '2*tan(x)' },
  { level: 3, src: 'sin(x)^4-cos(x)^4', ans: 'sin(x)^2-cos(x)^2' }, { level: 3, src: 'cos(x)/(1+sin(x))+tan(x)', ans: 'sec(x)' }, { level: 3, src: '(1-cos(x))*(1+cos(x))/sin(x)', ans: 'sin(x)' },
  { level: 3, src: 'sec(x)^4-tan(x)^4', ans: 'sec(x)^2+tan(x)^2' }, { level: 3, src: '(1+sin(x))/cos(x)+cos(x)/(1+sin(x))', ans: '2*sec(x)' },
]

const IDENT: Gen[] = ([1, 2, 3] as const).flatMap((level) => {
  const pool = IDENTITIES.filter((t) => t.level === level)
  return [0, 1].map((): Gen => ({
    lesson: 'trig-identities', level,
    make: (r) => {
      const t = pick(r, pool), v = pick(r, VARS)
      return trigSpec(`Simplify ${showTrig(t.src)} as far as possible.`, t.src, t.ans, 'Rewrite everything in terms of sin and cos if you are stuck, then use sin²x + cos²x = 1, or one of its relatives 1 + tan²x = sec²x and 1 + cot²x = csc²x.', [
        `Use the identities to reduce it. For example, replace ${/sec|csc|cot|tan/.test(t.src) ? 'the reciprocal and quotient functions by sin and cos' : '1 − cos²x by sin²x, or 1 − sin²x by cos²x'}, then cancel.`,
        `The result is ${showTrig(t.ans)}.`,
        'You can test it: put x = 1 radian into the original and into your answer. The two numbers must match.',
      ], {}, v)
    },
  }))
})

const EXACT_IDENT: Gen[] = [
  { lesson: 'trig-identities', level: 1, make: (r) => {
    // the six functions from one of them, in a stated quadrant
    const [a, b, c] = pick(r, TRIPLES)
    const q = pick(r, QUADS)
    const fns = sixFns(a, b, c, q.s, q.c)
    const given = pick(r, ['sin', 'cos'])
    const want = pick(r, ['cos', 'tan', 'sec', 'csc', 'cot'].filter((f) => f !== given))
    const gv = fns[given]
    return numSpec(`Given that ${given} θ = ${fm(gv)} and ${q.range} (quadrant ${q.name}), find the exact value of ${want} θ.`, fns[want], 'Use sin²θ + cos²θ = 1 to find the other of sin and cos, choose its sign from the quadrant (ASTC), then form the quotient or reciprocal you need.', [
      `${given === 'sin' ? 'cos' : 'sin'}² θ = 1 − (${fm(gv)})² = ${fm(fSub(fr(1), fMul(gv, gv)))}, so ${given === 'sin' ? 'cos' : 'sin'} θ = ±${fm(fr(given === 'sin' ? b : a, c))}.`,
      `In quadrant ${q.name}, ${given === 'sin' ? 'cos' : 'sin'} is ${(given === 'sin' ? q.c : q.s) > 0 ? 'positive' : 'negative'}, so ${given === 'sin' ? 'cos' : 'sin'} θ = ${fm(given === 'sin' ? fns.cos : fns.sin)}.`,
      `${want} θ = ${want === 'tan' ? 'sin θ / cos θ' : want === 'sec' ? '1 / cos θ' : want === 'csc' ? '1 / sin θ' : want === 'cot' ? 'cos θ / sin θ' : 'the value found'} = ${fm(fns[want])}.`,
    ])
  } },
  { lesson: 'trig-identities', level: 2, make: (r) => {
    // a combination of the six
    const [a, b, c] = pick(r, TRIPLES)
    const q = pick(r, QUADS), f = sixFns(a, b, c, q.s, q.c)
    const kind = ri(r, 1, 3)
    const [text, val] = kind === 1 ? ['sec θ + tan θ', fAdd(f.sec, f.tan)] : kind === 2 ? ['csc θ − cot θ', fSub(f.csc, f.cot)] : ['sin θ cos θ', fMul(f.sin, f.cos)]
    return numSpec(`Given that tan θ = ${fm(f.tan)} and ${q.range}, find the exact value of ${text}.`, val, 'Find sin θ and cos θ from tan θ (a right-angled triangle gives the sizes, the quadrant gives the signs), then substitute.', [
      `tan θ = sin θ / cos θ = ${fm(f.tan)}. A right-angled triangle with legs ${a} and ${b} has hypotenuse ${c}, so |sin θ| = ${a}/${c} and |cos θ| = ${b}/${c}.`,
      `In quadrant ${q.name}: sin θ = ${fm(f.sin)} and cos θ = ${fm(f.cos)}.`, `${text} = ${fm(val)}.`])
  } },
  { lesson: 'trig-identities', level: 3, make: (r) => {
    // use sin^2 + cos^2 = 1 to find sin * cos from a sum or a difference
    const [a, b, c] = pick(r, TRIPLES), swap = r() < 0.5
    const [p, q] = swap ? [b, a] : [a, b]
    const s = fr((r() < 0.5 ? 1 : -1) * p, c), co = fr((r() < 0.5 ? 1 : -1) * q, c)
    const plus = r() < 0.5
    const combo = plus ? fAdd(s, co) : fSub(s, co)
    const sq = fMul(combo, combo)
    return numSpec(`Given that sin θ ${plus ? '+' : MINUS} cos θ = ${fm(combo)}, find the exact value of sin θ cos θ.`, fMul(s, co), `Square both sides and use sin²θ + cos²θ = 1. The cross term 2 sin θ cos θ appears with a ${plus ? 'plus' : 'minus'} sign.`, [
      `Square both sides: sin²θ ${plus ? '+' : MINUS} 2 sin θ cos θ + cos²θ = (${fm(combo)})² = ${fm(sq)}.`, `Use sin²θ + cos²θ = 1: 1 ${plus ? '+' : MINUS} 2 sin θ cos θ = ${fm(sq)}.`, `So ${plus ? '2 sin θ cos θ' : `${MINUS}2 sin θ cos θ`} = ${fm(fSub(sq, fr(1)))}, and sin θ cos θ = ${fm(fMul(s, co))}.`])
  } },

]


/* ------------------------------------------------------------------ 4. sum, difference and double angles */

export const COMPOUND: Record<number, { sin: string; cos: string; tan: string; split: [number, number, '+' | '−'] }> = {
  15: { sin: '(√6 − √2)/4', cos: '(√6 + √2)/4', tan: '2 − √3', split: [45, 30, '−'] },
  75: { sin: '(√6 + √2)/4', cos: '(√6 − √2)/4', tan: '2 + √3', split: [45, 30, '+'] },
  105: { sin: '(√6 + √2)/4', cos: '(√2 − √6)/4', tan: '−2 − √3', split: [60, 45, '+'] },
  165: { sin: '(√6 − √2)/4', cos: '(−√6 − √2)/4', tan: '−2 + √3', split: [135, 30, '+'] },
}
const toInput = (shown: string) => shown.replace(/−/g, '-').replace(/√(\d+)/g, 'sqrt($1)')

const sinD = (d: number) => Math.sin(rad(d)), cosD = (d: number) => Math.cos(rad(d))

const COMPOUND_GENS: Gen[] = [
  { lesson: 'compound-angles', level: 1, make: (r) => {
    // exact values at 15, 75, 105, 165 degrees
    const d = pick(r, [15, 75, 105, 165]), fn = pick(r, ['sin', 'cos', 'tan'] as const), useRad = r() < 0.5
    const info = COMPOUND[d], shown = info[fn], val = fn === 'sin' ? sinD(d) : fn === 'cos' ? cosD(d) : Math.tan(rad(d))
    const [A, B, sign] = info.split
    const angleText = useRad ? fmtPi(d) : fmtDeg(d)
    const formula = fn === 'sin'
      ? `sin(${A}° ${sign} ${B}°) = sin ${A}° cos ${B}° ${sign === '+' ? '+' : '−'} cos ${A}° sin ${B}°`
      : fn === 'cos' ? `cos(${A}° ${sign} ${B}°) = cos ${A}° cos ${B}° ${sign === '+' ? '−' : '+'} sin ${A}° sin ${B}°` : `tan(${A}° ${sign} ${B}°) = (tan ${A}° ${sign} tan ${B}°) / (1 ${sign === '+' ? '−' : '+'} tan ${A}° tan ${B}°)`
    return {
      prompt: `Find the exact value of ${fn} ${angleText}. (Write ${angleText} as a sum or difference of angles with known values.)`, kind: 'value', answers: [val], display: shown, input: toInput(shown), unit: '', needsExact: true, tol: 1e-9,
      hint: `Split the angle into two special angles: ${d}° = ${A}° ${sign} ${B}°. Then use the sum or difference formula and the exact values of 30°, 45° and 60°.`,
      explanation: [`${d}° = ${A}° ${sign} ${B}°.`, `${formula}.`, `Substitute the exact values (sin 30° = 1/2, cos 30° = √3/2, sin 45° = cos 45° = √2/2, sin 60° = √3/2, cos 60° = 1/2) and simplify: ${fn} ${d}° = ${shown}.`, `Check: ${shown} ≈ ${MN(val.toFixed(4))}.`],
      pad: { pi: false, root: true, comma: false, alg: true },
    } as Spec
  } },
  { lesson: 'compound-angles', level: 1, make: (r) => {
    // double angle from a right triangle
    const [a, b, c] = pick(r, TRIPLES), swap = r() < 0.5
    const [p, q] = swap ? [b, a] : [a, b]
    const fn = pick(r, ['sin', 'cos', 'tan'] as const)
    const s = fr(p, c), co = fr(q, c)
    const val = fn === 'sin' ? fMul(fr(2), fMul(s, co)) : fn === 'cos' ? fSub(fMul(co, co), fMul(s, s)) : fDiv(fMul(fr(2), fMul(s, co)), fSub(fMul(co, co), fMul(s, s)))
    return numSpec(`θ is an acute angle with sin θ = ${fm(s)}. Find the exact value of ${fn} 2θ.`, val, 'Find cos θ from sin²θ + cos²θ = 1. Then use sin 2θ = 2 sin θ cos θ, cos 2θ = cos²θ − sin²θ, tan 2θ = sin 2θ / cos 2θ.', [
      `cos θ = √(1 − (${fm(s)})²) = ${fm(co)} (positive, since θ is acute).`, fn === 'sin' ? `sin 2θ = 2 × ${fm(s)} × ${fm(co)} = ${fm(val)}.` : fn === 'cos' ? `cos 2θ = (${fm(co)})² − (${fm(s)})² = ${fm(val)}.` : `sin 2θ = ${fm(fMul(fr(2), fMul(s, co)))} and cos 2θ = ${fm(fSub(fMul(co, co), fMul(s, s)))}, so tan 2θ = ${fm(val)}.`])
  } },
  { lesson: 'compound-angles', level: 2, make: (r) => {
    // single function of a multiple angle
    const T: { src: string; ans: string; must?: string; note?: string }[] = [
      { src: '2sin(x)cos(x)', ans: 'sin(2x)', must: '\\(2\\*?x\\)', note: 'Write it as a single sine of the double angle 2x.' }, { src: 'cos(x)^2-sin(x)^2', ans: 'cos(2x)', must: '\\(2\\*?x\\)', note: 'Write it as a single cosine of the double angle 2x.' },
      { src: '2cos(x)^2-1', ans: 'cos(2x)', must: '\\(2\\*?x\\)', note: 'Write it as a single cosine of the double angle 2x.' }, { src: '1-2sin(x)^2', ans: 'cos(2x)', must: '\\(2\\*?x\\)', note: 'Write it as a single cosine of the double angle 2x.' },
      { src: 'sin(x)*cos(3x)+cos(x)*sin(3x)', ans: 'sin(4x)', must: '\\(4\\*?x\\)', note: 'Use the sum formula to write it as a single sine of 4x.' }, { src: 'cos(2x)*cos(x)-sin(2x)*sin(x)', ans: 'cos(3x)', must: '\\(3\\*?x\\)', note: 'Use the sum formula to write it as a single cosine of 3x.' },
      { src: 'sin(5x)*cos(2x)-cos(5x)*sin(2x)', ans: 'sin(3x)', must: '\\(3\\*?x\\)', note: 'Use the difference formula to write it as a single sine of 3x.' }, { src: 'cos(3x)*cos(x)+sin(3x)*sin(x)', ans: 'cos(2x)', must: '\\(2\\*?x\\)', note: 'Use the difference formula to write it as a single cosine of 2x.' },
    ]
    const t = pick(r, T), v = pick(r, VARS)
    return trigSpec(`Write ${showTrig(t.src)} as a single trigonometric function.`, t.src, t.ans, 'Recognise the pattern: sin A cos B + cos A sin B = sin(A + B); cos A cos B − sin A sin B = cos(A + B); 2 sin x cos x = sin 2x; cos²x − sin²x = cos 2x.', [`Match the expression with a sum or double-angle formula.`, `It equals ${showTrig(t.ans)}.`], { must: t.must, mustNote: t.note }, v)
  } },
  { lesson: 'compound-angles', level: 2, make: (r) => {
    // sum and difference of two acute angles
    const [a1, b1, c1] = pick(r, TRIPLES), [a2, b2, c2] = pick(r, TRIPLES)
    const sA = fr(a1, c1), cA = fr(b1, c1), cB = fr(b2, c2), sB = fr(a2, c2)
    const kind = pick(r, ['sin(A + B)', 'cos(A + B)', 'sin(A − B)', 'cos(A − B)'])
    const val = kind === 'sin(A + B)' ? fAdd(fMul(sA, cB), fMul(cA, sB)) : kind === 'cos(A + B)' ? fSub(fMul(cA, cB), fMul(sA, sB)) : kind === 'sin(A − B)' ? fSub(fMul(sA, cB), fMul(cA, sB)) : fAdd(fMul(cA, cB), fMul(sA, sB))
    return numSpec(`A and B are acute angles with sin A = ${fm(sA)} and cos B = ${fm(cB)}. Find the exact value of ${kind}.`, val, 'Find cos A and sin B from sin² + cos² = 1 (both positive, the angles are acute), then use the sum or difference formula.', [
      `cos A = ${fm(cA)} and sin B = ${fm(sB)}.`, `${kind === 'sin(A + B)' ? 'sin(A + B) = sin A cos B + cos A sin B' : kind === 'cos(A + B)' ? 'cos(A + B) = cos A cos B − sin A sin B' : kind === 'sin(A − B)' ? 'sin(A − B) = sin A cos B − cos A sin B' : 'cos(A − B) = cos A cos B + sin A sin B'}.`, `Substitute: the value is ${fm(val)}.`])
  } },
  { lesson: 'compound-angles', level: 3, make: (r) => {
    // angles in other quadrants
    const [a1, b1, c1] = pick(r, TRIPLES), [a2, b2, c2] = pick(r, TRIPLES)
    const obtuse = r() < 0.5
    const sA = fr(a1, c1), cA = fr(obtuse ? -b1 : b1, c1), cB = fr(b2, c2), sB = fr(-a2, c2)
    const kind = pick(r, ['sin(A + B)', 'cos(A + B)', 'cos(A − B)', 'sin(A − B)'])
    const val = kind === 'sin(A + B)' ? fAdd(fMul(sA, cB), fMul(cA, sB)) : kind === 'cos(A + B)' ? fSub(fMul(cA, cB), fMul(sA, sB)) : kind === 'cos(A − B)' ? fAdd(fMul(cA, cB), fMul(sA, sB)) : fSub(fMul(sA, cB), fMul(cA, sB))
    return numSpec(`Angle A satisfies sin A = ${fm(sA)} and ${obtuse ? 'is obtuse' : 'is acute'}. Angle B satisfies cos B = ${fm(cB)} and lies in the fourth quadrant (270° < B < 360°). Find the exact value of ${kind}.`, val, 'Find the missing sine or cosine of each angle with sin² + cos² = 1, taking the sign from the quadrant: cos is negative for an obtuse angle, sin is negative in the fourth quadrant.', [
      `cos A = ${fm(cA)} (${obtuse ? 'negative, because A is obtuse' : 'positive, because A is acute'}).`, `sin B = ${fm(sB)} (negative, because B is in the fourth quadrant).`, `Apply the formula for ${kind}: the value is ${fm(val)}.`])
  } },
  { lesson: 'compound-angles', level: 3, make: (r) => {
    // harmonic form R sin(x + alpha)
    const a = ri(r, 1, 8), b = ri(r, 1, 8)
    const R = Math.hypot(a, b), al = deg(Math.atan2(b, a))
    return {
      prompt: `Write ${a === 1 ? '' : a}sin x + ${b === 1 ? '' : b}cos x in the form R sin(x + α), with R > 0 and α acute. Give (R, α), with R to 1 decimal place and α in degrees to 1 decimal place.`, kind: 'pair', answers: [R, al], display: `(${f1(R)}, ${f1(al)}°)`, input: `(${f1(R)}, ${f1(al)})`, unit: '', needsExact: false, tol: 0.06,
      hint: 'Expand R sin(x + α) = R sin x cos α + R cos x sin α and match the coefficients: R cos α = a, R sin α = b. Then R = √(a² + b²) and tan α = b/a.', explanation: [
        `R sin(x + α) = R cos α · sin x + R sin α · cos x, so R cos α = ${a} and R sin α = ${b}.`, `R = √(${a}² + ${b}²) = √${a * a + b * b} ≈ ${f1(R)}.`, `tan α = ${b}/${a}, so α = tan⁻¹(${b}/${a}) ≈ ${f1(al)}°.`],
      pad: { pi: false, root: true, comma: true, alg: true },
    } as Spec
  } },
  { lesson: 'compound-angles', level: 3, make: (r) => {
    // half angle
    const [, b, c] = pick(r, TRIPLES)
    const cosT = fr(b, c)
    const half = r() < 0.5
    const inner = half ? fDiv(fSub(fr(1), cosT), fr(2)) : fDiv(fAdd(fr(1), cosT), fr(2))
    const val = root(0, fDiv(fr(1), fr(inner.d)), inner.n * inner.d)
    return radicalSpec(`θ is an acute angle with cos θ = ${fm(cosT)}. Find the exact value of ${half ? 'sin' : 'cos'}(θ/2), in simplest form with a rational denominator.`, val, half ? 'Use the half-angle formula sin²(θ/2) = (1 − cos θ)/2, and take the positive root because θ/2 is acute.' : 'Use the half-angle formula cos²(θ/2) = (1 + cos θ)/2, and take the positive root because θ/2 is acute.', [
      `${half ? 'sin' : 'cos'}²(θ/2) = (1 ${half ? '−' : '+'} ${fm(cosT)})/2 = ${fm(inner)}.`, `θ/2 is acute, so take the positive root: ${half ? 'sin' : 'cos'}(θ/2) = √(${fm(inner)}).`, `Rationalise: √(${fm(inner)}) = ${fmtRoot(val)}.`], [])
  } },
]

/* ------------------------------------------------------------------ 5. graphs of trigonometric functions */

/** y = a sin(bx) + d typeset, with b a rational given as [numerator, denominator] */
function waveText(fn: string, a: number, b: [number, number], d: number, phase = ''): string {
  const arg = b[1] !== 1 ? (b[0] === 1 ? `x/${b[1]}` : `${b[0]}x/${b[1]}`) : `${b[0] === 1 ? '' : b[0]}x`
  const inner = phase ? `${arg} ${phase}` : arg
  const body = /[ /]/.test(inner) ? `(${inner})` : inner
  const call = phase || b[1] !== 1 ? `${fn}${body.startsWith('(') ? body : ` ${body}`}` : `${fn} ${body}`
  return `y = ${a === 1 ? '' : a === -1 ? MINUS : MN(String(a))}${call}${d === 0 ? '' : ` ${sgnText(d)}`}`
}
const B_CHOICES: [number, number][] = [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 3], [3, 2], [5, 1], [6, 1]]

const GRAPHS: Gen[] = [
  { lesson: 'trig-graphs', level: 1, make: (r) => {
    const a = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5, 1, -1]), d = pick(r, [0, 0, -3, -2, -1, 1, 2, 3]), b = pick(r, B_CHOICES.slice(0, 5)), fn = pick(r, ['sin', 'cos'])
    const eq = waveText(fn, a, b, d)
    const what = pick(r, ['amplitude', 'midline', 'maximum', 'minimum'])
    const A = Math.abs(a)
    const val = what === 'amplitude' ? A : what === 'midline' ? d : what === 'maximum' ? d + A : d - A
    const shown = what === 'midline' ? 'the value of d in the midline y = d' : what === 'amplitude' ? 'the amplitude' : `the ${what} value`
    return numSpec(`For ${eq}, find ${what === 'midline' ? 'the midline: give the value of y on the line y = …' : shown}.`.replace('find the amplitude', 'find the amplitude'), fr(val), 'For y = a sin(bx) + d: amplitude |a|, midline y = d, maximum d + |a|, minimum d − |a|. The factor b changes only the period.', [
      `Compare with y = a ${fn}(bx) + d: here a = ${MN(String(a))} and d = ${MN(String(d))}.`, `Amplitude = |a| = ${A}; midline y = ${MN(String(d))}; maximum = ${MN(String(d + A))}; minimum = ${MN(String(d - A))}.`, `So the ${what} is ${MN(String(val))}.`])
  } },
  { lesson: 'trig-graphs', level: 1, make: (r) => {
    // the period as a multiple of pi
    const fn = pick(r, ['sin', 'cos', 'tan']), b = pick(r, B_CHOICES)
    const base = fn === 'tan' ? 180 : 360
    const period = (base * b[1]) / b[0]
    if (!Number.isInteger(period)) return GRAPHS[1].make(r)
    const arg = b[1] !== 1 ? (b[0] === 1 ? `x/${b[1]}` : `${b[0]}x/${b[1]}`) : `${b[0] === 1 ? '' : b[0]}x`
    const text = `y = ${fn}${/[/]/.test(arg) ? `(${arg})` : ` ${arg}`}`
    return piSpec(`Find the period of ${text}. Give your answer as a multiple of π (you can type pi).`, period, `The basic ${fn} curve repeats every ${fn === 'tan' ? 'π' : '2π'}. Replacing x by bx divides the period by b: the period is ${fn === 'tan' ? 'π' : '2π'}/b.`, [`The period of y = ${fn} x is ${fn === 'tan' ? 'π' : '2π'}.`, `With bx in place of x (b = ${b[1] === 1 ? b[0] : `${b[0]}/${b[1]}`}), the period is ${fn === 'tan' ? 'π' : '2π'} ÷ ${b[1] === 1 ? b[0] : `${b[0]}/${b[1]}`} = ${fmtPi(period)}.`])
  } },
  { lesson: 'trig-graphs', level: 2, make: (r) => {
    // phase shift
    const fn = pick(r, ['sin', 'cos']), b = pick(r, [2, 3, 4]), s = pick(r, [15, 30, 45, 60, 90]) * (r() < 0.5 ? 1 : -1)
    const phi = b * Math.abs(s)
    const arg = `${b}x ${s > 0 ? MINUS : '+'} ${fmtPi(phi)}`
    const a = pick(r, [1, 2, 3, -1, -2])
    const d = pick(r, [0, 1, -1, 2])
    const text = `y = ${a === 1 ? '' : a === -1 ? MINUS : MN(String(a))}${fn}(${arg})${d === 0 ? '' : ` ${sgnText(d)}`}`
    return piSpec(`For ${text}, find the phase shift (the horizontal shift of the graph, positive to the right). Give it as a multiple of π.`, s, 'Factor the angle: bx − φ = b(x − φ/b). The graph of y = sin(b(x − h)) is shifted h to the right, so h = φ/b.', [
      `Factor ${b} out of the bracket: ${arg} = ${b}(x ${s > 0 ? MINUS : '+'} ${fmtPi(Math.abs(s))}).`, `So the graph is the graph of ${fn} ${b}x shifted ${fmtPi(Math.abs(s))} to the ${s > 0 ? 'right' : 'left'}.`, `The phase shift is ${fmtPi(s)}.`])
  } },
  { lesson: 'trig-graphs', level: 2, make: (r) => {
    // write the equation from a description
    const kind = ri(r, 1, 3)
    const a = rnz(r, 1, 4) * (kind !== 3 && r() < 0.3 ? -1 : 1), bi = pick(r, [1, 2, 3, 4]), d = pick(r, [0, 1, -1, 2, -2, 3])
    const P = 360 / bi, dTxt = d === 0 ? '' : d > 0 ? `+${d}` : `${d}`, arg = bi === 1 ? 'x' : `${bi}x`
    const sh = pick(r, [30, 45, 60, 90])
    const desc = kind === 1 ? `It passes through (0, ${MN(String(d))}) and ${a > 0 ? 'rises' : 'falls'} from there` : kind === 2 ? `It has its ${a > 0 ? 'maximum' : 'minimum'} value at x = 0` : `It crosses its midline going upwards at x = ${fmtPi(sh)}`
    const answer = kind === 1 ? `${a}*sin(${arg})${dTxt}` : kind === 2 ? `${a}*cos(${arg})${dTxt}` : `${a}*sin(${bi === 1 ? '' : `${bi}*`}(x-${piInput(sh)}))${dTxt}`
    const amp = Math.abs(a)
    const why = kind === 1 ? `A sine curve passes through its midline at x = 0, rising for positive a and falling for negative a: y = ${MN(String(a))} sin ${arg}${d === 0 ? '' : ` ${sgnText(d)}`}.` : kind === 2 ? `A cosine curve starts at its maximum (positive a) or its minimum (negative a): y = ${MN(String(a))} cos ${arg}${d === 0 ? '' : ` ${sgnText(d)}`}.` : `A sine curve crosses its midline going up at x = 0. Shifted right by ${fmtPi(sh)}, it does so at x = ${fmtPi(sh)}: replace x by (x − ${fmtPi(sh)}).`
    const spec = trigSpec(`A sinusoidal curve has amplitude ${amp}, period ${fmtPi(P)} and midline y = ${MN(String(d))}. ${desc}. Write an equation for it.`, '', answer, 'Start from y = a sin(bx) + d or y = a cos(bx) + d: |a| is the amplitude, b = 2π ÷ period, d is the midline. How the curve starts decides sine or cosine, or a shift.', [
      `The amplitude is ${amp} and the midline is y = ${MN(String(d))}. The period ${fmtPi(P)} gives b = 2π ÷ ${fmtPi(P)} = ${bi}.`, why, 'Any equal form is accepted, for example a cosine curve with a suitable shift.'])
    return { ...spec, display: `y = ${showTrig(answer)}` }
  } },
  { lesson: 'trig-graphs', level: 3, make: (r) => {
    // vertical asymptotes of tan, sec and csc on [0, 2π]
    const fn = pick(r, ['tan', 'sec', 'csc']), b = pick(r, [[1, 1], [2, 1], [3, 1], [1, 2], [4, 1]] as [number, number][])
    const first = fn === 'csc' ? 0 : 90
    const step = fn === 'csc' ? 180 : 180
    const degs: number[] = []
    for (let k = -2; k < 40; k++) { const x = ((first + step * k) * b[1]) / b[0]; if (x >= -1e-9 && x <= 360 + 1e-9) degs.push(Math.round(x * 1e6) / 1e6) }
    const uniq = [...new Set(degs)].sort((p, q) => p - q)
    if (uniq.length === 0 || uniq.some((x) => !Number.isInteger(x)) || uniq.length > 9) return GRAPHS[4].make(r)
    const arg = b[1] !== 1 ? `x/${b[1]}` : b[0] === 1 ? 'x' : `${b[0]}x`
    const items = uniq.map((d) => ({ val: rad(d), disp: fmtPi(d), inp: piInput(d), exact: true }))
    return exactSet(`Find the vertical asymptotes of y = ${fn}${/[/]/.test(arg) ? `(${arg})` : ` ${arg}`} for 0 ≤ x ≤ 2π. Give the values of x, separated by commas.`, items, 'x',
      fn === 'csc' ? 'csc y = 1/sin y is undefined where sin is zero.' : `${fn === 'tan' ? 'tan' : 'sec'} u is undefined where cos u = 0, that is u = π/2 + kπ. Here u = ${arg}.`, [
        fn === 'csc' ? `csc u = 1/sin u has asymptotes where sin u = 0: u = 0, π, 2π, … with u = ${arg}.` : `${fn} u has asymptotes where cos u = 0: u = π/2, 3π/2, 5π/2, … with u = ${arg}.`,
        `Solve for x and keep the values from 0 to 2π.`, `The asymptotes are at x = ${uniq.map(fmtPi).join(', ')}.`], undefined,
      (x) => { const u = (x * b[0]) / b[1]; return fn === 'csc' ? Math.abs(Math.sin(u)) < 1e-9 : Math.abs(Math.cos(u)) < 1e-9 })
  } },
  { lesson: 'trig-graphs', level: 3, make: (r) => {
    // a tide-type model
    const d = pick(r, [8, 10, 12, 6]), a = pick(r, [2, 3, 4, 5]), p = pick(r, [3, 6, 2, 4])
    return {
      prompt: `The depth of water in a harbour is D = ${d} + ${a} sin(πt/${p}) metres, where t is the time in hours after midnight. Find the greatest depth and the first time (t > 0) at which it occurs. Give (depth, t).`, kind: 'pair', answers: [d + a, p / 2], display: `(${d + a}, ${p / 2})`, input: `(${d + a}, ${p / 2})`, unit: '', needsExact: false, tol: 1e-9,
      hint: 'The depth is greatest when sin takes its maximum value 1. Find the first positive t that makes the angle π/2.', explanation: [`sin takes its maximum value 1, so the greatest depth is ${d} + ${a} × 1 = ${d + a} metres.`, `That happens first when πt/${p} = π/2, so t = ${p}/2 = ${p / 2} hours.`],
      pad: { pi: false, root: false, comma: true, alg: true },
    } as Spec
  } },
]

/* ------------------------------------------------------------------ 6. trigonometric equations */

/** all solutions of f(d) = 0 for d in [lo, hi] (degrees), by scanning for sign changes and tangencies */
export function rootsIn(f: (d: number) => number, lo: number, hi: number, step = 0.05): number[] {
  const out: number[] = []
  const push = (x: number) => { if (!out.some((o) => Math.abs(o - x) < 1e-6)) out.push(x) }
  const bisect = (a: number, b: number) => { let fa = f(a); for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm2 = f(m); if (Math.sign(fm2) === Math.sign(fa)) { a = m; fa = fm2 } else b = m } return (a + b) / 2 }
  let prevX = lo, prev = f(lo)
  if (Math.abs(prev) < 1e-10) push(lo)
  for (let x = lo + step; x <= hi + 1e-9; x += step) {
    const v = f(x)
    if (Number.isFinite(prev) && Number.isFinite(v)) {
      if (Math.abs(v) < 1e-10) push(x)
      else if (prev * v < 0) { const root = bisect(prevX, x); if (Math.abs(f(root)) < 1e-6) push(root) }
      else if (Math.abs(v) < 5e-3 && Math.abs(v) <= Math.abs(prev)) {
        // a possible tangency: refine the minimum of |f| nearby
        let a = x - step, b = x + step
        for (let i = 0; i < 60; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) b = m2; else a = m1 }
        const m = (a + b) / 2
        if (Math.abs(f(m)) < 1e-9) push(m)
      }
    }
    prev = v; prevX = x
  }
  return out.sort((p, q) => p - q).map((x) => Math.round(x * 1e6) / 1e6)
}

/** special-angle solutions of fn(x) = v in [lo, hi] degrees (any number of turns) */
function specialIn(fn: 'sin' | 'cos' | 'tan', v: ReturnType<typeof surd>, lo: number, hi: number): number[] {
  const out: number[] = []
  for (let k = Math.floor(lo / 360) - 1; k <= Math.ceil(hi / 360) + 1; k++) for (const d of solveSpecial(fn, v, 0, 360)) { const x = d + 360 * k; if (x >= lo && x <= hi && !out.includes(x)) out.push(x) }
  return out.sort((p, q) => p - q)
}

function angleSet(prompt: string, degs: number[], useRad: boolean, hint: string, expl: string[], residual: (d: number) => number): Spec {
  const sorted = [...new Set(degs)].sort((p, q) => p - q)
  const toUnit = (d: number) => (useRad ? rad(d) : d)
  return {
    prompt, kind: 'set', answers: sorted.map(toUnit), display: sorted.length ? sorted.map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(', ') : 'no solution',
    input: sorted.length ? sorted.map((d) => (useRad ? piInput(d) : String(d))).join(', ') : 'no solution', unit: '', needsExact: useRad, tol: useRad ? 1e-7 : 1e-6, hint, explanation: expl,
    pad: { pi: useRad, root: false, comma: true, alg: true }, holds: (x) => Math.abs(residual(useRad ? deg(x) : x)) < 1e-9,
  }
}
const interval = (lo: number, hi: number, useRad: boolean, v = 'x') => (useRad ? `${fmtPi(lo)} ≤ ${v} ≤ ${fmtPi(hi)}` : `${lo}° ≤ ${v} ≤ ${hi}°`)
const sinX = (d: number) => Math.sin(rad(d)), cosX = (d: number) => Math.cos(rad(d)), tanX = (d: number) => Math.tan(rad(d))
const FNJS = { sin: sinX, cos: cosX, tan: tanX }

/** check a hand-derived answer against the scan: the two methods must agree */
function verified(f: (d: number) => number, lo: number, hi: number, expected: number[], what: string): number[] {
  const scan = rootsIn(f, lo, hi)
  if (scan.length !== expected.length || scan.some((x, i) => Math.abs(x - expected[i]) > 1e-4)) throw new Error(`trig equation "${what}": scan ${scan.join(',')} != derived ${expected.join(',')}`)
  return expected
}

const SQ = { sin: 'sin²x', cos: 'cos²x', tan: 'tan²x' }

const EQNS: Gen[] = [
  { lesson: 'trig-equations-general', level: 1, make: (r) => {
    // fn x = v over two turns
    const fn = pick(r, ['sin', 'cos', 'tan'] as const), v = pick(r, specialValues(fn)), turns = pick(r, [2, 2, 3]), useRad = r() < 0.5
    const hi = 360 * turns
    const ans = specialIn(fn, v, 0, hi)
    if (!ans.length) return EQNS[0].make(r)
    const f = (d: number) => FNJS[fn](d) - surdValue(v)
    verified(f, 0, hi, ans, `${fn} x = ${fmtSurd(v)}`)
    return angleSet(`Solve ${fn} x = ${fmtSurd(v)} for ${interval(0, hi, useRad)}. Give all solutions, separated by commas.`, ans, useRad, `Find the solutions in the first turn (the reference angle and the quadrant rule), then add 360° (2π) for each further turn.`, [
      `In the first turn (0° to 360°) the solutions of ${fn} x = ${fmtSurd(v)} are ${specialIn(fn, v, 0, 360).map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(' and ') || 'none'}.`,
      `The function repeats every ${fn === 'tan' ? '180°' : '360°'}, so add ${fn === 'tan' ? '180°' : '360°'} (${fn === 'tan' ? 'π' : '2π'}) to each to find the later solutions that still fit in the interval.`, `All the solutions are ${ans.map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(', ')}.`], f)
  } },
  { lesson: 'trig-equations-general', level: 1, make: (r) => {
    // a factorable quadratic in sin or cos
    const fn = pick(r, ['sin', 'cos'] as const), useRad = r() < 0.5
    const roots: [number, number][] = [[1, 1], [-1, 1], [1, 2], [-1, 2], [0, 1]]
    for (;;) {
      const [r1, r2] = [pick(r, roots), pick(r, roots)]
      if (r1[0] * r2[1] === r2[0] * r1[1]) continue
      // (r1d s - r1n)(r2d s - r2n)
      const A = r1[1] * r2[1], B = -(r1[1] * r2[0] + r2[1] * r1[0]), C = r1[0] * r2[0]
      const g = (s: number) => A * s * s + B * s + C
      const vals = [r1, r2].map(([n, d]) => surd(n, d))
      const ans = [...new Set(vals.flatMap((v) => specialIn(fn, v, 0, 360)))].sort((p, q) => p - q)
      const f = (d: number) => g(FNJS[fn](d))
      verified(f, 0, 360, ans, `quadratic in ${fn}`)
      const term = (k: number, body: string, first: boolean) => `${first ? (k < 0 ? MINUS : '') : ` ${k < 0 ? MINUS : '+'} `}${Math.abs(k) === 1 && body ? '' : Math.abs(k)}${body}`
      const parts: string[] = []
      if (A) parts.push(term(A, SQ[fn], true))
      if (B) parts.push(term(B, `${fn} x`, parts.length === 0))
      if (C) parts.push(term(C, '', parts.length === 0))
      const eqn = `${parts.join('')} = 0`
      return angleSet(`Solve ${eqn} for ${interval(0, 360, useRad)}. Give all solutions, separated by commas.`, ans, useRad, `Treat ${fn} x as a single unknown and factor the quadratic. Then solve each equation ${fn} x = (a value).`, [
        `Factor as a quadratic in ${fn} x: (${r1[1] === 1 ? '' : r1[1]}${fn} x ${sgnText(-r1[0])})(${r2[1] === 1 ? '' : r2[1]}${fn} x ${sgnText(-r2[0])}) = 0.`.replace(/ \+ 0\)/g, ')'),
        `So ${fn} x = ${fm(fr(r1[0], r1[1]))} or ${fn} x = ${fm(fr(r2[0], r2[1]))}.`, `Solve each in the interval: the solutions are ${ans.map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(', ')}.`], f)
    }
  } },
  { lesson: 'trig-equations-general', level: 2, make: (r) => {
    // multiple angle: fn(bx) = v
    for (let tries = 0; tries < 200; tries++) {
      const fn = pick(r, ['sin', 'cos', 'tan'] as const), b = pick(r, [2, 2, 3, 4]), v = pick(r, specialValues(fn)), useRad = r() < 0.5
      const us = specialIn(fn, v, 0, 360 * b)
      const xs = us.map((u) => u / b)
      if (!xs.length || xs.some((x) => !Number.isInteger(x))) continue
      const f = (d: number) => FNJS[fn](b * d) - surdValue(v)
      verified(f, 0, 360, xs, `${fn}(${b}x) = ${fmtSurd(v)}`)
      return angleSet(`Solve ${fn} ${b}x = ${fmtSurd(v)} for ${interval(0, 360, useRad)}. Give all solutions, separated by commas.`, xs, useRad, `Let u = ${b}x. If x runs from 0 to 360° (2π) then u runs through ${b} full turns. Solve for u over that longer range, then divide by ${b}.`, [
        `Put u = ${b}x. Then u ranges over 0° ≤ u ≤ ${360 * b}° (${b} turns).`, `Solve ${fn} u = ${fmtSurd(v)} over that range: u = ${us.map((d) => fmtDeg(d)).join(', ')}.`, `Divide by ${b}: x = ${xs.map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(', ')}.`], f)
    }
    throw new Error('no multiple-angle equation found')
  } },
  { lesson: 'trig-equations-general', level: 2, make: (r) => {
    // a shifted angle: fn(x ± s) = v
    for (let tries = 0; tries < 200; tries++) {
      const fn = pick(r, ['sin', 'cos'] as const), s = pick(r, [15, 30, 45, 60, 90]) * (r() < 0.5 ? 1 : -1), v = pick(r, specialValues(fn)), useRad = r() < 0.5
      const us = specialIn(fn, v, -720, 720)
      const xs = us.map((u) => u - s).filter((x) => x >= 0 && x <= 360)
      if (!xs.length || xs.some((x) => !Number.isInteger(x))) continue
      const f = (d: number) => FNJS[fn](d + s) - surdValue(v)
      verified(f, 0, 360, xs, `${fn}(x + ${s}) = ${fmtSurd(v)}`)
      const shiftText = s > 0 ? `x + ${useRad ? fmtPi(s) : fmtDeg(s)}` : `x ${MINUS} ${useRad ? fmtPi(-s) : fmtDeg(-s)}`
      return angleSet(`Solve ${fn}(${shiftText}) = ${fmtSurd(v)} for ${interval(0, 360, useRad)}. Give all solutions, separated by commas.`, xs, useRad, 'Let u = x + (the shift). Find every u that fits the range u takes, then subtract the shift.', [
        `Put u = ${shiftText}. As x runs from 0 to 360° (2π), u runs from ${s}° to ${360 + s}°.`, `Solve ${fn} u = ${fmtSurd(v)} for u in that range, then subtract the shift: x = u ${s > 0 ? '−' : '+'} ${Math.abs(s)}°.`, `The solutions are ${xs.map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(', ')}.`], f)
    }
    throw new Error('no shifted equation found')
  } },
  { lesson: 'trig-equations-general', level: 3, make: (r) => {
    // equations that need an identity first
    const T: { text: string; f: (d: number) => number; ans: number[]; steps: string[]; hint: string }[] = [
      { text: 'sin 2x = sin x', f: (d) => sinX(2 * d) - sinX(d), ans: [0, 60, 180, 300, 360], hint: 'Replace sin 2x by 2 sin x cos x, move everything to one side and factor out sin x.', steps: ['sin 2x = 2 sin x cos x, so 2 sin x cos x − sin x = 0.', 'Factor: sin x (2 cos x − 1) = 0, so sin x = 0 or cos x = 1/2.', 'sin x = 0 gives x = 0°, 180°, 360°; cos x = 1/2 gives x = 60°, 300°.'] },
      { text: 'cos 2x = cos x', f: (d) => cosX(2 * d) - cosX(d), ans: [0, 120, 240, 360], hint: 'Use cos 2x = 2cos²x − 1 so the equation is a quadratic in cos x.', steps: ['cos 2x = 2cos²x − 1, so 2cos²x − cos x − 1 = 0.', 'Factor: (2 cos x + 1)(cos x − 1) = 0, so cos x = −1/2 or cos x = 1.', 'cos x = 1 gives x = 0°, 360°; cos x = −1/2 gives x = 120°, 240°.'] },
      { text: 'sin 2x = cos x', f: (d) => sinX(2 * d) - cosX(d), ans: [30, 90, 150, 270], hint: 'Replace sin 2x by 2 sin x cos x and factor out cos x. Do not divide by cos x: that would lose solutions.', steps: ['sin 2x = 2 sin x cos x, so 2 sin x cos x − cos x = 0.', 'Factor: cos x (2 sin x − 1) = 0, so cos x = 0 or sin x = 1/2.', 'cos x = 0 gives x = 90°, 270°; sin x = 1/2 gives x = 30°, 150°.'] },
      { text: '2cos²x + sin x = 1', f: (d) => 2 * cosX(d) ** 2 + sinX(d) - 1, ans: [90, 210, 330], hint: 'Use cos²x = 1 − sin²x to get a quadratic in sin x.', steps: ['cos²x = 1 − sin²x, so 2 − 2 sin²x + sin x = 1, i.e. 2 sin²x − sin x − 1 = 0.', 'Factor: (2 sin x + 1)(sin x − 1) = 0, so sin x = −1/2 or sin x = 1.', 'sin x = 1 gives x = 90°; sin x = −1/2 gives x = 210°, 330°.'] },
      { text: 'cos 2x + 3 sin x = 2', f: (d) => cosX(2 * d) + 3 * sinX(d) - 2, ans: [30, 90, 150], hint: 'Use cos 2x = 1 − 2 sin²x, so that everything is in terms of sin x.', steps: ['cos 2x = 1 − 2 sin²x, so 1 − 2 sin²x + 3 sin x = 2, i.e. 2 sin²x − 3 sin x + 1 = 0.', 'Factor: (2 sin x − 1)(sin x − 1) = 0, so sin x = 1/2 or sin x = 1.', 'sin x = 1/2 gives x = 30°, 150°; sin x = 1 gives x = 90°.'] },
      { text: 'tan x = 2 sin x', f: (d) => tanX(d) - 2 * sinX(d), ans: [0, 60, 180, 300, 360], hint: 'Write tan x = sin x / cos x, bring everything to one side and factor out sin x (do not divide by it).', steps: ['sin x / cos x − 2 sin x = 0, so sin x (1/cos x − 2) = 0.', 'Either sin x = 0, or 1/cos x = 2, which means cos x = 1/2.', 'sin x = 0 gives x = 0°, 180°, 360°; cos x = 1/2 gives x = 60°, 300°.'] },
      { text: '2sin²x = 3cos x', f: (d) => 2 * sinX(d) ** 2 - 3 * cosX(d), ans: [60, 300], hint: 'Use sin²x = 1 − cos²x to get a quadratic in cos x, and check that the roots are possible values of cos x.', steps: ['sin²x = 1 − cos²x, so 2 − 2cos²x = 3 cos x, i.e. 2cos²x + 3 cos x − 2 = 0.', 'Factor: (2 cos x − 1)(cos x + 2) = 0, so cos x = 1/2 or cos x = −2.', 'cos x = −2 is impossible. cos x = 1/2 gives x = 60°, 300°.'] },
      { text: 'sin x + cos x = 1', f: (d) => sinX(d) + cosX(d) - 1, ans: [0, 90, 360], hint: 'Square both sides and use sin²x + cos²x = 1. Then check each answer in the original equation, because squaring can add false solutions.', steps: ['Square both sides: sin²x + 2 sin x cos x + cos²x = 1, so 2 sin x cos x = 0, i.e. sin 2x = 0.', 'sin x = 0 or cos x = 0 gives candidates 0°, 90°, 180°, 270°, 360°.', 'Check each in sin x + cos x = 1: at 0° and 360° the sine is 0 and the cosine is 1, and at 90° the sine is 1 and the cosine is 0, so all three give 1 and work; 180° and 270° both give −1, so they are false solutions.'] },
      { text: 'tan²x = 3', f: (d) => tanX(d) ** 2 - 3, ans: [60, 120, 240, 300], hint: 'Take the square root of both sides, keeping both signs.', steps: ['tan x = √3 or tan x = −√3.', 'tan x = √3 gives x = 60°, 240°; tan x = −√3 gives x = 120°, 300°.'] },
      { text: 'sin x tan x = sin x', f: (d) => sinX(d) * tanX(d) - sinX(d), ans: [0, 45, 180, 225, 360], hint: 'Move everything to one side and factor out sin x. Do not divide by sin x: it can be zero.', steps: ['sin x tan x − sin x = 0, so sin x (tan x − 1) = 0.', 'Either sin x = 0 (x = 0°, 180°, 360°) or tan x = 1 (x = 45°, 225°).'] },
    ]
    const t = pick(r, T), useRad = r() < 0.5
    verified(t.f, 0, 360, t.ans, t.text)
    return angleSet(`Solve ${t.text} for ${interval(0, 360, useRad)}. Give all solutions, separated by commas.`, t.ans, useRad, t.hint, [...t.steps, `The solutions are ${t.ans.map((d) => (useRad ? fmtPi(d) : fmtDeg(d))).join(', ')}.`], t.f)
  } },
  { lesson: 'trig-equations-general', level: 3, make: (r) => {
    // how many solutions?
    for (let tries = 0; tries < 200; tries++) {
      const fn = pick(r, ['sin', 'cos', 'tan'] as const), b = pick(r, [1, 1, 2, 3]), v = pick(r, specialValues(fn).filter((x) => x.p !== 0 || fn !== 'tan')), turns = pick(r, [1, 2, 3])
      const hi = 360 * turns
      const us = specialIn(fn, v, 0, hi * b)
      if (!us.length) continue
      const f = (d: number) => FNJS[fn](b * d) - surdValue(v)
      const count = rootsIn(f, 0, hi).length
      if (count !== us.length || count === 0) continue
      return numSpec(`How many solutions does ${fn}${b === 1 ? ' x' : ` ${b}x`} = ${fmtSurd(v)} have for 0 ≤ x ≤ ${fmtPi(hi)}?`, fr(count), `Count the solutions in one turn of ${b === 1 ? 'x' : `u = ${b}x`}, then allow for how many turns the angle makes over the interval.`, [
        `Over 0 ≤ x ≤ ${fmtPi(hi)} the angle ${b === 1 ? 'x' : `${b}x`} makes ${turns * b} full turn${turns * b === 1 ? '' : 's'}.`,
        Number.isInteger(count / (turns * b)) ? `${fn} ${b === 1 ? 'x' : 'u'} = ${fmtSurd(v)} has ${count / (turns * b)} solution${count / (turns * b) === 1 ? '' : 's'} in each turn, so ${turns * b} × ${count / (turns * b)} = ${count}.` : 'Count the solutions in the first turn and in each later turn, counting a solution at an end of the interval only once.',
        `In total there ${count === 1 ? 'is 1 solution' : `are ${count} solutions`}.`])
    }
    throw new Error('no counting question found')
  } },
]

export const TRIG2_GENS: Gen[] = [...RIGHT, ...TRIANGLES, ...IDENT, ...EXACT_IDENT, ...COMPOUND_GENS, ...GRAPHS, ...EQNS]
