/**
 * Question generators for the lines and linear systems unit: the coordinate plane and slope, equations of lines, solving
 * systems of linear equations, and linear models.
 */
import { fAdd, fDiv, fMul, fr, fSub, Frac } from './algebra'
import { ri, rnz } from './algebraQuestions'
import { fm, MN, numSpec, tupleSpec } from './calcHelpers'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const words = (prompt: string, ws: string[], opts: string[], hint: string, expl: string[]): Spec => ({ prompt, kind: 'word', answers: [], display: ws[0], input: ws[0], words: ws, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: false, extra: opts } })
const pt = (x: number, y: number) => `(${A(x)}, ${A(y)})`
const F = (n: number, d = 1) => fr(n, d)
/** y = m x + b for fractions */
const lineText = (m: Frac, b: Frac) => {
  const ms = m.n === 0 ? '' : `${m.n < 0 ? '−' : ''}${Math.abs(m.n) === m.d ? '' : m.d === 1 ? Math.abs(m.n) : `${Math.abs(m.n)}/${m.d}`}x`
  const bs = b.n === 0 ? '' : `${ms ? (b.n < 0 ? ' − ' : ' + ') : b.n < 0 ? '−' : ''}${fm(F(Math.abs(b.n), b.d))}`
  return `y = ${ms || bs ? `${ms}${bs}` : '0'}`
}
/** a x + b y = c as text */
const std = (a: number, b: number, c: number) => `${a === 1 ? '' : a === -1 ? '−' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${A(c)}`

/* ------------------------------------------------------------------ slope and the coordinate plane */

