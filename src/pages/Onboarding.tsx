import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

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
    const v = localStorage.getItem('vendor_info');
    if (v) {
      const parsed = JSON.parse(v);
      setVendorInfo(parsed);
      setFormData(prev => ({ ...prev, phone: parsed.phone || '', city: parsed.city || '', type: parsed.type || '' }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
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
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
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

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginTop: '32px', marginBottom: '16px' }}>
      {title}
    </h3>
  );

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Vendor Registration & Onboarding</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Please complete your full profile to proceed with the procurement process. All documents and details will be verified by the buyer.</p>

        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
        
        {success || vendorInfo?.status === 'Approval Pending' ? (
          <div style={{ padding: '32px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#065f46', marginBottom: '8px' }}>Onboarding Submitted</h2>
            <p style={{ color: '#047857' }}>Your detailed profile and documents have been successfully submitted and are pending approval.</p>
          </div>
        ) : vendorInfo?.status === 'Onboarded' || vendorInfo?.status === 'Joined' ? (
          <div style={{ padding: '32px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>You are already onboarded!</h2>
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
    </Layout>
  );
}
