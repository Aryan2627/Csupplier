import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password' | 'forgot_password'>('otp');
  const [step, setStep] = useState<'request' | 'verify' | 'create_password'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const needsOnboarding = (vendor: any) => {
    if (!vendor) return true;
    const s = (vendor.status || '').toLowerCase();
    const isCompleted = s === 'active' || s === 'approved' || s === 'onboarded' || s === 'joined' || s === 'pending review' || s === 'approval pending';
    return !isCompleted;
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('vendor_token');
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('vendor_token', token);
      
      fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'me' })
      }).then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.vendor) {
            localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
            localStorage.setItem('vendor', JSON.stringify(data.vendor));
            window.location.href = needsOnboarding(data.vendor) ? '/vendor/onboarding' : '/vendor';
          } else {
            const storedV = localStorage.getItem('vendor') || localStorage.getItem('vendor_info');
            const vObj = storedV ? JSON.parse(storedV) : null;
            window.location.href = needsOnboarding(vObj) ? '/vendor/onboarding' : '/vendor';
          }
        })
        .catch(() => {
          window.location.href = '/vendor/onboarding';
        });
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
    setNeedsPasswordSetup(false);
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
        setError(data.error || 'Failed to request login code');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
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
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.vendor) {
          localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
          localStorage.setItem('vendor', JSON.stringify(data.vendor));
        }

        // If registered supplier doesn't have a password yet, prompt them to create and confirm password
        if (data.hasPassword === false || (data.vendor && data.vendor.hasPassword === false)) {
          setStep('create_password');
          setError('');
          setSuccessMsg('Email verified! Please create and confirm your password to proceed to onboarding.');
        } else {
          window.location.href = needsOnboarding(data.vendor) ? '/vendor/onboarding' : '/vendor';
        }
      } else {
        setError(data.error || 'Invalid OTP code');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password: newPassword, action: 'set_password' })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.vendor) {
          localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
          localStorage.setItem('vendor', JSON.stringify(data.vendor));
        }
        window.location.href = '/vendor/onboarding';
      } else {
        setError(data.error || 'Failed to create password');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check your confirm password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${getBaseUrl()}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'reset_password', otp, newPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Password updated successfully! You can now login with your password.');
        setLoginMethod('password');
        setStep('request');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setNeedsPasswordSetup(false);
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
        window.location.href = needsOnboarding(data.vendor) ? '/vendor/onboarding' : '/vendor';
      } else {
        if (data.needsPasswordSetup) {
          setNeedsPasswordSetup(true);
        }
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger OTP flow for a registered user wanting to create password
  const startPasswordSetup = () => {
    setLoginMethod('otp');
    setStep('request');
    setError('');
    setNeedsPasswordSetup(false);
    setSuccessMsg('Enter your registered email to receive a verification code and create your password.');
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
        
        {needsPasswordSetup && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#071330', fontSize: '0.92rem', marginBottom: '4px' }}>Create Your Password</div>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#2563eb', lineHeight: 1.4 }}>
              As a registered supplier, please verify your email via code to create and confirm your password.
            </p>
            <button 
              type="button" 
              onClick={startPasswordSetup}
              style={{ width: '100%', padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              Verify & Create Password →
            </button>
          </div>
        )}

        {successMsg && <div className="error-banner" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', marginBottom: '16px', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{successMsg}</div>}

        <div style={{ display: loginMethod === 'forgot_password' || step === 'create_password' ? 'none' : 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            type="button"
            onClick={() => { setLoginMethod('otp'); setError(''); setSuccessMsg(''); setStep('request'); setNeedsPasswordSetup(false); }}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: loginMethod === 'otp' ? '#fff' : 'transparent', color: loginMethod === 'otp' ? '#0f172a' : '#64748b', fontWeight: loginMethod === 'otp' ? 600 : 400, boxShadow: loginMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            OTP Login
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMethod('password'); setError(''); setSuccessMsg(''); setStep('request'); setNeedsPasswordSetup(false); }}
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
                  <label htmlFor="email">Registered Email or Phone</label>
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
            
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setLoginMethod('forgot_password'); setStep('request'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="primary-btn" disabled={loading || !email}>
                  {loading ? 'Sending Code...' : 'Send Login Code'}
                </button>
              </form>
            </>
          ) : step === 'verify' ? (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label htmlFor="otp" style={{textAlign: 'center'}}>Enter the 6-digit verification code</label>
                
                {previewUrl && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.85rem' }}>
                      🔗 View Code (Dev Mode)
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
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button type="button" onClick={() => setStep('request')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  ← Back to Email/Phone
                </button>
              </div>
            </form>
          ) : (
            /* create_password step for registered users */
            <form onSubmit={handleCreatePassword}>
              <h3 style={{ textAlign: 'center', marginBottom: '6px', fontSize: '1.2rem', color: '#0f172a' }}>
                Create Your Password
              </h3>
              <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                As a registered supplier, create and confirm your password for <strong>{email}</strong> to proceed to the onboarding form.
              </p>

              <div className="form-group">
                <label htmlFor="create-new-password">Create Password</label>
                <input 
                  type="password" 
                  id="create-new-password" 
                  className="minimal-input" 
                  placeholder="At least 6 characters" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label htmlFor="create-confirm-password">Confirm Password</label>
                <input 
                  type="password" 
                  id="create-confirm-password" 
                  className="minimal-input" 
                  placeholder="Re-enter your password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>

              <button 
                type="submit" 
                className="primary-btn" 
                disabled={loading || !newPassword || !confirmPassword || newPassword.length < 6}
                style={{ marginTop: '24px' }}
              >
                {loading ? 'Saving...' : 'Save Password & Continue to Onboarding →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => { setStep('request'); setError(''); setSuccessMsg(''); }} 
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )
        ) : loginMethod === 'forgot_password' ? (
          step === 'request' ? (
            <form onSubmit={handleRequestOTP}>
              <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '1.2rem', color: '#0f172a' }}>Reset Password</h3>
              <p style={{ textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem', color: '#64748b' }}>Enter your registered email to receive a password reset code.</p>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <input 
                  type="email" 
                  id="reset-email" 
                  className="minimal-input" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="primary-btn" disabled={loading || !email}>
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button type="button" onClick={() => { setLoginMethod('password'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '1.2rem', color: '#0f172a' }}>Create New Password</h3>
              <div className="form-group">
                <label htmlFor="reset-otp" style={{textAlign: 'center'}}>Enter the 6-digit code</label>
                <input 
                  type="text" 
                  id="reset-otp" 
                  className="minimal-input" 
                  placeholder="000000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                  maxLength={6}
                  required 
                />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="new-password">New Password</label>
                <input 
                  type="password" 
                  id="new-password" 
                  className="minimal-input" 
                  placeholder="Enter new password (min. 6 characters)" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
              <div className="form-group" style={{ marginTop: '14px' }}>
                <label htmlFor="reset-confirm-password">Confirm Password</label>
                <input 
                  type="password" 
                  id="reset-confirm-password" 
                  className="minimal-input" 
                  placeholder="Re-enter new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
              <button type="submit" className="primary-btn" disabled={loading || otp.length < 4 || !newPassword || !confirmPassword || newPassword.length < 6} style={{ marginTop: '24px' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button type="button" onClick={() => setStep('request')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Back to Email
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label htmlFor="password-email">Registered Email</label>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setLoginMethod('forgot_password'); setStep('request'); setError(''); setSuccessMsg(''); }} 
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                >
                  Forgot?
                </button>
              </div>
              <input 
                type="password" 
                id="password" 
                className="minimal-input" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="primary-btn" disabled={loading || !email || !password} style={{ marginTop: '24px' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <button 
                type="button" 
                onClick={startPasswordSetup} 
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}
              >
                Registered supplier signing in for the first time? Create password →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
