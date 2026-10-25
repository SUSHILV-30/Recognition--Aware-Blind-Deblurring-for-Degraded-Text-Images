import { Figure, SectionHead } from './ui.jsx'
import { img } from '../data/project.js'

export default function Pipeline() {
  return (
    <section className="block" id="method">
      <div className="wrap">
        <SectionHead title="The method behind every model">
          The physics of the degradation, the loss the project is building toward, and the one design
          detail that decides how a pretrained model fails on text it has never seen.
        </SectionHead>

        <div className="two">
          <div className="panel">
            <h3>Physical degradation model</h3>
            <div className="eq">
              <i>y</i> = ( <i>D</i><sub>K1,K2</sub>( <i>x</i> − <i>y</i><sub>0</sub> ) ∗ <i>k</i><sub>B</sub> + <i>y</i><sub>0</sub> ) ⊙ <i>η</i>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              <i>x</i> is the sharp page, <i>k</i><sub>B</sub> the PSF (a learnable, softmax-normalised
              kernel), <i>y</i><sub>0</sub> the background level and <i>η</i> sensor noise. Radial distortion
              is <i>D</i>(<i>p</i>) = <i>p</i>(1 + K1<i>r</i>² + K2<i>r</i>⁴). The physics-informed study estimates
              all of this per level.
            </p>
          </div>
          <div className="panel">
            <h3>Recognition-aware loss</h3>
            <div className="eq">
              <i>L</i><sub>total</sub> = λ<sub>1</sub> <i>L</i><sub>CTC</sub> + λ<sub>2</sub> <i>L</i><sub>Charbonnier</sub>, &nbsp;λ<sub>1</sub> &gt; λ<sub>2</sub>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              Pixel loss can drop by averaging toward a blurry mean that erases the detail separating
              “e” from “c”. A CTC loss is only low when characters are distinguishable, so it pushes the
              deblurring network toward output a recognizer can read. RABD is formulated; its end-to-end
              CER/WER evaluation is the next step.
            </p>
          </div>
        </div>

        <div className="two" style={{ marginTop: 32, alignItems: 'start' }}>
          <div className="panel">
            <h3>Three ways a network anchors to its input</h3>
            <div className="eq" style={{ fontSize: 18 }}>Î = I + R(I)</div>
            <p className="small muted">Restormer: a global residual. A miscalibrated branch still leaves the output near the input.</p>
            <div className="eq" style={{ fontSize: 18 }}>F<sub>n+1</sub> = F<sub>n</sub> ⊙ σ(conv(ŷ<sub>n</sub>))</div>
            <p className="small muted">MPRNet: supervised attention computed from each stage’s own prediction.</p>
            <div className="eq" style={{ fontSize: 18 }}>SimpleGate(X) = X<sub>1</sub> ⊙ X<sub>2</sub></div>
            <p className="small muted" style={{ margin: 0 }}>NAFNet variant: no global residual, so nothing pulls an untuned model back toward the input.</p>
          </div>
          <Figure
            src={img('diffusion_architecture.png')}
            caption="Proposed next iteration: a conditional diffusion restorer in the deblurring slot, followed by the same OCR tail."
          />
        </div>
      </div>
    </section>
  )
}
