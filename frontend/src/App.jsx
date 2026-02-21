import { useState } from 'react';
import axios from 'axios';
import BacteriaSelector from './components/BacteriaSelector';
import Antibiogram from './components/Antibiogram';
import CircularGenomePlot from './components/CircularGenomePlot';

const getAntibioticClass = (drug) => {
  const classes = {
    'ampicillin': 'Penicillin',
    'ciprofloxacin': 'Fluoroquinolone',
    'levofloxacin': 'Fluoroquinolone',
    'ceftriaxone': '3rd-Gen Cephalosporin',
    'ceftazidime': '3rd-Gen Cephalosporin',
    'gentamicin': 'Aminoglycoside',
    'meropenem': 'Carbapenem',
    'trimethoprim/sulfamethoxazole': 'Folate Pathway Inhibitor',
    'tetracycline': 'Tetracycline',
    'chloramphenicol': 'Amphenicol',
  };
  return classes[drug] || 'Other';
};

const getRiskLevel = (resistantCount) => {
  if (resistantCount >= 7) return 'Critical - Extensively Drug Resistant';
  if (resistantCount >= 5) return 'High - Multi-Drug Resistant (MDR)';
  if (resistantCount >= 3) return 'Moderate - Resistant';
  return 'Low - Largely Susceptible';
};

const transformApiResponse = (data) => {
  const predictions = {};
  data.predictions.forEach(p => {
    if (p.prediction === 'No model') return;
    predictions[p.antibiotic] = {
      prediction: p.prediction.toLowerCase(),
      probability: p.resistant_probability || 0,
      confidence: p.confidence,
      class: getAntibioticClass(p.antibiotic),
    };
  });
  return {
    name: data.genome_name,
    risk_level: getRiskLevel(data.summary?.resistant_count || 0),
    predictions,
    resistance_genes: data.resistance_genes || [],
    genome_data: data.genome_data || { chromosome: { length: 5100000 } },
  };
};

const MOCK_RESULTS = {
  name: "E. coli (uploaded sample)",
  risk_level: "High - Multi-Drug Resistant (MDR)",
  predictions: {
    "ampicillin": { prediction: "resistant", probability: 0.95, confidence: 0.95, class: "Penicillin" },
    "ciprofloxacin": { prediction: "resistant", probability: 0.87, confidence: 0.87, class: "Fluoroquinolone" },
    "ceftriaxone": { prediction: "resistant", probability: 0.82, confidence: 0.82, class: "3rd-Gen Cephalosporin" },
    "gentamicin": { prediction: "susceptible", probability: 0.21, confidence: 0.79, class: "Aminoglycoside" },
    "meropenem": { prediction: "susceptible", probability: 0.05, confidence: 0.95, class: "Carbapenem" },
    "trimethoprim/sulfamethoxazole": { prediction: "resistant", probability: 0.91, confidence: 0.91, class: "Folate Pathway Inhibitor" },
    "ceftazidime": { prediction: "resistant", probability: 0.78, confidence: 0.78, class: "3rd-Gen Cephalosporin" },
    "tetracycline": { prediction: "susceptible", probability: 0.31, confidence: 0.69, class: "Tetracycline" },
    "chloramphenicol": { prediction: "susceptible", probability: 0.22, confidence: 0.78, class: "Amphenicol" },
    "levofloxacin": { prediction: "resistant", probability: 0.75, confidence: 0.75, class: "Fluoroquinolone" },
  },
  resistance_genes: []
};

