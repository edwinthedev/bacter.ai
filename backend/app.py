"""
app.py — Flask API for bacter.ai AMR prediction service.

Endpoints:
  GET  /api/genomes  — List available demo genomes
  POST /api/analyze   — Get predictions for a specific genome
  GET  /api/metrics   — Model performance metrics
"""

import json
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(__file__)
DEMO_DIR = os.path.join(BASE_DIR, "data", "demo_genomes")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")


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


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Return model training metrics for all antibiotics."""
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        return jsonify({"error": "No metrics available"}), 404
    return jsonify(load_json(metrics_path))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
