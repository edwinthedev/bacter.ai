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
  val === "resistant" ? "#dc2626" : val === "susceptible" ? "#16a34a" : "#9ca3af";

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

  const shortName = genomeName.length > 36
    ? genomeName.slice(0, 36) + "…"
    : (genomeName || "unknown");

  const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";

  return (
    <aside style={{
      width: 460, maxWidth: "100%",
      border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "18px 20px", background: "white",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
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
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16, fontFamily: "monospace" }}>
        {shortName}
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left",   padding: "6px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em" }}>ANTIBIOTIC</th>
            <th style={{ textAlign: "center", padding: "6px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em" }}>PREDICTED</th>
            <th style={{ textAlign: "center", padding: "6px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em" }}>LAB RESULT</th>
            <th style={{ textAlign: "center", padding: "6px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em" }}>MATCH?</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.drug} style={{
              borderBottom: idx < rows.length - 1 ? "1px solid #f3f4f6" : "none",
              background: "white",
            }}>
              {/* Antibiotic */}
              <td style={{ padding: "9px 8px", color: "#374151", textTransform: "capitalize", fontSize: 13 }}>
                {r.drug}
              </td>

              {/* Predicted */}
              <td style={{ padding: "9px 8px", textAlign: "center", fontWeight: 600, color: predColor(r.predicted), fontSize: 13 }}>
                {r.predicted ? cap(r.predicted) : <span style={{ color: "#d1d5db" }}>—</span>}
              </td>

              {/* Lab result */}
              <td style={{ padding: "9px 8px", textAlign: "center", fontWeight: 600, color: predColor(r.actual), fontSize: 13 }}>
                {r.actual ? cap(r.actual) : (
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                    background: "#f9fafb", color: "#9ca3af", border: "1px solid #e5e7eb",
                  }}>N/A</span>
                )}
              </td>

              {/* Match */}
              <td style={{ padding: "9px 8px", textAlign: "center" }}>
                {r.match !== null ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                    background: r.match ? "#f0fdf4" : "#fef2f2",
                    color: r.match ? "#16a34a" : "#dc2626",
                    border: `1px solid ${r.match ? "#bbf7d0" : "#fecaca"}`,
                  }}>
                    {r.match ? "✓ Match" : "✗ Mismatch"}
                  </span>
                ) : (
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 6,
                    background: "#f9fafb", color: "#9ca3af", border: "1px solid #e5e7eb",
                  }}>N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
