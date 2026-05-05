import { useNavigate } from "react-router-dom";
import FloatingIcons from "../components/FloatingIcons";

// ─── PAGE: VERIFY EMAIL ───────────────────────────────────────────────────────
export default function VerifyEmail({ t }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <FloatingIcons />
      <div style={{ width:"100%", maxWidth:"340px", padding:"0 28px", display:"flex", flexDirection:"column", alignItems:"center", animation:"fadeUp 0.7s ease both", textAlign:"center" }}>
        {/* Email icon */}
        <div style={{ width:90, height:90, borderRadius:"50%", background:"rgba(46,141,232,0.15)", border:"2px solid rgba(46,141,232,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"28px" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="#2e8de8" strokeWidth="1.8"/>
            <path d="M2 7L12 13L22 7" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="5" fill="#22c55e"/>
            <path d="M15.5 18l1.5 1.5 2.5-2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ margin:"0 0 12px", fontSize:"28px", fontWeight:800, color:t.text, letterSpacing:"-0.01em" }}>Check your inbox! 📬</h1>
        <p style={{ margin:"0 0 8px", fontSize:"15px", color:t.subtext, fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>
          We've sent a verification link to your email address.
        </p>
        <p style={{ margin:"0 0 40px", fontSize:"13px", color:t.subtext, fontFamily:"'Inter',sans-serif", lineHeight:1.6, opacity:0.7 }}>
          Click the link in the email to activate your account, then come back and log in.
        </p>
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"12px" }}>
          <button className="btn-primary" onClick={() => navigate("/login")}>Go to Login →</button>
          <button className="btn-secondary" onClick={() => navigate("/")}>Back to Home</button>
        </div>
        <p style={{ marginTop:"28px", fontSize:"12px", color:t.subtext, fontFamily:"'Inter',sans-serif", opacity:0.6, lineHeight:1.6 }}>
          Didn't receive it? Check your spam folder or try signing up again.
        </p>
      </div>
    </div>
  );
}
