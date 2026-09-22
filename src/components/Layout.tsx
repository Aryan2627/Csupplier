import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Gavel, ShoppingBag,
  Settings as SettingsIcon, LogOut, Bell, ChevronRight,
  Sparkles, Activity, Shield
} from "lucide-react";

interface LayoutProps { children: React.ReactNode; }

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [vendorName, setVendorName] = React.useState("Supplier");
  const [vendorCompany, setVendorCompany] = React.useState("My Company");
  const [vendorStatus, setVendorStatus] = React.useState("active");
  const [notifOpen, setNotifOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("vendor");
      if (v) {
        const p = JSON.parse(v);
        if (p.name) setVendorName(p.name);
        if (p.companyName) setVendorCompany(p.companyName);
        if (p.status) setVendorStatus(p.status);
      }
    } catch (e) {}
  }, []);

  const navItems = [
    { name: "Dashboard", path: "/vendor", icon: LayoutDashboard, desc: "Overview" },
    { name: "Sourcing Events", path: "/events", icon: CalendarDays, desc: "Active RFQs" },
    { name: "My Bids", path: "/bids", icon: Gavel, desc: "Submitted" },
    { name: "Purchase Orders", path: "/orders", icon: ShoppingBag, desc: "Orders" },
    { name: "Settings", path: "/settings", icon: SettingsIcon, desc: "Profile" },
  ];

  const pageTitles: Record<string, { title: string; sub: string }> = {
    "/vendor": { title: "Dashboard", sub: "Your procurement overview" },
    "/events": { title: "Sourcing Events", sub: "Browse and respond to RFQs & Auctions" },
    "/bids": { title: "My Bids", sub: "Track your submitted bids" },
    "/orders": { title: "Purchase Orders", sub: "Manage your awarded orders" },
    "/settings": { title: "Settings & Profile", sub: "Manage your vendor account" },
  };
  const matchedKey = Object.keys(pageTitles).find(k =>
    k === "/vendor" ? location.pathname === "/vendor" || location.pathname === "/dashboard" : location.pathname.startsWith(k)
  );
  const pageInfo = matchedKey ? pageTitles[matchedKey] : { title: "Vendor Portal", sub: "" };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("vendor"); localStorage.removeItem("vendor_info");
    navigate("/login");
  };

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    active:   { bg: "rgba(16,185,129,0.1)",  text: "#10b981", dot: "#10b981" },
    pending:  { bg: "rgba(245,158,11,0.1)",  text: "#f59e0b", dot: "#f59e0b" },
    rejected: { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", dot: "#ef4444" },
  };
  const sc = statusColors[vendorStatus] || statusColors.pending;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <aside style={{
        width: "260px", flexShrink: 0,
        background: "linear-gradient(180deg, #071330 0%, #0d1f4f 60%, #071330 100%)",
        display: "flex", flexDirection: "column", height: "100vh",
        boxShadow: "4px 0 24px rgba(0,0,0,0.15)", position: "relative", zIndex: 20
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(37,99,235,0.45)"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.3px" }}>ProcGen</div>
              <div style={{ color: "rgba(148,163,184,0.7)", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Vendor Portal</div>
            </div>
          </div>
        </div>

        {/* Vendor card */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px"
          }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "1rem", flexShrink: 0
            }}>
              {vendorName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vendorName}</div>
              <div style={{ color: "rgba(148,163,184,0.7)", fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vendorCompany}</div>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0, padding: "3px 8px", borderRadius: "20px", background: sc.bg, border: `1px solid ${sc.dot}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc.dot }} />
                <span style={{ color: sc.text, fontSize: "0.62rem", fontWeight: 700, textTransform: "capitalize" }}>{vendorStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          <div style={{ color: "rgba(148,163,184,0.4)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 10px 6px" }}>Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/vendor"
              ? location.pathname === "/vendor" || location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
            return (
              <Link key={item.name} to={item.path} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px",
                borderRadius: "10px", textDecoration: "none",
                color: isActive ? "#fff" : "rgba(148,163,184,0.75)",
                background: isActive ? "rgba(37,99,235,0.25)" : "transparent",
                border: isActive ? "1px solid rgba(37,99,235,0.4)" : "1px solid transparent",
                fontWeight: isActive ? 600 : 500, fontSize: "0.875rem",
                transition: "all 0.18s ease",
                boxShadow: isActive ? "0 2px 12px rgba(37,99,235,0.2)" : "none"
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; } }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)",
                  flexShrink: 0
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem" }}>{item.name}</div>
                  <div style={{ fontSize: "0.68rem", color: isActive ? "rgba(147,197,253,0.8)" : "rgba(100,116,139,0.7)", marginTop: "1px" }}>{item.desc}</div>
                </div>
                {isActive && <ChevronRight size={14} style={{ flexShrink: 0, color: "#60a5fa" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={14} color="#60a5fa" />
              <span style={{ color: "#60a5fa", fontSize: "0.75rem", fontWeight: 600 }}>Secure & Encrypted</span>
            </div>
            <p style={{ color: "rgba(148,163,184,0.6)", fontSize: "0.68rem", margin: "4px 0 0 22px" }}>All data end-to-end protected</p>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "11px 12px", borderRadius: "10px", border: "1px solid transparent",
            cursor: "pointer", color: "#fca5a5", background: "transparent",
            fontSize: "0.85rem", fontWeight: 500, transition: "all 0.18s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
          >
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: "64px", background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", flexShrink: 0,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>{pageInfo.title}</div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>{pageInfo.sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* AI badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 12px", borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.08))",
              border: "1px solid rgba(37,99,235,0.15)"
            }}>
              <Sparkles size={13} color="#2563eb" />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#2563eb" }}>AI-Powered</span>
            </div>
            {/* Activity */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 12px", borderRadius: "20px",
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)"
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#10b981" }}>Live</span>
            </div>
            {/* Bell */}
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{ background: "none", border: "1px solid #e2e8f0", cursor: "pointer", padding: "8px", borderRadius: "10px", color: "#64748b", display: "flex", position: "relative", transition: "all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#2563eb"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#64748b"; }}
            >
              <Bell size={18} />
              <div style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />
            </button>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "12px", borderLeft: "1px solid #e2e8f0" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: "0.85rem"
              }}>
                {vendorName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>{vendorName}</span>
                <span style={{ color: "#94a3b8", fontSize: "0.68rem" }}>{vendorCompany}</span>
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc" }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
