import { describe, expect, it } from 'vitest'
import { numDeriv } from '../math/calculus'
import { evaluate } from '../math/parse'
import { phi } from '../math/psQuestions'

const near = (a: number, b: number, e = 1e-6) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const y = (src: string, x: number) => evaluate(src, { x })
const d2 = (src: string, x: number) => (y(src, x + 1e-3) - 2 * y(src, x) + y(src, x - 1e-3)) / 1e-6
const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0]
const mul = (a: number[][], b: number[][]) => a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)))
const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }

/** every worked example in the Unit 12 lessons, recomputed */
describe('unit 12 worked examples', () => {
  it('first-order equations', () => {
    near(numDeriv('3e^(2x)', 0.7), 2 * y('3e^(2x)', 0.7), 1e-3)
    near(numDeriv('2e^(x^2/2)', 0.5), 0.5 * y('2e^(x^2/2)', 0.5), 1e-4); near(y('2e^(x^2/2)', 0), 2)
    near(numDeriv('1/(1-x)', 0.4), y('1/(1-x)', 0.4) ** 2, 1e-4)
    near(numDeriv('3-2e^(-2x)', 0.3) + 2 * y('3-2e^(-2x)', 0.3), 6, 1e-4); near(y('3-2e^(-2x)', 0), 1)
    const yy = 'x^2/3+5/(3x)'
    near(numDeriv(yy, 1.5) + y(yy, 1.5) / 1.5, 1.5, 1e-4); near(y(yy, 1), 2)
    // Euler for y' = x + y, y(0) = 1, h = 0.5
    let Y = 1, X = 0; for (let i = 0; i < 2; i++) { Y += 0.5 * (X + Y); X += 0.5 }
    near(Y, 2.5); near(2 * Math.E - 2, 3.4366, 1e-3)
    // logistic with K = 100, P0 = 20
    const P = '100/(1+4e^(-x))'; near(y(P, 0), 20); near(numDeriv(P, 0.6), y(P, 0.6) * (1 - y(P, 0.6) / 100), 1e-4)
    near(0.5 ** 3, 1 / 8)
  })
  it('second-order equations', () => {
    const a = '2e^x-e^(2x)'; near(d2(a, 0.4) - 3 * numDeriv(a, 0.4) + 2 * y(a, 0.4), 0, 1e-2); near(y(a, 0), 1); near(numDeriv(a, 0), 0, 1e-3)
    const b = 'cos(2x)+sin(2x)'; near(d2(b, 0.4) + 4 * y(b, 0.4), 0, 1e-3); near(y(b, 0), 1); near(numDeriv(b, 0), 2, 1e-3); near((2 * Math.PI) / 2, Math.PI)
    const c = '(1-2x)e^(2x)'; near(d2(c, 0.4) - 4 * numDeriv(c, 0.4) + 4 * y(c, 0.4), 0, 1e-2); near(y(c, 0), 1); near(numDeriv(c, 0), 0, 1e-3)
    const dd = 'e^(-x)*(cos(2x)+sin(2x))'; near(d2(dd, 0.4) + 2 * numDeriv(dd, 0.4) + 5 * y(dd, 0.4), 0, 1e-2); near(y(dd, 0), 1); near(numDeriv(dd, 0), 1, 1e-3)
    const e = '2x+3'; near(0 - 3 * 2 + 2 * y(e, 0.7), 4 * 0.7, 1e-9)
    near((2 * 1 - 1) * 0 + 5 * 0, 0); near(2 * Math.PI / 3, 2.0944, 1e-3)
  })
  it('matrices', () => {
    near(det2([[3, 1], [2, 5]]), 13); near(det2([[4, 3], [2, 5]]), 14)
    expect(mul([[1, 2], [3, 4]], [[0, 1], [1, 0]])).toEqual([[2, 1], [4, 3]])
    const m3 = [[1, 2, 3], [0, 1, 4], [5, 6, 0]]
    near(m3[0][0] * (m3[1][1] * m3[2][2] - m3[1][2] * m3[2][1]) - m3[0][1] * (m3[1][0] * m3[2][2] - m3[1][2] * m3[2][0]) + m3[0][2] * (m3[1][0] * m3[2][1] - m3[1][1] * m3[2][0]), 1)
    expect(mul([[2, 1], [5, 3]], [[3, -1], [-5, 2]])).toEqual([[1, 0], [0, 1]])
    near((4 * -1 - 2 * 5) / -7, 2); near((1 * 5 - 4 * 3) / -7, 1); near(2 + 2 * 1, 4); near(3 * 2 - 1, 5)
    near(3 ** 3 * 2, 54); near(det2([[1, 2], [3, -1]]), -7)
  })
  it('eigenvalues', () => {
    const A = [[4, 1], [2, 3]]
    near(det2([[4 - 5, 1], [2, 3 - 5]]), 0); near(det2([[4 - 2, 1], [2, 3 - 2]]), 0)
    expect([4 * 1 + 1 * 1, 2 * 1 + 3 * 1]).toEqual([5, 5]); expect([4 * 1 + 1 * -2, 2 * 1 + 3 * -2]).toEqual([2, -4])
    near(5 + 2, 7); near(5 * 2, 10)
    expect(mul(A, A)).toEqual([[18, 7], [14, 11]])
    const P = [[1, 1], [1, -2]], Pi = [[2 / 3, 1 / 3], [1 / 3, -1 / 3]]
    mul(mul(P, [[25, 0], [0, 4]]), Pi).forEach((row, i) => row.forEach((v, j) => near(v, mul(A, A)[i][j])))
    near(det2([[2, 3], [4, 6]]), 0); near(5 - 3, 2); near(3 * -2, -6)
  })
  it('probability', () => {
    near(choose(8, 3), 56); near(8 * 7 * 6, 336); near(56 * 6, 336)
    near(6 / 36, 1 / 6); near(1 - (5 / 6) ** 2, 11 / 36); near((4 / 7) * (3 / 6), 2 / 7)
    near(95 / (95 + 495), 19 / 118); near(19 / 118, 0.161, 1e-3)
    near([1, 2, 3, 4, 5, 6].reduce((s, v) => s + v, 0) / 6, 3.5); near([1, 4, 9, 16, 25, 36].reduce((s, v) => s + v, 0) / 6 - 3.5 ** 2, 35 / 12)
    near(choose(5, 3) / 32, 5 / 16); near(choose(6, 2), 15); near(0.5 * 0.4, 0.2); near(20 * 0.3, 6); near(0.3 / 0.5, 0.6)
  })
  it('statistics', () => {
    const d = [2, 4, 4, 5, 10], m = d.reduce((s, v) => s + v, 0) / 5
    near(m, 5); near(d.reduce((s, v) => s + (v - m) ** 2, 0), 36); near(36 / 4, 9)
    near(phi(1.5), 0.9332, 1e-4); near(phi(1), 0.8413, 1e-4); near(phi(1.96), 0.975, 1e-4); near(phi(2), 0.9772, 1e-4); near(phi(3), 0.9987, 1e-4); near(phi(0), 0.5, 1e-9)
    near((185 - 170) / 10, 1.5); near(1.96 * 1.5, 2.94); near(50 - 2.94, 47.06); near((50 - 47) / 1.5, 2)
    near(phi(1) - phi(-1), 0.6827, 1e-3); near(phi(2) - phi(-2), 0.9545, 1e-3)
    const xs = [1, 2, 3, 4], ys = [2, 3, 5, 4], mx = 2.5, my = 3.5
    const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0), sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    near(sxy, 4); near(sxx, 5); near(sxy / sxx, 0.8); near(my - (sxy / sxx) * mx, 1.5)
    near((60 - 50) / 5, 2)
  })
})
