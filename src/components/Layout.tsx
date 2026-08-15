import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Gavel, Settings, LogOut, Bell, User, ShoppingBag } from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [vendorName, setVendorName] = React.useState('Supplier');

  React.useEffect(() => {
    try {
      const v = localStorage.getItem('vendor');
      if (v) {
        const parsed = JSON.parse(v);
        if (parsed.name) setVendorName(parsed.name);
      }
    } catch(e) {}
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: CalendarDays },
    { name: 'Active Bids', path: '/bids', icon: Gavel },
    { name: 'Purchase Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2 className="text-gradient">VendorPortal</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to="/login" className="nav-item text-secondary hover-danger">
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar glass-panel">
          <div className="topbar-search">
            <input type="text" placeholder="Search events, bids..." className="input-field" />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <div className="user-profile">
              <div className="avatar">
                <User size={20} />
              </div>
              <span className="user-name">{vendorName}</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
