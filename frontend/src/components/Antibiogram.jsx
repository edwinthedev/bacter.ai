const cssVars = `
  :root {
    --glass-white: rgba(255,255,255,0.95);
    --glass-shade: #f3f4f6;
    --radius-lg: 12px;
    --shadow-glass: 0 1px 3px rgba(0,0,0,0.06);
    --border-hairline: #e5e7eb;
    --navy-base: #111827;
    --text-sub: #6b7280;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
    --c-resistant: #dc2626;
    --c-susceptible: #16a34a;
    --c-intermediate: #d97706;
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

const Antibiogram = ({ predictions, resistanceGenes, onDrugClick }) => {
    const sortedDrugs = Object.entries(predictions).sort(([, a], [, b]) => {
      if (a.prediction === b.prediction) return b.probability - a.probability;
      return a.prediction === 'resistant' ? -1 : 1;
    });

    const resistant = sortedDrugs.filter(([, d]) => d.prediction === 'resistant').length;
    const susceptible = sortedDrugs.filter(([, d]) => d.prediction === 'susceptible').length;

    return (
      <article style={{
        background: 'var(--glass-white)', borderRadius: 'var(--radius-lg)',
        padding: '2rem', boxShadow: 'var(--shadow-glass)',
        border: '1px solid var(--border-hairline)'
      }}>
        <style>{cssVars}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-hairline)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--navy-base)', fontWeight: 700 }}>Antibiogram</h2>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              Predicted susceptibility profile
            </span>
          </div>
        </div>
  
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
          <tbody>
            {sortedDrugs.map(([drug, data], index) => {
              const isR = data.prediction === 'resistant';
              const color = isR ? 'var(--c-resistant)' : 'var(--c-susceptible)';
              return (
                <tr key={drug} onClick={() => onDrugClick?.(drug)} style={{ cursor: 'pointer', opacity: 0, animation: `slideInRight 0.4s ease forwards ${0.4 + index * 0.08}s` }}>
                  <td style={{ color: 'var(--text-sub)', fontSize: '0.85rem', width: 30 }}>{index + 1}</td>
                  <td style={{ paddingRight: '1rem' }}>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--navy-base)', textTransform: 'capitalize' }}>{drug}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{data.class}</span>
                  </td>
                  <td style={{ width: 120 }}>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--glass-shade)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${data.confidence * 100}%`, background: color, transition: 'width 1s ease-out' }} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                      borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: color, background: isR ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)'
                    }}>
                      {isR ? 'RESISTANT' : 'SUSCEPTIBLE'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
  
        {/* Summary */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--c-susceptible)' }}>{susceptible} Susceptible</span>
            {' · '}
            <span style={{ color: 'var(--c-resistant)' }}>{resistant} Resistant</span>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--c-intermediate)', letterSpacing: '0.05em' }}>
            {resistant >= 5 ? 'HIGH RISK' : resistant >= 3 ? 'MODERATE RISK' : 'LOW RISK'}
          </div>
        </div>
  
        {/* Gene tags */}
        {resistanceGenes && (
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-sub)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            Genotype:
            {resistanceGenes.map(g => (
              <span key={g.gene_id} style={{
                fontFamily: 'var(--font-mono)', background: 'var(--navy-base)',
                color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem'
              }}>{g.gene_id}</span>
            ))}
          </div>
        )}
      </article>
    );
  };
  
  export default Antibiogram;