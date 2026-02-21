"""
download_fastas.py — Download FASTA genome sequences from PATRIC/BV-BRC API.

Uses parallel threads for speed. Resume-safe — skips already-downloaded files.
"""

import requests
import os
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

API_URL = "https://patricbrc.org/api/genome_sequence/"
FASTA_DIR = os.path.join(os.path.dirname(__file__), "fastas")
IDS_FILE = os.path.join(os.path.dirname(__file__), "ecoli_genome_ids_full.txt")
NUM_THREADS = 15
TIMEOUT = 30
MIN_FILE_SIZE = 1000  # bytes — skip files smaller than this (likely errors)


def download_one(genome_id):
    """Download a single genome FASTA. Returns (genome_id, success, msg)."""
    fasta_path = os.path.join(FASTA_DIR, f"{genome_id}.fasta")

    # Skip if already downloaded
    if os.path.exists(fasta_path) and os.path.getsize(fasta_path) > MIN_FILE_SIZE:
        return (genome_id, True, "skipped")

    try:
        url = f"{API_URL}?eq(genome_id,{genome_id})&http_accept=application/dna+fasta&limit(25000)"
        resp = requests.get(url, timeout=TIMEOUT)
        if resp.status_code == 200 and len(resp.text) > 500:
            with open(fasta_path, "w") as f:
                f.write(resp.text)
            return (genome_id, True, "downloaded")
        else:
            return (genome_id, False, f"status={resp.status_code} len={len(resp.text)}")
    except requests.RequestException as e:
        return (genome_id, False, str(e))


def main():
    if not os.path.exists(IDS_FILE):
        print(f"ERROR: {IDS_FILE} not found. Run download_amr.py first.")
        sys.exit(1)

    with open(IDS_FILE) as f:
        genome_ids = [line.strip() for line in f if line.strip()]

    os.makedirs(FASTA_DIR, exist_ok=True)

    print(f"Downloading FASTAs for {len(genome_ids)} genomes ({NUM_THREADS} threads)...")
    print(f"  Output: {FASTA_DIR}")

    downloaded = 0
    skipped = 0
    failed = 0
    failed_ids = []
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=NUM_THREADS) as pool:
        futures = {pool.submit(download_one, gid): gid for gid in genome_ids}

        for i, future in enumerate(as_completed(futures), 1):
            gid, success, msg = future.result()
            if success:
                if msg == "skipped":
                    skipped += 1
                else:
                    downloaded += 1
            else:
                failed += 1
                failed_ids.append(gid)

            if i % 100 == 0 or i == len(genome_ids):
                elapsed = time.time() - start_time
                rate = i / elapsed if elapsed > 0 else 0
                print(
                    f"  [{i}/{len(genome_ids)}] "
                    f"downloaded={downloaded} skipped={skipped} failed={failed} "
                    f"({rate:.1f} genomes/s)"
                )

    elapsed = time.time() - start_time
    print(f"\nDone in {elapsed:.0f}s")
    print(f"  Downloaded: {downloaded}")
    print(f"  Skipped (already existed): {skipped}")
    print(f"  Failed: {failed}")

    if failed_ids:
        failed_path = os.path.join(os.path.dirname(__file__), "failed_downloads.txt")
        with open(failed_path, "w") as f:
            for gid in failed_ids:
                f.write(gid + "\n")
        print(f"  Failed IDs saved to {failed_path}")


if __name__ == "__main__":
    main()
