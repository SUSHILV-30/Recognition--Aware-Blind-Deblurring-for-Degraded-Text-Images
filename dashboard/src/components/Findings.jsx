import { SectionHead } from './ui.jsx'
import { status } from '../data/project.js'

const FINDINGS = [
  ['Matching the data beats a bigger network',
    'A purely convolutional U-Net trained on data synthesised from the estimated camera physics reaches 17.43 dB at Level 5. The 1.18 M-parameter Restormer trained on generic in-domain data tops out at 15.66 dB on its easiest step.'],
  ['Motion-blur weights do not restore defocused text',
    'MPRNet and NAFNet both start from GoPro motion-blur weights. Zero-shot, NAFNet stays within 1.3 dB of the input, and MPRNet falls below it at Levels 4–6 (by up to 4.23 dB). Fine-tuned on text, both beat the input at every level: NAFNet cuts Level 4 OCR character errors from 60.9% to 7.8%, and MPRNet lifts SSIM by 0.16–0.22.'],
  ['SSIM and PSNR can tell different stories',
    'Fine-tuned MPRNet raises SSIM by up to +0.224 while PSNR moves by only +0.05 to +0.92 dB, and at Levels 4–6 the SSIM gain grows while the PSNR gain shrinks. A model can recover structure a recognizer needs without lowering pixel error much.'],
  ['Small, targeted fine-tuning goes a long way',
    'Freezing Restormer’s encoder and training only the decoder adds up to +3.21 dB at Level 1 and, in Phase 2, takes Level 5 OCR from 0% to 96.9% character accuracy with 150 training pages.'],
  ['Patch metrics overstate real performance',
    'The from-scratch Restormer scores 21.48 dB on training patches and at most 15.66 dB on full pages. Comparisons should always use full-image, per-level results.'],
  ['Pixel scores are not readability',
    'At Level 5 the pretrained Restormer raises SSIM from 0.372 to 0.419 while OCR still reads 0% of characters. At NAFNet’s Level 1, PSNR rises 5.13 dB while CER gets worse. That gap is the case for the recognition-aware RABD loss.'],
  ['Heavy blur is not the end of the road',
    'At HDC Levels 9–13, where OCR on the blurred page produces mostly noise, a per-level U-Net with a diffusion refiner brings illustrative samples back to 50–91% character accuracy.'],
]

const ROADMAP = [
  ['Wire the CTC loss through the recognizer into the deblurring weights', 'First end-to-end Restormer + TrOCR run with CER/WER'],
  ['Run the Restormer notebooks for HDC Levels 7–10', 'Per-level and all-levels results beyond Level 6'],
  ['Score Restormer fine-tuned Levels 1–4 and the other models with OCR', 'Fills the empty columns of the OCR table'],
  ['Score the U-Net + diffusion pipeline on full Level 9–13 test sets', 'Turns two illustrative samples per level into real estimates'],
  ['Evaluate fine-tuned MPRNet on all 280 test pairs, both fonts', 'Replaces the 28–35-image Times-only subset'],
  ['Score every model on one common test set', 'Same 24 pairs, one OCR engine, one SSIM window and one pipeline, so Tables 8 and 9 compare directly'],
  ['Benchmark Uformer on the common protocol', 'A four-model per-level comparison'],
  ['Benchmark the diffusion restorer against all five models', 'On the common protocol, not only at Levels 9–13'],
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
                  <li>Fine-tuned MPRNet is scored on 28–35 Times-only images, from short runs with a single seed.</li>
                  <li>Uformer was trained for 150 epochs but not evaluated on the common protocol.</li>
                  <li>RABD is designed, not yet measured: no end-to-end CER/WER numbers.</li>
                  <li>The synthetic PSF ignores astigmatism and coma; DexiNed has not been run.</li>
                  <li>Studies used their own splits, so cross-study numbers are not a strict ranking.</li>
                  <li>NAFNet is evaluated on 4× downscaled images, and its best checkpoint was picked on the reported test set.</li>
                  <li>OCR engines differ: EasyOCR for Restormer, NAFNet and MPRNet (letters only), Tesseract for the Level 9–13 samples.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
