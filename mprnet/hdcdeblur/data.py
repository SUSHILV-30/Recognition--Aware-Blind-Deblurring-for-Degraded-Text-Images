"""HDC2021 discovery, pairing, stratified splitting and the patch dataset."""
import hashlib, json, os, random, re, zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset
from tqdm import tqdm

from .utils import load_gray_np
from scipy.ndimage import shift as _nd_shift
from skimage.registration import phase_cross_correlation

IMG_EXTS = (".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp")
_SHARP_DIR = re.compile(r"^cam_?0?1", re.I)     # CAM1 / CAM01 / CAM1_focused
_BLUR_DIR = re.compile(r"^cam_?0?2", re.I)      # CAM2 / CAM02 / CAM2_blurred
_LEVEL_FILE = re.compile(r"focusstep_?(\d+)", re.I)
_LEVEL_PATH = re.compile(r"step_?(\d+)", re.I)
_FONTS = ("verdana", "times")


def _key(stem):
    """Name used to match a blurred image with its sharp twin (camera + focus-step tokens removed)."""
    s = stem.lower()
    s = re.sub(r"cam_?0?[12]", "", s)
    s = re.sub(r"focusstep_?\d+", "", s)
    return re.sub(r"[^a-z0-9]", "", s)


def _font(path):
    for part in list(Path(path).parts)[::-1]:
        for f in _FONTS:
            if f in part.lower(): return f
    return "unknown"


def _level(path, root):
    m = _LEVEL_FILE.search(Path(path).name)
    if m: return int(m.group(1))
    m = _LEVEL_PATH.search(str(Path(path).relative_to(root)))
    return int(m.group(1)) if m else None


def _looks_like_text_target(name):
    n = name.lower()
    if any(k in n for k in ("qr", "dot", "image_", "psf", "line")): return False
    return any(k in n for k in ("times", "verdana", "text"))


def discover_pairs(root, levels=None, verbose=True):
    """Find every (blurred, sharp) text-target pair below `root`.
    Returns a list of dicts with paths RELATIVE to root plus level / font / transcription."""
    root = Path(root)
    pairs, skipped_unmatched = [], 0
    for dirpath, _dirs, _files in os.walk(root):
        d = Path(dirpath)
        if "__MACOSX" in d.parts or not _BLUR_DIR.match(d.name): continue
        sharp_dirs = [s for s in d.parent.iterdir() if s.is_dir() and _SHARP_DIR.match(s.name)]
        if not sharp_dirs: continue
        sharp = {}
        for sd in sharp_dirs:
            for f in sd.iterdir():
                if f.is_file() and not f.name.startswith(".") and f.suffix.lower() in IMG_EXTS:
                    sharp.setdefault(_key(f.stem), f)
        for f in sorted(d.iterdir()):
            if not f.is_file() or f.name.startswith(".") or f.suffix.lower() not in IMG_EXTS: continue
            gt_img = sharp.get(_key(f.stem))
            if gt_img is None:
                skipped_unmatched += 1; continue
            txt_file = next((p for p in (f.with_suffix(".txt"), gt_img.with_suffix(".txt")) if p.exists()), None)
            if txt_file is None and not _looks_like_text_target(f.name): continue   # technical target (PSF, ...)
            lv = _level(f, root)
            if lv is None or (levels is not None and lv not in levels): continue
            text = txt_file.read_text(encoding="utf-8", errors="ignore").strip() if txt_file else None
            pairs.append({"blur": f.relative_to(root).as_posix(), "gt": gt_img.relative_to(root).as_posix(),
                          "level": lv, "font": _font(f), "name": f.name, "text": text})
    pairs.sort(key=lambda p: (p["level"], p["font"], p["name"]))
    if verbose:
        by = {}
        for p in pairs: by.setdefault(p["level"], {}).setdefault(p["font"], 0); by[p["level"]][p["font"]] += 1
        for lv in sorted(by): print(f"  level {lv}: {sum(by[lv].values()):4d} pairs  {by[lv]}")
        if skipped_unmatched: print(f"  [warn] {skipped_unmatched} blurred images had no sharp twin and were skipped")
        n_txt = sum(p["text"] is not None for p in pairs)
        print(f"  total {len(pairs)} pairs, {n_txt} with a transcription (.txt)")
    return pairs


