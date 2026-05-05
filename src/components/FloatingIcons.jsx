// ─── FLOATING ICONS ───────────────────────────────────────────────────────────
export default function FloatingIcons() {
  return (
    <>
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(30,111,191,0.16) 0%, transparent 70%)", top:-100, left:-100, animation:"pulse 6s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle, rgba(30,111,191,0.1) 0%, transparent 70%)", bottom:-80, right:-80, animation:"pulse 8s ease-in-out infinite 2s", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:52, left:20, opacity:0.09, animation:"floatA 5s ease-in-out infinite", pointerEvents:"none" }}>
        <svg width="54" height="44" viewBox="0 0 54 44" fill="none"><rect x="1" y="8" width="52" height="35" rx="7" stroke="#7eb8f7" strokeWidth="2"/><rect x="1" y="8" width="52" height="12" rx="3" stroke="#7eb8f7" strokeWidth="2"/><circle cx="40" cy="30" r="4" stroke="#7eb8f7" strokeWidth="2"/><path d="M4 8 Q27 1 50 8" stroke="#7eb8f7" strokeWidth="2" fill="none"/></svg>
      </div>
      <div style={{ position:"absolute", top:64, right:24, opacity:0.09, animation:"floatB 6.5s ease-in-out infinite 1s", pointerEvents:"none" }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="18" cy="20" r="12" stroke="#7eb8f7" strokeWidth="2"/><circle cx="18" cy="20" r="5" stroke="#7eb8f7" strokeWidth="2"/><path d="M27 27 L44 44" stroke="#7eb8f7" strokeWidth="2" strokeLinecap="round"/><path d="M38 40 L42 36" stroke="#7eb8f7" strokeWidth="2" strokeLinecap="round"/><path d="M34 44 L38 40" stroke="#7eb8f7" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      <div style={{ position:"absolute", bottom:90, left:28, opacity:0.09, animation:"floatC 7s ease-in-out infinite 0.5s", pointerEvents:"none" }}>
        <svg width="46" height="60" viewBox="0 0 46 60" fill="none"><rect x="14" y="4" width="18" height="8" rx="3" stroke="#7eb8f7" strokeWidth="2"/><rect x="14" y="48" width="18" height="8" rx="3" stroke="#7eb8f7" strokeWidth="2"/><rect x="5" y="12" width="36" height="36" rx="12" stroke="#7eb8f7" strokeWidth="2"/><circle cx="23" cy="30" r="2" fill="#7eb8f7"/><path d="M23 22 L23 30 L29 30" stroke="#7eb8f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ position:"absolute", bottom:80, right:32, opacity:0.09, animation:"floatD 5.5s ease-in-out infinite 1.5s", pointerEvents:"none" }}>
        <svg width="36" height="64" viewBox="0 0 36 64" fill="none"><rect x="10" y="4" width="16" height="44" rx="8" stroke="#7eb8f7" strokeWidth="2"/><path d="M10 44 L18 60 L26 44" stroke="#7eb8f7" strokeWidth="2" strokeLinejoin="round" fill="none"/><line x1="10" y1="14" x2="26" y2="14" stroke="#7eb8f7" strokeWidth="2"/><rect x="14" y="4" width="8" height="6" rx="2" stroke="#7eb8f7" strokeWidth="1.5"/></svg>
      </div>
    </>
  );
}
