import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import T from "./theme";
import ProtectedRoute from "./components/ProtectedRoute";
// Landing page removed from default route — login is now the entry point
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Report from "./pages/Report";
import Search from "./pages/Search";
import ReportDetail from "./pages/ReportDetail";
import Messages from "./pages/Messages";
import ChatThread from "./pages/ChatThread";
// ─── INNER APP (needs to be inside BrowserRouter for useNavigate) ─────────────
function AppRoutes() {
  const navigate = useNavigate();
  const [hasNotifications, setHasNotifications] = useState(true);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [userProfile, setUserProfile] = useState(null);
  const t = T;
  const showToast = (label) => { setToast(label); setTimeout(() => setToast(null), 2500); };

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) setUserProfile(snap.data());
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const handleSignup = async (form, onSuccess, setLoading, setError) => {
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        createdAt: new Date().toISOString()
      });
      setUserProfile({ name:form.name, email:form.email, phone:form.phone });
      
      // Send verification email
      await sendEmailVerification(cred.user);
      
      onSuccess();
    } catch(e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, ""));
    }
    setLoading(false);
  };

  const handleLogin = async (email, password, onSuccess, setLoading, setError) => {
    setLoading(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Force Firebase to refresh the user's data from the server.
      // Otherwise, cred.user.emailVerified might use a stale cached value and stay false
      // even if the user just clicked the verification link in their email.
      await cred.user.reload();
      
      // Check if email is verified
      if (!cred.user.emailVerified) {
        // Resend verification email just in case they lost it
        await sendEmailVerification(cred.user);
        await signOut(auth); // Sign them back out immediately
        setError("Please verify your email before logging in. We just sent another link to your inbox.");
        setLoading(false);
        return;
      }
      
      onSuccess();
    } catch(e) {
      setError("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Show nothing while auth is loading (prevents flash)
  if (user === undefined) {
    return <div style={{ minHeight:"100vh", width:"100%", background:t.bg }} />;
  }

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:t.bg, fontFamily:"'Syne',sans-serif", transition:"background 0.4s" }}>
      <Routes>
        {/* Public routes — / always lands on Login for unauthenticated users */}
        <Route path="/" element={user ? (user.emailVerified ? <Navigate to="/home" replace /> : <Navigate to="/verify" replace />) : <Navigate to="/login" replace />} />
        <Route path="/login" element={user ? (user.emailVerified ? <Navigate to="/home" replace /> : <Navigate to="/verify" replace />) : <Login handleLogin={handleLogin} t={t} />} />
        <Route path="/signup" element={user ? (user.emailVerified ? <Navigate to="/home" replace /> : <Navigate to="/verify" replace />) : <SignUp handleSignup={handleSignup} t={t} />} />
        <Route path="/verify" element={<VerifyEmail t={t} />} />

        {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <Home t={t} hasNotifications={hasNotifications} onComingSoon={showToast} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <Report t={t} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <Search t={t} onComingSoon={showToast} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path="/report/:id" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <ReportDetail t={t} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <Messages t={t} onComingSoon={showToast} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path="/chat/:threadId" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <ChatThread t={t} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute user={user}>
            {user?.emailVerified ? <Profile t={t} hasNotifications={hasNotifications} setHasNotifications={setHasNotifications} onComingSoon={showToast} userProfile={userProfile} setUserProfile={setUserProfile} handleLogout={handleLogout} /> : <Navigate to="/verify" replace />}
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {toast && (
        <div style={{ position:"fixed", bottom:96, left:"50%", transform:"translateX(-50%)", background:"#1e3a5f", color:"#e8f4ff", padding:"12px 24px", borderRadius:"40px", fontSize:"13px", fontFamily:"'Inter',sans-serif", fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", zIndex:200, whiteSpace:"nowrap", border:"1px solid rgba(100,160,230,0.3)", animation:"fadeUp 0.3s ease" }}>
          🚧 {toast} — Coming Soon!
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function LostAFApp() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
