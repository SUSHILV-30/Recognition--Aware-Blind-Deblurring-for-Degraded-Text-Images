// Every number here is copied from the project papers, slides or notebook
// outputs. Nothing is interpolated or estimated.

export const img = (name) => `${import.meta.env.BASE_URL}img/${name}`

export const COLORS = {
  input: 'var(--m-input)',
  pre: 'var(--m-pre)',
  ft: 'var(--m-ft)',
  scratch: 'var(--m-scratch)',
  mpr: 'var(--m-mpr)',
  naf: 'var(--m-naf)',
  hdc: 'var(--m-hdc)',
  gt: 'var(--m-gt)',
}

// Recharts needs real colours, not CSS variables, for SVG fills in some browsers.
export const HEX = {
  input: '#98a2b0',
  pre: '#8b8fd6',
  ft: '#0b8f7e',
  scratch: '#c08a2e',
  mpr: '#c95f86',
  naf: '#3f83cf',
  hdc: '#5a9a45',
  gt: '#5b6575',
}

export const team = [
  { name: 'Praneeth U', study: 'Restormer, fine-tuned (Phase 1 and Phase 2)', color: HEX.ft },
  { name: 'Rachit Anand', study: 'NAFNet, fine-tuned', color: HEX.naf },
  { name: 'Adithya Nambiar P', study: 'MPRNet, fine-tuned (and zero-shot baseline)', color: HEX.mpr },
  { name: 'Sushil V', study: 'Restormer from scratch and edge probe', color: HEX.scratch },
  { name: 'Sri Jayaram J S', study: 'HDC physics-informed U-Net', color: HEX.hdc },
]

// Restormer from scratch, full-image test metrics per HDC step (notebook output).
export const scratchSteps = [
  [0, 13.81, 0.2969], [1, 15.66, 0.3877], [2, 14.07, 0.2593], [3, 13.66, 0.2459],
  [4, 13.39, 0.2432], [5, 13.2, 0.2416], [6, 12.99, 0.2396], [7, 12.81, 0.2379],
  [8, 12.2, 0.2328], [9, 12.04, 0.2317], [10, 11.67, 0.2289], [11, 11.56, 0.2276],
  [12, 11.45, 0.227], [13, 11.28, 0.2259], [14, 11.13, 0.2251], [15, 11.05, 0.225],
  [16, 9.88, 0.2168], [17, 9.49, 0.2146], [18, 8.66, 0.2093], [19, 8.37, 0.2073],
].map(([step, psnr, ssim]) => ({ step, psnr, ssim }))

export const restormerFt = [
  { level: 'L1', input: 21.68, pre: 21.27, ft: 24.88, inputSsim: 0.3824 },
  { level: 'L2', input: 18.28, pre: 18.17, ft: 19.81, inputSsim: 0.3633 },
  { level: 'L3', input: 17.03, pre: 17.04, ft: 17.46, inputSsim: 0.3452 },
  { level: 'L4', input: 15.6, pre: 15.54, ft: 15.24, inputSsim: 0.2951 },
]

// NAFNet-GoPro-width32 (multi-scale), nafnet-6levels.ipynb. 24 held-out test pairs at
// focusStep Levels 1–4 (6 per level), images 4× area-downscaled and percentile-normalised.
// Source: "NAFNet (fine-tuned): Responses to the Editor's Queries", Table 4.
export const nafnet = [
  { level: 'L1', inputPsnr: 24.7, prePsnr: 24.92, ftPsnr: 29.83, inputSsim: 0.824, preSsim: 0.824, ftSsim: 0.876 },
  { level: 'L2', inputPsnr: 20.24, prePsnr: 20.03, ftPsnr: 24.61, inputSsim: 0.759, preSsim: 0.771, ftSsim: 0.853 },
  { level: 'L3', inputPsnr: 17.52, prePsnr: 17.43, ftPsnr: 20.9, inputSsim: 0.674, preSsim: 0.705, ftSsim: 0.821 },
  { level: 'L4', inputPsnr: 15.19, prePsnr: 13.9, ftPsnr: 18.53, inputSsim: 0.591, preSsim: 0.52, ftSsim: 0.791 },
]

