import { isDerivative, numDeriv, numLimit } from './calculus'
import { describe, expect, it } from 'vitest'
import { evalExpr, parseRat, rEq } from './algebra'
import { evaluate } from './parse'
import { valueAt } from './trigAlgebra'
import { parseSet, setsEqual } from './solve'
import { buildBoard, DECKS, judgeClicks, matchStars, rootRound, rootValue, sprintScore, survivalLevel } from './games'

describe('match-up decks', () => {
  it('every deck builds a full board of unique tiles with one partner each', () => {
    for (const d of DECKS) for (let s = 1; s <= 60; s++) {
      const board = buildBoard(d.id, 6, s * 101)
      expect(board.length, `${d.id} seed ${s}`).toBe(12)
      expect(new Set(board.map((t) => t.text)).size, `${d.id} seed ${s}: duplicate text`).toBe(12)
      const counts = new Map<number, number>()
      board.forEach((t) => counts.set(t.pair, (counts.get(t.pair) ?? 0) + 1))
      expect([...counts.values()].every((c) => c === 2)).toBe(true)
    }
  })
  it('degrees/radians pairs really are the same angle', () => {
    for (let s = 1; s <= 40; s++) {
      const board = buildBoard('degrees-radians', 6, s)
      for (let p = 0; p < 6; p++) {
        const [a, b] = board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key))
        const deg = Number(a.text.replace('°', '').replace('−', '-'))
        const rad = eval(b.text.replace('−', '-').replace(/π/g, '*Math.PI').replace(/^\*/, '1*').replace(/(\d)\*Math/, '$1*Math') ) as number
        expect(Math.abs((deg * Math.PI) / 180 - rad), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
      }
    }
  })
  it('expand/factor pairs are equal polynomials', () => {
    for (let s = 1; s <= 60; s++) {
      const board = buildBoard('expand-factor', 6, s * 7)
      for (let p = 0; p < 6; p++) {
        const [a, b] = board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key))
        const asc = (t: string) => t.replace(/−/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^${[...m].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')}`)
        expect(rEq(parseRat(asc(a.text)), parseRat(asc(b.text))), `${a.text} vs ${b.text}`).toBe(true)
        expect(evalExpr(asc(a.text), { x: 2 })).toBeCloseTo(evalExpr(asc(b.text), { x: 2 }))
      }
    }
  })
})

const ascii = (t: string) => t.replace(/−/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^${[...m].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')}`)

describe('unit 3 decks', () => {
  it('inequality and interval pairs describe the same set', () => {
    for (let s = 1; s <= 80; s++) {
      const board = buildBoard('interval-notation', 6, s * 3)
      for (let p = 0; p < 6; p++) {
        const [a, b] = board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key))
        const iv = b.text.replace(/−/g, '-').replace(/∞/g, 'inf')
        expect(setsEqual(parseSet(a.text), parseSet(iv)), `${a.text} vs ${b.text}`).toBe(true)
      }
    }
  })
  it('each quadratic pairs with its own two roots', () => {
    for (let s = 1; s <= 80; s++) {
      const board = buildBoard('quadratic-roots', 6, s * 5)
      for (let p = 0; p < 6; p++) {
        const [a, b] = board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key))
        const roots = ascii(b.text).replace('x = ', '').split(', ').map(Number)
        const [lhs, rhs] = ascii(a.text).split(' = ')
        expect(roots.length).toBe(2)
        for (const x of roots) expect(Math.abs(evalExpr(lhs, { x }) - evalExpr(rhs, { x })), `${a.text} at x = ${x}`).toBeLessThan(1e-9)
      }
    }
  })
})

