"""
app.py — Flask API for bacter.ai AMR prediction service.

Endpoints:
  GET  /api/genomes        — List available demo genomes
  POST /api/analyze         — Get predictions for a demo genome (by ID)
  POST /api/analyze_fasta   — Analyze raw FASTA text through trained models
  GET  /api/metrics         — Model performance metrics
"""

import json
import os
import sys
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)

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


def load_models():
    """Load all trained models and SHAP data at startup."""
    global METRICS
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            METRICS = json.load(f)

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

    # Extract k-mer features
    features = extract_kmers_from_fasta_text(fasta_text)
    X = features.reshape(1, -1)

    # Run through each model
    predictions = []
    for ab in TARGET_ANTIBIOTICS:
        if ab not in MODELS:
            predictions.append({
                "antibiotic": ab,
                "prediction": "No model",
                "confidence": 0,
                "resistant_probability": 0,
            })
            continue

        model = MODELS[ab]
        prob = model.predict_proba(X)[0]
        pred_class = int(prob[1] >= 0.5)
        confidence = float(prob[1]) if pred_class == 1 else float(prob[0])

        ab_metrics = METRICS.get(ab, {})
        top_kmers = SHAP_DATA.get(ab, [])[:5]

        predictions.append({
            "antibiotic": ab,
            "prediction": "Resistant" if pred_class == 1 else "Susceptible",
            "confidence": round(confidence, 4),
            "resistant_probability": round(float(prob[1]), 4),
            "model_accuracy": ab_metrics.get("cv_accuracy"),
            "model_f1": ab_metrics.get("cv_f1"),
            "top_kmers": top_kmers,
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
    })


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Return model training metrics for all antibiotics."""
    if not METRICS:
        return jsonify({"error": "No metrics available"}), 404
    return jsonify(METRICS)


# Load models at startup
load_models()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
