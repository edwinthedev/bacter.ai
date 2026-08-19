# bacter.ai

Predicting antibiotic resistance from bacterial genome sequences.

bacter.ai is a prototype pipeline that takes an *E. coli* genome in FASTA format, converts the sequence into k-mer frequency features, and runs a set of per-antibiotic XGBoost classifiers to estimate whether the isolate is resistant or susceptible.

The project was built to explore whether genomic sequence patterns can provide useful antimicrobial-resistance signals before traditional culture-based susceptibility results are available.

> **Research prototype only.** bacter.ai is not a clinical diagnostic tool and its predictions should not be used to make treatment decisions.

## How it works

```text
FASTA genome
     │
     ▼
6-mer frequency extraction
     │
     ▼
Per-antibiotic XGBoost models
     │
     ├── resistant / susceptible prediction
     ├── model confidence
     ├── cross-validation metrics
     └── high-impact k-mers from SHAP
     │
     ▼
Interactive antibiogram-style result
```

The current pipeline targets 10 antibiotics:

* Ampicillin
* Ciprofloxacin
* Ceftriaxone
* Gentamicin
* Meropenem
* Trimethoprim/sulfamethoxazole
* Ceftazidime
* Tetracycline
* Chloramphenicol
* Levofloxacin

Each antibiotic is modeled separately because the amount of labeled data and class balance differ across drugs.

## Model pipeline

### Feature extraction

Each genome is represented using normalized frequencies of all valid DNA **6-mers**.

For a sequence of length (n), the pipeline slides a six-base window across the genome, counts each k-mer, and normalizes the resulting vector by the total number of observed k-mers.

### Training

A separate `XGBClassifier` is trained for each antibiotic.

The training pipeline includes:

* stratified cross-validation
* class-imbalance weighting
* accuracy, F1, and ROC-AUC evaluation
* final training on the available labeled data
* SHAP analysis for feature importance

Model performance varies by antibiotic, particularly where resistant and susceptible examples are highly imbalanced. Full per-drug results are stored in [`models/metrics.json`](models/metrics.json).

### Interpretability

After training, SHAP values are computed for each classifier.

The application surfaces high-impact k-mers associated with each model's prediction so that the output is more inspectable than a single resistant/susceptible label.

These k-mers are **model features, not automatically validated biological resistance mechanisms**.

## Application

The web application supports two main workflows:

### Analyze a FASTA sequence

Upload or paste a bacterial FASTA sequence and run it through the trained models.

The backend returns:

* resistance predictions across the target antibiotics
* prediction confidence
* per-model validation metrics
* high-impact k-mer features
* basic genome statistics
* available laboratory phenotype comparisons when a known genome ID is present

### Explore demo genomes

The repository also includes prepared demo genomes with precomputed results for exploring the interface without supplying a new FASTA file.

## Tech stack

**Modeling / data**

* Python
* NumPy
* pandas
* scikit-learn
* XGBoost
* SHAP
* joblib

**Backend**

* Flask
* Flask-CORS

**Frontend**

* React
* Vite
* Tailwind CSS
* D3
* Framer Motion
* Axios

**Deployment**

* Render — backend
* Vercel-compatible frontend configuration

## Repository structure

```text
bacter.ai/
├── backend/
│   ├── app.py                 # Flask API and inference pipeline
│   ├── data/                  # Runtime genome / phenotype data
│   └── resistance_genes.py
│
├── frontend/
│   ├── src/                   # React application
│   ├── public/
│   └── package.json
│
├── models/
│   ├── *.joblib               # Trained antibiotic classifiers
│   ├── *_shap.json            # Feature-importance summaries
│   └── metrics.json           # Cross-validation metrics
│
├── training/
│   ├── preprocess.py
│   ├── extract_kmers.py
│   ├── extract_kmers_fast.py
│   ├── train_models.py
│   └── validate.py
│
├── requirements.txt
└── render.yaml
```

## Running locally

### 1. Clone the repository

```bash
git clone https://github.com/edwinthedev/bacter.ai.git
cd bacter.ai
```

### 2. Start the backend

Create a Python environment and install the runtime dependencies:

```bash
python -m venv .venv
```

Activate it, then:

```bash
pip install -r requirements.txt
python backend/app.py
```

The API runs on:

```text
http://localhost:5000
```

### 3. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will start the frontend locally, typically at:

```text
http://localhost:5173
```

For local development, `VITE_API_URL` can remain empty because the Vite development configuration handles API routing.

## API

| Method | Endpoint             | Purpose                                         |
| ------ | -------------------- | ----------------------------------------------- |
| `GET`  | `/api/genomes`       | List available demo genomes                     |
| `POST` | `/api/analyze`       | Retrieve results for a demo genome              |
| `POST` | `/api/analyze_fasta` | Run a FASTA sequence through the trained models |
| `GET`  | `/api/metrics`       | Return per-antibiotic model metrics             |
| `GET`  | `/api/validation`    | Return additional validation statistics         |

## Limitations

This project is an experimental proof of concept, and several limitations matter:

* The current inference workflow is focused on *Escherichia coli*.
* Available labels differ substantially between antibiotics.
* Several datasets have significant resistant/susceptible class imbalance.
* Cross-validation performance should not be interpreted as clinical validation.
* k-mer importance does not by itself establish a biological mechanism.
* The models have not been prospectively tested in a clinical setting.
* The system predicts from genomic patterns and is not a replacement for laboratory antimicrobial-susceptibility testing.

These limitations are part of the project rather than something to hide: one of the main goals was to explore what could be learned from a relatively simple genomic representation and where that approach begins to break down.

## Why this project

Antimicrobial resistance sits at an interesting intersection of genomics, machine learning, and real-world decision making.

bacter.ai was an experiment in building the complete pipeline rather than stopping at model training:

**raw biological data → preprocessing → feature extraction → model evaluation → inference API → interpretable output → usable web interface**

That end-to-end process was the most valuable part of the project.
