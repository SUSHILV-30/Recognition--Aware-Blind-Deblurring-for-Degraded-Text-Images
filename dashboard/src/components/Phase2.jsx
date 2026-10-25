import { useState } from 'react'
import { Figure, SectionHead, Swatch, useInView } from './ui.jsx'
import { GroupedBars, Trend } from './charts.jsx'
import { HEX, img, level5, level5ByFont, level5Val, level6 } from '../data/project.js'

const LEVELS = [
  { n: 5, st: 'Trained, evaluated', done: true },
  { n: 6, st: 'Trained, evaluated', done: true },
  { n: 7, st: 'Notebook ready' },
  { n: 8, st: 'Notebook ready' },
  { n: 9, st: 'Notebook ready' },
  { n: 10, st: 'Notebook ready' },
]

const RESULTS = {
  5: {
    rows: level5,
    figure: 'l5_comparison.png',
    note: 'The pretrained model raises SSIM but not readability: OCR still recovers 0% of characters. The fine-tuned output scores slightly above OCR on the sharp capture because restored pages are cleaner and higher-contrast than the raw CAM01 image.',
  },
  6: {
    rows: level6,
    figure: 'l6_comparison.png',
    note: 'One step harder, the same recipe still takes OCR from 0% to 83.2%, but token accuracy drops to 32%: one wrong character costs the whole word. The crops show why: blobs and holes appear inside letters where the 128 px patch is smaller than the blur.',
  },
}

function OcrBars({ rows }) {
  const [ref, inView] = useInView()
  return (
    <div className="bars" ref={ref}>
      {rows.map((r) => (
        <div className="bar-row" key={r.method}>
          <span className="method-cell"><Swatch color={HEX[r.key]} />{r.method}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: inView ? `${r.char}%` : 0, background: HEX[r.key] }} />
          </div>
          <output>{r.char.toFixed(1)}%</output>
        </div>
      ))}
    </div>
  )
}

export default function Phase2() {
  const [lv, setLv] = useState(5)
  const res = RESULTS[lv]
  const ft = res.rows.find((r) => r.key === 'ft')
  return (
    <section className="block phase2" id="phase2">
      <div className="wrap">
        <SectionHead title="Phase 2: Restormer past the focusStep levels">
          Phase 1 stopped at Level 4, where the Restormer PSNR gain had nearly vanished. Phase 2 rebuilt
          the data pipeline and pushed the same model into HDC Levels 5–10, where the blur sigma is
          around 25 px and the pretrained model reads nothing.
        </SectionHead>

        <div className="cmp-toolbar">
          <div className="seg" role="tablist" aria-label="Blur level">
            {[5, 6].map((l) => (
              <button key={l} role="tab" aria-selected={l === lv} onClick={() => setLv(l)}>Level {l}</button>
            ))}
          </div>
          <span className="small muted">Test set, 40 pages (20 per font)</span>
        </div>

        <div className="big-result">
          <div className="ocr-meter">
            <div className="pct">{ft.char.toFixed(1)}%</div>
            <div className="label">EasyOCR character accuracy on the Level {lv} test set after fine-tuning (n = 40)</div>
          </div>
          <div>
            <h4 style={{ marginBottom: 14 }}>Character accuracy by method, Level {lv}</h4>
            <OcrBars key={lv} rows={res.rows} />
            <p className="chart-note">{res.note}</p>
          </div>
        </div>

        <div className="table-scroll" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr>
                <th>Method</th><th className="num">PSNR (dB)</th><th className="num">SSIM</th>
                <th className="num">Character accuracy</th><th className="num">Token accuracy</th>
              </tr>
            </thead>
            <tbody>
              {res.rows.map((r) => (
                <tr key={r.method} className={r.key === 'ft' ? 'hl' : ''}>
                  <td><span className="method-cell"><Swatch color={HEX[r.key]} />{r.method}</span></td>
                  <td className="num">{r.psnr == null ? '—' : r.psnr.toFixed(2)}</td>
                  <td className="num">{r.ssim == null ? '—' : r.ssim.toFixed(4)}</td>
                  <td className="num">{r.char.toFixed(1)}%</td>
                  <td className="num">{r.token.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Figure
          src={img(res.figure)}
          caption={`Level ${lv} test samples: blurred input, pretrained Restormer, fine-tuned Restormer and sharp ground truth.`}
        />

        <div className="two" style={{ marginTop: 32 }}>
          <div className="panel">
            <h4>Validation during fine-tuning</h4>
            <Trend
              data={level5Val}
              xKey="iter"
              xLabel="Iteration"
              rightKey="ssim"
              digits={3}
              series={[
                { key: 'psnr', name: 'PSNR (dB, left)', color: HEX.ft },
                { key: 'ssim', name: 'SSIM (right)', color: HEX.pre, dashed: true },
              ]}
            />
            <p className="chart-note">Most of the gain lands in the first 500 iterations; the best checkpoint is at 3,000.</p>
          </div>
          <div className="panel">
            <h4>Test PSNR by font, dB</h4>
            <GroupedBars
              data={level5ByFont}
              xKey="font"
              labels
              domain={[10, 24]}
              series={[
                { key: 'input', name: 'Blurred input', color: HEX.input },
                { key: 'pre', name: 'Pretrained', color: HEX.pre },
                { key: 'ft', name: 'Fine-tuned', color: HEX.ft },
              ]}
            />
            <p className="chart-note">Verdana gains slightly more (+7.07 dB) than Times New Roman (+6.19 dB).</p>
          </div>
        </div>

        <div className="two" style={{ marginTop: 32, alignItems: 'start' }}>
          <div>
            <h3 style={{ marginBottom: 16 }}>What changed in the recipe</h3>
            <ol className="recipe">
              <li><span><b>Register the cameras</b>CAM01 is warped onto CAM02 with one global affine fitted by blur-matched template matching and RANSAC. Alignment NCC rises from 0.792 to 0.892.</span></li>
              <li><span><b>Fix the split</b>150 train, 10 validation and 40 test pages per level, balanced across both fonts and reused by every later run.</span></li>
              <li><span><b>Fine-tune the decoder</b>Encoder frozen (3.79 M params), 22.34 M trainable, 128 px patches × 4, 3,000 iterations, AdamW at 2×10⁻⁵ with cosine decay.</span></li>
              <li><span><b>Score readability</b>EasyOCR on every test page, with character and token accuracy against the ground-truth text files.</span></li>
            </ol>
          </div>
          <div>
            <h3 style={{ marginBottom: 16 }}>Levels 5–10</h3>
            <div className="levels">
              {LEVELS.map((l) => (
                <div key={l.n} className={`lvl ${l.done ? 'done' : ''}`}>
                  <b>L{l.n}</b>
                  <span className="st">{l.st}</span>
                </div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 16 }}>
              <code>03_phase2_any_level_5_to_10.ipynb</code> runs any level by changing one variable;
              patch size and tile overlap grow with the estimated blur.
              <code>04_phase2_ultimate_all_levels_5_to_10.ipynb</code> trains one model on all six levels
              with full fine-tuning, progressive 160 → 288 px patches, Charbonnier + FFT + SSIM loss,
              EMA weights and test-time augmentation.
            </p>
            <Figure src={img('l5_training.png')} caption="Level 5 training: Charbonnier loss, validation PSNR and SSIM." />
          </div>
        </div>
      </div>
    </section>
  )
}
