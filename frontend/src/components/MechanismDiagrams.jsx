import { useState } from 'react';

// ─── Gene → mechanism type mapping ───────────────────────────────────────────
const classifyGene = (geneId = '', mechanism = '') => {
  const g = geneId.toLowerCase();
  const m = mechanism.toLowerCase();

  // Efflux pumps
  if (['teta', 'tetb', 'tetc', 'mera', 'merb', 'acrab', 'mexab', 'emrb', 'emeab'].some(x => g.startsWith(x)) ||
      m.includes('efflux') || m.includes('pump'))
    return 'efflux';

  // Beta-lactamases
  if (['tem', 'shv', 'ctx', 'ndm', 'kpc', 'vim', 'imp', 'oxa', 'bla', 'cmy', 'acc'].some(x => g.startsWith(x)) ||
      m.includes('lactamase') || m.includes('lactam') || m.includes('hydrolysis'))
    return 'lactamase';

  // Target mutations
  if (['gyra', 'gyrb', 'parc', 'pare', 'rpob', 'rpoa', 'pbp', 'meca', 'vana', 'vanb'].some(x => g.startsWith(x)) ||
      m.includes('mutation') || m.includes('target') || m.includes('gyrase') || m.includes('pbp'))
    return 'mutation';

  // Methylation / ribosomal
  if (['erm', 'cfr', 'rlmn', 'tlrc'].some(x => g.startsWith(x)) ||
      m.includes('methyl') || m.includes('ribosom') || m.includes('rrna'))
    return 'methylation';

  // Enzyme bypass / alternative pathway
  if (['dfra', 'dfrb', 'sul1', 'sul2', 'sul3', 'dhfr', 'dhps'].some(x => g.startsWith(x)) ||
      m.includes('dihydro') || m.includes('bypass') || m.includes('folate') || m.includes('synthase'))
    return 'bypass';

  // Aminoglycoside modifying enzymes
  if (['aac', 'aph', 'ant', 'aad'].some(x => g.startsWith(x)) ||
      m.includes('acetyl') || m.includes('phospho') || m.includes('adenyl') || m.includes('aminoglycoside'))
    return 'amc';

  return 'mutation'; // default
};

