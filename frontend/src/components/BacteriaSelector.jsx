import { useState, useRef, useEffect } from 'react';

const BACTERIA = [
    // ── Available ──────────────────────────────────────────────
    { id: 'ecoli', name: 'Escherichia coli', common: 'E. coli', hasModel: true },
  
    // ── Coming soon ────────────────────────────────────────────
    { id: 'staph_aureus', name: 'Staphylococcus aureus', common: 'Staph aureus', hasModel: false },
    { id: 'staph_epidermidis', name: 'Staphylococcus epidermidis', common: 'Staph epidermidis', hasModel: false },
    { id: 'staph_saprophyticus', name: 'Staphylococcus saprophyticus', common: 'Staph saprophyticus', hasModel: false },
    { id: 'klebs_pneumo', name: 'Klebsiella pneumoniae', common: 'K. pneumoniae', hasModel: false },
    { id: 'klebs_oxytoca', name: 'Klebsiella oxytoca', common: 'K. oxytoca', hasModel: false },
    { id: 'pseudo_aerug', name: 'Pseudomonas aeruginosa', common: 'P. aeruginosa', hasModel: false },
    { id: 'pseudo_putida', name: 'Pseudomonas putida', common: 'P. putida', hasModel: false },
    { id: 'acineto_baum', name: 'Acinetobacter baumannii', common: 'A. baumannii', hasModel: false },
    { id: 'acineto_lwoffii', name: 'Acinetobacter lwoffii', common: 'A. lwoffii', hasModel: false },
    { id: 'entero_faecium', name: 'Enterococcus faecium', common: 'E. faecium', hasModel: false },
    { id: 'entero_faecalis', name: 'Enterococcus faecalis', common: 'E. faecalis', hasModel: false },
    { id: 'strep_pneumo', name: 'Streptococcus pneumoniae', common: 'S. pneumoniae', hasModel: false },
    { id: 'strep_pyogenes', name: 'Streptococcus pyogenes', common: 'Group A Strep', hasModel: false },
    { id: 'strep_agalac', name: 'Streptococcus agalactiae', common: 'Group B Strep', hasModel: false },
    { id: 'strep_viridans', name: 'Streptococcus viridans', common: 'Viridans Strep', hasModel: false },
    { id: 'salmonella_enterica', name: 'Salmonella enterica', common: 'Salmonella', hasModel: false },
    { id: 'salmonella_typhi', name: 'Salmonella typhi', common: 'Typhoid', hasModel: false },
    { id: 'salmonella_typhimurium', name: 'Salmonella typhimurium', common: 'S. typhimurium', hasModel: false },
    { id: 'campy_jejuni', name: 'Campylobacter jejuni', common: 'C. jejuni', hasModel: false },
    { id: 'campy_coli', name: 'Campylobacter coli', common: 'C. coli', hasModel: false },
    { id: 'myco_tb', name: 'Mycobacterium tuberculosis', common: 'TB', hasModel: false },
    { id: 'myco_leprae', name: 'Mycobacterium leprae', common: 'Leprosy', hasModel: false },
    { id: 'myco_abscessus', name: 'Mycobacterium abscessus', common: 'M. abscessus', hasModel: false },
    { id: 'neisseria_gonorr', name: 'Neisseria gonorrhoeae', common: 'Gonorrhea', hasModel: false },
    { id: 'neisseria_mening', name: 'Neisseria meningitidis', common: 'Meningococcus', hasModel: false },
    { id: 'hpylori', name: 'Helicobacter pylori', common: 'H. pylori', hasModel: false },
    { id: 'haemo_influenzae', name: 'Haemophilus influenzae', common: 'H. influenzae', hasModel: false },
    { id: 'haemo_parainfluenzae', name: 'Haemophilus parainfluenzae', common: 'H. parainfluenzae', hasModel: false },
    { id: 'listeria_mono', name: 'Listeria monocytogenes', common: 'Listeria', hasModel: false },
    { id: 'bacillus_anthracis', name: 'Bacillus anthracis', common: 'Anthrax', hasModel: false },
    { id: 'bacillus_cereus', name: 'Bacillus cereus', common: 'B. cereus', hasModel: false },
    { id: 'clostridium_diff', name: 'Clostridioides difficile', common: 'C. diff', hasModel: false },
    { id: 'clostridium_perf', name: 'Clostridium perfringens', common: 'C. perfringens', hasModel: false },
    { id: 'clostridium_bot', name: 'Clostridium botulinum', common: 'Botulism', hasModel: false },
    { id: 'vibrio_cholera', name: 'Vibrio cholerae', common: 'Cholera', hasModel: false },
    { id: 'vibrio_vulnificus', name: 'Vibrio vulnificus', common: 'V. vulnificus', hasModel: false },
    { id: 'yersinia_pestis', name: 'Yersinia pestis', common: 'Plague', hasModel: false },
    { id: 'yersinia_entero', name: 'Yersinia enterocolitica', common: 'Y. enterocolitica', hasModel: false },
    { id: 'shigella_dysen', name: 'Shigella dysenteriae', common: 'Dysentery', hasModel: false },
    { id: 'shigella_flex', name: 'Shigella flexneri', common: 'S. flexneri', hasModel: false },
    { id: 'shigella_sonnei', name: 'Shigella sonnei', common: 'S. sonnei', hasModel: false },
    { id: 'proteus_mirab', name: 'Proteus mirabilis', common: 'P. mirabilis', hasModel: false },
    { id: 'proteus_vulgaris', name: 'Proteus vulgaris', common: 'P. vulgaris', hasModel: false },
    { id: 'enterobacter_cloacae', name: 'Enterobacter cloacae', common: 'E. cloacae', hasModel: false },
    { id: 'enterobacter_aerog', name: 'Enterobacter aerogenes', common: 'E. aerogenes', hasModel: false },
    { id: 'serratia_marc', name: 'Serratia marcescens', common: 'S. marcescens', hasModel: false },
    { id: 'citrobacter_freundii', name: 'Citrobacter freundii', common: 'C. freundii', hasModel: false },
    { id: 'moraxella_cat', name: 'Moraxella catarrhalis', common: 'M. catarrhalis', hasModel: false },
    { id: 'bordetella_pertussis', name: 'Bordetella pertussis', common: 'Whooping cough', hasModel: false },
    { id: 'legionella_pneumo', name: 'Legionella pneumophila', common: 'Legionnaires', hasModel: false },
    { id: 'francisella_tular', name: 'Francisella tularensis', common: 'Tularemia', hasModel: false },
    { id: 'brucella_melitensis', name: 'Brucella melitensis', common: 'Brucellosis', hasModel: false },
    { id: 'rickettsia_rickettsii', name: 'Rickettsia rickettsii', common: 'Rocky Mountain Spotted Fever', hasModel: false },
    { id: 'treponema_pallidum', name: 'Treponema pallidum', common: 'Syphilis', hasModel: false },
    { id: 'borrelia_burgdorferi', name: 'Borrelia burgdorferi', common: 'Lyme disease', hasModel: false },
    { id: 'chlamydia_trachomatis', name: 'Chlamydia trachomatis', common: 'Chlamydia', hasModel: false },
    { id: 'mycoplasma_pneumo', name: 'Mycoplasma pneumoniae', common: 'Walking pneumonia', hasModel: false },
    { id: 'ureaplasma', name: 'Ureaplasma urealyticum', common: 'Ureaplasma', hasModel: false },
    { id: 'corynebact_diph', name: 'Corynebacterium diphtheriae', common: 'Diphtheria', hasModel: false },
    { id: 'nocardia_asteroides', name: 'Nocardia asteroides', common: 'Nocardiosis', hasModel: false },
    { id: 'burkholderia_cepacia', name: 'Burkholderia cepacia', common: 'B. cepacia', hasModel: false },
    { id: 'stenotrophomonas', name: 'Stenotrophomonas maltophilia', common: 'S. maltophilia', hasModel: false },
    { id: 'fusobacterium', name: 'Fusobacterium nucleatum', common: 'F. nucleatum', hasModel: false },
    { id: 'bacteroides_fragilis', name: 'Bacteroides fragilis', common: 'B. fragilis', hasModel: false },
  ];