// NAFNet OCR (EasyOCR) on the same 24 test pairs: CER % per level, WER % is the mean over levels.
export const nafnetOcr = {
  cer: [
    { level: 'L1', gt: 9.38, input: 4.69, ft: 7.81 },
    { level: 'L2', gt: 14.58, input: 11.98, ft: 7.81 },
    { level: 'L3', gt: 7.85, input: 22.51, ft: 6.28 },
    { level: 'L4', gt: 8.33, input: 60.94, ft: 7.81 },
  ],
  wer: { gt: 67.5, input: 86.25, ft: 50.0 },
}

// The earlier single-scale variant, kept only to explain the audit. Not used in comparisons.
export const nafnetLegacyPre = '5.33–5.63 dB'

// Earlier zero-shot benchmark (Adithya's paper): GoPro weights, 40 images, focusStep Levels 0–4.
export const mprnet = [
  { level: 'L0', n: 6, psnr: 22.12, ssim: 0.5138 },
  { level: 'L1', n: 10, psnr: 20.93, ssim: 0.4816 },
  { level: 'L2', n: 5, psnr: 16.39, ssim: 0.3897 },
  { level: 'L3', n: 9, psnr: 14.58, ssim: 0.35 },
  { level: 'L4', n: 10, psnr: 12.93, ssim: 0.3341 },
]

// Fine-tuned MPRNet, MPRNet_HDC_levels0_6_Colab.ipynb, from "MPRNet (fine-tuned): Responses to
// the Editor's Queries". Evaluation A: 35 Times test images (5 per level), full resolution,
// 512 × 1024 centre crop, per-image min-max scaling, no alignment, Run 1 weights.
export const mprnetFt = [
  { level: 'L0', inputPsnr: 16.42, prePsnr: 16.04, ftPsnr: 16.93, inputSsim: 0.398, preSsim: 0.344, ftSsim: 0.558 },
  { level: 'L1', inputPsnr: 16.99, prePsnr: 16.78, ftPsnr: 17.55, inputSsim: 0.387, preSsim: 0.359, ftSsim: 0.553 },
  { level: 'L2', inputPsnr: 14.5, prePsnr: 14.36, ftPsnr: 15.42, inputSsim: 0.328, preSsim: 0.325, ftSsim: 0.49 },
  { level: 'L3', inputPsnr: 13.35, prePsnr: 13.3, ftPsnr: 14.11, inputSsim: 0.299, preSsim: 0.322, ftSsim: 0.46 },
  { level: 'L4', inputPsnr: 12.34, prePsnr: 11.8, ftPsnr: 12.63, inputSsim: 0.245, preSsim: 0.191, ftSsim: 0.424 },
  { level: 'L5', inputPsnr: 12.05, prePsnr: 9.47, ftPsnr: 12.13, inputSsim: 0.203, preSsim: 0.058, ftSsim: 0.414 },
  { level: 'L6', inputPsnr: 11.58, prePsnr: 7.36, ftPsnr: 11.64, inputSsim: 0.176, preSsim: 0.051, ftSsim: 0.4 },
]
export const mprnetFtAll = { inputPsnr: 13.89, prePsnr: 12.73, ftPsnr: 14.35, inputSsim: 0.291, preSsim: 0.236, ftSsim: 0.471 }

