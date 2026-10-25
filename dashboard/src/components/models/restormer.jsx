import { useState } from 'react'
import { Figure, Swatch, fmtDelta, useInView } from '../ui.jsx'
import { GroupedBars, Trend } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { LevelFigures, Setup, Takeaways } from '../modelkit.jsx'
import { HEX, img, level5, level5ByFont, level5Val, level6, restormerFt } from '../../data/project.js'

/* ---------------- Phase 2: HDC Levels 5–10 ---------------- */

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
    training: 'l5_training.png',
    note: 'The pretrained model raises SSIM but not readability: OCR still recovers 0% of characters. The fine-tuned output scores slightly above OCR on the sharp capture because restored pages are cleaner and higher-contrast than the raw CAM01 image.',
  },
  6: {
    rows: level6,
    figure: 'l6_comparison.png',
    training: 'l6_training.png',
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

function Phase2() {
  const [lv, setLv] = useState(5)
  const res = RESULTS[lv]
  const ft = res.rows.find((r) => r.key === 'ft')
  const input = res.rows.find((r) => r.key === 'input')

  return (
    <>
      <div className="cmp-toolbar">
        <div className="seg" role="tablist" aria-label="Blur level">
          {[5, 6].map((l) => (
            <button key={l} role="tab" aria-selected={l === lv} onClick={() => setLv(l)}>Level {l}</button>
          ))}
        </div>
        <span className="small muted">Test set, 40 pages (20 per font)</span>
      </div>

      <div className="big-result panel">
        <div className="ocr-meter">
          <div className="pct">{ft.char.toFixed(1)}%</div>
          <div className="label">EasyOCR character accuracy on the Level {lv} test set after fine-tuning, up from {input.char.toFixed(0)}%</div>
          <div className="ocr-sub">
            <span><b>{fmtDelta(ft.psnr - input.psnr)} dB</b> PSNR</span>
            <span><b>{fmtDelta(ft.ssim - input.ssim, 3)}</b> SSIM</span>
          </div>
        </div>
        <div>
          <h4 style={{ marginBottom: 14 }}>Character accuracy by method, Level {lv}</h4>
          <OcrBars key={lv} rows={res.rows} />
          <p className="chart-note">{res.note}</p>
        </div>
      </div>

      <div className="table-scroll" style={{ margin: '24px 0 32px' }}>
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
        key={res.figure}
        src={img(res.figure)}
        caption={`Level ${lv} test samples: blurred input, pretrained Restormer, fine-tuned Restormer and sharp ground truth.`}
      />

      <div className="two" style={{ marginTop: 32 }}>
        <div className="panel">
          <h4>Level 5 validation during fine-tuning</h4>
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
          <h4>Level 5 test PSNR by font, dB</h4>
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
          <p className="chart-note">Verdana gains slightly more (+7.07 dB, 97.2% OCR) than Times New Roman (+6.19 dB, 96.7% OCR).</p>
        </div>
      </div>

      <Figure
        key={res.training}
        className="spaced"
        src={img(res.training)}
        caption={`Level ${lv} training: Charbonnier loss, validation PSNR and SSIM.`}
      />

      <div className="two" style={{ marginTop: 32, alignItems: 'start' }}>
        <div>
          <h3 style={{ marginBottom: 16 }}>Levels 5–10 status</h3>
          <div className="levels">
            {LEVELS.map((l) => (
              <div key={l.n} className={`lvl ${l.done ? 'done' : ''}`}>
                <b>L{l.n}</b>
                <span className="st">{l.st}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 16 }}>
            <code>03_phase2_any_level_5_to_10.ipynb</code> runs any level by changing one variable; patch
            size and tile overlap grow with the estimated blur.{' '}
            <code>04_phase2_ultimate_all_levels_5_to_10.ipynb</code> trains one model on all six levels with
            full fine-tuning, progressive 160 → 288 px patches, Charbonnier + FFT + SSIM loss, EMA weights and
            test-time augmentation.
          </p>
        </div>
        <Figure src={img('l5_input_vs_gt.png')} caption="Level 5 blurred input against the sharp capture: at this blur the pretrained model and OCR both read nothing." />
      </div>
    </>
  )
}

/* ---------------- Phase 1 results ---------------- */

function Phase1Results() {
  return (
    <>
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
                <tr><th>Level</th><th className="num">Input</th><th className="num">Pretrained</th><th className="num">Fine-tuned</th><th className="num">Δ PSNR</th><th className="num">Input SSIM</th></tr>
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
          <p className="chart-note">
            The pretrained checkpoint tracks the blurred input almost exactly: DPDD natural scenes do not
            look like dense glyph edges. SSIM rises at every level after fine-tuning, by up to +0.18.
          </p>
        </div>
      </div>
      <Figure className="spaced" src={img('restormer_ft_bars.png')} caption="Aggregate PSNR and SSIM for input, pretrained and fine-tuned models across Levels 1–4." />
    </>
  )
}

/* ---------------- Page content ---------------- */

export default {
  lede:
    'Restormer computes attention across channels instead of pixels, so a full 1460 × 2360 page fits in one pass. Starting from a natural-scene defocus checkpoint, a decoder-only fine-tune adapts it to printed text: first on focusStep Levels 1–4, then, in Phase 2, on HDC Levels 5 and 6 where the untuned model reads nothing.',
  keyvals: [
    ['96.9%', 'OCR characters read at Level 5, from 0%', 'gain'],
    ['+6.63 dB', 'PSNR gain at Level 5 (15.35 → 21.98)', 'gain'],
    ['24.88 dB', 'PSNR at Level 1, +3.21 dB'],
    ['83.2%', 'OCR characters read at Level 6'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'Two phases, one recipe: keep what the encoder learned about blur, retrain what the decoder makes of it.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              Off-the-shelf restoration weights do not transfer to text. Applied unchanged, the official
              DPDD single-image defocus checkpoint gives no benefit and slightly degrades PSNR, because dense
              high-frequency glyph edges are not natural-image statistics.
            </p>
            <p>
              Freezing the encoder keeps the blur prior learned on DPDD while the decoder and refinement
              stages adapt to focusStep text from very little data. Phase 1 used 20 samples per font per
              level. Phase 2 rebuilt the data pipeline, registered the two cameras and moved the same model
              into HDC Levels 5–10, where the blur sigma is around 25 px.
            </p>
          </div>
          <ol className="timeline">
            <li className="done"><b>Phase 1 · focusStep L1–4</b><span>Decoder fine-tune, 3,000 iterations. +3.21 dB at L1, SSIM up at every level.</span></li>
            <li className="done"><b>Phase 2 · Level 5</b><span>OCR from 0% to 96.9% character accuracy with 150 training pages.</span></li>
            <li className="done"><b>Phase 2 · Level 6</b><span>OCR from 0% to 83.2%; token accuracy 32%.</span></li>
            <li><b>Phase 2 · Levels 7–10</b><span>Per-level and all-levels notebooks ready, no results yet.</span></li>
          </ol>
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'A four-level transformer encoder–decoder. The hatched blocks are frozen during fine-tuning.',
      body: (
        <>
          <ModelDiagram id="restormer" />
          <div className="two" style={{ marginTop: 24, alignItems: 'start' }}>
            <div className="panel">
              <h4>Where the parameters go (Phase 2)</h4>
              <div className="split-bar" aria-label="3.79 M frozen, 22.34 M trainable">
                <i className="frozen" style={{ width: `${(3.79 / 26.13) * 100}%` }} />
                <i style={{ width: `${(22.34 / 26.13) * 100}%` }} />
              </div>
              <div className="split-legend">
                <span><i className="frozen" />Frozen encoder · 3.79 M</span>
                <span><i />Trainable decoder and refinement · 22.34 M</span>
              </div>
              <p className="chart-note">
                Most of the weights sit in the deeper, wider decoder levels, so even a decoder-only fine-tune
                adapts 85% of the network while keeping the encoder’s blur features intact.
              </p>
            </div>
            <Figure className="contain" src={img('restormer_arch.png')} caption="Restormer architecture from the original paper: MDTA and GDFN transformer blocks in a four-level encoder–decoder." />
          </div>
        </>
      ),
    },
    {
      id: 'training',
      nav: 'Training',
      title: 'Training recipe',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="panel">
            <span className="eyebrow">Phase 1 · focusStep</span>
            <h4 style={{ margin: '6px 0 14px' }}>Levels 1–4</h4>
            <Setup
              rows={[
                ['Start', 'DPDD single-image defocus checkpoint, 26.1 M params'],
                ['Trained', 'Decoder and refinement only; encoder frozen'],
                ['Optimiser', 'AdamW, LR 2×10⁻⁵'],
                ['Loss', 'Charbonnier'],
                ['Patches', '128 × 128 px'],
                ['Iterations', '3,000'],
                ['Data', '20 samples per font per level'],
              ]}
            />
          </div>
          <div className="panel">
            <span className="eyebrow">Phase 2 · HDC</span>
            <h4 style={{ margin: '6px 0 14px' }}>Levels 5–10</h4>
            <ol className="recipe">
              <li><span><b>Register the cameras</b>CAM01 is warped onto CAM02 with one global affine fitted by blur-matched template matching and RANSAC. Alignment NCC rises from 0.792 to 0.892.</span></li>
              <li><span><b>Fix the split</b>150 train, 10 validation and 40 test pages per level, balanced across both fonts and reused by every later run.</span></li>
              <li><span><b>Fine-tune the decoder</b>Encoder frozen (3.79 M params), 22.34 M trainable, 128 px patches × 4, 3,000 iterations, AdamW at 2×10⁻⁵ with cosine decay.</span></li>
              <li><span><b>Score readability</b>EasyOCR on every test page, with character and token accuracy against the ground-truth text files.</span></li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'results',
      nav: 'Results L1–4',
      title: 'Results on focusStep Levels 1–4',
      lead: 'Full-image PSNR and SSIM against the focused CAM01 capture, input versus pretrained versus fine-tuned.',
      body: <Phase1Results />,
    },
    {
      id: 'samples',
      nav: 'Samples',
      title: 'Sample outputs',
      lead: 'Blurred input, pretrained, fine-tuned and ground truth on the same crop. Click any image to enlarge it.',
      body: (
        <LevelFigures
          levels={[1, 2, 3, 4].map((n) => ({
            label: `Level ${n}`,
            src: img(`restormer_ft_L${n}.png`),
            caption: `Level ${n}: blurred input, pretrained, fine-tuned and ground truth.`,
            meta: `Fine-tuned ${restormerFt[n - 1].ft.toFixed(2)} dB vs input ${restormerFt[n - 1].input.toFixed(2)} dB`,
          }))}
        />
      ),
    },
    {
      id: 'phase2',
      nav: 'Phase 2 · L5–10',
      title: 'Phase 2: HDC Levels 5–10',
      lead: 'Phase 1 stopped at Level 4, where the PSNR gain had nearly vanished. Phase 2 takes the same model into blur where the pretrained Restormer and OCR read nothing, and measures readability directly.',
      body: <Phase2 />,
    },
    {
      id: 'takeaways',
      nav: 'Takeaways',
      title: 'Takeaways',
      body: (
        <Takeaways
          shows={[
            'Small, targeted fine-tuning goes a long way: 150 training pages take Level 5 OCR from 0% to 96.9%.',
            'Pixel scores are not readability. The pretrained model raises SSIM at Level 5 while OCR still reads 0%.',
            'Restored pages can out-read the sharp capture (96.9% vs 94.1%) because they are cleaner and higher-contrast.',
          ]}
          limits={[
            'Level 4 PSNR dips by 0.36 dB, although SSIM still rises.',
            'At Level 6 the 128 px patch is smaller than the blur, leaving blobs and holes inside letters.',
            'OCR has not been run on the Level 1–4 fine-tuned outputs yet.',
          ]}
          next={[
            'Run the Phase 2 notebooks for Levels 7–10 and the all-levels model.',
            'Score fine-tuned Levels 1–4 with OCR.',
            'Wire the CTC loss through TrOCR into the decoder for the first RABD run.',
          ]}
        />
      ),
    },
  ],
}
