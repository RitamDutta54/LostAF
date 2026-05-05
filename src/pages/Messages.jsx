import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

// ─── PAGE: MESSAGES ────────────────────────────────────────────────────────────
export default function Messages({ t, onComingSoon }) {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen for chat threads where current user is a participant
    const q = query(
      collection(db, "threads"),
      where("participants", "array-contains", currentUser.uid)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = [];
      snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() });
      });
      // Sort client-side to avoid composite index requirement
      docs.sort((a,b) => {
        const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bTime - aTime;
      });
      setThreads(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", paddingBottom:"90px" }}>
      {/* Background blobs */}
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(46,141,232,0.12) 0%, transparent 70%)", top:-80, right:-60, pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(46,141,232,0.07) 0%, transparent 70%)", bottom:120, left:-50, pointerEvents:"none" }} />

      {/* ── Header ── */}
      <div style={{ padding:"52px 24px 16px", animation:"fadeUp 0.3s ease both" }}>
        <h1 style={{ margin:0, fontSize:"28px", fontWeight:800, color:t.text, fontFamily:"'Syne',sans-serif", letterSpacing:"-0.01em" }}>
          Your <span style={{ color:"#2e8de8" }}>Messages</span>
        </h1>
        <p style={{ margin:"4px 0 0", fontSize:"13px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>
          Connect securely
        </p>
      </div>

      {/* ── Threads List ── */}
      <div style={{ padding:"0 24px", flex:1, display:"flex", flexDirection:"column", gap:12 }}>
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[0,1,2].map(i => <div key={i} className="search-skeleton" style={{ animationDelay:`${i*0.1}s`, height:80 }} />)}
          </div>
        ) : threads.length === 0 ? (
          <div style={{ borderRadius:"18px", border:`1.5px dashed ${t.emptyBorder}`, background:t.emptyBg, padding:"48px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:"14px", animation:"fadeUp 0.3s ease both" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(46,141,232,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7l-4 4V5a1 1 0 0 1 1-1Z" stroke="#2e8de8" strokeWidth="1.9" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ margin:"0 0 6px", fontSize:"16px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif" }}>No messages yet</p>
              <p style={{ margin:0, fontSize:"13px", color:t.emptyText, fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>When your claims are accepted, your chats will appear here.</p>
            </div>
          </div>
        ) : (
          threads.map((thread, idx) => {
            // Find the other user's info
            const otherUid = thread.participants.find(uid => uid !== currentUser.uid);
            const otherUser = thread.users[otherUid] || { name: "Unknown" };
            
            return (
              <div 
                key={thread.id} 
                onClick={() => navigate(`/chat/${thread.id}`)}
                style={{ 
                  background:t.card, border:`1.5px solid ${t.cardBorder}`, borderRadius:16, padding:16, 
                  display:"flex", gap:14, alignItems:"center", cursor:"pointer", transition:"transform 0.2s",
                  animation:`fadeUp 0.3s ease ${idx*0.05}s both`
                }}
              >
                {/* Avatar */}
                <div style={{ width:50, height:50, borderRadius:"50%", background:"linear-gradient(135deg,#1a5fa8,#2e8de8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:2 }}>
                    <p style={{ margin:0, fontSize:"15px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {otherUser.name}
                    </p>
                  </div>
                  <p style={{ margin:"0 0 4px", fontSize:"11px", fontWeight:600, color:"#2e8de8", fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                    {thread.reportTitle || "Report"}
                  </p>
                  <p style={{ margin:0, fontSize:"13px", color:t.subtext, fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {thread.lastMessage || "No messages yet."}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav active="messages" t={t} onComingSoon={onComingSoon} />
    </div>
  );
}
