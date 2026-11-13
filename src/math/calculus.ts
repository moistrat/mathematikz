/**
 * Checking answers that are formulas in x (derivatives and the like), and numerical helpers that let the tests check
 * every derivative and limit independently of how the generator built it.
 */
import { evaluate, ParseError } from './parse'
import { showTrig } from './trigAlgebra'

export interface CalcSpec {
  /** the function the question starts from, in parseable ASCII (used to reject the question written back) */
  source: string
  /** a correct formula, in parseable ASCII */
  answer: string
  /** only sample positive x (the formula involves ln or a square root) */
  pos?: boolean
  /** the answer is an antiderivative: any constant of integration may be added or left out */
  plusC?: boolean
  /** sample only inside this open interval of x (for example (−1/2, 1/2) for sin⁻¹(2x)) */
  dom?: [number, number]
  /** values of x that must be avoided (where the formula is undefined) are skipped automatically */
}

export const SAMPLE_ALL = [-2.3, -1.4, -0.6, 0.37, 0.81, 1.23, 1.93, 2.51, 3.37, 4.2]
export const SAMPLE_POS = [0.37, 0.61, 0.81, 1.23, 1.43, 1.93, 2.51, 3.37, 4.1, 5.2]
export const samplesFor = (pos?: boolean, dom?: [number, number]) => (dom ? Array.from({ length: 10 }, (_, i) => dom[0] + ((dom[1] - dom[0]) * (i + 0.5)) / 10) : pos ? SAMPLE_POS : SAMPLE_ALL)
const norm = (s: string) => s.toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, '')
const at = (src: string, x: number) => evaluate(src, { x })

export function sameFormula(a: string, b: string, pos = false, dom?: [number, number]): boolean {
  let n = 0
  for (const x of samplesFor(pos, dom)) {
    let u: number, v: number
    try { u = at(a, x); v = at(b, x) } catch (e) { if (e instanceof ParseError) continue; throw e }
    if (!Number.isFinite(u) || !Number.isFinite(v)) continue
    if (Math.abs(u - v) > 1e-7 * (1 + Math.abs(v))) return false
    n++
  }
  return n >= 5
}

/** two formulas that differ by a constant (they may disagree by any fixed number, but never by a varying amount) */
export function sameUpToConstant(a: string, b: string, pos = false, dom?: [number, number]): boolean {
  const ds: number[] = []
  for (const x of samplesFor(pos, dom)) {
    let u: number, v: number
    try { u = at(a, x); v = at(b, x) } catch (e) { if (e instanceof ParseError) continue; throw e }
    if (Number.isFinite(u) && Number.isFinite(v)) ds.push(u - v)
  }
  if (ds.length < 5) return false
  const m = ds[0]
  return ds.every((d) => Math.abs(d - m) < 1e-7 * (1 + Math.abs(m) + Math.abs(d)))
}

