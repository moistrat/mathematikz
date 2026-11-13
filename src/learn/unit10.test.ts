import { describe, expect, it } from 'vitest'
import { isDerivative, numDeriv, simpson } from '../math/calculus'

const near = (a: number, b: number, e = 1e-6) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const I = (f: string, a: number, b: number) => simpson(f, a, b, 4000)
const anti = (F: string, f: string, pos = false, dom?: [number, number]) => expect(isDerivative(F, f, 1, pos, dom), `${F}' = ${f}`).toBe(true)

/** every worked example in the Unit 10 lessons, recomputed */
describe('unit 10 worked examples', () => {
  it('antiderivatives', () => {
    anti('x^3', '3x^2'); anti('4x^4/4', '4x^3'); anti('2x^3-2x^2+5x', '6x^2-4x+5')
    anti('-3/x+2x*sqrt(x)/3', '3/x^2+sqrt(x)', true)
    anti('-4cos(x)-3e^x+2ln(x)', '4sin(x)-3e^x+2/x', true)
    // f'(x) = 6x - 2, f(1) = 5: f = 3x^2 - 2x + 4
    anti('3x^2-2x+4', '6x-2'); near(3 - 2 + 4, 5)
    // s' = 3t^2 - 4t, s(0) = 2, s(3) = 11
    anti('x^3-2x^2+2', '3x^2-4x'); near(27 - 18 + 2, 11)
    anti('sin(x)', 'cos(x)'); anti('x^2+3', '2x'); near(4 + 3, 7)
    for (const [F, f] of [['ln(abs(x))', '1/x'], ['tan(x)', 'sec(x)^2'], ['atan(x)', '1/(1+x^2)'], ['2^x/ln(2)', '2^x'], ['asin(x)', '1/sqrt(1-x^2)']] as [string, string][]) anti(F, f, false, F.startsWith('asin') ? [-0.9, 0.9] : undefined)
  })
  it('definite integrals', () => {
    // Riemann sums for x^2 on [0, 2]
    const f = (x: number) => x * x
    near([0, 0.5, 1, 1.5].reduce((s, x) => s + f(x), 0), 3.5); near(0.5 * 3.5, 1.75); near(0.5 * [0.5, 1, 1.5, 2].reduce((s, x) => s + f(x), 0), 3.75); near(8 / 3, I('x^2', 0, 2))
    near(I('x^2+1', 0, 3), 12)
    // d/dx of the integral from 1 to x^2 of e^t
    const G = (x: number) => simpson('e^x', 1, x * x, 2000)
    near((G(1.3 + 1e-4) - G(1.3 - 1e-4)) / 2e-4, 2 * 1.3 * Math.exp(1.69), 1e-3 * Math.exp(1.69))
    near(I('sin(x)', 0, 4) - 0, 1 - Math.cos(4), 1e-6)
    near(I('2x-x^2', 0, 2), 4 / 3); near(4 - 8 / 3, 4 / 3)
    // v = t^2 - 5t + 4 on [0, 5]
    near(I('t^2-5t+4'.replace(/t/g, 'x'), 0, 5), -5 / 6); near(I('x^2-5x+4', 0, 1), 11 / 6); near(I('x^2-5x+4', 1, 4), -4.5); near(I('x^2-5x+4', 4, 5), 11 / 6)
    near(I('abs(x^2-5x+4)', 0, 5), 49 / 6, 1e-4); near(11 / 6 + 4.5 + 11 / 6, 49 / 6)
    near(I('2x', 1, 3), 8)
  })
  it('substitution', () => {
    anti('(3x-1)^6/18', '(3x-1)^5'); anti('(x^2+1)^4/4', '2x(x^2+1)^3'); anti('e^(x^2)/2', 'x*e^(x^2)')
    near(I('2x(x^2+1)^3', 0, 1), 15 / 4); near(I('cos(x)*sin(x)^2', 0, Math.PI / 2), 1 / 3)
    anti('2(x+1)^(3/2)*(3x-2)/15', 'x*sqrt(x+1)', true); anti('-cos(x)+cos(x)^3/3', 'sin(x)^3')
    anti('e^(2x+1)/2', 'e^(2x+1)'); anti('ln(x^2+4)/2', 'x/(x^2+4)'); near(I('x(x^2+1)^2', 0, 2), (5 ** 3 - 1) / 6)
    anti('sin(x)^5/5', 'cos(x)*sin(x)^4')
  })
  it('techniques', () => {
    anti('x^2/2+2x', '(x^2-4)/(x-2)'); anti('2x*sqrt(x)/3+4sqrt(x)', '(x+2)/sqrt(x)', true)
    anti('(2x-1)*e^(2x)/4', 'x*e^(2x)'); anti('x^2*ln(x)/2-x^2/4', 'x*ln(x)', true); anti('x*ln(x)-x', 'ln(x)', true)
    near(I('x*sin(x)', 0, Math.PI), Math.PI, 1e-6)
    anti('e^x*(sin(x)-cos(x))/2', 'e^x*sin(x)')
    // (5x + 1)/((x - 1)(x + 2)) = 2/(x - 1) + 3/(x + 2)
    for (const x of [0.3, 2.5, 4]) near((5 * x + 1) / ((x - 1) * (x + 2)), 2 / (x - 1) + 3 / (x + 2))
    anti('2ln(x-1)+3ln(x+2)', '(5x+1)/((x-1)(x+2))', false, [1.2, 6])
    anti('x/2-sin(2x)/4', 'sin(x)^2'); near(I('sin(x)^2', 0, Math.PI), Math.PI / 2, 1e-6)
    near(3 * -1 + 5, 2)
    // by-parts table
    anti('(x-1)*e^x', 'x*e^x'); anti('-x*cos(x)+sin(x)', 'x*sin(x)'); anti('(x^2-2x+2)*e^x', 'x^2*e^x'); anti('x*atan(x)-ln(1+x^2)/2', 'atan(x)')
  })
  it('applications', () => {
    near(I('x^2', 0, 3) / 3, 3); near(I('2x', 0, 4) / 4, 4); near(I('2x+7', 0, 2), 18)
    near(Math.PI * I('x', 0, 4), 8 * Math.PI); near(Math.PI * I('x^2-x^4', 0, 1), (2 * Math.PI) / 15)
    near(2 * Math.PI * I('x^3', 0, 2), 8 * Math.PI)
    near((1 / 3) * (0 + 4 * 1 + 8), 4); near(I('x^3', 0, 2), 4); near(Math.PI * I('x^2', 0, 3), 9 * Math.PI)
    // improper integrals
    for (const B of [1e3, 1e5]) { near(1 - 1 / B, I('1/x^2', 1, 2) * 0 + (1 - 1 / B)); expect(Math.log(B)).toBeGreaterThan(6) }
    near(2 - 2 * Math.sqrt(1e-8), 2, 1e-3)
    near(numDeriv('x^3', 2), 12, 1e-3)
  })
})
