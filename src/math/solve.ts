/**
 * Engine for Unit 3: exact quadratic roots, solution sets written as inequalities or intervals, and linear systems.
 *
 *  - quadratic roots are kept exact as  (-b ± s√r) / (2a)  with the common factor removed;
 *  - a solution set is a sorted list of disjoint intervals, and a student's typed answer (x < -2 or x >= 3,
 *    -1 < x <= 4, (-inf, 3], [1, 5) U (7, inf), "no solution", "all real numbers") is parsed into the same form;
 *  - two sets are equal when their endpoints agree to 1e-9 and their open/closed ends match.
 */
import { MINUS } from './exact'
import { fmtFrac, Frac, fNum, fr, gcdI } from './algebra'
import { evaluate, ParseError } from './parse'

/* ------------------------------------------------------------------ quadratics */

export interface QuadRoots {
  disc: number
  /** the exact roots, ascending; empty when the discriminant is negative */
  roots: ExactRoot[]
  /** discriminant = s^2 * r with r square-free */
  s: number
  r: number
}
/** a + b√r with a, b rational and r square-free (b = 0 means rational) */
export interface ExactRoot { a: Frac; b: Frac; r: number }

const squareFree = (n: number): { s: number; r: number } => {
  let s = 1, r = n
  for (let k = 2; k * k <= r; k++) while (r % (k * k) === 0) { r /= k * k; s *= k }
  return { s, r }
}
export const rootValue = (x: ExactRoot) => fNum(x.a) + fNum(x.b) * Math.sqrt(x.r)

/** Roots of ax^2 + bx + c = 0 (integers, a ≠ 0). */
export function quadRoots(a: number, b: number, c: number): QuadRoots {
  const disc = b * b - 4 * a * c
  if (disc < 0) return { disc, roots: [], s: 0, r: 1 }
  if (disc === 0) return { disc, roots: [{ a: fr(-b, 2 * a), b: fr(0), r: 1 }], s: 0, r: 1 }
  const { s, r } = squareFree(disc)
  const mk = (sign: 1 | -1): ExactRoot => (r === 1
    ? { a: fr(-b + sign * s, 2 * a), b: fr(0), r: 1 }
    : { a: fr(-b, 2 * a), b: fr(sign * s, 2 * a), r })
  const rs = [mk(1), mk(-1)].sort((p, q) => rootValue(p) - rootValue(q))
  return { disc, roots: rs, s, r }
}

/** A single root as typed text, for example "−3/2 + √5/2" is shown as (−3 + √5)/2. */
export function fmtRoot(x: ExactRoot): string {
  if (x.b.n === 0) return fmtFrac(x.a)
  // put both parts over one denominator
  const den = (x.a.d * x.b.d) / gcdI(x.a.d, x.b.d)
  const an = x.a.n * (den / x.a.d), bn = x.b.n * (den / x.b.d)
  const sign = bn < 0 ? MINUS : '+'
  const rad = `${Math.abs(bn) === 1 ? '' : Math.abs(bn)}√${x.r}`
  const top = an === 0 ? `${bn < 0 ? MINUS : ''}${rad}` : `${an < 0 ? MINUS : ''}${Math.abs(an)} ${sign} ${rad}`
  return den === 1 ? top : an === 0 ? (Math.abs(bn) === 1 ? `${bn < 0 ? MINUS : ''}√${x.r}/${den}` : `${bn < 0 ? MINUS : ''}${Math.abs(bn)}√${x.r}/${den}`) : `(${top})/${den}`
}
/** A form the answer parser reads back. */
export const rootInput = (x: ExactRoot) => fmtRoot(x).replace(/−/g, '-').replace(/(\d)√/g, '$1*√').replace(/√(\d+)/g, 'sqrt($1)')

