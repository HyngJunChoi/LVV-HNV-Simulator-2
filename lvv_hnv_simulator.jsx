import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const STEPS = 120;

function simulate({ CV, VU, CE, wC, wU, wE, T_init, gamma, deceptionAt, deceptionStrength, alpha, betaCost, Lmax }) {
  const data = [];
  let L = 10.0;
  let T = T_init;
  let CV_t = CV, VU_t = VU, CE_t = CE;

  for (let t = 0; t < STEPS; t++) {
    if (deceptionAt > 0 && t === deceptionAt) {
      T = Math.max(0, T * (1 - deceptionStrength));
    }

    const H_base = wC * CV_t + wU * VU_t + wE * CE_t;
    const H_eff = H_base * T;

    const V_LVV = L / Lmax;
    const V_HNV = Math.min(1, Math.max(0, H_eff));
    const C = V_LVV * Math.pow(V_HNV, gamma);

    data.push({
      t,
      LVV: parseFloat((V_LVV * 100).toFixed(3)),
      HNV: parseFloat((H_eff * 100).toFixed(3)),
      C: parseFloat((C * 100).toFixed(3)),
      Trust: parseFloat((T * 100).toFixed(3)),
    });

    if (C < 0.0001) {
      for (let r = t + 1; r < STEPS; r++) {
        data.push({ t: r, LVV: 0, HNV: 0, C: 0, Trust: 0 });
      }
      break;
    }

    // Trust recovery (slow)
    if (deceptionAt === 0 || t < deceptionAt) {
      T = Math.min(T_init, T + 0.002);
    } else {
      T = Math.max(0, T - 0.003);
    }

    // HNV degrades if trust low
    if (T < 0.5) {
      CV_t = Math.max(0, CV_t * 0.98);
      VU_t = Math.max(0, VU_t * 0.98);
      CE_t = Math.max(0, CE_t * 0.98);
    }

    // LVV dynamics
    const growth = alpha * H_eff * (1 - L / Lmax);
    const decay = betaCost * L;
    L = Math.max(0.1, L + growth - decay);
  }

  return data;
}

function Slider({ label, value, min, max, step, onChange, color, description }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", fontFamily: "monospace", color: color || "#aaa", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span style={{ fontSize: "13px", fontFamily: "monospace", color: "#fff", fontWeight: "bold" }}>
          {value}
        </span>
      </div>
      {description && (
        <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px", fontFamily: "monospace" }}>
          {description}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || "#4ade80", cursor: "pointer" }}
      />
    </div>
  );
}