const BacteriaSelector = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [selected, setSelected] = useState(null);
  const [noModel, setNoModel] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = query.trim() === ''
    ? BACTERIA
    : BACTERIA.filter(b =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.common.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]');
      items[highlighted]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const handleSelect = (bacteria) => {
    setSelected(bacteria);
    setQuery(bacteria.name);
    setOpen(false);
    setHighlighted(-1);
    setNoModel(!bacteria.hasModel);
    if (bacteria.hasModel && onSelect) onSelect(bacteria.id);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) handleSelect(filtered[highlighted]);
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
      borderRadius: 16, padding: 24, maxWidth: 640, margin: '0 auto',
    }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
          SELECT ORGANISM
        </h2>
        <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11, margin: '4px 0 0', letterSpacing: '0.05em' }}>
          SEARCH BY SPECIES OR COMMON NAME
        </p>
      </div>

      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#1e293b',
          border: `1px solid ${open ? '#3b82f6' : '#334155'}`,
          borderRadius: open ? '10px 10px 0 0' : 10,
          padding: '10px 14px',
          transition: 'border-color 0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(-1); setNoModel(false); setSelected(null); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search bacteria... e.g. E. coli, Staph, tuberculosis"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontFamily: 'monospace', fontSize: 14 }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSelected(null); setNoModel(false); setOpen(true); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>

        {open && (
          <div ref={listRef} style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#1e293b', border: '1px solid #3b82f6',
            borderTop: '1px solid #334155', borderRadius: '0 0 10px 10px',
            maxHeight: 320, overflowY: 'auto', zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '14px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: 13 }}>
                No bacteria found for "{query}"
              </div>
            ) : (
              filtered.map((bacteria, i) => (
                <div key={bacteria.id} data-item
                  onClick={() => handleSelect(bacteria)}
                  onMouseEnter={() => setHighlighted(i)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer',
                    background: i === highlighted ? '#1d4ed822' : 'transparent',
                    borderBottom: i < filtered.length - 1 ? '1px solid #0f172a' : 'none',
                    transition: 'background 0.1s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                  <div>
                    <span style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, fontStyle: 'italic' }}>
                      {bacteria.name}
                    </span>
                    <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11, marginLeft: 8 }}>
                      ({bacteria.common})
                    </span>
                  </div>
                  {bacteria.hasModel ? (
                    <span style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', color: '#4ade80', fontFamily: 'monospace', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      MODEL READY
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid #334155', color: '#475569', fontFamily: 'monospace', fontSize: 9, padding: '2px 6px', borderRadius: 4 }}>
                      COMING SOON
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* No model message */}
      {noModel && selected && (
        <div style={{
          marginTop: 16, background: '#0f172a',
          border: '1px solid #334155', borderLeft: '3px solid #475569',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 }}>
            🔬 No model available for <span style={{ color: '#f1f5f9', fontStyle: 'italic' }}>{selected.name}</span> yet.
            Currently only <span style={{ color: '#4ade80' }}>Escherichia coli</span> is supported.
          </span>
        </div>
      )}

      {/* Selected E. coli — show FASTA upload prompt */}
      {selected?.hasModel && (
        <div style={{
          marginTop: 16, background: '#0f172a',
          border: '1px solid rgba(59,130,246,0.3)', borderLeft: '3px solid #3b82f6',
          borderRadius: 10, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 }}>
            ✓ <span style={{ color: '#4ade80', fontStyle: 'italic' }}>E. coli</span> model ready — upload a FASTA file to analyze
          </span>
        </div>
      )}
    </div>
  );
};

export default BacteriaSelector;