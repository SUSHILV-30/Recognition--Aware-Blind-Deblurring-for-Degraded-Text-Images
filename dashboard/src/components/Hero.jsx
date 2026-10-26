import { useState } from 'react'
import { scratchSteps } from '../data/project.js'

const SAMPLES = {
  times: ['eztDypfM4P', 'kYr9bmtdtg', 'CiTC3n3MDu'],
  verdana: ['PH8KfUpLrA', 'fufyG6udMG', 's8s X7gP2y'],
}

// Blur radius grows with the defocus step, the way the PSF widens in HDC 2021.
const blurFor = (step) => (step === 0 ? 0.35 : 0.35 + step * 0.62)

function FocusSpecimen() {
  const [step, setStep] = useState(6)
  const [font, setFont] = useState('times')
  const row = scratchSteps[step]

  return (
    <div className="specimen">
      <div className="specimen-page">
        <span className="specimen-tag">
          {font === 'times' ? 'timesR' : 'verdanaRef'}, 30 pt, step {step}
        </span>
        <div
          className={`specimen-text ${font === 'verdana' ? 'verdana' : ''}`}
          style={{ filter: `blur(${blurFor(step).toFixed(2)}px)` }}
          aria-hidden="true"
        >
          {SAMPLES[font].map((l) => <div key={l}>{l}</div>)}
        </div>
      </div>
      <div className="specimen-controls">
        <div className="focus-row">
          <label htmlFor="focus">Defocus step</label>
          <input
            id="focus"
            type="range"
            min="0"
            max="19"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
          />
          <output htmlFor="focus">{step} / 19</output>
        </div>
        <div className="specimen-readout">
          <span>
            From-scratch Restormer at this step: <strong>{row.psnr.toFixed(2)} dB</strong>, SSIM <strong>{row.ssim.toFixed(3)}</strong>
          </span>
          <div className="seg" role="group" aria-label="Font">
            <button type="button" aria-pressed={font === 'times'} onClick={() => setFont('times')}>Times</button>
            <button type="button" aria-pressed={font === 'verdana'} onClick={() => setFont('verdana')}>Verdana</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <>
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div>
            <h1>Recognition-aware blind deblurring for degraded text images</h1>
            <p className="lede">
              Five restoration models, one benchmark of out-of-focus printed text, and a single
              question: what does it take to make a defocused page readable again?
            </p>
            <dl className="hero-meta">
              <div><dt>Team</dt><dd>Team 48, five members</dd></div>
              <div><dt>Guide</dt><dd>Dr. Padmavathi S.</dd></div>
              <div><dt>Institution</dt><dd>Amrita Vishwa Vidyapeetham, Coimbatore</dd></div>
            </dl>
          </div>
          <FocusSpecimen />
        </div>
      </header>

      <div className="strip">
        <div className="wrap">
          <div className="stat"><b className="gain">96.9%</b><span>OCR character accuracy at blur Level 5 after fine-tuning, up from 0%</span></div>
          <div className="stat"><b className="gain">+6.63 dB</b><span>PSNR gain over the blurred input at Level 5 (15.35 → 21.98 dB)</span></div>
          <div className="stat"><b>60.9 → 7.8%</b><span>OCR character error rate at Level 4 after NAFNet fine-tuning</span></div>
          <div className="stat"><b>15.55 dB</b><span>Domain-shift penalty for zero-shot MPRNet moving from GoPro to defocused text</span></div>
        </div>
      </div>
    </>
  )
}
