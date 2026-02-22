"""
app.py — Flask API for bacter.ai AMR prediction service.

Endpoints:
  GET  /api/genomes        — List available demo genomes
  POST /api/analyze         — Get predictions for a demo genome (by ID)
  POST /api/analyze_fasta   — Analyze raw FASTA text through trained models
  GET  /api/metrics         — Model performance metrics
  GET  /api/validation      — Bootstrap validation stats per antibiotic
"""

import json
import os
import re
import sys
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.environ.get("FRONTEND_URL", ""),
]}})

BASE_DIR = os.path.dirname(__file__)
DEMO_DIR = os.path.join(BASE_DIR, "data", "demo_genomes")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")

# Add training dir to path so we can import extract_kmers
sys.path.insert(0, os.path.join(BASE_DIR, "..", "training"))
from extract_kmers import build_kmer_index, K
from resistance_genes import compute_genome_stats, infer_resistance_genes

# Pre-load k-mer index and models at startup
KMER_INDEX = build_kmer_index()

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

MODELS = {}
SHAP_DATA = {}
METRICS = {}
AMR_DF = None
TRAINING_GENOME_IDS = set()


def load_models():
    """Load all trained models, SHAP data, and AMR lab data at startup."""
    global METRICS, AMR_DF, TRAINING_GENOME_IDS
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            METRICS = json.load(f)

    # Load AMR phenotype lab data for verification (compact version in backend/data)
    amr_path = os.path.join(BASE_DIR, "data", "amr_labels.csv")
    if os.path.exists(amr_path):
        AMR_DF = pd.read_csv(amr_path, dtype=str)
        AMR_DF["antibiotic"] = AMR_DF["antibiotic"].str.lower()
        print(f"Loaded AMR lab data: {len(AMR_DF)} rows")

    # Load training genome IDs to flag training set membership
    gids_path = os.path.join(BASE_DIR, "data", "genome_ids.json")
    if os.path.exists(gids_path):
        with open(gids_path) as f:
            TRAINING_GENOME_IDS = set(json.load(f))
        print(f"Loaded {len(TRAINING_GENOME_IDS)} training genome IDs")

    for ab in TARGET_ANTIBIOTICS:
        ab_safe = ab.replace("/", "_")
        model_path = os.path.join(MODELS_DIR, f"{ab_safe}.joblib")
        if os.path.exists(model_path):
            MODELS[ab] = joblib.load(model_path)

        shap_path = os.path.join(MODELS_DIR, f"{ab_safe}_shap.json")
        if os.path.exists(shap_path):
            with open(shap_path) as f:
                SHAP_DATA[ab] = json.load(f)

    print(f"Loaded {len(MODELS)} models: {list(MODELS.keys())}")


def parse_genome_id(fasta_text):
    """Extract genome ID (e.g. '562.100018') from the first FASTA header line."""
    for line in fasta_text.strip().split("\n"):
        if line.startswith(">"):
            # Match patterns like 562.100018 in headers like:
            # >accn|562.100018.con.0004  ERR... [Escherichia coli ... | 562.100018]
            match = re.search(r"\b(562\.\d+)\b", line)
            if match:
                return match.group(1)
    return None


def get_lab_results(genome_id):
    """Look up lab-confirmed AMR phenotypes from amr_labels.csv for a genome."""
    if AMR_DF is None or genome_id is None:
        return {}
    rows = AMR_DF[AMR_DF["genome_id"] == genome_id]
    lab_results = {}
    for _, row in rows.iterrows():
        ab = row["antibiotic"]
        phenotype = str(row.get("resistant_phenotype", "")).strip()
        if phenotype in ("Resistant", "Susceptible"):
            lab_results[ab] = {
                "phenotype": phenotype,
                "method": str(row.get("laboratory_typing_method", "")) or None,
            }
    return lab_results


def extract_kmers_from_fasta_text(fasta_text):
    """Extract 6-mer frequency vector from raw FASTA text."""
    counts = np.zeros(len(KMER_INDEX), dtype=np.float64)

    sequence = []
    for line in fasta_text.strip().split("\n"):
        line = line.strip()
        if line.startswith(">"):
            # Process previous sequence
            if sequence:
                seq = "".join(sequence).upper()
                for i in range(len(seq) - K + 1):
                    kmer = seq[i : i + K]
                    if kmer in KMER_INDEX:
                        counts[KMER_INDEX[kmer]] += 1
                sequence = []
        else:
            sequence.append(line)

    # Process last sequence
    if sequence:
        seq = "".join(sequence).upper()
        for i in range(len(seq) - K + 1):
            kmer = seq[i : i + K]
            if kmer in KMER_INDEX:
                counts[KMER_INDEX[kmer]] += 1

    total = counts.sum()
    if total > 0:
        return (counts / total).astype(np.float32)
    return counts.astype(np.float32)


def load_json(path):
    with open(path) as f:
        return json.load(f)


@app.route("/api/genomes", methods=["GET"])
def list_genomes():
    """Return list of available demo genomes."""
    index_path = os.path.join(DEMO_DIR, "index.json")
    if not os.path.exists(index_path):
        return jsonify({"error": "No demo genomes available"}), 404
    return jsonify(load_json(index_path))


