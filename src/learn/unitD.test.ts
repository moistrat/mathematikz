import { describe, expect, it } from 'vitest'

const near = (a: number, b: number, e = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)

/** every worked example in the geometry lessons, recomputed */
describe('geometry worked examples', () => {
  it('angles', () => {
    near(90 - 35, 55); near(180 - 110, 70); near(180 - 50 - 60, 70); near(180 - 70, 110); near(50 + 60, 110)
    near((180 - 40) / 2, 70); near((6 - 2) * 180, 720); near(720 / 6, 120); near(360 / 6, 60); near(120 + 60, 180)
    near(3 * 20 + 10, 5 * 20 - 30); near(3 * 20 + 10, 70); near(180 - 65 - 45, 70); near((5 - 2) * 180, 540); near(180 - 125, 55)
  })
  it('the Pythagorean theorem', () => {
    near(Math.hypot(5, 12), 13); near(Math.sqrt(25 ** 2 - 7 ** 2), 24); near(Math.sqrt(13), 3.6056, 1e-3)
    for (const [a, b, c] of [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]) near(a * a + b * b, c * c)
    near(8 * 8 + 15 * 15, 17 * 17); expect(6 * 6 + 7 * 7 < 10 * 10).toBe(true)
    near(Math.hypot(6, 8), 10); near(Math.hypot(5, 5), Math.sqrt(50)); near(Math.sqrt(50), 7.071, 1e-3); near(5 * Math.SQRT2, Math.sqrt(50))
    near(Math.sqrt(2 * 2 + 3 * 3 + 6 * 6), 7); near(Math.hypot(5, 12), 13); near(Math.sqrt(13 * 13 - 12 * 12), 5)
  })
  it('area and volume', () => {
    near(0.5 * (4 + 10) * 5, 35); near(Math.PI * 25, 78.54, 1e-2); near(2 * Math.PI * 5, 31.416, 1e-3)
    near(Math.PI * 9 * 10, 90 * Math.PI); near((4 / 3) * 6 ** 3, 288); near((1 / 3) * 9 * 4, 12); near(2 * (12 + 15 + 20), 94)
    near(24 + 2 * Math.PI, 30.283, 1e-3); near(0.5 * Math.PI * 4, 2 * Math.PI); near(3 * 10000, 30000)
    near(0.5 * 10 * 7, 35); near(Math.PI * 16, 16 * Math.PI); near(Math.PI * 4 * 5, 20 * Math.PI); near(2 * 100 * 100, 20000)
  })
  it('similarity', () => {
    near(10 / 4, 5 / 2); near(6 * 2.5, 15); near(18 * 2 / 3, 12); near(5 * 9, 45); near(4 * 8, 32); near((3 / 5) * 10, 6); near(5 * 2, 10)
    near(1.5 / 2 * 40, 30); near(3 ** 2, 9); near(2 ** 3, 8)
  })
  it('circles', () => {
    near((60 / 360) * 2 * Math.PI * 6, 2 * Math.PI); near((60 / 360) * Math.PI * 36, 6 * Math.PI)
    near(Math.sqrt(13 * 13 - 5 * 5), 12); near(2 * Math.sqrt(13 * 13 - 5 * 5), 24); near(100 / 2, 50)
    near((5 - 2) ** 2 + (1 + 3) ** 2, 25); near(Math.PI * 10, 10 * Math.PI); near((90 / 360) * Math.PI * 16, 4 * Math.PI); near(Math.sqrt(9), 3)
  })
})
