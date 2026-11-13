import {
  coterminal, cosExact, degToRad, evalExact, Fn, FNS, fmtDeg, fmtPi, fmtSurd, gcd, INV_RANGE, InvFn, inverseExact, invLabel,
  isRational, MINUS, norm360, piInput, quadrant, referenceAngle, sinExact, solveSpecial, SPECIAL_DEGREES, specialValues,
  surd, surdAdd, surdInput, surdMul, surdNeg, surdValue, Surd, tanExact,
} from './exact'
import { AlgSpec, checkAlgebra } from './algebra'
import { ALG_GENS } from './algebraQuestions'
import { EQ_GENS } from './equationQuestions'
import { FN_GENS } from './functionQuestions'
import { checkCalc, CalcSpec } from './calculus'
import { CALC_GENS } from './calcQuestions'
import { CX_GENS } from './cxQuestions'
import { ADV_GENS } from './advQuestions'
import { INT_GENS } from './intQuestions'
import { SEQ_GENS } from './seqQuestions'
import { TRIG2_GENS } from './trigQuestions'
import { POW_GENS } from './powerQuestions'
import { complement, IntervalSet, normalise, parseSet, SetError, setsEqual } from './solve'
import { evaluate, parseList, saysUndefined, stripLead } from './parse'
import { radicalFormProblem } from './radicals'
import { checkTrig, TrigSpec } from './trigAlgebra'
import { Cx, cEq, parseCx, splitList } from './complex'
import { mulberry, pick, Rng } from './rng'

export type Kind = 'value' | 'approx' | 'set' | 'pair' | 'alg' | 'ineq' | 'word' | 'complex'

export interface Question {
  id: string
  lesson: string
  level: number
  gen: number
  prompt: string
  kind: Kind
  /** numeric answers (null = "undefined"). One for value/approx, several for set/pair. */
  answers: (number | null)[]
  /** the correct answer as it is shown to the student */
  display: string
  /** a typed form of the correct answer that checkAnswer accepts (used by tests) */
  input: string
  /** suffix shown after the input box */
  unit: string
  /** reject decimals: the student must give an exact value */
  needsExact: boolean
  tol: number
  hint: string
  explanation: string[]
  /** alg: show the algebra keys (^ and brackets) and the algebra hint */
  pad: { pi: boolean; root: boolean; comma: boolean; alg?: boolean; extra?: string[] }
  /** present for symbolic questions (expand, factor, simplify, solve for a letter) */
  alg?: AlgSpec
  /** present for trigonometric expressions and identities */
  trig?: TrigSpec
  /** present for questions whose answer is a formula in x, such as a derivative */
  calc?: CalcSpec
  /** ineq: the solution set the student's inequality or interval must equal */
  iv?: IntervalSet
  /** complex: the complex number(s) the student must give, each in the form a + bi (any order for several) */
  cx?: Cx[]
  /** word: the accepted spellings of the answer (lower case); the first is the one shown */
  words?: string[]
  /** value answers: must also be in simplest radical form (no square factor under the root, no root in a denominator) */
  simplest?: boolean
  /** tests only: typed forms that equal the answer but must be rejected (for example sqrt(72) when 6sqrt(2) is wanted) */
  rejects?: string[]
  /** tests only: does this x satisfy the equation or inequality as written? Used to check answers independently. */
  holds?: (x: number) => boolean
}

export type Spec = Omit<Question, 'id' | 'lesson' | 'level' | 'gen'>
export interface Gen { lesson: string; level: number; make: (r: Rng) => Spec }

export const LEVELS = [
  { level: 1, name: 'Warm-up', blurb: 'One idea at a time, friendly numbers.' },
  { level: 2, name: 'Standard', blurb: 'Mixed forms and a few more steps.' },
  { level: 3, name: 'Challenge', blurb: 'Several steps, like exam questions.' },
]

/* ------------------------------------------------------------------ text helpers */

export type U = 'rad' | 'deg'
const ang = (d: number, u: U) => (u === 'rad' ? fmtPi(d) : fmtDeg(d))
const half = (u: U) => (u === 'rad' ? 'π' : '180°')
const full = (u: U) => (u === 'rad' ? '2π' : '360°')
const ROMAN = ['', 'I', 'II', 'III', 'IV']
const AXIS: Record<number, string> = { 0: 'positive x-axis', 90: 'positive y-axis', 180: 'negative x-axis', 270: 'negative y-axis' }
const fnText = (fn: Fn, d: number, u: U) => `${fn}(${u === 'rad' ? fmtPi(d) : fmtDeg(d)})`
const fv = (v: Surd | null) => (v ? fmtSurd(v) : 'undefined')
const par = (s: string) => (s.startsWith(MINUS) ? `(${s})` : s)
const FN_NAME: Record<Fn, string> = { sin: 'Sine', cos: 'Cosine', tan: 'Tangent' }
/** Brackets a fraction or negative so that a quotient reads unambiguously. */
const br = (s: string) => (/[/√]/.test(s) || s.startsWith(MINUS) ? `(${s})` : s)
const und = (fn: Fn) => (fn === 'tan' ? ' If it does not exist, type "undefined".' : '')
const absSurd = (v: Surd): Surd => ({ ...v, p: Math.abs(v.p) })
const pickUnit = (r: Rng): U => (r() < 0.6 ? 'rad' : 'deg')

const Q1 = [0, 30, 45, 60, 90]
const NONAXIS = SPECIAL_DEGREES.filter((d) => d % 90 !== 0)
const BIG = [
  ...SPECIAL_DEGREES.filter((d) => d < 360).map((d) => d - 360),
  ...SPECIAL_DEGREES.filter((d) => d > 0).map((d) => d + 360),
  ...SPECIAL_DEGREES.map((d) => d + 720),
].filter((d) => d !== 0)

/* ------------------------------------------------------------------ answer builders */

const TOL = 1e-9

function valueSpec(prompt: string, v: Surd | null, hint: string, explanation: string[]): Spec {
  return {
    prompt, kind: 'value', answers: [v ? surdValue(v) : null], display: fv(v),
    input: v ? surdInput(v) : 'undefined', unit: '', needsExact: !!v && v.r > 1, tol: TOL, hint, explanation,
    pad: { pi: false, root: true, comma: false },
  }
}

/** An answer that is a multiple of π, given as degrees (so 150 -> 5π/6, 900 -> 5π). */
function radSpec(prompt: string, deg: number, hint: string, explanation: string[], unit = ''): Spec {
  return {
    prompt, kind: 'value', answers: [degToRad(deg)], display: `${fmtPi(deg)}${unit ? ` ${unit}` : ''}`,
    input: piInput(deg), unit, needsExact: deg !== 0, tol: TOL, hint, explanation,
    pad: { pi: true, root: false, comma: false },
  }
}

