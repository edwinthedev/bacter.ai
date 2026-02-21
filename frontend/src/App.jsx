import { useState } from 'react';
import GenomeSelector from './components/GenomeSelector';
import Antibiogram from './components/Antibiogram';
import CircularGenomePlot from './components/CircularGenomePlot';

const API_URL = 'http://localhost:5000/api';

const MOCK_RESULTS = {
  name: "E. coli ST131 (Clinical Isolate #492)",
  risk_level: "High - Multi-Drug Resistant (MDR)",
  predictions: {
    "ampicillin": { prediction: "resistant", probability: 0.95, confidence: 0.95, class: "Penicillin" },
    "ciprofloxacin": { prediction: "resistant", probability: 0.87, confidence: 0.87, class: "Fluoroquinolone" },
    "ceftriaxone": { prediction: "resistant", probability: 0.82, confidence: 0.82, class: "3rd-Gen Cephalosporin" },
    "gentamicin": { prediction: "susceptible", probability: 0.21, confidence: 0.79, class: "Aminoglycoside" },
    "meropenem": { prediction: "susceptible", probability: 0.05, confidence: 0.95, class: "Carbapenem" },
    "trimethoprim/sulfamethoxazole": { prediction: "resistant", probability: 0.91, confidence: 0.91, class: "Folate Pathway Inhibitor" },
    "ceftazidime": { prediction: "resistant", probability: 0.78, confidence: 0.78, class: "3rd-Gen Cephalosporin" },
    "amoxicillin/clavulanic acid": { prediction: "susceptible", probability: 0.31, confidence: 0.69, class: "Beta-lactam + Inhibitor" },
    "colistin": { prediction: "susceptible", probability: 0.12, confidence: 0.88, class: "Polymyxin" },
    "nitrofurantoin": { prediction: "susceptible", probability: 0.18, confidence: 0.82, class: "Nitrofuran" }
  },
  resistance_genes: [
    { gene_id: "blaCTX-M-15", position_start: 1100000, position_end: 1101000, location: "chromosome", color: "#e74c3c", mechanism: "ESBL Beta-lactamase", drugs_defeated: ["ampicillin", "ceftriaxone"], spreadable: false, description: "Extended-spectrum beta-lactamase that destroys most penicillins and cephalosporins." },
    { gene_id: "qnrB19", position_start: 2300000, position_end: 2300700, location: "chromosome", color: "#e74c3c", mechanism: "Quinolone resistance", drugs_defeated: ["ciprofloxacin"], spreadable: false, description: "Protects DNA gyrase from fluoroquinolone inhibition." },
    { gene_id: "aac(6')-Ib", position_start: 3600000, position_end: 3601200, location: "plasmid", plasmid_name: "pEC-MDR", color: "#9b59b6", mechanism: "Aminoglycoside acetyltransferase", drugs_defeated: ["gentamicin", "ciprofloxacin"], spreadable: true, description: "Modifies aminoglycosides and fluoroquinolones, reducing their effectiveness." },
  ]
};

function App() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGene, setActiveGene] = useState(null);

  const handleSelectGenome = async (genomeId) => {
    setLoading(true);
    setActiveGene(null);

    // TODO: replace with real API call when Edwin's backend is ready
    // const res = await axios.post(`${API_URL}/analyze`, { genome_id: genomeId });
    // setAnalysisResults(res.data);

    // Mock delay to simulate API call
    setTimeout(() => {
      setAnalysisResults(MOCK_RESULTS);
      setLoading(false);
    }, 800);
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
      </div>

      {/* Genome Selector */}
      <GenomeSelector onSelect={handleSelectGenome} />

      {/* Loading spinner */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid #e2e8f0',
            borderTop: '3px solid var(--navy-base)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {analysisResults && !loading && (
        <>
          {/* Risk banner */}
          <div style={{
            margin: '2rem 0 1rem',
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

          {/* Main results grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
            <Antibiogram
              predictions={analysisResults.predictions}
              resistanceGenes={analysisResults.resistance_genes}
              onDrugClick={setActiveGene}
            />
            <CircularGenomePlot
              genomeData={{ chromosome: { length: 5100000 } }}
              resistanceGenes={analysisResults.resistance_genes}
              onGeneClick={setActiveGene}
            />
          </div>
        </>
      )}

      {/* Empty state */}
      {!analysisResults && !loading && (
        <div style={{
          textAlign: 'center', padding: '4rem',
          color: 'var(--text-sub)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'
        }}>
          ↑ Search and select a genome to begin analysis
        </div>
      )}
    </div>
  );
}

export default App;