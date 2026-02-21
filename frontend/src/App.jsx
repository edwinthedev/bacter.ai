import { useState, useEffect } from 'react';
import axios from 'axios';
import GenomeSelector from './components/GenomeSelector';
import Antibiogram from './components/Antibiogram';
import CircularGenomePlot from './components/CircularGenomePlot';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [genomes, setGenomes] = useState([]);
  const [selectedGenome, setSelectedGenome] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGene, setActiveGene] = useState(null);

  // MOCK DATA - remove when Edwin's backend is ready
  useEffect(() => {
    setAnalysisResults({
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
        { gene_id: "blaCTX-M-15", angle: 45, color: "#e74c3c", name: "blaCTX-M-15", desc: "ESBL Beta-lactamase", is_mobile: false },
        { gene_id: "qnrB19", angle: 120, color: "#e74c3c", name: "qnrB19", desc: "Quinolone resistance", is_mobile: false },
        { gene_id: "aac(6')-Ib", angle: 280, color: "#9b59b6", name: "aac(6')-Ib", desc: "Aminoglycoside acetyltransferase", is_mobile: true },
        { gene_id: "mcr-1", angle: 310, color: "#9b59b6", name: "mcr-1", desc: "Colistin resistance", is_mobile: true }
      ]
    });
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ 
        fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
        fontSize: '1.25rem', marginBottom: '2rem', color: 'var(--navy-base)',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
      }}>
        <div style={{ width: 12, height: 24, background: 'var(--navy-base)', borderRadius: 4 }} />
        bacter.ai
      </div>

      {/* Input Panel */}
      <section style={{
        background: 'var(--glass-white)', borderRadius: 'var(--radius-lg)',
        padding: '2rem', boxShadow: 'var(--shadow-glass)',
        border: '1px solid var(--border-hairline)',
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: '2rem', alignItems: 'center', marginBottom: '2rem'
      }}>
        <div>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-sub)', fontWeight: 600 }}>
            Select Genome Profile
          </label>
          <select style={{
            appearance: 'none', background: 'var(--bg-page)',
            border: '1px solid var(--border-hairline)', padding: '1rem',
            borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)',
            fontSize: '1.1rem', color: 'var(--navy-base)', width: '100%',
            maxWidth: 500, marginTop: '0.5rem', cursor: 'pointer'
          }}>
            <option>E. coli ST131 (Clinical Isolate #492)</option>
            <option>E. coli K-12 MG1655</option>
            <option>E. coli O157:H7 EDL933</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {['ExPEC Pathotype', 'Sequence Type: 131', 'Source: Urinary Tract'].map(chip => (
              <span key={chip} style={{
                background: 'var(--glass-shade)', padding: '0.25rem 0.75rem',
                borderRadius: 100, fontSize: '0.8rem', color: 'var(--text-sub)',
                border: '1px solid rgba(0,0,0,0.05)', fontWeight: 500
              }}>{chip}</span>
            ))}
            <span style={{
              background: 'var(--glass-shade)', padding: '0.25rem 0.75rem',
              borderRadius: 100, fontSize: '0.8rem', fontWeight: 500,
              color: 'var(--c-resistant)', border: '1px solid rgba(231,76,60,0.3)'
            }}>CTX-M-15 Positive</span>
          </div>
        </div>
        <button style={{
          background: 'var(--navy-base)', color: 'white', border: 'none',
          padding: '1rem 2.5rem', borderRadius: 'var(--radius-sm)',
          fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Run Analysis
        </button>
      </section>

      {/* Results Grid */}
      {analysisResults && (
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
      )}
    </div>
  );
}

export default App;