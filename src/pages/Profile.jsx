import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

// ─── PAGE: PROFILE ────────────────────────────────────────────────────────────
export default function Profile({ t, hasNotifications, setHasNotifications, onComingSoon, userProfile, setUserProfile, handleLogout }) {
  const [openSection, setOpenSection] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const notifications = hasNotifications ? [
    { msg: "Someone may have found your Lost Wallet report!", time: "2 hrs ago", type: "match" },
    { msg: "Your Found AirPods report got a new match.", time: "Yesterday", type: "match" },
  ] : [];
  const user = { name: userProfile?.name || "User", email: userProfile?.email || "", phone: userProfile?.phone || "" };

  // ── Edit Profile state ──
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // Sync edit fields when userProfile changes
  useEffect(() => {
    setEditName(userProfile?.name || "User");
    setEditPhone(userProfile?.phone || "");
  }, [userProfile]);

  const handleStartEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditError("");
    setEditSuccess(false);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditError("");
    setEditSuccess(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedPhone = editPhone.trim();
    if (!trimmedName) {
      setEditError("Name cannot be empty.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const u = auth.currentUser;
      if (!u) throw new Error("Not authenticated");

      // Update Firestore users document
      await updateDoc(doc(db, "users", u.uid), {
        name: trimmedName,
        phone: trimmedPhone,
      });

      // Update Firebase Auth displayName
      await updateProfile(u, { displayName: trimmedName });

      // Update local state immediately
      setUserProfile(prev => ({ ...prev, name: trimmedName, phone: trimmedPhone }));

      setEditSuccess(true);
      setTimeout(() => {
        setEditing(false);
        setEditSuccess(false);
      }, 1200);
    } catch (e) {
      console.error("Profile update error:", e);
      setEditError("Failed to update profile. Please try again.");
    }
    setEditLoading(false);
  };

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(collection(db, "reports"), where("userId", "==", u.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setMyReports(docs);
    });
    return () => unsub();
  }, []);

  const toggle = (key) => setOpenSection(o => o === key ? null : key);

  const lostCount = myReports.filter(r => r.type === "lost").length;
  const foundCount = myReports.filter(r => r.type === "found").length;
  const resolvedCount = myReports.filter(r => r.status === "resolved").length;
  const stats = [
    { label:"Lost",     value: String(lostCount),     color:"#f97316" },
    { label:"Found",    value: String(foundCount),     color:"#22c55e" },
    { label:"Returned", value: String(resolvedCount),  color:"#2e8de8" },
  ];

  const Card = ({ children }) => (
    <div style={{ background:t.card, border:`1.5px solid ${t.cardBorder}`, borderRadius:"16px", overflow:"hidden" }}>{children}</div>
  );

  const AccordionItem = ({ id, label, icon, children, last }) => {
    const open = openSection === id;
    return (
      <div style={{ borderBottom: last ? "none" : `1px solid ${t.divider}` }}>
        <button onClick={() => toggle(id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"14px", padding:"15px 18px", background:"none", border:"none", cursor:"pointer", transition:"background 0.18s" }}
          onMouseEnter={e=>e.currentTarget.style.background=t.menuHover}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <span style={{ color:t.iconColor, display:"flex" }}>{icon}</span>
          <span style={{ flex:1, fontSize:"14px", fontFamily:"'Inter',sans-serif", fontWeight:500, color:t.text, textAlign:"left" }}>{label}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s", color:t.chevron }}>
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div style={{ padding:"0 18px 16px 18px", background:t.dropBg, borderTop:`1px solid ${t.dropBorder}` }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const MenuItem = ({ label, icon, right, onClick, danger, last }) => (
    <button onClick={onClick} style={{ width:"100%", display:"flex", alignItems:"center", gap:"14px", padding:"15px 18px", background:"none", border:"none", cursor:"pointer", borderBottom: last ? "none" : `1px solid ${t.divider}`, transition:"background 0.18s" }}
      onMouseEnter={e=>e.currentTarget.style.background=t.menuHover}
      onMouseLeave={e=>e.currentTarget.style.background="none"}>
      <span style={{ color: danger ? "#f87171" : t.iconColor, display:"flex" }}>{icon}</span>
      <span style={{ flex:1, fontSize:"14px", fontFamily:"'Inter',sans-serif", fontWeight:500, color: danger ? "#f87171" : t.text, textAlign:"left" }}>{label}</span>
      {right !== undefined ? right : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={danger?"#f87171":t.chevron} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </button>
  );

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", paddingBottom:"90px" }}>
      <div style={{ position:"absolute", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(30,111,191,0.12) 0%, transparent 70%)", top:-80, right:-80, pointerEvents:"none" }} />

      {/* Top bar */}
      <div style={{ padding:"52px 24px 24px", display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeUp 0.5s ease both" }}>
        <h1 style={{ margin:0, fontSize:"20px", fontWeight:800, color:t.text, fontFamily:"'Syne',sans-serif" }}>Profile</h1>
      </div>

      <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:"16px" }}>

        {/* Avatar + info card */}
        <Card>
          <div style={{ padding:"28px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:84, height:84, borderRadius:"50%", background:"linear-gradient(135deg,#1a5fa8,#2e8de8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 3px rgba(46,141,232,0.3), 0 8px 24px rgba(0,0,0,0.2)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <div onClick={handleStartEdit} style={{ position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:"50%", background:"#2e8de8", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #0b1929", cursor:"pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ margin:"0 0 4px", fontSize:"18px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif" }}>{user.name}</p>
              <p style={{ margin:0, fontSize:"13px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>{user.email}</p>
            </div>
          </div>

          {/* ── Edit Profile inline form ── */}
          {editing ? (
            <div style={{ borderTop:`1px solid ${t.divider}`, padding:"18px" }}>
              <p style={{ margin:"0 0 16px", fontSize:"15px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif", textAlign:"center" }}>Edit Profile</p>

              {/* Name field */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", margin:"0 0 6px", fontSize:"11px", fontWeight:600, color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Display Name</label>
                <input
                  id="edit-profile-name"
                  className="input-field"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                  style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText, width:"100%", boxSizing:"border-box" }}
                />
              </div>

              {/* Email field (read-only) */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, margin:"0 0 6px", fontSize:"11px", fontWeight:600, color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Email Address
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity:0.5 }}><rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </label>
                <input
                  className="input-field"
                  type="email"
                  value={user.email}
                  disabled
                  style={{ background:t.input, borderColor:t.inputBorder, color:t.subtext, width:"100%", boxSizing:"border-box", opacity:0.55, cursor:"not-allowed" }}
                />
                <p style={{ margin:"4px 0 0", fontSize:"10px", color:t.subtext, fontFamily:"'Inter',sans-serif", fontStyle:"italic" }}>Email cannot be changed</p>
              </div>

              {/* Phone field */}
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", margin:"0 0 6px", fontSize:"11px", fontWeight:600, color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Phone Number</label>
                <input
                  id="edit-profile-phone"
                  className="input-field"
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Your phone number"
                  style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText, width:"100%", boxSizing:"border-box" }}
                />
              </div>

              {/* Error / Success messages */}
              {editError && (
                <p style={{ margin:"0 0 12px", fontSize:"13px", color:"#f87171", fontFamily:"'Inter',sans-serif", textAlign:"center" }}>{editError}</p>
              )}
              {editSuccess && (
                <div style={{ margin:"0 0 12px", padding:"10px 14px", borderRadius:10, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#4ade80" strokeWidth="1.8"/><path d="M8 12l2.5 2.5L16 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p style={{ margin:0, fontSize:"13px", color:"#4ade80", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>Profile updated successfully!</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <button
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                  style={{ padding:"12px", borderRadius:12, border:`1.5px solid ${t.cardBorder}`, background:"transparent", color:t.subtext, fontSize:14, fontWeight:600, fontFamily:"'Inter',sans-serif", cursor:"pointer", transition:"all 0.2s" }}
                >
                  Cancel
                </button>
                <button
                  id="edit-profile-save"
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  style={{ padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#2e8de8,#1a5fa8)", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'Inter',sans-serif", cursor:"pointer", boxShadow:"0 4px 14px rgba(46,141,232,0.35)", transition:"all 0.2s" }}
                >
                  {editLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ borderTop:`1px solid ${t.divider}` }}>
              {[
                { label:"Full Name",     value:user.name,  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                { label:"Email Address", value:user.email, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                { label:"Phone Number",  value:user.phone, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg> },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ padding:"13px 18px", display:"flex", alignItems:"center", gap:"12px", borderBottom: i < arr.length-1 ? `1px solid ${t.divider}` : "none" }}>
                  <span style={{ color:t.iconColor }}>{row.icon}</span>
                  <div>
                    <p style={{ margin:"0 0 2px", fontSize:"11px", color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{row.label}</p>
                    <p style={{ margin:0, fontSize:"14px", color:t.text, fontFamily:"'Inter',sans-serif", fontWeight:500 }}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:t.card, border:`1.5px solid ${s.color}33`, borderRadius:"14px", padding:"16px 10px", textAlign:"center" }}>
              <p style={{ margin:"0 0 4px", fontSize:"26px", fontWeight:800, color:s.color, fontFamily:"'Syne',sans-serif" }}>{s.value}</p>
              <p style={{ margin:0, fontSize:"11px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activity accordions */}
        <div>
          <p style={{ margin:"0 0 10px 4px", fontSize:"12px", fontWeight:600, color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>My Activity</p>
          <Card>
            <AccordionItem id="reports" label={`My Reports (${myReports.length})`} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}>
              {myReports.length === 0 ? (
                <p style={{ margin:"12px 0 0", fontSize:"13px", color:t.subtext, fontFamily:"'Inter',sans-serif", textAlign:"center" }}>No reports yet. Start by tapping LOST or FOUND on the home screen.</p>
              ) : myReports.map((r) => (
                <div key={r.id} style={{ padding:"10px 0", borderBottom:`1px solid ${t.divider}`, display:"flex", gap:"10px", alignItems:"center" }}>
                  <span style={{ padding:"2px 8px", borderRadius:"6px", fontSize:"10px", fontWeight:700, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.04em", background: r.type==="lost"?"rgba(249,115,22,0.15)":"rgba(34,197,94,0.15)", color: r.type==="lost"?"#fb923c":"#4ade80", flexShrink:0 }}>
                    {r.type}
                  </span>
                  {r.status === "resolved" && (
                    <span style={{ padding:"2px 8px", borderRadius:"6px", fontSize:"10px", fontWeight:700, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.04em", background:"rgba(139,92,246,0.15)", color:"#a78bfa", flexShrink:0 }}>
                      Resolved
                    </span>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:"13px", color:t.text, fontFamily:"'Inter',sans-serif", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title}</p>
                    <p style={{ margin:0, fontSize:"11px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>{r.location} · {r.date}</p>
                  </div>
                </div>
              ))}
            </AccordionItem>
            <AccordionItem id="notifications" label="Notifications" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 10a6 6 0 0 1 12 0v3l2 3H4l2-3v-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}>
              <div style={{ marginTop:"12px", display:"flex", flexDirection:"column", gap:"8px" }}>
                {notifications.length === 0 ? (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"rgba(46,141,232,0.07)", borderRadius:"10px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#2e8de8" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="#2e8de8" strokeWidth="2" strokeLinecap="round"/></svg>
                    <p style={{ margin:0, fontSize:"13px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>No new notifications. You're all caught up! 🎉</p>
                  </div>
                ) : notifications.map((n,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"10px 12px", background:"rgba(46,141,232,0.07)", borderRadius:"10px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginTop:2,flexShrink:0}}><circle cx="12" cy="12" r="9" stroke="#2e8de8" strokeWidth="1.8"/><path d="M8 12l2.5 2.5L16 8" stroke="#2e8de8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <p style={{ margin:"0 0 2px", fontSize:"13px", color:t.text, fontFamily:"'Inter',sans-serif", fontWeight:500 }}>{n.msg}</p>
                      <p style={{ margin:0, fontSize:"11px", color:t.subtext, fontFamily:"'Inter',sans-serif" }}>{n.time}</p>
                    </div>
                  </div>
                ))}
                {notifications.length > 0 && (
                  <button onClick={()=>setHasNotifications(false)} style={{ marginTop:"4px", padding:"8px", background:"none", border:`1px solid ${t.cardBorder}`, borderRadius:"8px", color:"#2e8de8", fontSize:"12px", fontFamily:"'Inter',sans-serif", cursor:"pointer", fontWeight:600 }}>
                    Mark all as read
                  </button>
                )}
              </div>
            </AccordionItem>
            <AccordionItem id="help" label="Help / Support" last icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>}>
              <div style={{ marginTop:"12px", display:"flex", flexDirection:"column", gap:"10px" }}>
                {[
                  { q:"How do I report a lost item?", a:"Tap the LOST button on the home screen, fill in the details, and submit. Your report will be visible to others instantly." },
                  { q:"How do I report a found item?", a:"Tap the FOUND button, describe the item and where you found it. The rightful owner can contact you through the app." },
                  { q:"Is my personal information safe?", a:"Yes. Your phone number and email are only shared with the other party once both agree to connect." },
                  { q:"How do I contact support?", a:"Email us at support@lostaf.app or use the in-app chat. We respond within 24 hours." },
                ].map((item, i) => (
                  <div key={i} style={{ padding:"12px", background:`${t.card}`, border:`1px solid ${t.cardBorder}`, borderRadius:"10px" }}>
                    <p style={{ margin:"0 0 4px", fontSize:"13px", fontWeight:600, color:t.text, fontFamily:"'Inter',sans-serif" }}>❓ {item.q}</p>
                    <p style={{ margin:0, fontSize:"12px", color:t.subtext, fontFamily:"'Inter',sans-serif", lineHeight:1.5 }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </AccordionItem>
          </Card>
        </div>

        {/* Settings */}
        <div>
          <p style={{ margin:"0 0 10px 4px", fontSize:"12px", fontWeight:600, color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Settings</p>
          <Card>
            <MenuItem label="Edit Profile" onClick={handleStartEdit} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <MenuItem label="Change Password" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
            <MenuItem last danger label="Logout"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              onClick={handleLogout}
            />
          </Card>
        </div>
      </div>
      <BottomNav active="profile" t={t} onComingSoon={onComingSoon} />
    </div>
  );
}
