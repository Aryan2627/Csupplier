import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('vendor_token');
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('vendor_token', token);
      window.location.href = '/vendor';
    }
  }, []);

  const getBaseUrl = () => {
    let rawUrl = ('https://cpanel-swart.vercel.app').replace(/\/+$/, '');
    if (!rawUrl.startsWith('http')) {
      rawUrl = 'https://' + rawUrl;
    }
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
      setError('Network error');
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
        localStorage.setItem('vendor', JSON.stringify(data.vendor));
        window.location.href = (data.vendor.status === 'Onboarding in Progress' || data.vendor.status === 'Pending Onboarding' || data.vendor.status === 'Approval Pending') ? '/vendor/onboarding' : '/vendor';
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'password_login', password })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
        localStorage.setItem('vendor', JSON.stringify(data.vendor));
        window.location.href = (data.vendor.status === 'Onboarding in Progress' || data.vendor.status === 'Pending Onboarding' || data.vendor.status === 'Approval Pending') ? '/vendor/onboarding' : '/vendor';
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-simple-container">
      <div className="login-simple-card">
        <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.webp" alt="ProcGen Logo" style={{ height: '48px', objectFit: 'contain' }} />
          <h2 style={{ display: 'none' }}>ProcGen Supplier</h2>
          <p>Sign in to your account</p>
        </div>
        
        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            type="button"
            onClick={() => { setLoginMethod('otp'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: loginMethod === 'otp' ? '#fff' : 'transparent', color: loginMethod === 'otp' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'otp' ? 600 : 400, boxShadow: loginMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            OTP Login
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMethod('password'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: loginMethod === 'password' ? '#fff' : 'transparent', color: loginMethod === 'password' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'password' ? 600 : 400, boxShadow: loginMethod === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Password
          </button>
        </div>

        {loginMethod === 'otp' ? (
          step === 'request' ? (
            <>
              <button 
                type="button" 
                className="google-btn"
                onClick={() => { window.location.href = `${getBaseUrl()}/api/auth/google?source=vendor`; }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <form onSubmit={handleRequestOTP}>
                <div className="form-group">
                  <label htmlFor="email">Email or Phone</label>
                  <input 
                    type="text" 
                    id="email" 
                    className="minimal-input" 
                    placeholder="name@company.com or +1..." 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                
                <button type="submit" className="primary-btn" disabled={loading || !email}>
                  {loading ? 'Sending...' : 'Send Login Code'}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label htmlFor="otp" style={{textAlign: 'center'}}>Enter the 6-digit code</label>
                
                {previewUrl && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.85rem' }}>
                      🔗 View OTP (Dev Mode)
                    </a>
                  </div>
                )}

                <input 
                  type="text" 
                  id="otp" 
                  className="minimal-input" 
                  placeholder="000000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                  maxLength={6}
                  required 
                />
              </div>
              
              <button type="submit" className="primary-btn" disabled={loading || otp.length < 4}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button type="button" onClick={() => setStep('request')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  ← Back to Email/Phone
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label htmlFor="password-email">Email</label>
              <input 
                type="email" 
                id="password-email" 
                className="minimal-input" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="password">Password (Onboarding)</label>
              <input 
                type="password" 
                id="password" 
                className="minimal-input" 
                placeholder="First 3 chars of email + @26" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="primary-btn" disabled={loading || !email || !password} style={{ marginTop: '24px' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
