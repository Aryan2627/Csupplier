import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, CheckCircle2, ShoppingBag, TrendingUp,
  ArrowRight, Clock, Gavel, AlertCircle, Zap,
  Trophy, Activity, ChevronRight, Star
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const [recentEvents, setRecentEvents] = React.useState<any[]>([]);
  const [vendor, setVendor] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const v = localStorage.getItem("vendor");
    const token = localStorage.getItem("token");
    if (v && token) {
      const parsedVendor = JSON.parse(v);
      setVendor(parsedVendor);
      fetch("https://cpanel-swart.vercel.app/api/vendor-events", {
        headers: { "Authorization": "Bearer " + token }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (Array.isArray(data)) setRecentEvents(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else { window.location.href = "/login"; }
  }, []);

  if (!vendor) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: "16px" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading your dashboard…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const now = new Date().getTime();
  const activeEvents = recentEvents.filter(e => !e.endTime || new Date(e.endTime).getTime() > now);
  const closedEvents = recentEvents.filter(e => e.endTime && new Date(e.endTime).getTime() <= now);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    {
      label: "Active Invitations", value: activeEvents.length,
      icon: <CalendarDays size={20} />, color: "#2563eb",
      bg: "linear-gradient(135deg, #eff6ff, #dbeafe)",
      border: "#bfdbfe", textColor: "#1e3a8a",
      delta: "+2 this week", trend: "up"
    },
    {
      label: "Submitted Bids", value: 0,
      icon: <CheckCircle2 size={20} />, color: "#10b981",
      bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      border: "#86efac", textColor: "#15803d",
      delta: "On track", trend: "neutral"
    },
    {
      label: "Purchase Orders", value: 0,
      icon: <ShoppingBag size={20} />, color: "#7c3aed",
      bg: "linear-gradient(135deg, #faf5ff, #ede9fe)",
      border: "#d8b4fe", textColor: "#6d28d9",
      delta: "Awaiting POs", trend: "neutral"
    },
    {
      label: "Win Rate", value: "--",
      icon: <Trophy size={20} />, color: "#ea580c",
      bg: "linear-gradient(135deg, #fff7ed, #fed7aa)",
      border: "#fdba74", textColor: "#c2410c",
      delta: "Submit bids to track", trend: "neutral"
    },
  ];

  const getEventType = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("auction")) return { label: "Reverse Auction", color: "#dc2626", bg: "#fef2f2" };
    if (t.includes("rfq")) return { label: "RFQ", color: "#2563eb", bg: "#eff6ff" };
    if (t.includes("tech")) return { label: "Technical", color: "#16a34a", bg: "#f0fdf4" };
    return { label: "RFP", color: "#7c3aed", bg: "#faf5ff" };
  };

  const getDeadlineStatus = (endTime: string) => {
    if (!endTime) return { label: "Open", color: "#10b981" };
    const diff = new Date(endTime).getTime() - Date.now();
    const hrs = diff / (1000 * 60 * 60);
    if (hrs < 0) return { label: "Closed", color: "#ef4444" };
    if (hrs < 24) return { label: `${Math.floor(hrs)}h left`, color: "#f59e0b" };
    const days = Math.floor(hrs / 24);
    return { label: `${days}d left`, color: "#10b981" };
  };

  return (
    <div style={{ minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #071330 0%, #0d1f4f 55%, #1a2f6b 100%)",
        padding: "32px 32px 80px", position: "relative", overflow: "hidden"
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-40%", right: "-5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(37,99,235,0.2), transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30%", left: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px rgba(16,185,129,0.8)" }} />
            <span style={{ color: "#4ade80", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>PORTAL ACTIVE</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            {greeting()}, <span style={{ color: "#60a5fa" }}>{vendor.name}</span>! 👋
          </h1>
          <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: "0.95rem" }}>
            You have <strong style={{ color: "#fff" }}>{activeEvents.length} active sourcing events</strong> waiting for your response.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px 40px" }}>

        {/* Stats pulled up */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "-44px", position: "relative", zIndex: 10, marginBottom: "32px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: "16px",
              border: `1px solid ${s.border}`,
              padding: "20px", display: "flex", flexDirection: "column", gap: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              transition: "transform 0.2s, box-shadow 0.2s", cursor: "default"
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  {s.icon}
                </div>
                <div style={{ padding: "3px 8px", borderRadius: "20px", background: `${s.color}10`, fontSize: "0.65rem", color: s.color, fontWeight: 700 }}>
                  {s.delta}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: s.textColor, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, marginTop: "4px" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>

          {/* Events list */}
          <div>
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Active Sourcing Events</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{activeEvents.length} open for bidding</div>
                </div>
                <button
                  onClick={() => navigate("/events")}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", color: "#2563eb", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; }}
                >
                  View All <ArrowRight size={14} />
                </button>
              </div>

              {loading ? (
                <div style={{ padding: "48px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading events…</span>
                </div>
              ) : activeEvents.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#94a3b8" }}>
                    <Gavel size={28} />
                  </div>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>No active events</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>You will be notified when new sourcing events are posted.</div>
                </div>
              ) : (
                <div style={{ padding: "8px" }}>
                  {activeEvents.slice(0, 6).map((ev, idx) => {
                    const type = getEventType(ev.type || ev.eventType || "rfq");
                    const deadline = getDeadlineStatus(ev.endTime);
                    return (
                      <div
                        key={ev.id || idx}
                        onClick={() => navigate(`/events/${ev.id}`)}
                        style={{
                          padding: "14px 16px", borderRadius: "10px", cursor: "pointer",
                          border: "1px solid transparent", transition: "all 0.18s",
                          display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px"
                        }}
                        onMouseEnter={e => { const t = e.currentTarget as HTMLDivElement; t.style.background = "#f8fafc"; t.style.borderColor = "#e2e8f0"; }}
                        onMouseLeave={e => { const t = e.currentTarget as HTMLDivElement; t.style.background = "transparent"; t.style.borderColor = "transparent"; }}
                      >
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: type.bg, border: `1px solid ${type.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: type.color, flexShrink: 0 }}>
                          <Gavel size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title || ev.name || "Untitled Event"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "3px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ background: type.bg, color: type.color, padding: "1px 7px", borderRadius: "20px", fontWeight: 600, fontSize: "0.65rem" }}>{type.label}</span>
                            {ev.category && <span>{ev.category}</span>}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                            <Clock size={11} color={deadline.color} />
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: deadline.color }}>{deadline.label}</span>
                          </div>
                          <div style={{ marginTop: "4px" }}>
                            <ChevronRight size={14} color="#cbd5e1" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Quick actions */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={16} color="#f59e0b" /> Quick Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "Browse Events", sub: "See all active RFQs", icon: <CalendarDays size={16} />, color: "#2563eb", bg: "#eff6ff", path: "/events" },
                  { label: "My Bids", sub: "Track submitted bids", icon: <Gavel size={16} />, color: "#7c3aed", bg: "#faf5ff", path: "/bids" },
                  { label: "Purchase Orders", sub: "View awarded orders", icon: <ShoppingBag size={16} />, color: "#10b981", bg: "#f0fdf4", path: "/orders" },
                  { label: "Profile Settings", sub: "Update your company info", icon: <Activity size={16} />, color: "#ea580c", bg: "#fff7ed", path: "/settings" },
                ].map((a, i) => (
                  <button key={i} onClick={() => navigate(a.path)} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px", borderRadius: "10px",
                    background: "#f8fafc", border: "1px solid #f1f5f9",
                    cursor: "pointer", width: "100%", textAlign: "left",
                    transition: "all 0.18s"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = `${a.color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: a.bg, border: `1px solid ${a.color}25`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.85rem" }}>{a.label}</div>
                      <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{a.sub}</div>
                    </div>
                    <ChevronRight size={14} color="#cbd5e1" style={{ marginLeft: "auto" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Status card */}
            <div style={{
              borderRadius: "16px", overflow: "hidden",
              background: "linear-gradient(135deg, #071330, #0d1f4f)",
              border: "1px solid rgba(37,99,235,0.3)",
              boxShadow: "0 4px 20px rgba(7,19,48,0.2)"
            }}>
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>Vendor Status</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <AlertCircle size={14} color="#60a5fa" />
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Complete your profile to get full access to all events.</span>
                </div>
                {[
                  { label: "Company verified", done: true },
                  { label: "Documents uploaded", done: false },
                  { label: "Tax info submitted", done: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: item.done ? "#10b981" : "rgba(255,255,255,0.1)",
                      border: item.done ? "none" : "1px solid rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {item.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ color: item.done ? "#4ade80" : "#94a3b8", fontSize: "0.8rem" }}>{item.label}</span>
                  </div>
                ))}
                <button onClick={() => navigate("/settings")} style={{
                  marginTop: "12px", width: "100%", padding: "10px",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: "none", borderRadius: "10px", color: "#fff",
                  fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                  transition: "opacity 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  Complete Profile →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