const MECHANISM_META = {
  efflux:      { label: 'Efflux Pump',          color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '⇈' },
  lactamase:   { label: 'Enzymatic Hydrolysis', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '✂' },
  mutation:    { label: 'Target Mutation',       color: '#eab308', bg: '#fefce8', border: '#fef08a', icon: '⚡' },
  methylation: { label: 'Ribosomal Methylation', color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', icon: '◈' },
  bypass:      { label: 'Enzyme Bypass',         color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: '⤳' },
  amc:         { label: 'Drug Modification',     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '⚗' },
};

// ─── SVG Animations ───────────────────────────────────────────────────────────

const EffluxPumpAnim = ({ color }) => (
  <svg viewBox="0 0 340 180" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes ep-drug-rise {
          0%   { transform: translateY(60px); opacity: 0; }
          15%  { opacity: 1; }
          70%  { transform: translateY(-50px); opacity: 0.8; }
          85%  { transform: translateY(-70px); opacity: 0; }
          100% { transform: translateY(-70px); opacity: 0; }
        }
        @keyframes ep-drug-enter {
          0%   { transform: translateX(-50px); opacity: 0; }
          20%  { opacity: 1; transform: translateX(0); }
          60%  { transform: translateX(0); opacity: 1; }
          80%  { transform: translateX(0); opacity: 0; }
          100% { transform: translateX(0); opacity: 0; }
        }
        @keyframes ep-rotor {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ep-membrane-glow {
          0%,100% { opacity: 0.5; }
          50%     { opacity: 0.9; }
        }
      `}</style>
    </defs>

    {/* Outside label */}
    <text x="170" y="22" textAnchor="middle" fill="#9ca3af" fontSize="10" letterSpacing="3" fontFamily="monospace">EXTRACELLULAR</text>

    {/* Cell membrane — two parallel lines */}
    <rect x="30" y="55" width="280" height="22" rx="0" fill={color} opacity="0.08"
      style={{ animation: 'ep-membrane-glow 2s ease-in-out infinite' }} />
    <line x1="30" y1="55" x2="310" y2="55" stroke={color} strokeWidth="2.5" opacity="0.4" />
    <line x1="30" y1="77" x2="310" y2="77" stroke={color} strokeWidth="2.5" opacity="0.4" />

    {/* Inside label */}
    <text x="170" y="160" textAnchor="middle" fill="#9ca3af" fontSize="10" letterSpacing="3" fontFamily="monospace">INTRACELLULAR</text>

    {/* Pump channel through membrane */}
    <rect x="148" y="44" width="44" height="44" rx="6" fill={color} opacity="0.18" />
    <rect x="152" y="48" width="36" height="36" rx="4" fill={color} opacity="0.12" />

    {/* Spinning rotor */}
    <g style={{ animation: 'ep-rotor 1.4s linear infinite', transformOrigin: '170px 66px' }}>
      <circle cx="170" cy="66" r="13" fill="none" stroke={color} strokeWidth="2.2" />
      {[0,60,120,180,240,300].map(deg => {
        const r = deg * Math.PI / 180;
        return <line key={deg}
          x1={170} y1={66}
          x2={170 + 13*Math.cos(r)} y2={66 + 13*Math.sin(r)}
          stroke={color} strokeWidth="1.8" />;
      })}
      <circle cx="170" cy="66" r="3.5" fill={color} />
    </g>

    {/* Drug entering from the left (inside cell) */}
    <g style={{ animation: 'ep-drug-enter 2.8s ease-in-out infinite', transformOrigin: '100px 118px' }}>
      <circle cx="100" cy="118" r="10" fill={color} opacity="0.9" />
      <text x="100" y="122" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">AB</text>
    </g>

    {/* Drug being expelled upward */}
    <g style={{ animation: 'ep-drug-rise 2.8s ease-in-out infinite', transformOrigin: '170px 30px' }}>
      <circle cx="170" cy="30" r="10" fill={color} opacity="0.9" />
      <text x="170" y="34" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">AB</text>
    </g>

    {/* Upward arrow indicator */}
    <path d="M170 12 L165 22 L175 22 Z" fill={color} opacity="0.6" />

    {/* ATP label */}
    <text x="220" y="70" fill={color} fontSize="9" fontFamily="monospace" opacity="0.7">ATP →</text>
    <text x="220" y="82" fill="#9ca3af" fontSize="8" fontFamily="monospace">energy</text>
  </svg>
);

const BetaLactamaseAnim = ({ color }) => (
  <svg viewBox="0 0 340 180" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes bl-drug-in {
          0%   { transform: translateX(-80px); opacity: 0; }
          25%  { opacity: 1; transform: translateX(0); }
          55%  { transform: translateX(0); opacity: 1; }
          70%  { transform: translateX(0); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes bl-enzyme-bob {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-7px); }
        }
        @keyframes bl-snap-top {
          0%,50% { transform: rotate(0deg); }
          65%    { transform: rotate(-28deg); }
          80%    { transform: rotate(0deg); }
          100%   { transform: rotate(0deg); }
        }
        @keyframes bl-snap-bot {
          0%,50% { transform: rotate(0deg); }
          65%    { transform: rotate(28deg); }
          80%    { transform: rotate(0deg); }
          100%   { transform: rotate(0deg); }
        }
        @keyframes bl-frag-a {
          0%,60% { transform: translate(0,0); opacity: 0; }
          65%    { opacity: 1; }
          100%   { transform: translate(-38px,-32px); opacity: 0; }
        }
        @keyframes bl-frag-b {
          0%,60% { transform: translate(0,0); opacity: 0; }
          65%    { opacity: 1; }
          100%   { transform: translate(32px, 28px); opacity: 0; }
        }
        @keyframes bl-glow {
          0%,100% { filter: drop-shadow(0 0 4px ${color}44); }
          50%     { filter: drop-shadow(0 0 12px ${color}99); }
        }
      `}</style>
    </defs>

    {/* Enzyme body */}
    <g style={{ animation: 'bl-enzyme-bob 2.2s ease-in-out infinite', transformOrigin: '210px 90px' }}>
      <ellipse cx="210" cy="90" rx="60" ry="42" fill={color} opacity="0.1" />
      <ellipse cx="210" cy="90" rx="50" ry="34" fill={color} opacity="0.15"
        style={{ animation: 'bl-glow 2.2s ease-in-out infinite' }} />
      {/* Active site cleft */}
      <path d="M183 96 Q210 112 237 96" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <text x="210" y="84" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="monospace">β-lactamase</text>
      <text x="210" y="97" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace" opacity="0.7">active site ↓</text>
    </g>

    {/* Approaching drug */}
    <g style={{ animation: 'bl-drug-in 3s ease-in-out infinite', transformOrigin: '115px 90px' }}>
      {/* β-lactam ring structure */}
      <rect x="100" y="76" width="26" height="24" rx="4" fill="none" stroke={color} strokeWidth="2.2" />
      <line x1="126" y1="80" x2="138" y2="74" stroke={color} strokeWidth="2" />
      <line x1="126" y1="88" x2="142" y2="88" stroke={color} strokeWidth="2" />
      <line x1="126" y1="96" x2="138" y2="102" stroke={color} strokeWidth="2" />
      <text x="113" y="114" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">β-lactam ring</text>
    </g>

    {/* Scissors */}
    <g>
      <line x1="150" y1="78" x2="174" y2="102" stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ animation: 'bl-snap-top 3s ease-in-out infinite', transformOrigin: '162px 90px' }} />
      <line x1="150" y1="102" x2="174" y2="78" stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ animation: 'bl-snap-bot 3s ease-in-out infinite', transformOrigin: '162px 90px' }} />
    </g>

    {/* Broken fragments flying */}
    <g style={{ animation: 'bl-frag-a 3s ease-in-out infinite', transformOrigin: '120px 80px' }}>
      <rect x="108" y="72" width="16" height="12" rx="2" fill="none" stroke={color} strokeWidth="1.8" opacity="0.7" />
    </g>
    <g style={{ animation: 'bl-frag-b 3s ease-in-out infinite', transformOrigin: '120px 100px' }}>
      <rect x="108" y="90" width="18" height="10" rx="2" fill="none" stroke={color} strokeWidth="1.8" opacity="0.7" />
    </g>

    {/* Step labels */}
    <text x="30" y="148" fill="#9ca3af" fontSize="9" fontFamily="monospace">① Drug binds enzyme active site</text>
    <text x="30" y="162" fill="#9ca3af" fontSize="9" fontFamily="monospace">② β-lactam ring hydrolyzed → drug inactivated</text>
  </svg>
);

