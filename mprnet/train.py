"""Fine-tune the pretrained MPRNet deblurring model on HDC2021 focus steps 0-6.

    python train.py                      # full run with the defaults in hdcdeblur/config.py
    python train.py --quick              # tiny sanity run (a few pairs, 1 epoch)
    python train.py --resume             # continue an interrupted run from outputs/checkpoints/last.pth
"""
import argparse, os, time
from pathlib import Path

import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch, torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader
from tqdm import tqdm

from hdcdeblur.config import Config, parse_levels
from hdcdeblur.data import PatchDataset, build_patches, discover_pairs, make_splits, save_splits
from hdcdeblur.losses import MPRLoss
from hdcdeblur.mprnet import MPRNet
from hdcdeblur.utils import EMA, calc_metrics, default_num_workers, get_device, load_pretrained, seed_everything


def make_scaler(enabled):
    try: return torch.amp.GradScaler("cuda", enabled=enabled)
    except Exception: return torch.cuda.amp.GradScaler(enabled=enabled)


def save_atomic(obj, path):
    tmp = str(path) + ".tmp"; torch.save(obj, tmp); os.replace(tmp, path)


@torch.no_grad()
def validate(net, loader, loss_fn, device, use_amp):
    net.eval(); vl, n, ps, ss = 0.0, 0, [], []
    for b, g in loader:
        b, g = b.to(device), g.to(device)
        with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=use_amp):
            out = net(b)
        vl += loss_fn(out, g).item(); n += 1
        pred = out[0].float().clamp(0, 1)
        for i in range(b.shape[0]):
            p, s = calc_metrics(pred[i, 0].cpu().numpy(), g[i, 0].cpu().numpy()); ps.append(p); ss.append(s)
    return vl / max(n, 1), float(np.mean(ps)), float(np.mean(ss))


def plot_curves(hist, path, cfg):
    df = pd.DataFrame(hist)
    fig, ax = plt.subplots(1, 3, figsize=(16, 4.5))
    tr = df[df.epoch > 0]
    ax[0].plot(tr.epoch, tr.train_loss, label="train"); ax[0].plot(df.epoch, df.val_loss, label="val"); ax[0].set_title("Loss")
    ax[1].plot(df.epoch, df.val_psnr, marker="o"); ax[1].set_title("Validation PSNR (dB)  [epoch 0 = pretrained]")
    ax[2].plot(df.epoch, df.val_ssim, marker="o", color="tab:purple"); ax[2].set_title("Validation SSIM")
    for a in ax: a.set_xlabel("epoch"); a.grid(alpha=.3)
    ax[0].legend(); fig.suptitle(f"MPRNet fine-tuning, HDC2021 levels {min(cfg.levels)}-{max(cfg.levels)}")
    fig.tight_layout(); fig.savefig(path, dpi=140); plt.close(fig)


