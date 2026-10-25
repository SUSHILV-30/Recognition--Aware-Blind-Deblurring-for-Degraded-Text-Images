import { useState } from 'react'
import { Figure } from './ui.jsx'

/* ---------------- Shared building blocks for model pages ---------------- */

export function Setup({ rows }) {
  return (
    <dl className="setup">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function KeyVals({ items, className = '' }) {
  return (
    <div className={`keyvals ${className}`}>
      {items.map(([v, label, tone]) => (
        <div key={label}>
          <b className={tone || ''}>{v}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

// A figure with a level switcher above it. levels: [{ label, src, caption }]
export function LevelFigures({ levels, label = 'Level' }) {
  const [i, setI] = useState(0)
  const cur = levels[i]
  return (
    <div>
      <div className="cmp-toolbar">
        <div className="seg" role="tablist" aria-label={label}>
          {levels.map((l, k) => (
            <button key={l.label} role="tab" aria-selected={k === i} onClick={() => setI(k)}>{l.label}</button>
          ))}
        </div>
        {cur.meta && <span className="small muted">{cur.meta}</span>}
      </div>
      <Figure key={cur.src} src={cur.src} caption={cur.caption} />
    </div>
  )
}

export function Takeaways({ shows, limits, next }) {
  return (
    <div className="takeaways">
      <div className="panel">
        <h4>What it shows</h4>
        <ul className="facts small">{shows.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <div className="panel">
        <h4>Limitations</h4>
        <ul className="facts small loss-dots">{limits.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <div className="panel">
        <h4>Next</h4>
        <ol className="recipe small">{next.map((t) => <li key={t}><span>{t}</span></li>)}</ol>
      </div>
    </div>
  )
}
