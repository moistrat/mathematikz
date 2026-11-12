import { describe, expect, it } from 'vitest'
import { trigEqual } from '../math/trigAlgebra'
import { rootsIn } from '../math/trigQuestions'

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
const S = (d: number) => Math.sin(rad(d)), C = (d: number) => Math.cos(rad(d)), T = (d: number) => Math.tan(rad(d))
const near = (a: number, b: number, e = 5e-3) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(e)

/** every worked example in the Unit 6 lessons, recomputed */
describe('unit 6 worked examples', () => {
  it('right-angled triangles', () => {
    near(12 * S(35), 6.88); near(9 * T(52), 11.52); near(deg(Math.asin(7 / 12)), 35.7, 0.05)
    near(8 * S(60), 4 * Math.sqrt(3), 1e-9); near(40 * T(28), 21.27); near(80 / T(25), 171.56)
    near(deg(Math.atan(5 / Math.hypot(6, 8))), 26.6, 0.05); near(5 * S(60), 4.33); near(deg(Math.atan(0.75)), 36.9, 0.05); near(10 * S(30), 5, 1e-9)
    // the special-triangle table
    near(S(30), 1 / 2, 1e-9); near(C(30), Math.sqrt(3) / 2, 1e-9); near(T(30), Math.sqrt(3) / 3, 1e-9); near(S(45), Math.SQRT2 / 2, 1e-9); near(T(60), Math.sqrt(3), 1e-9)
  })
  it('the sine and cosine rules', () => {
    near(12 * S(65) / S(40), 16.92)
    const a2 = 49 + 81 - 2 * 7 * 9 * C(52); near(a2, 52.43); near(Math.sqrt(a2), 7.24)
    near(deg(Math.acos((25 + 49 - 100) / 70)), 111.8, 0.05)
    near(0.5 * 8 * 11 * S(70), 41.35)
    const sinB = (10 * S(30)) / 7
    near(sinB, 0.7143, 1e-4); near(deg(Math.asin(sinB)), 45.6, 0.05); near(180 - deg(Math.asin(sinB)), 134.4, 0.05)
    near(Math.sqrt(8 * 8 + 11 * 11), 13.60)
    // bearings: the coordinate method agrees with the cosine rule
    const x = 8 * S(40) + 11 * S(130), y = 8 * C(40) + 11 * C(130)
    near(Math.hypot(x, y), Math.sqrt(185), 1e-9)
    near(10 * S(40), 6.43); near(Math.sqrt(6 * 6 + 9 * 9), Math.sqrt(117), 1e-9)
  })
  it('identities', () => {
    expect(trigEqual('(1-cos(x)^2)/sin(x)', 'sin(x)')).toBe(true)
    expect(trigEqual('sin(x)/(1+cos(x))+(1+cos(x))/sin(x)', '2*csc(x)')).toBe(true)
    expect(trigEqual('tan(x)+cot(x)', 'sec(x)*csc(x)')).toBe(true)
    expect(trigEqual('sec(x)*cos(x)', '1')).toBe(true)
    expect(trigEqual('1-sin(x)^2', 'cos(x)^2')).toBe(true)
    expect(trigEqual('1+tan(x)^2', 'sec(x)^2')).toBe(true)
    // sin 5/13 in QII
    const cosT = -12 / 13; near(cosT * cosT + (5 / 13) ** 2, 1, 1e-12); near((5 / 13) / cosT, -5 / 12, 1e-12); near(1 / cosT, -13 / 12, 1e-12)
    // the false claim: sin(x + y) = sin x + sin y fails at 90, 90
    near(S(180), 0, 1e-9); expect(S(90) + S(90)).toBe(2)
  })
  it('sum, difference and double angle formulas', () => {
    near(S(75), (Math.sqrt(6) + Math.sqrt(2)) / 4, 1e-9); near(S(45) * C(30) + C(45) * S(30), S(75), 1e-12)
    near(T(15), 2 - Math.sqrt(3), 1e-9); near((1 - 1 / Math.sqrt(3)) / (1 + 1 / Math.sqrt(3)), 2 - Math.sqrt(3), 1e-9)
    near(C(15), (Math.sqrt(6) + Math.sqrt(2)) / 4, 1e-9); near(C(165), (-Math.sqrt(6) - Math.sqrt(2)) / 4, 1e-9)
    // sin = 3/5: sin 2 = 24/25, cos 2 = 7/25, tan 2 = 24/7
    const th = Math.asin(3 / 5)
    near(Math.sin(2 * th), 24 / 25, 1e-12); near(Math.cos(2 * th), 7 / 25, 1e-12); near(Math.tan(2 * th), 24 / 7, 1e-12)
    // half angle: cos = 3/5, sin(half) = sqrt(5)/5
    near(Math.sin(Math.acos(3 / 5) / 2), Math.sqrt(5) / 5, 1e-12)
    expect(trigEqual('sin(x)*cos(3x)+cos(x)*sin(3x)', 'sin(4x)')).toBe(true)
    expect(trigEqual('2cos(x)^2-1', 'cos(2x)')).toBe(true)
    expect(trigEqual('cos(x)^2-sin(x)^2', 'cos(2x)')).toBe(true)
    // R-form: 3 sin x + 4 cos x = 5 sin(x + 53.13 degrees)
    const al = deg(Math.atan2(4, 3)); near(al, 53.1, 0.05)
    for (const x of [0, 30, 77, 140, 301]) near(3 * S(x) + 4 * C(x), 5 * S(x + al), 1e-9)
    expect(Math.hypot(5, 12)).toBe(13)
  })
  it('graphs', () => {
    // y = 3 sin(2x - pi/3) + 1 = 3 sin(2(x - pi/6)) + 1
    for (const x of [0, 0.7, 1.9, 4.2]) near(3 * Math.sin(2 * x - Math.PI / 3) + 1, 3 * Math.sin(2 * (x - Math.PI / 6)) + 1, 1e-12)
    near(1 + 3, 4, 1e-12); near(1 - 3, -2, 1e-12)
    // maximum 5, minimum -1, period pi, maximum at 0: 3 cos 2x + 2
    near(3 * Math.cos(0) + 2, 5, 1e-12); near(3 * Math.cos(2 * (Math.PI / 2)) + 2, -1, 1e-12)
    // tan 2x asymptotes
    near(Math.cos(2 * (Math.PI / 4)), 0, 1e-12); near(Math.cos(2 * ((3 * Math.PI) / 4)), 0, 1e-12)
    // tide
    near(12 + 4 * Math.sin((Math.PI * 1.5) / 3), 16, 1e-12); near(2 * Math.PI / (Math.PI / 3), 6, 1e-12)
    near(2 * Math.PI / 4, Math.PI / 2, 1e-12); near((7 + 1) / 2, 4, 1e-12)
    near(Math.cos(2 * (Math.PI / 2) - Math.PI), Math.cos(0), 1e-12) // cos(2x - pi) at x = pi/2 is cos 0
  })
  it('trigonometric equations', () => {
    const roots = (f: (d: number) => number, lo: number, hi: number) => rootsIn(f, lo, hi).map(Math.round)
    expect(roots((d) => S(d) - Math.sqrt(3) / 2, 0, 720)).toEqual([60, 120, 420, 480])
    expect(roots((d) => S(2 * d) - Math.sqrt(3) / 2, 0, 360)).toEqual([30, 60, 210, 240])
    expect(roots((d) => C(d - 60) - 0.5, 0, 360)).toEqual([0, 120, 360])
    expect(roots((d) => 2 * S(d) ** 2 - S(d) - 1, 0, 360)).toEqual([90, 210, 330])
    expect(roots((d) => S(2 * d) - C(d), 0, 360)).toEqual([30, 90, 150, 270])
    expect(roots((d) => C(d) - 0.5, 0, 720).length).toBe(4)
    expect(roots((d) => S(3 * d) - 0.5, 0, 360).length).toBe(6)
    expect(roots((d) => T(d) - Math.sqrt(3), 0, 360)).toEqual([60, 240])
    near(S(210), -0.5, 1e-12)
    // sin 2x = sin x, dividing by sin x would lose x = 0, 180, 360
    expect(roots((d) => S(2 * d) - S(d), 0, 360)).toEqual([0, 60, 180, 300, 360])
  })
})
