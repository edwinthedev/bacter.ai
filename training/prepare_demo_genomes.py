"""
prepare_demo_genomes.py — Run demo genomes through trained models.

Generates pre-computed JSON files for the backend API demo endpoints.
"""

import numpy as np
import pandas as pd
import json
import os
import joblib
from extract_kmers import build_kmer_index, count_kmers

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


def main():
    print("Preparing demo genome predictions...")

    # Load metrics to know which models are available
    with open(os.path.join(MODELS_DIR, "metrics.json")) as f:
        metrics = json.load(f)

    # Load known labels for validation display
    labels = pd.read_csv(os.path.join(PROCESSED_DIR, "label_matrix.csv"), index_col=0)
    labels.index = labels.index.astype(str)

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

        # Extract k-mer features
        counts = count_kmers(fasta_path, kmer_index)
        total = counts.sum()
        features = (counts / total).astype(np.float32) if total > 0 else counts.astype(np.float32)
        X = features.reshape(1, -1)

        # Get known labels
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

            if not os.path.exists(model_path):
                predictions.append({
                    "antibiotic": ab,
                    "prediction": "No model",
                    "confidence": 0,
                    "known_label": known_labels.get(ab),
                })
                continue

            model = joblib.load(model_path)
            prob = model.predict_proba(X)[0]
            pred_class = int(prob[1] >= 0.5)
            confidence = float(prob[1]) if pred_class == 1 else float(prob[0])

            ab_metrics = metrics.get(ab, {})
            top_kmers = shap_data.get(ab, [])[:5]

            predictions.append({
                "antibiotic": ab,
                "prediction": "Resistant" if pred_class == 1 else "Susceptible",
                "confidence": round(confidence, 4),
                "resistant_probability": round(float(prob[1]), 4),
                "known_label": known_labels.get(ab),
                "model_accuracy": ab_metrics.get("cv_accuracy"),
                "model_f1": ab_metrics.get("cv_f1"),
                "top_kmers": top_kmers,
            })

            status = "MATCH" if known_labels.get(ab) == predictions[-1]["prediction"] else ""
            if ab in known_labels:
                status = status or "MISMATCH"
            print(f"  {ab:40s} -> {predictions[-1]['prediction']:12s} (conf={confidence:.3f}) {status}")

        # Build output JSON
        output = {
            "genome_id": gid,
            "genome_name": name,
            "organism": "Escherichia coli",
            "predictions": predictions,
            "summary": {
                "total_antibiotics": len(predictions),
                "resistant_count": sum(1 for p in predictions if p["prediction"] == "Resistant"),
                "susceptible_count": sum(1 for p in predictions if p["prediction"] == "Susceptible"),
            },
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
