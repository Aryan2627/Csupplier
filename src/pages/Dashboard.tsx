import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle2, ShoppingBag, TrendingUp, ArrowRight, Calendar, Clock } from "lucide-react";

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
      fetch("https://sourcing.procgen.in/api/vendor-events", { headers: { "Authorization": "Bearer " + token } })
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (Array.isArray(data)) setRecentEvents(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else { window.location.href = "/login"; }
  }, []);

  if (!vendor) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b" }}>Loading...</div>;

  const now = new Date().getTime();
  const activeEvents = recentEvents.filter(e => !e.endTime || new Date(e.endTime).getTime() > now);

  const stats = [
    { label: "Active Invitations", value: activeEvents.length, icon: <Calendar size={22} color="#2563eb" />, bg: "#eff6ff", border: "#bfdbfe", textColor: "#1e3a8a" },
    { label: "Submitted Bids", value: 0, icon: <CheckCircle2 size={22} color="#16a34a" />, bg: "#f0fdf4", border: "#86efac", textColor: "#15803d" },
    { label: "Purchase Orders", value: 0, icon: <ShoppingBag size={22} color="#7c3aed" />, bg: "#faf5ff", border: "#d8b4fe", textColor: "#6d28d9" },
    { label: "Win Rate", value: "--", icon: <TrendingUp size={22} color="#ea580c" />, bg: "#fff7ed", border: "#fed7aa", textColor: "#c2410c" },
  ];

  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("auction")) return { bg: "#fef2f2", color: "#dc2626" };
    if (t.includes("tech")) return { bg: "#f0fdf4", color: "#16a34a" };
    return { bg: "#eff6ff", color: "#2563eb" };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ backgroundColor: "#1e3a8a", padding: "32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Welcome back, {vendor.name}!</h1>
          <p style={{ margin: "6px 0 0 0", color: "#bfdbfe", fontSize: "0.95rem" }}>Here is your procurement activity at a glance.</p>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: s.bg, border: "1px solid " + s.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: s.textColor, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500, marginTop: "4px" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a" }}>Recent Sourcing Events</h2>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>Your latest invitations</p>
            </div>
            <button onClick={() => navigate("/events")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
              View All <ArrowRight size={15} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Loading events...</div>
          ) : recentEvents.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <FileText size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
              <div style={{ fontWeight: 600, color: "#475569" }}>No events yet</div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>You will be notified when a buyer invites you.</div>
            </div>
          ) : (
            recentEvents.slice(0, 6).map((event: any, idx: number) => {
              const badge = getTypeBadge(event.type);
              const isLast = idx === Math.min(recentEvents.length, 6) - 1;
              const ended = event.endTime && new Date(event.endTime).getTime() < now;
              return (
                <div key={event.id} onClick={() => navigate("/events/" + event.id)} style={{ padding: "18px 24px", borderBottom: isLast ? "none" : "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                      <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>{event.title || event.refId}</span>
                      <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, backgroundColor: badge.bg, color: badge.color }}>{event.type || "Standard"}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", gap: "12px", alignItems: "center" }}>
                      <span><FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />{event.refId}</span>
                      {event.endTime && <span style={{ color: ended ? "#94a3b8" : "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}><Clock size={12} />{ended ? "Ended" : "Active"}</span>}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#94a3b8" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
