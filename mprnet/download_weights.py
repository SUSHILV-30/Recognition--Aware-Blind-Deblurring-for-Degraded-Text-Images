"""Fetch the official MPRNet GoPro-deblurring weights (model_deblurring.pth) into weights/.

If the automatic download fails (Google Drive quota), download `model_deblurring.pth` manually from the
official repo  https://github.com/swz30/MPRNet  (Deblurring/ -> pretrained models link) and place it at
weights/model_deblurring.pth"""
import sys
from hdcdeblur.config import Config

cfg = Config(); cfg.make_dirs()
dst = cfg.pretrained_path
if dst.exists() and dst.stat().st_size > 1_000_000:
    print(f"Already present: {dst} ({dst.stat().st_size / 1e6:.1f} MB)"); sys.exit(0)
try:
    import gdown
    gdown.download(id=cfg.pretrained_gdrive_id, output=str(dst), quiet=False)
except Exception as e:
    print(f"[error] automatic download failed: {e}")
if not dst.exists() or dst.stat().st_size < 1_000_000:
    sys.exit(f"\nPlease place model_deblurring.pth at: {dst}")
print(f"OK: {dst} ({dst.stat().st_size / 1e6:.1f} MB)")
