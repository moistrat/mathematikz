import { describe, expect, it } from 'vitest'
import { evaluate } from './parse'
import { extractRoot, isKFree, radicalFormProblem, root, rootAdd, rootMul, rootSub } from './radicals'
import { fmtRoot, rootInput, rootValue } from './solve'

describe('extracting roots', () => {
  it('pulls out the largest square or cube', () => {
    expect(extractRoot(72)).toEqual({ outside: 6, inside: 2 })
    expect(extractRoot(50)).toEqual({ outside: 5, inside: 2 })
    expect(extractRoot(54, 3)).toEqual({ outside: 3, inside: 2 })
    expect(extractRoot(7)).toEqual({ outside: 1, inside: 7 })
    expect(extractRoot(81, 2)).toEqual({ outside: 9, inside: 1 })
    expect(isKFree(30)).toBe(true)
    expect(isKFree(12)).toBe(false)
    for (let n = 1; n <= 500; n++) for (const k of [2, 3]) {
      const { outside, inside } = extractRoot(n, k)
      expect(outside ** k * inside).toBe(n)
      expect(isKFree(inside, k)).toBe(true)
    }
  })
})

describe('exact arithmetic with a + b√r', () => {
  it('keeps radicals simplified and values right', () => {
    const x = root(2, 3, 3), y = root(4, -1, 3)
    expect(fmtRoot(rootMul(x, y))).toBe(fmtRoot(root(8 - 9, 12 - 2, 3)))
    expect(rootValue(rootMul(x, y))).toBeCloseTo((2 + 3 * Math.sqrt(3)) * (4 - Math.sqrt(3)))
    expect(fmtRoot(root(0, 1, 8))).toBe('2√2')
    expect(fmtRoot(root(1, 1, 4))).toBe('3')
    expect(rootValue(rootAdd(root(0, 3, 2), root(0, 5, 2)))).toBeCloseTo(8 * Math.SQRT2)
    expect(fmtRoot(rootSub(root(0, 5, 2), root(0, 4, 2)))).toBe('√2')
    expect(fmtRoot(rootMul(root(0, 1, 5), root(0, 1, 5)))).toBe('5')
    for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) for (const r of [2, 3, 5, 8, 12]) {
      const x = root(a, b, r), y = root(b, a, r)
      expect(rootValue(rootMul(x, y))).toBeCloseTo((a + b * Math.sqrt(r)) * (b + a * Math.sqrt(r)), 9)
      expect(Math.abs(evaluate(rootInput(x)) - (a + b * Math.sqrt(r)))).toBeLessThan(1e-9)
    }
  })
})

describe('simplest radical form of a typed answer', () => {
  it('accepts simplified answers', () => {
    for (const ok of ['6sqrt(2)', '6√2', '3*sqrt(2)/2', '(3-sqrt(5))/4', 'sqrt(6)', '2cbrt(3)', '1+sqrt(2)', '5', '-2*sqrt(15)', '(2+√3)/2', '1/3', 'sqrt(2)/2'])
      expect(radicalFormProblem(ok), ok).toBeNull()
  })
  it('rejects unsimplified radicals, perfect powers and roots in a denominator', () => {
    for (const bad of ['sqrt(72)', 'sqrt(8)+1', '3sqrt(8)', 'sqrt(4)', 'cbrt(54)', 'cbrt(8)', '1/sqrt(2)', '3/sqrt(5)', '2/(1+sqrt(2))', '1/(sqrt(3)+1)', 'sqrt(1/4)', 'sqrt(12)/2'])
      expect(radicalFormProblem(bad), bad).toBeTruthy()
  })
})
