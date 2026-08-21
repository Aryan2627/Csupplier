import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
      if (!rawUrl.startsWith('http')) {
        rawUrl = `https://${rawUrl}`;
      }
      const baseUrl = rawUrl;
      const res = await fetch(`${baseUrl}/api/vendor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();

      if (res.ok) {
        // Save vendor and token to localStorage
        localStorage.setItem('vendor', JSON.stringify(data.vendor));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Is the portal backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel">
        <div className="login-header">
          <h1 className="text-gradient">VendorPortal</h1>
          <p className="text-secondary">Sign in to your vendor account</p>
        </div>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
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
          
          <div className="form-group">
            <label htmlFor="password">Password (Optional for Demo)</label>
            <input 
              type="password" 
              id="password" 
              className="input-field" 
              placeholder="••••••••" 
            />
          </div>
          
          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="text-secondary">
            Don't have an account? <a href="#" className="text-primary">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}
