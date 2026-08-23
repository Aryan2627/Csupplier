import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, FileText, Clock, CheckCircle2, ChevronRight, AlertCircle, FileCheck } from 'lucide-react';

export function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorInfo, setVendorInfo] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const v = localStorage.getItem('vendor');
    
    if (!t || !v) {
      navigate('/login');
      return;
    }

    try {
      const parsedVendor = JSON.parse(v);
      setVendorInfo(parsedVendor);
      
      fetch(`\${'https://cpanel-swart.vercel.app'}/api/vendor-pos?vendorName=${encodeURIComponent(parsedVendor.name)}`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
        .then(res => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('vendor');
            window.location.href = '/login';
            return;
          }
          if (!res.ok) throw new Error('Failed to fetch orders');
          return res.json();
        })
        .then(data => {
          setOrders(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } catch(err) {
      navigate('/login');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', color: '#64748b' }}>
        Loading your purchase orders...
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '32px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={28} color="#3b82f6" /> Purchase Orders
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>View all approved purchase orders awarded to {vendorInfo?.name}</p>
        </div>
        <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '8px 16px', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>
          {orders.length} Total Orders
        </div>
      </div>

      {error ? (
        <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '12px' }}>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
          <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#475569' }}>No Purchase Orders Yet</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>When a buyer awards your bid, the Purchase Order will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {orders.map(order => (
            <div key={order.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.poNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: order.status === 'Draft' ? '#fef3c7' : '#ecfdf5', color: order.status === 'Draft' ? '#b45309' : '#059669', border: `1px solid ${order.status === 'Draft' ? '#fde68a' : '#a7f3d0'}` }}>
                  {order.status}
                </div>
              </div>
              
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#334155' }}>{order.title}</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <button style={{ backgroundColor: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                  View Details <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
