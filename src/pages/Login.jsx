import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FloatingIcons from "../components/FloatingIcons";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

// ─── PAGE: LOGIN ──────────────────────────────────────────────────────────────
export default function Login({ handleLogin, t }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError("Please enter your email address first.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (e) {
      setLoginError("Failed to send reset email. " + e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, ""));
    }
    setLoginLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", position:"relative", overflow:"hidden" }}>
      <FloatingIcons />
      <div style={{ width:"100%", maxWidth:"400px", padding:"52px 28px 0", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"fadeUp 0.5s ease both" }}>
        <button className="back-btn" onClick={() => navigate("/")} style={{ background:t.backBtn, border:`1.5px solid ${t.backBorder}` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="#2e8de8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 style={{ margin:0, fontSize:"26px", fontWeight:800, color:t.text }}>Lost<span style={{ color:"#2e8de8" }}>AF</span></h2>
        <div style={{ width:40 }} />
      </div>
      
      <div style={{ width:"100%", maxWidth:"400px", padding:"40px 28px 32px", display:"flex", flexDirection:"column" }}>
        <div style={{ marginBottom:"36px" }}>
          <h1 style={{ margin:"0 0 8px", fontSize:"30px", fontWeight:800, color:t.text }}>
            {isForgotPassword ? "Reset Password 🔒" : "Welcome back 👋"}
          </h1>
          <p style={{ margin:0, fontSize:"14px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>
            {isForgotPassword ? "Enter your email to receive a password reset link." : "Log in to continue finding what matters."}
          </p>
        </div>

        {resetEmailSent ? (
          <div style={{ textAlign:"center", padding:"30px 20px", background:t.card, borderRadius:"16px", border:`1px solid ${t.cardBorder}` }}>
            <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(34,197,94,0.1)", color:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 style={{ margin:"0 0 8px", color:t.text, fontSize:"18px", fontFamily:"'Syne',sans-serif" }}>Email Sent!</h3>
            <p style={{ margin:"0 0 24px", color:t.subtext, fontSize:"14px" }}>Check your inbox for a link to reset your password.</p>
            <button className="btn-primary" onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); setPassword(""); }}>
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:"20px" }}>
              <label style={{ color:t.label }}>Email Address</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.iconColor, display:"flex" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </span>
                <input className="input-field" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText }} />
              </div>
            </div>

            {!isForgotPassword && (
              <>
                <div style={{ marginBottom:"14px" }}>
                  <label style={{ color:t.label }}>Password</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.iconColor, display:"flex" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>
                    </span>
                    <input className="input-field" type={showPassword?"text":"password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight:"46px", background:t.input, borderColor:t.inputBorder, color:t.inputText }} />
                    <button className="eye-btn" onClick={() => setShowPassword(s=>!s)}>
                      {showPassword ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12C5.5 7 18.5 7 21 12C18.5 17 5.5 17 3 12Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12C5.5 7 18.5 7 21 12C18.5 17 5.5 17 3 12Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign:"right", marginBottom:"32px" }}>
                  <span onClick={() => { setIsForgotPassword(true); setLoginError(""); }} style={{ fontSize:"13px", color:"#2e8de8", fontFamily:"'Inter',sans-serif", fontWeight:500, cursor:"pointer" }}>Forgot Password?</span>
                </div>
              </>
            )}

            {loginError && <p style={{ color:"#f87171", fontSize:"13px", fontFamily:"'Inter',sans-serif", marginBottom:"12px", textAlign:"center" }}>{loginError}</p>}
            
            <button 
              className="btn-primary" 
              onClick={isForgotPassword ? handleForgotPassword : () => handleLogin(email, password, () => navigate("/home"), setLoginLoading, setLoginError)} 
              disabled={loginLoading}
              style={{ marginTop: isForgotPassword ? "16px" : "0" }}
            >
              {loginLoading ? (isForgotPassword ? "Sending..." : "Logging in...") : (isForgotPassword ? "Send Reset Link" : "Login")}
            </button>
            
            {isForgotPassword ? (
              <p style={{ textAlign:"center", margin:"24px 0 0", fontSize:"14px", fontFamily:"'Inter',sans-serif", color:t.subtext }}>
                Remembered your password?{" "}<span style={{ color:"#2e8de8", fontWeight:600, cursor:"pointer" }} onClick={() => { setIsForgotPassword(false); setLoginError(""); }}>Back to Login</span>
              </p>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"28px 0" }}>
                  <div style={{ flex:1, height:"1px", background:t.divider }} />
                  <span style={{ fontSize:"12px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>or</span>
                  <div style={{ flex:1, height:"1px", background:t.divider }} />
                </div>
                <p style={{ textAlign:"center", margin:0, fontSize:"14px", fontFamily:"'Inter',sans-serif", color:t.subtext }}>
                  Don't have an account?{" "}<span style={{ color:"#2e8de8", fontWeight:600, cursor:"pointer" }} onClick={() => navigate("/signup")}>Sign Up</span>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
