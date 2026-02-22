const VerificationPanel = ({ predictions, verification }) => {
  // Only show if there are lab results to compare
  const verified = Object.entries(predictions).filter(([, d]) => d.lab_result);
  if (verified.length === 0) return null;

  const matches = verified.filter(([, d]) => d.match === true).length;
  const mismatches = verified.filter(([, d]) => d.match === false).length;
  const accuracy = verified.length > 0 ? matches / verified.length : 0;

  const inTraining = verification?.in_training_set;

  return (
    <article style={{
      background: 'var(--glass-white)', borderRadius: 'var(--radius-lg)',
      padding: '2rem', boxShadow: 'var(--shadow-glass)',
      border: '1px solid var(--border-hairline)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: '1.5rem', paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-hairline)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--navy-base)', fontWeight: 700 }}>
            Lab Verification
          </h2>
          <span style={{
            fontFamily: 'var(--font-mono)', color: 'var(--text-sub)', fontSize: '0.9rem',
          }}>
            Model prediction vs. laboratory result
          </span>
        </div>
        {inTraining !== undefined && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem',
            borderRadius: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
            background: inTraining ? 'rgba(241,196,15,0.1)' : 'rgba(46,204,113,0.1)',
            color: inTraining ? 'var(--c-intermediate)' : 'var(--c-susceptible)',
            border: `1px solid ${inTraining ? 'rgba(241,196,15,0.3)' : 'rgba(46,204,113,0.3)'}`,
          }}>
            {inTraining ? 'IN TRAINING SET' : 'UNSEEN GENOME'}
          </span>
        )}
      </div>

      {/* Accuracy summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.5rem', padding: '1rem',
        background: 'var(--glass-shade)', borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accuracy >= 0.8 ? 'rgba(46,204,113,0.15)' : accuracy >= 0.5 ? 'rgba(241,196,15,0.15)' : 'rgba(231,76,60,0.15)',
          border: `2px solid ${accuracy >= 0.8 ? 'var(--c-susceptible)' : accuracy >= 0.5 ? 'var(--c-intermediate)' : 'var(--c-resistant)'}`,
        }}>
          <span style={{
            fontWeight: 800, fontSize: '1.1rem',
            fontFamily: 'var(--font-mono)',
            color: accuracy >= 0.8 ? 'var(--c-susceptible)' : accuracy >= 0.5 ? 'var(--c-intermediate)' : 'var(--c-resistant)',
          }}>
            {Math.round(accuracy * 100)}%
          </span>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--navy-base)', fontSize: '1rem' }}>
            {matches}/{verified.length} Correct
          </div>
          <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
            {matches} match{matches !== 1 ? 'es' : ''} · {mismatches} mismatch{mismatches !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* Per-antibiotic comparison */}
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
        <thead>
          <tr style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-sub)', letterSpacing: '0.08em' }}>
            <th style={{ textAlign: 'left', fontWeight: 600, padding: '0 0.5rem' }}>ANTIBIOTIC</th>
            <th style={{ textAlign: 'center', fontWeight: 600 }}>PREDICTED</th>
            <th style={{ textAlign: 'center', fontWeight: 600 }}>LAB RESULT</th>
            <th style={{ textAlign: 'center', fontWeight: 600 }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {verified.map(([drug, data], index) => {
            const isMatch = data.match === true;
            return (
              <tr key={drug} style={{
                opacity: 0, animation: `slideInRight 0.3s ease forwards ${0.1 + index * 0.05}s`,
              }}>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--navy-base)', textTransform: 'capitalize' }}>
                  {drug}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <PhenotypeBadge value={data.prediction} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <PhenotypeBadge value={data.lab_result?.toLowerCase()} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                    borderRadius: 4, fontFamily: 'var(--font-mono)',
                    color: isMatch ? 'var(--c-susceptible)' : 'var(--c-resistant)',
                    background: isMatch ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                  }}>
                    {isMatch ? 'MATCH' : 'MISMATCH'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
};

const PhenotypeBadge = ({ value }) => {
  const isR = value === 'resistant';
  const color = isR ? 'var(--c-resistant)' : 'var(--c-susceptible)';
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
      borderRadius: 3, letterSpacing: '0.05em', textTransform: 'uppercase',
      color, background: isR ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
    }}>
      {isR ? 'R' : 'S'}
    </span>
  );
};

export default VerificationPanel;
