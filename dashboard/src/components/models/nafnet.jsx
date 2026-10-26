import { Figure, Swatch, fmtDelta } from '../ui.jsx'
import { GroupedBars } from '../charts.jsx'
import { ModelDiagram } from '../diagrams.jsx'
import { Setup, Takeaways } from '../modelkit.jsx'
import { HEX, img, nafnet, nafnetLegacyPre, nafnetOcr } from '../../data/project.js'

// Every number on this page comes from nafnet-6levels.ipynb, as reported in
// "NAFNet (fine-tuned): Responses to the Editor's Queries".

const SERIES_PSNR = [
  { key: 'inputPsnr', name: 'Blurred input', color: HEX.input },
  { key: 'prePsnr', name: 'Pretrained (zero-shot)', color: HEX.pre },
  { key: 'ftPsnr', name: 'Fine-tuned', color: HEX.naf },
]
const SERIES_SSIM = [
  { key: 'inputSsim', name: 'Blurred input', color: HEX.input },
  { key: 'preSsim', name: 'Pretrained (zero-shot)', color: HEX.pre },
  { key: 'ftSsim', name: 'Fine-tuned', color: HEX.naf },
]

function Results() {
  return (
    <>
      <div className="two">
        <div className="panel">
          <h4>PSNR by level, dB</h4>
          <GroupedBars data={nafnet} xKey="level" labels domain={[10, 32]} series={SERIES_PSNR} />
          <p className="chart-note">Fine-tuned PSNR is above the blurred input at every level, by 3.34–5.13 dB.</p>
        </div>
        <div className="panel">
          <h4>SSIM by level</h4>
          <GroupedBars data={nafnet} xKey="level" labels digits={3} domain={[0.4, 0.92]} series={SERIES_SSIM} />
          <p className="chart-note">The SSIM gain grows with blur, from +0.052 at Level 1 to +0.200 at Level 4.</p>
        </div>
      </div>

      <div className="table-scroll" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th className="num">Input PSNR</th><th className="num">Pretrained</th><th className="num">Fine-tuned</th><th className="num">Δ vs input</th>
              <th className="num">Input SSIM</th><th className="num">Pretrained</th><th className="num">Fine-tuned</th><th className="num">Δ vs input</th>
            </tr>
          </thead>
          <tbody>
            {nafnet.map((r) => (
              <tr key={r.level}>
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
        All three rows are scored on the same 24 test images with the same code, after 4× area downscaling,
        percentile normalisation and shift alignment. These values are not directly comparable with models
        evaluated at full resolution.
      </p>
    </>
  )
}

function ZeroShot() {
  return (
    <div className="audit">
      <div className="panel">
        <h4>Pretrained weights, no fine-tuning</h4>
        <div className="table-scroll" style={{ border: 0 }}>
          <table>
            <thead><tr><th>Level</th><th className="num">Input</th><th className="num">Pretrained</th><th className="num">Δ PSNR</th><th className="num">Input SSIM</th><th className="num">Pretrained SSIM</th></tr></thead>
            <tbody>
              {nafnet.map((r) => {
                const d = r.prePsnr - r.inputPsnr
                return (
                  <tr key={r.level}>
                    <td>{r.level}</td>
                    <td className="num">{r.inputPsnr.toFixed(2)}</td>
                    <td className="num">{r.prePsnr.toFixed(2)}</td>
                    <td className={`num ${d >= 0 ? 'delta-pos' : 'delta-neg'}`}>{fmtDelta(d)}</td>
                    <td className="num">{r.inputSsim.toFixed(3)}</td>
                    <td className="num">{r.preSsim.toFixed(3)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="chart-note">
          Loaded correctly, the GoPro weights stay within 0.3 dB of the input at Levels 1–3 and lose 1.29 dB at
          Level 4. Without fine-tuning the model barely changes the page.
        </p>
      </div>
      <div className="panel">
        <h4>What happened to the earlier 5.33–5.63 dB result</h4>
        <p className="small muted">
          An earlier version of this study used a single-scale variant whose “pretrained” scores lay far below
          the blurred input. The audit found that the checkpoint is the official NAFNet-GoPro-width32 weights,
          inputs are replicated to three channels, outputs are clipped to [0, 1], and the evaluation code
          reproduces the blurred-input PSNR.
        </p>
        <div className="contrast">
          <div className="contrast-side bad">
            <small>Single-scale variant</small>
            <b>{nafnetLegacyPre}</b>
            <span>Checkpoint and model did not match</span>
          </div>
          <div className="contrast-arrow" aria-hidden="true">→</div>
          <div className="contrast-side good">
            <small>Matching multi-scale model</small>
            <b>13.90–24.92 dB</b>
            <span>Strict key match, near the input</span>
          </div>
        </div>
        <p className="chart-note">
          The earlier values are attributed to a mismatch between the checkpoint and the single-scale variant.
          The specific mismatched layers were not isolated, and the earlier row is not used for any conclusion.
          Very low scores can still be genuine at strong defocus: the correctly loaded model reaches 3.95–5.03 dB
          (SSIM about 0.004) at the paper’s Levels 6–9.
        </p>
      </div>
    </div>
  )
}

function Ocr() {
  const rows = [
    { key: 'gt', label: 'Sharp ground truth', color: HEX.gt },
    { key: 'input', label: 'Blurred input', color: HEX.input },
    { key: 'ft', label: 'NAFNet, fine-tuned', color: HEX.naf },
  ]
  return (
    <div className="two" style={{ alignItems: 'start' }}>
      <div className="panel">
        <h4>Character error rate by level, % (lower is better)</h4>
        <GroupedBars
          data={nafnetOcr.cer}
          xKey="level"
          labels
          domain={[0, 70]}
          series={rows.map((r) => ({ key: r.key, name: r.label, color: r.color }))}
        />
        <p className="chart-note">The largest gain is at Level 4, where CER drops from 60.94% to 7.81%.</p>
      </div>
      <div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Method</th><th className="num">CER L1</th><th className="num">L2</th><th className="num">L3</th><th className="num">L4</th><th className="num">Mean WER</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={r.key === 'ft' ? 'hl' : ''}>
                  <td><span className="method-cell"><Swatch color={r.color} />{r.label}</span></td>
                  {nafnetOcr.cer.map((c) => <td key={c.level} className="num">{c[r.key].toFixed(2)}</td>)}
                  <td className="num">{nafnetOcr.wer[r.key].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="facts small" style={{ marginTop: 18 }}>
          <li>EasyOCR on the same 24 test images. CER is per level; WER is the mean over Levels 1–4.</li>
          <li>PSNR and CER disagree at Level 1: PSNR rises by 5.13 dB while CER goes from 4.69% to 7.81%.</li>
          <li>The sharp row is not a strict lower bound. The blurred input beats it at Levels 1–2, and NAFNet’s mean WER (50.0%) is below it (67.5%).</li>
          <li>With 6 images per level these OCR scores are noisy.</li>
        </ul>
      </div>
    </div>
  )
}

export default {
  lede:
    'NAFNet is a U-shaped CNN with no nonlinear activations: SimpleGate and Simplified Channel Attention replace them. This study fine-tunes the published multi-scale NAFNet-GoPro-width32, about 17.1 M parameters with a global residual, on the training pairs of all ten focusStep steps, then evaluates on Levels 1–4.',
  keyvals: [
    ['29.83 dB', 'Fine-tuned PSNR at Level 1, SSIM 0.876', 'gain'],
    ['+5.13 dB', 'Gain over the blurred input, Level 1', 'gain'],
    ['60.9 → 7.8%', 'Character error rate at Level 4', 'gain'],
    ['≤ 1.3 dB', 'Change from the input, zero-shot'],
  ],
  sections: [
    {
      id: 'overview',
      nav: 'Overview',
      title: 'Overview',
      lead: 'Fine-tuning improves both PSNR and SSIM at every level, and the gain in readability is largest where the blur is worst.',
      body: (
        <div className="two" style={{ alignItems: 'start' }}>
          <div className="prose">
            <p>
              The published GoPro weights were trained for motion blur. Applied to defocused text without
              any tuning, the correctly loaded model barely changes the page: it stays within 0.3 dB of the
              input at Levels 1–3 and loses 1.29 dB at Level 4.
            </p>
            <p>
              Fine-tuning every parameter on focusStep text lifts PSNR to 18.53–29.83 dB and SSIM to
              0.791–0.876, above the blurred input at every level. On the same test pages, EasyOCR’s
              character error rate at Level 4 falls from 60.94% to 7.81%.
            </p>
            <p className="small muted">
              This replaces an earlier single-scale result. The fine-tuned 12.59–15.26 dB figures came from
              that older model and are no longer used.
            </p>
          </div>
          <div className="contrast">
            <div className="contrast-side bad">
              <small>Blurred input</small>
              <b>15.19–24.70 dB</b>
              <span>SSIM 0.591–0.824</span>
            </div>
            <div className="contrast-arrow" aria-hidden="true">→</div>
            <div className="contrast-side good">
              <small>Fine-tuned</small>
              <b>18.53–29.83 dB</b>
              <span>SSIM 0.791–0.876</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'architecture',
      nav: 'Architecture',
      title: 'Architecture',
      lead: 'Four encoder levels, a middle block and four decoder levels of NAFBlocks, joined by additive skips and a global residual.',
      body: (
        <>
          <ModelDiagram id="nafnet" />
          <Figure className="spaced" src={img('nafnet_block.png')} caption="Inside a NAFBlock: LayerNorm, depthwise conv, SimpleGate and SCA." />
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
                  <thead><tr><th>Scope</th><th className="num">Pairs</th><th className="num">Train</th><th className="num">Test</th></tr></thead>
                  <tbody>
                    <tr><td style={{ whiteSpace: 'normal' }}>Levels 1–4 (focusStep 1–4)</td><td className="num">160</td><td className="num">136</td><td className="num">24</td></tr>
                    <tr><td style={{ whiteSpace: 'normal' }}>All ten steps used for training (focusStep 0–9)</td><td className="num">400</td><td className="num">340</td><td className="num">60</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="chart-note">
                Split by sample ID, with no random seed. Within each level and font, the 20 pairs are sorted by
                sample number and the last 3 are held out: 17 train and 3 test, so 6 test images per level. Only
                pairs with a ground-truth transcription are used.
              </p>
            </div>
            <div className="panel">
              <h4>How the images are scored</h4>
              <Setup
                rows={[
                  ['Resolution', '4× area-downscaled, not full resolution'],
                  ['Normalisation', 'Per image, by its 0.5 and 99.5 percentiles'],
                  ['Alignment', 'Sharp image aligned by an integer shift, at most 60 px at full resolution'],
                  ['Channels', 'Gray replicated to 3 channels; output clipped to [0, 1] and averaged'],
                  ['SSIM', 'scikit-image default, uniform 7 × 7 window'],
                  ['OCR', 'EasyOCR'],
                  ['Preprocessing', 'None: no CLAHE or unsharp masking'],
                ]}
              />
            </div>
          </div>
          <div className="caveats">
            <div><b>Level convention</b><span>Level k is focusStep_k, Level 0 the mildest. The notebook labels these Levels 2–5.</span></div>
            <div><b>Not full resolution</b><span>The other studies infer on full pages, so NAFNet’s numbers need this footnote in any cross-model table.</span></div>
            <div><b>OCR engine</b><span>NAFNet uses EasyOCR; every model needs the same engine before CER can be compared.</span></div>
            <div><b>Common test set</b><span>Other models must be scored on the same 24 pairs for a direct comparison.</span></div>
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
                ['Model', 'NAFNet-GoPro-width32, about 17.1 M parameters'],
                ['Weights', 'Official release via the Hugging Face mirror mikestealth/nafnet-models'],
                ['Loading', 'Strict key matching (strict=True)'],
                ['Trained', 'All parameters, one model for all ten steps'],
                ['Optimiser', 'AdamW, LR 2×10⁻⁴ with cosine decay'],
                ['Loss', 'L1 + 0.1 × Fourier-domain L1'],
                ['Crops', '256 × 256 px, batch size 4'],
                ['Iterations', '5,000'],
                ['EMA', '0.999'],
                ['Precision', 'Full precision, no mixed precision'],
              ]}
            />
          </div>
          <div className="panel">
            <h4>Notes on the recipe</h4>
            <ul className="facts small">
              <li>The Fourier-domain term adds a penalty on frequency content, where fine glyph edges show up.</li>
              <li>One model is trained on the training pairs of all ten steps, not only Levels 1–4.</li>
              <li>Strict key matching means any missing or mismatched checkpoint key would have raised an error.</li>
              <li>The best checkpoint was selected on the same held-out images used for reporting, so these results may be slightly optimistic.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'zeroshot',
      nav: 'Zero-shot audit',
      title: 'Zero-shot baseline and the audit',
      lead: 'What the published weights do on text before any fine-tuning, and why the earlier, much lower numbers were dropped.',
      body: <ZeroShot />,
    },
    {
      id: 'results',
      nav: 'Results',
      title: 'Results on focusStep Levels 1–4',
      lead: 'Blurred input, zero-shot and fine-tuned on the same 24 test pairs.',
      body: <Results />,
    },
    {
      id: 'ocr',
      nav: 'OCR',
      title: 'OCR: is the page easier to read?',
      lead: 'Character error rate per level and mean word error rate with EasyOCR, on the same test pages.',
      body: <Ocr />,
    },
    {
      id: 'takeaways',
      nav: 'Takeaways',
      title: 'Takeaways',
      body: (
        <Takeaways
          shows={[
            'Fine-tuned NAFNet improves both PSNR and SSIM over the blurred input at every level.',
            'Zero-shot, the GoPro weights change PSNR by at most 1.3 dB.',
            'Readability gains are largest under the worst blur: Level 4 CER falls from 60.94% to 7.81%.',
          ]}
          limits={[
            'The best checkpoint was chosen on the reported test images, so results may be slightly optimistic.',
            'Evaluated on 4× downscaled images with a 7 × 7 uniform SSIM window, unlike the full-resolution studies.',
            'Only 6 test images per level, so the OCR numbers are noisy.',
          ]}
          next={[
            'Score every model on the same 24 test pairs, with the same OCR engine and SSIM window.',
            'Re-evaluate NAFNet at full resolution, or footnote the cross-model tables.',
            'Run the strict=False key check on the old variant to name the mismatched layers.',
          ]}
        />
      ),
    },
  ],
}
