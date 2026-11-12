/**
 * Helpers for Unit 4: simplifying roots, exact arithmetic with a + b√r, and the "is it in simplest form?" check
 * applied to what a student types.
 */
import { fr, Frac, fAdd, fMul, fSub } from './algebra'
import { evaluate, ParseError } from './parse'
import type { ExactRoot } from './solve'

/** n = outside^k × inside with inside free of k-th powers. */
export function extractRoot(n: number, k = 2): { outside: number; inside: number } {
  let outside = 1, inside = n
  for (let f = 2; Math.pow(f, k) <= inside; f++) {
    const p = Math.pow(f, k)
    while (inside % p === 0) { inside /= p; outside *= f }
  }
  return { outside, inside }
}
export const isKFree = (n: number, k = 2) => extractRoot(n, k).outside === 1
export const isPerfectPower = (n: number, k = 2) => extractRoot(n, k).inside === 1

/** a + b√r, kept with r square-free (r = 1 means a plain rational). */
export const root = (a: Frac | number, b: Frac | number, r: number): ExactRoot => {
  const A = typeof a === 'number' ? fr(a) : a
  let B = typeof b === 'number' ? fr(b) : b
  const { outside, inside } = extractRoot(r)
  B = fMul(B, fr(outside))
  return inside === 1 ? { a: fAdd(A, B), b: fr(0), r: 1 } : B.n === 0 ? { a: A, b: fr(0), r: 1 } : { a: A, b: B, r: inside }
}
/** (a1 + b1√r)(a2 + b2√r) */
export function rootMul(x: ExactRoot, y: ExactRoot): ExactRoot {
  const r = x.b.n === 0 ? y.r : x.r
  if (x.b.n !== 0 && y.b.n !== 0 && x.r !== y.r) throw new Error('different radicals')
  const aa = fMul(x.a, y.a), bb = fMul(fMul(x.b, y.b), fr(r))
  const ab = fAdd(fMul(x.a, y.b), fMul(y.a, x.b))
  return root(fAdd(aa, bb), ab, r)
}
export const rootAdd = (x: ExactRoot, y: ExactRoot): ExactRoot => {
  const r = x.b.n === 0 ? y.r : x.r
  return root(fAdd(x.a, y.a), fAdd(x.b, y.b), r)
}
export const rootSub = (x: ExactRoot, y: ExactRoot): ExactRoot => {
  const r = x.b.n === 0 ? y.r : x.r
  return root(fSub(x.a, y.a), fSub(x.b, y.b), r)
}

/* ------------------------------------------------------------------ simplest form of a typed answer */

/** the text inside the balanced bracket that starts at s[i] === '(' */
function group(s: string, i: number): string {
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '(') depth++
    else if (s[j] === ')') { depth--; if (depth === 0) return s.slice(i + 1, j) }
  }
  return s.slice(i + 1)
}

/**
 * Looks at what a student typed and says what is wrong with it as an answer in simplest radical form:
 * a radicand with a square (or cube) factor, a perfect power under the root, or a root in a denominator.
 * Returns null when it is fine. The value itself is checked elsewhere.
 */
export function radicalFormProblem(raw: string): string | null {
  const s = raw.toLowerCase().replace(/[−–—]/g, '-').replace(/√/g, 'sqrt').replace(/∛/g, 'cbrt').replace(/\s+/g, '')
  const re = /(sqrt|cbrt)(\(|\d+(?:\.\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    const k = m[1] === 'sqrt' ? 2 : 3
    const arg = m[2] === '(' ? group(s, m.index + m[1].length) : m[2]
    let n: number
    try { n = evaluate(arg) } catch (e) { if (e instanceof ParseError) return null; throw e }
    if (!Number.isInteger(n)) return `Write the number under the ${k === 2 ? 'square' : 'cube'} root as a whole number.`
    if (isPerfectPower(n, k)) return `${n} is a perfect ${k === 2 ? 'square' : 'cube'}, so its ${k === 2 ? 'square' : 'cube'} root is a whole number: write it as one.`
    if (!isKFree(n, k)) return `Not simplified: ${n} still has a ${k === 2 ? 'square' : 'cube'} factor (${extractRoot(n, k).outside}${k === 2 ? '²' : '³'}) that can come out from under the root.`
  }
  // a root in a denominator: after any "/", the operand is a root, or a bracket containing one
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '/') continue
    let rest = s.slice(i + 1)
    if (rest.startsWith('(')) rest = group(s, i + 1)
    else { const op = /^[0-9.]*\*?(?:sqrt|cbrt)/.exec(rest); if (op) return 'Rationalise the denominator: there should be no root left in the bottom of the fraction.' ; rest = '' }
    if (/sqrt|cbrt/.test(rest)) return 'Rationalise the denominator: there should be no root left in the bottom of the fraction.'
  }
  return null
}

/** "6√2", "3∛2" : outside and inside as shown on screen */
export const fmtOutside = (outside: number, inside: number, k = 2) => `${outside === 1 ? '' : outside}${k === 2 ? '√' : '∛'}${inside}`
