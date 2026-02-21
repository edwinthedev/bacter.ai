import { useState } from 'react';

// ─── Antibiotic metadata ─────────────────────────────────────────────────────
const ANTIBIOTIC_META = {
  'ampicillin': {
    class: 'Penicillin', spectrum: 'narrow', lastResort: false,
    sideEffects: { severity: 1, label: 'Mild', notes: 'Rash, diarrhea, nausea' },
    cost: { tier: 1, label: 'Very Low', usd: '~$5–15/course' },
  },
  'amoxicillin/clavulanic acid': {
    class: 'Penicillin + Inhibitor', spectrum: 'narrow', lastResort: false,
    sideEffects: { severity: 1, label: 'Mild', notes: 'GI upset, rash' },
    cost: { tier: 1, label: 'Low', usd: '~$15–40/course' },
  },
  'ciprofloxacin': {
    class: 'Fluoroquinolone', spectrum: 'broad', lastResort: false,
    sideEffects: { severity: 2, label: 'Moderate', notes: 'Tendon rupture risk, QT prolongation, GI effects' },
    cost: { tier: 1, label: 'Low', usd: '~$10–30/course' },
  },
  'ceftriaxone': {
    class: 'Cephalosporin (3rd gen)', spectrum: 'broad', lastResort: false,
    sideEffects: { severity: 1, label: 'Mild', notes: 'Injection site reaction, diarrhea' },
    cost: { tier: 2, label: 'Moderate', usd: '~$30–80/course' },
  },
  'ceftazidime': {
    class: 'Cephalosporin (3rd gen)', spectrum: 'broad', lastResort: false,
    sideEffects: { severity: 1, label: 'Mild', notes: 'Injection site reaction, rash' },
    cost: { tier: 2, label: 'Moderate', usd: '~$40–100/course' },
  },
  'gentamicin': {
    class: 'Aminoglycoside', spectrum: 'narrow', lastResort: false,
    sideEffects: { severity: 3, label: 'Significant', notes: 'Nephrotoxicity, ototoxicity — requires monitoring' },
    cost: { tier: 1, label: 'Low', usd: '~$10–25/course' },
  },
  'trimethoprim/sulfamethoxazole': {
    class: 'Sulfonamide', spectrum: 'narrow', lastResort: false,
    sideEffects: { severity: 2, label: 'Moderate', notes: 'Rash, photosensitivity, bone marrow suppression (rare)' },
    cost: { tier: 1, label: 'Very Low', usd: '~$5–20/course' },
  },
  'meropenem': {
    class: 'Carbapenem', spectrum: 'very broad', lastResort: true,
    sideEffects: { severity: 2, label: 'Moderate', notes: 'Seizure risk (high doses), GI effects, rash' },
    cost: { tier: 3, label: 'High', usd: '~$200–600/course' },
  },
  'colistin': {
    class: 'Polymyxin', spectrum: 'narrow', lastResort: true,
    sideEffects: { severity: 4, label: 'Severe', notes: 'Nephrotoxicity, neurotoxicity — last resort only' },
    cost: { tier: 3, label: 'High', usd: '~$150–400/course' },
  },
  'nitrofurantoin': {
    class: 'Nitrofuran', spectrum: 'narrow', lastResort: false,
    sideEffects: { severity: 1, label: 'Mild', notes: 'GI upset, pulmonary reactions (rare, long-term use)' },
    cost: { tier: 1, label: 'Very Low', usd: '~$10–25/course' },
  },
  'tetracycline': {
    class: 'Tetracycline', spectrum: 'broad', lastResort: false,
    sideEffects: { severity: 2, label: 'Moderate', notes: 'Photosensitivity, GI effects, avoid in pregnancy' },
    cost: { tier: 1, label: 'Very Low', usd: '~$5–15/course' },
  },
  'chloramphenicol': {
    class: 'Amphenicol', spectrum: 'broad', lastResort: false,
    sideEffects: { severity: 3, label: 'Significant', notes: 'Aplastic anemia (rare but fatal), grey baby syndrome' },
    cost: { tier: 1, label: 'Very Low', usd: '~$5–20/course' },
  },
  'levofloxacin': {
    class: 'Fluoroquinolone', spectrum: 'broad', lastResort: false,
    sideEffects: { severity: 2, label: 'Moderate', notes: 'Tendon rupture risk, QT prolongation, CNS effects' },
    cost: { tier: 1, label: 'Low', usd: '~$15–40/course' },
  },
};

