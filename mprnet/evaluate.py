"""Evaluate on the held-out test pairs of levels 0-6: PSNR / SSIM + OCR accuracy for
blurred input vs. pretrained baseline vs. our fine-tuned model (vs. the sharp reference as OCR upper bound).

    python evaluate.py                          # EasyOCR, 8-way TTA
    python evaluate.py --ocr tesseract --tta 1  # faster
    python evaluate.py --max-per-level 5        # quick look
"""
import argparse, json, time
from pathlib import Path

import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
from tqdm import tqdm

from hdcdeblur.config import Config, parse_levels
from hdcdeblur.data import discover_pairs, make_splits
from hdcdeblur.inference import restore_image
from hdcdeblur.mprnet import MPRNet
from hdcdeblur.ocr import OCR, char_accuracy, exact_match
from hdcdeblur.utils import calc_metrics, center_crop, get_device, load_finetuned, load_gray_np, load_pretrained

VARIANTS = ["input", "baseline", "finetuned"]


def md_table(df):
    cols = list(df.columns)
    fmt = lambda v: "" if (isinstance(v, float) and np.isnan(v)) else (f"{v:.3f}" if isinstance(v, float) else str(v))
    lines = ["| " + " | ".join(cols) + " |", "|" + "|".join("---" for _ in cols) + "|"]
    lines += ["| " + " | ".join(fmt(v) for v in row) + " |" for row in df.itertuples(index=False)]
    return "\n".join(lines)


def get_test_pairs(cfg, levels, max_per_level):
    pairs = discover_pairs(cfg.extract_dir, levels, verbose=False)
    sp = cfg.results_dir / "splits.json"
    if sp.exists():
        keys = {x["blur"] for x in json.loads(sp.read_text())["test"]}
        test = [p for p in pairs if p["blur"] in keys]
        print(f"Using the test split saved by train.py ({len(test)} pairs)")
    else:
        print("[warn] splits.json not found -> recomputing the split with the default seed")
        test = make_splits(pairs, cfg.seed, cfg.test_frac, cfg.val_frac)["test"]
    if max_per_level:
        test = [p for lv in levels for p in [q for q in test if q["level"] == lv][:max_per_level]]
    return [p for p in test if p["level"] in levels]


def summarize(df, levels):
    g = lambda d: pd.Series({
        "n": len(d),
        **{f"psnr_{v}": d[f"psnr_{v}"].mean() for v in VARIANTS},
        **{f"ssim_{v}": d[f"ssim_{v}"].mean() for v in VARIANTS},
        **{f"ocr_{v}": d[f"ocr_{v}"].mean() for v in VARIANTS + ["sharp"]},
        **{f"exact_{v}": d[f"exact_{v}"].mean() for v in VARIANTS + ["sharp"]}})
    rows = []
    for lv in sorted(df.level.unique()):
        r = g(df[df.level == lv]); r["level"] = lv; rows.append(r)
    s = pd.DataFrame(rows)
    allrow = g(df); allrow["level"] = "ALL"
    return pd.concat([s, allrow.to_frame().T], ignore_index=True)


