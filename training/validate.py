"""
validate.py — Post-training validation with bootstrap confidence intervals.

Loads held-out CV predictions and computes per-antibiotic accuracy
with 95% CIs (1000 bootstrap iterations) and calibration curves.
Saves results to models/validation_stats.json.
"""

import numpy as np
import pandas as pd
import json
import os
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.calibration import calibration_curve

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

N_BOOTSTRAP = 1000
RANDOM_SEED = 42


def bootstrap_ci(y_true, y_pred, metric_fn, n_boot=N_BOOTSTRAP, seed=RANDOM_SEED):
    """Compute 95% confidence interval via bootstrap resampling."""
    rng = np.random.RandomState(seed)
    scores = []
    n = len(y_true)
    for _ in range(n_boot):
        idx = rng.randint(0, n, size=n)
        if len(np.unique(y_true[idx])) < 2:
            continue
        scores.append(metric_fn(y_true[idx], y_pred[idx]))
    scores = np.array(scores)
    return {
        "mean": float(np.mean(scores)),
        "ci_lower": float(np.percentile(scores, 2.5)),
        "ci_upper": float(np.percentile(scores, 97.5)),
    }


def accuracy_fn(y_true, y_pred):
    return float(np.mean(y_true == y_pred))


def f1_fn(y_true, y_pred):
    tp = ((y_pred == 1) & (y_true == 1)).sum()
    fp = ((y_pred == 1) & (y_true == 0)).sum()
    fn = ((y_pred == 0) & (y_true == 1)).sum()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    if precision + recall == 0:
        return 0.0
    return float(2 * precision * recall / (precision + recall))


def sensitivity_fn(y_true, y_pred):
    tp = ((y_pred == 1) & (y_true == 1)).sum()
    fn = ((y_pred == 0) & (y_true == 1)).sum()
    return float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0


def specificity_fn(y_true, y_pred):
    tn = ((y_pred == 0) & (y_true == 0)).sum()
    fp = ((y_pred == 1) & (y_true == 0)).sum()
    return float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0


def main():
    print("Running post-training validation with bootstrap CIs...\n")

    features = np.load(os.path.join(DATA_DIR, "kmer_features.npy"))
    labels = pd.read_csv(
        os.path.join(DATA_DIR, "label_matrix.csv"), index_col=0
    )
    with open(os.path.join(DATA_DIR, "genome_ids.json")) as f:
        genome_ids = json.load(f)
    with open(os.path.join(DATA_DIR, "kmer_names.json")) as f:
        kmer_names = json.load(f)

    # Load existing metrics to know model config
    with open(os.path.join(MODELS_DIR, "metrics.json")) as f:
        train_metrics = json.load(f)

    validation_stats = {}

    for antibiotic in labels.columns:
        ab_metrics = train_metrics.get(antibiotic, {})
        if ab_metrics.get("status") != "trained":
            print(f"  {antibiotic}: skipped (not trained)")
            continue

        print(f"Validating: {antibiotic}")

        col = labels[antibiotic].values
        mask = col != -1
        X = features[mask]
        y = col[mask].astype(int)

        n_pos = int((y == 1).sum())
        n_neg = int((y == 0).sum())
        n_splits = min(5, n_pos, n_neg)
        if n_splits < 2:
            continue

        # Recreate the same CV split and predictions
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

        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        y_pred_cv = cross_val_predict(model, X, y, cv=cv, method="predict")
        y_prob_cv = cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1]

        # Bootstrap CIs for each metric
        acc_ci = bootstrap_ci(y, y_pred_cv, accuracy_fn)
        f1_ci = bootstrap_ci(y, y_pred_cv, f1_fn)
        sens_ci = bootstrap_ci(y, y_pred_cv, sensitivity_fn)
        spec_ci = bootstrap_ci(y, y_pred_cv, specificity_fn)

        print(f"  Accuracy: {acc_ci['mean']:.3f} [{acc_ci['ci_lower']:.3f}, {acc_ci['ci_upper']:.3f}]")
        print(f"  F1:       {f1_ci['mean']:.3f} [{f1_ci['ci_lower']:.3f}, {f1_ci['ci_upper']:.3f}]")
        print(f"  Sens:     {sens_ci['mean']:.3f} [{sens_ci['ci_lower']:.3f}, {sens_ci['ci_upper']:.3f}]")
        print(f"  Spec:     {spec_ci['mean']:.3f} [{spec_ci['ci_lower']:.3f}, {spec_ci['ci_upper']:.3f}]")

        # Calibration curve (10 bins)
        try:
            prob_true, prob_pred = calibration_curve(y, y_prob_cv, n_bins=10, strategy="uniform")
            calibration = [
                {"predicted": round(float(p), 4), "observed": round(float(t), 4)}
                for p, t in zip(prob_pred, prob_true)
            ]
        except Exception:
            calibration = []

        # Confusion matrix values
        tp = int(((y_pred_cv == 1) & (y == 1)).sum())
        fp = int(((y_pred_cv == 1) & (y == 0)).sum())
        fn = int(((y_pred_cv == 0) & (y == 1)).sum())
        tn = int(((y_pred_cv == 0) & (y == 0)).sum())

        validation_stats[antibiotic] = {
            "n_samples": int(len(y)),
            "n_resistant": n_pos,
            "n_susceptible": n_neg,
            "cv_folds": int(n_splits),
            "accuracy": acc_ci,
            "f1": f1_ci,
            "sensitivity": sens_ci,
            "specificity": spec_ci,
            "confusion_matrix": {"tp": tp, "fp": fp, "fn": fn, "tn": tn},
            "calibration_curve": calibration,
        }

    # Save
    os.makedirs(MODELS_DIR, exist_ok=True)
    output_path = os.path.join(MODELS_DIR, "validation_stats.json")
    with open(output_path, "w") as f:
        json.dump(validation_stats, f, indent=2)

    print(f"\nSaved validation stats for {len(validation_stats)} antibiotics to {output_path}")


if __name__ == "__main__":
    main()
