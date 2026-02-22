"""
prepare_demo_genomes.py — Run demo genomes through trained models.

Generates pre-computed JSON files for the backend API demo endpoints.
Includes lab results from amr_all.csv and flags training set membership.
"""

import numpy as np
import pandas as pd
import json
import os
import joblib
import sys
from extract_kmers import build_kmer_index, count_kmers
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from resistance_genes import compute_genome_stats, infer_resistance_genes

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
FASTA_DIR = os.path.join(DATA_DIR, "fastas")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "demo_genomes")

# 3 demo genomes with some known labels for validation
DEMO_GENOMES = [
    {"genome_id": "562.86537", "name": "E. coli strain 86537"},
    {"genome_id": "562.97781", "name": "E. coli strain 97781"},
    {"genome_id": "562.98081", "name": "E. coli strain 98081"},
]

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


def load_lab_results(amr_df, genome_id):
    """Extract lab-confirmed phenotypes from amr_all.csv for a genome."""
    rows = amr_df[amr_df["genome_id"] == genome_id]
    lab_results = {}
    for _, row in rows.iterrows():
        ab = row["antibiotic"]
        phenotype = str(row.get("resistant_phenotype", "")).strip()
        if phenotype in ("Resistant", "Susceptible"):
            lab_results[ab] = {
                "phenotype": phenotype,
                "method": str(row.get("laboratory_typing_method", "")) or None,
                "measurement": str(row.get("measurement_value", "")) or None,
                "measurement_unit": str(row.get("measurement_unit", "")) or None,
                "source": str(row.get("source", "")) or None,
            }
    return lab_results


