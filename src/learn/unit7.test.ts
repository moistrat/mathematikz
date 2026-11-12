import { describe, expect, it } from 'vitest'
import { fmtPoly, parsePoly, rEq, parseRat } from '../math/algebra'

const near = (a: number, b: number, e = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }
const sum = (n: number, f: (k: number) => number) => { let t = 0; for (let k = 1; k <= n; k++) t += f(k); return t }

/** every worked example in the Unit 7 lessons, recomputed */
describe('unit 7 worked examples', () => {
  it('sequences', () => {
    near(7 + 19 * 4, 83); near(7 + 22 * 4, 95)
    near(3 * 2 ** 9, 1536); near(81 * (-1 / 3) ** 4, 1)
    // u3 = 11, u8 = 31
    near((31 - 11) / 5, 4); near(11 - 2 * 4, 3)
    // recurrence u_{n+1} = 2 u_n - 1, u1 = 3
    let t = 3; for (let i = 1; i < 5; i++) t = 2 * t - 1
    near(t, 33); for (let n = 1; n <= 8; n++) { let u = 3; for (let i = 1; i < n; i++) u = 2 * u - 1; near(u, 2 ** n + 1) }
    near(3 + 19 * 5, 98); near(2 * 3 ** 4, 162)
    let v = 2; for (let i = 1; i < 4; i++) v += 4; near(v, 14)
  })
  it('series', () => {
    near((100 / 2) * (1 + 100), 5050)
    near((20 / 2) * (2 * 5 + 19 * 3), 670)
    // 4 + 7 + 10 + ...: the sum reaches 175 at n = 10
    near((10 / 2) * (8 + 3 * 9), 175); near(Math.sqrt(25 + 4 * 3 * 350), 65); near((-5 + 65) / 6, 10)
    near((2 * (3 ** 7 - 1)) / 2, 2186)
    near(12 / (1 - 1 / 3), 18); near(0.27 / 0.99, 3 / 11)
    near(10 + 12 / (1 - 0.6), 40)
    near((10 / 2) * (4 + 9 * 2), 110); near(2 ** 6 - 1, 63); near(1 / (1 - 0.5), 2)
  })
  it('sigma notation and induction', () => {
    near(sum(4, (k) => 3 * k - 2), 22); near(sum(10, (k) => 3 * k - 2), 145)
    for (const n of [1, 2, 3, 6, 10]) near(sum(n, (k) => k * (k + 1)), (n * (n + 1) * (n + 2)) / 3)
    near(sum(3, (k) => k * (k + 1)), 20)
    for (const n of [1, 2, 5, 9]) { near(sum(n, (k) => 1 / (k * (k + 1))), n / (n + 1)); near(sum(n, (k) => k), (n * (n + 1)) / 2); near(sum(n, (k) => k * k), (n * (n + 1) * (2 * n + 1)) / 6); near(sum(n, (k) => k ** 3), ((n * (n + 1)) / 2) ** 2) }
    for (let n = 1; n <= 10; n++) expect((7 ** n - 1) % 6).toBe(0)
    near(sum(5, (k) => k * k), 55); near(sum(7, (k) => 2 * k), 7 * 8)
    near(sum(200000, (k) => 1 / (k * (k + 1))), 1, 1e-4)
    // the inductive step of 1 + ... + n = n(n+1)/2
    for (let m = 1; m <= 20; m++) near((m * (m + 1)) / 2 + (m + 1), ((m + 1) * (m + 2)) / 2)
  })
  it('the binomial theorem', () => {
    expect(choose(6, 2)).toBe(15); expect(choose(8, 3)).toBe(56); expect(choose(5, 2)).toBe(10)
    expect(fmtPoly(parsePoly('(2x-1)^4'), true)).toBe('16x^4 - 32x^3 + 24x^2 - 8x + 1')
    near(choose(6, 3) * 2 ** 3, 160)
    // the constant term of (x + 2/x)^6 by direct expansion in x (multiply by x^6)
    expect(parsePoly('(x^2+2)^6').find((t) => (t.e.x ?? 0) === 6)!.c.n).toBe(160)
    near(1 + 8 * 0.02 + 28 * 0.0004, 1.1712); near(1 + 8 * 0.02 + 28 * 0.0004 + 56 * 8e-6, 1.171648, 1e-9); near(1.02 ** 8, 1.171659, 1e-5)
    expect(parsePoly('(x+3)^4').find((t) => (t.e.x ?? 0) === 2)!.c.n).toBe(54)
    near(2 ** 6, 64); near(sum(7, (k) => choose(6, k - 1)), 64)
    expect(rEq(parseRat('(x+1)^2'), parseRat('x^2+2x+1'))).toBe(true)
  })
  it('limits of sequences', () => {
    near((3 * 1e8 ** 2 + 1) / (1e8 ** 2 - 5), 3, 1e-6); near((2 * 1e6 + 1) / (1e12 + 3), 0, 1e-5)
    expect((1e6 ** 2 + 1) / (1e6 + 3)).toBeGreaterThan(1e5)
    near((-2 / 3) ** 200, 0, 1e-30); expect(1.1 ** 400).toBeGreaterThan(1e10)
    near((1e6 + Math.sin(1e6)) / 1e6, 1, 2e-6)
    near((4 * 1e7 - 1) / (2 * 1e7 + 5), 2, 1e-6)
    // u_{n+1} = u_n / 2 + 3 -> 6, and the first terms 1, 3.5, 4.75, 5.375
    let u = 1; const firsts: number[] = []
    for (let i = 0; i < 4; i++) { firsts.push(u); u = u / 2 + 3 }
    expect(firsts).toEqual([1, 3.5, 4.75, 5.375])
    for (let i = 0; i < 100; i++) u = u / 2 + 3
    near(u, 6)
    let w = 1; for (let i = 0; i < 200; i++) w = Math.sqrt(2 * w + 3)
    near(w, 3); near(0.5 * 2 + 1, 2)
    let z = 1; for (let i = 0; i < 100; i++) z = 0.5 * z + 1
    near(z, 2)
  })
})
