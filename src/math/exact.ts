/**
 * Exact trigonometry for the "special" angles (multiples of 30° and 45°).
 * Values are kept as surds, (p/q)·√r, so nothing is ever a rounded decimal until display.
 */

export const MINUS = '−'

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))

/** (p/q)·√r with q > 0 and r square-free (r = 1 means rational). */
export interface Surd { p: number; q: number; r: number }

export const surd = (p: number, q = 1, r = 1): Surd => normSurd({ p, q, r })

function normSurd(s: Surd): Surd {
  let { p, q, r } = s
  if (p === 0) return { p: 0, q: 1, r: 1 }
  // pull square factors out of the root
  for (let k = 2; k * k <= r; k++) while (r % (k * k) === 0) { r /= k * k; p *= k }
  if (q < 0) { q = -q; p = -p }
  const g = gcd(p, q)
  return { p: p / g, q: q / g, r }
}

export const surdValue = (s: Surd) => (s.p / s.q) * Math.sqrt(s.r)
export const isRational = (s: Surd) => s.r === 1
export const surdEq = (a: Surd, b: Surd) => a.p === b.p && a.q === b.q && a.r === b.r
export const surdNeg = (a: Surd): Surd => ({ ...a, p: a.p === 0 ? 0 : -a.p })

export function surdMul(a: Surd, b: Surd): Surd {
  return normSurd({ p: a.p * b.p, q: a.q * b.q, r: a.r * b.r })
}

/** Sum, or null when the roots differ (the result would not be a single surd). */
export function surdAdd(a: Surd, b: Surd): Surd | null {
  if (a.p === 0) return b
  if (b.p === 0) return a
  if (a.r !== b.r) return null
  return normSurd({ p: a.p * b.q + b.p * a.q, q: a.q * b.q, r: a.r })
}

/** "√3/2", "−1/2", "2√2", "0". */
export function fmtSurd(s: Surd): string {
  if (s.p === 0) return '0'
  const sign = s.p < 0 ? MINUS : ''
  const ap = Math.abs(s.p)
  if (s.r === 1) return `${sign}${ap}${s.q === 1 ? '' : `/${s.q}`}`
  const root = `${ap === 1 ? '' : ap}√${s.r}`
  return `${sign}${root}${s.q === 1 ? '' : `/${s.q}`}`
}

/** A form that the answer parser reads back (ASCII minus and sqrt()). */
export function surdInput(s: Surd): string {
  return fmtSurd(s).replace(MINUS, '-').replace(/√(\d+)/, 'sqrt($1)').replace(/(\d)sqrt/, '$1*sqrt')
}

/* ------------------------------------------------------------------ angles */

export const norm360 = (d: number) => ((d % 360) + 360) % 360
export const degToRad = (d: number) => (d * Math.PI) / 180
export const radToDeg = (r: number) => (r * 180) / Math.PI

/** Degrees as a reduced multiple of π: 150 -> {n: 5, d: 6}. d > 0. */
export function piFraction(deg: number): { n: number; d: number } {
  const g = gcd(Math.round(deg), 180) || 180
  return { n: Math.round(deg) / g, d: 180 / g }
}

/** "5π/6", "π", "−π/4", "0", "2π". */
export function fmtPi(deg: number): string {
  const { n, d } = piFraction(deg)
  if (n === 0) return '0'
  const sign = n < 0 ? MINUS : ''
  const an = Math.abs(n)
  return `${sign}${an === 1 ? '' : an}π${d === 1 ? '' : `/${d}`}`
}

/** The same, in a form the answer parser reads back. */
export const piInput = (deg: number) => fmtPi(deg).replace(MINUS, '-').replace('π', 'pi')

export const fmtDeg = (d: number) => `${d < 0 ? MINUS : ''}${Math.abs(d)}°`

/** Is this angle (degrees) a multiple of 30° or 45°? */
export const isSpecial = (deg: number) => Number.isInteger(deg) && (norm360(deg) % 30 === 0 || norm360(deg) % 45 === 0)

export function quadrant(deg: number): 1 | 2 | 3 | 4 | 'axis' {
  const t = norm360(deg)
  if (t % 90 === 0) return 'axis'
  return t < 90 ? 1 : t < 180 ? 2 : t < 270 ? 3 : 4
}

/** Reference angle in degrees (acute, or 90 on the vertical axis). */
export function referenceAngle(deg: number): number {
  const t = norm360(deg)
  if (t <= 90) return t
  if (t <= 180) return 180 - t
  if (t <= 270) return t - 180
  return 360 - t
}

/* ------------------------------------------------------------ exact values */

