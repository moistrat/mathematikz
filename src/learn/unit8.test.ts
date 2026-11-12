import { describe, expect, it } from 'vitest'

type C = [number, number]
const add = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]]
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
const div = (a: C, b: C): C => { const m = b[0] ** 2 + b[1] ** 2; return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m] }
const abs = (a: C) => Math.hypot(a[0], a[1])
const pow = (a: C, n: number): C => { let r: C = [1, 0]; for (let i = 0; i < n; i++) r = mul(r, a); return r }
const near = (a: number, b: number, e = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)
const nearC = (a: C, b: C, e = 1e-9) => { near(a[0], b[0], e); near(a[1], b[1], e) }
type V = number[]
const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a: V) => Math.sqrt(dot(a, a))
const sub = (a: V, b: V) => a.map((x, i) => x - b[i])
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const deg = (x: number) => (x * 180) / Math.PI
const cis = (r: number, t: number): C => [r * Math.cos(t), r * Math.sin(t)]

/** every worked example in the Unit 8 lessons, recomputed */
describe('unit 8 worked examples', () => {
  it('complex arithmetic', () => {
    const z: C = [3, 2], w: C = [1, -5]
    nearC(add(z, w), [4, -3]); nearC(mul(z, w), [13, -13])
    nearC(pow([0, 1], 27), [0, -1]); nearC(pow([0, 1], 50), [-1, 0])
    nearC(div([5, 10], [3, -4]), [-1, 2])
    // (x + yi)(1 - i) = 3 + i with x = 1, y = 2
    nearC(mul([1, 2], [1, -1]), [3, 1])
    // z^2 - 4z + 13 = 0 at 2 +- 3i
    for (const r of [[2, 3], [2, -3]] as C[]) nearC(add(add(pow(r, 2), mul([-4, 0], r)), [13, 0]), [0, 0])
    near(abs([3, -4]), 5); near(abs(mul(z, w)), abs(z) * abs(w)); near(abs(z) * abs(w), Math.sqrt(338))
    nearC(mul([2, 3], [1, -1]), [5, 1])
    nearC(pow([0, 3], 2), [-9, 0])
    nearC(div([1, 0], [2, 1]), [2 / 5, -1 / 5])
  })
  it('polar form, de Moivre and roots', () => {
    near(abs([1, Math.sqrt(3)]), 2); near(Math.atan2(Math.sqrt(3), 1), Math.PI / 3)
    near(abs([-1, -1]), Math.SQRT2); near(Math.atan2(-1, -1), (-3 * Math.PI) / 4)
    near(Math.atan2(1, -1), (3 * Math.PI) / 4); near(abs([-3, 4]), 5)
    const d = (x: number) => (x * Math.PI) / 180
    nearC(mul(cis(2, d(30)), cis(3, d(50))), cis(6, d(80))); nearC(div(cis(6, d(80)), cis(2, d(20))), cis(3, d(60)))
    nearC(pow([1, 1], 8), [16, 0], 1e-9); nearC(pow([1, Math.sqrt(3)], 6), [64, 0], 1e-9)
    nearC(pow(cis(2, d(20)), 3), cis(8, d(60)))
    // cube roots of 8
    const roots: C[] = [[2, 0], [-1, Math.sqrt(3)], [-1, -Math.sqrt(3)]]
    for (const r of roots) nearC(pow(r, 3), [8, 0], 1e-9)
    nearC(roots.reduce(add), [0, 0]); nearC(cis(2, d(120)), roots[1]); nearC(cis(2, d(240)), roots[2])
    // fifth roots of unity
    for (let k = 0; k < 5; k++) nearC(pow(cis(1, (2 * Math.PI * k) / 5), 5), [1, 0])
    nearC(cis(1, Math.PI), [-1, 0])
  })
  it('vectors', () => {
    const a = [2, -1, 3], b = [1, 4, -2]
    expect(a.map((x, i) => x + b[i])).toEqual([3, 3, 1]); expect(a.map((x, i) => 2 * x - b[i])).toEqual([3, -6, 8]); near(norm(a) ** 2, 14)
    const u = [2, -1, 2]; near(norm(u), 3); near(dot(u, u) / 9, 1)
    const A = [1, 2, 3], B = [4, -2, 5]
    expect(sub(B, A)).toEqual([3, -4, 2])
    expect(A.map((x, i) => (x + B[i]) / 2)).toEqual([2.5, 0, 4])
    const P = A.map((x, i) => x + (B[i] - x) / 3)
    near(P[0], 2); near(P[1], 2 / 3); near(P[2], 11 / 3)
    expect([6, -9, 12].map((x, i) => x / [2, -3, 4][i])).toEqual([3, 3, 3])
    expect(norm([2, 3, 6])).toBe(7); expect(sub([5, 4], [1, 1])).toEqual([4, 3]); expect([2, 8].map((x, i) => x + [3, -1][i])).toEqual([5, 7])
    expect([-2, 4, -6].map((x) => x / -2)).toEqual([1, -2, 3])
    for (let i = 0; i < 50; i++) { const p = [Math.sin(i), Math.cos(3 * i), i % 5 - 2], q = [i % 3, 1, -i % 4]; expect(norm(p.map((x, j) => x + q[j]))).toBeLessThanOrEqual(norm(p) + norm(q) + 1e-12) }
  })
  it('dot and cross products', () => {
    const a = [2, -1, 3], b = [1, 4, -2]
    near(dot(a, b), -8); near(norm(a) * norm(b), Math.sqrt(294))
    near(deg(Math.acos(dot(a, b) / (norm(a) * norm(b)))), 117.81, 0.01); near(dot(a, b) / (norm(a) * norm(b)), -0.4666, 1e-4)
    // (k, 2, -1) . (3, k, 4) = 0 at k = 4/5
    near(dot([0.8, 2, -1], [3, 0.8, 4]), 0)
    // projection of (4,3) on (2,-1)
    const p = [4, 3], q = [2, -1]; near(dot(p, q), 5); near(dot(q, q), 5); near(dot(p, q) / norm(q), Math.sqrt(5))
    expect(cross(a, b)).toEqual([-10, 7, 9]); expect(dot(cross(a, b), a)).toBe(0); expect(dot(cross(a, b), b)).toBe(0)
    const AB = [-1, 2, 0], AC = [-1, 0, 3]
    expect(cross(AB, AC)).toEqual([6, 3, 2]); near(norm(cross(AB, AC)), 7)
    expect(dot([1, 2, 3], [4, -5, 6])).toBe(12); expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1])
    near(norm(cross(a, b)) ** 2, norm(a) ** 2 * norm(b) ** 2 - dot(a, b) ** 2)
  })
  it('lines and planes', () => {
    const A = [1, 2, 3], d = [3, -4, 2]
    expect(A.map((x, i) => x + 2 * d[i])).toEqual([7, -6, 7])
    // two lines in the plane meet at (2, 5)
    expect([0 + 2 * 1, 1 + 2 * 2]).toEqual([2, 5]); expect([5 - 3, -1 + 2 * 3]).toEqual([2, 5])
    // the plane 6x + 3y + 2z = 6 through A, B, C
    for (const P of [[1, 0, 0], [0, 2, 0], [0, 0, 3]]) expect(dot([6, 3, 2], P)).toBe(6)
    // distance from (1,2,3) to 2x - y + 2z = 4
    near(Math.abs(dot([2, -1, 2], [1, 2, 3]) - 4) / norm([2, -1, 2]), 2 / 3)
    // line meets plane at t = 2: (3, 4, 0)
    const pt = [1 + 2, 2 * 2, 2 - 2]; expect(pt).toEqual([3, 4, 0]); expect(pt[0] + pt[1] + pt[2]).toBe(7)
    near(deg(Math.acos(dot([1, 1, 0], [0, 1, 1]) / 2)), 60)
    near(Math.abs(0 - 9) / norm([1, 2, 2]), 3)
  })
})
