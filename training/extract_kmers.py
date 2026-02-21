"""
extract_kmers.py — Compute 6-mer frequency vectors from FASTA genome sequences.

Reads each genome's FASTA file, counts all 6-mer occurrences across contigs,
normalizes to frequencies, and saves as a numpy feature matrix.
"""

import numpy as np
import json
import os
from itertools import product

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FASTA_DIR = os.path.join(DATA_DIR, "fastas")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

K = 6
BASES = "ACGT"


def build_kmer_index():
    """Build mapping from k-mer string to column index. 4^6 = 4096 k-mers."""
    kmers = ["".join(combo) for combo in product(BASES, repeat=K)]
    return {kmer: i for i, kmer in enumerate(kmers)}


def read_fasta_sequences(fasta_path):
    """Read a FASTA file and yield uppercase sequence strings (one per contig)."""
    sequence = []
    with open(fasta_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                if sequence:
                    yield "".join(sequence)
                    sequence = []
            else:
                sequence.append(line.upper())
    if sequence:
        yield "".join(sequence)


def count_kmers(fasta_path, kmer_index):
    """Count 6-mer occurrences across all contigs in a FASTA file."""
    counts = np.zeros(len(kmer_index), dtype=np.float64)
    for seq in read_fasta_sequences(fasta_path):
        for i in range(len(seq) - K + 1):
            kmer = seq[i : i + K]
            if kmer in kmer_index:
                counts[kmer_index[kmer]] += 1
    return counts


def main():
    genome_ids_path = os.path.join(PROCESSED_DIR, "genome_ids.json")
    with open(genome_ids_path) as f:
        genome_ids = json.load(f)

    print(f"Extracting {K}-mer frequencies for {len(genome_ids)} genomes...")
    kmer_index = build_kmer_index()
    kmer_names = sorted(kmer_index, key=kmer_index.get)
    n_features = len(kmer_index)
    print(f"  Feature space: {n_features} {K}-mers")

    feature_matrix = np.zeros((len(genome_ids), n_features), dtype=np.float32)

    for i, gid in enumerate(genome_ids):
        fasta_path = os.path.join(FASTA_DIR, f"{gid}.fasta")
        counts = count_kmers(fasta_path, kmer_index)

        # Normalize to frequencies
        total = counts.sum()
        if total > 0:
            feature_matrix[i] = (counts / total).astype(np.float32)

        if (i + 1) % 25 == 0 or i == 0:
            print(f"  Processed {i + 1}/{len(genome_ids)} genomes")

    # Save outputs
    features_path = os.path.join(PROCESSED_DIR, "kmer_features.npy")
    np.save(features_path, feature_matrix)
    print(f"\nSaved feature matrix {feature_matrix.shape} to {features_path}")

    kmer_names_path = os.path.join(PROCESSED_DIR, "kmer_names.json")
    with open(kmer_names_path, "w") as f:
        json.dump(kmer_names, f)
    print(f"Saved k-mer names to {kmer_names_path}")

    # Quick sanity check
    nonzero_per_genome = (feature_matrix > 0).sum(axis=1)
    print(f"\nSanity check:")
    print(f"  Mean non-zero features per genome: {nonzero_per_genome.mean():.0f} / {n_features}")
    print(f"  Min: {nonzero_per_genome.min()}, Max: {nonzero_per_genome.max()}")


if __name__ == "__main__":
    main()