/** The pair of roots as (p ± q√r)/d, the way a textbook writes the answer. */
export function fmtPlusMinus(a: number, b: number, c: number): string {
  const { disc, s, r } = quadRoots(a, b, c)
  if (disc <= 0) return ''
  const g = gcdI(gcdI(Math.abs(b), s), Math.abs(2 * a))
  let p = -b / g, q = s / g, d = (2 * a) / g
  if (d < 0) { d = -d; p = -p }
  const rad = r === 1 ? String(q) : `${q === 1 ? '' : q}√${r}`
  const top = p === 0 ? `±${rad}` : `${p < 0 ? MINUS : ''}${Math.abs(p)} ± ${rad}`
  return d === 1 ? top : p === 0 ? `${top}/${d}` : `(${top})/${d}`
}

/** Vertex of ax^2 + bx + c as exact fractions. */
export function vertex(a: number, b: number, c: number): { x: Frac; y: Frac } {
  const x = fr(-b, 2 * a)
  const y = fr(4 * a * c - b * b, 4 * a)
  return { x, y }
}

/* ------------------------------------------------------------------ interval sets */

export interface Interval { lo: number; hi: number; loIncl: boolean; hiIncl: boolean }
export type IntervalSet = Interval[]
const EPS = 1e-9

export const WHOLE_LINE: IntervalSet = [{ lo: -Infinity, hi: Infinity, loIncl: false, hiIncl: false }]

/** Sort, drop empties and merge touching or overlapping intervals. */
export function normalise(set: IntervalSet): IntervalSet {
  const xs = set
    .map((i) => ({ ...i, loIncl: i.loIncl && isFinite(i.lo), hiIncl: i.hiIncl && isFinite(i.hi) }))
    .filter((i) => i.lo < i.hi - EPS || (Math.abs(i.lo - i.hi) <= EPS && i.loIncl && i.hiIncl))
    .sort((a, b) => a.lo - b.lo || Number(b.loIncl) - Number(a.loIncl))
  const out: IntervalSet = []
  for (const i of xs) {
    const last = out[out.length - 1]
    if (last && (i.lo < last.hi - EPS || (Math.abs(i.lo - last.hi) <= EPS && (i.loIncl || last.hiIncl)))) {
      if (i.hi > last.hi + EPS) { last.hi = i.hi; last.hiIncl = i.hiIncl } else if (Math.abs(i.hi - last.hi) <= EPS) last.hiIncl = last.hiIncl || i.hiIncl
    } else out.push({ ...i })
  }
  return out
}

export function setsEqual(a: IntervalSet, b: IntervalSet): boolean {
  const x = normalise(a), y = normalise(b)
  const same = (p: number, q: number) => (isFinite(p) || isFinite(q) ? Math.abs(p - q) <= 1e-7 : p === q)
  return x.length === y.length && x.every((i, k) => same(i.lo, y[k].lo) && same(i.hi, y[k].hi) && i.loIncl === y[k].loIncl && i.hiIncl === y[k].hiIncl)
}

export function inSet(set: IntervalSet, x: number): boolean {
  return set.some((i) => (x > i.lo + EPS || (Math.abs(x - i.lo) <= EPS && i.loIncl)) && (x < i.hi - EPS || (Math.abs(x - i.hi) <= EPS && i.hiIncl)))
}

export const intersect = (a: IntervalSet, b: IntervalSet): IntervalSet => {
  const out: IntervalSet = []
  for (const p of a) for (const q of b) {
    const lo = Math.max(p.lo, q.lo), hi = Math.min(p.hi, q.hi)
    const loIncl = p.lo > q.lo ? p.loIncl : q.lo > p.lo ? q.loIncl : p.loIncl && q.loIncl
    const hiIncl = p.hi < q.hi ? p.hiIncl : q.hi < p.hi ? q.hiIncl : p.hiIncl && q.hiIncl
    out.push({ lo, hi, loIncl, hiIncl })
  }
  return normalise(out)
}
export const union = (a: IntervalSet, b: IntervalSet) => normalise([...a, ...b])
export const complement = (a: IntervalSet): IntervalSet => {
  const xs = normalise(a)
  const out: IntervalSet = []
  let lo = -Infinity, loIncl = false
  for (const i of xs) {
    out.push({ lo, hi: i.lo, loIncl, hiIncl: !i.loIncl })
    lo = i.hi; loIncl = !i.hiIncl
  }
  out.push({ lo, hi: Infinity, loIncl, hiIncl: false })
  return normalise(out)
}

