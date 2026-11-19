/**
 * Question generators for the geometry essentials unit: angles and triangles, the Pythagorean theorem and distance, area and
 * volume, similarity, and circles. Answers are exact (fractions or multiples of π), or decimals where a square root appears.
 */
import { fDiv, fMul, fr, fSub } from './algebra'
import { fm, fracPiSpec, MN, numSpec, tupleSpec } from './calcHelpers'
import { ri, rnz } from './algebraQuestions'
import { approxSpec } from './powerQuestions'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const F = (n: number, d = 1) => fr(n, d)
const words = (prompt: string, ws: string[], opts: string[], hint: string, expl: string[]): Spec => ({ prompt, kind: 'word', answers: [], display: ws[0], input: ws[0], words: ws, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: false, extra: opts } })
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [6, 8, 10], [9, 12, 15], [12, 16, 20], [15, 20, 25], [10, 24, 26]]
const pi = (f: { n: number; d: number }) => (f.d === 1 ? `${f.n === 1 ? '' : f.n}π` : `${f.n === 1 ? '' : f.n}π/${f.d}`)

/* ------------------------------------------------------------------ angles and triangles */

export const ANGLE_GENS: Gen[] = [
  { lesson: 'angles-triangles', level: 1, make: (r) => {
    const a = ri(r, 10, 80), comp = r() < 0.5
    return numSpec(`Find the ${comp ? 'complement' : 'supplement'} of a ${comp ? a : a + 90}° angle.`, F(comp ? 90 - a : 180 - (a + 90)), comp ? 'Complementary angles add up to 90°.' : 'Supplementary angles add up to 180°.', [comp ? `90° − ${a}° = ${90 - a}°.` : `180° − ${a + 90}° = ${90 - a}°.`])
  } },
  { lesson: 'angles-triangles', level: 1, make: (r) => {
    const a = ri(r, 20, 80), b = ri(r, 20, 100 - 0), c = 180 - a - b
    if (c <= 10) return ANGLE_GENS[1].make(r)
    return numSpec(`Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, F(c), 'The angles of a triangle add up to 180°.', [`${a}° + ${b}° = ${a + b}°, so the third angle is 180° − ${a + b}° = ${c}°.`])
  } },
  { lesson: 'angles-triangles', level: 2, make: (r) => {
    const n = ri(r, 5, 12)
    return numSpec(`What is the sum of the interior angles of a polygon with ${n} sides?`, F((n - 2) * 180), 'Split the polygon into triangles from one vertex: there are (n − 2) of them, each with angle sum 180°.', [`(${n} − 2) × 180° = ${n - 2} × 180° = ${(n - 2) * 180}°.`])
  } },
  { lesson: 'angles-triangles', level: 2, make: (r) => {
    const n = pick(r, [5, 6, 8, 9, 10, 12]), interior = ((n - 2) * 180) / n
    const wantExterior = r() < 0.4
    return numSpec(`What is the size of each ${wantExterior ? 'exterior' : 'interior'} angle of a regular polygon with ${n} sides?`, F(wantExterior ? 360 / n : interior), wantExterior ? 'The exterior angles of any polygon add up to 360°, so each exterior angle of a regular polygon is 360°/n.' : 'The interior angle sum is (n − 2) × 180°. Divide by n for a regular polygon.', [wantExterior ? `360° ÷ ${n} = ${360 / n}°.` : `(${n} − 2) × 180° ÷ ${n} = ${(n - 2) * 180}° ÷ ${n} = ${interior}°.`])
  } },
  { lesson: 'angles-triangles', level: 2, make: (r) => {
    const a = ri(r, 25, 80), b = ri(r, 25, 80)
    return numSpec(`In a triangle two interior angles are ${a}° and ${b}°. What is the exterior angle at the third vertex?`, F(a + b), 'An exterior angle equals the sum of the two opposite interior angles.', [`The exterior angle is ${a}° + ${b}° = ${a + b}°.`, `(Check: the third interior angle is ${180 - a - b}°, and ${180 - a - b}° + ${a + b}° = 180°.)`])
  } },
  { lesson: 'angles-triangles', level: 3, make: (r) => {
    const x = ri(r, 10, 40), a0 = ri(r, 0, 20), k = ri(r, 2, 3)
    // angles x + a0, k x, and the rest: sum 180 -> choose third = 180 - (x + a0) - k x written as (c x + d)
    const third = 180 - (x + a0) - k * x
    if (third <= 5) return ANGLE_GENS[5].make(r)
    return numSpec(`The angles of a triangle are (x + ${a0})°, ${k}x° and ${third}°. Find x.`.replace('(x + 0)°', 'x°'), F(x), 'The three angles add up to 180°. Write an equation and solve for x.', [`(x + ${a0}) + ${k}x + ${third} = 180.`, `${k + 1}x + ${a0 + third} = 180, so ${k + 1}x = ${180 - a0 - third} and x = ${x}.`])
  } },
  { lesson: 'angles-triangles', level: 3, make: (r) => {
    // alternate (equal) or co-interior (supplementary) angles between parallel lines
    const x = ri(r, 8, 30), a = ri(r, 2, 5), b = ri(r, 1, a - 1), alt = r() < 0.5
    if (alt) { const d = (a - b) * x + 5; return numSpec(`Two parallel lines are cut by a transversal. The alternate angles are (${a}x + 5)° and (${b}x + ${d})°. Find x.`.replace(/\+ 0\)/, ')'), F(x), 'Alternate angles between parallel lines are equal.', [`${a}x + 5 = ${b}x + ${d}.`, `${a - b}x = ${d - 5}, so x = ${x}.`]) }
    const rest = 180 - (a + b) * x
    if (rest < 1) return ANGLE_GENS[6].make(r)
    return numSpec(`Two parallel lines are cut by a transversal. The co-interior (same-side) angles are ${a}x° and (${b}x + ${rest})°. Find x.`, F(x), 'Co-interior angles between parallel lines add up to 180°.', [`${a}x + ${b}x + ${rest} = 180.`, `${a + b}x = ${180 - rest}, so x = ${x}.`])
  } },
  { lesson: 'angles-triangles', level: 3, make: (r) => {
    const apex = ri(r, 20, 140), iso = r() < 0.6
    if (iso) return numSpec(`An isosceles triangle has an apex angle (between the two equal sides) of ${apex}°. What is each base angle? Give a number.`, F(180 - apex, 2), 'The two base angles are equal, and all three angles add to 180°.', [`The base angles share 180° − ${apex}° = ${180 - apex}°.`, `Each is ${(180 - apex) / 2}°.`])
    const base = ri(r, 30, 80)
    return numSpec(`An isosceles triangle has a base angle of ${base}°. What is the apex angle?`, F(180 - 2 * base), 'The two base angles are equal.', [`180° − ${base}° − ${base}° = ${180 - 2 * base}°.`])
  } },
]

/* ------------------------------------------------------------------ the Pythagorean theorem and distance */

export const PYTH_GENS: Gen[] = [
  { lesson: 'pythagorean-distance', level: 1, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES)
    return numSpec(`The two shorter sides of a right-angled triangle are ${a} and ${b}. Find the hypotenuse.`, F(c), 'Pythagorean theorem: a² + b² = c², where c is the hypotenuse (the longest side, opposite the right angle).', [`c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}.`, `c = √${c * c} = ${c}.`])
  } },
  { lesson: 'pythagorean-distance', level: 1, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES), swap = r() < 0.5
    const [known, ans] = swap ? [a, b] : [b, a]
    return numSpec(`A right-angled triangle has hypotenuse ${c} and one other side ${known}. Find the third side.`, F(ans), 'Rearrange a² + b² = c² to find a shorter side: a² = c² − b².', [`${ans}² = ${c}² − ${known}² = ${c * c} − ${known * known} = ${ans * ans}.`, `${ans} = √${ans * ans} = ${ans}.`])
  } },
  { lesson: 'pythagorean-distance', level: 2, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES), x1 = ri(r, -6, 4), y1 = ri(r, -6, 4), sx = pick(r, [1, -1]), sy = pick(r, [1, -1])
    return numSpec(`Find the distance between the points (${A(x1)}, ${A(y1)}) and (${A(x1 + sx * a)}, ${A(y1 + sy * b)}).`, F(c), 'The distance formula is the Pythagorean theorem: d = √((x₂ − x₁)² + (y₂ − y₁)²).', [`Horizontal difference ${a}, vertical difference ${b}.`, `d = √(${a}² + ${b}²) = √${c * c} = ${c}.`])
  } },
  { lesson: 'pythagorean-distance', level: 2, make: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c2 = a * a + b * b
    if (Number.isInteger(Math.sqrt(c2))) return PYTH_GENS[3].make(r)
    return approxSpec(`The two shorter sides of a right-angled triangle are ${a} and ${b}. Find the hypotenuse.`, Math.sqrt(c2), 2, 'Use a² + b² = c² and take the square root.', [`c² = ${a * a} + ${b * b} = ${c2}.`, `c = √${c2} ≈ ${Math.sqrt(c2).toFixed(2)}.`], undefined, 'c')
  } },
  { lesson: 'pythagorean-distance', level: 2, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES), right = r() < 0.5, k = right ? c : c + ri(r, 1, 2)
    return words(`Is a triangle with sides ${a}, ${b} and ${k} a right-angled triangle? Answer yes or no.`, right ? ['yes', 'right-angled', 'it is a right triangle'] : ['no', 'not right-angled'], ['yes', 'no'], 'Converse of the Pythagorean theorem: if a² + b² = c² for the longest side c, the triangle is right-angled.', [`${a}² + ${b}² = ${a * a + b * b} and ${k}² = ${k * k}.`, right ? 'They are equal, so the triangle has a right angle.' : 'They are not equal, so it is not a right-angled triangle.'])
  } },
  { lesson: 'pythagorean-distance', level: 2, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES)
    return numSpec(`A rectangle is ${a} cm wide and ${b} cm tall. How long is its diagonal?`, F(c), 'The diagonal is the hypotenuse of a right-angled triangle whose legs are the width and the height.', [`d² = ${a}² + ${b}² = ${a * a + b * b}, so d = ${c} cm.`])
  } },
  { lesson: 'pythagorean-distance', level: 3, make: (r) => {
    const [x, y, z, d] = pick(r, [[1, 2, 2, 3], [2, 3, 6, 7], [4, 4, 7, 9], [2, 10, 11, 15], [6, 6, 7, 11], [2, 6, 9, 11], [1, 4, 8, 9], [4, 8, 8, 12], [3, 4, 12, 13], [2, 5, 14, 15], [5, 10, 10, 15]] as [number, number, number, number][])
    return numSpec(`A box measures ${x} by ${y} by ${z}. What is the length of its longest diagonal (corner to opposite corner through the inside)?`, F(d), 'Apply the Pythagorean theorem twice, or use d² = x² + y² + z².', [`d² = ${x}² + ${y}² + ${z}² = ${x * x + y * y + z * z}.`, `d = √${d * d} = ${d}.`])
  } },
  { lesson: 'pythagorean-distance', level: 3, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES.filter((t) => t[2] >= 13))
    return numSpec(`A ${c} m ladder leans against a vertical wall with its foot ${a} m from the wall. How high up the wall does it reach?`, F(b), 'The ladder is the hypotenuse of a right-angled triangle formed with the wall and the ground.', [`h² = ${c}² − ${a}² = ${c * c - a * a}.`, `h = √${b * b} = ${b} m.`])
  } },
  { lesson: 'pythagorean-distance', level: 3, make: (r) => {
    const x1 = ri(r, -5, 3), y1 = ri(r, -5, 3), dx = ri(r, 1, 8), dy = ri(r, 1, 8)
    return approxSpec(`Find the distance between (${A(x1)}, ${A(y1)}) and (${A(x1 + dx)}, ${A(y1 - dy)}).`, Math.sqrt(dx * dx + dy * dy), 2, 'Distance = √((x₂ − x₁)² + (y₂ − y₁)²).', [`Horizontal difference ${dx}, vertical difference ${dy}.`, `d = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy} ≈ ${Math.sqrt(dx * dx + dy * dy).toFixed(2)}.`], undefined, 'd')
  } },
]

/* ------------------------------------------------------------------ area and volume */

export const AREA_GENS: Gen[] = [
  { lesson: 'area-volume', level: 1, make: (r) => {
    const l = ri(r, 3, 20), w = ri(r, 2, 15), per = r() < 0.5
    return numSpec(`A rectangle is ${l} cm by ${w} cm. What is its ${per ? 'perimeter' : 'area'}?`, F(per ? 2 * (l + w) : l * w), per ? 'Perimeter is the distance around: 2 × (length + width).' : 'Area of a rectangle = length × width.', [per ? `2 × (${l} + ${w}) = ${2 * (l + w)} cm.` : `${l} × ${w} = ${l * w} cm².`])
  } },
  { lesson: 'area-volume', level: 1, make: (r) => {
    const b = ri(r, 2, 20), h = ri(r, 2, 16)
    return numSpec(`A triangle has base ${b} and height ${h}. What is its area? Give a fraction or decimal.`, F(b * h, 2), 'Area of a triangle = ½ × base × height, where the height is measured at right angles to the base.', [`½ × ${b} × ${h} = ${fm(F(b * h, 2))}.`])
  } },
  { lesson: 'area-volume', level: 2, make: (r) => {
    const a = ri(r, 3, 14), b = ri(r, 3, 14), h = ri(r, 2, 12)
    return numSpec(`A trapezoid has parallel sides ${a} and ${b}, and the distance between them is ${h}. Find its area. Give a fraction or decimal.`, F((a + b) * h, 2), 'Area of a trapezoid = ½ × (sum of the parallel sides) × height.', [`½ × (${a} + ${b}) × ${h} = ${fm(F((a + b) * h, 2))}.`])
  } },
  { lesson: 'area-volume', level: 2, make: (r) => {
    const rad = ri(r, 2, 15), circ = r() < 0.5
    return fracPiSpec(`A circle has radius ${rad}. What is its ${circ ? 'circumference' : 'area'}? Give the answer in terms of π.`, F(circ ? 2 * rad : rad * rad), circ ? 'Circumference = 2πr.' : 'Area = πr².', [circ ? `2π × ${rad} = ${2 * rad}π.` : `π × ${rad}² = ${rad * rad}π.`])
  } },
  { lesson: 'area-volume', level: 2, make: (r) => {
    const t = ri(r, 1, 3), a = ri(r, 2, 12), b = ri(r, 2, 10), h = ri(r, 2, 15)
    if (t === 1) return numSpec(`A rectangular box is ${a} by ${b} by ${h}. What is its volume?`, F(a * b * h), 'Volume of a box = length × width × height.', [`${a} × ${b} × ${h} = ${a * b * h}.`])
    if (t === 2) return fracPiSpec(`A cylinder has radius ${a} and height ${h}. What is its volume? Give the answer in terms of π.`, F(a * a * h), 'Volume of a cylinder = πr²h (the area of the circular base times the height).', [`π × ${a}² × ${h} = ${a * a * h}π.`])
    return numSpec(`A prism has a triangular base with base ${a} and height ${b}, and the prism is ${h} long. What is its volume? Give a fraction or decimal.`, F(a * b * h, 2), 'Volume of a prism = (area of the base) × (length).', [`Base area = ½ × ${a} × ${b} = ${fm(F(a * b, 2))}.`, `Volume = ${fm(F(a * b, 2))} × ${h} = ${fm(F(a * b * h, 2))}.`])
  } },
  { lesson: 'area-volume', level: 2, make: (r) => {
    const l = ri(r, 2, 12), w = ri(r, 2, 10), h = ri(r, 2, 9)
    return numSpec(`Find the total surface area of a closed box that is ${l} by ${w} by ${h}.`, F(2 * (l * w + l * h + w * h)), 'A box has three pairs of identical faces: top and bottom, front and back, left and right.', [`2(${l}×${w} + ${l}×${h} + ${w}×${h}) = 2(${l * w} + ${l * h} + ${w * h}) = ${2 * (l * w + l * h + w * h)}.`])
  } },
  { lesson: 'area-volume', level: 3, make: (r) => {
    const rad = ri(r, 1, 6) * 3, sphere = r() < 0.5
    if (sphere) return fracPiSpec(`A sphere has radius ${rad}. What is its volume? Give the answer in terms of π.`, F(4 * rad ** 3, 3), 'Volume of a sphere = (4/3)πr³.', [`(4/3) × π × ${rad}³ = (4/3) × ${rad ** 3}π = ${pi(F(4 * rad ** 3, 3))}.`])
    const h = ri(r, 2, 12)
    return fracPiSpec(`A cone has base radius ${rad} and height ${h}. What is its volume? Give the answer in terms of π.`, F(rad * rad * h, 3), 'Volume of a cone = (1/3)πr²h, one third of the cylinder with the same base and height.', [`(1/3) × π × ${rad}² × ${h} = ${pi(F(rad * rad * h, 3))}.`])
  } },
  { lesson: 'area-volume', level: 3, make: (r) => {
    const w = ri(r, 2, 8) * 2, h = ri(r, 3, 12)
    return fracPiSpec(`A window is a rectangle ${w} wide and ${h} tall, with a semicircle of diameter ${w} on top. Its area is (a whole number) + (a multiple of π). Give the multiple of π only.`, F(w * w, 8), 'The semicircle has half the area of a circle of radius w/2: ½ × π(w/2)².', [`The semicircle has radius ${w / 2}, so its area is ½ × π × ${(w / 2) ** 2} = ${pi(F((w / 2) ** 2, 2))}.`, `The rectangle adds ${w * h}, so the total area is ${w * h} + ${pi(F(w * w, 8))}.`])
  } },
  { lesson: 'area-volume', level: 3, make: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9)
    return numSpec(`A rectangle measures ${a} m by ${b} m. What is its area in square centimetres?`, F(a * b * 10000), 'There are 100 cm in a metre, so 100 × 100 = 10 000 cm² in a square metre.', [`Area = ${a * b} m² = ${a * b} × 10 000 cm² = ${a * b * 10000} cm².`])
  } },
]

/* ------------------------------------------------------------------ similarity */

export const SIM_GENS: Gen[] = [
  { lesson: 'similarity', level: 1, make: (r) => {
    const k = ri(r, 2, 5), a = ri(r, 2, 9), c = ri(r, 2, 9), shrink = r() < 0.4
    const from = shrink ? a * k : a, to = shrink ? a : a * k, q = shrink ? c * k : c, ans = shrink ? c : c * k
    return numSpec(`Two shapes are similar. A side of length ${from} in the first shape corresponds to a side of length ${to} in the second. What length in the second shape corresponds to a side of length ${q} in the first?`, F(ans), 'Find the scale factor (second ÷ first) and multiply every length by it.', [`The scale factor is ${to}/${from} = ${shrink ? `1/${k}` : k}.`, `${q} × ${shrink ? `1/${k}` : k} = ${ans}.`])
  } },
  { lesson: 'similarity', level: 1, make: (r) => {
    const a = ri(r, 2, 8), b = ri(r, 2, 8), k = ri(r, 2, 5)
    return numSpec(`Triangles ABC and DEF are similar. AB = ${a}, BC = ${b} and DE = ${a * k}. Find EF.`, F(b * k), 'In similar triangles the sides are in proportion: DE/AB = EF/BC.', [`The scale factor is DE/AB = ${a * k}/${a} = ${k}.`, `EF = ${b} × ${k} = ${b * k}.`])
  } },
  { lesson: 'similarity', level: 2, make: (r) => {
    const k = ri(r, 2, 5), area = ri(r, 2, 15), up = r() < 0.7
    return numSpec(up ? `Two similar shapes have a scale factor of ${k}. The smaller shape has area ${area}. What is the area of the larger shape?` : `Two similar shapes have lengths in the ratio 1 : ${k}. The larger has area ${area * k * k}. What is the area of the smaller?`, F(up ? area * k * k : area), 'When lengths are multiplied by k, areas are multiplied by k².', [up ? `Area = ${area} × ${k}² = ${area * k * k}.` : `Area of the smaller = ${area * k * k} ÷ ${k}² = ${area}.`])
  } },
  { lesson: 'similarity', level: 2, make: (r) => {
    const stick = ri(r, 2, 6), shadowS = ri(r, 2, 5), k = ri(r, 3, 12), hs = F(stick * shadowS * k, shadowS)
    void hs
    return numSpec(`A ${stick} m pole casts a ${shadowS} m shadow. At the same time a tree casts a ${shadowS * k} m shadow. How tall is the tree?`, F(stick * k), 'The sun makes the same angle, so the pole and its shadow and the tree and its shadow form similar triangles.', [`height/${shadowS * k} = ${stick}/${shadowS}.`, `height = ${stick} × ${shadowS * k} ÷ ${shadowS} = ${stick * k} m.`])
  } },
  { lesson: 'similarity', level: 2, make: (r) => {
    const k = ri(r, 2, 5), p = ri(r, 6, 40)
    return numSpec(`Two similar triangles have a scale factor of ${k}. The smaller has perimeter ${p}. What is the perimeter of the larger one?`, F(p * k), 'Perimeters are lengths, so they scale by the same factor as the sides (not squared).', [`${p} × ${k} = ${p * k}.`])
  } },
  { lesson: 'similarity', level: 3, make: (r) => {
    const k = ri(r, 2, 4), v = ri(r, 2, 10), up = r() < 0.7
    return numSpec(up ? `Two similar solids have a scale factor of ${k}. The smaller has volume ${v}. What is the volume of the larger?` : `Two similar solids have a scale factor of ${k}. The larger has volume ${v * k ** 3}. What is the volume of the smaller?`, F(up ? v * k ** 3 : v), 'Volumes scale by the cube of the scale factor: k³.', [up ? `${v} × ${k}³ = ${v * k ** 3}.` : `${v * k ** 3} ÷ ${k}³ = ${v}.`])
  } },
  { lesson: 'similarity', level: 3, make: (r) => {
    // a line parallel to the base of a triangle
    const a = ri(r, 2, 6), b = ri(r, 2, 6), base = ri(r, 3, 12)
    return numSpec(`In triangle ABC, a line DE parallel to BC meets AB at D and AC at E, with AD = ${a}, DB = ${b} and BC = ${base * (a + b)}. Find DE. Give a fraction or decimal.`, F(a * base, 1), 'Triangle ADE is similar to triangle ABC, with scale factor AD/AB.', [`AB = ${a} + ${b} = ${a + b}, so the scale factor is ${a}/${a + b}.`, `DE = ${a}/${a + b} × ${base * (a + b)} = ${a * base}.`])
  } },
  { lesson: 'similarity', level: 3, make: (r) => {
    const scale = pick(r, [2, 5, 10, 20, 25, 50]), a = ri(r, 2, 12), b = ri(r, 2, 12)
    return numSpec(`On a map with a scale of 1 : ${scale * 1000}, a field measures ${a} cm by ${b} cm. What is the real area of the field in square metres?`, F(a * b * (scale * 10) ** 2), 'Convert each length first (1 cm on the map is a certain number of metres), then multiply. Areas scale by the square of the length scale.', [`1 cm represents ${scale * 1000} cm = ${scale * 10} m, so the field is ${a * scale * 10} m by ${b * scale * 10} m.`, `Area = ${a * scale * 10} × ${b * scale * 10} = ${a * b * (scale * 10) ** 2} m².`])
  } },
]

/* ------------------------------------------------------------------ circles */

export const CIRCLE_GENS: Gen[] = [
  { lesson: 'circles-geometry', level: 1, make: (r) => {
    const d = ri(r, 2, 24), t = ri(r, 1, 2)
    return t === 1
      ? fracPiSpec(`A circle has diameter ${d}. What is its circumference? Give the answer in terms of π.`, F(d), 'Circumference = πd (or 2πr).', [`C = π × ${d} = ${d}π.`])
      : fracPiSpec(`A circle has diameter ${d}. What is its area? Give the answer in terms of π.`, F(d * d, 4), 'The radius is half the diameter, and area = πr².', [`r = ${d}/2 = ${fm(F(d, 2))}, so A = π × ${fm(F(d * d, 4))} = ${pi(F(d * d, 4))}.`])
  } },
  { lesson: 'circles-geometry', level: 1, make: (r) => {
    const rad = ri(r, 2, 12), k = ri(r, 2, 3)
    return fracPiSpec(`A circle has radius ${rad}. A second circle has radius ${k} times as big. What is the area of the second circle? Give the answer in terms of π.`, F((k * rad) ** 2), 'Area = πr². Find the new radius first.', [`The new radius is ${k * rad}, so the area is π × ${k * rad}² = ${(k * rad) ** 2}π.`])
  } },
  { lesson: 'circles-geometry', level: 2, make: (r) => {
    const rad = ri(r, 2, 12), th = pick(r, [30, 45, 60, 72, 90, 120, 135, 180, 240, 270])
    return fracPiSpec(`Find the length of an arc of a circle of radius ${rad} that subtends a central angle of ${th}°. Give the answer in terms of π.`, F(2 * rad * th, 360), 'Arc length = (θ/360) × 2πr: the fraction of the circumference.', [`(${th}/360) × 2π × ${rad} = ${pi(F(2 * rad * th, 360))}.`])
  } },
  { lesson: 'circles-geometry', level: 2, make: (r) => {
    const rad = ri(r, 2, 12), th = pick(r, [30, 45, 60, 72, 90, 120, 135, 180, 240, 270])
    return fracPiSpec(`Find the area of a sector of a circle of radius ${rad} with a central angle of ${th}°. Give the answer in terms of π.`, F(rad * rad * th, 360), 'Sector area = (θ/360) × πr².', [`(${th}/360) × π × ${rad}² = ${pi(F(rad * rad * th, 360))}.`])
  } },
  { lesson: 'circles-geometry', level: 2, make: (r) => {
    const arc = ri(r, 20, 170), central = r() < 0.5
    return numSpec(central ? `An inscribed angle in a circle subtends an arc of ${arc * 2}°. What is the size of the inscribed angle?` : `A central angle of ${arc * 2}° and an inscribed angle subtend the same arc. What is the inscribed angle?`, F(arc), 'An inscribed angle is half the central angle (or half the arc) that it subtends.', [`${arc * 2}° ÷ 2 = ${arc}°.`])
  } },
  { lesson: 'circles-geometry', level: 2, make: (r) => {
    const [a, b, c] = pick(r, TRIPLES.filter((t) => t[0] > 4))
    return numSpec(`A tangent to a circle of radius ${a} touches it at T. A point P on the tangent is ${c} from the centre O. How long is the tangent segment PT?`, F(b), 'A tangent is perpendicular to the radius at the point of contact, so OTP is a right-angled triangle with hypotenuse OP.', [`OT = ${a} (the radius), OP = ${c} (the hypotenuse), so PT² = ${c}² − ${a}² = ${c * c - a * a}.`, `PT = ${b}.`])
  } },
  { lesson: 'circles-geometry', level: 3, make: (r) => {
    const h = ri(r, -5, 5), k = ri(r, -5, 5), rad = ri(r, 2, 9)
    const sq = (v: string, c: number) => (c === 0 ? `${v}²` : `(${v} ${c > 0 ? '−' : '+'} ${Math.abs(c)})²`)
    return tupleSpec(`Find the centre of the circle ${sq('x', h)} + ${sq('y', k)} = ${rad * rad}. Give it as (h, k).`, [F(h), F(k)], 'The equation of a circle with centre (h, k) and radius r is (x − h)² + (y − k)² = r².', [`Compare with (x − h)² + (y − k)² = r²: h = ${A(h)} and k = ${A(k)}.`, `The radius is √${rad * rad} = ${rad}.`])
  } },
  { lesson: 'circles-geometry', level: 3, make: (r) => {
    const rad = ri(r, 3, 9), px = rnz(r, -6, 6), py = rnz(r, -6, 6), kind = pick(r, ['inside', 'on', 'outside'] as const)
    const d2 = kind === 'on' ? rad * rad : kind === 'inside' ? ri(r, 0, rad * rad - 1) : rad * rad + ri(r, 1, 30)
    // choose integer point when possible: use (px,py) and a circle centred at origin with adjusted radius squared
    const R2 = px * px + py * py + (kind === 'on' ? 0 : kind === 'inside' ? ri(r, 1, 20) : -ri(r, 1, Math.max(1, px * px + py * py - 1)))
    void d2
    if (R2 <= 0 || (kind === 'outside' && px * px + py * py <= 1)) return CIRCLE_GENS[7].make(r)
    const dd = px * px + py * py
    const verdict = dd < R2 ? 'inside' : dd === R2 ? 'on' : 'outside'
    return words(`The circle x² + y² = ${R2} has its centre at the origin. Is the point (${A(px)}, ${A(py)}) inside the circle, on the circle, or outside it?`, [verdict, `${verdict} the circle`], ['inside', 'on', 'outside'], 'Compare x² + y² for the point with r² = the right-hand side: smaller means inside, equal means on the circle, larger means outside.', [`${A(px)}² + ${A(py)}² = ${dd}, and r² = ${R2}.`, `${dd} is ${dd < R2 ? 'less than' : dd === R2 ? 'equal to' : 'greater than'} ${R2}, so the point is ${verdict} the circle.`])
  } },
  { lesson: 'circles-geometry', level: 3, make: (r) => {
    const [d0, half0, rad0] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]] as [number, number, number][]), kk = pick(r, [1, 1, 2, 3])
    const d = d0 * kk, half = half0 * kk, rad = rad0 * kk
    return numSpec(`A chord of a circle of radius ${rad} is ${d} units from the centre. How long is the chord?`, F(2 * half), 'The perpendicular from the centre to a chord bisects it. Use the Pythagorean theorem in the right-angled triangle formed.', [`Half the chord: √(${rad}² − ${d}²) = √${rad * rad - d * d} = ${half}.`, `The chord is 2 × ${half} = ${2 * half}.`])
  } },
]
export const D_GENS: Gen[] = [...ANGLE_GENS, ...PYTH_GENS, ...AREA_GENS, ...SIM_GENS, ...CIRCLE_GENS]
void fDiv; void fMul; void fSub; void rnz
