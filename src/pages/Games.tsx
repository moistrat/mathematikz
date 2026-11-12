import { useEffect, useMemo, useRef, useState } from 'react'
import { UNITS } from '../learn/content'
import { buildBoard, DECKS, judgeClicks, matchStars, RootRound, rootRound, rootValue, sprintScore, survivalLevel, Tile } from '../math/games'
import { scopeById, unitScopeId } from '../math/practice'
import { checkAnswer, generateQuestion, Question } from '../math/questions'
import { load, save } from '../state/storage'
import { keysFor, useEnterToContinue } from './Practice'

const GAMES = [
  { id: 'sprint', name: 'Sprint', blurb: '60 seconds. Answer as many questions as you can; streaks earn bonus points.' },
  { id: 'survival', name: 'Survival', blurb: 'Three lives. The questions get harder every five you get right. How far can you go?' },
  { id: 'match', name: 'Match-up', blurb: 'Flip tiles and pair each expression with its twin. Fewest moves wins.' },
  { id: 'roots', name: 'Root hunter', blurb: 'A graph appears. Click every place where it crosses the x-axis.' },
]

/** Scope choices shared by the question games: everything, or one unit. */
function ScopePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">Topic
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Topic">
        <option value="all">Everything, mixed</option>
        {UNITS.map((u, i) => <option key={u.id} value={unitScopeId(u.id)}>Unit {i + 1}: {u.title}</option>)}
      </select>
    </label>
  )
}
const lessonsFor = (scope: string): string[] | 'all' => (scope === 'all' ? 'all' : scopeById(scope)?.lessons ?? 'all')

/* ------------------------------------------------------------------ one fast question */

/** A question with no retries and no ceremony: Enter checks; a miss shows the answer and Enter moves on. */
function QuickAsk({ q, onAnswer, onNext }: { q: Question; onAnswer: (ok: boolean) => void; onNext: () => void }) {
  const [text, setText] = useState('')
  const [miss, setMiss] = useState(false)
  const [note, setNote] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { setText(''); setMiss(false); setNote(''); const f = setTimeout(() => input.current?.focus(), 0); return () => clearTimeout(f) }, [q.id])
  useEnterToContinue(miss, onNext)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (miss) return onNext()
    const res = checkAnswer(q, text)
    if (res.invalid) { setNote(res.note ?? ''); return }
    onAnswer(res.ok)
    if (res.ok) onNext()
    else setMiss(true)
  }
  const insert = (s: string) => { const el = input.current; const a = el?.selectionStart ?? text.length, b = el?.selectionEnd ?? text.length; setText(text.slice(0, a) + s + text.slice(b)); requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(a + s.length, a + s.length) }) }
  return (
    <form className={`card quiz-card ${miss ? 'wrong' : ''}`} onSubmit={submit}>
      <p className="q-prompt">{q.prompt}</p>
      <div className="q-row">
        <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Your answer" disabled={miss} />
        {q.unit && <span className="unit">{q.unit}</span>}
        <button className="btn primary" type="submit">{miss ? 'Next' : 'Check'}</button>
      </div>
      {!miss && (
        <div className="keys" aria-label="Symbols">
          {keysFor(q).map(([label, ins]) => <button key={label} type="button" className="symkey" onClick={() => insert(ins)} aria-label={`Insert ${label}`}>{label}</button>)}
        </div>
      )}
      {note && !miss && <p className="q-note">{note}</p>}
      {miss && <p className="q-bad">Missed. Answer: <b>{q.display}</b></p>}
    </form>
  )
}

