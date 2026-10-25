import { useEffect, useState } from 'react'
import { useTheme } from './ui.jsx'

export const SECTIONS = [
  ['problem', 'Problem'],
  ['architecture', 'Architecture'],
  ['method', 'Method'],
  ['models', 'Models'],
  ['compare', 'Compare'],
  ['ocr', 'OCR'],
  ['findings', 'Findings'],
  ['progress', 'Progress'],
  ['team', 'Team'],
]

export default function Nav({ page }) {
  const [active, setActive] = useState(null)
  const { isDark, toggle } = useTheme()

  useEffect(() => {
    setActive(page === 'model' ? 'models' : null)
    if (page !== 'home') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const [id] of SECTIONS) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [page])

  return (
    <nav className="nav" aria-label="Sections">
      <div className="wrap">
        <a className="brand" href="#top">RABD <span>HDC 2021 text deblurring</span></a>
        <ul>
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a className={`link ${active === id ? 'active' : ''}`} href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="theme-btn"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
          )}
        </button>
      </div>
    </nav>
  )
}