const TargetMutationAnim = ({ color }) => (
  <svg viewBox="0 0 340 180" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes tm-drug-try {
          0%   { transform: translateX(70px); opacity: 0; }
          20%  { opacity: 1; transform: translateX(0); }
          45%  { transform: translateX(0); }
          55%  { transform: translateX(12px); }
          65%  { transform: translateX(0); }
          75%  { transform: translateX(12px); }
          85%  { transform: translateX(50px); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes tm-no-sign {
          0%,35% { opacity: 0; transform: scale(0.5); }
          50%    { opacity: 1; transform: scale(1); }
          80%    { opacity: 1; }
          95%    { opacity: 0; }
          100%   { opacity: 0; }
        }
        @keyframes tm-target-pulse {
          0%,100% { filter: drop-shadow(0 0 4px ${color}55); }
          50%     { filter: drop-shadow(0 0 14px ${color}cc); }
        }
        @keyframes tm-mutation-badge {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.1); }
        }
      `}</style>
    </defs>

    {/* Target protein */}
    <g style={{ animation: 'tm-target-pulse 2s ease-in-out infinite', transformOrigin: '150px 90px' }}>
      <ellipse cx="150" cy="90" rx="62" ry="46" fill={color} opacity="0.08" />
      <ellipse cx="150" cy="90" rx="50" ry="36" fill={color} opacity="0.13" />
      <text x="150" y="82" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="monospace">DNA Gyrase</text>

      {/* Normal binding site shown as dashed */}
      <path d="M128 96 Q150 84 172 96" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,2" />
      <text x="150" y="108" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="monospace">normal site</text>

      {/* Mutated site shown as solid wrong shape */}
      <path d="M130 100 Q138 115 150 105 Q162 115 170 100" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Mutation badge */}
    <g style={{ animation: 'tm-mutation-badge 2s ease-in-out infinite', transformOrigin: '195px 58px' }}>
      <rect x="175" y="46" width="62" height="24" rx="6" fill={color} opacity="0.15" />
      <rect x="177" y="48" width="58" height="20" rx="5" fill={color} opacity="0.1" />
      <text x="206" y="60" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">S83L mutation</text>
    </g>

    {/* Drug trying to bind — approaches then bounces */}
    <g style={{ animation: 'tm-drug-try 3s ease-in-out infinite', transformOrigin: '248px 90px' }}>
      <rect x="234" y="76" width="28" height="28" rx="5" fill="none" stroke={color} strokeWidth="2.2" />
      <circle cx="248" cy="90" r="6" fill="none" stroke={color} strokeWidth="2" />
      <line x1="254" y1="90" x2="262" y2="90" stroke={color} strokeWidth="2" />
      <line x1="258" y1="90" x2="258" y2="96" stroke={color} strokeWidth="2" />
      <text x="248" y="116" textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">ciprofloxacin</text>
    </g>

    {/* No / blocked symbol */}
    <g style={{ animation: 'tm-no-sign 3s ease-in-out infinite', transformOrigin: '210px 90px' }}>
      <circle cx="210" cy="90" r="13" fill="white" stroke={color} strokeWidth="2.5" />
      <line x1="200" y1="80" x2="220" y2="100" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </g>

    <text x="30" y="148" fill="#9ca3af" fontSize="9" fontFamily="monospace">① Point mutation alters binding site geometry</text>
    <text x="30" y="162" fill="#9ca3af" fontSize="9" fontFamily="monospace">② Antibiotic cannot bind → enzyme continues functioning</text>
  </svg>
);

const RibosomalMethylAnim = ({ color }) => (
  <svg viewBox="0 0 340 180" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes rm-methyl {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          40%  { transform: scale(1.15) rotate(0deg); opacity: 1; }
          60%  { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes rm-drug-blocked {
          0%,30% { transform: translateX(80px); opacity: 0; }
          50%    { opacity: 1; transform: translateX(8px); }
          65%    { transform: translateX(14px); }
          78%    { transform: translateX(8px); }
          92%    { transform: translateX(70px); opacity: 0; }
          100%   { opacity: 0; }
        }
        @keyframes rm-ribosome-pulse {
          0%,100% { opacity: 0.18; }
          50%     { opacity: 0.3; }
        }
        @keyframes rm-enzyme-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-5px); }
        }
      `}</style>
    </defs>

    {/* Ribosome large subunit */}
    <ellipse cx="140" cy="100" rx="70" ry="50" fill={color}
      style={{ animation: 'rm-ribosome-pulse 2s ease-in-out infinite' }} />
    <ellipse cx="125" cy="78" rx="42" ry="30" fill={color} opacity="0.15" />
    <text x="130" y="95" textAnchor="middle" fill={color} fontSize="10" fontWeight="700" fontFamily="monospace">Ribosome</text>
    <text x="130" y="108" textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">23S rRNA</text>

    {/* Methyl groups appearing on rRNA */}
    {[
      { cx: 102, cy: 82, delay: '0s' },
      { cx: 122, cy: 72, delay: '0.3s' },
      { cx: 145, cy: 76, delay: '0.6s' },
      { cx: 162, cy: 88, delay: '0.9s' },
      { cx: 155, cy: 105, delay: '1.1s' },
    ].map((p, i) => (
      <g key={i} style={{ animation: `rm-methyl 3s ease-in-out ${p.delay} infinite`, transformOrigin: `${p.cx}px ${p.cy}px` }}>
        <circle cx={p.cx} cy={p.cy} r="8" fill={color} opacity="0.85" />
        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="700">CH₃</text>
      </g>
    ))}

    {/* ErmC enzyme floating above */}
    <g style={{ animation: 'rm-enzyme-float 2s ease-in-out infinite', transformOrigin: '90px 38px' }}>
      <rect x="58" y="26" width="64" height="24" rx="8" fill={color} opacity="0.2" />
      <text x="90" y="41" textAnchor="middle" fill={color} fontSize="9" fontWeight="600" fontFamily="monospace">ErmC enzyme</text>
      {/* Arrow down to ribosome */}
      <line x1="90" y1="50" x2="112" y2="66" stroke={color} strokeWidth="1.5" strokeDasharray="2,2" opacity="0.5" />
    </g>

    {/* Drug trying to bind but blocked */}
    <g style={{ animation: 'rm-drug-blocked 3s ease-in-out infinite', transformOrigin: '248px 92px' }}>
      <rect x="234" y="78" width="28" height="28" rx="5" fill="none" stroke={color} strokeWidth="2.2" />
      <text x="248" y="95" textAnchor="middle" fill={color} fontSize="8" fontWeight="700" fontFamily="monospace">ERY</text>
      <text x="248" y="118" textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">macrolide</text>
      {/* Bounce arrows */}
      <text x="220" y="96" fill={color} fontSize="14" opacity="0.7">↔</text>
    </g>

    <text x="30" y="160" fill="#9ca3af" fontSize="9" fontFamily="monospace">Methylation of 23S rRNA blocks antibiotic docking</text>
  </svg>
);