function degSpec(prompt: string, deg: number, hint: string, explanation: string[]): Spec {
  return {
    prompt, kind: 'value', answers: [deg], display: fmtDeg(deg), input: String(deg), unit: '°', needsExact: false, tol: 1e-6, hint, explanation,
    pad: { pi: false, root: false, comma: false },
  }
}

function approxSpec(prompt: string, value: number, places: number, unit: string, hint: string, explanation: string[]): Spec {
  const shown = value.toFixed(places)
  return {
    prompt, kind: 'approx', answers: [value], display: `${shown}${unit === '°' ? '°' : ` ${unit}`}`, input: shown, unit,
    needsExact: false, tol: 0.5 * Math.pow(10, -places) + 1e-9, hint, explanation, pad: { pi: false, root: false, comma: false },
  }
}

function setSpec(prompt: string, degs: number[], u: U, hint: string, explanation: string[]): Spec {
  const sorted = [...degs].sort((a, b) => a - b)
  return {
    prompt, kind: 'set', answers: sorted.map((d) => (u === 'rad' ? degToRad(d) : d)),
    display: sorted.map((d) => ang(d, u)).join(', '),
    input: sorted.map((d) => (u === 'rad' ? piInput(d) : String(d))).join(', '),
    unit: '', needsExact: u === 'rad', tol: 1e-7, hint, explanation, pad: { pi: u === 'rad', root: false, comma: true },
  }
}

function pairSpec(prompt: string, x: Surd, y: Surd, hint: string, explanation: string[]): Spec {
  return {
    prompt, kind: 'pair', answers: [surdValue(x), surdValue(y)], display: `(${fmtSurd(x)}, ${fmtSurd(y)})`,
    input: `(${surdInput(x)}, ${surdInput(y)})`, unit: '', needsExact: true, tol: TOL, hint, explanation,
    pad: { pi: false, root: true, comma: true },
  }
}

/* ------------------------------------------------------------------ explanation helpers */

/** Steps that place an angle: coterminal, quadrant, reference angle. */
function locate(d: number, u: U): string[] {
  const t = norm360(d)
  const out: string[] = []
  if (t !== d) out.push(`${ang(d, u)} is coterminal with ${ang(t, u)}: add or subtract whole turns (${full(u)}) until the angle is in [0, ${full(u)}).`)
  const q = quadrant(t)
  if (q === 'axis') {
    out.push(`${ang(t, u)} lies on the ${AXIS[t]}, at the point (${fmtSurd(cosExact(t))}, ${fmtSurd(sinExact(t))}).`)
  } else {
    const how = q === 1 ? 'the angle itself' : q === 2 ? `${half(u)} ${MINUS} ${ang(t, u)}` : q === 3 ? `${ang(t, u)} ${MINUS} ${half(u)}` : `${full(u)} ${MINUS} ${ang(t, u)}`
    out.push(`${ang(t, u)} is in quadrant ${ROMAN[q]}. Its reference angle is ${how} = ${ang(referenceAngle(t), u)}.`)
  }
  return out
}

export function valueSteps(fn: Fn, d: number, u: U): string[] {
  const out = locate(d, u)
  const t = norm360(d), v = evalExact(fn, d)
  if (quadrant(t) === 'axis') {
    if (fn === 'tan') {
      out.push(v ? `tan = y / x = ${fmtSurd(sinExact(t))} / ${fmtSurd(cosExact(t))} = ${fv(v)}.` : `tan = y / x = ${fmtSurd(sinExact(t))} / 0, which is undefined because x = 0.`)
    } else out.push(`${fnText(fn, d, u)} is the ${fn === 'sin' ? 'y' : 'x'}-coordinate: ${fv(v)}.`)
  } else {
    const ref = referenceAngle(t), q = quadrant(t) as number
    const pos = v!.p > 0
    out.push(`${fnText(fn, ref, u)} = ${fv(evalExact(fn, ref))}.`)
    out.push(`${FN_NAME[fn]} is ${pos ? 'positive' : 'negative'} in quadrant ${ROMAN[q]}, so ${fnText(fn, d, u)} = ${fv(v)}.`)
  }
  return out
}

function quadsOf(sols: number[]): string {
  const qs = [...new Set(sols.map((s) => quadrant(s)).filter((q) => q !== 'axis'))] as number[]
  return qs.map((q) => ROMAN[q]).join(' and ')
}

export function solveSteps(fn: Fn, v: Surd, u: U): string[] {
  const sols = solveSpecial(fn, v)
  const list = sols.map((s) => ang(s, u)).join(', ')
  const out = [`Isolate the function: ${fn}(x) = ${fmtSurd(v)}.`]
  const open = sols.length > 0 && sols.every((s) => quadrant(s) !== 'axis')
  if (open) {
    const ref = referenceAngle(sols[0])
    out.push(`Reference angle: ${fnText(fn, ref, u)} = ${fmtSurd(absSurd(v))}, so the reference angle is ${ang(ref, u)}.`)
    out.push(`${FN_NAME[fn]} is ${v.p > 0 ? 'positive' : 'negative'} in quadrants ${quadsOf(sols)}.`)
    for (const s of sols) {
      const q = quadrant(s) as number
      const how = q === 1 ? `${ang(referenceAngle(s), u)} (the reference angle itself)` : q === 2 ? `${half(u)} ${MINUS} ${ang(referenceAngle(s), u)}` : q === 3 ? `${half(u)} + ${ang(referenceAngle(s), u)}` : `${full(u)} ${MINUS} ${ang(referenceAngle(s), u)}`
      out.push(q === 1 ? `Quadrant I: x = ${how}.` : `Quadrant ${ROMAN[q]}: ${how} = ${ang(s, u)}.`)
    }
  } else {
    out.push(`Read it straight off the unit circle: ${fn} = ${fmtSurd(v)} at ${list}.`)
    if (sols.includes(0) && sols.includes(360)) out.push(`The interval is closed, so both ends count: 0 and ${full(u)} are both solutions.`)
  }
  return out
}

/* ------------------------------------------------------------------ equation forms */

/** The left-hand side of an equation "LHS = 0" for fn(x) = v, e.g. 2cos(x) − √3. */
export function formA(fn: Fn, v: Surd): string {
  const { p, q, r } = v
  if (p === 0) return `${fn}(x)`
  return `${q === 1 ? '' : q}${fn}(x) ${p < 0 ? '+' : MINUS} ${fmtSurd(surd(Math.abs(p), 1, r))}`
}
const factor = (fn: Fn, v: Surd) => (v.p === 0 ? `${fn}(x)` : `(${formA(fn, v)})`)