describe('unit 4 decks', () => {
  const pairs = (deck: string, seed: number) => {
    const board = buildBoard(deck, 6, seed)
    return [0, 1, 2, 3, 4, 5].map((p) => board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key)))
  }
  it('roots pair with their simplest form', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('radical-simplify', s * 3)) expect(Math.abs(evaluate(a.text) - evaluate(b.text)), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
  })
  it('powers pair with their values', () => {
    const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
    const plain = (t: string) => t.replace(/⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^(${m.startsWith('⁻') ? '-' : ''}${[...m.replace('⁻', '')].map((c) => SUP.indexOf(c)).join('')})`)
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('exponent-values', s * 5)) expect(Math.abs(evaluate(plain(a.text)) - evaluate(b.text)), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
  })
  it('logarithms pair with their values', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('log-values', s * 7)) {
      const m = /^log([₀-₉]+) (.*)$/.exec(a.text)!
      const base = Number([...m[1]].map((c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).join(''))
      const arg = evaluate(m[2].replace(/[()]/g, ''))
      expect(Math.abs(Math.log(arg) / Math.log(base) - evaluate(b.text)), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
    }
  })
})

describe('unit 5 decks', () => {
  it('each linear function pairs with its true inverse', () => {
    for (let s = 1; s <= 80; s++) {
      const board = buildBoard('inverse-pairs', 6, s * 9)
      for (let p = 0; p < 6; p++) {
        const [a, b] = board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key))
        const f = ascii(a.text.replace('f(x) = ', '')), g = ascii(b.text)
        for (const x of [-3, 0.5, 2, 7]) {
          const inner = evalExpr(f, { x })
          expect(Math.abs(evalExpr(g.replace(/x/g, `(${inner})`), {}) - x), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
        }
      }
    }
  })
  it('each transformation pairs with its description', () => {
    // an independent translator from the description to the equation, checked numerically on f(x) = x^2 + x
    const f = (x: number) => x * x + x
    const fromWords = (w: string): ((x: number) => number) => {
      let m: RegExpExecArray | null
      if ((m = /^shift right (\d+)$/.exec(w))) return (x) => f(x - Number(m![1]))
      if ((m = /^shift left (\d+)$/.exec(w))) return (x) => f(x + Number(m![1]))
      if ((m = /^shift up (\d+)$/.exec(w))) return (x) => f(x) + Number(m![1])
      if ((m = /^shift down (\d+)$/.exec(w))) return (x) => f(x) - Number(m![1])
      if ((m = /^stretch vertically, factor (\d+)$/.exec(w))) return (x) => Number(m![1]) * f(x)
      if ((m = /^squeeze horizontally, factor (\d+)$/.exec(w))) return (x) => f(Number(m![1]) * x)
      if (w === 'reflect in the x-axis') return (x) => -f(x)
      if (w === 'reflect in the y-axis') return (x) => f(-x)
      throw new Error(w)
    }
    const fromEq = (e: string): ((x: number) => number) => {
      const body = e.replace('y = ', '').replace(/−/g, '-')
      return (x) => {
        let m: RegExpExecArray | null
        if ((m = /^f\(x ([+-]) (\d+)\)$/.exec(body))) return f(x + (m[1] === '+' ? 1 : -1) * Number(m[2]))
        if ((m = /^f\(x\) ([+-]) (\d+)$/.exec(body))) return f(x) + (m[1] === '+' ? 1 : -1) * Number(m[2])
        if ((m = /^(\d+)f\(x\)$/.exec(body))) return Number(m[1]) * f(x)
        if ((m = /^f\((\d+)x\)$/.exec(body))) return f(Number(m[1]) * x)
        if (body === '-f(x)') return -f(x)
        if (body === 'f(-x)') return f(-x)
        throw new Error(e)
      }
    }
    for (let s = 1; s <= 80; s++) {
      const board = buildBoard('transform-words', 6, s * 11)
      for (let p = 0; p < 6; p++) {
        const [a, b] = board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key))
        for (const x of [-2, 0, 1.5, 3]) expect(fromEq(a.text)(x), `${a.text} vs ${b.text}`).toBeCloseTo(fromWords(b.text)(x))
      }
    }
  })
})

describe('unit 6 decks', () => {
  const pairs = (deck: string, seed: number) => {
    const board = buildBoard(deck, 6, seed)
    return [0, 1, 2, 3, 4, 5].map((p) => board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key)))
  }
  it('identities pair equal expressions', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('trig-identities', s * 3)) {
      for (const t of [0.37, 1.23, 2.51, 4.07]) {
        const u = valueAt(a.text, t), v = valueAt(b.text, t)
        if (Number.isFinite(u) && Number.isFinite(v)) expect(Math.abs(u - v), `${a.text} vs ${b.text} at ${t}`).toBeLessThan(1e-9)
      }
    }
  })
  it('compound-angle values are right', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('compound-values', s * 5)) {
      const m = /^(sin|cos|tan) (\d+)°$/.exec(a.text)!
      const x = (Math.PI * Number(m[2])) / 180
      const want = m[1] === 'sin' ? Math.sin(x) : m[1] === 'cos' ? Math.cos(x) : Math.tan(x)
      expect(Math.abs(evaluate(b.text.replace(/−/g, '-').replace(/√(\d+)/g, 'sqrt($1)')) - want), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
    }
  })
  it('periods are right', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('trig-periods', s * 7)) {
      const m = /^y = (sin|cos|tan) ?\(?(?:(\d+)x\/(\d+)|x\/(\d+)|(\d+)x)\)?$/.exec(a.text)!
      const fn = m[1], bn = m[2] ? Number(m[2]) / Number(m[3]) : m[4] ? 1 / Number(m[4]) : Number(m[5])
      const period = (fn === 'tan' ? Math.PI : 2 * Math.PI) / bn
      expect(Math.abs(evaluate(b.text) - period), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
    }
  })
})

describe('unit 7 decks', () => {
  const pairs = (deck: string, seed: number) => {
    const board = buildBoard(deck, 6, seed)
    return [0, 1, 2, 3, 4, 5].map((p) => board.filter((t) => t.pair === p).sort((x, y) => x.key.localeCompare(y.key)))
  }
  it('binomial values are right', () => {
    const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('binomial-values', s * 3)) { const m = /^(\d+)C(\d+)$/.exec(a.text)!; expect(choose(Number(m[1]), Number(m[2])), a.text).toBe(Number(b.text)) }
  })
  it('series sums are right', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('series-sums', s * 5)) {
      const m = /^(\d+) \+ (\d+) \+ \d+ \+ … \((\d+) terms\)$/.exec(a.text)!
      const first = Number(m[1]), d = Number(m[2]) - first, n = Number(m[3])
      let t = 0; for (let k = 0; k < n; k++) t += first + k * d
      expect(t, a.text).toBe(Number(b.text))
    }
  })
  it('limits are right', () => {
    for (let s = 1; s <= 80; s++) for (const [a, b] of pairs('sequence-limits', s * 7)) {
      const m = /^\((\d+)n [+−] \d+\) \/ \((\d+)n [+−] \d+\)$/.exec(a.text)!
      const lim = Number(m[1]) / Number(m[2])
      const big = 1e9, v = ((Number(m[1]) * big) / (Number(m[2]) * big))
      expect(Math.abs(lim - v)).toBeLessThan(1e-9)
      const [num, den] = b.text.includes('/') ? b.text.split('/').map(Number) : [Number(b.text), 1]
      expect(Math.abs(num / den - lim), `${a.text} vs ${b.text}`).toBeLessThan(1e-9)
    }
  })
})

describe('scoring', () => {
  it('rewards streaks and rises in level', () => {
    expect(sprintScore(10, 2)).toBe(100)
    expect(sprintScore(10, 6)).toBe(108)
    expect([0, 4, 5, 9, 10, 40].map(survivalLevel)).toEqual([1, 1, 2, 2, 3, 3])
    expect(matchStars(6, 6)).toBe(3)
    expect(matchStars(9, 6)).toBe(3)
    expect(matchStars(10, 6)).toBe(2)
    expect(matchStars(15, 6)).toBe(2)
    expect(matchStars(16, 6)).toBe(1)
  })
})

describe('root hunter', () => {
  it('rounds have the right number of distinct roots, and the graph fits the window', () => {
    for (const d of [1, 2, 3] as const) for (let s = 1; s <= 80; s++) {
      const r = rootRound(d, s * 31)
      expect(r.roots.length).toBe(d + 1)
      expect(new Set(r.roots).size).toBe(r.roots.length)
      r.roots.forEach((x) => expect(Math.abs(rootValue(r, x))).toBeLessThan(1e-9))
      expect(r.roots.every((x, i) => i === 0 || x - r.roots[i - 1] >= 2)).toBe(true)
      // the first hump between roots is tall enough to see
      const mid = (r.roots[0] + r.roots[1]) / 2
      expect(Math.abs(rootValue(r, mid))).toBeGreaterThan(0.5)
      expect(Number.isFinite(r.k) && r.k !== 0).toBe(true)
    }
  })
  it('judges clicks', () => {
    expect(judgeClicks([-2, 3], [-2.1, 3.2]).ok).toBe(true)
    expect(judgeClicks([-2, 3], [-2, -2]).ok).toBe(false)
    expect(judgeClicks([-2, 3], [-2, 3, 0]).stray).toEqual([0])
    expect(judgeClicks([-2, 3], [-2.5, 3]).found).toEqual([3])
  })
})

describe('unit 8 decks', () => {
  const pairs = (deck: string, seed: number) => {
    const board = buildBoard(deck, 6, seed)
    return [0, 1, 2, 3, 4, 5].map((q) => board.filter((t) => t.pair === q).sort((x, y) => x.key.localeCompare(y.key)))
  }
  const num = (t: string) => Number(t.replace('−', '-'))
  it('complex products are right', () => {
    const parse = (t: string): [number, number] => {
      const m = /^(?:(−?\d+)(?=[+−]))?([+−]?)(\d*)i$/.exec(t.replace(/ /g, ''))!
      const mag = m[3] === '' ? 1 : Number(m[3])
      return [m[1] ? num(m[1]) : 0, m[2] === '−' ? -mag : mag]
    }
    for (let s = 1; s <= 60; s++) for (const [a, b] of pairs('complex-products', s * 11)) {
      const m = /^\((.+)\)\((.+)\)$/.exec(a.text)!
      const z = parse(m[1]), w = parse(m[2]), p = parse(b.text)
      expect([z[0] * w[0] - z[1] * w[1] + 0, z[0] * w[1] + z[1] * w[0] + 0], a.text).toEqual(p)
    }
  })
  it('dot and cross products are right', () => {
    const vec = (t: string) => t.slice(1, -1).split(', ').map(num)
    for (let s = 1; s <= 60; s++) {
      for (const [a, b] of pairs('dot-products', s * 13)) {
        const [x, y] = a.text.split(' · ').map(vec)
        expect(x.reduce((t, e, j) => t + e * y[j], 0), a.text).toBe(num(b.text))
      }
      for (const [a, b] of pairs('cross-products', s * 17)) {
        const [p, q] = a.text.split(' × ').map(vec)
        expect([p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]].map((e) => e + 0), a.text).toEqual(vec(b.text))
      }
    }
  })
})

describe('unit 9 decks', () => {
  it('derivative pairs are right', async () => {
    const { derivativePool } = await import('./games')
    const { mulberry } = await import('./rng')
    for (let sd = 1; sd <= 6; sd++) for (const [f, d] of derivativePool(mulberry(sd))) expect(isDerivative(f, d, 1, /sqrt|ln/.test(f)), `${f} -> ${d}`).toBe(true)
  })
  it('limits are right', async () => {
    const { limitPool } = await import('./games')
    const { mulberry } = await import('./rng')
    const { evaluate } = await import('./parse')
    for (let sd = 1; sd <= 6; sd++) for (const [f, v, at] of limitPool(mulberry(sd))) {
      const want = v.includes('/') ? v.split('/').map(Number).reduce((x, y) => x / y) : Number(v)
      const a = at.endsWith('∞') ? 0 : Number(at.slice(4))
      const got = numLimit(f, a, at.endsWith('∞') ? 'inf' : 'both')
      expect(got, `${at} ${f}`).not.toBeNull()
      expect(Math.abs((got as number) - want), `${at} ${f} = ${v}`).toBeLessThan(3e-3 * (1 + Math.abs(want)))
      void evaluate
    }
  })
  it('tangent gradients are right', async () => {
    const { tangentPool } = await import('./games')
    const { mulberry } = await import('./rng')
    for (let sd = 1; sd <= 6; sd++) for (const [t, v] of tangentPool(mulberry(sd))) {
      const [f, at] = t.split(' at x=')
      expect(Math.abs(numDeriv(f, Number(at)) - Number(v)), t).toBeLessThan(1e-2)
    }
  })
})

describe('unit 10 decks', () => {
  const val = (t: string) => (t.includes('/') ? t.split('/').map(Number).reduce((x, y) => x / y) : Number(t))
  it('antiderivatives are right', async () => {
    const { antiPool } = await import('./games')
    const { mulberry } = await import('./rng')
    for (let sd = 1; sd <= 5; sd++) for (const [f, F] of antiPool(mulberry(sd))) expect(isDerivative(F, f, 1, /ln/.test(F)), `${F} -> ${f}`).toBe(true)
  })
  it('definite integrals and areas are right', async () => {
    const { defPool, areaPool } = await import('./games')
    const { mulberry } = await import('./rng')
    const { simpson } = await import('./calculus')
    for (let sd = 1; sd <= 5; sd++) {
      for (const [f, a, b, v] of defPool(mulberry(sd))) expect(Math.abs(simpson(f, a, b, 200) - val(v)), `${f} ${a}..${b}`).toBeLessThan(1e-4)
      for (const [d, v, f, a, b] of areaPool(mulberry(sd))) expect(Math.abs(simpson(f, a, b, 200) - val(v)), d).toBeLessThan(1e-4)
    }
  })
  it('the decks build', () => {
    for (const id of ['antiderivative-pairs', 'definite-values', 'area-values']) for (let s = 1; s <= 30; s++) { const b = buildBoard(id, 6, s * 13); expect(b.length).toBe(12); expect(new Set(b.map((t) => t.text)).size).toBe(12) }
  })
})

describe('unit 11 decks', () => {
  it('series sums are right (numerically)', async () => {
    const { seriesSumPool } = await import('./games')
    const { mulberry } = await import('./rng')
    const val = (t: string) => (t.includes('/') ? t.split('/').map(Number).reduce((x, y) => x / y) : Number(t))
    for (let sd = 1; sd <= 4; sd++) for (const [t, v] of seriesSumPool(mulberry(sd))) {
      let s = 0
      let m = /Σ \(n ≥ 0\) of (\d+)\(1\/(\d+)\)ⁿ/.exec(t)
      if (m) { for (let n = 0; n < 400; n++) s += Number(m[1]) * (1 / Number(m[2])) ** n }
      else if ((m = /Σ \(n ≥ 1\) of 1\/\(n\(n \+ (\d+)\)\)/.exec(t))) { for (let n = 1; n <= 200000; n++) s += 1 / (n * (n + Number(m[1]))) }
      else if ((m = /Σ \(n ≥ 1\) of (\d+)\/(\d+)ⁿ/.exec(t))) { for (let n = 1; n < 400; n++) s += Number(m[1]) / Number(m[2]) ** n }
      else throw new Error(t)
      expect(Math.abs(s - val(v)), `${t} = ${v}`).toBeLessThan(1e-3)
    }
  })
  it('partial derivatives are right', async () => {
    const { partialPool } = await import('./games')
    const { mulberry } = await import('./rng')
    const { numPartial } = await import('./calculus')
    const { evaluate } = await import('./parse')
    for (let sd = 1; sd <= 3; sd++) for (const [f, d, v] of partialPool(mulberry(sd))) for (const [x, y] of [[0.7, 1.3], [1.2, 0.6], [1.9, 1.1]]) {
      expect(Math.abs(numPartial(f, v as 'x' | 'y', x, y) - evaluate(d, { x, y })), `${f} -> ${d}`).toBeLessThan(1e-3 * (1 + Math.abs(evaluate(d, { x, y }))))
    }
  })
  it('the decks build', () => {
    for (const id of ['series-sums-infinite', 'radii-convergence', 'partial-pairs']) for (let s = 1; s <= 30; s++) { const b = buildBoard(id, 6, s * 13); expect(b.length, id).toBe(12); expect(new Set(b.map((t) => t.text)).size, id).toBe(12) }
  })
})

describe('unit 12 decks', () => {
  it('determinants, characteristic roots and probabilities are right', async () => {
    const { detPool, odePool, probPool } = await import('./games')
    const { mulberry } = await import('./rng')
    for (let sd = 1; sd <= 4; sd++) {
      for (const [m, d] of detPool(mulberry(sd))) {
        const v = m.length === 2 ? m[0][0] * m[1][1] - m[0][1] * m[1][0] : m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
        expect(v).toBe(d)
      }
      for (const [b, c, p, q] of odePool(mulberry(sd))) { expect(p * p + b * p + c).toBe(0); expect(q * q + b * q + c).toBe(0) }
      for (const [t, v, f] of probPool(mulberry(sd))) { const [nn, dd] = v.includes('/') ? v.split('/').map(Number) : [Number(v), 1]; expect(Math.abs(f() - nn / dd), t).toBeLessThan(1e-12) }
    }
  })
  it('the decks build', () => {
    for (const id of ['determinant-values', 'characteristic-roots', 'probability-values']) for (let s = 1; s <= 30; s++) { const b = buildBoard(id, 6, s * 13); expect(b.length, id).toBe(12); expect(new Set(b.map((t) => t.text)).size, id).toBe(12) }
  })
})
