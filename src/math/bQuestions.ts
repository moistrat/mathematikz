/**
 * Question generators for the linear equations and inequalities unit: solving linear equations, word problems that lead to
 * linear equations, and solving and graphing linear inequalities in one variable.
 */
import { fAdd, fDiv, fMul, fr, fSub, Frac } from './algebra'
import { ri, rnz } from './algebraQuestions'
import { decSpec, fm, MN, numSpec, w } from './calcHelpers'
import { exF, ineqSpec, OPTEXT, flip, Op } from './equationQuestions'
import type { Gen, Spec } from './questions'
import { pick } from './rng'
import type { IntervalSet } from './solve'

const A = (a: number) => MN(String(a))
/** a x + b as text, in the letter v */
const lin = (a: number, b: number, v = 'x') => `${a === 0 ? '' : `${a < 0 ? '−' : ''}${Math.abs(a) === 1 ? '' : Math.abs(a)}${v}`}${b === 0 ? (a === 0 ? '0' : '') : `${a === 0 ? (b < 0 ? '−' : '') : b < 0 ? ' − ' : ' + '}${Math.abs(b)}`}`
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const words = (prompt: string, ws: string[], opts: string[], hint: string, expl: string[]): Spec => ({ prompt, kind: 'word', answers: [], display: ws[0], input: ws[0], words: ws, unit: '', needsExact: false, tol: 0, hint, explanation: expl, pad: { pi: false, root: false, comma: false, alg: false, extra: opts } })
const xEq = (v: Frac) => `x = ${fm(v)}`

/* ------------------------------------------------------------------ solving linear equations */

