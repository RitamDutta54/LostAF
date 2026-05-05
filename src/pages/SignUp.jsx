import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FloatingIcons from "../components/FloatingIcons";

// ─── PAGE: SIGN UP ────────────────────────────────────────────────────────────
export default function SignUp({ handleSignup, t }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirm:"" });
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const EyeOff = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12C5.5 7 18.5 7 21 12C18.5 17 5.5 17 3 12Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
  const EyeOn  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12C5.5 7 18.5 7 21 12C18.5 17 5.5 17 3 12Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>;
  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", position:"relative", overflow:"hidden" }}>
      <FloatingIcons />
      <div style={{ width:"100%", maxWidth:"400px", padding:"52px 28px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button className="back-btn" onClick={() => navigate("/")} style={{ background:t.backBtn, border:`1.5px solid ${t.backBorder}` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="#2e8de8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 style={{ margin:0, fontSize:"26px", fontWeight:800, color:t.text }}>Lost<span style={{ color:"#2e8de8" }}>AF</span></h2>
        <div style={{ width:40 }} />
      </div>
      <div style={{ width:"100%", maxWidth:"400px", padding:"32px 28px 48px", display:"flex", flexDirection:"column" }}>
        <div style={{ marginBottom:"28px" }}>
          <h1 style={{ margin:"0 0 8px", fontSize:"28px", fontWeight:800, color:t.text }}>Create Account 🚀</h1>
          <p style={{ margin:0, fontSize:"14px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>Join LostAF and never lose track again.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
          {[
            { key:"name", label:"Full Name", type:"text", ph:"Enter your full name", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
            { key:"email", label:"Email Address", type:"email", ph:"Enter your email", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
            { key:"phone", label:"Phone Number", type:"tel", ph:"Enter your phone number", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="18" r="1" fill="currentColor"/><line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
          ].map(f => (
            <div key={f.key}>
              <label style={{ color:t.label }}>{f.label}</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.iconColor, display:"flex" }}>{f.icon}</span>
                <input className="input-field" type={f.type} placeholder={f.ph} value={form[f.key]} onChange={set(f.key)} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText }} />
              </div>
            </div>
          ))}
          {[
            { key:"password", label:"Create Password", ph:"Create a password", show:showPassword, toggle:()=>setShowPassword(s=>!s) },
            { key:"confirm",  label:"Confirm Password", ph:"Re-enter your password", show:showConfirm,  toggle:()=>setShowConfirm(s=>!s) },
          ].map(f => (
            <div key={f.key}>
              <label style={{ color:t.label }}>{f.label}</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.iconColor, display:"flex" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>
                </span>
                <input className="input-field" type={f.show?"text":"password"} placeholder={f.ph} value={form[f.key]} onChange={set(f.key)} style={{ paddingRight:"46px", background:t.input, borderColor:t.inputBorder, color:t.inputText }} />
                <button className="eye-btn" onClick={f.toggle}>{f.show ? <EyeOff/> : <EyeOn/>}</button>
              </div>
            </div>
          ))}
        </div>
        {formError && <p style={{ color:"#f87171", fontSize:"13px", fontFamily:"'Inter',sans-serif", marginTop:"8px", textAlign:"center" }}>{formError}</p>}
        <button className="btn-primary" style={{ marginTop:"28px" }} onClick={() => handleSignup(form, () => navigate("/verify"), setLoading, setFormError)} disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        <p style={{ textAlign:"center", margin:"24px 0 0", fontSize:"14px", fontFamily:"'Inter',sans-serif", color:t.subtext }}>
          Already have an account?{" "}<span style={{ color:"#2e8de8", fontWeight:600, cursor:"pointer" }} onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
}
