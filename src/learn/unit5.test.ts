import { describe, expect, it } from 'vitest'
import { fmtFrac, fmtPoly, fr, parsePoly, parseRat, pDivide, pEvalFrac, rEq } from '../math/algebra'
import { inSet, parseSet, signSet, vertex } from '../math/solve'

const at = (src: string, x: number) => { const r = parseRat(src); return pEvalFrac(r.n, { x: fr(x) }).n / pEvalFrac(r.n, { x: fr(x) }).d / (pEvalFrac(r.d, { x: fr(x) }).n / pEvalFrac(r.d, { x: fr(x) }).d) }
const grid = Array.from({ length: 481 }, (_, i) => -30 + i * 0.125)

/** every worked example in the Unit 5 lessons, recomputed */
describe('unit 5 worked examples', () => {
  it('functions', () => {
    expect(at('2x^2-3x+1', -2)).toBe(15)
    expect(rEq(parseRat('2(a+1)^2-3(a+1)+1'), parseRat('2a^2+a'))).toBe(true)
    // domain of sqrt(x+4)/(x-2)
    const dom = parseSet('x >= -4 and x != 2')
    for (const x of grid) expect(inSet(dom, x), `${x}`).toBe(x >= -4 && x !== 2)
    // ranges
    const vy = vertex(-1, 0, 4); expect(fmtFrac(vy.y)).toBe('4')
    // piecewise
    const f = (x: number) => (x < 2 ? x + 1 : x * x)
    expect([f(1), f(2), f(3)]).toEqual([2, 4, 9])
    expect(2 * 3 + 1).toBe(3 * 3 - 2) // k = 3
    // difference quotient 3x^2 - x
    expect(rEq(parseRat('(3(x+h)^2-(x+h)-(3x^2-x))/h'), parseRat('6x+3h-1'))).toBe(true)
    expect(at('x^2-3x', -1)).toBe(4)
  })
  it('transformations', () => {
    // the point (4,5) on y = 2 f(x-1) + 3 -> (5, 13); (6,-2) on f(2x) -> (3,-2); (2,5) on f(x/3) -> (6,5)
    expect([4 + 1, 2 * 5 + 3]).toEqual([5, 13])
    expect(6 / 2).toBe(3); expect(2 * 3).toBe(6)
    // reflect then shift vs shift then reflect
    expect(rEq(parseRat('-(x^2)+3'), parseRat('-x^2+3'))).toBe(true)
    expect(rEq(parseRat('-(x^2+3)'), parseRat('-x^2-3'))).toBe(true)
    // parabola with vertex (2,-3) through (4,5)
    expect(rEq(parseRat('2(x-2)^2-3'), parseRat('2x^2-8x+5'))).toBe(true)
    expect(at('2(x-2)^2-3', 4)).toBe(5)
  })
  it('composition and inverses', () => {
    expect(rEq(parseRat('((2x-3)^2+1)'), parseRat('4x^2-12x+10'))).toBe(true)
    expect(rEq(parseRat('2(x^2+1)-3'), parseRat('2x^2-1'))).toBe(true)
    // inverse of 3x - 5 and of (2x+1)/(x-3)
    for (const x of [-3, 0, 2, 7]) expect(at('3*((x+5)/3)-5', x)).toBeCloseTo(x)
    expect(rEq(parseRat('(2((3x+1)/(x-2))+1)/(((3x+1)/(x-2))-3)'), parseRat('x'))).toBe(true)
    // restricted quadratic: f(5) = 12, so f^-1(12) = 5
    expect(at('(x-2)^2+3', 5)).toBe(12)
    expect(2 + Math.sqrt(12 - 3)).toBe(5)
    expect(rEq(parseRat('2((x-1)/2)+1'), parseRat('x'))).toBe(true)
    expect(rEq(parseRat('(2x+1-1)/2'), parseRat('x'))).toBe(true)
    expect(at('x^2', 3) + 2).toBe(11)
    expect(at('(x+8)/4', 0)).toBe(2)
  })
  it('polynomial graphs', () => {
    expect(at('(x+2)(x-1)^2(x-3)', 0)).toBe(-6)
    const f = (x: number) => (x + 2) * (x - 1) ** 2 * (x - 3)
    const set = parseSet('x <= -2 or x = 1 or x >= 3')
    expect(signSet(f, [-2, 1, 3], '>=').length).toBe(3)
    for (const x of grid) if (![-2, 1, 3].includes(x)) expect(inSet(set, x), `${x}`).toBe(f(x) >= 0)
    for (const x of [-2, 1, 3]) expect(inSet(set, x)).toBe(true)
    // a cubic with roots -1 and a double root 2 through (0,8)
    expect(rEq(parseRat('2(x+1)(x-2)^2'), parseRat('2x^3-6x^2+8'))).toBe(true)
    expect(at('2(x+1)(x-2)^2', 0)).toBe(8)
    for (const x of grid) expect(inSet(parseSet('-2 < x < 1'), x)).toBe((x - 1) * (x + 2) < 0)
  })
  it('rational functions', () => {
    // (x^2-4)/(x^2-x-6): hole at (-2, 4/5), vertical asymptote x = 3, intercepts (2,0) and (0, 2/3)
    expect(rEq(parseRat('(x^2-4)/(x^2-x-6)'), parseRat('(x-2)/(x-3)'))).toBe(true)
    expect(at('(x-2)/(x-3)', -2)).toBeCloseTo(4 / 5)
    expect(at('(x^2-4)/(x^2-x-6)', 0)).toBeCloseTo(2 / 3)
    expect(at('(x^2-4)/(x^2-x-6)', 2)).toBeCloseTo(0)
    // oblique asymptote of (x^2 + x - 6)/(x - 1)
    const { q, r } = pDivide(parsePoly('x^2+x-6'), parsePoly('x-1'))
    expect(fmtPoly(q, true)).toBe('x + 2')
    expect(fmtPoly(r, true)).toBe('-4')
    // horizontal asymptotes by degrees
    expect(Math.abs(at('(3x^2+1)/(x^2-4)', 1e6) - 3)).toBeLessThan(1e-4)
    expect(Math.abs(at('(x+1)/(x^2+1)', 1e6))).toBeLessThan(1e-4)
    expect(at('(6x^2+1)/(2x^2-5)', 1e6)).toBeCloseTo(3, 3)
  })
  it('models', () => {
    expect((at('x^2-3x', 4) - at('x^2-3x', 1)) / 3).toBe(2)
    expect(4 + 3 * 4 + 2 * 4).toBe(24)
    const v = vertex(-2, 80, 0); expect(fmtFrac(v.x)).toBe('20'); expect(fmtFrac(v.y)).toBe('800')
    const b = vertex(-5, 20, 1); expect([fmtFrac(b.x), fmtFrac(b.y)]).toEqual(['2', '21'])
    // symmetry
    const odd = (f: (x: number) => number) => [1, 2, 3.5].every((x) => Math.abs(f(-x) + f(x)) < 1e-9)
    const even = (f: (x: number) => number) => [1, 2, 3.5].every((x) => Math.abs(f(-x) - f(x)) < 1e-9)
    expect(odd((x) => x ** 3 - x)).toBe(true)
    expect(even((x) => x ** 4 - 3 * x * x)).toBe(true)
    expect(even((x) => x * x + x) || odd((x) => x * x + x)).toBe(false)
    expect(odd((x) => x ** 3 + x)).toBe(true)
    expect(at('x^2', 3) - at('x^2', 1)).toBe(8)
    expect((at('x^2', 3) - at('x^2', 1)) / 2).toBe(4)
  })
})