function eqPrompt(eq: string, u: U): string {
  return u === 'rad'
    ? `Solve ${eq} for 0 ≤ x ≤ 2π. Give exact answers in radians, separated by commas.`
    : `Solve ${eq} for 0° ≤ x ≤ 360°. Give your answers in degrees, separated by commas.`
}

const EQ_HINT = 'Isolate the trig function, find the reference angle, then use the sign (ASTC) to pick the quadrants.'

function equationSpec(eq: string, sols: number[], u: U, steps: string[]): Spec {
  return setSpec(eqPrompt(eq, u), sols, u, EQ_HINT, steps)
}

/* ------------------------------------------------------------------ inverse helpers */

const INVS: InvFn[] = ['arcsin', 'arccos', 'arctan']
const FN_OF: Record<InvFn, Fn> = { arcsin: 'sin', arccos: 'cos', arctan: 'tan' }

function inverseSteps(inv: InvFn, v: Surd, ans: number, u: U): string[] {
  const fn = FN_OF[inv], R = INV_RANGE[inv]
  const out = [`${invLabel(inv)}(${fmtSurd(v)}) is the angle in ${u === 'rad' ? R.text : R.textDeg} whose ${fn} is ${fmtSurd(v)}.`]
  if (v.p !== 0) out.push(`Reference angle: ${fnText(fn, referenceAngle(ans), u)} = ${fmtSurd(absSurd(v))}, so the reference angle is ${ang(referenceAngle(ans), u)}.`)
  if (inv === 'arccos' && v.p < 0) out.push(`cos⁻¹ returns angles from 0 to ${half(u)}, so a negative value lands in quadrant II: ${half(u)} ${MINUS} ${ang(referenceAngle(ans), u)} = ${ang(ans, u)}.`)
  else if (inv !== 'arccos' && v.p < 0) out.push(`${invLabel(inv)} returns angles between ${u === 'rad' ? `${MINUS}π/2 and π/2` : `${MINUS}90° and 90°`}, so a negative value gives a negative angle (quadrant IV): ${ang(ans, u)}.`)
  out.push(`So ${invLabel(inv)}(${fmtSurd(v)}) = ${ang(ans, u)}.`)
  return out
}

function inverseSpec(inv: InvFn, v: Surd, ans: number, u: U): Spec {
  const name = invLabel(inv)
  const prompt = `Find the exact value of ${name}(${fmtSurd(v)}). Give your answer in ${u === 'rad' ? 'radians' : 'degrees'}.`
  const hint = `Which angle in ${u === 'rad' ? INV_RANGE[inv].text : INV_RANGE[inv].textDeg} has ${FN_OF[inv]} equal to ${fmtSurd(v)}?`
  return u === 'rad' ? radSpec(prompt, ans, hint, inverseSteps(inv, v, ans, u)) : degSpec(prompt, ans, hint, inverseSteps(inv, v, ans, u))
}

/* ------------------------------------------------------------------ the generators */