// ─── Mock data (used only when no props passed) ───────────────────────────────
const MOCK_PREDICTIONS = [
  { antibiotic: 'ampicillin',                      prediction: 'Resistant',    confidence: 0.94, resistant_probability: 0.94 },
  { antibiotic: 'ciprofloxacin',                   prediction: 'Susceptible',  confidence: 0.81, resistant_probability: 0.19 },
  { antibiotic: 'ceftriaxone',                     prediction: 'Resistant',    confidence: 0.91, resistant_probability: 0.91 },
  { antibiotic: 'ceftazidime',                     prediction: 'Susceptible',  confidence: 0.76, resistant_probability: 0.24 },
  { antibiotic: 'gentamicin',                      prediction: 'Susceptible',  confidence: 0.88, resistant_probability: 0.12 },
  { antibiotic: 'trimethoprim/sulfamethoxazole',   prediction: 'Resistant',    confidence: 0.79, resistant_probability: 0.79 },
  { antibiotic: 'meropenem',                       prediction: 'Susceptible',  confidence: 0.95, resistant_probability: 0.05 },
  { antibiotic: 'tetracycline',                    prediction: 'Resistant',    confidence: 0.83, resistant_probability: 0.83 },
  { antibiotic: 'chloramphenicol',                 prediction: 'Susceptible',  confidence: 0.69, resistant_probability: 0.31 },
  { antibiotic: 'levofloxacin',                    prediction: 'Susceptible',  confidence: 0.78, resistant_probability: 0.22 },
];

const MOCK_RESISTANCE_GENES = [
  { gene_id: 'TEM-1',  location: 'plasmid',    drugs_defeated: ['ampicillin', 'amoxicillin/clavulanic acid'] },
  { gene_id: 'QnrS1',  location: 'plasmid',    drugs_defeated: ['ciprofloxacin'] },
  { gene_id: 'Sul2',   location: 'chromosome', drugs_defeated: ['trimethoprim/sulfamethoxazole'] },
];

// ─── Scoring logic ────────────────────────────────────────────────────────────
function scoreAntibiotic(drug, predData, meta, resistanceGenes) {
  if (!predData || !meta) return null;
  if (predData.prediction.toLowerCase() === 'resistant') return null;

  let score = 0;
  const flags = [];
  const bonuses = [];

  // 1. Effectiveness (up to 40 pts)
  score += (1 - predData.resistant_probability) * 40;

  // 2. Spectrum preference
  if (meta.spectrum === 'narrow')      { score += 20; bonuses.push('Narrow spectrum'); }
  else if (meta.spectrum === 'broad')  { score += 10; }

  // 3. Carbapenem sparing
  if (meta.lastResort) {
    score -= 25;
    flags.push({ type: 'warning', text: 'Last-resort antibiotic — use only if no alternatives exist' });
  } else {
    score += 15;
    bonuses.push('Carbapenem-sparing');
  }

  // 4. Side effect penalty
  score -= meta.sideEffects.severity * 4;
  if (meta.sideEffects.severity >= 3) {
    flags.push({ type: 'caution', text: `Significant side effects: ${meta.sideEffects.notes}` });
  }

  // 5. Cost bonus
  score += (4 - meta.cost.tier) * 5;

  // 6. Plasmid-borne resistance
  const plasmidGenes = (resistanceGenes || []).filter(g =>
    g.location === 'plasmid' && (g.drugs_defeated || []).includes(drug)
  );
  if (plasmidGenes.length > 0) {
    score -= 10;
    flags.push({ type: 'spread', text: `Resistance gene on plasmid (${plasmidGenes.map(g => g.gene_id).join(', ')}) — spreading risk` });
  }

  // 7. Model confidence bonus
  if (predData.confidence > 0.9)      { score += 8; bonuses.push('High model confidence'); }
  else if (predData.confidence > 0.75) { score += 4; }

  return { score: Math.max(0, Math.round(score)), flags, bonuses };
}