const BypassAnim = ({ color }) => (
  <svg viewBox="0 0 340 180" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes bp-drug-block {
          0%   { transform: translateX(-60px); opacity: 0; }
          20%  { opacity: 1; transform: translateX(0); }
          60%  { transform: translateX(0); opacity: 1; }
          80%  { transform: translateX(0); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes bp-alt-flow {
          0%   { stroke-dashoffset: 100; opacity: 0; }
          20%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes bp-product-appear {
          0%,50% { opacity: 0; transform: scale(0.5); }
          70%    { opacity: 1; transform: scale(1.1); }
          100%   { opacity: 1; transform: scale(1); }
        }
        @keyframes bp-x-pulse {
          0%,40% { opacity: 0; }
          55%    { opacity: 1; }
          80%    { opacity: 1; }
          100%   { opacity: 0; }
        }
      `}</style>
    </defs>

    {/* Normal enzyme (blocked) */}
    <ellipse cx="120" cy="75" rx="40" ry="28" fill="#ef4444" opacity="0.08" />
    <text x="120" y="68" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="monospace">Normal DHFR</text>
    <text x="120" y="80" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">(inhibited)</text>
    {/* X blocked */}
    <g style={{ animation: 'bp-x-pulse 3s ease-in-out infinite' }}>
      <line x1="100" y1="58" x2="140" y2="92" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="140" y1="58" x2="100" y2="92" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Drug blocking normal enzyme */}
    <g style={{ animation: 'bp-drug-block 3s ease-in-out infinite', transformOrigin: '48px 75px' }}>
      <rect x="34" y="63" width="28" height="24" rx="4" fill="none" stroke="#ef4444" strokeWidth="2" />
      <text x="48" y="78" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">TMP</text>
    </g>

    {/* Arrow down to alternative enzyme */}
    <text x="120" y="108" textAnchor="middle" fill="#9ca3af" fontSize="18" opacity="0.5">↓</text>

    {/* Alternative enzyme (bypass) */}
    <ellipse cx="120" cy="140" rx="44" ry="26" fill={color} opacity="0.15" />
    <ellipse cx="120" cy="140" rx="36" ry="20" fill={color} opacity="0.1" />
    <text x="120" y="134" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">dfrA17</text>
    <text x="120" y="146" textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">resistant variant</text>

    {/* Flow arrows showing bypass pathway */}
    <path d="M200 60 Q230 60 250 90 Q270 120 250 140 Q230 160 200 155"
      fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="8,4"
      strokeLinecap="round"
      style={{ animation: 'bp-alt-flow 3s ease-in-out infinite', strokeDashoffset: 100 }} />
    <text x="268" y="110" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">folate</text>
    <text x="268" y="122" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">still</text>
    <text x="268" y="134" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">made ✓</text>

    {/* Product appearing */}
    <g style={{ animation: 'bp-product-appear 3s ease-in-out infinite', transformOrigin: '195px 140px' }}>
      <circle cx="195" cy="140" r="12" fill={color} opacity="0.8" />
      <text x="195" y="144" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">THF</text>
    </g>

    <text x="30" y="172" fill="#9ca3af" fontSize="9" fontFamily="monospace">Resistant enzyme bypasses drug block → folate synthesis continues</text>
  </svg>
);

const DrugModificationAnim = ({ color }) => (
  <svg viewBox="0 0 340 180" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes dm-drug-in {
          0%   { transform: translateX(-60px); opacity: 0; }
          20%  { opacity: 1; transform: translateX(0); }
          55%  { transform: translateX(0); opacity: 1; }
          70%  { transform: translateX(0); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes dm-mod-drug-out {
          0%,55% { transform: translateX(0); opacity: 0; }
          65%    { opacity: 1; }
          90%    { transform: translateX(60px); opacity: 0; }
          100%   { opacity: 0; }
        }
        @keyframes dm-enzyme-rock {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(-8deg); }
          75%     { transform: rotate(8deg); }
        }
        @keyframes dm-acetyl-add {
          0%,40% { transform: scale(0); opacity: 0; }
          60%    { transform: scale(1.2); opacity: 1; }
          100%   { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </defs>

    {/* Enzyme */}
    <g style={{ animation: 'dm-enzyme-rock 2s ease-in-out infinite', transformOrigin: '180px 90px' }}>
      <ellipse cx="180" cy="90" rx="58" ry="40" fill={color} opacity="0.1" />
      <ellipse cx="180" cy="90" rx="46" ry="32" fill={color} opacity="0.15" />
      <path d="M155 98 Q180 114 205 98" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <text x="180" y="82" textAnchor="middle" fill={color} fontSize="10" fontWeight="700" fontFamily="monospace">AAC enzyme</text>
      <text x="180" y="94" textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">acetyltransferase</text>
    </g>

    {/* Original drug entering */}
    <g style={{ animation: 'dm-drug-in 3s ease-in-out infinite', transformOrigin: '80px 90px' }}>
      <rect x="60" y="76" width="40" height="28" rx="5" fill="none" stroke={color} strokeWidth="2.2" />
      <text x="80" y="89" textAnchor="middle" fill={color} fontSize="8" fontWeight="700" fontFamily="monospace">GENT</text>
      <text x="80" y="100" textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace">active</text>
    </g>

    {/* Acetyl group being added */}
    <g style={{ animation: 'dm-acetyl-add 3s ease-in-out infinite', transformOrigin: '140px 65px' }}>
      <circle cx="140" cy="65" r="10" fill={color} opacity="0.85" />
      <text x="140" y="69" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">Ac</text>
      <line x1="140" y1="75" x2="140" y2="82" stroke={color} strokeWidth="1.5" strokeDasharray="2,1" />
    </g>

    {/* Modified drug exiting — now inactive */}
    <g style={{ animation: 'dm-mod-drug-out 3s ease-in-out infinite', transformOrigin: '272px 90px' }}>
      <rect x="250" y="76" width="44" height="28" rx="5" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="3,2" />
      <text x="272" y="89" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="700" fontFamily="monospace">GENT</text>
      <text x="272" y="100" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="monospace">+Ac inact.</text>
    </g>

    {/* Arrow through */}
    <path d="M226 90 L248 90" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,2"
      markerEnd="url(#arr)" opacity="0.5" />

    <text x="30" y="148" fill="#9ca3af" fontSize="9" fontFamily="monospace">① Enzyme adds acetyl group to aminoglycoside</text>
    <text x="30" y="162" fill="#9ca3af" fontSize="9" fontFamily="monospace">② Modified drug can no longer bind ribosome</text>
  </svg>
);

// ─── Animation selector ───────────────────────────────────────────────────────
const getAnim = (type, color) => {
  switch (type) {
    case 'efflux':      return <EffluxPumpAnim color={color} />;
    case 'lactamase':   return <BetaLactamaseAnim color={color} />;
    case 'mutation':    return <TargetMutationAnim color={color} />;
    case 'methylation': return <RibosomalMethylAnim color={color} />;
    case 'bypass':      return <BypassAnim color={color} />;
    case 'amc':         return <DrugModificationAnim color={color} />;
    default:            return <TargetMutationAnim color={color} />;
  }
};

// ─── Main component ───────────────────────────────────────────────────────────
const MechanismDiagrams = ({ resistanceGenes = [] }) => {
  const [selected, setSelected] = useState(0);

  if (!resistanceGenes || resistanceGenes.length === 0)
    return <p style={{ color: '#6b7280', fontSize: 14 }}>No resistance genes detected.</p>;

  const gene = resistanceGenes[selected];
  const mechType = classifyGene(gene.gene_id, gene.mechanism);
  const meta = MECHANISM_META[mechType];

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Gene selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {resistanceGenes.map((g, i) => {
          const t = classifyGene(g.gene_id, g.mechanism);
          const m = MECHANISM_META[t];
          const isActive = i === selected;
          return (
            <button key={g.gene_id} onClick={() => setSelected(i)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1.5px solid ${isActive ? m.color : '#e5e7eb'}`,
                background: isActive ? m.bg : 'white',
                color: isActive ? m.color : '#6b7280',
                fontSize: 13, fontWeight: isActive ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'monospace',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: isActive ? `0 2px 8px ${m.color}22` : 'none',
              }}>
              <span style={{ fontSize: 14 }}>{m.icon}</span>
              {g.gene_id}
              {isActive && (
                <span style={{
                  fontSize: 9, background: m.color, color: 'white',
                  padding: '1px 5px', borderRadius: 3, letterSpacing: '0.04em',
                }}>
                  {m.label.split(' ')[0].toUpperCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main card */}
      <div style={{
        border: `1px solid ${meta.border}`,
        borderTop: `3px solid ${meta.color}`,
        borderRadius: 12, overflow: 'hidden',
        background: 'white',
        boxShadow: `0 4px 16px ${meta.color}18`,
      }}>
        {/* Card header */}
        <div style={{
          padding: '16px 24px', background: meta.bg,
          borderBottom: `1px solid ${meta.border}`,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 20, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${meta.color}20`, borderRadius: 8,
          }}>{meta.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 15, fontWeight: 700, color: meta.color, fontFamily: 'monospace',
              }}>{gene.gene_id}</span>
              <span style={{
                fontSize: 10, background: meta.color, color: 'white',
                padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em', fontFamily: 'monospace',
              }}>{meta.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 13, color: '#374151', marginTop: 3 }}>{gene.mechanism}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 6,
              background: gene.location === 'plasmid' ? '#fff7ed' : '#f0fdfa',
              color: gene.location === 'plasmid' ? '#c2410c' : '#0f766e',
              border: `1px solid ${gene.location === 'plasmid' ? '#fed7aa' : '#99f6e4'}`,
              fontWeight: 500,
            }}>
              {gene.location === 'plasmid' ? '⚠ Plasmid-borne' : '🧬 Chromosomal'}
            </span>
          </div>
        </div>

        {/* Animation area */}
        <div style={{ padding: '28px 24px', background: '#fafafa', borderBottom: `1px solid ${meta.border}` }}>
          {getAnim(mechType, meta.color)}
        </div>

        {/* Info row */}
        <div style={{ padding: '20px 24px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'monospace' }}>
              MECHANISM DESCRIPTION
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{gene.description}</p>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'monospace' }}>
              ANTIBIOTICS AFFECTED
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(gene.drugs_defeated || []).map(d => (
                <span key={d} style={{
                  fontSize: 12, color: '#dc2626', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 5,
                  padding: '4px 10px', textTransform: 'capitalize', fontWeight: 500,
                }}>{d}</span>
              ))}
            </div>
            {gene.spreadable && (
              <div style={{
                marginTop: 14, fontSize: 12, color: '#c2410c',
                background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: 6, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
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