def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--levels", default="0-6")
    ap.add_argument("--data-dir"); ap.add_argument("--out-dir"); ap.add_argument("--pretrained")
    ap.add_argument("--epochs", type=int); ap.add_argument("--patch-size", type=int)
    ap.add_argument("--patches", type=int, help="training patches per image")
    ap.add_argument("--val-patches", type=int)
    ap.add_argument("--batch-size", type=int); ap.add_argument("--accum", type=int)
    ap.add_argument("--lr", type=float); ap.add_argument("--patience", type=int)
    ap.add_argument("--max-pairs-per-level", type=int, default=None)
    ap.add_argument("--num-workers", type=int, default=None)
    ap.add_argument("--device", default=None)
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--no-pretrained", action="store_true", help="train from random init (not recommended)")
    ap.add_argument("--quick", action="store_true", help="tiny sanity run")
    a = ap.parse_args()

    cfg.levels = parse_levels(a.levels)
    if a.data_dir: cfg.data_dir = Path(a.data_dir)
    if a.out_dir: cfg.out_dir = Path(a.out_dir)
    if a.pretrained: cfg.pretrained_path = Path(a.pretrained)
    for src, dst in (("epochs", "epochs"), ("patch_size", "patch_size"), ("patches", "train_patches_per_image"),
                     ("val_patches", "val_patches_per_image"), ("batch_size", "batch_size"),
                     ("accum", "grad_accum"), ("lr", "lr"), ("patience", "patience")):
        if getattr(a, src) is not None: setattr(cfg, dst, getattr(a, src))
    if a.quick:
        cfg.epochs, cfg.train_patches_per_image, cfg.val_patches_per_image = 1, 2, 2
        a.max_pairs_per_level = a.max_pairs_per_level or 8
    cfg.make_dirs(); seed_everything(cfg.seed)
    device = get_device(a.device); use_amp = device.type == "cuda"
    workers = default_num_workers() if a.num_workers is None else a.num_workers
    print(f"Device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if use_amp else "  [CPU: training will be very slow]"))

    # ---- data ------------------------------------------------------------------------------
    print(f"\nScanning {cfg.extract_dir} for levels {list(cfg.levels)} ...")
    pairs = discover_pairs(cfg.extract_dir, cfg.levels)
    if not pairs:
        raise SystemExit("No text pairs found. Run `python download_data.py` first (see README).")
    missing = [l for l in cfg.levels if not any(p["level"] == l for p in pairs)]
    if missing: print(f"[warn] no data found for levels {missing}")
    if a.max_pairs_per_level:
        keep = []
        for l in cfg.levels:
            keep += [p for p in pairs if p["level"] == l][:a.max_pairs_per_level]
        pairs = keep
    splits = make_splits(pairs, cfg.seed, cfg.test_frac, cfg.val_frac)
    save_splits(splits, cfg.results_dir / "splits.json")
    print(f"Split -> train {len(splits['train'])} | val {len(splits['val'])} | test {len(splits['test'])} pairs "
          f"(test set is untouched here; evaluate.py uses it)")

    tb, tg = build_patches(splits["train"], cfg.extract_dir, cfg.patch_size, cfg.train_patches_per_image,
                           cfg.seed, cfg.cache_dir, "train")
    vb, vg = build_patches(splits["val"], cfg.extract_dir, cfg.patch_size, cfg.val_patches_per_image,
                           cfg.seed + 1, cfg.cache_dir, "val")
    trn_ld = DataLoader(PatchDataset(tb, tg, True), batch_size=cfg.batch_size, shuffle=True, num_workers=workers,
                        pin_memory=use_amp, drop_last=True, persistent_workers=workers > 0)
    val_ld = DataLoader(PatchDataset(vb, vg, False), batch_size=cfg.batch_size, shuffle=False, num_workers=0)
    print(f"{len(trn_ld)} train batches / epoch")

    # ---- model -----------------------------------------------------------------------------
    model = MPRNet().to(device)
    if not a.no_pretrained:
        if not cfg.pretrained_path.exists():
            raise SystemExit(f"Pretrained weights not found at {cfg.pretrained_path}. "
                             "Run `python download_weights.py` (or pass --no-pretrained).")
        print("\nLoading pretrained weights ..."); load_pretrained(model, cfg.pretrained_path)
    ema = EMA(model, cfg.ema_decay)
    loss_fn = MPRLoss(cfg.charb_w, cfg.fft_w, cfg.ssim_w)
    opt = AdamW(model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)
    sched = CosineAnnealingLR(opt, T_max=cfg.epochs, eta_min=cfg.lr_min)
    scaler = make_scaler(use_amp)

    hist, best_psnr, pat, start_ep = [], 0.0, 0, 1
    if a.resume and cfg.last_ckpt.exists():
        ck = torch.load(cfg.last_ckpt, map_location=device, weights_only=False)
        model.load_state_dict(ck["model"]); ema.module.load_state_dict(ck["ema"])
        opt.load_state_dict(ck["opt"]); sched.load_state_dict(ck["sched"]); scaler.load_state_dict(ck["scaler"])
        hist, best_psnr, pat, start_ep = ck["hist"], ck["best_psnr"], ck["pat"], ck["epoch"] + 1
        print(f"Resumed from epoch {ck['epoch']} (best val PSNR {best_psnr:.2f} dB)")
    elif a.resume:
        print("[warn] --resume given but no last.pth found; starting fresh")

    if not hist:
        vl, vp, vs = validate(ema.module, val_ld, loss_fn, device, use_amp)
        hist.append(dict(epoch=0, train_loss=np.nan, val_loss=vl, val_psnr=vp, val_ssim=vs, lr=cfg.lr, seconds=0))
        print(f"Epoch  0 (pretrained, before fine-tuning) | val PSNR {vp:.2f} dB SSIM {vs:.4f}")

    # ---- train -----------------------------------------------------------------------------
    print("\n" + "=" * 72 + f"\nFINE-TUNING levels {list(cfg.levels)} | {cfg.epochs} epochs | "
          f"batch {cfg.batch_size} x accum {cfg.grad_accum}\n" + "=" * 72)
    t_all = time.time()
    for ep in range(start_ep, cfg.epochs + 1):
        model.train(); t0 = time.time(); tl, nb = 0.0, 0; opt.zero_grad(set_to_none=True)
        for step, (blur, sharp) in enumerate(tqdm(trn_ld, desc=f"ep {ep}/{cfg.epochs}", leave=False)):
            blur, sharp = blur.to(device, non_blocking=True), sharp.to(device, non_blocking=True)
            with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=use_amp):
                preds = model(blur)
            loss = loss_fn(preds, sharp)
            if not torch.isfinite(loss):
                print("  [warn] non-finite loss, skipping batch"); opt.zero_grad(set_to_none=True); continue
            scaler.scale(loss / cfg.grad_accum).backward()
            if (step + 1) % cfg.grad_accum == 0 or (step + 1) == len(trn_ld):
                scaler.unscale_(opt); nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                scaler.step(opt); scaler.update(); opt.zero_grad(set_to_none=True); ema.update(model)
            tl += loss.item(); nb += 1
        lr_now = sched.get_last_lr()[0]; sched.step()
        vl, vp, vs = validate(ema.module, val_ld, loss_fn, device, use_amp)
        rec = dict(epoch=ep, train_loss=tl / max(nb, 1), val_loss=vl, val_psnr=vp, val_ssim=vs, lr=lr_now,
                   seconds=time.time() - t0)
        hist.append(rec)
        print(f"Ep {ep:2d}/{cfg.epochs} | train {rec['train_loss']:.4f} val {vl:.4f} | "
              f"PSNR {vp:.2f} dB SSIM {vs:.4f} | {rec['seconds']:.0f}s")
        if vp > best_psnr:
            best_psnr, pat = vp, 0
            save_atomic({"ema": ema.module.state_dict(), "epoch": ep, "val_psnr": vp, "val_ssim": vs,
                         "levels": list(cfg.levels)}, cfg.best_ckpt)
            print(f"  >>> new best  PSNR {vp:.2f} dB  (saved {cfg.best_ckpt.name})")
        else:
            pat += 1
        save_atomic({"model": model.state_dict(), "ema": ema.module.state_dict(), "opt": opt.state_dict(),
                     "sched": sched.state_dict(), "scaler": scaler.state_dict(), "epoch": ep, "hist": hist,
                     "best_psnr": best_psnr, "pat": pat}, cfg.last_ckpt)
        pd.DataFrame(hist).to_csv(cfg.results_dir / "training_history.csv", index=False)
        plot_curves(hist, cfg.results_dir / "training_curves.png", cfg)
        if pat >= cfg.patience:
            print(f"Early stopping (no val PSNR gain for {cfg.patience} epochs)"); break

    print("=" * 72 + f"\nTRAINING DONE in {(time.time() - t_all) / 60:.1f} min | best val PSNR {best_psnr:.2f} dB\n" + "=" * 72)
    if cfg.best_ckpt.exists():      # small fp16 copy of the best EMA weights that is safe to commit to GitHub
        ck = torch.load(cfg.best_ckpt, map_location="cpu", weights_only=False)
        half = {k: (v.half() if v.is_floating_point() else v) for k, v in ck["ema"].items()}
        torch.save({"ema": half, "epoch": ck["epoch"], "val_psnr": ck["val_psnr"], "levels": ck["levels"]}, cfg.export_weights)
        print(f"Exported {cfg.export_weights} ({cfg.export_weights.stat().st_size / 1e6:.0f} MB)")
    print("Next: python evaluate.py")


if __name__ == "__main__":
    main()
