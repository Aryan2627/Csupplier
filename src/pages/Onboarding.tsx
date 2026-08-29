import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


export function Onboarding() {
  const navigate = useNavigate();
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyCode: '',
    tradeLicense: '',
    taxId: '',
    city: '',
    phone: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem('vendor_info');
    if (v) {
      const parsed = JSON.parse(v);
      setVendorInfo(parsed);
      setFormData(prev => ({ ...prev, phone: parsed.phone || '', city: parsed.city || '', type: parsed.type || '' }));
      if (parsed.status !== 'Onboarding in Progress' && parsed.status !== 'Approval Pending') {
        // If they are already onboarded, maybe they shouldn't be here, but we will let Layout handle the tab visibility.
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getBaseUrl = () => {
    let rawUrl = ('https://cpanel-swart.vercel.app').replace(/\/+$/, '');
    if (!rawUrl.startsWith('http')) {
      rawUrl = 'https://' + rawUrl;
    }
    return rawUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('vendor_token');
      const res = await fetch(`${getBaseUrl()}/api/vendor-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Update local storage status
        if (vendorInfo) {
          const updatedInfo = { ...vendorInfo, status: 'Approval Pending' };
          localStorage.setItem('vendor_info', JSON.stringify(updatedInfo));
          setVendorInfo(updatedInfo);
        }
      } else {
        setError(data.error || 'Failed to submit onboarding form.');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Vendor Onboarding</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Please provide your company details to complete your registration profile. Once submitted, your profile will go to the buyer for approval.</p>

        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
        
        {success || vendorInfo?.status === 'Approval Pending' ? (
          <div style={{ padding: '32px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#065f46', marginBottom: '8px' }}>Onboarding Submitted</h2>
            <p style={{ color: '#047857' }}>Your details have been successfully submitted and are currently pending approval by the buyer. You will be fully onboarded once they approve it.</p>
          </div>
        ) : vendorInfo?.status === 'Onboarded' || vendorInfo?.status === 'Joined' ? (
          <div style={{ padding: '32px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>You are already onboarded!</h2>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Company Name</label>
                <input type="text" value={vendorInfo?.name || ''} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Email Address</label>
                <input type="text" value={vendorInfo?.email || ''} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Company Code / Registration No.</label>
                <input type="text" name="companyCode" value={formData.companyCode} onChange={handleChange} required placeholder="e.g. REG-12345" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Trade License Number</label>
                <input type="text" name="tradeLicense" value={formData.tradeLicense} onChange={handleChange} required placeholder="e.g. TL-98765" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Tax ID (VAT/GST)</label>
                <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} required placeholder="e.g. TX-4567" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. New York" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 234 567 890" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Vendor Type</label>
                <select name="type" value={formData.type} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">Select Type</option>
                  <option value="Supplier">Supplier (Goods)</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting...' : 'Submit Profile for Approval'}
              </button>
            </div>
          </form>
        )}
      </div>
    
  );
}
