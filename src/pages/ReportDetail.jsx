import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc, getDoc, deleteDoc,
  collection, addDoc, query, where, onSnapshot,
  serverTimestamp, updateDoc,
} from "firebase/firestore";

// ─── PAGE: REPORT DETAIL ───────────────────────────────────────────────────────
export default function ReportDetail({ t }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  // ── Report data ──
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [reportError, setReportError] = useState("");

  // ── Claim state (viewer) ──
  const [myClaim, setMyClaim] = useState(null);   // existing claim by current user
  const [claimMsg, setClaimMsg] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);

  // ── Claims list (owner) ──
  const [claims, setClaims] = useState([]);

  // ── Image gallery ──
  const [activeImg, setActiveImg] = useState(0);

  // ── Delete confirm ──
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Resolve state ──
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveConfirm, setResolveConfirm] = useState(false);

  const isOwner = report && currentUser && report.userId === currentUser.uid;
  const isResolved = report?.status === "resolved";

  // ── Share toast ──
  const [shareToast, setShareToast] = useState(false);

  // ── Fetch report ──
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const snap = await getDoc(doc(db, "reports", id));
        if (snap.exists()) {
          setReport({ id: snap.id, ...snap.data() });
        } else {
          setReportError("Report not found.");
        }
      } catch (e) {
        setReportError("Failed to load report.");
      }
      setLoadingReport(false);
    };
    fetchReport();
  }, [id]);

  // ── Listen for existing claims: owner sees all, viewer sees own ──
  useEffect(() => {
    if (!currentUser || !report) return;

    if (isOwner) {
      // Owner: listen for all pending/accepted claims on this report
      const q = query(
        collection(db, "claims"),
        where("reportId", "==", id)
      );
      const unsub = onSnapshot(q, (snap) => {
        const docs = [];
        snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
        setClaims(docs);
      });
      return () => unsub();
    } else {
      // Viewer: check if this user already claimed this report
      const q = query(
        collection(db, "claims"),
        where("reportId", "==", id),
        where("claimerId", "==", currentUser.uid)
      );
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setMyClaim({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setMyClaim(null);
        }
      });
      return () => unsub();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, report, isOwner]);

  // ── Submit claim ──
  const handleClaim = async () => {
    if (!currentUser || !report) return;
    setClaimLoading(true);
    try {
      await addDoc(collection(db, "claims"), {
        reportId: id,
        reporterId: report.userId,
        claimerId: currentUser.uid,
        claimerName: currentUser.displayName || "Anonymous",
        message: claimMsg.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setShowMsgBox(false);
      setClaimMsg("");
    } catch (e) {
      console.error("Claim error:", e);
    }
    setClaimLoading(false);
  };

  // ── Accept / Decline claim (owner action) ──
  const handleClaimAction = async (claim, status) => {
    try {
      await updateDoc(doc(db, "claims", claim.id), { status });
      
      // If accepted, create a chat thread automatically
      if (status === "accepted") {
        await addDoc(collection(db, "threads"), {
          reportId: id,
          reportTitle: report.title,
          participants: [currentUser.uid, claim.claimerId],
          users: {
            [currentUser.uid]: { name: currentUser.displayName || "Owner" },
            [claim.claimerId]: { name: claim.claimerName || "Finder" }
          },
          lastMessage: "Claim accepted! You can now chat.",
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Claim action error:", e);
    }
  };

  // ── Mark as Resolved ──
  const handleResolve = async () => {
    setResolveLoading(true);
    try {
      await updateDoc(doc(db, "reports", id), { status: "resolved" });
      setReport(prev => ({ ...prev, status: "resolved" }));
      setResolveConfirm(false);
    } catch (e) {
      console.error("Resolve error:", e);
    }
    setResolveLoading(false);
  };

  // ── Share report details ──
  const handleShare = async () => {
    const emoji = isLost ? "🔍" : "✅";
    const typeLabel = isLost ? "LOST" : "FOUND";
    const shareText =
      `${emoji} ${typeLabel}: ${report.title}\n` +
      `📍 ${report.location || "Unknown location"}\n` +
      `📅 ${report.date || "No date"}\n` +
      (report.category ? `🏷️ ${report.category}\n` : "") +
      (report.description ? `📝 ${report.description}\n` : "") +
      `\nIf you have any info, check the LostAF app!`;

    // Try native Web Share API first (works on mobile — opens WhatsApp, Telegram, etc.)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${typeLabel}: ${report.title}`,
          text: shareText,
        });
        return; // User shared or cancelled — either way, done
      } catch (err) {
        if (err.name === "AbortError") return; // User cancelled share
      }
    }

    // Fallback: copy text to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2200);
  };

  // ── Delete report ──
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "reports", id));
      navigate("/home");
    } catch (e) {
      console.error("Delete error:", e);
    }
    setDeleteLoading(false);
  };

  // ── Helpers ──
  const isLost = report?.type === "lost";
  const accentColor = isLost ? "#fb923c" : "#4ade80";
  const accentBg    = isLost ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)";
  const accentBorder= isLost ? "rgba(249,115,22,0.4)"  : "rgba(34,197,94,0.4)";

  const pendingClaims  = claims.filter(c => c.status === "pending");
  const acceptedClaims = claims.filter(c => c.status === "accepted");

  // ────────────────────────────────────────────────────────── LOADING STATE ──
  if (loadingReport) {
    return (
      <div style={{ minHeight:"100vh", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:t.bg }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <div className="detail-spinner" />
          <p style={{ color:t.subtext, fontFamily:"'Inter',sans-serif", fontSize:14 }}>Loading report…</p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────── ERROR STATE ──
  if (reportError) {
    return (
      <div style={{ minHeight:"100vh", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, padding:"0 32px" }}>
        <p style={{ color:"#f87171", fontFamily:"'Inter',sans-serif", fontSize:15, textAlign:"center" }}>⚠️ {reportError}</p>
        <button onClick={() => navigate(-1)} className="btn-primary" style={{ maxWidth:200 }}>Go Back</button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────── MAIN RENDER ──
  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", paddingBottom:40, position:"relative", overflow:"hidden" }}>

      {/* Background glow */}
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${isLost?"rgba(249,115,22,0.1)":"rgba(34,197,94,0.1)"} 0%, transparent 70%)`, top:-80, right:-60, pointerEvents:"none", transition:"background 0.3s" }} />

      {/* ── Header ── */}
      <div style={{ padding:"52px 24px 20px", display:"flex", alignItems:"center", gap:14, animation:"fadeUp 0.3s ease both" }}>
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
          style={{ background:t.backBtn, border:`1.5px solid ${t.backBorder}`, flexShrink:0 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ padding:"3px 10px", borderRadius:"8px", fontSize:"11px", fontWeight:700, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.05em", background:accentBg, color:accentColor }}>
              {report.type}
            </span>
            {report.category && (
              <span style={{ padding:"3px 10px", borderRadius:"8px", fontSize:"11px", fontWeight:500, fontFamily:"'Inter',sans-serif", background:"rgba(100,160,230,0.1)", color:t.subtext }}>
                {report.category}
              </span>
            )}
            {isOwner && (
              <span style={{ padding:"3px 10px", borderRadius:"8px", fontSize:"11px", fontWeight:700, fontFamily:"'Inter',sans-serif", background:"rgba(46,141,232,0.15)", color:"#2e8de8" }}>
                Your Report
              </span>
            )}
            {isResolved && (
              <span style={{ padding:"3px 10px", borderRadius:"8px", fontSize:"11px", fontWeight:700, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.05em", background:"rgba(139,92,246,0.15)", color:"#a78bfa" }}>
                ✅ Resolved
              </span>
            )}
          </div>
          <h1 style={{ margin:0, fontSize:"20px", fontWeight:800, color:t.text, fontFamily:"'Syne',sans-serif", lineHeight:1.2, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {report.title}
          </h1>
        </div>

        {/* Share button */}
        <button
          id="share-report-btn"
          onClick={handleShare}
          title="Copy link to clipboard"
          style={{ background:t.backBtn, border:`1.5px solid ${t.backBorder}`, borderRadius:12, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.2s", color:accentColor }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.45s ease both" }}>

        {/* ── Image Gallery ── */}
        {report.images && report.images.length > 0 ? (
          <div>
            <div style={{ borderRadius:20, overflow:"hidden", background:t.emptyBg, border:`1.5px solid ${t.cardBorder}`, aspectRatio:"4/3", position:"relative" }}>
              <img
                src={report.images[activeImg]}
                alt={report.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
              {report.images.length > 1 && (
                <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", display:"flex", gap:6 }}>
                  {report.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: activeImg === i ? 20 : 8, height:8, borderRadius:4,
                        background: activeImg === i ? "#fff" : "rgba(255,255,255,0.4)",
                        border:"none", cursor:"pointer", transition:"all 0.25s", padding:0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {report.images.length > 1 && (
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {report.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ width:56, height:56, borderRadius:10, overflow:"hidden", border:`2px solid ${activeImg === i ? accentColor : t.cardBorder}`, padding:0, cursor:"pointer", transition:"border-color 0.2s", flexShrink:0 }}>
                    <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ borderRadius:20, background:t.emptyBg, border:`1.5px dashed ${t.emptyBorder}`, aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center", color:t.iconColor }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              <p style={{ margin:0, fontSize:13, fontFamily:"'Inter',sans-serif", color:t.emptyText }}>No photo attached</p>
            </div>
          </div>
        )}

        {/* ── Details Card ── */}
        <div style={{ background:t.card, border:`1.5px solid ${t.cardBorder}`, borderRadius:18, overflow:"hidden" }}>

          {/* Reporter */}
          {!isOwner && report.userName && (
            <DetailRow icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            } label="Reported by" value={report.userName} t={t} />
          )}

          {/* Location */}
          <DetailRow icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
          } label="Location" value={report.location || "—"} t={t} />

          {/* Date */}
          <DetailRow icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          } label="Date" value={report.date || "—"} t={t} last={!report.description} />

          {/* Description */}
          {report.description && (
            <div style={{ padding:"14px 16px", borderTop:`1px solid ${t.divider}` }}>
              <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:600, color:t.label, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Description</p>
              <p style={{ margin:0, fontSize:14, color:t.text, fontFamily:"'Inter',sans-serif", lineHeight:1.65 }}>{report.description}</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════ OWNER VIEW ══════════════════════════ */}
        {isOwner && (
          <>
            {/* Resolved banner for owner */}
            {isResolved && (
              <div style={{ borderRadius:16, border:"1.5px solid rgba(139,92,246,0.4)", background:"rgba(139,92,246,0.08)", padding:"18px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#a78bfa" strokeWidth="1.8"/><path d="M8 12l2.5 2.5L16 8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#a78bfa", fontFamily:"'Syne',sans-serif" }}>Report Resolved ✅</p>
                  <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif" }}>This report is marked as resolved and hidden from the public search feed.</p>
                </div>
              </div>
            )}

            {/* Pending Claims */}
            {(pendingClaims.length > 0 || acceptedClaims.length > 0) && (
              <div>
                <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:600, color:t.sectionLbl, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  Claims {claims.length > 0 && `(${claims.length})`}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {claims
                    .sort((a,b) => a.status === "pending" ? -1 : 1)
                    .map(claim => (
                    <ClaimCard key={claim.id} claim={claim} t={t} onAction={handleClaimAction} />
                  ))}
                </div>
              </div>
            )}

            {!isResolved && pendingClaims.length === 0 && acceptedClaims.length === 0 && (
              <div style={{ borderRadius:14, border:`1.5px dashed ${t.emptyBorder}`, background:t.emptyBg, padding:"20px 16px", textAlign:"center" }}>
                <p style={{ margin:0, fontSize:13, color:t.emptyText, fontFamily:"'Inter',sans-serif" }}>
                  No claims yet. Share your report so people can find it!
                </p>
              </div>
            )}

            {/* Mark as Resolved button */}
            {!isResolved && (
              <>
                {!resolveConfirm ? (
                  <button
                    id="mark-resolved-btn"
                    onClick={() => setResolveConfirm(true)}
                    style={{ width:"100%", padding:"14px", borderRadius:14, border:"1.5px solid rgba(139,92,246,0.4)", background:"rgba(139,92,246,0.08)", color:"#a78bfa", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12l2.5 2.5L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Mark as Resolved
                  </button>
                ) : (
                  <div style={{ background:"rgba(139,92,246,0.08)", border:"1.5px solid rgba(139,92,246,0.35)", borderRadius:14, padding:16 }}>
                    <p style={{ margin:"0 0 6px", fontSize:14, color:"#a78bfa", fontFamily:"'Syne',sans-serif", textAlign:"center", fontWeight:700 }}>
                      Mark as Resolved?
                    </p>
                    <p style={{ margin:"0 0 14px", fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif", textAlign:"center", lineHeight:1.5 }}>
                      This will hide the report from public search and stop new claims. You can still view it in your profile.
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <button onClick={() => setResolveConfirm(false)}
                        style={{ padding:"12px", borderRadius:12, border:`1.5px solid ${t.cardBorder}`, background:"transparent", color:t.subtext, fontSize:14, fontWeight:600, fontFamily:"'Inter',sans-serif", cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button onClick={handleResolve} disabled={resolveLoading}
                        style={{ padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'Inter',sans-serif", cursor:"pointer", boxShadow:"0 4px 14px rgba(139,92,246,0.35)" }}>
                        {resolveLoading ? "Resolving…" : "Yes, Resolve"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Delete button */}
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{ width:"100%", padding:"14px", borderRadius:14, border:"1.5px solid rgba(248,113,113,0.4)", background:"rgba(248,113,113,0.07)", color:"#f87171", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif", cursor:"pointer", transition:"all 0.2s" }}
              >
                Delete Report
              </button>
            ) : (
              <div style={{ background:"rgba(248,113,113,0.08)", border:"1.5px solid rgba(248,113,113,0.35)", borderRadius:14, padding:16 }}>
                <p style={{ margin:"0 0 14px", fontSize:14, color:"#f87171", fontFamily:"'Inter',sans-serif", textAlign:"center", fontWeight:500 }}>
                  Are you sure? This cannot be undone.
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button onClick={() => setDeleteConfirm(false)}
                    style={{ padding:"12px", borderRadius:12, border:`1.5px solid ${t.cardBorder}`, background:"transparent", color:t.subtext, fontSize:14, fontWeight:600, fontFamily:"'Inter',sans-serif", cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleteLoading}
                    style={{ padding:"12px", borderRadius:12, border:"none", background:"#ef4444", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'Inter',sans-serif", cursor:"pointer" }}>
                    {deleteLoading ? "Deleting…" : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════ VIEWER VIEW ══════════════════════════ */}
        {!isOwner && (
          <>
            {/* Resolved banner for viewer */}
            {isResolved && (
              <div style={{ borderRadius:16, border:"1.5px solid rgba(139,92,246,0.4)", background:"rgba(139,92,246,0.08)", padding:"18px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#a78bfa" strokeWidth="1.8"/><path d="M8 12l2.5 2.5L16 8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#a78bfa", fontFamily:"'Syne',sans-serif" }}>Report Resolved ✅</p>
                  <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif" }}>This item has been successfully returned. No new claims can be submitted.</p>
                </div>
              </div>
            )}

            {/* Claim status: accepted */}
            {myClaim?.status === "accepted" && (
              <div style={{ borderRadius:16, border:"1.5px solid rgba(34,197,94,0.4)", background:"rgba(34,197,94,0.08)", padding:"18px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#4ade80" strokeWidth="1.8"/><path d="M8 12l2.5 2.5L16 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#4ade80", fontFamily:"'Syne',sans-serif" }}>Claim Accepted! 🎉</p>
                  <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif" }}>The reporter has accepted your claim. Check Messages to connect.</p>
                </div>
              </div>
            )}

            {/* Claim status: declined */}
            {myClaim?.status === "declined" && (
              <div style={{ borderRadius:16, border:"1.5px solid rgba(248,113,113,0.4)", background:"rgba(248,113,113,0.07)", padding:"18px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.8"/><path d="M15 9l-6 6M9 9l6 6" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/></svg>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#f87171", fontFamily:"'Syne',sans-serif" }}>Claim Declined</p>
                  <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif" }}>The reporter has declined your claim.</p>
                </div>
              </div>
            )}

            {/* Claim status: pending */}
            {myClaim?.status === "pending" && (
              <div style={{ borderRadius:16, border:"1.5px solid rgba(251,146,60,0.4)", background:"rgba(251,146,60,0.07)", padding:"18px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fb923c" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/></svg>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#fb923c", fontFamily:"'Syne',sans-serif" }}>Claim Pending ⏳</p>
                  <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif" }}>Waiting for the reporter to respond.</p>
                </div>
              </div>
            )}

            {/* No claim yet — show claim button (only if not resolved) */}
            {!myClaim && !isResolved && (
              <>
                {!showMsgBox ? (
                  <button
                    onClick={() => setShowMsgBox(true)}
                    className="btn-primary"
                    style={{
                      background: isLost
                        ? "linear-gradient(135deg,#2e8de8,#1a5fa8)"
                        : "linear-gradient(135deg,#22c55e,#16a34a)",
                      boxShadow: isLost
                        ? "0 6px 20px rgba(46,141,232,0.35)"
                        : "0 6px 20px rgba(34,197,94,0.35)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      {isLost
                        ? <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>
                        : <><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></>
                      }
                    </svg>
                    {isLost ? "I Found This!" : "This is Mine!"}
                  </button>
                ) : (
                  <div style={{ background:t.card, border:`1.5px solid ${accentBorder}`, borderRadius:18, padding:18, display:"flex", flexDirection:"column", gap:14 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif" }}>
                      {isLost ? "Report that you found this" : "Claim this as yours"}
                    </p>
                    <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif", lineHeight:1.5 }}>
                      Add an optional message to help the reporter verify your claim (e.g. a unique detail about the item).
                    </p>
                    <textarea
                      className="input-field"
                      placeholder="Optional: describe something unique about this item to verify your claim..."
                      value={claimMsg}
                      onChange={e => setClaimMsg(e.target.value)}
                      style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText, minHeight:90, resize:"vertical", padding:14, fontSize:13 }}
                    />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <button onClick={() => { setShowMsgBox(false); setClaimMsg(""); }}
                        style={{ padding:"12px", borderRadius:12, border:`1.5px solid ${t.cardBorder}`, background:"transparent", color:t.subtext, fontSize:14, fontWeight:600, fontFamily:"'Inter',sans-serif", cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button onClick={handleClaim} disabled={claimLoading}
                        className="btn-primary"
                        style={{
                          background: isLost ? "linear-gradient(135deg,#2e8de8,#1a5fa8)" : "linear-gradient(135deg,#22c55e,#16a34a)",
                          padding:"12px", borderRadius:12, fontSize:14,
                        }}>
                        {claimLoading ? "Sending…" : "Send Claim"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* ── Share toast ── */}
      {shareToast && (
        <div style={{
          position:"fixed", bottom:40, left:"50%", transform:"translateX(-50%)",
          background:"linear-gradient(135deg,#1e3a5f,#162d4a)", color:"#e8f4ff",
          padding:"12px 28px", borderRadius:40, fontSize:13, fontFamily:"'Inter',sans-serif",
          fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", zIndex:200,
          whiteSpace:"nowrap", border:"1px solid rgba(100,160,230,0.3)",
          animation:"fadeUp 0.3s ease", display:"flex", alignItems:"center", gap:8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}

// ─── DETAIL ROW ───────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, t, last }) {
  return (
    <div style={{ padding:"13px 16px", display:"flex", alignItems:"flex-start", gap:12, borderBottom: last ? "none" : `1px solid ${t.divider}` }}>
      <span style={{ color:t.iconColor, marginTop:1, flexShrink:0 }}>{icon}</span>
      <div>
        <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:600, color:t.label, fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</p>
        <p style={{ margin:0, fontSize:14, color:t.text, fontFamily:"'Inter',sans-serif", fontWeight:500 }}>{value}</p>
      </div>
    </div>
  );
}

// ─── CLAIM CARD (owner view) ───────────────────────────────────────────────────
function ClaimCard({ claim, t, onAction }) {
  const isPending  = claim.status === "pending";
  const isAccepted = claim.status === "accepted";
  const isDeclined = claim.status === "declined";

  return (
    <div style={{
      background: t.card,
      border: `1.5px solid ${isPending ? "rgba(251,146,60,0.35)" : isAccepted ? "rgba(34,197,94,0.35)" : "rgba(100,160,230,0.18)"}`,
      borderRadius: 14, padding:"14px 16px",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: claim.message ? 8 : 0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#1a5fa8,#2e8de8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif" }}>{claim.claimerName}</p>
            <span style={{
              padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
              fontFamily:"'Inter',sans-serif", textTransform:"uppercase",
              background: isPending ? "rgba(251,146,60,0.15)" : isAccepted ? "rgba(34,197,94,0.15)" : "rgba(100,160,230,0.1)",
              color: isPending ? "#fb923c" : isAccepted ? "#4ade80" : t.subtext,
            }}>
              {claim.status}
            </span>
          </div>
        </div>
        {/* Accept / Decline buttons — only for pending */}
        {isPending && (
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={() => onAction(claim, "declined")}
              style={{ width:32, height:32, borderRadius:10, border:"1.5px solid rgba(248,113,113,0.4)", background:"rgba(248,113,113,0.08)", color:"#f87171", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
            >✕</button>
            <button
              onClick={() => onAction(claim, "accepted")}
              style={{ width:32, height:32, borderRadius:10, border:"1.5px solid rgba(34,197,94,0.4)", background:"rgba(34,197,94,0.08)", color:"#4ade80", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
            >✓</button>
          </div>
        )}
        {isAccepted && <span style={{ fontSize:18 }}>✅</span>}
        {isDeclined && <span style={{ fontSize:18 }}>❌</span>}
      </div>
      {claim.message && (
        <p style={{ margin:"8px 0 0 44px", fontSize:13, color:t.subtext, fontFamily:"'Inter',sans-serif", lineHeight:1.5, fontStyle:"italic" }}>
          "{claim.message}"
        </p>
      )}
    </div>
  );
}
