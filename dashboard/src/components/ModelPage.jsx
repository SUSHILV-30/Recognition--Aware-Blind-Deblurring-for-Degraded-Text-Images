import { useEffect, useState } from 'react'
import { Swatch } from './ui.jsx'
import { KeyVals } from './modelkit.jsx'
import { MODELS, modelHref } from '../data/models.js'
import restormer from './models/restormer.jsx'
import nafnet from './models/nafnet.jsx'
import mprnet from './models/mprnet.jsx'
import scratch from './models/scratch.jsx'
import physics from './models/physics.jsx'

const CONTENT = { restormer, nafnet, mprnet, scratch, physics }

/* ---------------- Page ---------------- */

function SubNav({ sections }) {
  const [active, setActive] = useState(sections[0]?.id)

  // The active section is the last one whose top has passed under the sticky bars.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current = sections[0]?.id
      for (const s of sections) {
        const el = document.getElementById(`m-${s.id}`)
        if (el && el.getBoundingClientRect().top <= 160) current = s.id
      }
      setActive(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [sections])

  // Buttons, not links: a hash change would leave the model route.
  const go = (id) => document.getElementById(`m-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="mp-subnav">
      <div className="wrap">
        <ul>
          {sections.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={active === s.id ? 'active' : ''} onClick={() => go(s.id)}>
                <span>{String(i + 1).padStart(2, '0')}</span>{s.nav}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function ModelPage({ model }) {
  const c = CONTENT[model.id]
  const idx = MODELS.indexOf(model)
  const prev = MODELS[(idx - 1 + MODELS.length) % MODELS.length]
  const next = MODELS[(idx + 1) % MODELS.length]

  return (
    <article className="mp" style={{ '--accent': model.color }}>
      <header className="mp-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="#models">Models</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{model.full}</span>
          </nav>

          <div className="mp-hero-grid">
            <div>
              <span className="mp-n">Model {model.n} of 05 · {model.paradigm}</span>
              <h1>
                {model.name}
                <span>{model.variant}</span>
              </h1>
              <p className="lede">{c.lede}</p>
              <dl className="mp-meta">
                <div><dt>Led by</dt><dd>{model.owner}</dd></div>
                <div><dt>Starts from</dt><dd>{model.start}</dd></div>
                <div><dt>Parameters</dt><dd>{model.params}</dd></div>
                <div><dt>Evaluated on</dt><dd>{model.scope}</dd></div>
              </dl>
            </div>
            <KeyVals items={c.keyvals} className="hero-kv" />
          </div>

          <div className="mp-switch" aria-label="Other models">
            {MODELS.map((m) => (
              <a key={m.id} href={modelHref(m.id)} className={m.id === model.id ? 'on' : ''} aria-current={m.id === model.id ? 'page' : undefined}>
                <Swatch color={m.color} />{m.name} <span>{m.variant}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <SubNav sections={c.sections} />

      {c.sections.map((s, i) => (
        <section key={s.id} id={`m-${s.id}`} data-sec={s.id} className="block mp-sec">
          <div className="wrap">
            <div className="mp-sec-head">
              <span className="mp-sec-n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{s.title}</h2>
                {s.lead && <p>{s.lead}</p>}
              </div>
            </div>
            {s.body}
          </div>
        </section>
      ))}

      <nav className="mp-pager wrap" aria-label="More models">
        <a href={modelHref(prev.id)} style={{ '--accent': prev.color }}>
          <small>← Previous model</small>
          <b>{prev.full}</b>
        </a>
        <a href="#models" className="all">
          <small>Back to</small>
          <b>All models</b>
        </a>
        <a href={modelHref(next.id)} style={{ '--accent': next.color }} className="nx">
          <small>Next model →</small>
          <b>{next.full}</b>
        </a>
      </nav>
    </article>
  )
}
