// components/ShapExplanation.jsx
import { useMemo, useState } from "react";

const badge = (dir) => {
  const towardR = dir === "toward_resistant";
  return {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 999,
    border: `1px solid ${towardR ? "rgba(220,38,38,0.25)" : "rgba(22,163,74,0.25)"}`,
    background: towardR ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
    color: towardR ? "#dc2626" : "#16a34a",
    whiteSpace: "nowrap",
  };
};

export default function ShapExplanation({ shap = {}, predictions = {} }) {
  const antibiotics = useMemo(() => {
    const fromShap = Object.keys(shap || {});
    const fromPred = Object.keys(predictions || {});
    // Prefer ones that actually have SHAP
    return fromShap.length ? fromShap : fromPred;
  }, [shap, predictions]);

  const [selected, setSelected] = useState(antibiotics?.[0] || "");
  const items = (shap?.[selected] || []).slice(0, 10);

  const maxAbs = useMemo(() => {
    const vals = items.map((x) => Math.abs(x.importance || 0));
    return Math.max(1e-9, ...vals);
  }, [items]);

  const pred = predictions?.[selected]?.prediction;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
            SHAP explanation (top DNA patterns)
          </h3>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
            Shows which genomic patterns most influenced the model’s decision for a selected antibiotic.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Antibiotic</div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              color: "#111827",
              background: "white",
              outline: "none",
              minWidth: 220,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          >
            {antibiotics.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {pred && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                color: "#111827",
                background: "#f9fafb",
                textTransform: "capitalize",
              }}
            >
              Pred: {pred}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "white" }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            No SHAP data available for <span style={{ fontFamily: "monospace" }}>{selected}</span>.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it, idx) => {
              const imp = it.importance || 0;
              const w = Math.round((Math.abs(imp) / maxAbs) * 100);
              const towardR = it.direction === "toward_resistant";

              return (
                <div key={`${it.pattern}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 280px 120px", gap: 12, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.pattern}
                    </div>
                    {it.note && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {it.note}
                      </div>
                    )}
                  </div>

                  <div style={{ height: 10, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${w}%`,
                        background: towardR ? "rgba(220,38,38,0.60)" : "rgba(22,163,74,0.60)",
                      }}
                      title={`|importance| = ${Math.abs(imp).toFixed(4)}`}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
                      {imp >= 0 ? "+" : "-"}
                      {Math.abs(imp).toFixed(3)}
                    </span>
                    <span style={badge(towardR ? "toward_resistant" : "toward_susceptible")}>
                      {towardR ? "→ R" : "→ S"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f3f4f6", fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
          Interpretation: bars show feature impact magnitude. Labels show direction of influence toward a Resistant (R) or Susceptible (S) call.
        </div>
      </div>
    </div>
  );
}