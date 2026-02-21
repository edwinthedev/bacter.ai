"""
resistance_genes.py — CARD-based resistance gene knowledge base for E. coli.

Maps predicted antibiotic resistance to likely causative genes with
metadata for the genome visualization (positions, mechanisms, colors).
"""

import math
import random

# Known E. coli resistance genes mapped to the antibiotics they confer resistance to.
# Based on CARD (Comprehensive Antibiotic Resistance Database) entries.
GENE_DATABASE = [
    # β-Lactamases (Penicillins)
    {
        "gene_id": "TEM-1",
        "antibiotics": ["ampicillin"],
        "location": "plasmid",
        "plasmid_name": "pTEM",
        "color": "#f97316",
        "mechanism": "Class A \u03b2-lactamase",
        "spreadable": True,
        "description": "TEM-1 is the most common plasmid-mediated \u03b2-lactamase in E. coli. It hydrolyzes penicillins like ampicillin, and is found in over 50% of ampicillin-resistant isolates worldwide.",
    },
    # ESBLs (3rd-gen Cephalosporins)
    {
        "gene_id": "CTX-M-15",
        "antibiotics": ["ceftriaxone", "ceftazidime", "ampicillin"],
        "location": "plasmid",
        "plasmid_name": "pCTX",
        "color": "#ef4444",
        "mechanism": "Extended-spectrum \u03b2-lactamase (ESBL)",
        "spreadable": True,
        "description": "CTX-M-15 is the most globally prevalent ESBL. It confers resistance to 3rd-generation cephalosporins and is frequently carried on highly mobile IncF plasmids, facilitating rapid spread in healthcare settings.",
    },
    # Carbapenemases
    {
        "gene_id": "NDM-1",
        "antibiotics": ["meropenem", "ampicillin", "ceftriaxone", "ceftazidime"],
        "location": "plasmid",
        "plasmid_name": "pNDM",
        "color": "#dc2626",
        "mechanism": "Metallo-\u03b2-lactamase (MBL)",
        "spreadable": True,
        "description": "NDM-1 is a metallo-\u03b2-lactamase that hydrolyzes virtually all \u03b2-lactam antibiotics including last-resort carbapenems. First identified in New Delhi in 2008, it has spread globally on mobile plasmids and represents a critical public health threat.",
    },
    {
        "gene_id": "KPC-2",
        "antibiotics": ["meropenem", "ceftriaxone", "ceftazidime"],
        "location": "plasmid",
        "plasmid_name": "pKPC",
        "color": "#b91c1c",
        "mechanism": "Class A carbapenemase",
        "spreadable": True,
        "description": "KPC-2 (Klebsiella pneumoniae carbapenemase) is a serine carbapenemase that efficiently hydrolyzes carbapenems. Though named after K. pneumoniae, it is increasingly found in E. coli via Tn4401 transposon transfer.",
    },
    # Fluoroquinolone resistance
    {
        "gene_id": "gyrA-S83L",
        "antibiotics": ["ciprofloxacin", "levofloxacin"],
        "location": "chromosome",
        "color": "#a855f7",
        "mechanism": "DNA gyrase target mutation",
        "spreadable": False,
        "description": "The S83L mutation in the DNA gyrase A subunit (gyrA) is the most common fluoroquinolone resistance mechanism in E. coli. It reduces drug binding affinity to the gyrase-DNA complex, the primary target of fluoroquinolones.",
    },
    {
        "gene_id": "QnrS1",
        "antibiotics": ["ciprofloxacin", "levofloxacin"],
        "location": "plasmid",
        "plasmid_name": "pQnr",
        "color": "#7c3aed",
        "mechanism": "Quinolone resistance protein",
        "spreadable": True,
        "description": "QnrS1 encodes a pentapeptide repeat protein that protects DNA gyrase and topoisomerase IV from fluoroquinolone inhibition. It provides low-level resistance that facilitates selection of higher-level chromosomal mutations.",
    },
    # Aminoglycoside resistance
    {
        "gene_id": "AAC(3)-II",
        "antibiotics": ["gentamicin"],
        "location": "plasmid",
        "plasmid_name": "pAAC",
        "color": "#eab308",
        "mechanism": "Aminoglycoside acetyltransferase",
        "spreadable": True,
        "description": "AAC(3)-II acetylates the 3-amino group of gentamicin and related aminoglycosides, preventing ribosomal binding. It is one of the most clinically significant aminoglycoside-modifying enzymes in Gram-negative bacteria.",
    },
    # Trimethoprim/sulfamethoxazole resistance
    {
        "gene_id": "dfrA17",
        "antibiotics": ["trimethoprim/sulfamethoxazole"],
        "location": "chromosome",
        "color": "#06b6d4",
        "mechanism": "Trimethoprim-resistant dihydrofolate reductase",
        "spreadable": False,
        "description": "dfrA17 encodes a variant dihydrofolate reductase with over 10,000-fold reduced affinity for trimethoprim. It is commonly found within class 1 integrons alongside other resistance gene cassettes.",
    },
    {
        "gene_id": "sul2",
        "antibiotics": ["trimethoprim/sulfamethoxazole"],
        "location": "plasmid",
        "plasmid_name": "pSul",
        "color": "#0891b2",
        "mechanism": "Sulfonamide-resistant dihydropteroate synthase",
        "spreadable": True,
        "description": "sul2 encodes an alternative dihydropteroate synthase with low affinity for sulfonamide drugs. Combined with trimethoprim resistance genes, it confers complete resistance to the synergistic TMP/SMX combination.",
    },
    # Tetracycline resistance
    {
        "gene_id": "tetA",
        "antibiotics": ["tetracycline"],
        "location": "plasmid",
        "plasmid_name": "pTet",
        "color": "#f59e0b",
        "mechanism": "Tetracycline efflux pump",
        "spreadable": True,
        "description": "tetA encodes a membrane-associated efflux protein that actively pumps tetracycline out of the bacterial cell. It is regulated by the TetR repressor and is one of the most common tetracycline resistance determinants in E. coli.",
    },
    # Chloramphenicol resistance
    {
        "gene_id": "catA1",
        "antibiotics": ["chloramphenicol"],
        "location": "chromosome",
        "color": "#10b981",
        "mechanism": "Chloramphenicol acetyltransferase",
        "spreadable": False,
        "description": "catA1 encodes a chloramphenicol acetyltransferase that inactivates chloramphenicol by acetylation. This prevents the drug from binding to the 50S ribosomal subunit and blocking protein synthesis.",
    },
    {
        "gene_id": "floR",
        "antibiotics": ["chloramphenicol"],
        "location": "plasmid",
        "plasmid_name": "pFloR",
        "color": "#059669",
        "mechanism": "Chloramphenicol/florfenicol efflux pump",
        "spreadable": True,
        "description": "floR encodes an efflux pump that exports both chloramphenicol and florfenicol. Unlike catA1, it also confers resistance to the fluorinated derivative florfenicol, making it clinically more concerning.",
    },
]