function Results({ title, lines, best, isBest, onAgain }: { title: string; lines: [string, string][]; best: number; isBest: boolean; onAgain: () => void }) {
  return (
    <div className="card round-result">
      <p className="eyebrow">{title}</p>
      <h2 className="rr-score">{lines[0][1]}</h2>
      <p className="muted">{isBest ? 'New personal best.' : `Personal best: ${best}.`}</p>
      <dl className="readouts" style={{ maxWidth: 360 }}>{lines.slice(1).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div className="tool-row"><button className="btn primary" onClick={onAgain} autoFocus>Play again</button><a className="btn" href="#/games">All games</a></div>
    </div>
  )
}

/* ------------------------------------------------------------------ sprint */

const SPRINT_SECONDS = 60

function Sprint() {
  const [scope, setScope] = useState<string>(() => load('mathematikz.games.scope', 'all'))
  const [level, setLevel] = useState<number>(() => load('mathematikz.games.level', 1))
  const [phase, setPhase] = useState<'setup' | 'play' | 'over'>('setup')
  const [left, setLeft] = useState(SPRINT_SECONDS)
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, best: 0 })
  const [q, setQ] = useState<Question | null>(null)
  const [best, setBest] = useState<number>(() => load('mathematikz.games.sprint.best', 0))
  const [newBest, setNewBest] = useState(false)
  const deadline = useRef(0)
  const next = () => setQ(generateQuestion(lessonsFor(scope), level))

  const start = () => { save('mathematikz.games.scope', scope); save('mathematikz.games.level', level); setStats({ correct: 0, wrong: 0, streak: 0, best: 0 }); setLeft(SPRINT_SECONDS); deadline.current = Date.now() + SPRINT_SECONDS * 1000; setNewBest(false); next(); setPhase('play') }
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) setPhase('over')
    }, 100)
    return () => clearInterval(t)
  }, [phase])
  const score = sprintScore(stats.correct, stats.best)
  useEffect(() => {
    if (phase !== 'over') return
    if (score > best) { setBest(score); setNewBest(true); save('mathematikz.games.sprint.best', score) }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'setup') return (
    <div className="card game-setup">
      <ScopePicker value={scope} onChange={setScope} />
      <p className="eyebrow">Difficulty</p>
      <div className="seg" role="group" aria-label="Difficulty">{[1, 2, 3].map((l) => <button key={l} className={l === level ? 'on' : ''} onClick={() => setLevel(l)}>{['Warm-up', 'Standard', 'Challenge'][l - 1]}</button>)}</div>
      <p className="muted small">Personal best: {best}. Type your answer and press Enter. A miss shows the answer; press Enter again to carry on. The clock keeps running.</p>
      <button className="btn primary" onClick={start} autoFocus>Start</button>
    </div>
  )
  if (phase === 'over') return <Results title="Sprint" lines={[['Score', String(score)], ['Correct', String(stats.correct)], ['Missed', String(stats.wrong)], ['Best streak', String(stats.best)]]} best={best} isBest={newBest} onAgain={() => setPhase('setup')} />
  return (
    <>
      <div className="game-hud">
        <span className={`timer ${left <= 10 ? 'low' : ''}`}>{left}s</span>
        <span>Score <b className="mono">{score}</b></span>
        <span>Streak <b className="mono">{stats.streak}</b></span>
      </div>
      <div className="cp-bar" style={{ marginBottom: '1rem' }}><i style={{ width: `${(left / SPRINT_SECONDS) * 100}%` }} /></div>
      {q && <QuickAsk q={q} onNext={next} onAnswer={(ok) => setStats((s) => { const streak = ok ? s.streak + 1 : 0; return { correct: s.correct + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), streak, best: Math.max(s.best, streak) } })} />}
    </>
  )
}

/* ------------------------------------------------------------------ survival */