export const LIN_GENS: Gen[] = [
  { lesson: 'solving-linear', level: 1, make: (r) => {
    const x = ri(r, -9, 12), a = ri(r, 2, 9), b = rnz(r, -12, 12), t = ri(r, 1, 3)
    if (t === 1) return numSpec(`Solve x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${A(x + b)}.`, fr(x), 'Undo the addition (or subtraction) by doing the opposite to both sides.', [`Subtract ${A(b)} from both sides: x = ${A(x + b)} − ${b < 0 ? `(${A(b)})` : b} = ${A(x)}.`])
    if (t === 2) return numSpec(`Solve ${a}x = ${A(a * x)}.`, fr(x), 'Undo the multiplication by dividing both sides by the coefficient.', [`Divide both sides by ${a}: x = ${A(a * x)}/${a} = ${A(x)}.`])
    return numSpec(`Solve x/${a} = ${A(x)}.`, fr(a * x), 'Undo the division by multiplying both sides.', [`Multiply both sides by ${a}: x = ${A(x)} × ${a} = ${A(a * x)}.`])
  } },
  { lesson: 'solving-linear', level: 1, make: (r) => {
    const x = ri(r, -8, 10), a = rnz(r, -7, 8), b = rnz(r, -12, 12)
    if (Math.abs(a) < 2) return LIN_GENS[1].make(r)
    return numSpec(`Solve ${lin(a, b)} = ${A(a * x + b)}.`, fr(x), 'Undo the addition or subtraction first, then undo the multiplication.', [`Subtract ${A(b)}: ${A(a)}x = ${A(a * x)}.`, `Divide by ${A(a)}: x = ${A(x)}.`])
  } },
  { lesson: 'solving-linear', level: 2, make: (r) => {
    for (;;) {
      const a = rnz(r, -6, 8), c = rnz(r, -6, 8), b = rnz(r, -12, 12), d = rnz(r, -12, 12)
      if (a === c) continue
      const x = fr(d - b, a - c)
      return numSpec(`Solve ${lin(a, b)} = ${lin(c, d)}.`, x, 'Collect the x terms on one side and the numbers on the other.', [`Subtract ${lin(c, 0)} from both sides: ${lin(a - c, b)} = ${A(d)}.`, `Subtract ${A(b)}: ${A(a - c)}x = ${A(d - b)}.`, `Divide by ${A(a - c)}: ${xEq(x)}.`])
    }
  } },
  { lesson: 'solving-linear', level: 2, make: (r) => {
    for (;;) {
      const k = rnz(r, -5, 6), b = rnz(r, -8, 8), x = ri(r, -8, 9)
      if (Math.abs(k) < 2) continue
      const rhs = k * (x + b)
      return numSpec(`Solve ${k}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${A(rhs)}.`, fr(x), 'Either divide both sides by the number outside the bracket, or expand the bracket first.', [`Expand: ${lin(k, k * b)} = ${A(rhs)}.`, `Subtract ${A(k * b)}: ${A(k)}x = ${A(rhs - k * b)}.`, `Divide by ${A(k)}: x = ${A(x)}.`])
    }
  } },
  { lesson: 'solving-linear', level: 2, make: (r) => {
    for (;;) {
      const a = ri(r, 2, 6), b = rnz(r, -6, 6), c = ri(r, 2, 6), d = rnz(r, -6, 6)
      if (a === c) continue
      const x = fr(c * d - a * b, a - c)
      return numSpec(`Solve ${a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${c}(x ${d < 0 ? '−' : '+'} ${Math.abs(d)}).`, x, 'Expand both brackets, then collect the x terms on one side.', [`Expand: ${lin(a, a * b)} = ${lin(c, c * d)}.`, `Collect: ${A(a - c)}x = ${A(c * d - a * b)}.`, `${xEq(x)}.`])
    }
  } },
  { lesson: 'solving-linear', level: 3, make: (r) => {
    for (;;) {
      const a = ri(r, 2, 6), b = ri(r, 2, 8), c = ri(r, 1, 9)
      const x = fDiv(fr(c * a * b), fr(a + b))
      return numSpec(`Solve x/${a} + x/${b} = ${c}.`, x, 'Multiply every term by the common denominator to clear the fractions.', [`The common denominator is ${a * b / gcd(a, b)}. Multiply both sides by it: ${a * b / gcd(a, b) / a}x + ${a * b / gcd(a, b) / b}x = ${c * a * b / gcd(a, b)}.`, `Combine: ${a * b / gcd(a, b) / a + a * b / gcd(a, b) / b}x = ${c * a * b / gcd(a, b)}, so ${xEq(x)}.`])
    }
  } },
  { lesson: 'solving-linear', level: 3, make: (r) => {
    const t = ri(r, 1, 3), k = ri(r, 2, 5), b = rnz(r, -6, 6)
    let lhs: string, rhs: string, kind: 'one' | 'none' | 'all', how: string
    if (t === 1) { lhs = `${k}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)})`; rhs = `${k}x ${k * b < 0 ? '−' : '+'} ${Math.abs(k * b)}`; kind = 'all'; how = `Expanding the left side gives ${lin(k, k * b)}, which is exactly the right side for every x.` }
    else if (t === 2) { const d = b + ri(r, 1, 5); lhs = lin(k, b); rhs = lin(k, d); kind = 'none'; how = `Subtracting ${k}x from both sides leaves ${A(b)} = ${A(d)}, which is never true.` }
    else { const c = rnz(r, -5, 5); lhs = lin(k + 1, b); rhs = lin(k, c); kind = 'one'; how = `Subtracting ${k}x from both sides leaves x = ${A(c - b)}: exactly one solution.` }
    const ws = kind === 'one' ? ['one solution', 'one', 'a single solution', 'exactly one solution'] : kind === 'none' ? ['no solution', 'none', 'no solutions'] : ['infinitely many solutions', 'infinite', 'infinitely many', 'all real numbers', 'infinite solutions']
    return words(`Does the equation ${lhs} = ${rhs} have one solution, no solution, or infinitely many solutions?`, ws, ['one solution', 'no solution', 'infinitely many solutions'], 'Simplify both sides and collect the x terms. If the x terms cancel, check whether what is left is true or false.', [how])
  } },
  { lesson: 'solving-linear', level: 3, make: (r) => {
    const a = pick(r, [0.5, 1.5, 2.5, 0.25, 0.2, 0.4, 1.2, 0.6]), x = ri(r, -10, 20), b = pick(r, [0.5, 1.2, 2.4, 3.5, 0.8, 1.5])
    const rhs = Number((a * x + b).toFixed(4))
    return decSpec(`Solve ${a}x + ${b} = ${rhs}.`, x, 'You can multiply through by 10 or 100 to clear the decimals, or work with the decimals directly.', [`Subtract ${b} from both sides: ${a}x = ${Number((rhs - b).toFixed(4))}.`, `Divide by ${a}: x = ${x}.`], 4)
  } },
]