const S0 = surd(0), S1 = surd(1), HALF = surd(1, 2), R2 = surd(1, 2, 2), R3 = surd(1, 2, 3)
const SIN_REF: Record<number, Surd> = { 0: S0, 30: HALF, 45: R2, 60: R3, 90: S1 }
const COS_REF: Record<number, Surd> = { 0: S1, 30: R3, 45: R2, 60: HALF, 90: S0 }
const TAN_REF: Record<number, Surd | null> = { 0: S0, 30: surd(1, 3, 3), 45: S1, 60: surd(1, 1, 3), 90: null }

const refOk = (ref: number) => ref in SIN_REF

/** Exact sin of a special angle (degrees). Throws for non-special angles. */
export function sinExact(deg: number): Surd {
  const t = norm360(deg), ref = referenceAngle(t)
  if (!refOk(ref)) throw new Error(`not a special angle: ${deg}`)
  return t > 180 ? surdNeg(SIN_REF[ref]) : SIN_REF[ref]
}

export function cosExact(deg: number): Surd {
  const t = norm360(deg), ref = referenceAngle(t)
  if (!refOk(ref)) throw new Error(`not a special angle: ${deg}`)
  return t > 90 && t < 270 ? surdNeg(COS_REF[ref]) : COS_REF[ref]
}

/** Exact tan, or null where it is undefined (90°, 270°). */
export function tanExact(deg: number): Surd | null {
  const t = norm360(deg), ref = referenceAngle(t)
  if (!refOk(ref)) throw new Error(`not a special angle: ${deg}`)
  if (t % 180 === 90) return null
  const v = TAN_REF[ref]!
  return (t > 90 && t < 270) !== (t > 180) ? surdNeg(v) : v
}

export type Fn = 'sin' | 'cos' | 'tan'
export const FNS: Fn[] = ['sin', 'cos', 'tan']

export function evalExact(fn: Fn, deg: number): Surd | null {
  return fn === 'sin' ? sinExact(deg) : fn === 'cos' ? cosExact(deg) : tanExact(deg)
}

export function evalNumeric(fn: Fn, deg: number): number {
  const r = degToRad(deg)
  return fn === 'sin' ? Math.sin(r) : fn === 'cos' ? Math.cos(r) : Math.tan(r)
}

/** Every special angle in [0°, 360°] (multiples of 30° and 45°), sorted. */
export const SPECIAL_DEGREES: number[] = Array.from({ length: 25 }, (_, i) => i * 15).filter((d) => d % 30 === 0 || d % 45 === 0)

/** The values a function takes at special angles, each listed once, in a friendly order. */
export function specialValues(fn: Fn): Surd[] {
  const out: Surd[] = []
  for (const d of SPECIAL_DEGREES) {
    const v = evalExact(fn, d)
    if (v && !out.some((o) => surdEq(o, v))) out.push(v)
  }
  return out.sort((a, b) => surdValue(a) - surdValue(b))
}

/** Solutions of fn(x) = v for x in [lo°, hi°] among special angles (inclusive), sorted. */
export function solveSpecial(fn: Fn, v: Surd, lo = 0, hi = 360): number[] {
  return SPECIAL_DEGREES.filter((d) => {
    if (d < lo || d > hi) return false
    const e = evalExact(fn, d)
    return !!e && surdEq(e, v)
  })
}

/* --------------------------------------------------------- inverse (principal values) */

export type InvFn = 'arcsin' | 'arccos' | 'arctan'
/** How an inverse function is written on screen: sin⁻¹, cos⁻¹, tan⁻¹. */
export const invLabel = (inv: InvFn): string => `${inv.slice(3)}⁻¹`
export const INV_RANGE: Record<InvFn, { lo: number; hi: number; open: boolean; text: string; textDeg: string; fn: Fn }> = {
  arcsin: { lo: -90, hi: 90, open: false, text: `[${MINUS}π/2, π/2]`, textDeg: `[${MINUS}90°, 90°]`, fn: 'sin' },
  arccos: { lo: 0, hi: 180, open: false, text: '[0, π]', textDeg: '[0°, 180°]', fn: 'cos' },
  arctan: { lo: -90, hi: 90, open: true, text: `(${MINUS}π/2, π/2)`, textDeg: `(${MINUS}90°, 90°)`, fn: 'tan' },
}

/** Principal value in degrees, or null if v is not a value of the function at a special angle in range. */
export function inverseExact(inv: InvFn, v: Surd): number | null {
  const { lo, hi, open, fn } = INV_RANGE[inv]
  for (let d = lo; d <= hi; d += 15) {
    if (open && (d === lo || d === hi)) continue
    if (!isSpecial(d)) continue
    const e = evalExact(fn, d)
    if (e && surdEq(e, v)) return d
  }
  return null
}

/* ------------------------------------------------------------- coterminal */

/** The angle in [0°, 360°) with the same terminal side. */
export const coterminal = norm360