const getRankStyle = (rank) => {
  if (rank === 0) return { label: '1ST CHOICE', color: '#22c55e', bg: '#14532d22' };
  if (rank === 1) return { label: '2ND CHOICE', color: '#84cc16', bg: '#36531422' };
  if (rank === 2) return { label: '3RD CHOICE', color: '#eab308', bg: '#71350f22' };
  return { label: `${rank + 1}TH CHOICE`, color: '#64748b', bg: '#0f172a' };
};

const SIDE_EFFECT_COLORS = ['', '#22c55e', '#eab308', '#f97316', '#ef4444'];
const COST_COLORS        = ['', '#22c55e', '#22c55e', '#eab308', '#ef4444'];

// ─── Main component ───────────────────────────────────────────────────────────
const ClinicalRecommendation = ({
  predictions = MOCK_PREDICTIONS,
  resistanceGenes = MOCK_RESISTANCE_GENES,
}) => {
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // ── Normalise predictions: accept both array (from API) and object (legacy) ──
  const predArray = Array.isArray(predictions)
    ? predictions
    : Object.entries(predictions).map(([antibiotic, d]) => ({ antibiotic, ...d, resistant_probability: d.probability ?? d.resistant_probability }));

  // ── Score and rank ────────────────────────────────────────────────────────────
  const ranked = predArray
    .map(p => {
      const drug = p.antibiotic.toLowerCase();
      const meta = ANTIBIOTIC_META[drug];
      const result = scoreAntibiotic(drug, p, meta, resistanceGenes);
      if (!result) return null;
      return { drug, p, meta, ...result };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const displayed = showAll ? ranked : ranked.slice(0, 3);
  const resistantCount   = predArray.filter(p => p.prediction.toLowerCase() === 'resistant').length;
  const susceptibleCount = ranked.length;

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', borderRadius: 16, padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
          CLINICAL RECOMMENDATION
        </h2>
        <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11, margin: '4px 0 0' }}>
          AI-RANKED TREATMENT OPTIONS
        </p>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Susceptible',      value: susceptibleCount, color: '#22c55e' },
          { label: 'Resistant',        value: resistantCount,   color: '#ef4444' },
          { label: 'Top Options',      value: Math.min(susceptibleCount, 3), color: '#38bdf8' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 100,
            background: '#0f172a', border: `1px solid ${color}33`,
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{ color, fontFamily: 'monospace', fontSize: 22, fontWeight: 800 }}>{value}</div>
            <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.05em' }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Scoring legend */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10,
        padding: '10px 14px', marginBottom: 20,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em' }}>SCORING FACTORS:</span>
        {['Effectiveness', 'Narrow spectrum', 'Carbapenem-sparing', 'Side effects', 'Cost', 'Plasmid risk', 'Model confidence'].map(f => (
          <span key={f} style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 9 }}>· {f}</span>
        ))}
      </div>

      {/* Ranked list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map(({ drug, p, meta, score, flags, bonuses }, rank) => {
          const rankStyle    = getRankStyle(rank);
          const isExpanded   = expanded === drug;
          const scorePercent = Math.min((score / 80) * 100, 100);

          return (
            <div key={drug} style={{
              background: rank === 0 ? '#0f2318' : '#0f172a',
              border: `1px solid ${rankStyle.color}${rank === 0 ? '55' : '22'}`,
              borderLeft: `3px solid ${rankStyle.color}`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              {/* Main row */}
              <div onClick={() => setExpanded(isExpanded ? null : drug)}
                style={{ padding: '14px 16px', cursor: 'pointer' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    background: rankStyle.bg, border: `1px solid ${rankStyle.color}44`,
                    color: rankStyle.color, fontFamily: 'monospace', fontSize: 9,
                    fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em',
                  }}>{rankStyle.label}</span>

                  <span style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, flex: 1, textTransform: 'capitalize' }}>
                    {drug}
                  </span>

                  <span style={{
                    color: '#64748b', fontFamily: 'monospace', fontSize: 10,
                    background: '#1e293b', padding: '2px 8px', borderRadius: 4,
                  }}>{meta.class}</span>

                  <span style={{ color: rankStyle.color, fontFamily: 'monospace', fontSize: 13, fontWeight: 800 }}>
                    {score}pts
                  </span>

                  <span style={{ color: '#475569', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Score bar */}
                <div style={{ height: 4, background: '#1e293b', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${scorePercent}%`,
                    background: `linear-gradient(90deg, ${rankStyle.color}88, ${rankStyle.color})`,
                    borderRadius: 2,
                  }} />
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9 }}>EFFICACY</span>
                    <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 9, fontWeight: 700 }}>
                      {Math.round((1 - p.resistant_probability) * 100)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9 }}>SIDE EFFECTS</span>
                    <span style={{ color: SIDE_EFFECT_COLORS[meta.sideEffects.severity], fontFamily: 'monospace', fontSize: 9, fontWeight: 700 }}>
                      {meta.sideEffects.label.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9 }}>COST</span>
                    <span style={{ color: COST_COLORS[meta.cost.tier], fontFamily: 'monospace', fontSize: 9, fontWeight: 700 }}>
                      {meta.cost.label.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9 }}>SPECTRUM</span>
                    <span style={{
                      color: meta.spectrum === 'narrow' ? '#22c55e' : meta.spectrum === 'broad' ? '#eab308' : '#ef4444',
                      fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
                    }}>{meta.spectrum.toUpperCase()}</span>
                  </div>
                  {meta.lastResort && (
                    <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 9, fontWeight: 700 }}>⚠ LAST RESORT</span>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e293b' }}>
                  <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <div>
                      <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', marginBottom: 4 }}>ESTIMATED COST</div>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{meta.cost.usd}</span>
                    </div>

                    <div>
                      <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', marginBottom: 4 }}>SIDE EFFECTS</div>
                      <span style={{ color: '#94a3b8', fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>{meta.sideEffects.notes}</span>
                    </div>

                    {bonuses.length > 0 && (
                      <div>
                        <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', marginBottom: 6 }}>ADVANTAGES</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {bonuses.map(b => (
                            <span key={b} style={{
                              background: '#14532d22', border: '1px solid #22c55e44',
                              color: '#4ade80', fontFamily: 'monospace', fontSize: 10,
                              padding: '2px 8px', borderRadius: 4,
                            }}>✓ {b}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {flags.length > 0 && (
                      <div>
                        <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', marginBottom: 6 }}>CONSIDERATIONS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {flags.map((flag, i) => (
                            <div key={i} style={{
                              display: 'flex', gap: 8, alignItems: 'flex-start',
                              background: flag.type === 'spread' ? '#7c1d1d22' : flag.type === 'warning' ? '#78350f22' : '#1e293b',
                              border: `1px solid ${flag.type === 'spread' ? '#ef444433' : flag.type === 'warning' ? '#f9731633' : '#33415566'}`,
                              borderRadius: 6, padding: '6px 10px',
                            }}>
                              <span>{flag.type === 'spread' ? '🧬' : flag.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                              <span style={{ color: '#cbd5e1', fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>{flag.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em' }}>MODEL CONFIDENCE</span>
                      <div style={{ flex: 1, height: 3, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.confidence * 100}%`, background: '#38bdf8', borderRadius: 2 }} />
                      </div>
                      <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: 10, fontWeight: 700 }}>
                        {Math.round(p.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {ranked.length > 3 && (
        <button onClick={() => setShowAll(s => !s)} style={{
          marginTop: 12, width: '100%',
          background: '#1e293b', border: '1px solid #334155',
          color: '#64748b', fontFamily: 'monospace', fontSize: 11,
          padding: '10px', borderRadius: 8, cursor: 'pointer',
        }}>
          {showAll ? '▲ Show top 3 only' : `▼ Show all ${ranked.length} options`}
        </button>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
      }}>
        <p style={{ color: '#475569', fontFamily: 'system-ui, sans-serif', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
          ⚕️ <strong style={{ color: '#64748b' }}>Clinical disclaimer:</strong> These recommendations are AI-generated predictions based on genomic data. Final antibiotic selection should always be confirmed by a qualified clinician using culture sensitivity results, patient history, and local resistance patterns.
        </p>
      </div>
    </div>
  );
};

export default ClinicalRecommendation;