/** The set where a function of x that changes sign only at the given points satisfies  f op 0 (op: <, <=, >, >=). */
export type Op = '<' | '<=' | '>' | '>='
export function signSet(f: (x: number) => number, critical: number[], op: Op): IntervalSet {
  const pts = [...critical].sort((a, b) => a - b).filter((v, i, xs) => i === 0 || Math.abs(v - xs[i - 1]) > EPS)
  const bounds = [-Infinity, ...pts, Infinity]
  const strict = op === '<' || op === '>'
  const wantPos = op === '>' || op === '>='
  const out: IntervalSet = []
  for (let i = 0; i + 1 < bounds.length; i++) {
    const lo = bounds[i], hi = bounds[i + 1]
    const mid = !isFinite(lo) && !isFinite(hi) ? 0 : !isFinite(lo) ? hi - 1 : !isFinite(hi) ? lo + 1 : (lo + hi) / 2
    const v = f(mid)
    if (Number.isFinite(v) && (wantPos ? v > 0 : v < 0)) out.push({ lo, hi, loIncl: false, hiIncl: false })
  }
  if (!strict) for (const p of pts) if (Math.abs(f(p)) < 1e-9) out.push({ lo: p, hi: p, loIncl: true, hiIncl: true })
  return normalise(out)
}

/* ------------------------------------------------------------------ writing a set */

const num = (x: number) => (Number.isInteger(x) ? String(x) : String(Number(x.toFixed(6))))
/** "x < −2 or x ≥ 3", "−1 < x ≤ 4", "all real numbers", "no solution". `text` writes one endpoint. */
export function fmtSet(set: IntervalSet, v = 'x', text: (x: number) => string = num): string {
  const xs = normalise(set)
  if (!xs.length) return 'no solution'
  if (xs.length === 1 && !isFinite(xs[0].lo) && !isFinite(xs[0].hi)) return 'all real numbers'
  const t = (x: number) => text(x).replace(/-/g, MINUS)
  return xs.map((i) => {
    if (i.lo === i.hi) return `${v} = ${t(i.lo)}`
    if (!isFinite(i.lo)) return `${v} ${i.hiIncl ? '≤' : '<'} ${t(i.hi)}`
    if (!isFinite(i.hi)) return `${v} ${i.loIncl ? '≥' : '>'} ${t(i.lo)}`
    return `${t(i.lo)} ${i.loIncl ? '≤' : '<'} ${v} ${i.hiIncl ? '≤' : '<'} ${t(i.hi)}`
  }).join(' or ')
}
/** Interval notation: (−∞, −2) ∪ [3, ∞) */
export function fmtIntervals(set: IntervalSet, text: (x: number) => string = num): string {
  const xs = normalise(set)
  if (!xs.length) return '∅'
  const t = (x: number) => (x === -Infinity ? `${MINUS}∞` : x === Infinity ? '∞' : text(x).replace(/-/g, MINUS))
  return xs.map((i) => (i.lo === i.hi ? `{${t(i.lo)}}` : `${i.loIncl ? '[' : '('}${t(i.lo)}, ${t(i.hi)}${i.hiIncl ? ']' : ')'}`)).join(' ∪ ')
}

/* ------------------------------------------------------------------ reading a student's set */

export class SetError extends Error {}

const OPS = ['<=', '>=', '<', '>'] as const
const INF = /^[+-]?\s*(inf|infinity|∞)$/i

