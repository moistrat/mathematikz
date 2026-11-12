/**
 * Algebra engine: polynomials in several variables with rational coefficients, rational expressions,
 * a forgiving expression parser, exact division, rational roots, and answer checking.
 *
 * Everything the student types is parsed to a syntax tree. The tree is turned into a rational function
 * (numerator / denominator, both polynomials) so equivalent forms compare equal, and it can also be read
 * as a product of factors to check that something is fully factored.
 */
import { MINUS } from './exact'

export class AlgError extends Error {}

/* ------------------------------------------------------------------ fractions */

export interface Frac { n: number; d: number }
const LIM = 2 ** 50
export const gcdI = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a }
const lcmI = (a: number, b: number) => (a / gcdI(a, b)) * b

export const fr = (n: number, d = 1): Frac => {
  if (d === 0) throw new AlgError('Division by zero.')
  if (!Number.isFinite(n) || !Number.isFinite(d) || Math.abs(n) > LIM || Math.abs(d) > LIM) throw new AlgError('Those numbers are too large.')
  if (d < 0) { n = -n; d = -d }
  const g = gcdI(n, d) || 1
  return { n: n / g, d: d / g }
}
export const fAdd = (a: Frac, b: Frac) => fr(a.n * b.d + b.n * a.d, a.d * b.d)
export const fSub = (a: Frac, b: Frac) => fr(a.n * b.d - b.n * a.d, a.d * b.d)
export const fMul = (a: Frac, b: Frac) => fr(a.n * b.n, a.d * b.d)
export const fDiv = (a: Frac, b: Frac) => fr(a.n * b.d, a.d * b.n)
export const fNeg = (a: Frac) => fr(-a.n, a.d)
export const fEq = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d
export const fNum = (a: Frac) => a.n / a.d
export const fIsZero = (a: Frac) => a.n === 0
export const fPow = (a: Frac, k: number): Frac => {
  let out = fr(1)
  for (let i = 0; i < k; i++) out = fMul(out, a)
  return out
}
/** "3", "−1/2" */
export const fmtFrac = (a: Frac) => `${a.n < 0 ? MINUS : ''}${Math.abs(a.n)}${a.d === 1 ? '' : `/${a.d}`}`

/* ------------------------------------------------------------------ polynomials */

export interface Term { c: Frac; e: Record<string, number> }
export type Poly = Term[]

const keyOf = (e: Record<string, number>) => Object.keys(e).sort().map((v) => v + e[v]).join('.')
const totalDeg = (e: Record<string, number>) => Object.values(e).reduce((a, b) => a + b, 0)
/** graded lexicographic order: higher total degree first, then alphabetical variables with higher powers first */
function cmpE(a: Record<string, number>, b: Record<string, number>): number {
  const da = totalDeg(a), db = totalDeg(b)
  if (da !== db) return db - da
  const vs = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  for (const v of vs) {
    const x = a[v] ?? 0, y = b[v] ?? 0
    if (x !== y) return y - x
  }
  return 0
}

function mk(ts: Term[]): Poly {
  const m = new Map<string, Term>()
  for (const t of ts) {
    const k = keyOf(t.e), ex = m.get(k)
    if (ex) m.set(k, { c: fAdd(ex.c, t.c), e: ex.e })
    else m.set(k, { c: t.c, e: t.e })
  }
  return [...m.values()].filter((t) => t.c.n !== 0).sort((a, b) => cmpE(a.e, b.e))
}

