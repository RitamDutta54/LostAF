import { useNavigate } from "react-router-dom";
import FloatingIcons from "../components/FloatingIcons";

// ─── PAGE: LANDING ────────────────────────────────────────────────────────────
export default function Landing({ t }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <FloatingIcons />
      <div style={{ width:"100%", maxWidth:"340px", padding:"0 28px", display:"flex", flexDirection:"column", alignItems:"center", animation:"fadeUp 0.7s ease both" }}>
        <div style={{ width:90, height:90, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"22px", boxShadow:"0 4px 32px rgba(0,0,0,0.25)" }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none"><circle cx="19" cy="19" r="11" stroke="#111" strokeWidth="3.5"/><path d="M28 28 L38 38" stroke="#111" strokeWidth="3.5" strokeLinecap="round"/></svg>
        </div>
        <h1 style={{ margin:"0 0 14px", fontSize:"52px", fontWeight:800, letterSpacing:"-0.01em", color:t.text, lineHeight:1, textAlign:"center" }}>
          Lost<span style={{ color:"#2e8de8" }}>AF</span>
        </h1>
        <p style={{ margin:"0 0 52px", fontSize:"15px", color:t.taglineColor, fontFamily:"'Inter',sans-serif", textAlign:"center", lineHeight:1.6, fontStyle:"italic" }}>
          "Find what's lost.<br/>Return what's found."
        </p>
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"12px" }}>
          <button className="btn-primary" onClick={() => navigate("/login")}>Login <span style={{ fontSize:"18px" }}>›</span></button>
          <button className="btn-secondary" onClick={() => navigate("/signup")}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}
