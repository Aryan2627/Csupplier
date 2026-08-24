import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Check for vendor_token in URL (from Google SSO callback)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('vendor_token');
    if (token) {
      localStorage.setItem('vendor_token', token);
      window.location.href = '/vendor';
    }
  }, []);

  const getBaseUrl = () => {
    let rawUrl = ('https://cpanel-swart.vercel.app').replace(/\/+$/, '');
    if (!rawUrl.startsWith('http')) {
      rawUrl = `https://${rawUrl}`;
    }
    // Change this to http://localhost:3000 if testing locally against a local Cpanel server
    return rawUrl;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'request' })
      });
      
      const data = await res.json();
      if (res.ok) {
        setStep('verify');
        if (data.previewUrl) setPreviewUrl(data.previewUrl);
      } else {
        setError(data.error || 'Failed to request OTP');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'verify', otp })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('vendor', JSON.stringify(data.vendor));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel">
        <div className="login-header">
          <h1 className="text-gradient">VendorPortal</h1>
          <p className="text-secondary">Secure Passwordless Authentication</p>
        </div>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px' }}>{error}</div>}

        {step === 'request' ? (
          <>
            <button 
              type="button" 
              onClick={() => { window.location.href = `${getBaseUrl()}/api/auth/google?source=vendor`; }}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #e2e8f0', backgroundColor: '#fff',
                color: '#0f172a', fontSize: '0.95rem', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px', marginBottom: '16px',
                transition: 'box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '500' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <form onSubmit={handleRequestOTP} className="login-form">
              <div className="form-group">
              <label htmlFor="email">Mobile Number or Email</label>
              <input 
                type="text" 
                id="email" 
                className="input-field" 
                placeholder="vendor@company.com or +1..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary login-btn" disabled={loading || !email}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
          </>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">Enter 6-digit OTP sent to {email}</label>
              
              {previewUrl && (
                <div style={{ margin: '8px 0', padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>Dev Mode:</strong> <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>View OTP Email in Ethereal</a>
                </div>
              )}

              <input 
                type="text" 
                id="otp" 
                className="input-field" 
                placeholder="· · · · · ·" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary login-btn" disabled={loading || otp.length < 4}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setStep('request')}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change Email
              </button>
            </div>
          </form>
        )}
        
        <div className="login-footer">
          <p className="text-secondary">
            Don't have an account? <a href="#" className="text-primary">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}

