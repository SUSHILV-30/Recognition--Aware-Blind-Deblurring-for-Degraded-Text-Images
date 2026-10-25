"""Download + extract HDC2021 focus steps (default: 0-6) from Zenodo record 4916176.

    python download_data.py                 # steps 0-6  (~2.5 GB per step, ~17 GB total)
    python download_data.py --steps 5       # just one step
    python download_data.py --delete-zips   # free disk space after each successful extraction

Downloads resume automatically if interrupted. Re-running skips steps that are already extracted."""
import argparse, sys, zipfile
from pathlib import Path

import requests
from tqdm import tqdm

from hdcdeblur.config import Config, parse_levels

URL = "https://zenodo.org/api/records/{rec}/files/HDC2021_step{n}.zip/content"


def download(url, dest, chunk=1 << 20):
    dest = Path(dest); part = dest.with_suffix(dest.suffix + ".part")
    done = part.stat().st_size if part.exists() else 0
    headers = {"Range": f"bytes={done}-"} if done else {}
    with requests.get(url, stream=True, headers=headers, timeout=60) as r:
        if r.status_code == 416:                       # already complete
            part.rename(dest); return
        r.raise_for_status()
        if done and r.status_code != 206: done = 0     # server ignored Range -> restart
        total = int(r.headers.get("content-length", 0)) + done
        with open(part, "ab" if done else "wb") as f, tqdm(total=total, initial=done, unit="B",
                                                            unit_scale=True, desc=dest.name) as bar:
            for blk in r.iter_content(chunk):
                f.write(blk); bar.update(len(blk))
    part.rename(dest)


def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", default="0-6", help="e.g. 0-6 or 0,2,5")
    ap.add_argument("--data-dir", default=str(cfg.data_dir))
    ap.add_argument("--delete-zips", action="store_true")
    a = ap.parse_args()
    cfg.data_dir = Path(a.data_dir); cfg.make_dirs()

    for n in parse_levels(a.steps):
        out = cfg.extract_dir / f"step{n}"
        if out.exists() and any(out.rglob("*.tif")):
            print(f"step {n}: already extracted -> {out}"); continue
        zp = cfg.raw_dir / f"HDC2021_step{n}.zip"
        if not zp.exists():
            print(f"step {n}: downloading ..."); download(URL.format(rec=cfg.zenodo_record, n=n), zp)
        if not zipfile.is_zipfile(zp):
            sys.exit(f"{zp} is not a valid zip (delete it and re-run).")
        print(f"step {n}: extracting -> {out}")
        out.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zp) as z:
            members = [m for m in z.namelist() if "__MACOSX" not in m]
            for m in tqdm(members, desc=f"unzip step{n}"): z.extract(m, out)
        if a.delete_zips: zp.unlink(); print(f"step {n}: zip deleted")
    print("Done.")


if __name__ == "__main__":
    main()