@app.route("/api/analyze", methods=["POST"])
def analyze_genome():
    """Return pre-computed predictions for a demo genome."""
    data = request.get_json()
    if not data or "genome_id" not in data:
        return jsonify({"error": "genome_id is required"}), 400

    genome_id = data["genome_id"]

    # Sanitize: only allow alphanumeric and dots
    if not all(c.isalnum() or c == "." for c in genome_id):
        return jsonify({"error": "Invalid genome_id format"}), 400

    genome_path = os.path.join(DEMO_DIR, f"{genome_id}.json")
    if not os.path.exists(genome_path):
        return jsonify({"error": f"Genome {genome_id} not found"}), 404

    return jsonify(load_json(genome_path))


@app.route("/api/analyze_fasta", methods=["POST"])
def analyze_fasta():
    """Analyze raw FASTA text through all trained models."""
    data = request.get_json()
    if not data or "fasta" not in data:
        return jsonify({"error": "fasta field is required"}), 400

    fasta_text = data["fasta"]
    if len(fasta_text.strip()) < 100:
        return jsonify({"error": "FASTA sequence too short"}), 400

    # Cap at 50 MB to prevent memory exhaustion
    if len(fasta_text) > 50_000_000:
        return jsonify({"error": "FASTA sequence too large (max 50 MB)"}), 400

    # Parse genome ID from FASTA header for lab result lookup
    genome_id = parse_genome_id(fasta_text)
    lab_results = get_lab_results(genome_id)
    in_training_set = genome_id in TRAINING_GENOME_IDS if genome_id else False

    # Extract k-mer features
    features = extract_kmers_from_fasta_text(fasta_text)
    X = features.reshape(1, -1)

    # Run through each model
    predictions = []
    for ab in TARGET_ANTIBIOTICS:
        lab = lab_results.get(ab)
        lab_phenotype = lab["phenotype"] if lab else None

        if ab not in MODELS:
            predictions.append({
                "antibiotic": ab,
                "prediction": "No model",
                "confidence": 0,
                "resistant_probability": 0,
                "lab_result": lab_phenotype,
                "match": None,
            })
            continue

        model = MODELS[ab]
        prob = model.predict_proba(X)[0]
        pred_class = int(prob[1] >= 0.5)
        confidence = float(prob[1]) if pred_class == 1 else float(prob[0])

        ab_metrics = METRICS.get(ab, {})
        top_kmers = SHAP_DATA.get(ab, [])[:10]

        pred_label = "Resistant" if pred_class == 1 else "Susceptible"
        match = (pred_label == lab_phenotype) if lab_phenotype else None

        predictions.append({
            "antibiotic": ab,
            "prediction": pred_label,
            "confidence": round(confidence, 4),
            "resistant_probability": round(float(prob[1]), 4),
            "model_accuracy": ab_metrics.get("cv_accuracy"),
            "model_f1": ab_metrics.get("cv_f1"),
            "top_kmers": top_kmers,
            "lab_result": lab_phenotype,
            "lab_method": lab["method"] if lab else None,
            "match": match,
        })

    # Extract genome name from first FASTA header
    genome_name = "Uploaded genome"
    for line in fasta_text.strip().split("\n"):
        if line.startswith(">"):
            genome_name = line[1:].strip()[:80]
            break

    resistant_count = sum(1 for p in predictions if p["prediction"] == "Resistant")

    # Compute genome stats from FASTA
    genome_stats = compute_genome_stats(fasta_text)

    # Infer resistance genes based on predictions
    resistance_genes = infer_resistance_genes(
        predictions, genome_stats["chromosome"]["length"]
    )

    # Build SHAP data keyed by antibiotic for frontend ShapExplanation
    shap_by_drug = {}
    for p in predictions:
        ab = p["antibiotic"]
        raw_shap = SHAP_DATA.get(ab, [])[:10]
        if raw_shap:
            is_resistant = p["prediction"] == "Resistant"
            shap_by_drug[ab] = [
                {
                    "pattern": entry["kmer"],
                    "importance": round(entry["importance"], 4),
                    "direction": "toward_resistant" if is_resistant else "toward_susceptible",
                }
                for entry in raw_shap
            ]

    return jsonify({
        "genome_name": genome_name,
        "organism": "Escherichia coli",
        "predictions": predictions,
        "summary": {
            "total_antibiotics": len(predictions),
            "resistant_count": resistant_count,
            "susceptible_count": len(predictions) - resistant_count,
        },
        "genome_data": genome_stats,
        "resistance_genes": resistance_genes,
        "shap": shap_by_drug,
        "lab_results": {ab: lr["phenotype"].lower() for ab, lr in lab_results.items()},
        "genome_in_training_set": in_training_set,
    })


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Return model training metrics for all antibiotics."""
    if not METRICS:
        return jsonify({"error": "No metrics available"}), 404
    return jsonify(METRICS)


@app.route("/api/validation", methods=["GET"])
def get_validation():
    """Return bootstrap validation stats per antibiotic."""
    path = os.path.join(MODELS_DIR, "validation_stats.json")
    if not os.path.exists(path):
        return jsonify({"error": "No validation stats available. Run training/validate.py first."}), 404
    return jsonify(load_json(path))


# Load models at startup
load_models()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
