import { describe, expect, it } from 'vitest'
import { isDerivative, numDeriv, numLimit } from '../math/calculus'
import { evaluate } from '../math/parse'

const near = (a: number, b: number, e = 1e-6) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const lim = (src: string, a: number, want: number | null, dir: 'both' | 'left' | 'right' | 'inf' | '-inf' = 'both') => {
  const got = numLimit(src, a, dir)
  if (want === null) expect(got, src).toBeNull()
  else { expect(got, src).not.toBeNull(); near(got as number, want, 3e-3 * (1 + Math.abs(want))) }
}
const f = (src: string, x: number) => evaluate(src, { x })

/** every worked example in the Unit 9 lessons, recomputed */
describe('unit 9 worked examples', () => {
  it('limits', () => {
    near(3 * 4 - 2 + 4, 14); lim('3x^2-x+4', 2, 14)
    lim('(x^2-5x+6)/(x-2)', 2, -1); lim('(sqrt(x)-3)/(x-9)', 9, 1 / 6)
    lim('x+1', 2, 3, 'left'); lim('x^2', 2, 4, 'right')
    lim('(3x^2+1)/(x^2-5)', 0, 3, 'inf'); lim('(x+3)/(5x^2+2)', 0, 0, 'inf')
    lim('sin(3x)/(5x)', 0, 3 / 5); lim('sin(x)/x', 0, 1); lim('(1-cos(x))/x^2', 0, 0.5)
    // continuity: 2(3) + 1 = 3k - 2
    near(2 * 3 + 1, 3 * 3 - 2)
    lim('(x^2-9)/(x-3)', 3, 6); lim('(2x^2+5)/(x^2-1)', 0, 2, 'inf'); lim('sin(2x)/x', 0, 2)
    lim('(x^2-1)/(x-1)', 1, 2); lim('(sqrt(x+4)-2)/x', 0, 0.25)
    expect(numLimit('abs(x)/x', 0)).toBeNull()
  })
  it('the derivative from first principles', () => {
    near((9 - 1) / 2, 4)
    for (const x of [-2, 0, 1.5, 3]) { near(numDeriv('x^2', x), 2 * x, 1e-4); near(numDeriv('3x^2-2x+1', x), 6 * x - 2, 1e-4); near(numDeriv('x^3', x), 3 * x * x, 1e-3) }
    for (const x of [-2, 0.5, 3]) near(numDeriv('1/x', x), -1 / (x * x), 1e-4)
    near((5 * 5 - 2 * 2) / 3, 7)
    // tangent and normal to y = x^3 - 2x at x = 2
    near(f('x^3-2x', 2), 4); near(numDeriv('x^3-2x', 2), 10, 1e-3); near(10 * 2 - 16, 4); near(-1 / 10, -0.1)
    // velocity
    near(numDeriv('x^3-6x^2+9x', 1), 0, 1e-3); near(numDeriv('x^3-6x^2+9x', 4), 9, 1e-3)
    // a smooth join: x^2 and 2x - 1 at x = 1
    near(1, 2 * 1 - 1); near(numDeriv('x^2', 1), 2, 1e-3)
  })
  it('the rules of differentiation', () => {
    expect(isDerivative('4x^3-5x^2+7x-2', '12x^2-10x+7')).toBe(true)
    expect(isDerivative('3/x^2-4sqrt(x)', '-6/x^3-2/sqrt(x)', 1, true)).toBe(true)
    expect(isDerivative('(3x-1)^5', '15(3x-1)^4')).toBe(true)
    expect(isDerivative('sin(2x^2)', '4x*cos(2x^2)')).toBe(true)
    expect(isDerivative('e^(x^2)', '2x*e^(x^2)')).toBe(true)
    expect(isDerivative('x^2*e^x', '(x^2+2x)*e^x')).toBe(true)
    expect(isDerivative('x*sin(x)', 'sin(x)+x*cos(x)')).toBe(true)
    expect(isDerivative('x/(x^2+1)', '(1-x^2)/(x^2+1)^2')).toBe(true)
    expect(isDerivative('tan(x)', '1/cos(x)^2')).toBe(true)
    expect(isDerivative('e^(2x)*sin(3x)', 'e^(2x)*(2sin(3x)+3cos(3x))')).toBe(true)
    expect(isDerivative('ln(x^2+1)', '2x/(x^2+1)')).toBe(true)
    expect(isDerivative('5x^4-3x+2', '20x^3-3')).toBe(true)
    expect(isDerivative('(2x+1)^4', '8(2x+1)^3')).toBe(true)
    expect(isDerivative('x*ln(x)', 'ln(x)+1', 1, true)).toBe(true)
    expect(isDerivative('cos(3x)', '-3sin(3x)')).toBe(true)
    // standard table
    for (const [a, b, pos] of [['e^x', 'e^x', false], ['ln(x)', '1/x', true], ['sin(x)', 'cos(x)', false], ['cos(x)', '-sin(x)', false], ['tan(x)', 'sec(x)^2', false], ['2^x', '2^x*ln(2)', false]] as [string, string, boolean][]) expect(isDerivative(a, b, 1, pos), a).toBe(true)
    // the quotient-rule derivation of tan x
    near(f('(cos(x)*cos(x)+sin(x)*sin(x))/cos(x)^2', 0.7), f('sec(x)^2', 0.7))
  })
  it('implicit and higher derivatives', () => {
    near(-3 / 4, -3 / 4)
    // x^2 + xy + y^2 = 7 passes through (1, 2); dy/dx = -(2x + y)/(x + 2y) = -4/5
    near(1 + 2 + 4, 7); near(-(2 * 1 + 2) / (1 + 2 * 2), -0.8)
    // check the gradient numerically on the branch y(x) through (1, 2): y = (-x + sqrt(28 - 3x^2))/2
    const y = (x: number) => (-x + Math.sqrt(28 - 3 * x * x)) / 2
    near(y(1), 2); near((y(1 + 1e-6) - y(1 - 1e-6)) / 2e-6, -0.8, 1e-5)
    expect(isDerivative('x^2*e^x', '(x^2+4x+2)*e^x', 2)).toBe(true)
    // parametric x = 2t^2, y = t^3 - 3t at t = 2
    near((3 * 4 - 3) / (4 * 2), 9 / 8)
    // inverse: f(x) = x^3 + 2x, f(1) = 3
    near(f('x^3+2x', 1), 3); near(numDeriv('x^3+2x', 1), 5, 1e-3)
    const finv = (yv: number) => { let lo = -10, hi = 10; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (m ** 3 + 2 * m < yv) lo = m; else hi = m } return lo }
    near((finv(3 + 1e-6) - finv(3 - 1e-6)) / 2e-6, 0.2, 1e-4)
    expect(isDerivative('x^x', 'x^x*(ln(x)+1)', 1, true)).toBe(true)
    expect(isDerivative('atan(x)', '1/(1+x^2)')).toBe(true)
    expect(isDerivative('asin(2x)', '2/sqrt(1-4x^2)', 1, false, [-0.5, 0.5])).toBe(true)
    expect(isDerivative('x^4', '12x^2', 2)).toBe(true); expect(isDerivative('x^4', '12x^2', 1)).toBe(false)
    expect(isDerivative('x^4', '4x^3')).toBe(true)
  })
  it('applications', () => {
    const g = (x: number) => 2 * x ** 3 - 9 * x * x + 12 * x
    near(g(1), 5); near(g(2), 4); near(6 * 1 - 18 * 1 + 12, 0); near(6 * 4 - 36 + 12, 0)
    near(12 * 1 - 18, -6); near(12 * 2 - 18, 6); near(12 * 1.5 - 18, 0)
    // increasing for x < 1 and x > 2, decreasing between
    for (const x of [0, 0.5, 2.5, 3]) expect(6 * x * x - 18 * x + 12).toBeGreaterThan(0)
    for (const x of [1.2, 1.5, 1.8]) expect(6 * x * x - 18 * x + 12).toBeLessThan(0)
    // the fence
    let best = 0; for (let x = 0; x <= 60; x += 0.01) best = Math.max(best, x * (120 - 2 * x))
    near(best, 1800, 0.01); near(30 * 60, 1800)
    // the box
    let v = 0; for (let x = 0; x <= 6; x += 0.001) v = Math.max(v, x * (12 - 2 * x) ** 2)
    near(v, 128, 0.01); near(2 * 8 * 8, 128)
    // related rates
    near(Math.sqrt(100 - 36), 8); near(6 / 8, 0.75); near(2 * Math.PI * 5 * 2, 20 * Math.PI)
    // approximation and Newton
    near(5 + 1 / 10, 5.1); near(Math.sqrt(26), 5.099, 1e-3)
    near(3 / 2 - 0.25 / 3, 17 / 12); near(Math.SQRT2, 17 / 12, 3e-3)
    lim('(e^x-1-x)/x^2', 0, 0.5)
    near(10 * (20 - 10), 100); near(6 * 2 - 12, 0)
  })
})
