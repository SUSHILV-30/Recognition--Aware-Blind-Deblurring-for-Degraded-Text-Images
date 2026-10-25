import { Figure, fmtDelta } from '../ui.jsx'
import { GroupedBars } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { LevelFigures, Setup, Takeaways } from '../modelkit.jsx'
import { HEX, img, nafnet } from '../../data/project.js'

function Results() {
  return (
    <>
      <div className="two">
        <div className="panel">
          <h4>PSNR, pretrained vs fine-tuned (dB)</h4>
          <GroupedBars data={nafnet} xKey="level" labels domain={[0, 18]}
            series={[{ key: 'prePsnr', name: 'Pretrained', color: HEX.pre }, { key: 'ftPsnr', name: 'Fine-tuned', color: HEX.naf }]} />
          <p className="chart-note">Untuned, the model sits at 5.3–5.6 dB, below the raw blurred input.</p>
        </div>
        <div className="panel">
          <h4>SSIM, pretrained vs fine-tuned</h4>
          <GroupedBars data={nafnet} xKey="level" labels digits={3} domain={[0, 0.6]}
            series={[{ key: 'preSsim', name: 'Pretrained', color: HEX.pre }, { key: 'ftSsim', name: 'Fine-tuned', color: HEX.naf }]} />
          <p className="chart-note">SSIM rises by 0.19–0.22 at every level after fine-tuning.</p>
        </div>
      </div>

      <div className="table-scroll" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th className="num">Pretrained PSNR</th><th className="num">Fine-tuned PSNR</th><th className="num">Δ PSNR</th>
              <th className="num">Pretrained SSIM</th><th className="num">Fine-tuned SSIM</th><th className="num">Δ SSIM</th>
            </tr>
          </thead>
          <tbody>
            {nafnet.map((r) => (
              <tr key={r.level} className={r.level === 'L3' ? 'hl' : ''}>
                <td>{r.level}</td>
                <td className="num">{r.prePsnr.toFixed(2)}</td>
                <td className="num">{r.ftPsnr.toFixed(2)}</td>
                <td className="num delta-pos">{fmtDelta(r.ftPsnr - r.prePsnr)}</td>
                <td className="num">{r.preSsim.toFixed(3)}</td>
                <td className="num">{r.ftSsim.toFixed(3)}</td>
                <td className="num delta-pos">{fmtDelta(r.ftSsim - r.preSsim, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-note">Level 3 has both the largest PSNR gain (+9.63 dB) and the largest SSIM gain (+0.211).</p>
    </>
  )
}

export default {
  lede:
    'NAFNet removes nonlinear activations entirely, replacing them with SimpleGate and Simplified Channel Attention. This single-resolution variant has no global residual, so the untuned model has nothing anchoring it to the input and collapses. Fine-tuned on text, that same direct mapping produces the largest gain of any model in the project.',
  keyvals: [
    ['5.3–5.6 dB', 'Untuned PSNR, below the raw input', 'loss'],
    ['+9.63 dB', 'Largest gain, Level 3 (15.26 dB)', 'gain'],
    ['+0.211', 'Largest SSIM gain, Level 3', 'gain'],
    ['+7.68 dB', 'Gain still holds at Level 4', 'gain'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'The cleanest before-and-after in the project: the same weights, untuned and tuned.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              NAFNet starts from a natural-image checkpoint, like Restormer, but the variant used here keeps
              every NAFBlock at a single resolution and drops the global residual connection of the full
              multi-scale model.
            </p>
            <p>
              That design choice decides how it fails. Without a residual, a model whose features do not
              match the input domain has no reason to stay close to the input, and the output collapses to
              5.3–5.6 dB. Once every parameter is fine-tuned on focusStep text, the same direct mapping
              recovers more than any other model.
            </p>
          </div>
          <div className="contrast">
            <div className="contrast-side bad">
              <small>Pretrained</small>
              <b>5.33–5.63 dB</b>
              <span>SSIM 0.281–0.296</span>
            </div>
            <div className="contrast-arrow" aria-hidden="true">→</div>
            <div className="contrast-side good">
              <small>Fine-tuned</small>
              <b>12.59–15.26 dB</b>
              <span>SSIM 0.482–0.507</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'A stem convolution, a stack of NAFBlocks at one resolution, and an output convolution.',
      body: (
        <>
          <ModelDiagram id="nafnet" />
          <div className="two" style={{ marginTop: 24 }}>
            <Figure src={img('nafnet_pipeline.png')} caption="Fine-tuned variant: stem convolution, NAFBlock body at one resolution, output convolution." />
            <Figure src={img('nafnet_block.png')} caption="Inside a NAFBlock: LayerNorm, depthwise conv, SimpleGate and SCA." />
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
                ['Start', 'Natural-image pretrained checkpoint'],
                ['Trained', 'All parameters'],
                ['Optimiser', 'AdamW, LR 10⁻⁴'],
                ['Loss', 'L1'],
                ['Precision', 'Automatic mixed precision'],
                ['Crops', '256 × 256 px'],
                ['Epochs', 'Up to 50'],
                ['Data', 'focusStep Levels 1–4, 495 pairs'],
                ['Inference', 'Tiled overlap-add on full pages'],
              ]}
            />
          </div>
          <div className="panel">
            <h4>Why full fine-tuning here</h4>
            <p className="small muted">
              Restormer can keep its encoder frozen because its global residual already keeps outputs near the
              input. NAFNet has no such anchor, so the whole network has to learn the new domain, trained end to
              end on 495 pairs with 256 px crops.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'results',
      nav: 'Results',
      title: 'Results on focusStep Levels 1–4',
      lead: 'Full-image PSNR and SSIM, pretrained versus fine-tuned, per level.',
      body: <Results />,
    },
    {
      id: 'samples',
      nav: 'Samples',
      title: 'Sample outputs',
      lead: 'Input, pretrained, fine-tuned and ground truth. Click any image to enlarge it.',
      body: (
        <LevelFigures
          levels={[1, 2, 3, 4].map((n) => ({
            label: `Level ${n}`,
            src: img(`nafnet_L${n}.png`),
            caption: n === 4
              ? 'Level 4: the fine-tuned output stays legible at the hardest focusStep level.'
              : `Level ${n}: input, pretrained, fine-tuned, ground truth.`,
            meta: `Fine-tuned ${nafnet[n - 1].ftPsnr.toFixed(2)} dB, SSIM ${nafnet[n - 1].ftSsim.toFixed(3)}`,
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
            'The domain-shift penalty depends on architecture: without a global residual, the untuned model collapses below the input.',
            'With fine-tuning the same network gains +7.2 to +9.6 dB, the largest gains in the project.',
            'Fine-tuned PSNR stays flat across levels (12.6–15.3 dB) rather than falling with blur.',
          ]}
          limits={[
            'Absolute PSNR stays below fine-tuned Restormer at every focusStep level.',
            'Evaluated only on focusStep Levels 1–4.',
            'OCR has not been run on NAFNet outputs yet.',
          ]}
          next={[
            'Rebuild NAFNet with a global residual as a direct test of the anchoring hypothesis.',
            'Score the restored pages with OCR.',
            'Investigate the full multi-scale NAFNet architecture.',
          ]}
        />
      ),
    },
  ],
}