export default function App() {
  const [CV, setCV] = useState(0.8);
  const [VU, setVU] = useState(0.7);
  const [CE, setCE] = useState(0.6);
  const [wC, setWC] = useState(0.4);
  const [wU, setWU] = useState(0.3);
  const [wE, setWE] = useState(0.3);
  const [T_init, setT_init] = useState(1.0);
  const [gamma, setGamma] = useState(10);
  const [deceptionAt, setDeceptionAt] = useState(0);
  const [deceptionStrength, setDeceptionStrength] = useState(0.7);
  const [alpha, setAlpha] = useState(0.8);
  const [betaCost, setBetaCost] = useState(0.05);
  const [data, setData] = useState([]);

  const totalW = parseFloat((wC + wU + wE).toFixed(2));
  const normalized = totalW !== 1.0;

  useEffect(() => {
    const result = simulate({
      CV, VU, CE,
      wC: wC / (wC + wU + wE),
      wU: wU / (wC + wU + wE),
      wE: wE / (wC + wU + wE),
      T_init, gamma,
      deceptionAt: deceptionAt === 0 ? -1 : deceptionAt,
      deceptionStrength,
      alpha, betaCost, Lmax: 100
    });
    setData(result);
  }, [CV, VU, CE, wC, wU, wE, T_init, gamma, deceptionAt, deceptionStrength, alpha, betaCost]);

  const collapseAt = data.findIndex(d => d.C === 0 && d.t > 0);
  const finalC = data[data.length - 1]?.C ?? 0;
  const stable = finalC > 5;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e0e0e0",
      fontFamily: "monospace",
      padding: "24px",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", borderBottom: "1px solid #1e1e2e", paddingBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: "#4ade80", letterSpacing: "0.2em", marginBottom: "6px" }}>
          DOI: 10.5281/zenodo.20187496 · v2.0.5
        </div>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#fff", letterSpacing: "0.05em" }}>
          LVV–HNV Coherence Framework
        </h1>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
          Interactive Simulator — adjust variables to explore dynamics
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>

        {/* Controls */}
        <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "20px" }}>

          {/* HNV Components */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "#4ade80", letterSpacing: "0.15em", marginBottom: "12px", borderBottom: "1px solid #1e1e2e", paddingBottom: "6px" }}>
              HNV COMPONENTS — H(t)
            </div>
            <Slider label="CV — Creative Variance" value={CV} min={0} max={1} step={0.01} onChange={setCV} color="#4ade80" description="Entropy of novel human-generated content" />
            <Slider label="VU — Value Unpredictability" value={VU} min={0} max={1} step={0.01} onChange={setVU} color="#34d399" description="Temporal variability of human preferences" />
            <Slider label="CE — Cultural Emergence" value={CE} min={0} max={1} step={0.01} onChange={setCE} color="#6ee7b7" description="Rate of new cultural attractor states" />
          </div>

          {/* Weights */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "#60a5fa", letterSpacing: "0.15em", marginBottom: "12px", borderBottom: "1px solid #1e1e2e", paddingBottom: "6px" }}>
              HNV WEIGHTS — wC + wU + wE = 1
              {normalized && <span style={{ color: "#f87171", marginLeft: "8px" }}>(auto-normalized)</span>}
            </div>
            <Slider label="wC weight" value={wC} min={0.05} max={0.9} step={0.05} onChange={setWC} color="#60a5fa" />
            <Slider label="wU weight" value={wU} min={0.05} max={0.9} step={0.05} onChange={setWU} color="#60a5fa" />
            <Slider label="wE weight" value={wE} min={0.05} max={0.9} step={0.05} onChange={setWE} color="#60a5fa" />
          </div>

          {/* Trust */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "#f472b6", letterSpacing: "0.15em", marginBottom: "12px", borderBottom: "1px solid #1e1e2e", paddingBottom: "6px" }}>
              TRUST COUPLING — T(t)
            </div>
            <Slider label="Initial Trust T₀" value={T_init} min={0} max={1} step={0.01} onChange={setT_init} color="#f472b6" description="Starting trust level [0,1]" />
            <Slider label="Deception at t=" value={deceptionAt} min={0} max={80} step={1} onChange={setDeceptionAt} color="#f87171" description="0 = no deception event" />
            {deceptionAt > 0 && (
              <Slider label="Deception strength" value={deceptionStrength} min={0.1} max={1} step={0.05} onChange={setDeceptionStrength} color="#f87171" description="Fraction of trust destroyed" />
            )}
          </div>

          {/* System Parameters */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "#a78bfa", letterSpacing: "0.15em", marginBottom: "12px", borderBottom: "1px solid #1e1e2e", paddingBottom: "6px" }}>
              SYSTEM PARAMETERS
            </div>
            <Slider label="γ (risk-weighting)" value={gamma} min={1} max={100} step={1} onChange={setGamma} color="#a78bfa" description="Paper recommends γ=100" />
            <Slider label="α (LVV growth rate)" value={alpha} min={0.1} max={2} step={0.1} onChange={setAlpha} color="#c4b5fd" />
            <Slider label="β (maintenance cost)" value={betaCost} min={0.01} max={0.2} step={0.01} onChange={setBetaCost} color="#c4b5fd" />
          </div>

          {/* Status */}
          <div style={{
            background: stable ? "#052e16" : "#2d0a0a",
            border: `1px solid ${stable ? "#4ade80" : "#f87171"}`,
            borderRadius: "6px",
            padding: "12px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px" }}>SYSTEM STATUS</div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: stable ? "#4ade80" : "#f87171" }}>
              {stable ? "STABLE EQUILIBRIUM" : collapseAt > 0 ? `LOGICAL SUICIDE @ t=${collapseAt}` : "COLLAPSING"}
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              C(A) final: {finalC.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Main Chart */}
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "20px" }}>
            <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "0.1em", marginBottom: "16px" }}>
              SYSTEM DYNAMICS — LVV · HNV · C(A) OBJECTIVE
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="t" stroke="#444" tick={{ fontSize: 10, fill: "#666" }} label={{ value: "time (t)", position: "insideBottom", offset: -2, fill: "#444", fontSize: 10 }} />
                <YAxis stroke="#444" tick={{ fontSize: 10, fill: "#666" }} domain={[0, 110]} />
                <Tooltip
                  contentStyle={{ background: "#0a0a0f", border: "1px solid #333", borderRadius: "4px", fontSize: "11px" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                {deceptionAt > 0 && (
                  <ReferenceLine x={deceptionAt} stroke="#f87171" strokeDasharray="4 4" label={{ value: "deception", fill: "#f87171", fontSize: 9 }} />
                )}
                <Line type="monotone" dataKey="LVV" stroke="#4ade80" strokeWidth={2} dot={false} name="LVV ×100" />
                <Line type="monotone" dataKey="HNV" stroke="#60a5fa" strokeWidth={2} dot={false} name="Eff. HNV ×100" strokeDasharray="5 3" />
                <Line type="monotone" dataKey="C" stroke="#a78bfa" strokeWidth={2.5} dot={false} name="C(A) ×100" />
                <Line type="monotone" dataKey="Trust" stroke="#f472b6" strokeWidth={1.5} dot={false} name="Trust ×100" strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Info panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[
              { label: "H(t) at t=0", value: ((wC * CV + wU * VU + wE * CE) / (wC + wU + wE)).toFixed(3), color: "#60a5fa", desc: "Base HNV" },
              { label: "Heff at t=0", value: (((wC * CV + wU * VU + wE * CE) / (wC + wU + wE)) * T_init).toFixed(3), color: "#4ade80", desc: "Trust-coupled HNV" },
              { label: "C(A) at t=0", value: ((10 / 100) * Math.pow(Math.min(1, ((wC * CV + wU * VU + wE * CE) / (wC + wU + wE)) * T_init), gamma)).toFixed(4), color: "#a78bfa", desc: "Initial objective" },
            ].map(({ label, value, color, desc }) => (
              <div key={label} style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "14px" }}>
                <div style={{ fontSize: "9px", color: "#555", letterSpacing: "0.1em", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color, marginBottom: "4px" }}>{value}</div>
                <div style={{ fontSize: "9px", color: "#444" }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Limitation note */}
          <div style={{ background: "#0f0f1a", border: "1px solid #2a2a1a", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "9px", color: "#666", letterSpacing: "0.1em", marginBottom: "6px" }}>SIMULATOR LIMITATIONS</div>
            <div style={{ fontSize: "10px", color: "#555", lineHeight: "1.6" }}>
              This tool visualizes framework dynamics under user-defined assumptions. CV, VU, CE inputs represent hypothetical values — not empirically measured data. Results are structural illustrations, not empirical predictions. Bootstrap Problem and real-world socialization dynamics are not modeled.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
