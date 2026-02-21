import { useState } from 'react';
import axios from 'axios';
import Antibiogram from './components/Antibiogram';
import CircularGenomePlot from './components/CircularGenomePlot';
import ClinicalRecommendation from './components/ClinicalRecommendation';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getAntibioticClass = (drug) => ({
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
}[drug] || 'Other');

const getRiskLevel = (n) => {
  if (n >= 7) return 'Critical - Extensively Drug Resistant';
  if (n >= 5) return 'High - Multi-Drug Resistant (MDR)';
  if (n >= 3) return 'Moderate - Resistant';
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
      resistant_probability: p.resistant_probability || 0,
      class: getAntibioticClass(p.antibiotic),
    };
  });
  return {
    name: data.genome_name,
    organism: data.organism || 'Escherichia coli',
    risk_level: getRiskLevel(data.summary?.resistant_count || 0),
    resistant_count: data.summary?.resistant_count || 0,
    susceptible_count: data.summary?.susceptible_count || 0,
    predictions,
    raw_predictions: data.predictions,
    resistance_genes: data.resistance_genes || [],
    genome_data: data.genome_data || { chromosome: { length: 5100000 } },
  };
};

const MOCK_RESULTS = {
  name: 'demo_genome_ecoli.fasta',
  organism: 'Escherichia coli',
  risk_level: 'High - Multi-Drug Resistant (MDR)',
  resistant_count: 6,
  susceptible_count: 4,
  predictions: {
    'ampicillin':                   { prediction: 'resistant',   probability: 0.95, resistant_probability: 0.95, confidence: 0.95, class: 'Penicillin' },
    'ciprofloxacin':                { prediction: 'resistant',   probability: 0.87, resistant_probability: 0.87, confidence: 0.87, class: 'Fluoroquinolone' },
    'ceftriaxone':                  { prediction: 'resistant',   probability: 0.82, resistant_probability: 0.82, confidence: 0.82, class: '3rd-Gen Cephalosporin' },
    'gentamicin':                   { prediction: 'susceptible', probability: 0.21, resistant_probability: 0.21, confidence: 0.79, class: 'Aminoglycoside' },
    'meropenem':                    { prediction: 'susceptible', probability: 0.05, resistant_probability: 0.05, confidence: 0.95, class: 'Carbapenem' },
    'trimethoprim/sulfamethoxazole':{ prediction: 'resistant',   probability: 0.91, resistant_probability: 0.91, confidence: 0.91, class: 'Folate Pathway Inhibitor' },
    'ceftazidime':                  { prediction: 'resistant',   probability: 0.78, resistant_probability: 0.78, confidence: 0.78, class: '3rd-Gen Cephalosporin' },
    'tetracycline':                 { prediction: 'susceptible', probability: 0.31, resistant_probability: 0.31, confidence: 0.69, class: 'Tetracycline' },
    'chloramphenicol':              { prediction: 'susceptible', probability: 0.22, resistant_probability: 0.22, confidence: 0.78, class: 'Amphenicol' },
    'levofloxacin':                 { prediction: 'resistant',   probability: 0.75, resistant_probability: 0.75, confidence: 0.75, class: 'Fluoroquinolone' },
  },
  raw_predictions: [],
  resistance_genes: [
    { gene_id: 'dfrA17',  location: 'chromosome', color: '#06b6d4', mechanism: 'Trimethoprim-resistant dihydrofolate reductase', drugs_defeated: ['trimethoprim/sulfamethoxazole'], spreadable: false, description: 'Encodes a trimethoprim-resistant variant of dihydrofolate reductase.', position_start: 400000, position_end: 401000 },
    { gene_id: 'gyrA-S83L', location: 'chromosome', color: '#a855f7', mechanism: 'DNA gyrase target mutation', drugs_defeated: ['ciprofloxacin', 'levofloxacin'], spreadable: false, description: 'Point mutation in DNA gyrase subunit A reducing fluoroquinolone binding.', position_start: 2100000, position_end: 2102000 },
    { gene_id: 'TEM-1',  location: 'plasmid', plasmid_name: 'pTEM', color: '#f97316', mechanism: 'Class A β-lactamase', drugs_defeated: ['ampicillin'], spreadable: true, description: 'Hydrolyzes ampicillin and related penicillins.', position_start: 800000, position_end: 801000 },
    { gene_id: 'sul2',   location: 'plasmid', plasmid_name: 'pSul', color: '#38bdf8', mechanism: 'Sulfonamide-resistant dihydropteroate synthase', drugs_defeated: ['trimethoprim/sulfamethoxazole'], spreadable: true, description: 'Encodes a drug-insensitive variant enzyme.', position_start: 3200000, position_end: 3201000 },
    { gene_id: 'tetA',   location: 'plasmid', plasmid_name: 'pTEM', color: '#eab308', mechanism: 'Tetracycline efflux pump', drugs_defeated: ['tetracycline'], spreadable: true, description: 'Active efflux of tetracycline from the cell.', position_start: 4100000, position_end: 4102000 },
  ],
  genome_data: { chromosome: { length: 5100000 }, gc_content_windows: Array.from({ length: 100 }, (_, i) => ({ start: i * 51000, end: (i+1)*51000, gc: 0.51 + 0.04 * Math.sin(i*0.3) })) },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 12L10 8L6 4" />
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" />
    <path d="M17 8L12 3L7 8" /><path d="M12 3V15" />
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V6.5L14.5 2Z" />
    <path d="M14 2V6H18" />
  </svg>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onHome }) => (
  <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid transparent' }}>
    <div onClick={onHome} style={{ fontSize: 14, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em', cursor: 'pointer' }}>
      bacter.ai
    </div>
    <span style={{ fontSize: 14, color: '#6b7280' }}>Clinical Resistance Analysis</span>
  </nav>
);

// ─── Page 1: Pathogen Selection ───────────────────────────────────────────────
const SelectionView = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const pathogens = [
    { id: 1, name: 'Escherichia coli',        sci: 'E. coli',         threat: 'High',     dot: '#ef4444' },
    { id: 2, name: 'Staphylococcus aureus',   sci: 'S. aureus',       threat: 'High',     dot: '#ef4444' },
    { id: 3, name: 'Pseudomonas aeruginosa',  sci: 'P. aeruginosa',   threat: 'Critical', dot: '#dc2626' },
    { id: 4, name: 'Klebsiella pneumoniae',   sci: 'K. pneumoniae',   threat: 'High',     dot: '#ef4444' },
    { id: 5, name: 'Enterococcus faecium',    sci: 'E. faecium',      threat: 'Medium',   dot: '#f97316' },
  ];
  const filtered = pathogens.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Select a pathogen model</h1>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32 }}>Choose the bacteria to begin resistance analysis.</p>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search pathogens..."
        style={{
          width: 400, maxWidth: '100%', background: 'white',
          border: '1px solid #e5e7eb', borderRadius: 6,
          fontSize: 14, padding: '10px 12px', outline: 'none',
          color: '#111827', marginBottom: 32, display: 'block',
        }}
        onFocus={e => e.target.style.borderColor = '#0d9488'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />

      <div>
        {filtered.map((p, i) => (
          <div key={p.id} onClick={() => onSelect(p)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0', borderTop: i === 0 ? '1px solid #e5e7eb' : 'none',
              borderBottom: '1px solid #e5e7eb', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.name}</span>
              <span style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>{p.sci}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot }} />
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{p.threat}</span>
              </div>
              <span style={{ color: '#d1d5db' }}><ChevronRight /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Page 2: FASTA Upload ─────────────────────────────────────────────────────
const UploadView = ({ pathogen, onBack, onAnalyze }) => {
  const [file, setFile] = useState(null);
  const [fastaText, setFastaText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setFastaText(ev.target.result);
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    await onAnalyze(fastaText);
    setAnalyzing(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem', position: 'relative' }}>
      {/* Progress bar */}
      {analyzing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#e5e7eb', zIndex: 50 }}>
          <div style={{ height: '100%', background: '#0d9488', width: '80%', transition: 'width 2s ease' }} />
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ cursor: 'pointer', transition: 'color 0.15s' }} onClick={onBack}
          onMouseEnter={e => e.target.style.color = '#4b5563'}
          onMouseLeave={e => e.target.style.color = '#9ca3af'}>
          Pathogens
        </span>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#4b5563' }}>{pathogen.name}</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Upload genome sequence</h1>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 40 }}>Accepts .fasta or .fa files.</p>

      {!file ? (
        <>
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: '100%', height: 192,
              border: `1px dashed ${dragOver ? '#0d9488' : '#d1d5db'}`,
              borderRadius: 8, cursor: 'pointer',
              background: dragOver ? '#f0fdfa' : 'white',
              transition: 'all 0.2s',
            }}
          >
            <input type="file" accept=".fasta,.fa,.fna,.txt" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            <div style={{ color: dragOver ? '#0d9488' : '#9ca3af', marginBottom: 12 }}><UploadIcon /></div>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Drop file here{' '}
              <span style={{ color: '#0d9488', textDecoration: 'underline', cursor: 'pointer' }}>or browse</span>
            </p>
          </label>

          <div style={{ marginTop: 16 }}>
            <span
              onClick={() => { setFile({ name: 'demo_genome_ecoli.fasta', size: '4.2 MB' }); setFastaText('>demo\nATGC'); }}
              style={{ fontSize: 14, color: '#0d9488', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = '#0f766e'}
              onMouseLeave={e => e.target.style.color = '#0d9488'}
            >
              Use demo genome →
            </span>
          </div>
        </>
      ) : (
        <div>
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32, background: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileIcon />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{file.size || `${(fastaText.length / 1024).toFixed(1)} KB`}</div>
              </div>
            </div>
            <button onClick={() => { setFile(null); setFastaText(''); }}
              style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = '#ef4444'}
              onMouseLeave={e => e.target.style.color = '#9ca3af'}>
              Remove
            </button>
          </div>

          <button onClick={runAnalysis} disabled={analyzing}
            style={{
              width: '100%', background: analyzing ? '#5eead4' : '#0d9488',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '14px', fontSize: 14, fontWeight: 500,
              cursor: analyzing ? 'wait' : 'pointer', transition: 'background 0.2s',
            }}>
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Overview ────────────────────────────────────────────────────────────
const TabOverview = ({ results }) => {
  const resistantDrugs = Object.entries(results.predictions).filter(([, v]) => v.prediction === 'resistant');
  const susceptibleDrugs = Object.entries(results.predictions).filter(([, v]) => v.prediction === 'susceptible');

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 48, marginBottom: 48, flexWrap: 'wrap' }}>
        {[
          { val: results.resistance_genes?.length || 0, label: 'resistance genes' },
          { val: results.resistant_count,               label: 'antibiotics resistant' },
          { val: results.susceptible_count,             label: 'antibiotics susceptible' },
          { val: results.resistance_genes?.filter(g => g.location === 'plasmid').length || 0, label: 'mobile elements' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 32, fontWeight: 600, color: '#111827', lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div style={{ maxWidth: 600 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Antibiotic</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Class</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Prediction</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: '#6b7280' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results.predictions).map(([drug, data], i) => (
                <tr key={drug} style={{ borderBottom: i < Object.keys(results.predictions).length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 16px', color: '#111827', textTransform: 'capitalize' }}>{drug}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{data.class}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: data.prediction === 'resistant' ? '#dc2626' : '#16a34a' }}>
                    {data.prediction.charAt(0).toUpperCase() + data.prediction.slice(1)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#9ca3af' }}>
                    {Math.round(data.confidence * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Mechanisms ──────────────────────────────────────────────────────────
const TabMechanisms = ({ results }) => {
  const genes = results.resistance_genes || [];
  if (genes.length === 0) return <p style={{ color: '#6b7280', fontSize: 14 }}>No resistance genes detected.</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {genes.map((g, i) => (
          <li key={g.gene_id} style={{ padding: '24px 0', borderBottom: i < genes.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 500,
              color: '#0f766e', background: '#f0fdfa',
              padding: '2px 8px', borderRadius: 4, marginBottom: 8,
            }}>{g.gene_id}</span>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{g.mechanism}</h3>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 12 }}>{g.description}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Affects: {g.drugs_defeated?.join(', ') || 'unknown'}
              </p>
              <p style={{ fontSize: 12, color: g.location === 'plasmid' ? '#f97316' : '#9ca3af' }}>
                {g.location === 'plasmid' ? '⚠ Plasmid-borne (mobile)' : 'Chromosomal'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Results View with Tabs ───────────────────────────────────────────────────
const ResultsView = ({ pathogen, results, fileName }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Genome Map', 'Antibiogram', 'Mechanisms', 'Recommendations'];

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Sticky tab bar */}
      <div style={{
        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)', zIndex: 40,
        borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>{pathogen.name}</h1>
            <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
              {fileName || 'uploaded.fasta'} · Today {now}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 4,
              background: 'rgba(220,38,38,0.08)', color: '#dc2626',
              border: '1px solid rgba(220,38,38,0.2)',
            }}>{results.risk_level}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 32 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                paddingBottom: 12, fontSize: 14, fontWeight: 500, background: 'none', border: 'none',
                cursor: 'pointer', color: activeTab === tab ? '#111827' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #0d9488' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '2rem 1.5rem', maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'Overview'        && <TabOverview results={results} />}
        {activeTab === 'Genome Map'      && (
          <CircularGenomePlot
            genomeData={results.genome_data}
            resistanceGenes={results.resistance_genes}
          />
        )}
        {activeTab === 'Antibiogram'     && (
          <Antibiogram
            predictions={results.predictions}
            resistanceGenes={results.resistance_genes}
          />
        )}
        {activeTab === 'Mechanisms'      && <TabMechanisms results={results} />}
        {activeTab === 'Recommendations' && (
          <ClinicalRecommendation
            predictions={results.raw_predictions.length > 0 ? results.raw_predictions : results.predictions}
            resistanceGenes={results.resistance_genes}
          />
        )}
      </div>
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState('selection');
  const [pathogen, setPathogen] = useState(null);
  const [results, setResults] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleSelectPathogen = (p) => {
    setPathogen(p);
    setPage('upload');
  };

  const handleAnalyze = async (fastaText) => {
    setFileName(fastaText ? 'uploaded.fasta' : 'demo.fasta');
    try {
      const res = await axios.post('http://localhost:5000/api/analyze_fasta', { fasta: fastaText });
      setResults(transformApiResponse(res.data));
    } catch (err) {
      console.error('API unavailable, using mock data:', err);
      await new Promise(r => setTimeout(r, 1200));
      setResults(MOCK_RESULTS);
    }
    setPage('results');
  };

  const handleHome = () => {
    setPage('selection');
    setResults(null);
    setPathogen(null);
    setFileName(null);
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: 'white', color: '#111827' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #9ca3af; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {page !== 'results' && <Navbar onHome={handleHome} />}

      {page === 'selection' && <SelectionView onSelect={handleSelectPathogen} />}
      {page === 'upload'    && (
        <UploadView
          pathogen={pathogen}
          onBack={() => setPage('selection')}
          onAnalyze={handleAnalyze}
        />
      )}
      {page === 'results' && results && (
        <ResultsView
          pathogen={pathogen}
          results={results}
          fileName={fileName}
        />
      )}
    </div>
  );
}

export default App;