def main():
    print("Preparing demo genome predictions...")

    # Load metrics to know which models are available
    with open(os.path.join(MODELS_DIR, "metrics.json")) as f:
        metrics = json.load(f)

    # Load known labels for validation display
    labels = pd.read_csv(os.path.join(PROCESSED_DIR, "label_matrix.csv"), index_col=0)
    labels.index = labels.index.astype(str)

    # Load training genome IDs to flag exclusion
    with open(os.path.join(PROCESSED_DIR, "genome_ids.json")) as f:
        training_genome_ids = set(json.load(f))

    # Load raw AMR lab data for ground-truth results
    amr_path = os.path.join(DATA_DIR, "amr_all.csv")
    amr_df = pd.read_csv(amr_path, dtype=str)
    amr_df["antibiotic"] = amr_df["antibiotic"].str.lower()

    # Load SHAP data per antibiotic
    shap_data = {}
    for ab in TARGET_ANTIBIOTICS:
        shap_path = os.path.join(MODELS_DIR, f"{ab.replace('/', '_')}_shap.json")
        if os.path.exists(shap_path):
            with open(shap_path) as f:
                shap_data[ab] = json.load(f)

    kmer_index = build_kmer_index()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for demo in DEMO_GENOMES:
        gid = demo["genome_id"]
        name = demo["name"]
        fasta_path = os.path.join(FASTA_DIR, f"{gid}.fasta")

        if not os.path.exists(fasta_path):
            # Try with trailing 0
            alt_gid = gid + "0"
            fasta_path = os.path.join(FASTA_DIR, f"{alt_gid}.fasta")
            if not os.path.exists(fasta_path):
                print(f"  WARNING: No FASTA for {gid}, skipping")
                continue

        print(f"\nProcessing {gid} ({name})...")

        in_training_set = gid in training_genome_ids
        print(f"  In training set: {in_training_set}")

        # Get lab results from amr_all.csv
        lab_results = load_lab_results(amr_df, gid)
        print(f"  Lab results available: {len(lab_results)} antibiotics")

        # Extract k-mer features
        counts = count_kmers(fasta_path, kmer_index)
        total = counts.sum()
        features = (counts / total).astype(np.float32) if total > 0 else counts.astype(np.float32)
        X = features.reshape(1, -1)

        # Get known labels from label matrix
        known_labels = {}
        if gid in labels.index:
            row = labels.loc[gid]
            for ab in TARGET_ANTIBIOTICS:
                ab_lower = ab.lower()
                if ab_lower in row.index and row[ab_lower] != -1:
                    known_labels[ab] = "Resistant" if row[ab_lower] == 1 else "Susceptible"

        # Run through each model
        predictions = []
        for ab in TARGET_ANTIBIOTICS:
            ab_safe = ab.replace("/", "_")
            model_path = os.path.join(MODELS_DIR, f"{ab_safe}.joblib")

            # Lab result for this specific antibiotic
            lab = lab_results.get(ab)
            lab_phenotype = lab["phenotype"] if lab else known_labels.get(ab)

            if not os.path.exists(model_path):
                predictions.append({
                    "antibiotic": ab,
                    "prediction": "No model",
                    "confidence": 0,
                    "lab_result": lab_phenotype,
                    "lab_method": lab["method"] if lab else None,
                })
                continue

            model = joblib.load(model_path)
            prob = model.predict_proba(X)[0]
            pred_class = int(prob[1] >= 0.5)
            confidence = float(prob[1]) if pred_class == 1 else float(prob[0])

            ab_metrics = metrics.get(ab, {})
            top_kmers = shap_data.get(ab, [])[:10]

            pred_label = "Resistant" if pred_class == 1 else "Susceptible"
            match = None
            if lab_phenotype:
                match = pred_label == lab_phenotype

            predictions.append({
                "antibiotic": ab,
                "prediction": pred_label,
                "confidence": round(confidence, 4),
                "resistant_probability": round(float(prob[1]), 4),
                "lab_result": lab_phenotype,
                "lab_method": lab["method"] if lab else None,
                "match": match,
                "model_accuracy": ab_metrics.get("cv_accuracy"),
                "model_f1": ab_metrics.get("cv_f1"),
                "top_kmers": top_kmers,
            })

            status = "MATCH" if match is True else ("MISMATCH" if match is False else "")
            print(f"  {ab:40s} -> {pred_label:12s} (conf={confidence:.3f}) lab={lab_phenotype or 'N/A':12s} {status}")

        # Compute genome stats from FASTA
        with open(fasta_path) as f:
            fasta_text = f.read()
        genome_stats = compute_genome_stats(fasta_text)

        # Infer resistance genes
        resistance_genes = infer_resistance_genes(
            predictions, genome_stats["chromosome"]["length"]
        )
        print(f"  Inferred {len(resistance_genes)} resistance genes")

        # Verification summary
        verified = [p for p in predictions if p.get("match") is not None]
        matches = sum(1 for p in verified if p["match"])
        verification = {
            "total_verified": len(verified),
            "matches": matches,
            "mismatches": len(verified) - matches,
            "accuracy": round(matches / len(verified), 4) if verified else None,
            "in_training_set": in_training_set,
        }
        print(f"  Verification: {matches}/{len(verified)} correct ({verification['accuracy'] or 0:.0%})")

        # Build output JSON
        output = {
            "genome_id": gid,
            "genome_name": name,
            "organism": "Escherichia coli",
            "in_training_set": in_training_set,
            "predictions": predictions,
            "verification": verification,
            "summary": {
                "total_antibiotics": len(predictions),
                "resistant_count": sum(1 for p in predictions if p["prediction"] == "Resistant"),
                "susceptible_count": sum(1 for p in predictions if p["prediction"] == "Susceptible"),
            },
            "genome_data": genome_stats,
            "resistance_genes": resistance_genes,
        }

        output_path = os.path.join(OUTPUT_DIR, f"{gid}.json")
        with open(output_path, "w") as f:
            json.dump(output, f, indent=2)
        print(f"  Saved to {output_path}")

    # Save index of available demo genomes
    index = [{"genome_id": d["genome_id"], "genome_name": d["name"], "organism": "Escherichia coli"} for d in DEMO_GENOMES]
    index_path = os.path.join(OUTPUT_DIR, "index.json")
    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)
    print(f"\nSaved demo genome index to {index_path}")
    print("Done!")


if __name__ == "__main__":
    main()
