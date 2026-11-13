/** Shared helpers for the Unit 9 generators (limits and derivatives). */
import { fmtFrac, Frac, fNum, fr } from './algebra'
import { numSpec, ri, rnz } from './algebraQuestions'
import { MN } from './equationQuestions'
import { isDerivative, numLimit, showF, simpson, CalcSpec } from './calculus'
import { MINUS } from './exact'
import type { Spec } from './questions'

export { numSpec, ri, rnz, MN }
export const fm = (f: Frac) => fmtFrac(f)
export const must = (ok: boolean, what: string) => { if (!ok) throw new Error(`self-check failed: ${what}`) }
export const w = (n: number) => (n < 0 ? `(${MN(String(n))})` : String(n))
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
export const sup = (n: number) => `${n < 0 ? '⁻' : ''}${String(Math.abs(n)).split('').map((d) => SUP[Number(d)]).join('')}`

/** coefficient prefix: 1 -> '', -1 -> '-' */
export const cof = (k: number) => (k === 1 ? '' : k === -1 ? '-' : String(k))
/** x^e as ASCII ('' for e = 0, 'x' for e = 1) */
export const xp = (e: number, v = 'x') => (e === 0 ? '' : e === 1 ? v : `${v}^${e}`)
/** a polynomial from ascending coefficients as ASCII, for example [1, -2, 3] -> 3x^2-2x+1 */
export function P(cs: number[], v = 'x'): string {
  let out = ''
  for (let e = cs.length - 1; e >= 0; e--) {
    const c = cs[e]
    if (c === 0) continue
    const body = e === 0 ? String(Math.abs(c)) : `${Math.abs(c) === 1 ? '' : Math.abs(c)}${xp(e, v)}`
    out += out ? `${c < 0 ? '-' : '+'}${body}` : `${c < 0 ? '-' : ''}${body}`
  }
  return out || '0'
}
export const dP = (cs: number[]) => cs.slice(1).map((c, i) => c * (i + 1))
export const evP = (cs: number[], x: number) => cs.reduceRight((s, c) => s * x + c, 0)
/** show an ASCII expression on screen */
export const S = showF

/** a decimal answer shown as a decimal */
export function decSpec(prompt: string, v: number, hint: string, expl: string[], places = 4): Spec {
  const t = String(Number(v.toFixed(places)))
  return { prompt, kind: 'value', answers: [v], display: t.replace('-', MINUS), input: t, unit: '', needsExact: false, tol: 1e-9, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: true } }
}

/** a question whose answer does not exist (or diverges) */
export function noneSpec(prompt: string, word: 'does not exist' | 'diverges', hint: string, expl: string[]): Spec {
  return { prompt, kind: 'value', answers: [null], display: word === 'diverges' ? 'it diverges (no finite limit)' : 'the limit does not exist', input: word, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: true } }
}

/** a numeric answer that is a multiple of π */
export function piSpec(prompt: string, k: number, hint: string, expl: string[]): Spec {
  return { prompt, kind: 'value', answers: [k * Math.PI], display: `${k === 1 ? '' : k}π`, input: k === 1 ? 'pi' : `${k}pi`, unit: '', needsExact: true, tol: 1e-7, hint, explanation: expl, pad: { pi: true, root: false, comma: false, alg: true } }
}

/** a formula answer (a derivative, say), checked at sample points, with a built-in independent check */
export function calcSpec(prompt: string, source: string, answer: string, hint: string, expl: string[], opt: { order?: 1 | 2; pos?: boolean; dom?: [number, number]; check?: boolean } = {}): Spec {
  const { order = 1, pos, dom, check = true } = opt
  if (check) must(isDerivative(source, answer, order, pos, dom), `derivative of ${source} is not ${answer}`)
  const calc: CalcSpec = { source, answer, pos, dom }
  const extra: string[] = []
  if (/ln\(/.test(answer + source)) extra.push('ln(')
  if (/e\^/.test(answer + source)) extra.push('e^(')
  if (/sin\(|cos\(|tan\(|sec\(/.test(answer + source)) extra.push('sin(', 'cos(')
  return { prompt, kind: 'alg', answers: [], display: S(answer), input: answer, unit: '', needsExact: false, tol: 0, hint, explanation: expl.map((e) => e.replace(/\^1(?!\d)/g, '').replace(/\^(\d+)/g, (_m, d: string) => sup(Number(d)))), pad: { pi: false, root: /sqrt|cbrt/.test(answer + source), comma: false, alg: true, extra }, calc }
}

/** limit of an ASCII expression, verified numerically */
export function limitCheck(src: string, at: number, want: number | null, dir: 'both' | 'left' | 'right' | 'inf' | '-inf' = 'both', what = src) {
  const got = numLimit(src, at, dir)
  if (want === null) must(got === null, `${what}: expected no limit, got ${got}`)
  else must(got !== null && Math.abs(got - want) < 3e-3 * (1 + Math.abs(want)), `${what}: limit ${want} but numerics give ${got}`)
}

export { fr, fNum }
export type { Spec }
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))

/** an indefinite integral: the answer is an antiderivative, and any constant may be added */
export function intSpec(prompt: string, integrand: string, F: string, hint: string, expl: string[], opt: { pos?: boolean; dom?: [number, number] } = {}): Spec {
  must(isDerivative(F, integrand, 1, opt.pos, opt.dom), `${F} is not an antiderivative of ${integrand}`)
  const base = calcSpec(prompt, integrand, F, hint, expl, { ...opt, check: false })
  return { ...base, display: `${S(F)} + C`, calc: { source: integrand, answer: F, pos: opt.pos, dom: opt.dom, plusC: true } }
}

/** a definite integral checked by Simpson's rule */
export function defCheck(src: string, a: number, b: number, want: number) {
  const got = simpson(src, a, b, 240)
  must(Math.abs(got - want) < 1e-4 * (1 + Math.abs(want)), `∫ ${src} from ${a} to ${b} should be ${want}, Simpson says ${got}`)
}

/** an exact rational multiple of pi */
export function fracPiSpec(prompt: string, f: { n: number; d: number }, hint: string, expl: string[]): Spec {
  const v = (f.n / f.d) * Math.PI
  const shown = f.d === 1 ? `${f.n === 1 ? '' : f.n}π` : `${f.n === 1 ? '' : f.n}π/${f.d}`
  return { prompt, kind: 'value', answers: [v], display: shown.replace('-', MINUS), input: f.d === 1 ? `${f.n}pi` : `(${f.n}/${f.d})pi`, unit: '', needsExact: true, tol: 1e-7, hint, explanation: expl, pad: { pi: true, root: false, comma: false, alg: true } }
}

/** the integral of a polynomial (ascending integer coefficients) from a to b, exactly */
export function polyDef(cs: number[], a: number, b: number): Frac {
  let tot = fr(0)
  const anti = (x: number) => cs.reduce((s, c, e) => fAddH(s, fr(c * x ** (e + 1), e + 1)), fr(0))
  tot = fSubH(anti(b), anti(a))
  return tot
}
import { fAdd as fAddH, fSub as fSubH } from './algebra'