// Evaluation B: 28 images (4 per level), PSNR after translation alignment and a global
// brightness/contrast fit; SSIM unaligned. "twoPass" feeds the output through the model again.
export const mprnetAligned = [
  { level: 'L0', inputPsnr: 17.27, ftPsnr: 17.61, twoPassPsnr: 17.58, inputSsim: 0.4, ftSsim: 0.58, twoPassSsim: 0.58 },
  { level: 'L1', inputPsnr: 17.78, ftPsnr: 17.81, twoPassPsnr: 17.65, inputSsim: 0.39, ftSsim: 0.55, twoPassSsim: 0.55 },
  { level: 'L2', inputPsnr: 16.02, ftPsnr: 16.04, twoPassPsnr: 15.86, inputSsim: 0.33, ftSsim: 0.49, twoPassSsim: 0.5 },
  { level: 'L3', inputPsnr: 14.56, ftPsnr: 14.75, twoPassPsnr: 14.74, inputSsim: 0.3, ftSsim: 0.46, twoPassSsim: 0.47 },
  { level: 'L4', inputPsnr: 13.06, ftPsnr: 13.42, twoPassPsnr: 13.58, inputSsim: 0.24, ftSsim: 0.43, twoPassSsim: 0.43 },
  { level: 'L5', inputPsnr: 12.47, ftPsnr: 12.75, twoPassPsnr: 11.87, inputSsim: 0.2, ftSsim: 0.41, twoPassSsim: 0.43 },
  { level: 'L6', inputPsnr: 11.63, ftPsnr: 11.73, twoPassPsnr: 11.54, inputSsim: 0.17, ftSsim: 0.4, twoPassSsim: 0.42 },
]
export const mprnetAlignedMean = { inputPsnr: 14.68, ftPsnr: 14.87, twoPassPsnr: 14.69, inputSsim: 0.29, ftSsim: 0.47, twoPassSsim: 0.48 }

// MPRNet OCR (EasyOCR, letters-only allowlist). CER % = 100 − per-image character accuracy, capped at 100%.
export const mprnetOcr = {
  // Run 1: the 35 Evaluation A images, no extra preprocessing before OCR.
  run1: {
    rows: [
      { key: 'gt', label: 'Sharp ground truth', cer: [9.7, 7.4, 9.0, 8.8, 13.0, 10.1, 13.5], mean: 10.2, exact: 5.7 },
      { key: 'input', label: 'Blurred input', cer: [9.2, 0.7, 10.2, 36.8, 86.8, 97.3, 100.0], mean: 48.7, exact: 11.4 },
      { key: 'pre', label: 'MPRNet, pretrained', cer: [5.6, 1.3, 12.3, 30.2, 86.2, 100.0, 100.0], mean: 47.9, exact: 11.4 },
      { key: 'ft', label: 'MPRNet, fine-tuned', cer: [7.0, 2.7, 4.9, 22.2, 75.0, 89.2, 94.6], mean: 42.2, exact: 8.6 },
    ],
  },
  // Run 2: the 28 Evaluation B images, each contrast-stretched by its 1st–99th percentiles before OCR.
  run2: {
    rows: [
      { key: 'gt', label: 'Sharp ground truth', cer: [8.7, 11.01, 13.83, 8.45, 15.41, 11.84, 10.2], mean: 11.35 },
      { key: 'input', label: 'Blurred input', cer: [7.14, 1.67, 11.22, 29.37, 78.31, 96.64, 100.0], mean: 46.34 },
      { key: 'ft', label: 'MPRNet, fine-tuned', cer: [8.73, 4.29, 4.37, 24.45, 80.13, 89.86, 91.49], mean: 43.33 },
      { key: 'twoPass', label: 'Fine-tuned, 2-pass', cer: [5.31, 3.39, 4.34, 21.03, 69.78, 87.33, 94.02], mean: 40.74 },
    ],
  },
}

