import { SectionHead } from './ui.jsx'
import { status } from '../data/project.js'

const FINDINGS = [
  ['Matching the data beats a bigger network',
    'A purely convolutional U-Net trained on data synthesised from the estimated camera physics reaches 17.43 dB at Level 5. The 1.18 M-parameter Restormer trained on generic in-domain data tops out at 15.66 dB on its easiest step.'],
  ['The domain-shift penalty depends on architecture',
    'MPRNet and NAFNet both start from motion-blur pretraining. MPRNet degrades gracefully and never drops below the input; the NAFNet variant collapses to 5.3–5.6 dB. Supervised attention and global residuals anchor a model to its input, and that anchor decides how badly it fails.'],
  ['Small, targeted fine-tuning goes a long way',
    'Freezing Restormer’s encoder and training only the decoder adds up to +3.21 dB at Level 1 and, in Phase 2, takes Level 5 OCR from 0% to 96.9% character accuracy with 150 training pages.'],
  ['Patch metrics overstate real performance',
    'The from-scratch Restormer scores 21.48 dB on training patches and at most 15.66 dB on full pages. Comparisons should always use full-image, per-level results.'],
  ['Pixel scores are not readability',
    'At Level 5 the pretrained Restormer raises SSIM from 0.372 to 0.419 while OCR still reads 0% of characters. That gap is the case for the recognition-aware RABD loss.'],
]

const ROADMAP = [
  ['Wire the CTC loss through the recognizer into the deblurring weights', 'First end-to-end Restormer + TrOCR run with CER/WER'],
  ['Run the Restormer notebooks for HDC Levels 7–10', 'Per-level and all-levels results beyond Level 6'],
  ['Score Restormer fine-tuned Levels 1–4 and the other models with OCR', 'Fills the empty columns of the OCR table'],
  ['Train the physics-informed pipeline on Levels 6–9', 'Completes the Level 0–9 curve; the code already exists'],
  ['Fine-tune MPRNet and extend it to Steps 5–19', 'Turns the zero-shot control into a fine-tuned data point'],
  ['Rebuild NAFNet with a global residual', 'A direct test of the anchoring hypothesis'],
  ['Benchmark Uformer on the common protocol', 'A four-model per-level comparison'],
  ['Implement the conditional diffusion restorer', 'Benchmarked against all five modules'],
]

export default function Findings() {
  return (
    <>
      <section className="block" id="findings">
        <div className="wrap">
          <SectionHead title="What the results say">
            Five independent experiments on the same benchmark point the same way.
          </SectionHead>
          {FINDINGS.map(([t, d]) => (
            <div className="finding" key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block" id="progress">
        <div className="wrap">
          <SectionHead title="Where the project stands">
            Module status from the latest panel review. The restoration studies are complete; the
            recognition-coupled half is the remaining work.
          </SectionHead>
          <div className="two" style={{ alignItems: 'start' }}>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Module</th><th>Status</th><th className="num">Complete</th></tr></thead>
                <tbody>
                  {status.map((s) => (
                    <tr key={s.module}>
                      <td style={{ whiteSpace: 'normal' }}>{s.module}</td>
                      <td>
                        <span className={`pill ${s.state === 'Functional' ? 'ok' : s.state === 'Partial' ? 'part' : ''}`}>{s.state}</span>
                      </td>
                      <td className="num">
                        <span className="status-bar" aria-hidden="true"><i style={{ width: `${s.pct}%` }} /></span>{' '}
                        {s.pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ marginBottom: 16 }}>Next, in priority order</h3>
              <ol className="recipe">
                {ROADMAP.map(([t, d]) => (
                  <li key={t}><span><b>{t}</b><span className="muted small">{d}</span></span></li>
                ))}
              </ol>
              <div className="panel" style={{ marginTop: 24 }}>
                <h4>Limitations, stated openly</h4>
                <ul className="facts small" style={{ marginTop: 10 }}>
                  <li>MPRNet is zero-shot only, on 40 images from Levels 0–4.</li>
                  <li>Uformer was trained for 150 epochs but not evaluated on the common protocol.</li>
                  <li>RABD is designed, not yet measured: no end-to-end CER/WER numbers.</li>
                  <li>The synthetic PSF ignores astigmatism and coma; DexiNed has not been run.</li>
                  <li>Studies used their own splits, so cross-study numbers are not a strict ranking.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
