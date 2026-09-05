import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, FileCheck, CheckCircle2, Clock, Inbox } from "lucide-react";

export function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendorInfo, setVendorInfo] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const v = localStorage.getItem("vendor");
    if (!t || !v) { navigate("/login"); return; }
    try {
      const pv = JSON.parse(v); setVendorInfo(pv);
      fetch("https://cpanel-swart.vercel.app/api/vendor-pos?vendorName=" + encodeURIComponent(pv.name), { headers: { "Authorization": "Bearer " + t } })
        .then(res => { if (res.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("vendor"); window.location.href = "/login"; return; } if (!res.ok) throw new Error("Failed to fetch orders"); return res.json(); })
        .then(data => { if (data) setOrders(data); setLoading(false); })
        .catch(err => { setError(err.message); setLoading(false); });
    } catch { navigate("/login"); }
  }, [navigate]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const t = localStorage.getItem("token");
    const res = await fetch("https://cpanel-swart.vercel.app/api/vendor-pos", { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + t }, body: JSON.stringify({ id: orderId, status: newStatus }) });
    if (res.ok) setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    else alert("Failed to update PO status");
  };

  const statusStyle = (s: string) => {
    if (s === "Approved") return { bg: "#dcfce7", color: "#15803d", border: "#86efac" };
    if (s === "Rejected") return { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
    return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ backgroundColor: "#1e3a8a", padding: "32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingBag size={28} /> Purchase Orders
            </h1>
            <p style={{ margin: "6px 0 0 0", color: "#bfdbfe", fontSize: "0.95rem" }}>
              Purchase orders awarded to {vendorInfo?.name || "your account"}.
            </p>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", padding: "10px 20px", borderRadius: "24px", fontWeight: 700, fontSize: "1rem", border: "1px solid rgba(255,255,255,0.2)" }}>
            {orders.length} Orders
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
        {loading ? (
          <div style={{ padding: "64px", textAlign: "center", color: "#94a3b8" }}>Loading purchase orders...</div>
        ) : error ? (
          <div style={{ padding: "32px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626", textAlign: "center" }}>{error}</div>
        ) : orders.length === 0 ? (
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "80px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Inbox size={56} color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#475569", fontSize: "1.2rem" }}>No Purchase Orders Yet</h3>
            <p style={{ color: "#94a3b8", margin: 0 }}>When a buyer awards your bid, the Purchase Order will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {orders.map(order => {
              const ss = statusStyle(order.status);
              return (
                <div key={order.id} style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  {/* Card Header */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileCheck size={20} color="#2563eb" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{order.poNumber}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={11} /> {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: ss.bg, color: ss.color, border: "1px solid " + ss.border }}>{order.status}</span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "20px 24px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "0.95rem", color: "#1e3a8a", fontWeight: 700, lineHeight: 1.4 }}>{order.title}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.5px", fontWeight: 600 }}>Total Amount</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16a34a" }}>
                          ${order.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approve/Reject actions */}
                  {order.status === "Pending Vendor" && (
                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "10px" }}>
                      <button onClick={() => handleUpdateStatus(order.id, "Approved")} style={{ flex: 1, padding: "11px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}>
                        <CheckCircle2 size={16} /> Approve PO
                      </button>
                      <button onClick={() => handleUpdateStatus(order.id, "Rejected")} style={{ flex: 1, padding: "11px", backgroundColor: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
