/**
 * Reads what a student types as an answer: 5π/6, 5pi/6, √3/2, sqrt(3)/2, -1/2, 1/sqrt(2), 150°, 2.5 ...
 * Everything is evaluated to a number; "undefined" is recognised separately.
 */

export class ParseError extends Error {}

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string }

function tokenize(src: string): Tok[] {
  const s = src
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[×·⋅]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, ' pi ')
    .replace(/√/g, ' sqrt ')
    .replace(/∛/g, ' cbrt ')
    .replace(/°/g, '')
    .replace(/\s+/g, ' ')
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === ' ') { i++; continue }
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const v = Number(s.slice(i, j))
      if (!isFinite(v)) throw new ParseError('bad number')
      out.push({ t: 'num', v })
      i = j
    } else if (/[a-z]/.test(c)) {
      let j = i
      while (j < s.length && /[a-z]/.test(s[j])) j++
      out.push({ t: 'id', v: s.slice(i, j) })
      i = j
    } else if ('+-*/()^'.includes(c)) { out.push({ t: 'op', v: c }); i++ }
    else throw new ParseError(`unexpected "${c}"`)
  }
  return out
}

/** Evaluate an expression like "5pi/6" or "-sqrt(3)/2". Throws ParseError. */
export function evaluate(src: string): number {
  const toks = tokenize(src)
  let pos = 0
  const peek = () => toks[pos]
  const isOp = (v: string) => peek()?.t === 'op' && (peek() as { v: string }).v === v
  const startsFactor = () => {
    const k = peek()
    if (!k) return false
    if (k.t === 'num') return true
    if (k.t === 'id') return true
    return k.v === '('
  }

  function expr(): number {
    let v = term()
    while (isOp('+') || isOp('-')) {
      const op = (toks[pos++] as { v: string }).v
      const r = term()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  function term(): number {
    let v = unary()
    for (;;) {
      if (isOp('*')) { pos++; v *= unary() }
      else if (isOp('/')) { pos++; v /= unary() }
      else if (startsFactor()) v *= unary() // implicit multiplication: 2pi, 3sqrt(2)
      else return v
    }
  }
  function unary(): number {
    if (isOp('-')) { pos++; return -unary() }
    if (isOp('+')) { pos++; return unary() }
    return power()
  }
  function power(): number {
    const b = atom()
    if (isOp('^')) { pos++; return Math.pow(b, unary()) }
    return b
  }
  function atom(): number {
    const k = toks[pos++]
    if (!k) throw new ParseError('unexpected end')
    if (k.t === 'num') return k.v
    if (k.t === 'op') {
      if (k.v === '(') {
        const v = expr()
        if (!isOp(')')) throw new ParseError('missing )')
        pos++
        return v
      }
      throw new ParseError(`unexpected ${k.v}`)
    }
    if (k.v === 'pi') return Math.PI
    if (k.v === 'e') return Math.E
    if (k.v === 'cbrt') return Math.cbrt(power())
    if (k.v === 'ln' || k.v === 'log' || k.v === 'exp') {
      const v = power()
      return k.v === 'ln' ? Math.log(v) : k.v === 'log' ? Math.log10(v) : Math.exp(v)
    }
    if (k.v === 'sqrt' || k.v === 'root') {
      if (isOp('-')) throw new ParseError('sqrt of negative')
      const v = power()
      if (v < 0) throw new ParseError('sqrt of negative')
      return Math.sqrt(v)
    }
    if (k.v === 'rad' || k.v === 'deg' || k.v === 'degrees' || k.v === 'radians') return 1 // unit words are ignored
    throw new ParseError(`unknown word "${k.v}"`)
  }

  const v = expr()
  if (pos < toks.length) throw new ParseError('unexpected input')
  if (!isFinite(v)) throw new ParseError('not finite')
  return v
}

const UNDEFINED = /^(undefined|und|dne|d\.n\.e\.?|does not exist|doesn'?t exist|not defined|no value|infinity|inf|∞|none|no (horizontal |oblique |vertical )?asymptotes?)$/

export const saysUndefined = (text: string) => UNDEFINED.test(text.trim().toLowerCase())

/** "x = π/6" -> "π/6"; "(1/2, √3/2)" -> parts. */
export function stripLead(text: string): string {
  return text.trim().replace(/^[a-zθ]\s*=\s*/i, '')
}

/** Remove one pair of outer brackets, but only when they really wrap the whole text: "(1, 2)" yes, "1 + sqrt(2)" no. */
function unwrap(text: string): string {
  let t = text.trim()
  for (;;) {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
    const open = t[0]
    if (!(open in pairs) || t[t.length - 1] !== pairs[open]) return t
    let depth = 0
    for (let i = 0; i < t.length; i++) {
      if (t[i] === open) depth++
      else if (t[i] === pairs[open]) depth--
      if (depth === 0 && i < t.length - 1) return t // closed early: "(1+2)(3+4)"
    }
    t = t.slice(1, -1).trim()
  }
}

/** Split a list answer into evaluated numbers. Accepts commas, semicolons and "and"; brackets are ignored. */
export function parseList(text: string): number[] {
  const t = unwrap(stripLead(text)).replace(/\band\b/gi, ',')
  if (!t.trim()) throw new ParseError('empty')
  return t.split(/[,;]/).map((part) => {
    if (!part.trim()) throw new ParseError('empty item')
    return evaluate(part.replace(/^[a-zθ]\s*=\s*/i, ''))
  })
}
