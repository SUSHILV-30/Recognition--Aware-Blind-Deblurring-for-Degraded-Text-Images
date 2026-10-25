import { Figure, SectionHead } from './ui.jsx'
import { img } from '../data/project.js'

export default function Problem() {
  return (
    <section className="block" id="problem">
      <div className="wrap">
        <SectionHead title="Why OCR fails on out-of-focus text">
          A misfocused camera spreads every point of the page into a disc. The strokes a recognizer
          relies on bleed together, so the fix has to happen before OCR, on the image itself.
        </SectionHead>

        <Figure
          src={img('defocus_progression.png')}
          caption="HDC 2021 defocus progression. The point-spread function widens with every step until characters merge."
        />

        <div className="two" style={{ marginTop: 40 }}>
          <div>
            <h3 style={{ marginBottom: 16 }}>What defocus does</h3>
            <ul className="facts">
              <li>A defocused lens convolves the page with a roughly circular PSF whose radius grows with focus error.</li>
              <li>Stroke boundaries bleed together: “e” collapses into “c” and “rn” turns into “m”.</li>
              <li>Real lenses couple defocus with radial distortion, so the geometry warps as well as the intensity.</li>
              <li>Detectors lose the binarisation threshold and recognizers see glyphs outside the shapes they were trained on.</li>
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: 16 }}>The gap this project fills</h3>
            <ul className="facts">
              <li>The HDC 2021 winner used a plain U-Net, not the biggest network. It modelled the camera’s blur and lens distortion and trained on matched synthetic data, reaching over 70% character accuracy at the hardest level.</li>
              <li>MPRNet, NAFNet, Uformer and Restormer are benchmarked almost entirely on GoPro motion blur. How much that costs on optical defocus of text, and whether every architecture pays the same price, was not measured.</li>
              <li>PSNR and SSIM are weak proxies for OCR accuracy, so pixel scores alone cannot say whether text became readable.</li>
            </ul>
          </div>
        </div>

        <div className="three" style={{ marginTop: 40 }}>
          <div className="panel">
            <h4>HDC 2021 / focusStep</h4>
            <p className="small muted" style={{ margin: 0 }}>
              Two identical cameras view an e-ink display through a beamsplitter. CAM01 stays focused
              and gives the ground truth; CAM02 is stepped out of focus across 20 levels (0–19).
              Steps 0–4 are also released as the focusStep subset.
            </p>
          </div>
          <div className="panel">
            <h4>Images</h4>
            <p className="small muted" style={{ margin: 0 }}>
              16-bit grayscale TIFF at 1460 × 2360 px. Random alphanumeric text in Times New Roman
              (timesR) and Verdana (verdanaRef) at 30 pt. No natural-scene imagery, so every number
              is measured on real printed text.
            </p>
          </div>
          <div className="panel">
            <h4>Pairing protocol</h4>
            <p className="small muted" style={{ margin: 0 }}>
              Each blur folder holds different text, not the same page re-blurred. Pairs are matched by
              exact filename, never by index, and scores are full-image PSNR/SSIM from tiled
              overlap-add inference, never patch-level training metrics.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
