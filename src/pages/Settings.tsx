import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Building, ShieldCheck, Tag } from 'lucide-react';

export function Settings() {
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    const v = localStorage.getItem('vendor');
    if (v) {
      setVendor(JSON.parse(v));
    } else {
      window.location.href = '/login';
    }
  }, []);

  if (!vendor) return <div>Loading...</div>;

  const tags = vendor.tags ? JSON.parse(vendor.tags) : [];

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Profile Settings</h1>
        <p className="text-secondary">View and update your company profile and details.</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          
          {/* Left Column: Form */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              Company Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} /> Company Name
                </label>
                <input 
                  type="text" 
                  defaultValue={vendor.name} 
                  disabled
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Vendor Code
                </label>
                <input 
                  type="text" 
                  defaultValue={vendor.vendorCode} 
                  disabled
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b' }} 
                />
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginTop: '12px' }}>
              Contact Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={16} /> Email Address
                </label>
                <input 
                  type="email" 
                  defaultValue={vendor.email} 
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#6366f1' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={16} /> Phone Number
                </label>
                <input 
                  type="tel" 
                  defaultValue={vendor.phone} 
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#6366f1' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> City / Location
                </label>
                <input 
                  type="text" 
                  defaultValue={vendor.city || ''} 
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#6366f1' }} 
                />
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <button className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600, borderRadius: '8px' }}>
                Save Changes
              </button>
            </div>
          </div>

          {/* Right Column: Info Cards */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#6366f1" /> Business Profile
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Type:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.type || 'Standard Vendor'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ fontWeight: 600, color: '#10b981', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {vendor.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Trade License:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.tradeLicense || 'Not Provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tax ID (VAT):</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.taxId || 'Not Provided'}</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} color="#6366f1" /> Supplied Categories
              </h3>
              {tags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tags.map((tag: string) => (
                    <span key={tag} style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 500 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No categories specified. Update your deals-in portfolio with the buyer.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
