"""
extract_kmers_fast.py — Parallel 6-mer extraction using multiprocessing.

Same input/output as extract_kmers.py but distributes genome processing
across all CPU cores via multiprocessing.Pool.

Usage: python extract_kmers_fast.py
"""

import numpy as np
import json
import os
import time
from multiprocessing import Pool, cpu_count
from extract_kmers import build_kmer_index, read_fasta_sequences, K

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FASTA_DIR = os.path.join(DATA_DIR, "fastas")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

# Build once at module level so each worker inherits it via fork/spawn
KMER_INDEX = build_kmer_index()
N_FEATURES = len(KMER_INDEX)


def process_genome(gid):
    """Count and normalize k-mers for a single genome. Worker function."""
    fasta_path = os.path.join(FASTA_DIR, f"{gid}.fasta")
    if not os.path.exists(fasta_path):
        return gid, np.zeros(N_FEATURES, dtype=np.float32), False

    counts = np.zeros(N_FEATURES, dtype=np.float64)
    for seq in read_fasta_sequences(fasta_path):
        for i in range(len(seq) - K + 1):
            kmer = seq[i : i + K]
            if kmer in KMER_INDEX:
                counts[KMER_INDEX[kmer]] += 1

    total = counts.sum()
    if total > 0:
        freq = (counts / total).astype(np.float32)
    else:
        freq = counts.astype(np.float32)

    return gid, freq, True


def main():
    genome_ids_path = os.path.join(PROCESSED_DIR, "genome_ids.json")
    with open(genome_ids_path) as f:
        genome_ids = json.load(f)

    n_workers = min(cpu_count(), len(genome_ids))
    kmer_names = sorted(KMER_INDEX, key=KMER_INDEX.get)

    print(f"Extracting {K}-mer frequencies for {len(genome_ids)} genomes...")
    print(f"  Feature space: {N_FEATURES} {K}-mers")
    print(f"  Workers: {n_workers} CPU cores")

    feature_matrix = np.zeros((len(genome_ids), N_FEATURES), dtype=np.float32)
    gid_to_idx = {gid: i for i, gid in enumerate(genome_ids)}

    t0 = time.time()
    completed = 0
    failed = 0

    with Pool(processes=n_workers) as pool:
        for gid, freq, ok in pool.imap_unordered(process_genome, genome_ids, chunksize=8):
            idx = gid_to_idx[gid]
            feature_matrix[idx] = freq
            completed += 1
            if not ok:
                failed += 1
            if completed % 50 == 0 or completed == len(genome_ids):
                elapsed = time.time() - t0
                rate = completed / elapsed
                print(f"  {completed}/{len(genome_ids)} genomes  ({rate:.1f}/s)")

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.1f}s ({len(genome_ids)/elapsed:.1f} genomes/s)")
    if failed:
        print(f"  WARNING: {failed} genomes had missing FASTA files")

    # Save outputs (same paths as extract_kmers.py)
    features_path = os.path.join(PROCESSED_DIR, "kmer_features.npy")
    np.save(features_path, feature_matrix)
    print(f"Saved feature matrix {feature_matrix.shape} to {features_path}")

    kmer_names_path = os.path.join(PROCESSED_DIR, "kmer_names.json")
    with open(kmer_names_path, "w") as f:
        json.dump(kmer_names, f)
    print(f"Saved k-mer names to {kmer_names_path}")

    # Sanity check
    nonzero_per_genome = (feature_matrix > 0).sum(axis=1)
    print(f"\nSanity check:")
    print(f"  Mean non-zero features per genome: {nonzero_per_genome.mean():.0f} / {N_FEATURES}")
    print(f"  Min: {nonzero_per_genome.min()}, Max: {nonzero_per_genome.max()}")


if __name__ == "__main__":
    main()
