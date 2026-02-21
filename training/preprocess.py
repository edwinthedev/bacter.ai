"""
preprocess.py — Build genome x antibiotic label matrix from AMR phenotype data.

Filters to E. coli, keeps Resistant/Susceptible phenotypes for target antibiotics,
converts MIC values to R/S using CLSI breakpoints, and aligns with available FASTA files.
"""

import pandas as pd
import numpy as np
import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CSV_PATH = os.path.join(DATA_DIR, "amr_all.csv")
FASTA_DIR = os.path.join(DATA_DIR, "fastas")
OUTPUT_DIR = os.path.join(DATA_DIR, "processed")

TARGET_ANTIBIOTICS = [
    "ampicillin",
    "ciprofloxacin",
    "ceftriaxone",
    "gentamicin",
    "meropenem",
    "trimethoprim/sulfamethoxazole",
    "ceftazidime",
    "tetracycline",
    "chloramphenicol",
    "levofloxacin",
]

ECOLI_TAXON_ID = 562

# CLSI M100 breakpoints for Enterobacterales (mg/L)
# Format: (susceptible_upper, resistant_lower)
# S <= susceptible_upper, R >= resistant_lower, else Intermediate (dropped)
CLSI_BREAKPOINTS = {
    "ampicillin":                       (8,    32),
    "ciprofloxacin":                    (0.25,  1),
    "ceftriaxone":                      (1,     4),
    "gentamicin":                       (4,    16),
    "meropenem":                        (1,     4),
    "trimethoprim/sulfamethoxazole":    (2,     4),
    "ceftazidime":                      (4,    16),
    "tetracycline":                     (4,    16),
    "chloramphenicol":                  (8,    32),
    "levofloxacin":                     (0.5,   2),
}


def get_available_genomes():
    """Return set of genome IDs that have FASTA files downloaded."""
    available = set()
    for fname in os.listdir(FASTA_DIR):
        if fname.endswith(".fasta"):
            genome_id = fname.replace(".fasta", "")
            fpath = os.path.join(FASTA_DIR, fname)
            if os.path.getsize(fpath) > 1000:
                available.add(genome_id)
    return available


def apply_clsi_breakpoints(row):
    """Convert a MIC measurement row to R/S using CLSI breakpoints.

    Returns 'Resistant', 'Susceptible', or None (intermediate / unparseable).
    """
    ab = row["antibiotic_lower"]
    if ab not in CLSI_BREAKPOINTS:
        return None

    s_upper, r_lower = CLSI_BREAKPOINTS[ab]

    # Parse the numeric MIC value
    try:
        mic = float(row["measurement_value"])
    except (ValueError, TypeError):
        return None

    sign = row["measurement_sign"]

    # Handle inequality signs
    if sign == "<=" or sign == "<":
        # MIC is at most this value
        if mic <= s_upper:
            return "Susceptible"
        # Can't determine — could be intermediate or resistant
        return None
    elif sign == ">=" or sign == ">":
        # MIC is at least this value
        if mic >= r_lower:
            return "Resistant"
        return None

    # Exact value or NaN sign (treat as exact)
    if mic <= s_upper:
        return "Susceptible"
    elif mic >= r_lower:
        return "Resistant"

    # Intermediate range — drop
    return None


