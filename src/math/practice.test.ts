import { describe, expect, it } from 'vitest'
import { LESSONS, UNITS } from '../learn/content'
import { buildRound, SCOPES, scopeById } from './practice'
import { checkAnswer, generateQuestion } from './questions'

describe('section practice', () => {
  it('every scope builds valid, repeatable rounds', () => {
    expect(SCOPES.length).toBe(LESSONS.length + UNITS.length)
    for (const sc of SCOPES) {
      expect(scopeById(sc.id)).toBeTruthy()
      for (let s = 1; s <= 15; s++) {
        const round = buildRound(sc.lessons, 10, s * 101)
        expect(round.length).toBe(10)
        expect(round.filter((i) => i.kind === 'q').length, sc.id).toBeGreaterThanOrEqual(6)
        for (const it of round) {
          if (it.kind === 'q') expect(checkAnswer(it.q, it.q.input).ok, it.q.prompt).toBe(true)
          else { expect(it.correct).toBeGreaterThanOrEqual(0); expect(it.correct).toBeLessThan(it.options.length) }
        }
      }
    }
  })
  it('a lesson round only draws questions from that lesson', () => {
    for (const l of LESSONS) for (let s = 1; s <= 5; s++) {
      const round = buildRound([l.id], 10, s * 17)
      for (const it of round) expect(it.kind === 'q' ? it.q.lesson : it.lesson).toBe(l.id)
    }
  })
  it('rounds get harder', () => {
    const round = buildRound(['exact-values'], 10, 5).filter((i) => i.kind === 'q') as { kind: 'q'; q: { level: number } }[]
    expect(round[0].q.level).toBeLessThanOrEqual(round[round.length - 1].q.level)
  })
  it('free practice falls back gracefully for every topic and level', () => {
    for (const l of LESSONS) for (const lv of [1, 2, 3]) expect(generateQuestion([l.id], lv, 3).lesson).toBe(l.id)
    expect(generateQuestion('all', 2, 9).prompt.length).toBeGreaterThan(10)
  })
})
