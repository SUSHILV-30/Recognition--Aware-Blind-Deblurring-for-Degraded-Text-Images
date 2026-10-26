// The five restoration models. Each one gets a card on the home page and a
// page of its own at #/models/<id>. Numbers come from project.js or the papers.

import { HEX, mprnetFt, nafnet, restormerFt, scratchSteps } from './project.js'

export const MODELS = [
  {
    id: 'restormer',
    n: '01',
    name: 'Restormer',
    variant: 'Fine-tuned',
    full: 'Restormer, fine-tuned',
    owner: 'Praneeth U',
    paradigm: 'Transformer',
    color: HEX.ft,
    start: 'DPDD defocus checkpoint',
    params: '26.1 M',
    scope: 'focusStep L1–4, HDC L5–6',
    tagline:
      'A channel-attention transformer adapted from natural-scene defocus to printed text, then pushed past focusStep into HDC Levels 5 and 6.',
    headline: [
      ['96.9%', 'OCR characters read at Level 5, up from 0%'],
      ['24.88 dB', 'PSNR at Level 1'],
    ],
    spark: { label: 'Fine-tuned PSNR, L1 → L4', values: restormerFt.map((r) => r.ft) },
  },
  {
    id: 'nafnet',
    n: '02',
    name: 'NAFNet',
    variant: 'Fine-tuned',
    full: 'NAFNet, fine-tuned',
    owner: 'Rachit Anand',
    paradigm: 'CNN, activation-free',
    color: HEX.naf,
    start: 'NAFNet-GoPro-width32 weights',
    params: '≈ 17.1 M',
    scope: 'focusStep L1–4, 24 test pairs',
    tagline:
      'The published multi-scale NAFNet, fine-tuned on all ten focusStep steps. It beats the blurred input on PSNR, SSIM and OCR at every level.',
    headline: [
      ['29.83 dB', 'Fine-tuned PSNR at Level 1, +5.13 dB'],
      ['60.9 → 7.8%', 'OCR character error rate at Level 4'],
    ],
    spark: { label: 'Fine-tuned PSNR, L1 → L4', values: nafnet.map((r) => r.ftPsnr) },
  },
  {
    id: 'mprnet',
    n: '03',
    name: 'MPRNet',
    variant: 'Fine-tuned',
    full: 'MPRNet, fine-tuned',
    owner: 'Adithya Nambiar P',
    paradigm: 'CNN, multi-stage',
    color: HEX.mpr,
    start: 'Official GoPro checkpoint',
    params: '≈ 20.1 M',
    scope: 'HDC L0–6, 35 test images',
    tagline:
      'The official three-stage MPRNet, fine-tuned on HDC Levels 0–6. Structure recovers clearly at every level; pixel error moves only a little.',
    headline: [
      ['+0.16 to +0.22', 'SSIM gain over the input, every level'],
      ['48.7 → 42.2%', 'Mean OCR character error rate'],
    ],
    spark: { label: 'Fine-tuned PSNR, L0 → L6', values: mprnetFt.map((r) => r.ftPsnr) },
  },
  {
    id: 'scratch',
    n: '04',
    name: 'Restormer',
    variant: 'From scratch',
    full: 'Restormer from scratch',
    owner: 'Sushil V',
    paradigm: 'Transformer, compact',
    color: HEX.scratch,
    start: 'Random initialisation',
    params: '1.18 M',
    scope: 'All 20 HDC steps',
    tagline:
      'A compact Restormer trained only on in-domain data, isolating the architecture from transfer learning, with an edge-detection probe on its output.',
    headline: [
      ['15.66 dB', 'Best full-page test PSNR, Step 1'],
      ['0.9095', 'Sobel recall on restored edges'],
    ],
    spark: { label: 'Test PSNR, Steps 0 → 19', values: scratchSteps.map((r) => r.psnr) },
  },
  {
    id: 'physics',
    n: '05',
    name: 'HDC U-Net',
    variant: 'Physics-informed',
    full: 'HDC physics-informed U-Net',
    owner: 'Sri Jayaram J S',
    paradigm: 'CNN + optics model',
    color: HEX.hdc,
    start: 'Synthetic data from estimated PSF',
    params: '25.17 M / 12.49 M',
    scope: 'HDC L0–6; L9–13 samples',
    tagline:
      'A replication of the HDC 2021 winner: estimate the camera’s own blur and distortion, synthesise matching pairs, train a plain U-Net. A diffusion refiner extends it to Levels 9–13.',
    headline: [
      ['17.43 dB', 'Level 5 PSNR, SSIM 0.589'],
      ['50–91%', 'OCR accuracy on Level 9–13 samples'],
    ],
    spark: { label: 'Level 5 PSNR, before → after fine-tuning', values: [15.95, 17.43] },
  },
]

export const modelById = (id) => MODELS.find((m) => m.id === id)
export const modelHref = (id) => `#/models/${id}`
