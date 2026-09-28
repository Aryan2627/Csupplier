import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Paperclip, FileText, User } from "lucide-react";

interface Message {
  id: string;
  sender: 'me' | 'client';
  text: string;
  timestamp: string;
  isFile?: boolean;
}

export function Messages() {
  const [events, setEvents] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [vendor, setVendor] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const v = localStorage.getItem("vendor");
    const token = localStorage.getItem("token");
    if (v && token) {
      const parsedVendor = JSON.parse(v);
      setVendor(parsedVendor);
      
      // Fetch events the vendor is participating in
      fetch("https://cpanel-swart.vercel.app/api/vendor-events", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to load events");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setEvents(data);
            if (data.length > 0) setActiveEvent(data[0]);
          }
        })
        .catch(err => console.error(err));
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (!activeEvent || !vendor) return;
    
    // Simulate loading messages per event from local storage (or default mock)
    const loadMessages = () => {
      const storageKey = `chat_${vendor.name}_${activeEvent.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch { }
      } else {
        const defaultMessages: Message[] = [
          { id: '1', sender: 'client', text: `Hello ${vendor.name}, regarding the ${activeEvent.title} event.`, timestamp: '09:00 AM' },
          { id: '2', sender: 'me', text: 'Hi! Yes, we have reviewed the RFQ details.', timestamp: '09:15 AM' }
        ];
        setMessages(defaultMessages);
        localStorage.setItem(storageKey, JSON.stringify(defaultMessages));
      }
    };
    loadMessages();
  }, [activeEvent, vendor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeEvent || !vendor) return;
    const msg: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...messages, msg];
    setMessages(updated);
    setNewMessage('');
    localStorage.setItem(`chat_${vendor.name}_${activeEvent.id}`, JSON.stringify(updated));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeEvent && vendor) {
      const msg: Message = {
        id: Date.now().toString(),
        sender: 'me',
        text: e.target.files[0].name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFile: true
      };
      const updated = [...messages, msg];
      setMessages(updated);
      localStorage.setItem(`chat_${vendor.name}_${activeEvent.id}`, JSON.stringify(updated));
    }
  };

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", backgroundColor: "#fff", margin: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
      
      {/* Left Sidebar - Events List */}
      <div style={{ width: "320px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Event Messages</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0" }}>Select an event to chat with the client</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {events.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
              No active events found.
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id}
                onClick={() => setActiveEvent(event)}
                style={{ 
                  padding: "16px 20px", 
                  borderBottom: "1px solid #f1f5f9", 
                  cursor: "pointer",
                  backgroundColor: activeEvent?.id === event.id ? "#fff" : "transparent",
                  borderLeft: activeEvent?.id === event.id ? "3px solid #2563eb" : "3px solid transparent",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontWeight: 600, color: activeEvent?.id === event.id ? "#0f172a" : "#475569", fontSize: "0.9rem", marginBottom: "4px" }}>
                  {event.title || event.refId}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Client: {event.organization?.name || event.account || "ProcGen Org"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeEvent ? (
          <>
            {/* Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#fff" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{activeEvent.organization?.name || activeEvent.account || "ProcGen Client"}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Event: {activeEvent.title} ({activeEvent.refId})</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#f8fafc" }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === 'me' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: "70%", 
                    padding: "12px 16px", 
                    borderRadius: msg.sender === 'me' ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                    backgroundColor: msg.sender === 'me' ? "#2563eb" : "#fff",
                    color: msg.sender === 'me' ? "#fff" : "#0f172a",
                    border: msg.sender === 'me' ? "none" : "1px solid #e2e8f0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    {msg.isFile && <FileText size={16} color={msg.sender === 'me' ? 'rgba(255,255,255,0.8)' : '#64748b'} />}
                    {msg.text}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#94a3b8" }}>{msg.timestamp}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "8px 8px 8px 16px" }}>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
                <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message to the client..."
                  style={{ flex: 1, border: "none", outline: "none", backgroundColor: "transparent", fontSize: "0.9rem", color: "#0f172a" }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  style={{ 
                    width: "40px", height: "40px", borderRadius: "10px", border: "none",
                    backgroundColor: newMessage.trim() ? "#2563eb" : "#e2e8f0",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: newMessage.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.2s"
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", backgroundColor: "#f8fafc" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={32} color="#cbd5e1" />
            </div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>Your Messages</div>
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Select an event to view messages with the client.</div>
          </div>
        )}
      </div>
    </div>
  );
}