export const SLOPE_GENS: Gen[] = [
  { lesson: 'slope-lines', level: 1, make: (r) => {
    const x = ri(r, -9, 9), y = ri(r, -9, 9), onAxis = r() < 0.2
    const px = onAxis && r() < 0.5 ? 0 : x, py = onAxis && px !== 0 ? 0 : (onAxis ? y : y)
    const q = px > 0 && py > 0 ? 1 : px < 0 && py > 0 ? 2 : px < 0 && py < 0 ? 3 : px > 0 && py < 0 ? 4 : 0
    if (q === 0) return SLOPE_GENS[0].make(r)
    const ws = [['quadrant 1', 'quadrant i', 'i', '1', 'first quadrant', 'quadrant one'], ['quadrant 2', 'quadrant ii', 'ii', '2', 'second quadrant', 'quadrant two'], ['quadrant 3', 'quadrant iii', 'iii', '3', 'third quadrant', 'quadrant three'], ['quadrant 4', 'quadrant iv', 'iv', '4', 'fourth quadrant', 'quadrant four']][q - 1]
    return words(`In which quadrant is the point ${pt(px, py)}? (Answer 1, 2, 3 or 4.)`, ws, ['1', '2', '3', '4'], 'Quadrant 1 is (+, +), quadrant 2 is (−, +), quadrant 3 is (−, −) and quadrant 4 is (+, −), going anticlockwise from the top right.', [`The x-coordinate is ${px > 0 ? 'positive' : 'negative'} and the y-coordinate is ${py > 0 ? 'positive' : 'negative'}: quadrant ${q}.`])
  } },
  { lesson: 'slope-lines', level: 1, make: (r) => {
    for (;;) {
      const x1 = ri(r, -6, 6), y1 = ri(r, -6, 6), x2 = ri(r, -6, 6), y2 = ri(r, -6, 6)
      if (x1 === x2) continue
      const m = F(y2 - y1, x2 - x1)
      return numSpec(`Find the slope of the line through ${pt(x1, y1)} and ${pt(x2, y2)}.`, m, 'Slope = rise ÷ run = (y₂ − y₁)/(x₂ − x₁).', [`Rise = ${A(y2)} − ${y1 < 0 ? `(${A(y1)})` : y1} = ${A(y2 - y1)}. Run = ${A(x2)} − ${x1 < 0 ? `(${A(x1)})` : x1} = ${A(x2 - x1)}.`, `Slope = ${A(y2 - y1)}/${A(x2 - x1)} = ${fm(m)}.`])
    }
  } },
  { lesson: 'slope-lines', level: 2, make: (r) => {
    const a = rnz(r, -7, 8), b = rnz(r, -7, 8), c = ri(r, -12, 12)
    const m = F(-a, b)
    return numSpec(`Find the slope of the line ${std(a, b, c)}.`, m, 'Rearrange into y = mx + b by solving for y: the slope is the coefficient of x.', [`Move the x term: ${A(b)}y = ${A(-a)}x + ${A(c)}.`.replace('+ −', '− '), `Divide by ${A(b)}: y = ${fm(m)}x + …, so the slope is ${fm(m)}.`])
  } },
  { lesson: 'slope-lines', level: 2, make: (r) => {
    for (;;) {
      const a = rnz(r, -6, 7), b = rnz(r, -6, 7), c = ri(r, 1, 6) * a * b / gcd(a, b) * (r() < 0.5 ? 1 : -1)
      const xi = F(c, a), yi = F(c, b)
      return tupleSpec(`Find the x-intercept and the y-intercept of the line ${std(a, b, c)}. Give them as (x-intercept, y-intercept).`, [xi, yi], 'For the x-intercept set y = 0. For the y-intercept set x = 0.', [`Set y = 0: ${A(a)}x = ${A(c)}, so x = ${fm(xi)}.`, `Set x = 0: ${A(b)}y = ${A(c)}, so y = ${fm(yi)}.`])
    }
  } },
  { lesson: 'slope-lines', level: 2, make: (r) => {
    const m = F(rnz(r, -7, 7), ri(r, 1, 4)), perp = r() < 0.7
    const v = perp ? F(-m.d, m.n) : m
    return numSpec(`A line has slope ${fm(m)}. What is the slope of a line ${perp ? 'perpendicular' : 'parallel'} to it?`, v, perp ? 'Perpendicular lines have slopes whose product is −1: take the negative reciprocal.' : 'Parallel lines have equal slopes.', [perp ? `The negative reciprocal of ${fm(m)} is −1/(${fm(m)}) = ${fm(v)}.` : `Parallel lines have the same slope: ${fm(m)}.`])
  } },
  { lesson: 'slope-lines', level: 3, make: (r) => {
    const x1 = ri(r, -5, 3), y1 = ri(r, -5, 5), dx = ri(r, 1, 4), dy = rnz(r, -4, 4), col = r() < 0.5, k = ri(r, 2, 3)
    const p3 = col ? [x1 + k * dx, y1 + k * dy] : [x1 + k * dx, y1 + k * dy + rnz(r, -3, 3)]
    const same = (p3[1] - y1) * dx === dy * (p3[0] - x1)
    return words(`Are the points ${pt(x1, y1)}, ${pt(x1 + dx, y1 + dy)} and ${pt(p3[0], p3[1])} on one straight line? Answer yes or no.`, same ? ['yes', 'collinear', 'yes, collinear'] : ['no', 'not collinear'], ['yes', 'no'], 'Points are collinear when the slope between the first two equals the slope between the first and the third.', [`Slope of the first two: ${A(dy)}/${dx} = ${fm(F(dy, dx))}.`, `Slope from the first to the third: ${A(p3[1] - y1)}/${A(p3[0] - x1)} = ${fm(F(p3[1] - y1, p3[0] - x1))}.`, same ? 'The slopes are equal, so the points are collinear.' : 'The slopes differ, so they are not on one line.'])
  } },
  { lesson: 'slope-lines', level: 3, make: (r) => {
    const a = ri(r, 1, 6), b = ri(r, 1, 6), k = ri(r, 1, 4), c = k * a * b
    const area = F(c * c, 2 * a * b)
    return numSpec(`The line ${a}x + ${b}y = ${c} cuts off a triangle with the two axes. What is the area of the triangle?`, area, 'The triangle has its right angle at the origin: its legs are the x-intercept and y-intercept. Area = ½ × base × height.', [`x-intercept: ${c}/${a} = ${fm(F(c, a))}. y-intercept: ${c}/${b} = ${fm(F(c, b))}.`, `Area = ½ × ${fm(F(c, a))} × ${fm(F(c, b))} = ${fm(area)}.`])
  } },
  { lesson: 'slope-lines', level: 3, make: (r) => {
    const x1 = ri(r, -5, 4), y1 = ri(r, -6, 6), dx = ri(r, 1, 5), m = F(rnz(r, -4, 4), ri(r, 1, 3))
    const y2 = fAdd(F(y1), fMul(m, F(dx)))
    return numSpec(`The line through ${pt(x1, y1)} and (${A(x1 + dx)}, k) has slope ${fm(m)}. Find k.`, y2, 'Use slope = (y₂ − y₁)/(x₂ − x₁) and solve for the missing coordinate.', [`${fm(m)} = (k − ${y1 < 0 ? `(${A(y1)})` : y1})/${dx}.`, `So k − ${y1 < 0 ? `(${A(y1)})` : y1} = ${fm(fMul(m, F(dx)))} and k = ${fm(y2)}.`])
  } },
  { lesson: 'slope-lines', level: 3, make: (r) => {
    const x1 = rnz(r, -6, -1), y1 = rnz(r, -6, 6), x2 = rnz(r, 1, 7), y2 = rnz(r, -6, 6)
    const mx = F(x1 + x2, 2), my = F(y1 + y2, 2)
    return tupleSpec(`Find the midpoint of the segment joining ${pt(x1, y1)} and ${pt(x2, y2)}. Give it as (x, y).`, [mx, my], 'The midpoint averages the coordinates: ((x₁ + x₂)/2, (y₁ + y₂)/2).', [`x: (${A(x1)} + ${A(x2)})/2 = ${fm(mx)}. y: (${A(y1)} + ${A(y2)})/2 = ${fm(my)}.`, `The midpoint is (${fm(mx)}, ${fm(my)}).`])
  } },
]

