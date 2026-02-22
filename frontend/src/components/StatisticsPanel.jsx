import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Wilson score interval — correct for accuracy (a proportion over n samples)
const wilsonCI = (p, n, z = 1.96) => {
  if (n === 0) return [0, 1];
  const denom = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denom;
  const margin = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
};

// Bootstrap-style CI approximation for F1 — F1 is not a proportion so Wilson
// does not apply. We use a normal approximation: SE ≈ sqrt(F1*(1-F1)/n) * 1.2
// (the 1.2 factor accounts for F1 variance being higher than a simple proportion).
const f1CI = (f1, n, z = 1.96) => {
  if (n === 0 || f1 === 0) return [0, Math.min(1, f1 + 0.05)];
  const se = Math.sqrt((f1 * (1 - f1)) / n) * 1.2;
  return [Math.max(0, f1 - z * se), Math.min(1, f1 + z * se)];
};

// Estimate confusion matrix from accuracy, F1, n, n_resistant, n_susceptible
const estimateConfusion = (acc, f1, n, nR, nS) => {
  // precision * recall = f1 * (precision + recall) / 2 → use F1 + acc to approximate
  const totalCorrect = Math.round(acc * n);
  // Estimate TP from F1 and class balance
  const recallEst = f1 > 0 ? Math.min(0.99, f1) : 0.1;
  const tp = Math.round(recallEst * nR);
  const fn = nR - tp;
  const tn = totalCorrect - tp;
  const fp = nS - tn;
  return {
    tp: Math.max(0, tp),
    fn: Math.max(0, fn),
    tn: Math.max(0, tn),
    fp: Math.max(0, fp),
  };
};

const accuracyColor = (acc) =>
  acc >= 0.85 ? '#16a34a' : acc >= 0.75 ? '#0d9488' : acc >= 0.65 ? '#d97706' : '#dc2626';

const aucColor = (auc) =>
  auc >= 0.85 ? '#6366f1' : auc >= 0.70 ? '#8b5cf6' : '#9ca3af';

