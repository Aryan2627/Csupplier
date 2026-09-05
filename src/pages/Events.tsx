import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Clock, FileText, Package, Calendar, CheckCircle2, AlertCircle, Inbox } from "lucide-react";

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const v = localStorage.getItem("vendor");
    const token = localStorage.getItem("token");
    if (v && token) {
      const parsedVendor = JSON.parse(v);
      setVendor(parsedVendor);
      fetch("https://sourcing.procgen.in/api/vendor-events", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("vendor");
            window.location.href = "/login";
            return;
          }
          if (!res.ok) { setErrorMsg(`Backend returned ${res.status} ${res.statusText}`); return []; }
          const ct = res.headers.get("content-type");
          if (ct && ct.includes("application/json")) return res.json();
          throw new Error("API misconfigured - received HTML instead of JSON");
        })
        .then((data) => {
          if (Array.isArray(data)) setEvents(data);
          else if (data && data.error) setErrorMsg(data.error);
        })
        .catch((err) => setErrorMsg(`Network error: ${err.message}`));
    } else {
      window.location.href = "/login";
    }
  }, []);

  const [now, setNow] = useState(new Date().getTime());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeLeft = (endTime: string) => {
    if (!endTime) return null;
    const diff = new Date(endTime).getTime() - now;
    if (diff <= 0) return { label: "Ended", urgent: false, ended: true };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const urgent = diff < 3600000; // less than 1 hour
    if (days > 0) return { label: `${days}d ${hours}h ${minutes}m remaining`, urgent: false, ended: false };
    if (hours > 0) return { label: `${hours}h ${minutes}m ${seconds}s remaining`, urgent, ended: false };
    return { label: `${minutes}m ${seconds}s remaining`, urgent: true, ended: false };
  };

  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("auction")) return { label: "Auction", bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
    if (t.includes("tech")) return { label: "Technical", bg: "#f0fdf4", color: "#16a34a", border: "#86efac" };
    if (t.includes("rfq")) return { label: "RFQ", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    return { label: type || "Standard", bg: "#f8fafc", color: "#475569", border: "#cbd5e1" };
  };

  if (!vendor) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#64748b" }}>
      Loading your events...
    </div>
  );

  const activeEvents = events.filter((e) => !e.endTime || new Date(e.endTime).getTime() > now);
  const historyEvents = events.filter((e) => e.endTime && new Date(e.endTime).getTime() <= now);
  let displayEvents = activeTab === "active" ? activeEvents : historyEvents;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayEvents = displayEvents.filter(
      (e) => (e.refId && e.refId.toLowerCase().includes(q)) || (e.title && e.title.toLowerCase().includes(q))
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "system-ui, sans-serif" }}>
      {/* Blue Header */}
      <div style={{ backgroundColor: "#1e3a8a", padding: "32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
            Sourcing Events
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#bfdbfe", fontSize: "0.95rem" }}>
            Welcome back, <strong>{vendor.name}</strong>. You have <strong>{activeEvents.length}</strong> active invitation{activeEvents.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Active Invitations", value: activeEvents.length, icon: <FileText size={20} color="#2563eb" />, bg: "#eff6ff", border: "#bfdbfe", textColor: "#1e3a8a" },
            { label: "Closed Events", value: historyEvents.length, icon: <CheckCircle2 size={20} color="#16a34a" />, bg: "#f0fdf4", border: "#86efac", textColor: "#15803d" },
            { label: "Total Events", value: events.length, icon: <Calendar size={20} color="#7c3aed" />, bg: "#faf5ff", border: "#d8b4fe", textColor: "#6d28d9" },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}`, borderRadius: "12px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "44px", height: "44px", backgroundColor: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: stat.textColor, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500, marginTop: "4px" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", backgroundColor: "#f8fafc", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              {(["active", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 20px", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                    backgroundColor: activeTab === tab ? "#1e3a8a" : "transparent",
                    color: activeTab === tab ? "#fff" : "#64748b",
                    transition: "all 0.2s"
                  }}
                >
                  {tab === "active" ? `Active (${activeEvents.length})` : `History (${historyEvents.length})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by event ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none", fontSize: "0.875rem", backgroundColor: "#f8fafc", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Event List */}
          <div>
            {errorMsg ? (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <AlertCircle size={40} color="#ef4444" style={{ marginBottom: "12px" }} />
                <div style={{ color: "#ef4444", fontWeight: 600 }}>Error fetching events</div>
                <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "4px" }}>{errorMsg}</div>
              </div>
            ) : displayEvents.length === 0 ? (
              <div style={{ padding: "64px 24px", textAlign: "center" }}>
                <Inbox size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
                <div style={{ fontWeight: 600, color: "#475569", fontSize: "1.1rem" }}>
                  {activeTab === "active" ? "No active events" : "No past events"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "6px" }}>
                  {activeTab === "active" ? "You'll be notified when you're invited to an event." : "Completed events will appear here."}
                </div>
              </div>
            ) : (
              displayEvents.map((event: any, idx: number) => {
                const timer = getTimeLeft(event.endTime);
                const typeBadge = getTypeBadge(event.type);
                const isLast = idx === displayEvents.length - 1;
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: "24px",
                      borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      transition: "background-color 0.15s",
                      cursor: "pointer"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    {/* Left accent */}
                    <div style={{
                      width: "4px", height: "56px", borderRadius: "4px", flexShrink: 0,
                      backgroundColor: timer?.ended ? "#cbd5e1" : timer?.urgent ? "#ef4444" : "#2563eb"
                    }} />

                    {/* Main Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "480px" }}>
                          {event.title || event.refId}
                        </h3>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", backgroundColor: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}`, flexShrink: 0 }}>
                          {typeBadge.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "20px", fontSize: "0.82rem", color: "#64748b", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <FileText size={13} /> {event.refId}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Package size={13} /> {event.itemsCount || 1} item{(event.itemsCount || 1) !== 1 ? "s" : ""}
                        </span>
                        {timer && (
                          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600, color: timer.ended ? "#94a3b8" : timer.urgent ? "#ef4444" : "#2563eb" }}>
                            {!timer.ended && <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: timer.urgent ? "#ef4444" : "#22c55e", animation: timer.urgent ? "pulse 1s infinite" : "pulse 2s infinite" }} />}
                            <Clock size={13} />
                            {timer.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", flexShrink: 0 }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600,
                        backgroundColor: activeTab === "history" ? "#f1f5f9" : "#dcfce7",
                        color: activeTab === "history" ? "#64748b" : "#15803d",
                        border: `1px solid ${activeTab === "history" ? "#e2e8f0" : "#86efac"}`
                      }}>
                        {activeTab === "history" ? "Closed" : "✓ Invited"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
                        style={{
                          padding: "9px 20px", backgroundColor: activeTab === "history" ? "#f8fafc" : "#1e3a8a",
                          color: activeTab === "history" ? "#475569" : "#fff",
                          border: activeTab === "history" ? "1px solid #e2e8f0" : "none",
                          borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = activeTab === "history" ? "#f1f5f9" : "#1d4ed8"; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = activeTab === "history" ? "#f8fafc" : "#1e3a8a"; }}
                      >
                        {activeTab === "history" ? "View" : "Open Event"} <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
