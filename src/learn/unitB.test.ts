import { describe, expect, it } from 'vitest'

const near = (a: number, b: number, e = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)

/** every worked example in the linear equations lessons, recomputed */
describe('linear equations worked examples', () => {
  it('solving', () => {
    near(3 * 5 + 4, 19); near(19 - 7, 12); near(4 * -5, -20); near(3 * 5 + 5, 20)
    near(5 * 4 - 3, 17); near(2 * 4 + 9, 17); near(3 * (6 + 4), 2 * (6 - 1) + 20); near(12 / 3 + 12 / 4, 7)
    for (const x of [-3, 0, 2.5]) { near(2 * (x + 3), 2 * x + 6); near(3 * (x + 1), 3 * x + 3) }
    near(2 * -3 + 7, 1); near(4 * 5 - 5, 5 + 10); near(2 * (8 - 3), 10)
  })
  it('word problems', () => {
    near(3 * 7 + 5, 26); near(13 + 17, 30); near(17 - 13, 4); near(23 + 24 + 25, 72)
    near(2 * (5 + 13), 36); near(13, 2 * 5 + 3); near(60 * 1, 20 * (1 + 2)); near(25 * 10 + 10 * 10, 350)
    near(1 / 6 + 1 / 3, 1 / 2); near(300 / 100, 3); near(20 + 21, 41); near(1 / 4 + 1 / 4, 1 / 2)
  })
  it('inequalities', () => {
    near(3 * 5 - 5, 10); near(7 - 0, 7); expect(7 - 10 > 1).toBe(false); expect(7 - 2 * 2 > 1).toBe(true)
    for (const x of [6, 10]) expect(4 * x + 1 < 6 * x - 9).toBe(true)
    expect(4 * 5 + 1 < 6 * 5 - 9).toBe(false)
    for (const x of [-1.9, 0, 3]) expect(-1 < 2 * x + 3 && 2 * x + 3 <= 9).toBe(true)
    expect(-2 < -2).toBe(false); expect(2 * 3.1 + 3 <= 9).toBe(false)
    near(30 + 8 * 15, 150); expect(30 + 8 * 16 <= 150).toBe(false)
    expect(2 * (4 + 1) > 2 * 4 + 5).toBe(false); expect(3 * 4 + 1 < 3 * 4 + 4).toBe(true)
  })
})
