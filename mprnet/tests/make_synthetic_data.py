"""Create a tiny fake HDC2021-style dataset so you can test the whole pipeline in a minute
(no 17 GB download). Mimics the real layout: step<N>/<Font>/CAM1|CAM2/*.tif + .txt transcriptions.

    python tests/make_synthetic_data.py --out data_synth/HDC2021
    python train.py --data-dir data_synth --out-dir outputs_synth --quick --patch-size 64 --no-pretrained
"""
import argparse, random, string
from pathlib import Path

import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont


def font(size):
    for name in ("DejaVuSans.ttf", "arial.ttf", "Arial.ttf", "Verdana.ttf"):
        try: return ImageFont.truetype(name, size)
        except OSError: pass
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data_synth/HDC2021"); ap.add_argument("--levels", type=int, default=7)
    ap.add_argument("--samples", type=int, default=6); ap.add_argument("--h", type=int, default=384)
    ap.add_argument("--w", type=int, default=640)
    a = ap.parse_args(); rng = random.Random(0); out = Path(a.out)
    for lv in range(a.levels):
        for fi, fname in enumerate(("Verdana", "Times")):
            c1, c2 = ("CAM1", "CAM2") if fi == 0 else ("CAM01", "CAM02")      # test both folder spellings
            d1, d2 = out / f"step{lv}" / fname / c1, out / f"step{lv}" / fname / c2
            d1.mkdir(parents=True, exist_ok=True); d2.mkdir(parents=True, exist_ok=True)
            for s in range(a.samples):
                lines = ["".join(rng.choice(string.ascii_letters) for _ in range(10)) for _ in range(3)]
                im = Image.new("L", (a.w, a.h), 255); dr = ImageDraw.Draw(im); f = font(54)
                for i, t in enumerate(lines): dr.text((40, 30 + i * 100), t, fill=0, font=f)
                sharp = np.array(im).astype(np.float32)
                sigma = 0.3 + 1.1 * lv
                blur = cv2.GaussianBlur(sharp, (0, 0), sigma) + np.random.default_rng(s).normal(0, 4, sharp.shape)
                stem = f"focusStep_{lv}_{fname.lower()}Ref_size_30_sample_{s:04d}"
                n1 = f"{stem}.tif" if fi == 0 else f"{c1}_{stem}.tif"
                n2 = f"{stem}.tif" if fi == 0 else f"{c2}_{stem}.tif"
                Image.fromarray(np.clip(sharp, 0, 255).astype(np.uint8)).save(d1 / n1)
                Image.fromarray(np.clip(blur, 0, 255).astype(np.uint8)).save(d2 / n2)
                (d1 / n1).with_suffix(".txt").write_text("\n".join(lines)); (d2 / n2).with_suffix(".txt").write_text("\n".join(lines))
            # a technical target (no transcription) that discovery must ignore
            Image.fromarray(np.full((a.h, a.w), 128, np.uint8)).save(d2 / f"focusStep_{lv}_PSF_dots.tif")
            Image.fromarray(np.full((a.h, a.w), 128, np.uint8)).save(d1 / f"focusStep_{lv}_PSF_dots.tif")
    print(f"synthetic dataset written to {out}")


if __name__ == "__main__":
    main()
