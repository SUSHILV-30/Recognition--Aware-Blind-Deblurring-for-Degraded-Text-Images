import { Figure } from '../ui.jsx'
import { GroupedBars, Trend } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { Setup, Takeaways } from '../modelkit.jsx'
import { HEX, edges, img, scratchSteps } from '../../data/project.js'

const PICKED = [1, 5, 10, 15, 17, 19]

function PatchGap() {
  const rows = [
    ['Training patches, epoch 120', 21.48, '0.4988'],
    ['Full pages, best step (Step 1)', 15.66, '0.3876'],
  ]
  return (
    <div className="panel">
      <h4>Patch scores flatter the model</h4>
      <div className="gap-pair">
        {rows.map(([label, v, s]) => (
          <div key={label}>
            <b>{v.toFixed(2)} <small>dB</small></b>
            <span>{label}</span>
            <em>SSIM {s}</em>
          </div>
        ))}
      </div>
      <p className="gap-callout"><b>≈ 6 dB</b> lost between 128 px training patches and the full 1460 × 2360 page.</p>
      <p className="chart-note">
        Full pages expose global context the patches never showed it, which is why every comparison on
        this site uses full-image, per-level results.
      </p>
    </div>
  )
}

export default {
  lede:
    'A compact Restormer trained only on in-domain data, with no pretraining, isolates the architecture from transfer learning. Its patch scores look strong, but full pages expose what it never learned. Sobel, Canny and Laplacian then probe whether character outlines survive restoration.',
  keyvals: [
    ['21.48 dB', 'Training-patch PSNR at epoch 120'],
    ['15.66 dB', 'Best full-image test PSNR (Step 1)'],
    ['≈ 6 dB', 'Gap between patch and full-image scores', 'loss'],
    ['0.9095', 'Sobel recall on restored edges'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'What does the Restormer architecture achieve on its own, with no borrowed knowledge?',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              Every other transformer result in the project starts from a pretrained checkpoint. This study
              strips that away: a Restormer with about a twentieth of the full model’s parameters, trained from random
              initialisation on all 20 HDC defocus steps.
            </p>
            <p>
              It is the only model evaluated across the full step range, which makes it the clearest picture
              of how quality falls as blur grows. The edge probe adds a second question PSNR cannot answer:
              are the character boundaries a recognizer needs actually there?
            </p>
          </div>
          <PatchGap />
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'The same MDTA and GDFN blocks as the full Restormer, scaled down to 1.18 M parameters.',
      body: <ModelDiagram id="scratch" />,
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
                ['Model', 'Base dim 16, blocks [2,2,2,2], heads [1,2,4,8]'],
                ['Parameters', '1,176,694'],
                ['Start', 'Random initialisation, no pretraining'],
                ['Optimiser', 'AdamW, LR 2×10⁻⁴, halved at epochs 50 and 100'],
                ['Loss', 'Charbonnier'],
                ['Epochs', '120'],
                ['Data', 'All 20 HDC steps, 1,180 pairs'],
                ['Split', '944 train / 236 test (80 / 20)'],
              ]}
            />
          </div>
          <Figure src={img('scratch_training.png')} caption="Training curves: Charbonnier loss, PSNR, SSIM and the StepLR schedule." />
        </div>
      ),
    },
    {
      id: 'results',
      nav: 'Results',
      title: 'Results across all 20 HDC steps',
      lead: 'Full-image test PSNR and SSIM per defocus step.',
      body: (
        <>
          <div className="two" style={{ alignItems: 'start' }}>
            <div className="panel">
              <h4>Full-image test PSNR and SSIM, Steps 0–19</h4>
              <Trend
                data={scratchSteps}
                xKey="step"
                xLabel="HDC defocus step"
                rightKey="ssim"
                digits={3}
                series={[
                  { key: 'psnr', name: 'PSNR (dB, left)', color: HEX.scratch },
                  { key: 'ssim', name: 'SSIM (right)', color: HEX.pre, dashed: true },
                ]}
              />
              <p className="chart-note">Step 1 is the peak; from there quality falls steadily, with a sharper drop after Step 15.</p>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Step</th><th className="num">PSNR (dB)</th><th className="num">SSIM</th></tr></thead>
                <tbody>
                  {scratchSteps.filter((r) => PICKED.includes(r.step)).map((r) => (
                    <tr key={r.step} className={r.step === 1 ? 'hl' : ''}>
                      <td>Step {r.step}</td>
                      <td className="num">{r.psnr.toFixed(2)}</td>
                      <td className="num">{r.ssim.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Figure className="spaced" src={img('scratch_all_levels.png')} caption="Notebook output: PSNR, SSIM and MSE for every step (steps sorted as strings, so 10–19 appear before 2)." />
        </>
      ),
    },
    {
      id: 'edges',
      nav: 'Edge probe',
      title: 'Edge probe: do the character outlines survive?',
      lead: 'Three classical edge detectors run on the restored output and scored against edges from the sharp page, averaged over all 20 steps.',
      body: (
        <>
          <div className="two" style={{ alignItems: 'start' }}>
            <div className="panel">
              <h4>Precision, recall and F1 by detector</h4>
              <GroupedBars data={edges} xKey="op" digits={3} domain={[0, 1]}
                series={[
                  { key: 'precision', name: 'Precision', color: HEX.pre },
                  { key: 'recall', name: 'Recall', color: HEX.scratch },
                  { key: 'f1', name: 'F1', color: HEX.ft },
                ]} />
              <p className="chart-note">Sobel floods the map with false positives; Canny gives the best balance.</p>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Detector</th><th className="num">Precision</th><th className="num">Recall</th><th className="num">F1</th><th className="num">PSNR</th><th className="num">SSIM</th></tr></thead>
                <tbody>
                  {edges.map((e) => (
                    <tr key={e.op} className={e.op === 'Canny' ? 'hl' : ''}>
                      <td>{e.op}</td>
                      <td className="num">{e.precision.toFixed(4)}</td>
                      <td className="num">{e.recall.toFixed(4)}</td>
                      <td className="num">{e.f1.toFixed(4)}</td>
                      <td className="num">{e.psnr.toFixed(2)}</td>
                      <td className="num">{e.ssim.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="chart-note" style={{ padding: '0 14px 12px' }}>PSNR and SSIM here compare each edge map with the edge map of the sharp page.</p>
            </div>
          </div>
          <div className="fig-row" style={{ marginTop: 24 }}>
            <Figure src={img('scratch_edge_maps.png')} caption="Restored output and the edge maps each detector extracts from it." />
            <Figure src={img('scratch_edge_metrics.png')} caption="Edge metrics across blur levels and the averaged Sobel, Canny and Laplacian comparison." />
          </div>
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
            'Pretraining carries real weight: without it, the architecture tops out at 15.66 dB on its easiest step.',
            'Patch metrics overstate real performance by about 6 dB, so comparisons must use full pages.',
            'Edge maps show which detail survives: Canny is the most balanced probe (F1 0.161).',
          ]}
          limits={[
            'A compact 1.18 M-parameter model, not the full 26 M Restormer.',
            'One 80/20 split across all steps, not per-level training.',
            'Learned edge detectors such as DexiNed have not been tried; OCR not run yet.',
          ]}
          next={[
            'Explore frequency-domain and multi-scale restoration strategies.',
            'Run DexiNed as a learned edge probe.',
            'Score the restored pages with OCR.',
          ]}
        />
      ),
    },
  ],
}
