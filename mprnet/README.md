# MPRNet text deblurring on HDC2021 (focus steps 0-6) + OCR evaluation

> Colab users: run `MPRNet_HDC_levels0-6_Colab.ipynb` - it writes all these files into your Drive for you.

Fine-tunes the official CVPR-2021 **MPRNet** (GoPro deblurring weights) on the
[Helsinki Deblur Challenge 2021 dataset](https://zenodo.org/records/4916176) using **only blur levels 0-6**, then
measures PSNR / SSIM **and OCR accuracy** per level on a held-out test split.

This is the VS Code / GitHub-ready version of `MPRNet_Level5_v3.ipynb` (Colab-only, level 5 only).

## Folder layout

```
hdcdeblur/            package: model, losses, data, inference, OCR, utils, config
train.py              fine-tune on levels 0-6 (resumable)
evaluate.py           PSNR/SSIM + OCR per level on the held-out test pairs
download_data.py      download + extract HDC2021 steps (default 0-6, resumable)
download_weights.py   fetch the official pretrained MPRNet deblurring weights
notebooks/            thin notebook that just calls the scripts
tests/                synthetic-data generator for a 1-minute pipeline check
outputs/results/      CSVs / plots / RESULTS.md  -> commit these
outputs/weights/      small fp16 EMA weights    -> commit this (~40 MB)
outputs/checkpoints/  best.pth / last.pth       -> git-ignored (large)
data/, weights/       dataset and pretrained weights -> git-ignored
```

## Setup (Windows / macOS / Linux, VS Code)

1. Open the folder in VS Code, create an environment (`python -m venv .venv`) and select it as the interpreter.
2. **Install PyTorch with CUDA first** (plain `pip install torch` gives a CPU-only build on Windows):
   pick the command for your GPU at <https://pytorch.org/get-started/locally/>, e.g.
   `pip install torch --index-url https://download.pytorch.org/whl/cu124`
3. `pip install -r requirements.txt`
4. Check: `python -c "import torch; print(torch.cuda.is_available())"` should print `True`.

## Run

```bash
python download_data.py --steps 0-6     # ~2.5 GB per step; add --delete-zips to save disk
python download_weights.py              # or put model_deblurring.pth in weights/ yourself
python train.py                         # fine-tune on levels 0-6
python evaluate.py                      # per-level PSNR / SSIM / OCR  -> outputs/results/
```

* The dataset link you shared points at `HDC2021_step7.zip`; that is just a preview. **Step 7 is not needed** -
  you asked for levels 0-6, which are `HDC2021_step0.zip ... HDC2021_step6.zip` in the same record.
* Quick checks: `python train.py --quick`, `python evaluate.py --max-per-level 5 --tta 1`.
* No 17 GB download yet? `python tests/make_synthetic_data.py --out data_synth/HDC2021`, then add
  `--data-dir data_synth --out-dir outputs_synth` to `train.py` / `evaluate.py`.
* Interrupted? `python train.py --resume`.
* Key knobs are in `hdcdeblur/config.py` (epochs, patches per image, loss weights, TTA, tile size, OCR engine).
  Lower `--batch-size`/`--tta-batch` if you run out of GPU memory.

## How the data is used

* Every text-target pair (blurred CAM2 + sharp CAM1, both fonts) of levels 0-6 is discovered automatically.
  Technical targets (PSF etc.) have no `.txt` transcription and are skipped.
* Split is **stratified per level** (20 % test, then 15 % of the rest validation, seed 42) and saved to
  `outputs/results/splits.json` so `evaluate.py` always uses the same untouched test pairs.
* One model is trained on all seven levels together (256x256 patches, 8-fold flip/rotate augmentation,
  EMA weights, AdamW + cosine schedule, fp16 autocast on GPU).

## OCR evaluation

`evaluate.py` runs OCR on four versions of every test image - blurred input, pretrained MPRNet, fine-tuned MPRNet
and the sharp reference (upper bound) - and compares with the transcription shipped in the dataset.

* **Character accuracy** = `1 - Levenshtein(gt, ocr) / len(gt)` (clipped at 0) and **exact-match rate**;
  whitespace is ignored, case matters (the targets are random mixed-case strings).
* Engines: `--ocr easyocr` (default, pip only), `--ocr tesseract` (needs the Tesseract program; set
  `TESSERACT_CMD` if it is not on PATH), `--ocr none`.
* OCR results depend on the engine, so compare numbers only between runs that use the same one.

Outputs: `eval_per_image.csv` (incl. OCR text read for each variant), `eval_summary_by_level.csv`, `RESULTS.md`,
`metrics_by_level.png`, `examples_by_level.png`, `training_curves.png`, `training_history.csv`.

## Changes vs. `MPRNet_Level5_v3.ipynb`

Things that would have broken or misled outside Colab, now fixed:

* Colab-only code removed (`google.colab` drive mount, `/content/...` paths, `wget`, `!pip`); all paths are relative.
* `num_workers=2` in a notebook breaks on Windows (spawn) -> workers default to 0 there.
* The notebook's `CONFIG` (40 epochs, 40 patches/image, loss 0.4/0.4/0.2) was **not** what cell 8 actually ran
  (25 epochs, 6 patches, loss 0.5/0.3/0.2). Now there is one config; its loss defaults are the values that were really used.
* Pretrained weights were loaded with `strict=False` and only printed counts, so wrong weights meant silent random init.
  Now it raises if any key is missing.
* Sliding-window inference silently skipped tiles when one image side was shorter than the tile, and the Hanning window had
  zero weight at the borders. Both fixed; TTA is batched on the GPU.
* The "MS-SSIM" loss was actually single-scale SSIM (kept, but named honestly). The FFT loss is a complex-L1 loss, not "Log-FFT".
* Training now has resume, early stopping (the unused `PATIENCE`), NaN-loss skipping, and exports small fp16 weights.
* Level selection: only levels 0-6 are discovered, split and trained on; OCR evaluation is reported for each of them.

PSNR/SSIM are still measured on a centre crop (512x1024) like the notebook; set `metric_crop=None` in the config for the full image.
The Level-5 "Restormer" reference (18.588 dB / 0.795) came from a different setup, so treat that comparison as indicative only.

## Committing to GitHub

```bash
git init
git add .
git commit -m "MPRNet on HDC2021 levels 0-6 with OCR evaluation"
```
`.gitignore` keeps data, pretrained weights and the big checkpoints out of the repo; `outputs/results/` and the fp16
weights in `outputs/weights/` are committed (GitHub warns above 50 MB and blocks above 100 MB per file).

## Credits

MPRNet: Zamir et al., CVPR 2021 (<https://github.com/swz30/MPRNet>). Data: Juvonen, Siltanen, Silva de Moura,
Helsinki Deblur Challenge 2021 (<https://doi.org/10.5281/zenodo.4916176>).
