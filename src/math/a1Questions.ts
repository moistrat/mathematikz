/**
 * Question generators for the Algebra 1 foundations unit: signed numbers and order of operations, fractions and percentages,
 * ratios and proportions, expressions, and powers and polynomials. Answers are exact fractions or checked expressions.
 */
import { fAdd, fDiv, fMul, fr, fSub, fmtPoly, parsePoly, pretty } from './algebra'
import { alg, ri, rnz } from './algebraQuestions'
import { decSpec, fm, MN, numSpec, tupleSpec, w } from './calcHelpers'
import { evaluate } from './parse'
import type { Gen } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const br = (a: number) => (a < 0 ? `(${A(a)})` : String(a))
/** the expanded, simplified form of an ASCII expression */
const simp = (src: string) => fmtPoly(parsePoly(src), true)
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const frs = (n: number, d: number) => fm(fr(n, d))
const show = (src: string) => pretty(src).replace(/\*/g, '')

/* ------------------------------------------------------------------ 1. signed numbers and order of operations */

export const INT_GENS: Gen[] = [
  { lesson: 'integers-order', level: 1, make: (r) => {
    const a = rnz(r, -12, 12), b = rnz(r, -12, 12), plus = r() < 0.5
    const v = plus ? a + b : a - b
    return numSpec(`Calculate ${A(a)} ${plus ? '+' : '−'} ${br(b)}.`, fr(v), plus ? 'Adding a negative number moves left on the number line.' : 'Subtracting a number is the same as adding its opposite: a − b = a + (−b).', [plus ? `${A(a)} + ${br(b)} = ${A(v)}.` : `${A(a)} − ${br(b)} = ${A(a)} + ${A(-b)} = ${A(v)}.`])
  } },
  { lesson: 'integers-order', level: 1, make: (r) => {
    const a = rnz(r, -9, 9), b = rnz(r, -9, 9), div = r() < 0.5
    if (div) return numSpec(`Calculate ${A(a * b)} ÷ ${br(b)}.`, fr(a), 'Dividing two numbers with the same sign gives a positive result; different signs give a negative result.', [`${A(a * b)} ÷ ${br(b)} = ${A(a)}, because ${br(b)} × ${br(a)} = ${A(a * b)}.`])
    return numSpec(`Calculate ${A(a)} × ${br(b)}.`, fr(a * b), 'Same signs give a positive product; different signs give a negative product.', [`The signs are ${a * b > 0 ? 'the same' : 'different'}, so the answer is ${a * b > 0 ? 'positive' : 'negative'}: ${A(a * b)}.`])
  } },
  { lesson: 'integers-order', level: 2, make: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 1, 6), t = ri(r, 1, 5)
    let text: string, v: number, how: string
    if (t === 1) { text = `${a} + ${b} × ${c}`; v = a + b * c; how = `Multiply first: ${b} × ${c} = ${b * c}, then add ${a}.` }
    else if (t === 2) { text = `(${a} + ${b}) × ${c}`; v = (a + b) * c; how = `Brackets first: ${a} + ${b} = ${a + b}, then multiply by ${c}.` }
    else if (t === 3) { text = `${a * c} − ${b}² ÷ ${b}`; v = a * c - b; how = `Powers first: ${b}² = ${b * b}. Then divide: ${b * b} ÷ ${b} = ${b}. Then subtract.` }
    else if (t === 4) { text = `${a} − ${b} × (${c} − ${d + c})`; v = a - b * (c - (d + c)); how = `Brackets first: ${c} − ${d + c} = ${-d}. Then multiply ${b} × ${A(-d)} = ${A(-b * d)}, then ${a} − ${br(-b * d)}.` }
    else { text = `${a} × ${b}² − ${c}`; v = a * b * b - c; how = `Powers first: ${b}² = ${b * b}. Then multiply, then subtract.` }
    return numSpec(`Evaluate ${text}.`, fr(v), 'Order of operations: brackets, then powers, then multiplication and division (left to right), then addition and subtraction (left to right).', [how, `The answer is ${A(v)}.`])
  } },
  { lesson: 'integers-order', level: 2, make: (r) => {
    const a = ri(r, 2, 5), b = ri(r, 2, 4), t = ri(r, 1, 4)
    if (t === 1) return numSpec(`Evaluate (−${a})${'²³⁴'[b - 2]}.`, fr((-a) ** b), 'The bracket means the negative number is raised to the power: multiply it by itself.', [`(−${a})${'²³⁴'[b - 2]} = ${Array.from({ length: b }, () => `(−${a})`).join(' × ')} = ${A((-a) ** b)}.`])
    if (t === 2) return numSpec(`Evaluate −${a}${'²³⁴'[b - 2]}.`, fr(-(a ** b)), 'Without brackets the power applies only to the number: −aⁿ means −(aⁿ).', [`−${a}${'²³⁴'[b - 2]} = −(${a}${'²³⁴'[b - 2]}) = −${a ** b}.`])
    const x = ri(r, 2, 9), y = ri(r, 2, 9), z = ri(r, 2, 9)
    if (t === 3) return numSpec(`Evaluate |${A(-x)}| − |${y} − ${y + z}|.`, fr(x - z), 'The absolute value |a| is the distance of a from 0, so it is never negative. Work out the inside first.', [`|${A(-x)}| = ${x} and |${y} − ${y + z}| = |${A(-z)}| = ${z}.`, `${x} − ${z} = ${A(x - z)}.`])
    return numSpec(`Evaluate ${A(-x)} − ${br(-y)} × ${z}.`, fr(-x + y * z), 'Multiply before subtracting, and take care with the signs.', [`${br(-y)} × ${z} = ${A(-y * z)}.`, `${A(-x)} − ${br(-y * z)} = ${A(-x + y * z)}.`])
  } },
  { lesson: 'integers-order', level: 2, make: (r) => {
    const a = rnz(r, -4, 5), b = rnz(r, -6, 6), c = rnz(r, -6, 6), x = rnz(r, -4, 4)
    const v = a * x * x + b * x + c
    const poly = `${a === 1 ? '' : a === -1 ? '−' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
    return numSpec(`Evaluate ${poly} when x = ${A(x)}.`, fr(v), 'Substitute the value in brackets, then use the order of operations: powers first.', [`Substitute x = ${A(x)}: ${A(a)}(${A(x)})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(${A(x)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)}.`, `= ${A(a)} × ${x * x} ${b < 0 ? '−' : '+'} ${Math.abs(b * x)}${b * x < 0 ? ' (the product is negative)' : ''} ... = ${A(v)}.`.replace(/ \.\.\. /, ' so the total is ')])
  } },
  { lesson: 'integers-order', level: 3, make: (r) => {
    // a fraction bar groups the top and bottom
    for (;;) {
      const a = ri(r, 2, 9), b = ri(r, 2, 5), c = ri(r, 2, 5), d = ri(r, 1, 9), e = ri(r, 1, 6), f = ri(r, 2, 5)
      const num = a - b * c, den = d - e * f
      if (den === 0) continue
      const v = fr(num, den)
      return numSpec(`Evaluate (${a} − ${b} × ${c}) / (${d} − ${e} × ${f}). Give a fraction or whole number.`, v, 'A fraction bar acts like brackets: work out the top and the bottom separately, then divide.', [`Top: ${a} − ${b} × ${c} = ${A(num)}.`, `Bottom: ${d} − ${e} × ${f} = ${A(den)}.`, `${A(num)} / ${br(den)} = ${fm(v)}.`])
    }
  } },
  { lesson: 'integers-order', level: 3, make: (r) => {
    const a = ri(r, 2, 6), b = ri(r, 2, 5), c = ri(r, 2, 6), d = ri(r, 2, 5), e = ri(r, 2, 9)
    const v = a * (b + c * (d - 1)) - e
    return numSpec(`Evaluate ${a}[${b} + ${c}(${d} − 1)] − ${e}.`, fr(v), 'Work from the innermost brackets outwards.', [`Innermost: ${d} − 1 = ${d - 1}. Then ${c} × ${d - 1} = ${c * (d - 1)}.`, `Next: ${b} + ${c * (d - 1)} = ${b + c * (d - 1)}. Then ${a} × ${b + c * (d - 1)} = ${a * (b + c * (d - 1))}.`, `Finally ${a * (b + c * (d - 1))} − ${e} = ${A(v)}.`])
  } },
  { lesson: 'integers-order', level: 3, make: (r) => {
    for (;;) {
      const a = rnz(r, -6, 6), b = rnz(r, -6, 6)
      const den = 2 * a + b
      if (den === 0) continue
      const v = fr((a - b) ** 2, den)
      return numSpec(`Evaluate (a − b)² / (2a + b) when a = ${A(a)} and b = ${A(b)}. Give a fraction or whole number.`, v, 'Substitute each letter in brackets, work out the top and bottom, then divide.', [`Top: (${A(a)} − ${br(b)})² = (${A(a - b)})² = ${(a - b) ** 2}.`, `Bottom: 2(${A(a)}) + ${br(b)} = ${A(den)}.`, `${(a - b) ** 2} / ${br(den)} = ${fm(v)}.`])
    }
  } },
]

/* ------------------------------------------------------------------ 2. fractions, decimals and percentages */

export const FRAC_GENS: Gen[] = [
  { lesson: 'fractions-percent', level: 1, make: (r) => {
    const g = ri(r, 2, 9), n = ri(r, 1, 8), d = ri(r, n + 1, 12)
    if (gcd(n, d) !== 1) return FRAC_GENS[0].make(r)
    return numSpec(`Simplify ${n * g}/${d * g}. Give your answer as a fraction in lowest terms.`, fr(n, d), 'Divide the top and the bottom by their greatest common factor.', [`The greatest common factor of ${n * g} and ${d * g} is ${g}.`, `${n * g} ÷ ${g} = ${n} and ${d * g} ÷ ${g} = ${d}, so the fraction is ${n}/${d}.`])
  } },
  { lesson: 'fractions-percent', level: 1, make: (r) => {
    const d1 = pick(r, [2, 3, 4, 5, 6, 8]), d2 = pick(r, [2, 3, 4, 5, 6, 8]), n1 = ri(r, 1, d1 - 1 || 1), n2 = ri(r, 1, d2 - 1 || 1), plus = r() < 0.6
    const a = fr(n1, d1), b = fr(n2, d2), v = plus ? fAdd(a, b) : fSub(a, b)
    if (!plus && v.n <= 0) return FRAC_GENS[1].make(r)
    return numSpec(`Calculate ${n1}/${d1} ${plus ? '+' : '−'} ${n2}/${d2}.`, v, 'Write both fractions with a common denominator, then add or subtract the tops.', [`A common denominator is ${d1 * d2 / gcd(d1, d2)}.`, `${fm(a)} ${plus ? '+' : '−'} ${fm(b)} = ${fm(v)}.`])
  } },
  { lesson: 'fractions-percent', level: 1, make: (r) => {
    const d = pick(r, [2, 4, 5, 8, 10, 20, 25]), n = ri(r, 1, d - 1), t = ri(r, 1, 2)
    const dec = n / d
    return t === 1
      ? decSpec(`Write ${n}/${d} as a decimal.`, dec, 'Divide the top by the bottom.', [`${n} ÷ ${d} = ${dec}.`], 4)
      : decSpec(`Write ${n}/${d} as a percentage. (Give the number without the % sign.)`, dec * 100, 'Convert to a decimal, then multiply by 100.', [`${n}/${d} = ${dec}, and ${dec} × 100 = ${Number((dec * 100).toFixed(4))}%.`], 4)
  } },
  { lesson: 'fractions-percent', level: 2, make: (r) => {
    const a = fr(ri(r, 1, 7), ri(r, 2, 8)), b = fr(ri(r, 1, 7), ri(r, 2, 8)), div = r() < 0.5
    const v = div ? fDiv(a, b) : fMul(a, b)
    return numSpec(`Calculate ${fm(a)} ${div ? '÷' : '×'} ${fm(b)}.`, v, div ? 'To divide by a fraction, multiply by its reciprocal.' : 'Multiply the tops and multiply the bottoms, then simplify.', [div ? `${fm(a)} ÷ ${fm(b)} = ${fm(a)} × ${fm(fr(b.d, b.n))} = ${fm(v)}.` : `${fm(a)} × ${fm(b)} = ${fm(v)}.`])
  } },
  { lesson: 'fractions-percent', level: 2, make: (r) => {
    const w1 = ri(r, 1, 4), n1 = ri(r, 1, 3), d1 = ri(r, n1 + 1, 5), w2 = ri(r, 1, 3), n2 = ri(r, 1, 3), d2 = ri(r, n2 + 1, 5)
    const a = fr(w1 * d1 + n1, d1), b = fr(w2 * d2 + n2, d2), v = fAdd(a, b)
    return numSpec(`Calculate ${w1} ${n1}/${d1} + ${w2} ${n2}/${d2}. Give an improper fraction or a decimal.`, v, 'Convert each mixed number to an improper fraction, then add.', [`${w1} ${n1}/${d1} = ${fm(a)} and ${w2} ${n2}/${d2} = ${fm(b)}.`, `Sum = ${fm(v)}.`])
  } },
  { lesson: 'fractions-percent', level: 2, make: (r) => {
    const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 60, 75, 12, 8]), base = ri(r, 2, 40) * 20, v = (p * base) / 100
    return decSpec(`What is ${p}% of ${base}?`, v, 'Percent means per hundred: p% of a number is (p/100) × the number.', [`${p}% of ${base} = ${p}/100 × ${base} = ${v}.`], 4)
  } },
  { lesson: 'fractions-percent', level: 2, make: (r) => {
    const old = ri(r, 4, 30) * 10, pct = pick(r, [5, 10, 15, 20, 25, 30, 40, 50]), up = r() < 0.5
    const nw = old * (up ? 1 + pct / 100 : 1 - pct / 100)
    return decSpec(`A quantity changes from ${old} to ${Number(nw.toFixed(2))}. What is the percentage ${up ? 'increase' : 'decrease'}? (Give the number without the % sign.)`, pct, 'Percentage change = (change ÷ original) × 100.', [`The change is ${Number(Math.abs(nw - old).toFixed(2))} and the original is ${old}.`, `(${Number(Math.abs(nw - old).toFixed(2))} ÷ ${old}) × 100 = ${pct}%.`], 4)
  } },
  { lesson: 'fractions-percent', level: 3, make: (r) => {
    const p = pick(r, [10, 20, 25, 30, 40, 50]), start = ri(r, 2, 20) * 50
    const v = start * (1 + p / 100) * (1 - p / 100)
    return decSpec(`A price of ${start} dollars is increased by ${p}%, and then the new price is decreased by ${p}%. What is the final price?`, Number(v.toFixed(4)), 'Multiply by the growth factor (1 + p/100), then by the decay factor (1 − p/100). A percentage rise followed by the same fall does not return you to the start.', [`After the increase: ${start} × ${1 + p / 100} = ${Number((start * (1 + p / 100)).toFixed(4))}.`, `After the decrease: × ${1 - p / 100} = ${Number(v.toFixed(4))}.`, `The price is lower than the start (${start}): the fall is taken from a larger amount.`], 4)
  } },
  { lesson: 'fractions-percent', level: 3, make: (r) => {
    const price = ri(r, 4, 40) * 10, d = pick(r, [10, 15, 20, 25, 30, 40]), tax = pick(r, [5, 8, 10])
    const v = price * (1 - d / 100) * (1 + tax / 100)
    return decSpec(`A jacket costs ${price} dollars. It is on sale for ${d}% off, and then ${tax}% sales tax is added to the sale price. What is the final price?`, Number(v.toFixed(4)), 'Apply the discount first (multiply by 1 − d/100), then the tax (multiply by 1 + t/100).', [`Sale price: ${price} × ${1 - d / 100} = ${Number((price * (1 - d / 100)).toFixed(4))}.`, `With tax: × ${1 + tax / 100} = ${Number(v.toFixed(4))}.`], 4)
  } },
  { lesson: 'fractions-percent', level: 3, make: (r) => {
    const orig = ri(r, 4, 40) * 10, d = pick(r, [10, 20, 25, 30, 40, 50]), sale = orig * (1 - d / 100)
    return decSpec(`After a ${d}% discount a coat costs ${Number(sale.toFixed(2))} dollars. What was the original price?`, orig, 'The sale price is (100 − d)% of the original. Divide the sale price by that fraction.', [`The sale price is ${100 - d}% of the original, so original × ${(100 - d) / 100} = ${Number(sale.toFixed(2))}.`, `Original = ${Number(sale.toFixed(2))} ÷ ${(100 - d) / 100} = ${orig}.`], 4)
  } },
]

/* ------------------------------------------------------------------ 3. ratios, rates and proportions */

export const RATIO_GENS: Gen[] = [
  { lesson: 'ratios-proportions', level: 1, make: (r) => {
    const n = ri(r, 3, 12), unit = pick(r, [fr(3, 2), fr(5, 4), fr(7, 4), fr(9, 5), fr(11, 4), fr(2), fr(3), fr(5, 2)])
    const total = fMul(unit, fr(n))
    return decSpec(`${n} notebooks cost ${fm(total).includes('/') ? Number((total.n / total.d).toFixed(2)) : fm(total)} dollars. What is the cost of one notebook?`, unit.n / unit.d, 'A unit rate is the total divided by the number of items.', [`Cost per notebook = ${Number((total.n / total.d).toFixed(2))} ÷ ${n} = ${unit.n / unit.d}.`], 4)
  } },
  { lesson: 'ratios-proportions', level: 1, make: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), k = ri(r, 2, 8), c = b * k, x = fr(a * c, b)
    return numSpec(`Solve the proportion ${a}/${b} = x/${c}.`, x, 'Cross-multiply: if a/b = x/c then a × c = b × x.', [`${a} × ${c} = ${b} × x, so x = ${a * c}/${b} = ${fm(x)}.`])
  } },
  { lesson: 'ratios-proportions', level: 2, make: (r) => {
    const scale = pick(r, [2, 5, 10, 20, 25, 50]), cm = ri(r, 3, 30)
    return numSpec(`On a map, 1 cm represents ${scale} km. Two towns are ${cm} cm apart on the map. How far apart are they in km?`, fr(scale * cm), 'Multiply the map distance by the scale.', [`${cm} × ${scale} = ${scale * cm} km.`])
  } },
  { lesson: 'ratios-proportions', level: 2, make: (r) => {
    const parts = [ri(r, 1, 6), ri(r, 1, 6), ri(r, 1, 6)].slice(0, r() < 0.5 ? 2 : 3), k = ri(r, 2, 12), tot = parts.reduce((s, x) => s + x, 0) * k, which = ri(r, 0, parts.length - 1)
    return numSpec(`${tot} dollars is shared in the ratio ${parts.join(' : ')}. How much is the ${['first', 'second', 'third'][which]} share?`, fr(parts[which] * k), 'Add the parts of the ratio to find how many equal parts there are, then divide.', [`There are ${parts.join(' + ')} = ${parts.reduce((s, x) => s + x, 0)} parts, so one part is ${tot} ÷ ${parts.reduce((s, x) => s + x, 0)} = ${k}.`, `The ${['first', 'second', 'third'][which]} share is ${parts[which]} × ${k} = ${parts[which] * k}.`])
  } },
  { lesson: 'ratios-proportions', level: 2, make: (r) => {
    // unit conversion
    const t = ri(r, 1, 3)
    if (t === 1) { const kmh = ri(r, 2, 20) * 9; return numSpec(`Convert ${kmh} km/h to metres per second.`, fr(kmh * 1000, 3600), '1 km = 1000 m and 1 hour = 3600 s.', [`${kmh} km/h = ${kmh} × 1000 m / 3600 s = ${fm(fr(kmh * 1000, 3600))} m/s.`]) }
    if (t === 2) { const m = ri(r, 2, 40); return numSpec(`How many centimetres are there in ${m} metres and ${ri(r, 2, 9) * 0 + 50} centimetres?`, fr(m * 100 + 50), '1 m = 100 cm.', [`${m} m = ${m * 100} cm, and adding 50 cm gives ${m * 100 + 50} cm.`]) }
    const hrs = ri(r, 2, 6), rate = ri(r, 3, 12); return numSpec(`A tap fills ${rate} litres per minute. How many litres does it fill in ${hrs} hours?`, fr(rate * hrs * 60), 'Convert hours to minutes first: 1 hour = 60 minutes.', [`${hrs} hours = ${hrs * 60} minutes.`, `${rate} × ${hrs * 60} = ${rate * hrs * 60} litres.`])
  } },
  { lesson: 'ratios-proportions', level: 3, make: (r) => {
    const people = ri(r, 2, 8), days = ri(r, 3, 12), more = ri(r, 1, 6)
    const v = fr(people * days, people + more)
    return numSpec(`${people} workers take ${days} days to finish a job. Working at the same rate, how many days would ${people + more} workers take? Give a fraction or decimal.`, v, 'This is inverse proportion: more workers means fewer days, so (workers × days) is constant.', [`Total work = ${people} × ${days} = ${people * days} worker-days.`, `With ${people + more} workers: ${people * days} ÷ ${people + more} = ${fm(v)} days.`])
  } },
  { lesson: 'ratios-proportions', level: 3, make: (r) => {
    const d = ri(r, 2, 6) * 30, s1 = pick(r, [30, 40, 50, 60]), s2 = pick(r, [60, 80, 90, 120])
    if (s1 === s2) return RATIO_GENS[7].make(r)
    const v = fr(2 * s1 * s2, s1 + s2)
    return numSpec(`A car drives ${d} km at ${s1} km/h and then returns the same ${d} km at ${s2} km/h. What is its average speed for the whole trip, in km/h? Give a fraction or decimal.`, v, 'Average speed = total distance ÷ total time. It is not simply the average of the two speeds.', [`Time out = ${d}/${s1} h and time back = ${d}/${s2} h.`, `Total distance = ${2 * d} km. Average = ${2 * d} ÷ (${d}/${s1} + ${d}/${s2}) = 2·${s1}·${s2}/(${s1} + ${s2}) = ${fm(v)} km/h.`])
  } },
  { lesson: 'ratios-proportions', level: 3, make: (r) => {
    const a = pick(r, [10, 20, 25, 30]), b = pick(r, [40, 50, 60, 70]), x = ri(r, 1, 5) * 2, y = ri(r, 1, 5) * 2
    const conc = fr(a * x + b * y, x + y)
    return numSpec(`${x} litres of a ${a}% acid solution are mixed with ${y} litres of a ${b}% acid solution. What percentage of the mixture is acid? Give a fraction or decimal (no % sign).`, conc, 'Add the amounts of pure acid, and divide by the total volume of the mixture.', [`Pure acid: ${a}% of ${x} = ${a * x / 100} litres, and ${b}% of ${y} = ${b * y / 100} litres.`, `Total volume ${x + y} litres, so the concentration is ${(a * x + b * y) / 100}/${x + y} × 100 = ${fm(conc)}%.`])
  } },
]

/* ------------------------------------------------------------------ 4. expressions */


export const EXPR_GENS: Gen[] = [
  { lesson: 'expressions-simplify', level: 1, make: (r) => {
    const a = rnz(r, -8, 9), b = rnz(r, -8, 9), c = rnz(r, -9, 9), d = rnz(r, -9, 9)
    const terms: [number, string][] = [[a, 'x'], [c, ''], [b, 'x'], [d, '']]
    const asc = terms.map(([k, v], i) => `${i === 0 ? (k < 0 ? '-' : '') : k < 0 ? '-' : '+'}${Math.abs(k) === 1 && v ? '' : Math.abs(k)}${v}`).join('')
    const shown = terms.map(([k, v], i) => `${i === 0 ? (k < 0 ? '−' : '') : k < 0 ? ' − ' : ' + '}${Math.abs(k) === 1 && v ? '' : Math.abs(k)}${v}`).join('')
    const ans = simp(asc)
    return alg('poly', `Simplify ${shown} by collecting like terms.`, asc, ans, 'Like terms have the same letter part. Add or subtract their coefficients.', [`The x terms are ${A(a)}x and ${A(b)}x, giving ${A(a + b)}x. The numbers are ${A(c)} and ${A(d)}, giving ${A(c + d)}.`, `The simplified expression is ${pretty(ans)}.`])
  } },
  { lesson: 'expressions-simplify', level: 1, make: (r) => {
    const k = rnz(r, -6, 7), a = rnz(r, -5, 6), b = rnz(r, -9, 9)
    const src = `${k}(${a}x${b < 0 ? b : `+${b}`})`
    const ans = simp(src)
    return alg('poly', `Expand ${show(src)}.`, src, ans, 'Multiply every term inside the bracket by the number outside.', [`${A(k)} × ${A(a)}x = ${A(k * a)}x and ${A(k)} × ${A(b)} = ${A(k * b)}.`, `The result is ${pretty(ans)}.`])
  } },
  { lesson: 'expressions-simplify', level: 2, make: (r) => {
    const a = rnz(r, -4, 5), b = rnz(r, -6, 6), c = rnz(r, -4, 5), d = rnz(r, -6, 6), k1 = ri(r, 2, 5), k2 = rnz(r, -4, 4)
    const src = `${k1}(${a}x${b < 0 ? b : `+${b}`})${k2 < 0 ? k2 : `+${k2}`}(${c}x${d < 0 ? d : `+${d}`})`
    const ans = simp(src)
    return alg('poly', `Expand and simplify ${show(src.replace(/\)\+/g, ') + ').replace(/\)-/g, ') − '))}.`, src, ans, 'Expand each bracket first, then collect the like terms.', [`First bracket: ${A(k1 * a)}x ${k1 * b < 0 ? '−' : '+'} ${Math.abs(k1 * b)}. Second: ${A(k2 * c)}x ${k2 * d < 0 ? '−' : '+'} ${Math.abs(k2 * d)}.`, `Collecting like terms gives ${pretty(ans)}.`])
  } },
  { lesson: 'expressions-simplify', level: 2, make: (r) => {
    const a = rnz(r, -5, 6), b = rnz(r, -6, 6), c = rnz(r, -5, 6), d = rnz(r, -6, 6)
    const src = `(${a}x${b < 0 ? b : `+${b}`})-(${c}x${d < 0 ? d : `+${d}`})`
    const ans = simp(src)
    return alg('poly', `Simplify ${show(`(${a}x${b < 0 ? b : `+${b}`}) - (${c}x${d < 0 ? d : `+${d}`})`)}.`, src, ans, 'Subtracting a bracket changes the sign of every term inside it.', [`The minus sign flips both terms of the second bracket: ${A(-c)}x ${-d < 0 ? '−' : '+'} ${Math.abs(d)}.`, `Combine: ${pretty(ans)}.`])
  } },
  { lesson: 'expressions-simplify', level: 2, make: (r) => {
    const a = rnz(r, -4, 5), b = rnz(r, -5, 6), x = rnz(r, -4, 4), k = ri(r, 2, 5)
    const v = k * (a * x + b) - a * x
    const src = `${k}(${a}x${b < 0 ? b : `+${b}`})-${a < 0 ? `(${a}x)` : `${a}x`}`
    return numSpec(`Simplify ${show(src.replace(/\)-/g, ') − '))} first, then evaluate it when x = ${A(x)}.`, fr(v), 'Expand, collect like terms, then substitute.', [`${pretty(simp(src))}.`, `At x = ${A(x)}: ${A(v)}.`])
  } },
  { lesson: 'expressions-simplify', level: 3, make: (r) => {
    const a = ri(r, 1, 4), b = rnz(r, -5, 5), c = ri(r, 1, 4), d = rnz(r, -5, 5)
    const src = `(${a}x${b < 0 ? b : `+${b}`})(${c}x${d < 0 ? d : `+${d}`})`
    const ans = simp(src)
    return alg('poly', `Expand and simplify ${show(src)}.`, src, ans, 'Multiply each term of the first bracket by each term of the second (FOIL), then collect like terms.', [`First: ${a * c}x². Outer: ${A(a * d)}x. Inner: ${A(b * c)}x. Last: ${A(b * d)}.`, `Combine the middle terms: ${pretty(ans)}.`])
  } },
  { lesson: 'expressions-simplify', level: 3, make: (r) => {
    const l1 = ri(r, 2, 5), l0 = rnz(r, -4, 6), w1 = ri(r, 1, 3), w0 = rnz(r, -3, 5)
    const src = `2(${l1}x${l0 < 0 ? l0 : `+${l0}`})+2(${w1}x${w0 < 0 ? w0 : `+${w0}`})`
    const ans = simp(src)
    return alg('poly', `A rectangle has length ${show(`${l1}x${l0 < 0 ? l0 : `+${l0}`}`)} and width ${show(`${w1}x${w0 < 0 ? w0 : `+${w0}`}`)}. Write its perimeter as a simplified expression in x.`, src, ans, 'Perimeter = 2 × (length + width). Expand and collect like terms.', [`P = 2(${l1}x ${l0 < 0 ? '−' : '+'} ${Math.abs(l0)}) + 2(${w1}x ${w0 < 0 ? '−' : '+'} ${Math.abs(w0)}).`, `P = ${pretty(ans)}.`])
  } },
  { lesson: 'expressions-simplify', level: 3, make: (r) => {
    const k = ri(r, 2, 6), a = ri(r, 1, 6), b = ri(r, 1, 9), g = k * gcd(a, b)
    const src = `${k * a}x+${k * b}`
    return alg('factor', `Factor out the greatest common factor: ${k * a}x + ${k * b}.`, src, `${g}(${(k * a) / g}x+${(k * b) / g})`.replace(/\(1x/, '(x'), 'Find the largest number that divides both terms, and write it outside a bracket.', [`The greatest common factor of ${k * a} and ${k * b} is ${g}.`, `${k * a}x + ${k * b} = ${g}(${(k * a) / g === 1 ? '' : (k * a) / g}x + ${(k * b) / g}).`])
  } },
]

/* ------------------------------------------------------------------ 5. powers, scientific notation and polynomials */

export const POWER_BASIC_GENS: Gen[] = [
  { lesson: 'powers-polynomials', level: 1, make: (r) => {
    const b = ri(r, 2, 6), n = ri(r, 1, 4), t = ri(r, 1, 3)
    if (t === 1) return numSpec(`Evaluate ${b}${'⁰¹²³⁴'[n]}.`, fr(b ** n), 'aⁿ means a multiplied by itself n times (and a⁰ = 1).', [`${b}${'⁰¹²³⁴'[n]} = ${Array.from({ length: n }, () => b).join(' × ')} = ${b ** n}.`])
    if (t === 2) return numSpec(`Evaluate ${b}⁻${'⁰¹²³⁴'[n]}. Give a fraction.`, fr(1, b ** n), 'A negative exponent means a reciprocal: a⁻ⁿ = 1/aⁿ.', [`${b}⁻${'⁰¹²³⁴'[n]} = 1/${b}${'⁰¹²³⁴'[n]} = 1/${b ** n}.`])
    return numSpec(`Evaluate ${b}⁰ + ${b}¹.`, fr(1 + b), 'Any non-zero number to the power 0 is 1.', [`${b}⁰ = 1 and ${b}¹ = ${b}, so the total is ${1 + b}.`])
  } },
  { lesson: 'powers-polynomials', level: 1, make: (r) => {
    const a = ri(r, 2, 8), b = ri(r, 2, 8), t = ri(r, 1, 3)
    if (t === 1) { const src = `x^${a}*x^${b}`; return alg('poly', `Simplify ${show(src.replace('*', ' × '))}.`, src, `x^${a + b}`, 'When you multiply powers of the same base, add the exponents.', [`xᵃ × xᵇ = xᵃ⁺ᵇ, so ${a} + ${b} = ${a + b}: x${'⁰¹²³⁴⁵⁶⁷⁸⁹'[Math.floor((a + b) / 10) % 10]}${'⁰¹²³⁴⁵⁶⁷⁸⁹'[(a + b) % 10]}.`].map((s) => s.replace('x⁰', 'x'))) }
    if (t === 2) { const src = `(x^${a})^${Math.min(b, 4)}`; return alg('poly', `Simplify ${show(src)}.`, src, `x^${a * Math.min(b, 4)}`, 'A power of a power: multiply the exponents.', [`(xᵃ)ᵇ = xᵃᵇ, so the exponent is ${a} × ${Math.min(b, 4)} = ${a * Math.min(b, 4)}.`]) }
    const big = Math.max(a, b) + 1, small = Math.min(a, b), src = `x^${big}/x^${small}`
    return alg('poly', `Simplify ${show(src.replace('/', ' ÷ '))}.`, src, `x^${big - small}`, 'When you divide powers of the same base, subtract the exponents.', [`xᵃ ÷ xᵇ = xᵃ⁻ᵇ, so the exponent is ${big} − ${small} = ${big - small}.`])
  } },
  { lesson: 'powers-polynomials', level: 2, make: (r) => {
    const a = rnz(r, -4, 5), b = ri(r, 1, 4), c = rnz(r, -4, 5), d = ri(r, 1, 4), t = ri(r, 1, 2)
    if (t === 1) { const src = `${a}x^${b}*${c}x^${d}`; return alg('poly', `Multiply ${show(`(${a}x^${b})(${c}x^${d})`)}.`, src, simp(src), 'Multiply the numbers, and add the exponents of the same letter.', [`${A(a)} × ${A(c)} = ${A(a * c)}, and x${b}·x${d} gives exponent ${b + d}.`, `The product is ${pretty(simp(src))}.`]) }
    const e = ri(r, 2, 3), src = `(${a}x^${b})^${e}`; return alg('poly', `Simplify ${show(src)}.`, src, simp(src), 'Raise the number to the power and multiply the exponent of x.', [`(${A(a)})${'⁰¹²³'[e]} = ${A(a ** e)}, and x${'⁰¹²³⁴'[b]}${'⁰¹²³'[e]} has exponent ${b * e}.`, `The result is ${pretty(simp(src))}.`])
  } },
  { lesson: 'powers-polynomials', level: 2, make: (r) => {
    const p = [rnz(r, -4, 5), rnz(r, -5, 6), rnz(r, -6, 6)], q = [rnz(r, -4, 5), rnz(r, -5, 6), rnz(r, -6, 6)], plus = r() < 0.5
    const f = (c: number[]) => `${c[0]}x^2${c[1] < 0 ? c[1] : `+${c[1]}`}x${c[2] < 0 ? c[2] : `+${c[2]}`}`
    const src = `(${f(p)})${plus ? '+' : '-'}(${f(q)})`
    const ans = simp(src)
    return alg('poly', `${plus ? 'Add' : 'Subtract'}: ${show(`(${f(p)})`.replace(/\+/g, ' + ').replace(/-/g, ' − '))} ${plus ? '+' : '−'} ${show(`(${f(q)})`.replace(/\+/g, ' + ').replace(/-/g, ' − '))}.`, src, ans, plus ? 'Add the like terms: the x² terms, the x terms and the numbers.' : 'Subtract each term of the second polynomial from the matching term of the first. Take care with the signs.', [`The x² terms: ${A(p[0])} ${plus ? '+' : '−'} ${br(q[0])} = ${A(p[0] + (plus ? q[0] : -q[0]))}.`, `The result is ${pretty(ans)}.`])
  } },
  { lesson: 'powers-polynomials', level: 2, make: (r) => {
    const m = ri(r, 1, 4), c = rnz(r, -4, 5), a = rnz(r, -4, 5), b = rnz(r, -6, 6), k = rnz(r, -4, 5)
    const src = `${c}x^${m}(${a}x${b < 0 ? b : `+${b}`})`
    const ans = simp(src)
    void k
    return alg('poly', `Expand ${show(src)}.`, src, ans, 'Multiply each term inside the bracket by the term outside: multiply the numbers and add the exponents.', [`${A(c)}x${m === 1 ? '' : '⁰¹²³⁴'[m]} × ${A(a)}x = ${A(c * a)}x${'⁰¹²³⁴⁵'[m + 1]}, and ${A(c)}x${m === 1 ? '' : '⁰¹²³⁴'[m]} × ${A(b)} = ${A(c * b)}x${m === 1 ? '' : '⁰¹²³⁴'[m]}.`, `The result is ${pretty(ans)}.`])
  } },
  { lesson: 'powers-polynomials', level: 2, make: (r) => {
    const c = ri(r, 11, 99) / 10, e = ri(r, 2, 6), neg = r() < 0.5
    const val = c * 10 ** (neg ? -e : e)
    return decSpec(`Write ${c} × 10${neg ? '⁻' : ''}${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]} as an ordinary decimal number.`, Number(val.toPrecision(10)), 'Move the decimal point to the right for a positive power of 10, and to the left for a negative power.', [`${neg ? 'Move the decimal point' : 'Move the decimal point'} ${e} places to the ${neg ? 'left' : 'right'}.`, `${c} × 10${neg ? '⁻' : ''}${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]} = ${Number(val.toPrecision(10))}.`], 8)
  } },
  { lesson: 'powers-polynomials', level: 3, make: (r) => {
    const a = ri(r, 2, 8), b = ri(r, 2, 6), e1 = ri(r, 2, 6), e2 = ri(r, 2, 6)
    const prod = a * b
    const c = prod >= 10 ? prod / 10 : prod, e = e1 + e2 + (prod >= 10 ? 1 : 0)
    return tupleSpec(`Multiply (${a} × 10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e1]})(${b} × 10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e2]}). Write the answer in scientific notation as c × 10ⁿ and give (c, n).`, [fr(Math.round(c * 10), 10), fr(e)], 'Multiply the numbers, add the powers of 10, then adjust so that the coefficient is between 1 and 10.', [`${a} × ${b} = ${prod}, and 10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e1]} × 10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e2]} = 10${e1 + e2 > 9 ? e1 + e2 : '⁰¹²³⁴⁵⁶⁷⁸⁹'[e1 + e2]}.`, prod >= 10 ? `${prod} × 10^${e1 + e2} = ${c} × 10^${e}.` : `The coefficient ${prod} is already between 1 and 10.`, `So (c, n) = (${c}, ${e}).`])
  } },
  { lesson: 'powers-polynomials', level: 3, make: (r) => {
    const a = ri(r, 1, 4), b = rnz(r, -6, 6), c = ri(r, 1, 4), d = rnz(r, -6, 6)
    const src = `(${a}x${b < 0 ? b : `+${b}`})(${c}x^2${d < 0 ? d : `+${d}`}x)`
    const ans = simp(src)
    return alg('poly', `Expand ${show(src)}.`, src, ans, 'Multiply every term of the first bracket by every term of the second, then collect like terms.', [`Multiply out: ${pretty(ans)}.`])
  } },
  { lesson: 'powers-polynomials', level: 3, make: (r) => {
    const a = ri(r, 1, 4), b = ri(r, 1, 3), q = ri(r, 1, 3)
    const num = `${a * 3}x^${b + 3}y^${q + 1}`, den = `${3}x^${b}y`
    const src = `${num}/${den}`
    const ans = simp(`${a}x^3y^${q}`)
    return alg('poly', `Simplify ${show(num)} ÷ ${show(den)}.`, src, ans, 'Divide the numbers, and subtract the exponents of each letter.', [`${a * 3} ÷ 3 = ${a}. For x: ${b + 3} − ${b} = 3. For y: ${q + 1} − 1 = ${q}.`, `The result is ${pretty(ans)}.`].map((t) => t.replace(/^1 ÷/, '1 ÷'))) as never
  } },
]
export const A1_GENS: Gen[] = [...INT_GENS, ...FRAC_GENS, ...RATIO_GENS, ...EXPR_GENS, ...POWER_BASIC_GENS]
void w; void evaluate; void frs