def compute_genome_stats(fasta_text):
    """Compute genome length, GC content windows from raw FASTA text."""
    sequences = []
    current = []
    for line in fasta_text.strip().split("\n"):
        line = line.strip()
        if line.startswith(">"):
            if current:
                sequences.append("".join(current).upper())
                current = []
        else:
            current.append(line)
    if current:
        sequences.append("".join(current).upper())

    full_seq = "".join(sequences)
    genome_length = len(full_seq)

    if genome_length == 0:
        return {"chromosome": {"length": 5000000}, "gc_content_windows": []}

    # Compute GC content in windows
    n_windows = 120
    window_size = genome_length // n_windows
    gc_windows = []
    for i in range(n_windows):
        start = i * window_size
        end = min(start + window_size, genome_length)
        window = full_seq[start:end]
        gc_count = window.count("G") + window.count("C")
        gc = gc_count / len(window) if len(window) > 0 else 0.5
        gc_windows.append({"start": start, "end": end, "gc": round(gc, 4)})

    return {
        "chromosome": {"length": genome_length},
        "gc_content_windows": gc_windows,
    }


def infer_resistance_genes(predictions, genome_length=5000000):
    """Given antibiotic predictions, infer likely resistance genes present.

    Returns a list of gene objects matching the frontend CircularGenomePlot format.
    """
    # Collect antibiotics predicted as resistant
    resistant_abs = set()
    for p in predictions:
        if p["prediction"] == "Resistant":
            resistant_abs.add(p["antibiotic"].lower())

    if not resistant_abs:
        return []

    # Select genes that match resistant antibiotics
    selected = []
    seen_genes = set()
    for gene in GENE_DATABASE:
        gene_abs = set(ab.lower() for ab in gene["antibiotics"])
        if gene_abs & resistant_abs and gene["gene_id"] not in seen_genes:
            selected.append(gene)
            seen_genes.add(gene["gene_id"])

    # Deduplicate: if multiple genes cover the same antibiotic, prefer the
    # most specific one (fewest antibiotics) to avoid clutter
    # But keep all unique mechanism types
    final = []
    covered_abs = set()
    # Sort: genes covering fewer antibiotics first (more specific)
    selected.sort(key=lambda g: len(g["antibiotics"]))
    for gene in selected:
        gene_abs = set(ab.lower() for ab in gene["antibiotics"])
        # Include if it covers at least one not-yet-covered antibiotic
        # or if it's on a different genetic element
        if (gene_abs - covered_abs) or gene["location"] == "plasmid":
            final.append(gene)
            covered_abs |= gene_abs
        # Stop if all resistant antibiotics are covered
        if covered_abs >= resistant_abs:
            break

    # Assign positions spread around the genome
    rng = random.Random(42)  # Deterministic for same results
    chr_genes = [g for g in final if g["location"] == "chromosome"]
    plasmid_genes = [g for g in final if g["location"] == "plasmid"]

    result = []

    # Spread chromosomal genes evenly with some jitter
    for i, gene in enumerate(chr_genes):
        base_pos = int((i + 0.5) / max(len(chr_genes), 1) * genome_length)
        jitter = rng.randint(-genome_length // 20, genome_length // 20)
        pos = max(0, min(genome_length - 2000, base_pos + jitter))
        gene_len = rng.randint(800, 2500)

        result.append({
            "gene_id": gene["gene_id"],
            "position_start": pos,
            "position_end": pos + gene_len,
            "location": "chromosome",
            "color": gene["color"],
            "mechanism": gene["mechanism"],
            "drugs_defeated": gene["antibiotics"],
            "spreadable": gene["spreadable"],
            "description": gene["description"],
        })

    # Plasmid genes get positions too (used for plasmid arc placement)
    for i, gene in enumerate(plasmid_genes):
        pos = rng.randint(100000, genome_length - 100000)
        gene_len = rng.randint(600, 1800)

        result.append({
            "gene_id": gene["gene_id"],
            "position_start": pos,
            "position_end": pos + gene_len,
            "location": "plasmid",
            "plasmid_name": gene.get("plasmid_name", f"Plasmid-{i+1}"),
            "color": gene["color"],
            "mechanism": gene["mechanism"],
            "drugs_defeated": gene["antibiotics"],
            "spreadable": gene["spreadable"],
            "description": gene["description"],
        })

    return result
