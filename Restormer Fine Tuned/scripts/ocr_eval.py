"""OCR-only evaluation of focusStep pages with EasyOCR.

Uses the same protocol as the Phase 2 notebooks so the numbers are directly
comparable across levels:

  * 99.5th-percentile normalisation, 48 px border trim
  * EasyOCR lines sorted top-to-bottom, left-to-right
  * character accuracy = 1 - Levenshtein / len(GT), whitespace collapsed
  * token accuracy = fraction of GT tokens found (each predicted token used once)

Every image source is scored against the ground-truth .txt that sits next to the
blurred TIFF, matched by exact filename.

    python scripts/ocr_eval.py \
        --blurred-dir dataset/focusStep/blurred \
        --gt-dir dataset/focusStep/CAM01_focused \
        --levels 1 2 3 4 \
        --restored "Fine-tuned Restormer=outputs/restormer_ft" \
        --out results/ocr

Restored outputs are looked up as <stem>.png or <stem>.tif. Sources with no file
for a page are skipped for that page, so per-method n is reported.
"""

import argparse
import csv
import os
import re
from collections import defaultdict

import cv2
import easyocr
import numpy as np
import tifffile
from rapidfuzz.distance import Levenshtein

MARGIN = 48
NAME_RE = re.compile(r'^focusStep_(\d+)_(timesR|verdanaRef)_size_\d+_sample_(\d{4})$')


def read_image(path):
    if path.lower().endswith(('.tif', '.tiff')):
        img = tifffile.imread(path).astype(np.float32)
    else:
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED).astype(np.float32)
    if img.ndim == 3:
        img = img.mean(axis=-1)
    return img


def normalise(img):
    bg = np.percentile(img, 99.5)
    if bg <= 0:
        bg = img.max() + 1e-6
    return np.clip(img / bg, 0.0, 1.0)


def to_u8(img):
    return (np.clip(img, 0, 1) * 255).round().astype(np.uint8)


def ocr_text(reader, img):
    out = reader.readtext(to_u8(img), detail=1, paragraph=False)
    if len(out) == 0:
        return ''
    items = []
    for box, txt, conf in out:
        ys = [pt[1] for pt in box]
        xs = [pt[0] for pt in box]
        items.append((np.mean(ys), min(xs), max(ys) - min(ys), txt))
    items.sort(key=lambda t: t[0])
    lines = []
    for itm in items:
        if len(lines) > 0 and abs(itm[0] - lines[-1][0][0]) < 0.5 * itm[2]:
            lines[-1].append(itm)
        else:
            lines.append([itm])
    text_lines = []
    for ln in lines:
        ln.sort(key=lambda t: t[1])
        text_lines.append(' '.join(t[3] for t in ln))
    return ' '.join(text_lines)


def clean(s):
    return ' '.join(s.split())


def char_acc(pred, gt):
    gt_c = clean(gt)
    if len(gt_c) == 0:
        return float('nan')
    return max(0.0, 1.0 - Levenshtein.distance(clean(pred), gt_c) / len(gt_c))


def token_acc(pred, gt):
    gt_tok = clean(gt).split()
    if len(gt_tok) == 0:
        return float('nan')
    pred_tok = clean(pred).split()
    hits = 0
    for t in gt_tok:
        if t in pred_tok:
            pred_tok.remove(t)
            hits += 1
    return hits / len(gt_tok)


def find_image(folder, stem):
    for ext in ('.tif', '.tiff', '.png'):
        p = os.path.join(folder, stem + ext)
        if os.path.exists(p):
            return p
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--blurred-dir', required=True, help='Blurred TIFFs and their ground-truth .txt files')
    ap.add_argument('--gt-dir', help='Sharp CAM01 TIFFs (OCR upper bound)')
    ap.add_argument('--levels', type=int, nargs='+', default=[1, 2, 3, 4])
    ap.add_argument('--restored', action='append', default=[], metavar='NAME=DIR',
                    help='Restored outputs to score, repeatable')
    ap.add_argument('--out', required=True, help='Output folder for the CSVs')
    ap.add_argument('--device', default='cpu', help="EasyOCR device: 'cpu', 'cuda' or 'mps'")
    args = ap.parse_args()

    sources = [('Blurred input', args.blurred_dir)]
    for spec in args.restored:
        name, folder = spec.split('=', 1)
        sources.append((name, folder))
    if args.gt_dir:
        sources.append(('Sharp GT (upper bound)', args.gt_dir))

    pages = []
    for f in sorted(os.listdir(args.blurred_dir)):
        stem, ext = os.path.splitext(f)
        m = NAME_RE.match(stem)
        if ext.lower() != '.tif' or not m or int(m.group(1)) not in args.levels:
            continue
        txt = os.path.join(args.blurred_dir, stem + '.txt')
        if not os.path.exists(txt):
            continue
        pages.append({'stem': stem, 'level': int(m.group(1)), 'font': m.group(2),
                      'gt': open(txt, encoding='utf-8', errors='ignore').read()})
    print(f'{len(pages)} pages across levels {args.levels}')

    gpu = args.device if args.device != 'cpu' else False
    reader = easyocr.Reader(['en'], gpu=gpu, verbose=False)
    os.makedirs(args.out, exist_ok=True)

    rows = []
    for i, p in enumerate(pages):
        for name, folder in sources:
            path = find_image(folder, p['stem'])
            if path is None:
                continue
            img = normalise(read_image(path))[MARGIN:-MARGIN, MARGIN:-MARGIN]
            pred = ocr_text(reader, img)
            rows.append({'level': p['level'], 'method': name, 'id': p['stem'], 'font': p['font'],
                         'char_acc': char_acc(pred, p['gt']), 'token_acc': token_acc(pred, p['gt']),
                         'gt': clean(p['gt']), 'ocr': clean(pred)})
        print(f'[{i + 1}/{len(pages)}] {p["stem"]}', flush=True)

    with open(os.path.join(args.out, 'ocr_per_image.csv'), 'w', newline='') as fp:
        w = csv.DictWriter(fp, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    agg = defaultdict(list)
    for r in rows:
        agg[(r['level'], r['method'])].append(r)
    order = [name for name, _ in sources]
    with open(os.path.join(args.out, 'ocr_summary.csv'), 'w', newline='') as fp:
        w = csv.writer(fp)
        w.writerow(['level', 'method', 'n', 'char_acc', 'token_acc'])
        for lv in args.levels:
            for name in order:
                rs = agg.get((lv, name))
                if not rs:
                    continue
                ca = float(np.nanmean([r['char_acc'] for r in rs]))
                ta = float(np.nanmean([r['token_acc'] for r in rs]))
                w.writerow([lv, name, len(rs), round(ca, 4), round(ta, 4)])
                print(f'L{lv} {name:24s} n={len(rs):3d}  char {100 * ca:5.1f}%  token {100 * ta:5.1f}%')


if __name__ == '__main__':
    main()
