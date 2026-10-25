// Architecture diagrams, drawn in HTML and CSS rather than as images so they
// follow the theme, stay sharp at any size and reflow on narrow screens.

import { MODELS, modelHref } from '../data/models.js'

/* ---------------- System: the shared pipeline ---------------- */

const Arrow = ({ label }) => (
  <div className="sys-arrow" aria-hidden="true">
    {label && <span>{label}</span>}
  </div>
)

export function SystemDiagram() {
  return (
    <div className="sys" role="figure" aria-label="System architecture: a defocused page is preprocessed, restored by one of five interchangeable models, then evaluated by pixel metrics, an edge probe and OCR.">
      <div className="sys-flow">
        <div className="sys-node">
          <small>Input</small>
          <b>Defocused page</b>
          <span>16-bit grayscale, 1460 × 2360</span>
          <div className="sys-page blur" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <Arrow />
        <div className="sys-node">
          <small>Stage 1</small>
          <b>Preprocessing</b>
          <ul>
            <li>Normalise to [0, 1]</li>
            <li>CLAHE</li>
            <li>Unsharp mask</li>
          </ul>
        </div>
        <Arrow />
        <div className="sys-node slot">
          <small>Stage 2 · swappable</small>
          <b>Blind deblurring</b>
          <div className="sys-models">
            {MODELS.map((m) => (
              <a key={m.id} href={modelHref(m.id)} style={{ '--c': m.color }}>
                <i />
                <span>{m.name}<em>{m.variant}</em></span>
              </a>
            ))}
          </div>
        </div>
        <Arrow />
        <div className="sys-node">
          <small>Output</small>
          <b>Restored page</b>
          <span>Full-image tiled overlap-add inference</span>
          <div className="sys-page" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <Arrow />
        <div className="sys-evals">
          <div className="sys-node eval">
            <small>Measure · pixels</small>
            <b>PSNR and SSIM</b>
            <span>against the focused CAM01 capture</span>
          </div>
          <div className="sys-node eval">
            <small>Measure · structure</small>
            <b>Edge probe</b>
            <span>Sobel, Canny, Laplacian</span>
          </div>
          <div className="sys-node eval ocr">
            <small>Measure · readability</small>
            <b>Detect → recognise → correct</b>
            <span>FPN / EasyOCR, CRNN or TrOCR, spell-check</span>
          </div>
        </div>
      </div>
      <div className="sys-rabd">
        <span>
          <b>RABD (proposed):</b> the recognizer’s CTC loss flows back into the deblurring weights
        </span>
      </div>
    </div>
  )
}

/* ---------------- Restormer-style encoder–decoder ---------------- */

// levels: three encoder levels plus the latent, each { dim, blocks, heads }.
export function UNetDiagram({ levels, refinement, frozenEncoder = false, inputLabel = 'Blurred page', note }) {
  const [l1, l2, l3, latent] = levels
  const enc = [l1, l2, l3]
  // Restormer's level-1 decoder keeps the concatenated width (2 × dim).
  const decDim = (i, l) => (i === 0 ? l.dim * 2 : l.dim)
  return (
    <div className="unet" role="figure" aria-label="Four-level transformer encoder–decoder with skip connections">
      <div className="unet-top">
        <div className="u-chip io">{inputLabel}</div>
        <div className="u-chip conv">3 × 3 conv embed → {l1.dim} ch</div>
        <div className="u-spacer" />
        {refinement ? <div className="u-chip conv">Refinement · {refinement}× TBlock</div> : <div className="u-chip conv">3 × 3 conv → output</div>}
        <div className="u-chip io out">Restored page</div>
      </div>

      <div className="unet-body">
        {enc.map((l, i) => (
          <div className="u-row" key={i} style={{ '--inset': `${i * 9}%` }}>
            <div className={`u-block enc ${frozenEncoder ? 'frozen' : ''}`}>
              <b>Encoder L{i + 1}</b>
              <span>{l.blocks}× TBlock · {l.dim} ch · {l.heads} head{l.heads > 1 ? 's' : ''}</span>
              {frozenEncoder && <em>frozen</em>}
            </div>
            <div className="u-skip"><span>skip</span></div>
            <div className="u-block dec">
              <b>Decoder L{i + 1}</b>
              <span>{l.blocks}× TBlock · {decDim(i, l)} ch</span>
              {frozenEncoder && <em>trained</em>}
            </div>
          </div>
        ))}
        <div className="u-row latent" style={{ '--inset': '27%' }}>
          <div className={`u-block latent ${frozenEncoder ? 'frozen' : ''}`}>
            <b>Latent</b>
            <span>{latent.blocks}× TBlock · {latent.dim} ch · {latent.heads} heads</span>
          </div>
        </div>
        <div className="u-legs" aria-hidden="true"><i>↓ PixelUnshuffle</i><i>↑ PixelShuffle</i></div>
      </div>

      <div className="unet-foot">
        <div className="u-tblock">
          <b>TBlock</b>
          <span><i>MDTA</i> attention across channels, so cost grows linearly with image size</span>
          <span><i>GDFN</i> gated depthwise-conv feed-forward</span>
        </div>
        <div className="u-residual">Global residual: <b>Î = I + R(I)</b></div>
      </div>
      {note && <p className="diagram-note">{note}</p>}
    </div>
  )
}

