import { describe, expect, it } from 'vitest'
import { evalExpr, fmtFrac, parseRat, rEq, solveEquation } from '../math/algebra'
import { evaluate } from '../math/parse'
import { extractRoot, radicalFormProblem, root, rootMul } from '../math/radicals'
import { fmtRoot, rootValue } from '../math/solve'

const near = (a: number, b: number, d = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(d)
const roots = (lhs: string, rhs: string) => solveEquation(parseRat(lhs), parseRat(rhs), 'x').roots.map((f) => f.n / f.d)

/** every worked example in the Unit 4 lessons, recomputed */
describe('unit 4 worked examples', () => {
  it('exponents', () => {
    near(2 ** 3 * 2 ** 4, 128); near(5 ** 6 / 5 ** 4, 25); near((3 ** 2) ** 3, 729)
    expect(4 ** -2).toBe(1 / 16); near((2 / 3) ** -3, 27 / 8)
    near(27 ** (2 / 3), 9); near(16 ** (-3 / 4), 1 / 8); near((9 / 4) ** 1.5, 27 / 8); near(8 ** (2 / 3), 4)
    expect((-3) ** 2).toBe(9); expect(-(3 ** 2)).toBe(-9)
    expect(2 ** 5 * 2 ** -2).toBe(8); expect(3 ** -2).toBeCloseTo(1 / 9)
    // (2x^3 y^-2)^2 / (4 x^-1 y) = x^7 / y^5
    expect(rEq(parseRat('(2x^3y^(-2))^2/(4x^(-1)y)'), parseRat('x^7/y^5'))).toBe(true)
    near(3e4 * 2e-7, 0.006)
    // 9^x = 27: x = 3/2.  2^(x^2-3x) = 16: x = 4, -1.  4^x - 6*2^x + 8 = 0: x = 1, 2
    near(9 ** 1.5, 27)
    for (const x of [4, -1]) near(2 ** (x * x - 3 * x), 16)
    for (const x of [1, 2]) near(4 ** x - 6 * 2 ** x + 8, 0)
    expect(roots('x^2-3x', '4')).toEqual([-1, 4])
    expect(solveEquation(parseRat('u^2-6u+8'), parseRat('0'), 'u').roots.map((f) => f.n / f.d)).toEqual([2, 4])
  })
  it('radicals', () => {
    expect(extractRoot(72)).toEqual({ outside: 6, inside: 2 })
    expect(extractRoot(54, 3)).toEqual({ outside: 3, inside: 2 })
    expect(extractRoot(50)).toEqual({ outside: 5, inside: 2 })
    near(Math.sqrt(72), 6 * Math.SQRT2); near(Math.cbrt(54), 3 * Math.cbrt(2))
    near(3 * Math.sqrt(8) + 2 * Math.sqrt(18), 12 * Math.SQRT2)
    near(2 * Math.sqrt(3) * 5 * Math.sqrt(6), 30 * Math.SQRT2)
    expect(fmtRoot(rootMul(root(2, 1, 3), root(4, -1, 3)))).toBe(fmtRoot(root(5, 2, 3)))
    near(rootValue(root(5, 2, 3)), (2 + Math.sqrt(3)) * (4 - Math.sqrt(3)))
    near(rootValue(rootMul(root(1, 1, 5), root(1, 1, 5))), 6 + 2 * Math.sqrt(5))
    near(6 / Math.sqrt(8), 3 * Math.SQRT2 / 2)
    near(2 / (3 + Math.sqrt(5)), (3 - Math.sqrt(5)) / 2)
    near(1 / Math.sqrt(3), Math.sqrt(3) / 3)
    near(Math.sqrt(9 + 16), 5)
    // radical equations
    near(Math.sqrt(2 * 11 + 3), 5)
    near(Math.sqrt(2 + 7), 2 + 1)
    expect(Math.sqrt(-3 + 7)).not.toBe(-3 + 1)
    expect(roots('x^2+x-6', '0')).toEqual([-3, 2])
    near(Math.sqrt(4 + 5) + Math.sqrt(4), 5)
    near(Math.sqrt(10 - 1), 3)
    // simplest form check agrees with the lesson
    for (const ok of ['6sqrt(2)', '3cbrt(2)', '12sqrt(2)', '30sqrt(2)', '(3-sqrt(5))/2', '3sqrt(2)/2', 'sqrt(3)/3', '5+2sqrt(3)']) expect(radicalFormProblem(ok), ok).toBeNull()
    for (const bad of ['sqrt(72)', 'cbrt(54)', '1/sqrt(3)', '6/sqrt(8)', 'sqrt(50)']) expect(radicalFormProblem(bad), bad).toBeTruthy()
  })
  it('logarithms', () => {
    const log = (b: number, a: number) => Math.log(a) / Math.log(b)
    near(log(2, 32), 5); near(log(3, 1 / 9), -2); near(log(4, 8), 1.5); near(log(10, 1000), 3); near(Math.log(Math.exp(5)), 5)
    near(log(6, 4) + log(6, 9), 2); near(2 * log(3, 6) - log(3, 4), 2)
    near(log(3, 81), 4)
    near(log(2, 3) + log(2, 5), log(2, 15))
    near(Math.log(20) / Math.log(3), 2.727, 5e-4); near(3 ** 2.727, 20, 1e-2)
    near(log(7, 50), 2.010, 5e-4); expect(7 ** 2).toBeLessThan(50)
    near(Math.log(2) / Math.log(1.06), 11.9, 0.05)
    // log2 x + log2 (x-2) = 3
    expect(roots('x^2-2x', '8')).toEqual([-2, 4])
    near(log(2, 4) + log(2, 2), 3)
    near(evaluate('ln(7)/ln(2)'), 2.807, 5e-4)
    // the laws used to expand: product, power, quotient on random numbers
    for (const [x, y, z] of [[2, 9, 3], [5, 4, 7], [10, 100, 2]]) near(Math.log10((x * x * Math.sqrt(y)) / z ** 3), 2 * Math.log10(x) + 0.5 * Math.log10(y) - 3 * Math.log10(z))
  })
  it('the engine agrees with the exponent table', () => {
    expect(fmtFrac({ n: 1, d: 16 })).toBe('1/16')
    near(evalExpr('2^3*2^4', {}), 128)
  })
})
