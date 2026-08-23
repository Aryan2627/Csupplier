import React from 'react';
import { Briefcase, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import './Dashboard.css';

export function Dashboard() {
  const stats = [
    { label: 'Active Invitations', value: '4', icon: Briefcase, color: 'text-primary' },
    { label: 'Pending Bids', value: '2', icon: Clock, color: 'text-warning' },
    { label: 'Won Contracts', value: '12', icon: CheckCircle, color: 'text-success' },
    { label: 'Win Rate', value: '68%', icon: TrendingUp, color: 'text-primary' },
  ];

  const [recentEvents, setRecentEvents] = React.useState<any[]>([]);
  const [vendor, setVendor] = React.useState<any>(null);
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  React.useEffect(() => {
    const v = localStorage.getItem('vendor');
    const token = localStorage.getItem('token');
    
    if (v && token) {
      const parsedVendor = JSON.parse(v);
      setVendor(parsedVendor);
      
      fetch(`\${'https://cpanel-swart.vercel.app'}/api/vendor-events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            setErrorMsg(`Backend returned ${res.status}`);
            return [];
          }
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setRecentEvents(data);
          } else if (data.error) {
            setErrorMsg(data.error);
          }
        })
        .catch(err => {
          console.error(err);
          setErrorMsg(`Network or CORS error`);
        });
    } else {
      window.location.href = '/login';
    }
  }, []);

  if (!vendor) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Welcome back, {vendor.name}!</h1>
        <p className="text-secondary">Here's an overview of your bidding activity.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card glass-panel">
              <div className="stat-icon-wrapper">
                <Icon className={stat.color} size={24} />
              </div>
              <div className="stat-details">
                <h3>{stat.label === 'Active Invitations' ? recentEvents.length : stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="recent-events glass-panel">
          <div className="panel-header">
            <h2>Recent Events</h2>
            <button className="btn btn-secondary">View All</button>
          </div>
          
          <div className="event-list">
            {errorMsg ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '8px' }}>Error: {errorMsg}</div>
            ) : recentEvents.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No events found for your account.</div>
            ) : (
              recentEvents.map((event: any) => (
                <div key={event.id} className="event-item">
                  <div className="event-info">
                    <h4>{event.title || event.refId}</h4>
                    <p className="text-secondary">{event.account || 'Internal'}</p>
                  </div>
                  <div className="event-meta">
                    <span className={`status-badge status-invited`}>
                      Invited
                    </span>
                    <span className="deadline text-secondary">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                    <button className="icon-btn">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="quick-actions glass-panel">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="btn btn-primary w-100" onClick={() => window.location.href = '/settings'}>Update Profile</button>
            <button className="btn btn-secondary w-100" onClick={() => window.location.href = '/bids'}>View Active Bids</button>
            <button className="btn btn-secondary w-100">Upload Certificates</button>
          </div>
        </div>
      </div>
    </div>
  );
}
