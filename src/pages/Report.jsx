import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CATEGORIES = [
  "Electronics", "Documents / ID", "Keys", "Wallet / Purse", 
  "Bags / Backpack", "Clothing", "Jewelry / Watch", "Other"
];

// Cloudinary config
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

export default function Report({ t }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    type: "lost", // or "found"
    title: "",
    description: "",
    category: "",
    location: "",
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });
  const [imageFiles, setImageFiles] = useState([]); // up to 2 files

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 2) {
      setError("Max 2 images allowed.");
      return;
    }
    setError("");
    setImageFiles(prev => [...prev, ...files].slice(0, 2));
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToCloudinary = async () => {
    if (imageFiles.length === 0) return [];
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.warn("Cloudinary env vars missing. Skipping actual upload.");
      return imageFiles.map((_, i) => `https://via.placeholder.com/300x300?text=Placeholder+Image+${i+1}`);
    }

    const uploadedUrls = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        uploadedUrls.push(data.secure_url);
      } else {
        console.error("Cloudinary response:", data);
        throw new Error(data.error?.message || "Failed to upload image.");
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.location) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true); setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // 1. Upload images (non-fatal — if Cloudinary fails, submit without images)
      let imageUrls = [];
      try {
        imageUrls = await uploadImagesToCloudinary();
      } catch (imgErr) {
        console.warn("Image upload failed, submitting without images:", imgErr.message);
      }

      // 2. Save to Firestore
      await addDoc(collection(db, "reports"), {
        ...form,
        images: imageUrls,
        userId: user.uid,
        userName: user.displayName || "Anonymous User", // Note: you might want to fetch real name from users collection if displayName is empty
        status: "active",
        createdAt: serverTimestamp(),
      });

      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Failed to submit report. " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", paddingBottom:"40px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", width:350, height:350, borderRadius:"50%", background:`radial-gradient(circle, ${form.type==="lost"?"rgba(249,115,22,0.1)":"rgba(34,197,94,0.1)"} 0%, transparent 70%)`, top:-80, right:-80, pointerEvents:"none", transition:"background 0.3s" }} />

      {/* Header */}
      <div style={{ padding:"52px 24px 20px", display:"flex", alignItems:"center", gap:"16px", animation:"fadeUp 0.3s ease both" }}>
        <button className="back-btn" onClick={() => navigate("/home")} style={{ background:t.backBtn, border:`1.5px solid ${t.backBorder}`, zIndex:10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke={form.type==="lost"?"#fb923c":"#4ade80"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ margin:0, fontSize:"24px", fontWeight:800, color:t.text, fontFamily:"'Syne',sans-serif" }}>Create Report</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:"20px", animation:"fadeUp 0.5s ease both" }}>
        
        {/* Type Toggle */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", background:t.card, padding:"6px", borderRadius:"20px", border:`1.5px solid ${t.cardBorder}` }}>
          <button type="button" onClick={()=>setForm(f=>({...f,type:"lost"}))} style={{ padding:"12px", borderRadius:"14px", border:"none", background:form.type==="lost"?"#fb923c":"transparent", color:form.type==="lost"?"#fff":t.subtext, fontSize:"15px", fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>Lost Item</button>
          <button type="button" onClick={()=>setForm(f=>({...f,type:"found"}))} style={{ padding:"12px", borderRadius:"14px", border:"none", background:form.type==="found"?"#4ade80":"transparent", color:form.type==="found"?"#fff":t.subtext, fontSize:"15px", fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>Found Item</button>
        </div>

        {/* Title */}
        <div>
          <label style={{ color:t.label }}>Item Title *</label>
          <input className="input-field" type="text" placeholder="E.g., Black Leather Wallet" value={form.title} onChange={set("title")} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText }} required />
        </div>

        {/* Category */}
        <div>
          <label style={{ color:t.label }}>Category *</label>
          <select className="input-field" value={form.category} onChange={set("category")} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText, appearance:"none" }} required>
            <option value="" disabled style={{ color:"#000", background:"#fff" }}>Select a category</option>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ color:"#000", background:"#fff" }}>{c}</option>)}
          </select>
        </div>

        {/* Location */}
        <div>
          <label style={{ color:t.label }}>Location *</label>
          <input className="input-field" type="text" placeholder="Where was it lost/found?" value={form.location} onChange={set("location")} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText }} required />
        </div>

        {/* Date */}
        <div>
          <label style={{ color:t.label }}>Date *</label>
          <input className="input-field" type="date" value={form.date} onChange={set("date")} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText }} required />
        </div>

        {/* Description */}
        <div>
          <label style={{ color:t.label }}>Description</label>
          <textarea className="input-field" placeholder="Provide any recognizable details..." value={form.description} onChange={set("description")} style={{ background:t.input, borderColor:t.inputBorder, color:t.inputText, minHeight:"100px", resize:"vertical", paddingTop:"14px" }} />
        </div>

        {/* Images */}
        <div>
          <label style={{ color:t.label, display:"flex", justifyContent:"space-between" }}>
            <span>Photos</span>
            <span style={{opacity:0.6}}>{imageFiles.length}/2</span>
          </label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"10px", marginTop:"8px" }}>
            {imageFiles.map((file, i) => (
              <div key={i} style={{ aspectRatio:"1/1", borderRadius:"12px", background:t.emptyBg, position:"relative", overflow:"hidden", border:`1.5px solid ${t.emptyBorder}` }}>
                <img src={URL.createObjectURL(file)} alt="Preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <button type="button" onClick={()=>removeImage(i)} style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.5)", color:"#fff", border:"none", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>✕</button>
              </div>
            ))}
            {imageFiles.length < 2 && (
              <label style={{ aspectRatio:"1/1", borderRadius:"12px", background:`rgba(46,141,232,0.05)`, border:`1.5px dashed rgba(46,141,232,0.3)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#2e8de8", gap:"4px", transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background=`rgba(46,141,232,0.1)`} onMouseLeave={e=>e.currentTarget.style.background=`rgba(46,141,232,0.05)`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                <span style={{ fontSize:"11px", fontWeight:600 }}>Add</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display:"none" }} />
              </label>
            )}
          </div>
          {(!CLOUD_NAME || !UPLOAD_PRESET) && (
             <p style={{ color:"#f97316", fontSize:"12px", marginTop:"8px" }}>⚠️ Cloudinary keys missing. Will use placeholder images.</p>
          )}
        </div>

        {error && <p style={{ color:"#f87171", fontSize:"13px", textAlign:"center", marginTop:"8px" }}>{error}</p>}

        <button type="submit" className="btn-primary" style={{ marginTop:"12px", background:form.type==="lost"?"linear-gradient(135deg,#f97316,#ea580c)":"linear-gradient(135deg,#22c55e,#16a34a)", boxShadow:`0 6px 20px ${form.type==="lost"?"rgba(249,115,22,0.3)":"rgba(34,197,94,0.3)"}` }} disabled={loading}>
          {loading ? "Submitting..." : `Submit ${form.type === "lost" ? "Lost" : "Found"} Report`}
        </button>

      </form>
    </div>
  );
}
