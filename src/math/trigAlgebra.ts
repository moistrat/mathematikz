/**
 * Checking trigonometric expressions and identities.
 *
 * Two expressions in an angle are equal when they agree at many different angles (a non-zero function of an angle that is
 * zero at nine unrelated points is zero everywhere, for the expressions that occur here). To stop a student typing the
 * question back, an answer must also be "simpler": it may not use more trig functions than the model answer.
 */
import { evaluate, ParseError } from './parse'

export interface TrigSpec {
  /** the expression the question starts from, in parseable ASCII */
  source: string
  /** a correct simplified answer in parseable ASCII */
  answer: string
  /** the most trig functions the student's answer may use (default: as many as the model answer) */
  maxFuncs?: number
  /** a pattern (regular expression source) the student's text, with spaces removed, must match: for example the double angle 2x */
  must?: string
  /** what to tell a student whose answer is equal but does not match `must` */
  mustNote?: string
}
export interface TrigCheck { ok: boolean; invalid?: boolean; note?: string }

/** angles chosen to avoid multiples of π/12 where a function may be undefined */
export const SAMPLES = [0.37, 0.81, 1.23, 1.93, 2.51, 3.37, 4.07, 4.88, 5.64]
const FUNC = /(?<![a-z])(sin|cos|tan|sec|csc|cot)/g

export const countFuncs = (s: string) => (s.toLowerCase().match(FUNC) ?? []).length
const norm = (s: string) => s.toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, '')

/** the value of an expression at the angle t, whichever of x, t, θ it is written in */
export const valueAt = (expr: string, t: number) => evaluate(expr, { x: t, t, theta: t, a: t })

export function trigEqual(a: string, b: string): boolean {
  let n = 0
  for (const t of SAMPLES) {
    const u = valueAt(a, t), v = valueAt(b, t)
    if (!Number.isFinite(u) || !Number.isFinite(v)) continue
    if (Math.abs(u - v) > 1e-7 * (1 + Math.abs(v))) return false
    n++
  }
  return n >= 6
}

export function checkTrig(spec: TrigSpec, raw: string): TrigCheck {
  const text = raw.trim().replace(/^[a-zθ]\s*(\([a-zθ]\))?\s*=(?!=)/i, '').trim()
  if (!text) return { ok: false, invalid: true, note: 'Type an answer first.' }
  try { valueAt(text, SAMPLES[0]) } catch (e) {
    if (e instanceof ParseError) return { ok: false, invalid: true, note: 'Could not read that. Write functions with brackets: sin(x), cos(2x), tan(x), sec(x), csc(x), cot(x), and powers like sin(x)^2 or sin²x. Angles are in radians; type pi for π.' }
    throw e
  }
  if (!trigEqual(text, spec.answer)) return { ok: false, note: 'That is not equal to the original expression. Test it: put the same angle into both and compare.' }
  if (norm(text) === norm(spec.source)) return { ok: false, note: 'That is just the question written back. Simplify it.' }
  if (spec.must && !new RegExp(spec.must, 'i').test(norm(text))) return { ok: false, note: spec.mustNote ?? 'That is equal in value, but it is not in the form the question asks for.' }
  const limit = spec.maxFuncs ?? countFuncs(spec.answer)
  if (countFuncs(text) > limit) return { ok: false, note: 'It is equal in value, but not simplified: use the identities to reduce the number of trig functions.' }
  return { ok: true }
}

/** typeset an ASCII trig expression for the screen: sin(x)^2 -> sin²x, cos(2x) stays, * is dropped */
export function showTrig(src: string): string {
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
  const sup = (n: string) => n.split('').map((d) => SUP[Number(d)]).join('')
  return src
    .replace(/(sin|cos|tan|sec|csc|cot)\(([a-z])\)\^(\d)/g, (_, f: string, v: string, n: string) => `${f}${sup(n)}${v}`)
    .replace(/(sin|cos|tan|sec|csc|cot)\(([a-z])\)/g, '$1 $2')
    .replace(/\^(\d)/g, (_, n: string) => sup(n))
    .replace(/\^\(-(\d)\)/g, (_, n: string) => `⁻${sup(n)}`)
    .replace(/\*/g, '')
    .replace(/-/g, '−')
    .replace(/pi/g, 'π')
    .replace(/([a-z])(sin|cos|tan|sec|csc|cot)/g, '$1 $2')
    .replace(/(\)|\d)\s*(sin|cos|tan|sec|csc|cot)/g, '$1 $2')
    .replace(/(?<=[\w)⁰¹²³⁴⁵⁶⁷⁸⁹π])([+−])(?=[\w(π])/g, ' $1 ')
}
