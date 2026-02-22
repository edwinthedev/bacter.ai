import { useState } from 'react';

const ShapChart = ({ predictions }) => {
  const antibiotics = Object.entries(predictions).filter(
    ([, d]) => d.top_kmers && d.top_kmers.length > 0
  );

  const [selected, setSelected] = useState(antibiotics[0]?.[0] || null);

  if (antibiotics.length === 0) return null;

  const selectedData = predictions[selected];
  const kmers = selectedData?.top_kmers || [];
  const maxImportance = Math.max(...kmers.map(k => k.importance), 0.001);

  return (
    <article style={{
      background: 'var(--glass-white)', borderRadius: 'var(--radius-lg)',
      padding: '2rem', boxShadow: 'var(--shadow-glass)',
      border: '1px solid var(--border-hairline)',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem', paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-hairline)',
      }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--navy-base)', fontWeight: 700 }}>
          Feature Importance
        </h2>
        <span style={{
          fontFamily: 'var(--font-mono)', color: 'var(--text-sub)', fontSize: '0.9rem',
        }}>
          Top k-mer features driving each prediction (SHAP)
        </span>
      </div>

      {/* Antibiotic selector pills */}
      <div style={{
        display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem',
      }}>
        {antibiotics.map(([drug, data]) => {
          const isActive = drug === selected;
          const isR = data.prediction === 'resistant';
          return (
            <button
              key={drug}
              onClick={() => setSelected(drug)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: 6,
                fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-mono)',
                cursor: 'pointer', transition: 'all 0.15s',
                textTransform: 'capitalize',
                border: isActive ? 'none' : '1px solid var(--border-hairline)',
                background: isActive ? 'var(--navy-base)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-sub)',
              }}
            >
              {drug}
              <span style={{
                marginLeft: 4, fontSize: '0.6rem',
                color: isActive ? (isR ? '#fca5a5' : '#86efac') : (isR ? 'var(--c-resistant)' : 'var(--c-susceptible)'),
              }}>
                {isR ? 'R' : 'S'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Prediction context */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center',
      }}>
        <span style={{
          fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem',
          borderRadius: 4, textTransform: 'capitalize',
          color: selectedData?.prediction === 'resistant' ? 'var(--c-resistant)' : 'var(--c-susceptible)',
          background: selectedData?.prediction === 'resistant' ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
        }}>
          {selectedData?.prediction}
        </span>
        <span style={{
          fontSize: '0.8rem', color: 'var(--text-sub)', fontFamily: 'var(--font-mono)',
        }}>
          confidence: {((selectedData?.confidence || 0) * 100).toFixed(1)}%
        </span>
      </div>

      {/* SHAP bar chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {kmers.map((kmer, index) => {
          const barWidth = (kmer.importance / maxImportance) * 100;
          const isR = selectedData?.prediction === 'resistant';
          const barColor = isR ? 'var(--c-resistant)' : 'var(--c-susceptible)';

          return (
            <div
              key={kmer.kmer}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                opacity: 0, animation: `slideInRight 0.3s ease forwards ${index * 0.04}s`,
              }}
            >
              {/* K-mer label */}
              <code style={{
                width: 72, textAlign: 'right', flexShrink: 0,
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                fontWeight: 600, color: 'var(--navy-base)',
                letterSpacing: '0.05em',
              }}>
                {kmer.kmer}
              </code>

              {/* Bar */}
              <div style={{ flex: 1, height: 20, position: 'relative' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: 'var(--glass-shade)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${barWidth}%`,
                    background: barColor,
                    opacity: 0.7 - (index * 0.04),
                    transition: 'width 0.6s ease-out',
                  }} />
                </div>
              </div>

              {/* Value */}
              <span style={{
                width: 50, textAlign: 'right', flexShrink: 0,
                fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                color: 'var(--text-sub)',
              }}>
                {kmer.importance.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer explanation */}
      <div style={{
        marginTop: '1.25rem', paddingTop: '1rem',
        borderTop: '1px solid var(--border-hairline)',
        fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5,
      }}>
        SHAP (SHapley Additive exPlanations) values show which 6-mer DNA
        sequences most influenced the model's prediction. Higher values
        indicate stronger contribution to the resistance/susceptibility call.
      </div>
    </article>
  );
};

export default ShapChart;