function bound(text: string): number {
  const t = text.trim()
  if (!t) throw new SetError('Something is missing next to the inequality sign.')
  if (INF.test(t)) return t.trim().startsWith('-') ? -Infinity : Infinity
  try { return evaluate(t) } catch (e) { if (e instanceof ParseError) throw new SetError(`Could not read "${t}".`); throw e }
}

/** every real number except the given points */
const except = (pts: number[]): IntervalSet => complement(pts.map((v) => ({ lo: v, hi: v, loIncl: true, hiIncl: true })))

function readPiece(piece: string): IntervalSet {
  const p = piece.trim()
  // x != 2  or  2 != x  ("x ≠ 2" is normalised to "!=")
  const ne = /^([a-z])\s*!=\s*(.+)$/i.exec(p) ?? /^(.+?)\s*!=\s*([a-z])$/i.exec(p)
  if (ne) return except([bound(/^[a-z]$/i.test(ne[1]) ? ne[2] : ne[1])])
  // all real numbers except 2, -2
  const ex = /^(?:all (?:real )?numbers?|all reals?|r|ℝ)\s+except\s+(?:x\s*=\s*)?(.+)$/i.exec(p)
  if (ex) return except(ex[1].split(/\s*(?:,|;|\band\b)\s*/).map((q) => bound(q.replace(/^x\s*=\s*/i, ''))))
  // interval notation: (a, b] ...
  const iv = /^([\[(])\s*([^,]+?)\s*,\s*([^,]+?)\s*([\])])$/.exec(p)
  if (iv) {
    const lo = bound(iv[2]), hi = bound(iv[3])
    if (lo > hi) throw new SetError('The left end of an interval must not be bigger than the right end.')
    return [{ lo, hi, loIncl: iv[1] === '[' && isFinite(lo), hiIncl: iv[4] === ']' && isFinite(hi) }]
  }
  // {3} or {-1, 4} as a set of points
  const pts = /^\{(.+)\}$/.exec(p)
  if (pts) return pts[1].split(',').map((q) => { const v = bound(q); return { lo: v, hi: v, loIncl: true, hiIncl: true } })
  // inequality notation: x < 3, 3 < x, -1 < x <= 4, x = 2
  const toks = p.split(/(<=|>=|<|>|=)/).map((s) => s.trim())
  if (toks.length === 3 && toks[1] === '=') {
    const [a, , b] = toks
    const isVar = (s: string) => /^[a-z]$/i.test(s)
    if (isVar(a) || isVar(b)) { const v = bound(isVar(a) ? b : a); return [{ lo: v, hi: v, loIncl: true, hiIncl: true }] }
    throw new SetError('Write the answer with the variable on one side, like x = 2.')
  }
  if (toks.length === 3 || toks.length === 5) {
    const ops = toks.filter((_, i) => i % 2 === 1)
    const vals = toks.filter((_, i) => i % 2 === 0)
    if (!OPS.includes(ops[0] as never) || !ops.every((o) => OPS.includes(o as never))) throw new SetError('Use <, >, ≤ or ≥.')
    const isVar = (s: string) => /^[a-z]$/i.test(s)
    if (toks.length === 3) {
      const [a, b] = vals
      if (isVar(a) && !isVar(b)) { const c = bound(b); return one(ops[0] as Op, c, true) }
      if (isVar(b) && !isVar(a)) { const c = bound(a); return one(ops[0] as Op, c, false) }
      throw new SetError('Put the variable on one side, like x < 3.')
    }
    // a < x < b (both operators must point the same way)
    if (!isVar(vals[1])) throw new SetError('For a double inequality, put the variable in the middle: −1 < x ≤ 4.')
    const up = ops[0].startsWith('<'), same = ops[1].startsWith('<') === up
    if (!same) throw new SetError('Both signs must point the same way, like −1 < x ≤ 4.')
    const a = bound(vals[0]), b = bound(vals[2])
    const lo = up ? a : b, hi = up ? b : a
    const loIncl = up ? ops[0].includes('=') : ops[1].includes('=')
    const hiIncl = up ? ops[1].includes('=') : ops[0].includes('=')
    return [{ lo, hi, loIncl, hiIncl }]
  }
  throw new SetError('Write the answer as an inequality like x > 3, or in interval notation like (3, ∞).')
}
/** x op c (varLeft) or c op x (!varLeft) */
function one(op: Op, c: number, varLeft: boolean): IntervalSet {
  const o: Op = varLeft ? op : op === '<' ? '>' : op === '>' ? '<' : op === '<=' ? '>=' : '<='
  const incl = o.includes('=')
  return o.startsWith('<') ? [{ lo: -Infinity, hi: c, loIncl: false, hiIncl: incl }] : [{ lo: c, hi: Infinity, loIncl: incl, hiIncl: false }]
}

