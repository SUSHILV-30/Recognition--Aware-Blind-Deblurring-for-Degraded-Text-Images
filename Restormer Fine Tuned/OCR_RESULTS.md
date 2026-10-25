# OCR Results

How readable each model's output is, measured with OCR rather than PSNR/SSIM. Every
score here uses the same reader and the same scoring, so the levels can be compared
directly. Models that have not been scored yet have empty columns.

## Protocol

| | |
|---|---|
| Reader | EasyOCR (English), lines sorted top-to-bottom, left-to-right |
| Preprocessing | 99.5th-percentile normalisation, 48 px border trim |
| Character accuracy | `1 − Levenshtein(pred, GT) / len(GT)`, whitespace collapsed, floored at 0 |
| Token accuracy | Share of ground-truth tokens (10-character strings) found in the prediction, each predicted token used once |
| Ground truth | The `.txt` file shipped with each HDC 2021 page, matched by exact filename |
| Code | [`scripts/ocr_eval.py`](scripts/ocr_eval.py) (Levels 1–4) and the Phase 2 notebooks (Levels 5–6) share the same functions |

**Samples.** Levels 1–4 are scored on every focusStep page with a text file: 40 per level
(20 Times New Roman, 20 Verdana). Sharp CAM01 captures exist for only 16 pages at Levels 1
and 2, so the ground-truth row there uses n = 16. Levels 5–6 use the fixed 40-page Phase 2
test split, with the sharp capture registered onto the blurred one.

## Character accuracy (%)

| Level | Blurred input | Restormer, pretrained | Restormer, fine-tuned | NAFNet | MPRNet | Restormer, scratch | HDC U-Net | Sharp GT (upper bound) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 94.4 | — | — | — | — | — | — | 88.6 |
| 2 | 91.2 | — | — | — | — | — | — | 86.8 |
| 3 | 66.0 | — | — | — | — | — | — | 88.5 |
| 4 | 20.0 | — | — | — | — | — | — | 89.5 |
| 5 | 0.0 | 0.0 | **96.9** | — | — | — | — | 94.1 |
| 6 | 0.0 | 0.0 | **83.2** | — | — | — | — | 93.4 |

## Token accuracy (%)

| Level | Blurred input | Restormer, pretrained | Restormer, fine-tuned | NAFNet | MPRNet | Restormer, scratch | HDC U-Net | Sharp GT (upper bound) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 61.3 | — | — | — | — | — | — | 43.8 |
| 2 | 51.5 | — | — | — | — | — | — | 44.8 |
| 3 | 11.9 | — | — | — | — | — | — | 40.3 |
| 4 | 0.0 | — | — | — | — | — | — | 44.3 |
| 5 | 0.0 | 0.0 | **75.0** | — | — | — | — | 64.7 |
| 6 | 0.0 | 0.0 | **32.0** | — | — | — | — | 69.1 |

`—` means not measured yet.

## By font, character accuracy (%)

| Level | Method | Times New Roman | Verdana |
|---|---|---:|---:|
| 1 | Blurred input | 94.2 | 94.5 |
| 1 | Sharp GT | 86.7 (n = 9) | 91.1 (n = 7) |
| 2 | Blurred input | 86.8 | 95.6 |
| 2 | Sharp GT | 82.8 (n = 9) | 91.9 (n = 7) |
| 3 | Blurred input | 49.9 | 82.1 |
| 3 | Sharp GT | 87.7 | 89.2 |
| 4 | Blurred input | 10.1 | 30.0 |
| 4 | Sharp GT | 85.9 | 93.1 |
| 5 | Restormer, fine-tuned | 96.7 | 97.2 |
| 5 | Sharp GT | 92.1 | 96.1 |
| 6 | Restormer, fine-tuned | 78.5 | 87.9 |
| 6 | Sharp GT | 91.7 | 95.1 |

## What the numbers say

- **OCR fails at Level 3, not Level 1.** EasyOCR still reads 91–94% of characters on the
  blurred page at Levels 1–2. It drops to 66% at Level 3, 20% at Level 4 and 0% from Level 5.
  Restoration matters most from Level 3 up.
- **Fine-tuned Restormer reads pages that OCR could not read at all.** At Level 5 it takes
  character accuracy from 0% to 96.9%. At Level 6 it reaches 83.2%. The pretrained checkpoint
  stays at 0% on both levels, even though it raises SSIM.
- **Token accuracy falls faster than character accuracy.** Each token is a 10-character random
  string, so one wrong character loses the whole token. At Level 6 that is 83.2% of characters
  but only 32.0% of tokens.
- **Times New Roman suffers first.** Thin serif strokes vanish sooner than Verdana's. At Level 3
  the blurred Times page reads 49.9% against 82.1% for Verdana, and the same gap shows after
  restoration at Level 6 (78.5% vs 87.9%).
- **"Sharp GT" is not 100%, and sometimes not the top score.** The text is random characters
  (l/I, 0/O, 5/S), so there is no dictionary to correct against. At Levels 1–2 the mildly
  blurred page scores slightly above the sharp capture on the same 16 pages (94.1% vs 88.6%),
  because light blur smooths sensor noise and EasyOCR drops some thin strokes on the raw sharp
  image. At Level 5 the restored output also beats the sharp capture (96.9% vs 94.1%) for the
  same reason: it is cleaner and higher-contrast.

## Still to measure

| Model | Levels | How |
|---|---|---|
| Restormer, fine-tuned | 1–4 | Restore the focusStep pages with the Phase 1 checkpoint, then run `ocr_eval.py --restored "Fine-tuned Restormer=<folder>"` |
| Restormer, pretrained | 1–4 | Same, with the DPDD checkpoint |
| NAFNet, MPRNet, Restormer from scratch, HDC U-Net | 1–4 (and 5–6 where trained) | Save each model's full-page outputs as `<filename>.png` and pass one `--restored` flag per model |
| Restormer, fine-tuned | 7–10 | `03_phase2_any_level_5_to_10.ipynb` writes OCR scores per level |

```bash
python scripts/ocr_eval.py \
    --blurred-dir dataset/focusStep/blurred \
    --gt-dir dataset/focusStep/CAM01_focused \
    --levels 1 2 3 4 \
    --restored "Fine-tuned Restormer=outputs/restormer_ft" \
    --restored "NAFNet=outputs/nafnet" \
    --out results/ocr/levels_1_4 \
    --device cuda
```

Earlier OCR numbers in [`docs/results.md`](docs/results.md) (51.0% token, 83.3% character)
came from a Swin2SR → EasyOCR → TrOCR pipeline with no Restormer stage. They use a different
recognizer, so they are not included in the tables above.

## Files

- [`results/ocr/levels_1_4/`](results/ocr/levels_1_4/) `ocr_summary.csv`, `ocr_per_image.csv`: Levels 1–4 input and ground-truth OCR, with every prediction
- [`results/phase2/level5/`](results/phase2/level5/), [`level6/`](results/phase2/level6/): Phase 2 summaries, per-image metrics and OCR outputs