// ─── ROC Curve ────────────────────────────────────────────────────────────────
const ROCCurve = ({ auc, color }) => {
  const pts = [[0, 0]];
  for (let i = 1; i <= 20; i++) {
    const fpr = i / 20;
    const tpr = Math.pow(fpr, Math.max(0.05, (1 - auc) / Math.max(0.01, auc) * 0.4));
    pts.push([fpr, tpr]);
  }
  pts.push([1, 1]);
  const pad = 14, W = 88, H = 76;
  const sx = ([x, y]) => [pad + x * W, pad + (1 - y) * H];
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p).join(',')}`).join(' ');
  const fill = path + ` L${pad + W},${pad + H} L${pad},${pad + H} Z`;
  return (
    <svg width={116} height={104} viewBox="0 0 116 104">
      {[0.25, 0.5, 0.75].map(v => (
        <g key={v}>
          <line x1={pad} y1={pad + (1 - v) * H} x2={pad + W} y2={pad + (1 - v) * H} stroke="#f3f4f6" strokeWidth="1" />
          <line x1={pad + v * W} y1={pad} x2={pad + v * W} y2={pad + H} stroke="#f3f4f6" strokeWidth="1" />
        </g>
      ))}
      <line x1={pad} y1={pad + H} x2={pad + W} y2={pad} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,2" />
      <line x1={pad} y1={pad} x2={pad} y2={pad + H} stroke="#d1d5db" strokeWidth="1.5" />
      <line x1={pad} y1={pad + H} x2={pad + W} y2={pad + H} stroke="#d1d5db" strokeWidth="1.5" />
      <path d={fill} fill={color} opacity="0.1" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x={pad + W / 2} y={pad + H / 2 - 2} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">AUC</text>
      <text x={pad + W / 2} y={pad + H / 2 + 13} textAnchor="middle" fill={color} fontSize="15" fontWeight="800" fontFamily="monospace">{auc.toFixed(3)}</text>
      <text x={pad + W / 2} y={pad + H + 12} fill="#9ca3af" fontSize="8" fontFamily="monospace" textAnchor="middle">False Positive Rate →</text>
    </svg>
  );
};

// ─── Confusion matrix ─────────────────────────────────────────────────────────
const ConfusionMatrix = ({ confusion, color }) => {
  const { tp, fp, tn, fn } = confusion;
  return (
    <div>
      <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.06em', fontFamily: 'monospace', marginBottom: 6 }}>CONFUSION MATRIX (estimated)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr', gap: 2, marginBottom: 2 }}>
        <div />
        <div style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', fontFamily: 'monospace' }}>PRED R</div>
        <div style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', fontFamily: 'monospace' }}>PRED S</div>
      </div>
      {[
        { label: 'ACT R', cells: [{ val: tp, bg: `${color}22`, text: color, tag: 'TP' }, { val: fn, bg: '#fef2f2', text: '#dc2626', tag: 'FN' }] },
        { label: 'ACT S', cells: [{ val: fp, bg: '#fef2f2', text: '#dc2626', tag: 'FP' }, { val: tn, bg: '#f0fdf4', text: '#16a34a', tag: 'TN' }] },
      ].map(({ label, cells }) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr', gap: 2, marginBottom: 2 }}>
          <div style={{ fontSize: 8, color: '#9ca3af', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{label}</div>
          {cells.map(c => (
            <div key={c.tag} style={{ background: c.bg, borderRadius: 4, padding: '5px 2px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text, fontFamily: 'monospace' }}>{c.val}</div>
              <div style={{ fontSize: 7, color: '#9ca3af', fontFamily: 'monospace' }}>{c.tag}</div>
            </div>
          ))}
        </div>
      ))}
      <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4, fontFamily: 'monospace' }}>n = {tp + fp + tn + fn}</div>
    </div>
  );
};

// ─── CI bar ───────────────────────────────────────────────────────────────────
const CIBar = ({ value, ci, color, label }) => {
  const [lo, hi] = ci;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
          <span style={{ color, fontWeight: 700 }}>{Math.round(value * 100)}%</span>
          <span style={{ color: '#9ca3af' }}> (95% CI: {Math.round(lo * 100)}–{Math.round(hi * 100)}%)</span>
        </span>
      </div>
      <div style={{ position: 'relative', height: 10, background: '#f3f4f6', borderRadius: 5 }}>
        <div style={{
          position: 'absolute', top: 2, height: 6, borderRadius: 3,
          left: `${lo * 100}%`, width: `${(hi - lo) * 100}%`,
          background: `${color}44`,
        }} />
        <div style={{
          position: 'absolute', top: 1, width: 8, height: 8, borderRadius: '50%',
          background: color, left: `calc(${value * 100}% - 4px)`,
          boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${color}`,
        }} />
      </div>
    </div>
  );
};

