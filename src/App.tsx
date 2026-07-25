import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

// Dummy components for now
const Events = () => <div className="glass-panel" style={{ padding: '2rem', height: '100%' }}><h1>Events Listing (Coming Soon)</h1></div>;
const Bids = () => <div className="glass-panel" style={{ padding: '2rem', height: '100%' }}><h1>Active Bids (Coming Soon)</h1></div>;
const Settings = () => <div className="glass-panel" style={{ padding: '2rem', height: '100%' }}><h1>Settings</h1></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/events" element={<Layout><Events /></Layout>} />
        <Route path="/bids" element={<Layout><Bids /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
