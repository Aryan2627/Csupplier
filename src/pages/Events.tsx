import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Filter } from 'lucide-react';
import './Dashboard.css';

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const v = localStorage.getItem('vendor');
    const token = localStorage.getItem('token');
    
    if (v && token) {
      const parsedVendor = JSON.parse(v);
      setVendor(parsedVendor);
      
      fetch(`http://localhost:3000/api/vendor-events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            setErrorMsg(`Backend returned ${res.status} ${res.statusText}`);
            return [];
          }
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setEvents(data);
          } else if (data.error) {
            setErrorMsg(data.error);
          }
        })
        .catch(err => {
          console.error(err);
          setErrorMsg(`Network or CORS error: ${err.message}`);
        });
    } else {
      window.location.href = '/login';
    }
  }, []);

  if (!vendor) return <div>Loading...</div>;

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Active Events</h1>
        <p className="text-secondary">View and participate in events you've been invited to.</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input type="text" placeholder="Search events..." style={{ padding: '8px 12px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
            </div>
            <button className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        <div className="event-list">
          {errorMsg ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
              <p><strong>Error fetching events:</strong> {errorMsg}</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <p>You haven't been invited to any events yet.</p>
            </div>
          ) : (
            events.map((event: any) => (
              <div key={event.id} className="event-item" style={{ padding: '24px', marginBottom: '16px' }}>
                <div className="event-info">
                  <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{event.title || event.refId}</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#64748b' }}>
                    <span><strong>Ref:</strong> {event.refId}</span>
                    <span><strong>Type:</strong> {event.type}</span>
                    <span><strong>Items:</strong> {event.itemsCount}</span>
                  </div>
                </div>
                <div className="event-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span className="status-badge status-invited" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    Invited
                  </span>
                  <button 
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="btn btn-primary" 
                    style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    View Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
