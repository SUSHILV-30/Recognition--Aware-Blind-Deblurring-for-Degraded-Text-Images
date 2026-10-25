import { Figure, fmtDelta, useInView } from '../ui.jsx'
import { Trend } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { LevelFigures, Setup, Takeaways } from '../modelkit.jsx'
import { HEX, img, mprnet } from '../../data/project.js'

const SAMPLE_META = {
  1: 'This sample: 20.91 dB, SSIM 0.448',
  4: 'This sample: 16.58 dB, SSIM 0.377',
}

// Published GoPro score against the zero-shot focusStep mean, on one scale.
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

export default {
  lede:
    'MPRNet restores an image progressively over three stages, linked by cross-stage feature fusion, with Supervised Attention Modules weighting each stage by its own prediction. Here it is applied unchanged with its public GoPro motion-blur weights: a deliberate control that measures the raw domain-shift cost on optical defocus.',
  keyvals: [
    ['17.11 dB', 'Mean PSNR over 40 images'],
    ['0.4085', 'Mean SSIM'],
    ['−15.55 dB', 'Gap from its GoPro result', 'loss'],
    ['Never', 'Falls below the raw blurred input', 'gain'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'No fine-tuning at all, on purpose.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              Almost every restoration architecture is benchmarked on GoPro motion blur. Running MPRNet on
              focusStep exactly as published answers how much that choice of benchmark costs when the real
              degradation is a defocused lens over printed text.
            </p>
            <p>
              The answer is a lot, but not catastrophically. It degrades smoothly from 22.12 dB at Level 0
              to 12.93 dB at Level 4 instead of collapsing, because supervised attention keeps each stage
              tied to a prediction of the image rather than free-floating features.
            </p>
          </div>
          <DomainGap />
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'Three stages that see the image at increasing granularity, from four patches to the full page.',
      body: <ModelDiagram id="mprnet" />,
    },
    {
      id: 'evaluation',
      nav: 'Evaluation',
      title: 'Evaluation setup',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="panel">
            <Setup
              rows={[
                ['Weights', 'Public GoPro motion-deblurring release, epoch 31'],
                ['Trained', 'Nothing. A deliberate control for the raw domain-shift cost'],
                ['Data', '40 held-out focusStep pairs across Levels 0–4'],
                ['Per level', '6, 10, 5, 9 and 10 images'],
                ['Published', '32.66 dB / 0.959 SSIM on GoPro'],
                ['Metric', 'Full-image PSNR and SSIM against CAM01'],
              ]}
            />
          </div>
          <div className="panel">
            <h4>Why a zero-shot control matters</h4>
            <p className="small muted">
              The fine-tuned studies show what the right data buys. This study shows the opposite side: the
              starting point every pretrained model is fine-tuned from. Comparing the two separates what the
              architecture contributes from what the data contributes.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'results',
      nav: 'Results',
      title: 'Results on focusStep Levels 0–4',
      lead: 'Zero-shot PSNR and SSIM per level.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
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
            <p className="chart-note">Both metrics fall together; the steepest drop is between Levels 1 and 2.</p>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Level</th><th className="num">Images</th><th className="num">PSNR (dB)</th><th className="num">SSIM</th><th className="num">Δ from L0</th></tr></thead>
              <tbody>
                {mprnet.map((r) => (
                  <tr key={r.level}>
                    <td>{r.level}</td>
                    <td className="num">{r.n}</td>
                    <td className="num">{r.psnr.toFixed(2)}</td>
                    <td className="num">{r.ssim.toFixed(4)}</td>
                    <td className={`num ${r.level === 'L0' ? '' : 'delta-neg'}`}>{r.level === 'L0' ? '—' : fmtDelta(r.psnr - mprnet[0].psnr)}</td>
                  </tr>
                ))}
                <tr className="hl">
                  <td>All</td><td className="num">40</td><td className="num">17.11</td><td className="num">0.4085</td><td className="num">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'samples',
      nav: 'Samples',
      title: 'Sample outputs',
      lead: 'Blurred input, MPRNet output and ground truth. Click any image to enlarge it.',
      body: (
        <LevelFigures
          levels={[1, 2, 3, 4].map((n) => ({
            label: `Level ${n}`,
            src: img(`mprnet_L${n}.png`),
            caption: n === 4
              ? 'Level 4: softer, but closer to the truth than the input.'
              : `Level ${n}: blurred input, MPRNet zero-shot output and ground truth.`,
            meta: SAMPLE_META[n] || `Level mean ${mprnet[n].psnr.toFixed(2)} dB, SSIM ${mprnet[n].ssim.toFixed(3)}`,
          }))}
        />
      ),
    },
    {
      id: 'takeaways',
      nav: 'Takeaways',
      title: 'Takeaways',
      body: (
        <Takeaways
          shows={[
            'Training on the wrong degradation costs 15.55 dB against the model’s own published result.',
            'Supervised attention anchors the model to its input: it never drops below the blurred page.',
            'Architecture decides how a pretrained model fails; NAFNet on the same kind of shift collapses.',
          ]}
          limits={[
            'Zero-shot only, on 40 images.',
            'Restricted to focusStep Levels 0–4.',
            'OCR has not been run on MPRNet outputs yet.',
          ]}
          next={[
            'Fine-tune MPRNet on focusStep to turn the control into a fine-tuned data point.',
            'Extend evaluation to HDC Steps 5–19.',
            'Score the restored pages with OCR.',
          ]}
        />
      ),
    },
  ],
}
