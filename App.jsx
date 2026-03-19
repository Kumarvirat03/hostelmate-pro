import React, { useState, useRef, useEffect, useCallback } from "react";

// ── GOOGLE CLIENT ID ─────────────────────────────────────────
// TODO: Replace with your Google OAuth Client ID from console.cloud.google.com
const GOOGLE_CLIENT_ID = "1097466708241-351ggp0k2vtb9rq4bdti1u8e931tjg8v.apps.googleusercontent.com";

// ── FONTS ─────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Fraunces:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap";
document.head.appendChild(fl);

// ── THEME ─────────────────────────────────────────────────────
const T = {
  bg: "#0a0a0a", surface: "#111111", card: "#1a1a1a", border: "#252525",
  accent: "#c8f73f", accentDim: "#c8f73f18", text: "#f0f0f0", muted: "#666",
  success: "#4ade80", warning: "#fb923c", error: "#f87171", info: "#60a5fa",
  soft: "#1e1e1e", purple: "#a78bfa",
};

// ── STORAGE ───────────────────────────────────────────────────
const KEYS = { users: "hm_users", session: "hm_session", tickets: "hm_tickets", notices: "hm_notices", inout: "hm_inout", reminders: "hm_reminders" };

async function sget(k) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function sset(k, v) { try { await window.storage.set(k, JSON.stringify(v)); } catch {} }

// ── INITIAL DATA ──────────────────────────────────────────────
const INIT_TICKETS = [
  { id: "TKT-001", studentId: "s1", student: "Rahul Kumar", room: "202", issue: "Fan making noise", status: "In Progress", priority: "Medium", date: "Mar 18", staff: "Ramesh (Electrician)", rating: null },
  { id: "TKT-002", studentId: "s2", student: "Amit Singh", room: "101", issue: "WiFi not working", status: "Pending", priority: "High", date: "Mar 19", staff: "Unassigned", rating: null },
  { id: "TKT-003", studentId: "s3", student: "Priya Sharma", room: "102", issue: "Tap leaking", status: "Resolved", priority: "Low", date: "Mar 17", staff: "Vijay (Plumber)", rating: 4 },
];

const INIT_NOTICES = [
  { id: "n1", title: "April Rent Reminder", body: "April 2026 ka rent 5 tarikh tak jama karein. Late fee ₹500/day.", date: "Mar 19", type: "urgent", author: "Management" },
  { id: "n2", title: "Water Supply Break", body: "Kal subah 8-10 baje water supply band rahegi.", date: "Mar 18", type: "info", author: "Management" },
];

const STUDENTS_DATA = [
  { id: "s1", name: "Rahul Kumar", room: "202", rent: 8500, paid: false, daysOverdue: 18, email: "rahul@gmail.com", joined: "Jul 2024" },
  { id: "s2", name: "Amit Singh", room: "101", rent: 7500, paid: false, daysOverdue: 12, email: "amit@gmail.com", joined: "Aug 2024" },
  { id: "s3", name: "Priya Sharma", room: "102", rent: 8500, paid: true, daysOverdue: 0, email: "priya@gmail.com", joined: "Jul 2024" },
  { id: "s4", name: "Karan Verma", room: "201", rent: 10000, paid: false, daysOverdue: 25, email: "karan@gmail.com", joined: "Sep 2024" },
  { id: "s5", name: "Sneha Patel", room: "204", rent: 11000, paid: true, daysOverdue: 0, email: "sneha@gmail.com", joined: "Jun 2024" },
];

const MESS_MENU = {
  Sun: { b: "Puri Sabzi + Chai", l: "Special Thali (5 items)", d: "Dal + Rice + Roti + Kheer" },
  Mon: { b: "Poha + Chai", l: "Dal Tadka + Rice + Roti", d: "Paneer + Rice + Roti" },
  Tue: { b: "Upma + Juice", l: "Chole + Rice + Roti", d: "Aloo Gobi + Dal + Roti" },
  Wed: { b: "Paratha + Curd", l: "Rajma + Rice + Roti", d: "Mix Veg + Roti" },
  Thu: { b: "Idli Sambar", l: "Kadhi + Rice + Roti", d: "Palak Paneer + Roti" },
  Fri: { b: "Poha + Chai", l: "Dal Makhani + Rice", d: "Special Fried Rice + Manchurian" },
  Sat: { b: "Chole Bhature", l: "Veg Biryani + Raita", d: "Dosa + Sambar + Chutney" },
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TODAY = DAYS[new Date().getDay()];

// ── GMAIL SEND ────────────────────────────────────────────────
async function sendGmail(accessToken, to, subject, body) {
  try {
    const email = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/html; charset=utf-8", "", body].join("\n");
    const encoded = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded }),
    });
    return res.ok;
  } catch { return false; }
}

function emailTemplate(title, body, hostelName = "Sunrise PG") {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;border-radius:16px;overflow:hidden">
    <div style="background:#c8f73f;padding:20px 24px"><h2 style="margin:0;color:#0a0a0a;font-size:20px">🏠 ${hostelName}</h2></div>
    <div style="padding:24px"><h3 style="color:#c8f73f;margin-top:0">${title}</h3><p style="color:#ccc;line-height:1.6">${body}</p>
    <hr style="border-color:#333;margin:20px 0"><p style="color:#666;font-size:12px">HostelMate Pro · Automated Notification</p></div></div>`;
}

// ── CLAUDE AI ─────────────────────────────────────────────────
async function askClaude(messages, role, hostelName = "Sunrise PG") {
  const system = role === "owner"
    ? `You are HostelMate AI for ${hostelName} owner. Speak Hinglish. Give actionable advice on: rent collection, complaint management, student issues, staff coordination. Be professional, data-driven, use emojis sparingly.`
    : `You are HostelMate AI for ${hostelName} student assistant. Speak Hinglish warmly. Help with: complaints, rent (₹8,500/month), WiFi (Sunrise@2024), mess timings (B:7-9AM, L:12:30-2:30PM, D:7:30-9:30PM), gate pass (closes 10PM), hostel rules. Warden: +91 96215 88125.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system, messages }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "Thoda error aa gaya 🙏";
}

