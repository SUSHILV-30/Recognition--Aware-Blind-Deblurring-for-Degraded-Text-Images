import { useState } from 'react'
import { SectionHead, Swatch, useLightbox } from './ui.jsx'
import { Trend } from './charts.jsx'
import { HEX, gridMethods, gridSamples, img, mprnetFt, nafnet, restormerFt } from '../data/project.js'
import { modelHref } from '../data/models.js'

const crossLevel = ['L0', 'L1', 'L2', 'L3', 'L4'].map((level) => ({
  level,
  input: restormerFt.find((r) => r.level === level)?.input ?? null,
  ft: restormerFt.find((r) => r.level === level)?.ft ?? null,
  naf: nafnet.find((r) => r.level === level)?.ftPsnr ?? null,
  mpr: mprnetFt.find((r) => r.level === level)?.ftPsnr ?? null,
}))

// How each study scored its outputs. Differences here are why the numbers above are trends, not a ranking.
const PROTOCOLS = [
  ['Restormer, fine-tuned', HEX.ft, 'restormer', 'Full image, tiled', 'L1–4 focusStep; L5–6: 40 pages per level', 'EasyOCR, character and token accuracy'],
  ['NAFNet, fine-tuned', HEX.naf, 'nafnet', '4× downscaled, percentile-normalised, shift-aligned', '24 pairs (6 per level), split by sample ID', 'EasyOCR, CER and WER'],
  ['MPRNet, fine-tuned', HEX.mpr, 'mprnet', 'Full resolution, 512 × 1024 centre crop, min-max scaled', '35 Times images (5 per level), random split', 'EasyOCR letters-only, CER'],
  ['Restormer from scratch', HEX.scratch, 'scratch', 'Full image', '236 test pairs across 20 steps', 'Not run'],
  ['HDC U-Net', HEX.hdc, 'physics', 'Full image, per-level model', 'L5–6 per level; L9–13: 2 samples per level', 'Tesseract 5.5.3, CER and WER (L9–13)'],
]

const TABLE = [
  ['Restormer, fine-tuned', HEX.ft, 'L1 → L4, fine-tuned', '24.88 → 15.24', 'SSIM up at every level', 'restormer'],
  ['Restormer, fine-tuned', HEX.ft, 'Level 5, fine-tuned', '21.98', '0.582', 'restormer'],
  ['NAFNet, fine-tuned', HEX.naf, 'L1 → L4, 4× downscaled', '29.83 → 18.53', '0.876 → 0.791', 'nafnet'],
  ['MPRNet, fine-tuned', HEX.mpr, 'L0 → L6, 35 Times images', '16.93 → 11.64', '0.558 → 0.400', 'mprnet'],
  ['MPRNet, zero-shot (earlier)', HEX.mpr, 'L0 → L4, 40 images', '22.12 → 12.93', '0.514 → 0.334', 'mprnet'],
  ['MPRNet on GoPro', HEX.mpr, 'Published, motion blur', '32.66', '0.959', 'mprnet'],
  ['Restormer from scratch', HEX.scratch, 'Steps 0–19, full image', '8.37 – 15.66', '0.207 – 0.388', 'scratch'],
  ['HDC physics U-Net', HEX.hdc, 'Level 5, fine-tuned', '17.43', '0.589', 'physics'],
  ['HDC U-Net + diffusion', HEX.hdc, 'L9–13, 8 samples', '20.99 – 23.88', '—', 'physics'],
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
              domain={[10, 32]}
              series={[
                { key: 'input', name: 'Blurred input', color: HEX.input, dashed: true },
                { key: 'ft', name: 'Restormer FT', color: HEX.ft },
                { key: 'naf', name: 'NAFNet FT', color: HEX.naf },
                { key: 'mpr', name: 'MPRNet FT', color: HEX.mpr },
              ]}
            />
            <p className="chart-note">
              Each study used its own sample counts and splits, and NAFNet is scored on 4× downscaled
              images against its own blurred input (24.70 → 15.19 dB), so read these lines as trends within
              a study rather than a strict ranking.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: 12 }}>Consolidated results</h4>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Method</th><th>Scope</th><th className="num">PSNR (dB)</th><th className="num">SSIM</th></tr></thead>
                <tbody>
                  {TABLE.map(([m, c, scope, p, s, id]) => (
                    <tr key={m + scope}>
                      <td><a className="method-cell row-link" href={modelHref(id)}><Swatch color={c} />{m}</a></td>
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

        <h4 style={{ margin: '40px 0 12px' }}>How each study was scored</h4>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Model</th><th>Images scored</th><th>Test set</th><th>OCR</th></tr></thead>
            <tbody>
              {PROTOCOLS.map(([m, c, id, res, test, ocr]) => (
                <tr key={m}>
                  <td><a className="method-cell row-link" href={modelHref(id)}><Swatch color={c} />{m}</a></td>
                  <td style={{ whiteSpace: 'normal' }}>{res}</td>
                  <td style={{ whiteSpace: 'normal' }}>{test}</td>
                  <td style={{ whiteSpace: 'normal' }}>{ocr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="chart-note">
          The same Level 1 blurred input scores 24.70 dB in the NAFNet pipeline and 16.99 dB in the MPRNet one. A
          shared pipeline and a common test set are needed before these studies can be ranked against each other.
        </p>
      </div>
    </section>
  )
}