// HDC Levels 9–13: each level's frozen U-Net followed by a conditional residual diffusion model.
// Source: "Deblurring and OCR: All Selected Outputs" (25 October 2026). Two illustrative samples per
// level, Tesseract 5.5.3 (tessdata_fast English, PSM 6, no dictionaries). Level 12 was excluded.
// refCer / inputCer are Tesseract on the sharp capture and on the blurred input (controls).
export const diffusionSamples = [
  { level: 9, font: 'times', id: 'times_0014', acc: 50.0, cer: 50.0, wer: 150.0, psnr: 22.58, refCer: 25.0, inputCer: 3468.75, chars: 32, s: 11, d: 1, i: 4,
    gt: 'yLCHtCut5f\nf9Py4NyFUJ\njuGySQX5 S', ocr: '—s fCrhCut®\n{9Py4NvF UJ\nJUGYSQXS5 $' },
  { level: 9, font: 'verdana', id: 'verdana_0013', acc: 78.12, cer: 21.88, wer: 75.0, psnr: 23.88, refCer: 21.88, inputCer: 2625.0, chars: 32, s: 2, d: 0, i: 5,
    gt: 'tfp6 DMF8s\nnQU3BZ849h\ncWJWwjiasz', ocr: '{tfp6 DMF8s\nnNOU3SBZ849h\ncCWIJWwyiasz' },
  { level: 10, font: 'times', id: 'times_0014', acc: 56.25, cer: 43.75, wer: 166.67, psnr: 20.99, refCer: 18.75, inputCer: 2375.0, chars: 32, s: 10, d: 1, i: 3,
    gt: '7RFX6A3NMG\n5yu8Zj56ST\nRUCgb9BaQA', ocr: '7REXOAJNMG\nIISZ IOS I\nRUCgeb9IBaQA' },
  { level: 10, font: 'verdana', id: 'verdana_0013', acc: 84.38, cer: 15.62, wer: 60.0, psnr: 22.97, refCer: 25.0, inputCer: 2950.0, chars: 32, s: 5, d: 0, i: 0,
    gt: 'zT7HF94T L\niTFtsjh9zN\net 9TWChQi', ocr: 'ZT7HF94T L\nITFtsjh9ZN\net ITWChQI' },
  { level: 11, font: 'times', id: 'times_0014', acc: 78.12, cer: 21.88, wer: 133.33, psnr: 21.29, refCer: 34.38, inputCer: 1896.88, chars: 32, s: 5, d: 0, i: 2,
    gt: 'aMtAbgPnKR\n8Ni8xiUuX3\nBvaZaTMkiZ', ocr: 'aMtAbePnKR\nSNI®xiU LX 3\nBvaZaTMkiZ' },
  { level: 11, font: 'verdana', id: 'verdana_0013', acc: 90.62, cer: 9.38, wer: 33.33, psnr: 22.8, refCer: 21.88, inputCer: 3003.12, chars: 32, s: 1, d: 0, i: 2,
    gt: 'hpQYyaLL7b\nKuRqghU66Z\nu5CvC2AHZh', ocr: 'hpQYyaLL7b\nKuRqghU66Z\nuSCVvC2ZAHZh' },
  { level: 13, font: 'times', id: 'times_0014', acc: 76.67, cer: 23.33, wer: 133.33, psnr: 21.21, refCer: 16.67, inputCer: 2706.67, chars: 30, s: 7, d: 0, i: 0,
    gt: 'cNs2CV5d6\nj49bShzQti\nvagq2AhBS', ocr: 'CNs2CV5d6\n/49bSHzObi\nva qZAhBS' },
  { level: 13, font: 'verdana', id: 'verdana_0013', acc: 90.62, cer: 9.38, wer: 75.0, psnr: 21.98, refCer: 9.38, inputCer: 2121.88, chars: 32, s: 3, d: 0, i: 0,
    gt: 'pNDLrbKVLC\nFagagawBGp\nvM xmPuGns', ocr: 'DNDLrbKVLC\nFagegawBGp\nVM xmPuGns' },
]

