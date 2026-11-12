import { describe, expect, it } from 'vitest'
import { evaluate } from './parse'
import {
  complement, fmtIntervals, fmtPlusMinus, fmtRoot, fmtSet, inSet, intersect, normalise, parseSet, quadRoots, rootInput, rootValue,
  setsEqual, signSet, solveSystem, solveSystem3, systemKind, union, vertex, WHOLE_LINE,
} from './solve'

describe('quadratic roots', () => {
  it('finds exact roots and forms them correctly', () => {
    const q = quadRoots(1, -4, 1)
    expect(q.disc).toBe(12)
    expect(q.roots.map(fmtRoot)).toEqual(['2 − √3', '2 + √3'])
    expect(fmtPlusMinus(1, -4, 1)).toBe('2 ± √3')
    expect(fmtPlusMinus(2, 3, -1)).toBe('(−3 ± √17)/4')
    expect(fmtPlusMinus(1, 0, -9)).toBe('±3')
    expect(fmtPlusMinus(1, 0, -8)).toBe('±2√2')
    expect(fmtPlusMinus(4, 4, -3)).toBe('(−1 ± 2)/2')
    expect(quadRoots(2, -3, -2).roots.map(fmtRoot)).toEqual(['−1/2', '2'])
    expect(quadRoots(1, 2, 1).roots.map(fmtRoot)).toEqual(['−1'])
    expect(quadRoots(4, -12, 9).roots.map(fmtRoot)).toEqual(['3/2'])
    expect(quadRoots(1, 0, 1).roots).toEqual([])
  })
  it('every root satisfies the equation and its typed form reads back', () => {
    for (let a = -4; a <= 4; a++) for (let b = -9; b <= 9; b++) for (let c = -9; c <= 9; c++) {
      if (!a) continue
      const q = quadRoots(a, b, c)
      for (const r of q.roots) {
        const x = rootValue(r)
        expect(Math.abs(a * x * x + b * x + c), `${a} ${b} ${c}`).toBeLessThan(1e-9)
        expect(Math.abs(evaluate(rootInput(r)) - x), `${a} ${b} ${c}: ${rootInput(r)}`).toBeLessThan(1e-9)
      }
      // the (p ± q√r)/d form, both signs, gives the same two roots
      const pm = fmtPlusMinus(a, b, c)
      if (pm) {
        const vals = [pm.replace('±', '+'), pm.replace('±', '−')].map((t) => evaluate(t.replace(/^\+/, ''))).sort((m, n) => m - n)
        expect(vals.map((v) => Number(v.toFixed(9))), `${a} ${b} ${c}: ${pm}`).toEqual(q.roots.map((r) => Number(rootValue(r).toFixed(9))))
      }
    }
  })
  it('vertex is exact', () => {
    const v = vertex(2, -4, 5)
    expect([v.x.n, v.x.d, v.y.n, v.y.d]).toEqual([1, 1, 3, 1])
  })
})