/* ------------------------------------------------------------------ equations of lines */

export const LINE_GENS: Gen[] = [
  { lesson: 'line-equations', level: 1, make: (r) => {
    const m = rnz(r, -6, 6), x0 = ri(r, -5, 5), b = ri(r, -8, 8), y0 = m * x0 + b
    return numSpec(`A line has slope ${A(m)} and passes through ${pt(x0, y0)}. What is its y-intercept?`, F(b), 'Use y = mx + b: substitute the point and the slope, then solve for b.', [`${A(y0)} = ${A(m)}(${A(x0)}) + b, so ${A(y0)} = ${A(m * x0)} + b.`, `b = ${A(y0)} − ${m * x0 < 0 ? `(${A(m * x0)})` : m * x0} = ${A(b)}.`])
  } },
  { lesson: 'line-equations', level: 1, make: (r) => {
    const m = rnz(r, -6, 6), b = rnz(r, -9, 9), x = ri(r, -6, 6)
    return numSpec(`For the line ${lineText(F(m), F(b))}, find y when x = ${A(x)}.`, F(m * x + b), 'Substitute the value of x into the equation.', [`y = ${A(m)}(${A(x)}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${A(m * x + b)}.`])
  } },
  { lesson: 'line-equations', level: 2, make: (r) => {
    for (;;) {
      const x1 = ri(r, -5, 5), y1 = ri(r, -6, 6), x2 = ri(r, -5, 5), y2 = ri(r, -6, 6)
      if (x1 === x2) continue
      const m = F(y2 - y1, x2 - x1), b = fSub(F(y1), fMul(m, F(x1)))
      return tupleSpec(`Find the equation y = mx + b of the line through ${pt(x1, y1)} and ${pt(x2, y2)}. Give it as (m, b).`, [m, b], 'Find the slope m first, then substitute one of the points into y = mx + b to find b.', [`m = (${A(y2)} − ${y1 < 0 ? `(${A(y1)})` : y1})/(${A(x2)} − ${x1 < 0 ? `(${A(x1)})` : x1}) = ${fm(m)}.`, `Using ${pt(x1, y1)}: ${A(y1)} = ${fm(m)}(${A(x1)}) + b, so b = ${fm(b)}.`, `The line is ${lineText(m, b)}.`])
    }
  } },
  { lesson: 'line-equations', level: 2, make: (r) => {
    const m = F(rnz(r, -5, 5), ri(r, 1, 3)), x0 = ri(r, -5, 5), y0 = ri(r, -6, 6), perp = r() < 0.5
    const mm = perp ? F(-m.d, m.n) : m, b = fSub(F(y0), fMul(mm, F(x0)))
    return tupleSpec(`Find the line through ${pt(x0, y0)} that is ${perp ? 'perpendicular' : 'parallel'} to y = ${fm(m)}x + 1. Give it as (m, b) for y = mx + b.`, [mm, b], perp ? 'A perpendicular line has slope equal to the negative reciprocal. Then use the point to find b.' : 'A parallel line has the same slope. Use the point to find b.', [`The new slope is ${fm(mm)}.`, `${A(y0)} = ${fm(mm)}(${A(x0)}) + b gives b = ${fm(b)}.`, `The line is ${lineText(mm, b)}.`])
  } },
  { lesson: 'line-equations', level: 2, make: (r) => {
    for (;;) {
      const a = rnz(r, -7, 7), b = rnz(r, -7, 7), c = ri(r, -12, 12)
      const m = F(-a, b), q = F(c, b)
      return tupleSpec(`Write ${std(a, b, c)} in the form y = mx + b. Give (m, b).`, [m, q], 'Solve for y: move the x term to the other side, then divide every term by the coefficient of y.', [`${A(b)}y = ${A(-a)}x + ${A(c)}.`.replace('+ −', '− '), `Divide by ${A(b)}: y = ${fm(m)}x + ${fm(q)}.`.replace('+ −', '− ')])
    }
  } },
  { lesson: 'line-equations', level: 2, make: (r) => {
    // point-slope form to find a missing value
    const m = rnz(r, -5, 5), x0 = ri(r, -4, 4), y0 = ri(r, -6, 6), x = ri(r, -6, 6)
    return numSpec(`A line passes through ${pt(x0, y0)} and has slope ${A(m)}. What is y when x = ${A(x)}?`, F(y0 + m * (x - x0)), 'Point-slope form: y − y₀ = m(x − x₀).', [`y − ${y0 < 0 ? `(${A(y0)})` : y0} = ${A(m)}(${A(x)} − ${x0 < 0 ? `(${A(x0)})` : x0}).`, `y = ${A(y0)} + ${A(m)}(${A(x - x0)}) = ${A(y0 + m * (x - x0))}.`])
  } },
  { lesson: 'line-equations', level: 3, make: (r) => {
    for (;;) {
      const x1 = ri(r, -5, 5), y1 = ri(r, -6, 6), x2 = ri(r, -5, 5), y2 = ri(r, -6, 6)
      if (x1 === x2 || y1 === y2) continue
      const m = F(y2 - y1, x2 - x1), xi = fSub(F(x1), fDiv(F(y1), m))
      return numSpec(`Find the x-intercept of the line through ${pt(x1, y1)} and ${pt(x2, y2)}.`, xi, 'Find the equation of the line, then set y = 0 and solve for x.', [`The slope is ${fm(m)}.`, `y − ${y1 < 0 ? `(${A(y1)})` : y1} = ${fm(m)}(x − ${x1 < 0 ? `(${A(x1)})` : x1}). Put y = 0: x = ${A(x1)} − ${fm(fDiv(F(y1), m))} = ${fm(xi)}.`.replace('− −', '+ ')])
    }
  } },
  { lesson: 'line-equations', level: 3, make: (r) => {
    const x1 = ri(r, -4, 4), y1 = ri(r, -5, 5), dx = ri(r, 1, 3), dy = rnz(r, -4, 4), t = ri(r, 2, 4), off = ri(r, 0, 1) ? 0 : 0
    void off
    const kx = x1 + t * dx, ky = y1 + t * dy
    return numSpec(`The points ${pt(x1, y1)}, ${pt(x1 + dx, y1 + dy)} and (${A(kx)}, k) lie on a straight line. Find k.`, F(ky), 'All three points must have the same slope between them.', [`The slope of the first two points is ${A(dy)}/${dx} = ${fm(F(dy, dx))}.`, `(k − ${y1 < 0 ? `(${A(y1)})` : y1})/(${A(kx)} − ${x1 < 0 ? `(${A(x1)})` : x1}) = ${fm(F(dy, dx))}, so k = ${A(ky)}.`])
  } },
  { lesson: 'line-equations', level: 3, make: (r) => {
    for (;;) {
      const x1 = ri(r, -5, 1), y1 = ri(r, -6, 6), x2 = x1 + ri(r, 2, 8), y2 = ri(r, -6, 6)
      if (y1 === y2) continue
      const m = F(y2 - y1, x2 - x1), pm = F(-1).n === -1 ? F(-(x2 - x1), y2 - y1) : m
      const mx = F(x1 + x2, 2), my = F(y1 + y2, 2), b = fSub(my, fMul(pm, mx))
      return tupleSpec(`Find the perpendicular bisector of the segment joining ${pt(x1, y1)} and ${pt(x2, y2)}. Give it as (m, b) for y = mx + b.`, [pm, b], 'The perpendicular bisector passes through the midpoint with slope equal to the negative reciprocal of the segment’s slope.', [`Midpoint = (${fm(mx)}, ${fm(my)}). The segment’s slope is ${fm(m)}, so the bisector’s slope is ${fm(pm)}.`, `${fm(my)} = ${fm(pm)}(${fm(mx)}) + b gives b = ${fm(b)}.`])
    }
  } },
]