/* ---------------- NAFNet ---------------- */

const Chip = ({ children, tone = '' }) => <span className={`d-chip ${tone}`}>{children}</span>
const Thin = () => <span className="d-thin" aria-hidden="true">→</span>

export function NAFNetDiagram() {
  return (
    <div className="naf" role="figure" aria-label="NAFNet: stem convolution, NAFBlocks at one resolution, output convolution, with no global residual">
      <div className="naf-main">
        <Chip tone="io">Blurred page</Chip><Thin />
        <Chip tone="conv">3 × 3 stem conv</Chip><Thin />
        <div className="naf-stack">
          <span>NAFBlock</span><span>NAFBlock</span><span>NAFBlock</span>
          <b>× N at one resolution</b>
        </div>
        <Thin />
        <Chip tone="conv">3 × 3 conv</Chip><Thin />
        <Chip tone="io">Restored page</Chip>
      </div>
      <div className="naf-nores">
        <span>No global residual from input to output</span>
      </div>

      <div className="naf-block">
        <h5>Inside one NAFBlock</h5>
        <div className="naf-lane">
          <em>Spatial</em>
          <Chip>LayerNorm</Chip><Thin /><Chip>1 × 1 conv</Chip><Thin /><Chip>3 × 3 depthwise</Chip><Thin />
          <Chip tone="key">SimpleGate</Chip><Thin /><Chip tone="key">SCA</Chip><Thin /><Chip>1 × 1 conv</Chip><Thin /><Chip tone="add">⊕ skip</Chip>
        </div>
        <div className="naf-lane">
          <em>Channel</em>
          <Chip>LayerNorm</Chip><Thin /><Chip>1 × 1 conv</Chip><Thin /><Chip tone="key">SimpleGate</Chip><Thin /><Chip>1 × 1 conv</Chip><Thin /><Chip tone="add">⊕ skip</Chip>
        </div>
        <div className="naf-defs">
          <span><b>SimpleGate</b> X → X<sub>1</sub> ⊙ X<sub>2</sub>, splitting channels in half. Replaces GELU.</span>
          <span><b>SCA</b> simplified channel attention: global pool, one 1 × 1 conv, multiply.</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- MPRNet ---------------- */

export function MPRNetDiagram() {
  const stages = [
    { n: 1, patches: 4, title: 'Encoder–decoder', sub: 'on 4 image patches', sam: true },
    { n: 2, patches: 2, title: 'Encoder–decoder', sub: 'on 2 image patches', sam: true },
    { n: 3, patches: 1, title: 'ORSNet', sub: 'full resolution, no downsampling', sam: false },
  ]
  return (
    <div className="mpr" role="figure" aria-label="MPRNet: three progressive stages linked by cross-stage feature fusion and supervised attention">
      <div className="mpr-stages">
        {stages.map((s, i) => (
          <div className="mpr-col" key={s.n}>
            <div className="mpr-stage">
              <small>Stage {s.n}</small>
              <div className={`mpr-patches p${s.patches}`} aria-hidden="true">
                {Array.from({ length: s.patches }, (_, k) => <i key={k} />)}
              </div>
              <b>{s.title}</b>
              <span>{s.sub}</span>
              {s.sam ? <div className="mpr-sam">SAM · F<sub>n+1</sub> = F<sub>n</sub> ⊙ σ(conv(ŷ<sub>n</sub>))</div> : <div className="mpr-sam out">→ restored page</div>}
            </div>
            {i < stages.length - 1 && <div className="mpr-link" aria-hidden="true"><span>CSFF</span></div>}
          </div>
        ))}
      </div>
      <p className="diagram-note">
        Each stage sees the image at a finer granularity. Supervised Attention Modules weight the features
        passed forward by how good that stage’s own prediction already is, and Cross-Stage Feature Fusion
        carries encoder–decoder features into the next stage. Weights: public GoPro release, epoch 31, unchanged.
      </p>
    </div>
  )
}

/* ---------------- HDC physics-informed pipeline ---------------- */

export function PhysicsDiagram() {
  return (
    <div className="phys" role="figure" aria-label="Physics-informed pipeline: calibrate the camera, synthesise training pairs, train a U-Net per level">
      <div className="phys-phase">
        <small>Phase 1</small>
        <b>Calibrate the camera</b>
        <div className="phys-psf" aria-hidden="true"><i /></div>
        <span>Estimate a PSF per level (101² kernel for L0–4, 201² for L5–9) and radial distortion K1, K2.</span>
      </div>
      <div className="phys-arrow" aria-hidden="true" />
      <div className="phys-phase">
        <small>Phase 2</small>
        <b>Synthesise pairs</b>
        <div className="phys-eq">y = (D<sub>K</sub>(x − y<sub>0</sub>) ∗ k<sub>B</sub> + y<sub>0</sub>) ⊙ η</div>
        <span>Render random text, push it through the estimated optics: 500 pairs per level for L0–4, 2,000 for L5–9.</span>
      </div>
      <div className="phys-arrow" aria-hidden="true" />
      <div className="phys-phase">
        <small>Phase 3</small>
        <b>Train a U-Net per level</b>
        <div className="phys-net" aria-hidden="true">
          <span>Inverse distortion <em>fixed</em></span>
          <span>GroupNorm U-Net</span>
        </div>
        <span>Pretrain on synthetic pairs, then fine-tune on 60% real and 40% synthetic.</span>
      </div>
    </div>
  )
}

/* ---------------- Per-model lookup ---------------- */

export const RESTORMER_LEVELS = [
  { dim: 48, blocks: 4, heads: 1 },
  { dim: 96, blocks: 6, heads: 2 },
  { dim: 192, blocks: 6, heads: 4 },
  { dim: 384, blocks: 8, heads: 8 },
]

export const SCRATCH_LEVELS = [
  { dim: 16, blocks: 2, heads: 1 },
  { dim: 32, blocks: 2, heads: 2 },
  { dim: 64, blocks: 2, heads: 4 },
  { dim: 128, blocks: 2, heads: 8 },
]

export function ModelDiagram({ id }) {
  switch (id) {
    case 'restormer':
      return (
        <UNetDiagram
          levels={RESTORMER_LEVELS}
          refinement={4}
          frozenEncoder
          note="Standard Restormer configuration behind the DPDD checkpoint. Fine-tuning freezes the encoder path and trains the decoder and refinement stages."
        />
      )
    case 'scratch':
      return (
        <UNetDiagram
          levels={SCRATCH_LEVELS}
          note="Base width 16, blocks [2, 2, 2, 2], heads [1, 2, 4, 8]: 1,176,694 parameters, about 4.5% of the full model, all trained from random initialisation."
        />
      )
    case 'nafnet':
      return <NAFNetDiagram />
    case 'mprnet':
      return <MPRNetDiagram />
    case 'physics':
      return <PhysicsDiagram />
    default:
      return null
  }
}