def make_splits(pairs, seed=42, test_frac=0.20, val_frac=0.15):
    """Stratified (per level) deterministic train/val/test split."""
    rng = random.Random(seed)
    out = {"train": [], "val": [], "test": []}
    for lv in sorted({p["level"] for p in pairs}):
        grp = [p for p in pairs if p["level"] == lv]
        grp.sort(key=lambda p: (p["font"], p["name"])); rng.shuffle(grp)
        n_test = max(1, int(round(test_frac * len(grp))))
        test, rest = grp[:n_test], grp[n_test:]
        n_val = max(1, int(round(val_frac * len(rest)))) if len(rest) > 1 else 0
        out["test"] += test; out["val"] += rest[:n_val]; out["train"] += rest[n_val:]
    for k in out: out[k].sort(key=lambda p: (p["level"], p["font"], p["name"]))
    return out


def save_splits(splits, path):
    slim = {k: [{"name": p["name"], "level": p["level"], "font": p["font"], "blur": p["blur"]} for p in v]
            for k, v in splits.items()}
    Path(path).write_text(json.dumps(slim, indent=1))


# ------------------------------------------------------------------------------------------------
def _sample_patches(args):
    pair, root, ps, n, seed = args
    rng = np.random.default_rng([seed, zlib.crc32(pair["name"].encode()), pair["level"]])
    b = load_gray_np(Path(root) / pair["blur"]); g = load_gray_np(Path(root) / pair["gt"])
    h, w = min(b.shape[0], g.shape[0]), min(b.shape[1], g.shape[1])
    b, g = b[:h, :w], g[:h, :w]
    try:
        _s, _, _ = phase_cross_correlation(b, g)
        _s = np.round(_s)
        if np.abs(_s).max() < 60: g = _nd_shift(g, _s, order=0, mode='nearest')
    except Exception: pass
    if h < ps or w < ps:
        pad = ((0, max(0, ps - h)), (0, max(0, ps - w)))
        b, g = np.pad(b, pad, mode="edge"), np.pad(g, pad, mode="edge"); h, w = g.shape
    bs, gs = [], []
    for _ in range(n):
        best = None
        for _try in range(12):                       # prefer patches that actually contain text
            y = int(rng.integers(0, h - ps + 1)); x = int(rng.integers(0, w - ps + 1))
            sd = float(g[y:y + ps, x:x + ps].std())
            if best is None or sd > best[0]: best = (sd, y, x)
            if sd > 0.03: break
        _, y, x = best
        bs.append(np.rint(b[y:y + ps, x:x + ps] * 255).astype(np.uint8))
        gs.append(np.rint(g[y:y + ps, x:x + ps] * 255).astype(np.uint8))
    return bs, gs


def build_patches(pairs, root, ps, n, seed, cache_dir, tag, workers=4):
    """Pre-extract n patches per pair (uint8 to keep RAM small). Cached on disk as .npz."""
    sig = hashlib.md5(json.dumps([[p["name"], p["level"]] for p in pairs] + [ps, n, seed]).encode()).hexdigest()[:10]
    cache = Path(cache_dir) / f"patches_{tag}_{ps}_{n}_{sig}.npz"
    if cache.exists():
        z = np.load(cache); print(f"  [{tag}] loaded {len(z['b'])} cached patches <- {cache.name}")
        return z["b"], z["g"]
    jobs = [(p, root, ps, n, seed) for p in pairs]
    B, G = [], []
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for bs, gs in tqdm(ex.map(_sample_patches, jobs), total=len(jobs), desc=f"  [{tag}] extracting patches"):
            B += bs; G += gs
    B, G = np.stack(B), np.stack(G)
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    np.savez(cache, b=B, g=G)
    return B, G


class PatchDataset(Dataset):
    def __init__(self, blur_u8, gt_u8, augment=True):
        self.b, self.g, self.augment = blur_u8, gt_u8, augment

    def __len__(self): return len(self.b)

    def __getitem__(self, i):
        b, g = self.b[i], self.g[i]
        if self.augment:
            if random.random() > 0.5: b, g = b[:, ::-1], g[:, ::-1]
            if random.random() > 0.5: b, g = b[::-1], g[::-1]
            k = random.randint(0, 3)
            if k: b, g = np.rot90(b, k), np.rot90(g, k)
        f = lambda a: torch.from_numpy(np.ascontiguousarray(a)).float().div_(255.0).unsqueeze(0).repeat(3, 1, 1)
        return f(b), f(g)
