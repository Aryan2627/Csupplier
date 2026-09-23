import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


export function Onboarding() {
  const navigate = useNavigate();
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyCode: '', tradeLicense: '', taxId: '', city: '', phone: '', type: '',
    entityType: '', registeredAddress: '', contactPerson: '', pan: '', gstin: '', cin: '', msme: '',
    productsOffered: '', productCategory: '', bankAccountName: '', bankAccountNumber: '', bankIfsc: '',
    companyProfile: '', certifications: '', previousExperience: '',
    panDoc: '', gstDoc: '', incDoc: '', bankDoc: '', licenseDoc: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const rawVInfo = localStorage.getItem('vendor_info');
    const rawV = localStorage.getItem('vendor');
    const token = localStorage.getItem('token');
    
    let parsed: any = null;
    if (rawVInfo) {
      try { parsed = JSON.parse(rawVInfo); } catch (e) {}
    }
    if (!parsed && rawV) {
      try { parsed = JSON.parse(rawV); } catch (e) {}
    }

    if (parsed) {
      setVendorInfo(parsed);
      setFormData(prev => ({ ...prev, phone: parsed.phone || '', city: parsed.city || '', type: parsed.type || '' }));
    }

    // Fallback: If vendor info is missing or incomplete, fetch from backend API
    if (token) {
      fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'me' })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.vendor) {
            setVendorInfo(data.vendor);
            localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
            localStorage.setItem('vendor', JSON.stringify(data.vendor));
            setFormData(prev => ({ ...prev, phone: data.vendor.phone || '', city: data.vendor.city || '', type: data.vendor.type || '' }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getBaseUrl = () => {
    let rawUrl = ('https://cpanel-swart.vercel.app').replace(/\/+$/, '');
    if (!rawUrl.startsWith('http')) {
      rawUrl = 'https://' + rawUrl;
    }
    return rawUrl;
  };

  
  const validateForm = () => {
    if (!formData.entityType) {
      return "Please select a Business/Entity Type.";
    }
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan.trim())) {
      return "Invalid PAN format. Must be 5 Letters, 4 Digits, 1 Letter (e.g., ABCDE1234F).";
    }
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstin.trim())) {
      return "Invalid GSTIN format. Must be a valid 15-character GST number (e.g. 22AAAAA0000A1Z5).";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo(0, 0);
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Your session has expired. Please log in again.');
        window.scrollTo(0, 0);
        setLoading(false);
        return;
      }
      
      const payload = {
        ...formData,
        documents: {
          pan: formData.panDoc,
          gst: formData.gstDoc,
          incorporation: formData.incDoc,
          bank: formData.bankDoc,
          licenses: formData.licenseDoc
        }
      };

      const res = await fetch(`${getBaseUrl()}/api/vendor-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const finalVendor = (data && data.vendor) ? { ...data.vendor, status: 'Onboarded' } : { ...(vendorInfo || {}), ...formData, status: 'Onboarded' };
        localStorage.setItem('vendor_info', JSON.stringify(finalVendor));
        localStorage.setItem('vendor', JSON.stringify(finalVendor));
        setVendorInfo(finalVendor);
        setSuccess(true);
      } else {
        const errData = await res.json().catch(() => null);
        const errMsg = (errData && errData.error) ? errData.error : 'Failed to submit onboarding form. Please try again.';
        if (res.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (res.status === 410) {
          localStorage.removeItem('token');
          localStorage.removeItem('vendor');
          localStorage.removeItem('vendor_info');
          setError('Your 15-day onboarding validity period has expired and your registration has been cleared. Please ask your buyer to send a new invitation.');
        } else {
          setError(errMsg);
        }
        window.scrollTo(0, 0);
      }
    } catch (err) {
      setError('Network error. Please check your internet connection and try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!vendorInfo?.createdAt) return 15;
    const createdMs = new Date(vendorInfo.createdAt).getTime();
    const elapsedDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(15 - elapsedDays));
  };

  const daysRemaining = getDaysRemaining();

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginTop: '32px', marginBottom: '16px' }}>
      {title}
    </h3>
  );

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Vendor Registration & Onboarding</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Please complete your full profile to proceed with the procurement process.</p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

        {/* 15-Day Registration Validity Notice */}
        {!(success || vendorInfo?.status === 'Approval Pending' || vendorInfo?.status === 'Pending Review' || vendorInfo?.status === 'Onboarded' || vendorInfo?.status === 'Joined') && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: daysRemaining <= 3 ? '#fff1f2' : '#f0fdf4',
            border: `1px solid ${daysRemaining <= 3 ? '#fecdd3' : '#bbf7d0'}`,
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>⏳</span>
              <div>
                <strong style={{ color: daysRemaining <= 3 ? '#be123c' : '#166534' }}>
                  15-Day Registration Validity:
                </strong>
                <span style={{ color: daysRemaining <= 3 ? '#9f1239' : '#15803d', marginLeft: '6px' }}>
                  You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining to complete and submit your onboarding application. Incomplete registrations expire after 15 days.
                </span>
              </div>
            </div>
            <div style={{
              backgroundColor: daysRemaining <= 3 ? '#fda4af' : '#86efac',
              color: daysRemaining <= 3 ? '#881337' : '#14532d',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}>
              {daysRemaining} days left
            </div>
          </div>
        )}
        
        {success || vendorInfo?.status === 'Approval Pending' || vendorInfo?.status === 'Pending Review' || vendorInfo?.status === 'Onboarded' || vendorInfo?.status === 'Joined' ? (
          <div style={{ padding: '36px', backgroundColor: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#065f46', marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700 }}>Onboarding Profile Completed!</h2>
            <p style={{ color: '#047857', fontSize: '0.95rem', marginBottom: '24px' }}>Your detailed profile and company information have been saved and verified.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/vendor')} style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Go to Vendor Dashboard →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. Basic Company Info */}
            <SectionTitle title="1. Basic Company Information" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Company Name</label>
                <input type="text" value={vendorInfo?.name || ''} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Business/Entity Type</label>
                <select name="entityType" value={formData.entityType} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">Select Entity Type</option>
                  <option value="Pvt Ltd">Pvt Ltd</option>
                  <option value="LLP">LLP</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Public Ltd">Public Ltd</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Registered Address</label>
              <textarea name="registeredAddress" value={formData.registeredAddress} onChange={handleChange} required rows={2} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>City / Location</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Vendor Type Role</label>
                <select name="type" value={formData.type} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">Select Role</option>
                  <option value="Supplier">Supplier (Goods)</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>
            </div>

            {/* 2. Contact Details */}
            <SectionTitle title="2. Contact Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Contact Person</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Mobile Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Email Address</label>
                <input type="email" value={vendorInfo?.email || ''} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }} />
              </div>
            </div>

            {/* 3. Tax & Registration */}
            <SectionTitle title="3. Tax & Registration Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>PAN</label>
                <input type="text" name="pan" value={formData.pan} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>GSTIN</label>
                <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>CIN / Registration Number</label>
                <input type="text" name="cin" value={formData.cin} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>MSME / Udyam Number</label>
                <input type="text" name="msme" value={formData.msme} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Trade License Number</label>
              <input type="text" name="tradeLicense" value={formData.tradeLicense} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            {/* 4. Business Operations */}
            <SectionTitle title="4. Business Profile & Operations" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Product/Service Category</label>
                <input type="text" name="productCategory" value={formData.productCategory} onChange={handleChange} required placeholder="e.g. IT Hardware, Construction" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Certifications (ISO, BIS, etc.)</label>
                <input type="text" name="certifications" value={formData.certifications} onChange={handleChange} placeholder="Optional" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Products / Services Offered</label>
              <textarea name="productsOffered" value={formData.productsOffered} onChange={handleChange} required rows={2} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Previous Client / Business Experience</label>
              <textarea name="previousExperience" value={formData.previousExperience} onChange={handleChange} rows={2} placeholder="Briefly describe key clients or past projects" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
            </div>

            {/* 5. Bank Account Details */}
            <SectionTitle title="5. Bank Account Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Account Name</label>
                <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Account Number</label>
                <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>IFSC Code</label>
                <input type="text" name="bankIfsc" value={formData.bankIfsc} onChange={handleChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }} />
              </div>
            </div>

            {/* 6. Document Uploads */}
            <SectionTitle title="6. Required Documents (File Links / URLs)" />
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '12px' }}>Please provide secure links (e.g. Google Drive, Dropbox) to your official documents.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>PAN Card Document</label>
                <input type="url" name="panDoc" value={formData.panDoc} onChange={handleChange} required placeholder="https://..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>GST Certificate</label>
                <input type="url" name="gstDoc" value={formData.gstDoc} onChange={handleChange} required placeholder="https://..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Incorporation/Registration Cert.</label>
                <input type="url" name="incDoc" value={formData.incDoc} onChange={handleChange} required placeholder="https://..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Bank Proof (Cancelled Cheque)</label>
                <input type="url" name="bankDoc" value={formData.bankDoc} onChange={handleChange} required placeholder="https://..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <button type="submit" disabled={loading} style={{ padding: '14px 28px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'background-color 0.2s' }}>
                {loading ? 'Submitting...' : 'Submit Complete Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
