import { describe, expect, it } from 'vitest'
import { evaluate } from '../math/parse'

const near = (a: number, b: number, e = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** every worked example in the foundations lessons, recomputed */
describe('foundations worked examples', () => {
  it('signed numbers and order of operations', () => {
    near(-7 + 12, 5); near(5 - -3, 8); near(-4 - 6, -10); near(-6 * 4, -24); near(-6 * -4, 24); near(-48 / -8, 6)
    near(Math.abs(-7) - Math.abs(3 - 9), 1); near((-2) ** 3, -8); near(-(2 ** 3), -8); near((-3) ** 2, 9); near(-(3 ** 2), -9)
    near(3 + 4 * 2 ** 2, 19); near((3 + 4) * 2 ** 2, 28); near(20 - 3 * (7 - 4), 11); near((8 - 3 * 4) / (7 - 9), 2)
    near(2 * (-2) ** 2 - 3 * -2 + 1, 15); near(-5 - -8, 3); near(-4 * -6, 24); near(10 - 2 * 3 ** 2, -8); near(-(4 ** 2), -16)
    near(evaluate('3+4*2^2'), 19)
  })
  it('fractions and percentages', () => {
    near(gcd(18, 24), 6); near(18 / 6 / (24 / 6), 3 / 4)
    near(1 / 3 + 1 / 4, 7 / 12); near(5 / 6 - 1 / 4, 7 / 12); near((2 / 3) * (9 / 10), 3 / 5); near(3 / 4 / (5 / 8), 6 / 5)
    near(3 / 8, 0.375); near(0.15 * 80, 12); near(((50 - 40) / 40) * 100, 25)
    near(200 * 1.2 * 0.8, 192); near(60 / 0.75, 80)
    near(2 / 5 + 1 / 3, 11 / 15); near(3 / 4 / (3 / 8), 2); near(0.35 * 60, 21); near(((65 - 50) / 50) * 100, 30)
  })
  it('ratios and rates', () => {
    near(9 / 6, 1.5); near(10 * 1.5, 15); near(60 / 4 * 3 / 3, 15); near(150 / 3 * 5, 250)
    near(120 / 12 * 2, 20); near(120 / 12 * 3, 30); near(120 / 12 * 7, 70)
    near((72 * 1000) / 3600, 20); near(4 * 9 / 6, 6); near(240 / (120 / 60 + 120 / 40), 48)
    near((60 * 4) / 12 / 1 * 0 + 4 * 6 / 4, 6); near(45 / 5 * 3, 27); near(5 * 12 / 10, 6)
  })
  it('expressions', () => {
    const f = (x: number) => 6 * x + 2 - 4 * x - 9
    for (const x of [-2, 0, 3.5]) { near(f(x), 2 * x - 7); near(3 * (2 * x + 1) + 2 * (x - 5), 8 * x - 7); near(5 * x + 2 - (3 * x - 4), 2 * x + 6); near((2 * x + 3) * (x - 5), 2 * x * x - 7 * x - 15); near(6 * x + 12, 6 * (x + 2)); near(4 * (2 * x - 3), 8 * x - 12); near(-3 * (x - 4), -3 * x + 12) ; near(5 * x - 3 + 2 * x + 8, 7 * x + 5); near(-2 * (3 * x - 5), -6 * x + 10); near(4 * x + 1 - (x - 6), 3 * x + 7) }
  })
  it('powers and polynomials', () => {
    near(2 ** -3, 1 / 8); near(5 ** -1 + 5 ** 0, 6 / 5); near(3 ** 0, 1); near((2) ** 2, 4)
    near(4.5e4, 45000); near(4e5 * 3e4, 1.2e10); near(0.0042, 4.2e-3); near(2 ** -2, 1 / 4)
    for (const x of [-2, 1.5, 3]) { near(x ** 5 * x ** 3, x ** 8); near((x ** 2) ** 4, x ** 8); near((2 * x ** 3) ** 2, 4 * x ** 6); near((3 * x * x + 2 * x - 5) + (x * x - 4 * x + 7), 4 * x * x - 2 * x + 2); near((3 * x * x + 2 * x - 5) - (x * x - 4 * x + 7), 2 * x * x + 6 * x - 12); near(2 * x * (x * x - 3 * x + 4), 2 * x ** 3 - 6 * x * x + 8 * x); near((x + 2) * (x * x - x + 1), x ** 3 + x * x - x + 2); near((5 * x * x + 3 * x) - (2 * x * x - x), 3 * x * x + 4 * x) }
  })
})
