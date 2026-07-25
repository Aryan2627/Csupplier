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

  const recentEvents = [
    { id: 1, title: 'Office Supplies Bulk Order 2026', client: 'Acme Corp', deadline: '2 days left', status: 'Invited' },
    { id: 2, title: 'Cloud Infrastructure Upgrade', client: 'TechGlobal', deadline: '5 days left', status: 'Bid Submitted' },
    { id: 3, title: 'Annual Marketing Services', client: 'Retail Giant', deadline: '1 week left', status: 'Invited' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Welcome back, Tech Corp!</h1>
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
                <h3>{stat.value}</h3>
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
            {recentEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p className="text-secondary">{event.client}</p>
                </div>
                <div className="event-meta">
                  <span className={`status-badge ${event.status === 'Invited' ? 'status-invited' : 'status-submitted'}`}>
                    {event.status}
                  </span>
                  <span className="deadline text-secondary">{event.deadline}</span>
                  <button className="icon-btn">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions glass-panel">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="btn btn-primary w-100">Update Profile</button>
            <button className="btn btn-secondary w-100">View Active Bids</button>
            <button className="btn btn-secondary w-100">Upload Certificates</button>
          </div>
        </div>
      </div>
    </div>
  );
}
