import { describe, expect, it } from 'vitest'
import {
  evalExpr, factorsOf, fmtFrac, parse, parseRat, rationalRoots, rEq, rVars, toRat, pDeg, proportional, fr, solveEquation,
} from './algebra'
import { ALG_GENS } from './algebraQuestions'
import { checkAnswer, generateQuestion, GENERATORS, Question } from './questions'
import { mulberry } from './rng'

const LESSON_IDS = ['expanding', 'factoring', 'polynomials', 'rational-simplify', 'rational-ops', 'rational-eq']
const SEEDS = 120

function make(gen: number, seed: number): Question {
  const g = GENERATORS[gen]
  const spec = g.make(mulberry(seed))
  return { ...spec, id: `${gen}-${seed}`, lesson: g.lesson, level: g.level, gen }
}
const algIndexes = GENERATORS.map((g, i) => ({ g, i })).filter((x) => ALG_GENS.includes(x.g)).map((x) => x.i)

describe('algebra generators', () => {
  it('cover every lesson at all three levels', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) {
      expect(ALG_GENS.filter((g) => g.lesson === l && g.level === lv).length, `${l} L${lv}`).toBeGreaterThanOrEqual(l === 'rational-eq' && lv === 1 ? 2 : 2)
    }
    expect(ALG_GENS.length).toBeGreaterThanOrEqual(50)
  })

  it('every question accepts its own answer, and the source is really equal to it', () => {
    for (const gi of algIndexes) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 7919 + gi)
      const tag = `gen ${gi} (${q.lesson} L${q.level}) seed ${s}: ${q.prompt}`
      const res = checkAnswer(q, q.input)
      expect(res.ok, `${tag} -> input "${q.input}" ${res.note ?? ''}`).toBe(true)
      expect(q.explanation.length, tag).toBeGreaterThanOrEqual(2)
      expect(q.hint.length, tag).toBeGreaterThan(10)
      expect(/NaN|Infinity|\[object/.test(q.prompt + q.display + q.explanation.join(' ')), tag).toBe(false)
      expect(/undefined/.test(q.display + q.input), tag).toBe(false)
      if (!q.alg) continue
      const { mode, source, answer, solveFor } = q.alg
      if (mode === 'equiv') {
        // the answer solves the equation: plug it in for random values of the other letters
        const vars = [...rVars(toRat(parse(source)))].filter((v) => v !== solveFor)
        for (let t = 0; t < 4; t++) {
          const env: Record<string, number> = {}
          vars.forEach((v, k) => { env[v] = 2.37 + k * 1.31 + t * 0.77 })
          const ansVal = evalExpr(answer, env)
          env[solveFor!] = ansVal
          expect(Math.abs(evalExpr(source, env)), `${tag}: equation not satisfied`).toBeLessThan(1e-6)
        }
      } else {
        expect(rEq(parseRat(source), parseRat(answer)), `${tag}: source != answer`).toBe(true)
      }
    }
  }, 120000)

  it('wrong answers are rejected', () => {
    for (const gi of algIndexes) for (let s = 1; s <= 25; s++) {
      const q = make(gi, s * 104729 + gi)
      for (const bad of ['0', '1', 'x', '7', 'no solution', '(x+1)(x-1)', 'x^2+1']) {
        if (bad === q.input) continue
        const res = checkAnswer(q, bad)
        if (res.ok) {
          // a trivially wrong guess may legitimately be right only if it equals the answer
          if (q.alg) expect(rEq(parseRat(bad), parseRat(q.alg.answer)), `${q.prompt} accepted "${bad}"`).toBe(true)
          else expect(q.display.includes(bad) || q.input === bad, `${q.prompt} accepted "${bad}"`).toBe(true)
        }
      }
    }
  })

  it('factoring answers are fully factored: every non-linear factor has no rational root, linear factors are primitive', () => {
    for (const gi of algIndexes) {
      if (GENERATORS[gi].lesson !== 'factoring') continue
      for (let s = 1; s <= SEEDS; s++) {
        const q = make(gi, s * 31 + gi)
        const f = factorsOf(parse(q.alg!.answer))
        expect(f.loose, q.prompt).toBe(false)
        for (const { p, k } of f.f.values()) {
          expect(k).toBeGreaterThanOrEqual(1)
          expect(p[0].c.n, `${q.prompt}: leading coefficient`).toBeGreaterThan(0)
          const vars = new Set(p.flatMap((t) => Object.keys(t.e)))
          if (vars.size === 1 && pDeg(p) >= 2 && pDeg(p) <= 3) {
            const v = [...vars][0]
            expect(rationalRoots(p, v).roots.length, `${q.prompt}: factor ${JSON.stringify(p)} has a rational root`).toBe(0)
          }
        }
        // the student cannot get away with a partial factoring
        const partial = q.alg!.source
        expect(checkAnswer(q, partial).ok, `${q.prompt}: accepted the unfactored form`).toBe(false)
      }
    }
  })

  it('rational answers are in lowest terms: the unsimplified source is not accepted unless it is already simple', () => {
    for (const gi of algIndexes) {
      if (!['rational-simplify', 'rational-ops'].includes(GENERATORS[gi].lesson)) continue
      for (let s = 1; s <= SEEDS; s++) {
        const q = make(gi, s * 53 + gi)
        if (!q.alg || q.alg.mode !== 'rational') continue
        let src, ans
        try { src = toRat(parse(q.alg.source)); ans = toRat(parse(q.alg.answer)) } catch (e) { throw new Error(`gen ${gi} ${q.alg.source}  ||  ${q.alg.answer}: ${(e as Error).message}`) }
        const simple = proportional(src.d, ans.d)
        expect(checkAnswer(q, q.alg.source).ok, `${q.prompt}: source accepted`).toBe(simple)
      }
    }
  })

  it('equations: answers match a direct solve, extraneous roots are dropped', () => {
    let extraneous = 0, none = 0
    for (const gi of algIndexes) {
      if (GENERATORS[gi].lesson !== 'rational-eq') continue
      for (let s = 1; s <= SEEDS; s++) {
        const q = make(gi, s * 97 + gi)
        if (q.kind !== 'set') continue
        if (/extraneous/.test(q.explanation.join(' '))) extraneous++
        if (q.answers.length === 0) none++
        const m = /Solve for (\w): (.*?)\. Give/.exec(q.prompt.replace(/−/g, '-'))
        expect(m, q.prompt).toBeTruthy()
        const [lhs, rhs] = m![2].split(' = ')
        const sol = solveEquation(parseRat(lhs), parseRat(rhs), m![1])
        expect(q.answers.map((a) => Number(Number(a).toFixed(9)))).toEqual(sol.roots.map((r) => Number((r.n / r.d).toFixed(9))))
        for (const r of sol.roots) expect(fmtFrac(r)).toBeTruthy()
      }
    }
    expect(extraneous).toBeGreaterThan(10)
    expect(none).toBeGreaterThan(0)
  })

  it('numeric and root questions: displayed answer is accepted in typed forms', () => {
    const q = (() => { for (let s = 1; s < 500; s++) { const x = make(algIndexes.find((i) => GENERATORS[i].lesson === 'polynomials' && GENERATORS[i].level === 3)!, s); if (x.kind === 'set' && x.answers.length >= 3) return x } throw new Error('none') })()
    const typed = q.answers.map((a) => String(Math.round(Number(a) * 1000) / 1000)).join(' and ')
    expect(checkAnswer(q, `x = ${q.input}`).ok).toBe(true)
    expect(checkAnswer(q, `{${q.input}}`).ok).toBe(true)
    expect(typed.length).toBeGreaterThan(0)
    expect(checkAnswer(q, q.input.split(', ').slice(1).join(', ')).ok).toBe(false)
  })

  it('free practice builds every lesson at every level without error', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) for (let s = 1; s <= 40; s++) {
      const q = generateQuestion([l], lv, s * 13)
      expect(q.lesson).toBe(l)
      expect(q.level).toBe(lv)
      expect(checkAnswer(q, q.input).ok).toBe(true)
    }
  })

  it('generates quickly enough for the page to stay responsive', () => {
    const t0 = performance.now()
    let n = 0
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) for (let s = 1; s <= 30; s++) { generateQuestion([l], lv, s * 31); n++ }
    const per = (performance.now() - t0) / n
    expect(per, `average ms per question: ${per.toFixed(1)}`).toBeLessThan(25)
  })

  it('every generator offers real variety (a generator stuck on a fallback would fail this)', () => {
    for (const gi of algIndexes) {
      const prompts = new Set<string>()
      for (let s = 1; s <= 200; s++) prompts.add(make(gi, s * 7 + gi).prompt)
      expect(prompts.size, `gen ${gi} (${GENERATORS[gi].lesson} L${GENERATORS[gi].level})`).toBeGreaterThanOrEqual(8)
    }
  })

  it('has variety: many different questions per lesson', () => {
    for (const l of LESSON_IDS) {
      const prompts = new Set<string>()
      for (let s = 1; s <= 200; s++) prompts.add(generateQuestion([l], ((s % 3) + 1), s * 977).prompt)
      expect(prompts.size, l).toBeGreaterThanOrEqual(60)
    }
    expect(fr(1).d).toBe(1)
  })
})
