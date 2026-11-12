/**
 * Pure logic for the Games page: card decks for the match-up game, scoring, and the graph rounds for Root Hunter.
 * Kept free of React so it can be tested like the rest of the maths.
 */
import { parsePoly, fmtPoly, pretty, pMul } from './algebra'
import {
  cosExact, fmtDeg, fmtPi, fmtSurd, sinExact, SPECIAL_DEGREES, tanExact,
} from './exact'
import { mulberry, pick, Rng, shuffle } from './rng'

/* ------------------------------------------------------------------ match-up decks */

export interface Pair { id: number; a: string; b: string }
export interface Deck { id: string; name: string; blurb: string; make: (r: Rng, n: number) => Pair[] }

const ri = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

/** Draw up to n pairs from candidates, never repeating either side. */
function draw(r: Rng, candidates: [string, string][], n: number): Pair[] {
  const out: Pair[] = []
  const as = new Set<string>(), bs = new Set<string>()
  for (const [a, b] of shuffle(candidates, r)) {
    if (as.has(a) || bs.has(b)) continue
    as.add(a); bs.add(b)
    out.push({ id: out.length, a, b })
    if (out.length === n) break
  }
  return out
}

const ANGLES = SPECIAL_DEGREES.filter((d) => d > 0 && d <= 360)

export const DECKS: Deck[] = [
  {
    id: 'degrees-radians', name: 'Degrees and radians', blurb: 'Pair every angle with the same angle in radians.',
    make: (r, n) => draw(r, ANGLES.map((d) => [fmtDeg(d), fmtPi(d)]), n),
  },
  {
    id: 'trig-values', name: 'Exact trig values', blurb: 'Pair sin, cos and tan of a special angle with its exact value.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (const d of ANGLES) {
        c.push([`sin ${fmtDeg(d)}`, fmtSurd(sinExact(d))], [`cos ${fmtDeg(d)}`, fmtSurd(cosExact(d))])
        const t = tanExact(d)
        if (t) c.push([`tan ${fmtDeg(d)}`, fmtSurd(t)])
      }
      return draw(r, c, n)
    },
  },
  {
    id: 'expand-factor', name: 'Expand and factor', blurb: 'Pair each product of brackets with the expanded polynomial.',
    make: (r, n) => {
      const c: [string, string][] = []
      for (let i = 0; i < 80; i++) {
        const a = ri(r, 1, 3), p = ri(r, -6, 6), q = ri(r, -6, 6), b = pick(r, [1, 1, 2])
        if (!p || !q) continue
        const f1 = `${a === 1 ? '' : a}x${p < 0 ? '−' : '+'}${Math.abs(p)}`, f2 = `${b === 1 ? '' : b}x${q < 0 ? '−' : '+'}${Math.abs(q)}`
        const ascii = (s: string) => s.replace(/−/g, '-')
        const poly = fmtPoly(pMul(parsePoly(ascii(f1)), parsePoly(ascii(f2))), true)
        c.push([`(${f1})(${f2})`, pretty(poly)])
      }
      return draw(r, c, n)
    },
  },
]

export const deckById = (id: string) => DECKS.find((d) => d.id === id)

export interface Tile { key: string; pair: number; text: string }

/** 2n tiles, shuffled. Two tiles match when they share a pair id. */
export function buildBoard(deckId: string, n = 6, seed = Math.floor(Math.random() * 1e9)): Tile[] {
  const deck = deckById(deckId) ?? DECKS[0]
  const r = mulberry(seed)
  const pairs = deck.make(r, n)
  return shuffle(pairs.flatMap((p) => [{ key: `${p.id}a`, pair: p.id, text: p.a }, { key: `${p.id}b`, pair: p.id, text: p.b }]), r)
}

/* ------------------------------------------------------------------ scoring */

/** Sprint: 10 per correct answer, plus 2 for each step of the best streak beyond 2. */
export const sprintScore = (correct: number, bestStreak: number) => correct * 10 + Math.max(0, bestStreak - 2) * 2
/** Survival gets harder as you go: level 1 for the first five, level 2 up to ten, then level 3. */
export const survivalLevel = (correct: number) => Math.min(3, 1 + Math.floor(correct / 5))
/** Match-up is a memory game, so the pairs themselves are the floor: 3 stars up to 1.5 moves per pair, 2 stars up to 2.5. */
export const matchStars = (moves: number, pairs: number) => (moves <= Math.ceil(pairs * 1.5) ? 3 : moves <= Math.ceil(pairs * 2.5) ? 2 : 1)

/* ------------------------------------------------------------------ root hunter */

export interface RootRound { roots: number[]; k: number; xMin: number; xMax: number; yMin: number; yMax: number }
export const rootValue = (round: RootRound, x: number) => round.k * round.roots.reduce((p, r) => p * (x - r), 1)

/** A polynomial with integer roots at least 2 apart (2 at first, up to 4), scaled so the smallest hump between roots is clearly visible. */
export function rootRound(difficulty: 1 | 2 | 3, seed: number): RootRound {
  const r = mulberry(seed)
  const count = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  let roots: number[] = []
  for (let tries = 0; tries < 500; tries++) {
    const cand: number[] = []
    while (cand.length < count) { const v = ri(r, -5, 5); if (!cand.includes(v)) cand.push(v) }
    cand.sort((a, b) => a - b)
    roots = cand
    if (cand.every((v, i) => i === 0 || v - cand[i - 1] >= 2)) break
  }
  const sign = r() < 0.5 ? 1 : -1
  const unit: RootRound = { roots, k: 1, xMin: -6.5, xMax: 6.5, yMin: -6, yMax: 6 }
  // the smallest hump (largest |f| between two neighbouring roots) is scaled to 1.8 units tall
  let smallest = Infinity
  for (let i = 1; i < roots.length; i++) {
    let peak = 0
    for (let x = roots[i - 1]; x <= roots[i]; x += 0.02) peak = Math.max(peak, Math.abs(rootValue(unit, x)))
    smallest = Math.min(smallest, peak)
  }
  return { ...unit, k: (sign * 1.8) / smallest }
}

/** Does every root have exactly one click within tol, and no stray clicks? */
export function judgeClicks(roots: number[], clicks: number[], tol = 0.35): { found: number[]; stray: number[]; ok: boolean } {
  const found: number[] = []
  const stray: number[] = []
  const used = new Set<number>()
  for (const c of clicks) {
    const i = roots.findIndex((r, j) => !used.has(j) && Math.abs(r - c) <= tol)
    if (i >= 0) { used.add(i); found.push(roots[i]) } else stray.push(c)
  }
  return { found, stray, ok: found.length === roots.length && stray.length === 0 }
}
