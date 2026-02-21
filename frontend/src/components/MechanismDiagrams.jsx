import { useState } from 'react';

// ─── Mechanism animations ─────────────────────────────────────────────────────

// 1. Beta-lactamase: enzyme cuts the antibiotic ring
const BetaLactamaseAnim = () => (
  <svg viewBox="0 0 280 160" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes enzyme-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes drug-approach { 0%{transform:translateX(-60px);opacity:0} 30%{opacity:1} 60%{transform:translateX(0px);opacity:1} 80%{transform:translateX(0px);opacity:0} 100%{transform:translateX(0px);opacity:0} }
        @keyframes fragment-fly-a { 0%,60%{transform:translate(0,0);opacity:0} 65%{opacity:1} 100%{transform:translate(-30px,-25px);opacity:0} }
        @keyframes fragment-fly-b { 0%,60%{transform:translate(0,0);opacity:0} 65%{opacity:1} 100%{transform:translate(25px,20px);opacity:0} }
        @keyframes scissors-snap { 0%,55%{transform:rotate(0deg)} 65%{transform:rotate(-20deg)} 75%{transform:rotate(0deg)} 100%{transform:rotate(0deg)} }
        @keyframes scissors-snap2 { 0%,55%{transform:rotate(0deg)} 65%{transform:rotate(20deg)} 75%{transform:rotate(0deg)} 100%{transform:rotate(0deg)} }
      `}</style>
    </defs>

    {/* Enzyme body */}
    <g style={{ animation: 'enzyme-bob 2s ease-in-out infinite', transformOrigin: '180px 80px' }}>
      <ellipse cx="180" cy="80" rx="48" ry="35" fill="#0d9488" opacity="0.15" />
      <ellipse cx="180" cy="80" rx="40" ry="28" fill="#0d9488" opacity="0.25" />
      <text x="180" y="75" textAnchor="middle" fill="#0f766e" fontSize="10" fontWeight="600" fontFamily="monospace">β-lactamase</text>
      <text x="180" y="89" textAnchor="middle" fill="#0f766e" fontSize="9" fontFamily="monospace">enzyme</text>
      {/* Active site cleft */}
      <path d="M158 88 Q180 100 202 88" fill="none" stroke="#0d9488" strokeWidth="2" />
    </g>

    {/* Antibiotic drug approaching */}
    <g style={{ animation: 'drug-approach 3s ease-in-out infinite', transformOrigin: '110px 80px' }}>
      {/* Beta-lactam ring */}
      <rect x="96" y="68" width="20" height="18" rx="3" fill="none" stroke="#ef4444" strokeWidth="2" />
      <line x1="116" y1="72" x2="124" y2="68" stroke="#ef4444" strokeWidth="2" />
      <line x1="116" y1="80" x2="128" y2="80" stroke="#ef4444" strokeWidth="2" />
      <line x1="116" y1="84" x2="124" y2="88" stroke="#ef4444" strokeWidth="2" />
      <text x="106" y="98" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">ampicillin</text>
    </g>

    {/* Scissors (enzyme action) */}
    <g style={{ transformOrigin: '148px 78px' }}>
      <line x1="138" y1="70" x2="158" y2="86" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'scissors-snap 3s ease-in-out infinite', transformOrigin: '148px 78px' }} />
      <line x1="138" y1="86" x2="158" y2="70" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'scissors-snap2 3s ease-in-out infinite', transformOrigin: '148px 78px' }} />
    </g>

    {/* Broken fragments */}
    <g style={{ animation: 'fragment-fly-a 3s ease-in-out infinite', transformOrigin: '120px 75px' }}>
      <rect x="112" y="68" width="12" height="10" rx="2" fill="none" stroke="#ef444488" strokeWidth="1.5" />
    </g>
    <g style={{ animation: 'fragment-fly-b 3s ease-in-out infinite', transformOrigin: '120px 85px' }}>
      <rect x="112" y="78" width="14" height="8" rx="2" fill="none" stroke="#ef444488" strokeWidth="1.5" />
    </g>

    {/* Labels */}
    <text x="20" y="140" fill="#9ca3af" fontSize="9" fontFamily="monospace">① Antibiotic enters cell</text>
    <text x="20" y="152" fill="#9ca3af" fontSize="9" fontFamily="monospace">② Enzyme hydrolyzes β-lactam ring → drug inactivated</text>
  </svg>
);

// 2. Efflux pump: pump throws drug out of cell
const EffluxPumpAnim = () => (
  <svg viewBox="0 0 280 160" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes drug-in { 0%{transform:translateY(-30px);opacity:0} 20%{opacity:1;transform:translateY(0)} 50%{transform:translateY(0);opacity:1} 70%{transform:translateY(0);opacity:0} 100%{transform:translateY(0);opacity:0} }
        @keyframes drug-out { 0%,50%{transform:translateY(0);opacity:0} 60%{opacity:1} 90%{transform:translateY(-50px);opacity:0} 100%{opacity:0} }
        @keyframes pump-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes membrane-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </defs>

    {/* Cell membrane */}
    <rect x="30" y="50" width="220" height="70" rx="8" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4,3"
      style={{ animation: 'membrane-pulse 2s ease-in-out infinite' }} />
    <text x="140" y="44" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">EXTRACELLULAR</text>
    <text x="140" y="135" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">INTRACELLULAR</text>

    {/* Pump protein in membrane */}
    <rect x="118" y="42" width="44" height="86" rx="6" fill="#0d9488" opacity="0.15" />
    <rect x="122" y="46" width="36" height="78" rx="4" fill="#0d9488" opacity="0.2" />
    {/* Pump rotor */}
    <g style={{ animation: 'pump-spin 2s linear infinite', transformOrigin: '140px 85px' }}>
      <circle cx="140" cy="85" r="14" fill="none" stroke="#0d9488" strokeWidth="2" />
      <line x1="140" y1="71" x2="140" y2="99" stroke="#0d9488" strokeWidth="2" />
      <line x1="126" y1="85" x2="154" y2="85" stroke="#0d9488" strokeWidth="2" />
      <line x1="130" y1="75" x2="150" y2="95" stroke="#0d9488" strokeWidth="1.5" opacity="0.6" />
      <line x1="150" y1="75" x2="130" y2="95" stroke="#0d9488" strokeWidth="1.5" opacity="0.6" />
    </g>
    <text x="140" y="110" textAnchor="middle" fill="#0f766e" fontSize="8" fontFamily="monospace">PUMP</text>

    {/* Drug entering (from outside) */}
    <g style={{ animation: 'drug-in 3s ease-in-out infinite', transformOrigin: '90px 85px' }}>
      <circle cx="90" cy="85" r="7" fill="#ef4444" opacity="0.8" />
      <text x="90" y="89" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">AB</text>
    </g>

    {/* Drug being expelled (going up/out) */}
    <g style={{ animation: 'drug-out 3s ease-in-out infinite', transformOrigin: '140px 55px' }}>
      <circle cx="140" cy="55" r="7" fill="#ef4444" opacity="0.8" />
      <text x="140" y="59" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">AB</text>
    </g>

    {/* Arrow up */}
    <path d="M140 48 L136 56 L144 56 Z" fill="#ef4444" opacity="0.4" />

    <text x="20" y="152" fill="#9ca3af" fontSize="9" fontFamily="monospace">Pump actively expels antibiotic before it can act</text>
  </svg>
);

// 3. Target site mutation: drug can't bind
const TargetMutationAnim = () => (
  <svg viewBox="0 0 280 160" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes drug-try { 0%{transform:translateX(50px);opacity:0} 20%{opacity:1;transform:translateX(0)} 50%{transform:translateX(0)} 60%{transform:translateX(10px)} 70%{transform:translateX(0)} 80%{transform:translateX(10px)} 90%{transform:translateX(40px);opacity:0} 100%{opacity:0} }
        @keyframes target-glow { 0%,100%{filter:drop-shadow(0 0 3px #6b7280)} 50%{filter:drop-shadow(0 0 8px #eab308)} }
        @keyframes no-sign { 0%,40%{opacity:0} 50%,80%{opacity:1} 100%{opacity:0} }
      `}</style>
    </defs>

    {/* DNA Gyrase / target protein */}
    <g style={{ animation: 'target-glow 3s ease-in-out infinite' }}>
      <ellipse cx="140" cy="80" rx="45" ry="32" fill="#6b7280" opacity="0.1" />
      <ellipse cx="140" cy="80" rx="36" ry="24" fill="#6b7280" opacity="0.15" />
      {/* Mutated binding site - wrong shape */}
      <path d="M125 80 Q132 70 140 78 Q148 86 155 80" fill="none" stroke="#eab308" strokeWidth="2.5" />
      <circle cx="140" cy="79" r="3" fill="#eab308" opacity="0.8" />
      <text x="140" y="68" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="monospace">DNA Gyrase</text>
      <text x="140" y="100" textAnchor="middle" fill="#eab308" fontSize="8" fontFamily="monospace">S83L mutation</text>
    </g>

    {/* Normal binding site label */}
    <text x="50" y="55" fill="#9ca3af" fontSize="8" fontFamily="monospace">Normal site:</text>
    <path d="M50 62 Q60 56 70 62" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="2,2" />

    {/* Mutated site label */}
    <text x="50" y="100" fill="#eab308" fontSize="8" fontFamily="monospace">Mutated site:</text>
    <path d="M50 107 Q60 113 70 107" fill="none" stroke="#eab308" strokeWidth="1.5" />

    {/* Drug trying to bind */}
    <g style={{ animation: 'drug-try 3s ease-in-out infinite', transformOrigin: '200px 80px' }}>
      <rect x="188" y="70" width="24" height="20" rx="4" fill="none" stroke="#ef4444" strokeWidth="2" />
      {/* Drug "key" shape */}
      <circle cx="196" cy="80" r="4" fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <line x1="200" y1="80" x2="208" y2="80" stroke="#ef4444" strokeWidth="1.5" />
      <line x1="205" y1="80" x2="205" y2="84" stroke="#ef4444" strokeWidth="1.5" />
      <text x="200" y="100" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">cipro</text>
    </g>

    {/* No / blocked sign */}
    <g style={{ animation: 'no-sign 3s ease-in-out infinite' }}>
      <circle cx="165" cy="75" r="10" fill="none" stroke="#ef4444" strokeWidth="2" />
      <line x1="158" y1="68" x2="172" y2="82" stroke="#ef4444" strokeWidth="2" />
    </g>

    <text x="20" y="140" fill="#9ca3af" fontSize="9" fontFamily="monospace">① Mutation changes binding site shape</text>
    <text x="20" y="152" fill="#9ca3af" fontSize="9" fontFamily="monospace">② Antibiotic can no longer bind → no inhibition</text>
  </svg>
);

