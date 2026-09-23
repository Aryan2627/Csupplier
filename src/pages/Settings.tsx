import React, { useEffect, useState } from "react";
import { Building, ShieldCheck, Mail, Phone, MapPin, Briefcase, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import LocationAutocomplete from "../components/LocationAutocomplete";

export function Settings() {
  const [vendor, setVendor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    tradeLicense: "",
    taxId: "",
    type: ""
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const rawV = localStorage.getItem("vendor") || localStorage.getItem("vendor_info");
    if (rawV) {
      try {
        const v = JSON.parse(rawV);
        setVendor(v);
        setFormData({
          name: v.name || "",
          email: v.email || "",
          phone: v.phone || "",
          city: v.city || "",
          tradeLicense: v.tradeLicense || "",
          taxId: v.taxId || "",
          type: v.type || "Standard Vendor"
        });
      } catch (e) {
        setVendor({ name: "Supplier", status: "Pending Onboarding" });
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  if (!vendor) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b" }}>Loading profile...</div>;

  const tags = (() => { try { return JSON.parse(vendor.tags || "[]"); } catch { return []; } })();
  const statusColor = (s: string) => s === "Active" ? { bg: "#dcfce7", color: "#15803d" } : s?.includes("Pending") ? { bg: "#fef3c7", color: "#b45309" } : { bg: "#f1f5f9", color: "#475569" };
  const sc = statusColor(vendor.status || "Pending Onboarding");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const updatedVendor = {
      ...vendor,
      ...formData
    };

    localStorage.setItem("vendor", JSON.stringify(updatedVendor));
    localStorage.setItem("vendor_info", JSON.stringify(updatedVendor));
    setVendor(updatedVendor);

    try {
      const token = localStorage.getItem("token");
      await fetch("https://cpanel-swart.vercel.app/api/vendor-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      setSuccessMsg("Company profile and settings updated successfully!");
    } catch (err) {
      setSuccessMsg("Profile saved locally!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1e3a8a", padding: "32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#fff" }}>Profile & Settings</h1>
          <p style={{ margin: "6px 0 0 0", color: "#bfdbfe", fontSize: "0.95rem" }}>View and update your company details and business credentials.</p>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
        {successMsg && (
          <div style={{ marginBottom: "24px", padding: "16px 20px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", color: "#065f46", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
            <CheckCircle2 size={20} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ marginBottom: "24px", padding: "16px 20px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
            <AlertCircle size={20} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Left: Form */}
          <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Company Info */}
            <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building size={18} color="#2563eb" /> Company Information
                </h2>
              </div>
              <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Company Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Vendor Code (System ID)</label>
                    <input type="text" value={vendor.vendorCode || "Auto-Generated"} disabled style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail size={18} color="#2563eb" /> Contact & Credentials
                </h2>
              </div>
              <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>City / Location</label>
                  <LocationAutocomplete value={formData.city} onChange={(val) => setFormData({ ...formData, city: val })} placeholder="Search city or location..." style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Trade License Number</label>
                    <input type="text" value={formData.tradeLicense} onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })} placeholder="License #" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tax ID / VAT</label>
                    <input type="text" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} placeholder="Tax ID #" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }} />
                  </div>
                </div>

                <button type="submit" disabled={saving} style={{ marginTop: "12px", padding: "12px 28px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start", opacity: saving ? 0.7 : 1, transition: "all 0.2s" }}>
                  <CheckCircle2 size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Info Cards */}
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Briefcase size={18} color="#2563eb" /> Business Profile
                </h2>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Vendor Type", value: formData.type || "Standard Vendor" },
                  { label: "Status", value: vendor.status || "Pending Onboarding", badge: sc },
                  { label: "Trade License", value: formData.tradeLicense || "Not Provided" },
                  { label: "Tax ID (VAT)", value: formData.taxId || "Not Provided" },
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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {tags.map((tag: string) => (
                      <span key={tag} style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>{tag}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>No categories specified yet. Complete onboarding profile to add categories.</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
