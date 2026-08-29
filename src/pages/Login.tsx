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
        localStorage.setItem('vendor_token', data.token);
        localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
        window.location.href = data.vendor.status === 'Onboarding in Progress' ? '/vendor/onboarding' : '/vendor';
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
        localStorage.setItem('vendor_token', data.token);
        localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
        window.location.href = data.vendor.status === 'Onboarding in Progress' ? '/vendor/onboarding' : '/vendor';
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">Csupplier</div>
          <h2>Welcome Back</h2>
          <p>Login to manage your bids and orders</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            type="button"
            onClick={() => { setLoginMethod('otp'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: loginMethod === 'otp' ? '#fff' : 'transparent', color: loginMethod === 'otp' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'otp' ? 600 : 400, boxShadow: loginMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
          >
            OTP Login
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMethod('password'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: loginMethod === 'password' ? '#fff' : 'transparent', color: loginMethod === 'password' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'password' ? 600 : 400, boxShadow: loginMethod === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
          >
            Password (Onboarding)
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loginMethod === 'otp' ? (
          step === 'request' ? (
            <form onSubmit={handleRequestOTP} className="login-form">
              <div className="form-group">
                <label>Email or Phone</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or phone"
                  required
                />
              </div>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Login Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="form-group">
                <label>Enter Login Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                />
              </div>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              {previewUrl && (
                <div style={{ marginTop: '16px', fontSize: '12px', textAlign: 'center' }}>
                  <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>
                    [Dev Mode] View Code
                  </a>
                </div>
              )}
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="First 3 chars of email + @26"
                required
              />
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
