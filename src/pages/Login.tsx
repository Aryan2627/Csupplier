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
          <form onSubmit={handleRequestOTP} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                className="input-field" 
                placeholder="vendor@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary login-btn" disabled={loading || !email}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
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
