import { useEffect, useState } from 'react'
import { Learn } from './pages/Learn'
import { Practice } from './pages/Practice'
import { Explore } from './pages/Explore'
import { Games } from './pages/Games'

type Page = 'learn' | 'practice' | 'games' | 'explore'
const TABS: { id: Page; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'practice', label: 'Practice' },
  { id: 'games', label: 'Games' },
  { id: 'explore', label: 'Explore' },
]

function parse(): { page: Page; arg?: string } {
  const [, page, arg] = location.hash.replace(/^#/, '').split('/')
  return { page: (TABS.map((t) => t.id) as string[]).includes(page) ? (page as Page) : 'learn', arg }
}

export default function App() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/learn">
          <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden>
            <rect width="32" height="32" rx="6" className="logo-bg" />
            <circle cx="16" cy="16" r="9" className="logo-line" />
            <path d="M16 16L22.2 9.5M16 16h9M16 16V7" className="logo-line" />
          </svg>
          Mathematikz
        </a>
        <nav>
          {TABS.map((t) => (
            <a key={t.id} href={`#/${t.id}`} className={route.page === t.id ? 'active' : ''}>{t.label}</a>
          ))}
        </nav>
      </header>
      <main>
        {route.page === 'learn' && <Learn lessonId={route.arg} />}
        {route.page === 'practice' && <Practice arg={route.arg} />}
        {route.page === 'games' && <Games arg={route.arg} />}
        {route.page === 'explore' && <Explore />}
      </main>
    </>
  )
}