describe('interval sets', () => {
  it('reads inequalities and interval notation to the same set', () => {
    const same = (a: string, b: string) => expect(setsEqual(parseSet(a), parseSet(b)), `${a} vs ${b}`).toBe(true)
    same('x < -2 or x >= 3', '(-inf, -2) U [3, inf)')
    same('x ≤ 4', '(-∞, 4]')
    same('3 < x', 'x > 3')
    same('-1 < x <= 4', '(-1, 4]')
    same('4 >= x > -1', '(-1, 4]')
    same('x >= 1/2', '[0.5, infinity)')
    same('x < -sqrt(2) or x > sqrt(2)', '(-inf, -sqrt(2)) ∪ (sqrt(2), inf)')
    same('x < 1, x > 5', 'x < 1 or x > 5')
    same('all real numbers', '(-inf, inf)')
    same('no solution', '∅')
    same('x = 3', '{3}')
    same('x < 3 or x < 5', 'x < 5')
    same('x <= 2 or x >= 2', 'all real numbers')
  })
  it('reads exclusions: not-equal, "and", and "all reals except"', () => {
    const same = (a: string, b: string) => expect(setsEqual(parseSet(a), parseSet(b)), `${a} vs ${b}`).toBe(true)
    same('x != 2', 'x < 2 or x > 2')
    same('x ≠ 2', '(-inf, 2) U (2, inf)')
    same('x ≠ 2 and x ≠ -2', 'x < -2 or -2 < x < 2 or x > 2')
    same('x != 2, x != -2', 'x < -2 or -2 < x < 2 or x > 2')
    same('all real numbers except 3', 'x != 3')
    same('all reals except -1, 4', 'x != -1 and x != 4')
    same('x >= 1 and x < 5', '[1, 5)')
    same('x > -1 and x != 2', '-1 < x < 2 or x > 2')
    expect(inSet(parseSet('x != 2'), 2)).toBe(false)
    expect(inSet(parseSet('x != 2'), 2.0001)).toBe(true)
  })
  it('tells different sets apart, including open versus closed ends', () => {
    const diff = (a: string, b: string) => expect(setsEqual(parseSet(a), parseSet(b)), `${a} vs ${b}`).toBe(false)
    diff('x < 3', 'x <= 3')
    diff('x > 3', 'x < 3')
    diff('-1 < x < 4', '-1 <= x < 4')
    diff('x < -2 or x > 3', '-2 < x < 3')
    diff('x < 3', 'all real numbers')
  })
  it('rejects things that are not sets', () => {
    for (const bad of ['', 'banana', 'x +', '3 < 4', 'x < y', '1 < x > 3', '(5, 2)']) expect(() => parseSet(bad), bad).toThrow()
  })
  it('round-trips through fmtSet and fmtIntervals', () => {
    const sets = ['x < -2 or x >= 3', '-1 < x <= 4', 'x >= 7', 'x = 2', 'all real numbers', 'no solution', 'x <= -3 or x = 0 or x > 5']
    for (const t of sets) {
      const s = parseSet(t)
      expect(setsEqual(parseSet(fmtSet(s)), s), `${t} -> ${fmtSet(s)}`).toBe(true)
      const iv = fmtIntervals(s).replace(/−/g, '-').replace(/∞/g, 'inf')
      expect(setsEqual(parseSet(iv), s), `${t} -> ${iv}`).toBe(true)
    }
    expect(fmtSet(parseSet('3<x'))).toBe('x > 3')
    expect(fmtIntervals(parseSet('x < -2 or x >= 3'))).toBe('(−∞, −2) ∪ [3, ∞)')
  })
  it('set algebra', () => {
    const a = parseSet('x < 3'), b = parseSet('x >= 1')
    expect(fmtSet(intersect(a, b))).toBe('1 ≤ x < 3')
    expect(fmtSet(union(a, b))).toBe('all real numbers')
    expect(fmtSet(complement(parseSet('-1 < x <= 4')))).toBe('x ≤ -1 or x > 4'.replace(/-/g, '−'))
    expect(inSet(parseSet('-1 < x <= 4'), 4)).toBe(true)
    expect(inSet(parseSet('-1 < x <= 4'), -1)).toBe(false)
    expect(normalise(WHOLE_LINE).length).toBe(1)
  })
  it('sign sets of quadratics match brute force', () => {
    for (let a = -3; a <= 3; a++) for (let b = -6; b <= 6; b++) for (let c = -6; c <= 6; c++) {
      if (!a) continue
      const f = (x: number) => a * x * x + b * x + c
      const crit = quadRoots(a, b, c).roots.map(rootValue)
      for (const op of ['<', '<=', '>', '>='] as const) {
        const set = signSet(f, crit, op)
        for (let x = -12; x <= 12; x += 0.25) {
          const v = f(x)
          const want = op === '<' ? v < -1e-9 : op === '<=' ? v <= 1e-9 : op === '>' ? v > 1e-9 : v >= -1e-9
          expect(inSet(set, x), `${a}x²+${b}x+${c} ${op} 0 at ${x}`).toBe(want)
        }
      }
    }
  })
})

describe('linear systems', () => {
  it('solves 2 x 2 exactly', () => {
    const s = solveSystem({ a1: 2, b1: 3, c1: 7, a2: 1, b2: -1, c2: 1 })!
    expect([s.x.n / s.x.d, s.y.n / s.y.d]).toEqual([2, 1])
    expect(solveSystem({ a1: 1, b1: 2, c1: 3, a2: 2, b2: 4, c2: 6 })).toBeNull()
    expect(systemKind({ a1: 1, b1: 2, c1: 3, a2: 2, b2: 4, c2: 6 })).toBe('infinite')
    expect(systemKind({ a1: 1, b1: 2, c1: 3, a2: 2, b2: 4, c2: 7 })).toBe('none')
    const f = solveSystem({ a1: 3, b1: 2, c1: 1, a2: 2, b2: 5, c2: 4 })!
    expect([f.x.n, f.x.d, f.y.n, f.y.d]).toEqual([-3, 11, 10, 11])
  })
  it('solves 3 x 3 with Cramer', () => {
    const s = solveSystem3([[1, 1, 1, 6], [0, 2, 5, -4], [2, 5, -1, 27]])!
    expect([s.x, s.y, s.z].map((f) => f.n / f.d)).toEqual([5, 3, -2])
    expect(solveSystem3([[1, 2, 3, 1], [2, 4, 6, 2], [1, 0, 1, 1]])).toBeNull()
  })
})
