import os, random
from copy import deepcopy
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from skimage.metrics import peak_signal_noise_ratio as _psnr
from skimage.metrics import structural_similarity as _ssim


def seed_everything(seed=42):
    random.seed(seed); np.random.seed(seed)
    torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device(name=None):
    if name: return torch.device(name)
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def default_num_workers():
    # Windows uses 'spawn' which makes worker processes slow/fragile; the data is already in RAM.
    if os.name == "nt": return 0
    return min(2, max(0, (os.cpu_count() or 1) - 1))


def load_gray_np(path):
    """Load an image as float32 grayscale in [0,1] with per-image min-max scaling (as in the notebook)."""
    arr = np.array(Image.open(path)).astype(np.float32)
    if arr.ndim == 3: arr = arr[:, :, 0]
    mn, mx = float(arr.min()), float(arr.max())
    arr = (arr - mn) / (mx - mn) if mx > mn else arr / 255.0
    return np.clip(arr, 0.0, 1.0)


def pad_mul(x, m=8):
    h, w = x.shape[2], x.shape[3]
    ph, pw = (m - h % m) % m, (m - w % m) % m
    if ph or pw: x = F.pad(x, (0, pw, 0, ph), mode="reflect")
    return x, h, w


def calc_metrics(pred, gt):
    return (float(_psnr(gt, pred, data_range=1.0)), float(_ssim(gt, pred, data_range=1.0)))


def center_crop(arr, size):
    if size is None: return arr, (0, 0)
    h, w = arr.shape
    ch, cw = min(size[0], h), min(size[1], w)
    sy, sx = (h - ch) // 2, (w - cw) // 2
    return arr[sy:sy + ch, sx:sx + cw], (sy, sx)


class EMA:
    """Exponential moving average of the weights, kept as a separate model copy."""
    def __init__(self, model, decay=0.999):
        self.decay = decay
        self.module = deepcopy(model).eval()
        for p in self.module.parameters(): p.requires_grad_(False)

    @torch.no_grad()
    def update(self, model):
        d = self.decay
        for e, m in zip(self.module.state_dict().values(), model.state_dict().values()):
            if e.dtype.is_floating_point: e.mul_(d).add_(m.detach(), alpha=1 - d)
            else: e.copy_(m)


def _clean_state(sd):
    return {(k[7:] if k.startswith("module.") else k): v for k, v in sd.items()}


def load_pretrained(net, path, allow_partial=False):
    """Load the official MPRNet deblurring weights. Raises if the keys do not match,
    so you can never silently train from random weights."""
    ck = torch.load(path, map_location="cpu", weights_only=False)
    sd = ck.get("state_dict", ck.get("model", ck.get("ema", ck.get("params", ck))))
    missing, unexpected = net.load_state_dict(_clean_state(sd), strict=False)
    print(f"  loaded {os.path.basename(str(path))}: missing={len(missing)} unexpected={len(unexpected)}")
    if missing and not allow_partial:
        raise RuntimeError(f"{len(missing)} keys missing from {path} (first: {missing[:3]}). "
                           "Wrong weights file?")
    return net


def load_finetuned(net, path, device="cpu"):
    """Load our own checkpoint (best.pth / last.pth / exported fp16 weights); prefers EMA weights."""
    ck = torch.load(path, map_location=device, weights_only=False)
    sd = ck.get("ema", ck.get("model", ck.get("state_dict", ck)))
    sd = {k: (v.float() if torch.is_tensor(v) and v.is_floating_point() else v)
          for k, v in _clean_state(sd).items()}
    net.load_state_dict(sd, strict=True)
    return net, ck