const TRIG_GENS: Gen[] = [
  /* ============================ degrees and radians ============================ */
  { lesson: 'angles', level: 1, make: (r) => {
    const d = pick(r, SPECIAL_DEGREES.filter((x) => x > 0))
    const g = gcd(d, 180)
    return radSpec(`Convert ${d}° to radians. Give an exact answer in terms of π.`, d, 'Multiply by π/180, then simplify the fraction.', [
      `Radians = degrees × π/180, so ${d}° × π/180 = ${d}π/180.`,
      g === 1 ? 'That fraction is already in lowest terms.' : `Divide top and bottom by ${g}: ${fmtPi(d)}.`,
    ])
  } },
  { lesson: 'angles', level: 1, make: (r) => {
    const d = pick(r, SPECIAL_DEGREES.filter((x) => x > 0))
    return degSpec(`Convert ${fmtPi(d)} radians to degrees.`, d, 'Multiply by 180/π. The π cancels.', [
      `Degrees = radians × 180/π, so ${fmtPi(d)} × 180/π.`,
      `The π cancels, leaving ${d}°.`,
    ])
  } },
  { lesson: 'angles', level: 1, make: (r) => {
    const [num, den, word] = pick(r, [[1, 2, 'a half'], [1, 4, 'a quarter'], [3, 4, 'three quarters'], [1, 3, 'a third'], [1, 6, 'a sixth'], [1, 12, 'a twelfth'], [2, 3, 'two thirds'], [5, 6, 'five sixths']] as [number, number, string][])
    const d = (360 * num) / den
    return radSpec(`A full turn is 2π radians. How many radians is ${word} of a full turn?`, d, 'Multiply 2π by the fraction of the turn.', [
      `${word} of a full turn is ${num}/${den} × 360° = ${d}°.`,
      `${d}° × π/180 = ${fmtPi(d)}.`,
    ])
  } },
  { lesson: 'angles', level: 2, make: (r) => {
    const d = pick(r, [10, 15, 20, 36, 40, 50, 72, 75, 80, 100, 105, 108, 120, 140, 160, 200, 240, 252, 270, 300, 315, 330])
    const g = gcd(d, 180)
    return radSpec(`Convert ${d}° to radians. Give an exact answer in terms of π.`, d, 'Multiply by π/180 and cancel the common factor.', [
      `${d}° × π/180 = ${d}π/180.`,
      g === 1 ? 'No common factor, so that is the answer.' : `The greatest common factor of ${d} and 180 is ${g}. Divide both by ${g}: ${fmtPi(d)}.`,
    ])
  } },
  { lesson: 'angles', level: 2, make: (r) => {
    const den = pick(r, [5, 9, 10, 12, 15, 18, 20])
    let n = 1 + Math.floor(r() * 2 * den)
    while (gcd(n, den) !== 1) n = 1 + Math.floor(r() * 2 * den)
    const d = (180 * n) / den
    return degSpec(`Convert ${n === 1 ? '' : n}π/${den} radians to degrees.`, d, 'Replace π with 180°.', [
      `Replace π with 180°: ${n === 1 ? '' : `${n} × `}180°/${den}.`,
      `180 ÷ ${den} = ${180 / den}, and ${n} × ${180 / den} = ${d}.`,
      `So ${n === 1 ? '' : n}π/${den} radians = ${d}°.`,
    ])
  } },
  { lesson: 'angles', level: 2, make: (r) => {
    const d = pick(r, [-30, -45, -60, -90, -120, -135, -150, -180, -270, 390, 405, 420, 450, 480, 495, 540, 570, 600, 720])
    if (r() < 0.5) {
      const g = gcd(Math.abs(d), 180)
      return radSpec(`Convert ${fmtDeg(d)} to radians. Give an exact answer in terms of π.`, d, 'The same rule works for negative angles and angles bigger than a full turn.', [
        `${fmtDeg(d)} × π/180 = ${d < 0 ? MINUS : ''}${Math.abs(d)}π/180.`,
        g === 1 ? 'Already in lowest terms.' : `Divide top and bottom by ${g}: ${fmtPi(d)}.`,
        d < 0 ? 'A negative angle means the rotation is clockwise.' : 'A result above 2π means more than one full turn.',
      ])
    }
    return degSpec(`Convert ${fmtPi(d)} radians to degrees.`, d, 'Multiply by 180/π.', [
      `${fmtPi(d)} × 180/π = ${fmtDeg(d)}.`,
      d < 0 ? 'A negative angle means the rotation is clockwise.' : 'More than 360° means more than one full turn.',
    ])
  } },
  { lesson: 'angles', level: 3, make: (r) => {
    const x = pick(r, [0.5, 0.75, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5])
    return approxSpec(`Convert ${x} radians to degrees. Round to one decimal place.`, (x * 180) / Math.PI, 1, '°', 'Multiply by 180/π using your calculator. There is no exact π answer here.', [
      `Degrees = radians × 180/π = ${x} × 180/π.`,
      `${x} × 57.2958… = ${((x * 180) / Math.PI).toFixed(1)}°.`,
    ])
  } },
  { lesson: 'angles', level: 3, make: (r) => {
    const d = pick(r, [20, 35, 50, 70, 100, 125, 200, 250, 310])
    return approxSpec(`Convert ${d}° to radians as a decimal. Round to three decimal places.`, (d * Math.PI) / 180, 3, 'rad', 'Multiply by π/180 using your calculator.', [
      `Radians = degrees × π/180 = ${d} × π/180.`,
      `${d} × 0.017453… = ${((d * Math.PI) / 180).toFixed(3)} rad.`,
    ])
  } },
  { lesson: 'angles', level: 3, make: (r) => {
    const rr = pick(r, [2, 3, 4, 5, 6, 8, 10, 12])
    const d = pick(r, [30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300])
    const inDeg = r() < 0.5
    const theta = inDeg ? `${d}°` : `${fmtPi(d)} radians`
    return radSpec(`A circle has radius ${rr} cm. What is the length of the arc cut off by an angle of ${theta}? Use s = rθ with θ in radians, and leave π in your answer.`, rr * d, 'The angle must be in radians before you use s = rθ.', [
      inDeg ? `Convert to radians: ${d}° = ${fmtPi(d)}.` : `The angle is already in radians: θ = ${fmtPi(d)}.`,
      `s = rθ = ${rr} × ${fmtPi(d)}.`,
      `s = ${fmtPi(rr * d)} cm.`,
    ], 'cm')
  } },

  /* ============================ the unit circle ============================ */
  { lesson: 'unit-circle', level: 1, make: (r) => {
    const d = pick(r, [30, 45, 60, 90]), u = pickUnit(r)
    return pairSpec(`A point starts at (1, 0) and moves counterclockwise around the unit circle through ${ang(d, u)}. What are its coordinates (x, y)?`, cosExact(d), sinExact(d), 'On the unit circle the point at angle θ is (cos θ, sin θ).', [
      'The point at angle θ has x = cos θ and y = sin θ.',
      `${fnText('cos', d, u)} = ${fv(cosExact(d))} and ${fnText('sin', d, u)} = ${fv(sinExact(d))}.`,
      `The point is (${fv(cosExact(d))}, ${fv(sinExact(d))}).`,
    ])
  } },
  { lesson: 'unit-circle', level: 2, make: (r) => {
    const d = pick(r, SPECIAL_DEGREES.filter((x) => x > 90 && x < 360)), u = pickUnit(r)
    return pairSpec(`Find the coordinates (x, y) of the point on the unit circle at angle θ = ${ang(d, u)}.`, cosExact(d), sinExact(d), 'Find the reference angle, take its (cos, sin), then fix the signs by quadrant.', [
      ...locate(d, u),
      `At the reference angle the point is (${fv(cosExact(referenceAngle(d)))}, ${fv(sinExact(referenceAngle(d)))}).`,
      `Apply the signs of quadrant ${quadrant(d) === 'axis' ? 'axis' : ROMAN[quadrant(d) as number]}: (${fv(cosExact(d))}, ${fv(sinExact(d))}).`,
    ])
  } },
  { lesson: 'unit-circle', level: 2, make: (r) => {
    const d = pick(r, NONAXIS), u = pickUnit(r)
    const ref = referenceAngle(d)
    return {
      ...(u === 'rad' ? radSpec(`What is the reference angle of ${ang(d, u)}? Give your answer in radians.`, ref, 'The reference angle is the acute angle between the terminal side and the x-axis.', locate(d, u))
        : degSpec(`What is the reference angle of ${ang(d, u)}?`, ref, 'The reference angle is the acute angle between the terminal side and the x-axis.', locate(d, u))),
    }
  } },
  { lesson: 'unit-circle', level: 2, make: (r) => {
    const d = pick(r, NONAXIS.concat([90, 270]))
    const v = tanExact(d)
    return valueSpec(`The terminal side of an angle meets the unit circle at (${fmtSurd(cosExact(d))}, ${fmtSurd(sinExact(d))}). What is tan θ for this angle? If it does not exist, type "undefined".`, v, 'tan θ = y / x. Rationalise the denominator if you have a surd.', [
      `tan θ = y / x = ${br(fmtSurd(sinExact(d)))} / ${br(fmtSurd(cosExact(d)))}.`,
      v ? `Simplifying gives ${fv(v)}.` : 'x = 0, and you cannot divide by zero, so tan θ is undefined.',
    ])
  } },
  { lesson: 'unit-circle', level: 2, make: (r) => {
    const base = pick(r, SPECIAL_DEGREES.filter((d) => d < 360))
    const k = pick(r, [-2, -1, 1, 2, 3])
    const d = base + 360 * k, u = pickUnit(r)
    const t = coterminal(d)
    return (u === 'rad'
      ? radSpec(`Find the angle in [0, 2π) that is coterminal with ${ang(d, u)}.`, t, 'Add or subtract full turns (2π) until the angle is between 0 and 2π.', [
        `${ang(d, u)} ${k < 0 ? '+' : MINUS} ${Math.abs(k)} full turn${Math.abs(k) > 1 ? 's' : ''} (${Math.abs(k)} × 2π = ${fmtPi(360 * Math.abs(k))}).`,
        `${ang(d, u)} ${k < 0 ? '+' : MINUS} ${fmtPi(360 * Math.abs(k))} = ${ang(t, u)}.`,
      ])
      : degSpec(`Find the angle in [0°, 360°) that is coterminal with ${ang(d, u)}.`, t, 'Add or subtract multiples of 360° until the angle is between 0° and 360°.', [
        `${ang(d, u)} ${k < 0 ? '+' : MINUS} ${Math.abs(k) * 360}° = ${ang(t, u)}.`,
      ]))
  } },
  { lesson: 'unit-circle', level: 3, make: (r) => {
    const d = pick(r, SPECIAL_DEGREES.filter((x) => x < 360 && x > 0))
    const x = cosExact(d), y = sinExact(d)
    return radSpec(`A point on the unit circle has coordinates (${fmtSurd(x)}, ${fmtSurd(y)}). Find the angle θ with 0 ≤ θ < 2π that gives this point. Answer in radians.`, d, 'Use the absolute values to find the reference angle, then the signs of x and y to find the quadrant.', [
      `Ignore the signs: cos θ = ${fmtSurd(absSurd(x))} and sin θ = ${fmtSurd(absSurd(y))} give a reference angle of ${fmtPi(referenceAngle(d))}.`,
      `x is ${x.p > 0 ? 'positive' : x.p < 0 ? 'negative' : 'zero'} and y is ${y.p > 0 ? 'positive' : y.p < 0 ? 'negative' : 'zero'}, so the point is ${quadrant(d) === 'axis' ? `on the ${AXIS[d]}` : `in quadrant ${ROMAN[quadrant(d) as number]}`}.`,
      `That gives θ = ${fmtPi(d)}.`,
    ])
  } },
  { lesson: 'unit-circle', level: 3, make: (r) => {
    const fn = pick(r, FNS), u = pickUnit(r)
    const cands = NONAXIS.filter((d) => d > 0 && d < 360)
    const d = pick(r, cands)
    const other = fn === 'sin' ? norm360(180 - d) : fn === 'cos' ? norm360(360 - d) : norm360(d + 180)
    return (u === 'rad'
      ? radSpec(`Find the other angle in [0, 2π) with the same ${fn} as ${ang(d, u)}. Give your answer in radians.`, other, fn === 'tan' ? 'Tangent repeats every half turn.' : fn === 'sin' ? 'Sine is the y-coordinate: look for the mirror image across the y-axis.' : 'Cosine is the x-coordinate: look for the mirror image across the x-axis.', [
        ...locate(d, u),
        fn === 'sin' ? `Same height means a mirror image across the y-axis: ${half(u)} ${MINUS} ${ang(d, u)}${d > 180 ? ` (then add ${full(u)})` : ''} = ${ang(other, u)}.`
          : fn === 'cos' ? `Same x-coordinate means a mirror image across the x-axis: ${full(u)} ${MINUS} ${ang(d, u)} = ${ang(other, u)}.`
            : `Tangent has period ${half(u)}, so the other angle is ${ang(d, u)} ${d < 180 ? '+' : MINUS} ${half(u)} = ${ang(other, u)}.`,
      ])
      : degSpec(`Find the other angle in [0°, 360°) with the same ${fn} as ${ang(d, u)}.`, other, fn === 'tan' ? 'Tangent repeats every 180°.' : fn === 'sin' ? 'Sine is the y-coordinate: look for the mirror image across the y-axis.' : 'Cosine is the x-coordinate: look for the mirror image across the x-axis.', [
        ...locate(d, u),
        fn === 'sin' ? `Mirror across the y-axis: 180° ${MINUS} ${d}° = ${norm360(180 - d)}°${d > 180 ? ' (after adding 360°)' : ''}.`
          : fn === 'cos' ? `Mirror across the x-axis: 360° ${MINUS} ${d}° = ${other}°.`
            : `Tangent has period 180°: ${d}° ${d < 180 ? '+' : MINUS} 180° = ${other}°.`,
      ]))
  } },

  /* ============================ exact values ============================ */
  { lesson: 'exact-values', level: 1, make: (r) => {
    const fn = pick(r, FNS), d = pick(r, Q1), u = pickUnit(r)
    return valueSpec(`Find the exact value of ${fnText(fn, d, u)}.${und(fn)}`, evalExact(fn, d), 'Recall the special-angle table, or read the coordinates off the unit circle.', valueSteps(fn, d, u))
  } },
  { lesson: 'exact-values', level: 2, make: (r) => {
    const fn = pick(r, FNS), d = pick(r, SPECIAL_DEGREES.filter((x) => x > 90)), u = pickUnit(r)
    return valueSpec(`Find the exact value of ${fnText(fn, d, u)}.${und(fn)}`, evalExact(fn, d), 'Reference angle first, then the sign from the quadrant (All, Sin, Tan, Cos).', valueSteps(fn, d, u))
  } },
  { lesson: 'exact-values', level: 2, make: (r) => {
    const d = pick(r, NONAXIS)
    const s = sinExact(d), c = cosExact(d), t = tanExact(d)!
    return valueSpec(`For an angle θ, sin θ = ${fmtSurd(s)} and cos θ = ${fmtSurd(c)}. Find tan θ exactly.`, t, 'tan θ = sin θ / cos θ. Rationalise the denominator.', [
      `tan θ = sin θ / cos θ = ${br(fmtSurd(s))} / ${br(fmtSurd(c))}.`,
      `Dividing and rationalising gives ${fmtSurd(t)}.`,
      `Check: this is tan of the reference angle ${fmtPi(referenceAngle(d))}, with the sign from quadrant ${ROMAN[quadrant(d) as number]}.`,
    ])
  } },
  { lesson: 'exact-values', level: 3, make: (r) => {
    const fn = pick(r, FNS), d = pick(r, BIG), u = pickUnit(r)
    return valueSpec(`Find the exact value of ${fnText(fn, d, u)}.${und(fn)}`, evalExact(fn, d), 'First find the coterminal angle in [0, 2π).', valueSteps(fn, d, u))
  } },
  { lesson: 'exact-values', level: 3, make: (r) => {
    for (let tries = 0; tries < 300; tries++) {
      const a = pick(r, SPECIAL_DEGREES), b = pick(r, SPECIAL_DEGREES), f1 = pick(r, FNS), f2 = pick(r, FNS), u = pickUnit(r)
      const kind = pick(r, ['prod', 'sum', 'diff', 'sq'] as const)
      let res: Surd | null
      let text: string
      let steps: string[]
      if (kind === 'sq') {
        const g1: Fn = pick(r, ['sin', 'cos'] as Fn[]), g2: Fn = g1 === 'sin' ? 'cos' : 'sin'
        const w1 = evalExact(g1, a)!, w2 = evalExact(g2, a)!
        const s1 = surdMul(w1, w1), s2 = surdMul(w2, w2)
        res = surdAdd(s1, surdNeg(s2))
        text = `${g1}²(${ang(a, u)}) ${MINUS} ${g2}²(${ang(a, u)})`
        steps = [
          `${fnText(g1, a, u)} = ${fmtSurd(w1)}, so ${g1}²(${ang(a, u)}) = ${fmtSurd(s1)}.`,
          `${fnText(g2, a, u)} = ${fmtSurd(w2)}, so ${g2}²(${ang(a, u)}) = ${fmtSurd(s2)}.`,
          `Subtract: ${fmtSurd(s1)} ${MINUS} ${par(fmtSurd(s2))} = ${res ? fmtSurd(res) : ''}.`,
        ]
      } else {
        const v1 = evalExact(f1, a), v2 = evalExact(f2, b)
        if (!v1 || !v2) continue
        const sign = kind === 'diff' ? MINUS : '+'
        res = kind === 'prod' ? surdMul(v1, v2) : surdAdd(v1, kind === 'diff' ? surdNeg(v2) : v2)
        text = `${fnText(f1, a, u)} ${kind === 'prod' ? '·' : sign} ${fnText(f2, b, u)}`
        steps = [
          `${fnText(f1, a, u)} = ${fmtSurd(v1)}.`,
          `${fnText(f2, b, u)} = ${fmtSurd(v2)}.`,
          `${kind === 'prod' ? 'Multiply' : kind === 'sum' ? 'Add' : 'Subtract'}: ${fmtSurd(v1)} ${kind === 'prod' ? '×' : sign} ${par(fmtSurd(v2))} = ${res ? fmtSurd(res) : ''}.`,
        ]
      }
      if (!res || res.p === 0) continue
      return valueSpec(`Find the exact value of ${text}.`, res, 'Find each exact value first, then do the arithmetic.', steps)
    }
    return valueSpec('Find the exact value of sin(π/6) + cos(π/3).', surd(1), 'Both are 1/2.', ['sin(π/6) = 1/2 and cos(π/3) = 1/2.', 'Add: 1/2 + 1/2 = 1.'])
  } },

  /* ============================ trigonometric equations ============================ */
  { lesson: 'trig-equations', level: 1, make: (r) => {
    const fn = pick(r, ['sin', 'cos'] as Fn[])
    const v = pick(r, specialValues(fn).filter((x) => x.p !== 0 && Math.abs(surdValue(x)) < 1))
    const sols = solveSpecial(fn, v)
    return equationSpec(`${formA(fn, v)} = 0`, sols, 'rad', [`Add or subtract to move the constant across, then divide by the coefficient of ${fn}(x).`, ...solveSteps(fn, v, 'rad')])
  } },
  { lesson: 'trig-equations', level: 2, make: (r) => {
    const fn = pick(r, ['sin', 'cos', 'tan', 'tan'] as Fn[])
    const v = pick(r, specialValues(fn))
    const u: U = r() < 0.7 ? 'rad' : 'deg'
    const sols = solveSpecial(fn, v)
    let eq = `${formA(fn, v)} = 0`
    let first = `Move the constant across and divide by the coefficient of ${fn}(x).`
    if (isRational(v) && r() < 0.5) {
      const s = 1 + Math.floor(r() * 5)
      const plus = r() < 0.5
      const head = `${v.q === 1 ? '' : v.q}${fn}(x)`
      eq = plus ? `${head} + ${s} = ${fmtSurd(surd(s + v.p))}` : `${head} ${MINUS} ${s} = ${fmtSurd(surd(v.p - s))}`
      first = `${plus ? 'Subtract' : 'Add'} ${s} ${plus ? 'from' : 'to'} both sides${v.q === 1 ? '' : `, then divide by ${v.q}`}.`
    }
    return equationSpec(eq, sols, u, [first, ...solveSteps(fn, v, u)])
  } },
  { lesson: 'trig-equations', level: 3, make: (r) => {
    const fn = pick(r, FNS)
    const v = pick(r, specialValues(fn).filter((x) => x.r > 1))
    const u: U = r() < 0.7 ? 'rad' : 'deg'
    const c = surd(v.r * v.p, v.q)
    const sols = solveSpecial(fn, v)
    return equationSpec(`√${v.r} ${fn}(x) = ${fmtSurd(c)}`, sols, u, [
      `Divide both sides by √${v.r}: ${fn}(x) = (${fmtSurd(c)}) / √${v.r}.`,
      `Rationalise the denominator (multiply top and bottom by √${v.r}): ${fn}(x) = ${fmtSurd(v)}.`,
      ...solveSteps(fn, v, u),
    ])
  } },
  { lesson: 'trig-equations', level: 3, make: (r) => {
    const fn = pick(r, FNS)
    const v = pick(r, specialValues(fn).filter((x) => x.p > 0))
    const u: U = r() < 0.7 ? 'rad' : 'deg'
    const sq = surdMul(v, v)
    const sols = [...new Set([...solveSpecial(fn, v), ...solveSpecial(fn, surdNeg(v))])].sort((a, b) => a - b)
    const eq = `${sq.q === 1 ? '' : sq.q}${fn}²(x) ${MINUS} ${sq.p} = 0`
    return equationSpec(eq, sols, u, [
      `Rearrange: ${fn}²(x) = ${fmtSurd(sq)}.`,
      `Take the square root, keeping both signs: ${fn}(x) = ${fmtSurd(v)} or ${fn}(x) = ${fmtSurd(surdNeg(v))}.`,
      `For ${fn}(x) = ${fmtSurd(v)}: ${solveSpecial(fn, v).map((s) => ang(s, u)).join(', ') || 'no solutions'}.`,
      `For ${fn}(x) = ${fmtSurd(surdNeg(v))}: ${solveSpecial(fn, surdNeg(v)).map((s) => ang(s, u)).join(', ') || 'no solutions'}.`,
      `Together: x = ${sols.map((s) => ang(s, u)).join(', ')}.`,
    ])
  } },
  { lesson: 'trig-equations', level: 3, make: (r) => {
    for (let tries = 0; tries < 100; tries++) {
      const f1 = pick(r, FNS), f2 = pick(r, FNS)
      const v1 = pick(r, specialValues(f1)), v2 = pick(r, specialValues(f2))
      if (f1 === f2 && (v1.p === v2.p && v1.q === v2.q && v1.r === v2.r)) continue
      const s1 = solveSpecial(f1, v1), s2 = solveSpecial(f2, v2)
      const sols = [...new Set([...s1, ...s2])].sort((a, b) => a - b)
      if (sols.length < 2 || sols.length > 6) continue
      const u: U = r() < 0.8 ? 'rad' : 'deg'
      const list = (xs: number[]) => xs.map((s) => ang(s, u)).join(', ')
      return equationSpec(`${factor(f1, v1)}${factor(f2, v2)} = 0`, sols, u, [
        'A product is zero when one of its factors is zero, so solve each factor separately.',
        `${formA(f1, v1)} = 0 gives ${f1}(x) = ${fmtSurd(v1)}, so x = ${list(s1)}.`,
        `${formA(f2, v2)} = 0 gives ${f2}(x) = ${fmtSurd(v2)}, so x = ${list(s2)}.`,
        `Combine all the solutions in the interval: x = ${list(sols)}.`,
      ])
    }
    return equationSpec('(2sin(x) − 1)(2cos(x) − √3) = 0', [30, 150, 330], 'rad', ['Solve each factor.'])
  } },

  /* ============================ inverse trig ============================ */
  { lesson: 'inverse-trig', level: 1, make: (r) => {
    const inv = pick(r, INVS)
    const vals = specialValues(FN_OF[inv]).filter((v) => v.p >= 0)
    const v = pick(r, vals)
    const ans = inverseExact(inv, v)!
    return inverseSpec(inv, v, ans, pickUnit(r))
  } },
  { lesson: 'inverse-trig', level: 2, make: (r) => {
    const inv = pick(r, INVS)
    const v = pick(r, specialValues(FN_OF[inv]).filter((x) => x.p < 0))
    const ans = inverseExact(inv, v)!
    return inverseSpec(inv, v, ans, pickUnit(r))
  } },
  { lesson: 'inverse-trig', level: 3, make: (r) => {
    const inv = pick(r, INVS)
    const fn = FN_OF[inv]
    for (let tries = 0; tries < 200; tries++) {
      const d = pick(r, SPECIAL_DEGREES.filter((x) => x % 90 !== 0 || fn !== 'tan'))
      const R = INV_RANGE[inv]
      if (d >= R.lo && d <= R.hi) continue // inside the range: too easy
      const v = evalExact(fn, d)
      if (!v) continue
      const ans = inverseExact(inv, v)!
      return radSpec(`Find the exact value of ${invLabel(inv)}(${fnText(fn, d, 'rad')}). Give your answer in radians.`, ans, `${invLabel(inv)} always returns an angle in ${R.text}, whatever angle you started with.`, [
        `Evaluate the inside first: ${fnText(fn, d, 'rad')} = ${fmtSurd(v)}.`,
        `Now find ${invLabel(inv)}(${fmtSurd(v)}): the angle in ${R.text} whose ${fn} is ${fmtSurd(v)} is ${fmtPi(ans)}.`,
        `Note that ${fmtPi(d)} is outside ${R.text}, so ${invLabel(inv)} cannot return it: ${invLabel(inv)}(${fnText(fn, d, 'rad')}) = ${fmtPi(ans)}.`,
      ])
    }
    return radSpec('Find the exact value of sin⁻¹(sin(5π/6)).', 30, 'sin⁻¹ returns angles in [−π/2, π/2].', ['sin(5π/6) = 1/2.', 'sin⁻¹(1/2) = π/6.'])
  } },
  { lesson: 'inverse-trig', level: 3, make: (r) => {
    for (let tries = 0; tries < 200; tries++) {
      const inv = pick(r, INVS), outer = pick(r, FNS)
      const v = pick(r, specialValues(FN_OF[inv]))
      if (FN_OF[inv] === outer) continue // f(arcf(v)) = v is too easy
      const a = inverseExact(inv, v)!
      const res = evalExact(outer, a)
      if (!res || res.p === 0) continue
      return valueSpec(`Find the exact value of ${outer}(${invLabel(inv)}(${fmtSurd(v)})).`, res, `Find the angle ${invLabel(inv)}(${fmtSurd(v)}) first, then take the ${outer} of it.`, [
        `First, ${invLabel(inv)}(${fmtSurd(v)}) = ${fmtPi(a)} (the angle in ${INV_RANGE[inv].text} whose ${FN_OF[inv]} is ${fmtSurd(v)}).`,
        `Then ${outer}(${fmtPi(a)}) = ${fmtSurd(res)}.`,
      ])
    }
    return valueSpec('Find the exact value of sin(cos⁻¹(1/2)).', surd(1, 2, 3), 'cos⁻¹(1/2) = π/3.', ['cos⁻¹(1/2) = π/3.', 'sin(π/3) = √3/2.'])
  } },
]