/* ------------------------------------------------------------------ systems of linear equations */

/** two lines through a chosen point (x, y), as a1 x + b1 y = c1 and a2 x + b2 y = c2 */
function system(r: () => number) {
  for (;;) {
    const x = ri(r, -6, 7), y = ri(r, -6, 7), a1 = rnz(r, -5, 5), b1 = rnz(r, -5, 5), a2 = rnz(r, -5, 5), b2 = rnz(r, -5, 5)
    if (a1 * b2 - a2 * b1 === 0) continue
    return { x, y, a1, b1, a2, b2, c1: a1 * x + b1 * y, c2: a2 * x + b2 * y }
  }
}

export const SYS_GENS: Gen[] = [
  { lesson: 'linear-systems', level: 1, make: (r) => {
    // two equations in the form y = ...
    for (;;) {
      const x = ri(r, -5, 6), y = ri(r, -6, 8), m1 = rnz(r, -4, 4), m2 = rnz(r, -4, 4)
      if (m1 === m2) continue
      const b1 = y - m1 * x, b2 = y - m2 * x
      return tupleSpec(`Solve the system y = ${A(m1)}x ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} and y = ${A(m2)}x ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)}. Give (x, y).`.replace('+ 0', '').replace('− 0', ''), [F(x), F(y)], 'Both expressions equal y, so set them equal to each other (substitution), solve for x, then find y.', [`${A(m1)}x ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${A(m2)}x ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)}.`, `Collect: ${A(m1 - m2)}x = ${A(b2 - b1)}, so x = ${A(x)}.`, `y = ${A(m1)}(${A(x)}) ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${A(y)}.`])
    }
  } },
  { lesson: 'linear-systems', level: 1, make: (r) => {
    const m = rnz(r, -4, 4), b = rnz(r, -6, 6), kind = pick(r, ['one', 'none', 'inf'] as const)
    const m2 = kind === 'one' ? m + rnz(r, 1, 3) : m, b2 = kind === 'inf' ? b : kind === 'none' ? b + rnz(r, 1, 4) : rnz(r, -6, 6)
    const ws = kind === 'one' ? ['one solution', 'one', 'exactly one solution', 'one point'] : kind === 'none' ? ['no solution', 'none', 'no solutions', 'parallel'] : ['infinitely many solutions', 'infinite', 'infinitely many', 'the same line']
    return words(`How many solutions does the system ${lineText(F(m), F(b))} and ${lineText(F(m2), F(b2))} have: one solution, no solution, or infinitely many?`, ws, ['one solution', 'no solution', 'infinitely many solutions'], 'Compare the slopes and intercepts. Different slopes: the lines cross once. Same slope, different intercepts: parallel. Same slope and intercept: the same line.', [kind === 'one' ? 'The slopes are different, so the lines cross at exactly one point.' : kind === 'none' ? 'The slopes are equal but the intercepts differ: parallel lines never meet.' : 'The slopes and intercepts are equal: the equations describe the same line.'])
  } },
  { lesson: 'linear-systems', level: 2, make: (r) => {
    const s = system(r)
    return tupleSpec(`Solve the system ${std(s.a1, s.b1, s.c1)} and ${std(s.a2, s.b2, s.c2)}. Give (x, y).`, [F(s.x), F(s.y)], 'Use elimination: multiply the equations so that one letter has equal and opposite coefficients, then add. Or use substitution.', [`Multiply to match the x coefficients: ${A(s.a2)}(first) and ${A(s.a1)}(second) both have x coefficient ${A(s.a1 * s.a2)}. Subtract to eliminate x.`, `This gives y = ${A(s.y)}, and then x = ${A(s.x)}.`, `Check in the first equation: ${A(s.a1)}(${A(s.x)}) + ${A(s.b1)}(${A(s.y)}) = ${A(s.c1)}.`])
  } },
  { lesson: 'linear-systems', level: 2, make: (r) => {
    const adult = ri(r, 3, 12), child = ri(r, 3, 12), pa = ri(r, 6, 12), pc = ri(r, 2, 5)
    return numSpec(`Adult tickets cost ${pa} dollars and child tickets cost ${pc} dollars. A group buys ${adult + child} tickets for ${pa * adult + pc * child} dollars. How many adult tickets did they buy?`, F(adult), 'Let a and c be the numbers of adult and child tickets. Write one equation for the number of tickets and one for the money, then solve.', [`a + c = ${adult + child} and ${pa}a + ${pc}c = ${pa * adult + pc * child}.`, `Substitute c = ${adult + child} − a: ${pa}a + ${pc}(${adult + child} − a) = ${pa * adult + pc * child}, so ${pa - pc}a = ${pa * adult + pc * child - pc * (adult + child)} and a = ${adult}.`])
  } },
  { lesson: 'linear-systems', level: 2, make: (r) => {
    const m = rnz(r, -4, 4), c = rnz(r, -6, 6), x = ri(r, -4, 4), y = ri(r, -6, 6), gt = r() < 0.5
    const line = m * x + c, ok = gt ? y > line : y < line
    return words(`Is the point ${pt(x, y)} a solution of the inequality y ${gt ? '>' : '<'} ${A(m)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}? Answer yes or no.`.replace(' + 0', ''), ok ? ['yes', 'it is a solution'] : ['no', 'it is not a solution'], ['yes', 'no'], 'Substitute the x and y values and check whether the statement is true.', [`Right side: ${A(m)}(${A(x)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${A(line)}.`, `Is ${A(y)} ${gt ? '>' : '<'} ${A(line)}? ${ok ? 'Yes' : 'No'}.`])
  } },
  { lesson: 'linear-systems', level: 3, make: (r) => {
    // the value of k that gives no solution
    const a = rnz(r, -4, 5), b = rnz(r, -4, 5), c = ri(r, 1, 9), d = rnz(r, -4, 5), k0 = F(a * d, b)
    if (b === 0) return SYS_GENS[5].make(r)
    return numSpec(`For which value of k has the system ${std(a, b, c)} and kx + ${A(d)}y = 7 no solution? (Hint: the lines must be parallel.)`.replace('+ −', '− '), F(a * d, b), 'No solution means parallel lines: the coefficients of x and y must be in the same ratio, a/k = b/d.', [`Parallel lines: ${A(a)}/k = ${A(b)}/${A(d)}.`, `Cross-multiply: ${A(a)} × ${A(d)} = ${A(b)}k, so k = ${fm(k0)}.`])
  } },
  { lesson: 'linear-systems', level: 3, make: (r) => {
    const fixed = ri(r, 2, 8) * 100, unitCost = ri(r, 3, 12), price = unitCost + ri(r, 2, 10), n = Math.ceil(fixed / (price - unitCost))
    const nBreak = F(fixed, price - unitCost)
    return tupleSpec(`A business has fixed costs of ${fixed} dollars plus ${unitCost} dollars per item, and sells each item for ${price} dollars. Find the break-even point as (number of items, money in dollars). Give fractions if needed.`, [nBreak, fMul(nBreak, F(price))], 'Break-even is where cost = revenue. Write C = fixed + (cost per item) × n and R = (price) × n, and set them equal.', [`${fixed} + ${unitCost}n = ${price}n, so ${price - unitCost}n = ${fixed} and n = ${fm(nBreak)}.`, `Revenue there: ${price} × ${fm(nBreak)} = ${fm(fMul(nBreak, F(price)))} dollars. (Selling ${n} items makes the first profit.)`])
  } },
  { lesson: 'linear-systems', level: 3, make: (r) => {
    const p1 = pick(r, [10, 20, 25]), p2 = pick(r, [50, 60, 80]), target = pick(r, [30, 35, 40]), total = ri(r, 2, 10) * 10
    if (!(p1 < target && target < p2)) return SYS_GENS[7].make(r)
    const x = F(total * (p2 - target), p2 - p1)
    return numSpec(`How many litres of a ${p1}% acid solution must be mixed with a ${p2}% acid solution to make ${total} litres of a ${target}% solution? Give the amount of the ${p1}% solution (fraction or decimal).`, x, 'Let x and y be the two volumes. One equation: x + y = total. Another: the amounts of pure acid add up.', [`x + y = ${total}, and the pure acid adds up: (${p1}/100)x + (${p2}/100)y = (${target}/100) × ${total}.`, `Substitute y = ${total} − x: ${p1}x + ${p2}(${total} − x) = ${target * total}, so ${p2 - p1}x = ${p2 * total - target * total} and x = ${fm(x)}.`])
  } },
]