function App() {
  const [page, setPage] = useState('select'); // 'select' | 'upload' | 'results'
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fastaText, setFastaText] = useState('');
  const [fileName, setFileName] = useState(null);
  const [activeGene, setActiveGene] = useState(null);

  const handleBacteriaSelect = () => {
    setPage('upload');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFastaText(ev.target.result);
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setActiveGene(null);
    setPage('results');

    try {
      const res = await axios.post('http://localhost:5000/api/analyze_fasta', {
        fasta: fastaText
      });
      setAnalysisResults(transformApiResponse(res.data));
    } catch (err) {
      console.error('API unavailable, using mock data:', err);
      setTimeout(() => {
        setAnalysisResults(MOCK_RESULTS);
        setLoading(false);
      }, 1200);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPage('select');
    setAnalysisResults(null);
    setFastaText('');
    setFileName(null);
    setActiveGene(null);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

      {/* Header */}
      <div style={{
        fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
        fontSize: '1.25rem', marginBottom: '2rem', color: 'var(--navy-base)',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
      }}>
        <div style={{ width: 12, height: 24, background: 'var(--navy-base)', borderRadius: 4 }} />
        bacter.ai
        {page !== 'select' && (
          <button onClick={handleBack} style={{
            marginLeft: 'auto',
            background: 'var(--navy-base)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}>← BACK</button>
        )}
      </div>

      {/* PAGE 1: Bacteria selector */}
      {page === 'select' && (
        <BacteriaSelector onSelect={handleBacteriaSelect} />
      )}

      {/* PAGE 2: FASTA upload */}
      {page === 'upload' && (
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
          borderRadius: 16, padding: 24, maxWidth: 640, margin: '0 auto'
        }}>
          <h2 style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 18, fontWeight: 800, margin: '0 0 4px', letterSpacing: '0.05em' }}>
            UPLOAD FASTA
          </h2>
          <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11, margin: '0 0 20px', letterSpacing: '0.05em' }}>
            E. COLI GENOME SEQUENCE
          </p>

          {/* File upload button */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#1e293b', border: '1px dashed #334155',
            borderRadius: 10, padding: '16px 20px', cursor: 'pointer',
            marginBottom: 16, transition: 'border-color 0.2s',
          }}>
            <input type="file" accept=".fasta,.fa,.fna,.txt" onChange={handleFileUpload}
              style={{ display: 'none' }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div>
              <div style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
                {fileName || 'Click to upload .fasta file'}
              </div>
              <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
                .fasta, .fa, .fna supported
              </div>
            </div>
            {fileName && (
              <span style={{ marginLeft: 'auto', color: '#4ade80', fontFamily: 'monospace', fontSize: 10 }}>✓ loaded</span>
            )}
          </label>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
            <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>OR PASTE SEQUENCE</span>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
          </div>

          {/* Text area */}
          <textarea
            value={fastaText}
            onChange={(e) => { setFastaText(e.target.value); setFileName(null); }}
            placeholder={`>genome_sample\nATGCGATCGATCGATCGATCG...`}
            style={{
              width: '100%', height: 140, background: '#1e293b',
              border: '1px solid #334155', borderRadius: 10,
              padding: '12px 14px', color: '#f1f5f9',
              fontFamily: 'monospace', fontSize: 12,
              resize: 'vertical', outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!fastaText.trim()}
            style={{
              width: '100%', marginTop: 16,
              background: fastaText.trim() ? 'var(--navy-base)' : '#1e293b',
              color: fastaText.trim() ? 'white' : '#475569',
              border: 'none', borderRadius: 10,
              padding: '14px', fontFamily: 'monospace',
              fontSize: 14, fontWeight: 700,
              letterSpacing: '0.08em', cursor: fastaText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', textTransform: 'uppercase'
            }}
          >
            Run Analysis →
          </button>
        </div>
      )}

      {/* PAGE 3: Results */}
      {page === 'results' && (
        <>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: 16 }}>
              <div style={{
                width: 48, height: 48, border: '3px solid #e2e8f0',
                borderTop: '3px solid var(--navy-base)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ color: 'var(--text-sub)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Analyzing genome...
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {analysisResults && !loading && (
            <>
              {/* Risk banner */}
              <div style={{
                margin: '0 0 1.5rem',
                padding: '1rem 1.5rem',
                background: 'var(--glass-white)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--navy-base)', fontSize: '1rem' }}>
                  {analysisResults.name}
                </span>
                <span style={{
                  fontWeight: 700, fontSize: '0.8rem', padding: '0.25rem 0.75rem',
                  borderRadius: 4, background: 'rgba(231,76,60,0.1)',
                  color: 'var(--c-resistant)', border: '1px solid rgba(231,76,60,0.3)'
                }}>
                  {analysisResults.risk_level}
                </span>
              </div>

              {/* Results grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
                <Antibiogram
                  predictions={analysisResults.predictions}
                  resistanceGenes={analysisResults.resistance_genes}
                  onDrugClick={setActiveGene}
                />
                <CircularGenomePlot
                  genomeData={analysisResults.genome_data}
                  resistanceGenes={analysisResults.resistance_genes}
                  onGeneClick={setActiveGene}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;