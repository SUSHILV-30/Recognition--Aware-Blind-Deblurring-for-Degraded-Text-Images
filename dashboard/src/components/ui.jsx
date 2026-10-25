import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/* ---------------- Theme ---------------- */

const THEME_EVENT = 'rabd-theme-change'
const VARS = ['--ink', '--muted', '--rule', '--surface', '--surface-2', '--lens', '--gain', '--loss']

function readVars() {
  const cs = getComputedStyle(document.documentElement)
  const out = {}
  for (const v of VARS) out[v.slice(2)] = cs.getPropertyValue(v).trim()
  return out
}

// Recharts draws SVG with plain colour strings, so resolve the CSS tokens
// and re-read them whenever the theme flips.
export function useThemeColors() {
  const [colors, setColors] = useState(readVars)
  useEffect(() => {
    const update = () => setColors(readVars())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    window.addEventListener(THEME_EVENT, update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener(THEME_EVENT, update)
    }
  }, [])
  return colors
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('rabd-theme') } catch { return null }
  })
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
    window.dispatchEvent(new Event(THEME_EVENT))
  }, [theme])
  const toggle = () => {
    const isDark = theme
      ? theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    const next = isDark ? 'light' : 'dark'
    try { localStorage.setItem('rabd-theme', next) } catch { /* storage blocked */ }
    setThemeState(next)
  }
  const isDark = theme ? theme === 'dark' : typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  return { isDark, toggle }
}

/* ---------------- Lightbox ---------------- */

const LightboxContext = createContext(() => {})
export const useLightbox = () => useContext(LightboxContext)

export function LightboxProvider({ children }) {
  const [item, setItem] = useState(null)
  const ref = useRef(null)
  const open = useCallback((src, caption) => setItem({ src, caption }), [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (item && !d.open) d.showModal()
    if (!item && d.open) d.close()
  }, [item])

  return (
    <LightboxContext.Provider value={open}>
      {children}
      <dialog
        ref={ref}
        className="lightbox"
        onClose={() => setItem(null)}
        onClick={(e) => { if (e.target === ref.current) setItem(null) }}
      >
        {item && (
          <>
            <button type="button" aria-label="Close image" onClick={() => setItem(null)}>×</button>
            <img src={item.src} alt={item.caption || ''} />
            {item.caption && <p>{item.caption}</p>}
          </>
        )}
      </dialog>
    </LightboxContext.Provider>
  )
}

/* ---------------- Building blocks ---------------- */

export function Figure({ src, caption, alt, className = '' }) {
  const open = useLightbox()
  return (
    <figure className={`fig ${className}`}>
      <img
        src={src}
        alt={alt || caption}
        loading="lazy"
        onClick={() => open(src, caption)}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

export function Swatch({ color }) {
  return <span className="swatch" style={{ background: color }} />
}

export function SectionHead({ title, children }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  )
}

export function useInView(options = { threshold: 0.3 }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect() }
    }, options)
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, inView]
}

export const fmtDelta = (d, digits = 2) => (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(digits)