/* ------------------------------------------------------------------ linear models */

export const MODEL_GENS: Gen[] = [
  { lesson: 'linear-models', level: 1, make: (r) => {
    const t1 = ri(r, 0, 4), t2 = t1 + ri(r, 2, 6), rate = rnz(r, -9, 12), v1 = ri(r, 20, 90)
    return numSpec(`A plant is ${v1} cm tall after ${t1} weeks and ${v1 + rate * (t2 - t1)} cm tall after ${t2} weeks. Assuming linear change, how much does it change per week (the rate of change)?`, F(rate), 'The rate of change is the slope: change in height ÷ change in time.', [`Change in height = ${A(rate * (t2 - t1))}, and the change in time = ${t2 - t1} weeks.`, `Rate = ${A(rate * (t2 - t1))}/${t2 - t1} = ${A(rate)} cm per week.`])
  } },
  { lesson: 'linear-models', level: 1, make: (r) => {
    const base = ri(r, 10, 60), per = ri(r, 2, 15), n = ri(r, 2, 12)
    return numSpec(`A taxi charges a ${base} dollar fee plus ${per} dollars per km. What is the cost of a ${n} km trip?`, F(base + per * n), 'The cost is C = fee + (rate) × distance. Substitute the distance.', [`C = ${base} + ${per} × ${n} = ${base + per * n} dollars.`])
  } },
  { lesson: 'linear-models', level: 2, make: (r) => {
    const t1 = ri(r, 0, 3), t2 = t1 + ri(r, 2, 4), m = rnz(r, -6, 9), v1 = ri(r, 10, 60), t = t2 + ri(r, 1, 6)
    const v2 = v1 + m * (t2 - t1)
    return numSpec(`A quantity is ${v1} at time ${t1} and ${v2} at time ${t2}, changing linearly. What is its value at time ${t}?`, F(v1 + m * (t - t1)), 'Find the rate of change (slope) from the two data points, then use it to extend the line.', [`The rate is (${A(v2)} − ${A(v1)})/(${t2} − ${t1}) = ${A(m)} per unit of time.`, `Value at ${t} = ${A(v2)} + ${A(m)} × (${t} − ${t2}) = ${A(v1 + m * (t - t1))}.`])
  } },
  { lesson: 'linear-models', level: 2, make: (r) => {
    const a = ri(r, 20, 80), b = ri(r, 3, 12), n = ri(r, 4, 20)
    return numSpec(`A phone plan costs C = ${a} + ${b}g dollars for g gigabytes of data. How many gigabytes can you use for ${a + b * n} dollars?`, F(n), 'Set C equal to the amount and solve for g.', [`${a} + ${b}g = ${a + b * n}, so ${b}g = ${b * n}.`, `g = ${n} gigabytes.`])
  } },
  { lesson: 'linear-models', level: 2, make: (r) => {
    const sign = pick(r, [1, -1, 0] as const), pts = Array.from({ length: 5 }, (_, i) => [i + 1, 10 + sign * 3 * (i + 1) + (sign === 0 ? [2, -1, 1, -2, 0][i] : ri(r, -1, 1))])
    const m = sign
    return words(`The data points ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(', ')} are plotted. Is the correlation positive, negative, or is there no clear correlation?`, m > 0 ? ['positive', 'positive correlation'] : m < 0 ? ['negative', 'negative correlation'] : ['none', 'no correlation', 'no clear correlation', 'no'], ['positive', 'negative', 'none'], 'A positive correlation means y generally rises as x rises; negative means y falls as x rises.', [m > 0 ? 'y increases as x increases: positive correlation.' : m < 0 ? 'y decreases as x increases: negative correlation.' : 'y goes up and down with no overall trend: no clear correlation.'])
  } },
  { lesson: 'linear-models', level: 3, make: (r) => {
    // least squares through 4 points, predict
    for (;;) {
      const xs = [1, 2, 3, 4], ys = xs.map(() => ri(r, 1, 12)), n = 4
      const mx = F(10, 4), my = F(ys.reduce((a, b) => a + b, 0), n)
      let sxy = F(0), sxx = F(0)
      xs.forEach((x, i) => { sxy = fAdd(sxy, fMul(fSub(F(x), mx), fSub(F(ys[i]), my))); sxx = fAdd(sxx, fMul(fSub(F(x), mx), fSub(F(x), mx))) })
      const b = fDiv(sxy, sxx), a = fSub(my, fMul(b, mx)), x0 = ri(r, 5, 8), v = fAdd(a, fMul(b, F(x0)))
      return numSpec(`The line of best fit through (1, ${ys[0]}), (2, ${ys[1]}), (3, ${ys[2]}) and (4, ${ys[3]}) is y = a + bx with b = Σ(x − x̄)(y − ȳ)/Σ(x − x̄)². Use it to predict y when x = ${x0}. Give a fraction.`, v, 'Find the means, then the slope b and the intercept a = ȳ − b x̄. Substitute the new x.', [`x̄ = ${fm(mx)}, ȳ = ${fm(my)}. Σ(x − x̄)(y − ȳ) = ${fm(sxy)} and Σ(x − x̄)² = ${fm(sxx)}.`, `b = ${fm(b)}, a = ${fm(a)}, so y(${x0}) = ${fm(v)}.`])
    }
  } },
  { lesson: 'linear-models', level: 3, make: (r) => {
    const f1 = ri(r, 10, 40), r1 = ri(r, 2, 6), f2 = f1 + ri(r, 10, 40), r2 = r1 - ri(r, 1, 1)
    if (r2 <= 0 || r1 === r2) return MODEL_GENS[6].make(r)
    const n = F(f2 - f1, r1 - r2)
    return numSpec(`Plan A costs ${f1} dollars plus ${r1} dollars per month. Plan B costs ${f2} dollars plus ${r2} dollars per month. After how many months do the two plans cost the same? Give a fraction or decimal.`, n, 'Set the two cost expressions equal and solve for the number of months.', [`${f1} + ${r1}m = ${f2} + ${r2}m.`, `${r1 - r2}m = ${f2 - f1}, so m = ${fm(n)} months.`])
  } },
  { lesson: 'linear-models', level: 3, make: (r) => {
    const x1 = ri(r, 0, 5), x2 = x1 + ri(r, 4, 10), y1 = ri(r, 10, 60), y2 = y1 + ri(r, 5, 40), x = x1 + ri(r, 1, x2 - x1 - 1)
    const v = fAdd(F(y1), fMul(F(y2 - y1, x2 - x1), F(x - x1)))
    return numSpec(`A table shows y = ${y1} when x = ${x1} and y = ${y2} when x = ${x2}. Estimate y when x = ${x} by linear interpolation. Give a fraction or decimal.`, v, 'Interpolating means estimating between two known points by assuming a straight line connects them.', [`The slope is (${y2} − ${y1})/(${x2} − ${x1}) = ${fm(F(y2 - y1, x2 - x1))}.`, `y = ${y1} + ${fm(F(y2 - y1, x2 - x1))} × (${x} − ${x1}) = ${fm(v)}.`])
  } },
]
export const C_GENS: Gen[] = [...SLOPE_GENS, ...LINE_GENS, ...SYS_GENS, ...MODEL_GENS]
