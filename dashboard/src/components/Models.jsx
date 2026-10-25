import { SectionHead } from './ui.jsx'
import { MODELS, modelHref } from '../data/models.js'

// A tiny inline sparkline: no axes, just the shape of the curve.
export function Spark({ values, color, width = 220, height = 46 }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 4
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0
  const pts = values.map((v, i) => [pad + i * step, height - 4 - ((v - min) / span) * (height - 8)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={area} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  )
}

export default function Models() {
  return (
    <section className="block" id="models">
      <div className="wrap">
        <SectionHead title="Five models, one benchmark">
          Each team member took one restoration approach through the same data and the same pairing
          protocol. Open a model for its architecture, training recipe, every measured result and its
          sample outputs.
        </SectionHead>

        <div className="model-cards">
          {MODELS.map((m) => (
            <a key={m.id} className="model-card" href={modelHref(m.id)} style={{ '--accent': m.color }}>
              <div className="mc-top">
                <span className="mc-n">{m.n}</span>
                <span className="mc-tag">{m.paradigm}</span>
              </div>
              <h3>
                {m.name}
                <span>{m.variant}</span>
              </h3>
              <p className="mc-owner">{m.owner}</p>
              <p className="mc-line">{m.tagline}</p>
              <div className="mc-stats">
                {m.headline.map(([v, l]) => (
                  <div key={l}><b>{v}</b><span>{l}</span></div>
                ))}
              </div>
              <div className="mc-spark">
                <Spark values={m.spark.values} color={m.color} />
                <span>{m.spark.label}</span>
              </div>
              <span className="mc-open">Open model <i aria-hidden="true">→</i></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
