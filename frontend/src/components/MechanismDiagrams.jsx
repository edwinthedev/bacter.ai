import { useState } from 'react';

// ─── Gene → mechanism type mapping ───────────────────────────────────────────
const classifyGene = (geneId = '', mechanism = '') => {
  const g = geneId.toLowerCase();
  const m = mechanism.toLowerCase();
  if (['teta','tetb','tetc','mera','merb','acrab','mexab','emrb'].some(x => g.startsWith(x)) || m.includes('efflux') || m.includes('pump')) return 'efflux';
  if (['tem','shv','ctx','ndm','kpc','vim','imp','oxa','bla','cmy'].some(x => g.startsWith(x)) || m.includes('lactamase') || m.includes('lactam') || m.includes('hydrolysis')) return 'lactamase';
  if (['gyra','gyrb','parc','pare','rpob','pbp','meca','vana','vanb'].some(x => g.startsWith(x)) || m.includes('mutation') || m.includes('target') || m.includes('gyrase')) return 'mutation';
  if (['erm','cfr','rlmn'].some(x => g.startsWith(x)) || m.includes('methyl') || m.includes('ribosom')) return 'methylation';
  if (['dfra','dfrb','sul1','sul2','sul3','dhfr'].some(x => g.startsWith(x)) || m.includes('dihydro') || m.includes('bypass') || m.includes('folate') || m.includes('synthase')) return 'bypass';
  if (['aac','aph','ant','aad'].some(x => g.startsWith(x)) || m.includes('acetyl') || m.includes('aminoglycoside')) return 'amc';
  if (['qnr'].some(x => g.startsWith(x)) || m.includes('quinolone') || m.includes('protection')) return 'protection';
  return 'mutation';
};