const GENS: Gen[] = [...TRIG_GENS, ...ALG_GENS, ...EQ_GENS, ...POW_GENS, ...FN_GENS, ...TRIG2_GENS, ...SEQ_GENS, ...CX_GENS, ...CALC_GENS, ...INT_GENS, ...ADV_GENS]

/* ------------------------------------------------------------------ public API */

export const GENERATORS = GENS
export const generatorsForLesson = (lesson: string) => GENS.map((g, i) => ({ g, i })).filter((x) => x.g.lesson === lesson).map((x) => x.i)

export function generateQuestion(lessonIds: string[] | 'all', level: number, seed = Math.floor(Math.random() * 1e9), used?: Set<number>): Question {
  const r = mulberry(seed)
  const inScope = GENS.map((g, i) => ({ g, i })).filter((x) => lessonIds === 'all' || lessonIds.includes(x.g.lesson))
  let pool = inScope.filter((x) => x.g.level === level && !used?.has(x.i))
  if (!pool.length) pool = inScope.filter((x) => x.g.level === level)
  if (!pool.length) {
    const nearest = Math.min(...inScope.map((x) => Math.abs(x.g.level - level)))
    pool = inScope.filter((x) => Math.abs(x.g.level - level) === nearest)
  }
  const { g, i } = pick(r, pool)
  const spec = g.make(r)
  return { ...spec, id: `${i}-${seed}`, lesson: g.lesson, level: g.level, gen: i }
}

