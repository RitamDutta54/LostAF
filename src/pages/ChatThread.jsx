import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { 
  collection, doc, getDoc, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, updateDoc, arrayRemove 
} from "firebase/firestore";

// ─── PAGE: CHAT THREAD ─────────────────────────────────────────────────────────
export default function ChatThread({ t }) {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Fetch thread info
  useEffect(() => {
    if (!currentUser) return;
    const fetchThread = async () => {
      try {
        const snap = await getDoc(doc(db, "threads", threadId));
        if (snap.exists() && snap.data().participants.includes(currentUser.uid)) {
          setThread({ id: snap.id, ...snap.data() });
        } else {
          setThread(null);
        }
      } catch (e) {
        console.error("Fetch thread error:", e);
      }
    };
    fetchThread();
  }, [threadId, currentUser]);

  // Clear unread status when viewing thread
  useEffect(() => {
    if (thread && thread.unreadBy && thread.unreadBy.includes(currentUser.uid)) {
      updateDoc(doc(db, "threads", threadId), {
        unreadBy: arrayRemove(currentUser.uid)
      }).catch(e => console.error("Could not read thread", e));
    }
  }, [thread, currentUser, threadId]);

  // 2. Listen for messages
  useEffect(() => {
    if (!currentUser || !threadId) return;
    const q = query(
      collection(db, "threads", threadId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setMessages(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [threadId, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");

    try {
      // Create new message in subcollection
      await addDoc(collection(db, "threads", threadId, "messages"), {
        senderId: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });

      // Update parent thread with lastMessage and updatedAt so inbox sorts to top
      const otherUserUid = thread?.participants.find(uid => uid !== currentUser.uid);
      await updateDoc(doc(db, "threads", threadId), {
        lastMessage: text,
        unreadBy: otherUserUid ? [otherUserUid] : [],
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Send error:", e);
      setInputText(text); // on fail, restore input
    }
    setSending(false);
  };

  if (!thread && !loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:t.bg }}>
        <p style={{ color:"#f87171" }}>Thread not found or access denied.</p>
      </div>
    );
  }

  const otherUid = thread?.participants.find(uid => uid !== currentUser?.uid);
  const otherUser = thread?.users?.[otherUid] || { name: "Loading..." };

  return (
    <div style={{ height:"100vh", width:"100%", display:"flex", flexDirection:"column", background:t.bg, overflow:"hidden" }}>
      
      {/* ── Header ── */}
      <div style={{ padding:"52px 24px 16px", display:"flex", alignItems:"center", gap:14, background:t.card, borderBottom:`1.5px solid ${t.cardBorder}`, zIndex:10 }}>
        <button 
          onClick={() => navigate(-1)}
          className="back-btn" 
          style={{ background:t.backBtn, border:`1.5px solid ${t.backBorder}`, flexShrink:0 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#2e8de8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#1a5fa8,#2e8de8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <h1 style={{ margin:0, fontSize:"16px", fontWeight:700, color:t.text, fontFamily:"'Syne',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {otherUser.name}
            </h1>
            <p style={{ margin:"2px 0 0", fontSize:"11px", fontWeight:600, color:"#2e8de8", fontFamily:"'Inter',sans-serif", textTransform:"uppercase", letterSpacing:"0.04em" }}>
              {thread?.reportTitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── Chat Canvas ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:12 }}>
        
        {/* Helper text at top of thread */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <p style={{ margin:0, fontSize:12, color:t.subtext, fontFamily:"'Inter',sans-serif" }}>
            This chat is secure. Do not share financial information.
          </p>
        </div>

        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUser.uid;
          // Determine if previous message was from the same person to group bubbles
          const isFirstInGroup = i === 0 || messages[i-1].senderId !== msg.senderId;

          return (
            <div key={msg.id} style={{ display:"flex", flexDirection:"column", alignItems: isMine ? "flex-end" : "flex-start", marginTop: isFirstInGroup ? 8 : 0 }}>
              <div 
                style={{ 
                  maxWidth:"80%", 
                  padding:"12px 16px",
                  fontSize:"14px", fontFamily:"'Inter',sans-serif", lineHeight:1.5,
                  background: isMine ? "linear-gradient(135deg,#2e8de8,#1a5fa8)" : t.card,
                  color: isMine ? "#fff" : t.text,
                  border: isMine ? "none" : `1px solid ${t.cardBorder}`,
                  borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  boxShadow: isMine ? "0 4px 14px rgba(46,141,232,0.2)" : "none"
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div style={{ padding:"16px 24px 34px", background:t.card, borderTop:`1px solid ${t.cardBorder}` }}>
        <form onSubmit={handleSend} style={{ display:"flex", gap:10 }}>
          <input
            className="input-field"
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ flex:1, background:t.input, borderColor:t.inputBorder, color:t.inputText, borderRadius:24, padding:"12px 20px", fontSize:14 }}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || sending}
            style={{ 
              width:44, height:44, borderRadius:22, border:"none", 
              background: !inputText.trim() ? t.inputBorder : "linear-gradient(135deg,#2e8de8,#1a5fa8)",
              color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor: !inputText.trim() ? "not-allowed" : "pointer",
              transition:"all 0.2s"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}
