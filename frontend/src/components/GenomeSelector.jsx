import { useState, useRef, useEffect } from 'react';

// ─── Mock data (replace with real API call to /api/genomes later) ────────────
const MOCK_GENOMES = [
  {
    id: 'sample_a',
    name: 'E. coli K-12 MG1655',
    species: 'Escherichia coli',
    description: 'Lab reference strain isolated from a human colon in 1922.',
    risk_level: 'Low',
  },
  {
    id: 'sample_b',
    name: 'E. coli ST131 O25b',
    species: 'Escherichia coli',
    description: 'Multi-drug resistant urinary tract infection isolate.',
    risk_level: 'Moderate',
  },
  {
    id: 'sample_c',
    name: 'E. coli NDM-1 positive',
    species: 'Escherichia coli',
    description: 'Carbapenem-resistant isolate carrying the NDM-1 gene on a mobile plasmid.',
    risk_level: 'Critical',
  },
  {
    id: '1310815.3',
    name: 'E. coli O157:H7 Sakai',
    species: 'Escherichia coli',
    description: 'Enterohemorrhagic strain responsible for the 1996 Sakai Japan outbreak.',
    risk_level: 'High',
  },
  {
    id: '2697049.4',
    name: 'E. coli UPEC CFT073',
    species: 'Escherichia coli',
    description: 'Uropathogenic isolate from a patient with pyelonephritis.',
    risk_level: 'Moderate',
  },
  {
    id: '3031948.5',
    name: 'E. coli KPC-producing strain',
    species: 'Escherichia coli',
    description: 'Hospital-acquired carbapenem-resistant strain carrying KPC enzyme.',
    risk_level: 'Critical',
  },
];

// ─── Risk badge styling ───────────────────────────────────────────────────────
const RISK_STYLES = {
  Low:      { bg: '#14532d22', border: '#16a34a55', text: '#4ade80' },
  Moderate: { bg: '#78350f22', border: '#d9770655', text: '#fbbf24' },
  High:     { bg: '#7c1d1d22', border: '#dc262655', text: '#f87171' },
  Critical: { bg: '#3b0764aa', border: '#9333ea88', text: '#c084fc' },
};

const RiskBadge = ({ level }) => {
  const s = RISK_STYLES[level] || RISK_STYLES.Low;
  return (
    <span style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.text,
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 4,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {level.toUpperCase()}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const GenomeSelector = ({ onSelect, genomes = MOCK_GENOMES }) => {
  const [query, setQuery]         = useState('');
  const [open, setOpen]           = useState(false);
  const [highlighted, setHigh]    = useState(-1);
  const [selected, setSelected]   = useState(null);
  const inputRef                  = useRef(null);
  const listRef                   = useRef(null);
  const containerRef              = useRef(null);

  // Filter genomes based on query
  const filtered = query.trim().length === 0
    ? genomes
    : genomes.filter(g =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.id.toLowerCase().includes(query.toLowerCase()) ||
        g.description.toLowerCase().includes(query.toLowerCase()) ||
        g.species.toLowerCase().includes(query.toLowerCase())
      );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]');
      items[highlighted]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const handleSelect = (genome) => {
    setSelected(genome);
    setQuery(genome.name);
    setOpen(false);
    setHigh(-1);
    if (onSelect) onSelect(genome.id);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHigh(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHigh(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    setHigh(-1);
    if (e.target.value === '') setSelected(null);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
      borderRadius: 16,
      padding: 24,
      maxWidth: 640,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          color: '#f1f5f9', fontFamily: 'monospace', fontSize: 18,
          fontWeight: 800, margin: 0, letterSpacing: '0.05em',
        }}>
          SELECT GENOME
        </h2>
        <p style={{
          color: '#64748b', fontFamily: 'monospace', fontSize: 11,
          margin: '4px 0 0', letterSpacing: '0.05em',
        }}>
          SEARCH BY NAME, ID, OR DESCRIPTION
        </p>
      </div>

      {/* Search box */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#1e293b',
          border: `1px solid ${open ? '#3b82f6' : '#334155'}`,
          borderRadius: open ? '10px 10px 0 0' : 10,
          padding: '10px 14px',
          transition: 'border-color 0.2s',
        }}>
          {/* Search icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search genomes... e.g. NDM-1, K-12, ST131"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f1f5f9',
              fontFamily: 'monospace',
              fontSize: 14,
            }}
          />

          {/* Clear button */}
          {query && (
            <button
              onClick={() => { setQuery(''); setSelected(null); setOpen(true); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
            >×</button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div
            ref={listRef}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#1e293b',
              border: '1px solid #3b82f6',
              borderTop: '1px solid #334155',
              borderRadius: '0 0 10px 10px',
              maxHeight: 320,
              overflowY: 'auto',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '14px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: 13 }}>
                No genomes found for "{query}"
              </div>
            ) : (
              filtered.map((genome, i) => (
                <div
                  key={genome.id}
                  data-item
                  onClick={() => handleSelect(genome)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: i === highlighted ? '#1d4ed822' : 'transparent',
                    borderBottom: i < filtered.length - 1 ? '1px solid #1e293b' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setHigh(i)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>
                      {genome.name}
                    </span>
                    <RiskBadge level={genome.risk_level} />
                    <span style={{ marginLeft: 'auto', color: '#475569', fontFamily: 'monospace', fontSize: 10 }}>
                      {genome.id}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontFamily: 'system-ui, sans-serif', fontSize: 12, lineHeight: 1.4 }}>
                    {genome.description}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected genome summary */}
      {selected && (
        <div style={{
          marginTop: 16,
          background: '#0f172a',
          border: `1px solid ${RISK_STYLES[selected.risk_level]?.border || '#334155'}`,
          borderLeft: `3px solid ${RISK_STYLES[selected.risk_level]?.text || '#64748b'}`,
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13, fontWeight: 800 }}>
                {selected.name}
              </span>
              <RiskBadge level={selected.risk_level} />
            </div>
            <div style={{ color: '#94a3b8', fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
              {selected.description}
            </div>
          </div>
          <button
            onClick={() => { if (onSelect) onSelect(selected.id); }}
            style={{
              background: '#3b82f6',
              border: 'none',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            ANALYZE →
          </button>
        </div>
      )}
    </div>
  );
};

export default GenomeSelector;
