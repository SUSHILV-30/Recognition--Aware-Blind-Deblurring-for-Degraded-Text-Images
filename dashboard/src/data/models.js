// The five restoration models. Each one gets a card on the home page and a
// page of its own at #/models/<id>. Numbers come from project.js or the papers.

import { HEX, mprnet, nafnet, restormerFt, scratchSteps } from './project.js'

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
    start: 'Natural-image checkpoint',
    params: 'Single-resolution variant',
    scope: 'focusStep L1–4',
    tagline:
      'A nonlinear-activation-free CNN that collapses without tuning, then posts the largest fine-tuning gain of any model once trained on text.',
    headline: [
      ['+9.63 dB', 'Fine-tuning gain at Level 3'],
      ['+0.211', 'Largest SSIM gain, Level 3'],
    ],
    spark: { label: 'Fine-tuned PSNR, L1 → L4', values: nafnet.map((r) => r.ftPsnr) },
  },
  {
    id: 'mprnet',
    n: '03',
    name: 'MPRNet',
    variant: 'Zero-shot',
    full: 'MPRNet, zero-shot',
    owner: 'Adithya Nambiar P',
    paradigm: 'CNN, multi-stage',
    color: HEX.mpr,
    start: 'GoPro motion-blur weights',
    params: 'Unchanged, no training',
    scope: 'focusStep L0–4, 40 images',
    tagline:
      'Applied exactly as published for motion blur. A deliberate control that measures what the wrong training data costs on optical defocus.',
    headline: [
      ['−15.55 dB', 'Gap from its own GoPro result'],
      ['17.11 dB', 'Mean PSNR over 40 images'],
    ],
    spark: { label: 'Zero-shot PSNR, L0 → L4', values: mprnet.map((r) => r.psnr) },
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
    scope: 'HDC L0–6, per level',
    tagline:
      'A replication of the HDC 2021 winner: estimate the camera’s own blur and distortion, synthesise matching training pairs, then train a plain U-Net.',
    headline: [
      ['17.43 dB', 'Level 5 PSNR, SSIM 0.589'],
      ['0.356 → 0.010', 'PSF peak, Level 0 to 4'],
    ],
    spark: { label: 'Level 5 PSNR, before → after fine-tuning', values: [15.95, 17.43] },
  },
]

export const modelById = (id) => MODELS.find((m) => m.id === id)
export const modelHref = (id) => `#/models/${id}`
