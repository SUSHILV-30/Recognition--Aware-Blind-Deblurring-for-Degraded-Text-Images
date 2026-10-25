import { useRef, useState } from 'react'
import { Figure, SectionHead, Swatch, fmtDelta } from './ui.jsx'
import { GroupedBars, Trend } from './charts.jsx'
import { HEX, edges, img, mprnet, nafnet, restormerFt, scratchSteps } from '../data/project.js'

function Setup({ rows }) {
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

function KeyVals({ items }) {
  return (
    <div className="keyvals">
      {items.map(([v, label, tone]) => (
        <div key={label}>
          <b className={tone || ''}>{v}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function Head({ title, owner, children, setup, keyvals }) {
  return (
    <div className="study-head">
      <div>
        <h3>{title}</h3>
        <p className="owner">Led by <b>{owner}</b></p>
        <div className="prose">{children}</div>
        <Setup rows={setup} />
      </div>
      <KeyVals items={keyvals} />
    </div>
  )
}

function RestormerFT() {
  return (
    <>
      <Head
        title="Restormer, fine-tuned"
        owner="Praneeth U"
        setup={[
          ['Start', 'DPDD single-image defocus checkpoint, 26.1 M params'],
          ['Trained', 'Decoder and refinement only; encoder frozen'],
          ['Recipe', 'AdamW, LR 2×10⁻⁵, Charbonnier, 128 px patches, 3,000 iters'],
          ['Data', 'focusStep Levels 1–4, 20 samples per font per level'],
        ]}
        keyvals={[
          ['+3.21 dB', 'PSNR gain at Level 1 (24.88 dB)', 'gain'],
          ['+1.54 dB', 'PSNR gain at Level 2', 'gain'],
          ['−0.36 dB', 'PSNR at Level 4, SSIM still rises', 'loss'],
          ['4 / 4', 'Levels with an SSIM gain'],
        ]}
      >
        <p>
          Restormer computes attention across channels instead of pixels, so memory grows linearly
          with image size and a full 1460 × 2360 page fits in one pass. Freezing the encoder keeps the
          blur prior learned on DPDD while the decoder adapts to focusStep text from very little data.
        </p>
      </Head>

      <div className="two">
        <div className="panel">
          <h4>PSNR by level, dB</h4>
          <GroupedBars
            data={restormerFt}
            xKey="level"
            domain={[10, 26]}
            labels
            series={[
              { key: 'input', name: 'Blurred input', color: HEX.input },
              { key: 'pre', name: 'Pretrained', color: HEX.pre },
              { key: 'ft', name: 'Fine-tuned', color: HEX.ft },
            ]}
          />
          <p className="chart-note">The gain narrows as the PSF widens and reverses slightly only at Level 4.</p>
        </div>
        <div className="panel">
          <h4>Per-level change from the blurred input</h4>
          <div className="table-scroll" style={{ border: 0 }}>
            <table>
              <thead>
                <tr><th>Level</th><th className="num">Input</th><th className="num">Pretrained</th><th className="num">Fine-tuned</th><th className="num">Δ</th><th className="num">Input SSIM</th></tr>
              </thead>
              <tbody>
                {restormerFt.map((r) => {
                  const d = r.ft - r.input
                  return (
                    <tr key={r.level}>
                      <td>{r.level}</td>
                      <td className="num">{r.input.toFixed(2)}</td>
                      <td className="num">{r.pre.toFixed(2)}</td>
                      <td className="num">{r.ft.toFixed(2)}</td>
                      <td className={`num ${d >= 0 ? 'delta-pos' : 'delta-neg'}`}>{fmtDelta(d)}</td>
                      <td className="num">{r.inputSsim.toFixed(4)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fig-row" style={{ marginTop: 24 }}>
        <Figure src={img('restormer_ft_L1.png')} caption="Level 1: blurred input, pretrained, fine-tuned and ground truth." />
        <div className="two">
          <Figure src={img('restormer_ft_L3.png')} caption="Level 3 comparison." />
          <Figure src={img('restormer_ft_L4.png')} caption="Level 4 comparison, the hardest focusStep level." />
        </div>
        <div className="two">
          <Figure src={img('restormer_ft_bars.png')} caption="Aggregate PSNR and SSIM for input, pretrained and fine-tuned models." />
          <Figure className="contain" src={img('restormer_arch.png')} caption="Restormer architecture: four-level encoder–decoder of MDTA and GDFN transformer blocks." />
        </div>
      </div>
    </>
  )
}

function NAFNetStudy() {
  return (
    <>
      <Head
        title="NAFNet, fine-tuned"
        owner="Rachit Anand"
        setup={[
          ['Start', 'Natural-image pretrained checkpoint'],
          ['Trained', 'All parameters'],
          ['Recipe', 'AdamW, LR 10⁻⁴, L1 loss, AMP, 256 px crops, up to 50 epochs'],
          ['Data', 'focusStep Levels 1–4, 495 pairs; tiled overlap-add inference'],
        ]}
        keyvals={[
          ['5.3–5.6 dB', 'Untuned PSNR, below the raw input', 'loss'],
          ['+9.63 dB', 'Largest gain, Level 3', 'gain'],
          ['≈ 2×', 'SSIM after fine-tuning (0.29 → 0.49)'],
          ['+7.68 dB', 'Gain still holds at Level 4', 'gain'],
        ]}
      >
        <p>
          NAFNet removes nonlinear activations, using SimpleGate and Simplified Channel Attention. This
          single-resolution variant has no global residual, so the untuned model has nothing anchoring
          it to the input and collapses. Once fine-tuned, that same direct mapping produces the largest
          gain of any method.
        </p>
      </Head>
      <div className="two">
        <div className="panel">
          <h4>PSNR, pretrained vs fine-tuned (dB)</h4>
          <GroupedBars data={nafnet} xKey="level" labels domain={[0, 18]}
            series={[{ key: 'prePsnr', name: 'Pretrained', color: HEX.pre }, { key: 'ftPsnr', name: 'Fine-tuned', color: HEX.naf }]} />
        </div>
        <div className="panel">
          <h4>SSIM, pretrained vs fine-tuned</h4>
          <GroupedBars data={nafnet} xKey="level" labels digits={3} domain={[0, 0.6]}
            series={[{ key: 'preSsim', name: 'Pretrained', color: HEX.pre }, { key: 'ftSsim', name: 'Fine-tuned', color: HEX.naf }]} />
        </div>
      </div>
      <div className="fig-row" style={{ marginTop: 24 }}>
        <div className="two">
          <Figure src={img('nafnet_L1.png')} caption="Level 1: input, pretrained, fine-tuned, ground truth." />
          <Figure src={img('nafnet_L4.png')} caption="Level 4: the fine-tuned output stays legible." />
        </div>
        <div className="two">
          <Figure src={img('nafnet_pipeline.png')} caption="Fine-tuned variant: stem convolution, NAFBlock body at one resolution, output convolution." />
          <Figure src={img('nafnet_block.png')} caption="Inside a NAFBlock: LayerNorm, depthwise conv, SimpleGate and SCA." />
        </div>
      </div>
    </>
  )
}

function MPRNetStudy() {
  return (
    <>
      <Head
        title="MPRNet, zero-shot"
        owner="Adithya Nambiar P"
        setup={[
          ['Start', 'Public GoPro motion-deblurring weights (epoch 31)'],
          ['Trained', 'Nothing. A deliberate control for the raw domain-shift cost'],
          ['Data', '40 held-out focusStep pairs across Levels 0–4'],
          ['Published', '32.66 dB / 0.959 SSIM on GoPro'],
        ]}
        keyvals={[
          ['17.11 dB', 'Mean PSNR over 40 images'],
          ['0.4085', 'Mean SSIM'],
          ['−15.55 dB', 'Gap from its GoPro result', 'loss'],
          ['Never', 'Falls below the raw blurred input'],
        ]}
      >
        <p>
          Three encoder–decoder stages linked by cross-stage feature fusion, with Supervised Attention
          Modules weighting each stage by its own prediction. Applied unchanged, it degrades smoothly
          from 22.12 dB at Level 0 to 12.93 dB at Level 4 instead of collapsing.
        </p>
      </Head>
      <div className="two">
        <div className="panel">
          <h4>PSNR and SSIM across defocus levels</h4>
          <Trend
            data={mprnet}
            xKey="level"
            rightKey="ssim"
            digits={3}
            series={[
              { key: 'psnr', name: 'PSNR (dB, left)', color: HEX.mpr },
              { key: 'ssim', name: 'SSIM (right)', color: HEX.pre, dashed: true },
            ]}
          />
          <p className="chart-note">Validation counts per level: 6, 10, 5, 9 and 10 images.</p>
        </div>
        <div className="fig-row">
          <Figure src={img('mprnet_L1.png')} caption="Level 1: 20.91 dB, SSIM 0.448 on this sample." />
          <Figure src={img('mprnet_L4.png')} caption="Level 4: 16.58 dB, SSIM 0.377. Softer, but closer to the truth than the input." />
        </div>
      </div>
    </>
  )
}

function ScratchStudy() {
  return (
    <>
      <Head
        title="Restormer from scratch, with an edge probe"
        owner="Sushil V"
        setup={[
          ['Model', 'Base dim 16, blocks [2,2,2,2], heads [1,2,4,8]; 1,176,694 params'],
          ['Start', 'Random initialisation, no pretraining'],
          ['Recipe', 'AdamW, LR 2×10⁻⁴ halved at epochs 50 and 100, Charbonnier, 120 epochs'],
          ['Data', 'All 20 HDC steps, 1,180 pairs, 944 train / 236 test'],
        ]}
        keyvals={[
          ['21.48 dB', 'Training-patch PSNR at epoch 120'],
          ['15.66 dB', 'Best full-image test PSNR (Step 1)'],
          ['≈ 6 dB', 'Gap between patch and full-image scores', 'loss'],
          ['0.9095', 'Sobel recall on restored edges'],
        ]}
      >
        <p>
          A compact Restormer trained only on in-domain data isolates the architecture from
          transfer learning. Its patch scores look strong, but full pages expose global context the
          patches never showed it. Sobel, Canny and Laplacian then probe whether character outlines
          survive restoration.
        </p>
      </Head>
      <div className="two">
        <div className="panel">
          <h4>Full-image test PSNR across all 20 HDC steps</h4>
          <Trend data={scratchSteps} xKey="step" xLabel="HDC defocus step" domain={[6, 18]}
            series={[{ key: 'psnr', name: 'PSNR (dB)', color: HEX.scratch }]} />
        </div>
        <div className="panel">
          <h4>Edge detectors on the restored output, mean of 20 steps</h4>
          <GroupedBars data={edges} xKey="op" digits={3} domain={[0, 1]}
            series={[
              { key: 'precision', name: 'Precision', color: HEX.pre },
              { key: 'recall', name: 'Recall', color: HEX.scratch },
              { key: 'f1', name: 'F1', color: HEX.ft },
            ]} />
          <p className="chart-note">Sobel floods the map with false positives; Canny gives the best balance (F1 0.161, SSIM 0.244).</p>
        </div>
      </div>
      <div className="fig-row" style={{ marginTop: 24 }}>
        <div className="two">
          <Figure src={img('scratch_training.png')} caption="Training curves: Charbonnier loss, PSNR, SSIM and the StepLR schedule." />
          <Figure src={img('scratch_edge_metrics.png')} caption="Edge metrics across blur levels and the averaged Sobel, Canny and Laplacian comparison." />
        </div>
        <Figure src={img('scratch_edge_maps.png')} caption="Restored output and the edge maps each detector extracts from it." />
      </div>
    </>
  )
}

function PhysicsStudy() {
  return (
    <>
      <Head
        title="HDC physics-informed U-Net"
        owner="Sri Jayaram J S"
        setup={[
          ['Phase 1', 'Estimate PSF and radial distortion per level (101² kernel for L0–4, 201² for L5–9)'],
          ['Phase 2', 'Render random text, degrade it through the estimated model: 500 pairs per level (L0–4), 2,000 (L5–9)'],
          ['Phase 3', 'GroupNorm U-Net behind a fixed inverse-distortion layer; synthetic pretrain, then 60% real / 40% synthetic fine-tune'],
          ['Params', '25.17 M (L0–4), 12.49 M (L5–9)'],
        ]}
        keyvals={[
          ['17.43 dB', 'Level 5 PSNR after fine-tuning, SSIM 0.589', 'gain'],
          ['0.0209', 'Best validation loss, Level 1'],
          ['0.356 → 0.010', 'PSF peak, Level 0 to Level 4'],
          ['−0.014 → +0.021', 'K1 flips from barrel to pincushion'],
        ]}
      >
        <p>
          A replication of the HDC 2021 winning approach. Instead of asking a generic network to invert an
          unknown blur, it estimates the camera’s own blur and distortion, then trains a purely
          convolutional U-Net on data generated from that estimate. Each model is valid only for the
          level it was calibrated on.
        </p>
      </Head>
      <div className="two">
        <div className="panel">
          <h4>Results so far</h4>
          <div className="table-scroll" style={{ border: 0 }}>
            <table>
              <thead><tr><th>Level</th><th>Result</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>L0–4</td><td>Validation loss 0.0209 (L1) to 0.0606 (L4)</td><td><span className="pill ok">Complete</span></td></tr>
                <tr><td>L5</td><td>17.43 dB / 0.589 SSIM, up from 15.95 dB</td><td><span className="pill ok">Complete</span></td></tr>
                <tr><td>L6</td><td>14.20 dB / 0.579 SSIM</td><td><span className="pill part">Pretrain only</span></td></tr>
                <tr><td>L7–9</td><td>Pipeline built, training runs pending</td><td><span className="pill">Pending</span></td></tr>
              </tbody>
            </table>
          </div>
          <p className="chart-note">
            The estimated physics behaves as optics predicts: the kernel spreads and the distortion sign
            flips as defocus grows, which is what justifies trusting the synthetic data.
          </p>
        </div>
        <Figure src={img('physics_training.png')} caption="Level 2 training: loss settles at 0.033–0.035, with a small bump at epoch 60 when real data is introduced." />
      </div>
    </>
  )
}

const STUDIES = [
  { id: 'restormer', label: 'Restormer, fine-tuned', color: HEX.ft, View: RestormerFT },
  { id: 'nafnet', label: 'NAFNet', color: HEX.naf, View: NAFNetStudy },
  { id: 'mprnet', label: 'MPRNet', color: HEX.mpr, View: MPRNetStudy },
  { id: 'scratch', label: 'Restormer from scratch', color: HEX.scratch, View: ScratchStudy },
  { id: 'physics', label: 'Physics-informed U-Net', color: HEX.hdc, View: PhysicsStudy },
]

export default function Studies() {
  const [active, setActive] = useState(0)
  const tabs = useRef([])

  const onKey = (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    const next = (active + dir + STUDIES.length) % STUDIES.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  const { View } = STUDIES[active]
  return (
    <section className="block" id="studies">
      <div className="wrap">
        <SectionHead title="Five sub-studies">
          Each team member took one restoration approach through the same data and the same pairing
          protocol. Together they answer two questions: how much does the wrong training data cost, and
          what does the right data buy?
        </SectionHead>

        <div className="tabs" role="tablist" aria-label="Sub-studies" onKeyDown={onKey}>
          {STUDIES.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => (tabs.current[i] = el)}
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${s.id}`}
              tabIndex={i === active ? 0 : -1}
              className="tab"
              onClick={() => setActive(i)}
            >
              <Swatch color={s.color} />
              {s.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${STUDIES[active].id}`} aria-labelledby={`tab-${STUDIES[active].id}`}>
          <View />
        </div>
      </div>
    </section>
  )
}
