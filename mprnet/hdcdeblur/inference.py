"""Sliding-window inference with Hanning blending and batched 8-way test-time augmentation."""
import numpy as np
import torch

from .utils import pad_mul

# (flip, rot90-count). Taking the first n entries gives 1 / 2 / 4 / 8-way TTA.
_TTA = [(0, 0), (1, 0), (0, 2), (1, 2), (0, 1), (1, 1), (0, 3), (1, 3)]


@torch.no_grad()
def _forward(net, arrs, device):
    """arrs: list of 2-D float32 arrays with identical shape -> list of restored 2-D arrays."""
    x = torch.from_numpy(np.stack(arrs)[:, None]).repeat(1, 3, 1, 1).to(device)
    x, h, w = pad_mul(x, 8)
    use_amp = torch.device(device).type == "cuda"
    with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=use_amp):
        out = net(x)
    if isinstance(out, (list, tuple)): out = out[0]
    out = out[:, :, :h, :w].float().clamp(0, 1).mean(1).cpu().numpy()
    return [o for o in out]


def restore_tile(net, tile, device, n_tta=8, tta_batch=4):
    n_tta = max(1, min(8, n_tta))
    jobs = []
    for flip, k in _TTA[:n_tta]:
        a = np.fliplr(tile) if flip else tile
        if k: a = np.rot90(a, k)
        jobs.append((flip, k, np.ascontiguousarray(a, dtype=np.float32)))
    preds = []
    # only arrays of the same shape can be batched (rot90 of a non-square tile changes its shape)
    for shape in {j[2].shape for j in jobs}:
        grp = [j for j in jobs if j[2].shape == shape]
        for i in range(0, len(grp), tta_batch):
            chunk = grp[i:i + tta_batch]
            for (flip, k, _), p in zip(chunk, _forward(net, [c[2] for c in chunk], device)):
                if k: p = np.rot90(p, -k)
                if flip: p = np.fliplr(p)
                preds.append(p)
    return np.mean(preds, 0).astype(np.float32)


def _positions(n, t, stride):
    pos = list(range(0, n - t + 1, stride))
    if pos[-1] != n - t: pos.append(n - t)
    return pos


def _hann(n):
    return np.hanning(n + 2)[1:-1]          # strictly positive, so no pixel ends up with zero weight


def restore_image(net, img, device, tile=512, overlap=64, n_tta=8, tta_batch=4):
    """img: 2-D float32 in [0,1]  ->  restored 2-D float32 in [0,1]."""
    h, w = img.shape
    if h <= tile and w <= tile:
        return restore_tile(net, img, device, n_tta, tta_batch)
    th, tw = min(tile, h), min(tile, w)
    ys = _positions(h, th, max(th - overlap, 1)); xs = _positions(w, tw, max(tw - overlap, 1))
    win = np.outer(_hann(th), _hann(tw)).astype(np.float32)
    acc = np.zeros((h, w), np.float32); wt = np.zeros((h, w), np.float32)
    for y in ys:
        for x in xs:
            p = restore_tile(net, img[y:y + th, x:x + tw], device, n_tta, tta_batch)
            acc[y:y + th, x:x + tw] += p * win; wt[y:y + th, x:x + tw] += win
    return np.clip(acc / np.maximum(wt, 1e-8), 0, 1).astype(np.float32)
