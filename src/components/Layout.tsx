import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Gavel, ShoppingBag, Settings as SettingsIcon, LogOut, Bell } from "lucide-react";
import "./Layout.css";

interface LayoutProps { children: React.ReactNode; }

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [vendorName, setVendorName] = React.useState("Supplier");

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("vendor");
      if (v) { const p = JSON.parse(v); if (p.name) setVendorName(p.name); }
    } catch(e) {}
  }, []);

  const navItems = [
    { name: "Dashboard", path: "/vendor", icon: LayoutDashboard },
    { name: "Events", path: "/events", icon: CalendarDays },
    { name: "Active Bids", path: "/bids", icon: Gavel },
    { name: "Purchase Orders", path: "/orders", icon: ShoppingBag },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  const pageTitles: Record<string, string> = {
    "/vendor": "Dashboard", "/dashboard": "Dashboard",
    "/events": "Sourcing Events", "/bids": "Active Bids",
    "/orders": "Purchase Orders", "/settings": "Settings & Profile",
  };
  const matchedKey = Object.keys(pageTitles).find(k => location.pathname === k || (k !== "/vendor" && location.pathname.startsWith(k)));
  const pageTitle = matchedKey ? pageTitles[matchedKey] : "Vendor Portal";

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("vendor"); localStorage.removeItem("vendor_info");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f0f4f8", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: "240px", flexShrink: 0, backgroundColor: "#1e3a8a", display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.3px" }}>VendorPortal</span>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/vendor"
              ? location.pathname === "/vendor" || location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
            return (
              <Link key={item.name} to={item.path} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "8px", textDecoration: "none", color: isActive ? "#fff" : "#93c5fd", backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent", fontWeight: isActive ? 600 : 400, fontSize: "0.9rem", transition: "all 0.2s" }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Icon size={18} /><span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#fca5a5", backgroundColor: "transparent", fontSize: "0.9rem", fontWeight: 500 }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.15)"; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: "64px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e3a8a" }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "8px", color: "#64748b", display: "flex" }}>
              <Bell size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                {vendorName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>{vendorName}</span>
            </div>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