/* ------------------------------------------------------------------ checking answers */

export interface Check { ok: boolean; invalid?: boolean; note?: string }
const NOTE_EXACT = 'Give an exact answer, not a decimal (for example √3/2 or 5π/6).'
const NOTE_FORMAT = 'Could not read that. Try forms like √3/2, sqrt(3)/2, −1/2 or 5π/6 (you can type "pi").'
const NOTE_FORMAT_ALG = 'Could not read that. Type whole numbers or fractions such as −3 or 1/2, and separate several answers with commas.'
const NONE = /^(no\s+(real\s+)?solutions?|none|∅|empty|dne|no\s+roots?)$/i
const hasDecimal = (s: string) => /\d\.|\.\d/.test(s)

export function checkAnswer(q: Question, text: string): Check {
  const raw = text.trim()
  if (!raw) return { ok: false, invalid: true, note: 'Type an answer first.' }
  if (q.trig) return checkTrig(q.trig, raw)
  if (q.calc) return checkCalc(q.calc, raw)
  if (q.alg) return checkAlgebra(q.alg, raw)
  if (q.kind === 'ineq') return checkSet(q, raw)
  if (q.kind === 'word') return checkWord(q, raw)
  if (q.kind === 'complex') return checkComplex(q, raw)
  const NF = q.pad.alg ? NOTE_FORMAT_ALG : NOTE_FORMAT
  const NE = q.pad.alg ? 'Give an exact fraction such as 1/3, not a decimal.' : NOTE_EXACT

  if (q.kind === 'value' || q.kind === 'approx') {
    const want = q.answers[0]
    const said = saysUndefined(stripLead(raw))
    if (want === null) return said ? { ok: true } : { ok: false, note: q.pad.alg ? 'This has no finite value. If the quantity grows without bound or never settles, type diverges (or none for an asymptote).' : 'Check the coordinates: tan θ = y / x, and one of them is zero here.' }
    if (said) return { ok: false }
    if (q.needsExact && hasDecimal(raw)) return { ok: false, invalid: true, note: NE }
    let g: number
    try { g = evaluate(stripLead(raw)) } catch { return { ok: false, invalid: true, note: NF } }
    const ok = Math.abs(g - want) <= q.tol
    if (ok && q.simplest) { const problem = radicalFormProblem(raw); if (problem) return { ok: false, note: problem } }
    return { ok }
  }

  const none = NONE.test(stripLead(raw).trim())
  if (q.kind === 'set' && q.answers.length === 0) return none ? { ok: true } : { ok: false, note: 'Check each candidate in the original equation: does it make a denominator zero?' }
  if (none) return { ok: false, note: q.pad.alg ? 'There is at least one solution. Check your working.' : undefined }
  let gs: number[]
  try { gs = parseList(expandPlusMinus(raw)) } catch { return { ok: false, invalid: true, note: NF } }
  if (q.needsExact && hasDecimal(raw)) return { ok: false, invalid: true, note: NE }
  const want = q.answers as number[]
  if (q.kind === 'pair') {
    if (gs.length !== want.length) return { ok: false, invalid: true, note: want.length === 2 ? 'Give both coordinates, like (1/2, √3/2).' : `Give all ${want.length} values, like (1, 2, 3).` }
    return { ok: gs.every((g, i) => Math.abs(g - want[i]) <= q.tol) }
  }
  const sorted = [...gs].sort((a, b) => a - b)
  const dedup = sorted.filter((g, i) => i === 0 || Math.abs(g - sorted[i - 1]) > 1e-9)
  if (dedup.length < want.length && dedup.every((g) => want.some((w) => Math.abs(g - w) <= q.tol))) return { ok: false, note: q.pad.alg ? 'Those are all correct, but there are more solutions. Did you find every factor that can be zero?' : 'Those are all correct, but there are more solutions in the interval. Check every quadrant, and the endpoints.' }
  if (dedup.length > want.length) return { ok: false, note: q.pad.alg ? 'Too many: substitute each one back into the original equation. Does it really work?' : 'Too many: check that each angle is a real solution and lies inside the interval.' }
  return { ok: dedup.length === want.length && dedup.every((g, i) => Math.abs(g - want[i]) <= q.tol) }
}