export const pConst = (c: Frac | number): Poly => mk([{ c: typeof c === 'number' ? fr(c) : c, e: {} }])
export const pVar = (v: string): Poly => [{ c: fr(1), e: { [v]: 1 } }]
export const pAdd = (a: Poly, b: Poly): Poly => mk([...a, ...b])
export const pNeg = (a: Poly): Poly => a.map((t) => ({ c: fNeg(t.c), e: t.e }))
export const pSub = (a: Poly, b: Poly): Poly => pAdd(a, pNeg(b))
export const pScale = (a: Poly, f: Frac): Poly => mk(a.map((t) => ({ c: fMul(t.c, f), e: t.e })))
export function pMul(a: Poly, b: Poly): Poly {
  if (!a.length || !b.length) return []
  if (a.length * b.length > 40000) throw new AlgError('That expression is too large to handle.')
  const ts: Term[] = []
  for (const x of a) for (const y of b) {
    const e = { ...x.e }
    for (const v in y.e) e[v] = (e[v] ?? 0) + y.e[v]
    ts.push({ c: fMul(x.c, y.c), e })
  }
  return mk(ts)
}
export function pPow(a: Poly, k: number): Poly {
  // a single term can be raised directly to larger powers, as long as its coefficient stays exact
  if (a.length === 1 && Number.isInteger(k) && k > 12 && k <= 40) {
    const t = a[0]
    if (Math.pow(Math.max(Math.abs(t.c.n), t.c.d), k) > 9e15) throw new AlgError('That number is too large to work with exactly.')
    return mk([{ c: fPow(t.c, k), e: Object.fromEntries(Object.entries(t.e).map(([v, x]) => [v, x * k])) }])
  }
  if (!Number.isInteger(k) || k < 0 || k > 12) throw new AlgError('Powers must be whole numbers from 0 to 12 (up to 40 for a single term).')
  let out = pConst(1)
  for (let i = 0; i < k; i++) out = pMul(out, a)
  return out
}
export const isZero = (p: Poly) => p.length === 0
export const isConst = (p: Poly) => p.length === 0 || (p.length === 1 && Object.keys(p[0].e).length === 0)
export const constOf = (p: Poly): Frac => (p.length ? p[0].c : fr(0))
export const pEq = (a: Poly, b: Poly) => a.length === b.length && a.every((t, i) => keyOf(t.e) === keyOf(b[i].e) && fEq(t.c, b[i].c))
export const pVars = (p: Poly): Set<string> => new Set(p.flatMap((t) => Object.keys(t.e)))
export const degIn = (p: Poly, v: string) => p.reduce((m, t) => Math.max(m, t.e[v] ?? 0), 0)
export const pDeg = (p: Poly) => p.reduce((m, t) => Math.max(m, totalDeg(t.e)), 0)

