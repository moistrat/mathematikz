/**
 * Exact complex numbers a + bi with rational a and b, and a reader for what a student types: "3 + 4i", "2-i", "(1+i)/2", "i".
 * The reader goes through the algebra engine (i is just a letter) and then reduces powers of i, so any equal form is understood,
 * and it can tell whether the answer is in the required form a + bi.
 */
import { AlgError, fAdd, fDiv, fEq, fMul, fmtFrac, fNeg, Frac, fr, fSub, Node, parse, Poly, rVars, toRat } from './algebra'
import { MINUS } from './exact'

export interface Cx { re: Frac; im: Frac }
export const cx = (re: number | Frac = 0, im: number | Frac = 0): Cx => ({ re: typeof re === 'number' ? fr(re) : re, im: typeof im === 'number' ? fr(im) : im })
export const I: Cx = cx(0, 1)
export const cAdd = (a: Cx, b: Cx): Cx => ({ re: fAdd(a.re, b.re), im: fAdd(a.im, b.im) })
export const cSub = (a: Cx, b: Cx): Cx => ({ re: fSub(a.re, b.re), im: fSub(a.im, b.im) })
export const cMul = (a: Cx, b: Cx): Cx => ({ re: fSub(fMul(a.re, b.re), fMul(a.im, b.im)), im: fAdd(fMul(a.re, b.im), fMul(a.im, b.re)) })
export const cConj = (a: Cx): Cx => ({ re: a.re, im: fNeg(a.im) })
export const cNeg = (a: Cx): Cx => ({ re: fNeg(a.re), im: fNeg(a.im) })
export const cEq = (a: Cx, b: Cx) => fEq(a.re, b.re) && fEq(a.im, b.im)
/** |z|² = a² + b², exact */
export const cAbs2 = (a: Cx): Frac => fAdd(fMul(a.re, a.re), fMul(a.im, a.im))
export const cDiv = (a: Cx, b: Cx): Cx => {
  const d = cAbs2(b)
  if (d.n === 0) throw new AlgError('Division by zero.')
  const n = cMul(a, cConj(b))
  return { re: fDiv(n.re, d), im: fDiv(n.im, d) }
}
export const cPow = (a: Cx, n: number): Cx => {
  if (n < 0) return cDiv(cx(1), cPow(a, -n))
  let out = cx(1)
  for (let k = 0; k < n; k++) out = cMul(out, a)
  return out
}
export const cNum = (a: Cx) => ({ re: a.re.n / a.re.d, im: a.im.n / a.im.d })

/** "3 + 4i", "3 − i", "−2i", "5", "1/2 + 3i/2" */
export function fmtCx(z: Cx): string {
  const { re, im } = z
  const coef = (f: Frac) => {
    const a = fr(Math.abs(f.n), f.d)
    return a.n === 1 && a.d === 1 ? 'i' : a.d === 1 ? `${a.n}i` : a.n === 1 ? `i/${a.d}` : `${a.n}i/${a.d}`
  }
  if (im.n === 0) return fmtFrac(re)
  if (re.n === 0) return `${im.n < 0 ? MINUS : ''}${coef(im)}`
  return `${fmtFrac(re)} ${im.n < 0 ? MINUS : '+'} ${coef(im)}`
}
/** the same, in a form the reader accepts */
export const cxInput = (z: Cx) => fmtCx(z).replace(/−/g, '-')

const POW_I = [cx(1), cx(0, 1), cx(-1), cx(0, -1)]
function polyAtI(p: Poly): Cx {
  let out = cx(0)
  for (const t of p) {
    const e = t.e.i ?? 0
    for (const k of Object.keys(t.e)) if (k !== 'i') throw new AlgError(`Only the letter i may appear: found ${k}.`)
    out = cAdd(out, cMul(cx(t.c), POW_I[((e % 4) + 4) % 4]))
  }
  return out
}

export interface ParsedCx { z: Cx; /** written as a + bi: no products of brackets containing i, no i in a denominator, no power of i */ simple: boolean }

const isI = (n: Node): boolean => (n.k === 'var' && n.v === 'i') || (n.k === 'neg' && isI(n.a))

/** structure check on the typed expression: is it already of the form a + bi (numbers may be fractions)? */
function shape(n: Node): { hasI: boolean; ok: boolean } {
  switch (n.k) {
    case 'num': return { hasI: false, ok: true }
    case 'var': return { hasI: n.v === 'i', ok: true }
    case 'neg': return shape(n.a)
    case 'add': case 'sub': { const a = shape(n.a), b = shape(n.b); return { hasI: a.hasI || b.hasI, ok: a.ok && b.ok } }
    case 'mul': {
      const a = shape(n.a), b = shape(n.b)
      // a number times i is fine (4i, (3/2)i); a number times a bracket that contains i is not (3(1 + 2i))
      const fine = (!a.hasI && !b.hasI) || (!a.hasI && isI(n.b)) || (!b.hasI && isI(n.a))
      return { hasI: a.hasI || b.hasI, ok: a.ok && b.ok && fine }
    }
    case 'div': { const a = shape(n.a), b = shape(n.b); return { hasI: a.hasI, ok: a.ok && b.ok && !b.hasI } }
    case 'pow': { const a = shape(n.a); return { hasI: a.hasI, ok: a.ok && !a.hasI } }
  }
}

export function parseCx(src: string): ParsedCx {
  const text = src.trim().replace(/^[a-zA-Z]\s*=\s*/, '')
  const node = parse(text.replace(/(?<![a-z])j(?![a-z])/g, 'i'))
  const rat = toRat(node)
  for (const v of rVars(rat)) if (v !== 'i') throw new AlgError('Use i for the square root of −1, with numbers only.')
  const z = cDiv(polyAtI(rat.n), polyAtI(rat.d))
  return { z, simple: shape(node).ok }
}

/** split a typed list at commas that are not inside brackets */
export function splitList(text: string): string[] {
  const out: string[] = []
  let depth = 0, cur = ''
  for (const ch of text.replace(/\band\b/gi, ',').replace(/;/g, ',')) {
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim()).filter(Boolean)
}