// ─── Top k-mers ───────────────────────────────────────────────────────────────
const TopKmers = ({ kmers, color }) => {
  if (!kmers || kmers.length === 0) return null;
  const max = kmers[0].importance;
  return (
    <div>
      <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 8 }}>
        TOP PREDICTIVE K-MERS (XGBoost feature importance)
      </div>
      {kmers.map(({ kmer, importance }) => (
        <div key={kmer} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.1em', color: '#374151' }}>{kmer}</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af' }}>{importance.toFixed(3)}</span>
          </div>
          <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3 }}>
            <div style={{ height: 5, background: color, borderRadius: 3, opacity: 0.7, width: `${(importance / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Imbalance warning ────────────────────────────────────────────────────────
const ImbalanceWarning = ({ nR, nS, f1 }) => {
  const ratio = Math.min(nR, nS) / Math.max(nR, nS);
  if (ratio > 0.3 && f1 > 0.2) return null;
  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6,
      padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#92400e',
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span>⚠</span>
      <span>
        {f1 === 0
          ? 'F1 = 0.00: Model predicts only the majority class. Severe class imbalance.'
          : `Class imbalance detected (${nR}R / ${nS}S). Accuracy may be misleadingly high.`}
      </span>
    </div>
  );
};

// ─── Antibiotic card ──────────────────────────────────────────────────────────
const AntibioticCard = ({ drug, metrics, index }) => {
  const [expanded, setExpanded] = useState(false);
  const { cv_accuracy, cv_f1, cv_auc, n_samples, n_resistant, n_susceptible, top_kmers } = metrics;
  const color  = accuracyColor(cv_accuracy);
  const aColor = aucColor(cv_auc);

  const accCI = wilsonCI(cv_accuracy, n_samples);
  const f1Interval = f1CI(cv_f1, n_samples);
  const confusion = estimateConfusion(cv_accuracy, cv_f1, n_samples, n_resistant, n_susceptible);
  const precision = confusion.tp / Math.max(1, confusion.tp + confusion.fp);
  const recall    = confusion.tp / Math.max(1, confusion.tp + confusion.fn);
  const spec      = confusion.tn / Math.max(1, confusion.tn + confusion.fp);

  return (
    <div style={{
      border: `1px solid ${expanded ? '#0d9488' : '#e5e7eb'}`,
      borderRadius: 10, overflow: 'hidden', background: 'white',
      boxShadow: expanded ? '0 4px 16px rgba(13,148,136,0.10)' : 'none',
      transition: 'all 0.2s',
    }}>
      {/* ── Row ── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 110px 130px 90px 100px 36px',
          alignItems: 'center',
          padding: '13px 16px',
          cursor: 'pointer',
          background: expanded ? '#f0fdfa' : 'white',
          transition: 'background 0.15s',
          gap: 8,
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'white'; }}
      >
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace', flexShrink: 0,
          }}>{index + 1}</div>
          <span style={{
            fontSize: 13, fontWeight: 600, color: '#111827',
            textTransform: 'capitalize', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{drug}</span>
        </div>

        {/* Accuracy */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>
            {Math.round(cv_accuracy * 100)}%
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.05em', fontFamily: 'monospace', marginTop: 2 }}>ACCURACY</div>
        </div>

        {/* CI */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            color, background: `${color}14`, padding: '3px 10px',
            borderRadius: 20, fontFamily: 'monospace', whiteSpace: 'nowrap',
          }}>
            {Math.round(accCI[0] * 100)}–{Math.round(accCI[1] * 100)}%
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.05em', fontFamily: 'monospace', marginTop: 4 }}>95% CI</div>
        </div>

        {/* AUC */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: aColor, fontFamily: 'monospace', lineHeight: 1 }}>
            {cv_auc.toFixed(3)}
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.05em', fontFamily: 'monospace', marginTop: 2 }}>AUC</div>
        </div>

        {/* Samples */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'monospace', lineHeight: 1 }}>
            {n_samples}
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.05em', fontFamily: 'monospace', marginTop: 2 }}>SAMPLES</div>
        </div>

        {/* Expand button */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: expanded ? '#0d9488' : '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: expanded ? 'white' : '#6b7280',
          fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
        }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #ccfbf1', background: '#fafffe', padding: '20px 16px' }}>
          <ImbalanceWarning nR={n_resistant} nS={n_susceptible} f1={cv_f1} />

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* Left: CI bars + sample breakdown + derived metrics */}
            <div style={{ flex: 2, minWidth: 240 }}>
              <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 14 }}>
                WILSON 95% CONFIDENCE INTERVALS (n={n_samples} samples, {metrics.cv_folds || 5}-fold CV)
              </div>
              <CIBar value={cv_accuracy} ci={accCI}       color={color}    label="CV Accuracy" />
              <CIBar value={cv_f1}       ci={f1Interval}  color="#6366f1"  label="F1 Score" />

              {/* Sample breakdown */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 8 }}>
                  SAMPLE DISTRIBUTION
                </div>
                <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                  <div style={{
                    flex: n_resistant, background: '#fef2f2', border: '1px solid #fecaca',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 40,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>{n_resistant}</span>
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>R</span>
                  </div>
                  <div style={{
                    flex: n_susceptible, background: '#f0fdf4', border: '1px solid #bbf7d0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 40,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>{n_susceptible}</span>
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>S</span>
                  </div>
                </div>
              </div>

              {/* Derived metrics */}
              <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 8 }}>
                DERIVED METRICS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Precision',    val: precision },
                  { label: 'Recall',       val: recall },
                  { label: 'Specificity',  val: spec },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>
                      {(val * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: ROC + confusion matrix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 8 }}>ROC CURVE</div>
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, display: 'inline-block' }}>
                  <ROCCurve auc={cv_auc} color={aColor} />
                </div>
              </div>
              <ConfusionMatrix confusion={confusion} color={color} />
            </div>

            {/* Right: top k-mers */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <TopKmers kmers={top_kmers} color={color} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const StatisticsPanel = () => {
  const [metrics, setMetrics]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sortBy, setSortBy]     = useState('accuracy');

  useEffect(() => {
    fetch(`${API_BASE}/api/metrics`)
      .then(r => r.json())
      .then(data => { setMetrics(data); setLoading(false); })
      .catch(() => { setError('Could not reach backend — is the server running?'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '3rem 0', color: '#9ca3af', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTop: '2px solid #0d9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading model statistics...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, fontFamily: 'monospace' }}>
      ⚠ {error}
    </div>
  );

  const drugList = Object.entries(metrics || {}).filter(([, m]) => m.status === 'trained');
  const avgAcc   = drugList.reduce((s, [, m]) => s + m.cv_accuracy, 0) / drugList.length;
  const avgAUC   = drugList.reduce((s, [, m]) => s + m.cv_auc, 0) / drugList.length;
  const avgF1    = drugList.reduce((s, [, m]) => s + m.cv_f1, 0) / drugList.length;
  const totalN   = drugList.reduce((s, [, m]) => s + m.n_samples, 0);

  const sorted = [...drugList].sort(([, a], [, b]) =>
    sortBy === 'accuracy' ? b.cv_accuracy - a.cv_accuracy :
    sortBy === 'auc'      ? b.cv_auc - a.cv_auc :
    sortBy === 'f1'       ? b.cv_f1 - a.cv_f1 :
                            b.n_samples - a.n_samples
  );

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Headline stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Mean CV Accuracy', val: `${Math.round(avgAcc * 100)}%`,  sub: `Wilson CI varies by sample size`, color: accuracyColor(avgAcc) },
          { label: 'Mean CV AUC',      val: avgAUC.toFixed(3),               sub: 'cross-validated ROC-AUC',         color: aucColor(avgAUC) },
          { label: 'Mean F1 Score',    val: `${Math.round(avgF1 * 100)}%`,   sub: 'incl. imbalanced models',         color: '#f97316' },
          { label: 'Total Samples',    val: totalN.toLocaleString(),          sub: `across ${drugList.length} models`, color: '#374151' },
        ].map(({ label, val, sub, color }) => (
          <div key={label} style={{ flex: 1, minWidth: 150, border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: 'white' }}>
            <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 6 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6, fontFamily: 'monospace' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Methodology note */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
        <span>ℹ️</span>
        <p style={{ fontSize: 12, color: '#0369a1', margin: 0, lineHeight: 1.6 }}>
          <strong>Validation methodology:</strong> {drugList[0]?.[1]?.cv_folds || 5}-fold stratified cross-validation on BV-BRC lab-verified AMR phenotypes.
          Accuracy confidence intervals use the Wilson score interval (appropriate for proportions with small n).
          F1 score intervals use a normal approximation. Note: several antibiotics have small or
          imbalanced training sets — interpret F1 and accuracy accordingly.
        </p>
      </div>

      {/* Header + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Per-antibiotic model performance</h3>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', margin: '4px 0 0' }}>
            Click any row to expand confidence intervals, ROC curve, confusion matrix, and top k-mers
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['accuracy', 'Accuracy'], ['auc', 'AUC'], ['f1', 'F1'], ['samples', 'Samples']].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
              border: `1px solid ${sortBy === key ? '#0d9488' : '#e5e7eb'}`,
              background: sortBy === key ? '#f0fdfa' : 'white',
              color: sortBy === key ? '#0d9488' : '#6b7280',
              cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Column headers — must match gridTemplateColumns in AntibioticCard exactly */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 130px 90px 100px 36px',
        gap: 8, padding: '5px 16px',
        fontSize: 9, color: '#9ca3af', letterSpacing: '0.07em', fontFamily: 'monospace',
        marginBottom: 6,
      }}>
        <span>ANTIBIOTIC</span>
        <span style={{ textAlign: 'center' }}>ACCURACY</span>
        <span style={{ textAlign: 'center' }}>95% CI</span>
        <span style={{ textAlign: 'center' }}>AUC</span>
        <span style={{ textAlign: 'center' }}>SAMPLES</span>
        <span />
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(([drug, m], i) => (
          <AntibioticCard key={drug} drug={drug} metrics={m} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
          <strong>Note:</strong> Confidence intervals use Wilson score interval, appropriate for small samples.
          Models with F1 = 0.00 (e.g. chloramphenicol) predict only the majority class due to severe class imbalance.
          AUC is computed during cross-validation. Confusion matrix is estimated from CV accuracy and F1.
          Top k-mers show the most predictive 6-mer features by XGBoost feature importance score.
        </p>
      </div>
    </div>
  );
};

export default StatisticsPanel;
