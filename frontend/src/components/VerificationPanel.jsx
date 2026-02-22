// components/VerificationPanel.jsx
import { useMemo } from "react";

const tagStyle = (tone) => {
  const map = {
    neutral: { bg: "#f3f4f6", fg: "#4b5563", bd: "#e5e7eb" },
    good:    { bg: "rgba(13,148,136,0.08)", fg: "#0f766e", bd: "rgba(13,148,136,0.25)" },
    warn:    { bg: "rgba(249,115,22,0.10)", fg: "#c2410c", bd: "rgba(249,115,22,0.30)" },
  };
  const t = map[tone] || map.neutral;
  return {
    display: "inline-flex", alignItems: "center",
    fontSize: 11, fontWeight: 600,
    padding: "3px 9px", borderRadius: 999,
    border: `1px solid ${t.bd}`,
    background: t.bg, color: t.fg, whiteSpace: "nowrap",
  };
};

const predColor = (val) =>
  val === 'resistant' ? '#dc2626' : val === 'susceptible' ? '#16a34a' : '#9ca3af';

export default function VerificationPanel({
  predictions = {},
  labResults = {},
  genomeInTrainingSet = false,
  genomeName = "",
}) {
  const rows = useMemo(() =>
    Object.entries(predictions).map(([drug, pred]) => {
      const predicted = pred?.prediction;
      const actual = labResults?.[drug];
      const comparable = actual === "resistant" || actual === "susceptible";
      const match = comparable ? predicted === actual : null;
      return { drug, predicted, actual, match };
    }), [predictions, labResults]);

  const scored = rows.filter(r => r.match !== null);
  const accuracy = scored.length
    ? Math.round((scored.filter(r => r.match).length / scored.length) * 100)
    : null;

  // Truncate long genome names
  const shortName = genomeName.length > 32
    ? genomeName.slice(0, 32) + '…'
    : (genomeName || 'unknown');

  return (
    <aside style={{
      width: 400, maxWidth: "100%",
      border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "16px 18px", background: "white",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Verification</div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={tagStyle(genomeInTrainingSet ? "warn" : "good")}>
            {genomeInTrainingSet ? "In training set" : "Excluded from training"}
          </span>
          {accuracy !== null && (
            <span style={tagStyle("neutral")}>Accuracy: {accuracy}%</span>
          )}
        </div>
      </div>

      {/* Genome name */}
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14, fontFamily: "monospace" }}>
        {shortName}
      </div>

      {/* Table — no fixed height, no scroll */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
            {["Antibiotic", "Predicted", "Lab result", "Match?"].map(h => (
              <th key={h} style={{
                textAlign: h === "" ? "right" : "left",
                padding: "7px 8px", color: "#9ca3af",
                fontWeight: 600, fontSize: 10, letterSpacing: "0.05em",
              }}>{h.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const hasLab = r.match !== null;
            return (
              <tr key={r.drug} style={{
                borderBottom: idx < rows.length - 1 ? "1px solid #f9fafb" : "none",
              }}>
                <td style={{ padding: "8px 8px", color: "#374151", textTransform: "capitalize" }}>
                  {r.drug}
                </td>
                <td style={{ padding: "8px 8px", fontWeight: 600, color: predColor(r.predicted) }}>
                  {r.predicted ? r.predicted[0].toUpperCase() + r.predicted.slice(1) : "—"}
                </td>
                <td style={{ padding: "8px 8px", fontWeight: 600, color: predColor(r.actual) }}>
                  {r.actual ? r.actual[0].toUpperCase() + r.actual.slice(1) : (
                    <span style={{ color: "#d1d5db", fontWeight: 400 }}>—</span>
                  )}
                </td>
                <td style={{ padding: "8px 8px", textAlign: "right" }}>
                  {hasLab ? (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                      background: r.match ? "#f0fdf4" : "#fef2f2",
                      color: r.match ? "#16a34a" : "#dc2626",
                      border: `1px solid ${r.match ? "#bbf7d0" : "#fecaca"}`,
                    }}>
                      {r.match ? "✓" : "✗"}
                    </span>
                  ) : (
                    <span style={{ color: "#e5e7eb", fontSize: 12 }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </aside>
  );
}