// ── CSS ───────────────────────────────────────────────────────
const globalCSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
input, textarea, button { font-family: 'DM Sans', sans-serif; }
input::placeholder, textarea::placeholder { color: #444; }
@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-5px);opacity:1} }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
@keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
@keyframes toastIn { from{opacity:0;transform:translateY(20px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
.fade-up { animation: fadeUp .35s ease both; }
.fade-in { animation: fadeIn .25s ease both; }
.btn-hover:hover { filter: brightness(1.1); transform: translateY(-1px); }
.card-hover:hover { border-color: #c8f73f44 !important; transform: translateY(-2px); }
`;

// ── TOAST ─────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "success" ? T.success : t.type === "error" ? T.error : T.card, color: t.type === "success" || t.type === "error" ? "#000" : T.text, padding: "0.7rem 1.1rem", borderRadius: 12, fontSize: "0.82rem", fontWeight: 600, animation: "toastIn .3s ease", boxShadow: "0 8px 24px #00000066", border: `1px solid ${t.type === "success" ? T.success + "44" : T.border}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"} {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

// ── MODAL ──────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "fadeIn .2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "1.75rem", width: "100%", maxWidth: 480, animation: "fadeUp .25s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "1rem" }}>{title}</div>
          <button onClick={onClose} style={{ background: T.soft, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: T.muted, fontSize: "1rem" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── LOGIN FORM ────────────────────────────────────────────────
function LoginForm({ onSuccess, role }) {
  const [step, setStep] = useState("choose");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shownOtp, setShownOtp] = useState("");

  const quickUsers = role === "owner"
    ? [{ name: "Manoj Kumar", email: "manoj@gmail.com", avatar: "👑" }, { name: "Ramesh Sharma", email: "ramesh@gmail.com", avatar: "🏢" }]
    : [{ name: "Rahul Kumar", email: "rahul@gmail.com", avatar: "🎓" }, { name: "Priya Sharma", email: "priya@gmail.com", avatar: "🎓" }, { name: "Amit Singh", email: "amit@gmail.com", avatar: "🎓" }];

  const sendOtp = async () => {
    if (!email.includes("@") || !name.trim()) { setError("Sahi naam aur email daalo!"); return; }
    setLoading(true); setError("");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    // Try EmailJS for real email
    try {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "service_gmail",
          template_id: "template_otp",
          user_id: "demo_user",
          template_params: { to_email: email, to_name: name, otp_code: code }
        })
      });
    } catch(e) { /* silent fail, OTP shown in UI */ }
    setLoading(false);
    setStep("otp");
    setShownOtp(code);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) onSuccess({ name, email, picture: null, accessToken: "demo_token", isDemo: true, role });
    else setError("OTP galat hai!");
  };

  const quickLogin = (u) => onSuccess({ name: u.name, email: u.email, picture: null, accessToken: "demo_token", isDemo: true, role });

  if (step === "otp") return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔐</div>
        <div style={{ color: T.text, fontWeight: 700, fontSize: "1rem" }}>OTP Enter Karo</div>
        <div style={{ color: T.muted, fontSize: "0.73rem", marginTop: "0.25rem" }}>{email} pe bheja gaya</div>
      </div>
      {shownOtp && (
        <div style={{ background: T.accent + "18", border: "1.5px dashed " + T.accent, borderRadius: 14, padding: "1rem", textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ color: T.muted, fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.4rem" }}>Your OTP (Demo Mode)</div>
          <div style={{ color: T.accent, fontSize: "2rem", fontWeight: 800, letterSpacing: "0.4em", fontFamily: "monospace" }}>{shownOtp}</div>
          <div style={{ color: T.muted, fontSize: "0.65rem", marginTop: "0.3rem" }}>Real app mein Gmail pe aayega</div>
        </div>
      )}
      <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP daalo" maxLength={6}
        style={{ width: "100%", background: T.soft, border: "1.5px solid " + (otp.length === 6 ? T.accent : T.border), borderRadius: 12, padding: "0.85rem", color: T.text, fontFamily: "monospace", fontSize: "1.4rem", outline: "none", boxSizing: "border-box", textAlign: "center", letterSpacing: "0.4em", marginBottom: "0.75rem", transition: "border .2s" }} />
      {error && <div style={{ color: T.error, fontSize: "0.78rem", marginBottom: "0.75rem", textAlign: "center" }}>{error}</div>}
      <button onClick={verifyOtp} style={{ width: "100%", background: otp.length === 6 ? T.accent : T.soft, border: "none", borderRadius: 12, padding: "0.85rem", cursor: otp.length === 6 ? "pointer" : "default", color: otp.length === 6 ? T.bg : T.muted, fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem", transition: "all .2s" }}>
        ✅ Verify & Login
      </button>
      <button onClick={() => { setStep("choose"); setShownOtp(""); setOtp(""); }} style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: "0.78rem" }}>← Wapas jao</button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ color: T.muted, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Quick Login</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {quickUsers.map(u => (
            <button key={u.email} onClick={() => quickLogin(u)}
              style={{ background: T.soft, border: "1px solid " + T.border, borderRadius: 12, padding: "0.7rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", transition: "all 0.2s", textAlign: "left", width: "100%", fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ fontSize: "1.3rem" }}>{u.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: "0.83rem" }}>{u.name}</div>
                <div style={{ color: T.muted, fontSize: "0.68rem" }}>{u.email}</div>
              </div>
              <span style={{ color: T.accent, fontSize: "0.72rem", fontWeight: 700 }}>Login</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ color: T.muted, fontSize: "0.7rem" }}>ya apna account</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Aapka naam"
          style={{ background: T.soft, border: "1.5px solid " + T.border, borderRadius: 12, padding: "0.75rem 1rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", outline: "none" }} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Gmail address" type="email"
          style={{ background: T.soft, border: "1.5px solid " + T.border, borderRadius: 12, padding: "0.75rem 1rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", outline: "none" }} />
        {error && <div style={{ color: T.error, fontSize: "0.75rem" }}>{error}</div>}
        <button onClick={sendOtp} disabled={loading}
          style={{ background: "#fff", border: "1.5px solid #ddd", borderRadius: 12, padding: "0.82rem 1.25rem", cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem", fontSize: "0.88rem", fontWeight: 600, color: "#333", opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
          {loading ? <div style={{ width: 18, height: 18, border: "2px solid #ddd", borderTopColor: "#333", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> :
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          }
          {loading ? "Sending OTP..." : "OTP se Login Karo"}
        </button>
      </div>
    </div>
  );
}

// ── LOGIN SCREEN ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [step, setStep] = useState(1);
  const [hov, setHov] = useState(null);

  const handleGoogleSuccess = (googleUser) => {
    onLogin({ ...googleUser, role: selectedRole });
  };

  if (step === 2 && selectedRole) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp .35s ease" }}>
        <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "0.85rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>← Back</button>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 24, padding: "2.25rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{selectedRole === "owner" ? "🏢" : "🎓"}</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontWeight: 400, fontSize: "1.6rem", marginBottom: "0.3rem" }}>
              {selectedRole === "owner" ? "Owner Login" : "Student Login"}
            </h2>
            <p style={{ color: T.muted, fontSize: "0.82rem" }}>Google account se login karo</p>
          </div>
          <LoginForm onSuccess={handleGoogleSuccess} role={selectedRole} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      <style>{globalCSS}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #c8f73f0a 0%, transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", animation: "fadeUp .5s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "0.35rem 1rem", marginBottom: "1.5rem", fontSize: "0.72rem", color: T.muted }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2s ease infinite", display: "inline-block" }} />
          Sunrise PG · Indore, MP
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.2rem,5vw,3.5rem)", color: T.text, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          HostelMate <span style={{ color: T.accent, fontStyle: "italic" }}>Pro</span>
        </h1>
        <p style={{ color: T.muted, fontSize: "0.95rem" }}>Apna role choose karo</p>
      </div>

      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
        {[
          { role: "owner", icon: "🏢", title: "Owner / Warden", sub: "Full management dashboard", color: T.purple, features: ["Analytics", "Rent tracking", "Staff management"] },
          { role: "student", icon: "🎓", title: "Student / Tenant", sub: "Your hostel companion", color: T.accent, features: ["AI chat", "Complaints", "Rent & mess"] },
        ].map(({ role, icon, title, sub, color, features }) => (
          <div key={role} onMouseEnter={() => setHov(role)} onMouseLeave={() => setHov(null)} onClick={() => { setSelectedRole(role); setStep(2); }}
            style={{ background: hov === role ? T.card : T.surface, border: `1.5px solid ${hov === role ? color + "66" : T.border}`, borderRadius: 24, padding: "2rem 1.75rem", cursor: "pointer", transition: "all 0.25s", transform: hov === role ? "translateY(-6px)" : "none", boxShadow: hov === role ? `0 20px 50px ${color}15` : "none", width: 230, animation: "fadeUp .5s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: color + "18", border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", marginBottom: "1.1rem" }}>{icon}</div>
            <div style={{ color: T.text, fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>{title}</div>
            <div style={{ color: T.muted, fontSize: "0.75rem", marginBottom: "1rem" }}>{sub}</div>
            {features.map(f => <div key={f} style={{ fontSize: "0.72rem", color: T.muted, display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}><span style={{ color: color, fontWeight: 700 }}>✓</span>{f}</div>)}
            <div style={{ marginTop: "1.25rem", background: color, color: color === T.accent ? "#0a0a0a" : "#fff", borderRadius: 10, padding: "0.55rem", textAlign: "center", fontSize: "0.82rem", fontWeight: 700, transition: "all 0.2s" }}>
              Login →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [tickets, setTickets] = useState(INIT_TICKETS);
  const [notices, setNotices] = useState(INIT_NOTICES);
  const [inout, setInout] = useState({ status: "in", log: [] });
  const [students, setStudents] = useState(STUDENTS_DATA);
  const [messMenu, setMessMenu] = useState(MESS_MENU);
  const [gmailLog, setGmailLog] = useState([]);
  const { toasts, show: toast } = useToast();

  // Load from storage
  useEffect(() => {
    (async () => {
      const t = await sget(KEYS.tickets); if (t) setTickets(t);
      const n = await sget(KEYS.notices); if (n) setNotices(n);
      const io = await sget(KEYS.inout); if (io) setInout(io);
      const s = await sget(KEYS.session);
      if (s) { setUser(s); setView(s.role === "owner" ? "dashboard" : "home"); }
    })();
  }, []);

  const login = async (u) => {
    await sset(KEYS.session, u);
    setUser(u);
    setView(u.role === "owner" ? "dashboard" : "home");
    toast(`Welcome, ${u.name}! 👋`, "success");
  };

  const logout = async () => {
    await sset(KEYS.session, null);
    setUser(null);
  };

  // Gmail send helper
  const sendEmail = async (to, subject, bodyHtml) => {
    if (!user?.accessToken || user.isDemo) {
      const log = { to, subject, time: new Date().toLocaleTimeString(), status: "demo" };
      setGmailLog(p => [log, ...p.slice(0, 9)]);
      toast(`📧 Email simulated → ${to}`, "success");
      return true;
    }
    const ok = await sendGmail(user.accessToken, to, subject, bodyHtml);
    const log = { to, subject, time: new Date().toLocaleTimeString(), status: ok ? "sent" : "failed" };
    setGmailLog(p => [log, ...p.slice(0, 9)]);
    toast(ok ? `📧 Email sent → ${to}` : `❌ Email failed → ${to}`, ok ? "success" : "error");
    return ok;
  };

  // Ticket actions
  const raiseTicket = async (issue, priority = "Medium") => {
    const newT = { id: `TKT-${String(tickets.length + 1).padStart(3, "0")}`, studentId: "s1", student: user?.name || "Student", room: "202", issue, status: "Pending", priority, date: "Today", staff: "Unassigned", rating: null };
    const updated = [newT, ...tickets];
    setTickets(updated);
    await sset(KEYS.tickets, updated);
    toast(`✅ Ticket ${newT.id} raised!`, "success");
    // Send email to owner
    await sendEmail("owner@gmail.com", `🔧 New Complaint: ${newT.id}`, emailTemplate(`New Complaint Raised - ${newT.id}`, `<b>Student:</b> ${newT.student} (Room ${newT.room})<br><b>Issue:</b> ${issue}<br><b>Priority:</b> ${priority}<br><b>Status:</b> Pending`));
    return newT.id;
  };

  const updateTicketStatus = async (id, status, staff) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status, staff: staff || t.staff } : t);
    setTickets(updated);
    await sset(KEYS.tickets, updated);
    toast(`Ticket ${id} → ${status}`, "success");
    const t = updated.find(t => t.id === id);
    if (t) await sendEmail(t.email || "student@gmail.com", `🔧 Ticket ${id} Update`, emailTemplate(`Ticket ${id} Status Update`, `Aapki complaint "<b>${t.issue}</b>" ka status update hua hai.<br><br><b>New Status:</b> ${status}<br><b>Staff Assigned:</b> ${staff || t.staff}`));
  };

  const sendRentReminder = async (student) => {
    await sendEmail(student.email, `💰 Rent Reminder — ${student.name}`, emailTemplate("Rent Due Reminder", `Dear ${student.name},<br><br>Aapka <b>April 2026 rent ₹${student.rent.toLocaleString()}</b> abhi pending hai.<br>Please 5 April 2026 tak jama karein.<br><br>Late fee: ₹500/day`, "Sunrise PG"));
  };

  const sendBulkReminders = async () => {
    const overdue = students.filter(s => !s.paid);
    for (const s of overdue) await sendRentReminder(s);
    toast(`📧 ${overdue.length} reminders sent!`, "success");
  };

  const postNotice = async (title, body, type) => {
    const newN = { id: `n${Date.now()}`, title, body, date: "Today", type, author: user?.name || "Management" };
    const updated = [newN, ...notices];
    setNotices(updated);
    await sset(KEYS.notices, updated);
    toast("📌 Notice posted!", "success");
    // Send to all students
    for (const s of students) {
      await sendEmail(s.email, `📌 Notice: ${title}`, emailTemplate(title, body));
    }
  };

  const updateInOut = async (status) => {
    const entry = { name: user?.name, status, time: new Date().toLocaleTimeString(), date: "Today" };
    const updated = { status, log: [entry, ...(inout.log || []).slice(0, 19)] };
    setInout(updated);
    await sset(KEYS.inout, updated);
    toast(status === "in" ? "🏠 Marked as Inside!" : "🚶 Marked as Outside!", "success");
  };

  const markRentPaid = async (studentId) => {
    const updated = students.map(s => s.id === studentId ? { ...s, paid: true, daysOverdue: 0 } : s);
    setStudents(updated);
    const s = updated.find(s => s.id === studentId);
    toast(`✅ ${s.name} — Rent marked paid!`, "success");
    await sendEmail(s.email, "✅ Rent Received — Thank You!", emailTemplate("Rent Payment Confirmed", `Dear ${s.name},<br><br>Aapka <b>April 2026 rent ₹${s.rent.toLocaleString()}</b> receive ho gaya hai.<br><br>Thank you! 🙏`));
  };

  const updateMessMenu = async (day, meal, value) => {
    const updated = { ...messMenu, [day]: { ...messMenu[day], [meal]: value } };
    setMessMenu(updated);
    toast(`🍽️ ${day} ${meal === "b" ? "breakfast" : meal === "l" ? "lunch" : "dinner"} updated!`, "success");
  };

  if (!user) return <><style>{globalCSS}</style><LoginScreen onLogin={login} /><Toast toasts={toasts} /></>;

  const isOwner = user.role === "owner";

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <style>{globalCSS}</style>
      <Toast toasts={toasts} />
      <Sidebar isOwner={isOwner} view={view} setView={setView} user={user} onLogout={logout} tickets={tickets} />
      <main style={{ flex: 1, overflowY: "auto", animation: "fadeIn .2s ease" }}>
        {isOwner ? (
          <>
            {view === "dashboard" && <OwnerDashboard students={students} tickets={tickets} onSendBulk={sendBulkReminders} onSendReminder={sendRentReminder} gmailLog={gmailLog} />}
            {view === "students" && <StudentsView students={students} onRemind={sendRentReminder} onMarkPaid={markRentPaid} toast={toast} />}
            {view === "rooms" && <RoomsView students={students} />}
            {view === "tickets" && <TicketsView isOwner tickets={tickets} onUpdate={updateTicketStatus} toast={toast} />}
            {view === "rent" && <RentView isOwner students={students} onRemind={sendRentReminder} onMarkPaid={markRentPaid} onBulkRemind={sendBulkReminders} />}
            {view === "mess" && <MessView isOwner messMenu={messMenu} onUpdate={updateMessMenu} />}
            {view === "notices" && <NoticesView isOwner notices={notices} onPost={postNotice} />}
            {view === "ai" && <AIChat role="owner" user={user} />}
            {view === "gmail" && <GmailLog log={gmailLog} />}
          </>
        ) : (
          <>
            {view === "home" && <StudentHome user={user} students={students} setView={setView} messMenu={messMenu} notices={notices} />}
            {view === "ai" && <AIChat role="student" user={user} />}
            {view === "tickets" && <TicketsView isOwner={false} tickets={tickets.filter(t => t.studentId === "s1")} onRaise={raiseTicket} toast={toast} />}
            {view === "rent" && <RentView isOwner={false} students={students} user={user} />}
            {view === "mess" && <MessView isOwner={false} messMenu={messMenu} />}
            {view === "notices" && <NoticesView isOwner={false} notices={notices} />}
            {view === "inout" && <InOutView inout={inout} onUpdate={updateInOut} students={students} />}
          </>
        )}
      </main>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────
function Sidebar({ isOwner, view, setView, user, onLogout, tickets }) {
  const pending = tickets.filter(t => t.status === "Pending").length;
  const nav = isOwner ? [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "students", icon: "👥", label: "Students" },
    { id: "rooms", icon: "🚪", label: "Rooms" },
    { id: "tickets", icon: "🎫", label: "Complaints", badge: pending },
    { id: "rent", icon: "💰", label: "Rent" },
    { id: "mess", icon: "🍽️", label: "Mess" },
    { id: "notices", icon: "📌", label: "Notices" },
    { id: "ai", icon: "🤖", label: "AI Assistant" },
    { id: "gmail", icon: "📧", label: "Email Log" },
  ] : [
    { id: "home", icon: "⬡", label: "Home" },
    { id: "ai", icon: "🤖", label: "AI Chat" },
    { id: "tickets", icon: "🎫", label: "My Complaints" },
    { id: "rent", icon: "💰", label: "Rent & Bills" },
    { id: "mess", icon: "🍽️", label: "Mess Menu" },
    { id: "notices", icon: "📌", label: "Notices" },
    { id: "inout", icon: "🚦", label: "In/Out" },
  ];

  return (
    <aside style={{ width: 215, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "1.1rem 1rem", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>🏠</div>
        <div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2 }}>HostelMate Pro</div>
          <div style={{ color: T.muted, fontSize: "0.65rem" }}>Sunrise PG · Indore</div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: isOwner ? T.purple + "33" : T.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0, overflow: "hidden" }}>
          {user?.picture ? <img src={user.picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (isOwner ? "👑" : "🎓")}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ color: T.text, fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ color: isOwner ? T.purple : T.accent, fontSize: "0.65rem", fontWeight: 600 }}>{isOwner ? "Owner" : "Student"}</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0.5rem 0.4rem", overflowY: "auto" }}>
        {nav.map(({ id, icon, label, badge }) => (
          <button key={id} onClick={() => setView(id)} style={{ width: "100%", background: view === id ? T.accent + "18" : "transparent", border: `1px solid ${view === id ? T.accent + "44" : "transparent"}`, borderRadius: 10, padding: "0.55rem 0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.55rem", color: view === id ? T.accent : T.muted, fontSize: "0.8rem", fontWeight: view === id ? 600 : 400, marginBottom: 1, textAlign: "left", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ fontSize: "0.9rem" }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && <span style={{ background: T.error, color: "#fff", fontSize: "0.58rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 10, minWidth: 16, textAlign: "center" }}>{badge}</span>}
          </button>
        ))}
      </nav>

      <div style={{ padding: "0.6rem 0.4rem", borderTop: `1px solid ${T.border}` }}>
        <button onClick={onLogout} style={{ width: "100%", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.5rem", cursor: "pointer", color: T.muted, fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
          ← Logout
        </button>
      </div>
    </aside>
  );
}

// ── OWNER DASHBOARD ───────────────────────────────────────────
function OwnerDashboard({ students, tickets, onSendBulk, gmailLog }) {
  const pending = students.filter(s => !s.paid);
  const pendingTickets = tickets.filter(t => t.status === "Pending");

  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem", color: T.text, fontWeight: 400, marginBottom: "0.25rem" }}>Good day, Manoj! 👋</h1>
        <p style={{ color: T.muted, fontSize: "0.82rem" }}>Sunrise PG · March 2026</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
        {[
          { icon: "🏠", l: "Occupied", v: `${students.length}/40`, s: "35 rooms occupied", c: T.info },
          { icon: "💰", l: "Collected", v: "₹2.38L", s: `₹${pending.reduce((a,s)=>a+s.rent,0).toLocaleString()} pending`, c: T.success },
          { icon: "🎫", l: "Open Tickets", v: `${pendingTickets.length}`, s: "Need attention", c: T.error },
          { icon: "👥", l: "Students", v: `${students.length}`, s: `${pending.length} overdue`, c: T.accent },
        ].map(({ icon, l, v, s, c }) => (
          <div key={l} style={{ background: T.card, border: `1px solid ${c}33`, borderRadius: 16, padding: "1.1rem", transition: "all 0.2s" }} className="card-hover">
            <div style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{icon}</div>
            <div style={{ color: c, fontWeight: 800, fontSize: "1.5rem", lineHeight: 1 }}>{v}</div>
            <div style={{ color: T.text, fontSize: "0.75rem", fontWeight: 600, marginTop: "0.2rem" }}>{l}</div>
            <div style={{ color: T.muted, fontSize: "0.68rem" }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Overdue rent */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: "0.85rem" }}>💰 Overdue Rent</div>
            <button onClick={onSendBulk} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 8, padding: "0.35rem 0.75rem", cursor: "pointer", color: T.bg, fontSize: "0.72rem", fontWeight: 700, transition: "all 0.2s" }}>
              📧 Remind All
            </button>
          </div>
          {pending.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ color: T.text, fontSize: "0.8rem", fontWeight: 500 }}>{s.name}</div>
                <div style={{ color: T.muted, fontSize: "0.68rem" }}>{s.daysOverdue}d overdue</div>
              </div>
              <div style={{ color: T.error, fontWeight: 700, fontSize: "0.82rem" }}>₹{s.rent.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Recent email log */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "0.85rem", marginBottom: "1rem" }}>📧 Recent Emails</div>
          {gmailLog.length === 0
            ? <div style={{ color: T.muted, fontSize: "0.78rem", textAlign: "center", padding: "1rem" }}>No emails sent yet</div>
            : gmailLog.slice(0, 5).map((l, i) => (
              <div key={i} style={{ padding: "0.4rem 0", borderBottom: `1px solid ${T.border}`, display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.7rem" }}>{l.status === "sent" ? "✅" : l.status === "demo" ? "🔵" : "❌"}</span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ color: T.text, fontSize: "0.73rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.subject}</div>
                  <div style={{ color: T.muted, fontSize: "0.65rem" }}>{l.to}</div>
                </div>
                <div style={{ color: T.muted, fontSize: "0.65rem", flexShrink: 0 }}>{l.time}</div>
              </div>
            ))
          }
        </div>

        {/* Urgent tickets */}
        <div style={{ background: T.card, border: `1px solid ${T.error}33`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.85rem" }}>🚨 Urgent Tickets</div>
          {pendingTickets.length === 0
            ? <div style={{ color: T.muted, fontSize: "0.78rem" }}>Sab theek hai! ✅</div>
            : pendingTickets.map(t => (
              <div key={t.id} style={{ padding: "0.45rem 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ color: T.text, fontSize: "0.78rem" }}>{t.issue}</div>
                <div style={{ color: T.muted, fontSize: "0.68rem" }}>{t.student} · {t.id}</div>
              </div>
            ))
          }
        </div>

        {/* Revenue */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>📊 Revenue</div>
          <div style={{ color: T.success, fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.3rem" }}>₹2,38,000</div>
          <div style={{ color: T.muted, fontSize: "0.72rem", marginBottom: "0.75rem" }}>/ ₹2,89,000 target</div>
          <div style={{ background: T.soft, borderRadius: 6, height: 8, overflow: "hidden", marginBottom: "0.4rem" }}>
            <div style={{ background: `linear-gradient(90deg,${T.success},${T.accent})`, width: "82%", height: "100%", borderRadius: 6, transition: "width 1s ease" }} />
          </div>
          <div style={{ color: T.muted, fontSize: "0.68rem" }}>82% collected</div>
        </div>
      </div>
    </div>
  );
}

// ── STUDENTS VIEW ─────────────────────────────────────────────
function StudentsView({ students, onRemind, onMarkPaid, toast }) {
  const [confirmId, setConfirmId] = useState(null);
  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, marginBottom: "0.25rem" }}>Students</h2>
      <p style={{ color: T.muted, fontSize: "0.82rem", marginBottom: "1.5rem" }}>{students.length} total · {students.filter(s=>!s.paid).length} overdue</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {students.map(s => (
          <div key={s.id} style={{ background: T.card, border: `1px solid ${s.paid ? T.border : T.error+"33"}`, borderRadius: 14, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.2s" }} className="card-hover">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: T.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>🎓</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontWeight: 600, fontSize: "0.88rem" }}>{s.name}</div>
              <div style={{ color: T.muted, fontSize: "0.72rem" }}>Room {s.room} · {s.email}</div>
            </div>
            <div style={{ textAlign: "right", marginRight: "0.5rem" }}>
              <div style={{ color: T.text, fontWeight: 700 }}>₹{s.rent.toLocaleString()}</div>
              {s.paid ? <span style={{ color: T.success, fontSize: "0.72rem", fontWeight: 600 }}>✅ Paid</span> : <span style={{ color: T.error, fontSize: "0.72rem" }}>⏳ {s.daysOverdue}d overdue</span>}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {!s.paid && <>
                <button onClick={() => onRemind(s)} className="btn-hover" style={{ background: T.accent+"18", border: `1px solid ${T.accent}44`, color: T.accent, borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, transition: "all 0.2s" }}>📧 Remind</button>
                <button onClick={() => setConfirmId(s.id)} className="btn-hover" style={{ background: T.success+"18", border: `1px solid ${T.success}44`, color: T.success, borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, transition: "all 0.2s" }}>✅ Mark Paid</button>
              </>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Confirm Payment">
        <p style={{ color: T.muted, fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          {students.find(s => s.id === confirmId)?.name} ka rent ₹{students.find(s => s.id === confirmId)?.rent.toLocaleString()} paid mark karna chahte hain? Email confirmation bhi jayegi.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { onMarkPaid(confirmId); setConfirmId(null); }} className="btn-hover" style={{ flex: 1, background: T.success, border: "none", borderRadius: 10, padding: "0.7rem", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: "0.85rem", transition: "all 0.2s" }}>✅ Confirm</button>
          <button onClick={() => setConfirmId(null)} style={{ flex: 1, background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.7rem", cursor: "pointer", color: T.muted, fontSize: "0.85rem" }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

// ── ROOMS VIEW ─────────────────────────────────────────────────
function RoomsView({ students }) {
  const ROOMS = [
    {no:"101",type:"Single",rent:7500}, {no:"102",type:"Double",rent:8500},
    {no:"103",type:"Single",rent:7500}, {no:"201",type:"AC Single",rent:10000},
    {no:"202",type:"Double",rent:8500}, {no:"203",type:"Single",rent:7500},
    {no:"204",type:"AC Double",rent:11000}, {no:"301",type:"Single",rent:7500},
  ];
  const studentInRoom = (no) => students.find(s => s.room === no);

  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, marginBottom: "1.5rem" }}>Rooms</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "0.85rem" }}>
        {ROOMS.map(r => {
          const s = studentInRoom(r.no);
          const statusColor = s ? T.success : T.accent;
          return (
            <div key={r.no} style={{ background: T.card, border: `1px solid ${statusColor}33`, borderRadius: 16, padding: "1.1rem", cursor: "pointer", transition: "all 0.2s" }} className="card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <div style={{ color: T.text, fontWeight: 700, fontSize: "1rem" }}>Room {r.no}</div>
                <span style={{ background: statusColor+"22", color: statusColor, fontSize: "0.65rem", padding: "0.15rem 0.55rem", borderRadius: 20, fontWeight: 700 }}>{s ? "Occupied" : "Vacant"}</span>
              </div>
              <div style={{ color: T.muted, fontSize: "0.73rem", marginBottom: "0.35rem" }}>{r.type}</div>
              <div style={{ color: T.accent, fontWeight: 700, fontSize: "0.88rem" }}>₹{r.rent.toLocaleString()}/mo</div>
              {s && <div style={{ color: T.muted, fontSize: "0.7rem", marginTop: "0.4rem" }}>👤 {s.name}</div>}
              {!s && <div style={{ color: T.accent, fontSize: "0.72rem", fontWeight: 600, marginTop: "0.4rem" }}>Available ✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TICKETS VIEW ──────────────────────────────────────────────
function TicketsView({ isOwner, tickets, onUpdate, onRaise, toast }) {
  const [newMode, setNewMode] = useState(false);
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [staffModal, setStaffModal] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? tickets : tickets.filter(t => t.status === filter);
  const statusColor = (s) => ({ "Resolved": T.success, "In Progress": T.info, "Pending": T.warning }[s] || T.muted);
  const priColor = (p) => ({ High: T.error, Medium: T.warning, Low: T.success }[p] || T.muted);

  const handleRaise = async () => {
    if (!issue.trim()) return;
    await onRaise(issue, priority);
    setIssue(""); setPriority("Medium"); setNewMode(false);
  };

  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, margin: 0 }}>Complaints</h2>
          <p style={{ color: T.muted, fontSize: "0.78rem", marginTop: "0.2rem" }}>{tickets.length} total · {tickets.filter(t=>t.status==="Pending").length} pending</p>
        </div>
        {!isOwner && <button onClick={() => setNewMode(true)} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 10, padding: "0.55rem 1.1rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.82rem", transition: "all 0.2s" }}>+ New Complaint</button>}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
        {["All", "Pending", "In Progress", "Resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? T.accent : T.card, border: `1px solid ${filter === f ? T.accent : T.border}`, borderRadius: 20, padding: "0.35rem 0.85rem", cursor: "pointer", color: filter === f ? T.bg : T.muted, fontSize: "0.75rem", fontWeight: filter === f ? 700 : 400, transition: "all 0.15s" }}>{f}</button>
        ))}
      </div>

      {newMode && (
        <div style={{ background: T.card, border: `1px solid ${T.accent}44`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem", animation: "fadeUp .25s ease" }}>
          <div style={{ color: T.text, fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.88rem" }}>🔧 New Complaint</div>
          <textarea value={issue} onChange={e => setIssue(e.target.value)} placeholder="Problem describe karo..."
            style={{ width: "100%", background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.75rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", resize: "vertical", minHeight: 80, outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8, marginTop: "0.75rem", alignItems: "center" }}>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.45rem 0.75rem", color: T.text, fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif" }}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <button onClick={handleRaise} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.82rem", transition: "all 0.2s" }}>Submit</button>
            <button onClick={() => setNewMode(false)} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", color: T.muted, fontSize: "0.82rem" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {filtered.map(t => (
          <div key={t.id} style={{ background: T.card, border: `1px solid ${t.status === "Pending" ? T.warning+"44" : T.border}`, borderRadius: 14, padding: "1rem 1.25rem", transition: "all 0.2s" }} className="card-hover">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ color: T.muted, fontSize: "0.68rem", background: T.soft, padding: "0.1rem 0.5rem", borderRadius: 6, fontFamily: "monospace" }}>{t.id}</span>
                  <span style={{ fontSize: "0.68rem", color: priColor(t.priority), background: priColor(t.priority)+"22", padding: "0.1rem 0.5rem", borderRadius: 20 }}>{t.priority}</span>
                </div>
                <div style={{ color: T.text, fontSize: "0.87rem", fontWeight: 500, marginBottom: "0.3rem" }}>{t.issue}</div>
                <div style={{ color: T.muted, fontSize: "0.7rem" }}>{isOwner ? `👤 ${t.student} (R${t.room}) · 🔧 ${t.staff}` : `📅 ${t.date} · ${t.staff}`}</div>
              </div>
              <span style={{ background: statusColor(t.status)+"22", color: statusColor(t.status), fontSize: "0.7rem", padding: "0.25rem 0.7rem", borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{t.status}</span>
            </div>
            {isOwner && t.status === "Pending" && (
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                <button onClick={() => { setStaffModal(t.id); setStaffName(""); }} className="btn-hover" style={{ background: T.info+"22", border: `1px solid ${T.info}44`, color: T.info, borderRadius: 8, padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.73rem", fontWeight: 600, transition: "all 0.2s" }}>👷 Assign Staff</button>
                <button onClick={() => onUpdate(t.id, "Resolved")} className="btn-hover" style={{ background: T.success+"22", border: `1px solid ${T.success}44`, color: T.success, borderRadius: 8, padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.73rem", fontWeight: 600, transition: "all 0.2s" }}>✅ Resolve</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={!!staffModal} onClose={() => setStaffModal(null)} title="Assign Staff">
        <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Staff name (e.g., Ramesh - Electrician)"
          style={{ width: "100%", background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.7rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { onUpdate(staffModal, "In Progress", staffName); setStaffModal(null); }} className="btn-hover" style={{ flex: 1, background: T.accent, border: "none", borderRadius: 10, padding: "0.7rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.85rem", transition: "all 0.2s" }}>Assign & Notify</button>
          <button onClick={() => setStaffModal(null)} style={{ flex: 1, background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.7rem", cursor: "pointer", color: T.muted, fontSize: "0.85rem" }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

// ── RENT VIEW ──────────────────────────────────────────────────
function RentView({ isOwner, students, onRemind, onMarkPaid, onBulkRemind }) {
  const pending = students.filter(s => !s.paid);
  const paid = students.filter(s => s.paid);
  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, margin: 0 }}>Rent {isOwner ? "Collection" : "& Bills"}</h2>
          <p style={{ color: T.muted, fontSize: "0.78rem", marginTop: "0.2rem" }}>March 2026</p>
        </div>
        {isOwner && <button onClick={onBulkRemind} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 10, padding: "0.55rem 1.1rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.82rem", transition: "all 0.2s" }}>📧 Remind All Overdue</button>}
      </div>

      {!isOwner && (
        <div style={{ background: T.card, border: `1px solid ${T.error}44`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ color: T.muted, fontSize: "0.7rem", marginBottom: "0.25rem" }}>APRIL 2026 DUE</div>
          <div style={{ color: T.text, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>₹8,500</div>
          <div style={{ color: T.error, fontSize: "0.8rem", marginTop: "0.3rem" }}>⚠️ Due by April 5 · 18 days overdue</div>
        </div>
      )}

      {isOwner && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.85rem", marginBottom: "1.5rem" }}>
          {[{ l: "Collected", v: "₹2,38,000", c: T.success, i: "✅" }, { l: "Pending", v: `₹${pending.reduce((a,s)=>a+s.rent,0).toLocaleString()}`, c: T.error, i: "⏳" }, { l: "Overdue", v: `${pending.length}`, c: T.warning, i: "🔔" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${s.c}33`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
              <div>{s.i}</div>
              <div style={{ color: s.c, fontWeight: 800, fontSize: "1.3rem", marginTop: "0.25rem" }}>{s.v}</div>
              <div style={{ color: T.muted, fontSize: "0.7rem" }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: "0.65rem", color: T.error, fontWeight: 700, fontSize: "0.8rem" }}>⏳ Overdue ({pending.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {pending.map(s => (
          <div key={s.id} style={{ background: T.card, border: `1px solid ${T.error}33`, borderRadius: 12, padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem" }}>{s.name}</div>
              <div style={{ color: T.muted, fontSize: "0.7rem" }}>Room {s.room} · {s.daysOverdue} days overdue</div>
            </div>
            <div style={{ color: T.error, fontWeight: 700 }}>₹{s.rent.toLocaleString()}</div>
            {isOwner && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onRemind(s)} className="btn-hover" style={{ background: T.accent+"18", border:`1px solid ${T.accent}44`, color: T.accent, borderRadius: 8, padding: "0.3rem 0.65rem", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s" }}>📧</button>
                <button onClick={() => onMarkPaid(s.id)} className="btn-hover" style={{ background: T.success+"18", border:`1px solid ${T.success}44`, color: T.success, borderRadius: 8, padding: "0.3rem 0.65rem", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s" }}>✅</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "0.65rem", color: T.success, fontWeight: 700, fontSize: "0.8rem" }}>✅ Paid ({paid.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {paid.map(s => (
          <div key={s.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem" }}>{s.name}</div>
              <div style={{ color: T.muted, fontSize: "0.7rem" }}>Room {s.room}</div>
            </div>
            <div style={{ color: T.success, fontWeight: 700 }}>₹{s.rent.toLocaleString()}</div>
            <span style={{ color: T.success, fontSize: "0.72rem", fontWeight: 600 }}>✅ Paid</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MESS VIEW ─────────────────────────────────────────────────
function MessView({ isOwner, messMenu, onUpdate }) {
  const [day, setDay] = useState(TODAY);
  const [editMeal, setEditMeal] = useState(null);
  const [editVal, setEditVal] = useState("");
  const menu = messMenu[day] || messMenu["Mon"];

  const handleEdit = (meal) => { setEditMeal(meal); setEditVal(menu[meal]); };
  const handleSave = () => { onUpdate(day, editMeal, editVal); setEditMeal(null); };

  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, marginBottom: "0.25rem" }}>Mess Menu</h2>
      <p style={{ color: T.muted, fontSize: "0.78rem", marginBottom: "1.25rem" }}>B: 7-9AM · L: 12:30-2:30PM · D: 7:30-9:30PM</p>

      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", overflowX: "auto", scrollbarWidth: "none" }}>
        {DAYS.map(d => (
          <button key={d} onClick={() => setDay(d)} style={{ background: day === d ? T.accent : T.card, border: `1px solid ${day === d ? T.accent : T.border}`, borderRadius: 10, padding: "0.4rem 0.85rem", cursor: "pointer", color: day === d ? T.bg : T.muted, fontSize: "0.75rem", fontWeight: day === d ? 700 : 400, whiteSpace: "nowrap", transition: "all 0.15s", position: "relative" }}>
            {d}{d === TODAY && <span style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, borderRadius: "50%", background: T.success }} />}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[["☀️", "b", "Breakfast", "7:00–9:00 AM"], ["🌤️", "l", "Lunch", "12:30–2:30 PM"], ["🌙", "d", "Dinner", "7:30–9:30 PM"]].map(([ico, key, name, time]) => (
          <div key={key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ color: T.text, fontWeight: 600, fontSize: "0.88rem" }}>{ico} {name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: T.muted, fontSize: "0.7rem" }}>{time}</span>
                {isOwner && <button onClick={() => handleEdit(key)} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 6, padding: "0.2rem 0.5rem", cursor: "pointer", color: T.muted, fontSize: "0.68rem" }}>✏️ Edit</button>}
              </div>
            </div>
            {editMeal === key
              ? <div style={{ display: "flex", gap: 8 }}>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex: 1, background: T.soft, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "0.5rem 0.75rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", outline: "none" }} />
                  <button onClick={handleSave} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.75rem", transition: "all 0.2s" }}>Save</button>
                  <button onClick={() => setEditMeal(null)} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer", color: T.muted, fontSize: "0.75rem" }}>Cancel</button>
                </div>
              : <div style={{ color: T.accent, fontSize: "0.85rem" }}>{menu[key]}</div>
            }
          </div>
        ))}
      </div>

      {!isOwner && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "1rem" }}>
          <div style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.75rem" }}>📝 Aaj ka feedback</div>
          <FeedbackButtons />
        </div>
      )}
    </div>
  );
}

function FeedbackButtons() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {["😍 Excellent", "😊 Good", "😐 Average", "😞 Poor"].map(e => (
        <button key={e} onClick={() => setSelected(e)} style={{ background: selected === e ? T.accent+"22" : T.soft, border: `1px solid ${selected === e ? T.accent : T.border}`, borderRadius: 20, padding: "0.35rem 0.85rem", cursor: "pointer", color: selected === e ? T.accent : T.muted, fontSize: "0.75rem", fontWeight: selected === e ? 700 : 400, transition: "all 0.15s" }}>{e}</button>
      ))}
      {selected && <span style={{ color: T.success, fontSize: "0.75rem", alignSelf: "center", fontWeight: 600 }}>✅ Feedback submitted!</span>}
    </div>
  );
}

// ── NOTICES VIEW ──────────────────────────────────────────────
function NoticesView({ isOwner, notices, onPost }) {
  const [newMode, setNewMode] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "general" });
  const typeColor = { urgent: T.error, info: T.info, general: T.muted };

  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, margin: 0 }}>Notice Board</h2>
          <p style={{ color: T.muted, fontSize: "0.78rem", marginTop: "0.2rem" }}>{notices.length} notices</p>
        </div>
        {isOwner && <button onClick={() => setNewMode(true)} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 10, padding: "0.55rem 1.1rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.82rem", transition: "all 0.2s" }}>+ Post Notice</button>}
      </div>

      {newMode && (
        <div style={{ background: T.card, border: `1px solid ${T.accent}44`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem", animation: "fadeUp .25s ease" }}>
          <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Notice ka title..."
            style={{ width: "100%", background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.7rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", marginBottom: "0.6rem" }} />
          <textarea value={form.body} onChange={e => setForm(p=>({...p,body:e.target.value}))} placeholder="Notice content..."
            style={{ width: "100%", background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.7rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", resize: "vertical", minHeight: 80, outline: "none", boxSizing: "border-box", marginBottom: "0.6rem" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.45rem 0.75rem", color: T.text, fontSize: "0.8rem" }}>
              <option value="general">General</option><option value="info">Info</option><option value="urgent">Urgent</option>
            </select>
            <button onClick={() => { onPost(form.title, form.body, form.type); setForm({title:"",body:"",type:"general"}); setNewMode(false); }} className="btn-hover" style={{ background: T.accent, border: "none", borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", color: T.bg, fontWeight: 700, fontSize: "0.82rem", transition: "all 0.2s" }}>Post & Email All</button>
            <button onClick={() => setNewMode(false)} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", color: T.muted, fontSize: "0.82rem" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {notices.map(n => (
          <div key={n.id} style={{ background: T.card, border: `1px solid ${typeColor[n.type]}44`, borderRadius: 16, padding: "1.1rem 1.25rem", transition: "all 0.2s" }} className="card-hover">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem" }}>{n.title}</div>
              <span style={{ background: typeColor[n.type]+"22", color: typeColor[n.type], fontSize: "0.65rem", padding: "0.15rem 0.55rem", borderRadius: 20, fontWeight: 700, textTransform: "capitalize", flexShrink: 0, marginLeft: "0.75rem" }}>{n.type}</span>
            </div>
            <div style={{ color: T.muted, fontSize: "0.8rem", lineHeight: 1.55, marginBottom: "0.4rem" }}>{n.body}</div>
            <div style={{ color: T.muted, fontSize: "0.68rem" }}>📅 {n.date} · {n.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── IN/OUT VIEW ───────────────────────────────────────────────
function InOutView({ inout, onUpdate, students }) {
  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, marginBottom: "0.25rem" }}>In/Out Status</h2>
      <p style={{ color: T.muted, fontSize: "0.78rem", marginBottom: "1.5rem" }}>Update your location</p>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "2rem", textAlign: "center", marginBottom: "1.5rem", maxWidth: 380 }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem", transition: "all 0.3s" }}>{inout.status === "in" ? "🏠" : "🚶‍♂️"}</div>
        <div style={{ color: T.text, fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.25rem" }}>
          {inout.status === "in" ? "Inside Hostel" : "Outside"}
        </div>
        <div style={{ color: T.muted, fontSize: "0.78rem", marginBottom: "1.5rem" }}>Last updated: {inout.log?.[0]?.time || "—"}</div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          {["in", "out"].map(s => (
            <button key={s} onClick={() => onUpdate(s)} className="btn-hover" style={{ background: inout.status === s ? (s === "in" ? T.success : T.warning) : T.soft, border: `1px solid ${inout.status === s ? (s==="in"?T.success:T.warning) : T.border}`, borderRadius: 12, padding: "0.65rem 1.4rem", cursor: "pointer", color: inout.status === s ? "#000" : T.muted, fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s" }}>
              {s === "in" ? "🏠 I'm In" : "🚶 Going Out"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ color: T.muted, fontWeight: 600, fontSize: "0.78rem", marginBottom: "0.65rem" }}>📋 All Students</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 380 }}>
        {students.map(s => (
          <div key={s.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span>{s.id === "s1" ? (inout.status === "in" ? "🏠" : "🚶") : Math.random() > 0.5 ? "🏠" : "🚶"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontSize: "0.83rem", fontWeight: 500 }}>{s.name}</div>
              <div style={{ color: T.muted, fontSize: "0.68rem" }}>Room {s.room}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GMAIL LOG ──────────────────────────────────────────────────
function GmailLog({ log }) {
  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, marginBottom: "0.25rem" }}>Email Log</h2>
      <p style={{ color: T.muted, fontSize: "0.78rem", marginBottom: "1.5rem" }}>Sabhi sent/simulated emails</p>
      {log.length === 0
        ? <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "2rem", textAlign: "center", color: T.muted, fontSize: "0.85rem" }}>Koi email nahi bheji gayi abhi tak</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {log.map((l, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0.9rem 1.1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span style={{ fontSize: "1.1rem" }}>{l.status === "sent" ? "✅" : l.status === "demo" ? "🔵" : "❌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontWeight: 500, fontSize: "0.85rem" }}>{l.subject}</div>
                  <div style={{ color: T.muted, fontSize: "0.7rem" }}>To: {l.to}</div>
                </div>
                <div style={{ color: T.muted, fontSize: "0.7rem" }}>{l.time}</div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: 20, background: l.status === "sent" ? T.success+"22" : l.status === "demo" ? T.info+"22" : T.error+"22", color: l.status === "sent" ? T.success : l.status === "demo" ? T.info : T.error, fontWeight: 600 }}>
                  {l.status === "demo" ? "Demo" : l.status}
                </span>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ── STUDENT HOME ───────────────────────────────────────────────
function StudentHome({ user, students, setView, messMenu, notices }) {
  const menu = messMenu[TODAY] || messMenu["Mon"];
  return (
    <div style={{ padding: "1.75rem" }} className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.75rem" }}>
        {user?.picture ? <img src={user.picture} alt="" style={{ width: 48, height: 48, borderRadius: 14, objectFit: "cover" }} /> : <div style={{ width: 48, height: 48, borderRadius: 14, background: T.accent+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>🎓</div>}
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem", color: T.text, fontWeight: 400, margin: 0 }}>Hey, {user?.name?.split(" ")[0]}! 👋</h1>
          <p style={{ color: T.muted, fontSize: "0.78rem", margin: 0 }}>Room 202 · Sunrise PG</p>
        </div>
      </div>

      {/* Rent alert */}
      <div onClick={() => setView("rent")} style={{ background: T.error+"12", border: `1px solid ${T.error}33`, borderRadius: 16, padding: "1.1rem 1.25rem", marginBottom: "1.25rem", cursor: "pointer", transition: "all 0.2s" }} className="card-hover">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.4rem" }}>💰</span>
          <div>
            <div style={{ color: T.error, fontWeight: 700, fontSize: "0.88rem" }}>April Rent Due — ₹8,500</div>
            <div style={{ color: T.muted, fontSize: "0.73rem" }}>Due by April 5 · 18 days overdue → Tap to view</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[{ icon: "🤖", label: "AI Chat", view: "ai" }, { icon: "🔧", label: "Complaint", view: "tickets" }, { icon: "🍽️", label: "Mess", view: "mess" }, { icon: "📌", label: "Notices", view: "notices" }, { icon: "🚦", label: "In/Out", view: "inout" }, { icon: "💰", label: "Rent", view: "rent" }].map(({ icon, label, view }) => (
          <button key={label} onClick={() => setView(view)} className="btn-hover card-hover" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1rem 0.5rem", cursor: "pointer", textAlign: "center", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>{icon}</div>
            <div style={{ color: T.muted, fontSize: "0.7rem", fontWeight: 500 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Today mess */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.75rem" }}>🍽️ Aaj ka Mess ({TODAY})</div>
        {[["☀️ B", menu.b], ["🌤️ L", menu.l], ["🌙 D", menu.d]].map(([m, item]) => (
          <div key={m} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <span style={{ color: T.muted, fontSize: "0.73rem", minWidth: 28 }}>{m}</span>
            <span style={{ color: T.accent, fontSize: "0.75rem" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Latest notice */}
      {notices[0] && (
        <div onClick={() => setView("notices")} style={{ background: T.card, border: `1px solid ${T.error}33`, borderRadius: 16, padding: "1rem 1.25rem", cursor: "pointer", transition: "all 0.2s" }} className="card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <div style={{ color: T.text, fontWeight: 600, fontSize: "0.83rem" }}>📌 {notices[0].title}</div>
            <span style={{ color: T.error, fontSize: "0.65rem", fontWeight: 700 }}>URGENT</span>
          </div>
          <div style={{ color: T.muted, fontSize: "0.75rem", lineHeight: 1.4 }}>{notices[0].body.slice(0, 80)}...</div>
        </div>
      )}
    </div>
  );
}

// ── AI CHAT ───────────────────────────────────────────────────
function AIChat({ role, user }) {
  const isOwner = role === "owner";
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: isOwner
      ? `Namaste ${user?.name?.split(" ")[0]} ji! 👋\n\nAaj ka update:\n🚨 2 tickets unassigned\n💸 3 students overdue rent\n✅ Baaki sab normal\n\nKya karna chahenge?`
      : `Namaste ${user?.name?.split(" ")[0]}! 🏠\n\nMain hoon Sunrise PG ka AI Assistant!\n\n💡 WiFi: Sunrise@2024\n🍽️ Mess: B 7-9AM · L 12:30PM · D 7:30PM\n🚪 Gate closes: 10 PM\n\nKya help chahiye?`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    const updated = [...msgs, { role: "user", content: text }];
    setMsgs(updated);
    setInput("");
    setLoading(true);
    const reply = await askClaude(updated, role);
    setMsgs(p => [...p, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const quick = isOwner
    ? ["Aaj ka summary do", "Overdue rent list", "Urgent complaints", "Rent reminders bhejo"]
    : ["WiFi password?", "Rent kitna hai?", "Complaint karna hai", "Mess ka time?"];

  return (
    <div style={{ padding: "1.75rem", height: "calc(100vh - 3.5rem)", display: "flex", flexDirection: "column" }} className="fade-up">
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", color: T.text, fontSize: "1.6rem", fontWeight: 400, margin: 0 }}>AI Assistant</h2>
        <p style={{ color: T.muted, fontSize: "0.78rem", marginTop: "0.2rem" }}>Claude AI · Hinglish mein baat karo</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "0.75rem" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp .2s ease" }}>
            {m.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: 10, background: T.accent+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0, marginRight: "0.5rem", alignSelf: "flex-end" }}>🤖</div>
            )}
            <div style={{ maxWidth: "74%", padding: "0.75rem 1rem", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? T.accent : T.card, color: m.role === "user" ? T.bg : T.text, fontSize: "0.85rem", lineHeight: 1.6, border: m.role === "user" ? "none" : `1px solid ${T.border}`, whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: T.accent+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🤖</div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "18px 18px 18px 4px", padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, animation: `bounce 1.2s ease ${i*.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>

      {msgs.length <= 1 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginBottom: "0.6rem" }}>
          {quick.map(q => (
            <button key={q} onClick={() => send(q)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "0.4rem 0.9rem", cursor: "pointer", color: T.muted, fontSize: "0.73rem", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>{q}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Kuch bhi pucho..."
          style={{ flex: 1, background: T.card, border: `1.5px solid ${input ? T.accent+"44" : T.border}`, borderRadius: 14, padding: "0.7rem 1rem", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", outline: "none", transition: "border .2s" }} />
        <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-hover" style={{ width: 44, height: 44, borderRadius: 14, border: "none", background: input.trim() && !loading ? T.accent : T.soft, cursor: input.trim() && !loading ? "pointer" : "default", color: input.trim() ? T.bg : T.muted, fontSize: "1.1rem", transition: "all 0.2s", flexShrink: 0 }}>➤</button>
      </div>
    </div>
  );
}