/** Parse "x < -2 or x >= 3", "(-inf,-2) U [3,inf)", "no solution", "all real numbers" ... */
export function parseSet(raw: string): IntervalSet {
  const t = raw.trim()
    .replace(/[−–—]/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/⩽/g, '<=').replace(/⩾/g, '>=').replace(/≠/g, '!=')
    .replace(/\s+/g, ' ')
  if (!t) throw new SetError('Type an answer first.')
  if (/^(no (real )?solutions?|none|∅|empty( set)?|dne)$/i.test(t)) return []
  if (/^(all (real )?numbers?|all reals?|any (real )?number|every (real )?number|r|ℝ|\(-(inf|infinity|∞), ?(inf|infinity|∞)\))$/i.test(t)) return WHOLE_LINE
  // "x != 2, x != -2" lists excluded values, so its parts combine with "and"
  if (/^[a-z]\s*!=\s*[^,]+(\s*,\s*[a-z]\s*!=\s*[^,]+)+$/i.test(t)) return parseSet(t.replace(/\s*,\s*/g, ' and '))
  const pieces = t.split(/\s+or\s+|\s*∪\s*|(?<=[\])])\s*u\s*(?=[[(])|\s*,\s*(?=[a-z0-9.+\-(]*\s*(?:<|>|!=))/i)
  // inside one piece, "and" means the overlap: x != 2 and x != -2
  return normalise(pieces.flatMap((p) => p.split(/\s+and\s+/i).map((q) => readPiece(q.replace(/^x\s*∈\s*/i, ''))).reduce((acc, cur) => intersect(acc, cur))))
}

/* ------------------------------------------------------------------ linear systems */

export interface System2 { a1: number; b1: number; c1: number; a2: number; b2: number; c2: number }
/** a1 x + b1 y = c1, a2 x + b2 y = c2: the unique solution as exact fractions, or null when the lines are parallel or equal. */
export function solveSystem(s: System2): { x: Frac; y: Frac } | null {
  const det = s.a1 * s.b2 - s.a2 * s.b1
  if (det === 0) return null
  return { x: fr(s.c1 * s.b2 - s.c2 * s.b1, det), y: fr(s.a1 * s.c2 - s.a2 * s.c1, det) }
}
export function systemKind(s: System2): 'one' | 'none' | 'infinite' {
  const det = s.a1 * s.b2 - s.a2 * s.b1
  if (det !== 0) return 'one'
  const same = s.a1 * s.c2 === s.a2 * s.c1 && s.b1 * s.c2 === s.b2 * s.c1
  return same ? 'infinite' : 'none'
}

/** Cramer's rule for a 3 x 3 system with integer entries (rows [a, b, c, d] meaning ax + by + cz = d). */
export function solveSystem3(rows: number[][]): { x: Frac; y: Frac; z: Frac } | null {
  const m = (c: number[]) => c
  const det = (a: number[][]) =>
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
  const A = rows.map((r) => m(r.slice(0, 3)))
  const D = det(A)
  if (D === 0) return null
  const col = (k: number) => A.map((r, i) => r.map((v, j) => (j === k ? rows[i][3] : v)))
  return { x: fr(det(col(0)), D), y: fr(det(col(1)), D), z: fr(det(col(2)), D) }
}

