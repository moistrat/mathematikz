import { describe, expect, it } from 'vitest'
import { evalExpr, parseRat, rEq } from './algebra'
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
