import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password' | 'forgot_password'>('otp');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
  const API_BASE = getBaseUrl();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email or phone'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: email, source: 'vendor' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');
      setSuccessMsg('OTP sent! Please check your email or SMS.');
      setTimeout(() => setStep('verify'), 1500);
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) { setError('Please enter the OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: email, otp, source: 'vendor' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      localStorage.setItem('token', data.token);
      localStorage.setItem('vendor_token', data.token);
      navigate('/vendor');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/vendor-auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      localStorage.setItem('token', data.token);
      localStorage.setItem('vendor_token', data.token);
      navigate('/vendor');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'request') {
      if (!email) { setError('Please enter your email'); return; }
      setError(''); setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/vendor-auth`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_reset', email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
        setSuccessMsg('Reset code sent! Check your email.');
        setTimeout(() => { setStep('verify'); setSuccessMsg(''); }, 1500);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    } else {
      if (!otp || !newPassword) { setError('Please enter code and new password'); return; }
      setError(''); setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/vendor-auth`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_password', email, otp, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        setSuccessMsg('Password reset successful! Please log in.');
        setTimeout(() => { setLoginMethod('password'); setStep('request'); setOtp(''); setPassword(''); setSuccessMsg(''); }, 2000);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
  };

  return (
    <div className="login-advanced-container">
      <div className="login-advanced-left">
        <div className="login-advanced-left-content">
          <div className="brand-logo" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L4 14V34L24 44L44 34V14L24 4Z" fill="#2563eb"/>
              <path d="M24 12L12 18V30L24 36L36 30V18L24 12Z" fill="#38bdf8"/>
            </svg>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>ProcGen</span>
          </div>
          
          <h1 className="login-advanced-title">Global Supplier<br />Network.</h1>
          <p className="login-advanced-subtitle">Join the world's most intelligent B2B sourcing platform. Automate compliance, participate in dynamic auctions, and win enterprise contracts.</p>
          
          <div className="login-feature-list">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="login-feature-text">
                <h3>Lightning Fast Bidding</h3>
                <p>Submit bids instantly and participate in real-time reverse auctions.</p>
              </div>
            </div>
            
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div className="login-feature-text">
                <h3>Enterprise Security</h3>
                <p>Your pricing data and compliance documents are encrypted and secure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-advanced-right">
        <div className="login-advanced-card">
          <div className="login-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2>Supplier Portal</h2>
              <span style={{ background: '#eab308', color: '#000', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>UAT</span>
            </div>
            <p>Sign in to your vendor account</p>
          </div>
          
          {error && <div className="error-banner">{error}</div>}
          {successMsg && <div className="error-banner" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{successMsg}</div>}

          <div style={{ display: loginMethod === 'forgot_password' ? 'none' : 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button 
              type="button"
              onClick={() => { setLoginMethod('otp'); setError(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: loginMethod === 'otp' ? '#fff' : 'transparent', color: loginMethod === 'otp' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'otp' ? 600 : 500, boxShadow: loginMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              OTP Login
            </button>
            <button 
              type="button"
              onClick={() => { setLoginMethod('password'); setError(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: loginMethod === 'password' ? '#fff' : 'transparent', color: loginMethod === 'password' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'password' ? 600 : 500, boxShadow: loginMethod === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
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
                    <label>Email or Phone</label>
                    <input 
                      type="text" 
                      className="minimal-input"
                      placeholder="name@company.com or +1..."
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Login Code'}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div className="form-group">
                  <label>Enter 6-digit Code</label>
                  <input 
                    type="text" 
                    className="minimal-input otp-input"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    autoFocus
                  />
                </div>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <div className="form-footer">
                  <button type="button" className="text-btn" onClick={() => { setStep('request'); setOtp(''); }}>
                    Back to email
                  </button>
                </div>
              </form>
            )
          ) : loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="minimal-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}>Password</label>
                  <button type="button" className="text-btn" style={{ fontSize: '0.8rem', padding: 0 }} onClick={() => { setLoginMethod('forgot_password'); setStep('request'); setError(''); setSuccessMsg(''); }}>Forgot Password?</button>
                </div>
                <input 
                  type="password" 
                  className="minimal-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-btn" style={{ marginTop: '8px' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
              {step === 'request' ? (
                <>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      className="minimal-input"
                      placeholder="name@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                  <div className="form-footer">
                    <button type="button" className="text-btn" onClick={() => { setLoginMethod('password'); setStep('request'); setError(''); setSuccessMsg(''); }}>
                      Back to Login
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Reset Code</label>
                    <input 
                      type="text" 
                      className="minimal-input otp-input"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      className="minimal-input"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}