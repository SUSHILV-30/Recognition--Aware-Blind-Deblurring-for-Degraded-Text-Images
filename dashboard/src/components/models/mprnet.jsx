import { useState } from 'react'
import { Figure, Swatch, fmtDelta, useInView } from '../ui.jsx'
import { GroupedBars, Trend } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { Setup, Takeaways } from '../modelkit.jsx'
import {
  HEX, img, mprnet, mprnetAligned, mprnetAlignedMean, mprnetFt, mprnetFtAll, mprnetOcr,
} from '../../data/project.js'

// Fine-tuned numbers come from MPRNet_HDC_levels0_6_Colab.ipynb as reported in
// "MPRNet (fine-tuned): Responses to the Editor's Queries". The earlier zero-shot
// benchmark at the end of the page is a separate study with its own pipeline.

const LEVELS = mprnetFt.map((r) => r.level)
const OCR_COLORS = { gt: HEX.gt, input: HEX.input, pre: HEX.pre, ft: HEX.mpr, twoPass: HEX.scratch }

function ResultsA() {
  return (
    <>
      <div className="two">
        <div className="panel">
          <h4>PSNR by level, dB</h4>
          <GroupedBars
            data={mprnetFt}
            xKey="level"
            domain={[6, 19]}
            series={[
              { key: 'inputPsnr', name: 'Blurred input', color: HEX.input },
              { key: 'prePsnr', name: 'Pretrained', color: HEX.pre },
              { key: 'ftPsnr', name: 'Fine-tuned', color: HEX.mpr },
            ]}
          />
          <p className="chart-note">Fine-tuned PSNR beats the input everywhere, but only by +0.05 to +0.92 dB, and the gain shrinks at Levels 4–6.</p>
        </div>
        <div className="panel">
          <h4>SSIM by level</h4>
          <GroupedBars
            data={mprnetFt}
            xKey="level"
            digits={3}
            domain={[0, 0.6]}
            series={[
              { key: 'inputSsim', name: 'Blurred input', color: HEX.input },
              { key: 'preSsim', name: 'Pretrained', color: HEX.pre },
              { key: 'ftSsim', name: 'Fine-tuned', color: HEX.mpr },
            ]}
          />
          <p className="chart-note">The SSIM gain is much larger (+0.160 to +0.224) and grows with the blur level.</p>
        </div>
      </div>

      <div className="table-scroll" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th className="num">Input PSNR</th><th className="num">Pretrained</th><th className="num">Fine-tuned</th><th className="num">FT − input</th>
              <th className="num">Input SSIM</th><th className="num">Pretrained</th><th className="num">Fine-tuned</th><th className="num">FT − input</th>
            </tr>
          </thead>
          <tbody>
            {[...mprnetFt, { level: 'All', ...mprnetFtAll }].map((r) => (
              <tr key={r.level} className={r.level === 'All' ? 'hl' : ''}>
                <td>{r.level}</td>
                <td className="num">{r.inputPsnr.toFixed(2)}</td>
                <td className="num">{r.prePsnr.toFixed(2)}</td>
                <td className="num"><b>{r.ftPsnr.toFixed(2)}</b></td>
                <td className="num delta-pos">{fmtDelta(r.ftPsnr - r.inputPsnr)}</td>
                <td className="num">{r.inputSsim.toFixed(3)}</td>
                <td className="num">{r.preSsim.toFixed(3)}</td>
                <td className="num"><b>{r.ftSsim.toFixed(3)}</b></td>
                <td className="num delta-pos">{fmtDelta(r.ftSsim - r.inputSsim, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-note">
        Evaluation A: 35 Times test images (5 per level), full resolution, 512 × 1024 centre crop, no alignment,
        1-way test-time augmentation, Run 1 weights (best checkpoint at epoch 3 of 4, chosen on validation).
        Indicative, not final: the full test split has 280 pairs.
      </p>
    </>
  )
}

function ResultsB() {
  return (
    <div className="two" style={{ alignItems: 'start' }}>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Level</th><th className="num">Input PSNR</th><th className="num">Fine-tuned</th><th className="num">2-pass</th><th className="num">FT − input</th>
              <th className="num">Input SSIM</th><th className="num">FT SSIM</th><th className="num">2-pass SSIM</th>
            </tr>
          </thead>
          <tbody>
            {[...mprnetAligned, { level: 'Mean', ...mprnetAlignedMean }].map((r) => (
              <tr key={r.level} className={r.level === 'Mean' ? 'hl' : ''}>
                <td>{r.level}</td>
                <td className="num">{r.inputPsnr.toFixed(2)}</td>
                <td className="num"><b>{r.ftPsnr.toFixed(2)}</b></td>
                <td className="num">{r.twoPassPsnr.toFixed(2)}</td>
                <td className="num delta-pos">{fmtDelta(r.ftPsnr - r.inputPsnr)}</td>
                <td className="num">{r.inputSsim.toFixed(2)}</td>
                <td className="num">{r.ftSsim.toFixed(2)}</td>
                <td className="num">{r.twoPassSsim.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h4>Reading the aligned run</h4>
        <ul className="facts small">
          <li>PSNR is scored after translation alignment (phase correlation) and a global brightness/contrast fit; SSIM in the table is unaligned.</li>
          <li>After alignment, mean PSNR gains only +0.19 dB. Mean SSIM after alignment is 0.29 for the input, 0.48 fine-tuned and 0.49 for 2-pass.</li>
          <li>Feeding the output through the model a second time raises SSIM slightly but lowers mean PSNR to 14.69 dB, so it is not the main result.</li>
          <li>Evaluations A and B use different image subsets (35 and 28), so their absolute values should not be compared.</li>
        </ul>
      </div>
    </div>
  )
}

function OcrRuns() {
  const [run, setRun] = useState('run1')
  const r = mprnetOcr[run]
  const data = LEVELS.map((level, i) => {
    const row = { level }
    for (const x of r.rows) row[x.key] = x.cer[i]
    return row
  })
  return (
    <>
      <div className="cmp-toolbar">
        <div className="seg" role="tablist" aria-label="OCR run">
          <button role="tab" aria-selected={run === 'run1'} onClick={() => setRun('run1')}>Run 1 · 35 images</button>
          <button role="tab" aria-selected={run === 'run2'} onClick={() => setRun('run2')}>Run 2 · 28 images, contrast-stretched</button>
        </div>
        <span className="small muted">EasyOCR, letters-only allowlist. Lower is better.</span>
      </div>
      <div className="two" style={{ alignItems: 'start' }}>
        <div className="panel">
          <h4>Character error rate by level, %</h4>
          <Trend
            key={run}
            data={data}
            xKey="level"
            domain={[0, 100]}
            digits={1}
            series={r.rows.map((x) => ({ key: x.key, name: x.label, color: OCR_COLORS[x.key], dashed: x.key === 'gt' || x.key === 'input' }))}
          />
          <p className="chart-note">The clearest gains are at Levels 2–3. At Levels 4–6 errors stay at 70–100%, and each image moves a level’s score by 20–25 points.</p>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Method</th>{LEVELS.map((l) => <th key={l} className="num">{l}</th>)}<th className="num">Mean</th></tr>
            </thead>
            <tbody>
              {r.rows.map((x) => (
                <tr key={x.key} className={x.key === 'ft' ? 'hl' : ''}>
                  <td><span className="method-cell"><Swatch color={OCR_COLORS[x.key]} />{x.label}</span></td>
                  {x.cer.map((v, i) => <td key={i} className="num">{v.toFixed(run === 'run1' ? 1 : 2)}</td>)}
                  <td className="num"><b>{x.mean.toFixed(run === 'run1' ? 1 : 2)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ul className="facts small" style={{ marginTop: 20 }}>
        <li>Fine-tuning lowers the mean CER from 48.7% to 42.2% in Run 1 and from 46.3% to 43.3% in Run 2.</li>
        <li>At Levels 0–1 the blurred input already reads as well as, or better than, the sharp image, so there is nothing to recover.</li>
        <li>The runs disagree at Level 4: fine-tuned beats the input in Run 1 (75.0 vs 86.8) and is slightly worse in Run 2 (80.13 vs 78.31). Within noise at 4–5 images per level.</li>
        <li>The sharp row is not a lower bound, and its CER is about 10%. The letters-only allowlist means any digit in a ground-truth string always counts as an error.</li>
        <li>CER here is 100 minus per-image character accuracy, capped at 100% per image. No WER is computed; exact-match rates over 35 images are input 11.4%, pretrained 11.4%, fine-tuned 8.6%, sharp 5.7%.</li>
      </ul>
    </>
  )
}

function ZeroShotAudit() {
  return (
    <div className="audit">
      <div className="panel">
        <h4>Official GoPro weights, no fine-tuning</h4>
        <div className="table-scroll" style={{ border: 0 }}>
          <table>
            <thead><tr><th>Level</th><th className="num">Input</th><th className="num">Pretrained</th><th className="num">Δ PSNR</th><th className="num">Input SSIM</th><th className="num">Pretrained SSIM</th></tr></thead>
            <tbody>
              {[...mprnetFt, { level: 'All', ...mprnetFtAll }].map((r) => {
                const d = r.prePsnr - r.inputPsnr
                return (
                  <tr key={r.level} className={r.level === 'All' ? 'hl' : ''}>
                    <td>{r.level}</td>
                    <td className="num">{r.inputPsnr.toFixed(2)}</td>
                    <td className="num">{r.prePsnr.toFixed(2)}</td>
                    <td className="num delta-neg">{fmtDelta(d)}</td>
                    <td className="num">{r.inputSsim.toFixed(3)}</td>
                    <td className="num">{r.preSsim.toFixed(3)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <h4>What the audit established</h4>
        <ul className="facts small">
          <li>The checkpoint is the official MPRNet GoPro file (<code>model_deblurring.pth</code>), loaded into the official three-stage model with 0 missing and 0 unexpected keys.</li>
          <li>Grayscale input is min-max scaled per image, replicated to three channels, clipped and averaged; the input PSNR uses the same function and crop.</li>
          <li>Zero-shot, the model stays within 0.4 dB of the input at Levels 0–3 and falls below it at Levels 4–6 (−0.54, −2.58 and −4.23 dB, SSIM about 0.05 at Levels 5–6).</li>
          <li>A shift from motion blur to defocus blur is a plausible reading, not a tested one. A correctly loaded model can score this low at strong defocus, so the low values are not a loading error.</li>
        </ul>
      </div>
    </div>
  )
}

// The earlier zero-shot study: published GoPro score against the focusStep mean.
function DomainGap() {
  const [ref, inView] = useInView()
  const rows = [
    ['GoPro motion blur (published)', 32.66, HEX.pre],
    ['focusStep defocus, zero-shot mean', 17.11, HEX.mpr],
  ]
  return (
    <div className="panel" ref={ref}>
      <h4>The cost of the wrong training data</h4>
      <div className="bars" style={{ marginTop: 14 }}>
        {rows.map(([label, v, c]) => (
          <div className="bar-row wide" key={label}>
            <span>{label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: inView ? `${(v / 35) * 100}%` : 0, background: c }} />
            </div>
            <output>{v.toFixed(2)} dB</output>
          </div>
        ))}
      </div>
      <p className="gap-callout"><b>−15.55 dB</b> between the benchmark it was built for and printed text out of focus.</p>
    </div>
  )
}

function EarlierStudy() {
  return (
    <>
      <div className="two" style={{ alignItems: 'start' }}>
        <div className="panel">
          <h4>Zero-shot PSNR and SSIM, focusStep Levels 0–4</h4>
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
          <p className="chart-note">40 held-out focusStep pairs (6, 10, 5, 9 and 10 per level), GoPro weights from epoch 31. Mean 17.11 dB, SSIM 0.4085.</p>
        </div>
        <DomainGap />
      </div>
      <div className="two" style={{ marginTop: 24 }}>
        <Figure src={img('mprnet_L1.png')} caption="Earlier study, Level 1: 20.91 dB, SSIM 0.448 on this sample." />
        <Figure src={img('mprnet_L4.png')} caption="Earlier study, Level 4: 16.58 dB, SSIM 0.377." />
      </div>
      <p className="chart-note">
        This benchmark used its own pipeline and images. Its absolute values are not comparable with the
        fine-tuned notebook above, where the same blurred input scores differently.
      </p>
    </>
  )
}

export default {
  lede:
    'MPRNet restores an image over three progressive stages, from image patches to full resolution, with supervised attention between them. This study fine-tunes the official GoPro checkpoint on HDC Levels 0–6. Fine-tuning lifts SSIM at every level by about 0.16 to 0.22, while PSNR moves only slightly.',
  keyvals: [
    ['+0.160 → +0.224', 'SSIM gain over the input, Level 0 to 6', 'gain'],
    ['+0.05 to +0.92 dB', 'PSNR gain over the input, every level'],
    ['48.7 → 42.2%', 'Mean OCR character error rate', 'gain'],
    ['−4.23 dB', 'Zero-shot vs input at Level 6', 'loss'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'Structure improves clearly; pixel error barely moves.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              Out of the box, the GoPro weights were trained for motion blur. Loaded correctly, they stay within
              0.4 dB of the blurred input at Levels 0–3 and then fall below it, by 4.23 dB at Level 6.
            </p>
            <p>
              One model fine-tuned on all seven levels beats the input at every level on both metrics. The
              SSIM gain is large and grows with blur, from +0.160 at Level 0 to +0.224 at Level 6, while the
              PSNR gain is small and shrinks at Levels 4–6. OCR improves most at Levels 2–3.
            </p>
            <p className="small muted">
              These results come from a small evaluation subset (28–35 Times images), so they are indicative
              rather than final.
            </p>
          </div>
          <div className="contrast">
            <div className="contrast-side bad">
              <small>Blurred input, all levels</small>
              <b>13.89 dB</b>
              <span>SSIM 0.291</span>
            </div>
            <div className="contrast-arrow" aria-hidden="true">→</div>
            <div className="contrast-side good">
              <small>Fine-tuned, all levels</small>
              <b>14.35 dB</b>
              <span>SSIM 0.471</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'Three stages that see the image at increasing granularity, from four patches to the full page.',
      body: (
        <>
          <ModelDiagram id="mprnet" />
          <div className="caveats">
            <div><b>Features</b><span>n_feat 96, plus 48 extra U-Net features and 32 extra original-resolution features.</span></div>
            <div><b>ORSNet</b><span>8 channel-attention blocks per original-resolution block.</span></div>
            <div><b>Size</b><span>About 20.1 M parameters, the figure from the MPRNet paper; the notebook does not count them.</span></div>
          </div>
        </>
      ),
    },
    {
      id: 'data',
      nav: 'Data and protocol',
      title: 'Data, splits and evaluation protocol',
      body: (
        <>
          <div className="two" style={{ alignItems: 'start' }}>
            <div className="panel">
              <h4>Pairs and splits</h4>
              <div className="table-scroll" style={{ border: 0 }}>
                <table>
                  <thead><tr><th>Scope</th><th className="num">Pairs</th><th className="num">Train</th><th className="num">Val</th><th className="num">Test</th></tr></thead>
                  <tbody>
                    <tr><td>Levels 0–6</td><td className="num">1,400</td><td className="num">952</td><td className="num">168</td><td className="num">280</td></tr>
                    <tr><td>Levels 1–4</td><td className="num">800</td><td className="num">544</td><td className="num">96</td><td className="num">160</td></tr>
                    <tr><td>Per level</td><td className="num">200</td><td className="num">136</td><td className="num">24</td><td className="num">40</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="chart-note">
                Random split within each level, seed 42: pairs sorted by font and filename, shuffled, then 20% test,
                15% of the rest validation. Not by sample ID and not stratified by font. Each level has 100 Times and
                100 Verdana pairs. The test list is saved in <code>splits.json</code>.
              </p>
            </div>
            <div className="panel">
              <h4>How the images are scored</h4>
              <Setup
                rows={[
                  ['Scaling', 'Per-image min-max to [0, 1]'],
                  ['Channels', 'Gray replicated to 3 channels; output clipped and averaged'],
                  ['Inference', 'Full resolution, 512 px tiles, 64 px overlap, Hann blending'],
                  ['Metric crop', '512 × 1024 centre crop'],
                  ['SSIM', 'scikit-image default, uniform 7 × 7 window, data range 1.0'],
                  ['TTA', '1-way'],
                  ['OCR', 'EasyOCR with a letters-only allowlist'],
                  ['Preprocessing', 'None: no CLAHE or unsharp masking'],
                ]}
              />
            </div>
          </div>
          <div className="caveats">
            <div><b>Times only</b><span>The reported tables use the first test pairs per level in font order, so Verdana is not represented.</span></div>
            <div><b>Possible leakage</b><span>The split is random per level. If the same text appears at several focus steps, a test text may be in training at another level. Not checked.</span></div>
            <div><b>Counts differ</b><span>This notebook finds 100 pairs per font per step; the NAFNet notebook finds 20. To be reconciled.</span></div>
            <div><b>Not NAFNet’s pipeline</b><span>The same Level 1 input scores 16.99 dB here and 24.70 dB in the NAFNet pipeline.</span></div>
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
            <Setup
              rows={[
                ['Start', 'Official MPRNet GoPro checkpoint'],
                ['Optimiser', 'AdamW, LR 5×10⁻⁵, cosine decay to 10⁻⁶, weight decay 10⁻⁴'],
                ['Loss', '0.5 Charbonnier + 0.3 Fourier-domain complex L1 + 0.2 (1 − SSIM)'],
                ['Stage weights', 'Summed over the three stage outputs with weights 1, 0.5, 0.25'],
                ['Stability', 'EMA 0.999, fp16 autocast, gradient clipping 1.0'],
                ['Batch', '2, with 2 accumulation steps'],
                ['Crops', '128 × 128 px, flips and 90° rotations'],
                ['Scope', 'One model on the training pairs of all seven levels'],
              ]}
            />
          </div>
          <div className="panel">
            <h4>Two training runs</h4>
            <ol className="timeline">
              <li className="done"><b>Run 1 · used for all tables</b><span>4 epochs, 1 patch per image. Best checkpoint at epoch 3, selected on the 168-pair validation split.</span></li>
              <li className="done"><b>Run 2 · validation only</b><span>7 epochs, 2 patches per image, started from Run 1, about 42 minutes on a T4. Validation PSNR 15.66 → 15.84 dB, SSIM 0.466 → 0.486, flat after epoch 5.</span></li>
            </ol>
            <p className="chart-note">Run 2 has no test evaluation, and its patch-level validation numbers are not comparable with the test tables.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'zeroshot',
      nav: 'Zero-shot audit',
      title: 'Zero-shot baseline and the audit',
      lead: 'What the official weights do before any fine-tuning, on the same 35 images.',
      body: <ZeroShotAudit />,
    },
    {
      id: 'results',
      nav: 'Results',
      title: 'Results on HDC Levels 0–6',
      lead: 'Evaluation A: input, pretrained and fine-tuned on the same 35 test images.',
      body: <ResultsA />,
    },
    {
      id: 'aligned',
      nav: 'Aligned run',
      title: 'Evaluation B: aligned metrics',
      lead: 'The same Run 1 weights on 28 images, with alignment before scoring and a 2-pass variant.',
      body: <ResultsB />,
    },
    {
      id: 'ocr',
      nav: 'OCR',
      title: 'OCR: is the page easier to read?',
      lead: 'Character error rate per level in two OCR runs with different images and preprocessing.',
      body: <OcrRuns />,
    },
    {
      id: 'earlier',
      nav: 'Earlier benchmark',
      title: 'Earlier zero-shot benchmark',
      lead: 'Before fine-tuning, the original study measured the raw domain-shift cost of the GoPro weights on focusStep Levels 0–4.',
      body: <EarlierStudy />,
    },
    {
      id: 'takeaways',
      nav: 'Takeaways',
      title: 'Takeaways',
      body: (
        <Takeaways
          shows={[
            'Fine-tuning raises SSIM at every level (+0.16 to +0.22) but PSNR only slightly (+0.05 to +0.92 dB).',
            'Zero-shot MPRNet is worse than the blurred input at Levels 4–6, by up to 4.23 dB.',
            'OCR gains are clearest at Levels 2–3; at Levels 4–6 the page stays mostly unreadable.',
          ]}
          limits={[
            'Small evaluation subset: 28–35 Times images, no Verdana.',
            'Short training (4 and 7 epochs, 128 px crops) and a single seed.',
            'Checkpoint chosen on a separate 168-pair validation split, not on test data.',
          ]}
          next={[
            'Re-evaluate on all 280 test pairs, or on the common 24-pair set shared with NAFNet.',
            'Report Run 2 on the test set, or keep Run 1 consistently.',
            'Align engines and settings: one OCR engine, one SSIM window, one pipeline for every model.',
          ]}
        />
      ),
    },
  ],
}