def main():
    print("Loading AMR phenotype data...")
    df = pd.read_csv(CSV_PATH)
    print(f"  Total rows: {len(df)}")

    # Filter to E. coli
    df = df[df["taxon_id"] == ECOLI_TAXON_ID]
    print(f"  After E. coli filter: {len(df)}")

    # Normalize antibiotic names early (needed for breakpoint lookup)
    df["antibiotic_lower"] = df["antibiotic"].str.lower().str.strip()
    target_lower = [a.lower() for a in TARGET_ANTIBIOTICS]
    df = df[df["antibiotic_lower"].isin(target_lower)]
    print(f"  After antibiotic filter ({len(TARGET_ANTIBIOTICS)} targets): {len(df)}")

    # Split into rows with existing R/S labels and rows needing MIC conversion
    has_label = df["resistant_phenotype"].isin(["Resistant", "Susceptible"])
    df_labeled = df[has_label].copy()
    df_unlabeled = df[~has_label & df["measurement_value"].notna()].copy()

    print(f"  Rows with existing R/S labels: {len(df_labeled)}")
    print(f"  Rows with MIC values (no R/S):  {len(df_unlabeled)}")

    # Apply CLSI breakpoints to unlabeled rows
    df_unlabeled["derived_phenotype"] = df_unlabeled.apply(apply_clsi_breakpoints, axis=1)
    converted = df_unlabeled[df_unlabeled["derived_phenotype"].notna()].copy()
    converted["resistant_phenotype"] = converted["derived_phenotype"]

    n_conv_r = (converted["resistant_phenotype"] == "Resistant").sum()
    n_conv_s = (converted["resistant_phenotype"] == "Susceptible").sum()
    n_dropped = len(df_unlabeled) - len(converted)
    print(f"  MIC -> R/S converted: {len(converted)} (R={n_conv_r}, S={n_conv_s}, intermediate/unparseable={n_dropped})")

    # Combine labeled + converted
    df_combined = pd.concat([df_labeled, converted], ignore_index=True)
    print(f"  Combined rows: {len(df_combined)}")

    # Convert genome_id to string for matching with filenames
    df_combined["genome_id"] = df_combined["genome_id"].astype(str)

    # Align with available FASTA files
    available_genomes = get_available_genomes()
    print(f"  Available FASTA files: {len(available_genomes)}")
    df_combined = df_combined[df_combined["genome_id"].isin(available_genomes)]
    print(f"  After FASTA alignment: {len(df_combined)}")

    # Encode labels: Resistant=1, Susceptible=0
    df_combined["label"] = (df_combined["resistant_phenotype"] == "Resistant").astype(int)

    # Build genome x antibiotic label matrix (pivot)
    # If a genome has conflicting labels for the same antibiotic, take the majority
    label_matrix = df_combined.groupby(["genome_id", "antibiotic_lower"])["label"].agg(
        lambda x: int(x.mean() >= 0.5)
    ).unstack(fill_value=-1)

    # Reindex columns to match target order, fill missing with -1
    label_matrix = label_matrix.reindex(columns=target_lower, fill_value=-1)

    print(f"\nLabel matrix shape: {label_matrix.shape}")
    print(f"  Genomes: {label_matrix.shape[0]}")
    print(f"  Antibiotics: {label_matrix.shape[1]}")

    # Summary per antibiotic
    print("\nPer-antibiotic counts:")
    for ab in target_lower:
        col = label_matrix[ab]
        n_resistant = (col == 1).sum()
        n_susceptible = (col == 0).sum()
        n_missing = (col == -1).sum()
        print(f"  {ab:40s}  R={n_resistant:4d}  S={n_susceptible:4d}  missing={n_missing:4d}")

    # Save outputs
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    genome_ids = label_matrix.index.tolist()
    labels_path = os.path.join(OUTPUT_DIR, "label_matrix.csv")
    label_matrix.to_csv(labels_path)
    print(f"\nSaved label matrix to {labels_path}")

    genome_ids_path = os.path.join(OUTPUT_DIR, "genome_ids.json")
    with open(genome_ids_path, "w") as f:
        json.dump(genome_ids, f)
    print(f"Saved genome IDs to {genome_ids_path}")

    antibiotics_path = os.path.join(OUTPUT_DIR, "antibiotics.json")
    with open(antibiotics_path, "w") as f:
        json.dump(target_lower, f)
    print(f"Saved antibiotic list to {antibiotics_path}")

    print(f"\nPreprocessing complete. {len(genome_ids)} genomes ready for feature extraction.")


if __name__ == "__main__":
    main()
