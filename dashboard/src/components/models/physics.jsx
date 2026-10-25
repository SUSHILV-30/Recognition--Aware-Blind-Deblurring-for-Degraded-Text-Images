import { Figure } from '../ui.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { Setup, Takeaways } from '../modelkit.jsx'
import { img } from '../../data/project.js'

const LEVEL_ROWS = [
  ['L0–4', 'Validation loss 0.0209 (L1) to 0.0606 (L4)', 'ok', 'Complete'],
  ['L5', '17.43 dB / 0.589 SSIM, up from 15.95 dB', 'ok', 'Complete'],
  ['L6', '14.20 dB / 0.579 SSIM', 'part', 'Pretrain only'],
  ['L7–9', 'Pipeline built, training runs pending', '', 'Pending'],
]

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
    'A replication of the HDC 2021 winning approach. Instead of asking a generic network to invert an unknown blur, it estimates the camera’s own blur and distortion, then trains a purely convolutional U-Net on data generated from that estimate. Each model is valid only for the level it was calibrated on.',
  keyvals: [
    ['17.43 dB', 'Level 5 PSNR after fine-tuning, SSIM 0.589', 'gain'],
    ['+1.48 dB', 'Level 5 gain from fine-tuning (15.95 → 17.43)', 'gain'],
    ['0.0209', 'Best validation loss, Level 1'],
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
      id: 'takeaways',
      nav: 'Takeaways',
      title: 'Takeaways',
      body: (
        <Takeaways
          shows={[
            'Matching the data beats a bigger network: 17.43 dB at Level 5 versus 15.66 dB for the from-scratch Restormer on its easiest step.',
            'In the same-sample grid it holds up best of all models as the blur grows.',
            'The calibrated PSF and distortion follow optics, so the synthetic data can be trusted.',
          ]}
          limits={[
            'One model per blur level; nothing transfers between levels.',
            'The synthetic PSF ignores astigmatism and coma.',
            'Level 6 is pretrain-only and Levels 7–9 have not been trained.',
          ]}
          next={[
            'Train Levels 6–9; the code already exists.',
            'Try a single level-conditioned U-Net across levels.',
            'Score the restored pages with OCR.',
          ]}
        />
      ),
    },
  ],
}
