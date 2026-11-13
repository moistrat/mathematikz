import { describe, expect, it } from 'vitest'
import { double, isDerivative, numLimit, numPartial, simpson } from '../math/calculus'
import { evaluate } from '../math/parse'

const near = (a: number, b: number, e = 1e-6) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const sum = (term: (n: number) => number, a: number, b: number) => { let s = 0; for (let n = a; n <= b; n++) s += term(n); return s }
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
const f = (src: string, x: number, y = 0) => evaluate(src, { x, y })

/** every worked example in the Unit 11 lessons, recomputed */
describe('unit 11 worked examples', () => {
  it('series and convergence tests', () => {
    near(sum((n) => 3 * 0.5 ** n, 0, 200), 6); near(3 / (1 - 0.5), 6)
    near(sum((n) => 1 / (n * (n + 1)), 1, 100000), 1, 2e-5); near(1 - 1 / 101, sum((n) => 1 / (n * (n + 1)), 1, 100))
    expect(1000 / 1001).toBeGreaterThan(0.99)
    expect(sum((n) => 1 / n, 1, 1e5)).toBeGreaterThan(sum((n) => 1 / n, 1, 1e3) + 4)
    near(sum((n) => 1 / (n * n), 1, 200000), Math.PI ** 2 / 6, 1e-5)
    near((1 / (2 * 1e6 - 1)) / (1 / 1e6), 0.5, 1e-6)
    near(((1e6 + 1) / 1e6) ** 2 / 3, 1 / 3, 1e-5); near(2 / 1e6, 0, 1e-5)
    near(sum((n) => (-1) ** (n + 1) / n, 1, 200000), Math.LN2, 1e-5)
    near(sum((n) => (-1) ** n / (n * n), 1, 2000), -(Math.PI ** 2) / 12, 1e-5)
    near(sum((n) => 1 / 3 ** n, 0, 100), 1.5)
    expect(sum((n) => 1 / (n * n + 3), 1, 10000)).toBeLessThan(sum((n) => 1 / (n * n), 1, 10000))
  })
  it('power series', () => {
    // x^n/(n 2^n): R = 2, at x = -2 converges, at x = 2 diverges
    near(0.5 * (1000 / 1001), 0.5, 1e-3)
    near(sum((n) => (-1) ** n / n, 1, 200000), -Math.LN2, 1e-4)
    expect(sum((n) => 1 / n, 1, 1e5)).toBeGreaterThan(11)
    // (x - 1)^n / (n^2 3^n) at x = 4 and x = -2
    near(sum((n) => 1 / (n * n), 1, 3000), Math.PI ** 2 / 6, 1e-3); near(sum((n) => (-1) ** n / (n * n), 1, 3000), -(Math.PI ** 2) / 12, 1e-3)
    near(sum((n) => n / 2 ** n, 1, 200), 2); near((1 / 2) / (1 / 2) ** 2 * 1, 2)
    // coefficients
    near(sum((n) => (n + 1) * 0.3 ** n, 0, 400), 1 / (1 - 0.3) ** 2)
    near(sum((n) => (-1) ** n * 0.5 ** (2 * n + 1) / (2 * n + 1), 0, 100), Math.atan(0.5)); near(-1 / 7, (-1) ** 3 / 7)
    near(sum((n) => (-1) ** n * 0.5 ** (2 * n), 0, 100), 1 / (1 + 0.25)); near(sum((n) => (-1) ** (n + 1) * 0.5 ** n / n, 1, 100), Math.log(1.5))
    for (const x of [0.3, -0.4]) near(sum((n) => x ** n / fact(n), 0, 30), Math.exp(x))
  })
  it('Taylor series', () => {
    // ln x about 1
    const P = (x: number) => (x - 1) - (x - 1) ** 2 / 2 + (x - 1) ** 3 / 3
    near(P(1.1), Math.log(1.1), 3e-5); near(0, Math.log(1)); near(2 / fact(3), 1 / 3)
    // sqrt(1 + x)
    near(1 + 0.01 / 2 - 0.0001 / 8 + 1e-6 / 16, Math.sqrt(1.01), 1e-9)
    // e^(-x^2) integral
    near(1 - 1 / 3 + 1 / 10 - 1 / 42 + 1 / 216, 0.7475, 1e-3); near(simpson('e^(-x^2)', 0, 1, 2000), 0.746824, 1e-5)
    expect(Math.abs(1 - 1 / 3 + 1 / 10 - 1 / 42 + 1 / 216 - 0.746824)).toBeLessThan(1e-3)
    // limit
    expect(numLimit('(sin(x)-x)/x^3', 0)).not.toBeNull(); near(numLimit('(sin(x)-x)/x^3', 0) as number, -1 / 6, 2e-3); near(numLimit('(e^x-1-x)/x^2', 0) as number, 0.5, 2e-3)
    // the error bound for e
    const P6 = sum((k) => 1 / fact(k), 0, 6)
    near(P6, 2.71806, 1e-4); expect(Math.abs(Math.E - P6)).toBeLessThan(3 / fact(7)); near(3 / 5040, 0.0006, 1e-4); near(Math.E - P6, 0.0002, 1e-4)
    // coefficients and checks
    near(1 / fact(3), 1 / 6); near(3 ** 2, 9)
    near(f('(e^x-1-x)/x^2', 1e-3), 0.5, 1e-3)
  })
  it('partial derivatives', () => {
    const g = 'x^2*y+3x*y^2'
    near(numPartial(g, 'x', 1, 2), 16, 1e-4); near(numPartial(g, 'y', 1, 2), 13, 1e-4); near(2 * 1 * 2 + 3 * 4, 16); near(1 + 6 * 1 * 2, 13)
    near((3 * 16 + 4 * 13) / 5, 20)
    near(numPartial('x^2+y^2', 'x', 1, 2), 2, 1e-4); near(numPartial('x^2+y^2', 'y', 1, 2), 4, 1e-4); near(5 + 2 * 0 + 4 * 0, 5)
    // chain rule: z = x^2 y, x = t^2, y = t^3: z = t^7
    near((Math.pow(1 + 1e-6, 7) - Math.pow(1 - 1e-6, 7)) / 2e-6, 7, 1e-4); near(2 * 1 * 1 * 2 + 1 * 3, 7)
    // stationary point of x^2 + xy + y^2 - 3x
    const h = 'x^2+x*y+y^2-3x'
    near(numPartial(h, 'x', 2, -1), 0, 1e-4); near(numPartial(h, 'y', 2, -1), 0, 1e-4); near(f(h, 2, -1), -3)
    near(numPartial(h, 'x', 2, -1, 2) * numPartial(h, 'y', 2, -1, 2) - 1, 3, 1e-3)
    near(numPartial('x^2-y^2', 'x', 0, 0, 2) * numPartial('x^2-y^2', 'y', 0, 0, 2), -4, 1e-3)
    // Lagrange: maximise xy on x + y = 10
    let best = 0, bx = 0; for (let x = 0; x <= 10; x += 0.01) if (x * (10 - x) > best) { best = x * (10 - x); bx = x }
    near(best, 25, 1e-6); near(bx, 5, 1e-6)
    near(Math.hypot(3, 4), 5)
  })
  it('multiple integrals', () => {
    near(double('x*y', 0, 3, () => 0, () => 2, 20), 9, 1e-6)
    near(double('x+y', 0, 2, () => 0, (x) => x, 40), 4, 1e-6)
    near(double('e^(x^2)', 0, 1, () => 0, (x) => x, 60), (Math.E - 1) / 2, 1e-6)
    near((Math.E - 1) / 2, 0.8591, 1e-4)
    near(double('x^2+y^2', -2, 2, (x) => -Math.sqrt(Math.max(0, 4 - x * x)), (x) => Math.sqrt(Math.max(0, 4 - x * x)), 200), 8 * Math.PI, 0.1)
    near(double('4-x^2-y^2', -2, 2, (x) => -Math.sqrt(Math.max(0, 4 - x * x)), (x) => Math.sqrt(Math.max(0, 4 - x * x)), 200), 8 * Math.PI, 0.1)
    near(2 * Math.PI * (4 - 4 / 4 * 1) * 0 + 2 * Math.PI * (8 - 4), 8 * Math.PI)
    near(2 * Math.PI * 0.5, Math.PI); near(Math.sqrt(Math.PI) ** 2, Math.PI)
    near(simpson('e^(-x^2)', -8, 8, 4000), Math.sqrt(Math.PI), 1e-6)
    // tetrahedron
    near(double('1-x-y', 0, 1, () => 0, (x) => 1 - x, 40), 1 / 6, 1e-6)
    near(9 / 2 * 2, 9); near(3 * 2 / 2 * 0 + 6 * 2 * 3, 36)
    expect(isDerivative('x^2', '2x')).toBe(true)
  })
})