function Survival() {
  const [scope, setScope] = useState<string>(() => load('mathematikz.games.scope', 'all'))
  const [phase, setPhase] = useState<'setup' | 'play' | 'over'>('setup')
  const [lives, setLives] = useState(3)
  const [correct, setCorrect] = useState(0)
  const [q, setQ] = useState<Question | null>(null)
  const [best, setBest] = useState<number>(() => load('mathematikz.games.survival.best', 0))
  const [newBest, setNewBest] = useState(false)
  const done = useRef(0)
  const level = survivalLevel(correct)
  const next = (c = done.current) => setQ(generateQuestion(lessonsFor(scope), survivalLevel(c)))
  const start = () => { save('mathematikz.games.scope', scope); done.current = 0; setCorrect(0); setLives(3); setNewBest(false); next(0); setPhase('play') }
  const answer = (ok: boolean) => {
    if (ok) { done.current += 1; setCorrect(done.current) }
    else setLives((l) => l - 1)
  }
  const advance = () => {
    if (lives <= 0) {
      if (done.current > best) { setBest(done.current); setNewBest(true); save('mathematikz.games.survival.best', done.current) }
      setPhase('over')
    } else next()
  }

  if (phase === 'setup') return (
    <div className="card game-setup">
      <ScopePicker value={scope} onChange={setScope} />
      <p className="muted small">Personal best: {best} in a row. Levels step up after 5 and 10 correct answers. Three misses and it is over.</p>
      <button className="btn primary" onClick={start} autoFocus>Start</button>
    </div>
  )
  if (phase === 'over') return <Results title="Survival" lines={[['Answered correctly', String(correct)], ['Reached level', String(survivalLevel(correct))]]} best={best} isBest={newBest} onAgain={() => setPhase('setup')} />
  return (
    <>
      <div className="game-hud">
        <span className="lives" aria-label={`${lives} lives left`}>{[0, 1, 2].map((i) => <i key={i} className={i < lives ? 'on' : ''} />)}</span>
        <span>Correct <b className="mono">{correct}</b></span>
        <span>Level <b className="mono">{level}</b></span>
      </div>
      {q && <QuickAsk q={q} onNext={advance} onAnswer={answer} />}
    </>
  )
}

/* ------------------------------------------------------------------ match-up */

