import { describe, expect, it } from 'vitest'
import { evalExpr, fmtFrac, parseRat, solveEquation } from '../math/algebra'
import { fmtPlusMinus, fmtSet, inSet, parseSet, quadRoots, rootValue, setsEqual, signSet, solveSystem, solveSystem3, vertex } from '../math/solve'

const root = (lhs: string, rhs: string) => solveEquation(parseRat(lhs), parseRat(rhs), 'x').roots.map((f) => f.n / f.d)
const grid = Array.from({ length: 641 }, (_, i) => -40 + i * 0.125)

/** every worked example in the Unit 3 lessons, recomputed from the engines */
describe('unit 3 worked examples', () => {
  it('linear equations', () => {
    expect(root('3x-7', '11')).toEqual([6])
    expect(root('5x-3', '2x+12')).toEqual([5])
    expect(root('2(x+3)-4(x-1)', '6')).toEqual([2])
    expect(root('(x+1)/2+(x-2)/3', '4')).toEqual([5])
    expect(solveEquation(parseRat('3(x-2)'), parseRat('3x+5'), 'x')).toMatchObject({ identity: false, roots: [] })
    expect(solveEquation(parseRat('2(x+1)'), parseRat('2x+2'), 'x').identity).toBe(true)
    expect(root('4x-9', '2x+7')).toEqual([8])
    // formulas
    const env = { u: 3, a: 2, t: 5 }
    const v = env.u + env.a * env.t
    expect(evalExpr('(v-u)/a', { ...env, v })).toBeCloseTo(env.t)
    const R = evalExpr('a*b/(a+b)', { a: 3, b: 6 })
    expect(1 / R).toBeCloseTo(1 / 3 + 1 / 6)
  })
  it('quadratics', () => {
    expect(root('x^2-5x-14', '0')).toEqual([-2, 7])
    expect(root('(x-4)^2', '9')).toEqual([1, 7])
    expect(root('6x^2+x-2', '0').map((x) => Number(x.toFixed(9)))).toEqual([-2 / 3, 1 / 2].map((x) => Number(x.toFixed(9))))
    expect(root('(x+1)(x+3)', '48')).toEqual([-9, 5])
    const q = quadRoots(1, 6, 2)
    expect(q.roots.map(rootValue).map((x) => Number(x.toFixed(3)))).toEqual([-5.646, -0.354])
    expect(fmtPlusMinus(1, 6, 2)).toBe('−3 ± √7')
    expect(root('x^4-5x^2+4', '0')).toEqual([-2, -1, 1, 2])
    expect(root('x^3-4x', '0')).toEqual([-2, 0, 2])
    expect(root('x^2-3x-10', '0')).toEqual([-2, 5])
  })
  it('the quadratic formula', () => {
    expect(quadRoots(2, -3, -4).disc).toBe(41)
    expect(quadRoots(2, -3, -4).roots.map(rootValue).map((x) => Number(x.toFixed(3)))).toEqual([-0.851, 2.351])
    expect(fmtPlusMinus(2, -3, -4)).toBe('(3 ± √41)/4')
    expect(quadRoots(1, -4, -8).disc).toBe(48)
    expect(fmtPlusMinus(1, -4, -8)).toBe('2 ± 2√3')
    expect(quadRoots(1, 4, 7).disc).toBe(-12)
    expect(quadRoots(3, -2, 5).disc).toBe(-56)
    expect(quadRoots(1, -6, 9).disc).toBe(0)
    const v = vertex(2, -8, 5)
    expect([fmtFrac(v.x), fmtFrac(v.y)]).toEqual(['2', '−3'])
    const w = vertex(1, -6, 1)
    expect([fmtFrac(w.x), fmtFrac(w.y)]).toEqual(['3', '−8'])
    // roots of 2x^2 + 3x - 7: sum -3/2, product -7/2, alpha^2 + beta^2 = 37/4
    const r = quadRoots(2, 3, -7).roots.map(rootValue)
    expect(r[0] + r[1]).toBeCloseTo(-1.5)
    expect(r[0] * r[1]).toBeCloseTo(-3.5)
    expect(r[0] ** 2 + r[1] ** 2).toBeCloseTo(37 / 4)
    expect(quadRoots(1, 6, 9).roots.length).toBe(1)
    expect(quadRoots(1, -6, 9).roots.map(rootValue)).toEqual([3])
    // k^2 - 36 = 0
    for (const k of [6, -6]) expect(quadRoots(1, k, 9).disc).toBe(0)
    // roots of x^2 - 5x + 6 sum to 5
    expect(quadRoots(1, -5, 6).roots.map(rootValue).reduce((a, b) => a + b)).toBe(5)
  })
  it('inequalities', () => {
    const same = (a: string, b: string) => expect(setsEqual(parseSet(a), parseSet(b)), `${a} vs ${b}`).toBe(true)
    for (const x of grid) expect(inSet(parseSet('x <= -3'), x)).toBe(-2 * x + 5 >= 11 - 1e-12)
    for (const x of grid) expect(inSet(parseSet('-2 < x <= 4'), x)).toBe(-3 < 2 * x + 1 && 2 * x + 1 <= 9)
    for (const x of grid) expect(inSet(parseSet('x < -2 or x >= 2'), x)).toBe(2 * x - 1 < -5 || 3 * x + 2 >= 8)
    same('x < -2 or x > 3', fmtSet(signSet((x) => x * x - x - 6, [-2, 3], '>')))
    for (const x of grid) expect(inSet(parseSet('x < -2 or x > 3'), x)).toBe(x * x - x - 6 > 0)
    same('x < -2 or x >= 1', fmtSet(signSet((x) => (x - 1) / (x + 2), [1, -2], '>=')))
    for (const x of grid) if (x !== -2) expect(inSet(parseSet('x < -2 or x >= 1'), x)).toBe((x - 1) / (x + 2) >= 0)
    for (const x of grid) expect(inSet(parseSet('x > -4'), x)).toBe(-3 * x < 12)
    for (const x of grid) expect(inSet(parseSet('-1 < x < 4'), x)).toBe((x + 1) * (x - 4) < 0)
    for (const x of grid) if (x !== 3) expect(inSet(parseSet('0 <= x < 3'), x)).toBe(x / (x - 3) <= 0)
    expect(inSet(parseSet('(-inf, 2] U (7, inf)'), 2)).toBe(true)
    for (const x of grid) expect(inSet(parseSet('x = 2'), x)).toBe((x - 2) ** 2 <= 0)
  })
  it('absolute value', () => {
    const solutions = (f: (x: number) => number) => grid.filter((x) => Math.abs(f(x)) < 1e-9)
    expect(solutions((x) => Math.abs(x - 3) - 5)).toEqual([-2, 8])
    for (const x of grid) expect(inSet(parseSet('-2 < x < 8'), x)).toBe(Math.abs(x - 3) < 5)
    for (const x of grid) expect(inSet(parseSet('x <= -4 or x >= 3'), x)).toBe(Math.abs(2 * x + 1) >= 7)
    expect(solutions((x) => Math.abs(2 * x - 1) - (x + 4))).toEqual([-1, 5])
    expect(solutions((x) => Math.abs(x - 6) - (-2 * x + 3))).toEqual([-3])
    expect(solutions((x) => Math.abs(x - 1) + Math.abs(x - 4) - 7)).toEqual([-1, 6])
    expect(solutions((x) => Math.abs(x + 2) - 7)).toEqual([-9, 5])
    for (const x of grid) expect(inSet(parseSet('-3 < x < 3'), x)).toBe(Math.abs(x) < 3)
    expect(solutions((x) => Math.abs(2 * x - 5) + 4)).toEqual([])
  })
  it('systems', () => {
    const s = (a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) => { const r = solveSystem({ a1, b1, c1, a2, b2, c2 }); return r && [fmtFrac(r.x), fmtFrac(r.y)] }
    expect(s(-2, 1, -1, 3, 2, 12)).toEqual(['2', '3'])
    expect(s(3, 2, 16, 5, -2, 8)).toEqual(['3', '7/2'])
    expect(s(2, 3, 7, 3, -2, 4)).toEqual(['2', '1'])
    expect(s(1, 2, 3, 2, 4, 7)).toBeNull()
    expect(s(1, 1, 20, 6, 4, 106)).toEqual(['13', '7'])
    expect(s(1, 1, 5, 1, -1, 1)).toEqual(['3', '2'])
    const r3 = solveSystem3([[1, 1, 1, 6], [0, 2, 5, -4], [2, 5, -1, 27]])!
    expect([r3.x, r3.y, r3.z].map(fmtFrac)).toEqual(['5', '3', '−2'])
    // y = x^2 meets y = x + 6
    expect(quadRoots(1, -1, -6).roots.map(rootValue)).toEqual([-2, 3])
    expect(quadRoots(1, -4, 4).disc).toBe(0)
  })
})