export function checkCalc(spec: CalcSpec, raw: string): { ok: boolean; invalid?: boolean; note?: string } {
  let text = raw.trim().replace(/ln\|([^|]+)\|/gi, 'ln(abs($1))').replace(/^\s*(?:d\d?y\s*\/\s*d[a-z]\d?|(?:f|y|g|h)\s*['′’]*\s*(?:\([a-z]\))?)\s*=(?!=)/i, '').trim()
  if (spec.plusC) text = text.replace(/\s*\+\s*[ck]\s*$/i, '')
  if (!text) return { ok: false, invalid: true, note: 'Type an answer first.' }
  try { at(text, spec.dom ? (spec.dom[0] + spec.dom[1]) / 2 : spec.pos ? 0.81 : 1.23) } catch (e) {
    if (e instanceof ParseError) return { ok: false, invalid: true, note: 'Could not read that. Write products side by side or with *, powers with ^, and functions with brackets: 3x^2, 2x*e^x, sin(2x), ln(x), sqrt(x), e^(3x).' }
    throw e
  }
  if (spec.plusC) {
    if (!sameUpToConstant(text, spec.answer, spec.pos, spec.dom)) return { ok: false, note: /\bd\/dx|′|'/.test(text) ? undefined : 'Differentiate your answer: you should get back the function you were asked to integrate.' }
    return { ok: true }
  }
  if (!sameFormula(text, spec.answer, spec.pos, spec.dom)) return { ok: false }
  if (norm(text) === norm(spec.source) && norm(spec.source) !== norm(spec.answer)) return { ok: false, note: 'That is the question written back. Differentiate it.' }
  return { ok: true }
}

/** the nth derivative of an ASCII function at x by central differences (n = 1 or 2) */
export function numDeriv(src: string, x: number, order: 1 | 2 = 1): number {
  if (order === 1) { const h = 1e-5; return (at(src, x + h) - at(src, x - h)) / (2 * h) }
  const h = 1e-3
  return (at(src, x + h) - 2 * at(src, x) + at(src, x - h)) / (h * h)
}

/** does this formula really equal the derivative of src? (the independent check used by the generators and the tests) */
export function isDerivative(src: string, formula: string, order: 1 | 2 = 1, pos = false, dom?: [number, number]): boolean {
  let n = 0
  for (const x of samplesFor(pos, dom)) {
    let d: number, f: number
    try { d = numDeriv(src, x, order); f = at(formula, x) } catch (e) { if (e instanceof ParseError) continue; throw e }
    if (!Number.isFinite(d) || !Number.isFinite(f) || Math.abs(d) > 1e12) continue
    if (Math.abs(d - f) > (order === 1 ? 2e-5 : 2e-3) * (1 + Math.abs(f))) return false
    n++
  }
  return n >= 5
}

/** a numerical limit of an ASCII expression as x -> a (from the left, the right, or both sides), or null when it does not settle */
export function numLimit(src: string, a: number, dir: 'both' | 'left' | 'right' | 'inf' | '-inf' = 'both'): number | null {
  const val = (x: number) => { try { return at(src, x) } catch { return NaN } }
  if (dir === 'inf' || dir === '-inf') {
    const s = dir === 'inf' ? 1 : -1
    const v1 = val(s * 1e4), v2 = val(s * 1e5)
    return Number.isFinite(v1) && Number.isFinite(v2) && Math.abs(v1 - v2) < 1e-2 * (1 + Math.abs(v2)) ? v2 : null
  }
  const side = (s: number) => {
    const v1 = val(a + s * 1e-4), v2 = val(a + s * 1e-5)
    // the value at the point, extrapolated linearly from the two estimates; a wild change between them means no limit
    return Number.isFinite(v1) && Number.isFinite(v2) && Math.abs(v1 - v2) < 0.05 * (1 + Math.abs(v2)) ? v2 + (v2 - v1) / 9 : null
  }
  const l = dir === 'right' ? null : side(-1), r = dir === 'left' ? null : side(1)
  if (dir === 'left') return l
  if (dir === 'right') return r
  return l !== null && r !== null && Math.abs(l - r) < 2e-3 * (1 + Math.abs(l)) ? (l + r) / 2 : null
}

/** typeset an ASCII formula for the screen */
export function showF(src: string): string {
  return showTrig(src.replace(/\*(?=[a-z])/g, ' '))
    .replace(/asin\(/g, 'sin⁻¹(').replace(/acos\(/g, 'cos⁻¹(').replace(/atan\(/g, 'tan⁻¹(')
    .replace(/sqrt\(/g, '√(').replace(/cbrt\(/g, '∛(')
    .replace(/ln\(abs\(([^()]+)\)\)/g, 'ln|$1|').replace(/(?<![a-z])ln\(([a-z])\)/g, 'ln $1')
    .replace(/(?<![a-z])e\^x(?![a-z\d^])/g, 'eˣ')
}

/** Simpson's rule for the integral of an ASCII function (the independent check for definite integrals) */
export function simpson(src: string, a: number, b: number, n = 2000): number {
  const h = (b - a) / n
  let s = at(src, a) + at(src, b)
  for (let i = 1; i < n; i++) s += at(src, a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}
