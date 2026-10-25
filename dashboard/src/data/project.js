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
  { name: 'Adithya Nambiar P', study: 'MPRNet, zero-shot', color: HEX.mpr },
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

export const nafnet = [
  { level: 'L1', prePsnr: 5.33, ftPsnr: 12.59, preSsim: 0.293, ftSsim: 0.489 },
  { level: 'L2', prePsnr: 5.42, ftPsnr: 12.59, preSsim: 0.289, ftSsim: 0.482 },
  { level: 'L3', prePsnr: 5.63, ftPsnr: 15.26, preSsim: 0.296, ftSsim: 0.507 },
  { level: 'L4', prePsnr: 5.38, ftPsnr: 13.06, preSsim: 0.281, ftSsim: 0.501 },
]

export const mprnet = [
  { level: 'L0', n: 6, psnr: 22.12, ssim: 0.5138 },
  { level: 'L1', n: 10, psnr: 20.93, ssim: 0.4816 },
  { level: 'L2', n: 5, psnr: 16.39, ssim: 0.3897 },
  { level: 'L3', n: 9, psnr: 14.58, ssim: 0.35 },
  { level: 'L4', n: 10, psnr: 12.93, ssim: 0.3341 },
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
  { key: 'naf', label: 'NAFNet', color: HEX.naf },
  { key: 'mpr', label: 'MPRNet', color: HEX.mpr },
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
  { module: 'MPRNet zero-shot benchmark', state: 'Functional', pct: 100 },
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