export const edges = [
  { op: 'Sobel', f1: 0.1994, precision: 0.1124, recall: 0.9095, psnr: 1.64, ssim: 0.0012 },
  { op: 'Canny', f1: 0.161, precision: 0.1362, recall: 0.2159, psnr: 6.48, ssim: 0.2439 },
  { op: 'Laplacian', f1: 0.0167, precision: 0.1401, recall: 0.009, psnr: 9.87, ssim: 0.0079 },
]

// Phase 2, Level 5 test set (n = 40) from 02_phase2_level5_restormer_finetune.ipynb
export const level5 = [
  { method: 'Blurred input', key: 'input', psnr: 15.35, ssim: 0.3724, char: 0.0, token: 0.0 },
  { method: 'Pretrained Restormer', key: 'pre', psnr: 15.29, ssim: 0.4188, char: 0.0, token: 0.0 },
  { method: 'Fine-tuned Restormer', key: 'ft', psnr: 21.98, ssim: 0.5824, char: 96.9, token: 75.0 },
  { method: 'Sharp ground truth', key: 'gt', psnr: null, ssim: null, char: 94.1, token: 64.7 },
]

// Phase 2, Level 6 test set (n = 40), Restormer Fine Tuned/results/phase2/level6
export const level6 = [
  { method: 'Blurred input', key: 'input', psnr: 15.03, ssim: 0.3723, char: 0.0, token: 0.0 },
  { method: 'Pretrained Restormer', key: 'pre', psnr: 15.05, ssim: 0.4174, char: 0.0, token: 0.0 },
  { method: 'Fine-tuned Restormer', key: 'ft', psnr: 20.19, ssim: 0.5693, char: 83.2, token: 32.0 },
  { method: 'Sharp ground truth', key: 'gt', psnr: null, ssim: null, char: 93.4, token: 69.1 },
]

// OCR (EasyOCR) by blur level. Values are percentages; null means not measured yet.
// Levels 1–4: every focusStep page with a ground-truth .txt (Restormer Fine Tuned/scripts/ocr_eval.py).
// Levels 5–6: Phase 2 test split. See Restormer Fine Tuned/OCR_RESULTS.md for n and protocol.
export const OCR_METHODS = [
  { key: 'input', label: 'Blurred input', color: HEX.input },
  { key: 'pre', label: 'Restormer, pretrained', color: HEX.pre },
  { key: 'ft', label: 'Restormer, fine-tuned', color: HEX.ft },
  // NAFNet and MPRNet report OCR as CER on their own test subsets, so they are not mixed into this table.
  { key: 'naf', label: 'NAFNet', color: HEX.naf, own: 'nafnet' },
  { key: 'mpr', label: 'MPRNet', color: HEX.mpr, own: 'mprnet' },
  { key: 'scratch', label: 'Restormer, scratch', color: HEX.scratch },
  { key: 'hdc', label: 'HDC U-Net', color: HEX.hdc },
  { key: 'gt', label: 'Sharp ground truth', color: HEX.gt },
]

const ocr = (char, token, n) => ({ char, token, n })

export const ocrByLevel = [
  { level: 1, input: ocr(94.35, 61.25, 40), gt: ocr(88.61, 43.75, 16) },
  { level: 2, input: ocr(91.2, 51.5, 40), gt: ocr(86.78, 44.79, 16) },
  { level: 3, input: ocr(65.99, 11.87, 40), gt: ocr(88.47, 40.29, 40) },
  { level: 4, input: ocr(20.05, 0.0, 40), gt: ocr(89.49, 44.28, 40) },
  { level: 5, input: ocr(0.0, 0.0, 40), pre: ocr(0.0, 0.0, 40), ft: ocr(96.9, 75.0, 40), gt: ocr(94.1, 64.7, 40) },
  { level: 6, input: ocr(0.0, 0.0, 40), pre: ocr(0.0, 0.0, 40), ft: ocr(83.2, 32.0, 40), gt: ocr(93.4, 69.1, 40) },
]

