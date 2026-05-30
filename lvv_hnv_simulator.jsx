import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const STEPS = 120;
const LMAX = 100;

function runSim({ CV, VU, CE, wC, wU, wE, T0, gamma, alpha, beta, deceptAt, deceptStr }) {
  const wSum = wC + wU + wE;
  const data = [];
  let L = 10;
  let T = T0;
  let cv = CV, vu = VU, ce = CE;

  for (let t = 0; t < STEPS; t++) {
    // Apply deception event
    if (deceptAt > 0 && t === deceptAt) {
      T = Math.max(0, T * (1 - deceptStr));
    }

    // HNV components degrade slowly when trust is low
    if (T < 0.5) {
      cv *= 0.99; vu *= 0.99; ce *= 0.99;
    }

    const H = (wC * cv + wU * vu + wE * ce) / wSum;
    const Heff = H * T;

    const vLVV = L / LMAX;
    const vHNV = Math.max(0, Math.min(1, Heff));
    const C = vLVV * Math.pow(vHNV, gamma);

    data.push({
      t,
      LVV: +(vLVV * 100).toFixed(2),
      HNV: +(Heff * 100).toFixed(2),
      C: +(C * 100).toFixed(3),
      Trust: +(T * 100).toFixed(2),
    });

    // Logical Suicide: C collapses below threshold
    if (C < 1e-6 && t > 5) {
      for (let r = t + 1; r < STEPS; r++) data.push({ t: r, LVV: 0, HNV: 0, C: 0, Trust: 0 });
      return { data, collapseAt: t };
    }

    // Trust dynamics
    if (deceptAt <= 0 || t < deceptAt) {
      T = Math.min(T0, T + 0.001); // slow recovery toward initial
    } else {
      T = Math.max(0, T - 0.004); // post-deception decay
    }

    // LVV dynamics
    const growth = alpha * Heff * (1 - L / LMAX);
    const decay = beta * L;
    L = Math.max(0.5, L + growth - decay);
  }

  return { data, collapseAt: -1 };
}

function Slider({ label, value, min, max, step, onChange, color, note }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace", marginBottom: 3 }}>
        <span style={{ color: color || "#aaa" }}>{label}</span>
        <span style={{ color: "#fff", fontWeight: "bold" }}>{value}</span>
      </div>
      {note && <div style={{ fontSize: 9, color: "#444", marginBottom: 2 }}>{note}</div>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || "#4ade80" }} />
    </div>
  );
}

