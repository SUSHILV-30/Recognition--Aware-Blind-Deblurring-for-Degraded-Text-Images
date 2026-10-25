import { useRef, useState } from 'react'
import { Figure, SectionHead, Swatch } from './ui.jsx'
import { ModelDiagram, SystemDiagram } from './diagrams.jsx'
import { MODELS, modelHref } from '../data/models.js'
import { img } from '../data/project.js'

const HOW = {
  restormer: [
    'Multi-Dconv head transposed attention (MDTA) attends across channels, so a full page fits in one pass.',
    'Gated-Dconv feed-forward (GDFN) controls which features move up the hierarchy.',
    'A global residual keeps a miscalibrated model close to its input instead of collapsing.',
  ],
  nafnet: [
    'No nonlinear activations: SimpleGate multiplies two halves of the channels instead.',
    'Simplified Channel Attention reweights channels with one pooled 1 × 1 conv.',
    'This single-resolution variant has no global residual, which is why the untuned model collapses.',
  ],
  mprnet: [
    'Three stages restore the image progressively, from patches to full resolution.',
    'Supervised Attention Modules gate each stage by the quality of its own prediction.',
    'Cross-Stage Feature Fusion passes features forward, so later stages refine instead of restart.',
  ],
  scratch: [
    'The same MDTA + GDFN building blocks as Restormer with about a twentieth of the parameters.',
    'Four levels, two transformer blocks each, heads doubling with depth.',
    'No pretraining at all, so the result isolates the architecture from transfer learning.',
  ],
  physics: [
    'Models the actual camera: one PSF and one radial distortion per blur level.',
    'Training data is synthesised through that model, so it matches the test blur by construction.',
    'A fixed inverse-distortion layer undoes the lens warp before a plain GroupNorm U-Net.',
  ],
}

export default function Architecture() {
  const [active, setActive] = useState(0)
  const tabs = useRef([])
  const m = MODELS[active]

  const onKey = (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    const next = (active + dir + MODELS.length) % MODELS.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <section className="block" id="architecture">
      <div className="wrap">
        <SectionHead title="Architecture">
          One fixed pipeline with a single swappable restoration block. Everything around the block stays
          the same between studies, so any difference in the results comes from the model alone.
        </SectionHead>

        <SystemDiagram />

        <div className="arch-models">
          <div className="arch-head">
            <h3>Inside the restoration block</h3>
            <p className="muted small">Pick a model to see how it is built.</p>
          </div>

          <div className="tabs" role="tablist" aria-label="Model architectures" onKeyDown={onKey}>
            {MODELS.map((x, i) => (
              <button
                key={x.id}
                ref={(el) => (tabs.current[i] = el)}
                role="tab"
                id={`arch-tab-${x.id}`}
                aria-selected={i === active}
                aria-controls="arch-panel"
                tabIndex={i === active ? 0 : -1}
                className="tab"
                onClick={() => setActive(i)}
              >
                <Swatch color={x.color} />
                {x.name} <span className="tab-variant">{x.variant}</span>
              </button>
            ))}
          </div>

          <div className="arch-panel" id="arch-panel" role="tabpanel" aria-labelledby={`arch-tab-${m.id}`} style={{ '--accent': m.color }}>
            <div className="arch-diagram">
              <ModelDiagram id={m.id} />
            </div>
            <aside className="arch-side">
              <span className="eyebrow">{m.paradigm}</span>
              <h4>{m.full}</h4>
              <dl className="arch-facts">
                <div><dt>Starts from</dt><dd>{m.start}</dd></div>
                <div><dt>Parameters</dt><dd>{m.params}</dd></div>
                <div><dt>Evaluated on</dt><dd>{m.scope}</dd></div>
              </dl>
              <ul className="facts small">
                {HOW[m.id].map((t) => <li key={t}>{t}</li>)}
              </ul>
              <a className="btn" href={modelHref(m.id)}>Full results for {m.name} →</a>
            </aside>
          </div>
        </div>

        <div className="two arch-next">
          <div>
            <span className="eyebrow">Next iteration</span>
            <h3 style={{ margin: '6px 0 12px' }}>A diffusion restorer in the same slot</h3>
            <p className="muted">
              The proposed conditional diffusion model replaces the restoration block and keeps the same
              detection and recognition tail, so it can be benchmarked directly against all five models.
            </p>
          </div>
          <Figure
            src={img('diffusion_architecture.png')}
            caption="Proposed conditional diffusion restorer followed by the OCR tail."
          />
        </div>
      </div>
    </section>
  )
}
