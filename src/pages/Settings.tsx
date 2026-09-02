import React, { useEffect, useState } from "react";
import { Building, ShieldCheck, Mail, Phone, MapPin, Briefcase, Tag, CheckCircle2 } from "lucide-react";

export function Settings() {
  const [vendor, setVendor] = useState<any>(null);
  useEffect(() => {
    const v = localStorage.getItem("vendor");
    if (v) setVendor(JSON.parse(v)); else window.location.href = "/login";
  }, []);
  if (!vendor) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b" }}>Loading...</div>;

  const tags = (() => { try { return JSON.parse(vendor.tags || "[]"); } catch { return []; } })();
  const statusColor = (s: string) => s === "Active" ? { bg: "#dcfce7", color: "#15803d" } : s?.includes("Pending") ? { bg: "#fef3c7", color: "#b45309" } : { bg: "#f1f5f9", color: "#475569" };
  const sc = statusColor(vendor.status);

  const field = (label: string, icon: any, value: string, disabled = true, type = "text") => (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
        {icon}{label}
      </label>
      <input type={type} defaultValue={value || ""} disabled={disabled} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: disabled ? "#f8fafc" : "#fff", color: disabled ? "#64748b" : "#0f172a", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" as const }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ backgroundColor: "#1e3a8a", padding: "32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#fff" }}>Profile & Settings</h1>
          <p style={{ margin: "6px 0 0 0", color: "#bfdbfe", fontSize: "0.95rem" }}>View and manage your company profile and account details.</p>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px", display: "flex", gap: "24px", flexWrap: "wrap" as const, alignItems: "flex-start" }}>
        {/* Left: Form */}
        <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column" as const, gap: "24px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building size={18} color="#2563eb" /> Company Information
              </h2>
            </div>
            <div style={{ padding: "28px", display: "flex", flexDirection: "column" as const, gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {field("Company Name", <Building size={14} />, vendor.name)}
                {field("Vendor Code", <ShieldCheck size={14} />, vendor.vendorCode)}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={18} color="#2563eb" /> Contact Details
              </h2>
            </div>
            <div style={{ padding: "28px", display: "flex", flexDirection: "column" as const, gap: "20px" }}>
              {field("Email Address", <Mail size={14} />, vendor.email, true, "email")}
              {field("Phone Number", <Phone size={14} />, vendor.phone, true, "tel")}
              {field("City / Location", <MapPin size={14} />, vendor.city || "")}
              <button style={{ marginTop: "8px", padding: "12px 28px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" as const }}>
                <CheckCircle2 size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column" as const, gap: "20px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Briefcase size={18} color="#2563eb" /> Business Profile
              </h2>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column" as const, gap: "16px" }}>
              {[
                { label: "Vendor Type", value: vendor.type || "Standard Vendor" },
                { label: "Status", value: vendor.status, badge: sc },
                { label: "Trade License", value: vendor.tradeLicense || "Not Provided" },
                { label: "Tax ID (VAT)", value: vendor.taxId || "Not Provided" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>{row.label}</span>
                  {row.badge ? (
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, backgroundColor: row.badge.bg, color: row.badge.color }}>{row.value}</span>
                  ) : (
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Tag size={18} color="#2563eb" /> Supplied Categories
              </h2>
            </div>
            <div style={{ padding: "24px" }}>
              {tags.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                  {tags.map((tag: string) => (
                    <span key={tag} style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>{tag}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>No categories specified. Update your portfolio with the buyer.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