/* ------------------------------------------------------------------ word problems */

export const WORD_GENS: Gen[] = [
  { lesson: 'equation-word-problems', level: 1, make: (r) => {
    const n = ri(r, 2, 20), k = ri(r, 2, 5), c = ri(r, 1, 15)
    return numSpec(`${k === 2 ? 'Twice' : k === 3 ? 'Three times' : k === 4 ? 'Four times' : `${k} times`} a number, plus ${c}, is ${k * n + c}. What is the number?`, fr(n), 'Let x be the number. Translate the sentence into an equation, then solve it.', [`${k}x + ${c} = ${k * n + c}.`, `Subtract ${c}: ${k}x = ${k * n}, so x = ${n}.`])
  } },
  { lesson: 'equation-word-problems', level: 1, make: (r) => {
    const age = ri(r, 5, 30), diff = ri(r, 2, 12)
    return numSpec(`Maya is ${diff} years older than her brother. The sum of their ages is ${2 * age + diff}. How old is her brother?`, fr(age), "Let x be the brother's age. Then Maya's age is x + the difference.", [`x + (x + ${diff}) = ${2 * age + diff}.`, `2x + ${diff} = ${2 * age + diff}, so 2x = ${2 * age} and x = ${age}.`])
  } },
  { lesson: 'equation-word-problems', level: 2, make: (r) => {
    const n = ri(r, 2, 30), k = pick(r, [2, 3, 4]), t = ri(r, 1, 2)
    const total = k * n + (k * (k - 1)) / 2
    if (t === 1) return numSpec(`The sum of ${k} consecutive whole numbers is ${total}. What is the smallest of them?`, fr(n), 'Let the numbers be x, x + 1, x + 2, … and add them.', [`x + (x + 1)${k > 2 ? ' + (x + 2)' : ''}${k > 3 ? ' + (x + 3)' : ''} = ${total}.`, `${k}x + ${(k * (k - 1)) / 2} = ${total}, so ${k}x = ${k * n} and x = ${n}.`])
    const first = ri(r, 2, 40)
    return numSpec(`Find three consecutive even numbers that add to ${6 * first + 6}. Give the smallest.`, fr(2 * first), 'Consecutive even numbers differ by 2: let them be x, x + 2 and x + 4.', [`x + (x + 2) + (x + 4) = ${6 * first + 6}.`, `3x + 6 = ${6 * first + 6}, so 3x = ${6 * first} and x = ${2 * first}.`])
  } },
  { lesson: 'equation-word-problems', level: 2, make: (r) => {
    const wd = ri(r, 3, 20), extra = ri(r, 2, 9), k = pick(r, [2, 3])
    const len = k * wd + extra, perim = 2 * (len + wd)
    return numSpec(`A rectangle's length is ${extra} more than ${k === 2 ? 'twice' : 'three times'} its width. Its perimeter is ${perim}. Find its width.`, fr(wd), 'Let w be the width. Then the length is kw + extra, and perimeter = 2(length + width).', [`2((${k}w + ${extra}) + w) = ${perim}.`, `2(${k + 1}w + ${extra}) = ${perim}, so ${k + 1}w + ${extra} = ${perim / 2}.`, `${k + 1}w = ${perim / 2 - extra}, so w = ${wd}.`])
  } },
  { lesson: 'equation-word-problems', level: 2, make: (r) => {
    const v1 = ri(r, 3, 8) * 10, v2 = ri(r, 3, 8) * 10, hrs = ri(r, 2, 6), t = ri(r, 1, 2)
    if (t === 1) { const gap = (v1 + v2) * hrs; return numSpec(`Two trains start ${gap} km apart and travel towards each other at ${v1} km/h and ${v2} km/h. After how many hours do they meet?`, fr(hrs), 'Together they close the gap at the sum of their speeds.', [`Combined speed = ${v1} + ${v2} = ${v1 + v2} km/h.`, `Time = ${gap} ÷ ${v1 + v2} = ${hrs} hours.`]) }
    if (v1 === v2) return WORD_GENS[3].make(r)
    const fast = Math.max(v1, v2), slow = Math.min(v1, v2), head = ri(r, 1, 4), h2 = head * slow / (fast - slow)
    return numSpec(`A cyclist leaves at ${slow} km/h. ${head} hours later a car leaves the same place at ${fast} km/h along the same road. How many hours after the car leaves does it catch up? Give a fraction or decimal.`, fr(head * slow, fast - slow), 'When the car catches up, both have travelled the same distance. Let t be the car’s time.', [`The cyclist’s distance: ${slow}(t + ${head}). The car’s distance: ${fast}t.`, `${fast}t = ${slow}t + ${slow * head}, so ${fast - slow}t = ${slow * head} and t = ${fm(fr(head * slow, fast - slow))}.`].map((s) => s.replace(String(h2), String(h2))))
  } },
  { lesson: 'equation-word-problems', level: 3, make: (r) => {
    const d = ri(r, 3, 15), q = ri(r, 3, 15)
    const total = 10 * d + 25 * (q + 0)
    return numSpec(`A jar holds only dimes (10 cents) and quarters (25 cents). There are ${d + q} coins worth ${total} cents in total. How many quarters are there?`, fr(q), 'Let q be the number of quarters; then there are (total coins − q) dimes. Add up the values.', [`25q + 10(${d + q} − q) = ${total}.`, `15q + ${10 * (d + q)} = ${total}, so 15q = ${total - 10 * (d + q)} and q = ${q}.`])
  } },
  { lesson: 'equation-word-problems', level: 3, make: (r) => {
    const p1 = ri(r, 3, 6), p2 = ri(r, 8, 14), kg1 = ri(r, 2, 10), kg2 = ri(r, 2, 10)
    const mix = fr(p1 * kg1 + p2 * kg2, kg1 + kg2)
    return numSpec(`A shop mixes ${kg1} kg of nuts costing ${p1} dollars per kg with ${kg2} kg of nuts costing ${p2} dollars per kg. What should the mixture cost per kg? Give a fraction or decimal.`, mix, 'The mixture’s total cost is the sum of the two costs, and the total mass is the sum of the two masses.', [`Total cost = ${p1} × ${kg1} + ${p2} × ${kg2} = ${p1 * kg1 + p2 * kg2}.`, `Total mass = ${kg1 + kg2} kg, so the price per kg is ${p1 * kg1 + p2 * kg2}/${kg1 + kg2} = ${fm(mix)}.`])
  } },
  { lesson: 'equation-word-problems', level: 3, make: (r) => {
    for (;;) {
      const a = ri(r, 2, 12), b = ri(r, 2, 12)
      if (a === b) continue
      const t = fr(a * b, a + b)
      return numSpec(`One pipe fills a tank in ${a} hours and another fills it in ${b} hours. How long do they take together? Give a fraction or decimal (hours).`, t, 'In one hour the pipes fill 1/a and 1/b of the tank. Add the rates: 1/a + 1/b = 1/t.', [`1/${a} + 1/${b} = ${a + b}/${a * b} of the tank per hour.`, `So the time is ${a * b}/${a + b} = ${fm(t)} hours.`])
    }
  } },
]