const MECHANISM_META = {
  efflux:      { label: 'Efflux Pump',           color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '⇈' },
  lactamase:   { label: 'Enzymatic Hydrolysis',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '✂' },
  mutation:    { label: 'Target Mutation',        color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⚡' },
  methylation: { label: 'Ribosomal Methylation', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', icon: '◈' },
  bypass:      { label: 'Enzyme Bypass',          color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: '⤳' },
  amc:         { label: 'Drug Modification',      color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', icon: '⚗' },
  protection:  { label: 'Target Protection',      color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: '🛡' },
};

// ─── Efflux Pump ─────────────────────────────────────────────────────────────
const EffluxPumpAnim = ({ color }) => (
  <svg viewBox="0 0 500 260" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes ep-rise { 0%{transform:translateY(0px);opacity:0} 10%{opacity:1} 70%{transform:translateY(-110px);opacity:0.9} 90%{transform:translateY(-130px);opacity:0} 100%{opacity:0} }
        @keyframes ep-enter { 0%{transform:translateX(-70px);opacity:0} 20%{opacity:1;transform:translateX(0)} 55%{transform:translateX(0);opacity:1} 75%{opacity:0} 100%{opacity:0} }
        @keyframes ep-rotor { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ep-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>
    </defs>

    {/* EXTRACELLULAR label */}
    <text x="250" y="28" textAnchor="middle" fill="#9ca3af" fontSize="12" letterSpacing="4" fontFamily="monospace">EXTRACELLULAR</text>

    {/* Cell membrane */}
    <rect x="40" y="90" width="420" height="30" rx="0" fill={color} opacity="0.07" style={{animation:'ep-pulse 2s ease-in-out infinite'}}/>
    <line x1="40" y1="90" x2="460" y2="90" stroke={color} strokeWidth="2.5" opacity="0.35"/>
    <line x1="40" y1="120" x2="460" y2="120" stroke={color} strokeWidth="2.5" opacity="0.35"/>

    {/* INTRACELLULAR label */}
    <text x="250" y="240" textAnchor="middle" fill="#9ca3af" fontSize="12" letterSpacing="4" fontFamily="monospace">INTRACELLULAR</text>

    {/* Pump channel */}
    <rect x="222" y="78" width="56" height="54" rx="8" fill={color} opacity="0.15"/>
    <rect x="228" y="84" width="44" height="42" rx="6" fill={color} opacity="0.1"/>

    {/* Spinning rotor */}
    <g style={{animation:'ep-rotor 1.4s linear infinite', transformOrigin:'250px 105px'}}>
      <circle cx="250" cy="105" r="16" fill="none" stroke={color} strokeWidth="2.5"/>
      {[0,60,120,180,240,300].map(deg => {
        const r = deg * Math.PI / 180;
        return <line key={deg} x1={250} y1={105} x2={250+16*Math.cos(r)} y2={105+16*Math.sin(r)} stroke={color} strokeWidth="2"/>;
      })}
      <circle cx="250" cy="105" r="4" fill={color}/>
    </g>
    <text x="250" y="148" textAnchor="middle" fill={color} fontSize="11" fontFamily="monospace" fontWeight="600">PUMP</text>

    {/* Drug inside cell (entering pump) */}
    <g style={{animation:'ep-enter 3s ease-in-out infinite', transformOrigin:'140px 165px'}}>
      <circle cx="140" cy="165" r="18" fill={color} opacity="0.85"/>
      <text x="140" y="170" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">AB</text>
      <text x="140" y="194" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">antibiotic</text>
    </g>

    {/* Drug being expelled upward */}
    <g style={{animation:'ep-rise 3s ease-in-out infinite', transformOrigin:'250px 75px'}}>
      <circle cx="250" cy="75" r="18" fill={color} opacity="0.85"/>
      <text x="250" y="80" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">AB</text>
    </g>

    {/* Arrow up */}
    <polygon points="250,36 242,52 258,52" fill={color} opacity="0.5"/>

    {/* ATP label */}
    <text x="360" y="100" fill={color} fontSize="11" fontFamily="monospace" opacity="0.8">ATP →</text>
    <text x="360" y="116" fill="#9ca3af" fontSize="10" fontFamily="monospace">energy source</text>

    {/* Caption */}
    <text x="250" y="222" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">Pump actively expels antibiotic before it can act on its target</text>
  </svg>
);

// ─── Beta-Lactamase ───────────────────────────────────────────────────────────
const BetaLactamaseAnim = ({ color }) => (
  <svg viewBox="0 0 500 260" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes bl-in { 0%{transform:translateX(-100px);opacity:0} 20%{opacity:1;transform:translateX(0)} 55%{transform:translateX(0);opacity:1} 70%{opacity:0} 100%{opacity:0} }
        @keyframes bl-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bl-snap-t { 0%,50%{transform:rotate(0deg)} 65%{transform:rotate(-30deg)} 80%{transform:rotate(0deg)} 100%{transform:rotate(0deg)} }
        @keyframes bl-snap-b { 0%,50%{transform:rotate(0deg)} 65%{transform:rotate(30deg)} 80%{transform:rotate(0deg)} 100%{transform:rotate(0deg)} }
        @keyframes bl-frag-a { 0%,60%{transform:translate(0,0);opacity:0} 65%{opacity:1} 100%{transform:translate(-50px,-40px);opacity:0} }
        @keyframes bl-frag-b { 0%,60%{transform:translate(0,0);opacity:0} 65%{opacity:1} 100%{transform:translate(42px,36px);opacity:0} }
        @keyframes bl-glow { 0%,100%{opacity:0.12} 50%{opacity:0.22} }
      `}</style>
    </defs>

    {/* Enzyme */}
    <g style={{animation:'bl-bob 2.2s ease-in-out infinite', transformOrigin:'320px 130px'}}>
      <ellipse cx="320" cy="130" rx="100" ry="68" fill={color} style={{animation:'bl-glow 2.2s ease-in-out infinite'}}/>
      <ellipse cx="320" cy="130" rx="82" ry="54" fill={color} opacity="0.1"/>
      <path d="M284 142 Q320 162 356 142" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <text x="320" y="116" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="monospace">β-lactamase</text>
      <text x="320" y="134" textAnchor="middle" fill={color} fontSize="11" fontFamily="monospace" opacity="0.75">active site ↓</text>
    </g>

    {/* Drug approaching */}
    <g style={{animation:'bl-in 3s ease-in-out infinite', transformOrigin:'145px 130px'}}>
      <rect x="116" y="108" width="36" height="32" rx="6" fill="none" stroke={color} strokeWidth="2.5"/>
      <line x1="152" y1="114" x2="168" y2="106" stroke={color} strokeWidth="2.2"/>
      <line x1="152" y1="124" x2="172" y2="124" stroke={color} strokeWidth="2.2"/>
      <line x1="152" y1="134" x2="168" y2="142" stroke={color} strokeWidth="2.2"/>
      <text x="134" y="158" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">β-lactam ring</text>
    </g>

    {/* Scissors */}
    <line x1="188" y1="112" x2="216" y2="148" stroke={color} strokeWidth="3.5" strokeLinecap="round"
      style={{animation:'bl-snap-t 3s ease-in-out infinite', transformOrigin:'202px 130px'}}/>
    <line x1="188" y1="148" x2="216" y2="112" stroke={color} strokeWidth="3.5" strokeLinecap="round"
      style={{animation:'bl-snap-b 3s ease-in-out infinite', transformOrigin:'202px 130px'}}/>

    {/* Fragments */}
    <g style={{animation:'bl-frag-a 3s ease-in-out infinite', transformOrigin:'148px 112px'}}>
      <rect x="132" y="104" width="20" height="14" rx="3" fill="none" stroke={color} strokeWidth="2" opacity="0.7"/>
    </g>
    <g style={{animation:'bl-frag-b 3s ease-in-out infinite', transformOrigin:'148px 148px'}}>
      <rect x="132" y="132" width="24" height="14" rx="3" fill="none" stroke={color} strokeWidth="2" opacity="0.7"/>
    </g>

    <text x="250" y="218" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">① Drug binds enzyme active site</text>
    <text x="250" y="234" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">② β-lactam ring hydrolyzed → drug inactivated</text>
  </svg>
);

// ─── Target Mutation ──────────────────────────────────────────────────────────
const TargetMutationAnim = ({ color }) => (
  <svg viewBox="0 0 500 260" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes tm-try { 0%{transform:translateX(90px);opacity:0} 20%{opacity:1;transform:translateX(0)} 48%{transform:translateX(0)} 58%{transform:translateX(14px)} 68%{transform:translateX(0)} 78%{transform:translateX(14px)} 90%{transform:translateX(70px);opacity:0} 100%{opacity:0} }
        @keyframes tm-no { 0%,35%{opacity:0;transform:scale(0.6)} 52%{opacity:1;transform:scale(1)} 78%{opacity:1} 92%{opacity:0} 100%{opacity:0} }
        @keyframes tm-pulse { 0%,100%{opacity:0.12} 50%{opacity:0.2} }
        @keyframes tm-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
    </defs>

    {/* Target protein */}
    <ellipse cx="210" cy="130" rx="110" ry="76" fill={color} style={{animation:'tm-pulse 2s ease-in-out infinite'}}/>
    <ellipse cx="210" cy="130" rx="90" ry="60" fill={color} opacity="0.1"/>
    <text x="210" y="116" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="monospace">DNA Gyrase</text>

    {/* Normal binding site (dashed) */}
    <path d="M174 130 Q210 114 246 130" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,3"/>
    <text x="210" y="148" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">normal binding site</text>

    {/* Mutated site */}
    <path d="M176 150 Q188 170 210 158 Q232 170 244 150" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <text x="210" y="175" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" fontWeight="600">mutated site</text>

    {/* Mutation badge */}
    <g style={{animation:'tm-badge 2s ease-in-out infinite', transformOrigin:'340px 80px'}}>
      <rect x="298" y="62" width="104" height="36" rx="8" fill={color} opacity="0.15"/>
      <rect x="302" y="66" width="96" height="28" rx="6" fill={color} opacity="0.08"/>
      <text x="350" y="84" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="monospace">S83L mutation</text>
    </g>

    {/* Drug trying and failing to bind */}
    <g style={{animation:'tm-try 3.2s ease-in-out infinite', transformOrigin:'380px 130px'}}>
      <rect x="356" y="110" width="48" height="40" rx="7" fill="none" stroke={color} strokeWidth="2.5"/>
      <circle cx="380" cy="130" r="9" fill="none" stroke={color} strokeWidth="2.2"/>
      <line x1="389" y1="130" x2="400" y2="130" stroke={color} strokeWidth="2.2"/>
      <line x1="395" y1="130" x2="395" y2="140" stroke={color} strokeWidth="2.2"/>
      <text x="380" y="162" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">ciprofloxacin</text>
    </g>

    {/* Blocked symbol */}
    <g style={{animation:'tm-no 3.2s ease-in-out infinite', transformOrigin:'328px 130px'}}>
      <circle cx="328" cy="130" r="18" fill="white" stroke={color} strokeWidth="3"/>
      <line x1="315" y1="117" x2="341" y2="143" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </g>

    <text x="250" y="218" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">① Point mutation changes binding site shape</text>
    <text x="250" y="234" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">② Antibiotic cannot bind → enzyme keeps functioning</text>
  </svg>
);

// ─── Ribosomal Methylation ────────────────────────────────────────────────────
const RibosomalMethylAnim = ({ color }) => (
  <svg viewBox="0 0 500 260" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes rm-methyl { 0%{transform:scale(0) rotate(-30deg);opacity:0} 40%{transform:scale(1.15) rotate(0deg);opacity:1} 60%{transform:scale(1);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes rm-blocked { 0%,30%{transform:translateX(100px);opacity:0} 50%{opacity:1;transform:translateX(10px)} 65%{transform:translateX(18px)} 80%{transform:translateX(10px)} 94%{transform:translateX(90px);opacity:0} 100%{opacity:0} }
        @keyframes rm-pulse { 0%,100%{opacity:0.15} 50%{opacity:0.28} }
        @keyframes rm-enzyme { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </defs>

    {/* Ribosome */}
    <ellipse cx="200" cy="138" rx="110" ry="76" fill={color} style={{animation:'rm-pulse 2s ease-in-out infinite'}}/>
    <ellipse cx="182" cy="116" rx="62" ry="44" fill={color} opacity="0.12"/>
    <text x="192" y="130" textAnchor="middle" fill={color} fontSize="13" fontWeight="700" fontFamily="monospace">Ribosome</text>
    <text x="192" y="148" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">23S rRNA</text>

    {/* Methyl groups */}
    {[
      {cx:155,cy:118,d:'0s'},{cx:180,cy:106,d:'0.3s'},{cx:208,cy:110,d:'0.6s'},
      {cx:228,cy:124,d:'0.9s'},{cx:220,cy:148,d:'1.1s'},
    ].map((p,i) => (
      <g key={i} style={{animation:`rm-methyl 3s ease-in-out ${p.d} infinite`, transformOrigin:`${p.cx}px ${p.cy}px`}}>
        <circle cx={p.cx} cy={p.cy} r="13" fill={color} opacity="0.82"/>
        <text x={p.cx} y={p.cy+4} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">CH₃</text>
      </g>
    ))}

    {/* ErmC enzyme label */}
    <g style={{animation:'rm-enzyme 2s ease-in-out infinite', transformOrigin:'145px 54px'}}>
      <rect x="88" y="38" width="114" height="32" rx="10" fill={color} opacity="0.18"/>
      <text x="145" y="58" textAnchor="middle" fill={color} fontSize="11" fontWeight="600" fontFamily="monospace">ErmC enzyme</text>
      <line x1="145" y1="70" x2="172" y2="88" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/>
    </g>

    {/* Drug blocked */}
    <g style={{animation:'rm-blocked 3s ease-in-out infinite', transformOrigin:'390px 130px'}}>
      <rect x="360" y="108" width="60" height="44" rx="7" fill="none" stroke={color} strokeWidth="2.5"/>
      <text x="390" y="128" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="monospace">ERY</text>
      <text x="390" y="144" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">macrolide</text>
      <text x="334" y="135" fill={color} fontSize="18" opacity="0.65">↔</text>
    </g>

    <text x="250" y="222" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">Methylation of 23S rRNA sterically blocks antibiotic docking</text>
  </svg>
);

// ─── Enzyme Bypass ────────────────────────────────────────────────────────────
const BypassAnim = ({ color }) => (
  <svg viewBox="0 0 500 280" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes bp-block { 0%{transform:translateX(-80px);opacity:0} 20%{opacity:1;transform:translateX(0)} 60%{transform:translateX(0);opacity:1} 78%{opacity:0} 100%{opacity:0} }
        @keyframes bp-flow { 0%{stroke-dashoffset:200;opacity:0} 20%{opacity:1} 100%{stroke-dashoffset:0;opacity:1} }
        @keyframes bp-product { 0%,50%{opacity:0;transform:scale(0.4)} 70%{opacity:1;transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        @keyframes bp-x { 0%,38%{opacity:0} 55%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
      `}</style>
    </defs>

    {/* Normal DHFR (blocked) */}
    <ellipse cx="180" cy="90" rx="70" ry="46" fill="#ef4444" opacity="0.08"/>
    <text x="180" y="82" textAnchor="middle" fill="#6b7280" fontSize="12" fontFamily="monospace">Normal DHFR</text>
    <text x="180" y="98" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">(inhibited)</text>

    {/* X marks blocked */}
    <g style={{animation:'bp-x 3s ease-in-out infinite'}}>
      <line x1="148" y1="58" x2="212" y2="122" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
      <line x1="212" y1="58" x2="148" y2="122" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
    </g>

    {/* Drug blocking normal enzyme */}
    <g style={{animation:'bp-block 3s ease-in-out infinite', transformOrigin:'58px 90px'}}>
      <rect x="28" y="68" width="60" height="44" rx="7" fill="none" stroke="#ef4444" strokeWidth="2.5"/>
      <text x="58" y="87" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="700" fontFamily="monospace">TMP</text>
      <text x="58" y="103" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace">drug</text>
    </g>

    {/* Arrow pointing down */}
    <line x1="180" y1="140" x2="180" y2="168" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,3"/>
    <polygon points="180,178 174,163 186,163" fill="#9ca3af" opacity="0.5"/>

    {/* Bypass enzyme */}
    <ellipse cx="180" cy="218" rx="80" ry="48" fill={color} opacity="0.15"/>
    <ellipse cx="180" cy="218" rx="64" ry="38" fill={color} opacity="0.1"/>
    <text x="180" y="212" textAnchor="middle" fill={color} fontSize="13" fontWeight="700" fontFamily="monospace">dfrA17</text>
    <text x="180" y="228" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">resistant variant</text>

    {/* Flowing bypass path */}
    <path d="M320 80 Q370 80 390 130 Q410 180 380 220 Q350 260 310 255"
      fill="none" stroke={color} strokeWidth="3" strokeDasharray="12,6" strokeLinecap="round"
      style={{animation:'bp-flow 3s ease-in-out infinite', strokeDashoffset:200}}/>

    {/* Product */}
    <g style={{animation:'bp-product 3s ease-in-out infinite', transformOrigin:'280px 218px'}}>
      <circle cx="280" cy="218" r="26" fill={color} opacity="0.82"/>
      <text x="280" y="213" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">THF</text>
      <text x="280" y="228" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace">folate ✓</text>
    </g>

    <text x="250" y="270" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">Resistant variant bypasses the drug block — folate synthesis continues</text>
  </svg>
);

// ─── Drug Modification (AAC) ──────────────────────────────────────────────────
const DrugModificationAnim = ({ color }) => (
  <svg viewBox="0 0 500 260" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes dm-in { 0%{transform:translateX(-90px);opacity:0} 20%{opacity:1;transform:translateX(0)} 55%{transform:translateX(0);opacity:1} 70%{opacity:0} 100%{opacity:0} }
        @keyframes dm-out { 0%,55%{transform:translateX(0);opacity:0} 68%{opacity:1} 92%{transform:translateX(90px);opacity:0} 100%{opacity:0} }
        @keyframes dm-rock { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
        @keyframes dm-ac { 0%,40%{transform:scale(0);opacity:0} 60%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:0.85} }
      `}</style>
    </defs>

    {/* Enzyme */}
    <g style={{animation:'dm-rock 2s ease-in-out infinite', transformOrigin:'250px 130px'}}>
      <ellipse cx="250" cy="130" rx="96" ry="66" fill={color} opacity="0.1"/>
      <ellipse cx="250" cy="130" rx="78" ry="52" fill={color} opacity="0.12"/>
      <path d="M214 142 Q250 162 286 142" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <text x="250" y="118" textAnchor="middle" fill={color} fontSize="13" fontWeight="700" fontFamily="monospace">AAC enzyme</text>
      <text x="250" y="133" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">acetyltransferase</text>
    </g>

    {/* Original drug (active) */}
    <g style={{animation:'dm-in 3s ease-in-out infinite', transformOrigin:'100px 130px'}}>
      <rect x="66" y="108" width="68" height="44" rx="7" fill="none" stroke={color} strokeWidth="2.5"/>
      <text x="100" y="128" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="monospace">GENT</text>
      <text x="100" y="144" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace">active</text>
    </g>

    {/* Acetyl group being added */}
    <g style={{animation:'dm-ac 3s ease-in-out infinite', transformOrigin:'190px 86px'}}>
      <circle cx="190" cy="86" r="18" fill={color} opacity="0.85"/>
      <text x="190" y="90" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Ac</text>
      <line x1="190" y1="104" x2="214" y2="116" stroke={color} strokeWidth="2" strokeDasharray="3,2"/>
    </g>

    {/* Modified drug (inactive) */}
    <g style={{animation:'dm-out 3s ease-in-out infinite', transformOrigin:'396px 130px'}}>
      <rect x="358" y="108" width="76" height="44" rx="7" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,2"/>
      <text x="396" y="128" textAnchor="middle" fill="#9ca3af" fontSize="12" fontWeight="700" fontFamily="monospace">GENT</text>
      <text x="396" y="144" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">+Ac (inactive)</text>
    </g>

    {/* Arrow */}
    <line x1="346" y1="130" x2="360" y2="130" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/>

    <text x="250" y="218" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">① Enzyme adds acetyl group to aminoglycoside drug</text>
    <text x="250" y="234" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">② Modified drug can no longer bind its ribosomal target</text>
  </svg>
);

// ─── Target Protection (QnrS) ─────────────────────────────────────────────────
const TargetProtectionAnim = ({ color }) => (
  <svg viewBox="0 0 500 260" width="100%" style={{ display: 'block' }}>
    <defs>
      <style>{`
        @keyframes tp-shield { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes tp-drug { 0%{transform:translateX(100px);opacity:0} 20%{opacity:1;transform:translateX(0)} 50%{transform:translateX(0)} 62%{transform:translateX(14px)} 74%{transform:translateX(0)} 86%{transform:translateX(80px);opacity:0} 100%{opacity:0} }
        @keyframes tp-no { 0%,38%{opacity:0;transform:scale(0.5)} 55%{opacity:1;transform:scale(1)} 78%{opacity:1} 92%{opacity:0} 100%{opacity:0} }
        @keyframes tp-target { 0%,100%{opacity:0.12} 50%{opacity:0.22} }
      `}</style>
    </defs>

    {/* DNA Gyrase target */}
    <ellipse cx="200" cy="130" rx="96" ry="68" fill="#6b7280" style={{animation:'tp-target 2s ease-in-out infinite'}}/>
    <text x="200" y="122" textAnchor="middle" fill="#6b7280" fontSize="13" fontWeight="700" fontFamily="monospace">DNA Gyrase</text>
    <text x="200" y="138" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">fluoroquinolone target</text>

    {/* Qnr shield protein */}
    <g style={{animation:'tp-shield 1.8s ease-in-out infinite', transformOrigin:'200px 130px'}}>
      <path d="M172 90 Q200 78 228 90 L236 148 Q200 170 164 148 Z"
        fill={color} opacity="0.18" stroke={color} strokeWidth="2.5"/>
      <text x="200" y="128" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="monospace">QnrS1</text>
      <text x="200" y="143" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">shield protein</text>
    </g>

    {/* Drug trying to get through */}
    <g style={{animation:'tp-drug 3s ease-in-out infinite', transformOrigin:'370px 130px'}}>
      <rect x="342" y="108" width="56" height="44" rx="7" fill="none" stroke={color} strokeWidth="2.5"/>
      <text x="370" y="128" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="monospace">CIPRO</text>
      <text x="370" y="144" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">quinolone</text>
    </g>

    {/* Blocked */}
    <g style={{animation:'tp-no 3s ease-in-out infinite', transformOrigin:'308px 130px'}}>
      <circle cx="308" cy="130" r="18" fill="white" stroke={color} strokeWidth="3"/>
      <line x1="295" y1="117" x2="321" y2="143" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </g>

    <text x="250" y="218" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">① Qnr protein binds and shields the gyrase target</text>
    <text x="250" y="234" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">② Quinolone antibiotic cannot access its target</text>
  </svg>
);

const getAnim = (type, color) => ({
  efflux:      <EffluxPumpAnim color={color} />,
  lactamase:   <BetaLactamaseAnim color={color} />,
  mutation:    <TargetMutationAnim color={color} />,
  methylation: <RibosomalMethylAnim color={color} />,
  bypass:      <BypassAnim color={color} />,
  amc:         <DrugModificationAnim color={color} />,
  protection:  <TargetProtectionAnim color={color} />,
}[type] || <TargetMutationAnim color={color} />);

// ─── Main component ───────────────────────────────────────────────────────────
const MechanismDiagrams = ({ resistanceGenes = [] }) => {
  const [selected, setSelected] = useState(0);
  if (!resistanceGenes || resistanceGenes.length === 0)
    return <p style={{ color: '#6b7280', fontSize: 14 }}>No resistance genes detected.</p>;

  const gene = resistanceGenes[selected];
  const mechType = classifyGene(gene.gene_id, gene.mechanism);
  const meta = MECHANISM_META[mechType];

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Gene tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {resistanceGenes.map((g, i) => {
          const t = classifyGene(g.gene_id, g.mechanism);
          const m = MECHANISM_META[t];
          const active = i === selected;
          return (
            <button key={g.gene_id} onClick={() => setSelected(i)} style={{
              padding: '8px 16px', borderRadius: 8,
              border: `1.5px solid ${active ? m.color : '#e5e7eb'}`,
              background: active ? m.bg : 'white',
              color: active ? m.color : '#6b7280',
              fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'monospace',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: active ? `0 2px 10px ${m.color}28` : 'none',
            }}>
              <span style={{ fontSize: 14 }}>{m.icon}</span>
              {g.gene_id}
              {active && (
                <span style={{
                  fontSize: 9, background: m.color, color: 'white',
                  padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>{m.label.toUpperCase()}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div style={{
        border: `1px solid ${meta.border}`,
        borderTop: `3px solid ${meta.color}`,
        borderRadius: 12, overflow: 'hidden',
        background: 'white',
        boxShadow: `0 4px 20px ${meta.color}18`,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', background: meta.bg,
          borderBottom: `1px solid ${meta.border}`,
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 22, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${meta.color}1a`, borderRadius: 8,
          }}>{meta.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: meta.color, fontFamily: 'monospace' }}>{gene.gene_id}</span>
              <span style={{
                fontSize: 10, background: meta.color, color: 'white',
                padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em', fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}>{meta.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{gene.mechanism}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 6, whiteSpace: 'nowrap',
              background: gene.location === 'plasmid' ? '#fff7ed' : '#f0fdfa',
              color: gene.location === 'plasmid' ? '#c2410c' : '#0f766e',
              border: `1px solid ${gene.location === 'plasmid' ? '#fed7aa' : '#99f6e4'}`,
              fontWeight: 500,
            }}>
              {gene.location === 'plasmid' ? '⚠ Plasmid-borne' : '🧬 Chromosomal'}
            </span>
          </div>
        </div>

        {/* Animation */}
        <div style={{ padding: '28px 24px', background: '#fafafa', borderBottom: `1px solid ${meta.border}` }}>
          {getAnim(mechType, meta.color)}
        </div>

        {/* Info */}
        <div style={{ padding: '20px 24px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'monospace' }}>MECHANISM</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{gene.description}</p>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'monospace' }}>ANTIBIOTICS AFFECTED</div>
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
              }}>⚠ Horizontally transferable</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanismDiagrams;
