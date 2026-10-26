import { useState } from 'react'
import { Figure } from '../ui.jsx'
import { GroupedBars } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { Setup, Takeaways } from '../modelkit.jsx'
import { HEX, diffusionSamples, img } from '../../data/project.js'

const LEVEL_ROWS = [
  ['L0–4', 'Validation loss 0.0209 (L1) to 0.0606 (L4)', 'ok', 'Complete'],
  ['L5', '17.43 dB / 0.589 SSIM, up from 15.95 dB', 'ok', 'Complete'],
  ['L6', '14.20 dB / 0.579 SSIM', 'part', 'Pretrain only'],
  ['L7–8', 'No results reported yet', '', 'Pending'],
  ['L9–11, L13', 'Per-level U-Net + diffusion refiner: 50.00–90.62% OCR character accuracy on 2 samples per level', 'part', 'Samples only'],
]

/* ---------------- Levels 9–13: U-Net + conditional residual diffusion ---------------- */

const DIFF_LEVELS = [9, 10, 11, 13]
const FONT_LABEL = { times: 'Times', verdana: 'Verdana' }
const pct = (v) => `${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

const byLevel = DIFF_LEVELS.map((level) => {
  const t = diffusionSamples.find((s) => s.level === level && s.font === 'times')
  const v = diffusionSamples.find((s) => s.level === level && s.font === 'verdana')
  return { level: `L${level}`, times: t.acc, verdana: v.acc, timesRef: 100 - t.refCer, verdanaRef: 100 - v.refCer }
})

function DiffusionSamples() {
  const [level, setLevel] = useState(9)
  const [font, setFont] = useState('verdana')
  const s = diffusionSamples.find((x) => x.level === level && x.font === font)
  const base = `diffusion/L${level}_${font}`
  return (
    <>
      <div className="two" style={{ alignItems: 'start' }}>
        <div className="panel">
          <h4>OCR character accuracy on the restored page, %</h4>
          <GroupedBars
            data={byLevel}
            xKey="level"
            labels
            domain={[0, 100]}
            series={[
              { key: 'times', name: 'Times 0014', color: HEX.hdc },
              { key: 'verdana', name: 'Verdana 0013', color: HEX.ft },
            ]}
          />
          <p className="chart-note">
            Accuracy = 100 × (1 − CER), Tesseract on the deblurred output against the dataset’s own .txt.
            The blurred inputs score far below zero (CER 1,897–3,469%) because OCR invents text from blur.
          </p>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Level</th><th>Sample</th><th className="num">Accuracy</th><th className="num">CER</th>
                <th className="num">WER</th><th className="num">PSNR (dB)</th><th className="num">Sharp OCR CER</th>
              </tr>
            </thead>
            <tbody>
              {diffusionSamples.map((x) => (
                <tr key={x.level + x.font}>
                  <td>L{x.level}</td>
                  <td>{x.id}</td>
                  <td className="num"><b>{x.acc.toFixed(2)}%</b></td>
                  <td className="num">{x.cer.toFixed(2)}%</td>
                  <td className="num">{x.wer.toFixed(2)}%</td>
                  <td className="num">{x.psnr.toFixed(2)}</td>
                  <td className={`num ${x.cer < x.refCer ? 'delta-pos' : ''}`}>{x.refCer.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="chart-note" style={{ padding: '0 14px 12px' }}>
            Sharp OCR CER is Tesseract on the focused capture, a control. Highlighted cells are where the
            restored page reads better than the sharp one.
          </p>
        </div>
      </div>

      <h3 style={{ margin: '40px 0 14px' }}>Browse the samples</h3>
      <div className="cmp-toolbar">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="seg" role="tablist" aria-label="Level">
            {DIFF_LEVELS.map((l) => (
              <button key={l} role="tab" aria-selected={l === level} onClick={() => setLevel(l)}>Level {l}</button>
            ))}
          </div>
          <div className="seg" role="tablist" aria-label="Font">
            {['times', 'verdana'].map((f) => (
              <button key={f} role="tab" aria-selected={f === font} onClick={() => setFont(f)}>{FONT_LABEL[f]}</button>
            ))}
          </div>
        </div>
        <span className="small muted" style={{ overflowWrap: 'anywhere' }}>focusStep_{level}_{font === 'times' ? 'timesR' : 'verdanaRef'}_size_30_sample_{s.id.split('_')[1]}.tif</span>
      </div>

      <div className="sample-stats">
        <div><b className="gain">{s.acc.toFixed(2)}%</b><span>OCR accuracy</span></div>
        <div><b>{s.cer.toFixed(2)}%</b><span>CER</span></div>
        <div><b>{s.wer.toFixed(2)}%</b><span>WER</span></div>
        <div><b>{s.psnr.toFixed(2)} dB</b><span>PSNR</span></div>
        <div><b>{s.chars - s.s - s.d}/{s.chars}</b><span>Characters matched</span></div>
        <div><b>{s.s} · {s.d} · {s.i}</b><span>Subs · dels · ins</span></div>
      </div>

      <Figure key={base} src={img(`${base}.jpg`)} caption={`Level ${level}, ${s.id}: focused ground truth, actual blurred input and fresh deblurred output. Sharp OCR CER ${pct(s.refCer)}, blurred-input OCR CER ${pct(s.inputCer)}.`} />

      <div className="two" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="ocr-text">
          <div><small>Ground truth (.txt)</small><pre>{s.gt}</pre></div>
          <div><small>OCR of the restored page</small><pre>{s.ocr}</pre></div>
        </div>
        <Figure key={`${base}-a`} src={img(`${base}_align.jpg`)} caption="Minimum-edit character alignment. Green match, red substitution, orange deletion, blue insertion." />
      </div>
    </>
  )
}

function DiffusionProtocol() {
  return (
    <div className="two" style={{ alignItems: 'start' }}>
      <div className="panel">
        <h4>Pipeline</h4>
        <ol className="recipe">
          <li><span><b>Per-level U-Net</b>Each blurred TIFF goes through its own level’s frozen U-Net.</span></li>
          <li><span><b>Conditional residual diffusion</b>The selected diffusion model for that level refines the U-Net output, using the saved sampler and font-specific strengths.</span></li>
          <li><span><b>Score</b>Tesseract reads the 8-bit output; ground truth is used only after inference.</span></li>
        </ol>
        <p className="chart-note">No retraining. Fresh outputs on CPU in float32, so small differences from historical GPU runs are possible.</p>
      </div>
      <div className="panel">
        <h4>Scoring</h4>
        <Setup
          rows={[
            ['Samples', 'One Times and one Verdana per level, drawn from indices 1–20 with seed 20261025 before inference'],
            ['Levels', '9, 10, 11 and 13; Level 12 excluded'],
            ['OCR', 'Tesseract 5.5.3, tessdata_fast English, PSM 6, dictionaries off'],
            ['Reference', 'The dataset’s character .txt, not OCR of the focused image'],
            ['CER / WER', 'Character or word edit distance over the reference length; can exceed 100%'],
            ['Accuracy', '100 × (1 − CER), not clamped'],
            ['PSNR', 'Saved 8-bit PNG against the focused image'],
          ]}
        />
        <p className="chart-note">
          The same sample IDs hold different text at different levels. Two samples per level are illustrative,
          not an estimate of full-dataset performance. Hashes and OCR alignments were verified for all outputs.
        </p>
      </div>
    </div>
  )
}

function Calibration() {
  return (
    <div className="calib">
      <div className="panel">
        <span className="eyebrow">PSF peak</span>
        <div className="calib-row">
          <div><b>0.356</b><span>Level 0</span></div>
          <div className="calib-arrow" aria-hidden="true" />
          <div><b>0.010</b><span>Level 4</span></div>
        </div>
        <div className="psf-strip" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} style={{ '--spread': `${6 + i * 9}px`, '--peak': 1 - i * 0.18 }} />
          ))}
        </div>
        <p className="small muted">The kernel’s centre weight drops by 35× as defocus spreads the same light over a wider disc.</p>
      </div>
      <div className="panel">
        <span className="eyebrow">Radial distortion K1</span>
        <div className="calib-row">
          <div><b>−0.014</b><span>Level 0 · barrel</span></div>
          <div className="calib-arrow" aria-hidden="true" />
          <div><b>+0.021</b><span>Level 4 · pincushion</span></div>
        </div>
        <div className="warp" aria-hidden="true"><i className="barrel" /><i className="pin" /></div>
        <p className="small muted">The distortion sign flips as the lens moves through focus, exactly as optics predicts.</p>
      </div>
    </div>
  )
}

export default {
  lede:
    'A replication of the HDC 2021 winning approach. Instead of asking a generic network to invert an unknown blur, it estimates the camera’s own blur and distortion, then trains a purely convolutional U-Net on data generated from that estimate. Each model is valid only for the level it was calibrated on. At the heaviest levels tested so far, 9 to 13, a conditional residual diffusion model refines each level’s U-Net output.',
  keyvals: [
    ['17.43 dB', 'Level 5 PSNR after fine-tuning, SSIM 0.589', 'gain'],
    ['+1.48 dB', 'Level 5 gain from fine-tuning (15.95 → 17.43)', 'gain'],
    ['90.62%', 'OCR accuracy, Verdana sample at Levels 11 and 13', 'gain'],
    ['0.356 → 0.010', 'PSF peak, Level 0 to Level 4'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'Model the camera first, then learn only what the model cannot express.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              The HDC 2021 winner did not use the biggest network. It modelled the camera’s blur and lens
              distortion, trained a plain U-Net on matched synthetic data, and passed 70% character accuracy at
              the hardest level.
            </p>
            <p>
              This study rebuilds that approach end to end. Because the training data is generated through the
              estimated optics, it matches the test degradation by construction, which is exactly what the
              pretrained models lack. The cost is that every model belongs to one blur level.
            </p>
          </div>
          <div className="panel">
            <h4>Physical degradation model</h4>
            <div className="eq">
              <i>y</i> = ( <i>D</i><sub>K1,K2</sub>( <i>x</i> − <i>y</i><sub>0</sub> ) ∗ <i>k</i><sub>B</sub> + <i>y</i><sub>0</sub> ) ⊙ <i>η</i>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              <i>x</i> is the sharp page, <i>k</i><sub>B</sub> the PSF (a learnable, softmax-normalised kernel),
              <i> y</i><sub>0</sub> the background level and <i>η</i> sensor noise. Radial distortion is
              <i> D</i>(<i>p</i>) = <i>p</i>(1 + K1<i>r</i>² + K2<i>r</i>⁴).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'Three phases: calibrate, synthesise, train.',
      body: <ModelDiagram id="physics" />,
    },
    {
      id: 'calibration',
      nav: 'Calibration',
      title: 'What the calibration found',
      lead: 'The estimated physics behaves the way optics says it should, which is what justifies trusting the synthetic data.',
      body: <Calibration />,
    },
    {
      id: 'training',
      nav: 'Training',
      title: 'Training recipe',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="panel">
            <Setup
              rows={[
                ['Phase 1', 'Estimate PSF and radial distortion per level (101² kernel for L0–4, 201² for L5–9)'],
                ['Phase 2', 'Render random text, degrade it through the estimated model: 500 pairs per level (L0–4), 2,000 (L5–9)'],
                ['Phase 3', 'GroupNorm U-Net behind a fixed inverse-distortion layer'],
                ['Schedule', 'Synthetic pretrain, then fine-tune on 60% real / 40% synthetic'],
                ['Params', '25.17 M (L0–4), 12.49 M (L5–9)'],
              ]}
            />
          </div>
          <Figure src={img('physics_training.png')} caption="Level 2 training: loss settles at 0.033–0.035, with a small bump at epoch 60 when real data is introduced." />
        </div>
      ),
    },
    {
      id: 'results',
      nav: 'Results',
      title: 'Results by level',
      body: (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Level</th><th>Result</th><th>Status</th></tr></thead>
            <tbody>
              {LEVEL_ROWS.map(([l, r, tone, st]) => (
                <tr key={l} className={l === 'L5' ? 'hl' : ''}>
                  <td>{l}</td>
                  <td style={{ whiteSpace: 'normal' }}>{r}</td>
                  <td><span className={`pill ${tone}`}>{st}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'diffusion',
      nav: 'Levels 9–13',
      title: 'Levels 9–13: U-Net with a diffusion refiner',
      lead: 'Fresh runs of the existing per-level models on two samples per level. Without restoration, OCR produces mostly noise; after it, most characters are read correctly.',
      body: (
        <>
          <DiffusionSamples />
          <h3 style={{ margin: '40px 0 14px' }}>Selection, inference and scoring</h3>
          <DiffusionProtocol />
        </>
      ),
    },
    {
      id: 'takeaways',
      nav: 'Takeaways',
      title: 'Takeaways',
      body: (
        <Takeaways
          shows={[
            'Matching the data beats a bigger network: 17.43 dB at Level 5 versus 15.66 dB for the from-scratch Restormer on its easiest step.',
            'In the same-sample grid it holds up best of all models as the blur grows.',
            'The calibrated PSF and distortion follow optics, so the synthetic data can be trusted.',
            'With a diffusion refiner, pages at Levels 9–13 that OCR cannot read at all come back at 50–91% character accuracy on the samples tested.',
          ]}
          limits={[
            'One model per blur level; nothing transfers between levels.',
            'The synthetic PSF ignores astigmatism and coma.',
            'Level 6 is pretrain-only and no Level 7–8 results are reported.',
            'Levels 9–13 have two illustrative samples per level, scored with Tesseract rather than EasyOCR.',
          ]}
          next={[
            'Score the U-Net + diffusion pipeline on the full test sets of Levels 9–13.',
            'Fill in Levels 6–8 and score Levels 0–6 with OCR.',
            'Try a single level-conditioned U-Net across levels.',
          ]}
        />
      ),
    },
  ],
}