// 4. Ribosomal methylation: drug blocked from ribosome
const RibosomalMethylAnim = () => (
  <svg viewBox="0 0 280 160" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes methyl-add { 0%{transform:scale(0);opacity:0} 30%{transform:scale(1.2);opacity:1} 50%{transform:scale(1);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes drug-blocked { 0%,40%{transform:translateX(60px);opacity:0} 60%{transform:translateX(10px);opacity:1} 75%{transform:translateX(15px)} 90%{transform:translateX(10px)} 100%{transform:translateX(60px);opacity:0} }
        @keyframes ribosome-glow { 0%,100%{fill-opacity:0.2} 50%{fill-opacity:0.35} }
        @keyframes methyl-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      `}</style>
    </defs>

    {/* Ribosome */}
    <ellipse cx="110" cy="80" rx="55" ry="40" fill="#0d9488" style={{ animation: 'ribosome-glow 2s ease-in-out infinite' }} opacity="0.2" />
    <ellipse cx="95" cy="68" rx="30" ry="22" fill="#0d9488" opacity="0.15" />
    <ellipse cx="125" cy="92" rx="35" ry="24" fill="#0d9488" opacity="0.15" />
    <text x="110" y="78" textAnchor="middle" fill="#0f766e" fontSize="10" fontWeight="600" fontFamily="monospace">Ribosome</text>
    <text x="110" y="90" textAnchor="middle" fill="#0f766e" fontSize="8" fontFamily="monospace">23S rRNA</text>

    {/* Methyl groups added to rRNA */}
    {[
      { cx: 85, cy: 65 }, { cx: 105, cy: 60 }, { cx: 125, cy: 70 }, { cx: 135, cy: 85 },
    ].map((pos, i) => (
      <g key={i} style={{ animation: `methyl-add 3s ease-in-out ${i * 0.2}s infinite`, transformOrigin: `${pos.cx}px ${pos.cy}px` }}>
        <circle cx={pos.cx} cy={pos.cy} r="5" fill="#eab308" opacity="0.8" />
        <text x={pos.cx} y={pos.cy + 3} textAnchor="middle" fill="white" fontSize="6" fontWeight="700">CH₃</text>
      </g>
    ))}

    {/* Methyltransferase enzyme label */}
    <text x="80" y="125" textAnchor="middle" fill="#eab308" fontSize="8" fontFamily="monospace">ErmC methyltransferase</text>
    <text x="80" y="135" textAnchor="middle" fill="#eab308" fontSize="8" fontFamily="monospace">adds methyl groups</text>

    {/* Drug being blocked */}
    <g style={{ animation: 'drug-blocked 3s ease-in-out infinite', transformOrigin: '210px 75px' }}>
      <rect x="196" y="63" width="28" height="22" rx="4" fill="none" stroke="#ef4444" strokeWidth="2" />
      <text x="210" y="76" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">ERY</text>
      <text x="210" y="95" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">macrolide</text>
      {/* Bounce/blocked arrows */}
      <text x="175" y="77" textAnchor="middle" fill="#ef4444" fontSize="16">↔</text>
    </g>

    <text x="20" y="152" fill="#9ca3af" fontSize="9" fontFamily="monospace">Methylation blocks antibiotic binding to ribosome</text>
  </svg>
);

// ─── Mechanism type → animation mapping ──────────────────────────────────────
const getMechanismAnim = (mechanism = '', geneId = '') => {
  const m = (mechanism + geneId).toLowerCase();
  if (m.includes('lactam') || m.includes('lactamase') || m.includes('tem') || m.includes('ctx') || m.includes('ndm') || m.includes('kpc'))
    return { anim: <BetaLactamaseAnim />, type: 'Enzymatic Hydrolysis', color: '#ef4444' };
  if (m.includes('efflux') || m.includes('pump') || m.includes('tet') || m.includes('mex') || m.includes('acrb'))
    return { anim: <EffluxPumpAnim />, type: 'Efflux Pump', color: '#f97316' };
  if (m.includes('methyl') || m.includes('erm') || m.includes('ribosom'))
    return { anim: <RibosomalMethylAnim />, type: 'Ribosomal Methylation', color: '#a855f7' };
  if (m.includes('mutation') || m.includes('gyrase') || m.includes('pbp') || m.includes('gyr') || m.includes('par') || m.includes('target'))
    return { anim: <TargetMutationAnim />, type: 'Target Site Mutation', color: '#eab308' };
  if (m.includes('dihydro') || m.includes('dfr') || m.includes('sul') || m.includes('folate'))
    return { anim: <BetaLactamaseAnim />, type: 'Enzyme Bypass', color: '#06b6d4' };
  // default
  return { anim: <TargetMutationAnim />, type: 'Resistance Mechanism', color: '#6b7280' };
};

// ─── Main component ───────────────────────────────────────────────────────────
const MechanismDiagrams = ({ resistanceGenes = [] }) => {
  const [selected, setSelected] = useState(0);

  if (!resistanceGenes || resistanceGenes.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: 14 }}>No resistance genes detected.</p>;
  }

  const gene = resistanceGenes[selected];
  const { anim, type, color } = getMechanismAnim(gene.mechanism, gene.gene_id);

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Gene selector tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {resistanceGenes.map((g, i) => {
          const { color: c } = getMechanismAnim(g.mechanism, g.gene_id);
          return (
            <button key={g.gene_id} onClick={() => setSelected(i)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: `1px solid ${i === selected ? c : '#e5e7eb'}`,
                background: i === selected ? `${c}15` : 'white',
                color: i === selected ? c : '#6b7280',
                fontSize: 13, fontWeight: i === selected ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'monospace',
              }}>
              {g.gene_id}
            </button>
          );
        })}
      </div>

      {/* Main card */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Card header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color, background: `${color}15`,
            padding: '3px 10px', borderRadius: 4, fontFamily: 'monospace',
          }}>{gene.gene_id}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{gene.mechanism}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{type}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 4,
              background: gene.location === 'plasmid' ? '#fff7ed' : '#f0fdfa',
              color: gene.location === 'plasmid' ? '#c2410c' : '#0f766e',
              border: `1px solid ${gene.location === 'plasmid' ? '#fed7aa' : '#99f6e4'}`,
            }}>
              {gene.location === 'plasmid' ? '⚠ Plasmid' : 'Chromosomal'}
            </span>
          </div>
        </div>

        {/* Animation */}
        <div style={{ padding: '24px', background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
          {anim}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'monospace' }}>DESCRIPTION</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{gene.description}</p>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'monospace' }}>AFFECTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(gene.drugs_defeated || []).map(d => (
                <span key={d} style={{
                  fontSize: 12, color: '#dc2626', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 4,
                  padding: '2px 8px', display: 'inline-block', textTransform: 'capitalize',
                }}>{d}</span>
              ))}
            </div>
            {gene.spreadable && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 4 }}>
                ⚠ Horizontally transferable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanismDiagrams;