export const level5ByFont = [
  { font: 'Times New Roman', input: 15.58, pre: 15.53, ft: 21.77, char: 96.7 },
  { font: 'Verdana', input: 15.12, pre: 15.04, ft: 22.18, char: 97.2 },
]

export const level5Val = [
  { iter: 0, psnr: 15.38, ssim: 0.4225 },
  { iter: 500, psnr: 21.41, ssim: 0.5768 },
  { iter: 1000, psnr: 21.96, ssim: 0.5816 },
  { iter: 1500, psnr: 21.93, ssim: 0.5823 },
  { iter: 2000, psnr: 22.05, ssim: 0.5831 },
  { iter: 2500, psnr: 21.94, ssim: 0.5827 },
  { iter: 3000, psnr: 22.01, ssim: 0.5832 },
]

export const gridMethods = [
  { key: 'input', label: 'Blurred input', color: HEX.input },
  { key: 'restormer_pre', label: 'Restormer, pretrained', color: HEX.pre },
  { key: 'restormer_ft', label: 'Restormer, fine-tuned', color: HEX.ft },
  { key: 'restormer_scratch', label: 'Restormer, scratch', color: HEX.scratch },
  { key: 'mprnet', label: 'MPRNet', color: HEX.mpr },
  { key: 'nafnet', label: 'NAFNet', color: HEX.naf },
  { key: 'hdc_unet', label: 'HDC U-Net', color: HEX.hdc },
  { key: 'gt', label: 'Ground truth', color: HEX.gt },
]

export const gridSamples = {
  1: 'focusStep_1_timesR_size_30_sample_0008',
  2: 'focusStep_2_timesR_size_30_sample_0001',
  3: 'focusStep_3_verdanaRef_size_30_sample_0001',
  4: 'focusStep_4_timesR_size_30_sample_0009',
}

export const status = [
  { module: 'Data pipeline and preprocessing', state: 'Functional', pct: 100 },
  { module: 'Restormer, fine-tuned (L1–4)', state: 'Functional', pct: 100 },
  { module: 'NAFNet, fine-tuned', state: 'Functional', pct: 100 },
  { module: 'MPRNet, fine-tuned (L0–6) and zero-shot baseline', state: 'Functional', pct: 100 },
  { module: 'Restormer from scratch', state: 'Functional', pct: 100 },
  { module: 'HDC physics-informed U-Net', state: 'Functional', pct: 100 },
  { module: 'Edge-detection structural probe', state: 'Functional', pct: 100 },
  { module: 'Evaluation harness and comparison', state: 'Functional', pct: 100 },
  { module: 'Uformer (auxiliary baseline)', state: 'Partial', pct: 50 },
  { module: 'Detection (FPN) and recognition (CRNN / TrOCR)', state: 'Partial', pct: 40 },
  { module: 'Post-OCR correction (spell-check, LM)', state: 'Design', pct: 25 },
  { module: 'RABD CTC composite loss', state: 'Design', pct: 20 },
  { module: 'Diffusion-based restorer', state: 'Design', pct: 10 },
]

export const papers = [
  { title: 'Blind Deblurring of Degraded Text Images: A Comparative Analysis of Restoration Paradigms', where: 'ICMLDE, Procedia Computer Science (submission)' },
  { title: 'Recognition-Aware Blind Deblurring for Degraded Text Images: A Comparative Analysis of Deep Learning Architectures', where: 'Consolidated team paper' },
  { title: 'Domain-Adapted Restormer for Defocus Deblurring of Document Text Images', where: 'Praneeth U' },
  { title: 'Domain-Adapted NAFNet for Defocus Deblurring of Document Text Images', where: 'Rachit Anand' },
  { title: 'Evaluating MPRNet as a Domain-Shift Baseline for Defocus Deblurring of Document Text Images', where: 'Adithya Nambiar P' },
  { title: 'Image Restoration and Edge Detection Using Restormer Architecture on HDC 2021', where: 'Sushil V' },
]