function Match() {
  const [deckId, setDeckId] = useState<string>(() => load('mathematikz.games.deck', DECKS[0].id))
  const [board, setBoard] = useState<Tile[] | null>(null)
  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<Set<number>>(new Set())
  const [moves, setMoves] = useState(0)
  const [t0, setT0] = useState(0)
  const [secs, setSecs] = useState<number | null>(null)
  const bestKey = `mathematikz.games.match.${deckId}`
  const [best, setBest] = useState<number>(() => load(bestKey, 0))
  const pairs = board ? board.length / 2 : 6
  const start = () => { save('mathematikz.games.deck', deckId); setBoard(buildBoard(deckId, 6)); setOpen([]); setFound(new Set()); setMoves(0); setSecs(null); setT0(Date.now()); setBest(load(bestKey, 0)) }
  const flip = (t: Tile) => {
    if (found.has(t.pair) || open.includes(t.key) || open.length >= 2) return
    const o = [...open, t.key]
    setOpen(o)
    if (o.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = o.map((k) => board!.find((x) => x.key === k)!)
      if (a.pair === b.pair) {
        setTimeout(() => {
          const f = new Set(found); f.add(a.pair); setFound(f); setOpen([])
          if (f.size === pairs) {
            const s = Math.round((Date.now() - t0) / 1000); setSecs(s)
            const stars = matchStars(moves + 1, pairs)
            if (stars > best) { setBest(stars); save(bestKey, stars) }
          }
        }, 350)
      } else setTimeout(() => setOpen([]), 900)
    }
  }
  if (!board) return (
    <div className="card game-setup">
      <p className="eyebrow">Deck</p>
      <div className="deck-list">
        {DECKS.map((d) => (
          <label key={d.id} className={`opt ${deckId === d.id ? 'is-right' : ''}`}>
            <input type="radio" name="deck" checked={deckId === d.id} onChange={() => { setDeckId(d.id); setBest(load(`mathematikz.games.match.${d.id}`, 0)) }} />
            <span><b>{d.name}</b><br /><small className="muted">{d.blurb}</small></span>
          </label>
        ))}
      </div>
      <p className="muted small">Best on this deck: {best ? '★'.repeat(best) : 'not played yet'}. Tiles are fully keyboard-reachable: Tab to a tile and press Enter or Space.</p>
      <button className="btn primary" onClick={start} autoFocus>Deal the cards</button>
    </div>
  )
  const won = secs !== null
  return (
    <>
      <div className="game-hud"><span>Moves <b className="mono">{moves}</b></span><span>Pairs <b className="mono">{found.size} / {pairs}</b></span><button className="btn ghost" onClick={() => setBoard(null)}>Change deck</button></div>
      <div className="board" role="group" aria-label="Tiles">
        {board.map((t) => {
          const shown = open.includes(t.key) || found.has(t.pair)
          return <button key={t.key} className={`tile ${shown ? 'up' : ''} ${found.has(t.pair) ? 'done' : ''}`} onClick={() => flip(t)} aria-label={shown ? t.text : 'face-down tile'} aria-pressed={shown}>{shown ? t.text : '?'}</button>
        })}
      </div>
      {won && (
        <div className="card round-result" style={{ marginTop: '1rem' }}>
          <p className="eyebrow">Cleared</p>
          <h2 className="rr-score">{'★'.repeat(matchStars(moves, pairs))}{'☆'.repeat(3 - matchStars(moves, pairs))}</h2>
          <p className="muted">{moves} moves in {secs} seconds. Three stars needs {Math.ceil(pairs * 1.5)} moves or fewer, so remember where the misses were.</p>
          <div className="tool-row"><button className="btn primary" onClick={start} autoFocus>New deal</button><button className="btn" onClick={() => setBoard(null)}>Change deck</button></div>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ root hunter */

const W = 640, H = 300

function RootGraph({ round, clicks, reveal, onClick, disabled }: { round: RootRound; clicks: number[]; reveal: boolean; onClick: (x: number) => void; disabled: boolean }) {
  const sx = (x: number) => ((x - round.xMin) / (round.xMax - round.xMin)) * W
  const sy = (y: number) => H - ((y - round.yMin) / (round.yMax - round.yMin)) * H
  const pts: string[] = []
  for (let i = 0; i <= 240; i++) {
    const x = round.xMin + ((round.xMax - round.xMin) * i) / 240
    const y = Math.max(-1e3, Math.min(1e3, rootValue(round, x)))
    pts.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
  }
  const ticks: number[] = []
  for (let t = Math.ceil(round.xMin); t <= Math.floor(round.xMax); t++) ticks.push(t)
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    onClick(round.xMin + ((e.clientX - r.left) / r.width) * (round.xMax - round.xMin))
  }
  return (
    <svg className="wsvg rootgraph" viewBox={`0 0 ${W} ${H}`} onClick={click} role="img" aria-label="Graph of a polynomial. Click where it crosses the x-axis." style={{ cursor: disabled ? 'default' : 'crosshair' }}>
      <defs><clipPath id="rg-clip"><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
      {ticks.map((t) => <g key={t}><line className="w-grid" x1={sx(t)} x2={sx(t)} y1={0} y2={H} /><text className="w-t sm" x={sx(t)} y={sy(0) + 14} textAnchor="middle">{t < 0 ? `−${-t}` : t}</text></g>)}
      <line className="w-axis" x1={0} x2={W} y1={sy(0)} y2={sy(0)} />
      <polyline className="w-curve" clipPath="url(#rg-clip)" points={pts.join(' ')} />
      {clicks.map((c, i) => <g key={i}><line className="w-ref" x1={sx(c)} x2={sx(c)} y1={sy(0) - 14} y2={sy(0) + 14} /><circle className="w-dot" cx={sx(c)} cy={sy(0)} r={6} /></g>)}
      {reveal && round.roots.map((r) => <circle key={r} cx={sx(r)} cy={sy(0)} r={9} fill="none" stroke="var(--accent)" strokeWidth={2.5} />)}
    </svg>
  )
}

const TOTAL_ROUNDS = 6

function RootHunter() {
  const [phase, setPhase] = useState<'setup' | 'play' | 'over'>('setup')
  const [idx, setIdx] = useState(0)
  const [round, setRound] = useState<RootRound | null>(null)
  const [clicks, setClicks] = useState<number[]>([])
  const [verdict, setVerdict] = useState<null | { ok: boolean }>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<number>(() => load('mathematikz.games.roots.best', 0))
  const [newBest, setNewBest] = useState(false)
  const diff = (i: number): 1 | 2 | 3 => (i < 2 ? 1 : i < 4 ? 2 : 3)
  const deal = (i: number) => { setRound(rootRound(diff(i), Math.floor(Math.random() * 1e9))); setClicks([]); setVerdict(null) }
  const start = () => { setIdx(0); setScore(0); setNewBest(false); deal(0); setPhase('play') }
  const check = () => {
    if (!round || verdict) return
    const j = judgeClicks(round.roots, clicks)
    setVerdict({ ok: j.ok })
    if (j.ok) setScore((s) => s + 1)
  }
  const nextRound = () => {
    if (idx + 1 >= TOTAL_ROUNDS) {
      if (score > best) { setBest(score); setNewBest(true); save('mathematikz.games.roots.best', score) }
      setPhase('over')
    } else { setIdx(idx + 1); deal(idx + 1) }
  }
  useEnterToContinue(!!verdict, nextRound)
  const hint = useMemo(() => (round ? `${round.roots.length} root${round.roots.length > 1 ? 's' : ''} to find.` : ''), [round])
  useEffect(() => {
    if (phase !== 'play' || verdict) return
    const on = (e: KeyboardEvent) => { if (e.key === 'Enter' && clicks.length && !(e.target instanceof Element && e.target.closest('button'))) { e.preventDefault(); check() } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
  if (phase === 'setup') return (
    <div className="card game-setup">
      <p className="muted">Six graphs, from two roots to four. Click the x-axis where the curve crosses it. Click an existing mark to take it away. Press Enter to check, and Enter again for the next graph. Roots are always whole numbers.</p>
      <p className="muted small">Personal best: {best} / {TOTAL_ROUNDS}.</p>
      <button className="btn primary" onClick={start} autoFocus>Start</button>
    </div>
  )
  if (phase === 'over') return <Results title="Root hunter" lines={[['Graphs solved', `${score} / ${TOTAL_ROUNDS}`]]} best={best} isBest={newBest} onAgain={() => setPhase('setup')} />
  if (!round) return null
  return (
    <>
      <div className="game-hud"><span>Graph <b className="mono">{idx + 1} / {TOTAL_ROUNDS}</b></span><span>Solved <b className="mono">{score}</b></span><span className="muted">{hint}</span></div>
      <div className="card" style={{ padding: '.6rem' }}>
        <RootGraph round={round} clicks={clicks} reveal={!!verdict && !verdict.ok} disabled={!!verdict}
          onClick={(x) => setClicks((cs) => { const near = cs.findIndex((c) => Math.abs(c - x) < 0.3); return near >= 0 ? cs.filter((_, i) => i !== near) : [...cs, Math.round(x * 20) / 20] })} />
        <div className="tool-row" style={{ marginTop: '.7rem' }}>
          {!verdict ? <button className="btn primary" disabled={!clicks.length} onClick={check}>Check</button> : <button className="btn primary" onClick={nextRound} autoFocus>{idx + 1 >= TOTAL_ROUNDS ? 'See results' : 'Next graph'}</button>}
          {!verdict && <button className="btn" onClick={() => setClicks([])} disabled={!clicks.length}>Clear marks</button>}
        </div>
        {verdict && <p className={verdict.ok ? 'q-good' : 'q-bad'}>{verdict.ok ? 'Every root found.' : `Not quite. The roots were x = ${round.roots.map((r) => (r < 0 ? `−${-r}` : r)).join(', ')} (ringed on the graph). A curve crosses the axis once for each linear factor (x − r).`}</p>}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ page */

export function Games({ arg }: { arg?: string }) {
  const game = GAMES.find((g) => g.id === arg)
  return (
    <div className="page quiz games">
      <p className="eyebrow">Games</p>
      <h1 className="page-title">{game ? game.name : 'Play with the maths'}</h1>
      {!game ? (
        <>
          <p className="lead" style={{ maxWidth: '62ch' }}>Quick games that use the same questions as Practice. Each keeps a personal best on this device.</p>
          <div className="game-grid">
            {GAMES.map((g) => <a key={g.id} className="card game-card" href={`#/games/${g.id}`}><h3>{g.name}</h3><p className="muted">{g.blurb}</p></a>)}
          </div>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}><a className="link" href="#/games">All games</a> &middot; {game.blurb}</p>
          {game.id === 'sprint' && <Sprint />}
          {game.id === 'survival' && <Survival />}
          {game.id === 'match' && <Match />}
          {game.id === 'roots' && <RootHunter />}
        </>
      )}
    </div>
  )
}
