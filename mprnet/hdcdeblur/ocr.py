"""OCR scoring of restored images against the ground-truth transcriptions shipped with HDC2021.

Metric (per image): character accuracy = 1 - Levenshtein(gt, ocr) / len(gt), clipped to [0, 1],
computed after removing all whitespace (random strings, case-sensitive). 'exact' = full match."""
import os
import numpy as np
from PIL import Image


def levenshtein(a, b):
    if a == b: return 0
    if not a: return len(b)
    if not b: return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def _norm(s): return "".join((s or "").split())


def char_accuracy(gt, pred):
    g, p = _norm(gt), _norm(pred)
    if not g: return float(not p)
    return max(0.0, 1.0 - levenshtein(g, p) / len(g))


def exact_match(gt, pred): return float(_norm(gt) == _norm(pred))


class OCR:
    def __init__(self, engine="easyocr", alphabet=None, gpu=None):
        self.engine, self.alphabet = engine, alphabet
        if engine == "easyocr":
            import easyocr, torch
            self.reader = easyocr.Reader(["en"], gpu=torch.cuda.is_available() if gpu is None else gpu, verbose=False)
        elif engine == "tesseract":
            import pytesseract
            if os.environ.get("TESSERACT_CMD"): pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_CMD"]
            self.pt = pytesseract
            self.pt.get_tesseract_version()          # fails early with a clear error if the binary is missing
        elif engine != "none":
            raise ValueError(f"unknown OCR engine {engine!r}")

    @property
    def enabled(self): return self.engine != "none"

    def read(self, img01):
        """img01: 2-D float array in [0,1] (dark text on light background)."""
        if not self.enabled: return ""
        u8 = np.clip(np.rint(img01 * 255), 0, 255).astype(np.uint8)
        if self.engine == "tesseract":
            u8 = np.pad(u8, 24, mode="constant", constant_values=255)
            cfg = "--oem 1 --psm 6" + (f" -c tessedit_char_whitelist={self.alphabet}" if self.alphabet else "")
            return self.pt.image_to_string(Image.fromarray(u8), config=cfg)
        kw = {"allowlist": self.alphabet} if self.alphabet else {}
        res = self.reader.readtext(u8, detail=1, paragraph=False, **kw)
        return _reading_order(res)


def _reading_order(res):
    """EasyOCR returns word/line boxes in arbitrary order -> sort top-to-bottom, left-to-right."""
    if not res: return ""
    items = []
    for box, text, _conf in res:
        ys = [p[1] for p in box]; xs = [p[0] for p in box]
        items.append((float(np.mean(ys)), float(np.mean(xs)), max(ys) - min(ys), text))
    items.sort(key=lambda t: t[0])
    tol = 0.6 * float(np.median([t[2] for t in items]))
    lines, cur = [], [items[0]]
    for it in items[1:]:
        if abs(it[0] - np.mean([c[0] for c in cur])) <= tol: cur.append(it)
        else: lines.append(cur); cur = [it]
    lines.append(cur)
    return "\n".join(" ".join(t[3] for t in sorted(l, key=lambda t: t[1])) for l in lines)
