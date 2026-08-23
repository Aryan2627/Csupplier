import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Filter } from 'lucide-react';
import './Dashboard.css';

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const v = localStorage.getItem('vendor');
    const token = localStorage.getItem('token');
    
    if (v && token) {
      const parsedVendor = JSON.parse(v);
      setVendor(parsedVendor);
      
      fetch(`https://cpanel-swart.vercel.app/api/vendor-events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async res => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('vendor');
            window.location.href = '/login';
            return;
          }
          if (!res.ok) {
            setErrorMsg(`Backend returned ${res.status} ${res.statusText}`);
            return [];
          }
          
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
          } else {
            const text = await res.text();
            throw new Error(`API URL misconfigured. Received HTML instead of JSON. Check VITE_API_URL environment variable on Vercel.`);
          }
        })
        .then(data => {
          if (Array.isArray(data)) {
            setEvents(data);
          } else if (data && data.error) {
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

  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeLeft = (endTime: string) => {
    if (!endTime) return 'No Time Limit';
    const difference = new Date(endTime).getTime() - now;
    if (difference <= 0) return 'Event Ended';
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s remaining`;
    return `${minutes}m ${seconds}s remaining`;
  };

  if (!vendor) return <div>Loading...</div>;

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Sourcing Events</h1>
        <p className="text-secondary">View and participate in events you've been invited to.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
        <button 
          onClick={() => setActiveTab('active')} 
          style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: activeTab === 'active' ? '#4f46e5' : '#64748b', borderBottom: activeTab === 'active' ? '2px solid #4f46e5' : '2px solid transparent', transition: 'all 0.2s' }}
        >
          Active Events
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: activeTab === 'history' ? '#4f46e5' : '#64748b', borderBottom: activeTab === 'history' ? '2px solid #4f46e5' : '2px solid transparent', transition: 'all 0.2s' }}
        >
          History
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search by event ID or title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} 
              />
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
          ) : (() => {
            const activeEvents = events.filter(e => !e.endTime || new Date(e.endTime).getTime() > now);
            const historyEvents = events.filter(e => e.endTime && new Date(e.endTime).getTime() <= now);
            let displayEvents = activeTab === 'active' ? activeEvents : historyEvents;

            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase().trim();
              displayEvents = displayEvents.filter(e => 
                (e.refId && e.refId.toLowerCase().includes(query)) ||
                (e.title && e.title.toLowerCase().includes(query))
              );
            }

            if (displayEvents.length === 0) {
              return (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <p>{activeTab === 'active' ? "You have no active events at the moment." : "You have no past events in your history."}</p>
                </div>
              );
            }

            return displayEvents.map((event: any) => (
              <div key={event.id} className="event-item" style={{ padding: '24px', marginBottom: '16px' }}>
                <div className="event-info">
                  <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{event.title || event.refId}</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#64748b' }}>
                    <span><strong>Ref:</strong> {event.refId}</span>
                    <span><strong>Type:</strong> {event.type}</span>
                    <span><strong>Items:</strong> {event.itemsCount}</span>
                  </div>
                  {event.endTime && (
                    <div style={{ marginTop: '12px', color: (activeTab === 'history' || getTimeLeft(event.endTime) === 'Event Ended') ? '#64748b' : '#ef4444', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeTab === 'active' && getTimeLeft(event.endTime) !== 'Event Ended' && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' }}></span>}
                      {getTimeLeft(event.endTime)}
                    </div>
                  )}
                </div>
                <div className="event-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span className="status-badge" style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: activeTab === 'history' ? '#f1f5f9' : '#e0e7ff', color: activeTab === 'history' ? '#64748b' : '#4338ca' }}>
                    {activeTab === 'history' ? 'Ended' : 'Invited'}
                  </span>
                  <button 
                    onClick={() => navigate(`/events/${event.id}`)}
                    className={activeTab === 'history' ? "btn btn-secondary" : "btn btn-primary"}
                    style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    View Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
