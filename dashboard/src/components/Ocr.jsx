import { useState } from 'react'
import { SectionHead, Swatch } from './ui.jsx'
import { Trend } from './charts.jsx'
import { HEX, OCR_METHODS, mprnetOcr, nafnetOcr, ocrByLevel } from '../data/project.js'
import { modelHref } from '../data/models.js'

const REPO = 'https://github.com/SUSHILV-30/Recognition-Aware-Blind-Deblurring-for-Degraded-Text-Images'

const METRICS = {
  char: { label: 'Character accuracy', short: 'Character' },
  token: { label: 'Token accuracy', short: 'Token' },
}

function Cell({ value, metric, method }) {
  if (!value && method.own) {
    return <td className="ocr-cell pending own"><a href={modelHref(method.own)}>Own protocol</a></td>
  }
  if (!value) return <td className="ocr-cell pending">Not measured</td>
  const v = value[metric]
  return (
    <td className="ocr-cell" style={{ '--fill': `${v}%` }} title={`n = ${value.n}`}>
      <span>{v.toFixed(1)}%</span>
    </td>
  )
}

export default function Ocr() {
  const [metric, setMetric] = useState('char')
  const measured = OCR_METHODS.filter((m) => ocrByLevel.some((r) => r[m.key]))
  const pending = OCR_METHODS.filter((m) => !m.own && !ocrByLevel.some((r) => r[m.key]))

  const chartData = ocrByLevel.map((r) => {
    const row = { level: `L${r.level}` }
    for (const m of measured) row[m.key] = r[m.key] ? r[m.key][metric] : null
    return row
  })

  return (
    <section className="block" id="ocr">
      <div className="wrap">
        <SectionHead title="OCR: can the page actually be read?">
          PSNR and SSIM only say how close the pixels are. This is the test that matters for the
          project: run EasyOCR on each output and compare it with the text that was printed.
          Same reader, same scoring, every level.
        </SectionHead>

        <div className="cmp-toolbar">
          <div className="seg" role="tablist" aria-label="OCR metric">
            {Object.entries(METRICS).map(([k, m]) => (
              <button key={k} role="tab" aria-selected={k === metric} onClick={() => setMetric(k)}>{m.label}</button>
            ))}
          </div>
          <span className="small muted">Shading shows the score; hover a cell for its sample count</span>
        </div>

        <div className="table-scroll ocr-table">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                {OCR_METHODS.map((m) => (
                  <th key={m.key} className="num"><span className="method-cell"><Swatch color={m.color} />{m.label}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ocrByLevel.map((r) => (
                <tr key={r.level}>
                  <th scope="row">L{r.level}</th>
                  {OCR_METHODS.map((m) => <Cell key={m.key} value={r[m.key]} metric={metric} method={m} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="two" style={{ marginTop: 32, alignItems: 'start' }}>
          <div className="panel">
            <h4>{METRICS[metric].label} by blur level, %</h4>
            <Trend
              data={chartData}
              xKey="level"
              domain={[0, 100]}
              digits={1}
              series={measured.map((m) => ({ key: m.key, name: m.label, color: m.color, dashed: m.key === 'gt' }))}
            />
            <p className="chart-note">
              Lines only connect levels that have been measured. Fine-tuned Restormer OCR exists for
              Levels 5–6 so far.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 14 }}>How to read this</h3>
            <ul className="facts small">
              <li><b>Sharp ground truth</b> is the ceiling: OCR on the focused CAM01 capture. It is not 100% because the text is random characters (l/I, 0/O) with no words to fall back on.</li>
              <li><b>Blurred input</b> is the floor. OCR still reads Levels 1–2 well, drops to 66% at Level 3 and 20% at Level 4, and reads nothing from Level 5 on. That is where restoration starts to matter.</li>
              <li>At Levels 1–2 the blurred page scores slightly above the sharp one on the same 16 pages (94.1% vs 88.6%). Mild blur smooths sensor noise, while EasyOCR drops some thin serif strokes on the raw sharp capture.</li>
              <li><b>Token accuracy</b> counts whole 10-character strings. One wrong letter loses the token, so it falls much faster than character accuracy.</li>
              <li>Levels 1–4 are scored on every focusStep page with a text file (sharp captures exist for 16 pages at Levels 1–2). Levels 5–6 use the 40-page Phase 2 test split.</li>
            </ul>
            <div className="panel" style={{ marginTop: 20, borderLeft: `3px solid ${HEX.naf}` }}>
              <h4>NAFNet and MPRNet, scored separately</h4>
              <p className="small muted" style={{ margin: '6px 0 0' }}>
                NAFNet’s OCR is character error rate on its own 24 test pages at Levels 1–4 (4× downscaled,
                EasyOCR). At Level 4, CER falls from {nafnetOcr.cer[3].input.toFixed(2)}% on the blurred input to{' '}
                {nafnetOcr.cer[3].ft.toFixed(2)}%, and mean WER from {nafnetOcr.wer.input.toFixed(2)}% to{' '}
                {nafnetOcr.wer.ft.toFixed(1)}%. <a href={modelHref('nafnet')}>NAFNet OCR →</a>
              </p>
              <p className="small muted" style={{ margin: '10px 0 0' }}>
                MPRNet’s OCR is CER on 35 Times test pages at Levels 0–6 (EasyOCR, letters only). Fine-tuning lowers
                the mean CER from {mprnetOcr.run1.rows[1].mean.toFixed(1)}% to {mprnetOcr.run1.rows[3].mean.toFixed(1)}%,
                with the clearest gains at Levels 2–3. <a href={modelHref('mprnet')}>MPRNet OCR →</a>
              </p>
            </div>
            <div className="panel" style={{ marginTop: 16 }}>
              <h4>Waiting for results</h4>
              <p className="small muted" style={{ margin: '6px 0 12px' }}>
                Columns are ready for these models. Their OCR has not been run yet:
              </p>
              <div className="pending-list">
                {pending.map((m) => (
                  <span key={m.key} className="method-cell pill"><Swatch color={m.color} />{m.label}</span>
                ))}
                <span className="method-cell pill"><Swatch color={HEX.ft} />Restormer, fine-tuned (L1–4)</span>
              </div>
              <p className="small muted" style={{ margin: '12px 0 0' }}>
                Score any model’s restored pages with <code>Restormer Fine Tuned/scripts/ocr_eval.py --restored "Name=folder"</code>.
                Full tables: <a href={`${REPO}/blob/main/Restormer%20Fine%20Tuned/OCR_RESULTS.md`}>OCR_RESULTS.md</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
