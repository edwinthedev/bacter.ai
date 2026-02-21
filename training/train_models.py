"""
train_models.py — Train one XGBoost classifier per antibiotic with 5-fold CV.

Computes SHAP values for interpretability and saves models + metrics.
"""

import numpy as np
import pandas as pd
import json
import os
import warnings
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
import shap
import joblib

warnings.filterwarnings("ignore", category=UserWarning)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

MIN_SAMPLES_PER_CLASS = 2


def main():
    # Load data
    features = np.load(os.path.join(DATA_DIR, "kmer_features.npy"))
    labels = pd.read_csv(
        os.path.join(DATA_DIR, "label_matrix.csv"), index_col=0
    )
    with open(os.path.join(DATA_DIR, "genome_ids.json")) as f:
        genome_ids = json.load(f)
    with open(os.path.join(DATA_DIR, "kmer_names.json")) as f:
        kmer_names = json.load(f)

    print(f"Features: {features.shape}")
    print(f"Labels: {labels.shape}")
    print(f"Antibiotics: {list(labels.columns)}\n")

    os.makedirs(MODELS_DIR, exist_ok=True)

    all_metrics = {}

    for antibiotic in labels.columns:
        print(f"{'='*60}")
        print(f"Training: {antibiotic}")

        col = labels[antibiotic].values
        mask = col != -1  # only genomes with labels for this antibiotic
        X = features[mask]
        y = col[mask].astype(int)
        gids = [genome_ids[i] for i in range(len(genome_ids)) if mask[i]]

        n_pos = (y == 1).sum()
        n_neg = (y == 0).sum()
        print(f"  Samples: {len(y)} (R={n_pos}, S={n_neg})")

        if n_pos < MIN_SAMPLES_PER_CLASS or n_neg < MIN_SAMPLES_PER_CLASS:
            print(f"  SKIPPING — not enough samples per class (min {MIN_SAMPLES_PER_CLASS})")
            all_metrics[antibiotic] = {"status": "skipped", "reason": "insufficient samples"}
            continue

        # XGBoost with scale_pos_weight to handle imbalance
        scale_pos_weight = n_neg / n_pos if n_pos > 0 else 1
        model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            scale_pos_weight=scale_pos_weight,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )

        # 5-fold cross-validation
        n_splits = min(5, n_pos, n_neg)
        if n_splits < 2:
            print(f"  SKIPPING CV — not enough samples for stratified folds")
            all_metrics[antibiotic] = {"status": "skipped", "reason": "insufficient for CV"}
            continue

        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        y_pred_cv = cross_val_predict(model, X, y, cv=cv, method="predict")
        y_prob_cv = cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1]

        acc = accuracy_score(y, y_pred_cv)
        f1 = f1_score(y, y_pred_cv, zero_division=0)
        try:
            auc = roc_auc_score(y, y_prob_cv)
        except ValueError:
            auc = None

        print(f"  CV Accuracy: {acc:.3f}")
        print(f"  CV F1:       {f1:.3f}")
        if auc is not None:
            print(f"  CV AUC:      {auc:.3f}")

        # Train final model on all data
        model.fit(X, y)

        # SHAP values
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)

        # Top 20 most important k-mers by mean |SHAP|
        mean_shap = np.abs(shap_values).mean(axis=0)
        top_indices = np.argsort(mean_shap)[::-1][:20]
        top_kmers = [
            {"kmer": kmer_names[idx], "importance": float(mean_shap[idx])}
            for idx in top_indices
        ]
        print(f"  Top 3 k-mers: {', '.join(t['kmer'] for t in top_kmers[:3])}")

        # Save model
        model_path = os.path.join(MODELS_DIR, f"{antibiotic.replace('/', '_')}.joblib")
        joblib.dump(model, model_path)

        # Save SHAP summary
        shap_path = os.path.join(MODELS_DIR, f"{antibiotic.replace('/', '_')}_shap.json")
        with open(shap_path, "w") as f:
            json.dump(top_kmers, f, indent=2)

        all_metrics[antibiotic] = {
            "status": "trained",
            "n_samples": int(len(y)),
            "n_resistant": int(n_pos),
            "n_susceptible": int(n_neg),
            "cv_accuracy": round(acc, 4),
            "cv_f1": round(f1, 4),
            "cv_auc": round(auc, 4) if auc is not None else None,
            "cv_folds": int(n_splits),
            "top_kmers": top_kmers[:5],
        }

    # Save combined metrics
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\n{'='*60}")
    print(f"Saved metrics to {metrics_path}")

    trained = sum(1 for m in all_metrics.values() if m["status"] == "trained")
    skipped = sum(1 for m in all_metrics.values() if m["status"] == "skipped")
    print(f"Done! Trained: {trained}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