/** "(−3 ± √5)/2" stands for two answers; so does "2 ± sqrt(3)". Expand each such part into its + and − versions. */
export function expandPlusMinus(raw: string): string {
  return raw.replace(/\+\/-/g, '±').split(/[,;]/).flatMap((part) => (part.includes('±') ? [part.replace('±', '+'), part.replace('±', '-')] : [part])).join(',')
}

/** Inequality and interval answers: compare the sets, and say what is wrong when the endpoints are right. */
function checkSet(q: Question, raw: string): Check {
  let got: IntervalSet
  try { got = parseSet(raw) } catch (e) {
    return { ok: false, invalid: true, note: e instanceof SetError ? e.message : 'Could not read that. Write an inequality like x > 3, or an interval like (3, ∞).' }
  }
  if (q.needsExact && hasDecimal(raw)) return { ok: false, invalid: true, note: 'Give exact endpoints (fractions or roots), not decimals.' }
  const want = q.iv ?? []
  if (setsEqual(got, want)) return { ok: true }
  const ends = (s: IntervalSet) => normalise(s).flatMap((i) => [i.lo, i.hi]).filter(isFinite)
  const a = ends(got), b = ends(want)
  const sameEnds = a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-7)
  if (setsEqual(got, complement(want))) return { ok: false, note: 'That is the opposite region. Test a number from each region in the original inequality.' }
  if (sameEnds) return { ok: false, note: 'Right boundary values. Now check each end: it is included (≤, ≥, square bracket) only when the boundary itself satisfies the inequality, and never when it makes a denominator zero.' }
  return { ok: false }
}

