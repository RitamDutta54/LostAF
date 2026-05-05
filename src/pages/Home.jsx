import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

// ─── PAGE: HOME ───────────────────────────────────────────────────────────────
export default function Home({ t, onComingSoon }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Minimal notification states
  const [pendingClaims, setPendingClaims] = useState([]);
  const [unreadThreads, setUnreadThreads] = useState([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  // Filter own reports by keyword
  const filteredReports = myReports.filter(r => {
    if (!search.trim()) return true;
    const kw = search.trim().toLowerCase();
    return (
      (r.title || "").toLowerCase().includes(kw) ||
      (r.description || "").toLowerCase().includes(kw) ||
      (r.location || "").toLowerCase().includes(kw)
    );
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = [];
      snapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
      });
      setMyReports(reports);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch pending claims for this user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const qClaims = query(collection(db, "claims"), where("reporterId", "==", user.uid), where("status", "==", "pending"));
    const unsubClaims = onSnapshot(qClaims, (snap) => {
      setPendingClaims(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubClaims();
  }, []);

  // Fetch unread messages
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const qThreads = query(collection(db, "threads"), where("unreadBy", "array-contains", user.uid));
    const unsubThreads = onSnapshot(qThreads, (snap) => {
      setUnreadThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubThreads();
  }, []);

  const hasNotifs = pendingClaims.length > 0 || unreadThreads.length > 0;

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", paddingBottom:"80px" }}>
      <div style={{ position:"absolute", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(30,111,191,0.13) 0%, transparent 70%)", top:-80, right:-80, pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle, rgba(30,111,191,0.08) 0%, transparent 70%)", bottom:100, left:-60, pointerEvents:"none" }} />
      <div style={{ padding:"52px 24px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"fadeUp 0.5s ease both" }}>
        <h1 style={{ margin:0, fontSize:"32px", fontWeight:800, color:t.text, letterSpacing:"-0.01em", fontFamily:"'Syne',sans-serif" }}>
          Lost<span style={{ color:"#2e8de8" }}>AF</span>
        </h1>
        <div style={{ position:"relative" }}>
          <button 
            onClick={() => setShowBellDropdown(!showBellDropdown)}
            style={{ background:t.bellBg, border:`1.5px solid ${t.bellBorder}`, borderRadius:"12px", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 10a6 6 0 0 1 12 0v3l2 3H4l2-3v-3Z" stroke="#2e8de8" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M10 19a2 2 0 0 0 4 0" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {hasNotifs && <div style={{ position:"absolute", top:8, right:8, width:7, height:7, borderRadius:"50%", background:"#f97316", border:`2px solid ${t.notifDot}` }} />}
          </button>

          {/* Simple Notification Dropdown */}
          {showBellDropdown && (
            <div style={{ position:"absolute", top:"50px", right:0, width:"260px", background:"rgba(36, 56, 82, 0.98)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:`1.5px solid rgba(100, 160, 230, 0.4)`, borderRadius:"16px", padding:"16px", boxShadow:"0 20px 50px rgba(0,0,0,0.6)", zIndex:100, animation:"fadeUp 0.2s ease" }}>
              <h3 style={{ margin:"0 0 12px", fontSize:"14px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif" }}>Notifications</h3>
              {hasNotifs ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {/* Claims */}
                  {pendingClaims.map(c => (
                    <div key={c.id} onClick={() => navigate(`/report/${c.reportId}`)} style={{ padding:"10px", borderRadius:"10px", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", cursor:"pointer" }}>
                      <p style={{ margin:0, fontSize:"12px", fontWeight:600, color:"#fb923c", fontFamily:"'Inter',sans-serif" }}>New Claim!</p>
                      <p style={{ margin:"2px 0 0", fontSize:"11px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>Someone claims to have info on your item.</p>
                    </div>
                  ))}
                  {/* Messages */}
                  {unreadThreads.map(th => {
                    const otherUid = th.participants.find(uid => uid !== auth.currentUser?.uid);
                    const otherUser = th.users?.[otherUid] || { name:"Someone" };
                    return (
                      <div key={th.id} onClick={() => navigate(`/chat/${th.id}`)} style={{ padding:"10px", borderRadius:"10px", background:"rgba(46,141,232,0.1)", border:"1px solid rgba(46,141,232,0.3)", cursor:"pointer" }}>
                        <p style={{ margin:0, fontSize:"12px", fontWeight:600, color:"#2e8de8", fontFamily:"'Inter',sans-serif" }}>New Message</p>
                        <p style={{ margin:"2px 0 0", fontSize:"11px", color:t.subtext, fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          <strong style={{ color:t.text }}>{otherUser.name}:</strong> {th.lastMessage}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin:0, fontSize:"12px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>You're all caught up!</p>
              )}
              <p style={{ margin:"12px 0 0", fontSize:"11px", color:t.iconColor, fontFamily:"'Inter',sans-serif", textAlign:"center", fontStyle:"italic" }}>
                Check the Messages tab for chat updates.
              </p>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"0 24px 24px" }}>
        <p style={{ margin:0, fontSize:"14px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>What are you looking for today?</p>
      </div>
      <div style={{ padding:"0 24px 28px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
        <button style={{ padding:"22px 12px", borderRadius:"18px", border:"2px solid rgba(249,115,22,0.6)", background:"rgba(249,115,22,0.07)", color:"#fb923c", fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:800, letterSpacing:"0.06em", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(249,115,22,0.14)"}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(249,115,22,0.07)"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fb923c" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/><path d="M8 11h6M11 8v6" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/></svg>
          LOST
        </button>
        <button style={{ padding:"22px 12px", borderRadius:"18px", border:"2px solid rgba(34,197,94,0.6)", background:"rgba(34,197,94,0.07)", color:"#4ade80", fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:800, letterSpacing:"0.06em", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,197,94,0.14)"}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,197,94,0.07)"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#4ade80" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/><path d="M8 11l2.5 2.5L15 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          FOUND
        </button>
      </div>
      <div style={{ padding:"0 24px 32px" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.iconColor, display:"flex" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <input className="input-field" type="text" placeholder="Enter keyword" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:"44px", background:t.input, borderColor:t.inputBorder, color:t.inputText }} />
        </div>
      </div>
      <div style={{ padding:"0 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
          <h2 style={{ margin:0, fontSize:"17px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif" }}>My Reports</h2>
          {search.trim() && (
            <span style={{ fontSize:"12px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>
              {filteredReports.length} match{filteredReports.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>
        {myReports.length === 0 && !loading && (
          <div style={{ borderRadius:"18px", border:`1.5px dashed ${t.emptyBorder}`, background:t.emptyBg, padding:"40px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(46,141,232,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#2e8de8" strokeWidth="1.8"/><path d="M16.5 16.5L21 21" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <p style={{ margin:0, fontSize:"14px", color:t.emptyText, fontFamily:"'Inter',sans-serif", textAlign:"center", lineHeight:1.6 }}>
              No reports yet.<br/>Tap <strong style={{ color:t.subtext }}>LOST</strong> or <strong style={{ color:t.subtext }}>FOUND</strong> to create one.
            </p>
          </div>
        )}
        {loading && <p style={{ margin:0, fontSize:"14px", color:t.subtext, fontFamily:"'Inter',sans-serif", textAlign:"center" }}>Loading...</p>}
        {/* No keyword match */}
        {!loading && myReports.length > 0 && search.trim() && filteredReports.length === 0 && (
          <div style={{ borderRadius:"16px", border:`1.5px dashed ${t.emptyBorder}`, background:t.emptyBg, padding:"28px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#2e8de8" strokeWidth="1.8"/><path d="M16.5 16.5L21 21" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 11h6" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <p style={{ margin:0, fontSize:"13px", color:t.emptyText, fontFamily:"'Inter',sans-serif", textAlign:"center" }}>
              No reports matching <strong style={{ color:t.subtext }}>"{search}"</strong>
            </p>
          </div>
        )}

        {/* Report cards */}
        {filteredReports.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {filteredReports.map(r => (
              <div key={r.id} style={{ background:t.card, border:`1.5px solid ${t.cardBorder}`, borderRadius:"16px", padding:"16px", display:"flex", gap:"14px", cursor:"pointer", transition:"transform 0.2s" }} onClick={() => navigate(`/report/${r.id}`)}>
                <div style={{ width:72, height:72, borderRadius:"12px", background:t.emptyBg, flexShrink:0, overflow:"hidden" }}>
                  {r.images && r.images.length > 0 ? (
                    <img src={r.images[0]} alt={r.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:t.iconColor }}>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                    <span style={{ padding:"2px 8px", borderRadius:"6px", fontSize:"10px", fontWeight:700, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.04em", background: r.type==="lost" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)", color: r.type==="lost" ? "#fb923c" : "#4ade80" }}>
                      {r.type}
                    </span>
                    <span style={{ fontSize:"11px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>{r.date}</span>
                  </div>
                  <h3 style={{ margin:"0 0 4px", fontSize:"15px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{r.title}</h3>
                  <div style={{ display:"flex", alignItems:"center", gap:"4px", color:t.subtext }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    <span style={{ fontSize:"12px", fontFamily:"'Inter',sans-serif", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{r.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="home" t={t} onComingSoon={onComingSoon} />
    </div>
  );
}
