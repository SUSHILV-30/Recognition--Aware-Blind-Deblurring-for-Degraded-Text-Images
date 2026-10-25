"""Central configuration. Every path is relative to the repo root, so the project
runs the same on Windows / macOS / Linux and inside VS Code (no Colab paths)."""
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@dataclass
class Config:
    # ---- dataset -------------------------------------------------------------
    levels: tuple = (0, 1, 2, 3, 4, 5, 6)      # focus steps used for training + evaluation
    zenodo_record: str = "4916176"
    data_dir: Path = ROOT / "data"
    pretrained_gdrive_id: str = "1QwQUVbk6YVOJViCsOKYNykCsdJSVGRtb"   # official MPRNet deblurring weights
    pretrained_path: Path = ROOT / "weights" / "model_deblurring.pth"

    # ---- outputs (everything you commit lives under outputs/) ----------------
    out_dir: Path = ROOT / "outputs"

    # ---- split ---------------------------------------------------------------
    seed: int = 42
    test_frac: float = 0.20     # per level
    val_frac: float = 0.15      # of the remaining train pairs, per level

    # ---- training ------------------------------------------------------------
    patch_size: int = 256
    train_patches_per_image: int = 4
    val_patches_per_image: int = 3
    batch_size: int = 2
    grad_accum: int = 2
    epochs: int = 20
    lr: float = 5e-5
    weight_decay: float = 1e-4
    lr_min: float = 1e-6
    patience: int = 8
    ema_decay: float = 0.999
    # loss weights -- these are the values the original notebook actually trained with
    charb_w: float = 0.5
    fft_w: float = 0.3
    ssim_w: float = 0.2

    # ---- inference / evaluation ---------------------------------------------
    tile: int = 512
    overlap: int = 64
    tta: int = 8                # 1, 2, 4 or 8 augmentations
    tta_batch: int = 4          # augmentations pushed through the GPU at once
    metric_crop: tuple = (512, 1024)   # centre crop for PSNR/SSIM (as in the notebook); None = full image
    ocr_engine: str = "easyocr"        # easyocr | tesseract | none
    ocr_alphabet: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

    # optional reference result from the original notebook (Level 5 only)
    friend_level: int = 5
    friend_psnr: float = 18.588
    friend_ssim: float = 0.795

    # ---- derived paths -------------------------------------------------------
    @property
    def raw_dir(self): return self.data_dir / "raw"
    @property
    def extract_dir(self): return self.data_dir / "HDC2021"
    @property
    def cache_dir(self): return self.data_dir / "cache"
    @property
    def ckpt_dir(self): return self.out_dir / "checkpoints"
    @property
    def results_dir(self): return self.out_dir / "results"
    @property
    def weights_dir(self): return self.out_dir / "weights"
    @property
    def best_ckpt(self): return self.ckpt_dir / "best.pth"
    @property
    def last_ckpt(self): return self.ckpt_dir / "last.pth"
    @property
    def export_weights(self): return self.weights_dir / "mprnet_hdc_levels0-6_ema_fp16.pth"

    def make_dirs(self):
        for d in (self.raw_dir, self.extract_dir, self.cache_dir, self.ckpt_dir,
                  self.results_dir, self.weights_dir, self.pretrained_path.parent):
            d.mkdir(parents=True, exist_ok=True)


def parse_levels(spec):
    """'0-6' -> (0..6); '0 2 5' / '0,2,5' -> (0,2,5)."""
    if isinstance(spec, (list, tuple)):
        spec = ",".join(str(s) for s in spec)
    out = []
    for part in str(spec).replace(" ", ",").split(","):
        if not part: continue
        if "-" in part:
            a, b = part.split("-"); out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return tuple(sorted(set(out)))