const plain = (t: string) => t.toLowerCase().replace(/[^a-z0-9+\- ]/g, ' ').replace(/\s+/g, ' ').trim()

/** A one-word (or short phrase) answer such as even / odd / neither. */
function checkWord(q: Question, raw: string): Check {
  const given = plain(raw)
  const ok = (q.words ?? []).some((w) => plain(w) === given)
  if (ok) return { ok: true }
  const options = q.pad.extra?.length ? ` Choose one of: ${q.pad.extra.join(', ')}.` : ''
  return { ok: false, note: options.trim() || undefined }
}

/** One or several complex numbers, each written a + bi; several are compared as a set. */
function checkComplex(q: Question, raw: string): Check {
  const want = q.cx ?? []
  const parts = splitList(raw)
  const got: Cx[] = []
  for (const p of parts) {
    try {
      const r = parseCx(p)
      if (!r.simple) return { ok: false, invalid: true, note: 'Write each answer in the form a + bi: multiply out brackets, replace i² by −1, and remove i from any denominator (multiply top and bottom by the conjugate).' }
      got.push(r.z)
    } catch (e) {
      return { ok: false, invalid: true, note: e instanceof Error && e.message ? `Could not read that as a complex number. Type it like 3 + 4i, 2 − i, i/2 or −5. (${e.message})` : 'Could not read that as a complex number.' }
    }
  }
  if (got.length !== want.length) return { ok: false, note: want.length > 1 ? `There are ${want.length} answers: give them all, separated by commas.` : undefined }
  const used = new Set<number>()
  for (const g of got) {
    const i = want.findIndex((w, j) => !used.has(j) && cEq(w, g))
    if (i < 0) return { ok: false }
    used.add(i)
  }
  return { ok: true }
}