def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--levels", default="0-6")
    ap.add_argument("--weights"); ap.add_argument("--pretrained")
    ap.add_argument("--data-dir"); ap.add_argument("--out-dir")
    ap.add_argument("--tta", type=int); ap.add_argument("--tile", type=int); ap.add_argument("--tta-batch", type=int)
    ap.add_argument("--ocr", choices=["easyocr", "tesseract", "none"])
    ap.add_argument("--max-per-level", type=int, default=None)
    ap.add_argument("--device", default=None)
    a = ap.parse_args()
    cfg.levels = parse_levels(a.levels)
    if a.data_dir: cfg.data_dir = Path(a.data_dir)
    if a.out_dir: cfg.out_dir = Path(a.out_dir)
    if a.pretrained: cfg.pretrained_path = Path(a.pretrained)
    for s, d in (("tta", "tta"), ("tile", "tile"), ("tta_batch", "tta_batch"), ("ocr", "ocr_engine")):
        if getattr(a, s) is not None: setattr(cfg, d, getattr(a, s))
    cfg.make_dirs(); device = get_device(a.device)
    print(f"Device: {device} | tile {cfg.tile} | {cfg.tta}-way TTA | OCR: {cfg.ocr_engine}")

    weights = Path(a.weights) if a.weights else (cfg.best_ckpt if cfg.best_ckpt.exists() else cfg.export_weights)
    if not weights.exists(): raise SystemExit(f"No fine-tuned weights at {weights}. Run train.py first.")
    ft_net, ck = load_finetuned(MPRNet(), weights, "cpu")
    ft_net = ft_net.to(device).eval()
    print(f"Fine-tuned weights: {weights.name} (epoch {ck.get('epoch', '?')}, val PSNR {ck.get('val_psnr', float('nan')):.2f} dB)")
    base_net = None
    if cfg.pretrained_path.exists():
        base_net = load_pretrained(MPRNet(), cfg.pretrained_path).to(device).eval()
    else:
        print("[warn] pretrained weights not found -> baseline columns will be empty")
    ocr = OCR(cfg.ocr_engine, cfg.ocr_alphabet)

    test = get_test_pairs(cfg, cfg.levels, a.max_per_level)
    if not test: raise SystemExit("No test pairs found (is the dataset extracted?)")
    print(f"Evaluating {len(test)} test pairs, levels {sorted({p['level'] for p in test})}\n")

    rows, grid, seen = [], {}, set()
    nan = float("nan"); t0 = time.time()
    for i, p in enumerate(tqdm(test, desc="evaluating")):
        b = load_gray_np(cfg.extract_dir / p["blur"]); g = load_gray_np(cfg.extract_dir / p["gt"])
        hh, ww = min(b.shape[0], g.shape[0]), min(b.shape[1], g.shape[1]); b, g = b[:hh, :ww], g[:hh, :ww]
        base = restore_image(base_net, b, device, cfg.tile, cfg.overlap, 1, cfg.tta_batch) if base_net else None
        ft = restore_image(ft_net, b, device, cfg.tile, cfg.overlap, cfg.tta, cfg.tta_batch)
        imgs = {"input": b, "baseline": base, "finetuned": ft}
        gc, (sy, sx) = center_crop(g, cfg.metric_crop)
        rec = {"level": p["level"], "font": p["font"], "name": p["name"], "gt_text": p["text"]}
        for v in VARIANTS:
            im = imgs[v]
            if im is None: rec[f"psnr_{v}"] = rec[f"ssim_{v}"] = nan; continue
            rec[f"psnr_{v}"], rec[f"ssim_{v}"] = calc_metrics(im[sy:sy + gc.shape[0], sx:sx + gc.shape[1]], gc)
        if ocr.enabled and p["text"]:
            for v, im in {**imgs, "sharp": g}.items():
                txt = ocr.read(im) if im is not None else ""
                rec[f"ocr_{v}"] = char_accuracy(p["text"], txt) if im is not None else nan
                rec[f"exact_{v}"] = exact_match(p["text"], txt) if im is not None else nan
                rec[f"text_{v}"] = " ".join(txt.split())
        else:
            for v in VARIANTS + ["sharp"]: rec[f"ocr_{v}"] = rec[f"exact_{v}"] = nan
        rows.append(rec)
        if p["level"] not in seen:                      # one example per level for the visual grid
            seen.add(p["level"])
            sl = (slice(sy, sy + gc.shape[0]), slice(sx, sx + gc.shape[1]))
            grid[p["level"]] = ([x[sl] if x is not None else None for x in (b, base, ft, g)], rec)
        if (i + 1) % 10 == 0: pd.DataFrame(rows).to_csv(cfg.results_dir / "eval_per_image.csv", index=False)

    df = pd.DataFrame(rows); df.to_csv(cfg.results_dir / "eval_per_image.csv", index=False)
    summ = summarize(df, cfg.levels); summ.to_csv(cfg.results_dir / "eval_summary_by_level.csv", index=False)

    # ---- markdown report -------------------------------------------------------------------
    t1 = summ[["level", "n", "psnr_input", "psnr_baseline", "psnr_finetuned", "ssim_input", "ssim_baseline", "ssim_finetuned"]]
    t2 = summ[["level", "n", "ocr_input", "ocr_baseline", "ocr_finetuned", "ocr_sharp",
               "exact_input", "exact_baseline", "exact_finetuned", "exact_sharp"]]
    md = [f"# Results: MPRNet on HDC2021 levels {min(cfg.levels)}-{max(cfg.levels)}\n",
          f"Test pairs: {len(df)} | OCR engine: {cfg.ocr_engine} | {cfg.tta}-way TTA | weights: `{weights.name}`\n",
          "## Image quality (PSNR dB / SSIM, centre crop)\n", md_table(t1),
          "\n## OCR (character accuracy and exact-match rate vs. ground-truth transcription)\n", md_table(t2)]
    (cfg.results_dir / "RESULTS.md").write_text("\n".join(md) + "\n")
    print("\n" + "\n".join(md))
    lv = summ[summ.level == cfg.friend_level]
    if len(lv):
        r = lv.iloc[0]
        print(f"\nLevel {cfg.friend_level} vs reference (Restormer): ours {r.psnr_finetuned:.3f} dB / {r.ssim_finetuned:.4f} "
              f"| reference {cfg.friend_psnr:.3f} dB / {cfg.friend_ssim:.3f}  (different split/model setup -> indicative only)")

    # ---- plots -----------------------------------------------------------------------------
    s = summ[summ.level != "ALL"].copy(); x = s.level.astype(int)
    fig, ax = plt.subplots(1, 3, figsize=(17, 4.6))
    for v, c in zip(VARIANTS, ["tab:red", "tab:purple", "tab:green"]):
        ax[0].plot(x, s[f"psnr_{v}"], marker="o", color=c, label=v); ax[1].plot(x, s[f"ssim_{v}"], marker="o", color=c, label=v)
        ax[2].plot(x, s[f"ocr_{v}"], marker="o", color=c, label=v)
    ax[2].plot(x, s["ocr_sharp"], ls="--", color="k", label="sharp reference")
    for a_, t in zip(ax, ["PSNR (dB)", "SSIM", "OCR character accuracy"]): a_.set_title(t); a_.set_xlabel("focus step (blur level)"); a_.grid(alpha=.3); a_.legend()
    fig.tight_layout(); fig.savefig(cfg.results_dir / "metrics_by_level.png", dpi=140); plt.close(fig)

    lvls = sorted(grid); fig, axs = plt.subplots(len(lvls), 4, figsize=(20, 3.1 * len(lvls)), squeeze=False)
    for r_, l in enumerate(lvls):
        ims, rec = grid[l]
        for c_, (im, nm) in enumerate(zip(ims, ["blurred input", "pretrained MPRNet", "fine-tuned (ours)", "sharp reference"])):
            ax_ = axs[r_, c_]; ax_.axis("off")
            if im is not None: ax_.imshow(im, cmap="gray", vmin=0, vmax=1)
            key = ["input", "baseline", "finetuned", "sharp"][c_]
            extra = f"  OCR {rec[f'ocr_{key}']:.2f}" if not np.isnan(rec.get(f"ocr_{key}", nan)) else ""
            ps = f"{rec[f'psnr_{key}']:.1f} dB" if key != "sharp" and not np.isnan(rec[f"psnr_{key}"]) else ""
            ax_.set_title(f"L{l} {nm}  {ps}{extra}", fontsize=10)
    fig.tight_layout(); fig.savefig(cfg.results_dir / "examples_by_level.png", dpi=110); plt.close(fig)
    print(f"\nSaved to {cfg.results_dir}  ({(time.time() - t0) / 60:.1f} min)")


if __name__ == "__main__":
    main()
