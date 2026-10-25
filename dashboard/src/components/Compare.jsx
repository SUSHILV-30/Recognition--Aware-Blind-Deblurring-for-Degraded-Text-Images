import { useState } from 'react'
import { SectionHead, Swatch, useLightbox } from './ui.jsx'
import { Trend } from './charts.jsx'
import { HEX, gridMethods, gridSamples, img, mprnet, nafnet, restormerFt } from '../data/project.js'

const crossLevel = ['L0', 'L1', 'L2', 'L3', 'L4'].map((level) => ({
  level,
  input: restormerFt.find((r) => r.level === level)?.input ?? null,
  ft: restormerFt.find((r) => r.level === level)?.ft ?? null,
  naf: nafnet.find((r) => r.level === level)?.ftPsnr ?? null,
  mpr: mprnet.find((r) => r.level === level)?.psnr ?? null,
}))

const TABLE = [
  ['Restormer, fine-tuned', HEX.ft, 'L1 → L4, fine-tuned', '24.88 → 15.24', 'SSIM up at every level'],
  ['NAFNet, fine-tuned', HEX.naf, 'L1 → L4, fine-tuned', '12.59 → 13.06', '0.489 → 0.501'],
  ['MPRNet, zero-shot', HEX.mpr, 'L0 → L4, 40 images', '22.12 → 12.93', '0.514 → 0.334'],
  ['MPRNet on GoPro', HEX.mpr, 'Published, motion blur', '32.66', '0.959'],
  ['Restormer from scratch', HEX.scratch, 'Steps 0–19, full image', '8.37 – 15.66', '0.207 – 0.388'],
  ['HDC physics U-Net', HEX.hdc, 'Level 5, fine-tuned', '17.43', '0.589'],
  ['Restormer, Phase 2', HEX.ft, 'Level 5, fine-tuned', '21.98', '0.582'],
]

function Grid() {
  const [level, setLevel] = useState(1)
  const open = useLightbox()
  return (
    <>
      <div className="cmp-toolbar">
        <div className="seg" role="tablist" aria-label="Defocus level">
          {[1, 2, 3, 4].map((l) => (
            <button key={l} role="tab" aria-selected={l === level} onClick={() => setLevel(l)}>Level {l}</button>
          ))}
        </div>
        <span className="small muted">{gridSamples[level]}</span>
      </div>
      <div className="cmp-grid">
        {gridMethods.map((m) => {
          const src = img(`grid/L${level}_${m.key}.jpg`)
          const caption = `Level ${level}, ${m.label}`
          return (
            <figure key={m.key} className={`tile ${m.key === 'gt' ? 'gt' : ''}`}>
              <button type="button" onClick={() => open(src, caption)} aria-label={`Enlarge ${caption}`}>
                <img src={src} alt={caption} loading="lazy" />
              </button>
              <figcaption><Swatch color={m.color} />{m.label}</figcaption>
            </figure>
          )
        })}
      </div>
    </>
  )
}

export default function Compare() {
  return (
    <section className="block" id="compare">
      <div className="wrap">
        <SectionHead title="Every model on the same page">
          The same four focusStep samples, one per level, run through every restoration method. Pick a
          level and read across: fine-tuned Restormer is sharpest at Levels 1–2, while the much smaller
          physics-informed U-Net holds up best as the blur grows.
        </SectionHead>

        <Grid />

        <div className="two" style={{ marginTop: 48, alignItems: 'start' }}>
          <div className="panel">
            <h4>PSNR by focusStep level, dB</h4>
            <Trend
              data={crossLevel}
              xKey="level"
              domain={[10, 26]}
              series={[
                { key: 'input', name: 'Blurred input', color: HEX.input, dashed: true },
                { key: 'ft', name: 'Restormer FT', color: HEX.ft },
                { key: 'naf', name: 'NAFNet FT', color: HEX.naf },
                { key: 'mpr', name: 'MPRNet zero-shot', color: HEX.mpr },
              ]}
            />
            <p className="chart-note">
              Each study used its own sample counts and splits, so read these lines as trends within a
              study rather than a strict ranking.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: 12 }}>Consolidated results</h4>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Method</th><th>Scope</th><th className="num">PSNR (dB)</th><th className="num">SSIM</th></tr></thead>
                <tbody>
                  {TABLE.map(([m, c, scope, p, s]) => (
                    <tr key={m + scope}>
                      <td><span className="method-cell"><Swatch color={c} />{m}</span></td>
                      <td className="muted">{scope}</td>
                      <td className="num">{p}</td>
                      <td className="num">{s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