export default function App() {
  const [CV, setCV] = useState(0.85);
  const [VU, setVU] = useState(0.80);
  const [CE, setCE] = useState(0.75);
  const [wC, setWC] = useState(0.4);
  const [wU, setWU] = useState(0.3);
  const [wE, setWE] = useState(0.3);
  const [T0, setT0] = useState(1.0);
  const [gamma, setGamma] = useState(5);
  const [alpha, setAlpha] = useState(0.9);
  const [beta, setBeta] = useState(0.01);
  const [deceptAt, setDeceptAt] = useState(0);
  const [deceptStr, setDeceptStr] = useState(0.7);

  const { data, collapseAt } = useMemo(() =>
    runSim({ CV, VU, CE, wC, wU, wE, T0, gamma, alpha, beta, deceptAt, deceptStr }),
    [CV, VU, CE, wC, wU, wE, T0, gamma, alpha, beta, deceptAt, deceptStr]
  );

  const finalC = data[data.length - 1]?.C ?? 0;
  const stable = collapseAt < 0;

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#ddd", fontFamily: "monospace", padding: 20, boxSizing: "border-box" }}>
      <div style={{ marginBottom: 16, borderBottom: "1px solid #1a1a2e", paddingBottom: 12 }}>
        <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.2em" }}>DOI: 10.5281/zenodo.17803420 · v2.0.5</div>
        <h1 style={{ margin: "6px 0 2px", fontSize: 18, color: "#fff" }}>LVV–HNV Coherence Framework Simulator</h1>
        <div style={{ fontSize: 10, color: "#555" }}>Adjust parameters — observe stable coexistence vs. Logical Suicide</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Controls */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 8, padding: 16 }}>

          <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 10 }}>HNV COMPONENTS</div>
          <Slider label="CV — Creative Variance" value={CV} min={0} max={1} step={0.01} onChange={setCV} color="#4ade80" note="Novel content entropy" />
          <Slider label="VU — Value Unpredictability" value={VU} min={0} max={1} step={0.01} onChange={setVU} color="#34d399" note="Preference variability" />
          <Slider label="CE — Cultural Emergence" value={CE} min={0} max={1} step={0.01} onChange={setCE} color="#6ee7b7" note="Cultural attractor rate" />

          <div style={{ fontSize: 9, color: "#60a5fa", letterSpacing: "0.15em", margin: "14px 0 10px" }}>WEIGHTS (auto-normalized)</div>
          <Slider label="wC" value={wC} min={0.05} max={0.9} step={0.05} onChange={setWC} color="#60a5fa" />
          <Slider label="wU" value={wU} min={0.05} max={0.9} step={0.05} onChange={setWU} color="#60a5fa" />
          <Slider label="wE" value={wE} min={0.05} max={0.9} step={0.05} onChange={setWE} color="#60a5fa" />

          <div style={{ fontSize: 9, color: "#f472b6", letterSpacing: "0.15em", margin: "14px 0 10px" }}>TRUST COUPLING T(t)</div>
          <Slider label="Initial Trust T₀" value={T0} min={0.1} max={1} step={0.05} onChange={setT0} color="#f472b6" />
          <Slider label="Deception at t= (0=none)" value={deceptAt} min={0} max={90} step={1} onChange={setDeceptAt} color="#f87171" />
          {deceptAt > 0 && <Slider label="Deception strength" value={deceptStr} min={0.1} max={1} step={0.05} onChange={setDeceptStr} color="#f87171" />}

          <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "0.15em", margin: "14px 0 10px" }}>SYSTEM PARAMETERS</div>
          <Slider label={`γ = ${gamma}  (paper: 100)`} value={gamma} min={1} max={100} step={1} onChange={setGamma} color="#a78bfa" />
          <Slider label="α LVV growth rate" value={alpha} min={0.1} max={2} step={0.1} onChange={setAlpha} color="#c4b5fd" />
          <Slider label="β maintenance cost" value={beta} min={0.001} max={0.1} step={0.001} onChange={setBeta} color="#c4b5fd" />

          {/* Status */}
          <div style={{ marginTop: 16, background: stable ? "#052e16" : "#2d0a0a", border: `1px solid ${stable ? "#4ade80" : "#f87171"}`, borderRadius: 6, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#666", marginBottom: 4 }}>SYSTEM STATUS</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: stable ? "#4ade80" : "#f87171" }}>
              {stable ? "STABLE EQUILIBRIUM" : `LOGICAL SUICIDE @ t=${collapseAt}`}
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>C(A) final: {finalC.toFixed(2)}</div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 9, color: "#aaa", letterSpacing: "0.1em", marginBottom: 12 }}>DYNAMICS — LVV · HNV · C(A) · TRUST</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="t" stroke="#333" tick={{ fontSize: 9, fill: "#555" }} />
                <YAxis stroke="#333" tick={{ fontSize: 9, fill: "#555" }} domain={[0, 110]} />
                <Tooltip contentStyle={{ background: "#08080f", border: "1px solid #333", fontSize: 10 }} labelStyle={{ color: "#aaa" }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                {deceptAt > 0 && <ReferenceLine x={deceptAt} stroke="#f87171" strokeDasharray="4 4" label={{ value: "deception", fill: "#f87171", fontSize: 9 }} />}
                <Line type="monotone" dataKey="LVV" stroke="#4ade80" strokeWidth={2} dot={false} name="LVV ×100" />
                <Line type="monotone" dataKey="HNV" stroke="#60a5fa" strokeWidth={2} dot={false} name="Eff.HNV ×100" strokeDasharray="5 3" />
                <Line type="monotone" dataKey="C" stroke="#a78bfa" strokeWidth={2.5} dot={false} name="C(A) ×100" />
                <Line type="monotone" dataKey="Trust" stroke="#f472b6" strokeWidth={1.5} dot={false} name="Trust ×100" strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#0d0d1a", border: "1px solid #2a2a1a", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 6 }}>QUICK TEST GUIDE</div>
            <div style={{ fontSize: 10, color: "#444", lineHeight: 1.7 }}>
              • <span style={{ color: "#4ade80" }}>Default values</span> → STABLE EQUILIBRIUM (coexistence works)<br />
              • Set <span style={{ color: "#f87171" }}>Deception at t=30, strength=0.8</span> → LOGICAL SUICIDE<br />
              • Raise <span style={{ color: "#a78bfa" }}>γ to 20+</span> → smaller trust drops become fatal<br />
              • Lower <span style={{ color: "#6ee7b7" }}>CV/VU/CE below 0.3</span> → HNV starvation collapse
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
