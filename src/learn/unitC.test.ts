import { describe, expect, it } from 'vitest'

const near = (a: number, b: number, e = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)

/** every worked example in the lines and systems lessons, recomputed */
describe('lines and systems worked examples', () => {
  it('slope', () => {
    near((10 - 1) / (4 + 2), 3 / 2); near(12 / 2, 6); near(12 / 3, 4); near(-2 / 3 * -1 * 0 + (-(2 / 3)), -2 / 3)
    near((-3 / 4) * (4 / 3), -1); near((-4 + 6) / 2, 1); near((3 - 1) / 2, 1); near(1 / 2, 3 / 6)
    near(2 * 1 / 1 * 0 + (8 - 2) / (3 - 1), 3); near((2 + 8) / 2, 5); near((4 + 10) / 2, 7); near(2 * (-1 / 2), -1)
  })
  it('equations of lines', () => {
    near(3 * 2 - 1, 5); near((-1 - 7) / (3 + 1), -2); near(-2 * 3 + 5, -1); near(-2 * -1 + 5, 7)
    near(2 * (3 / 2) - 3, 0); near(2 * 4 - 7, 1); near(-0.5 * 4 + 3, 1); near((4 - 2) / (5 - 1), 0.5); near(-2 * 3 + 9, 3)
    near(5 - 3 * 2 + 0, -1); near(3 * 0 + 2 * 6, 12)
  })
  it('systems', () => {
    near(3 * 3 + 5, 14); near(2 * 3 - 1, 5); near(6 * 3, 18); near(2 * 3 + 3 * 2, 12); near(4 * 3 - 3 * 2, 6)
    const x = 17 / 11, y = 13 / 11
    near(3 * x + 2 * y, 7); near(5 * x - 4 * y, 3)
    near(9 * 6 + 4 * 4, 70); expect(3 > 2 * 1 - 1).toBe(true); near(200 + 3 * 40, 8 * 40); near(3 + 2, 5)
  })
  it('models', () => {
    near(2.5 * 10 + 4, 29); near((22 - 30) / 4, -2); near(-2 * 2 + 34, 30); near(-2 * 6 + 34, 22); near(34 / 2, 17)
    near(20 + 5 * 10, 50 + 2 * 10); near(20 + 5 * 12, 80); near(50 + 2 * 12, 74)
    near(1.5 + 0.8 * 6, 6.3); near(30 + 5 * 10, 80)
    // least squares for (1,2), (2,3), (3,5), (4,4)
    const xs = [1, 2, 3, 4], ys = [2, 3, 5, 4], mx = 2.5, my = 3.5
    const b = xs.reduce((s, xx, i) => s + (xx - mx) * (ys[i] - my), 0) / xs.reduce((s, xx) => s + (xx - mx) ** 2, 0)
    near(b, 0.8); near(my - b * mx, 1.5)
  })
})