/* ------------------------------------------------------------------ linear inequalities */

const ivOf = (op: Op, v: number): IntervalSet => (op === '<' ? [{ lo: -Infinity, hi: v, loIncl: false, hiIncl: false }] : op === '<=' ? [{ lo: -Infinity, hi: v, loIncl: false, hiIncl: true }] : op === '>' ? [{ lo: v, hi: Infinity, loIncl: false, hiIncl: false }] : [{ lo: v, hi: Infinity, loIncl: true, hiIncl: false }])
const ops: Op[] = ['<', '<=', '>', '>=']

export const INEQ_GENS: Gen[] = [
  { lesson: 'linear-inequalities', level: 1, make: (r) => {
    const a = rnz(r, -6, 7), x0 = ri(r, -8, 9), op = pick(r, ops)
    if (Math.abs(a) < 2) return INEQ_GENS[0].make(r)
    const c = a * x0, sol = a < 0 ? flip(op) : op
    return ineqSpec(`Solve ${lin(a, 0)} ${OPTEXT[op]} ${A(c)}.`, ivOf(sol, x0), 'x', 'Solve like an equation, but when you multiply or divide by a negative number you must flip the inequality sign.', [`Divide both sides by ${A(a)}${a < 0 ? ' and reverse the inequality, because the number is negative' : ''}.`, `x ${OPTEXT[sol]} ${A(x0)}.`], [exF(fr(x0))], (x) => { const l = a * x; return op === '<' ? l < c : op === '<=' ? l <= c : op === '>' ? l > c : l >= c })
  } },
  { lesson: 'linear-inequalities', level: 1, make: (r) => {
    const a = ri(r, 2, 6), b = rnz(r, -10, 10), x0 = ri(r, -8, 9), op = pick(r, ops)
    return ineqSpec(`Solve ${lin(a, b)} ${OPTEXT[op]} ${A(a * x0 + b)}.`, ivOf(op, x0), 'x', 'Undo the addition or subtraction, then divide. The inequality sign stays the same unless you divide by a negative.', [`Subtract ${A(b)}: ${a}x ${OPTEXT[op]} ${A(a * x0)}.`, `Divide by ${a}: x ${OPTEXT[op]} ${A(x0)}.`], [exF(fr(x0))], (x) => { const l = a * x + b, c = a * x0 + b; return op === '<' ? l < c : op === '<=' ? l <= c : op === '>' ? l > c : l >= c })
  } },
  { lesson: 'linear-inequalities', level: 2, make: (r) => {
    for (;;) {
      const a = rnz(r, -5, 6), c = rnz(r, -5, 6), b = rnz(r, -9, 9), d = rnz(r, -9, 9), op = pick(r, ops)
      if (a === c) continue
      const k = a - c, v = fr(d - b, k), sol = k < 0 ? flip(op) : op
      return ineqSpec(`Solve ${lin(a, b)} ${OPTEXT[op]} ${lin(c, d)}.`, ivOf(sol, v.n / v.d), 'x', 'Collect the x terms on one side. If you divide by a negative number, flip the sign.', [`Subtract ${lin(c, 0)} and ${A(b)}: ${A(k)}x ${OPTEXT[op]} ${A(d - b)}.`, `Divide by ${A(k)}${k < 0 ? ' and flip the sign' : ''}: x ${OPTEXT[sol]} ${fm(v)}.`], [exF(v)], (x) => { const l = a * x + b, rr = c * x + d; return op === '<' ? l < rr : op === '<=' ? l <= rr : op === '>' ? l > rr : l >= rr })
    }
  } },
  { lesson: 'linear-inequalities', level: 2, make: (r) => {
    // a compound "and" inequality: lo < ax + b < hi
    const a = ri(r, 2, 5), b = rnz(r, -8, 8), lo = ri(r, -3, 3), hi = lo + ri(r, 2, 6), incl = r() < 0.5
    const lv = a * lo + b, hv = a * hi + b
    return ineqSpec(`Solve ${A(lv)} ${incl ? '≤' : '<'} ${lin(a, b)} ${incl ? '≤' : '<'} ${A(hv)}.`, [{ lo, hi, loIncl: incl, hiIncl: incl }], 'x', 'Do the same thing to all three parts at once: subtract the number, then divide.', [`Subtract ${A(b)} from every part: ${A(lv - b)} ${incl ? '≤' : '<'} ${a}x ${incl ? '≤' : '<'} ${A(hv - b)}.`, `Divide every part by ${a}: ${A(lo)} ${incl ? '≤' : '<'} x ${incl ? '≤' : '<'} ${A(hi)}.`], [exF(fr(lo)), exF(fr(hi))], (x) => (incl ? x >= lo - 1e-9 && x <= hi + 1e-9 : x > lo + 1e-9 && x < hi - 1e-9))
  } },
  { lesson: 'linear-inequalities', level: 2, make: (r) => {
    // "or": x < p or x > q after solving two inequalities
    const a = ri(r, 2, 4), p = ri(r, -6, 0), q = p + ri(r, 3, 8), b1 = rnz(r, -4, 4), b2 = rnz(r, -4, 4)
    const c1 = a * p + b1, c2 = a * q + b2
    return ineqSpec(`Solve ${lin(a, b1)} < ${A(c1)} or ${lin(a, b2)} > ${A(c2)}.`, [{ lo: -Infinity, hi: p, loIncl: false, hiIncl: false }, { lo: q, hi: Infinity, loIncl: false, hiIncl: false }], 'x', 'Solve each inequality separately. “Or” means a number is a solution if it satisfies either one.', [`First: ${a}x < ${A(c1 - b1)}, so x < ${A(p)}.`, `Second: ${a}x > ${A(c2 - b2)}, so x > ${A(q)}.`, `The solution is x < ${A(p)} or x > ${A(q)}.`], [exF(fr(p)), exF(fr(q))], (x) => x < p - 1e-9 || x > q + 1e-9)
  } },
  { lesson: 'linear-inequalities', level: 3, make: (r) => {
    const a = pick(r, [2, 3, 4, 5]), b = pick(r, [2, 3, 4, 5]), c = ri(r, 1, 6), op = pick(r, ops)
    if (a === b) return INEQ_GENS[5].make(r)
    // x/a + x/b  op c
    const v = fr(c * a * b, a + b)
    return ineqSpec(`Solve x/${a} + x/${b} ${OPTEXT[op]} ${c}.`, ivOf(op, v.n / v.d), 'x', 'Multiply through by the common denominator (a positive number, so the sign stays).', [`Multiply by ${a * b}: ${b}x + ${a}x ${OPTEXT[op]} ${c * a * b}.`, `${a + b}x ${OPTEXT[op]} ${c * a * b}, so x ${OPTEXT[op]} ${fm(v)}.`], [exF(v)], (x) => { const l = x / a + x / b; return op === '<' ? l < c : op === '<=' ? l <= c : op === '>' ? l > c : l >= c })
  } },
  { lesson: 'linear-inequalities', level: 3, make: (r) => {
    const fee = ri(r, 10, 40), per = ri(r, 2, 9), cap = fee + per * ri(r, 6, 20) + ri(r, 0, per - 1)
    const n = Math.floor((cap - fee) / per)
    return numSpec(`A gym charges a ${fee} dollar joining fee plus ${per} dollars per visit. What is the greatest number of visits you can afford with ${cap} dollars?`, fr(n), 'Write an inequality: fee + per × n ≤ budget, solve for n, then take the largest whole number that works.', [`${fee} + ${per}n ≤ ${cap}, so ${per}n ≤ ${cap - fee} and n ≤ ${fm(fr(cap - fee, per))}.`, `The greatest whole number of visits is ${n}.`])
  } },
  { lesson: 'linear-inequalities', level: 3, make: (r) => {
    const k = ri(r, 2, 5), b = rnz(r, -6, 6), t = ri(r, 1, 2)
    if (t === 1) {
      const all = k > b + k + 1
      return ineqSpec(`Solve ${k}(x + 1) > ${lin(k, b + k + 1)}.`, all ? [{ lo: -Infinity, hi: Infinity, loIncl: false, hiIncl: false }] : [], 'x', 'Expand and collect. If the x terms cancel, decide whether the remaining statement is true or false.', [`Expand: ${lin(k, k)} > ${lin(k, b + k + 1)}.`, `Subtract ${k}x: ${k} > ${A(b + k + 1)}, which is ${all ? 'always true' : 'never true'}.`, all ? 'Every number is a solution.' : 'There is no solution.'], [], () => all)
    }
    const lo = ri(r, -5, 5)
    return ineqSpec(`Solve ${lin(-k, b)} ≥ ${A(-k * lo + b)}.`, [{ lo: -Infinity, hi: lo, loIncl: false, hiIncl: true }], 'x', 'Dividing by a negative number reverses the inequality.', [`Subtract ${A(b)}: ${A(-k)}x ≥ ${A(-k * lo)}.`, `Divide by ${A(-k)} and flip the sign: x ≤ ${A(lo)}.`], [exF(fr(lo))], (x) => -k * x + b >= -k * lo + b - 1e-9)
  } },
]
export const B_GENS: Gen[] = [...LIN_GENS, ...WORD_GENS, ...INEQ_GENS]
void fAdd; void fMul; void fSub; void w