export function pEvalNum(p: Poly, env: Record<string, number>): number {
  let s = 0
  for (const t of p) {
    let x = fNum(t.c)
    for (const v in t.e) x *= Math.pow(env[v] ?? NaN, t.e[v])
    s += x
  }
  return s
}
export function pEvalFrac(p: Poly, env: Record<string, Frac>): Frac {
  let s = fr(0)
  for (const t of p) {
    let x = t.c
    for (const v in t.e) x = fMul(x, fPow(env[v], t.e[v]))
    s = fAdd(s, x)
  }
  return s
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
export const sup = (n: number) => String(n).split('').map((d) => SUP[Number(d)]).join('')

/** Standard form. ascii=true gives text the parser reads back (x^2, -); otherwise typeset (x², U+2212). */
export function fmtPoly(p: Poly, ascii = false): string {
  if (!p.length) return '0'
  const minus = ascii ? '-' : MINUS
  let out = ''
  p.forEach((t, i) => {
    const neg = t.c.n < 0
    const a = fr(Math.abs(t.c.n), t.c.d)
    const vars = Object.keys(t.e).sort()
    const mono = vars.map((v) => (t.e[v] === 1 ? v : ascii ? `${v}^${t.e[v]}` : `${v}${sup(t.e[v])}`)).join('')
    let coef = ''
    if (!vars.length) coef = a.d === 1 ? String(a.n) : `${a.n}/${a.d}`
    else if (!(a.n === 1 && a.d === 1)) coef = a.d === 1 ? String(a.n) : `(${a.n}/${a.d})`
    const body = coef + mono
    out += i === 0 ? (neg ? minus : '') + body : ` ${neg ? minus : '+'} ${body}`
  })
  return out
}

/** ASCII input text -> how it is shown on screen. */
export const pretty = (s: string) => s.replace(/-/g, MINUS).replace(/\^(\d+)/g, (_, d: string) => sup(Number(d)))

/** Scale to integer coefficients with positive leading coefficient: p = c * primitive. */
export function prim(p: Poly): { p: Poly; c: Frac } {
  if (!p.length) return { p, c: fr(0) }
  let l = 1
  for (const t of p) l = lcmI(l, t.c.d)
  let g = 0
  for (const t of p) g = gcdI(g, (t.c.n * l) / t.c.d)
  let c = fr(g, l)
  if (p[0].c.n < 0) c = fNeg(c)
  return { p: pScale(p, fDiv(fr(1), c)), c }
}
export const proportional = (a: Poly, b: Poly) => a.length > 0 && b.length > 0 && pEq(prim(a).p, prim(b).p)

/** Division with remainder in graded-lex order. The remainder is zero exactly when f divides n. */
export function pDivide(n: Poly, f: Poly): { q: Poly; r: Poly } {
  if (!f.length) throw new AlgError('Division by zero.')
  const lf = f[0]
  let p = n, q: Poly = [], r: Poly = []
  for (let guard = 0; p.length && guard < 20000; guard++) {
    const lt = p[0]
    let ok = true
    for (const v in lf.e) if ((lt.e[v] ?? 0) < lf.e[v]) { ok = false; break }
    if (ok) {
      const e: Record<string, number> = {}
      for (const v in lt.e) { const d = lt.e[v] - (lf.e[v] ?? 0); if (d > 0) e[v] = d }
      const t: Term = { c: fDiv(lt.c, lf.c), e }
      q = pAdd(q, [t]); p = pSub(p, pMul([t], f))
    } else { r = pAdd(r, [lt]); p = p.slice(1) }
  }
  return { q, r }
}
export const pDivExact = (n: Poly, f: Poly): Poly | null => { const { q, r } = pDivide(n, f); return r.length ? null : q }

/* ------------------------------------------------------------------ rational expressions */

export interface Rat { n: Poly; d: Poly }
const ONE: Poly = pConst(1)

export function mkRat(n: Poly, d: Poly): Rat {
  if (!d.length) throw new AlgError('Division by zero.')
  if (isConst(d)) return { n: pScale(n, fDiv(fr(1), constOf(d))), d: ONE }
  return { n, d }
}
export const rConst = (c: Frac | number): Rat => ({ n: pConst(c), d: ONE })
export function rAdd(a: Rat, b: Rat): Rat {
  if (pEq(a.d, b.d)) return mkRat(pAdd(a.n, b.n), a.d)
  const qa = pDivExact(b.d, a.d)
  if (qa) return mkRat(pAdd(pMul(a.n, qa), b.n), b.d)
  const qb = pDivExact(a.d, b.d)
  if (qb) return mkRat(pAdd(a.n, pMul(b.n, qb)), a.d)
  return mkRat(pAdd(pMul(a.n, b.d), pMul(b.n, a.d)), pMul(a.d, b.d))
}
export const rNeg = (a: Rat): Rat => ({ n: pNeg(a.n), d: a.d })
export const rSub = (a: Rat, b: Rat) => rAdd(a, rNeg(b))
export const rMul = (a: Rat, b: Rat) => mkRat(pMul(a.n, b.n), pMul(a.d, b.d))
export function rDiv(a: Rat, b: Rat): Rat {
  if (!b.n.length) throw new AlgError('Division by zero.')
  return mkRat(pMul(a.n, b.d), pMul(a.d, b.n))
}
export function rPow(a: Rat, k: number): Rat {
  if (k >= 0) return mkRat(pPow(a.n, k), pPow(a.d, k))
  if (!a.n.length) throw new AlgError('Division by zero.')
  return mkRat(pPow(a.d, -k), pPow(a.n, -k))
}
export const rEq = (a: Rat, b: Rat) => pEq(pMul(a.n, b.d), pMul(b.n, a.d))
export const rVars = (a: Rat) => new Set([...pVars(a.n), ...pVars(a.d)])

/* ------------------------------------------------------------------ parser */

export type Node =
  | { k: 'num'; v: Frac }
  | { k: 'var'; v: string }
  | { k: 'neg'; a: Node }
  | { k: 'add' | 'sub' | 'mul' | 'div'; a: Node; b: Node }
  | { k: 'pow'; a: Node; e: number }

type Tok = { t: 'num'; v: Frac } | { t: 'var'; v: string } | { t: 'op'; v: string }
const SUPMAP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' }
const WORDS = /(sqrt|sin|cos|tan|log|ln|exp|pi)/

function tokenize(src: string): Tok[] {
  const s = src
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[×·⋅∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[[{]/g, '(').replace(/[\]}]/g, ')')
    .replace(/⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^(${[...m].map((c) => SUPMAP[c]).join('')})`)
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i++; continue }
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const txt = s.slice(i, j)
      if (!/^(\d+\.?\d*|\.\d+)$/.test(txt)) throw new AlgError(`Could not read the number "${txt}".`)
      const dot = txt.indexOf('.')
      const places = dot < 0 ? 0 : txt.length - dot - 1
      if (places > 6) throw new AlgError('Too many decimal places.')
      out.push({ t: 'num', v: fr(Number(txt.replace('.', '')), Math.pow(10, places)) })
      i = j
    } else if (/[a-z]/.test(c)) {
      let j = i
      while (j < s.length && /[a-z]/.test(s[j])) j++
      const run = s.slice(i, j)
      if (WORDS.test(run)) throw new AlgError('Functions such as sqrt, sin and π are not used here: only numbers, letters, + − × ÷ ^ and brackets.')
      for (const ch of run) out.push({ t: 'var', v: ch })
      i = j
    } else if ('+-*/()^'.includes(c)) { out.push({ t: 'op', v: c }); i++ }
    else if (c === '=') throw new AlgError('Type just the expression, without an equals sign.')
    else throw new AlgError(`Could not read "${c}".`)
  }
  return out
}

export function parse(src: string): Node {
  const toks = tokenize(src)
  let pos = 0
  const peek = () => toks[pos]
  const isOp = (v: string) => { const k = peek(); return k?.t === 'op' && k.v === v }
  const startsFactor = () => { const k = peek(); return !!k && (k.t === 'num' || k.t === 'var' || (k.t === 'op' && k.v === '(')) }

  function expr(): Node {
    let v = term()
    while (isOp('+') || isOp('-')) {
      const op = (toks[pos++] as { v: string }).v
      const r = term()
      v = { k: op === '+' ? 'add' : 'sub', a: v, b: r }
    }
    return v
  }
  function term(): Node {
    let v = implicit()
    for (;;) {
      if (isOp('*')) { pos++; v = { k: 'mul', a: v, b: implicit() } }
      else if (isOp('/')) {
        pos++
        const d = unary()
        if (startsFactor()) throw new AlgError('Use brackets for a fraction with a product underneath: write 1/(2x) or (1/2)x, not 1/2x.')
        v = { k: 'div', a: v, b: d }
      } else return v
    }
  }
  /** a product written side by side: 2x, xy, 3(x+1), (x+1)(x-1) */
  function implicit(): Node {
    let v = unary()
    while (startsFactor()) {
      const prev = toks[pos - 1]
      const next = peek()
      if (next.t === 'num') {
        throw new AlgError(prev?.t === 'var' || (prev?.t === 'op' && prev.v === ')')
          ? 'Write powers with ^, for example x^2 (not x2). Put numbers in front of letters: 2x.'
          : 'Two numbers side by side: use × or brackets.')
      }
      v = { k: 'mul', a: v, b: power() }
    }
    return v
  }
  function unary(): Node {
    if (isOp('-')) { pos++; return { k: 'neg', a: unary() } }
    if (isOp('+')) { pos++; return unary() }
    return power()
  }
  function power(): Node {
    const b = atom()
    if (isOp('^')) {
      pos++
      let neg = false
      let paren = false
      if (isOp('(')) { pos++; paren = true }
      if (isOp('-')) { pos++; neg = true } else if (isOp('+')) pos++
      const k = toks[pos++]
      if (!k || k.t !== 'num' || k.v.d !== 1) throw new AlgError('A power must be a whole number, like x^2 or x^(-1).')
      if (paren) { if (!isOp(')')) throw new AlgError('A bracket is not closed.'); pos++ }
      const e = neg ? -k.v.n : k.v.n
      if (isOp('^')) throw new AlgError('Use brackets for a power of a power: (x^2)^3.')
      return { k: 'pow', a: b, e }
    }
    return b
  }
  function atom(): Node {
    const k = toks[pos++]
    if (!k) throw new AlgError('The expression looks unfinished.')
    if (k.t === 'num') return { k: 'num', v: k.v }
    if (k.t === 'var') return { k: 'var', v: k.v }
    if (k.v === '(') {
      const v = expr()
      if (!isOp(')')) throw new AlgError('A bracket is not closed.')
      pos++
      return v
    }
    throw new AlgError(`Could not read "${k.v}" there.`)
  }

  if (!toks.length) throw new AlgError('Type an answer first.')
  const v = expr()
  if (pos < toks.length) throw new AlgError(`Could not read "${(toks[pos] as { v: unknown }).v as string}" there. Is a bracket or operator missing?`)
  return v
}

export function toRat(n: Node): Rat {
  switch (n.k) {
    case 'num': return rConst(n.v)
    case 'var': return { n: pVar(n.v), d: ONE }
    case 'neg': return rNeg(toRat(n.a))
    case 'add': return rAdd(toRat(n.a), toRat(n.b))
    case 'sub': return rSub(toRat(n.a), toRat(n.b))
    case 'mul': return rMul(toRat(n.a), toRat(n.b))
    case 'div': return rDiv(toRat(n.a), toRat(n.b))
    case 'pow': return rPow(toRat(n.a), n.e)
  }
}
export const parseRat = (src: string): Rat => toRat(parse(src))
export function parsePoly(src: string): Poly {
  const r = parseRat(src)
  if (!isConst(r.d)) throw new AlgError('That is not a polynomial.')
  return r.n
}

/** Numeric value of an expression for given variable values (used by tests and sanity checks). */
export function evalNode(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case 'num': return fNum(n.v)
    case 'var': return env[n.v] ?? NaN
    case 'neg': return -evalNode(n.a, env)
    case 'add': return evalNode(n.a, env) + evalNode(n.b, env)
    case 'sub': return evalNode(n.a, env) - evalNode(n.b, env)
    case 'mul': return evalNode(n.a, env) * evalNode(n.b, env)
    case 'div': return evalNode(n.a, env) / evalNode(n.b, env)
    case 'pow': return Math.pow(evalNode(n.a, env), n.e)
  }
}
export const evalExpr = (src: string, env: Record<string, number>) => evalNode(parse(src), env)

/* ------------------------------------------------------------------ factored form */

/** loose: some bracket still has a common number inside, like (6x - 9), so it is not completely factored */
export interface Factored { c: Frac; f: Map<string, { p: Poly; k: number }>; loose: boolean }

function mergeF(a: Factored, b: Factored): Factored {
  const f = new Map(a.f)
  for (const [key, x] of b.f) { const y = f.get(key); f.set(key, { p: x.p, k: (y?.k ?? 0) + x.k }) }
  return { c: fMul(a.c, b.c), f, loose: a.loose || b.loose }
}

/** Read an expression as constant × product of irreducible-looking factors (each normalised). */
export function factorsOf(n: Node): Factored {
  switch (n.k) {
    case 'num': return { c: n.v, f: new Map(), loose: false }
    case 'neg': { const x = factorsOf(n.a); return { c: fNeg(x.c), f: x.f, loose: x.loose } }
    case 'mul': return mergeF(factorsOf(n.a), factorsOf(n.b))
    case 'div': {
      const d = toRat(n.b)
      if (!isConst(d.n) || !isConst(d.d) || isZero(d.n)) throw new AlgError('A factored answer is a product: no variables in a denominator.')
      const x = factorsOf(n.a)
      return { c: fDiv(x.c, constOf(d.n)), f: x.f, loose: x.loose }
    }
    case 'pow': {
      if (n.e < 0) throw new AlgError('A factored answer is a product: no negative powers.')
      const x = factorsOf(n.a)
      const f = new Map<string, { p: Poly; k: number }>()
      for (const [key, v] of x.f) f.set(key, { p: v.p, k: v.k * n.e })
      return { c: fPow(x.c, n.e), f, loose: x.loose }
    }
    default: {
      const r = toRat(n)
      if (!isConst(r.d)) throw new AlgError('A factored answer is a product: no variables in a denominator.')
      if (isConst(r.n)) return { c: constOf(r.n), f: new Map(), loose: false }
      const { p, c } = prim(r.n)
      const unit = c.d === 1 && Math.abs(c.n) === 1
      return { c, f: new Map([[fmtPoly(p, true), { p, k: 1 }]]), loose: r.n.length > 1 && !unit }
    }
  }
}
export const sameFactored = (a: Factored, b: Factored) =>
  fEq(a.c, b.c) && a.f.size === b.f.size && [...a.f].every(([k, v]) => b.f.get(k)?.k === v.k)

/** Text for a factored product such as 3xy(2x - 3y)^2. Factors that are sums go in brackets. */
export function fmtFactored(x: Factored, ascii = true): string {
  const parts = [...x.f.entries()]
    .map(([key, v]) => ({ key, v }))
    .sort((a, b) => (a.v.p.length === 1 ? 0 : 1) - (b.v.p.length === 1 ? 0 : 1) || pDeg(a.v.p) - pDeg(b.v.p) || (a.key < b.key ? -1 : 1))
  const body = parts.map(({ v }) => {
    const mono = v.p.length === 1 && fEq(v.p[0].c, fr(1))
    const s = fmtPoly(v.p, ascii)
    const base = mono ? s : `(${s})`
    return v.k === 1 ? base : mono && !ascii ? s + sup(v.k) : `${base}${ascii ? '^' : ''}${ascii ? v.k : sup(v.k)}`
  }).join('')
  const c = x.c
  const cs = fEq(c, fr(1)) ? '' : fEq(c, fr(-1)) ? (ascii ? '-' : MINUS) : c.d === 1 ? `${c.n < 0 ? (ascii ? '-' : MINUS) : ''}${Math.abs(c.n)}` : `(${fmtFrac(c)})`
  return parts.length === 0 ? (cs === '' ? '1' : cs === '-' || cs === MINUS ? `${cs}1` : cs) : cs + body
}

/** a/b with brackets only where the parser or the reader needs them. */
export function fracStr(n: string, d: string): string {
  if (d === '1') return n
  const topSum = (s: string) => { let depth = 0; for (let i = 1; i < s.length; i++) { const ch = s[i]; if (ch === '(') depth++; else if (ch === ')') depth--; else if (depth === 0 && (ch === '+' || ch === '-' || ch === MINUS) && s[i - 1] === ' ') return true } return false }
  const nn = topSum(n) ? `(${n})` : n
  const dd = /^([a-z]|\d+)$/.test(d) ? d : `(${d})`
  return `${nn}/${dd}`
}

/* ------------------------------------------------------------------ rational roots and equations */

const divisors = (n: number): number[] => {
  const out: number[] = []
  for (let i = 1; i * i <= n; i++) if (n % i === 0) { out.push(i); if (i * i !== n) out.push(n / i) }
  return out.sort((a, b) => a - b)
}
const evalInt = (a: number[], r: Frac): bigint => {
  const n = a.length - 1
  const P = BigInt(r.n), Q = BigInt(r.d)
  let s = 0n
  for (let i = 0; i <= n; i++) s += BigInt(a[i]) * P ** BigInt(i) * Q ** BigInt(n - i)
  return s
}

/** Distinct rational roots of a one-variable polynomial. complete = all roots (with multiplicity) are rational. */
export function rationalRoots(p: Poly, v = 'x'): { roots: Frac[]; complete: boolean } {
  for (const t of p) for (const k in t.e) if (k !== v) throw new AlgError('Not a one-variable polynomial.')
  if (!p.length) return { roots: [], complete: false }
  const deg = degIn(p, v)
  const co: Frac[] = Array.from({ length: deg + 1 }, () => fr(0))
  for (const t of p) co[t.e[v] ?? 0] = t.c
  const toInts = (cs: Frac[]) => { let l = 1; for (const c of cs) l = lcmI(l, c.d); return cs.map((c) => (c.n * l) / c.d) }
  let a = toInts(co)
  const roots: Frac[] = []
  const add = (r: Frac) => { if (!roots.some((x) => fEq(x, r))) roots.push(r) }
  const done = (complete: boolean) => ({ roots: roots.sort((x, y) => fNum(x) - fNum(y)), complete })
  while (a.length > 1 && a[0] === 0) { add(fr(0)); a = a.slice(1) }
  while (a.length > 1) {
    const lead = Math.abs(a[a.length - 1]), cst = Math.abs(a[0])
    if (cst > 1e9 || lead > 1e9) return done(false)
    let found: Frac | null = null
    outer: for (const q of divisors(lead)) for (const pp of divisors(cst)) for (const s of [1, -1]) {
      const r = fr(s * pp, q)
      if (evalInt(a, r) === 0n) { found = r; break outer }
    }
    if (!found) return done(false)
    add(found)
    // synthetic division by (x - found)
    const n = a.length - 1
    const b: Frac[] = new Array(n)
    b[n - 1] = fr(a[n])
    for (let i = n - 1; i >= 1; i--) b[i - 1] = fAdd(fr(a[i]), fMul(found, b[i]))
    a = toInts(b)
  }
  return done(true)
}

export interface Solution { identity: boolean; roots: Frac[]; extraneous: Frac[]; complete: boolean }
/** Solve lhs = rhs for v: clear denominators over their LCD, then reject roots that make a denominator zero. */
export function solveEquation(lhs: Rat, rhs: Rat, v = 'x'): Solution {
  // combine over a common denominator (the LCD when one divides the other), so only genuine candidates appear
  const N = rSub(lhs, rhs).n
  if (!N.length) return { identity: true, roots: [], extraneous: [], complete: true }
  const { roots, complete } = rationalRoots(N, v)
  const bad = (r: Frac) => [lhs.d, rhs.d].some((d) => fIsZero(pEvalFrac(d, { [v]: r })))
  return { identity: false, roots: roots.filter((r) => !bad(r)), extraneous: roots.filter(bad), complete }
}

/* ------------------------------------------------------------------ answer checking */

export type AlgMode = 'poly' | 'factor' | 'rational' | 'equiv'
export interface AlgSpec {
  mode: AlgMode
  /** the expression the question starts from, in parseable ASCII (tests check it equals the answer) */
  source: string
  /** a correct answer in parseable ASCII */
  answer: string
  /** equiv mode: the letter being solved for (must not appear in the answer) */
  solveFor?: string
  /** the answer must be written with positive exponents only (no x^(-2)) */
  positiveOnly?: boolean
}
export interface AlgCheck { ok: boolean; invalid?: boolean; note?: string }

function isNumeric(n: Node): boolean {
  switch (n.k) {
    case 'num': return true
    case 'neg': return isNumeric(n.a)
    case 'mul': case 'div': case 'add': case 'sub': return isNumeric(n.a) && isNumeric(n.b)
    case 'pow': return isNumeric(n.a)
    default: return false
  }
}
function isMonomial(n: Node): boolean {
  switch (n.k) {
    case 'num': case 'var': return true
    case 'neg': return isMonomial(n.a)
    case 'mul': return isMonomial(n.a) && isMonomial(n.b)
    case 'div': return isMonomial(n.a) && isNumeric(n.b)
    case 'pow': return (n.a.k === 'var' || n.a.k === 'num') && n.e >= 0
    default: return false
  }
}
function sumTerms(n: Node): Node[] { return n.k === 'add' || n.k === 'sub' ? [...sumTerms(n.a), ...sumTerms(n.b)] : [n] }
/** expanded = a sum of single terms with like terms already collected */
export const looksExpanded = (n: Node, termCount: number) => { const ts = sumTerms(n); return ts.every(isMonomial) && ts.length <= Math.max(termCount, 1) }

export function checkAlgebra(spec: AlgSpec, raw: string): AlgCheck {
  let text = raw.trim()
  const lead = /^([a-z])\s*(\([a-z, ]*\))?\s*=(?!=)/i.exec(text)
  if (lead && text.indexOf('=') === text.lastIndexOf('=')) text = text.slice(lead[0].length)
  let node: Node, student: Rat, expected: Rat
  try { node = parse(text); student = toRat(node) } catch (e) {
    return { ok: false, invalid: true, note: e instanceof AlgError ? e.message : 'Could not read that expression.' }
  }
  const expectedNode = parse(spec.answer)
  expected = toRat(expectedNode)
  if (spec.positiveOnly && /\^\s*\(?\s*[-−]|⁻/.test(raw)) return { ok: false, note: 'Write the answer with positive exponents only: a power with a negative exponent moves to the other side of the fraction bar and the exponent changes sign.' }

  if (spec.mode === 'equiv') {
    if (spec.solveFor && rVars(student).has(spec.solveFor)) return { ok: false, note: `Your answer still contains ${spec.solveFor}. Get ${spec.solveFor} on its own.` }
    return { ok: rEq(student, expected) }
  }

  if (spec.mode === 'poly') {
    if (!rEq(student, expected)) return { ok: false, note: 'That is not equal to the original expression. Check each term and every sign.' }
    if (!looksExpanded(node, expected.n.length)) return { ok: false, note: 'It is equal, but not finished: remove all brackets and collect like terms.' }
    return { ok: true }
  }

  if (spec.mode === 'factor') {
    let sf: Factored
    try { sf = factorsOf(node) } catch (e) { return { ok: false, invalid: true, note: e instanceof AlgError ? e.message : 'Write the answer as a product of factors.' } }
    if (sameFactored(sf, factorsOf(expectedNode)) && !sf.loose) return { ok: true }
    if (rEq(student, expected)) {
      if (sf.loose && sameFactored(sf, factorsOf(expectedNode))) return { ok: false, note: 'Almost: a bracket still has a common number inside it. Take that out to the front.' }
      const count = [...sf.f.values()].reduce((s, v) => s + v.k, 0)
      return { ok: false, note: count <= 1 ? 'That equals the original but it is not factored: write it as a product of brackets.' : 'Those factors multiply back to the original, but it is not fully factored: a bracket can still be factored, or a common factor is still inside.' }
    }
    return { ok: false, note: 'Multiply your answer out: it does not give the original expression.' }
  }

  // rational: equal as a function, in a single fraction with no common factor left
  if (!rEq(student, expected)) return { ok: false, note: 'That is not equivalent to the original expression. Recheck the working.' }
  if (!proportional(student.d, expected.d)) {
    return { ok: false, note: 'It is equal in value, but not in simplest form: write one fraction and cancel every common factor.' }
  }
  return { ok: true }
}
