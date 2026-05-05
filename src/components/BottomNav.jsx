import { useNavigate } from "react-router-dom";

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
export default function BottomNav({ active, t, onComingSoon }) {
  const navigate = useNavigate();
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"480px", background:t.navBg, backdropFilter:"blur(20px)", borderTop:`1px solid ${t.navBorder}`, display:"grid", gridTemplateColumns:"repeat(5, 1fr)", padding:"10px 0 20px", zIndex:50 }}>
      {[
        { id:"home",     path:"/home",    label:"Home",     built:true,  icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 4l9 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        { id:"search",   path:"/search",  label:"Search",   built:true,  icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg> },
        { id:"add",      path:"/report",  label:"Report",   built:true, special:true, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> },
        { id:"messages", path:"/messages",label:"Messages", built:true, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7l-4 4V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/></svg> },
        { id:"profile",  path:"/profile", label:"Profile",  built:true,  icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.9"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg> },
      ].map(item => (
        <button key={item.id} onClick={() => item.built ? navigate(item.path) : onComingSoon(item.label)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", background:"none", border:"none", cursor:"pointer", padding:"4px", color: active === item.id ? "#2e8de8" : t.subtext, transition:"color 0.2s" }}>
          {item.special ? (
            <div style={{ width:44, height:44, borderRadius:"14px", background:"linear-gradient(135deg,#2e8de8,#1a5fa8)", display:"flex", alignItems:"center", justifyContent:"center", marginTop:"-20px", boxShadow:"0 4px 20px rgba(46,141,232,0.45)", color:"#fff" }}>{item.icon}</div>
          ) : item.icon}
          <span style={{ fontSize:"10px", fontFamily:"'Inter',sans-serif", fontWeight:500, letterSpacing:"0.02em" }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
